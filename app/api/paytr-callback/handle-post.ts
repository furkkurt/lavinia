import { NextRequest, NextResponse } from "next/server";
import { paytrDebugLog } from "@/app/lib/paytr/debug-log";
import { getPaytrServerEnv } from "@/app/lib/paytr/env";
import { computePaytrCallbackHash } from "@/app/lib/paytr/token";

function textOk(): NextResponse {
  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * PayTR iFrame / Direkt 2. adım bildirimi (POST).
 * `app/api/[[...path]]` POST bazen bu handler’a düşmeden Kestrel'e gidiyordu → bildirim 404.
 * @see https://dev.paytr.com/iframe-api/iframe-api-2-adim
 */
export async function handlePaytrCallbackPost(request: NextRequest): Promise<NextResponse> {
  const env = getPaytrServerEnv();
  if (!env || !env.checkoutCompleteSecret) {
    console.error("[paytr-callback] Eksik yapılandırma.");
    paytrDebugLog("paytr-callback.reject", {
      reason: "missing_env",
      hasCheckoutSecret: Boolean(env?.checkoutCompleteSecret),
    });
    return new NextResponse("FAIL", { status: 500 });
  }

  const ct = request.headers.get("content-type") ?? "";
  let merchantOid = "";
  let status = "";
  let totalAmount = "";
  let hash = "";
  const formKeys: string[] = [];

  if (ct.includes("application/x-www-form-urlencoded")) {
    const raw = await request.text();
    const params = new URLSearchParams(raw);
    for (const k of new Set([...params.keys()])) {
      formKeys.push(k);
    }
    merchantOid = params.get("merchant_oid") ?? "";
    status = params.get("status") ?? "";
    totalAmount = params.get("total_amount") ?? "";
    hash = params.get("hash") ?? "";
  } else {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      paytrDebugLog("paytr-callback.reject", {
        reason: "body_parse_failed",
        contentTypePrefix: ct.slice(0, 80),
      });
      return new NextResponse("BAD", { status: 400 });
    }
    formKeys.push(...new Set(form.keys()));
    merchantOid = form.get("merchant_oid")?.toString() ?? "";
    status = form.get("status")?.toString() ?? "";
    totalAmount = form.get("total_amount")?.toString() ?? "";
    hash = form.get("hash")?.toString() ?? "";
  }

  paytrDebugLog("paytr-callback.incoming", {
    keys: formKeys,
    merchantOid,
    status,
    totalAmount,
    hashPrefix: hash.slice(0, 12),
  });

  if (!merchantOid || !status || !totalAmount || !hash) {
    paytrDebugLog("paytr-callback.reject", { reason: "missing_required_field" });
    return new NextResponse("BAD", { status: 400 });
  }

  const expectedHash = computePaytrCallbackHash({
    merchantOid,
    merchantSalt: env.merchantSalt,
    status,
    totalAmount,
    merchantKey: env.merchantKey,
  });

  if (expectedHash !== hash) {
    console.error("[paytr-callback] Hash doğrulanamadı.");
    paytrDebugLog("paytr-callback.reject", {
      reason: "hash_mismatch",
      expectedPrefix: expectedHash.slice(0, 12),
      receivedPrefix: hash.slice(0, 12),
    });
    return new NextResponse("BAD HASH", { status: 400 });
  }

  if (env.debugOn) {
    console.info("[paytr-callback] total_amount=", totalAmount, "(complete-paytr kuruş tam sayı bekler)");
  }

  if (status !== "success") {
    paytrDebugLog("paytr-callback.non-success", { status, merchantOid });
    return textOk();
  }

  const n = merchantOid.replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(n)) {
    console.error("[paytr-callback] Geçersiz merchant_oid.");
    return new NextResponse("BAD OID", { status: 400 });
  }

  const routeGuid = `${n.slice(0, 8)}-${n.slice(8, 12)}-${n.slice(12, 16)}-${n.slice(16, 20)}-${n.slice(20, 32)}`;
  const apiUrl = `${env.simplcommerceApiUrl}/api/checkout/${routeGuid}/complete-paytr`;
  const completeRes = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Checkout-Complete-Secret": env.checkoutCompleteSecret,
    },
    body: JSON.stringify({
      merchantOid,
      totalAmount,
      status: "success",
    }),
  });

  if (!completeRes.ok) {
    const errText = await completeRes.text().catch(() => "");
    console.error("[paytr-callback] complete-paytr hata:", completeRes.status, errText.slice(0, 500));
    paytrDebugLog("paytr-callback.complete-paytr-error", {
      status: completeRes.status,
      bodyPrefix: errText.slice(0, 400),
      routeGuid,
    });
    return new NextResponse("FAIL", { status: 502 });
  }

  paytrDebugLog("paytr-callback.ok", { merchantOid, totalAmount });
  return textOk();
}
