"use client";

import { useEffect, useState } from "react";
import { getProductsGrid, deleteProduct, changeProductStatus, Product } from "../../lib/api/products";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl, isApiHostedMediaSrc, shouldBypassNextImageOptimization } from "../../lib/api/config";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Define fetchProducts outside useEffect to avoid dependency issues
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getProductsGrid({
        pageIndex,
        pageSize,
        sort: [{ field: "id", dir: "desc" }],
      });

      if (response) {
        setProducts(response.data);
        setTotal(response.total);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Only run once on mount and when pageIndex/pageSize change
  // NO other dependencies to prevent infinite loops
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, pageSize]); // Only pageIndex and pageSize as dependencies

  const handleDelete = async (id: number) => {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) {
      return;
    }

    const success = await deleteProduct(id);
    if (success) {
      // Refetch products after delete
      fetchProducts();
    } else {
      alert("Ürün silinirken bir hata oluştu.");
    }
  };

  const handleToggleStatus = async (id: number) => {
    const success = await changeProductStatus(id);
    if (success) {
      // Refetch products after status change
      fetchProducts();
    } else {
      alert("Ürün durumu değiştirilirken bir hata oluştu.");
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading && products.length === 0) {
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
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-4">
        <h1 className="mb-0">Ürün Yönetimi</h1>
        <Link href="/admin/products/create" className="btn btn-primary text-nowrap">
          + Yeni Ürün Ekle
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          {/* Mobil (below md breakpoint): kart + tam genişlik butonlar */}
          <div className="d-md-none admin-products-mobile vstack gap-3">
            {products.map((product) => (
              <div key={product.id} className="card border shadow-sm">
                <div className="card-body p-3">
                  <div className="d-flex gap-3 mb-3">
                    <div className="flex-shrink-0">
                      {product.thumbnailImageUrl ? (
                        <Image
                          src={getImageUrl(product.thumbnailImageUrl)}
                          alt=""
                          width={72}
                          height={72}
                          sizes="72px"
                          style={{ objectFit: "cover" }}
                          className="rounded"
                          unoptimized={
                            isApiHostedMediaSrc(getImageUrl(product.thumbnailImageUrl)) ||
                            shouldBypassNextImageOptimization(
                              getImageUrl(product.thumbnailImageUrl)
                            )
                          }
                        />
                      ) : (
                        <div className="bg-secondary rounded" style={{ width: 72, height: 72 }} />
                      )}
                    </div>
                    <div className="min-w-0 flex-grow-1">
                      <p className="small text-muted mb-1">#{product.id}</p>
                      <p className="fw-semibold mb-2 text-break">{product.name}</p>
                      <span
                        className={`badge ${product.isPublished ? "bg-success" : "bg-secondary"}`}
                      >
                        {product.isPublished ? "Yayında" : "Taslak"}
                      </span>
                    </div>
                  </div>
                  <p className="mb-1 small">
                    <span className="text-muted">Fiyat:</span>{" "}
                    {product.price ? `₺${product.price.toFixed(2)}` : "—"}
                  </p>
                  <p className="mb-3 small">
                    <span className="text-muted">Stok:</span> {product.stockQuantity ?? "—"}
                  </p>
                  <div className="d-grid gap-2">
                    <Link href={`/admin/products/${product.id}`} className="btn btn-primary">
                      Düzenle
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(product.id)}
                      className="btn btn-outline-warning"
                    >
                      {product.isPublished ? "Yayından Kaldır" : "Yayınla"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      className="btn btn-outline-danger"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Masaüstü: tablo */}
          <div className="d-none d-md-block">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Görsel</th>
                    <th>Ad</th>
                    <th>Fiyat</th>
                    <th>Stok</th>
                    <th>Durum</th>
                    <th style={{ minWidth: "280px" }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>
                        {product.thumbnailImageUrl ? (
                          <Image
                            src={getImageUrl(product.thumbnailImageUrl)}
                            alt={product.name}
                            width={50}
                            height={50}
                            sizes="50px"
                            style={{ objectFit: "cover" }}
                            className="rounded"
                            unoptimized={
                              isApiHostedMediaSrc(getImageUrl(product.thumbnailImageUrl)) ||
                              shouldBypassNextImageOptimization(
                                getImageUrl(product.thumbnailImageUrl)
                              )
                            }
                          />
                        ) : (
                          <div
                            className="bg-secondary rounded"
                            style={{ width: 50, height: 50 }}
                          />
                        )}
                      </td>
                      <td>{product.name}</td>
                      <td>
                        {product.price ? `₺${product.price.toFixed(2)}` : "-"}
                      </td>
                      <td>{product.stockQuantity ?? "-"}</td>
                      <td>
                        <span
                          className={`badge ${
                            product.isPublished ? "bg-success" : "bg-secondary"
                          }`}
                        >
                          {product.isPublished ? "Yayında" : "Taslak"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Düzenle
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(product.id)}
                            className="btn btn-sm btn-outline-warning"
                          >
                            {product.isPublished ? "Yayından Kaldır" : "Yayınla"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="btn btn-sm btn-outline-danger"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center flex-wrap gap-1">
                <li className={`page-item ${pageIndex === 0 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPageIndex(pageIndex - 1)}
                    disabled={pageIndex === 0}
                  >
                    Önceki
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li
                    key={i}
                    className={`page-item ${pageIndex === i ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPageIndex(i)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item ${
                    pageIndex >= totalPages - 1 ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setPageIndex(pageIndex + 1)}
                    disabled={pageIndex >= totalPages - 1}
                  >
                    Sonraki
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
