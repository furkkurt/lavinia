"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SvgSprite from "../components/SvgSprite";
import {
  createCheckout,
  getCheckoutSummary,
  completeCheckout,
  preparePayTrCheckout,
  CheckoutSummary,
} from "../lib/api/checkout";
import { getAddresses, createAddress, UserAddress, AddressFormData, getStates } from "../lib/api/addresses";
import { getImageUrl, getAuthToken, isApiHostedMediaSrc } from "../lib/api/config";
import { getEmailFromAuthToken } from "../lib/api/auth";
import { getPublicShop } from "../lib/api/shop";

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
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);
  /** PayTR iFrame API: get-token sonrası `/odeme/guvenli/{token}` */
  const [paytrIframeToken, setPaytrIframeToken] = useState<string | null>(null);
  const [payEmail, setPayEmail] = useState("");

  useEffect(() => {
    const preloader = document.querySelector(".preloader");
    if (preloader) preloader.classList.add("loaded");
    init();
  }, []);

  useEffect(() => {
    if (step !== "summary" || typeof window === "undefined") return;
    if (!getAuthToken()) return;
    let fromStorage: string | null = null;
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw) as { email?: string };
        if (u.email && typeof u.email === "string") fromStorage = u.email;
      }
    } catch {
      /* ignore */
    }
    const email = getEmailFromAuthToken() || fromStorage;
    if (email) {
      setPayEmail((prev) => (prev.trim() ? prev : email));
    }
  }, [step]);

  const isGuest = typeof window !== "undefined" && !getAuthToken();

  const init = async () => {
    setLoading(true);
    const shop = await getPublicShop();
    if (!shop.salesEnabled) {
      router.replace("/sepet");
      setLoading(false);
      return;
    }
    try {
      const states = await getStates("TR");
      setProvinces(states);
    } catch (e) {
      console.error("[Ödeme] İl listesi yüklenemedi:", e);
    }
    if (isGuest) {
      setShowNewAddress(true);
    } else {
      const addrs = await getAddresses();
      setAddresses(addrs);
      if (addrs.length > 0) {
        const defaultAddr = addrs.find((a) => a.isDefault);
        setSelectedAddressId(defaultAddr ? defaultAddr.id : addrs[0].id);
      } else {
        setShowNewAddress(true);
      }
    }
    setLoading(false);
  };

  const handleCreateAddress = async () => {
    if (!newAddress.contactName || !newAddress.phone || !newAddress.addressLine1 || !newAddress.stateOrProvinceId) {
      setError("Lütfen tüm zorunlu alanları doldurun");
      return;
    }
    setSubmitting(true);
    setError(null);
    const ok = await createAddress(newAddress);
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
    const hasValidAddress = isGuest
      ? (newAddress.contactName && newAddress.phone && newAddress.addressLine1 && newAddress.stateOrProvinceId)
      : (selectedAddressId > 0);
    if (!hasValidAddress) {
      setError(isGuest ? "Lütfen teslimat adresi bilgilerini doldurun" : "Lütfen bir teslimat adresi seçin");
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
    setPaytrIframeToken(null);
    setStep("summary");
    setSubmitting(false);
  };

  const handleComplete = async () => {
    if (!checkoutId) return;
    setSubmitting(true);
    setError(null);

    const result = isGuest
      ? await completeCheckout(checkoutId, 0, orderNote, {
          contactName: newAddress.contactName,
          phone: newAddress.phone,
          addressLine1: newAddress.addressLine1,
          addressLine2: newAddress.addressLine2,
          city: newAddress.city || "",
          zipCode: newAddress.zipCode,
          stateOrProvinceId: newAddress.stateOrProvinceId,
          countryId: newAddress.countryId || "TR",
        })
      : await completeCheckout(checkoutId, selectedAddressId, orderNote);
    if (result.success && result.data) {
      setOrderId(result.data.orderId);
      setOrderTotal(result.data.orderTotalString);
      setStep("success");
    } else {
      setError(result.error || "Sipariş oluşturulamadı");
    }
    setSubmitting(false);
  };

  const handlePayWithPaytr = async () => {
    if (!checkoutId) return;
    const email = payEmail.trim();
    if (!email || !email.includes("@")) {
      setError("PayTR için geçerli bir e-posta girin.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const prep = isGuest
      ? await preparePayTrCheckout(checkoutId, {
          email,
          shippingAddressId: 0,
          orderNote,
          guestShippingAddress: {
            contactName: newAddress.contactName,
            phone: newAddress.phone,
            addressLine1: newAddress.addressLine1,
            addressLine2: newAddress.addressLine2,
            city: newAddress.city || "",
            zipCode: newAddress.zipCode,
            stateOrProvinceId: newAddress.stateOrProvinceId,
            countryId: newAddress.countryId || "TR",
          },
        })
      : await preparePayTrCheckout(checkoutId, {
          email,
          shippingAddressId: selectedAddressId,
          orderNote,
        });

    if (!prep.success) {
      setError(prep.error || "Ödeme hazırlığı başarısız.");
      setSubmitting(false);
      return;
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch("/api/paytr-token", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ checkoutId }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setError(data.error || "PayTR ödeme oturumu açılamadı.");
        setSubmitting(false);
        return;
      }
      setPaytrIframeToken(data.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ağ hatası.");
    }
    setSubmitting(false);
  };

  const paytrIframeSrc = paytrIframeToken
    ? `https://www.paytr.com/odeme/guvenli/${paytrIframeToken}`
    : "";

  const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
  const displayAddr = isGuest ? { contactName: newAddress.contactName, phone: newAddress.phone, addressLine1: newAddress.addressLine1, city: newAddress.city, stateOrProvinceName: "" } : selectedAddr;

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

              {!isGuest && addresses.length > 0 && !showNewAddress && (
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
                  {!isGuest && (
                    <button
                      className="btn btn-outline-dark btn-sm mt-2"
                      style={{ borderRadius: 0 }}
                      onClick={() => setShowNewAddress(true)}
                    >
                      + Yeni Adres Ekle
                    </button>
                  )}
                </div>
              )}

              {(showNewAddress || isGuest) && (
                <div className="p-4 mb-4" style={{ border: "1px solid #e5e5e5" }}>
                  <h6 className="mb-3">{isGuest ? "Teslimat Bilgileri (Misafir)" : "Yeni Adres"}</h6>
                  {isGuest && <p className="text-muted small mb-3">Misafir olarak alışveriş yapıyorsunuz.</p>}
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
                      <label className="form-label">İl *</label>
                      <select
                        className="form-select"
                        style={{ borderRadius: 0 }}
                        value={newAddress.stateOrProvinceId || ""}
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          const prov = provinces.find((p) => p.id === id);
                          setNewAddress({ ...newAddress, stateOrProvinceId: id, city: prov?.name || "" });
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
                      <input
                        type="text"
                        className="form-control"
                        style={{ borderRadius: 0 }}
                        value={newAddress.addressLine2 || ""}
                        onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                      />
                    </div>
                  </div>
                  {!isGuest && (
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
                  )}
                </div>
              )}

              <button
                className="btn btn-dark mt-3"
                style={{ borderRadius: 0, padding: "14px 40px", fontSize: "15px" }}
                onClick={handleProceedToSummary}
                disabled={submitting || (!isGuest && selectedAddressId === 0) || (isGuest && !(newAddress.contactName && newAddress.phone && newAddress.addressLine1 && newAddress.stateOrProvinceId))}
              >
                {submitting ? "Yükleniyor..." : "Devam Et"}
              </button>
            </div>
          </div>
        ) : step === "summary" ? (
          <div className="row">
            <div className="col-lg-8">
              <h4 style={{ fontFamily: "var(--font-marcellus)", marginBottom: "20px" }}>Sipariş Özeti</h4>

              {displayAddr && (
                <div className="p-3 mb-4" style={{ border: "1px solid #e5e5e5", background: "#fafafa" }}>
                  <small className="text-muted d-block mb-1">Teslimat Adresi</small>
                  <strong>{displayAddr.contactName}</strong> - {displayAddr.phone}
                  <br />
                  {displayAddr.addressLine1}
                  {displayAddr.city && <>, {displayAddr.city}</>}
                  {"stateOrProvinceName" in displayAddr && displayAddr.stateOrProvinceName && <> / {displayAddr.stateOrProvinceName}</>}
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
                    {summary.items.map((item) => {
                      const payLineImg = getImageUrl(item.productImage);
                      return (
                      <tr key={item.productId}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Image
                              src={payLineImg}
                              alt={item.productName}
                              width={50}
                              height={60}
                              style={{ objectFit: "cover" }}
                              unoptimized={isApiHostedMediaSrc(payLineImg)}
                              onError={(e) => { (e.target as HTMLImageElement).src = '/images/product-item-1.jpg'; }}
                            />
                            <span>{item.productName}</span>
                          </div>
                        </td>
                        <td>{item.quantity}</td>
                        <td>{item.totalString}                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              )}

              <div className="mb-3">
                <label className="form-label">E-posta (PayTR / bildirim) *</label>
                <input
                  type="email"
                  className="form-control"
                  style={{ borderRadius: 0 }}
                  value={payEmail}
                  onChange={(e) => setPayEmail(e.target.value)}
                  placeholder="ornek@eposta.com"
                  autoComplete="email"
                />
              </div>

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

              {paytrIframeToken && (
                <div className="mb-4 p-3" style={{ border: "1px solid #e5e5e5" }}>
                  <h5 style={{ fontFamily: "var(--font-marcellus)", marginBottom: "16px" }}>
                    Güvenli ödeme (PayTR)
                  </h5>
                  <p className="small text-muted mb-3">
                    Kart bilgilerinizi aşağıdaki pencerede PayTR üzerinden girersiniz.
                  </p>
                  <iframe
                    id="paytriframe"
                    title="PayTR ödeme"
                    src={paytrIframeSrc}
                    frameBorder={0}
                    scrolling="no"
                    style={{ width: "100%", minHeight: "480px", border: "none" }}
                  />
                  <Script
                    src="https://www.paytr.com/js/iframeResizer.min.js"
                    strategy="afterInteractive"
                    onLoad={() => {
                      window.setTimeout(() => {
                        const ir = (
                          window as unknown as { iFrameResize?: (opts: object, sel: string) => void }
                        ).iFrameResize;
                        try {
                          ir?.({}, "#paytriframe");
                        } catch {
                          /* ignore */
                        }
                      }, 0);
                    }}
                  />
                </div>
              )}
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
                  <small className="text-muted d-block mb-2">Ödeme yöntemi</small>
                  <div className="small text-muted mb-2">
                    PayTR ile güvenli kart ödemesi; veya kapıda ödeme (anında sipariş).
                  </div>
                </div>

                <button
                  className="btn btn-dark w-100"
                  style={{ borderRadius: 0, padding: "14px", fontSize: "14px", letterSpacing: "0.5px" }}
                  onClick={handlePayWithPaytr}
                  disabled={submitting || !!paytrIframeToken}
                >
                  {submitting && !paytrIframeToken
                    ? "Hazırlanıyor..."
                    : paytrIframeToken
                      ? "Ödeme penceresi açık"
                      : "KART İLE ÖDE (PayTR)"}
                </button>

                <button
                  className="btn btn-outline-dark w-100 mt-2"
                  style={{ borderRadius: 0, padding: "14px", fontSize: "14px", letterSpacing: "0.5px" }}
                  onClick={handleComplete}
                  disabled={submitting || !!paytrIframeToken}
                >
                  {submitting ? "İşleniyor..." : "KAPIDA ÖDEME — SİPARİŞİ ONAYLA"}
                </button>

                <button
                  className="btn btn-link text-muted w-100 mt-2 p-0 small"
                  style={{ textDecoration: "none" }}
                  type="button"
                  onClick={() => {
                    setPaytrIframeToken(null);
                    setStep("address");
                  }}
                  disabled={submitting}
                >
                  Geri dön
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
            <p className="text-muted">{isGuest ? "Siparişiniz e-posta ile bildirilecektir." : "Siparişinizin durumunu profilinizden takip edebilirsiniz."}</p>
            <div className="mt-4 d-flex justify-content-center gap-3">
              {!isGuest && (
                <Link
                  href="/profil"
                  className="btn btn-dark"
                  style={{ borderRadius: 0, padding: "12px 30px" }}
                >
                  Siparişlerim
                </Link>
              )}
              <Link
                href="/urunler"
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
