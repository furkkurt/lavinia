import { apiFetch, apiFetchMultipart, API_BASE_URL } from './config';

export interface Product {
  id: number;
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  specification?: string;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
  sku?: string;
  gtin?: string;
  category?: string | null;
  price: number;
  oldPrice?: number;
  specialPrice?: number;
  specialPriceStart?: string;
  specialPriceEnd?: string;
  isPublished: boolean;
  isFeatured?: boolean;
  isCallForPricing?: boolean;
  stockQuantity?: number;
  stockTrackingIsEnabled?: boolean;
  thumbnailImageUrl?: string;
  thumbnailImage?: File;
  brandId?: number;
  categoryIds?: number[];
  productImages?: Array<{
    id?: number;
    imageUrl?: string;
    image?: File;
  }>;
}

export interface ProductGridParams {
  pageIndex?: number;
  pageSize?: number;
  categorySlug?: string;
  sort?: Array<{
    field: string;
    dir: 'asc' | 'desc';
  }>;
  filter?: {
    logic?: 'and' | 'or';
    filters?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };
}

export interface ProductGridResponse {
  data: Product[];
  total: number;
}

// Get products with pagination (public endpoint - no auth required)
export async function getProductsGrid(params: ProductGridParams): Promise<ProductGridResponse | null> {
  const pageIndex = params.pageIndex || 0;
  const pageSize = params.pageSize || 20;
  
  // Convert frontend sort format to backend SmartTable format
  const sortObj = params.sort && params.sort.length > 0 ? {
    predicate: params.sort[0].field,
    reverse: params.sort[0].dir === 'desc'
  } : {
    predicate: 'id',
    reverse: true
  };

  const predicateObject: any = {};
  if (params.categorySlug) {
    predicateObject.categorySlug = params.categorySlug;
  }
  if (params.filter && params.filter.filters && params.filter.filters.length > 0) {
    predicateObject.filter = params.filter;
  }

  const requestBody: any = {
    pagination: {
      start: pageIndex * pageSize,
      number: pageSize
    },
    sort: sortObj,
    search: {
      predicateObject
    }
  };

  const response = await apiFetch<ProductGridResponse>('/api/public/products/grid', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  if (response.error) {
    if (response.status !== 401 && response.status !== 404) {
      console.error('Error fetching products:', response.error);
    }
    return null;
  }

  return response.data || null;
}

/** En çok satanlar: sipariş adedine göre sıralı grid (Orders modülü) */
export async function getBestsellersGrid(params: { pageIndex?: number; pageSize?: number; categorySlug?: string } = {}): Promise<ProductGridResponse | null> {
  const pageIndex = params.pageIndex ?? 0;
  const pageSize = params.pageSize ?? 20;
  const predicateObject: Record<string, string> = {};
  if (params.categorySlug) {
    predicateObject.categorySlug = params.categorySlug;
  }
  const requestBody = {
    pagination: { start: pageIndex * pageSize, number: pageSize },
    sort: { predicate: "id", reverse: true },
    search: { predicateObject },
  };
  const response = await apiFetch<ProductGridResponse>("/api/public/bestsellers/grid", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
  if (response.error) {
    if (response.status !== 401 && response.status !== 404) {
      console.error("Error fetching bestsellers:", response.error);
    }
    return null;
  }
  return response.data || null;
}

// Get single product (public endpoint - no auth required)
export async function getProduct(id: number): Promise<Product | null> {
  const response = await apiFetch<Product>(`/api/public/products/${id}`);

  if (response.error) {
    // Only log non-401 and non-404 errors to avoid console spam
    if (response.status !== 401 && response.status !== 404) {
    console.error('Error fetching product:', response.error);
    }
    return null;
  }

  return response.data || null;
}

// Get image filenames from productImages/{id}/ folder (fallback when product has no media)
export async function getProductLocalImages(productId: number): Promise<string[]> {
  const response = await apiFetch<{ files: string[] }>(`/api/public/products/${productId}/local-images`);
  if (response.error || !response.data?.files) return [];
  return response.data.files;
}

// Build full URL for a local product image
export function getProductLocalImageUrl(productId: number, filename: string): string {
  return `${API_BASE_URL}/product-images/${productId}/${encodeURIComponent(filename)}`;
}

// Create product
export async function createProduct(product: Partial<Product>): Promise<Product | null> {
  const formData = new FormData();
  
  // Add product fields with Product. prefix for query params
  if (product.id) formData.append('Product.Id', product.id.toString());
  if (product.name) formData.append('Product.Name', product.name);
  if (product.slug) formData.append('Product.Slug', product.slug);
  if (product.shortDescription) formData.append('Product.ShortDescription', product.shortDescription);
  if (product.description) formData.append('Product.Description', product.description);
  if (product.specification) formData.append('Product.Specification', product.specification);
  if (product.sku) formData.append('Product.Sku', product.sku);
  if (product.gtin) formData.append('Product.Gtin', product.gtin);
  if (product.price !== undefined) formData.append('Product.Price', product.price.toString());
  if (product.oldPrice !== undefined) formData.append('Product.OldPrice', product.oldPrice.toString());
  if (product.specialPrice !== undefined) formData.append('Product.SpecialPrice', product.specialPrice.toString());
  if (product.specialPriceStart) formData.append('Product.SpecialPriceStart', product.specialPriceStart);
  if (product.specialPriceEnd) formData.append('Product.SpecialPriceEnd', product.specialPriceEnd);
  if (product.isPublished !== undefined) formData.append('Product.IsPublished', product.isPublished.toString());
  if (product.isFeatured !== undefined) formData.append('Product.IsFeatured', product.isFeatured.toString());
  if (product.isCallForPricing !== undefined) formData.append('Product.IsCallForPricing', product.isCallForPricing.toString());
  if (product.stockQuantity !== undefined) formData.append('Product.StockQuantity', product.stockQuantity.toString());
  formData.append('Product.StockTrackingIsEnabled', 'true');
  if (product.brandId) formData.append('Product.BrandId', product.brandId.toString());
  if (product.categoryIds && product.categoryIds.length > 0) {
    product.categoryIds.forEach((catId) => {
      formData.append('Product.CategoryIds', catId.toString());
    });
  }
  if (product.metaTitle) formData.append('Product.MetaTitle', product.metaTitle);
  if (product.metaKeywords) formData.append('Product.MetaKeywords', product.metaKeywords);
  if (product.metaDescription) formData.append('Product.MetaDescription', product.metaDescription);

  // Add images
  if (product.thumbnailImage instanceof File) {
    formData.append('ThumbnailImage', product.thumbnailImage);
  }
  
  if (product.productImages && Array.isArray(product.productImages)) {
    product.productImages.forEach((img) => {
      if (img.image instanceof File) {
        formData.append('ProductImages', img.image);
      }
    });
  }

  const response = await apiFetchMultipart<Product>('/api/products', formData, {
    method: 'POST',
  });

  if (response.error) {
    console.error('Error creating product:', response.error);
    return null;
  }

  return response.data || null;
}

// Update product (same FormData shape as create for backend ProductForm)
export async function updateProduct(id: number, product: Partial<Product>): Promise<Product | null> {
  const formData = new FormData();

  if (product.id !== undefined) formData.append('Product.Id', product.id.toString());
  if (product.name !== undefined) formData.append('Product.Name', product.name);
  if (product.slug !== undefined) formData.append('Product.Slug', product.slug);
  if (product.shortDescription !== undefined) formData.append('Product.ShortDescription', product.shortDescription);
  if (product.description !== undefined) formData.append('Product.Description', product.description);
  if (product.specification !== undefined) formData.append('Product.Specification', product.specification);
  if (product.sku !== undefined) formData.append('Product.Sku', product.sku);
  if (product.gtin !== undefined) formData.append('Product.Gtin', product.gtin);
  if (product.price !== undefined) formData.append('Product.Price', product.price.toString());
  if (product.oldPrice !== undefined) formData.append('Product.OldPrice', product.oldPrice.toString());
  if (product.specialPrice !== undefined) formData.append('Product.SpecialPrice', product.specialPrice.toString());
  if (product.specialPriceStart !== undefined) formData.append('Product.SpecialPriceStart', product.specialPriceStart);
  if (product.specialPriceEnd !== undefined) formData.append('Product.SpecialPriceEnd', product.specialPriceEnd);
  if (product.isPublished !== undefined) formData.append('Product.IsPublished', product.isPublished.toString());
  if (product.isFeatured !== undefined) formData.append('Product.IsFeatured', product.isFeatured.toString());
  if (product.isCallForPricing !== undefined) formData.append('Product.IsCallForPricing', product.isCallForPricing.toString());
  if (product.stockQuantity !== undefined) formData.append('Product.StockQuantity', product.stockQuantity.toString());
  formData.append('Product.StockTrackingIsEnabled', 'true');
  if (product.brandId !== undefined) formData.append('Product.BrandId', product.brandId.toString());
  if (product.categoryIds && product.categoryIds.length > 0) {
    product.categoryIds.forEach((catId) => formData.append('Product.CategoryIds', catId.toString()));
  }
  if (product.metaTitle !== undefined) formData.append('Product.MetaTitle', product.metaTitle);
  if (product.metaKeywords !== undefined) formData.append('Product.MetaKeywords', product.metaKeywords);
  if (product.metaDescription !== undefined) formData.append('Product.MetaDescription', product.metaDescription);

  if (product.thumbnailImage instanceof File) {
    formData.append('ThumbnailImage', product.thumbnailImage);
  }
  if (product.productImages && Array.isArray(product.productImages)) {
    product.productImages.forEach((img) => {
      if (img.image instanceof File) {
        formData.append('ProductImages', img.image);
      }
    });
  }

  const response = await apiFetchMultipart<Product>(`/api/products/${id}`, formData, {
    method: 'PUT',
  });

  if (response.error) {
    console.error('Error updating product:', response.error);
    return null;
  }

  return response.data || null;
}

// Delete product
export async function deleteProduct(id: number): Promise<boolean> {
  const response = await apiFetch(`/api/products/${id}`, {
    method: 'DELETE',
  });

  if (response.error) {
    console.error('Error deleting product:', response.error);
    return false;
  }

  return true;
}

// Change product status (publish/unpublish)
export async function changeProductStatus(id: number): Promise<boolean> {
  const response = await apiFetch(`/api/products/change-status/${id}`, {
    method: 'POST',
  });

  if (response.error) {
    console.error('Error changing product status:', response.error);
    return false;
  }

  return true;
}

// Quick search products
export async function quickSearchProducts(name: string): Promise<Product[] | null> {
  const response = await apiFetch<Product[]>(`/api/products/quick-search?name=${encodeURIComponent(name)}`);

  if (response.error) {
    console.error('Error searching products:', response.error);
    return null;
  }

  return response.data || null;
}
