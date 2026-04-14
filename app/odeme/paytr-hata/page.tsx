"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SvgSprite from "../../components/SvgSprite";

function PaytrHataContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason")?.trim() ?? "";

  return (
    <div className="mx-auto" style={{ maxWidth: "560px" }}>
      <h3 style={{ fontFamily: "var(--font-marcellus)" }}>Ödeme tamamlanamadı</h3>
      <p className="text-muted mt-3">
        Ödeme sırasında bir sorun oluştu veya işlem iptal edildi. Kart bilgilerinizi kontrol ederek tekrar
        deneyebilir veya farklı bir ödeme yöntemi seçebilirsiniz.
      </p>
      {reason ? (
        <div
          className="mt-4 p-3 small"
          style={{ border: "1px solid #e5e5e5", background: "#fafafa", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          role="status"
        >
          <strong className="d-block text-dark mb-1">PayTR bilgisi</strong>
          {reason}
        </div>
      ) : null}
      {reason && /entegrasyon|teknik/i.test(reason) ? (
        <div className="mt-3 p-3 small text-muted" style={{ border: "1px dashed #ccc", background: "#fff" }}>
          <strong className="d-block text-dark mb-1">Mağaza tarafında kontrol</strong>
          PayTR panelinde test/canlı mod, mağaza anahtarları ve bildirim (callback) URL’sinin doğru olduğundan emin olun.
          PayTR teşhisi sunucuda varsayılan açıktır; günlükler:{" "}
          <code style={{ fontSize: "0.85em" }}>pm2 logs lavinia | grep paytr-debug</code>.
          Kapatmak için <code style={{ fontSize: "0.85em" }}>PAYTR_DEBUG_ON=0</code> kullanın.
          Kart öncesi <code>/api/paytr-token</code> isteği başarısızsa tarayıcıda JSON hata mesajı görünür; ayrıntılar için sunucu{" "}
          <code>[paytr-debug]</code> loglarına bakın (üretimde <code>PAYTR_DEBUG_ON=0</code>).
        </div>
      ) : null}
      <div className="mt-4 d-flex flex-wrap gap-2">
        <Link href="/odeme" className="btn btn-dark" style={{ borderRadius: 0 }}>
          Ödemeye dön
        </Link>
        <Link href="/sepet" className="btn btn-outline-dark" style={{ borderRadius: 0 }}>
          Sepete git
        </Link>
      </div>
    </div>
  );
}

export default function PaytrHataPage() {
  return (
    <>
      <SvgSprite />
      <Navbar />
      <div className="container" style={{ paddingTop: "140px", paddingBottom: "80px", minHeight: "70vh" }}>
        <Suspense
          fallback={
            <div className="mx-auto text-muted" style={{ maxWidth: "560px" }}>
              Yükleniyor…
            </div>
          }
        >
          <PaytrHataContent />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
