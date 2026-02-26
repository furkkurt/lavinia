"use client";

import { useEffect, useState } from "react";
import { getProductsGrid } from "../lib/api/products";
import { getUsersGrid } from "../lib/api/users";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    publishedProducts: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, usersRes] = await Promise.all([
          getProductsGrid({ pageIndex: 0, pageSize: 1 }),
          getUsersGrid({ pageIndex: 0, pageSize: 1 }),
        ]);

        if (productsRes) {
          setStats((prev) => ({
            ...prev,
            totalProducts: productsRes.total,
          }));
        }

        if (usersRes) {
          setStats((prev) => ({
            ...prev,
            totalUsers: usersRes.total,
          }));
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Toplam Ürün</h5>
              <h2 className="text-primary">{stats.totalProducts}</h2>
              <Link href="/admin/products" className="btn btn-sm btn-outline-primary">
                Ürünleri Görüntüle
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Toplam Kullanıcı</h5>
              <h2 className="text-success">{stats.totalUsers}</h2>
              <Link href="/admin/users" className="btn btn-sm btn-outline-success">
                Kullanıcıları Görüntüle
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Yayınlanan Ürünler</h5>
              <h2 className="text-info">{stats.publishedProducts}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Aktif Kullanıcılar</h5>
              <h2 className="text-warning">{stats.activeUsers}</h2>
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
