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
  const response = await apiFetch<LegacyImportResult>(url, {
    method: 'POST',
  });

  if (response.error) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data };
}

export async function importProductImages(productId: number): Promise<{ success: boolean; error?: string }> {
  const response = await apiFetch<{ success?: boolean; message?: string }>(`/api/legacy-import/product-images/${productId}`, {
    method: 'POST',
  });
  if (response.error) return { success: false, error: response.error };
  return { success: true };
}
