import { apiFetch } from './config';

export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  parentId?: number;
  displayOrder?: number;
  children?: Category[];
}

export interface CategoryMenuItem {
  id: number;
  name: string;
  slug: string;
  /** Resolved thumbnail URL from API when category has a menu image. */
  thumbnailImageUrl?: string | null;
  children?: CategoryMenuItem[];
}

// Get all published categories (public endpoint)
export async function getCategories(): Promise<Category[] | null> {
  const response = await apiFetch<Category[]>('/api/public/categories');

  if (response.error) {
    // Only log non-401 and non-404 errors
    if (response.status !== 401 && response.status !== 404) {
      console.error('Error fetching categories:', response.error);
    }
    return null;
  }

  return response.data || null;
}

// Get categories for menu (public endpoint)
export async function getMenuCategories(): Promise<CategoryMenuItem[] | null> {
  const response = await apiFetch<CategoryMenuItem[]>('/api/public/categories/menu');

  if (response.error) {
    // Only log non-401 and non-404 errors
    if (response.status !== 401 && response.status !== 404) {
      console.error('Error fetching menu categories:', response.error);
    }
    return null;
  }

  return response.data || null;
}

// Get category by slug (public endpoint)
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const response = await apiFetch<Category>(`/api/public/categories/slug/${encodeURIComponent(slug)}`);

  if (response.error) {
    // Only log non-401 and non-404 errors
    if (response.status !== 401 && response.status !== 404) {
      console.error('Error fetching category:', response.error);
    }
    return null;
  }

  return response.data || null;
}
