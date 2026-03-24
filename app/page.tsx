"use client";

import Image from "next/image";
import SvgSprite from "./components/SvgSprite";
import SwiperInit from "./components/SwiperInit";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductCarousel from "./components/ProductCarousel";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { getProductsGrid, getBestsellersGrid, ProductGridParams } from "./lib/api/products";
import { getImageUrl } from "./lib/api/config";
import { getMenuCategories, CategoryMenuItem } from "./lib/api/categories";
import { getFeaturedReviews, ProductReview } from "./lib/api/reviews";

export type HeroCarouselItem = {
  image: string;
  caption?: string;
  subCaption?: string;
  linkText?: string;
  targetUrl?: string;
};

// Ürünler sayfasıyla aynı yöntem: doğrudan products API'den çekip carousel'de gösteriyoruz.
const productFilter = {
  logic: "and" as const,
  filters: [
    { field: "isPublished", operator: "eq" as const, value: true },
    { field: "isVisibleIndividually", operator: "eq" as const, value: true },
  ],
};

function isSpecialPriceActive(p: any): boolean {
  if (!p.specialPrice || p.specialPrice <= 0) return false;
  const now = new Date();
  if (p.specialPriceStart && new Date(p.specialPriceStart) > now) return false;
  if (p.specialPriceEnd && new Date(p.specialPriceEnd) < now) return false;
  return p.specialPrice < (p.price ?? 0);
}

function toCarouselProduct(p: any) {
  const hasDiscount = isSpecialPriceActive(p);
  return {
    id: p.id,
    img: getImageUrl(p.thumbnailImageUrl),
    title: p.name || "Ürün",
    price: `₺${(hasDiscount ? p.specialPrice : (p.price ?? 0)).toFixed(2)}`,
    stockQuantity: p.stockQuantity as number | undefined,
    stockTrackingIsEnabled: p.stockTrackingIsEnabled as boolean | undefined,
    specialPrice: hasDiscount ? p.specialPrice : undefined,
    originalPrice: hasDiscount ? p.price : undefined,
  };
}

