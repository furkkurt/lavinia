import type { HepsijetCompanyConfig } from "./payload";

const TRUTHY = new Set(["1", "true", "yes", "on"]);

/**
 * `HEPSIJET_DEV_API_ENABLED=1` (veya true) olmadan /api/hepsijet/* test uçları çalışmaz.
 * Üretimde açık bırakılmamalı; yalnızca entegrasyon/test için.
 */
export function isHepsijetDevApiEnabled(): boolean {
  return TRUTHY.has((process.env["HEPSIJET_DEV_API_ENABLED"] || "").trim().toLowerCase());
}

function need(key: string): string | null {
  const v = process.env[key];
  if (v === undefined) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export type HepsijetServerConfig = {
  baseUrl: string;
  username: string;
  password: string;
  company: HepsijetCompanyConfig;
  testRecipient: {
    firstName: string;
    lastName: string;
    phone1: string;
    email: string;
    city: { name: string };
    town: { name: string };
    district: { name: string };
    addressLine1: string;
  };
};

/**
 * HepsiJET test/prod entegrasyonu; ortam değişkenleri eksikse `null` döner.
 * Parola vb. sadece sunucuda.
 */
export function getHepsijetServerConfig(): HepsijetServerConfig | null {
  const baseUrl = need("HEPSIJET_BASE_URL") || "https://integration-apitest.hepsijet.com";
  const username = need("HEPSIJET_USERNAME");
  const password = need("HEPSIJET_PASSWORD");
  const companyName = need("HEPSIJET_COMPANY_NAME");
  const abbreviationCode = need("HEPSIJET_ABBREVIATION_CODE");
  const companyAddressId = need("HEPSIJET_COMPANY_ADDRESS_ID");
  const senderCountry = need("HEPSIJET_SENDER_COUNTRY") || "Türkiye";
  const senderCity = need("HEPSIJET_SENDER_CITY");
  const senderTown = need("HEPSIJET_SENDER_TOWN");
  const senderDistrict = need("HEPSIJET_SENDER_DISTRICT");
  const senderAddressLine1 = need("HEPSIJET_SENDER_ADDRESS_LINE1");
  const xdock = need("HEPSIJET_CURRENT_XDOCK");

  if (
    !username ||
    !password ||
    !companyName ||
    !abbreviationCode ||
    !companyAddressId ||
    !senderCity ||
    !senderTown ||
    !senderDistrict ||
    !senderAddressLine1 ||
    !xdock
  ) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    username,
    password,
    company: {
      name: companyName,
      abbreviationCode,
      companyAddressId,
      senderCountry,
      senderCity,
      senderTown,
      senderDistrict,
      addressLine1: senderAddressLine1,
      currentXDockAbbreviationCode: xdock,
    },
    testRecipient: {
      firstName: need("HEPSIJET_TEST_RECIPIENT_FIRST_NAME") || "Test",
      lastName: need("HEPSIJET_TEST_RECIPIENT_LAST_NAME") || "Alıcı",
      phone1: need("HEPSIJET_TEST_RECIPIENT_PHONE") || "5551234567",
      email: need("HEPSIJET_TEST_RECIPIENT_EMAIL") || "hepsijet-test@example.com",
      city: { name: need("HEPSIJET_TEST_RECIPIENT_CITY") || "Ankara" },
      town: { name: need("HEPSIJET_TEST_RECIPIENT_TOWN") || "Çankaya" },
      district: { name: need("HEPSIJET_TEST_RECIPIENT_DISTRICT") || "Kızılay" },
      addressLine1:
        need("HEPSIJET_TEST_RECIPIENT_ADDRESS") ||
        "Kızılay Mah. HepsiJET test Sk. No:1 D:2 Çankaya/Ankara",
    },
  };
}

export function hepsijetConfigSummary(
  c: HepsijetServerConfig
): { baseUrl: string; username: string; companyName: string; abbreviationCode: string } {
  return {
    baseUrl: c.baseUrl,
    username: c.username,
    companyName: c.company.name,
    abbreviationCode: c.company.abbreviationCode,
  };
}
