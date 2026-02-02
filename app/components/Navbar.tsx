"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  FaTshirt, 
  FaShoppingBag,
  FaArrowRight,
  FaVest
} from "react-icons/fa";
import { 
  GiDress,
  GiShorts
} from "react-icons/gi";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });

  useEffect(() => {
    // Check if user is logged in from localStorage
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login: admin/admin
    if (loginForm.username === "admin" && loginForm.password === "admin") {
      localStorage.setItem("isLoggedIn", "true");
      setIsLoggedIn(true);
      setShowLoginModal(false);
      setLoginForm({ username: "", password: "" });
    } else {
      alert("Kullanıcı adı veya şifre hatalı!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      alert("Şifreler eşleşmiyor!");
      return;
    }
    // Mock register - just close modal
    alert("Kayıt başarılı! (Mock)");
    setShowRegisterModal(false);
    setRegisterForm({ username: "", email: "", password: "", confirmPassword: "" });
  };

  return (
    <>
      <nav className="navbar navbar-expand-xl bg-light text-uppercase fs-6 p-3 border-bottom align-items-center">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center w-100 flex-wrap">
            <div className="d-flex align-items-center">
              <Link className="navbar-brand me-4" href="/">
                <Image
                  src="/images/logo.png"
                  alt="Boutique Lavinia"
                  width={150}
                  height={50}
                  style={{ objectFit: "contain", maxWidth: "100%" }}
                  className="img-fluid"
                />
              </Link>

              <button
                className="navbar-toggler d-xl-none"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasNavbar"
                aria-controls="offcanvasNavbar"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>

              <div className="d-none d-xl-flex flex-grow-1">
                <ul className="navbar-nav justify-content-end flex-grow-1 gap-1 gap-md-5 pe-3">
                  <li className="nav-item">
                    <Link className="nav-link active" href="/">
                      ANA SAYFA
                        </Link>
                  </li>
                  <li className="nav-item mega-menu-wrapper">
                    <a
                      className="nav-link"
                      href="#"
                      onMouseEnter={(e) => {
                        const megaMenu = document.getElementById("megaMenu");
                        if (megaMenu) megaMenu.style.display = "block";
                      }}
                    >
                      MAĞAZA
                    </a>
                    <div
                      id="megaMenu"
                      className="mega-menu"
                      onMouseLeave={(e) => {
                        const megaMenu = document.getElementById("megaMenu");
                        if (megaMenu) megaMenu.style.display = "none";
                      }}
                    >
                      <div className="container-fluid">
                        <div className="container">
                          <div className="row py-4">
                          <div className="col-md-2">
                            <h6 className="mega-menu-title">
                              <GiDress className="mega-menu-icon" />
                              Elbiseler
                            </h6>
                            <ul className="list-unstyled mt-3">
                              <li>
                                <Link href="/products?category=gunluk-elbise" className="mega-menu-link">
                                  Günlük Elbise
                                </Link>
                              </li>
                              <li>
                                <Link href="/products?category=abiye" className="mega-menu-link">
                                  Abiye
                                </Link>
                              </li>
                              <li>
                                <Link href="/products?category=triko-elbise" className="mega-menu-link">
                                  Triko Elbise
                                </Link>
                              </li>
                              <li>
                                <Link href="/products?category=mini-midi-maxi" className="mega-menu-link">
                                  Mini / Midi / Maxi
                                </Link>
                              </li>
                            </ul>
                          </div>
                          <div className="col-md-2">
                            <h6 className="mega-menu-title">
                              <FaTshirt className="mega-menu-icon" />
                              Üst Giyim
                            </h6>
                            <ul className="list-unstyled mt-3">
                              <li>
                                <Link href="/products?category=bluz" className="mega-menu-link">
                                  Bluz
                                </Link>
                              </li>
                      <li>
                                <Link href="/products?category=gomlek" className="mega-menu-link">
                                  Gömlek
                                </Link>
                              </li>
                              <li>
                                <Link href="/products?category=tisort" className="mega-menu-link">
                                  Tişört
                                </Link>
                              </li>
                              <li>
                                <Link href="/products?category=triko" className="mega-menu-link">
                                  Triko
                                </Link>
                              </li>
                              <li>
                                <Link href="/products?category=sweatshirt" className="mega-menu-link">
                                  Sweatshirt
                                </Link>
                              </li>
                            </ul>
                          </div>
                          <div className="col-md-2">
                            <h6 className="mega-menu-title">
                              <GiShorts className="mega-menu-icon" />
                              Alt Giyim
                            </h6>
                            <ul className="list-unstyled mt-3">
                              <li>
                                <Link href="/products?category=pantolon" className="mega-menu-link">
                                  Pantolon
                                </Link>
                              </li>
                              <li>
                                <Link href="/products?category=etek" className="mega-menu-link">
                                  Etek
                                </Link>
                              </li>
                              <li>
                                <Link href="/products?category=jean" className="mega-menu-link">
                                  Jean
                                </Link>
                              </li>
                            </ul>
                          </div>
                          <div className="col-md-2">
                            <h6 className="mega-menu-title">
                              <FaVest className="mega-menu-icon" />
                              Dış Giyim
                            </h6>
                            <ul className="list-unstyled mt-3">
                              <li>
                                <Link href="/products?category=ceket" className="mega-menu-link">
                                  Ceket
                                </Link>
                              </li>
                              <li>
                                <Link href="/products?category=kaban" className="mega-menu-link">
                                  Kaban
                                </Link>
                              </li>
                              <li>
                                <Link href="/products?category=mont" className="mega-menu-link">
                                  Mont
                                </Link>
                              </li>
                              <li>
                                <Link href="/products?category=hırka" className="mega-menu-link">
                                  Hırka
                        </Link>
                      </li>
                    </ul>
                          </div>
                          <div className="col-md-2">
                            <h6 className="mega-menu-title">
                              <FaShoppingBag className="mega-menu-icon" />
                              Aksesuar
                            </h6>
                            <ul className="list-unstyled mt-3">
                              <li>
                                <Link href="/products?category=canta" className="mega-menu-link">
                                  Çanta
                                </Link>
                              </li>
                              <li>
                                <Link href="/products?category=kemer" className="mega-menu-link">
                                  Kemer
                                </Link>
                              </li>
                              <li>
                                <Link href="/products?category=sal-atki" className="mega-menu-link">
                                  Şal & Atkı
                                </Link>
                              </li>
                              <li>
                                <Link href="/products?category=taki" className="mega-menu-link">
                                  Takı
                                </Link>
                  </li>
                            </ul>
                          </div>
                          <div className="col-md-2">
                            <div className="mega-menu-featured">
                              <div className="mega-menu-featured-content">
                                <Link href="/products" className="mega-menu-featured-btn">
                                  Tüm Ürünleri Gör
                                  <FaArrowRight className="ms-2" />
                    </Link>
                              </div>
                            </div>
                          </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" href="#">
                      İLETİŞİM
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="d-flex align-items-center ms-auto">
              <ul className="list-unstyled d-flex m-0 align-items-center" style={{ gap: "0.5rem", flexWrap: "nowrap" }}>
                {isLoggedIn ? (
                  <>
                    <li className="d-none d-xl-block">
                      <span className="text-uppercase mx-2" style={{ whiteSpace: "nowrap", fontSize: "0.875rem", color: "var(--bs-primary)" }}>
                        Hoşgeldin Admin
                      </span>
                    </li>
                    <li className="d-none d-xl-block">
                      <button
                        onClick={handleLogout}
                        className="btn btn-link text-uppercase p-0 mx-2"
                        style={{ whiteSpace: "nowrap", fontSize: "0.875rem", textDecoration: "none", border: "none" }}
                      >
                        Çıkış Yap
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="d-none d-xl-block">
                      <button
                        onClick={() => setShowLoginModal(true)}
                        className="btn btn-link text-uppercase p-0 mx-2"
                        style={{ whiteSpace: "nowrap", fontSize: "0.875rem", textDecoration: "none", border: "none" }}
                      >
                        Giriş Yap
                      </button>
                    </li>
                    <li className="d-none d-xl-block">
                      <button
                        onClick={() => setShowRegisterModal(true)}
                        className="btn btn-link text-uppercase p-0 mx-2"
                        style={{ whiteSpace: "nowrap", fontSize: "0.875rem", textDecoration: "none", border: "none" }}
                      >
                        Kayıt Ol
                      </button>
                    </li>
                  </>
                )}
                <li className="d-none d-xl-block">
                  <Link href="/" className="text-uppercase mx-2" style={{ whiteSpace: "nowrap", fontSize: "0.875rem" }}>
                    FAVORİLER <span className="wishlist-count">(0)</span>
                  </Link>
                </li>
                <li className="d-none d-xl-block">
                  <Link
                    href="/"
                    className="text-uppercase mx-2"
                    style={{ whiteSpace: "nowrap", fontSize: "0.875rem" }}
                    data-bs-toggle="offcanvas"
                    data-bs-target="#offcanvasCart"
                    aria-controls="offcanvasCart"
                  >
                    SEPET <span className="cart-count">(0)</span>
                  </Link>
                </li>
                <li className="d-xl-none">
                  <Link href="#" className="mx-1">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <use xlinkHref="#heart"></use>
                    </svg>
                  </Link>
                </li>
                <li className="d-xl-none">
                  <Link
                    href="#"
                    className="mx-1"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#offcanvasCart"
                    aria-controls="offcanvasCart"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <use xlinkHref="#cart"></use>
                    </svg>
                  </Link>
                </li>
                <li className="search-box mx-1">
                  <a href="#search" className="search-button">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <use xlinkHref="#search"></use>
                    </svg>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div
          className="offcanvas offcanvas-end"
          tabIndex={-1}
          id="offcanvasNavbar"
          aria-labelledby="offcanvasNavbarLabel"
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="offcanvasNavbarLabel">
              Menü
            </h5>
            <button
              type="button"
              className="btn-close text-reset"
              data-bs-dismiss="offcanvas"
              aria-label="Kapat"
            ></button>
          </div>

          <div className="offcanvas-body">
            <ul className="navbar-nav justify-content-end flex-grow-1 gap-1 gap-md-5 pe-3">
              <li className="nav-item">
                <Link className="nav-link" href="/">
                  ANA SAYFA
                </Link>
              </li>
              <li className="nav-item">
                <a className="nav-link" data-bs-toggle="collapse" href="#mobileCategories" role="button">
                  MAĞAZA <span className="float-end">▼</span>
                </a>
                <div className="collapse" id="mobileCategories">
                  <ul className="list-unstyled ps-4 mt-2">
                    <li className="mb-2">
                      <strong className="text-uppercase small d-flex align-items-center gap-2">
                        <GiDress /> Elbiseler
                      </strong>
                      <ul className="list-unstyled ps-3 mt-1">
                        <li><Link href="/products?category=gunluk-elbise" className="nav-link small">Günlük Elbise</Link></li>
                        <li><Link href="/products?category=abiye" className="nav-link small">Abiye</Link></li>
                        <li><Link href="/products?category=triko-elbise" className="nav-link small">Triko Elbise</Link></li>
                        <li><Link href="/products?category=mini-midi-maxi" className="nav-link small">Mini / Midi / Maxi</Link></li>
                      </ul>
                    </li>
                    <li className="mb-2">
                      <strong className="text-uppercase small d-flex align-items-center gap-2">
                        <FaTshirt /> Üst Giyim
                      </strong>
                      <ul className="list-unstyled ps-3 mt-1">
                        <li><Link href="/products?category=bluz" className="nav-link small">Bluz</Link></li>
                        <li><Link href="/products?category=gomlek" className="nav-link small">Gömlek</Link></li>
                        <li><Link href="/products?category=tisort" className="nav-link small">Tişört</Link></li>
                        <li><Link href="/products?category=triko" className="nav-link small">Triko</Link></li>
                        <li><Link href="/products?category=sweatshirt" className="nav-link small">Sweatshirt</Link></li>
                      </ul>
                    </li>
                    <li className="mb-2">
                      <strong className="text-uppercase small d-flex align-items-center gap-2">
                        <GiShorts /> Alt Giyim
                      </strong>
                      <ul className="list-unstyled ps-3 mt-1">
                        <li><Link href="/products?category=pantolon" className="nav-link small">Pantolon</Link></li>
                        <li><Link href="/products?category=etek" className="nav-link small">Etek</Link></li>
                        <li><Link href="/products?category=jean" className="nav-link small">Jean</Link></li>
                      </ul>
                    </li>
                    <li className="mb-2">
                      <strong className="text-uppercase small d-flex align-items-center gap-2">
                        <FaVest /> Dış Giyim
                      </strong>
                      <ul className="list-unstyled ps-3 mt-1">
                        <li><Link href="/products?category=ceket" className="nav-link small">Ceket</Link></li>
                        <li><Link href="/products?category=kaban" className="nav-link small">Kaban</Link></li>
                        <li><Link href="/products?category=mont" className="nav-link small">Mont</Link></li>
                        <li><Link href="/products?category=hırka" className="nav-link small">Hırka</Link></li>
                      </ul>
                    </li>
                    <li className="mb-2">
                      <strong className="text-uppercase small d-flex align-items-center gap-2">
                        <FaShoppingBag /> Aksesuar
                      </strong>
                      <ul className="list-unstyled ps-3 mt-1">
                        <li><Link href="/products?category=canta" className="nav-link small">Çanta</Link></li>
                        <li><Link href="/products?category=kemer" className="nav-link small">Kemer</Link></li>
                        <li><Link href="/products?category=sal-atki" className="nav-link small">Şal & Atkı</Link></li>
                        <li><Link href="/products?category=taki" className="nav-link small">Takı</Link></li>
                      </ul>
                    </li>
                    <li className="mt-3">
                      <Link href="/products" className="btn btn-dark btn-sm w-100">
                        Tüm Ürünleri Gör
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href="/products">
                  TÜM ÜRÜNLER
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href="#">
                  İLETİŞİM
                </Link>
              </li>
              {isLoggedIn ? (
                <>
                  <li className="nav-item">
                    <span className="nav-link text-primary">Hoşgeldin Admin</span>
                  </li>
                  <li className="nav-item">
                    <button
                      onClick={() => {
                        handleLogout();
                        const offcanvas = document.getElementById("offcanvasNavbar");
                        if (offcanvas) {
                          const bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvas);
                          bsOffcanvas?.hide();
                        }
                      }}
                      className="nav-link btn btn-link p-0 text-start w-100 text-danger"
                      style={{ textDecoration: "none" }}
                    >
                      Çıkış Yap
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <button
                      onClick={() => {
                        setShowLoginModal(true);
                        const offcanvas = document.getElementById("offcanvasNavbar");
                        if (offcanvas) {
                          const bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvas);
                          bsOffcanvas?.hide();
                        }
                      }}
                      className="nav-link btn btn-link p-0 text-start w-100"
                      style={{ textDecoration: "none" }}
                    >
                      Giriş Yap
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      onClick={() => {
                        setShowRegisterModal(true);
                        const offcanvas = document.getElementById("offcanvasNavbar");
                        if (offcanvas) {
                          const bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvas);
                          bsOffcanvas?.hide();
                        }
                      }}
                      className="nav-link btn btn-link p-0 text-start w-100"
                      style={{ textDecoration: "none" }}
                    >
                      Kayıt Ol
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showLoginModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowLoginModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Giriş Yap</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLoginModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleLogin}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="loginUsername" className="form-label">
                      Kullanıcı Adı
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="loginUsername"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="loginPassword" className="form-label">
                      Şifre
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="loginPassword"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <small className="text-muted">Mock: admin / admin</small>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowLoginModal(false)}>
                    İptal
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Giriş Yap
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowRegisterModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Kayıt Ol</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRegisterModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleRegister}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="registerUsername" className="form-label">
                      Kullanıcı Adı
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="registerUsername"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="registerEmail" className="form-label">
                      E-posta
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="registerEmail"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="registerPassword" className="form-label">
                      Şifre
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="registerPassword"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="registerConfirmPassword" className="form-label">
                      Şifre Tekrar
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="registerConfirmPassword"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRegisterModal(false)}>
                    İptal
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Kayıt Ol
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