/** Anasayfa: Üst Giyim, Alt Giyim, Dış Giyim, Aksesuar sırası */
function pickHomepageCategoryCards(cats: CategoryMenuItem[]): CategoryMenuItem[] {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const targets = ["ust giyim", "alt giyim", "dis giyim", "aksesuar"];
  const out: CategoryMenuItem[] = [];
  for (const t of targets) {
    const found = cats.find((c) => {
      const n = norm(c.name);
      const slug = norm((c.slug || "").replace(/-/g, " "));
      return n.includes(t) || slug.includes(t.replace(/ /g, "")) || slug.includes(t);
    });
    if (found && !out.some((x) => x.id === found.id)) out.push(found);
  }
  return out;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Home() {
  const [enSonEklenen, setEnSonEklenen] = useState<{ id: number; img: string; title: string; price: string }[]>([]);
  const [newArrivals, setNewArrivals] = useState<{ id: number; img: string; title: string; price: string }[]>([]);
  const [bestSellers, setBestSellers] = useState<{ id: number; img: string; title: string; price: string }[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<{ id: number; img: string; title: string; price: string }[]>([]);
  const [heroCarouselItems, setHeroCarouselItems] = useState<HeroCarouselItem[]>([]);
  const [topCategories, setTopCategories] = useState<CategoryMenuItem[]>([]);
  const [featuredReviews, setFeaturedReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  /** categoryId -> ürün thumbnail URL havuzu (kategori + alt kategoriler grid'den) */
  const [categoryThumbPools, setCategoryThumbPools] = useState<Record<number, string[]>>({});
  /** Her kartta gösterilen havuz indeksi */
  const [categoryThumbIndex, setCategoryThumbIndex] = useState<Record<number, number>>({});

  const homeCategoryCards = useMemo(() => pickHomepageCategoryCards(topCategories), [topCategories]);

  const fallbackBanner = (i: number) => `/images/banner-image-${(i % 6) + 1}.jpg`;

  useEffect(() => {
    if (homeCategoryCards.length === 0) return;
    let cancelled = false;
    (async () => {
      const pools: Record<number, string[]> = {};
      await Promise.all(
        homeCategoryCards.map(async (cat) => {
          try {
            const res = await getProductsGrid({
              pageIndex: 0,
              pageSize: 24,
              categorySlug: cat.slug,
              sort: [{ field: "id", dir: "desc" }],
              filter: productFilter,
            });
            if (cancelled) return;
            const urls = shuffleArray(
              (res?.data ?? [])
                .map((p) => getImageUrl(p.thumbnailImageUrl))
                .filter((u) => u && !u.includes("product-item-1.jpg"))
            );
            pools[cat.id] = urls.length > 0 ? urls : [];
          } catch {
            if (!cancelled) pools[cat.id] = [];
          }
        })
      );
      if (!cancelled) {
        setCategoryThumbPools(pools);
        const initialIdx: Record<number, number> = {};
        for (const c of homeCategoryCards) {
          const len = pools[c.id]?.length ?? 0;
          initialIdx[c.id] = len > 0 ? Math.floor(Math.random() * len) : 0;
        }
        setCategoryThumbIndex(initialIdx);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [homeCategoryCards]);

  useEffect(() => {
    if (homeCategoryCards.length === 0) return;
    const timer = window.setInterval(() => {
      setCategoryThumbIndex((prev) => {
        const next = { ...prev };
        for (const c of homeCategoryCards) {
          const pool = categoryThumbPools[c.id] || [];
          if (pool.length <= 1) continue;
          let n = Math.floor(Math.random() * pool.length);
          if (n === prev[c.id]) n = (n + 1) % pool.length;
          next[c.id] = n;
        }
        return next;
      });
    }, 4500);
    return () => window.clearInterval(timer);
  }, [homeCategoryCards, categoryThumbPools]);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      // DEBUG: ürünler sayfasıyla birebir aynı parametreler
      const params: ProductGridParams = {
        pageIndex: 0,
        pageSize: 12,
        sort: [{ field: "id", dir: "desc" }],
        filter: {
          logic: "and",
          filters: [
            { field: "isPublished", operator: "eq", value: true },
            { field: "isVisibleIndividually", operator: "eq", value: true },
          ],
        },
      };
      try {
        setLoading(true);
        const response = await getProductsGrid(params);

        if (!isMounted) {
          return;
        }

        if (response && response.data && response.data.length > 0) {
          const carousel = response.data.map(toCarouselProduct);
          setEnSonEklenen(carousel.slice(0, 9));
          setNewArrivals(carousel.slice(0, 12));
          setRecommendedProducts(carousel.length > 8 ? carousel.slice(4, 16) : carousel);
        }

        const best = await getBestsellersGrid({ pageIndex: 0, pageSize: 12 });
        if (isMounted && best?.data?.length) {
          setBestSellers(best.data.map(toCarouselProduct));
        } else if (isMounted && response?.data?.length) {
          setBestSellers(response.data.slice(0, 12).map(toCarouselProduct));
        }
      } catch (e: any) {
        console.error("[Home] fetchProducts hata:", e?.message ?? e, "status:", e?.status);
        if (isMounted && e?.status !== 404) console.error("[Home] full error:", e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    // Fetch top categories for collection section
    const fetchCategories = async () => {
      try {
        const categories = await getMenuCategories();
        if (categories && categories.length > 0) {
          setTopCategories(categories);
        }
      } catch (error) {
        // Silently fail
      }
    };

    fetchCategories();

    const fetchReviews = async () => {
      try {
        const data = await getFeaturedReviews();
        if (isMounted && data.length > 0) setFeaturedReviews(data);
      } catch {
        // ignore
      }
    };
    fetchReviews();

    // Hide preloader when page loads
    const preloader = document.querySelector(".preloader");
    if (preloader) {
      preloader.classList.add("loaded");
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <SvgSprite />
      {/* key: ürünler yüklendiğinde yeniden mount et ki product carousel'ler de Swiper ile init edilsin */}
      <SwiperInit key={enSonEklenen.length > 0 ? "with-products" : "no-products"} />
      
      <div className="preloader text-white fs-6 text-uppercase overflow-hidden"></div>

      <div className="search-popup">
        <div className="search-popup-container">
          <form role="search" method="get" className="form-group" action="">
            <input
              type="search"
              id="search-form"
              className="form-control border-0 border-bottom"
              placeholder="Yazın ve Enter'a basın"
              defaultValue=""
              name="s"
            />
            <button
              type="submit"
              className="search-submit border-0 position-absolute bg-white"
              style={{ top: "15px", right: "15px" }}
            >
              <svg className="search" width="24" height="24">
                <use xlinkHref="#search"></use>
              </svg>
            </button>
          </form>

          <h5 className="cat-list-title">Kategorilere Göz At</h5>

          <ul className="cat-list">
            <li className="cat-list-item">
              <Link href="/urunler?category=ceket" title="Ceket">Ceket</Link>
            </li>
            <li className="cat-list-item">
              <Link href="/urunler?category=tisort" title="Tişört">Tişört</Link>
            </li>
            <li className="cat-list-item">
              <Link href="/urunler?category=canta" title="Çanta">Çanta</Link>
            </li>
            <li className="cat-list-item">
              <Link href="/urunler?category=taki" title="Aksesuar">Aksesuar</Link>
            </li>
            <li className="cat-list-item">
              <Link href="/urunler?category=kozmetik" title="Kozmetik">Kozmetik</Link>
            </li>
            <li className="cat-list-item">
              <Link href="/urunler?category=gunluk-elbise" title="Elbise">Elbise</Link>
            </li>
            <li className="cat-list-item">
              <Link href="/urunler?category=tulum" title="Tulum">Tulum</Link>
            </li>
          </ul>
        </div>
      </div>

      <div
        className="offcanvas offcanvas-end"
        data-bs-scroll="true"
        tabIndex={-1}
        id="offcanvasCart"
        aria-labelledby="Sepet"
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
            <h4 id="Sepet" className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-primary">Sepetiniz</span>
              <span className="badge bg-primary rounded-pill">3</span>
            </h4>
            <ul className="list-group mb-3">
              <li className="list-group-item d-flex justify-content-between lh-sm">
                <div>
                  <h6 className="my-0">Ürün 1</h6>
                  <small className="text-body-secondary">Kısa açıklama</small>
                </div>
                <span className="text-body-secondary">₺1200</span>
              </li>
              <li className="list-group-item d-flex justify-content-between lh-sm">
                <div>
                  <h6 className="my-0">Ürün 2</h6>
                  <small className="text-body-secondary">Kısa açıklama</small>
                </div>
                <span className="text-body-secondary">₺800</span>
              </li>
              <li className="list-group-item d-flex justify-content-between lh-sm">
                <div>
                  <h6 className="my-0">Ürün 3</h6>
                  <small className="text-body-secondary">Kısa açıklama</small>
                </div>
                <span className="text-body-secondary">₺500</span>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>Toplam (TL)</span>
                <strong>₺2500</strong>
              </li>
            </ul>

            <button className="w-100 btn btn-primary btn-lg" type="submit">
              Ödemeye Devam Et
            </button>
          </div>
        </div>
      </div>

      <Navbar />

      {/* 1. YENİ GELENLER – tek tasarım: ProductCarousel */}
      {newArrivals.length > 0 && (
        <ProductCarousel id="yeni-gelenler" title="Yeni Gelenler" products={newArrivals} additionalClassName="yeni-gelenler" compactBottom />
      )}

      {/* 2. Kategoriler — ürün thumbnail’leri rastgele döner; alt kategori listesi yok */}
      {homeCategoryCards.length > 0 && (
        <section className="collection home-categories bg-light position-relative pt-5 mt-5 section-spacing">
          <div className="container">
            <div className="row">
              <div className="col-12 position-relative collection-heading-row mb-2 mb-md-3">
                <h2 className="section-title text-uppercase mb-0 position-relative z-1 pt-1">Kategoriler</h2>
                <div className="title-xlarge text-uppercase txt-fx domino home-categories-title-bg" aria-hidden="true">
                  Kategoriler
                </div>
              </div>
            </div>
            <div className="collection-item row g-3 g-lg-4 my-2 my-md-4 w-100 mx-0">
                {homeCategoryCards.map((category, index) => {
                  const pool = categoryThumbPools[category.id] || [];
                  const idx = categoryThumbIndex[category.id] ?? 0;
                  const imgSrc = pool.length > 0 ? pool[idx % pool.length] : fallbackBanner(index);
                  const isRemote = imgSrc.startsWith("http://") || imgSrc.startsWith("https://");
                  return (
                    <div key={category.id} className="col-6 col-md-3 column-container mb-3 mb-lg-0">
                      <div className="image-holder home-category-image-wrap position-relative overflow-hidden rounded-1">
                        <Link href={`/urunler?category=${encodeURIComponent(category.slug)}`} className="d-block h-100">
                          <Image
                            key={imgSrc}
                            src={imgSrc}
                            alt={category.name}
                            className="product-image img-fluid w-100 h-100 home-category-thumb-animate"
                            width={360}
                            height={640}
                            style={{ objectFit: "cover" }}
                            unoptimized={isRemote}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = fallbackBanner(index);
                            }}
                          />
                        </Link>
                      </div>
                      <div className="collection-content p-2 p-md-4 text-center bg-white">
                        <h3 className="element-title text-uppercase">{category.name}</h3>
                        <Link href={`/urunler?category=${encodeURIComponent(category.slug)}`} className="btn btn-dark text-uppercase mt-1">
                          Tümünü Gör
                        </Link>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* EN ÇOK SATANLAR – tek tasarım: ProductCarousel */}
      {bestSellers.length > 0 && (
        <ProductCarousel id="en-cok-satanlar" title="En Çok Satanlar" products={bestSellers} additionalClassName="best-sellers" />
      )}

      {/* 7. Müşteri Yorumları */}
      <section className="testimonials section-spacing bg-light">
        <div className="section-header text-center testimonials-section-header px-2 px-md-3">
          <h3 className="section-title testimonials-main-title">MÜŞTERİ YORUMLARI</h3>
        </div>
        <div className="swiper testimonial-swiper overflow-hidden mb-3 testimonials-swiper-body">
          <div className="swiper-wrapper d-flex">
            {(featuredReviews.length > 0
              ? featuredReviews.map((r) => ({ text: r.comment || r.title || "", title: r.reviewerName, rating: r.rating }))
              : [
                  { text: "Beklentilerin çok üzerinde çılgınca yumuşak, esnek ve mükemmel oturan beyaz basit denim gömlek.", title: "Müşteri", rating: 5 },
                  { text: "Beklentilerin çok üzerinde mükemmel oturan beyaz denim gömlek, çılgınca yumuşak ve esnek", title: "Müşteri", rating: 5 },
                  { text: "Beklentilerin çok üzerinde mükemmel oturan beyaz denim gömlek, beklenenden daha esnek ve çılgınca yumuşak.", title: "Müşteri", rating: 5 },
                ]
            ).map((testimonial, idx) => (
              <div key={idx} className="swiper-slide">
                <div className="testimonial-item text-center">
                  <blockquote>
                    <div className="mb-2 text-warning">{"★".repeat(testimonial.rating)}{"☆".repeat(5 - testimonial.rating)}</div>
                    <p>&ldquo;{testimonial.text}&rdquo;</p>
                    <div className="review-title text-uppercase">{testimonial.title}</div>
                  </blockquote>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="testimonial-swiper-pagination d-flex justify-content-center mb-0"></div>
      </section>

      {/* 8. DOPAMİN KAYNAKLARI – tek tasarım: ProductCarousel */}
      {recommendedProducts.length > 0 && (
        <ProductCarousel id="begenebileceginiz-urunler" title="Beğenebileceğiniz Ürünler" products={recommendedProducts} additionalClassName="begenebileceginiz-urunler" />
      )}

      {/* 9. Bülten */}
      <section
        className="newsletter bg-light section-spacing"
        style={{ background: "url(/images/pattern-bg.png) no-repeat" }}
      >
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="subscribe-header text-center pb-3">
                <h3 className="section-title text-uppercase">Bültenimize Kaydolun</h3>
              </div>
              <form id="form" className="d-flex flex-wrap gap-2">
                <input
                  type="text"
                  name="email"
                  placeholder="E-posta Adresiniz"
                  className="form-control form-control-lg"
                />
                <button className="btn btn-dark btn-lg text-uppercase w-100">Kaydol</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Instagram */}
      <section className="instagram position-relative">
        <div className="row g-0" style={{ margin: 0 }}>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <div key={num} className="col-6 col-sm-4 col-md-2" style={{ padding: 0, margin: 0 }}>
              <div className="insta-item" style={{ height: "400px", overflow: "hidden", margin: 0 }}>
                <a
                  href="https://www.instagram.com/boutiquelavinia_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block", height: "100%", width: "100%" }}
                >
                  <Image
                    src={`/images/insta-item${num}.jpg`}
                    alt="instagram"
                    className="insta-image img-fluid"
                    width={400}
                    height={400}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </a>
              </div>
            </div>
          ))}
        </div>
        <div className="instagram-button-overlay">
          <a
            href="https://www.instagram.com/boutiquelavinia_/"
            className="btn btn-dark instagram-follow-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram'da Bizi Takip Edin
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
