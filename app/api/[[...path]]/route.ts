import type { Readable } from "node:stream";
import { Readable as NodeReadable } from "node:stream";
import http from "node:http";
import https from "node:https";
import { NextRequest, NextResponse } from "next/server";
import { handlePaytrCallbackPost } from "@/app/api/paytr-callback/handle-post";

/** Vercel / barındırıcı limiti (sn). Self-host’da çoğu kurulumda yok sayılır; zararsız. */
export const maxDuration = 3600;

/** Varsayılan: çoğu API çağrısı. Nginx `proxy_read_timeout` bundan kısa olmamalı. */
const DEFAULT_UPSTREAM_TIMEOUT_MS = 60_000;

/**
 * Excel legacy import uzun sürebilir; 60s’de kesilirse tarayıcıda 502/504 görülür.
 * Ortam: API_PROXY_LEGACY_IMPORT_TIMEOUT_MS (ms), örn. 1800000 = 30 dk.
 */
function upstreamTimeoutMs(segments: string[] | undefined): number {
  const path = segments?.join("/") ?? "";
  if (path.includes("legacy-import")) {
    const fromEnv = process.env.API_PROXY_LEGACY_IMPORT_TIMEOUT_MS;
    if (fromEnv && /^\d+$/.test(fromEnv.trim())) {
      const n = parseInt(fromEnv.trim(), 10);
      if (n >= 60_000) return n;
    }
    return 30 * 60 * 1000;
  }
  const globalMs = process.env.API_PROXY_UPSTREAM_TIMEOUT_MS;
  if (globalMs && /^\d+$/.test(globalMs.trim())) {
    const n = parseInt(globalMs.trim(), 10);
    if (n >= 5_000) return n;
  }
  return DEFAULT_UPSTREAM_TIMEOUT_MS;
}

function sanitizeEnvUrl(raw: string | undefined, fallback: string): string {
  const s = (raw || fallback)
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .trim()
    .replace(/\/$/, "");
  if (!/^https?:\/\//i.test(s)) {
    return `http://${s}`.replace(/\/$/, "");
  }
  return s;
}

function apiOrigin(): string {
  return sanitizeEnvUrl(
    process.env["API_INTERNAL_URL"],
    "http://127.0.0.1:5000"
  );
}

function targetUrl(request: NextRequest, segments: string[] | undefined): URL {
  const rest = segments?.length ? segments.join("/") : "";
  const path = rest ? `/api/${rest}` : "/api";
  try {
    return new URL(path + request.nextUrl.search, apiOrigin());
  } catch (e) {
    throw new Error(
      `Invalid API_INTERNAL_URL / target: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

function forwardRequestHeaders(
  request: NextRequest,
  upstreamHost: string
): http.OutgoingHttpHeaders {
  const out: http.OutgoingHttpHeaders = { host: upstreamHost };
  const skip = new Set([
    "host",
    "connection",
    "keep-alive",
    "transfer-encoding",
    "proxy-connection",
    "proxy-authorization",
    "te",
    "trailer",
    "upgrade",
  ]);
  request.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (skip.has(k)) return;
    out[key] = value;
  });
  return out;
}

function toWebReadable(stream: Readable): ReadableStream<Uint8Array> {
  return NodeReadable.toWeb(stream) as ReadableStream<Uint8Array>;
}

function nodeRequest(
  target: URL,
  method: string,
  headers: http.OutgoingHttpHeaders,
  body: Buffer | undefined,
  timeoutMs: number
): Promise<{
  status: number;
  statusText: string;
  headers: Headers;
  stream: Readable;
}> {
  const isHttps = target.protocol === "https:";
  const lib = isHttps ? https : http;
  const port = target.port
    ? parseInt(target.port, 10)
    : isHttps
      ? 443
      : 80;
  const pathWithQuery = `${target.pathname}${target.search}`;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname: target.hostname,
        port,
        path: pathWithQuery,
        method,
        headers,
        timeout: timeoutMs,
      },
      (res) => {
        const outHeaders = new Headers();
        for (const [k, v] of Object.entries(res.headers)) {
          if (v === undefined) continue;
          const lk = k.toLowerCase();
          if (lk === "transfer-encoding") continue;
          const val = Array.isArray(v) ? v.join(", ") : v;
          outHeaders.append(k, val);
        }
        resolve({
          status: res.statusCode ?? 502,
          statusText: res.statusMessage ?? "",
          headers: outHeaders,
          stream: res,
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Upstream timeout (${timeoutMs}ms)`));
    });
    if (body?.length) req.write(body);
    req.end();
  });
}

async function proxy(
  request: NextRequest,
  segments: string[] | undefined,
  method: string
): Promise<NextResponse> {
  const timeoutMs = upstreamTimeoutMs(segments);
  let url: URL;
  try {
    url = targetUrl(request, segments);
  } catch (e) {
    console.error("[api-proxy] bad target URL:", e);
    return NextResponse.json(
      {
        error: "Bad Gateway",
        message: e instanceof Error ? e.message : "Invalid upstream URL",
      },
      { status: 502 }
    );
  }

  const headers = forwardRequestHeaders(request, url.host);
  if (method === "GET" || method === "HEAD") {
    delete headers["content-length"];
    delete headers["Content-Length"];
  }

  let body: Buffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    try {
      const buf = await request.arrayBuffer();
      body = buf.byteLength > 0 ? Buffer.from(buf) : undefined;
    } catch {
      body = undefined;
    }
  }

  try {
    const { status, statusText, headers: resHeaders, stream } =
      await nodeRequest(url, method, headers, body, timeoutMs);
    return new NextResponse(toWebReadable(stream), {
      status,
      statusText,
      headers: resHeaders,
    });
  } catch (err) {
    console.error("[api-proxy] upstream failed:", url.toString(), err);
    const cause = err instanceof Error && "cause" in err ? err.cause : undefined;
    const detail =
      cause instanceof Error ? cause.message : err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "Bad Gateway",
        message: detail || "Upstream unreachable",
        upstream: `${url.protocol}//${url.host}`,
      },
      { status: 502 }
    );
  }
}

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path, "GET");
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  /** PayTR bildirimi bu catch-all ile Kestrel'e gidiyorsa 404 olur; önce Lavinia handler. */
  if (path?.length === 1 && path[0] === "paytr-callback") {
    return handlePaytrCallbackPost(request);
  }
  return proxy(request, path, "POST");
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path, "PUT");
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path, "PATCH");
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path, "DELETE");
}

export async function HEAD(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path, "HEAD");
}

export async function OPTIONS(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path, "OPTIONS");
}
