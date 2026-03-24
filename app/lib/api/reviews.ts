import { apiFetch } from './config';

export interface CreateReviewData {
  entityId: number;
  entityTypeId?: string;
  rating: number;
  title?: string;
  comment?: string;
}

export interface ProductReview {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  reviewerName: string;
  createdOn: string;
}

export interface ProductReviewsResponse {
  items: ProductReview[];
  total: number;
  page: number;
  pageSize: number;
  ratingAverage: number | null;
  reviewsCount: number;
  rating1Count: number;
  rating2Count: number;
  rating3Count: number;
  rating4Count: number;
  rating5Count: number;
}

export async function getProductReviews(productId: number, page = 1, pageSize = 25): Promise<ProductReviewsResponse | null> {
  const response = await apiFetch<ProductReviewsResponse>(`/api/public/reviews?entityId=${productId}&entityTypeId=Product&page=${page}&pageSize=${pageSize}`);
  if (response.error) return null;
  return response.data || null;
}

export interface AdminReview {
  id: number;
  reviewerName: string;
  entityName: string;
  entitySlug: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: string;
  createdOn: string;
  isFeatured: boolean;
}

export async function getAdminReviews(): Promise<AdminReview[]> {
  const response = await apiFetch<AdminReview[]>('/api/reviews/all');
  return response.data || [];
}

export async function toggleFeaturedReview(id: number): Promise<boolean> {
  const response = await apiFetch(`/api/reviews/toggle-featured/${id}`, { method: 'POST' });
  return !response.error;
}

export async function changeReviewStatus(id: number, statusId: number): Promise<boolean> {
  const response = await apiFetch(`/api/reviews/change-status/${id}`, {
    method: 'POST',
    body: JSON.stringify(statusId),
  });
  return !response.error;
}

export async function getFeaturedReviews(): Promise<ProductReview[]> {
  const response = await apiFetch<ProductReview[]>('/api/public/reviews/featured');
  return response.data || [];
}

export async function createReview(data: CreateReviewData): Promise<{ success: boolean; id?: number; error?: string }> {
  const response = await apiFetch<{ id?: number }>('/api/user/reviews', {
    method: 'POST',
    body: JSON.stringify({
      entityId: data.entityId,
      entityTypeId: data.entityTypeId ?? 'Product',
      rating: data.rating,
      title: data.title ?? '',
      comment: data.comment ?? '',
    }),
  });
  if (response.error) return { success: false, error: response.error };
  return { success: true, id: response.data?.id };
}
