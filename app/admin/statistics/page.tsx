"use client";

import { useState, useEffect, useCallback } from "react";
import { getOrderStatistics, OrderStatistics } from "../../lib/api/orders";

const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

const statusLabels: Record<string, string> = {
  New: "Yeni",
  OnHold: "Beklemede",
  PendingPayment: "Ödeme Bekliyor",
  PaymentReceived: "Ödeme Alındı",
  PaymentFailed: "Ödeme Başarısız",
  Invoiced: "Faturalandı",
  Shipping: "Kargoda",
  Shipped: "Teslim Edildi",
  Complete: "Tamamlandı",
  Canceled: "İptal",
  Refunded: "İade",
};

function formatCurrency(val: number) {
  return `₺${val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** ASP.NET bazen PascalCase döndürebilir; grafik ve listeler için normalize et */
function normalizeStats(raw: OrderStatistics | null): OrderStatistics | null {
  if (!raw) return null;
  const monthly = Array.isArray(raw.monthlyRevenue)
    ? raw.monthlyRevenue.map((m: any) => ({
        year: Number(m.year ?? m.Year ?? 0),
        month: Number(m.month ?? m.Month ?? 0),
        revenue: Number(m.revenue ?? m.Revenue ?? 0),
        orderCount: Number(m.orderCount ?? m.OrderCount ?? 0),
      }))
    : [];
  const statusCounts = Array.isArray(raw.statusCounts)
    ? raw.statusCounts.map((sc: any) => ({
        status: String(sc.status ?? sc.Status ?? ""),
        count: Number(sc.count ?? sc.Count ?? 0),
      }))
    : [];
  const topProducts = Array.isArray(raw.topProducts)
    ? raw.topProducts.map((p: any) => ({
        productId: Number(p.productId ?? p.ProductId ?? 0),
        name: String(p.name ?? p.Name ?? ""),
        totalQuantity: Number(p.totalQuantity ?? p.TotalQuantity ?? 0),
        totalRevenue: Number(p.totalRevenue ?? p.TotalRevenue ?? 0),
      }))
    : [];
  return {
    totalRevenue: Number(raw.totalRevenue),
    totalOrders: Number(raw.totalOrders),
    thisMonthRevenue: Number(raw.thisMonthRevenue),
    thisWeekRevenue: Number(raw.thisWeekRevenue),
    avgOrderValue: Number(raw.avgOrderValue),
    statusCounts,
    topProducts,
    monthlyRevenue: monthly,
  };
}

export type StatsPeriod = "all" | 1 | 3 | 6 | 12;

export default function StatisticsPage() {
  const [stats, setStats] = useState<OrderStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<StatsPeriod>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const months = period === "all" ? null : period;
    const data = await getOrderStatistics(months);
    setStats(normalizeStats(data));
    setLoading(false);
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  if (!stats) {
    return <div className="alert alert-warning">İstatistik verileri yüklenemedi.</div>;
  }

  const chartHeightPx = 200;
  const revenues = stats.monthlyRevenue.map((m) => m.revenue);
  const maxMonthlyRevenue = Math.max(...revenues, 1);

  const periodLabel =
    period === "all"
      ? "Tüm zamanlar"
      : `Son ${period} ay`;

  return (
    <div>
      <h1 className="mb-3">Satış İstatistikleri</h1>

      <div className="d-flex flex-wrap gap-2 align-items-center mb-4">
        <span className="text-muted small me-1">Dönem:</span>
        {(
          [
            { key: 1 as const, label: "Son 1 Ay" },
            { key: 3 as const, label: "Son 3 Ay" },
            { key: 6 as const, label: "Son 6 Ay" },
            { key: 12 as const, label: "Son 12 Ay" },
            { key: "all" as const, label: "Tüm Zamanlar" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={String(key)}
            type="button"
            className={`btn btn-sm ${period === key ? "btn-dark" : "btn-outline-secondary"}`}
            onClick={() => setPeriod(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-muted small mb-4">Seçili dönem: <strong>{periodLabel}</strong></p>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: "Toplam Gelir", value: formatCurrency(stats.totalRevenue), color: "#198754" },
          ...(period === "all"
            ? [
                { label: "Bu Ay", value: formatCurrency(stats.thisMonthRevenue), color: "#0d6efd" },
                { label: "Bu Hafta", value: formatCurrency(stats.thisWeekRevenue), color: "#6f42c1" },
              ]
            : []),
          { label: "Toplam Sipariş", value: stats.totalOrders.toString(), color: "#fd7e14" },
          { label: "Ortalama Sipariş", value: formatCurrency(stats.avgOrderValue), color: "#20c997" },
        ].map((card) => (
          <div key={card.label} className="col-6 col-lg">
            <div className="card h-100">
              <div className="card-body text-center">
                <small className="text-muted d-block mb-1">{card.label}</small>
                <h4 className="mb-0" style={{ color: card.color }}>{card.value}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Monthly Revenue Chart — bar height in px so flex % layout cannot collapse to 0 */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Aylık Gelir</h5>
              <small className="text-muted">{periodLabel}</small>
            </div>
            <div className="card-body">
              {stats.monthlyRevenue.length === 0 ? (
                <p className="text-muted">Henüz veri yok.</p>
              ) : (
                <div
                  className="d-flex align-items-end gap-1 pt-2"
                  style={{ minHeight: chartHeightPx + 48 }}
                >
                  {stats.monthlyRevenue.map((m) => {
                    const barH =
                      m.revenue > 0
                        ? Math.max((m.revenue / maxMonthlyRevenue) * chartHeightPx, 6)
                        : 2;
                    return (
                      <div
                        key={`${m.year}-${m.month}`}
                        className="flex-fill text-center d-flex flex-column justify-content-end"
                        style={{ minWidth: 0 }}
                      >
                        <div
                          style={{
                            height: `${barH}px`,
                            backgroundColor: "#0d6efd",
                            borderRadius: "4px 4px 0 0",
                            transition: "height 0.3s",
                            margin: "0 auto",
                            width: "100%",
                            maxWidth: 48,
                          }}
                          title={`${formatCurrency(m.revenue)} (${m.orderCount} sipariş)`}
                        />
                        <small className="d-block mt-1" style={{ fontSize: 10 }}>
                          {monthNames[(m.month || 1) - 1]}
                        </small>
                        <small className="d-block text-muted" style={{ fontSize: 9 }}>
                          {formatCurrency(m.revenue)}
                        </small>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Status Counts */}
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header"><h5 className="mb-0">Sipariş Durumları</h5></div>
            <div className="card-body">
              {stats.statusCounts.length === 0 ? (
                <p className="text-muted">Henüz sipariş yok.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {stats.statusCounts.map((sc) => (
                    <li key={sc.status} className="list-group-item d-flex justify-content-between align-items-center px-0">
                      <span>{statusLabels[sc.status] || sc.status}</span>
                      <span className="badge bg-dark">{sc.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="card mt-4">
        <div className="card-header"><h5 className="mb-0">En Çok Satan Ürünler (Top 10)</h5></div>
        <div className="card-body p-0">
          {stats.topProducts.length === 0 ? (
            <p className="text-muted p-3">Henüz satış verisi yok.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Ürün</th>
                    <th className="text-end">Satılan Adet</th>
                    <th className="text-end">Toplam Gelir</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topProducts.map((p, i) => (
                    <tr key={p.productId}>
                      <td>{i + 1}</td>
                      <td>{p.name}</td>
                      <td className="text-end">{p.totalQuantity}</td>
                      <td className="text-end">{formatCurrency(p.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
