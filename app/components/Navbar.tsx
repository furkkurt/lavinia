"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
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

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "elbiseler": <GiDress className="mega-menu-icon" />,
  "üst giyim": <FaTshirt className="mega-menu-icon" />,
  "alt giyim": <GiShorts className="mega-menu-icon" />,
  "dış giyim": <FaVest className="mega-menu-icon" />,
  "aksesuar": <FaShoppingBag className="mega-menu-icon" />,
};
function getCategoryIcon(name: string) {
  return CATEGORY_ICONS[name.toLowerCase().trim()] ?? <FaShoppingBag className="mega-menu-icon" />;
}

/** Mega menüde "Diğer" ana kategoriyi diğer dörtlüden ayırmak için */
function normalizeCategoryName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .trim();
}

function isDigerCategory(cat: { name: string; slug?: string }): boolean {
  const n = normalizeCategoryName(cat.name);
  const slug = (cat.slug || "").toLowerCase();
  return n === "diger" || n === "other" || slug === "diger" || slug === "other";
}
import { useRouter } from "next/navigation";
import { register, login, adminLogin, getCurrentUser, logout as apiLogout, isAdmin, validateToken } from "../lib/api/auth";
import { getMenuCategories, CategoryMenuItem } from "../lib/api/categories";
import { getCartCount } from "../lib/api/cart";

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "", rememberMe: false });
  const [registerForm, setRegisterForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryMenuItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  const { storeMainCategories, digerCategory } = useMemo(() => {
    const diger = categories.find((c) => isDigerCategory(c));
    const main = categories.filter((c) => !isDigerCategory(c));
    return { storeMainCategories: main, digerCategory: diger ?? null };
  }, [categories]);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("authToken");
    
    const initAuth = async () => {
      if (loggedIn || hasToken) {
        const valid = await validateToken();
        if (!valid) {
          setIsLoggedIn(false);
          setCurrentUser(null);
          setUserIsAdmin(false);
          setCartCount(0);
          getCartCount().then(setCartCount).catch(() => {}); // still fetch guest cart
          return;
        }
        setIsLoggedIn(true);
        await checkAuthStatus();
      }
      getCartCount().then(setCartCount).catch(() => {}); // always fetch cart (guest or logged in)
    };
    initAuth();

    // Fetch categories for menu
    const fetchCategories = async () => {
      try {
        const menuCategories = await getMenuCategories();
        if (menuCategories) {
          setCategories(menuCategories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();

    const handleCartUpdate = () => {
      getCartCount().then(setCartCount).catch(() => {});
    };
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const checkAuthStatus = async () => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userStr = localStorage.getItem("user");
    const adminStr = localStorage.getItem("adminUser");

    if (loggedIn) {
      try {
        if (adminStr) {
          const admin = JSON.parse(adminStr);
          setCurrentUser({ ...admin, fullName: admin.fullName });
        } else if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
        }
        setIsLoggedIn(true);
        setUserIsAdmin(isAdmin());
      } catch {
        setIsLoggedIn(loggedIn);
      }
    } else {
      setIsLoggedIn(false);
      setUserIsAdmin(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Try admin login first (stores Bearer token for /api/users, etc.)
      const adminResult = await adminLogin({
        username: loginForm.email,
        password: loginForm.password,
        rememberMe: loginForm.rememberMe,
      });

      if (adminResult.success) {
        setIsLoggedIn(true);
        setShowLoginModal(false);
        setLoginForm({ email: "", password: "", rememberMe: false });
        await checkAuthStatus();
        getCartCount().then(setCartCount).catch(() => {});
      } else {
        // Fall back to customer login (quickSearchUsers)
        const result = await login({
          email: loginForm.email,
          password: loginForm.password,
          rememberMe: loginForm.rememberMe,
        });

        if (result.success) {
          localStorage.setItem("isLoggedIn", "true");
          setIsLoggedIn(true);
          setShowLoginModal(false);
          setLoginForm({ email: "", password: "", rememberMe: false });
          await checkAuthStatus();
        } else {
          alert(adminResult.error || result.error || "E-posta veya şifre hatalı!");
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      alert(error.message || "Giriş yapılırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("authToken");
      setIsLoggedIn(false);
      setCurrentUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setFormError("Şifreler eşleşmiyor!");
      return;
    }

    if (registerForm.password.length < 6) {
      setFormError("Şifre en az 6 karakter olmalıdır!");
      return;
    }

    if (!registerForm.email || !registerForm.email.includes('@')) {
      setFormError("Geçerli bir e-posta adresi giriniz!");
      return;
    }

    if (!registerForm.fullName || registerForm.fullName.trim().length < 2) {
      setFormError("Ad Soyad en az 2 karakter olmalıdır!");
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        fullName: registerForm.fullName.trim(),
        email: registerForm.email.trim().toLowerCase(),
        password: registerForm.password,
      });

      if (result.success) {
        setFormError(null);
        setShowRegisterModal(false);
        setShowLoginModal(true);
        setLoginForm({ email: registerForm.email.trim().toLowerCase(), password: "", rememberMe: false });
        setRegisterForm({ fullName: "", email: "", password: "", confirmPassword: "" });
        alert("Kayıt başarılı! Giriş yapabilirsiniz.");
      } else {
        setFormError(result.error || "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } catch (error: any) {
      console.error("Register error:", error);
      setFormError(error.message || "Kayıt sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
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
                  style={{ objectFit: "contain", maxWidth: "100%", height: "auto" }}
                  className="img-fluid"
                />
              </Link>

              <button
                className="navbar-toggler d-xl-none"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasNavbar"
                aria-controls="offcanvasNavbar"
                aria-label="Menüyü aç/kapat"
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
                          <div className="row py-4 align-items-start">
                            {categories.length > 0 ? (
                              <>
                                {storeMainCategories.map((cat) => (
                                  <div key={cat.id} className="col-6 col-lg-2 mb-3 mb-lg-0">
                                    <h6 className="mega-menu-title">
                                      <Link href={`/urunler?category=${encodeURIComponent(cat.slug)}`} style={{ textDecoration: "none", color: "inherit" }}>
                                        {getCategoryIcon(cat.name)}
                                        {cat.name}
                                      </Link>
                                    </h6>
                                    {cat.children && cat.children.length > 0 ? (
                                      <ul className="list-unstyled mt-3">
                                        {cat.children.map((child) => (
                                          <li key={child.id}>
                                            <Link href={`/urunler?category=${encodeURIComponent(child.slug)}`} className="mega-menu-link">
                                              {child.name}
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : null}
                                  </div>
                                ))}
                                <div className="col-12 col-lg-4 mt-2 mt-lg-0">
                                  <div className="mega-menu-featured h-100">
                                    <div className="mega-menu-featured-content d-flex flex-column gap-3">
                                      {digerCategory ? (
                                        <Link
                                          href={`/urunler?category=${encodeURIComponent(digerCategory.slug)}`}
                                          className="mega-menu-diger-btn"
                                        >
                                          {getCategoryIcon(digerCategory.name)}
                                          <span className="ms-2 flex-grow-1 text-start">{digerCategory.name}</span>
                                          <FaArrowRight className="ms-2 flex-shrink-0" />
                                        </Link>
                                      ) : null}
                                      <Link href="/urunler" className="mega-menu-featured-btn">
                                        Tüm Ürünleri Gör
                                        <FaArrowRight className="ms-2" />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="col-12">
                                <Link href="/urunler" className="mega-menu-featured-btn">
                                  Tüm Ürünleri Gör
                                  <FaArrowRight className="ms-2" />
                                </Link>
                              </div>
                            )}
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
                      <Link
                        href="/profil"
                        className="text-uppercase mx-2"
                        style={{ whiteSpace: "nowrap", fontSize: "0.875rem", textDecoration: "none", color: "#000" }}
                      >
                        Hesabım
                      </Link>
                    </li>
                    {userIsAdmin && (
                      <li className="d-none d-xl-block">
                        <Link
                          href="/admin/statistics"
                          className="text-uppercase mx-2"
                          style={{ whiteSpace: "nowrap", fontSize: "0.875rem", textDecoration: "none", color: "var(--bs-primary)" }}
                        >
                          Yönetim Paneli
                        </Link>
                      </li>
                    )}
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
                        onClick={() => { setFormError(null); setShowRegisterModal(true); }}
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
                    href="/sepet"
                    className="text-uppercase mx-2"
                    style={{ whiteSpace: "nowrap", fontSize: "0.875rem" }}
                  >
                    SEPET <span className="cart-count">({cartCount})</span>
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
                  <Link href="/sepet" className="mx-1" style={{ position: "relative" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <use xlinkHref="#cart"></use>
                    </svg>
                    {cartCount > 0 && (
                      <span style={{
                        position: "absolute", top: "-6px", right: "-6px",
                        background: "#000", color: "#fff", borderRadius: "50%",
                        width: "16px", height: "16px", fontSize: "10px",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>{cartCount}</span>
                    )}
                  </Link>
                </li>
                <li className="search-box mx-1">
                  <button
                    type="button"
                    className="search-button btn btn-link p-0 border-0"
                    onClick={() => setShowSearchPopup(true)}
                    aria-label="Ara"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <use xlinkHref="#search"></use>
                    </svg>
                  </button>
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
                    {categories.length > 0 ? (
                      <>
                        {storeMainCategories.map((cat) => (
                          <li key={cat.id} className="mb-2">
                            <strong className="text-uppercase small d-flex align-items-center gap-2">
                              {getCategoryIcon(cat.name)} {cat.name}
                            </strong>
                            {cat.children && cat.children.length > 0 ? (
                              <ul className="list-unstyled ps-3 mt-1">
                                {cat.children.map((child) => (
                                  <li key={child.id}>
                                    <Link href={`/urunler?category=${encodeURIComponent(child.slug)}`} className="nav-link small">
                                      {child.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        ))}
                        {digerCategory ? (
                          <li className="mb-3">
                            <Link
                              href={`/urunler?category=${encodeURIComponent(digerCategory.slug)}`}
                              className="btn btn-outline-dark btn-sm w-100 text-uppercase fw-semibold"
                            >
                              {getCategoryIcon(digerCategory.name)} {digerCategory.name}
                            </Link>
                          </li>
                        ) : null}
                      </>
                    ) : null}
                    <li className="mt-2">
                      <Link href="/urunler" className="btn btn-dark btn-sm w-100">
                        Tüm Ürünleri Gör
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href="/urunler">
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
                    <Link className="nav-link" href="/profil">Hesabım</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" href="/sepet">Sepetim ({cartCount})</Link>
                  </li>
                  {userIsAdmin && (
                    <li className="nav-item">
                      <Link className="nav-link text-primary" href="/admin/statistics">Yönetim Paneli</Link>
                    </li>
                  )}
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
                        setFormError(null);
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
                  aria-label="Kapat"
                ></button>
              </div>
              <form onSubmit={handleLogin}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="loginEmail" className="form-label">
                      E-posta
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="loginEmail"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
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
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="loginRememberMe"
                      checked={loginForm.rememberMe}
                      onChange={(e) => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
                    />
                    <label htmlFor="loginRememberMe" className="form-check-label">
                      Beni hatırla
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowLoginModal(false)} disabled={loading}>
                    İptal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {/* Search Popup */}
      {showSearchPopup && (
        <div
          className="search-popup is-visible"
          onClick={() => setShowSearchPopup(false)}
        >
          <div className="search-popup-container" onClick={(e) => e.stopPropagation()}>
            <form
              role="search"
              className="form-group"
              onSubmit={(e) => {
                e.preventDefault();
                const q = searchQuery.trim();
                if (q) {
                  router.push(`/urunler?q=${encodeURIComponent(q)}`);
                  setShowSearchPopup(false);
                  setSearchQuery("");
                }
              }}
            >
              <input
                type="search"
                className="form-control border-0 border-bottom rounded-0"
                placeholder="Arama yapın ve Enter'a basın"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: "1.5rem", padding: "0.5rem 0" }}
              />
              <button
                type="button"
                className="btn-close position-absolute"
                style={{ top: "50%", right: 0, transform: "translateY(-50%)" }}
                onClick={() => { setShowSearchPopup(false); setSearchQuery(""); }}
                aria-label="Kapat"
              />
            </form>
          </div>
        </div>
      )}

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
                  aria-label="Kapat"
                ></button>
              </div>
              <form onSubmit={handleRegister}>
                <div className="modal-body">
                  {formError && (
                    <div className="alert alert-danger py-2 mb-3" role="alert">
                      {formError}
                    </div>
                  )}
                  <div className="mb-3">
                    <label htmlFor="registerFullName" className="form-label">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="registerFullName"
                      value={registerForm.fullName}
                      onChange={(e) => { setRegisterForm({ ...registerForm, fullName: e.target.value }); setFormError(null); }}
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
                      onChange={(e) => { setRegisterForm({ ...registerForm, email: e.target.value }); setFormError(null); }}
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
                      onChange={(e) => { setRegisterForm({ ...registerForm, password: e.target.value }); setFormError(null); }}
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
                      onChange={(e) => { setRegisterForm({ ...registerForm, confirmPassword: e.target.value }); setFormError(null); }}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowRegisterModal(false); setFormError(null); }} disabled={loading}>
                    İptal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Kaydediliyor..." : "Kayıt Ol"}
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
