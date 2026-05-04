// @ts-nocheck
"use client";

import SvgSprite from "../../components/SvgSprite";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProductCarousel from "../../components/ProductCarousel";
import ShortDescription from "../../components/ShortDescription";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { getProduct, getProductsGrid, getProductLocalImages, getProductLocalImageUrl, Product, parseCustomerOptions } from "../../lib/api/products";
import { getImageUrl } from "../../lib/api/config";
import { addToCart } from "../../lib/api/cart";
import { getProductReviews, ProductReviewsResponse } from "../../lib/api/reviews";
import { colorsInStockForSize, sizesInStockForColor, stockAtMatrix } from "../../lib/productVariantStock";

type GallerySlide = { preview: string; full: string; key: string };

function normColorLabel(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const productId = parseInt(id, 10);
  const [product, setProduct] = useState<Product | null>(null);
  const [localImageUrls, setLocalImageUrls] = useState<Array<{ imageUrl: string }>>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [cartMessageType, setCartMessageType] = useState<'success' | 'error'>('success');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  /** Ana görsel: tam çözünürlük (`originalUrl`); şerit: küçük (`mediaUrl` / thumb). Yerel `productImages/` için aynı URL. */
  const galleryItems = useMemo((): GallerySlide[] => {
    if (!product) return [];
    const imgs =
      (product as any).productImages ??
      (product as any).ProductImages;
    if (Array.isArray(imgs) && imgs.length > 0) {
      return imgs
        .map((img: any, index: number) => {
          const fullRaw =
            img.originalUrl ??
            img.OriginalUrl ??
            img.imageUrl ??
            img.ImageUrl ??
            img.mediaUrl ??
            img.MediaUrl ??
            product.thumbnailImageUrl;
          const previewRaw =
            img.mediaUrl ??
            img.MediaUrl ??
            img.originalUrl ??
            img.OriginalUrl ??
            img.imageUrl ??
            img.ImageUrl ??
            product.thumbnailImageUrl;
          if (!fullRaw) return null;
          const idPart = img.id ?? img.Id ?? index;
          return {
            full: String(fullRaw),
            preview: String(previewRaw || fullRaw),
            key: `m-${idPart}-${index}`,
          };
        })
        .filter(Boolean) as GallerySlide[];
    }
    return localImageUrls
      .map((x) => x.imageUrl)
      .filter(Boolean)
      .map((url, index) => ({
        full: String(url),
        preview: String(url),
        key: `local-${index}`,
      }));
  }, [product, localImageUrls]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [productId]);

  useEffect(() => {
    if (galleryItems.length > 0 && activeImageIndex >= galleryItems.length) {
      setActiveImageIndex(0);
    }
  }, [galleryItems, activeImageIndex]);

  const sizeList = useMemo(() => {
    if (!product) return [];
    const s = parseCustomerOptions(product.customerSizeOptions);
    return s.length > 0 ? s : ["Stok", "XS", "S", "M", "L", "XL", "XXL"];
  }, [product]);

  const hasMatrix = !!(product?.customerVariantStock?.colors?.length);

  const colorsForUi = useMemo(() => {
    if (!product) return [];
    if (hasMatrix && product.customerVariantStock) {
      return product.customerVariantStock.colors
        .map((c) => c.name)
        .filter((n) => n && String(n).trim());
    }
    return parseCustomerOptions(product.customerColorOptions);
  }, [product, hasMatrix]);

  const sizesForUi = useMemo(() => {
    if (!product) return sizeList;
    if (!hasMatrix || !product.customerVariantStock) return sizeList;
    return sizeList;
  }, [product, hasMatrix, sizeList]);

  const lineStock = useMemo((): number | null => {
    if (!product || !product.stockTrackingIsEnabled) return null;
    if (hasMatrix && product.customerVariantStock) {
      if (!selectedSize?.trim() || !selectedColor?.trim()) return 0;
      return stockAtMatrix(product.customerVariantStock, selectedColor, selectedSize);
    }
    return product.stockQuantity ?? 0;
  }, [product, hasMatrix, selectedSize, selectedColor]);

  /** Renk için admin’de bağlanan vitrin görseli (matris satırı veya legacy CustomerColorImages). */
  const colorHeroUrl = useMemo((): string | null => {
    if (!product || !selectedColor?.trim()) return null;
    const nk = normColorLabel(selectedColor);
    if (hasMatrix && product.customerVariantStock?.colors?.length) {
      const row = product.customerVariantStock.colors.find((x) => normColorLabel(x.name) === nk);
      const raw = row?.imageUrl;
      if (typeof raw === "string" && raw.trim()) return getImageUrl(raw.trim());
    }
    const cci =
      (product as any).customerColorImages ?? (product as any).CustomerColorImages;
    if (Array.isArray(cci)) {
      const hit = cci.find((x: any) => normColorLabel(String(x?.color ?? x?.Color ?? "")) === nk);
      const url = hit?.imageUrl ?? hit?.ImageUrl;
      if (typeof url === "string" && url.trim()) return getImageUrl(url.trim());
    }
    return null;
  }, [product, selectedColor, hasMatrix]);

  useEffect(() => {
    if (!product?.customerVariantStock?.colors?.length) return;
    const m = product.customerVariantStock;
    const cOk = colorsInStockForSize(m, selectedSize);
    const sOk = sizesInStockForColor(m, selectedColor, sizeList);

    if (selectedSize && cOk.length === 0) {
      const sz = sizeList.find((s) => colorsInStockForSize(m, s).length > 0);
      if (sz) {
        setSelectedSize(sz);
        const cols = colorsInStockForSize(m, sz);
        if (cols[0]) setSelectedColor(cols[0]);
      }
      return;
    }

    if (selectedColor?.trim() && selectedSize?.trim()) {
      if (sOk.length > 0 && !sOk.includes(selectedSize)) {
        setSelectedSize(sOk[0]);
        return;
      }
    }

    if (selectedSize?.trim() && selectedColor?.trim() && cOk.length > 0 && !cOk.includes(selectedColor)) {
      setSelectedColor(cOk[0]);
    }
  }, [product, selectedSize, selectedColor, sizeList]);

  useEffect(() => {
    if (lineStock == null || lineStock < 0) return;
    if (quantity > lineStock) setQuantity(Math.max(1, lineStock));
  }, [lineStock, quantity]);

  const handleAddToCart = async () => {
    if (!product) return;
    const legacyColors = parseCustomerOptions(product.customerColorOptions);
    const matrixColorCount = product.customerVariantStock?.colors?.length ?? 0;
    const needsColor = matrixColorCount > 0 || legacyColors.length > 0;
    if (needsColor && !selectedColor) {
      setCartMessageType("error");
      setCartMessage("Lütfen bir renk seçin.");
      return;
    }
    setAddingToCart(true);
    setCartMessage(null);
    const result = await addToCart(
      product.id,
      quantity,
      selectedSize || undefined,
      needsColor ? selectedColor : undefined
    );
    if (result.success) {
      setCartMessageType('success');
      setCartMessage("Ürün sepete eklendi!");
      setTimeout(() => setCartMessage(null), 3000);
    } else {
      setCartMessageType('error');
      setCartMessage(result.error || "Sepete eklenemedi. Lütfen giriş yapın.");
    }
    setAddingToCart(false);
  };

  useEffect(() => {
    const preloader = document.querySelector(".preloader");
    if (preloader) {
      preloader.classList.add("loaded");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      try {
        const productData = await getProduct(productId);

        if (!isMounted) return;

        setProduct(productData);

        const sizes = parseCustomerOptions(productData?.customerSizeOptions);
        const colors = parseCustomerOptions(productData?.customerColorOptions);
        const defaultSizes = ["Stok", "XS", "S", "M", "L", "XL", "XXL"];
        const szList = sizes.length > 0 ? sizes : defaultSizes;
        const mtx = productData?.customerVariantStock;
        if (mtx?.colors?.length) {
          const firstSize = szList.find((sz) => colorsInStockForSize(mtx, sz).length > 0) || szList[0] || "";
          setSelectedSize(firstSize);
          const withStock = colorsInStockForSize(mtx, firstSize);
          setSelectedColor(withStock[0] || mtx.colors[0]?.name || "");
        } else {
          setSelectedSize(szList[0] || "");
          setSelectedColor(colors[0] || "");
        }

        const hasMediaImages = productData?.productImages && (productData.productImages as any[])?.length > 0;
        if (!hasMediaImages) {
          const localFiles = await getProductLocalImages(productId);
          if (localFiles.length > 0) {
            setLocalImageUrls(localFiles.map((f) => ({ imageUrl: getProductLocalImageUrl(productId, f) })));
          }
        }
        // Fetch reviews
        const reviewsData = await getProductReviews(productId);
        if (!isMounted) return;
        if (reviewsData) setReviews(reviewsData);

        // Fetch related products
        const relatedRes = await getProductsGrid({
          pageIndex: 0,
          pageSize: 6,
          sort: [{ field: "id", dir: "desc" }],
          filter: {
            logic: "and",
            filters: [
              { field: "isPublished", operator: "eq", value: true },
              { field: "id", operator: "neq", value: productId }
            ]
          }
        });

        if (!isMounted) return;

        if (relatedRes) {
          setRelatedProducts(relatedRes.data);
        }
      } catch (error: any) {
        if (!isMounted) return;
        // Only log if it's not a 401 (unauthorized) or 404 (not found) error
        if (error?.status !== 401 && error?.status !== 404 && error?.message?.includes('401') === false && error?.message?.includes('404') === false) {
        console.error("Error fetching product:", error);
        }
      } finally {
        if (isMounted) {
        setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  return (
    <>
      <SvgSprite />

      <div className="preloader text-white fs-6 text-uppercase overflow-hidden"></div>

      <div className="search-popup">
        <div className="search-popup-container">
          <form role="search" method="get" className="form-group" action="">
            <input
              type="search"
              id="search-form"
              className="form-control"
              placeholder="Arama yapın ve Enter'a basın"
              name="s"
            />
            <button type="submit" className="btn-close-search">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <use xlinkHref="#close"></use>
              </svg>
            </button>
          </form>
        </div>
      </div>

      <div
        className="offcanvas offcanvas-end"
        data-bs-scroll="true"
        tabIndex={-1}
        id="offcanvasCart"
        aria-labelledby="Sepet"
      >
        <div className="offcanvas-header justify-content-center">
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Kapat"
          ></button>
        </div>
        <div className="offcanvas-body">
          <div className="order-md-last">
            <h4 id="Sepet" className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-primary">Sepetiniz</span>
              <span className="badge bg-primary rounded-pill">0</span>
            </h4>
            <ul className="list-group mb-3">
              <li className="list-group-item d-flex justify-content-between">
                <span>Sepetiniz boş</span>
              </li>
            </ul>
            <button className="w-100 btn btn-primary btn-lg" type="submit">
              Ödemeye Devam Et
            </button>
          </div>
        </div>
      </div>

      <Navbar />

      {loading ? (
        <section className="single-product py-5">
          <div className="container text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
          </div>
        </section>
      ) : !product ? (
        <section className="single-product py-5">
          <div className="container text-center">
            <h2>Ürün bulunamadı</h2>
            <Link href="/urunler" className="btn btn-primary mt-3">
              Ürünlere Dön
            </Link>
          </div>
        </section>
      ) : (
        <section className="single-product py-5">
          <div className="container">
            <nav aria-label="breadcrumb" className="mb-4">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link href="/">Ana Sayfa</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/urunler">Ürünler</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {product.name}
                </li>
              </ol>
            </nav>

            <div className="row">
              <div className="col-md-6 mb-4">
                <div className="product-preview">
                  <div className="product-main-gallery product-main-stage mb-3 position-relative">
                    {(() => {
                      const galleryMainRaw =
                        galleryItems.length > 0
                          ? galleryItems[Math.min(activeImageIndex, galleryItems.length - 1)].full
                          : product.thumbnailImageUrl;
                      const mainSrc = colorHeroUrl ?? getImageUrl(galleryMainRaw);
                      return (
                        <>
                          <div className="d-block text-center bg-light position-relative">
                            <img
                              key={`main-${normColorLabel(selectedColor)}-${activeImageIndex}-${colorHeroUrl ? "c" : "g"}`}
                              src={mainSrc}
                              alt={product.name}
                              className="img-fluid"
                              style={{ width: "100%", maxHeight: "560px", objectFit: "contain" }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/images/product-item-1.jpg";
                              }}
                            />
                            <a
                              href={mainSrc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="small d-inline-block mt-2 mb-1"
                              title="Tam boyutta aç"
                            >
                              Tam boyutta aç
                            </a>
                          </div>
                          {galleryItems.length > 1 && (
                            <>
                              <button
                                type="button"
                                className="btn btn-light border position-absolute top-50 start-0 translate-middle-y ms-1"
                                style={{ zIndex: 3 }}
                                aria-label="Önceki görsel"
                                onClick={() =>
                                  setActiveImageIndex(
                                    (i) => (i - 1 + galleryItems.length) % galleryItems.length
                                  )
                                }
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                className="btn btn-light border position-absolute top-50 end-0 translate-middle-y me-1"
                                style={{ zIndex: 3 }}
                                aria-label="Sonraki görsel"
                                onClick={() =>
                                  setActiveImageIndex((i) => (i + 1) % galleryItems.length)
                                }
                              >
                                ›
                              </button>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  {galleryItems.length > 1 && (
                    <div className="product-thumb-strip d-flex flex-wrap gap-2 justify-content-center align-items-center">
                      {galleryItems.map((slide, idx) => {
                        const thumbSrc = getImageUrl(slide.preview);
                        return (
                          <button
                            key={slide.key}
                            type="button"
                            className={`p-1 border bg-white rounded-0 ${idx === activeImageIndex ? "border-dark border-2" : "border-secondary"}`}
                            onClick={() => setActiveImageIndex(idx)}
                            aria-label={`Görsel ${idx + 1}`}
                            aria-current={idx === activeImageIndex ? "true" : undefined}
                            style={{ width: 88, height: 88, flex: "0 0 auto", overflow: "hidden", position: "relative" }}
                          >
                            <img
                              src={thumbSrc}
                              alt=""
                              width={84}
                              height={84}
                              className="img-fluid"
                              loading="lazy"
                              decoding="async"
                              draggable={false}
                              style={{
                                objectFit: "contain",
                                width: "100%",
                                height: "100%",
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/images/product-item-1.jpg";
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-md-6">
                <div className="product-info">
                  <h1 className="element-title text-uppercase mb-3">{product.name}</h1>

                  {(() => {
                    const c = product.calculatedProductPrice;
                    const eff = c?.price ?? product.price;
                    const old = c?.oldPrice;
                    const pct = c?.percentOfSaving;
                    const show = old != null && old > eff;
                    return (
                      <div className="product-price mb-4">
                        {show ? (
                          <>
                            <span className="badge bg-success me-2">
                              %{pct && pct > 0 ? pct : Math.round((1 - eff / old) * 100)} İndirim
                            </span>
                            <del className="text-muted me-2">₺{old.toFixed(2)}</del>
                            <strong className="text-danger fs-4">₺{Number(eff).toFixed(2)}</strong>
                          </>
                        ) : (
                          <strong>
                            {eff != null && eff > 0
                              ? `₺${Number(eff).toFixed(2)}`
                              : "Fiyat Belirtilmemiş"}
                          </strong>
                        )}
                      </div>
                    );
                  })()}

                  {product.shortDescription && (
                    <ShortDescription content={product.shortDescription} />
                  )}
                  {product.description && (
                    <div className="mb-4" dangerouslySetInnerHTML={{ __html: product.description }} />
                  )}

                  <div className="product-choices mb-4">
                    <div className="mb-3">
                      <span className="d-block text-uppercase small fw-semibold mb-2" style={{ letterSpacing: "0.06em" }}>
                        Beden
                      </span>
                      <div className="d-flex flex-wrap gap-2" role="group" aria-label="Beden seçimi">
                        {sizesForUi.map((sz) => {
                          const m = product.customerVariantStock;
                          const qty =
                            hasMatrix && m && selectedColor
                              ? stockAtMatrix(m, selectedColor, sz)
                              : null;
                          const oos = hasMatrix && selectedColor != null && selectedColor !== "" && (qty ?? 0) < 1;
                          return (
                            <button
                              key={sz}
                              type="button"
                              className={`btn btn-sm rounded-0 px-3 py-2 ${selectedSize === sz ? "btn-dark" : "btn-outline-dark"}${oos ? " opacity-50" : ""}`}
                              disabled={oos}
                              title={oos ? "Bu bedende seçili renk için stok yok" : undefined}
                              onClick={() => {
                                if (oos) return;
                                setSelectedSize(sz);
                                if (hasMatrix && m && selectedColor) {
                                  const cols = colorsInStockForSize(m, sz);
                                  if (cols.length > 0 && !cols.includes(selectedColor)) {
                                    setSelectedColor(cols[0]);
                                  }
                                }
                              }}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {colorsForUi.length > 0 ? (
                      <div className="mb-1">
                        <span className="d-block text-uppercase small fw-semibold mb-2" style={{ letterSpacing: "0.06em" }}>
                          Renk
                        </span>
                        <div className="d-flex flex-wrap gap-2" role="group" aria-label="Renk seçimi">
                          {colorsForUi.map((c) => {
                            const m = product.customerVariantStock;
                            const qtyAtCurSize =
                              hasMatrix && m && selectedSize
                                ? stockAtMatrix(m, c, selectedSize)
                                : null;
                            const oosAtCurSize =
                              hasMatrix &&
                              m &&
                              selectedSize != null &&
                              selectedSize !== "" &&
                              (qtyAtCurSize ?? 0) < 1;
                            const availSizes =
                              hasMatrix && m ? sizesInStockForColor(m, c, sizeList) : null;
                            const fullyOos = hasMatrix && m && availSizes != null && availSizes.length === 0;
                            return (
                              <button
                                key={c}
                                type="button"
                                className={`btn btn-sm rounded-0 px-3 py-2 ${selectedColor === c ? "btn-dark" : "btn-outline-secondary border-dark"}${oosAtCurSize || fullyOos ? " opacity-50" : ""}`}
                                style={{ minWidth: "2.75rem" }}
                                disabled={!!fullyOos}
                                title={
                                  fullyOos
                                    ? "Bu renkte hiç stok yok"
                                    : oosAtCurSize
                                      ? "Seçili bedende stok yok; tıklayınca uygun beden seçilir"
                                      : undefined
                                }
                                onClick={() => {
                                  if (fullyOos) return;
                                  setSelectedColor(c);
                                  if (hasMatrix && m) {
                                    const avail = sizesInStockForColor(m, c, sizeList);
                                    if (avail.length > 0) {
                                      setSelectedSize((sz) => (avail.includes(sz) ? sz : avail[0]));
                                    }
                                  }
                                }}
                              >
                                {c}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="product-quantity mb-4">
                    <label className="d-block mb-2 text-uppercase">Adet:</label>
                    <div className="qty-number d-flex align-items-center">
                      <button
                        type="button"
                        className="quntity-button quantity-left-minus"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        min="1"
                        max={lineStock != null && lineStock > 0 ? lineStock : undefined}
                        value={quantity}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10) || 1;
                          const cap = lineStock != null && lineStock > 0 ? lineStock : Number.MAX_SAFE_INTEGER;
                          setQuantity(Math.min(cap, Math.max(1, n)));
                        }}
                        className="form-control text-center"
                      />
                      <button
                        type="button"
                        className="quntity-button quantity-right-plus"
                        onClick={() =>
                          setQuantity((q) =>
                            lineStock != null && lineStock > 0 ? Math.min(lineStock, q + 1) : q + 1
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="product-actions d-flex gap-3 mb-4">
                    <button 
                      className="btn btn-dark btn-lg text-uppercase flex-grow-1"
                      disabled={addingToCart || (lineStock != null && lineStock < 1)}
                      onClick={handleAddToCart}
                    >
                      {addingToCart
                        ? "Ekleniyor..."
                        : lineStock != null && lineStock < 1
                          ? "Stokta Yok"
                          : "Sepete Ekle"}
                    </button>
                    <button className="btn btn-outline-dark btn-lg">
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <use xlinkHref="#heart"></use>
                      </svg>
                    </button>
                  </div>
                  {cartMessage && (
                    <div className={`alert ${cartMessageType === 'success' ? "alert-success" : "alert-warning"} py-2`} role="alert">
                      {cartMessage}
                    </div>
                  )}

                  {product.stockTrackingIsEnabled && lineStock != null && (
                    <p className={lineStock > 0 ? "text-success mb-0" : "text-danger mb-0"}>
                      <strong>{lineStock > 0 ? "Stokta var" : "Stokta yok"}</strong>
                      {lineStock > 0 && ` (${lineStock} adet)`}
                    </p>
                  )}

                  {product.sku && (
                    <div className="product-meta mt-3">
                      <small className="text-muted">SKU: {product.sku}</small>
                    </div>
                  )}
              </div>
            </div>

            {/* Reviews section */}
            {reviews && (
              <div className="mt-5 pt-4 border-top">
                <h3 className="mb-4">Müşteri Değerlendirmeleri</h3>
                {reviews.reviewsCount > 0 ? (
                  <>
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div className="d-flex align-items-center">
                        <span className="fs-4 fw-bold">{reviews.ratingAverage?.toFixed(1) ?? "-"}</span>
                        <span className="text-warning ms-1">★</span>
                      </div>
                      <span className="text-muted">({reviews.reviewsCount} değerlendirme)</span>
                    </div>
                    <div className="review-list">
                      {reviews.items.map((r) => (
                        <div key={r.id} className="mb-4 p-3" style={{ border: "1px solid #e5e5e5" }}>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <span className="text-warning">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                            <strong>{r.reviewerName}</strong>
                            <small className="text-muted">{new Date(r.createdOn).toLocaleDateString("tr-TR")}</small>
                          </div>
                          {r.title && <div className="fw-medium">{r.title}</div>}
                          {r.comment && <div className="text-muted">{r.comment}</div>}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-muted">Henüz değerlendirme yapılmamış.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      {relatedProducts.length > 0 && (
        <ProductCarousel
          id="related-products"
          title="Beğenebileceğiniz Ürünler"
          products={relatedProducts.map((p) => ({
            id: p.id,
            img: getImageUrl(p.thumbnailImageUrl),
            title: p.name,
            price: p.price ? `₺${p.price.toFixed(2)}` : "Fiyat Belirtilmemiş",
          }))}
          additionalClassName="related-products"
        />
      )}

      <Footer />
    </>
  );
}
