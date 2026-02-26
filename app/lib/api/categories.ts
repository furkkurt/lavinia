import { apiFetch } from './config';

export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  parentId?: number;
}

export async function getCategories(): Promise<Category[] | null> {
  const response = await apiFetch<Category[]>('/api/categories');

  if (response.error) {
    console.error('Error fetching categories:', response.error);
    return null;
  }

  return response.data || null;
}
