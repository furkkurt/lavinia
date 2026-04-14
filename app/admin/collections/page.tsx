"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getApiBase, adminAuthHeaders } from "@/app/lib/apiBase";

type Row = {
  id: number;
  name: string;
  slug: string;
  isPublished: boolean;
  displayOrder: number;
  homepageSlot: number | null;
};

export default function AdminCollectionsListPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const base = getApiBase();
    fetch(`${base}/api/product-collections`, { headers: adminAuthHeaders() })
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          setErr("Giriş gerekli (admin access_token).");
          return [];
        }
        return r.ok ? r.json() : [];
      })
      .then((d: Row[]) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]));
  }, []);

  async function remove(id: number) {
    if (!confirm("Koleksiyon silinsin mi?")) return;
    const base = getApiBase();
    await fetch(`${base}/api/product-collections/${id}`, {
      method: "DELETE",
      headers: adminAuthHeaders(),
    });
    setRows((prev) => (prev ?? []).filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-4">
        <h1 className="mb-0">Koleksiyonlar</h1>
        <Link href="/admin/collections/new" className="btn btn-primary text-nowrap">
          + Yeni koleksiyon
        </Link>
      </div>

      {err ? <p className="text-danger">{err}</p> : null}
      {rows === null ? (
        <p>Yükleniyor…</p>
      ) : null}
      {rows && rows.length === 0 && !err ? <p>Henüz koleksiyon yok.</p> : null}

      {rows && rows.length > 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="d-md-none vstack gap-3">
              {rows.map((r) => (
                <div key={r.id} className="card border shadow-sm">
                  <div className="card-body p-3">
                    <p className="small text-muted mb-1">#{r.id}</p>
                    <p className="fw-semibold mb-2 text-break">{r.name}</p>
                    <p className="small text-muted mb-2">{r.slug}</p>
                    <p className="small mb-1">
                      <span className="text-muted">Sıra:</span> {r.displayOrder}
                    </p>
                    {r.homepageSlot != null ? (
                      <p className="small mb-2">
                        <span className="text-muted">Ana sayfa:</span> {r.homepageSlot}
                      </p>
                    ) : null}
                    <span className={`badge ${r.isPublished ? "bg-success" : "bg-secondary"} mb-3`}>
                      {r.isPublished ? "Yayında" : "Taslak"}
                    </span>
                    <div className="d-grid gap-2">
                      <Link href={`/admin/collections/${r.id}`} className="btn btn-primary">
                        Düzenle
                      </Link>
                      <button type="button" className="btn btn-outline-danger" onClick={() => remove(r.id)}>
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="d-none d-md-block">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Ad</th>
                      <th>Slug</th>
                      <th>Sıra</th>
                      <th>Ana sayfa</th>
                      <th>Durum</th>
                      <th style={{ minWidth: "200px" }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td className="fw-medium">{r.name}</td>
                        <td className="text-muted small">{r.slug}</td>
                        <td>{r.displayOrder}</td>
                        <td>{r.homepageSlot ?? "—"}</td>
                        <td>
                          <span className={`badge ${r.isPublished ? "bg-success" : "bg-secondary"}`}>
                            {r.isPublished ? "Yayında" : "Taslak"}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            <Link href={`/admin/collections/${r.id}`} className="btn btn-sm btn-outline-primary">
                              Düzenle
                            </Link>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => remove(r.id)}>
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
