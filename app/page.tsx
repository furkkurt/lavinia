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

export default function Home() {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Hide preloader when page loads
    const preloader = document.querySelector(".preloader");
    if (preloader) {
      preloader.classList.add("loaded");
    }

    // Fetch products - only once on mount
    const fetchProducts = async () => {
      if (!isMounted) return;

      try {
        // Fetch new arrivals (published products, sorted by ID desc)
        const newArrivalsRes = await getProductsGrid({
          pageIndex: 0,
          pageSize: 8,
          sort: [{ field: "id", dir: "desc" }],
          filter: {
            logic: "and",
            filters: [
              { field: "isPublished", operator: "eq", value: true }
            ]
          }
        });

        if (!isMounted) return;

        // Fetch best sellers (published products, can be sorted by sales later)
        const bestSellersRes = await getProductsGrid({
          pageIndex: 0,
          pageSize: 8,
          sort: [{ field: "id", dir: "desc" }],
          filter: {
            logic: "and",
            filters: [
              { field: "isPublished", operator: "eq", value: true }
            ]
          }
        });

        if (!isMounted) return;

        if (newArrivalsRes) {
          setNewArrivals(newArrivalsRes.data);
        }
        if (bestSellersRes) {
          setBestSellers(bestSellersRes.data);
        }
      } catch (error: any) {
        if (!isMounted) return;
        // Silently fail for public users - products grid requires authentication
        // Set empty arrays so page still renders
        // Only log if it's not a 401 (unauthorized) or 404 (not found) error
        if (error?.status !== 401 && error?.status !== 404 && error?.message?.includes('401') === false && error?.message?.includes('404') === false) {
          console.error('Error fetching products:', error);
        }
        setNewArrivals([]);
        setBestSellers([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <SvgSprite />
      <SwiperInit />
      
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
          <div className="row">
            <div className="swiper main-swiper py-4" data-aos="fade-up" data-aos-delay="600">
              <div className="swiper-wrapper d-flex border-animation-left">
                {[1, 2, 3, 4, 5, 6].map((num) => (
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
                          Scelerisque duis aliquam qui lorem ipsum dolor amet, consectetur adipiscing
                          elit.
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

      {!loading && (
        <ProductCarousel
          id="new-arrival"
          title="Yeni Gelenler"
          products={newArrivals.map((p) => ({
            id: p.id,
            img: p.thumbnailImageUrl || "/images/product-item-1.jpg",
            title: p.name,
            price: p.price ? `₺${p.price.toFixed(2)}` : "Fiyat Belirtilmemiş",
          }))}
          additionalClassName="new-arrival"
        />
      )}

      <section className="collection bg-light position-relative section-spacing">
        <div className="container">
          <div className="row">
            <div className="title-xlarge text-uppercase txt-fx domino">Koleksiyon</div>
            <div className="collection-item d-flex flex-wrap my-5">
              <div className="col-md-6 column-container">
                <div className="image-holder">
                  <Image
                    src="/images/single-image-2.jpg"
                    alt="collection"
                    className="product-image img-fluid"
                    width={600}
                    height={800}
                  />
                </div>
              </div>
              <div className="col-md-6 column-container bg-white">
                <div className="collection-content p-5 m-0 m-md-5">
                  <h3 className="element-title text-uppercase">Klasik Kış Koleksiyonu</h3>
                  <p>
                    Dignissim lacus, turpis ut suspendisse vel tellus. Turpis purus, gravida orci,
                    fringilla a. Ac sed eu fringilla odio mi. Consequat pharetra at magna imperdiet
                    cursus ac faucibus sit libero. Ultricies quam nunc, lorem sit lorem urna,
                    pretium aliquam ut. In vel, quis donec dolor id in. Pulvinar commodo mollis diam
                    sed facilisis at cursus imperdiet cursus ac faucibus sit faucibus sit libero.
                  </p>
                  <Link href="#" className="btn btn-dark text-uppercase mt-3">
                    Koleksiyonu Gör
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!loading && (
        <ProductCarousel
          id="best-sellers"
          title="En Çok Satanlar"
          products={bestSellers.map((p) => ({
            id: p.id,
            img: p.thumbnailImageUrl || "/images/product-item-1.jpg",
            title: p.name,
            price: p.price ? `₺${p.price.toFixed(2)}` : "Fiyat Belirtilmemiş",
          }))}
          additionalClassName="best-sellers"
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

      <ProductCarousel
        id="related-products"
        title="Beğenebileceğiniz Ürünler"
        products={[
                { id: 12, img: "product-item-5.jpg", title: "Koyu Çiçekli Tek Parça", price: "₺2.850" },
                { id: 13, img: "product-item-6.jpg", title: "Baggie Tişört", price: "₺1.650" },
                { id: 14, img: "product-item-7.jpg", title: "Pamuklu Krem Tişört", price: "₺1.950" },
                { id: 15, img: "product-item-8.jpg", title: "El Yapımı Krop Kazak", price: "₺1.500" },
                { id: 16, img: "product-item-1.jpg", title: "El Yapımı Krop Kazak", price: "₺2.100" },
        ]}
        additionalClassName="related-products"
      />

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
