"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { adminLogin, isAdmin, validateToken } from "../lib/api/auth";
import { removeAuthToken } from "../lib/api/config";
import { hideOffcanvasById } from "../lib/hideOffcanvas";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Use useState to avoid hydration mismatch
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const hasLocal = localStorage.getItem("isLoggedIn") === "true";
    if (hasLocal && isAdmin()) {
      validateToken().then((valid) => {
        setIsLoggedIn(valid && isAdmin());
        if (!valid || !isAdmin()) {
          localStorage.removeItem("isLoggedIn");
          removeAuthToken();
          localStorage.removeItem("adminUser");
        }
      });
    } else {
      setIsLoggedIn(false);
    }
  }, []);
  
  const [showLoginForm] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const result = await adminLogin({
        username: loginForm.username,
        password: loginForm.password,
      });

      if (result.success) {
        localStorage.setItem("isLoggedIn", "true");
        setIsLoggedIn(true);
        setLoginForm({ username: "", password: "" });
        router.replace("/admin/statistics");
      } else {
        setLoginError(result.error || "Giriş başarısız.");
      }
    } catch (error: any) {
      setLoginError(error.message || "Giriş yapılırken bir hata oluştu.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    removeAuthToken();
    setIsLoggedIn(false);
        router.push("/admin");
  };

  // Show loading state during hydration to prevent skipping
  if (!mounted) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
        <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
          <div className="card-body p-4">
            <h4 className="card-title mb-4 text-center">Admin Girişi</h4>
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label htmlFor="adminUsername" className="form-label">Kullanıcı Adı</label>
                <input
                  type="text"
                  className="form-control"
                  id="adminUsername"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                  disabled={loginLoading}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="adminPassword" className="form-label">Şifre</label>
                <input
                  type="password"
                  className="form-control"
                  id="adminPassword"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                  disabled={loginLoading}
                />
              </div>
              {loginError && (
                <div className="alert alert-danger" role="alert">
                  {loginError}
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loginLoading}
              >
                {loginLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </form>
            <div className="mt-3 text-center">
              <Link href="/" className="text-decoration-none">
                ← Ana Sayfaya Dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { href: "/admin/statistics", label: "İstatistikler" },
    { href: "/admin/settings", label: "Mağaza ayarları" },
    { href: "/admin/orders", label: "Siparişler" },
    { href: "/admin/products", label: "Ürünler" },
    { href: "/admin/categories", label: "Kategoriler" },
    { href: "/admin/collections", label: "Koleksiyonlar" },
    { href: "/admin/reviews", label: "Değerlendirmeler" },
    { href: "/admin/users", label: "Kullanıcılar" },
    { href: "/admin/dev", label: "Dev" },
  ];

  const navLinkClass = (href: string) =>
    `d-block px-3 py-2 text-white text-decoration-none ${pathname === href ? "bg-primary" : ""}`;

  const closeMobileMenu = () => hideOffcanvasById("adminOffcanvas");

  return (
    <div className="admin-layout d-flex" style={{ minHeight: "100vh" }}>
      {/* Masaüstü kenar çubuğu */}
      <aside
        className="bg-dark text-white position-relative d-none d-md-block"
        style={{
          width: sidebarCollapsed ? "60px" : "250px",
          minHeight: "100vh",
          padding: "1.5rem 0",
          transition: "width 0.2s ease",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          className="btn btn-sm btn-outline-light position-absolute"
          style={{ top: 8, right: 8 }}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Sidebar'ı aç" : "Sidebar'ı kapat"}
        >
          {sidebarCollapsed ? "→" : "←"}
        </button>
        <div className="px-3 mb-4" style={{ paddingRight: 36 }}>
          <Link href="/admin/statistics" className="text-white text-decoration-none">
            <h4 className="mb-0">{sidebarCollapsed ? "Y" : "Yönetim Paneli"}</h4>
          </Link>
        </div>
        <nav>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={navLinkClass(item.href)}
              style={{ transition: "background-color 0.2s" }}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {!sidebarCollapsed && item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 mt-4">
          <Link
            href="/"
            className="d-block px-3 py-2 text-white text-decoration-none"
            title={sidebarCollapsed ? "Ana Sayfa" : undefined}
          >
            {!sidebarCollapsed && "Ana Sayfa"}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-outline-light w-100 mt-2"
            title={sidebarCollapsed ? "Çıkış Yap" : undefined}
          >
            {sidebarCollapsed ? "✕" : "Çıkış Yap"}
          </button>
        </div>
      </aside>

      {/* Mobil menü (Bootstrap offcanvas; bundle root layout’ta yüklenir) */}
      <div
        className="offcanvas offcanvas-start bg-dark text-white"
        tabIndex={-1}
        id="adminOffcanvas"
        aria-labelledby="adminOffcanvasLabel"
      >
        <div className="offcanvas-header border-bottom border-secondary">
          <h5 className="offcanvas-title" id="adminOffcanvasLabel">
            Menü
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            aria-label="Kapat"
          />
        </div>
        <div className="offcanvas-body d-flex flex-column gap-1 p-0 admin-offcanvas-nav">
          {menuItems.map((item) => (
            <Link
              key={`m-${item.href}`}
              href={item.href}
              scroll={false}
              className={`admin-offcanvas-link ${navLinkClass(item.href)}`}
              onClick={() => closeMobileMenu()}
              style={{ transition: "background-color 0.2s" }}
            >
              {item.label}
            </Link>
          ))}
          <div className="px-3 pt-3 mt-auto border-top border-secondary">
            <Link
              href="/"
              scroll={false}
              className="d-block px-3 py-2 text-white text-decoration-none admin-offcanvas-link"
              onClick={() => closeMobileMenu()}
            >
              Ana Sayfa
            </Link>
            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                handleLogout();
              }}
              className="btn btn-outline-light w-100 mt-2"
              data-bs-dismiss="offcanvas"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      <main className="flex-grow-1 d-flex flex-column" style={{ backgroundColor: "#f5f5f5", minWidth: 0 }}>
        <div className="d-md-none d-flex align-items-center gap-2 px-2 py-2 bg-white border-bottom sticky-top shadow-sm admin-mobile-topbar">
          <button
            type="button"
            className="btn btn-outline-dark admin-mobile-menu-btn"
            data-bs-toggle="offcanvas"
            data-bs-target="#adminOffcanvas"
            aria-controls="adminOffcanvas"
          >
            Menü
          </button>
          <span className="fw-semibold text-truncate flex-grow-1" style={{ minWidth: 0 }}>
            Yönetim paneli
          </span>
        </div>
        <div className="container-fluid px-2 px-md-3 py-3 py-md-4 flex-grow-1 admin-main-inner">{children}</div>
      </main>
    </div>
  );
}
