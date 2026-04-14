"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import ProductCarousel, { type CarouselProduct } from "@/app/components/ProductCarousel";
import { HomeCategories } from "@/app/components/HomeCategories";
import { HomeFeaturedReviews } from "@/app/components/HomeFeaturedReviews";
import SwiperInit from "@/app/components/SwiperInit";
import { getImageUrl } from "@/app/lib/api/config";
import { getBestsellersGrid, getProductsGrid, type Product } from "@/app/lib/api/products";
import { getWidgetsByZone, WidgetZoneIds } from "@/app/lib/api/widgets";

function carouselImageUrl(item: Record<string, unknown>): string {
  const raw =
    (item.image as string) ||
    (item.Image as string) ||
    (item.imageUrl as string) ||
    (item.ImageUrl as string) ||
    "";
  return getImageUrl(raw);
}

function carouselCaption(item: Record<string, unknown>): string | undefined {
  return (item.caption as string) || (item.Caption as string) || undefined;
}

function carouselSubCaption(item: Record<string, unknown>): string | undefined {
  return (item.subCaption as string) || (item.SubCaption as string) || undefined;
}

function carouselLinkText(item: Record<string, unknown>): string | undefined {
  return (item.linkText as string) || (item.LinkText as string) || undefined;
}

function carouselTargetUrl(item: Record<string, unknown>): string {
  const u = (item.targetUrl as string) || (item.TargetUrl as string) || "";
  return u.trim() || "#";
}

function mapApiProductToCarousel(p: Record<string, unknown>): CarouselProduct {
  const calc = p.calculatedProductPrice as
    | { price?: number; oldPrice?: number }
    | undefined;
  const sp = p.specialPrice != null ? Number(p.specialPrice) : undefined;
  const oldFromCalc = calc?.oldPrice != null ? Number(calc.oldPrice) : undefined;
  const oldFromP = p.oldPrice != null ? Number(p.oldPrice) : undefined;
  const orig = oldFromCalc ?? oldFromP;
  const priceNum = calc?.price != null ? Number(calc.price) : Number(p.price ?? 0);
  return {
    id: Number(p.id),
    img: getImageUrl((p.thumbnailUrl as string) || (p.ThumbnailUrl as string)),
    title: String(p.name ?? ""),
    price: `₺${priceNum.toFixed(2)}`,
    specialPrice: sp,
    originalPrice: orig ?? (sp != null && p.price != null ? Number(p.price) : undefined),
  };
}

function mapGridProductToCarousel(p: Product): CarouselProduct {
  const priceNum = p.price ?? 0;
  const sp = p.specialPrice != null ? Number(p.specialPrice) : undefined;
  const orig = p.oldPrice != null ? Number(p.oldPrice) : undefined;
  return {
    id: p.id,
    img: getImageUrl(p.thumbnailImageUrl),
    title: p.name ?? "",
    price: `₺${priceNum.toFixed(2)}`,
    specialPrice: sp,
    originalPrice: orig,
  };
}

/** CMS’te en az bir görünür blok var mı (ürün şeridi, carousel veya HTML)? */
function cmsHasDisplayableContent(widgets: any[]): boolean {
  for (const w of widgets) {
    if (w.widgetType === "CarouselWidget" && Array.isArray(w.items) && w.items.length > 0) return true;
    if (w.widgetType === "ProductWidget" && Array.isArray(w.products) && w.products.length > 0) return true;
    if (w.widgetType === "HtmlWidget" && typeof w.htmlData === "string" && w.htmlData.trim()) return true;
    if (typeof w.htmlData === "string" && w.htmlData.trim()) return true;
  }
  return false;
}

