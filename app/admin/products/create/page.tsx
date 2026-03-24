"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProduct, Product } from "../../../lib/api/products";
import { getBrands, Brand } from "../../../lib/api/brands";
import { getCategories, Category } from "../../../lib/api/categories";

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    specification: "",
    sku: "",
    gtin: "",
    price: 0,
    oldPrice: 0,
    specialPrice: 0,
    stockQuantity: 0,
    isPublished: false,
    isFeatured: false,
    isCallForPricing: false,
    brandId: undefined,
    categoryIds: [],
    metaTitle: "",
    metaKeywords: "",
    metaDescription: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const [brandsData, categoriesData] = await Promise.all([
        getBrands(),
        getCategories(),
      ]);
      if (brandsData) setBrands(brandsData);
      if (categoriesData) setCategories(categoriesData);
    };
    fetchData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "categoryIds") {
      const select = e.target as HTMLSelectElement;
      const selectedIds = Array.from(select.selectedOptions).map(
        (option) => parseInt(option.value)
      );
      setFormData((prev) => ({ ...prev, categoryIds: selectedIds }));
    } else if (name === "price" || name === "oldPrice" || name === "specialPrice" || name === "stockQuantity") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailImage(e.target.files[0]);
    }
  };

  const handleProductImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProductImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData: Partial<Product> = {
        ...formData,
        thumbnailImage: thumbnailImage || undefined,
        productImages: productImages.map((img) => ({ image: img })),
      };

      const result = await createProduct(productData);

      if (result) {
        alert("Ürün başarıyla oluşturuldu!");
        router.push("/admin/products");
      } else {
        alert("Ürün oluşturulurken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Ürün oluşturulurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Yeni Ürün Ekle</h1>
        <Link href="/admin/products" className="btn btn-secondary">
          Geri Dön
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Temel Bilgiler</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  Ürün Adı <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Slug</label>
                <input
                  type="text"
                  className="form-control"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Stok Kodu (SKU)</label>
                <input
                  type="text"
                  className="form-control"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Barkod (GTIN)</label>
                <input
                  type="text"
                  className="form-control"
                  name="gtin"
                  value={formData.gtin}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-12 mb-3">
                <label className="form-label">Ön Yazı (ONYAZI)</label>
                <textarea
                  className="form-control"
                  name="shortDescription"
                  rows={3}
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  placeholder="HTML veya düz metin. Sitede format otomatik algılanır."
                />
              </div>
              <div className="col-12 mb-3">
                <label className="form-label">Açıklama (ACIKLAMA)</label>
                <textarea
                  className="form-control"
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-12 mb-3">
                <label className="form-label">Özellikler</label>
                <textarea
                  className="form-control"
                  name="specification"
                  rows={5}
                  value={formData.specification}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Fiyat ve Stok</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Satış Fiyatı <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Piyasa Fiyatı</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="oldPrice"
                  value={formData.oldPrice}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Özel Fiyat</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="specialPrice"
                  value={formData.specialPrice}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Stok Adedi</label>
                <input
                  type="number"
                  className="form-control"
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6 mb-3">
                <div className="form-check mt-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="isCallForPricing"
                    checked={formData.isCallForPricing}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label">
                    Fiyat için Arayın
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Kategori ve Marka</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Marka</label>
                <select
                  className="form-select"
                  name="brandId"
                  value={formData.brandId || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Marka Seçin</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Kategoriler (BREADCRUMBKAT)</label>
                <select
                  className="form-select"
                  name="categoryIds"
                  multiple
                  value={formData.categoryIds?.map(String) || []}
                  onChange={handleInputChange}
                  size={8}
                >
                  {categories.map((category) => {
                    const parent = category.parentId ? categories.find((c) => c.id === category.parentId) : null;
                    const displayLabel = parent ? `${parent.name} › ${category.name}` : category.name;
                    return (
                      <option key={category.id} value={category.id}>
                        {displayLabel}
                      </option>
                    );
                  })}
                </select>
                <small className="form-text text-muted">
                  Birden fazla kategori seçmek için Ctrl (Windows) veya Cmd (Mac) tuşuna basılı tutun.
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Görseller</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Thumbnail Görsel</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                />
                {thumbnailImage && (
                  <small className="text-muted d-block mt-2">
                    Seçilen: {thumbnailImage.name}
                  </small>
                )}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Ürün Görselleri</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  multiple
                  onChange={handleProductImagesChange}
                />
                {productImages.length > 0 && (
                  <small className="text-muted d-block mt-2">
                    {productImages.length} görsel seçildi
                  </small>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">SEO Ayarları</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-12 mb-3">
                <label className="form-label">Meta Başlık</label>
                <input
                  type="text"
                  className="form-control"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-12 mb-3">
                <label className="form-label">Meta Anahtar Kelimeler</label>
                <input
                  type="text"
                  className="form-control"
                  name="metaKeywords"
                  value={formData.metaKeywords}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-12 mb-3">
                <label className="form-label">Meta Açıklama</label>
                <textarea
                  className="form-control"
                  name="metaDescription"
                  rows={3}
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Yayın Ayarları</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label">
                    Ürün Aktif (Yayınla)
                  </label>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label">
                    Vitrin (Öne Çıkar)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Kaydediliyor..." : "Ürünü Kaydet"}
          </button>
          <Link href="/admin/products" className="btn btn-secondary">
            İptal
          </Link>
        </div>
      </form>
    </div>
  );
}
