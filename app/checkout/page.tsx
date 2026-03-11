"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SvgSprite from "../components/SvgSprite";
import { createCheckout, getCheckoutSummary, completeCheckout, CheckoutSummary } from "../lib/api/checkout";
import { getAddresses, createAddress, UserAddress, AddressFormData } from "../lib/api/addresses";
import { getImageUrl } from "../lib/api/config";

type Step = "address" | "summary" | "success";

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("address");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number>(0);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<AddressFormData>({
    contactName: "", phone: "", addressLine1: "", city: "",
    stateOrProvinceId: 0, countryId: "TR",
  });

  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [orderNote, setOrderNote] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderTotal, setOrderTotal] = useState("");

  useEffect(() => {
    const preloader = document.querySelector(".preloader");
    if (preloader) preloader.classList.add("loaded");
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    const addrs = await getAddresses();
    setAddresses(addrs);
    if (addrs.length > 0) {
      const defaultAddr = addrs.find((a) => a.isDefault);
      setSelectedAddressId(defaultAddr ? defaultAddr.id : addrs[0].id);
    } else {
      setShowNewAddress(true);
    }
    setLoading(false);
  };

  const handleCreateAddress = async () => {
    if (!newAddress.contactName || !newAddress.phone || !newAddress.addressLine1 || !newAddress.city) {
      setError("Lütfen tüm zorunlu alanları doldurun");
      return;
    }
    setSubmitting(true);
    setError(null);
    const ok = await createAddress({ ...newAddress, stateOrProvinceId: newAddress.stateOrProvinceId || 1 });
    if (ok) {
      const addrs = await getAddresses();
      setAddresses(addrs);
      if (addrs.length > 0) {
        setSelectedAddressId(addrs[addrs.length - 1].id);
      }
      setShowNewAddress(false);
    } else {
      setError("Adres kaydedilemedi");
    }
    setSubmitting(false);
  };

  const handleProceedToSummary = async () => {
    if (selectedAddressId === 0) {
      setError("Lütfen bir teslimat adresi seçin");
      return;
    }
    setSubmitting(true);
    setError(null);

    const result = await createCheckout();
    if (!result) {
      setError("Sepetiniz boş veya bir hata oluştu");
      setSubmitting(false);
      return;
    }

    setCheckoutId(result.checkoutId);
    const summaryData = await getCheckoutSummary(result.checkoutId);
    setSummary(summaryData);
    setStep("summary");
    setSubmitting(false);
  };

  const handleComplete = async () => {
    if (!checkoutId) return;
    setSubmitting(true);
    setError(null);

    const result = await completeCheckout(checkoutId, selectedAddressId, orderNote);
    if (result.success && result.data) {
      setOrderId(result.data.orderId);
      setOrderTotal(result.data.orderTotalString);
      setStep("success");
    } else {
      setError(result.error || "Sipariş oluşturulamadı");
    }
    setSubmitting(false);
  };

  const selectedAddr = addresses.find((a) => a.id === selectedAddressId);

  return (
    <>
      <SvgSprite />
      <Navbar />

      <div className="container" style={{ paddingTop: "140px", paddingBottom: "60px", minHeight: "80vh" }}>
        {/* Steps indicator */}
        {step !== "success" && (
          <div className="d-flex align-items-center gap-3 mb-4">
            <span
              className={`badge ${step === "address" ? "bg-dark" : "bg-secondary"}`}
              style={{ borderRadius: 0, padding: "8px 16px", fontSize: "13px" }}
            >
              1. Teslimat Adresi
            </span>
            <span style={{ color: "#ccc" }}>→</span>
            <span
              className={`badge ${step === "summary" ? "bg-dark" : "bg-secondary"}`}
              style={{ borderRadius: 0, padding: "8px 16px", fontSize: "13px" }}
            >
              2. Sipariş Özeti & Ödeme
            </span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status" />
          </div>
        ) : step === "address" ? (
          <div className="row">
            <div className="col-lg-8">
              <h4 style={{ fontFamily: "var(--font-marcellus)", marginBottom: "20px" }}>Teslimat Adresi</h4>

              {addresses.length > 0 && !showNewAddress && (
                <div className="mb-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-3 mb-2 d-flex align-items-start gap-3`}
                      style={{
                        border: selectedAddressId === addr.id ? "2px solid #000" : "1px solid #e5e5e5",
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedAddressId(addr.id)}
                    >
                      <input
                        type="radio"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        style={{ marginTop: "4px" }}
                      />
                      <div>
                        <strong>{addr.contactName}</strong> - {addr.phone}
                        <br />
                        {addr.addressLine1}
                        {addr.city && <>, {addr.city}</>}
                        {addr.stateOrProvinceName && <> / {addr.stateOrProvinceName}</>}
                        {addr.isDefault && (
                          <span className="badge bg-dark ms-2" style={{ borderRadius: 0, fontSize: "10px" }}>
                            Varsayılan
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    className="btn btn-outline-dark btn-sm mt-2"
                    style={{ borderRadius: 0 }}
                    onClick={() => setShowNewAddress(true)}
                  >
                    + Yeni Adres Ekle
                  </button>
                </div>
              )}

              {showNewAddress && (
                <div className="p-4 mb-4" style={{ border: "1px solid #e5e5e5" }}>
                  <h6 className="mb-3">Yeni Adres</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Ad Soyad *</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{ borderRadius: 0 }}
                        value={newAddress.contactName}
                        onChange={(e) => setNewAddress({ ...newAddress, contactName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Telefon *</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{ borderRadius: 0 }}
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Adres *</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{ borderRadius: 0 }}
                        value={newAddress.addressLine1}
                        onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Şehir *</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{ borderRadius: 0 }}
                        value={newAddress.city || ""}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">İlçe</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{ borderRadius: 0 }}
                        value={newAddress.addressLine2 || ""}
                        onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mt-3 d-flex gap-2">
                    <button
                      className="btn btn-dark"
                      style={{ borderRadius: 0 }}
                      onClick={handleCreateAddress}
                      disabled={submitting}
                    >
                      {submitting ? "Kaydediliyor..." : "Adresi Kaydet"}
                    </button>
                    {addresses.length > 0 && (
                      <button
                        className="btn btn-outline-secondary"
                        style={{ borderRadius: 0 }}
                        onClick={() => setShowNewAddress(false)}
                      >
                        İptal
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button
                className="btn btn-dark mt-3"
                style={{ borderRadius: 0, padding: "14px 40px", fontSize: "15px" }}
                onClick={handleProceedToSummary}
                disabled={submitting || selectedAddressId === 0}
              >
                {submitting ? "Yükleniyor..." : "Devam Et"}
              </button>
            </div>
          </div>
        ) : step === "summary" ? (
          <div className="row">
            <div className="col-lg-8">
              <h4 style={{ fontFamily: "var(--font-marcellus)", marginBottom: "20px" }}>Sipariş Özeti</h4>

              {selectedAddr && (
                <div className="p-3 mb-4" style={{ border: "1px solid #e5e5e5", background: "#fafafa" }}>
                  <small className="text-muted d-block mb-1">Teslimat Adresi</small>
                  <strong>{selectedAddr.contactName}</strong> - {selectedAddr.phone}
                  <br />
                  {selectedAddr.addressLine1}
                  {selectedAddr.city && <>, {selectedAddr.city}</>}
                  {selectedAddr.stateOrProvinceName && <> / {selectedAddr.stateOrProvinceName}</>}
                </div>
              )}

              {summary && (
                <table className="table align-middle">
                  <thead>
                    <tr style={{ borderBottom: "2px solid #000" }}>
                      <th>Ürün</th>
                      <th style={{ width: "80px" }}>Adet</th>
                      <th style={{ width: "120px" }}>Fiyat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.items.map((item) => (
                      <tr key={item.productId}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Image
                              src={getImageUrl(item.productImage)}
                              alt={item.productName}
                              width={50}
                              height={60}
                              style={{ objectFit: "cover" }}
                            />
                            <span>{item.productName}</span>
                          </div>
                        </td>
                        <td>{item.quantity}</td>
                        <td>{item.totalString}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="mb-3">
                <label className="form-label">Sipariş Notu (isteğe bağlı)</label>
                <textarea
                  className="form-control"
                  style={{ borderRadius: 0 }}
                  rows={2}
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Siparişinizle ilgili bir not ekleyebilirsiniz..."
                />
              </div>
            </div>

            <div className="col-lg-4">
              <div style={{ border: "1px solid #e5e5e5", padding: "24px" }}>
                <h5 style={{ fontFamily: "var(--font-marcellus)", borderBottom: "1px solid #e5e5e5", paddingBottom: "16px" }}>
                  Ödeme
                </h5>
                {summary && (
                  <>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Ara Toplam</span>
                      <span>{summary.subTotalString}</span>
                    </div>
                    {summary.discount > 0 && (
                      <div className="d-flex justify-content-between mb-2 text-success">
                        <span>İndirim</span>
                        <span>-{summary.discountString}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between mb-2">
                      <span>Kargo</span>
                      <span className="text-success">Ücretsiz</span>
                    </div>
                    <div
                      className="d-flex justify-content-between mt-3 pt-3"
                      style={{ borderTop: "2px solid #000", fontWeight: 700, fontSize: "18px" }}
                    >
                      <span>Toplam</span>
                      <span>{summary.orderTotalString}</span>
                    </div>
                  </>
                )}

                <div className="p-3 mt-3 mb-3" style={{ background: "#f8f9fa", border: "1px solid #e5e5e5" }}>
                  <small className="text-muted">Ödeme Yöntemi</small>
                  <div className="fw-bold mt-1">Kapıda Ödeme (Mock)</div>
                </div>

                <button
                  className="btn btn-dark w-100"
                  style={{ borderRadius: 0, padding: "14px", fontSize: "15px", letterSpacing: "1px" }}
                  onClick={handleComplete}
                  disabled={submitting}
                >
                  {submitting ? "İşleniyor..." : "SİPARİŞİ ONAYLA"}
                </button>
                <button
                  className="btn btn-outline-dark w-100 mt-2"
                  style={{ borderRadius: 0, padding: "12px" }}
                  onClick={() => setStep("address")}
                  disabled={submitting}
                >
                  Geri Dön
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Success */
          <div className="text-center py-5">
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>✓</div>
            <h3 style={{ fontFamily: "var(--font-marcellus)" }}>Siparişiniz Alındı!</h3>
            <p className="text-muted mt-3">
              Sipariş numaranız: <strong>#{orderId}</strong>
            </p>
            <p>
              Toplam: <strong>{orderTotal}</strong>
            </p>
            <p className="text-muted">Siparişinizin durumunu profilinizden takip edebilirsiniz.</p>
            <div className="mt-4 d-flex justify-content-center gap-3">
              <Link
                href="/profile"
                className="btn btn-dark"
                style={{ borderRadius: 0, padding: "12px 30px" }}
              >
                Siparişlerim
              </Link>
              <Link
                href="/products"
                className="btn btn-outline-dark"
                style={{ borderRadius: 0, padding: "12px 30px" }}
              >
                Alışverişe Devam Et
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
