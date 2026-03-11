"use client";

import Image from "next/image";
import SvgSprite from "../components/SvgSprite";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getProductsGrid, Product } from "../lib/api/products";
import { getImageUrl } from "../lib/api/config";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const preloader = document.querySelector(".preloader");
    if (preloader) {
      preloader.classList.add("loaded");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getProductsGrid({
        pageIndex: currentPage - 1,
        pageSize: productsPerPage,
        sort: [{ field: "id", dir: "desc" }],
        filter: {
          logic: "and",
          filters: [
              { field: "isPublished", operator: "eq", value: true },
              { field: "isVisibleIndividually", operator: "eq", value: true }
          ]
        }
      });

        if (!isMounted) return;

      if (response) {
        setProducts(response.data);
        setTotal(response.total);
      }
      } catch (error: any) {
        if (!isMounted) return;
        // Only log if it's not a 401 (unauthorized) or 404 (not found) error
        if (error?.status !== 401 && error?.status !== 404 && error?.message?.includes('401') === false && error?.message?.includes('404') === false) {
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
  }, [currentPage]);

  const totalPages = Math.ceil(total / productsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

      <section className="products-page py-5">
        <div className="container">
          <div className="row mb-5">
            <div className="col-12">
              <h1 className="section-title text-center text-uppercase mb-4">Tüm Ürünler</h1>
              <p className="text-center">Boutique Lavinia koleksiyonundan seçilmiş ürünler</p>
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
                    <div className="image-holder position-relative" style={{ aspectRatio: "9/16", overflow: "hidden" }}>
                      <Link href={`/products/${product.id}`}>
                        <Image
                          src={getImageUrl(product.thumbnailImageUrl)}
                          alt={product.name}
                          className="product-image"
                          fill
                          sizes="(max-width: 576px) 50vw, (max-width: 768px) 33vw, 25vw"
                          style={{ objectFit: "cover" }}
                          unoptimized
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
                      <h5 className="element-title text-uppercase fs-5 mt-3">
                        <Link href={`/products/${product.id}`}>{product.name}</Link>
                      </h5>
                      <Link href={`/products/${product.id}`} className="text-decoration-none" data-after="Sepete Ekle">
                        <span>{product.price ? `₺${product.price.toFixed(2)}` : "Fiyat Belirtilmemiş"}</span>
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
