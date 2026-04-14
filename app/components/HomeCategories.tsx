"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getImageUrl, isApiHostedMediaSrc } from "@/app/lib/api/config";
import { getMenuCategories, type CategoryMenuItem } from "@/app/lib/api/categories";
import { getProductsGrid } from "@/app/lib/api/products";

const FALLBACK_IMAGES = [
  "/images/cat-item1.jpg",
  "/images/cat-item2.jpg",
  "/images/cat-item3.jpg",
  "/images/cat-item1.jpg",
];

function categoryImage(cat: CategoryMenuItem, index: number): string {
  const raw = cat.thumbnailImageUrl?.trim();
  if (raw) return getImageUrl(raw);
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

const SLIDE_COUNT = 4;
const SLIDE_INTERVAL_MS = 2800;

function CategoryCardSlideImages({
  categorySlug,
  fallbackSrc,
}: {
  categorySlug: string;
  fallbackSrc: string;
}) {
  const [urls, setUrls] = useState<string[]>(() => [fallbackSrc]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const grid = await getProductsGrid({
        pageIndex: 0,
        pageSize: SLIDE_COUNT,
        categorySlug,
        sort: [{ field: "id", dir: "desc" }],
      });
      if (cancelled) return;
      const thumbs =
        grid?.data
          ?.map((p) => getImageUrl(p.thumbnailImageUrl))
          .filter((u) => u && u.length > 0) ?? [];
      const unique = [...new Set(thumbs)];
      if (unique.length === 0) {
        setUrls([fallbackSrc]);
        return;
      }
      setUrls(unique.slice(0, SLIDE_COUNT));
      setActive(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [categorySlug, fallbackSrc]);

  useEffect(() => {
    if (urls.length <= 1) return;
    const n = urls.length;
    const t = window.setInterval(() => {
      setActive((i) => (i + 1) % n);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [urls]);

  return (
    <div className="home-category-fade-viewport home-category-fade-viewport--card">
      {urls.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className={`home-category-fade-layer${i === active ? " is-active" : ""}`}
          aria-hidden={i === active ? undefined : true}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 575px) 50vw, (max-width: 1199px) 33vw, 25vw"
            quality={58}
            unoptimized={isApiHostedMediaSrc(src)}
            className="home-category-fade-img"
          />
        </div>
      ))}
    </div>
  );
}

export function HomeCategories() {
  const [items, setItems] = useState<CategoryMenuItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const menu = await getMenuCategories();
      if (cancelled) return;
      setItems(menu ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (items === null || items.length === 0) {
    return null;
  }

  const display = items.slice(0, 4);

  return (
    <section className="collection bg-light home-categories py-5" data-aos="fade-up" lang="tr">
      <div className="container">
        <div className="collection-heading-row position-relative text-start home-categories-heading">
          <span className="title-xlarge text-uppercase home-categories-title-bg" aria-hidden="true">
            KATEGORİLER
          </span>
          <h2 className="section-title text-uppercase home-categories-title-front">KATEGORİLER</h2>
        </div>
        <div className="row g-3 g-md-4 justify-content-center align-items-stretch home-categories-grid">
          {display.map((cat, index) => {
            const fallbackSrc = categoryImage(cat, index);
            const href = `/urunler?category=${encodeURIComponent(cat.slug)}`;
            return (
              <div
                key={cat.id}
                className="col-6 col-md-6 col-xl-3 d-flex"
                data-aos="fade-up"
                data-aos-delay={index * 60}
              >
                <article className="home-category-card-v w-100 d-flex flex-column bg-white rounded-1 border border-light shadow-sm overflow-hidden">
                  <Link href={href} className="home-category-card-v__media d-block position-relative flex-shrink-0 bg-light text-decoration-none">
                    <CategoryCardSlideImages categorySlug={cat.slug} fallbackSrc={fallbackSrc} />
                  </Link>
                  <div className="home-category-card-v__body d-flex flex-column flex-grow-1 p-3 p-md-3 text-center">
                    <h3 className="home-category-card-v__title element-title text-uppercase mb-3 flex-grow-1">
                      {cat.name}
                    </h3>
                    <Link href={href} className="btn btn-dark text-uppercase btn-sm mt-auto align-self-center px-4">
                      Keşfet
                    </Link>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
