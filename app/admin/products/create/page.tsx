"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createProduct, Product, parseCustomerOptions } from "../../../lib/api/products";
import { pickStockCaseInsensitive, sumVariantMatrixStock } from "../../../lib/productVariantStock";
import { VariantStockEditor, type VariantColorRow } from "../VariantStockEditor";
import { getBrands, Brand } from "../../../lib/api/brands";
import { getCategories, Category } from "../../../lib/api/categories";
import "../product-form.tw.css";
import { ProductFormLayout } from "../form/ProductFormLayout";
import { AccordionSection } from "../form/AccordionSection";
import {
  TwFloatingInput,
  TwFloatingTextarea,
} from "../form/FloatingFields";
import { DescriptionModal } from "../form/DescriptionModal";
import { ThumbnailDropZone, GalleryDropZone } from "../form/ImageUploadBlocks";
import { PresetSizeToggles } from "../form/PresetSizeToggles";
import { slugifyProductName } from "../../../lib/slugify";

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [descOpen, setDescOpen] = useState(false);
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
    return p.length > 0 ? p : ["Standart", "XS", "S", "M", "L", "XL", "XXL"];
  }, [formData.customerSizeOptions]);

  useEffect(() => {
    setVariantRows((prev) => {
      if (prev.length === 0) return prev;
      return prev.map((r) => ({
        name: r.name,
        stocks: Object.fromEntries(
          sizeLabels.map((s) => [s, pickStockCaseInsensitive(r.stocks, s)])
        ) as Record<string, number>,
      }));
    });
  }, [sizeLabels.join("|")]);

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
      const selectedIds = Array.from(select.selectedOptions).map((option) =>
        parseInt(option.value)
      );
      setFormData((prev) => ({ ...prev, categoryIds: selectedIds }));
    } else if (name === "name") {
      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: slugifyProductName(value),
      }));
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

  const toggleAcc = (k: keyof typeof acc) => {
    setAcc((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const completeImages = Boolean(thumbnailImage || productImages.length > 0);
  const completeBasic =
    Boolean((formData.name || "").trim()) &&
    Number(formData.price) > 0;
  const completeVariants =
    variantRows.length === 0 || variantRows.every((r) => r.name.trim().length > 0);
  const completeSeo =
    Boolean((formData.metaTitle || "").trim()) ||
    Boolean((formData.metaKeywords || "").trim()) ||
    Boolean((formData.metaDescription || "").trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const namedVariants = variantRows.filter((r) => r.name.trim());
      const stockQuantity =
        namedVariants.length > 0 ? sumVariantMatrixStock(namedVariants, sizeLabels) : 0;
      const productData: Partial<Product> = {
        ...formData,
        slug: slugifyProductName(formData.name ?? ""),
        stockQuantity,
        thumbnailImage: thumbnailImage || undefined,
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
            : undefined,
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
    <>
      <ProductFormLayout
        title="Yeni Ürün"
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
            <ThumbnailDropZone
              label="Kapak (thumbnail)"
              file={thumbnailImage}
              onPick={setThumbnailImage}
              onClear={() => setThumbnailImage(null)}
            />
            <GalleryDropZone
              files={productImages}
              onAdd={(files) => setProductImages((prev) => [...prev, ...files])}
              onRemoveAt={(i) =>
                setProductImages((prev) => prev.filter((_, j) => j !== i))
              }
            />
          </div>
        </AccordionSection>

        <AccordionSection
          title="Temel Bilgiler"
          open={acc.basic}
          onToggle={() => toggleAcc("basic")}
          complete={completeBasic}
        >
          <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
            <div className="md:tw-col-span-2">
              <TwFloatingInput
                id="pf-name"
                name="name"
                label="Ürün adı *"
                value={formData.name ?? ""}
                onChange={handleInputChange}
                required
              />
              {(formData.slug || "").trim() ? (
                <p className="tw-mt-1.5 tw-text-xs tw-text-stone-500">
                  Adres (otomatik): <span className="tw-font-mono tw-text-stone-700">{formData.slug}</span>
                </p>
              ) : null}
            </div>
            <TwFloatingInput
              id="pf-sku"
              name="sku"
              label="SKU"
              value={formData.sku ?? ""}
              onChange={handleInputChange}
            />
            <TwFloatingInput
              id="pf-gtin"
              name="gtin"
              label="GTIN / Barkod"
              value={formData.gtin ?? ""}
              onChange={handleInputChange}
            />
            <div className="md:tw-col-span-2">
              <TwFloatingTextarea
                id="pf-short"
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
                className="tw-flex tw-min-h-[48px] tw-w-full tw-items-center tw-justify-between tw-rounded-2xl tw-border tw-border-stone-200 tw-bg-white tw-px-4 tw-text-left tw-text-sm tw-font-medium tw-text-stone-700 tw-shadow-sm tw-transition hover:tw-border-lavinia-sage hover:tw-bg-lavinia-sage/5"
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
                id="pf-spec"
                name="specification"
                label="Özellikler"
                rows={4}
                value={formData.specification ?? ""}
                onChange={handleInputChange}
              />
            </div>
            <TwFloatingInput
              id="pf-price"
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
              id="pf-old"
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
              id="pf-special"
              name="specialPrice"
              label="Özel fiyat"
              type="text"
              inputMode="decimal"
              value={formData.specialPrice === 0 ? "" : String(formData.specialPrice)}
              onChange={(e) => {
                const v = e.target.value.replace(",", ".");
                setFormData((p) => ({ ...p, specialPrice: parseFloat(v) || 0 }));
              }}
            />
            <div className="tw-flex tw-min-h-[48px] tw-items-center tw-gap-3 md:tw-col-span-2">
              <input
                className="tw-h-5 tw-w-5 tw-shrink-0 tw-rounded tw-border-stone-300 tw-text-lavinia-sage focus:tw-ring-lavinia-sage"
                type="checkbox"
                name="isCallForPricing"
                id="createIsCallForPricing"
                checked={formData.isCallForPricing}
                onChange={handleInputChange}
              />
              <label
                className="tw-mb-0 tw-cursor-pointer tw-text-sm tw-text-stone-700"
                htmlFor="createIsCallForPricing"
              >
                Fiyat için arayın
              </label>
            </div>
            <div>
              <label className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-stone-600">
                Marka
              </label>
              <select
                className="tw-block tw-w-full tw-min-h-[48px] tw-rounded-2xl tw-border tw-border-stone-200 tw-bg-white tw-px-3 tw-text-base tw-outline-none focus:tw-ring-2 focus:tw-ring-lavinia-sage/25"
                name="brandId"
                value={formData.brandId || ""}
                onChange={handleInputChange}
              >
                <option value="">Marka seçin</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:tw-col-span-2">
              <label className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-stone-600">
                Kategoriler (çoklu)
              </label>
              <select
                className="tw-block tw-w-full tw-min-h-[12rem] tw-rounded-2xl tw-border tw-border-stone-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-outline-none focus:tw-ring-2 focus:tw-ring-lavinia-sage/25"
                name="categoryIds"
                multiple
                value={formData.categoryIds?.map(String) || []}
                onChange={handleInputChange}
                size={8}
              >
                {categories.map((category) => {
                  const parent = category.parentId
                    ? categories.find((c) => c.id === category.parentId)
                    : null;
                  const displayLabel = parent
                    ? `${parent.name} › ${category.name}`
                    : category.name;
                  return (
                    <option key={category.id} value={category.id}>
                      {displayLabel}
                    </option>
                  );
                })}
              </select>
              <p className="tw-mt-1 tw-text-xs tw-text-stone-500">
                Ctrl / Cmd ile birden fazla seçebilirsiniz.
              </p>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          title="Varyasyon & Stok"
          open={acc.variants}
          onToggle={() => toggleAcc("variants")}
          complete={completeVariants}
        >
          <div className="tw-grid tw-grid-cols-1 tw-gap-4">
            <PresetSizeToggles
              value={typeof formData.customerSizeOptions === "string" ? formData.customerSizeOptions : ""}
              onChange={(v) => setFormData((p) => ({ ...p, customerSizeOptions: v }))}
            />
            <VariantStockEditor
              sizeLabels={sizeLabels}
              rows={variantRows}
              onChange={setVariantRows}
            />
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
              id="pf-mt"
              name="metaTitle"
              label="Meta başlık"
              value={formData.metaTitle ?? ""}
              onChange={handleInputChange}
            />
            <TwFloatingInput
              id="pf-mk"
              name="metaKeywords"
              label="Meta anahtar kelimeler"
              value={formData.metaKeywords ?? ""}
              onChange={handleInputChange}
            />
            <TwFloatingTextarea
              id="pf-md"
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
                  id="createIsPublished"
                  checked={formData.isPublished}
                  onChange={handleInputChange}
                />
                <label className="tw-mb-0 tw-cursor-pointer tw-text-sm" htmlFor="createIsPublished">
                  Ürün yayında
                </label>
              </div>
              <div className="tw-flex tw-items-center tw-gap-3">
                <input
                  className="tw-h-5 tw-w-5 tw-shrink-0 tw-rounded tw-border-stone-300"
                  type="checkbox"
                  name="isFeatured"
                  id="createIsFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                />
                <label className="tw-mb-0 tw-cursor-pointer tw-text-sm" htmlFor="createIsFeatured">
                  Vitrinde göster
                </label>
              </div>
            </div>
          </div>
        </AccordionSection>
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
