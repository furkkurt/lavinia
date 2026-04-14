/**
 * PayTR Direkt API token diagnosis.
 * Reads credentials from .env.production (like PM2/ecosystem does).
 * Run: node test-paytr-hash.mjs
 */
import { createHmac, createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env.production the same way ecosystem.config.cjs does
function parseEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    const env = {};
    for (const line of content.split("\n")) {
      const trimmed = line.replace(/^\uFEFF/, "").replace(/\r/g, "").trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      // Remove surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
    return env;
  } catch {
    return {};
  }
}

const envProd = parseEnvFile(join(__dirname, ".env.production"));
const envLocal = parseEnvFile(join(__dirname, ".env.local"));
const merged = { ...envProd, ...envLocal };

const merchant_id = merged.PAYTR_MERCHANT_ID || "";
const merchant_key = merged.PAYTR_MERCHANT_KEY || "";
const merchant_salt = merged.PAYTR_MERCHANT_SALT || "";

// Also hardcode expected values for comparison
const EXPECTED_ID = "505056";
const EXPECTED_KEY = "safL7JGwxW716S4C";
const EXPECTED_SALT = "c4sbCqioetQytZR2";

console.log("=== Credential Comparison ===");
console.log("From .env.production:");
console.log("  MERCHANT_ID:", JSON.stringify(merchant_id), `(${merchant_id.length} chars)`);
console.log("  MERCHANT_KEY:", JSON.stringify(merchant_key), `(${merchant_key.length} chars)`);
console.log("  MERCHANT_SALT:", JSON.stringify(merchant_salt), `(${merchant_salt.length} chars)`);
console.log("");
console.log("Hardcoded (test script that WORKS):");
console.log("  MERCHANT_ID:", JSON.stringify(EXPECTED_ID), `(${EXPECTED_ID.length} chars)`);
console.log("  MERCHANT_KEY:", JSON.stringify(EXPECTED_KEY), `(${EXPECTED_KEY.length} chars)`);
console.log("  MERCHANT_SALT:", JSON.stringify(EXPECTED_SALT), `(${EXPECTED_SALT.length} chars)`);
console.log("");

const idMatch = merchant_id === EXPECTED_ID;
const keyMatch = merchant_key === EXPECTED_KEY;
const saltMatch = merchant_salt === EXPECTED_SALT;
console.log("ID match:", idMatch);
console.log("KEY match:", keyMatch);
console.log("SALT match:", saltMatch);

if (!idMatch || !keyMatch || !saltMatch) {
  console.log("\n!!! MISMATCH FOUND !!!");
  if (!idMatch) {
    console.log("  ID differs:");
    console.log("    env  hex:", Buffer.from(merchant_id, "utf8").toString("hex"));
    console.log("    expected:", Buffer.from(EXPECTED_ID, "utf8").toString("hex"));
  }
  if (!keyMatch) {
    console.log("  KEY differs:");
    console.log("    env  hex:", Buffer.from(merchant_key, "utf8").toString("hex"));
    console.log("    expected:", Buffer.from(EXPECTED_KEY, "utf8").toString("hex"));
  }
  if (!saltMatch) {
    console.log("  SALT differs:");
    console.log("    env  hex:", Buffer.from(merchant_salt, "utf8").toString("hex"));
    console.log("    expected:", Buffer.from(EXPECTED_SALT, "utf8").toString("hex"));
  }
}

const fingerprint = createHash("sha256")
  .update(merchant_id + "|" + merchant_key + "|" + merchant_salt, "utf8")
  .digest("hex")
  .slice(0, 16);
console.log("\nFingerprint (.env.production):", fingerprint);
console.log("Expected fingerprint:         ", "a4e93e1b3bea3b77");
console.log("Fingerprints match:", fingerprint === "a4e93e1b3bea3b77");

