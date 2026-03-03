import { apiFetch } from './config';

export interface Brand {
  id: number;
  name: string;
  slug?: string;
  description?: string;
}

// Get all published brands (public endpoint)
export async function getBrands(): Promise<Brand[] | null> {
  const response = await apiFetch<Brand[]>('/api/public/brands');

  if (response.error) {
    // Only log non-401 and non-404 errors
    if (response.status !== 401 && response.status !== 404) {
      console.error('Error fetching brands:', response.error);
    }
    return null;
  }

  return response.data || null;
}

// Get brand by slug (public endpoint)
export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const response = await apiFetch<Brand>(`/api/public/brands/slug/${encodeURIComponent(slug)}`);

  if (response.error) {
    // Only log non-401 and non-404 errors
    if (response.status !== 401 && response.status !== 404) {
      console.error('Error fetching brand:', response.error);
    }
    return null;
  }

  return response.data || null;
}
