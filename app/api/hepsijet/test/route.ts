import { NextRequest, NextResponse } from "next/server";
import {
  getHepsijetServerConfig,
  hepsijetConfigSummary,
  isHepsijetDevApiEnabled,
} from "@/app/lib/hepsijet/env";
import { hepsijetCreateTestRetailShipment, hepsijetGetToken, hepsijetTrack } from "@/app/lib/hepsijet/client";

function maskToken(t: string): string {
  if (t.length <= 12) return "****";
  return `${t.slice(0, 4)}…${t.slice(-4)}`;
}

function stripZplInPlace(obj: unknown, depth = 0): unknown {
  if (depth > 8) return obj;
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const o = obj as Record<string, unknown>;
    const n: Record<string, unknown> = {};
    for (const k of Object.keys(o)) {
      if (k === "zplBarcode" && typeof o[k] === "string") {
        n[k] = `(${String(o[k]).length} char ZPL data — response too large for full echo)`;
      } else {
        n[k] = stripZplInPlace(o[k], depth + 1);
      }
    }
    return n;
  }
  if (Array.isArray(obj)) {
    return obj.map((x) => stripZplInPlace(x, depth + 1));
  }
  return obj;
}

type PostBody = {
  action?: string;
  barcodes?: string[];
  /** RETAIL test gönderisinde delivery.product.barcode alanı (EAN-13 / GTIN). */
  productGtin?: string;
};

/** Durum: dev API açık mı, HepsiJET config tam mı. */
export async function GET() {
  const devApiEnabled = isHepsijetDevApiEnabled();
  const config = getHepsijetServerConfig();
  return NextResponse.json({
    ok: true,
    devApiEnabled,
    configured: !!config,
    ...(config ? hepsijetConfigSummary(config) : { baseUrl: (process.env["HEPSIJET_BASE_URL"] || "").trim() || "https://integration-apitest.hepsijet.com" }),
  });
}

export async function POST(request: NextRequest) {
  if (!isHepsijetDevApiEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error: "HepsiJET test API devre dışı. HEPSIJET_DEV_API_ENABLED=1 ile açın.",
      },
      { status: 403 }
    );
  }
  const config = getHepsijetServerConfig();
  if (!config) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "HepsiJET ortam değişkenleri eksik. HEPSIJET_USERNAME, HEPSIJET_PASSWORD, " +
          "HEPSIJET_COMPANY_*, HEPSIJET_COMPANY_ADDRESS_ID, HEPSIJET_SENDER_*, HEPSIJET_CURRENT_XDOCK gerekir.",
      },
      { status: 500 }
    );
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz JSON." }, { status: 400 });
  }
  const action = (body.action || "").trim();

  if (action === "token") {
    const { response, body: hj } = await hepsijetGetToken(config);
    const t = hj?.data?.token;
    return NextResponse.json({
      ok: response.ok && hj?.status === "OK",
      httpStatus: response.status,
      hepsijet: hj,
      tokenPreview: typeof t === "string" ? maskToken(t) : null,
    });
  }

  if (action === "track") {
    const raw = body.barcodes;
    const barcodes = (Array.isArray(raw) ? raw : [])
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean);
    if (barcodes.length === 0) {
      return NextResponse.json({ ok: false, error: "barcodes dizisi gerekli (en az 1 barkod)." }, { status: 400 });
    }
    const { response, body: hj } = await hepsijetTrack(config, barcodes);
    return NextResponse.json({ ok: response.ok, httpStatus: response.status, hepsijet: hj });
  }

  if (action === "createTestShipment") {
    const productGtin =
      typeof body.productGtin === "string" && body.productGtin.trim().length > 0
        ? body.productGtin.trim()
        : undefined;
    const { response, body: hj, tokenMeta } = await hepsijetCreateTestRetailShipment(
      config,
      productGtin ? { productGtin } : {}
    );
    const t = tokenMeta?.data?.token;
    return NextResponse.json({
      ok: response.ok && hj?.status === "OK",
      httpStatus: response.status,
      hepsijet: stripZplInPlace(hj) as object,
      tokenMetaPreview: typeof t === "string" ? maskToken(t) : null,
    });
  }

  return NextResponse.json(
    { ok: false, error: "Bilinmeyen action. token | track | createTestShipment kullanın." },
    { status: 400 }
  );
}
