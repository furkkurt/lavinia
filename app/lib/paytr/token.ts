import { createHmac } from "node:crypto";

/**
 * iFrame API 1. adım paytr_token — PHP örneği ile aynı sıra.
 * @see https://dev.paytr.com/iframe-api/iframe-api-1-adim
 */
export function computePaytrIframeToken(params: {
  merchantId: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: number;
  userBasketBase64: string;
  noInstallment: number;
  maxInstallment: number;
  currency: string;
  testMode: number;
  merchantSalt: string;
  merchantKey: string;
}): string {
  const paymentAmountStr = String(params.paymentAmount);
  const hashStr =
    params.merchantId +
    params.userIp +
    params.merchantOid +
    params.email +
    paymentAmountStr +
    params.userBasketBase64 +
    params.noInstallment +
    params.maxInstallment +
    params.currency +
    params.testMode;

  const payload = hashStr + params.merchantSalt;
  return createHmac("sha256", params.merchantKey).update(payload, "utf8").digest("base64");
}

/**
 * Direkt API 1. adım paytr_token — [PayTR Direkt 1. Adım](https://dev.paytr.com/direkt-api/direkt-api-1-adim) PHP örneği:
 * `merchant_id + user_ip + merchant_oid + email + payment_amount + payment_type + installment_count + currency + test_mode + non_3d`
 * ardından `+ merchant_salt` ile HMAC-SHA256 ve base64.
 *
 * `hashExtended`: resmî Direkt dokümanda yok (13 parça). PayTR paneli genelde reddeder.
 * Yalnızca `PAYTR_DIRECT_NONCOMPLIANT_EXTENDED_HASH=1` ile açılır (teşhis).
 *
 * `paymentAmountForHash`: genelde formdaki `payment_amount` ile aynı olmalı; `PAYTR_DIRECT_HASH_AMOUNT=tl_decimal`
 * ile yalnızca hash’te TL `F2` kullanılabilir (form kuruş kalır).
 */
export type PaytrHashSegment = { key: string; value: string };

/**
 * PayTR resmî PHP/Node örnekleri hash zincirinde tutarı `"100.99"` biçiminde birleştirir.
 * Ödeme formunda (`payment_amount`) bazı mağazalarda yalnızca kuruş tam sayı string kabul edilir;
 * bu durumda HMAC için TL (2 ondalık), POST için kuruş kullanılabilir.
 */
export function paymentAmountKurusToTlF2ForHash(kurusStr: string): string {
  const k = parseInt(String(kurusStr).trim(), 10);
  if (!Number.isFinite(k) || k < 0) {
    throw new Error(`Geçersiz kuruş payment_amount: ${kurusStr}`);
  }
  return (k / 100).toFixed(2);
}

function buildPaytrDirectPreSaltString(p: {
  merchantId: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmountForHash: string;
  paymentType: string;
  installmentCount: string;
  currency: string;
  testMode: number;
  non3d: string;
  hashExtended: boolean;
  noInstallment: string;
  maxInstallment: string;
  lang: string;
}): string {
  const testModeStr = String(p.testMode);
  let s =
    p.merchantId +
    p.userIp +
    p.merchantOid +
    p.email +
    p.paymentAmountForHash +
    p.paymentType +
    p.installmentCount +
    p.currency +
    testModeStr +
    p.non3d;
  if (p.hashExtended) {
    s += p.noInstallment + p.maxInstallment + p.lang;
  }
  return s;
}

/** PayTR panel hash aracı ile karşılaştırma için (merchant_key / merchant_salt / token yok). */
export function getPaytrDirectHashDebugSnapshot(p: {
  merchantId: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmountForHash: string;
  paymentType: string;
  installmentCount: string;
  currency: string;
  testMode: number;
  non3d: string;
  hashExtended: boolean;
  noInstallment: string;
  maxInstallment: string;
  lang: string;
}): {
  kind: "direct";
  segments: PaytrHashSegment[];
  preSaltString: string;
  utf8ByteLength: number;
} {
  const testModeStr = String(p.testMode);
  const segments: PaytrHashSegment[] = [
    { key: "merchant_id", value: p.merchantId },
    { key: "user_ip", value: p.userIp },
    { key: "merchant_oid", value: p.merchantOid },
    { key: "email", value: p.email },
    { key: "payment_amount (hash)", value: p.paymentAmountForHash },
    { key: "payment_type", value: p.paymentType },
    { key: "installment_count", value: p.installmentCount },
    { key: "currency", value: p.currency },
    { key: "test_mode", value: testModeStr },
    { key: "non_3d", value: p.non3d },
  ];
  if (p.hashExtended) {
    segments.push(
      { key: "no_installment (hash suffix)", value: p.noInstallment },
      { key: "max_installment (hash suffix)", value: p.maxInstallment },
      { key: "lang (hash suffix)", value: p.lang }
    );
  }
  const preSaltString = buildPaytrDirectPreSaltString(p);
  return {
    kind: "direct",
    segments,
    preSaltString,
    utf8ByteLength: Buffer.byteLength(preSaltString, "utf8"),
  };
}

