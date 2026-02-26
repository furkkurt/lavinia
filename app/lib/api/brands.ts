import { apiFetch } from './config';

export interface Brand {
  id: number;
  name: string;
  slug?: string;
  description?: string;
}

export async function getBrands(): Promise<Brand[] | null> {
  const response = await apiFetch<Brand[]>('/api/brands');

  if (response.error) {
    console.error('Error fetching brands:', response.error);
    return null;
  }

  return response.data || null;
}
