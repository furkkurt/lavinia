"use client";

import Image from "next/image";
import SvgSprite from "./components/SvgSprite";
import SwiperInit from "./components/SwiperInit";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductCarousel from "./components/ProductCarousel";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getProductsGrid, ProductGridParams } from "./lib/api/products";
import { getImageUrl, API_BASE_URL } from "./lib/api/config";
import { getMenuCategories, CategoryMenuItem } from "./lib/api/categories";
import { getRecentBrandsWithProductImage, RecentBrandWithImage } from "./lib/api/brands";

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

function toCarouselProduct(p: { id: number; name?: string; thumbnailImageUrl?: string; price?: number }) {
  return {
    id: p.id,
    img: getImageUrl(p.thumbnailImageUrl),
    title: p.name || "Ürün",
    price: `₺${(p.price ?? 0).toFixed(2)}`,
  };
}

export default function Home() {
  const [enSonEklenen, setEnSonEklenen] = useState<{ id: number; img: string; title: string; price: string }[]>([]);
  const [newArrivals, setNewArrivals] = useState<{ id: number; img: string; title: string; price: string }[]>([]);
  const [bestSellers, setBestSellers] = useState<{ id: number; img: string; title: string; price: string }[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<{ id: number; img: string; title: string; price: string }[]>([]);
  const [heroCarouselItems, setHeroCarouselItems] = useState<HeroCarouselItem[]>([]);
  const [topCategories, setTopCategories] = useState<CategoryMenuItem[]>([]);
  const [recentBrands, setRecentBrands] = useState<RecentBrandWithImage[]>([]);
  const [loading, setLoading] = useState(true);

  /** Kategoriler bölümünde gösterilecek sabit etiketler (site Türkçe) */
  const categoryLabels = ["Erkek", "Kadın", "Takı"];

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
      console.log("[Home] fetchProducts başladı, API_BASE_URL:", API_BASE_URL, "params:", params);

      try {
        setLoading(true);
        const response = await getProductsGrid(params);

        console.log("[Home] getProductsGrid response:", response);
        console.log("[Home] response?.data length:", response?.data?.length);
        console.log("[Home] response?.total:", response?.total);

        if (!isMounted) {
          console.log("[Home] unmounted, skip setState");
          return;
        }

        if (response && response.data && response.data.length > 0) {
          const carousel = response.data.map(toCarouselProduct);
          setEnSonEklenen(carousel.slice(0, 9));
          setNewArrivals(carousel.slice(0, 12));
          setBestSellers(carousel.slice(0, 12));
          setRecommendedProducts(carousel.length > 8 ? carousel.slice(4, 16) : carousel);
        } else {
          console.warn("[Home] response boş veya data yok:", { hasResponse: !!response, dataLength: response?.data?.length });
        }
      } catch (e: any) {
        console.error("[Home] fetchProducts hata:", e?.message ?? e, "status:", e?.status);
        if (isMounted && e?.status !== 404) console.error("[Home] full error:", e);
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log("[Home] fetchProducts bitti, loading=false");
        }
      }
    };

    fetchProducts();

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

    const fetchRecentBrands = async () => {
      try {
        const data = await getRecentBrandsWithProductImage();
        if (data && data.length > 0) setRecentBrands(data.slice(0, 3));
      } catch {
        // ignore
      }
    };
    fetchRecentBrands();

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

      {/* 1. Yeni Koleksiyonlar – veritabanında en son kullanılan 3 marka, kartta markanın ilk ürününün resmi */}
      {recentBrands.length > 0 && (
        <section className="container section-spacing">
          <div className="text-center mb-4">
            <h1 className="section-title">Yeni Koleksiyonlar</h1>
            <p className="text-muted mx-auto" style={{ maxWidth: "42rem" }}>
              Yeni sezon parçalarıyla tarzınızı keşfedin. Özenle seçilmiş koleksiyonlar sizleri bekliyor.
            </p>
          </div>
          <div className="row g-4 justify-content-center">
            {recentBrands.map((brand) => (
              <div key={brand.id} className="col-md-4">
                <div className="product-item image-zoom-effect link-effect">
                  <div className="image-holder position-relative">
                    <Link href={brand.slug ? `/products?brand=${encodeURIComponent(brand.slug)}` : "/products"}>
                      <Image
                        src={getImageUrl(brand.thumbnailImageUrl || "")}
                        alt={brand.name}
                        className="product-image img-fluid w-100"
                        width={400}
                        height={500}
                        style={{ height: "auto", objectFit: "cover" }}
                        unoptimized
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/product-item-1.jpg";
                        }}
                      />
                    </Link>
                  </div>
                  <div className="product-content text-center">
                    <h5 className="element-title text-uppercase fs-6 mt-3">
                      <Link href={brand.slug ? `/products?brand=${encodeURIComponent(brand.slug)}` : "/products"}>
                        {brand.name}
                      </Link>
                    </h5>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. YENİ GELENLER – tek tasarım: ProductCarousel */}
      {newArrivals.length > 0 && (
        <ProductCarousel id="yeni-gelenler" title="Yeni Gelenler" products={newArrivals} additionalClassName="yeni-gelenler" compactBottom />
      )}

      {/* 3. Kategoriler – Yeni Gelenler ile arasında boşluk yok; başlık "Kategoriler", Erkek / Kadın / Takı */}
      {topCategories.length > 0 && (
        <section className="collection bg-light position-relative pt-5 mt-5 section-spacing">
          <div className="container">
            <div className="row">
              <div className="title-xlarge text-uppercase txt-fx domino">Kategoriler</div>
              <div className="collection-item d-flex flex-wrap my-5">
                {topCategories.slice(0, 3).map((category, index) => (
                  <div key={category.id} className="col-md-4 column-container">
                    <div className="image-holder">
                      <Link href={`/products?category=${category.slug}`}>
                        <Image
                          src={`/images/banner-image-${(index % 6) + 1}.jpg`}
                          alt={categoryLabels[index] ?? category.name}
                          className="product-image img-fluid"
                          width={600}
                          height={400}
                        />
                      </Link>
                    </div>
                    <div className="collection-content p-4 text-center bg-white">
                      <h3 className="element-title text-uppercase">{categoryLabels[index] ?? category.name}</h3>
                      <Link href={`/products?category=${category.slug}`} className="btn btn-dark text-uppercase mt-3">
                        Kategoriyi Gör
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* EN ÇOK SATANLAR – tek tasarım: ProductCarousel */}
      {bestSellers.length > 0 && (
        <ProductCarousel id="en-cok-satanlar" title="En Çok Satanlar" products={bestSellers} additionalClassName="best-sellers" />
      )}

      {/* 7. Alıntı / yorumlar */}
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
