"use client";

import Image from "next/image";
import Link from "next/link";

interface Product {
  id: number;
  img: string;
  title: string;
  price: string;
}

interface ProductCarouselProps {
  id: string;
  title: string;
  products: Product[];
  showViewAllLink?: boolean;
  additionalClassName?: string;
}

export default function ProductCarousel({
  id,
  title,
  products,
  showViewAllLink = true,
  additionalClassName = "",
}: ProductCarouselProps) {
  return (
    <section
      id={id}
      className={`${id} product-carousel position-relative overflow-hidden ${additionalClassName}`}
    >
      <div className="container section-spacing">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <h4 className="text-uppercase">{title}</h4>
          {showViewAllLink && (
            <Link href="/products" className="btn-link">
              Tüm Ürünleri Gör
            </Link>
          )}
        </div>
        <div className="swiper-wrapper-container position-relative">
          <div className="swiper product-swiper open-up" data-aos="zoom-out">
            <div className="swiper-wrapper">
              {products.map((product) => (
                <div key={product.id} className="swiper-slide">
                  <div className="product-item image-zoom-effect link-effect">
                    <div className="image-holder position-relative">
                      <Link href={`/products/${product.id}`}>
                        <Image
                          src={product.img.startsWith('http') ? product.img : `/images/${product.img}`}
                          alt={product.title}
                          className="product-image img-fluid"
                          width={300}
                          height={400}
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
                        <Link href={`/products/${product.id}`}>{product.title}</Link>
                      </h5>
                      <Link
                        href={`/products/${product.id}`}
                        className="text-decoration-none"
                        data-after="Sepete Ekle"
                      >
                        <span>{product.price}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="swiper-pagination"></div>
          </div>
          <div className="icon-arrow icon-arrow-left">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <use xlinkHref="#arrow-left"></use>
            </svg>
          </div>
          <div className="icon-arrow icon-arrow-right">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <use xlinkHref="#arrow-right"></use>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
