/**
 * PayTR user_basket: [["Ürün adı", "birim_fiyat_string", adet], ...]
 * @see https://dev.paytr.com/iframe-api/iframe-api-1-adim
 */

export type PaytrBasketRow = [string, string, number];

export type PaytrBasketItemInput = {
  productName: string;
  quantity: number;
  unitPrice: number;
};

export function checkoutItemsToPaytrBasket(items: PaytrBasketItemInput[]): PaytrBasketRow[] {
  return items.map((item) => {
    const priceStr = item.unitPrice.toFixed(2);
    return [item.productName, priceStr, item.quantity];
  });
}

export function paytrBasketToBase64(basket: PaytrBasketRow[]): string {
  return Buffer.from(JSON.stringify(basket), "utf8").toString("base64");
}
