import { apiFetch } from './config';

export interface LegacyImportResult {
  brandsImported?: number;
  categoriesImported?: number;
  productsImported?: number;
  usersImported?: number;
  errors?: string[];
  warnings?: string[];
}

export async function runLegacyImport(options?: { replaceCategories?: boolean }): Promise<{ success: boolean; data?: LegacyImportResult; error?: string }> {
  const params = new URLSearchParams();
  if (options?.replaceCategories) params.set('replaceCategories', 'true');
  const url = params.toString() ? `/api/legacy-import?${params}` : '/api/legacy-import';
  const longWait =
    typeof AbortSignal !== "undefined" &&
    typeof (AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal }).timeout ===
      "function"
      ? (AbortSignal as unknown as { timeout: (ms: number) => AbortSignal }).timeout(35 * 60 * 1000)
      : undefined;

  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const startedAt = new Date().toISOString();
  console.info("[LegacyImport] POST start", { url, replaceCategories: !!options?.replaceCategories, startedAt });

  const response = await apiFetch<LegacyImportResult>(url, {
    method: "POST",
    ...(longWait ? { signal: longWait } : {}),
  });

  const elapsedMs = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0);
  if (response.error) {
    console.warn("[LegacyImport] POST end (error)", { elapsedMs, status: response.status, error: response.error });
    return { success: false, error: response.error };
  }

  console.info("[LegacyImport] POST end (ok)", { elapsedMs, status: response.status, summary: response.data });
  return { success: true, data: response.data };
}

export async function importProductImages(productId: number): Promise<{ success: boolean; error?: string }> {
  const response = await apiFetch<{ success?: boolean; message?: string }>(`/api/legacy-import/product-images/${productId}`, {
    method: 'POST',
  });
  if (response.error) return { success: false, error: response.error };
  return { success: true };
}
