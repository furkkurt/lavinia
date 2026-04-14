"use client";

import { useEffect, useState } from "react";
import { getFeaturedReviews, type ProductReview } from "@/app/lib/api/reviews";

export function HomeFeaturedReviews() {
  const [items, setItems] = useState<ProductReview[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getFeaturedReviews();
        if (!cancelled) setItems(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <section className="collection bg-light py-5 home-featured-reviews" data-aos="fade-up">
      <div className="container">
        <div className="collection-heading-row position-relative text-center mb-4">
          <span className="title-xlarge text-uppercase home-categories-title-bg" aria-hidden="true">
            Reviews
          </span>
          <h2 className="section-title text-uppercase">En İyi Yorumlar</h2>
          <p className="text-muted mb-0" style={{ maxWidth: "32rem", margin: "0.5rem auto 0", lineHeight: 1.6 }}>
            Mağazamızdan seçilmiş müşteri değerlendirmeleri.
          </p>
        </div>
        <div className="row g-4 justify-content-center">
          {items.map((r) => (
            <div key={r.id} className="col-12 col-md-6 col-lg-4">
              <div className="bg-white p-4 h-100 border border-light shadow-sm" style={{ minHeight: "11rem" }}>
                <div className="text-warning mb-2" aria-hidden="true">
                  {"★".repeat(r.rating)}
                  <span className="text-secondary">{"☆".repeat(Math.max(0, 5 - r.rating))}</span>
                </div>
                {r.title ? <div className="fw-semibold mb-2">{r.title}</div> : null}
                {r.comment ? (
                  <p className="text-muted mb-3" style={{ lineHeight: 1.65, fontSize: "0.95rem" }}>
                    {r.comment}
                  </p>
                ) : null}
                <div className="small text-uppercase text-secondary mt-auto">
                  {r.reviewerName}
                  <span className="text-muted ms-2">
                    {new Date(r.createdOn).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
