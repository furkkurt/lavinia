"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { getApiBase, mediaUrl } from "@/app/lib/apiBase";

export type HomeCollectionItem = {
  title: string;
  description: string | null;
  slug: string;
  thumbnailUrl: string | null;
  href: string;
};

export function HomeCollections() {
  const [items, setItems] = useState<HomeCollectionItem[] | null>(null);

  useEffect(() => {
    const base = getApiBase();
    fetch(`${base}/api/public/collections/home`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: HomeCollectionItem[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) {
    return (
      <section className="collections-section" aria-busy="true">
        <div className="collections-inner">
          <p className="collections-intro" style={{ marginBottom: 0 }}>
            Yükleniyor…
          </p>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="collections-section">
      <div className="collections-inner">
        <h2 className="collections-title">Yeni Koleksiyonlar</h2>
        <p className="collections-intro">
          Sezonun öne çıkan seçkilerini keşfedin. Her koleksiyon, seçilmiş ürünlerle düzenlenmiştir.
        </p>

        <div className="collections-grid">
          {items.map((c) => (
            <article key={c.slug}>
              <Link href={c.href}>
                {c.thumbnailUrl ? (
                  <Image
                    className="collections-card-img"
                    src={mediaUrl(c.thumbnailUrl)}
                    alt=""
                    width={400}
                    height={500}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                ) : (
                  <div className="collections-card-img" />
                )}
              </Link>
              <h3 className="collections-card-title">{c.title}</h3>
              {c.description ? (
                <p className="collections-card-desc">{c.description}</p>
              ) : null}
              <Link className="collections-cta-link" href={c.href}>
                Keşfet
              </Link>
            </article>
          ))}
        </div>

        <div className="collections-swiper-wrap">
          <Swiper
            modules={[Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            pagination={{ clickable: true }}
          >
            {items.map((c) => (
              <SwiperSlide key={c.slug}>
                <article>
                  <Link href={c.href}>
                    {c.thumbnailUrl ? (
                      <Image
                        className="collections-card-img"
                        src={mediaUrl(c.thumbnailUrl)}
                        alt=""
                        width={400}
                        height={500}
                        sizes="100vw"
                        unoptimized
                      />
                    ) : (
                      <div className="collections-card-img" />
                    )}
                  </Link>
                  <h3 className="collections-card-title">{c.title}</h3>
                  {c.description ? (
                    <p className="collections-card-desc">{c.description}</p>
                  ) : null}
                  <Link className="collections-cta-link" href={c.href}>
                    Keşfet
                  </Link>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <p className="collections-view-all">
          <Link href="/koleksiyonlar">Tüm koleksiyonlar</Link>
        </p>
      </div>
    </section>
  );
}
