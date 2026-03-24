import { apiFetch } from './config';
import { getCategories } from './categories';

export interface CategoryListItem {
  id: number;
  name: string;
  displayOrder: number;
  includeInMenu: boolean;
  isPublished: boolean;
  parentId?: number | null;
}

export interface CategoryForm {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
  displayOrder?: number;
  parentId?: number | null;
  includeInMenu?: boolean;
  isPublished?: boolean;
}

export async function getAdminCategories(): Promise<CategoryListItem[] | null> {
  const response = await apiFetch<CategoryListItem[]>('/api/categories');
  if (response.error || !response.data) {
    // Fallback to public API when 403 (admin token may not work cross-origin)
    const publicCats = await getCategories();
    if (publicCats) {
      return publicCats.map((c) => ({
        id: c.id,
        name: c.name,
        displayOrder: c.displayOrder ?? 0,
        includeInMenu: true,
        isPublished: true,
        parentId: c.parentId,
      }));
    }
    return null;
  }
  return response.data;
}

export async function getAdminCategory(id: number): Promise<CategoryForm | null> {
  const response = await apiFetch<CategoryForm>(`/api/categories/${id}`);
  if (response.error || !response.data) return null;
  return response.data;
}

export async function createCategory(data: CategoryForm): Promise<{ success: boolean; id?: number; error?: string }> {
  const response = await apiFetch<{ id?: number }>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (response.error) return { success: false, error: response.error };
  return { success: true, id: response.data?.id };
}

export async function updateCategory(id: number, data: CategoryForm): Promise<{ success: boolean; error?: string }> {
  const response = await apiFetch(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (response.error) return { success: false, error: response.error };
  return { success: true };
}

export async function deleteCategory(id: number): Promise<{ success: boolean; error?: string }> {
  const response = await apiFetch(`/api/categories/${id}`, {
    method: 'DELETE',
  });
  if (response.error) return { success: false, error: response.error };
  return { success: true };
}
