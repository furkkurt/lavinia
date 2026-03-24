"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAdminOrder, changeOrderStatus, downloadInvoicePdf } from "../../../lib/api/orders";
import { getImageUrl } from "../../../lib/api/config";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  New: { label: "Yeni", color: "#6c757d" },
  OnHold: { label: "Beklemede", color: "#ffc107" },
  PendingPayment: { label: "Ödeme Bekleniyor", color: "#fd7e14" },
  PaymentReceived: { label: "Ödeme Alındı", color: "#6f42c1" },
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

// Admin order detail uses a different response shape from the backend
interface AdminOrderDetail {
  id: number;
  createdOn: string;
  orderStatus: number;
  orderStatusString: string;
  customerName: string;
  customerEmail: string;
  subtotal: number;
  subtotalString: string;
  discountAmount: number;
  discountAmountString: string;
  taxAmount: number;
  taxAmountString: string;
  shippingAmount: number;
  shippingAmountString: string;
  orderTotal: number;
  orderTotalString: string;
  paymentMethod: string;
  shippingMethod: string;
  orderNote?: string;
  paymentFeeAmount: number;
  shippingAddress: {
    contactName: string;
    phone: string;
    addressLine1: string;
    cityName?: string;
    districtName?: string;
    stateOrProvinceName?: string;
    zipCode?: string;
  };
  orderItems: {
    id: number;
    productId: number;
    productName: string;
    productPrice: number;
    quantity: number;
    discountAmount: number;
    taxAmount: number;
    taxPercent: number;
    variationOptions?: { optionName: string; value: string }[];
  }[];
  isMasterOrder: boolean;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    const data = await getAdminOrder(orderId) as unknown as AdminOrderDetail;
    setOrder(data);
    setLoading(false);
  };

  const handleStatusChange = async (statusId: number) => {
    setUpdating(true);
    const ok = await changeOrderStatus(orderId, statusId);
    if (ok) await fetchOrder();
    setUpdating(false);
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border" role="status" /></div>;
  }

  if (!order) {
    return <div className="text-center py-5"><p>Sipariş bulunamadı.</p></div>;
  }

  const statusStr = order.orderStatusString;
  const statusInfo = STATUS_MAP[statusStr] || { label: statusStr, color: "#6c757d" };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link href="/admin/orders" className="text-muted text-decoration-none">← Siparişlere Dön</Link>
          <h2 className="mt-2">Sipariş #{order.id}</h2>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <span className="badge" style={{ background: statusInfo.color, borderRadius: "4px", padding: "8px 16px", fontSize: "14px" }}>
            {statusInfo.label}
          </span>
          <button type="button" onClick={() => downloadInvoicePdf(order.id)} className="btn btn-outline-dark">
            Fatura İndir
          </button>
        </div>
      </div>

      <div className="row">
        {/* Order Info */}
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-header"><strong>Ürünler</strong></div>
            <div className="card-body p-0">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>Birim Fiyat</th>
                    <th>Adet</th>
                    <th>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.productName}</strong>
                        {item.variationOptions && item.variationOptions.length > 0 && (
                          <div className="text-muted small">
                            {item.variationOptions.map((v) => `${v.optionName}: ${v.value}`).join(", ")}
                          </div>
                        )}
                      </td>
                      <td>₺{item.productPrice.toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td className="fw-bold">₺{(item.productPrice * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Ara Toplam</span>
                <span>{order.subtotalString}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>İndirim</span>
                  <span>-{order.discountAmountString}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="d-flex justify-content-between mb-2">
                  <span>Vergi</span>
                  <span>{order.taxAmountString}</span>
                </div>
              )}
              <div className="d-flex justify-content-between mb-2">
                <span>Kargo</span>
                <span>{order.shippingAmount > 0 ? order.shippingAmountString : "Ücretsiz"}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between fw-bold" style={{ fontSize: "18px" }}>
                <span>Toplam</span>
                <span>{order.orderTotalString}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Customer */}
          <div className="card mb-3">
            <div className="card-header"><strong>Müşteri</strong></div>
            <div className="card-body">
              <div>{order.customerName}</div>
              <div className="text-muted">{order.customerEmail}</div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="card mb-3">
              <div className="card-header"><strong>Teslimat Adresi</strong></div>
              <div className="card-body">
                <div><strong>{order.shippingAddress.contactName}</strong></div>
                <div>{order.shippingAddress.phone}</div>
                <div>{order.shippingAddress.addressLine1}</div>
                {order.shippingAddress.cityName && <div>{order.shippingAddress.cityName}</div>}
                {order.shippingAddress.stateOrProvinceName && <div>{order.shippingAddress.stateOrProvinceName}</div>}
              </div>
            </div>
          )}

          {/* Order Info */}
          <div className="card mb-3">
            <div className="card-header"><strong>Sipariş Bilgileri</strong></div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Tarih</span>
                <span>{new Date(order.createdOn).toLocaleString("tr-TR")}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Ödeme</span>
                <span>{order.paymentMethod || "-"}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Kargo</span>
                <span>{order.shippingMethod || "-"}</span>
              </div>
              {order.orderNote && (
                <div className="mt-2 p-2" style={{ background: "#f8f9fa" }}>
                  <small className="text-muted">Not:</small>
                  <div>{order.orderNote}</div>
                </div>
              )}
            </div>
          </div>

          {/* Status Actions */}
          <div className="card">
            <div className="card-header"><strong>Durum Güncelle</strong></div>
            <div className="card-body d-grid gap-2">
              {(statusStr === "New" || statusStr === "PendingPayment") && (
                <button className="btn btn-outline-success" disabled={updating} onClick={() => handleStatusChange(STATUS_ID.PaymentReceived)}>
                  Ödeme Alındı Olarak İşaretle
                </button>
              )}
              {statusStr === "PaymentReceived" && (
                <button className="btn btn-primary" disabled={updating} onClick={() => handleStatusChange(STATUS_ID.Shipping)}>
                  Kargoya Ver
                </button>
              )}
              {statusStr === "Shipping" && (
                <button className="btn btn-success" disabled={updating} onClick={() => handleStatusChange(STATUS_ID.Shipped)}>
                  Teslim Edildi
                </button>
              )}
              {statusStr === "Shipped" && (
                <button className="btn btn-dark" disabled={updating} onClick={() => handleStatusChange(STATUS_ID.Complete)}>
                  Tamamla
                </button>
              )}
              {!["Canceled", "Refunded", "Closed", "Complete"].includes(statusStr) && (
                <button className="btn btn-outline-danger" disabled={updating} onClick={() => handleStatusChange(STATUS_ID.Canceled)}>
                  İptal Et
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
