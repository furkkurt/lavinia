"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminOrders, changeOrderStatus, AdminOrderListItem, getInvoiceUrl } from "../../lib/api/orders";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  New: { label: "Yeni", color: "#6c757d" },
  OnHold: { label: "Beklemede", color: "#ffc107" },
  PendingPayment: { label: "Ödeme Bekleniyor", color: "#fd7e14" },
  PaymentReceived: { label: "Ödeme Alındı", color: "#6f42c1" },
  PaymentFailed: { label: "Ödeme Başarısız", color: "#dc3545" },
  Invoiced: { label: "Faturalandı", color: "#0dcaf0" },
  Shipping: { label: "Kargoya Verildi", color: "#0d6efd" },
  Shipped: { label: "Teslim Edildi", color: "#198754" },
  Complete: { label: "Tamamlandı", color: "#198754" },
  Canceled: { label: "İptal Edildi", color: "#dc3545" },
  Refunded: { label: "İade Edildi", color: "#dc3545" },
  Closed: { label: "Kapatıldı", color: "#6c757d" },
};

const STATUS_ID: Record<string, number> = {
  New: 1, OnHold: 10, PendingPayment: 20, PaymentReceived: 30,
  PaymentFailed: 35, Invoiced: 40, Shipping: 50, Shipped: 60,
  Complete: 70, Canceled: 80, Refunded: 90, Closed: 100,
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const pageSize = 20;

  useEffect(() => {
    fetchOrders();
  }, [pageIndex]);

  const fetchOrders = async () => {
    setLoading(true);
    const data = await getAdminOrders({ pageIndex, pageSize });
    if (data) {
      setOrders(data.items);
      setTotal(data.totalRecord);
    }
    setLoading(false);
  };

  const handleStatusChange = async (orderId: number, statusId: number) => {
    setUpdating(orderId);
    const ok = await changeOrderStatus(orderId, statusId);
    if (ok) {
      await fetchOrders();
    }
    setUpdating(null);
  };

  const getStatusInfo = (statusStr: string) => STATUS_MAP[statusStr] || { label: statusStr, color: "#6c757d" };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Siparişler</h2>
        <span className="text-muted">Toplam: {total} sipariş</span>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-5 text-muted">Henüz sipariş bulunmuyor.</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Müşteri</th>
                  <th>Toplam</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusInfo = getStatusInfo(order.orderStatus);
                  const isUpdating = updating === order.id;
                  return (
                    <tr key={order.id} style={{ opacity: isUpdating ? 0.5 : 1 }}>
                      <td>
                        <Link href={`/admin/orders/${order.id}`} className="fw-bold text-decoration-none">
                          #{order.id}
                        </Link>
                      </td>
                      <td>{order.customerName}</td>
                      <td className="fw-bold">{order.orderTotalString}</td>
                      <td>
                        <span className="badge" style={{ background: statusInfo.color, borderRadius: "4px", padding: "5px 10px" }}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>{new Date(order.createdOn).toLocaleDateString("tr-TR")}</td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          {order.orderStatus === "PaymentReceived" && (
                            <button
                              className="btn btn-sm btn-primary"
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(order.id, STATUS_ID.Shipping)}
                            >
                              Kargoya Ver
                            </button>
                          )}
                          {order.orderStatus === "Shipping" && (
                            <button
                              className="btn btn-sm btn-success"
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(order.id, STATUS_ID.Shipped)}
                            >
                              Teslim Edildi
                            </button>
                          )}
                          {order.orderStatus === "Shipped" && (
                            <button
                              className="btn btn-sm btn-dark"
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(order.id, STATUS_ID.Complete)}
                            >
                              Tamamla
                            </button>
                          )}
                          {(order.orderStatus === "New" || order.orderStatus === "PendingPayment") && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(order.id, STATUS_ID.PaymentReceived)}
                            >
                              Onayla
                            </button>
                          )}
                          <a
                            href={getInvoiceUrl(order.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-secondary"
                          >
                            Fatura
                          </a>
                          <Link href={`/admin/orders/${order.id}`} className="btn btn-sm btn-outline-dark">
                            Detay
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav className="mt-3">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${pageIndex === 0 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPageIndex(pageIndex - 1)}>Önceki</button>
                </li>
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
                  <li key={i} className={`page-item ${pageIndex === i ? "active" : ""}`}>
                    <button className="page-link" onClick={() => setPageIndex(i)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${pageIndex >= totalPages - 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPageIndex(pageIndex + 1)}>Sonraki</button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
