"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useCallback, useEffect } from "react";
import { getImageUrl, isApiHostedMediaSrc } from "../lib/api/config";

/**
 * Single source of design for all product carousels on the site.
 * All carousel widgets use this component; only content (title, products) differs.
 */
export interface CarouselProduct {
  id: number;
  img: string;
  title: string;
  price: string;
  stockQuantity?: number;
  stockTrackingIsEnabled?: boolean;
  specialPrice?: number;
  originalPrice?: number;
}

function isCarouselOutOfStock(p: CarouselProduct) {
  return p.stockTrackingIsEnabled === true && (p.stockQuantity ?? 0) <= 0;
}

function CarouselProductImage({
  src,
  alt,
  outOfStock,
  priority,
}: {
  src: string;
  alt: string;
  outOfStock: boolean;
  /** İlk slayt LCP için (yalnızca gerçekten üstte görünen carousel’de) */
  priority?: boolean;
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
      sizes="(max-width: 768px) 42vw, 280px"
      quality={60}
      priority={priority}
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

export interface ProductCarouselProps {
  id: string;
  title: string;
  products: CarouselProduct[];
  showViewAllLink?: boolean;
  additionalClassName?: string;
  /** Alt boşluğu kaldırır (örn. hemen altında Kategoriler olduğunda) */
  compactBottom?: boolean;
  /** İlk ürün görseline priority (örn. “Yeni Gelenler” LCP adayı) */
  eagerFirstImage?: boolean;
}

export default function ProductCarousel({
  id,
  title,
  products,
  showViewAllLink = true,
  additionalClassName = "",
  compactBottom = false,
  eagerFirstImage = false,
}: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [dotCount, setDotCount] = useState(4);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
    const cardWidth = 280 + 16;
    const page = Math.round(scrollLeft / (cardWidth * 4)) || 0;
    const maxPage = Math.max(0, Math.ceil((scrollWidth - clientWidth) / (cardWidth * 4)));
    setCurrentPage(Math.min(page, maxPage));
    setDotCount(Math.min(8, Math.max(1, maxPage + 1)));
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    el.addEventListener("scroll", updateScrollState);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [products.length, updateScrollState]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.9, el.scrollWidth / 3);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  // Auto-scroll every 5 seconds, pause on hover/touch
  const pausedRef = useRef(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || products.length <= 1) return;
    const interval = setInterval(() => {
      if (pausedRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = el;
      if (scrollLeft >= scrollWidth - clientWidth - 2) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scroll("right");
      }
    }, 5000);
    const pause = () => { pausedRef.current = true; };
    const resume = () => { pausedRef.current = false; };
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume);
    return () => {
      clearInterval(interval);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, [products.length]);

  if (products.length === 0) return null;

  return (
    <section
      id={id}
      className={`product-carousel position-relative overflow-hidden ${additionalClassName}`}
      style={compactBottom ? { marginBottom: 0, paddingBottom: 0 } : undefined}
    >
      <div className={`container ${compactBottom ? "pb-0 mb-0" : "section-spacing"}`}>
        <div className="d-flex flex-column flex-md-row flex-md-wrap align-items-stretch align-items-md-center justify-content-md-between gap-2 gap-md-3 mb-4 product-carousel-header">
          <h4 className="text-uppercase mb-0 product-carousel-title">{title}</h4>
          {showViewAllLink && (
            <Link
              href="/urunler"
              className="btn-link product-carousel-view-all text-center text-md-end py-2 py-md-1 px-2 px-md-0 rounded-0"
            >
              Tüm Ürünleri Gör
            </Link>
          )}
        </div>
      </div>

      {/* Full-width alan: oklar sayfa kenarlarında, track container içinde */}
      <div className="product-carousel-arrows-wrapper position-relative" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}>
        <button
          type="button"
          onClick={() => scroll("left")}
          className="position-absolute top-50 translate-middle-y z-3 btn rounded-circle d-none d-md-flex align-items-center justify-content-center carousel-arrow"
          style={{ width: 48, height: 48, left: 16, backgroundColor: "rgba(0,0,0,0.75)", border: "none", color: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}
          aria-label="Önceki"
          disabled={!canScrollLeft}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <use xlinkHref="#arrow-left" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => scroll("right")}
          className="position-absolute top-50 translate-middle-y z-3 btn rounded-circle d-none d-md-flex align-items-center justify-content-center carousel-arrow"
          style={{ width: 48, height: 48, right: 16, backgroundColor: "rgba(0,0,0,0.75)", border: "none", color: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}
          aria-label="Sonraki"
          disabled={!canScrollRight}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <use xlinkHref="#arrow-right" />
          </svg>
        </button>

        <div className="container">
          <div
            ref={scrollRef}
            className="product-carousel-track d-flex gap-3 overflow-x-auto overflow-y-hidden pb-2"
            style={{
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {products.map((product, productIndex) => (
              <div
                key={product.id}
                className="product-carousel-card flex-shrink-0"
                style={{
                  width: "min(280px, 85vw)",
                  scrollSnapAlign: "start",
                }}
              >
                <div className="product-item link-effect">
                  <div className="image-holder position-relative">
                    {product.stockQuantity !== undefined && product.stockQuantity > 0 && product.stockQuantity <= 3 && (
                      <span className="stock-badge">Son {product.stockQuantity} ürün!</span>
                    )}
                    {product.specialPrice != null &&
                      product.specialPrice > 0 &&
                      product.originalPrice != null &&
                      product.originalPrice > 0 &&
                      product.specialPrice < product.originalPrice && (
                      <span className="discount-badge">%{Math.round((1 - product.specialPrice / product.originalPrice) * 100)} İndirim</span>
                    )}
                    {isCarouselOutOfStock(product) && (
                      <span className="out-of-stock-badge">Tükendi</span>
                    )}
                    <Link href={`/urunler/${product.id}`} className="d-block position-relative w-100" style={{ aspectRatio: "9/16" }}>
                      <CarouselProductImage
                        src={getImageUrl(product.img)}
                        alt={product.title}
                        outOfStock={isCarouselOutOfStock(product)}
                        priority={eagerFirstImage && productIndex === 0}
                      />
                    </Link>
                  </div>
                  <div className="product-content">
                    <h5 className="element-title text-uppercase fs-6 mt-3">
                      <Link href={`/urunler/${product.id}`}>{product.title}</Link>
                    </h5>
                    <Link href={`/urunler/${product.id}`} className="text-decoration-none" data-after="Sepete Ekle">
                      {product.specialPrice != null &&
                      product.specialPrice > 0 &&
                      product.originalPrice != null &&
                      product.originalPrice > 0 &&
                      product.specialPrice < product.originalPrice ? (
                        <><del className="text-muted me-1">₺{product.originalPrice.toFixed(2)}</del> <span className="text-danger fw-bold">₺{product.specialPrice.toFixed(2)}</span></>
                      ) : (
                        <span>{product.price}</span>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination dots – same design for every carousel (hidden when single page) */}
          {dotCount > 1 ? (
            <div className="d-flex justify-content-center gap-2 mt-3 product-carousel-dots">
              {Array.from({ length: dotCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const el = scrollRef.current;
                    if (!el) return;
                    const cardWidth = 296;
                    el.scrollTo({ left: i * (cardWidth * 2), behavior: "smooth" });
                  }}
                  className="rounded-circle border-0 p-0 product-carousel-dot"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: currentPage === i ? "#000" : "rgba(0,0,0,0.2)",
                  }}
                  aria-label={`Sayfa ${i + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
