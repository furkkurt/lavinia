"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getProductAdmin,
  updateProduct,
  createProduct,
  deleteProduct,
  Product,
  parseCustomerOptions,
  type CustomerColorImageRow,
} from "../../../lib/api/products";
import { variantRowsFromProductMatrix, sumVariantMatrixStock } from "../../../lib/productVariantStock";
import { VariantStockEditor, type VariantColorRow } from "../VariantStockEditor";
import { getBrands, Brand } from "../../../lib/api/brands";
import { getCategories, Category } from "../../../lib/api/categories";
import { importProductImages } from "../../../lib/api/legacyImport";
import { getImageUrl, isApiHostedMediaSrc, shouldBypassNextImageOptimization } from "../../../lib/api/config";
import "../product-form.tw.css";
import { ProductFormLayout } from "../form/ProductFormLayout";
import { AccordionSection } from "../form/AccordionSection";
import { TwFloatingInput, TwFloatingTextarea } from "../form/FloatingFields";
import { DescriptionModal } from "../form/DescriptionModal";
import { ThumbnailDropZone, GalleryDropZone } from "../form/ImageUploadBlocks";
import { PresetSizeToggles } from "../form/PresetSizeToggles";

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
  const [descOpen, setDescOpen] = useState(false);
  const [existingThumbUrl, setExistingThumbUrl] = useState<string | null>(null);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);

  const [acc, setAcc] = useState({
    images: true,
    basic: true,
    variants: false,
    seo: false,
  });

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
  /** Galeri ProductMedia id’leri — renk görseli seçimi için (kayıtlı ürün). */
  const [galleryMediaOptions, setGalleryMediaOptions] = useState<{ id: number; preview: string }[]>([]);
  /** Varyasyon renk adı → galeri görseli id */
  const [colorImageAssignments, setColorImageAssignments] = useState<CustomerColorImageRow[]>([]);

  const sizeLabels = useMemo(() => {
    const raw = typeof formData.customerSizeOptions === "string" ? formData.customerSizeOptions : "";
    const p = parseCustomerOptions(raw);
    return p.length > 0 ? p : ["Standart", "XS", "S", "M", "L", "XL", "XXL"];
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
        const [brandsData, categoriesData] = await Promise.all([getBrands(), getCategories()]);
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
          if (cat) mainId = cat.parentId ?? firstCatId;
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
        setExistingThumbUrl(product.thumbnailImageUrl ? getImageUrl(product.thumbnailImageUrl) : null);
        const g =
          product.productImages?.map((im) =>
            getImageUrl(im.mediaUrl || im.originalUrl || im.imageUrl || "")
          ) ?? [];
        setExistingGalleryUrls(g.filter(Boolean));

        const sizeOptStr =
          product.customerSizeOptions == null
            ? ""
            : Array.isArray(product.customerSizeOptions)
              ? product.customerSizeOptions.join(", ")
              : String(product.customerSizeOptions);
        const parsedSizes = parseCustomerOptions(sizeOptStr);
        const sizeListForRows =
          parsedSizes.length > 0 ? parsedSizes : ["Standart", "XS", "S", "M", "L", "XL", "XXL"];
        const vr = variantRowsFromProductMatrix(product, sizeListForRows);
        setVariantRows(vr);
        const apiRows = product.customerColorImages ?? [];
        const apiMap = new Map<string, number | null>();
        for (const r of apiRows) {
          const key = String(r.color ?? "").trim().toLowerCase();
          if (!key) continue;
          apiMap.set(key, r.mediaId != null && r.mediaId > 0 ? r.mediaId : null);
        }
        setColorImageAssignments(
          vr
            .map((r) => r.name.trim())
            .filter(Boolean)
            .map((name) => ({ color: name, mediaId: apiMap.get(name.toLowerCase()) ?? null }))
        );
        setGalleryMediaOptions(
          (product.productImages ?? [])
            .filter((im) => typeof im.id === "number" && im.id > 0)
            .map((im) => ({
              id: im.id!,
              preview: getImageUrl(im.mediaUrl || im.originalUrl || im.imageUrl || ""),
            }))
        );
      }
      setFetching(false);
    };
    fetchData();
  }, [id, isCreateMode]);

  const handleVariantRowsChange = (rows: VariantColorRow[]) => {
    setVariantRows(rows);
    setColorImageAssignments((prev) => {
      const prevMap = new Map(prev.map((x) => [x.color.trim().toLowerCase(), x.mediaId]));
      return rows
        .map((r) => r.name.trim())
        .filter(Boolean)
        .map((name) => ({ color: name, mediaId: prevMap.get(name.toLowerCase()) ?? null }));
    });
  };

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
    } else if (
      name === "price" ||
      name === "oldPrice" ||
      name === "specialPrice"
    ) {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleAcc = (k: keyof typeof acc) => setAcc((p) => ({ ...p, [k]: !p[k] }));

  const completeImages =
    Boolean(thumbnailImage || productImages.length > 0) ||
    Boolean(existingThumbUrl || existingGalleryUrls.length > 0);
  const completeBasic =
    Boolean((formData.name || "").trim()) && Number(formData.price) > 0;
  const completeVariants =
    variantRows.length === 0 || variantRows.every((r) => r.name.trim().length > 0);
  const completeSeo =
    Boolean((formData.metaTitle || "").trim()) ||
    Boolean((formData.metaKeywords || "").trim()) ||
    Boolean((formData.metaDescription || "").trim());

  const handleImportProductImages = async () => {
    if (!id || isCreateMode) return;
    setImportingImages(true);
    const res = await importProductImages(id);
    setImportingImages(false);
    if (res.success) {
      alert("Görseller productImages klasöründen içe aktarıldı.");
      window.location.reload();
    } else {
      alert(res.error || "Görsel içe aktarma başarısız.");
    }
  };

  const handleDelete = async () => {
    if (!id || isCreateMode) return;
    if (!confirm("Bu ürünü kalıcı olarak silmek istediğinize emin misiniz?")) return;
    const ok = await deleteProduct(id);
    if (ok) {
      router.push("/admin/products");
    } else {
      alert("Ürün silinemedi.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const namedVariants = variantRows.filter((r) => r.name.trim());
      const stockQuantity =
        namedVariants.length > 0
          ? sumVariantMatrixStock(namedVariants, sizeLabels)
          : formData.stockQuantity ?? 0;
      const payload: Partial<Product> = {
        ...formData,
        stockQuantity,
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
        customerColorImages: colorImageAssignments.filter((r) => r.color.trim()),
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
      <div className="tw-flex tw-justify-center tw-py-16">
        <div className="spinner-border text-secondary" role="status" />
      </div>
    );
  }

  if (!isCreateMode && !formData.name && !fetching) {
    return (
      <div className="tw-rounded-2xl tw-border tw-border-stone-200 tw-bg-white tw-p-6 tw-shadow-sm">
        <p className="tw-mb-4 tw-text-stone-600">Ürün bulunamadı.</p>
        <Link href="/admin/products" className="btn btn-secondary">
          Listeye dön
        </Link>
      </div>
    );
  }

  const title = isCreateMode ? "Yeni Ürün" : "Ürünü Düzenle";
  const imgUnopt = (src: string) =>
    isApiHostedMediaSrc(src) || shouldBypassNextImageOptimization(src);

  return (
    <>
      <ProductFormLayout
        title={title}
        backHref="/admin/products"
        submitLabel="Ürünü Kaydet"
        loading={loading}
        onSubmit={handleSubmit}
      >
        <AccordionSection
          title="Görseller"
          open={acc.images}
          onToggle={() => toggleAcc("images")}
          complete={completeImages}
        >
          <div className="tw-space-y-8">
            {!isCreateMode && (existingThumbUrl || existingGalleryUrls.length > 0) ? (
              <div>
                <p className="tw-mb-2 tw-text-sm tw-font-medium tw-text-stone-600">Mevcut görseller</p>
                <div className="tw-flex tw-gap-3 tw-overflow-x-auto tw-pb-2">
                  {existingThumbUrl ? (
                    <div className="tw-relative tw-h-24 tw-w-24 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-2xl tw-border tw-border-stone-200">
                      <Image
                        src={existingThumbUrl}
                        alt="Kapak"
                        fill
                        className="tw-object-cover"
                        unoptimized={imgUnopt(existingThumbUrl)}
                      />
                    </div>
                  ) : null}
                  {existingGalleryUrls.map((u, i) => (
                    <div
                      key={`${u}-${i}`}
                      className="tw-relative tw-h-24 tw-w-24 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-2xl tw-border tw-border-stone-200"
                    >
                      <Image
                        src={u}
                        alt=""
                        fill
                        className="tw-object-cover"
                        unoptimized={imgUnopt(u)}
                      />
                    </div>
                  ))}
                </div>
                <p className="tw-mt-2 tw-text-xs tw-text-stone-500">
                  Yeni dosya yüklerseniz sunucu mevcut görselleri güncellemek üzere kaydeder.
                </p>
              </div>
            ) : null}
            <ThumbnailDropZone
              label={isCreateMode ? "Kapak (thumbnail)" : "Yeni kapak görseli (isteğe bağlı)"}
              file={thumbnailImage}
              onPick={setThumbnailImage}
              onClear={() => setThumbnailImage(null)}
            />
            <GalleryDropZone
              files={productImages}
              onAdd={(files) => setProductImages((prev) => [...prev, ...files])}
              onRemoveAt={(i) => setProductImages((prev) => prev.filter((_, j) => j !== i))}
            />
            {!isCreateMode && id ? (
              <div>
                <button
                  type="button"
                  onClick={handleImportProductImages}
                  disabled={importingImages}
                  className="tw-inline-flex tw-min-h-[44px] tw-items-center tw-rounded-xl tw-border tw-border-stone-300 tw-bg-white tw-px-4 tw-text-sm tw-font-medium tw-text-stone-700 tw-transition hover:tw-bg-stone-50 disabled:tw-opacity-50"
                >
                  {importingImages ? "İçe aktarılıyor…" : "productImages klasöründen içe aktar"}
                </button>
                <p className="tw-mt-1 tw-text-xs tw-text-stone-500">
                  productImages/{id}/ içindeki dosyaları ürüne ekler.
                </p>
              </div>
            ) : null}
          </div>
        </AccordionSection>

        <AccordionSection
          title="Temel Bilgiler"
          open={acc.basic}
          onToggle={() => toggleAcc("basic")}
          complete={completeBasic}
        >
          <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
            <TwFloatingInput
              id="ed-name"
              name="name"
              label="Ürün adı *"
              value={formData.name ?? ""}
              onChange={handleInputChange}
              required
            />
            <TwFloatingInput
              id="ed-slug"
              name="slug"
              label="Slug"
              value={formData.slug ?? ""}
              onChange={handleInputChange}
            />
            <TwFloatingInput
              id="ed-sku"
              name="sku"
              label="SKU"
              value={formData.sku ?? ""}
              onChange={handleInputChange}
            />
            <TwFloatingInput
              id="ed-gtin"
              name="gtin"
              label="GTIN / Barkod"
              value={formData.gtin ?? ""}
              onChange={handleInputChange}
            />
            <div className="md:tw-col-span-2">
              <TwFloatingTextarea
                id="ed-short"
                name="shortDescription"
                label="Ön yazı (ONYAZI)"
                rows={3}
                value={formData.shortDescription ?? ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="md:tw-col-span-2">
              <button
                type="button"
                onClick={() => setDescOpen(true)}
                className="tw-flex tw-min-h-[48px] tw-w-full tw-items-center tw-justify-between tw-rounded-2xl tw-border tw-border-stone-200 tw-bg-white tw-px-4 tw-text-left tw-text-sm tw-font-medium tw-text-stone-700 tw-shadow-sm tw-transition hover:tw-border-lavinia-sage"
              >
                <span>
                  Açıklama (ACIKLAMA)
                  {(formData.description || "").trim() ? (
                    <span className="tw-ml-2 tw-text-xs tw-font-normal tw-text-lavinia-sage">
                      · Düzenlendi
                    </span>
                  ) : (
                    <span className="tw-ml-2 tw-text-xs tw-font-normal tw-text-stone-400">
                      · Tam ekran yaz
                    </span>
                  )}
                </span>
                <span aria-hidden>→</span>
              </button>
            </div>
            <div className="md:tw-col-span-2">
              <TwFloatingTextarea
                id="ed-spec"
                name="specification"
                label="Özellikler"
                rows={4}
                value={formData.specification ?? ""}
                onChange={handleInputChange}
              />
            </div>
            <TwFloatingInput
              id="ed-price"
              name="price"
              label="Satış fiyatı *"
              type="text"
              inputMode="decimal"
              value={formData.price === 0 ? "" : String(formData.price)}
              onChange={(e) => {
                const v = e.target.value.replace(",", ".");
                setFormData((p) => ({ ...p, price: parseFloat(v) || 0 }));
              }}
              required
            />
            <TwFloatingInput
              id="ed-old"
              name="oldPrice"
              label="Piyasa fiyatı"
              type="text"
              inputMode="decimal"
              value={formData.oldPrice === 0 ? "" : String(formData.oldPrice)}
              onChange={(e) => {
                const v = e.target.value.replace(",", ".");
                setFormData((p) => ({ ...p, oldPrice: parseFloat(v) || 0 }));
              }}
            />
            <TwFloatingInput
              id="ed-sp"
              name="specialPrice"
              label="İndirimli fiyat"
              type="text"
              inputMode="decimal"
              value={formData.specialPrice === 0 ? "" : String(formData.specialPrice)}
              onChange={(e) => {
                const v = e.target.value.replace(",", ".");
                setFormData((p) => ({ ...p, specialPrice: parseFloat(v) || 0 }));
              }}
            />
            <div>
              <label className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-stone-600">
                İndirim başlangıcı
              </label>
              <input
                type="date"
                name="specialPriceStart"
                className="tw-block tw-w-full tw-min-h-[48px] tw-rounded-2xl tw-border tw-border-stone-200 tw-bg-white tw-px-3 tw-outline-none focus:tw-ring-2 focus:tw-ring-lavinia-sage/25"
                value={formData.specialPriceStart || ""}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-stone-600">
                İndirim bitişi
              </label>
              <input
                type="date"
                name="specialPriceEnd"
                className="tw-block tw-w-full tw-min-h-[48px] tw-rounded-2xl tw-border tw-border-stone-200 tw-bg-white tw-px-3 tw-outline-none focus:tw-ring-2 focus:tw-ring-lavinia-sage/25"
                value={formData.specialPriceEnd || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="tw-flex tw-min-h-[48px] tw-items-center tw-gap-3 md:tw-col-span-2">
              <input
                className="tw-h-5 tw-w-5 tw-shrink-0 tw-rounded tw-border-stone-300"
                type="checkbox"
                name="isCallForPricing"
                id="editIsCallForPricing"
                checked={formData.isCallForPricing}
                onChange={handleInputChange}
              />
              <label className="tw-mb-0 tw-cursor-pointer tw-text-sm" htmlFor="editIsCallForPricing">
                Fiyat için arayın
              </label>
            </div>
            <div>
              <label className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-stone-600">Marka</label>
              <select
                className="tw-block tw-w-full tw-min-h-[48px] tw-rounded-2xl tw-border tw-border-stone-200 tw-bg-white tw-px-3 tw-outline-none focus:tw-ring-2 focus:tw-ring-lavinia-sage/25"
                name="brandId"
                value={formData.brandId ?? ""}
                onChange={handleInputChange}
              >
                <option value="">Marka seçin</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-stone-600">Ana kategori</label>
              <select
                className="tw-block tw-w-full tw-min-h-[48px] tw-rounded-2xl tw-border tw-border-stone-200 tw-bg-white tw-px-3 tw-outline-none focus:tw-ring-2 focus:tw-ring-lavinia-sage/25"
                name="mainCategoryId"
                value={selectedMainCategoryId ?? ""}
                onChange={handleInputChange}
              >
                <option value="">Seçin</option>
                {categories
                  .filter((c) => !c.parentId)
                  .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-stone-600">Alt kategori</label>
              <select
                className="tw-block tw-w-full tw-min-h-[48px] tw-rounded-2xl tw-border tw-border-stone-200 tw-bg-white tw-px-3 tw-outline-none focus:tw-ring-2 focus:tw-ring-lavinia-sage/25"
                name="subCategoryId"
                value={formData.categoryIds?.[0] ?? ""}
                onChange={handleInputChange}
              >
                <option value="">
                  {selectedMainCategoryId ? "Alt kategori (isteğe bağlı)" : "Önce ana kategori"}
                </option>
                {selectedMainCategoryId &&
                  (() => {
                    const subs = categories
                      .filter((c) => c.parentId === selectedMainCategoryId)
                      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
                    const mainCat = categories.find((c) => c.id === selectedMainCategoryId);
                    if (subs.length === 0 && mainCat) {
                      return (
                        <option value={selectedMainCategoryId}>{mainCat.name} (ana)</option>
                      );
                    }
                    return subs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ));
                  })()}
              </select>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          title="Varyasyon & Stok"
          open={acc.variants}
          onToggle={() => toggleAcc("variants")}
          complete={completeVariants}
        >
          <div className="tw-grid tw-w-full tw-min-w-0 tw-max-w-full tw-grid-cols-1 tw-gap-4">
            <PresetSizeToggles
              value={typeof formData.customerSizeOptions === "string" ? formData.customerSizeOptions : ""}
              onChange={(v) => setFormData((p) => ({ ...p, customerSizeOptions: v }))}
            />
            <VariantStockEditor sizeLabels={sizeLabels} rows={variantRows} onChange={handleVariantRowsChange} />
            <div className="tw-w-full tw-min-w-0 tw-rounded-md tw-border tw-border-stone-200 tw-bg-white tw-p-3 sm:tw-p-4">
              <p className="tw-mb-1 tw-text-sm tw-font-semibold tw-text-stone-900">Renk görselleri (mağaza)</p>
              <p className="tw-mb-3 tw-text-xs tw-leading-relaxed tw-text-stone-600">
                Her varyasyon rengine ürün galerisindeki bir görseli bağlayın; müşteri o rengi seçince vitrin büyük
                görseli bu URL ile güncellenebilir.
              </p>
              {isCreateMode ? (
                <p className="tw-text-xs tw-text-amber-800">
                  Yeni üründe galeri kaydı oluşmadan önce görsel id’leri yoktur — önce ürünü kaydedip tekrar
                  düzenleyerek atama yapın.
                </p>
              ) : galleryMediaOptions.length === 0 ? (
                <p className="tw-text-xs tw-text-stone-500">
                  Galeri görseli yok. Görseller bölümünden dosya yükleyin veya klasörden içe aktarın.
                </p>
              ) : colorImageAssignments.length === 0 ? (
                <p className="tw-text-xs tw-text-stone-500">Önce yukarıdan en az bir renk ekleyin.</p>
              ) : (
                <div className="tw-w-full tw-min-w-0 tw-space-y-4">
                  {colorImageAssignments.map((row) => {
                    const key = row.color.trim().toLowerCase();
                    const setMediaForRow = (mediaId: number | null) => {
                      setColorImageAssignments((prev) =>
                        prev.map((x) =>
                          x.color.trim().toLowerCase() === key ? { ...x, mediaId } : x
                        )
                      );
                    };
                    return (
                      <div
                        key={row.color}
                        className="tw-w-full tw-min-w-0 tw-rounded-xl tw-border tw-border-stone-200 tw-bg-white tw-p-3 sm:tw-p-4"
                      >
                        <p className="tw-mb-3 tw-text-sm tw-font-semibold tw-text-stone-900">{row.color}</p>
                        <div
                          className="tw-grid tw-w-full tw-min-w-0 tw-gap-2 sm:tw-gap-3"
                          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(4.25rem, 1fr))" }}
                          role="group"
                          aria-label={`${row.color} için galeri görseli`}
                        >
                          <button
                            type="button"
                            onClick={() => setMediaForRow(null)}
                            title="Görsel bağlama"
                            aria-pressed={row.mediaId == null}
                            className={`tw-flex tw-aspect-square tw-w-full tw-min-h-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-2 tw-px-1 tw-text-xs tw-font-medium tw-transition sm:tw-px-2 sm:tw-text-sm ${
                              row.mediaId == null
                                ? "tw-border-stone-900 tw-bg-stone-900 tw-text-white"
                                : "tw-border-stone-200 tw-bg-stone-50 tw-text-stone-700 hover:tw-border-stone-300 hover:tw-bg-white"
                            }`}
                          >
                            Yok
                          </button>
                          {galleryMediaOptions.map((g) => {
                            const selected = row.mediaId === g.id;
                            return (
                              <button
                                type="button"
                                key={g.id}
                                onClick={() => setMediaForRow(g.id)}
                                title={`Galeri #${g.id}`}
                                aria-pressed={selected}
                                className={`tw-relative tw-aspect-square tw-w-full tw-min-h-0 tw-overflow-hidden tw-rounded-lg tw-transition ${
                                  selected
                                    ? "tw-z-[1] tw-border-2 tw-border-yellow-400 tw-ring-2 tw-ring-yellow-400 tw-ring-offset-2"
                                    : "tw-border-2 tw-border-transparent tw-ring-1 tw-ring-stone-200 hover:tw-ring-stone-400"
                                }`}
                              >
                                <Image
                                  src={g.preview}
                                  alt=""
                                  fill
                                  className="tw-object-cover"
                                  sizes="(max-width: 640px) 22vw, 100px"
                                  unoptimized={imgUnopt(g.preview)}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          title="SEO / Diğer"
          open={acc.seo}
          onToggle={() => toggleAcc("seo")}
          complete={completeSeo}
        >
          <div className="tw-grid tw-grid-cols-1 tw-gap-4">
            <TwFloatingInput
              id="ed-mt"
              name="metaTitle"
              label="Meta başlık"
              value={formData.metaTitle ?? ""}
              onChange={handleInputChange}
            />
            <TwFloatingInput
              id="ed-mk"
              name="metaKeywords"
              label="Meta anahtar kelimeler"
              value={formData.metaKeywords ?? ""}
              onChange={handleInputChange}
            />
            <TwFloatingTextarea
              id="ed-md"
              name="metaDescription"
              label="Meta açıklama"
              rows={3}
              value={formData.metaDescription ?? ""}
              onChange={handleInputChange}
            />
            <div className="tw-flex tw-min-h-[48px] tw-flex-col tw-gap-4 tw-rounded-2xl tw-border tw-border-stone-100 tw-bg-stone-50/60 tw-p-4">
              <div className="tw-flex tw-items-center tw-gap-3">
                <input
                  className="tw-h-5 tw-w-5 tw-shrink-0 tw-rounded tw-border-stone-300"
                  type="checkbox"
                  name="isPublished"
                  id="editIsPublished"
                  checked={formData.isPublished}
                  onChange={handleInputChange}
                />
                <label className="tw-mb-0 tw-cursor-pointer tw-text-sm" htmlFor="editIsPublished">
                  Ürün yayında
                </label>
              </div>
              <div className="tw-flex tw-items-center tw-gap-3">
                <input
                  className="tw-h-5 tw-w-5 tw-shrink-0 tw-rounded tw-border-stone-300"
                  type="checkbox"
                  name="isFeatured"
                  id="editIsFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                />
                <label className="tw-mb-0 tw-cursor-pointer tw-text-sm" htmlFor="editIsFeatured">
                  Vitrinde göster
                </label>
              </div>
            </div>
          </div>
        </AccordionSection>

        {!isCreateMode && id ? (
          <div className="tw-mb-4 tw-rounded-md tw-border tw-border-red-200 tw-bg-red-50/50 tw-p-4">
            <p className="tw-mb-1 tw-text-sm tw-font-semibold tw-text-red-950">Tehlikeli alan</p>
            <p className="tw-mb-3 tw-text-xs tw-leading-relaxed tw-text-red-900/85">
              Ürünü silmek bu kaydı ve bağlantılarını kaldırır. Bu işlem geri alınamaz.
            </p>
            <button
              type="button"
              onClick={handleDelete}
              className="tw-inline-flex tw-min-h-[44px] tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-red-400 tw-bg-white tw-px-4 tw-text-sm tw-font-semibold tw-text-red-800 tw-shadow-sm tw-transition hover:tw-bg-red-50"
            >
              Ürünü sil
            </button>
          </div>
        ) : null}
      </ProductFormLayout>

      <DescriptionModal
        open={descOpen}
        value={formData.description ?? ""}
        onChange={(v) => setFormData((p) => ({ ...p, description: v }))}
        onClose={() => setDescOpen(false)}
      />
    </>
  );
}
