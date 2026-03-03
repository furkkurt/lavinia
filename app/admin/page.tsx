"use client";

import Link from "next/link";

export default function AdminDashboard() {
  // No API calls in dashboard - prevents memory leaks from layout re-renders
  // Stats will be fetched in individual pages (products, users) when needed

  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Ürün Yönetimi</h5>
              <p className="text-muted">Ürünleri görüntüle ve yönet</p>
              <Link href="/admin/products" className="btn btn-sm btn-outline-primary">
                Ürünleri Görüntüle
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Kullanıcı Yönetimi</h5>
              <p className="text-muted">Kullanıcıları görüntüle ve yönet</p>
              <Link href="/admin/users" className="btn btn-sm btn-outline-success">
                Kullanıcıları Görüntüle
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Siparişler</h5>
              <p className="text-muted">Yakında eklenecek</p>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Raporlar</h5>
              <p className="text-muted">Yakında eklenecek</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Hızlı İşlemler</h5>
          <div className="d-flex gap-2 flex-wrap">
            <Link href="/admin/products?action=create" className="btn btn-primary">
              Yeni Ürün Ekle
            </Link>
            <Link href="/admin/users" className="btn btn-secondary">
              Kullanıcı Yönetimi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
