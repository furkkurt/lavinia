import { NextRequest, NextResponse } from "next/server";
import { paytrDebugLog } from "@/app/lib/paytr/debug-log";
import { getPaytrServerEnv } from "@/app/lib/paytr/env";
import { resolvePublicSiteUrl } from "@/app/lib/paytr/public-site-url";
import { computePaytrIframeToken } from "@/app/lib/paytr/token";

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.slice(0, 39);
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim().slice(0, 39);
  return "127.0.0.1";
}

function forwardAuthHeaders(req: NextRequest): HeadersInit {
  const h: Record<string, string> = { Accept: "application/json" };
  const cookie = req.headers.get("cookie");
  if (cookie) h.Cookie = cookie;
  const auth = req.headers.get("authorization");
  if (auth) h.Authorization = auth;
  return h;
}

type PaytrContext = {
  merchantOid: string;
  paymentAmount: number;
  email: string;
  userName: string;
  userPhone: string;
  userAddress: string;
  userBasketBase64: string;
};

export async function POST(request: NextRequest) {
  const env = getPaytrServerEnv();
  if (!env) {
    return NextResponse.json(
      { error: "PayTR ortam degiskenleri eksik (PAYTR_MERCHANT_*)." },
      { status: 500 }
    );
  }

  let body: { checkoutId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON." }, { status: 400 });
  }

  const checkoutId = body.checkoutId?.trim();
  if (!checkoutId) {
    return NextResponse.json({ error: "checkoutId gerekli." }, { status: 400 });
  }

  const ctxRes = await fetch(
    `${env.simplcommerceApiUrl}/api/checkout/${checkoutId}/paytr-context`,
    {
      method: "GET",
      headers: forwardAuthHeaders(request),
      cache: "no-store",
    }
  );

  if (!ctxRes.ok) {
    let message = `Odeme ozeti alinamadi (${ctxRes.status})`;
    try {
      const errBody = await ctxRes.json();
      if (errBody?.error) message = errBody.error;
    } catch {
      /* ignore */
    }
    return NextResponse.json(
      { error: message },
      { status: ctxRes.status === 401 || ctxRes.status === 403 ? ctxRes.status : 400 }
    );
  }

  const ctx = (await ctxRes.json()) as PaytrContext;
  const userIp = clientIp(request);
  const testMode = env.testMode ? 1 : 0;

  paytrDebugLog("paytr-token.context", {
    checkoutId,
    merchantOid: ctx.merchantOid,
    paymentAmount: ctx.paymentAmount,
    userIp,
    testMode,
    simplcommerceApiUrl: env.simplcommerceApiUrl,
    getTokenUrl: env.apiUrl,
    debugOn: env.debugOn,
  });

  const paytrToken = computePaytrIframeToken({
    merchantId: env.merchantId,
    userIp,
    merchantOid: ctx.merchantOid,
    email: ctx.email,
    paymentAmount: ctx.paymentAmount,
    userBasketBase64: ctx.userBasketBase64,
    noInstallment: 0,
    maxInstallment: 0,
    currency: "TL",
    testMode,
    merchantSalt: env.merchantSalt,
    merchantKey: env.merchantKey,
  });

  const siteUrl = resolvePublicSiteUrl(request, env.siteUrl);
  if (!siteUrl) {
    return NextResponse.json(
      {
        error:
          "Odemenin siteye donusu icin gecerli bir adres uretilemedi. Sunucuda SITE_URL=https://alanadiniz.com " +
          "ayarlayin; 0.0.0.0 veya localhost PayTR yonlendirmesinde kullanilamaz.",
      },
      { status: 500 }
    );
  }
  const merchantOkUrl = `${siteUrl}/odeme/paytr-basarili`;
  const merchantFailUrl = `${siteUrl}/odeme/paytr-hata`;

  const form = new URLSearchParams();
  // PayTR iFrame 1. ADIM örnekleri (Node) merchant_key / merchant_salt gönderir; get-token formu ile uyumlu olsun.
  form.set("merchant_id", env.merchantId);
  form.set("merchant_key", env.merchantKey);
  form.set("merchant_salt", env.merchantSalt);
  form.set("user_ip", userIp);
  form.set("merchant_oid", ctx.merchantOid);
  form.set("email", ctx.email);
  form.set("payment_amount", String(ctx.paymentAmount));
  form.set("user_basket", ctx.userBasketBase64);
  form.set("paytr_token", paytrToken);
  form.set("user_name", ctx.userName ?? "");
  form.set("user_address", ctx.userAddress ?? "");
  form.set("user_phone", ctx.userPhone ?? "");
  form.set("merchant_ok_url", merchantOkUrl);
  form.set("merchant_fail_url", merchantFailUrl);
  form.set("no_installment", "0");
  form.set("max_installment", "0");
  form.set("currency", "TL");
  form.set("test_mode", String(testMode));
  form.set("debug_on", env.debugOn ? "1" : "0");
  form.set("timeout_limit", "30");
  form.set("lang", process.env["PAYTR_LANG"]?.trim() || "tr");

  const paytrRes = await fetch(env.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const paytrText = await paytrRes.text();
  let paytrJson: { status?: string; token?: string; reason?: string };
  try {
    paytrJson = JSON.parse(paytrText) as typeof paytrJson;
  } catch {
    return NextResponse.json(
      { error: "PayTR yaniti cozulemedi.", raw: paytrText.slice(0, 500) },
      { status: 502 }
    );
  }

  if (paytrJson.status !== "success" || !paytrJson.token) {
    paytrDebugLog("paytr-token.get-token-failed", {
      checkoutId,
      merchantOid: ctx.merchantOid,
      status: paytrJson.status,
      reason: paytrJson.reason,
      httpStatus: paytrRes.status,
    });
    return NextResponse.json(
      {
        error: paytrJson.reason || paytrJson.status || "PayTR token alinamadi.",
      },
      { status: 400 }
    );
  }

  paytrDebugLog("paytr-token.ok", {
    checkoutId,
    merchantOid: ctx.merchantOid,
    iframeTokenLen: paytrJson.token.length,
  });

  return NextResponse.json({ token: paytrJson.token });
}
