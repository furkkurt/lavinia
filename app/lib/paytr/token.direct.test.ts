import { describe, expect, it } from "vitest";
import {
  computePaytrDirectToken,
  computePaytrDirectTokenIframeStyle,
  computePaytrIframeToken,
  directPaytrTokenMatchesPostedPaymentAmount,
  getPaytrDirectHashDebugSnapshot,
  paymentAmountKurusToTlF2ForHash,
} from "./token";

const common = {
  merchantId: "mid",
  userIp: "1.2.3.4",
  merchantOid: "oid123",
  email: "e@test.com",
  paymentType: "card",
  installmentCount: "0",
  currency: "TL",
  testMode: 0,
  non3d: "0",
  noInstallment: "0",
  maxInstallment: "0",
  lang: "tr",
  merchantSalt: "salt",
  merchantKey: "keykeykeykeykeykeykeykeykeykey12",
};

describe("computePaytrIframeToken", () => {
  it("iFrame API 1. adım HMAC (PayTR NODE örneği ile aynı zincir)", () => {
    const userBasketBase64 = Buffer.from(
      JSON.stringify([["Urun", "18.00", 1]]),
      "utf8"
    ).toString("base64");
    expect(userBasketBase64).toBe("W1siVXJ1biIsIjE4LjAwIiwxXV0=");
    const token = computePaytrIframeToken({
      merchantId: "mid",
      userIp: "1.2.3.4",
      merchantOid: "oid123",
      email: "e@test.com",
      paymentAmount: 10099,
      userBasketBase64,
      noInstallment: 0,
      maxInstallment: 0,
      currency: "TL",
      testMode: 0,
      merchantSalt: "salt",
      merchantKey: "keykeykeykeykeykeykeykeykeykey12",
    });
    expect(token).toBe("9Y2S3vQF6iq4IjDcwYTbaWJggGZbnFdk/yDeB1V1o1U=");
  });
});

describe("computePaytrDirectToken", () => {
  it("classic hash + kuruş (varsayılan — PayTR PHP örneği sırası, SPP sonek yok)", () => {
    const token = computePaytrDirectToken({
      ...common,
      paymentAmountForHash: "10099",
      hashExtended: false,
    });
    expect(token).toBe("GhodXGMMnQY1jrH3TIjBT/ttqnJDxsKjdgtHb9Qfnl8=");
  });

  it("extended hash + kuruş (PAYTR_DIRECT_TOKEN_HASH_EXTENDED=1)", () => {
    const token = computePaytrDirectToken({
      ...common,
      paymentAmountForHash: "10099",
      hashExtended: true,
    });
    expect(token).toBe("GN8EjUx0FH1ARCR+r7hWeQRpoaHnrdCO5B4UUvhOkDE=");
  });

  it("classic hash + TL F2 (PAYTR_DIRECT_HASH_AMOUNT=tl_decimal senaryosu)", () => {
    const token = computePaytrDirectToken({
      ...common,
      paymentAmountForHash: "100.99",
      hashExtended: false,
    });
    expect(token).toBe("FDqD4MjhjR0EHMcJueQRgDcykuVNjoLft/canpyLwJE=");
  });
});

describe("paymentAmountKurusToTlF2ForHash", () => {
  it("TL iki ondalık (PayTR PHP hash biçimi)", () => {
    expect(paymentAmountKurusToTlF2ForHash("89900")).toBe("899.00");
    expect(paymentAmountKurusToTlF2ForHash("10099")).toBe("100.99");
    expect(paymentAmountKurusToTlF2ForHash("1")).toBe("0.01");
  });

  it("geçersiz kuruş reddeder", () => {
    expect(() => paymentAmountKurusToTlF2ForHash("")).toThrow();
    expect(() => paymentAmountKurusToTlF2ForHash("x")).toThrow();
  });
});

describe("getPaytrDirectHashDebugSnapshot", () => {
  it("10 segment + kuruş preSaltString (varsayılan rota: hash = form)", () => {
    const snap = getPaytrDirectHashDebugSnapshot({
      merchantId: "505056",
      userIp: "37.155.178.147",
      merchantOid: "4c2013b2af764cf3a430701478d26903a",
      email: "furkankurt@outlook.com",
      paymentAmountForHash: "89900",
      paymentType: "card",
      installmentCount: "0",
      currency: "TL",
      testMode: 1,
      non3d: "0",
      hashExtended: false,
      noInstallment: "0",
      maxInstallment: "0",
      lang: "tr",
    });
    expect(snap.segments).toHaveLength(10);
    expect(snap.preSaltString).toBe(
      "50505637.155.178.1474c2013b2af764cf3a430701478d26903afurkankurt@outlook.com89900card0TL10"
    );
  });

  it("TL F2 preSaltString (hash ve formda aynı string — PHP örneği)", () => {
    const snap = getPaytrDirectHashDebugSnapshot({
      merchantId: "505056",
      userIp: "37.155.178.147",
      merchantOid: "d845d6bcc87e4a7c9a353a4f1e984916a",
      email: "furkan@example.com",
      paymentAmountForHash: "899.00",
      paymentType: "card",
      installmentCount: "0",
      currency: "TL",
      testMode: 1,
      non3d: "0",
      hashExtended: false,
      noInstallment: "0",
      maxInstallment: "0",
      lang: "tr",
    });
    expect(snap.preSaltString).toBe(
      "50505637.155.178.147d845d6bcc87e4a7c9a353a4f1e984916afurkan@example.com899.00card0TL10"
    );
  });
});

describe("directPaytrTokenMatchesPostedPaymentAmount", () => {
  it("token, POST payment_amount ile hesaplanan HMAC ile eşleşmeli (kuruş)", () => {
    const postedPaymentAmount = "89900";
    const token = computePaytrDirectToken({
      ...common,
      merchantId: "505056",
      userIp: "37.155.178.147",
      merchantOid: "oid1",
      email: "a@b.com",
      paymentAmountForHash: postedPaymentAmount,
      hashExtended: false,
    });
    expect(
      directPaytrTokenMatchesPostedPaymentAmount(token, {
        ...common,
        merchantId: "505056",
        userIp: "37.155.178.147",
        merchantOid: "oid1",
        email: "a@b.com",
        postedPaymentAmount,
        hashExtended: false,
      })
    ).toBe(true);
  });

  it("hash’ta farklı tutar string’i kullanıldıysa (899.00 vs 89900) eşleşmez — PayTR reddi", () => {
    const tokenWrong = computePaytrDirectToken({
      ...common,
      paymentAmountForHash: "899.00",
      hashExtended: false,
    });
    expect(
      directPaytrTokenMatchesPostedPaymentAmount(tokenWrong, {
        ...common,
        postedPaymentAmount: "89900",
        hashExtended: false,
      })
    ).toBe(false);
  });
});

describe("computePaytrDirectTokenIframeStyle", () => {
  it("iFrame 1. adım zinciri (PAYTR_DIRECT_HASH_MODE=iframe_style)", () => {
    const token = computePaytrDirectTokenIframeStyle({
      merchantId: "mid",
      userIp: "1.2.3.4",
      merchantOid: "oid123",
      email: "e@test.com",
      paymentAmount: "10099",
      userBasketBase64: "dGVzdA==",
      noInstallment: 0,
      maxInstallment: 0,
      currency: "TL",
      testMode: 0,
      merchantSalt: "salt",
      merchantKey: "keykeykeykeykeykeykeykeykeykey12",
    });
    expect(token).toBe("kEa+/tNpGVj5gYRqcpAWCUaa4Ya9EchR6zbUJFaHfUc=");
  });
});
