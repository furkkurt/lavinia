import { NextRequest, NextResponse } from "next/server";
import { paytrDebugLog } from "@/app/lib/paytr/debug-log";
import {
  inferPublicSiteOriginFromHeaders,
  resolvePublicSiteUrl,
} from "@/app/lib/paytr/public-site-url";

const MAX_REASON_QUERY = 900;

function siteUrlSeedFromEnv(): string {
  return (process.env["SITE_URL"] || "http://localhost:3000").replace(/\/$/, "");
}

/** Önce başlıklar (nginx); yoksa SITE_URL + başlık birleşimi — asla request.url kullanılmaz. */
function publicOriginOrNull(request: NextRequest): string | null {
  return (
    inferPublicSiteOriginFromHeaders(request) ??
    resolvePublicSiteUrl(request, siteUrlSeedFromEnv())
  );
}

function extractFailMessage(body: FormData | null, rawUrlEncoded: string | null): string {
  if (body) {
    const fm = body.get("fail_message") ?? body.get("failed_reason_msg");
    if (fm != null && String(fm).trim()) return String(fm).trim();
  }
  if (rawUrlEncoded) {
    const params = new URLSearchParams(rawUrlEncoded);
    return (params.get("fail_message") || params.get("failed_reason_msg") || "").trim();
  }
  return "";
}

/**
 * PayTR Direkt: başarısız yönlendirmede POST gövdesinde `fail_message` gelir (dev.paytr.com direkt-api 1. adım).
 * Statik sayfa bunu okuyamaz; burada yakalayıp GET ile hata sayfasına taşırız.
 */
export async function POST(request: NextRequest) {
  let failMessage = "";
  try {
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("multipart/form-data")) {
      const form = await request.formData();
      failMessage = extractFailMessage(form, null);
    } else if (ct.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      failMessage = extractFailMessage(null, text);
    } else {
      const form = await request.formData().catch(() => null);
      if (form) failMessage = extractFailMessage(form, null);
    }
  } catch {
    /* ignore */
  }

  paytrDebugLog("paytr-fail-return", {
    contentType: request.headers.get("content-type"),
    failMessageLen: failMessage.length,
    failMessagePrefix: failMessage.slice(0, 200),
    host: request.headers.get("host"),
    xForwardedHost: request.headers.get("x-forwarded-host"),
    xForwardedProto: request.headers.get("x-forwarded-proto"),
  });

  const origin = publicOriginOrNull(request);
  if (!origin) {
    return new NextResponse(
      "Odemenin siteye donusu icin SITE_URL=https://alanadiniz.com ayarlayin (0.0.0.0 kullanilamaz).",
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
  const target = new URL("/odeme/paytr-hata", origin);
  if (failMessage) {
    target.searchParams.set("reason", failMessage.slice(0, MAX_REASON_QUERY));
  }

  paytrDebugLog("paytr-fail-return.redirect", { to: target.toString() });
  return NextResponse.redirect(target, 303);
}

/** Manuel GET (tarayıcı) — doğrudan hata sayfasına */
export async function GET(request: NextRequest) {
  const origin = publicOriginOrNull(request);
  if (!origin) {
    return new NextResponse(
      "SITE_URL=https://alanadiniz.com ayarlayin.",
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
  const target = new URL("/odeme/paytr-hata", origin);
  return NextResponse.redirect(target, 307);
}
