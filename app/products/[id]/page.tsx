"use client";

import Image from "next/image";
import SvgSprite from "../../components/SvgSprite";
import SwiperInit from "../../components/SwiperInit";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProductCarousel from "../../components/ProductCarousel";
import Link from "next/link";
import { useEffect, use } from "react";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  useEffect(() => {
    const preloader = document.querySelector(".preloader");
    if (preloader) {
      preloader.classList.add("loaded");
    }
  }, []);

  // Örnek ürün verisi - gerçek uygulamada API'den gelecek
  const product = {
    id: resolvedParams.id,
    title: "Koyu Çiçekli Tek Parça",
    price: "₺2.850",
    originalPrice: "₺3.500",
    images: [
      "product-item-1.jpg",
      "product-item-2.jpg",
      "product-item-3.jpg",
      "product-item-4.jpg",
    ],
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    colors: ["#000000", "#8C907E", "#D4A574", "#FFFFFF"],
    sizes: ["XS", "S", "M", "L", "XL"],
    inStock: true,
    rating: 4.5,
    reviews: 24,
  };

  const relatedProducts = [
    { id: 2, img: "product-item-2.jpg", title: "Baggie Tişört", price: "₺1.650" },
    { id: 3, img: "product-item-3.jpg", title: "Pamuklu Krem Tişört", price: "₺1.950" },
    { id: 4, img: "product-item-4.jpg", title: "Krop Kazak", price: "₺1.500" },
    { id: 5, img: "product-item-5.jpg", title: "Koyu Çiçekli Tek Parça", price: "₺2.850" },
    { id: 6, img: "product-item-6.jpg", title: "El Yapımı Krop Kazak", price: "₺1.500" },
    { id: 7, img: "product-item-7.jpg", title: "Pamuklu Krem Tişört", price: "₺1.950" },
  ];

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
                {product.title}
              </li>
            </ol>
          </nav>

          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="product-preview">
                <div className="swiper product-large-slider mb-3">
                  <div className="swiper-wrapper">
                    {product.images.map((img, idx) => (
                      <div key={idx} className="swiper-slide">
                        <Image
                          src={`/images/${img}`}
                          alt={`${product.title} - Görsel ${idx + 1}`}
                          className="img-fluid"
                          width={600}
                          height={800}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="swiper-pagination"></div>
                </div>
                <div className="swiper product-thumbnail-slider">
                  <div className="swiper-wrapper">
                    {product.images.map((img, idx) => (
                      <div key={idx} className="swiper-slide" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: "100%", height: "120px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Image
                            src={`/images/${img}`}
                            alt={`${product.title} - Thumbnail ${idx + 1}`}
                            className="img-fluid"
                            width={150}
                            height={200}
                            style={{ objectFit: "contain", width: "100%", height: "100%" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="product-info">
                <h1 className="element-title text-uppercase mb-3">{product.title}</h1>
                
                <div className="rating-container mb-3">
                  <div className="rating">
                    {"★".repeat(Math.floor(product.rating))}
                    {"☆".repeat(5 - Math.floor(product.rating))}
                  </div>
                  <span className="ms-2">({product.reviews} değerlendirme)</span>
                </div>

                <div className="product-price mb-4">
                  <strong>{product.price}</strong>
                  {product.originalPrice && (
                    <del className="ms-2 text-muted">{product.originalPrice}</del>
                  )}
                </div>

                <p className="mb-4">{product.description}</p>

                <div className="color-product-options mb-4">
                  <label className="d-block mb-2 text-uppercase">Renk:</label>
                  <div className="d-flex gap-2">
                    {product.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="color-item"
                        style={{ backgroundColor: color }}
                        title={`Renk ${idx + 1}`}
                      >
                        <span style={{ backgroundColor: color }}></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="size-options mb-4">
                  <label className="d-block mb-2 text-uppercase">Beden:</label>
                  <div className="d-flex gap-2 flex-wrap">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        className="btn btn-outline-dark"
                        style={{ minWidth: "50px" }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

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
                  <button className="btn btn-dark btn-lg text-uppercase flex-grow-1">
                    Sepete Ekle
                  </button>
                  <button className="btn btn-outline-dark btn-lg">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <use xlinkHref="#heart"></use>
                    </svg>
                  </button>
                </div>

                {product.inStock ? (
                  <p className="text-success mb-0">
                    <strong>Stokta var</strong>
                  </p>
                ) : (
                  <p className="text-danger mb-0">
                    <strong>Stokta yok</strong>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductCarousel
        id="related-products"
        title="Beğenebileceğiniz Ürünler"
        products={relatedProducts}
        additionalClassName="related-products"
      />

      <Footer />
    </>
  );
}
