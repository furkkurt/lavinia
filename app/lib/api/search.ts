import { apiFetch } from './config';

export interface SearchOption {
  query: string;
  brand?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface SearchResult {
  totalProduct: number;
  page: number;
  pageSize: number;
  products: Array<{
    id: number;
    name: string;
    slug: string;
    price: number;
    oldPrice?: number;
    specialPrice?: number;
    thumbnailUrl?: string;
    calculatedProductPrice?: {
      price: number;
      oldPrice?: number;
      percentOfSaving?: number;
    };
  }>;
}

// Search products (public endpoint)
export async function searchProducts(searchOption: SearchOption): Promise<SearchResult | null> {
  const response = await apiFetch<SearchResult>('/api/public/search', {
    method: 'POST',
    body: JSON.stringify(searchOption),
  });

  if (response.error) {
    // Only log non-401 and non-404 errors
    if (response.status !== 401 && response.status !== 404) {
      console.error('Error searching products:', response.error);
    }
    return null;
  }

  return response.data || null;
}
