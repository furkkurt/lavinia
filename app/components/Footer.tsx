"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
      <footer id="footer" className="mt-3">
      <div className="container">
        <div className="row py-2 footer-main-content">
          <div className="col-lg-4 col-12 footer-brand-col">
            <div className="footer-brand mb-2 footer-brand-desktop">
              <div className="footer-intro mb-2">
                <Link href="/" className="d-inline-block">
                  <Image src="/images/logo.png" alt="Boutique Lavinia" width={150} height={50} style={{ objectFit: "contain" }} />
                </Link>
              </div>
              <p className="footer-description" style={{ marginBottom: "0.75rem", lineHeight: "1.6" }}>
                Kadın giyiminde zarafet ve kaliteyi bir arada sunuyoruz. Yeni sezon koleksiyonlarımızla tarzınıza değer katıyoruz.
              </p>
              <p className="small text-muted mb-2" style={{ lineHeight: 1.6 }}>
                <a href="mailto:info@boutiquelavinia.com" className="item-anchor text-secondary">
                  info@boutiquelavinia.com
                </a>
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

          <div className="col-lg-4 col-6 footer-menu-col">
            <div className="footer-menu footer-menu-002">
              <h5 className="widget-title text-uppercase mb-2">
                Hızlı Bağlantılar
              </h5>
              <ul className="menu-list list-unstyled text-uppercase border-animation-left fs-6" style={{ lineHeight: "1.8" }}>
                <li className="menu-item" style={{ marginBottom: "0.25rem" }}>
                  <Link href="/" className="item-anchor">Ana Sayfa</Link>
                </li>
                <li className="menu-item" style={{ marginBottom: "0.25rem" }}>
                  <Link href="/hakkimizda" className="item-anchor">Hakkımızda</Link>
                </li>
                <li className="menu-item" style={{ marginBottom: "0.25rem" }}>
                  <Link href="/urunler" className="item-anchor">Ürünler</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="col-lg-4 col-6 footer-menu-col">
            <div className="footer-menu footer-menu-003">
              <h5 className="widget-title text-uppercase mb-2">
                Yardım
              </h5>
              <ul className="menu-list list-unstyled text-uppercase border-animation-left fs-6" style={{ lineHeight: "1.8" }}>
                <li className="menu-item" style={{ marginBottom: "0.25rem" }}>
                  <Link href="/iade-degisim" className="item-anchor">İade + Değişim</Link>
                </li>
                <li className="menu-item" style={{ marginBottom: "0.25rem" }}>
                  <Link href="/kargo-teslimat" className="item-anchor">Kargo + Teslimat</Link>
                </li>
                <li className="menu-item" style={{ marginBottom: "0.25rem" }}>
                  <Link href="/sik-sorulan-sorular" className="item-anchor">Sık Sorulan Sorular</Link>
                </li>
              </ul>
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
