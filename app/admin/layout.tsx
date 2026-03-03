"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { adminLogin } from "../lib/api/auth";

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
  
  // Check auth on mount only
  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
  }, []);
  
  const [showLoginForm] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

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
    localStorage.removeItem("authToken");
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
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/products", label: "Ürünler", icon: "🛍️" },
    { href: "/admin/users", label: "Kullanıcılar", icon: "👥" },
  ];

  return (
    <div className="admin-layout d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        className="bg-dark text-white"
        style={{
          width: "250px",
          minHeight: "100vh",
          padding: "1.5rem 0",
        }}
      >
        <div className="px-3 mb-4">
          <Link href="/admin" className="text-white text-decoration-none">
            <h4 className="mb-0">Admin Panel</h4>
          </Link>
        </div>
        <nav>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`d-block px-3 py-2 text-white text-decoration-none ${
                pathname === item.href ? "bg-primary" : ""
              }`}
              style={{
                transition: "background-color 0.2s",
              }}
            >
              <span className="me-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 mt-4">
          <Link
            href="/"
            className="d-block px-3 py-2 text-white text-decoration-none"
          >
            <span className="me-2">🏠</span>
            Ana Sayfa
          </Link>
          <button
            onClick={handleLogout}
            className="btn btn-outline-light w-100 mt-2"
          >
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow-1" style={{ backgroundColor: "#f5f5f5" }}>
        <div className="container-fluid p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
