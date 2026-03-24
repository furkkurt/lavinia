"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SvgSprite from "../components/SvgSprite";
import { getUserOrders, getUserOrder, OrderListItem, OrderDetail, downloadInvoicePdf } from "../lib/api/orders";
import { createReview } from "../lib/api/reviews";
import {
  getAddresses, createAddress, updateAddress, deleteAddress,
  setDefaultAddress, UserAddress, AddressFormData, getStates,
} from "../lib/api/addresses";
import { getCurrentUser } from "../lib/api/auth";
import { getImageUrl } from "../lib/api/config";
import Image from "next/image";

type Tab = "orders" | "addresses" | "account";

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("orders");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Orders
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [editingAddr, setEditingAddr] = useState<number | null>(null);
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [addrForm, setAddrForm] = useState<AddressFormData>({
    contactName: "", phone: "", addressLine1: "", city: "",
    stateOrProvinceId: 0, countryId: "TR",
  });
  const [addrSubmitting, setAddrSubmitting] = useState(false);
  const [addrError, setAddrError] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);

  // Review modal (for completed orders - single product at a time)
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<OrderDetail | null>(null);
  const [reviewForm, setReviewForm] = useState<Record<number, { rating: number; comment: string }>>({});
  const [reviewSingleProductId, setReviewSingleProductId] = useState<number | null>(null); // null = all products, number = just this one
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    const preloader = document.querySelector(".preloader");
    if (preloader) preloader.classList.add("loaded");
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    try {
      const [userData, ordersData, addrsData, trStates] = await Promise.all([
        getCurrentUser(),
        getUserOrders(),
        getAddresses(),
        getStates("TR"),
      ]);
      setUser(userData);
      setOrders(ordersData);
      setAddresses(addrsData);
      setProvinces(trStates);
    } catch (e) {
      console.error("[Profil] Veri veya il listesi yüklenemedi:", e);
      const [userData, ordersData, addrsData] = await Promise.all([
        getCurrentUser(),
        getUserOrders(),
        getAddresses(),
      ]);
      setUser(userData);
      setOrders(ordersData);
      setAddresses(addrsData);
    }
    setLoading(false);
  };

  /** Open review modal for a single product (when user clicks Değerlendir on that product) */
  const openReviewModalForProduct = (order: OrderDetail, productId: number) => {
    setReviewOrder(order);
    setReviewForm({ [productId]: { rating: 5, comment: "" } });
    setReviewError(null);
    setReviewSingleProductId(productId); // Only review this one product
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewOrder) return;
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const productIdsToReview = reviewSingleProductId != null
        ? [reviewSingleProductId]
        : Array.from(new Set(reviewOrder.orderItems.map((i) => i.productId)));
      for (const productId of productIdsToReview) {
        const f = reviewForm[productId];
        if (!f) continue;
        const res = await createReview({
          entityId: productId,
          entityTypeId: "Product",
          rating: f.rating,
          comment: f.comment || "",
        });
        if (!res.success) {
          setReviewError(res.error || "Değerlendirme kaydedilemedi");
          return;
        }
      }
      setShowReviewModal(false);
      setReviewOrder(null);
      setReviewForm({});
      setReviewSingleProductId(null);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const toggleOrderDetail = async (orderId: number) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      setOrderDetail(null);
      return;
    }
    setExpandedOrder(orderId);
    setOrderDetailLoading(true);
    const detail = await getUserOrder(orderId);
    setOrderDetail(detail);
    setOrderDetailLoading(false);
  };

  const handleSaveAddress = async () => {
    if (!addrForm.contactName || !addrForm.phone || !addrForm.addressLine1) {
      setAddrError("Lütfen tüm zorunlu alanları doldurun");
      return;
    }
    if (!addrForm.stateOrProvinceId) {
      setAddrError("Lütfen il seçiniz");
      return;
    }
    setAddrSubmitting(true);
    setAddrError(null);
    const data = { ...addrForm };
    let ok: boolean;
    if (editingAddr) {
      ok = await updateAddress(editingAddr, data);
    } else {
      ok = await createAddress(data);
    }
    if (ok) {
      const addrs = await getAddresses();
      setAddresses(addrs);
      resetAddrForm();
    } else {
      setAddrError("İşlem başarısız");
    }
    setAddrSubmitting(false);
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("Bu adresi silmek istediğinizden emin misiniz?")) return;
    await deleteAddress(id);
    const addrs = await getAddresses();
    setAddresses(addrs);
  };

  const handleSetDefault = async (id: number) => {
    await setDefaultAddress(id);
    const addrs = await getAddresses();
    setAddresses(addrs);
  };

  const startEditAddress = (addr: UserAddress) => {
    setEditingAddr(addr.id);
    const provName =
      provinces.find((p) => p.id === addr.stateOrProvinceId)?.name || addr.stateOrProvinceName || addr.city || "";
    setAddrForm({
      contactName: addr.contactName, phone: addr.phone,
      addressLine1: addr.addressLine1, addressLine2: addr.addressLine2,
      city: provName,
      stateOrProvinceId: addr.stateOrProvinceId,
      countryId: addr.countryId || "TR",
    });
    setShowNewAddr(true);
  };

  const resetAddrForm = () => {
    setEditingAddr(null);
    setShowNewAddr(false);
    setAddrForm({ contactName: "", phone: "", addressLine1: "", city: "", stateOrProvinceId: 0, countryId: "TR" });
    setAddrError(null);
  };

  const statusColor = (status: number) => {
    if (status >= 70) return "#198754";
    if (status >= 50) return "#0d6efd";
    if (status >= 30) return "#6f42c1";
    if (status >= 80) return "#dc3545";
    return "#6c757d";
  };

  if (loading) {
    return (
      <>
        <SvgSprite /><Navbar />
        <div className="container text-center" style={{ paddingTop: "160px", minHeight: "80vh" }}>
          <div className="spinner-border" role="status" />
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <SvgSprite /><Navbar />
        <div className="container text-center" style={{ paddingTop: "160px", minHeight: "80vh" }}>
          <h4>Lütfen giriş yapın</h4>
          <p className="text-muted">Profilinizi görüntülemek için giriş yapmanız gerekiyor.</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SvgSprite />
      <Navbar />

      <div className="container" style={{ paddingTop: "140px", paddingBottom: "60px", minHeight: "80vh" }}>
        <h2 className="mb-4" style={{ fontFamily: "var(--font-marcellus)", fontSize: "28px" }}>Hesabım</h2>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button className={`nav-link ${tab === "orders" ? "active" : ""}`} onClick={() => setTab("orders")} style={{ borderRadius: 0, color: tab === "orders" ? "#000" : "#666" }}>
              Siparişlerim ({orders.length})
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${tab === "addresses" ? "active" : ""}`} onClick={() => setTab("addresses")} style={{ borderRadius: 0, color: tab === "addresses" ? "#000" : "#666" }}>
              Adreslerim ({addresses.length})
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${tab === "account" ? "active" : ""}`} onClick={() => setTab("account")} style={{ borderRadius: 0, color: tab === "account" ? "#000" : "#666" }}>
              Hesap Bilgileri
            </button>
          </li>
        </ul>

        {/* Orders Tab */}
        {tab === "orders" && (
          <div>
            {orders.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">Henüz siparişiniz bulunmuyor.</p>
                <Link href="/urunler" className="btn btn-dark" style={{ borderRadius: 0 }}>Alışverişe Başla</Link>
              </div>
            ) : (
              <div>
                {orders.map((order) => (
                  <div key={order.id} className="mb-3" style={{ border: "1px solid #e5e5e5" }}>
                    <div
                      className="d-flex justify-content-between align-items-center p-3"
                      style={{ cursor: "pointer", background: expandedOrder === order.id ? "#f8f9fa" : "white" }}
                      onClick={() => toggleOrderDetail(order.id)}
                    >
                      <div className="d-flex align-items-center gap-4">
                        <div>
                          <small className="text-muted">Sipariş No</small>
                          <div className="fw-bold">#{order.id}</div>
                        </div>
                        <div>
                          <small className="text-muted">Tarih</small>
                          <div>{new Date(order.createdOn).toLocaleDateString("tr-TR")}</div>
                        </div>
                        <div>
                          <small className="text-muted">Toplam</small>
                          <div className="fw-bold">{order.orderTotalString}</div>
                        </div>
                        <div>
                          <small className="text-muted">Ürün</small>
                          <div>{order.itemCount} adet</div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <span
                          className="badge"
                          style={{ background: statusColor(order.orderStatus), borderRadius: 0, padding: "6px 12px" }}
                        >
                          {order.orderStatusDisplay}
                        </span>
                        <span>{expandedOrder === order.id ? "▲" : "▼"}</span>
                      </div>
                    </div>

                    {expandedOrder === order.id && (
                      <div className="p-3" style={{ borderTop: "1px solid #e5e5e5" }}>
                        {orderDetailLoading ? (
                          <div className="text-center py-3"><div className="spinner-border spinner-border-sm" /></div>
                        ) : orderDetail ? (
                          <div>
                            {orderDetail.shippingAddress && (
                              <div className="mb-3 p-2" style={{ background: "#f8f9fa" }}>
                                <small className="text-muted">Teslimat Adresi:</small>{" "}
                                {orderDetail.shippingAddress.contactName} - {orderDetail.shippingAddress.phone},{" "}
                                {orderDetail.shippingAddress.addressLine1}
                                {orderDetail.shippingAddress.city && `, ${orderDetail.shippingAddress.city}`}
                              </div>
                            )}
                            <table className="table table-sm">
                              <thead>
                                <tr>
                                  <th>Ürün</th><th>Adet</th><th>Fiyat</th><th>Toplam</th>
                                  {orderDetail.orderStatus === 70 && <th></th>}
                                </tr>
                              </thead>
                              <tbody>
                                {orderDetail.orderItems.map((item) => (
                                  <tr key={item.id}>
                                    <td>
                                      <div className="d-flex align-items-center gap-2">
                                        {item.productImage && (
                                          <Image src={getImageUrl(item.productImage)} alt={item.productName} width={40} height={50} style={{ objectFit: "cover" }} />
                                        )}
                                        <Link href={`/urunler/${item.productId}`} style={{ color: "#000", textDecoration: "none" }}>{item.productName}</Link>
                                      </div>
                                    </td>
                                    <td>{item.quantity}</td>
                                    <td>{item.productPriceString}</td>
                                    <td>{item.totalString}</td>
                                    {orderDetail.orderStatus === 70 && (
                                      <td>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); openReviewModalForProduct(orderDetail, item.productId); }}
                                          className="btn btn-outline-primary btn-sm"
                                          style={{ borderRadius: 0 }}
                                        >
                                          Değerlendir
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="d-flex justify-content-between align-items-center mt-2">
                              <div>
                                <strong>Toplam: {orderDetail.orderTotalString}</strong>
                              </div>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => downloadInvoicePdf(orderDetail.id)}
                                  className="btn btn-outline-dark btn-sm"
                                  style={{ borderRadius: 0 }}
                                >
                                  Fatura İndir
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {tab === "addresses" && (
          <div>
            {!showNewAddr && (
              <button className="btn btn-dark mb-3" style={{ borderRadius: 0 }} onClick={() => { resetAddrForm(); setShowNewAddr(true); }}>
                + Yeni Adres Ekle
              </button>
            )}

            {showNewAddr && (
              <div className="p-4 mb-4" style={{ border: "1px solid #e5e5e5" }}>
                <h6>{editingAddr ? "Adresi Düzenle" : "Yeni Adres"}</h6>
                {addrError && <div className="alert alert-danger py-2">{addrError}</div>}
                <div className="row g-3 mt-1">
                  <div className="col-md-6">
                    <label className="form-label">Ad Soyad *</label>
                    <input type="text" className="form-control" style={{ borderRadius: 0 }} value={addrForm.contactName} onChange={(e) => setAddrForm({ ...addrForm, contactName: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Telefon *</label>
                    <input type="text" className="form-control" style={{ borderRadius: 0 }} value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Adres *</label>
                    <input type="text" className="form-control" style={{ borderRadius: 0 }} value={addrForm.addressLine1} onChange={(e) => setAddrForm({ ...addrForm, addressLine1: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">İl *</label>
                    <select
                      className="form-select"
                      style={{ borderRadius: 0 }}
                      value={addrForm.stateOrProvinceId || ""}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        const prov = provinces.find((p) => p.id === id);
                        setAddrForm({
                          ...addrForm,
                          stateOrProvinceId: id,
                          city: prov?.name || addrForm.city,
                        });
                      }}
                    >
                      <option value="">İl seçiniz</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">İlçe</label>
                    <input type="text" className="form-control" style={{ borderRadius: 0 }} value={addrForm.addressLine2 || ""} onChange={(e) => setAddrForm({ ...addrForm, addressLine2: e.target.value })} />
                  </div>
                </div>
                <div className="mt-3 d-flex gap-2">
                  <button className="btn btn-dark" style={{ borderRadius: 0 }} onClick={handleSaveAddress} disabled={addrSubmitting}>
                    {addrSubmitting ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                  <button className="btn btn-outline-secondary" style={{ borderRadius: 0 }} onClick={resetAddrForm}>İptal</button>
                </div>
              </div>
            )}

            {addresses.length === 0 && !showNewAddr ? (
              <p className="text-muted">Henüz kayıtlı adresiniz bulunmuyor.</p>
            ) : (
              <div className="row">
                {addresses.map((addr) => (
                  <div key={addr.id} className="col-md-6 mb-3">
                    <div className="p-3 h-100" style={{ border: addr.isDefault ? "2px solid #000" : "1px solid #e5e5e5" }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <strong>{addr.contactName}</strong>
                        {addr.isDefault && <span className="badge bg-dark" style={{ borderRadius: 0, fontSize: "10px" }}>Varsayılan</span>}
                      </div>
                      <div className="text-muted mb-1">{addr.phone}</div>
                      <div>{addr.addressLine1}</div>
                      {addr.city && <div>{addr.city}{addr.stateOrProvinceName ? ` / ${addr.stateOrProvinceName}` : ""}</div>}
                      <div className="mt-3 d-flex gap-2">
                        <button className="btn btn-outline-dark btn-sm" style={{ borderRadius: 0 }} onClick={() => startEditAddress(addr)}>Düzenle</button>
                        {!addr.isDefault && (
                          <button className="btn btn-outline-secondary btn-sm" style={{ borderRadius: 0 }} onClick={() => handleSetDefault(addr.id)}>Varsayılan Yap</button>
                        )}
                        <button className="btn btn-outline-danger btn-sm" style={{ borderRadius: 0 }} onClick={() => handleDeleteAddress(addr.id)}>Sil</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Account Tab */}
        {tab === "account" && (
          <div className="row">
            <div className="col-md-6">
              <div className="p-4" style={{ border: "1px solid #e5e5e5" }}>
                <div className="mb-3">
                  <label className="form-label text-muted">Ad Soyad</label>
                  <div className="fw-bold">{user?.fullName || "-"}</div>
                </div>
                <div className="mb-3">
                  <label className="form-label text-muted">E-posta</label>
                  <div className="fw-bold">{user?.email || "-"}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal for completed orders */}
      {showReviewModal && reviewOrder && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Siparişi Değerlendir</h5>
                <button type="button" className="btn-close" onClick={() => { setShowReviewModal(false); setReviewOrder(null); setReviewSingleProductId(null); }} aria-label="Kapat" />
              </div>
              <div className="modal-body">
                {reviewError && <div className="alert alert-danger py-2">{reviewError}</div>}
                <p className="text-muted small mb-3">
                  {reviewSingleProductId != null ? "Bu ürünü değerlendirin." : "Satın aldığınız ürünleri değerlendirin."}
                </p>
                {Array.from(new Map(reviewOrder.orderItems.map((i) => [i.productId, i])).values())
                  .filter((item) => reviewSingleProductId == null || item.productId === reviewSingleProductId)
                  .map((item) => {
                  const f = reviewForm[item.productId] ?? { rating: 5, comment: "" };
                  return (
                    <div key={item.id} className="mb-4 p-3" style={{ border: "1px solid #e5e5e5" }}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        {item.productImage && (
                          <Image src={getImageUrl(item.productImage)} alt={item.productName} width={40} height={50} style={{ objectFit: "cover" }} />
                        )}
                        <strong>{item.productName}</strong>
                      </div>
                      <div className="mb-2">
                        <label className="form-label small mb-1">Puan (1-5)</label>
                        <div className="d-flex gap-1 align-items-center">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              className="btn btn-link p-0 border-0"
                              style={{ fontSize: "1.5rem", color: n <= f.rating ? "#ffc107" : "#ddd", textDecoration: "none" }}
                              onClick={() =>
                                setReviewForm((prev) => ({
                                  ...prev,
                                  [item.productId]: { ...(prev[item.productId] ?? { rating: 5, comment: "" }), rating: n },
                                }))
                              }
                              aria-label={`${n} yıldız`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="form-label small mb-1">Yorum (isteğe bağlı)</label>
                        <textarea
                          className="form-control form-control-sm"
                          rows={2}
                          placeholder="Ürün hakkında düşüncenizi yazın..."
                          value={f.comment}
                          onChange={(e) =>
                            setReviewForm((prev) => ({
                              ...prev,
                              [item.productId]: { ...(prev[item.productId] ?? { rating: 5, comment: "" }), comment: e.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" style={{ borderRadius: 0 }} onClick={() => { setShowReviewModal(false); setReviewOrder(null); setReviewSingleProductId(null); }}>
                  İptal
                </button>
                <button type="button" className="btn btn-primary" style={{ borderRadius: 0 }} onClick={handleSubmitReview} disabled={reviewSubmitting}>
                  {reviewSubmitting ? "Gönderiliyor..." : "Değerlendirmeyi Gönder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
