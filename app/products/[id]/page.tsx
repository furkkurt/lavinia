// @ts-nocheck
"use client";

import React from "react";
import Image from "next/image";
import SvgSprite from "../../components/SvgSprite";
import SwiperInit from "../../components/SwiperInit";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProductCarousel from "../../components/ProductCarousel";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getProduct, getProductsGrid, Product } from "../../lib/api/products";
import { getImageUrl } from "../../lib/api/config";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const productId = parseInt(params.id, 10);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
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
      <SwiperInit />
      
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
        aria-labelledby="My Cart"
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
            <h4 className="d-flex justify-content-between align-items-center mb-3">
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
            <Link href="/products" className="btn btn-primary mt-3">
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
                  <Link href="/products">Ürünler</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {product.name}
                </li>
              </ol>
            </nav>

            <div className="row">
              <div className="col-md-6 mb-4">
                <div className="product-preview">
                  <div className="swiper product-large-slider mb-3">
                    <div className="swiper-wrapper">
                      {product.productImages && product.productImages.length > 0 ? (
                        product.productImages.map((img, idx) => (
                          <div key={idx} className="swiper-slide">
                            <Image
                              src={getImageUrl(img.imageUrl || product.thumbnailImageUrl)}
                              alt={`${product.name} - Görsel ${idx + 1}`}
                              className="img-fluid"
                              width={600}
                              height={800}
                              unoptimized
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/product-item-1.jpg';
                              }}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="swiper-slide">
                          <Image
                            src={getImageUrl(product.thumbnailImageUrl)}
                            alt={product.name}
                            className="img-fluid"
                            width={600}
                            height={800}
                            unoptimized
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/product-item-1.jpg';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="swiper-pagination"></div>
                  </div>
                  {product.productImages && product.productImages.length > 1 && (
                    <div className="swiper product-thumbnail-slider">
                      <div className="swiper-wrapper">
                        {product.productImages.map((img, idx) => (
                          <div key={idx} className="swiper-slide" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: "100%", height: "120px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Image
                                src={getImageUrl(img.imageUrl || product.thumbnailImageUrl)}
                                alt={`${product.name} - Thumbnail ${idx + 1}`}
                                className="img-fluid"
                                width={150}
                                height={200}
                                style={{ objectFit: "contain", width: "100%", height: "100%" }}
                                unoptimized
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/product-item-1.jpg';
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-md-6">
                <div className="product-info">
                  <h1 className="element-title text-uppercase mb-3">{product.name}</h1>

                  <div className="product-price mb-4">
                    <strong>{product.price ? `₺${product.price.toFixed(2)}` : "Fiyat Belirtilmemiş"}</strong>
                    {product.oldPrice && product.oldPrice > product.price && (
                      <del className="ms-2 text-muted">₺{product.oldPrice.toFixed(2)}</del>
                    )}
                  </div>

                  {product.shortDescription && (
                    <p className="mb-4">{product.shortDescription}</p>
                  )}
                  {product.description && (
                    <div className="mb-4" dangerouslySetInnerHTML={{ __html: product.description }} />
                  )}

                  <div className="product-quantity mb-4">
                    <label className="d-block mb-2 text-uppercase">Adet:</label>
                    <div className="qty-number d-flex align-items-center">
                      <button className="quntity-button quantity-left-minus">-</button>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        min="1"
                        defaultValue="1"
                        className="form-control text-center"
                      />
                      <button className="quntity-button quantity-right-plus">+</button>
                    </div>
                  </div>

                  <div className="product-actions d-flex gap-3 mb-4">
                    <button 
                      className="btn btn-dark btn-lg text-uppercase flex-grow-1"
                      disabled={product.stockQuantity === 0}
                    >
                      {product.stockQuantity && product.stockQuantity > 0 ? "Sepete Ekle" : "Stokta Yok"}
                    </button>
                    <button className="btn btn-outline-dark btn-lg">
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <use xlinkHref="#heart"></use>
                      </svg>
                    </button>
                  </div>

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
