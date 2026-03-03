"use client";

import Image from "next/image";
import SvgSprite from "./components/SvgSprite";
import SwiperInit from "./components/SwiperInit";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductCarousel from "./components/ProductCarousel";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getProductsGrid, Product } from "./lib/api/products";
import { getWidgetsByZone, WidgetZoneIds, ProductWidget } from "./lib/api/widgets";
import { getImageUrl } from "./lib/api/config";
import { getMenuCategories, CategoryMenuItem } from "./lib/api/categories";

export type HeroCarouselItem = {
  image: string;
  caption?: string;
  subCaption?: string;
  linkText?: string;
  targetUrl?: string;
};

export default function Home() {
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [widgets, setWidgets] = useState<ProductWidget[]>([]);
  const [heroCarouselItems, setHeroCarouselItems] = useState<HeroCarouselItem[]>([]);
  const [topCategories, setTopCategories] = useState<CategoryMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchWidgets = async () => {
      try {
        setLoading(true);

        // Hero carousel: fetch HomeFeatured zone (zone 1) for CarouselWidget
        const featuredWidgets = await getWidgetsByZone(WidgetZoneIds.HomeFeatured);
        if (isMounted && featuredWidgets && featuredWidgets.length > 0) {
          const carouselWidget = featuredWidgets.find((w: any) => w.widgetType === "CarouselWidget");
          if (carouselWidget && carouselWidget.items && carouselWidget.items.length > 0) {
            setHeroCarouselItems(
              carouselWidget.items.map((item: any) => ({
                image: getImageUrl(item.image || item.imageUrl),
                caption: item.caption,
                subCaption: item.subCaption,
                linkText: item.linkText,
                targetUrl: item.targetUrl || item.linkUrl,
              }))
            );
          }
        }

        // Try to fetch widgets from API first (matching template's HomeMainContent zone)
        const mainContentWidgets = await getWidgetsByZone(WidgetZoneIds.HomeMainContent);

        if (!isMounted) return;

        let hasWidgetData = false;
        if (mainContentWidgets && mainContentWidgets.length > 0) {
          const productWidgets = mainContentWidgets.filter(
            (w: any) => w.widgetType === 'ProductWidget'
          ) as ProductWidget[];

          if (productWidgets.length > 0) {
            setWidgets(productWidgets);
            // Transform widget products - matching template's _ProductThumbnail rendering
            productWidgets.forEach((widget, index) => {
              if (widget.products && widget.products.length > 0) {
                hasWidgetData = true; // only treat as widget data when we have products
                const transformed = widget.products.map((p) => {
                  const finalPrice = p.calculatedProductPrice?.price || p.price || 0;
                  return {
                    id: p.id,
                    img: getImageUrl(p.thumbnailUrl),
                    title: p.name || 'Ürün',
                    price: `₺${finalPrice.toFixed(2)}`,
                  };
                });
                if (index === 0) setNewArrivals(transformed);
                else if (index === 1) setBestSellers(transformed);
                else if (index === 2) setRecommendedProducts(transformed);
              }
            });
          }
        }

        // Fallback: If no widgets, fetch products directly (matching template's fallback logic)
        if (!hasWidgetData || newArrivals.length === 0) {
          // 1. Yeni Gelenler - Latest products (ordered by CreatedOn desc, matching template)
        const newArrivalsRes = await getProductsGrid({
          pageIndex: 0,
          pageSize: 8,
            sort: [{ field: "id", dir: "desc" }], // Template uses OrderByDescending(x => x.CreatedOn)
          filter: {
            logic: "and",
            filters: [
                { field: "isPublished", operator: "eq", value: true },
                { field: "isVisibleIndividually", operator: "eq", value: true }
            ]
          }
        });

          if (!isMounted) return;

          if (newArrivalsRes && newArrivalsRes.data && newArrivalsRes.data.length > 0) {
            const transformed = newArrivalsRes.data.map((p) => ({
              id: p.id,
              img: getImageUrl(p.thumbnailImageUrl), // Backend returns /user-content/xxx.jpg
              title: p.name || 'Ürün',
              price: `₺${p.price?.toFixed(2) || '0.00'}`,
            }));
            setNewArrivals(transformed);
          }
        }

        if (!hasWidgetData || bestSellers.length === 0) {
          // 2. En Çok Satanlar - First products (ordered by id asc)
        const bestSellersRes = await getProductsGrid({
          pageIndex: 0,
          pageSize: 8,
            sort: [{ field: "id", dir: "asc" }],
            filter: {
              logic: "and",
              filters: [
                { field: "isPublished", operator: "eq", value: true },
                { field: "isVisibleIndividually", operator: "eq", value: true }
              ]
            }
          });

          if (!isMounted) return;

          if (bestSellersRes && bestSellersRes.data && bestSellersRes.data.length > 0) {
            const transformed = bestSellersRes.data.map((p) => ({
              id: p.id,
              img: getImageUrl(p.thumbnailImageUrl),
              title: p.name || 'Ürün',
              price: `₺${p.price?.toFixed(2) || '0.00'}`,
            }));
            setBestSellers(transformed);
          }
        }

        if (!hasWidgetData || recommendedProducts.length === 0) {
          // 3. Beğenebileceğiniz Ürünler - Middle products (skip first 4, take next 8)
          const recommendedRes = await getProductsGrid({
            pageIndex: 0,
            pageSize: 12, // Get more to skip first 4
          sort: [{ field: "id", dir: "desc" }],
          filter: {
            logic: "and",
            filters: [
                { field: "isPublished", operator: "eq", value: true },
                { field: "isVisibleIndividually", operator: "eq", value: true }
            ]
          }
        });

          if (!isMounted) return;

          if (recommendedRes && recommendedRes.data && recommendedRes.data.length > 4) {
            // Skip first 4, take next 8 for variety
            const skipped = recommendedRes.data.slice(4, 12);
            const transformed = skipped.map((p) => ({
              id: p.id,
              img: getImageUrl(p.thumbnailImageUrl),
              title: p.name || 'Ürün',
              price: `₺${p.price?.toFixed(2) || '0.00'}`,
            }));
            setRecommendedProducts(transformed);
          } else if (recommendedRes && recommendedRes.data && recommendedRes.data.length > 0) {
            // If not enough products, just use what we have
            const transformed = recommendedRes.data.map((p) => ({
              id: p.id,
              img: getImageUrl(p.thumbnailImageUrl),
              title: p.name || 'Ürün',
              price: `₺${p.price?.toFixed(2) || '0.00'}`,
            }));
            setRecommendedProducts(transformed);
        }
        }

        // Final fallback: If still no data, use same products
        if (bestSellers.length === 0 && newArrivals.length > 0) {
          setBestSellers([...newArrivals]);
        }
        if (recommendedProducts.length === 0 && newArrivals.length > 0) {
          setRecommendedProducts([...newArrivals]);
        }
      } catch (error: any) {
        if (!isMounted) return;
        // Silently handle 404 - widgets endpoint might not exist yet
        if (error?.status !== 404) {
          console.error("Error fetching widgets:", error);
        }
      } finally {
        if (isMounted) {
        setLoading(false);
      }
      }
    };

    fetchWidgets();

    // Fetch top categories for collection section
    const fetchCategories = async () => {
      try {
        const categories = await getMenuCategories();
        if (categories && categories.length >= 3) {
          // Take first 3 categories
          setTopCategories(categories.slice(0, 3));
        }
      } catch (error) {
        // Silently fail
      }
    };

    fetchCategories();

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
      <SwiperInit key={heroCarouselItems.length > 0 ? "hero-dynamic" : "hero-static"} />
      
      <div className="preloader text-white fs-6 text-uppercase overflow-hidden"></div>

      <div className="search-popup">
        <div className="search-popup-container">
          <form role="search" method="get" className="form-group" action="">
            <input
              type="search"
              id="search-form"
              className="form-control border-0 border-bottom"
              placeholder="Type and press enter"
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

          <h5 className="cat-list-title">Browse Categories</h5>

          <ul className="cat-list">
            <li className="cat-list-item">
              <a href="#" title="Jackets">Jackets</a>
            </li>
            <li className="cat-list-item">
              <a href="#" title="T-shirts">T-shirts</a>
            </li>
            <li className="cat-list-item">
              <a href="#" title="Handbags">Handbags</a>
            </li>
            <li className="cat-list-item">
              <a href="#" title="Accessories">Accessories</a>
            </li>
            <li className="cat-list-item">
              <a href="#" title="Cosmetics">Cosmetics</a>
            </li>
            <li className="cat-list-item">
              <a href="#" title="Dresses">Dresses</a>
            </li>
            <li className="cat-list-item">
              <a href="#" title="Jumpsuits">Jumpsuits</a>
            </li>
          </ul>
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

      <section id="billboard" className="bg-light section-spacing">
        <div className="container">
          {heroCarouselItems.length === 0 && (
            <div className="row justify-content-center">
              <h1 className="section-title text-center mt-4" data-aos="fade-up">
                Yeni Koleksiyonlar
              </h1>
              <div className="col-md-6 text-center" data-aos="fade-up" data-aos-delay="300">
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Saepe voluptas ut dolorum
                  consequuntur, adipisci repellat! Eveniet commodi voluptatem voluptate, eum minima,
                  in suscipit explicabo voluptatibus harum, quibusdam ex repellat eaque!
                </p>
              </div>
            </div>
          )}
          <div className="row">
            <div className="swiper main-swiper py-4" data-aos="fade-up" data-aos-delay="600">
              <div className="swiper-wrapper d-flex border-animation-left">
                {heroCarouselItems.length > 0
                  ? heroCarouselItems.map((item, idx) => (
                      <div key={idx} className="swiper-slide">
                        <div className="banner-item image-zoom-effect">
                          <div className="image-holder">
                            <Link href={item.targetUrl || "#"}>
                              <Image
                                src={item.image}
                                alt={item.caption || "Banner"}
                                className="img-fluid"
                                width={800}
                                height={600}
                                unoptimized
                              />
                            </Link>
                          </div>
                          {(item.caption || item.subCaption || item.linkText) && (
                            <div className="banner-content py-4 text-center">
                              {item.caption && (
                                <h5 className="element-title text-uppercase">
                                  <Link href={item.targetUrl || "#"} className="item-anchor">
                                    {item.caption}
                                  </Link>
                                </h5>
                              )}
                              {item.subCaption && <p>{item.subCaption}</p>}
                              {item.linkText && (
                                <div className="btn-left d-flex justify-content-center">
                                  <Link
                                    href={item.targetUrl || "#"}
                                    className="btn-link fs-6 text-uppercase item-anchor text-decoration-none"
                                  >
                                    {item.linkText}
                                  </Link>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  : [1, 2, 3, 4, 5, 6].map((num) => (
                      <div key={num} className="swiper-slide">
                        <div className="banner-item image-zoom-effect">
                          <div className="image-holder">
                            <Link href="#">
                              <Image
                                src={`/images/banner-image-${num === 1 ? 6 : num}.jpg`}
                                alt="product"
                                className="img-fluid"
                                width={800}
                                height={600}
                              />
                            </Link>
                          </div>
                          <div className="banner-content py-4 text-center">
                            <h5 className="element-title text-uppercase">
                              <Link href="/" className="item-anchor">
                                Yumuşak Deri Ceketler
                              </Link>
                            </h5>
                            <p>
                              Scelerisque duis aliquam qui lorem ipsum dolor amet, consectetur
                              adipiscing elit.
                            </p>
                            <div className="btn-left d-flex justify-content-center">
                              <Link
                                href="#"
                                className="btn-link fs-6 text-uppercase item-anchor text-decoration-none"
                              >
                                Keşfet
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
              <div className="swiper-pagination"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="features section-spacing">
        <div className="container">
          <div className="row justify-content-center">
            {[
              { icon: "cart", title: "Hızlı Kargo", desc: "Siparişleriniz 24 saat içinde kargoya verilir, hızlı ve güvenli teslimat." },
              { icon: "gift", title: "Özel Paketleme", desc: "Her ürün özenle paketlenir, özel günleriniz için özel tasarım paketleme." },
              { icon: "arrow-cycle", title: "Ücretsiz İade", desc: "30 gün içinde ücretsiz iade ve değişim garantisi, memnuniyetiniz bizim için önemli." },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="col-md-4 text-center"
                data-aos="fade-in"
                data-aos-delay={idx * 300}
              >
                <div className="py-3">
                  <svg width="38" height="38" viewBox="0 0 24 24">
                    <use xlinkHref={`#${feature.icon}`}></use>
                  </svg>
                  <h4 className="element-title text-capitalize my-2">{feature.title}</h4>
                  <p className="mb-0">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

        {/* Yeni Gelenler Widget */}
        {newArrivals.length > 0 && (
        <ProductCarousel
          id="new-arrival"
            title={widgets.length > 0 && widgets[0] ? (widgets[0].name || "Yeni Gelenler") : "Yeni Gelenler"}
            products={newArrivals}
          additionalClassName="new-arrival"
        />
      )}

      {/* Category Widgets Section - Replaces Koleksiyon */}
      {topCategories.length > 0 && (
      <section className="collection bg-light position-relative section-spacing">
        <div className="container">
          <div className="row">
              <div className="title-xlarge text-uppercase txt-fx domino">Koleksiyonlar</div>
            <div className="collection-item d-flex flex-wrap my-5">
                {topCategories.map((category, index) => (
                  <div key={category.id} className={`col-md-${12 / topCategories.length} column-container`}>
                <div className="image-holder">
                      <Link href={`/products?category=${category.slug}`}>
                  <Image
                          src={`/images/banner-image-${(index % 6) + 1}.jpg`}
                          alt={category.name}
                    className="product-image img-fluid"
                    width={600}
                          height={400}
                  />
                      </Link>
                </div>
                    <div className="collection-content p-4 text-center bg-white">
                      <h3 className="element-title text-uppercase">{category.name}</h3>
                      <Link href={`/products?category=${category.slug}`} className="btn btn-dark text-uppercase mt-3">
                    Koleksiyonu Gör
                  </Link>
                </div>
              </div>
                ))}
            </div>
          </div>
        </div>
      </section>
      )}

        {/* En Çok Satanlar Widget */}
        {bestSellers.length > 0 && (
        <ProductCarousel
          id="best-sellers"
            title={widgets.length > 1 && widgets[1] ? (widgets[1].name || "En Çok Satanlar") : "En Çok Satanlar"}
            products={bestSellers}
          additionalClassName="best-sellers"
        />
      )}

        {/* Beğenebileceğiniz Ürünler Widget */}
        {recommendedProducts.length > 0 && (
          <ProductCarousel
            id="recommended-products"
            title={widgets.length > 2 && widgets[2] ? (widgets[2].name || "Beğenebileceğiniz Ürünler") : "Beğenebileceğiniz Ürünler"}
            products={recommendedProducts}
            additionalClassName="recommended-products"
          />
        )}

      <section className="testimonials section-spacing bg-light">
        <div className="section-header text-center">
          <h3 className="section-title">GÜZEL YORUMLARI SEVİYORUZ</h3>
        </div>
        <div className="swiper testimonial-swiper overflow-hidden my-5">
          <div className="swiper-wrapper d-flex">
            {[
              { text: "Beklentilerin çok üzerinde çılgınca yumuşak, esnek ve mükemmel oturan beyaz basit denim gömlek.", title: "günlük tarz" },
              { text: "Beklentilerin çok üzerinde mükemmel oturan beyaz denim gömlek, çılgınca yumuşak ve esnek", title: "üst seviye" },
              { text: "Beklentilerin çok üzerinde mükemmel oturan beyaz denim gömlek, beklenenden daha esnek ve çılgınca yumuşak.", title: "Denim tutkusu" },
              { text: "Beklentilerin çok üzerinde mükemmel oturan beyaz denim gömlek, çılgınca yumuşak ve esnek", title: "üst seviye" },
              { text: "Beklentilerin çok üzerinde çılgınca yumuşak, esnek ve mükemmel oturan beyaz basit denim gömlek.", title: "günlük tarz" },
              { text: "Beklentilerin çok üzerinde mükemmel oturan beyaz denim gömlek, çılgınca yumuşak ve esnek", title: "moda sever" },
            ].map((testimonial, idx) => (
              <div key={idx} className="swiper-slide">
                <div className="testimonial-item text-center">
                  <blockquote>
                    <p>"{testimonial.text}"</p>
                    <div className="review-title text-uppercase">{testimonial.title}</div>
                  </blockquote>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="testimonial-swiper-pagination d-flex justify-content-center mb-5"></div>
      </section>


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

      <section className="instagram position-relative">
        <div className="row g-0" style={{ margin: 0 }}>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <div key={num} className="col-6 col-sm-4 col-md-2" style={{ padding: 0, margin: 0 }}>
              <div className="insta-item" style={{ height: "400px", overflow: "hidden", margin: 0 }}>
                <a
                  href="https://www.instagram.com/templatesjungle/"
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
            href="https://www.instagram.com/templatesjungle/"
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