export function computePaytrDirectToken(params: {
  merchantId: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmountForHash: string;
  paymentType: string;
  installmentCount: string;
  currency: string;
  testMode: number;
  non3d: string;
  hashExtended: boolean;
  noInstallment: string;
  maxInstallment: string;
  lang: string;
  merchantSalt: string;
  merchantKey: string;
}): string {
  const hashStr = buildPaytrDirectPreSaltString(params);
  const payload = hashStr + params.merchantSalt;
  return createHmac("sha256", params.merchantKey).update(payload, "utf8").digest("base64");
}

/**
 * PayTR `paytr_token` doğrulaması POST’taki `payment_amount` ile HMAC zincirindeki tutarı eşler.
 * Üretimde `paymentAmountForHash` ve forma yazılan `payment_amount` aynı string olmalı.
 */
export function directPaytrTokenMatchesPostedPaymentAmount(
  paytrToken: string,
  params: Omit<
    Parameters<typeof computePaytrDirectToken>[0],
    "paymentAmountForHash"
  > & { postedPaymentAmount: string }
): boolean {
  const { postedPaymentAmount, ...rest } = params;
  const expected = computePaytrDirectToken({
    ...rest,
    paymentAmountForHash: postedPaymentAmount,
  });
  return paytrToken === expected;
}

/**
 * PayTR iFrame 1. adım ile aynı HMAC zinciri; birleşik ödeme sayfası (`PAYTR_DIRECT_HASH_MODE=iframe_style`) için.
 * Sepet: base64(JSON) — API `userBasketBase64`. `payment_amount` form ile aynı (kuruş string).
 */
function buildPaytrDirectIframeStylePreSaltString(p: {
  merchantId: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: string;
  userBasketBase64: string;
  noInstallment: number;
  maxInstallment: number;
  currency: string;
  testMode: number;
}): string {
  return (
    p.merchantId +
    p.userIp +
    p.merchantOid +
    p.email +
    p.paymentAmount +
    p.userBasketBase64 +
    p.noInstallment +
    p.maxInstallment +
    p.currency +
    p.testMode
  );
}

export function getPaytrIframeStyleHashDebugSnapshot(p: {
  merchantId: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: string;
  userBasketBase64: string;
  noInstallment: number;
  maxInstallment: number;
  currency: string;
  testMode: number;
}): {
  kind: "iframe_style";
  segments: PaytrHashSegment[];
  preSaltString: string;
  utf8ByteLength: number;
} {
  const segments: PaytrHashSegment[] = [
    { key: "merchant_id", value: p.merchantId },
    { key: "user_ip", value: p.userIp },
    { key: "merchant_oid", value: p.merchantOid },
    { key: "email", value: p.email },
    { key: "payment_amount", value: p.paymentAmount },
    { key: "user_basket (base64)", value: p.userBasketBase64 },
    { key: "no_installment", value: String(p.noInstallment) },
    { key: "max_installment", value: String(p.maxInstallment) },
    { key: "currency", value: p.currency },
    { key: "test_mode", value: String(p.testMode) },
  ];
  const preSaltString = buildPaytrDirectIframeStylePreSaltString(p);
  return {
    kind: "iframe_style",
    segments,
    preSaltString,
    utf8ByteLength: Buffer.byteLength(preSaltString, "utf8"),
  };
}

export function computePaytrDirectTokenIframeStyle(params: {
  merchantId: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: string;
  userBasketBase64: string;
  noInstallment: number;
  maxInstallment: number;
  currency: string;
  testMode: number;
  merchantSalt: string;
  merchantKey: string;
}): string {
  const hashStr = buildPaytrDirectIframeStylePreSaltString(params);
  const payload = hashStr + params.merchantSalt;
  return createHmac("sha256", params.merchantKey).update(payload, "utf8").digest("base64");
}

/**
 * Bildirim URL (2. adım) hash doğrulaması.
 */
export function computePaytrCallbackHash(params: {
  merchantOid: string;
  merchantSalt: string;
  status: string;
  totalAmount: string;
  merchantKey: string;
}): string {
  const data =
    params.merchantOid + params.merchantSalt + params.status + params.totalAmount;
  return createHmac("sha256", params.merchantKey).update(data, "utf8").digest("base64");
}
