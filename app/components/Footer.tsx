"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
      <footer id="footer" className="mt-3">
      <div className="container">
        {/* Desktop: 4-column layout, Mobile: Stacked layout */}
        <div className="row py-2 footer-main-content">
          {/* Column 1: Logo ve Sosyal Medya */}
          <div className="col-lg-3 col-12 footer-brand-col">
            <div className="footer-brand mb-2 footer-brand-desktop">
              <div className="footer-intro mb-2">
                <Link href="/" className="d-inline-block">
                  <Image src="/images/logo.png" alt="Boutique Lavinia" width={150} height={50} style={{ objectFit: "contain" }} />
                </Link>
              </div>
              <p className="footer-description" style={{ marginBottom: "0.75rem", lineHeight: "1.6" }}>
                Kadın giyiminde zarafet ve kaliteyi bir arada sunuyoruz. Yeni sezon koleksiyonlarımızla tarzınıza değer katıyoruz.
              </p>
              <div className="social-links">
                <ul className="list-unstyled d-flex flex-wrap gap-3 mb-0">
                  {[
                    { name: "instagram", url: "https://www.instagram.com/boutiquelavinia_/" },
                    { name: "facebook", url: "#" },
                    { name: "twitter", url: "#" },
                    { name: "youtube", url: "#" },
                    { name: "pinterest", url: "#" },
                  ].map((social) => (
                    <li key={social.name}>
                      <a href={social.url} className="text-secondary" target={social.url !== "#" ? "_blank" : undefined} rel={social.url !== "#" ? "noopener noreferrer" : undefined}>
                        <svg width="24" height="24" viewBox="0 0 24 24">
                          <use xlinkHref={`#${social.name}`}></use>
                        </svg>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Column 2: Hızlı Bağlantılar */}
          <div className="col-lg-3 col-6 footer-menu-col">
            <div className="footer-menu footer-menu-002">
              <h5 className="widget-title text-uppercase mb-2">
                Hızlı Bağlantılar
              </h5>
              <ul className="menu-list list-unstyled text-uppercase border-animation-left fs-6" style={{ lineHeight: "1.8" }}>
                {["Ana Sayfa", "Hakkımızda", "Hizmetler", "Ürünler", "İletişim"].map((link) => (
                  <li key={link} className="menu-item" style={{ marginBottom: "0.25rem" }}>
                    <Link href={link === "Ürünler" ? "/urunler" : "/"} className="item-anchor">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 3: Yardım & Bilgi */}
          <div className="col-lg-3 col-6 footer-menu-col">
            <div className="footer-menu footer-menu-003">
              <h5 className="widget-title text-uppercase mb-2">
                Yardım & Bilgi
              </h5>
              <ul className="menu-list list-unstyled text-uppercase border-animation-left fs-6" style={{ lineHeight: "1.8" }}>
                {[
                  "Sipariş Takibi",
                  "İade + Değişim",
                  "Kargo + Teslimat",
                  "İletişim",
                  "Bizi Bulun",
                  "Sık Sorulan Sorular",
                ].map((link) => (
                  <li key={link} className="menu-item" style={{ marginBottom: "0.25rem" }}>
                    <Link href="/" className="item-anchor">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 4: İletişim */}
          <div className="col-lg-3 col-12 footer-menu-col">
            <div className="footer-menu footer-menu-004">
              <h5 className="widget-title text-uppercase mb-2">
                İletişim
              </h5>
              <p style={{ marginBottom: "0.5rem", lineHeight: "1.6" }}>
                Sorularınız veya önerileriniz mi var?{" "}
                <a href="mailto:info@boutiquelavinia.com" className="item-anchor">
                  info@boutiquelavinia.com
                </a>
              </p>
              <p style={{ lineHeight: "1.6", marginBottom: 0 }}>
                Destek mi gerekiyor? Bizi arayın.{" "}
                <a href="tel:+90 212 123 45 67" className="item-anchor">
                  +90 212 123 45 67
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="border-top pt-1 pb-1">
        <div className="container">
          <div className="row align-items-center footer-bottom" style={{ gap: "0.5rem 0" }}>
            <div className="col-md-6 col-12 d-flex flex-wrap align-items-center justify-content-center justify-content-md-start" style={{ gap: "1rem" }}>
              <div className="shipping d-flex align-items-center flex-wrap justify-content-center" style={{ gap: "0.5rem" }}>
                <span className="footer-label">Kargo Firmaları:</span>
                <div className="d-flex gap-2">
                  <Image src="/images/arct-icon.png" alt="icon" width={40} height={24} style={{ objectFit: "contain" }} />
                  <Image src="/images/dhl-logo.png" alt="icon" width={40} height={24} style={{ objectFit: "contain" }} />
                </div>
              </div>
              <div className="payment-option d-flex align-items-center flex-wrap justify-content-center" style={{ gap: "0.5rem" }}>
                <span className="footer-label">Ödeme Seçenekleri:</span>
                <div className="d-flex gap-2">
                  <Image src="/images/visa-card.png" alt="card" width={40} height={24} style={{ objectFit: "contain" }} />
                  <Image src="/images/paypal-card.png" alt="card" width={40} height={24} style={{ objectFit: "contain" }} />
                  <Image src="/images/master-card.png" alt="card" width={40} height={24} style={{ objectFit: "contain" }} />
                </div>
              </div>
            </div>
            <div className="col-md-6 col-12 text-center text-md-end">
              <p className="footer-copyright" style={{ margin: 0, fontSize: "0.875rem" }}>
                © Copyright 2026 Boutique Lavinia. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
