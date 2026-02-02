"use client";

import Image from "next/image";
import SvgSprite from "../components/SvgSprite";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProductsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  useEffect(() => {
    const preloader = document.querySelector(".preloader");
    if (preloader) {
      preloader.classList.add("loaded");
    }
  }, []);

  const allProducts = [
    { id: 1, img: "product-item-1.jpg", title: "Koyu Çiçekli Tek Parça", price: "₺2.850" },
    { id: 2, img: "product-item-2.jpg", title: "Baggie Tişört", price: "₺1.650" },
    { id: 3, img: "product-item-3.jpg", title: "Pamuklu Krem Tişört", price: "₺1.950" },
    { id: 4, img: "product-item-4.jpg", title: "Krop Kazak", price: "₺1.500" },
    { id: 5, img: "product-item-5.jpg", title: "Koyu Çiçekli Tek Parça", price: "₺2.850" },
    { id: 6, img: "product-item-6.jpg", title: "Baggie Tişört", price: "₺1.650" },
    { id: 7, img: "product-item-7.jpg", title: "Pamuklu Krem Tişört", price: "₺1.950" },
    { id: 8, img: "product-item-8.jpg", title: "El Yapımı Krop Kazak", price: "₺1.500" },
    { id: 9, img: "product-item-10.jpg", title: "Krop Kazak", price: "₺2.100" },
    { id: 10, img: "product-item-1.jpg", title: "Koyu Çiçekli Tek Parça", price: "₺2.850" },
    { id: 11, img: "product-item-2.jpg", title: "Baggie Tişört", price: "₺1.650" },
    { id: 12, img: "product-item-3.jpg", title: "Pamuklu Krem Tişört", price: "₺1.950" },
    { id: 13, img: "product-item-4.jpg", title: "Krop Kazak", price: "₺1.500" },
    { id: 14, img: "product-item-5.jpg", title: "Koyu Çiçekli Tek Parça", price: "₺2.850" },
    { id: 15, img: "product-item-6.jpg", title: "Baggie Tişört", price: "₺1.650" },
    { id: 16, img: "product-item-7.jpg", title: "Pamuklu Krem Tişört", price: "₺1.950" },
    { id: 17, img: "product-item-8.jpg", title: "El Yapımı Krop Kazak", price: "₺1.500" },
    { id: 18, img: "product-item-10.jpg", title: "Krop Kazak", price: "₺2.100" },
    { id: 19, img: "product-item-1.jpg", title: "Koyu Çiçekli Tek Parça", price: "₺2.850" },
    { id: 20, img: "product-item-2.jpg", title: "Baggie Tişört", price: "₺1.650" },
    { id: 21, img: "product-item-3.jpg", title: "Pamuklu Krem Tişört", price: "₺1.950" },
    { id: 22, img: "product-item-4.jpg", title: "Krop Kazak", price: "₺1.500" },
    { id: 23, img: "product-item-5.jpg", title: "Koyu Çiçekli Tek Parça", price: "₺2.850" },
    { id: 24, img: "product-item-6.jpg", title: "Baggie Tişört", price: "₺1.650" },
  ];

  // Calculate pagination
  const totalPages = Math.ceil(allProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = allProducts.slice(indexOfFirstProduct, indexOfLastProduct);

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

          <div className="row">
            {currentProducts.map((product) => (
              <div key={product.id} className="col-6 col-md-4 col-lg-3 mb-4">
                <div className="product-item image-zoom-effect link-effect">
                  <div className="image-holder position-relative">
                    <Link href={`/products/${product.id}`}>
                      <Image
                        src={`/images/${product.img}`}
                        alt={product.title}
                        className="product-image img-fluid"
                        width={300}
                        height={400}
                      />
                    </Link>
                    <Link href="/" className="btn-icon btn-wishlist">
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <use xlinkHref="#heart"></use>
                      </svg>
                    </Link>
                    <div className="product-content">
                      <h5 className="element-title text-uppercase fs-5 mt-3">
                        <Link href={`/products/${product.id}`}>{product.title}</Link>
                      </h5>
                      <Link href={`/products/${product.id}`} className="text-decoration-none" data-after="Sepete Ekle">
                        <span>{product.price}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

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
                  Sayfa {currentPage} / {totalPages} (Toplam {allProducts.length} ürün)
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
