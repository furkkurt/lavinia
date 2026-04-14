import type { NextRequest } from "next/server";

/** Tarayıcıda geçerli genel adres değil; PayTR dönüş URL'lerinde kullanılmamalı. */
function isInvalidPublicSiteHostname(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return (
    h === "" ||
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h === "0.0.0.0"
  );
}

function envHostnameIsInvalid(urlString: string): boolean {
  try {
    return isInvalidPublicSiteHostname(new URL(urlString).hostname);
  } catch {
    return true;
  }
}

/** RFC 7239 ilk proxy segmentinden host= değerini alır. */
function hostFromForwardedHeader(forwarded: string | null): string | null {
  if (!forwarded) return null;
  const first = forwarded.split(",")[0]?.trim() || "";
  const m = /(?:^|;)\s*host\s*=\s*(?:"([^"]+)"|([^;,\s]+))/i.exec(first);
  const h = (m?.[1] || m?.[2] || "").trim();
  return h || null;
}

function finalizePublicUrl(candidate: string): string | null {
  const c = candidate.replace(/\/$/, "");
  try {
    const u = new URL(c);
    if (isInvalidPublicSiteHostname(u.hostname)) return null;
    return c;
  } catch {
    return null;
  }
}

/**
 * Sadece istek başlıklarından kamu kök URL (origin) üretir.
 * request.url / nextUrl kullanılmaz — PM2 arkasında bunlar http://0.0.0.0:3000 olabiliyor.
 * PayTR POST'u nginx üzerinden geldiğinde Host / X-Forwarded-* genelde doğrudur.
 */
export function inferPublicSiteOriginFromHeaders(request: NextRequest): string | null {
  const candidates: string[] = [];
  const xfh = request.headers.get("x-forwarded-host");
  if (xfh) {
    for (const part of xfh.split(",")) {
      const t = part.trim();
      if (t) candidates.push(t);
    }
  }
  const host = request.headers.get("host")?.trim();
  if (host) candidates.push(host);
  const fwdHost = hostFromForwardedHeader(request.headers.get("forwarded"));
  if (fwdHost) candidates.push(fwdHost);

  let hostVal: string | null = null;
  for (const c of candidates) {
    const hostnameOnly = (c.split(":")[0] || c).replace(/^\[|\]$/g, "");
    if (!isInvalidPublicSiteHostname(hostnameOnly)) {
      hostVal = c;
      break;
    }
  }
  if (!hostVal) return null;

  let proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase() || "";
  if (proto !== "http" && proto !== "https") {
    if (request.headers.get("x-forwarded-ssl") === "on") {
      proto = "https";
    } else {
      // TLS nginx arkasında çoğu kurulumda X-Forwarded-Proto gelir; gelmezse üretim için https varsay.
      proto = "https";
    }
  }

  return finalizePublicUrl(`${proto}://${hostVal}`);
}

/**
 * PayTR yönlendirmeleri (merchant_ok_url / merchant_fail_url) formda gömülü gider.
 * SITE_URL localhost / 0.0.0.0 iken istekteki Host / X-Forwarded-* kullanılır.
 * request.nextUrl.protocol asla kullanılmaz (iç bind adresiyle yanlış protokol/host üretebilir).
 */
export function resolvePublicSiteUrl(
  request: NextRequest,
  siteUrlFromEnv: string
): string | null {
  const trimmed = siteUrlFromEnv.replace(/\/$/, "");

  let needsHeaderFallback = false;
  try {
    const u = new URL(trimmed);
    needsHeaderFallback = isInvalidPublicSiteHostname(u.hostname);
  } catch {
    needsHeaderFallback = true;
  }

  if (!needsHeaderFallback) {
    return finalizePublicUrl(trimmed);
  }

  const headerOrigin = inferPublicSiteOriginFromHeaders(request);
  if (headerOrigin) return headerOrigin;

  if (!envHostnameIsInvalid(trimmed)) {
    return finalizePublicUrl(trimmed);
  }

  return null;
}
