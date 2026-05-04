/**
 * HepsiJET `sendDeliveryOrderEnhanced` (RETAIL) için gerekli sabitleri taşır.
 * Firma adı, kısa kod ve gönderen adresi HepsiJET’in verdiği değerlerle birebir aynı olmalı.
 */
export type HepsijetCompanyConfig = {
  name: string;
  abbreviationCode: string;
  companyAddressId: string;
  senderCountry: string;
  senderCity: string;
  senderTown: string;
  senderDistrict: string;
  addressLine1: string;
  currentXDockAbbreviationCode: string;
};

export type TestRecipient = {
  firstName: string;
  lastName: string;
  phone1: string;
  email: string;
  city: { name: string };
  town: { name: string };
  district: { name: string };
  addressLine1: string;
};

/** 9–16 karakter, firma kısa kodu ile önekli benzersiz barkod. */
export function makeCustomerDeliveryNo(abbreviationCode: string): string {
  const n = String(Math.floor(1e6 + Math.random() * 9e6));
  return (abbreviationCode + n).replace(/\s/g, "").slice(0, 16);
}

export function buildTestRetailShipmentJson(params: {
  company: HepsijetCompanyConfig;
  recipient: TestRecipient;
  deliveryDateOriginal: string;
  /** HepsiJET testlerinde ürün satırı için EAN/GTIN (ör. 869…); opsiyonel. */
  productGtin?: string | null;
}): object {
  const { company, recipient, deliveryDateOriginal } = params;
  const no = makeCustomerDeliveryNo(company.abbreviationCode);
  const gtin = params.productGtin?.trim();
  const product: Record<string, string> = { productCode: "HX_STD" };
  if (gtin) {
    product.barcode = gtin;
  }
  return {
    company: {
      name: company.name,
      abbreviationCode: company.abbreviationCode,
    },
    delivery: {
      customerDeliveryNo: no,
      customerOrderId: no,
      totalParcels: "1",
      desi: "2",
      deliverySlotOriginal: "0",
      deliveryDateOriginal,
      deliveryType: "RETAIL",
      product,
      receiver: {
        companyCustomerId: no,
        firstName: recipient.firstName,
        lastName: recipient.lastName,
        phone1: recipient.phone1,
        email: recipient.email,
      },
      senderAddress: {
        companyAddressId: company.companyAddressId,
        country: { name: company.senderCountry },
        city: { name: company.senderCity },
        town: { name: company.senderTown },
        district: { name: company.senderDistrict },
        addressLine1: company.addressLine1,
      },
      recipientAddress: {
        companyAddressId: no,
        country: { name: "Türkiye" },
        city: recipient.city,
        town: recipient.town,
        district: recipient.district,
        addressLine1: recipient.addressLine1,
      },
      recipientPerson: `${recipient.firstName} ${recipient.lastName}`.trim(),
      recipientPersonPhone1: recipient.phone1,
    },
    currentXDock: {
      abbreviationCode: company.currentXDockAbbreviationCode,
    },
  };
}
