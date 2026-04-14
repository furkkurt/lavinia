"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  getProductAdmin,
  updateProduct,
  createProduct,
  Product,
  parseCustomerOptions,
} from "../../../lib/api/products";
import { pickStockCaseInsensitive, variantRowsFromProductMatrix } from "../../../lib/productVariantStock";
import { VariantStockEditor, type VariantColorRow } from "../VariantStockEditor";
import { getBrands, Brand } from "../../../lib/api/brands";
import { getCategories, Category } from "../../../lib/api/categories";
import { importProductImages } from "../../../lib/api/legacyImport";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id as string | undefined;
  const id = rawId && rawId !== "create" && !isNaN(Number(rawId)) ? Number(rawId) : null;
  const isCreateMode = rawId === "create" || !rawId;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<number | null>(null);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [importingImages, setImportingImages] = useState(false);

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
    specialPriceStart: "",
    specialPriceEnd: "",
    stockQuantity: 0,
    isPublished: false,
    isFeatured: false,
    isCallForPricing: false,
    brandId: undefined,
    categoryIds: [],
    metaTitle: "",
    metaKeywords: "",
    metaDescription: "",
    customerSizeOptions: "",
  });

  const [variantRows, setVariantRows] = useState<VariantColorRow[]>([]);

  const sizeLabels = useMemo(() => {
    const raw = typeof formData.customerSizeOptions === "string" ? formData.customerSizeOptions : "";
    const p = parseCustomerOptions(raw);
    return p.length > 0 ? p : ["XS", "S", "M", "L", "XL", "XXL"];
  }, [formData.customerSizeOptions]);

  useEffect(() => {
    setVariantRows((prev) =>
      prev.map((r) => ({
        name: r.name,
        stocks: Object.fromEntries(sizeLabels.map((s) => [s, r.stocks[s] ?? 0])) as Record<string, number>,
      }))
    );
  }, [sizeLabels.join("|")]);

  useEffect(() => {
    const fetchData = async () => {
      if (isCreateMode || !id) {
        const [brandsData, categoriesData] = await Promise.all([
          getBrands(),
          getCategories(),
        ]);
        if (brandsData) setBrands(brandsData);
        if (categoriesData) setCategories(categoriesData);
        setFetching(false);
        return;
      }
      const [product, brandsData, categoriesData] = await Promise.all([
        getProductAdmin(id),
        getBrands(),
        getCategories(),
      ]);
      if (brandsData) setBrands(brandsData);
      if (categoriesData) setCategories(categoriesData);
      if (product) {
        const catIds = product.categoryIds ?? [];
        let mainId: number | null = null;
        if (catIds.length > 0 && categoriesData) {
          const firstCatId = catIds[0];
          const cat = categoriesData.find((c) => c.id === firstCatId);
          if (cat) {
            mainId = cat.parentId ?? firstCatId;
          }
        }
        setSelectedMainCategoryId((prev) => (mainId != null ? mainId : prev));
        setFormData({
          id: product.id,
          name: product.name ?? "",
          slug: product.slug ?? "",
          shortDescription: product.shortDescription ?? "",
          description: product.description ?? "",
          specification: product.specification ?? "",
          sku: product.sku ?? "",
          gtin: product.gtin ?? "",
          price: product.price ?? 0,
          oldPrice: product.oldPrice ?? 0,
          specialPrice: product.specialPrice ?? 0,
          specialPriceStart: product.specialPriceStart ? product.specialPriceStart.substring(0, 10) : "",
          specialPriceEnd: product.specialPriceEnd ? product.specialPriceEnd.substring(0, 10) : "",
          stockQuantity: product.stockQuantity ?? 0,
          isPublished: product.isPublished ?? false,
          isFeatured: product.isFeatured ?? false,
          isCallForPricing: product.isCallForPricing ?? false,
          brandId: product.brandId,
          categoryIds: product.categoryIds ?? [],
          metaTitle: product.metaTitle ?? "",
          metaKeywords: product.metaKeywords ?? "",
          metaDescription: product.metaDescription ?? "",
          customerSizeOptions:
            product.customerSizeOptions == null
              ? ""
              : Array.isArray(product.customerSizeOptions)
                ? product.customerSizeOptions.join(", ")
                : String(product.customerSizeOptions),
        });
        const sizeOptStr =
          product.customerSizeOptions == null
            ? ""
            : Array.isArray(product.customerSizeOptions)
              ? product.customerSizeOptions.join(", ")
              : String(product.customerSizeOptions);
        const parsedSizes = parseCustomerOptions(sizeOptStr);
        const sizeListForRows = parsedSizes.length > 0 ? parsedSizes : ["XS", "S", "M", "L", "XL", "XXL"];
        setVariantRows(variantRowsFromProductMatrix(product, sizeListForRows));
      }
      setFetching(false);
    };
    fetchData();
  }, [id, isCreateMode]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "mainCategoryId") {
      const mainId = value ? parseInt(value) : null;
      setSelectedMainCategoryId(mainId);
      const subs = categories.filter((c) => c.parentId === mainId);
      const newCatIds = mainId && subs.length === 0 ? [mainId] : [];
      setFormData((prev) => ({ ...prev, categoryIds: newCatIds }));
    } else if (name === "subCategoryId") {
      const subId = value ? parseInt(value) : null;
      setFormData((prev) => ({ ...prev, categoryIds: subId ? [subId] : [] }));
    } else if (name === "price" || name === "oldPrice" || name === "specialPrice" || name === "stockQuantity") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setThumbnailImage(e.target.files[0]);
  };

  const handleProductImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setProductImages(Array.from(e.target.files));
  };

  const handleImportProductImages = async () => {
    if (!id || isCreateMode) return;
    setImportingImages(true);
    const res = await importProductImages(id);
    setImportingImages(false);
    if (res.success) {
      alert("Görseller productImages klasöründen içe aktarıldı.");
      window.location.reload();
    } else {
      alert(res.error || "Görsel içe aktarma başarısız. productImages klasörünün mevcut olduğundan emin olun.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const namedVariants = variantRows.filter((r) => r.name.trim());
      const payload: Partial<Product> = {
        ...formData,
        thumbnailImage: thumbnailImage ?? undefined,
        productImages: productImages.map((img) => ({ image: img })),
        customerColorOptions: "",
        customerVariantStockJson:
          namedVariants.length > 0
            ? JSON.stringify({
                colors: namedVariants.map((r) => ({
                  name: r.name.trim(),
                  stocks: r.stocks,
                })),
              })
            : "",
      };
      if (isCreateMode) {
        const result = await createProduct(payload);
        if (result) {
          alert("Ürün oluşturuldu.");
          router.push("/admin/products");
        } else {
          alert("Ürün oluşturulurken bir hata oluştu.");
        }
      } else if (id) {
        const result = await updateProduct(id, payload);
        if (result) {
          alert("Ürün güncellendi.");
          router.push("/admin/products");
        } else {
          alert("Güncelleme sırasında bir hata oluştu.");
        }
      }
    } catch (err) {
      console.error("Error saving product:", err);
      alert(isCreateMode ? "Ürün oluşturulurken bir hata oluştu." : "Güncelleme sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching && !isCreateMode) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!isCreateMode && !formData.name && !fetching) {
    return (
      <div>
        <p>Ürün bulunamadı.</p>
        <Link href="/admin/products" className="btn btn-secondary">
          Listeye Dön
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{isCreateMode ? "Yeni Ürün Ekle" : "Ürünü Düzenle"}</h1>
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
                <label className="form-label">İndirimli Fiyat</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="specialPrice"
                  value={formData.specialPrice}
                  onChange={handleInputChange}
                />
                <small className="text-muted">0 = indirim yok. Satış fiyatından düşük olmalı.</small>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">İndirim Başlangıcı</label>
                <input
                  type="date"
                  className="form-control"
                  name="specialPriceStart"
                  value={formData.specialPriceStart || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">İndirim Bitişi</label>
                <input
                  type="date"
                  className="form-control"
                  name="specialPriceEnd"
                  value={formData.specialPriceEnd || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label">Stok Adedi</label>
                <input
                  type="number"
                  className="form-control"
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-12 mb-3">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <input
                    className="form-check-input flex-shrink-0 m-0"
                    type="checkbox"
                    name="isCallForPricing"
                    id="editIsCallForPricing"
                    checked={formData.isCallForPricing}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label mb-0" htmlFor="editIsCallForPricing" style={{ cursor: "pointer" }}>
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
                  value={formData.brandId ?? ""}
                  onChange={handleInputChange}
                >
                  <option value="">Marka Seçin</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Ana Kategori</label>
                <select
                  className="form-select"
                  name="mainCategoryId"
                  value={selectedMainCategoryId ?? ""}
                  onChange={handleInputChange}
                >
                  <option value="">Kategori seçin</option>
                  {categories
                    .filter((c) => !c.parentId)
                    .sort((a, b) => {
                      const orderA = a.displayOrder !== undefined ? a.displayOrder : 0;
                      const orderB = b.displayOrder !== undefined ? b.displayOrder : 0;
                      return orderA - orderB;
                    })
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Alt Kategori</label>
                <select
                  className="form-select"
                  name="subCategoryId"
                  value={formData.categoryIds?.[0] ?? ""}
                  onChange={handleInputChange}
                >
                  <option value="">{selectedMainCategoryId ? "Alt kategori seçin (isteğe bağlı)" : "Önce ana kategori seçin"}</option>
                  {selectedMainCategoryId && (() => {
                    const subs = categories
                      .filter((c) => c.parentId === selectedMainCategoryId)
                      .sort((a, b) => {
                        const orderA = a.displayOrder !== undefined ? a.displayOrder : 0;
                        const orderB = b.displayOrder !== undefined ? b.displayOrder : 0;
                        return orderA - orderB;
                      });
                    const mainCat = categories.find((c) => c.id === selectedMainCategoryId);
                    if (subs.length === 0 && mainCat) {
                      return <option value={selectedMainCategoryId}>{mainCat.name} (ana kategori)</option>;
                    }
                    return subs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>);
                  })()}
                </select>
                {selectedMainCategoryId && categories.filter((c) => c.parentId === selectedMainCategoryId).length === 0 && (
                  <small className="form-text text-muted">Bu ana kategoride alt kategori yok; ürün ana kategoriye atanır.</small>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Renk × beden stoku</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-12 mb-3">
                <label className="form-label" htmlFor="edit-customer-size-options">
                  Beden sütunları (isteğe bağlı)
                </label>
                <input
                  id="edit-customer-size-options"
                  type="text"
                  className="form-control"
                  name="customerSizeOptions"
                  value={typeof formData.customerSizeOptions === "string" ? formData.customerSizeOptions : ""}
                  onChange={handleInputChange}
                  placeholder="Boş = XS, S, M, L, XL, XXL — özel: 36, 38, 40 veya S, M, L"
                  autoComplete="off"
                />
                <small className="form-text text-muted">
                  Virgülle ayırın. Matris tablosundaki sütun başlıkları buradan gelir.
                </small>
              </div>
              <VariantStockEditor sizeLabels={sizeLabels} rows={variantRows} onChange={setVariantRows} />
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
                <label className="form-label">Thumbnail (yeni yükleme)</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                />
                {thumbnailImage && (
                  <small className="text-muted d-block mt-2">Seçilen: {thumbnailImage.name}</small>
                )}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Ek ürün görselleri</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  multiple
                  onChange={handleProductImagesChange}
                />
                {productImages.length > 0 && (
                  <small className="text-muted d-block mt-2">{productImages.length} görsel seçildi</small>
                )}
              </div>
              <div className="col-12 mt-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleImportProductImages}
                  disabled={importingImages || isCreateMode}
                >
                  {importingImages ? "İçe aktarılıyor..." : "productImages klasöründen içe aktar"}
                </button>
                <small className="text-muted d-block mt-1">
                  productImages/{id}/ içindeki görselleri ürüne ekler. İlk görsel thumbnail olur.
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">SEO</h5>
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
            <h5 className="mb-0">Yayın</h5>
          </div>
          <div className="card-body">
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <input
                  className="form-check-input flex-shrink-0 m-0"
                  type="checkbox"
                  name="isPublished"
                  id="editIsPublished"
                  checked={formData.isPublished}
                  onChange={handleInputChange}
                />
                <label className="form-check-label mb-0" htmlFor="editIsPublished" style={{ cursor: "pointer" }}>
                  Ürün Aktif (Yayınla)
                </label>
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <input
                  className="form-check-input flex-shrink-0 m-0"
                  type="checkbox"
                  name="isFeatured"
                  id="editIsFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                />
                <label className="form-check-label mb-0" htmlFor="editIsFeatured" style={{ cursor: "pointer" }}>
                  Vitrin (Öne Çıkar)
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Kaydediliyor..." : "Güncelle"}
          </button>
          <Link href="/admin/products" className="btn btn-secondary">
            İptal
          </Link>
        </div>
      </form>
    </div>
  );
}