export default function HomeWidgetZones() {
  /** `undefined` = still loading; `[]` = API returned no rows. */
  const [widgets, setWidgets] = useState<any[] | undefined>(undefined);
  /**
   * CMS görünür içerik vermediğinde doldurulur.
   * `null` = CMS yeterli, fallback gerekmez; `undefined` = henüz karar yok; dizi = yüklendi.
   */
  const [fallbackStrips, setFallbackStrips] = useState<
    | {
        newArrivals: CarouselProduct[];
        bestsellers: CarouselProduct[];
        suggestions: CarouselProduct[];
      }
    | null
    | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const zoneIds = [
        WidgetZoneIds.HomeFeatured,
        WidgetZoneIds.HomeMainContent,
        WidgetZoneIds.HomeAfterMainContent,
      ];
      try {
        const chunks = await Promise.all(zoneIds.map((z) => getWidgetsByZone(z)));
        if (cancelled) return;
        const merged: any[] = [];
        for (let i = 0; i < zoneIds.length; i++) {
          const list = chunks[i];
          if (Array.isArray(list)) merged.push(...list);
        }

        merged.sort((a, b) => {
          const z = (Number(a.widgetZoneId) || 0) - (Number(b.widgetZoneId) || 0);
          if (z !== 0) return z;
          return (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0);
        });

        setWidgets(merged);
      } catch {
        if (!cancelled) setWidgets([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (widgets === undefined) return;
    if (cmsHasDisplayableContent(widgets)) {
      setFallbackStrips(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [gridNew, gridBest, gridMore] = await Promise.all([
          getProductsGrid({
            pageIndex: 0,
            pageSize: 8,
            sort: [{ field: "id", dir: "desc" }],
          }),
          getBestsellersGrid({ pageIndex: 0, pageSize: 8 }),
          getProductsGrid({
            pageIndex: 1,
            pageSize: 8,
            sort: [{ field: "id", dir: "desc" }],
          }),
        ]);
        if (cancelled) return;
        setFallbackStrips({
          newArrivals: (gridNew?.data ?? []).map(mapGridProductToCarousel),
          bestsellers: (gridBest?.data ?? []).map(mapGridProductToCarousel),
          suggestions: (gridMore?.data ?? []).map(mapGridProductToCarousel),
        });
      } catch {
        if (!cancelled) {
          setFallbackStrips({ newArrivals: [], bestsellers: [], suggestions: [] });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [widgets]);

  const reinitKey = useMemo(() => {
    if (widgets === undefined) return "pending";
    const base = widgets.map((w) => `${w.widgetType}-${w.id}`).join("|");
    if (fallbackStrips) {
      return `${base}|fb:${fallbackStrips.newArrivals.length}-${fallbackStrips.bestsellers.length}-${fallbackStrips.suggestions.length}`;
    }
    return base;
  }, [widgets, fallbackStrips]);

  const renderedBlocks = useMemo(() => {
    if (widgets === undefined) return [];

    const buildFromCms = (): ReactNode[] => {
      const out: ReactNode[] = [];
      let firstProductCarousel = true;
      let productStripCount = 0;
      let featuredReviewsInserted = false;
      let categoriesInserted = false;

      for (const w of widgets) {
        if (w.widgetType === "CarouselWidget" && Array.isArray(w.items) && w.items.length > 0) {
          out.push(
            <section key={`carousel-${w.id}`} className="home-billboard bg-light py-5">
              <div className="container">
                {w.name ? (
                  <h2 className="section-title text-center mt-4 mb-0">{w.name}</h2>
                ) : null}
                <div className="row">
                  <div className="swiper main-swiper py-4">
                    <div className="swiper-wrapper d-flex border-animation-left">
                      {w.items.map((item: Record<string, unknown>, idx: number) => {
                        const href = carouselTargetUrl(item);
                        const cap = carouselCaption(item);
                        const sub = carouselSubCaption(item);
                        const linkText = carouselLinkText(item) || "Keşfet";
                        const imgSrc = carouselImageUrl(item);
                        return (
                          <div key={idx} className="swiper-slide">
                            <div className="banner-item image-zoom-effect">
                              <div className="image-holder">
                                <Link href={href === "#" ? "/urunler" : href}>
                                  <Image
                                    src={imgSrc}
                                    alt={cap || ""}
                                    width={1200}
                                    height={900}
                                    sizes="100vw"
                                    quality={68}
                                    className="img-fluid w-100"
                                    style={{ objectFit: "cover", maxHeight: "min(70vh, 640px)" }}
                                    unoptimized
                                  />
                                </Link>
                              </div>
                              <div className="banner-content py-4">
                                {cap ? (
                                  <h5 className="element-title text-uppercase">
                                    <Link href={href === "#" ? "/urunler" : href} className="item-anchor">
                                      {cap}
                                    </Link>
                                  </h5>
                                ) : null}
                                {sub ? <p>{sub}</p> : null}
                                <div className="btn-left">
                                  <Link
                                    href={href === "#" ? "/urunler" : href}
                                    className="btn-link fs-6 text-uppercase item-anchor text-decoration-none"
                                  >
                                    {linkText}
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
          continue;
        }

        if (w.widgetType === "ProductWidget" && Array.isArray(w.products) && w.products.length > 0) {
          const products = (w.products as Record<string, unknown>[]).map(mapApiProductToCarousel);
          const eager = firstProductCarousel;
          firstProductCarousel = false;
          out.push(
            <ProductCarousel
              key={`product-widget-${w.id}`}
              id={`home-widget-${w.id}`}
              title={w.name || "Ürünler"}
              products={products}
              eagerFirstImage={eager}
            />
          );
          productStripCount += 1;
          if (productStripCount === 1) {
            out.push(<HomeCategories key="home-categories-after-new" />);
            categoriesInserted = true;
          }
          if (productStripCount === 2) {
            out.push(<HomeFeaturedReviews key="home-featured-reviews" />);
            featuredReviewsInserted = true;
          }
          continue;
        }

        if (w.widgetType === "HtmlWidget" && typeof w.htmlData === "string" && w.htmlData.trim()) {
          out.push(
            <section
              key={`html-widget-${w.id}`}
              className="home-html-widget py-4"
              data-aos="fade-up"
            >
              <div className="container">
                {w.name ? <h2 className="section-title text-center text-uppercase mb-3">{w.name}</h2> : null}
                <div dangerouslySetInnerHTML={{ __html: w.htmlData }} />
              </div>
            </section>
          );
          continue;
        }

        if (w.widgetType === "SpaceBarWidget") {
          let h = 24;
          try {
            const raw = typeof w.data === "string" ? w.data : "";
            const parsed = raw ? JSON.parse(raw) : null;
            const n = Number(parsed?.height ?? parsed?.Height);
            if (Number.isFinite(n) && n > 0) h = Math.min(240, n);
          } catch {
            /* default height */
          }
          out.push(<div key={`space-${w.id}`} style={{ height: h }} aria-hidden />);
          continue;
        }

        if (typeof w.htmlData === "string" && w.htmlData.trim()) {
          out.push(
            <section key={`generic-html-${w.id}`} className="home-generic-widget py-4" data-aos="fade-up">
              <div className="container">
                {w.name ? <h2 className="section-title text-center text-uppercase mb-3">{w.name}</h2> : null}
                <div dangerouslySetInnerHTML={{ __html: w.htmlData }} />
              </div>
            </section>
          );
        }
      }

      if (!categoriesInserted) {
        out.push(<HomeCategories key="home-categories-tail" />);
      }
      if (!featuredReviewsInserted) {
        out.push(<HomeFeaturedReviews key="home-featured-reviews-tail" />);
      }

      return out;
    };

    if (cmsHasDisplayableContent(widgets)) {
      return buildFromCms();
    }

    if (fallbackStrips === undefined || fallbackStrips === null) {
      return [];
    }

    const fb = fallbackStrips;
    const out: ReactNode[] = [];
    let eager = true;
    if (fb.newArrivals.length > 0) {
      out.push(
        <ProductCarousel
          key="fallback-new"
          id="home-fallback-new"
          title="Yeni Gelenler"
          products={fb.newArrivals}
          eagerFirstImage={eager}
        />
      );
      eager = false;
    }
    out.push(<HomeCategories key="home-categories-fallback" />);
    if (fb.bestsellers.length > 0) {
      out.push(
        <ProductCarousel
          key="fallback-best"
          id="home-fallback-bestsellers"
          title="En Çok Satanlar"
          products={fb.bestsellers}
          eagerFirstImage={eager}
        />
      );
      eager = false;
    }
    out.push(<HomeFeaturedReviews key="home-featured-reviews-fallback" />);
    if (fb.suggestions.length > 0) {
      out.push(
        <ProductCarousel
          key="fallback-suggest"
          id="home-fallback-suggestions"
          title="Beğenebileceğiniz Ürünler"
          products={fb.suggestions}
          eagerFirstImage={eager}
        />
      );
    }

    const anyProducts =
      fb.newArrivals.length + fb.bestsellers.length + fb.suggestions.length > 0;
    if (!anyProducts) {
      out.push(
        <section key="fallback-empty" className="container py-4 text-center">
          <p className="text-muted mb-0" style={{ maxWidth: "36rem", margin: "0 auto", lineHeight: 1.7 }}>
            Henüz vitrin ürünü yok veya API erişilemiyor. Ürünleri yönetim panelinden ekleyip yayınlayın; ana sayfa
            bileşenlerini de <strong>Ayarlar → Widget</strong> bölümünden zone’lara yerleştirebilirsiniz.
          </p>
        </section>
      );
    }

    return out;
  }, [widgets, fallbackStrips]);

  const showFallbackHero =
    widgets !== undefined &&
    renderedBlocks.length === 0 &&
    fallbackStrips != null &&
    fallbackStrips.newArrivals.length +
      fallbackStrips.bestsellers.length +
      fallbackStrips.suggestions.length ===
      0;

  return (
    <>
      {widgets === undefined ? null : (
        <>
          {renderedBlocks}
          {showFallbackHero ? (
            <section className="container" style={{ paddingTop: "120px", paddingBottom: "2rem" }}>
              <h1
                className="section-title text-center text-uppercase mb-3"
                style={{ fontFamily: "var(--font-marcellus)", fontSize: "clamp(1.75rem, 4vw, 2.25rem)" }}
              >
                Boutique Lavinia
              </h1>
              <p className="text-center text-muted mb-0" style={{ maxWidth: "36rem", margin: "0 auto", lineHeight: 1.7 }}>
                Sezonun seçkilerini keşfedin; ürünlerimiz için mağazaya göz atın.
              </p>
              <p className="text-center mt-4 mb-0">
                <Link
                  href="/urunler"
                  className="btn btn-outline-dark btn-sm text-uppercase"
                  style={{ letterSpacing: "0.08em" }}
                >
                  Mağazaya git
                </Link>
              </p>
            </section>
          ) : null}
        </>
      )}
      <SwiperInit reinitKey={reinitKey} />
    </>
  );
}
