import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SvgSprite from "../../components/SvgSprite";

export default function PaytrBasariliPage() {
  return (
    <>
      <SvgSprite />
      <Navbar />
      <div className="container" style={{ paddingTop: "140px", paddingBottom: "80px", minHeight: "70vh" }}>
        <div className="mx-auto" style={{ maxWidth: "560px" }}>
          <h3 style={{ fontFamily: "var(--font-marcellus)" }}>Ödeme tamamlandı</h3>
          <p className="text-muted mt-3">
            Ödemeniz PayTR üzerinden alındı. Siparişinizin kesin onayı sunucu bildirimiyle oluşturulur; kısa süre
            içinde e-posta veya hesabınızdaki siparişler bölümünden takip edebilirsiniz.
          </p>
          <p className="small text-muted">
            Bu sayfa yalnızca bilgilendirme içindir; sipariş durumu için PayTR bildirim URL’sine güvenin.
          </p>
          <div className="mt-4 d-flex flex-wrap gap-2">
            <Link href="/profil" className="btn btn-dark" style={{ borderRadius: 0 }}>
              Siparişlerim
            </Link>
            <Link href="/urunler" className="btn btn-outline-dark" style={{ borderRadius: 0 }}>
              Alışverişe devam
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
