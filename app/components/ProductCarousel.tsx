"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useCallback, useEffect } from "react";
import { getImageUrl } from "../lib/api/config";

/**
 * Single source of design for all product carousels on the site.
 * All carousel widgets use this component; only content (title, products) differs.
 */
export interface CarouselProduct {
  id: number;
  img: string;
  title: string;
  price: string;
}

export interface ProductCarouselProps {
  id: string;
  title: string;
  products: CarouselProduct[];
  showViewAllLink?: boolean;
  additionalClassName?: string;
  /** Alt boşluğu kaldırır (örn. hemen altında Kategoriler olduğunda) */
  compactBottom?: boolean;
}

export default function ProductCarousel({
  id,
  title,
  products,
  showViewAllLink = true,
  additionalClassName = "",
  compactBottom = false,
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

  if (products.length === 0) return null;

  return (
    <section
      id={id}
      className={`product-carousel position-relative overflow-hidden ${additionalClassName}`}
      style={compactBottom ? { marginBottom: 0, paddingBottom: 0 } : undefined}
    >
      <div className={`container ${compactBottom ? "pb-0 mb-0" : "section-spacing"}`}>
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <h4 className="text-uppercase mb-0">{title}</h4>
          {showViewAllLink && (
            <Link href="/products" className="btn-link">
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
            {products.map((product) => (
              <div
                key={product.id}
                className="product-carousel-card flex-shrink-0"
                style={{
                  width: "min(280px, 85vw)",
                  scrollSnapAlign: "start",
                }}
              >
                <div className="product-item link-effect">
                  <div className="image-holder position-relative overflow-hidden" style={{ aspectRatio: "9/16", width: "100%" }}>
                    <Link href={`/products/${product.id}`} className="d-block w-100 h-100 position-relative">
                      <Image
                        src={getImageUrl(product.img)}
                        alt={product.title}
                        className="product-image"
                        fill
                        sizes="(max-width: 768px) 85vw, 280px"
                        style={{ objectFit: "cover", objectPosition: "center" }}
                        unoptimized
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/product-item-1.jpg";
                        }}
                      />
                    </Link>
                  </div>
                  <div className="product-content">
                    <h5 className="element-title text-uppercase fs-6 mt-3">
                      <Link href={`/products/${product.id}`}>{product.title}</Link>
                    </h5>
                    <Link href={`/products/${product.id}`} className="text-decoration-none" data-after="Sepete Ekle">
                      <span>{product.price}</span>
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
