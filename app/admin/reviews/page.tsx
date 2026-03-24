"use client";

import { useState, useEffect } from "react";
import { getAdminReviews, toggleFeaturedReview, changeReviewStatus, AdminReview } from "../../lib/api/reviews";

const statusMap: Record<string, { label: string; color: string }> = {
  Pending: { label: "Beklemede", color: "warning" },
  Approved: { label: "Onaylı", color: "success" },
  NotApproved: { label: "Reddedildi", color: "danger" },
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "Pending" | "Approved" | "NotApproved" | "featured">("all");

  const fetchReviews = async () => {
    setLoading(true);
    const data = await getAdminReviews();
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleToggleFeatured = async (id: number) => {
    const ok = await toggleFeaturedReview(id);
    if (ok) {
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, isFeatured: !r.isFeatured } : r));
    }
  };

  const handleStatusChange = async (id: number, statusId: number) => {
    const ok = await changeReviewStatus(id, statusId);
    if (ok) {
      const statusNames = ["Pending", "Approved", "NotApproved"];
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status: statusNames[statusId] || r.status } : r));
    }
  };

  const filtered = reviews.filter((r) => {
    if (filter === "all") return true;
    if (filter === "featured") return r.isFeatured;
    return r.status === filter;
  });

  return (
    <div>
      <h1 className="mb-4">Değerlendirmeler</h1>

      <div className="d-flex gap-2 mb-4 flex-wrap">
        {([["all", "Tümü"], ["Pending", "Beklemede"], ["Approved", "Onaylı"], ["NotApproved", "Reddedildi"], ["featured", "Anasayfa"]] as const).map(([key, label]) => (
          <button key={key} className={`btn btn-sm ${filter === key ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setFilter(key)}>
            {label}
            {key !== "all" && <span className="badge bg-secondary ms-1">{key === "featured" ? reviews.filter((r) => r.isFeatured).length : reviews.filter((r) => r.status === key).length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" role="status" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-muted">Değerlendirme bulunamadı.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>Ürün</th>
                <th>Müşteri</th>
                <th>Puan</th>
                <th>Yorum</th>
                <th>Durum</th>
                <th>Tarih</th>
                <th>Anasayfa</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td><small className="fw-medium">{r.entityName}</small></td>
                  <td><small>{r.reviewerName}</small></td>
                  <td><span className="text-warning">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span></td>
                  <td style={{ maxWidth: 250 }}>
                    {r.title && <div className="fw-medium small">{r.title}</div>}
                    <small className="text-muted">{r.comment?.substring(0, 80)}{(r.comment?.length ?? 0) > 80 ? "..." : ""}</small>
                  </td>
                  <td><span className={`badge bg-${statusMap[r.status]?.color || "secondary"}`}>{statusMap[r.status]?.label || r.status}</span></td>
                  <td><small>{new Date(r.createdOn).toLocaleDateString("tr-TR")}</small></td>
                  <td>
                    <button
                      className={`btn btn-sm ${r.isFeatured ? "btn-warning" : "btn-outline-secondary"}`}
                      onClick={() => handleToggleFeatured(r.id)}
                      title={r.isFeatured ? "Anasayfadan kaldır" : "Anasayfada göster"}
                    >
                      {r.isFeatured ? "★" : "☆"}
                    </button>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      {r.status !== "Approved" && (
                        <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(r.id, 1)} title="Onayla">✓</button>
                      )}
                      {r.status !== "NotApproved" && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleStatusChange(r.id, 2)} title="Reddet">✕</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
