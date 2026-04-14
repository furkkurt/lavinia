"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SvgSprite from "../components/SvgSprite";
import { getCart, updateCartQuantity, removeFromCart, Cart, isLoggedIn as checkLogin } from "../lib/api/cart";
import { getImageUrl, isApiHostedMediaSrc } from "../lib/api/config";
import { getPublicShop } from "../lib/api/shop";

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null); // cart item id
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [salesEnabled, setSalesEnabled] = useState(true);

  useEffect(() => {
    const preloader = document.querySelector(".preloader");
    if (preloader) preloader.classList.add("loaded");
    getPublicShop().then((s) => setSalesEnabled(s.salesEnabled)).catch(() => setSalesEnabled(true));
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    setFetchError(null);
    const result = await getCart();
    if (result.requiresAuth) {
      setRequiresAuth(true);
      setCart(null);
    } else if (result.error) {
      setFetchError(result.error);
      setCart(null);
    } else {
      setCart(result.cart);
      setRequiresAuth(false);
    }
    setLoading(false);
  };

  const handleQuantityChange = async (cartItemId: number, productId: number, newQty: number) => {
    if (newQty < 1) return;
    setUpdating(cartItemId);
    await updateCartQuantity(cartItemId, newQty, productId);
    await fetchCart();
    setUpdating(null);
  };

  const handleRemove = async (cartItemId: number) => {
    setUpdating(cartItemId);
    await removeFromCart(cartItemId);
    await fetchCart();
    setUpdating(null);
  };

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <>
      <SvgSprite />
      <Navbar />

      <div className="container" style={{ paddingTop: "140px", paddingBottom: "60px", minHeight: "80vh" }}>
        <h2 className="mb-4" style={{ fontFamily: "var(--font-marcellus)", fontSize: "28px" }}>
          Sepetim
        </h2>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
          </div>
        ) : requiresAuth ? (
          <div className="text-center py-5">
            <div style={{ fontSize: "64px", color: "#ccc", marginBottom: "20px" }}>🔒</div>
            <h4>Sepetinizi görüntülemek için giriş yapın</h4>
            <p className="text-muted">Sepete ürün eklemek ve siparişlerinizi takip etmek için hesabınıza giriş yapmanız gerekiyor.</p>
            <Link href="/" className="btn btn-dark mt-3" style={{ borderRadius: "0", padding: "12px 30px" }}>
              Ana Sayfaya Dön
            </Link>
          </div>
        ) : fetchError ? (
          <div className="text-center py-5">
            <div style={{ fontSize: "64px", color: "#ccc", marginBottom: "20px" }}>⚠️</div>
            <h4>Sepet yüklenirken bir hata oluştu</h4>
            <p className="text-muted">{fetchError}</p>
            <button onClick={fetchCart} className="btn btn-dark mt-3" style={{ borderRadius: "0", padding: "12px 30px" }}>
              Tekrar Dene
            </button>
          </div>
        ) : isEmpty ? (
          <div className="text-center py-5">
            <div style={{ fontSize: "64px", color: "#ccc", marginBottom: "20px" }}>🛒</div>
            <h4>Sepetiniz boş</h4>
            <p className="text-muted">Alışverişe başlamak için ürünlerimize göz atın.</p>
            <Link href="/urunler" className="btn btn-dark mt-3" style={{ borderRadius: "0", padding: "12px 30px" }}>
              Alışverişe Başla
            </Link>
          </div>
        ) : (
          <div className="row">
            <div className="col-lg-8">
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr style={{ borderBottom: "2px solid #000" }}>
                      <th style={{ fontWeight: 600 }}>Ürün</th>
                      <th style={{ fontWeight: 600, width: "120px" }}>Fiyat</th>
                      <th style={{ fontWeight: 600, width: "150px" }}>Adet</th>
                      <th style={{ fontWeight: 600, width: "120px" }}>Toplam</th>
                      <th style={{ width: "50px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart!.items.map((item) => {
                      const lineImg = getImageUrl(item.productImage);
                      return (
                      <tr key={item.id} style={{ opacity: updating === item.id ? 0.5 : 1 }}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <Link href={`/urunler/${item.productId}`}>
                              <Image
                                src={lineImg}
                                alt={item.productName}
                                width={80}
                                height={100}
                                style={{ objectFit: "cover" }}
                                unoptimized={isApiHostedMediaSrc(lineImg)}
                                onError={(e) => { (e.target as HTMLImageElement).src = '/images/product-item-1.jpg'; }}
                              />
                            </Link>
                            <div>
                              <Link
                                href={`/urunler/${item.productId}`}
                                style={{ color: "#000", textDecoration: "none", fontWeight: 500 }}
                              >
                                {item.productName}
                              </Link>
                              {(item.selectedSize || item.selectedColor) && (
                                <div className="small text-muted mt-1">
                                  {item.selectedSize ? <>Beden: {item.selectedSize}</> : null}
                                  {item.selectedSize && item.selectedColor ? " · " : null}
                                  {item.selectedColor ? <>Renk: {item.selectedColor}</> : null}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{item.productPriceString}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <button
                              className="btn btn-sm btn-outline-dark"
                              style={{ width: "32px", height: "32px", padding: 0, borderRadius: 0 }}
                              onClick={() => handleQuantityChange(item.id, item.productId, item.quantity - 1)}
                              disabled={updating === item.id || item.quantity <= 1}
                            >
                              −
                            </button>
                            <span style={{ minWidth: "30px", textAlign: "center" }}>{item.quantity}</span>
                            <button
                              className="btn btn-sm btn-outline-dark"
                              style={{ width: "32px", height: "32px", padding: 0, borderRadius: 0 }}
                              onClick={() => handleQuantityChange(item.id, item.productId, item.quantity + 1)}
                              disabled={updating === item.id}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.totalString}</td>
                        <td>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleRemove(item.id)}
                            disabled={updating === item.id}
                            style={{ color: "#999" }}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="col-lg-4">
              <div style={{ border: "1px solid #e5e5e5", padding: "24px" }}>
                <h5 style={{ fontFamily: "var(--font-marcellus)", borderBottom: "1px solid #e5e5e5", paddingBottom: "16px" }}>
                  Sipariş Özeti
                </h5>
                <div className="d-flex justify-content-between mb-2">
                  <span>Ara Toplam</span>
                  <span>{cart!.subTotalString}</span>
                </div>
                {cart!.discount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>İndirim</span>
                    <span>-{cart!.discountString}</span>
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
                  <span>{cart!.subTotalWithDiscountString}</span>
                </div>
                {salesEnabled ? (
                  <Link
                    href="/odeme"
                    className="btn btn-dark w-100 mt-4"
                    style={{ borderRadius: 0, padding: "14px", fontSize: "15px", letterSpacing: "1px" }}
                  >
                    SİPARİŞİ TAMAMLA
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary w-100 mt-4"
                    disabled
                    style={{ borderRadius: 0, padding: "14px", fontSize: "15px", letterSpacing: "1px" }}
                  >
                    Geçici olarak satışa kapalıyız
                  </button>
                )}
                <Link
                  href="/urunler"
                  className="btn btn-outline-dark w-100 mt-2"
                  style={{ borderRadius: 0, padding: "12px", fontSize: "14px" }}
                >
                  Alışverişe Devam Et
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
