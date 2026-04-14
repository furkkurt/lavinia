/**
 * PayTR / checkout sunucu ortam değişkenleri (process.env).
 * Gizli anahtarları asla istemciye sızdırmayın; yalnızca Route Handler’larda kullanın.
 */

import { isPaytrDebugOn } from "@/app/lib/paytr/debug-log";

export type PaytrServerEnv = {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  apiUrl: string;
  testMode: boolean;
  debugOn: boolean;
  checkoutCompleteSecret: string;
  simplcommerceApiUrl: string;
  siteUrl: string;
};

function trimSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/** BOM/CRLF/trim — HMAC yanlışlığının sık nedeni. */
function sanitizePaytrSecret(value: string): string {
  return value.replace(/^\uFEFF/, "").replace(/\r/g, "").trim();
}

export function getPaytrServerEnv(): PaytrServerEnv | null {
  // Köşeli parantez: Next derlemesinde process.env.KEY sabitlenmesini önler; Docker çalışma anı env okunur.
  const merchantId = sanitizePaytrSecret(process.env["PAYTR_MERCHANT_ID"] ?? "");
  const merchantKey = sanitizePaytrSecret(process.env["PAYTR_MERCHANT_KEY"] ?? "");
  const merchantSalt = sanitizePaytrSecret(process.env["PAYTR_MERCHANT_SALT"] ?? "");
  if (!merchantId || !merchantKey || !merchantSalt) {
    return null;
  }

  // PayTR iFrame API: get-token uç noktası (/api/paytr-token).
  const apiUrl = trimSlash(
    process.env["PAYTR_API_URL"] || "https://www.paytr.com/odeme/api/get-token"
  );

  const simplcommerceApiUrl = trimSlash(
    process.env["SIMPLCOMMERCE_API_URL"] ||
      process.env["NEXT_PUBLIC_API_BASE_URL"] ||
      "http://localhost:5000"
  );

  // PayTR dönüş URL'leri: yalnızca SITE_URL (runtime). NEXT_PUBLIC_SITE_URL build'de 0.0.0.0'a
  // sabitlenebilir; PayTR route'larına ASLA dahil edilmez.
  const siteUrl = trimSlash(process.env["SITE_URL"] || "http://localhost:3000");

  return {
    merchantId,
    merchantKey,
    merchantSalt,
    apiUrl,
    testMode: process.env["PAYTR_TEST_MODE"] === "1",
    debugOn: isPaytrDebugOn(),
    checkoutCompleteSecret: process.env["CHECKOUT_COMPLETE_SECRET"] ?? "",
    simplcommerceApiUrl,
    siteUrl,
  };
}
