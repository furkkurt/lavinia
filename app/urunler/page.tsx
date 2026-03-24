"use client";

import SvgSprite from "../components/SvgSprite";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getProductsGrid, getBestsellersGrid, Product } from "../lib/api/products";
import { searchProducts, SearchResult } from "../lib/api/search";
import { getCategoryBySlug, Category } from "../lib/api/categories";
import { getImageUrl } from "../lib/api/config";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="text-center py-5"><div className="spinner-border" role="status"><span className="visually-hidden">Yükleniyor...</span></div></div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");
  const brandSlug = searchParams.get("brand");
  const searchQuery = searchParams.get("q");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const [total, setTotal] = useState(0);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [sortOption, setSortOption] = useState<"newest" | "priceHigh" | "priceLow" | "bestseller">("newest");

  useEffect(() => {
    const preloader = document.querySelector(".preloader");
    if (preloader) {
      preloader.classList.add("loaded");
    }
  }, []);

  const getSortParams = () => {
    switch (sortOption) {
      case "priceHigh": return [{ field: "price", dir: "desc" as const }];
      case "priceLow": return [{ field: "price", dir: "asc" as const }];
      case "bestseller":
      case "newest":
      default: return [{ field: "id", dir: "desc" as const }];
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    if (categorySlug) {
      getCategoryBySlug(categorySlug).then(setActiveCategory);
    } else {
      setActiveCategory(null);
    }
  }, [categorySlug]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, brandSlug]);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        if (searchQuery || brandSlug) {
          const sortMap: Record<string, string> = { priceHigh: "price-desc", priceLow: "price-asc" };
          const result = await searchProducts({
            query: searchQuery || "",
            brand: brandSlug || undefined,
            category: categorySlug || undefined,
            page: currentPage,
            pageSize: productsPerPage,
            sort: sortMap[sortOption] || undefined,
          });
          if (!isMounted) return;
          if (result) {
            setProducts(result.products.map((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.calculatedProductPrice?.price ?? p.price,
              oldPrice: p.calculatedProductPrice?.oldPrice ?? p.oldPrice,
              thumbnailImageUrl: p.thumbnailUrl,
              isPublished: true,
            })));
            setTotal(result.totalProduct);
          }
        } else if (sortOption === "bestseller") {
          const response = await getBestsellersGrid({
            pageIndex: currentPage - 1,
            pageSize: productsPerPage,
            categorySlug: categorySlug || undefined,
          });
          if (!isMounted) return;
          if (response) {
            setProducts(response.data);
            setTotal(response.total);
          }
        } else {
          const response = await getProductsGrid({
            pageIndex: currentPage - 1,
            pageSize: productsPerPage,
            sort: getSortParams(),
            categorySlug: categorySlug || undefined,
          });
          if (!isMounted) return;
          if (response) {
            setProducts(response.data);
            setTotal(response.total);
          }
        }
      } catch (error: any) {
        if (!isMounted) return;
        if (error?.status !== 401 && error?.status !== 404) {
          console.error("Error fetching products:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [currentPage, categorySlug, brandSlug, searchQuery, sortOption]);

  const totalPages = Math.ceil(total / productsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isProductOutOfStock = (p: Product) =>
    p.stockTrackingIsEnabled === true && (p.stockQuantity ?? 0) <= 0;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <>
      <SvgSprite />
      <Navbar />

      <section className="products-page py-5">
        <div className="container">
          <div className="row mb-5">
            <div className="col-12">
              <h1 className="section-title text-center text-uppercase mb-4">
                {searchQuery
                  ? `"${searchQuery}" için sonuçlar`
                  : brandSlug
                    ? brandSlug
                    : activeCategory
                      ? activeCategory.name
                      : "Tüm Ürünler"}
              </h1>
              {(activeCategory || searchQuery || brandSlug) && (
                <div className="text-center mb-2">
                  <Link href="/urunler" className="btn btn-outline-dark btn-sm">
                    ← Tüm Ürünler
                  </Link>
                </div>
              )}
              <p className="text-center">
                {searchQuery
                  ? `${total} ürün bulundu`
                  : "Boutique Lavinia koleksiyonundan seçilmiş ürünler"}
              </p>
              <div className="d-flex justify-content-center mt-2 w-100 px-2 px-md-0">
                <select
                  className="form-select form-select-sm products-page-sort-select"
                  style={{ borderRadius: 0 }}
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
                >
                  <option value="newest">En yeniler</option>
                  <option value="priceHigh">En yüksek fiyat</option>
                  <option value="priceLow">En düşük fiyat</option>
                  <option value="bestseller">En çok satan</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <p>Henüz ürün bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="row">
              {products.map((product) => (
                <div key={product.id} className="col-6 col-md-4 col-lg-3 mb-4">
                  <div className="product-item image-zoom-effect link-effect">
                    <div className="image-holder position-relative">
                      {product.stockQuantity !== undefined && product.stockQuantity > 0 && product.stockQuantity <= 3 && (
                        <span className="stock-badge">Son {product.stockQuantity} ürün!</span>
                      )}
                      {(() => {
                        const sp = product.specialPrice;
                        const now = new Date();
                        const active = sp && sp > 0 && sp < product.price
                          && (!product.specialPriceStart || new Date(product.specialPriceStart) <= now)
                          && (!product.specialPriceEnd || new Date(product.specialPriceEnd) >= now);
                        return active ? (
                          <span className="discount-badge">%{Math.round((1 - sp / product.price) * 100)} İndirim</span>
                        ) : null;
                      })()}
                      {isProductOutOfStock(product) && (
                        <span className="out-of-stock-badge">Tükendi</span>
                      )}
                      <Link href={`/urunler/${product.id}`}>
                        <img
                          src={getImageUrl(product.thumbnailImageUrl)}
                          alt={product.name}
                          className={`product-image${isProductOutOfStock(product) ? " out-of-stock-thumb" : ""}`}
                          style={{
                            width: "100%",
                            aspectRatio: "9/16",
                            objectFit: "cover",
                            display: "block",
                            ...(isProductOutOfStock(product)
                              ? { opacity: 0.45, filter: "grayscale(85%)" }
                              : {}),
                          }}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/product-item-1.jpg';
                          }}
                        />
                      </Link>
                      <Link href="/" className="btn-icon btn-wishlist">
                        <svg width="24" height="24" viewBox="0 0 24 24">
                          <use xlinkHref="#heart"></use>
                        </svg>
                      </Link>
                    </div>
                    <div className="product-content">
                      <h5 className="element-title text-uppercase products-grid-title mt-3">
                        <Link href={`/urunler/${product.id}`}>{product.name}</Link>
                      </h5>
                      <Link href={`/urunler/${product.id}`} className="text-decoration-none" data-after="Sepete Ekle">
                        {(() => {
                          const sp = product.specialPrice;
                          const now = new Date();
                          const active = sp && sp > 0 && sp < product.price
                            && (!product.specialPriceStart || new Date(product.specialPriceStart) <= now)
                            && (!product.specialPriceEnd || new Date(product.specialPriceEnd) >= now);
                          return active ? (
                            <><del className="text-muted me-1">₺{product.price.toFixed(2)}</del> <span className="text-danger fw-bold">₺{sp.toFixed(2)}</span></>
                          ) : (
                            <span>{product.price ? `₺${product.price.toFixed(2)}` : "Fiyat Belirtilmemiş"}</span>
                          );
                        })()}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Sayfa navigasyonu" className="mt-5">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Önceki sayfa"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <use xlinkHref="#arrow-left"></use>
                    </svg>
                  </button>
                </li>

                {getPageNumbers().map((page) => (
                  <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
                    <button className="page-link" onClick={() => handlePageChange(page)}>
                      {page}
                    </button>
                  </li>
                ))}

                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Sonraki sayfa"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <use xlinkHref="#arrow-right"></use>
                    </svg>
                  </button>
                </li>
              </ul>
              <div className="text-center mt-3">
                <small className="text-muted">
                  Sayfa {currentPage} / {totalPages} (Toplam {total} ürün)
                </small>
              </div>
            </nav>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
