// @ts-nocheck
"use client";

import React from "react";
import SvgSprite from "../../components/SvgSprite";
import SwiperInit from "../../components/SwiperInit";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProductCarousel from "../../components/ProductCarousel";
import ShortDescription from "../../components/ShortDescription";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getProduct, getProductsGrid, getProductLocalImages, getProductLocalImageUrl, Product } from "../../lib/api/products";
import { getImageUrl } from "../../lib/api/config";
import { addToCart } from "../../lib/api/cart";
import { getProductReviews, ProductReviewsResponse } from "../../lib/api/reviews";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
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
  const [imagesReady, setImagesReady] = useState(0);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    setCartMessage(null);
    const result = await addToCart(product.id, quantity);
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

        const hasMediaImages = productData?.productImages && (productData.productImages as any[])?.length > 0;
        if (!hasMediaImages) {
          const localFiles = await getProductLocalImages(productId);
          if (localFiles.length > 0) {
            setLocalImageUrls(localFiles.map((f) => ({ imageUrl: getProductLocalImageUrl(productId, f) })));
          }
        }
        setImagesReady((c) => c + 1);

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
      <SwiperInit reinitKey={imagesReady} />
      
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
                  <div className="swiper product-large-slider mb-3" style={{ position: "relative" }}>
                    <div className="swiper-wrapper">
                      {(() => {
                        const displayImages = (product.productImages && (product.productImages as any[]).length > 0)
                          ? (product.productImages as any[]).map((img) => ({ imageUrl: img.originalUrl || img.imageUrl || img.mediaUrl }))
                          : localImageUrls;
                        return displayImages.length > 0 ? (
                        displayImages.map((img, idx) => (
                          <div key={idx} className="swiper-slide">
                            <img
                              src={getImageUrl(img.imageUrl || product.thumbnailImageUrl)}
                              alt={`${product.name} - Görsel ${idx + 1}`}
                              className="img-fluid"
                              style={{ width: "100%", height: "auto" }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/product-item-1.jpg';
                              }}
                            />
                          </div>
                        ))
                        ) : (
                        <div className="swiper-slide">
                          <img
                            src={getImageUrl(product.thumbnailImageUrl)}
                            alt={product.name}
                            className="img-fluid"
                            style={{ width: "100%", height: "auto" }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/product-item-1.jpg';
                            }}
                          />
                        </div>
                        );
                      })()}
                    </div>
                    <div className="swiper-button-prev product-slider-prev"></div>
                    <div className="swiper-button-next product-slider-next"></div>
                    <div className="swiper-pagination"></div>
                  </div>
                  {(() => {
                    const imgs = (product.productImages && (product.productImages as any[]).length > 0)
                      ? (product.productImages as any[]).map((img) => ({ imageUrl: img.mediaUrl || img.imageUrl }))
                      : localImageUrls;
                    return imgs.length > 1 && (
                    <div className="swiper product-thumbnail-slider">
                      <div className="swiper-wrapper">
                        {imgs.map((img, idx) => (
                          <div key={idx} className="swiper-slide" style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <div style={{ width: "100%", height: "120px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <img
                                src={getImageUrl(img.imageUrl || product.thumbnailImageUrl)}
                                alt={`${product.name} - Thumbnail ${idx + 1}`}
                                className="img-fluid"
                                style={{ objectFit: "contain", width: "100%", height: "100%" }}
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/product-item-1.jpg';
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    );
                  })()}
                </div>
              </div>

              <div className="col-md-6">
                <div className="product-info">
                  <h1 className="element-title text-uppercase mb-3">{product.name}</h1>

                  {(() => {
                    const sp = product.specialPrice;
                    const now = new Date();
                    const hasDiscount = sp && sp > 0 && sp < product.price
                      && (!product.specialPriceStart || new Date(product.specialPriceStart) <= now)
                      && (!product.specialPriceEnd || new Date(product.specialPriceEnd) >= now);
                    return (
                      <div className="product-price mb-4">
                        {hasDiscount ? (
                          <>
                            <span className="badge bg-success me-2">%{Math.round((1 - sp / product.price) * 100)} İndirim</span>
                            <del className="text-muted me-2">₺{product.price.toFixed(2)}</del>
                            <strong className="text-danger fs-4">₺{sp.toFixed(2)}</strong>
                          </>
                        ) : (
                          <>
                            <strong>{product.price ? `₺${product.price.toFixed(2)}` : "Fiyat Belirtilmemiş"}</strong>
                            {product.oldPrice && product.oldPrice > product.price && (
                              <del className="ms-2 text-muted">₺{product.oldPrice.toFixed(2)}</del>
                            )}
                          </>
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
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="form-control text-center"
                      />
                      <button
                        type="button"
                        className="quntity-button quantity-right-plus"
                        onClick={() => setQuantity((q) => q + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="product-actions d-flex gap-3 mb-4">
                    <button 
                      className="btn btn-dark btn-lg text-uppercase flex-grow-1"
                      disabled={product.stockQuantity === 0 || addingToCart}
                      onClick={handleAddToCart}
                    >
                      {addingToCart ? "Ekleniyor..." : (product.stockQuantity && product.stockQuantity > 0 ? "Sepete Ekle" : "Stokta Yok")}
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

                  {product.stockQuantity !== undefined && (
                    <p className={product.stockQuantity > 0 ? "text-success mb-0" : "text-danger mb-0"}>
                      <strong>{product.stockQuantity > 0 ? "Stokta var" : "Stokta yok"}</strong>
                      {product.stockQuantity > 0 && ` (${product.stockQuantity} adet)`}
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
