"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SvgSprite from "../components/SvgSprite";
import { getUserOrders, getUserOrder, OrderListItem, OrderDetail } from "../lib/api/orders";
import { getAuthToken } from "../lib/api/config";

export default function IadeDegisimPage() {
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const preloader = document.querySelector(".preloader");
    if (preloader) preloader.classList.add("loaded");
  }, []);

  useEffect(() => {
    (async () => {
      const token = getAuthToken();
      setAuthed(!!token);
      if (!token) {
        setOrders([]);
        setLoading(false);
        return;
      }
      const list = await getUserOrders();
      // İptal edilmiş siparişlerde iade/değişim akışı gösterme (OrderStatus.Canceled = 80)
      setOrders(list.filter((o) => o.orderStatus !== 80));
      setLoading(false);
    })();
  }, []);

  const toggle = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetailLoading(true);
    const d = await getUserOrder(id);
    setDetail(d);
    setDetailLoading(false);
  };

  const waHref = (digits: string, text: string) =>
    `https://wa.me/${digits.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

  return (
    <>
      <SvgSprite />
      <Navbar />
      <main className="container" style={{ paddingTop: "120px", paddingBottom: "80px", minHeight: "60vh" }}>
        <h1 className="mb-3" style={{ fontFamily: "var(--font-marcellus)", fontSize: "clamp(1.75rem, 4vw, 2.25rem)" }}>
          İade ve değişim
        </h1>
        <p className="text-muted mb-4" style={{ maxWidth: "640px", lineHeight: 1.7 }}>
          İade veya değişim talebiniz için siparişinizi seçin. Size yönlendirme ve WhatsApp ile hızlı iletişim seçenekleri sunulur.
        </p>

        {!getAuthToken() && !loading ? (
          <div className="border p-4" style={{ maxWidth: "480px" }}>
            <p className="mb-3">Siparişlerinizi görmek için giriş yapın.</p>
            <Link href="/" className="btn btn-dark rounded-0">
              Ana sayfa
            </Link>
          </div>
        ) : loading ? (
          <div className="py-5 text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <p className="text-muted">
            İade veya değişim için uygun siparişiniz yok (iptal edilmiş siparişler listelenmez).
          </p>
        ) : (
          <ul className="list-unstyled m-0" style={{ maxWidth: "720px" }}>
            {orders.map((o) => (
              <li key={o.id} className="mb-3 border-bottom pb-3">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                  <div>
                    <strong>Sipariş #{o.id}</strong>
                    <div className="small text-muted">
                      {new Date(o.createdOn).toLocaleDateString("tr-TR")} · {o.orderStatusDisplay ?? o.orderStatusString} ·{" "}
                      {o.orderTotalString}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm rounded-0"
                    onClick={() => toggle(o.id)}
                  >
                    {expandedId === o.id ? "Kapat" : "İade / değişim talebi"}
                  </button>
                </div>
                {expandedId === o.id && (
                  <div className="mt-3 p-3" style={{ background: "#f9f9f9" }}>
                    {detailLoading ? (
                      <span className="text-muted small">Yükleniyor…</span>
                    ) : detail ? (
                      <>
                        <p className="small mb-2">
                          Talebiniz için sipariş numaranızı iletin: <strong>#{detail.id}</strong>
                        </p>
                        {detail.supportWhatsAppDigits ? (
                          <a
                            href={waHref(
                              detail.supportWhatsAppDigits,
                              `Merhaba, sipariş #${detail.id} için iade/değişim talep ediyorum.`
                            )}
                            className="btn btn-success rounded-0"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            WhatsApp ile devam et
                          </a>
                        ) : (
                          <p className="small text-muted mb-0">
                            WhatsApp numarası yapılandırılmamış. Lütfen{" "}
                            <a href="mailto:info@boutiquelavinia.com">info@boutiquelavinia.com</a> adresinden yazın.
                          </p>
                        )}
                        <div className="mt-2">
                          <Link href="/profil" className="small">
                            Profilimde sipariş detayına git
                          </Link>
                        </div>
                      </>
                    ) : (
                      <span className="text-danger small">Sipariş yüklenemedi.</span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