// Now test with .env.production credentials
console.log("\n=== Test with .env.production credentials ===");
const user_ip = "37.155.178.147";
const merchant_oid = "ENVTEST_" + Date.now();
const email = "afurkankurt@outlook.com";
const payment_amount = "89900";
const payment_type = "card";
const installment_count = "0";
const currency = "TL";
const test_mode = "1";
const non_3d = "0";

const hashSTR = `${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${payment_type}${installment_count}${currency}${test_mode}${non_3d}`;
const paytr_token_data = hashSTR + merchant_salt;
const token = createHmac("sha256", merchant_key)
  .update(paytr_token_data)
  .digest("base64");

console.log("hashSTR:", hashSTR);
console.log("token:", token);

const user_basket = JSON.stringify([["Test Ürün", "899.00", 1]]);

const formData = new URLSearchParams({
  merchant_id, user_ip, merchant_oid, email,
  payment_type, payment_amount, currency,
  test_mode, non_3d,
  merchant_ok_url: "https://www.boutiquelavinia.com/odeme/paytr-basarili",
  merchant_fail_url: "https://www.boutiquelavinia.com/api/paytr-fail-return",
  user_name: "Test User",
  user_address: "Test Address",
  user_phone: "05555555555",
  user_basket,
  debug_on: "1",
  client_lang: "tr",
  lang: "tr",
  paytr_token: token,
  no_installment: "0",
  max_installment: "0",
  non3d_test_failed: "0",
  installment_count,
  card_type: "",
});

try {
  const res = await fetch("https://www.paytr.com/odeme", {
    method: "POST",
    body: formData,
    redirect: "manual",
  });
  const body = await res.text();
  const hasError = body.includes('"failed"');
  console.log("\nPayTR response status:", res.status);
  console.log("Token accepted:", !hasError);
  if (hasError) {
    const match = body.match(/\{[^}]*"status"[^}]*\}/);
    console.log("Error:", match ? match[0] : body.slice(0, 200));
  } else {
    console.log("Response (first 200):", body.slice(0, 200));
  }
} catch (e) {
  console.error("Fetch error:", e.message);
}

// Also test with hardcoded credentials for comparison
console.log("\n=== Test with HARDCODED credentials (known working) ===");
const hashSTR2 = `${EXPECTED_ID}${user_ip}${merchant_oid}HC${email}${payment_amount}${payment_type}${installment_count}${currency}${test_mode}${non_3d}`;
const token2 = createHmac("sha256", EXPECTED_KEY)
  .update(hashSTR2 + EXPECTED_SALT)
  .digest("base64");

const formData2 = new URLSearchParams({
  merchant_id: EXPECTED_ID, user_ip, merchant_oid: merchant_oid + "HC", email,
  payment_type, payment_amount, currency,
  test_mode, non_3d,
  merchant_ok_url: "https://www.boutiquelavinia.com/odeme/paytr-basarili",
  merchant_fail_url: "https://www.boutiquelavinia.com/api/paytr-fail-return",
  user_name: "Test User",
  user_address: "Test Address",
  user_phone: "05555555555",
  user_basket,
  debug_on: "1",
  client_lang: "tr",
  lang: "tr",
  paytr_token: token2,
  no_installment: "0",
  max_installment: "0",
  non3d_test_failed: "0",
  installment_count,
  card_type: "",
});

try {
  const res = await fetch("https://www.paytr.com/odeme", {
    method: "POST",
    body: formData2,
    redirect: "manual",
  });
  const body = await res.text();
  const hasError = body.includes('"failed"');
  console.log("PayTR response status:", res.status);
  console.log("Token accepted:", !hasError);
  if (hasError) {
    const match = body.match(/\{[^}]*"status"[^}]*\}/);
    console.log("Error:", match ? match[0] : body.slice(0, 200));
  } else {
    console.log("Response (first 200):", body.slice(0, 200));
  }
} catch (e) {
  console.error("Fetch error:", e.message);
}
