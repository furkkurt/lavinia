"use client";

import SvgSprite from "../components/SvgSprite";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getProductsGrid, getBestsellersGrid, Product } from "../lib/api/products";
import { searchProducts, SearchResult } from "../lib/api/search";
import { getCategoryBySlug, Category } from "../lib/api/categories";
import { getImageUrl, isApiHostedMediaSrc } from "../lib/api/config";

function ProductGridImage({
  src,
  alt,
  outOfStock,
}: {
  src: string;
  alt: string;
  outOfStock: boolean;
}) {
  const [imgSrc, setImgSrc] = useState(src);
  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      sizes="(max-width: 768px) 50vw, (max-width: 992px) 33vw, 25vw"
      quality={62}
      unoptimized={isApiHostedMediaSrc(imgSrc)}
      className={`product-image${outOfStock ? " out-of-stock-thumb" : ""}`}
      style={{
        objectFit: "cover",
        display: "block",
        ...(outOfStock ? { opacity: 0.45, filter: "grayscale(85%)" } : {}),
      }}
      onError={() => setImgSrc("/images/product-item-1.jpg")}
    />
  );
}

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
  const [jumpInput, setJumpInput] = useState("1");
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
    setCurrentPage(1);
  }, [sortOption]);

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

  useEffect(() => {
    setJumpInput(String(currentPage));
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    const p = Math.max(1, Math.min(totalPages || 1, page));
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToJumpPage = () => {
    const n = parseInt(jumpInput, 10);
    if (Number.isNaN(n)) return;
    handlePageChange(n);
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
                        const c = product.calculatedProductPrice;
                        const eff = c?.price ?? product.price;
                        const old = c?.oldPrice;
                        const pct = c?.percentOfSaving;
                        if (old != null && old > eff) {
                          return (
                            <span className="discount-badge">
                              %{pct && pct > 0 ? pct : Math.round((1 - eff / old) * 100)} İndirim
                            </span>
                          );
                        }
                        return null;
                      })()}
                      {isProductOutOfStock(product) && (
                        <span className="out-of-stock-badge">Tükendi</span>
                      )}
                      <Link
                        href={`/urunler/${product.id}`}
                        className="d-block position-relative w-100"
                        style={{ aspectRatio: "9/16" }}
                      >
                        <ProductGridImage
                          src={getImageUrl(product.thumbnailImageUrl)}
                          alt={product.name}
                          outOfStock={isProductOutOfStock(product)}
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
                          const c = product.calculatedProductPrice;
                          const eff = c?.price ?? product.price;
                          const old = c?.oldPrice;
                          if (old != null && old > eff) {
                            return (
                              <>
                                <del className="text-muted me-1">₺{old.toFixed(2)}</del>{" "}
                                <span className="text-danger fw-bold">₺{eff.toFixed(2)}</span>
                              </>
                            );
                          }
                          return (
                            <span>
                              {eff != null && eff > 0
                                ? `₺${Number(eff).toFixed(2)}`
                                : "Fiyat Belirtilmemiş"}
                            </span>
                          );
                        })()}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination: equal-size controls; space between İlk/←/→/Son and page numbers */}
          {totalPages > 1 && (
            <nav aria-label="Sayfa navigasyonu" className="mt-5">
              <div className="d-flex justify-content-center align-items-center flex-wrap gap-2">
                <div className="d-flex gap-1 align-items-center pe-2 pe-md-3 me-md-1 border-end border-secondary-subtle">
                  <button
                    type="button"
                    className={`page-link ${currentPage === 1 ? "disabled" : ""}`}
                    style={{
                      minWidth: "2.75rem",
                      minHeight: "2.75rem",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    aria-label="İlk sayfa"
                  >
                    İlk
                  </button>
                  <button
                    type="button"
                    className={`page-link ${currentPage === 1 ? "disabled" : ""}`}
                    style={{
                      minWidth: "2.75rem",
                      minHeight: "2.75rem",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Önceki sayfa"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <use xlinkHref="#arrow-left"></use>
                    </svg>
                  </button>
                </div>

                <ul className="pagination mb-0 mx-0 flex-wrap justify-content-center gap-1">
                  {getPageNumbers().map((page) => (
                    <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
                      <button
                        type="button"
                        className="page-link"
                        style={{
                          minWidth: "2.75rem",
                          minHeight: "2.75rem",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="d-flex gap-1 align-items-center ps-2 ps-md-3 ms-md-1 border-start border-secondary-subtle">
                  <button
                    type="button"
                    className={`page-link ${currentPage === totalPages ? "disabled" : ""}`}
                    style={{
                      minWidth: "2.75rem",
                      minHeight: "2.75rem",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Sonraki sayfa"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <use xlinkHref="#arrow-right"></use>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`page-link ${currentPage === totalPages ? "disabled" : ""}`}
                    style={{
                      minWidth: "2.75rem",
                      minHeight: "2.75rem",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    aria-label="Son sayfa"
                  >
                    Son
                  </button>
                </div>
              </div>
              <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-2 mt-3">
                <div className="d-flex align-items-center gap-2">
                  <label htmlFor="urunler-page-jump" className="small text-muted mb-0">
                    Sayfaya git
                  </label>
                  <input
                    id="urunler-page-jump"
                    type="number"
                    min={1}
                    max={totalPages}
                    className="form-control form-control-sm"
                    style={{ width: "4.5rem" }}
                    value={jumpInput}
                    onChange={(e) => setJumpInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") goToJumpPage();
                    }}
                  />
                  <button type="button" className="btn btn-sm btn-outline-dark" onClick={goToJumpPage}>
                    Git
                  </button>
                </div>
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
