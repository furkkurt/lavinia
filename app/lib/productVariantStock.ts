import type { Product } from "./api/products";

export type CustomerVariantStockPayload = {
  colors: Array<{ name: string; stocks: Record<string, number>; imageUrl?: string | null }>;
  standardSizeLabel?: string;
};

/**
 * Public product API returns variant stock as `sizes: [{ size, quantity }]` per color;
 * admin / internal helpers use `stocks: Record<string, number>`.
 * Normalize so storefront `stockAtMatrix` and pickers work.
 */
export function normalizeCustomerVariantStockFromApi(raw: unknown): CustomerVariantStockPayload | null {
  if (raw == null || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const colorsRaw = obj.colors ?? obj.Colors;
  if (!Array.isArray(colorsRaw) || colorsRaw.length === 0) return null;

  const colors: CustomerVariantStockPayload["colors"] = [];

  for (const cRaw of colorsRaw) {
    if (cRaw == null || typeof cRaw !== "object") continue;
    const c = cRaw as Record<string, unknown>;
    const name = String(c.name ?? c.Name ?? "").trim();
    if (!name) continue;

    let stocks: Record<string, number> = {};
    const stocksObj = c.stocks ?? c.Stocks;
    if (stocksObj && typeof stocksObj === "object" && !Array.isArray(stocksObj)) {
      stocks = normalizeStocksRecord(stocksObj);
    } else {
      const sizesArr = c.sizes ?? c.Sizes;
      if (Array.isArray(sizesArr)) {
        for (const entry of sizesArr) {
          if (entry == null || typeof entry !== "object") continue;
          const e = entry as Record<string, unknown>;
          const sz = String(e.size ?? e.Size ?? "").trim();
          if (!sz) continue;
          const q = e.quantity ?? e.Quantity;
          const n = typeof q === "number" ? q : parseInt(String(q ?? 0), 10);
          stocks[sz] = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
        }
      }
    }

    const imageUrlRaw = c.imageUrl ?? c.ImageUrl;
    const imageUrl =
      typeof imageUrlRaw === "string" && imageUrlRaw.trim() ? imageUrlRaw.trim() : undefined;

    colors.push(imageUrl ? { name, stocks, imageUrl } : { name, stocks });
  }

  if (colors.length === 0) return null;

  const sslRaw = obj.standardSizeLabel ?? obj.StandardSizeLabel;
  const standardSizeLabel = typeof sslRaw === "string" && sslRaw.trim() ? sslRaw.trim() : undefined;

  return standardSizeLabel ? { colors, standardSizeLabel } : { colors };
}

/** API / JSON’dan gelen stok değerlerini sayıya çevirir (string "5" vb.). */
export function normalizeStocksRecord(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = typeof v === "number" ? v : parseInt(String(v), 10);
    out[k] = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }
  return out;
}

/** Beden etiketi API’de farklı yazılmış olabilir (xs vs XS). */
export function pickStockCaseInsensitive(
  stocks: Record<string, number>,
  label: string
): number {
  if (!label) return 0;
  if (Object.prototype.hasOwnProperty.call(stocks, label)) {
    return Math.max(0, Math.floor(Number(stocks[label]) || 0));
  }
  const t = label.trim().toLowerCase();
  for (const [k, v] of Object.entries(stocks)) {
    if (k.trim().toLowerCase() === t) return Math.max(0, Math.floor(Number(v) || 0));
  }
  /* Varsayılan sütun "Stok" ve eski "Standart" aynı anlama gelir. */
  if (t === "stok") {
    for (const [k, v] of Object.entries(stocks)) {
      if (k.trim().toLowerCase() === "standart") {
        return Math.max(0, Math.floor(Number(v) || 0));
      }
    }
  } else if (t === "standart") {
    for (const [k, v] of Object.entries(stocks)) {
      if (k.trim().toLowerCase() === "stok") {
        return Math.max(0, Math.floor(Number(v) || 0));
      }
    }
  }
  return 0;
}

/** Admin GET: customerVariantStockJson veya customerVariantStock → düzenleyici satırları */
export function variantRowsFromProductMatrix(
  product: Pick<Product, "customerVariantStock" | "customerVariantStockJson" | "customerSizeOptions">,
  sizeLabels: string[]
): Array<{ name: string; stocks: Record<string, number> }> {
  let colors: Array<{ name?: string; stocks?: unknown }> | null = null;
  if (product.customerVariantStock?.colors?.length) {
    colors = product.customerVariantStock.colors;
  } else if (
    typeof product.customerVariantStockJson === "string" &&
    product.customerVariantStockJson.trim()
  ) {
    try {
      const j = JSON.parse(product.customerVariantStockJson) as { colors?: unknown };
      if (Array.isArray(j?.colors)) colors = j.colors as Array<{ name?: string; stocks?: unknown }>;
    } catch {
      colors = null;
    }
  }
  if (!colors?.length) return [];
  return colors.map((c) => {
    const stocks = normalizeStocksRecord(c.stocks);
    return {
      name: String(c.name ?? "").trim(),
      stocks: Object.fromEntries(
        sizeLabels.map((s) => [s, pickStockCaseInsensitive(stocks, s)])
      ) as Record<string, number>,
    };
  });
}

/** Renk × beden matrisindeki tüm hücrelerin toplamı (genel stok alanı için). */
export function sumVariantMatrixStock(
  rows: Array<{ stocks: Record<string, number> }>,
  sizeLabels: string[]
): number {
  return rows.reduce((sum, r) => {
    const rowSum = sizeLabels.reduce(
      (acc, sz) => acc + Math.max(0, Math.floor(Number(r.stocks[sz]) || 0)),
      0
    );
    return sum + rowSum;
  }, 0);
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

/** Matris varsa hücre stoku; yoksa -1 */
export function stockAtMatrix(
  matrix: CustomerVariantStockPayload | null | undefined,
  color: string,
  size: string
): number {
  if (!matrix?.colors?.length || !color?.trim() || !size?.trim()) return 0;
  const row = matrix.colors.find((c) => norm(c.name) === norm(color));
  if (!row?.stocks) return 0;
  const hit = Object.entries(row.stocks).find(([k]) => norm(k) === norm(size));
  return hit ? Math.max(0, Number(hit[1]) || 0) : 0;
}

export function colorsInStockForSize(
  matrix: CustomerVariantStockPayload,
  size: string
): string[] {
  return matrix.colors
    .map((c) => c.name)
    .filter((name) => name && stockAtMatrix(matrix, name, size) > 0);
}

export function sizesInStockForColor(
  matrix: CustomerVariantStockPayload,
  color: string,
  sizeList: string[]
): string[] {
  return sizeList.filter((sz) => stockAtMatrix(matrix, color, sz) > 0);
}

export function lineStockForProduct(product: Product | null, size: string, color: string): number {
  if (!product) return 0;
  const m = product.customerVariantStock;
  if (m?.colors?.length) {
    return stockAtMatrix(m, color, size);
  }
  return product.stockQuantity ?? 0;
}
