"use client";

import { useState, useEffect } from "react";
import { runLegacyImport, LegacyImportResult } from "../../lib/api/legacyImport";
import {
  fetchHepsijetDevStatus,
  hepsijetDevPost,
  postKestrelHepsiJetPodTest,
  type HepsijetDevStatus,
} from "../../lib/api/hepsijetDev";
import { getPublicShop, LAVINIA_CHECKOUT_TEST_UI_KEY } from "../../lib/api/shop";

export default function AdminDevPage() {
  const [hepsijetStatus, setHepsijetStatus] = useState<HepsijetDevStatus | null>(null);
  const [hepsijetLoading, setHepsijetLoading] = useState(false);
  const [hepsijetError, setHepsijetError] = useState<string | null>(null);
  const [hepsijetResult, setHepsijetResult] = useState<Record<string, unknown> | null>(null);
  const [hepsijetBarcode, setHepsijetBarcode] = useState("");
  const [hepsijetProductGtin, setHepsijetProductGtin] = useState("");

  const [kestrelPodLoading, setKestrelPodLoading] = useState(false);
  const [kestrelPodError, setKestrelPodError] = useState<string | null>(null);
  const [kestrelPodResult, setKestrelPodResult] = useState<Record<string, unknown> | null>(null);
  const [kestrelRecipientAddressId, setKestrelRecipientAddressId] = useState("");

  useEffect(() => {
    let c = true;
    fetchHepsijetDevStatus()
      .then((s) => {
        if (!c) return;
        if (s && "ok" in s && s.ok === false && "error" in s) {
          setHepsijetError(s.error);
          return;
        }
        if (s && "devApiEnabled" in s) setHepsijetStatus(s);
      })
      .catch(() => {
        if (c) setHepsijetStatus({ devApiEnabled: false, configured: false, baseUrl: "" });
      });
    return () => {
      c = false;
    };
  }, []);

  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<LegacyImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [replaceCategories, setReplaceCategories] = useState(true);

  const [checkoutTestUi, setCheckoutTestUi] = useState(false);
  const [apiTestCheckoutEnabled, setApiTestCheckoutEnabled] = useState(false);

  useEffect(() => {
    try {
      setCheckoutTestUi(typeof window !== "undefined" && localStorage.getItem(LAVINIA_CHECKOUT_TEST_UI_KEY) === "1");
    } catch {
      setCheckoutTestUi(false);
    }
  }, []);

  useEffect(() => {
    getPublicShop()
      .then((s) => setApiTestCheckoutEnabled(!!s.testCheckoutEnabled))
      .catch(() => setApiTestCheckoutEnabled(false));
  }, []);

  const onToggleCheckoutTestUi = (on: boolean) => {
    try {
      if (on) {
        localStorage.setItem(LAVINIA_CHECKOUT_TEST_UI_KEY, "1");
      } else {
        localStorage.removeItem(LAVINIA_CHECKOUT_TEST_UI_KEY);
      }
    } catch {
      /* ignore */
    }
    setCheckoutTestUi(on);
  };

  const runHepsijet = async (action: "token" | "track" | "createTestShipment" | "createTestShipmentWithGtin") => {
    setHepsijetLoading(true);
    setHepsijetError(null);
    setHepsijetResult(null);
    setKestrelPodResult(null);
    setKestrelPodError(null);
    const body: { action: string; barcodes?: string[]; productGtin?: string } = { action };
    if (action === "track") {
      const b = hepsijetBarcode.trim();
      if (!b) {
        setHepsijetLoading(false);
        setHepsijetError("Takip için barkod girin.");
        return;
      }
      body.barcodes = b.split(/[\s,;]+/).filter(Boolean);
    }
    if (action === "createTestShipmentWithGtin") {
      const g = hepsijetProductGtin.trim();
      if (!g) {
        setHepsijetLoading(false);
        setHepsijetError("Ürün barkodu / GTIN girin (HepsiJET test talebi).");
        return;
      }
      body.action = "createTestShipment";
      body.productGtin = g;
    }
    const res = await hepsijetDevPost(body);
    setHepsijetLoading(false);
    if (!("fetchOk" in res) || !res.fetchOk) {
      setHepsijetError(
        "fetchError" in res && res.fetchError != null && res.fetchError !== ""
          ? res.fetchError
          : "İstek başarısız"
      );
      return;
    }
    setHepsijetResult({
      action: action === "createTestShipmentWithGtin" ? "createTestShipmentWithGtin" : action,
      httpStatus: res.httpStatus,
      hepsijet: res.hepsijet,
      tokenPreview: res.tokenPreview,
      tokenMetaPreview: res.tokenMetaPreview,
      hepsijetTopLevelOk: res.ok,
    } as Record<string, unknown>);
  };

  const runKestrelPodTest = async () => {
    setKestrelPodLoading(true);
    setKestrelPodError(null);
    setKestrelPodResult(null);
    setHepsijetResult(null);
    setHepsijetError(null);
    const id = kestrelRecipientAddressId.trim();
    const body: { recipientCompanyAddressId?: string } = {};
    if (id) body.recipientCompanyAddressId = id;
    const res = await postKestrelHepsiJetPodTest(body);
    setKestrelPodLoading(false);
    if (!res.fetchOk) {
      setKestrelPodError(res.fetchError || `HTTP ${res.httpStatus}`);
    }
    setKestrelPodResult({
      source: "kestrel",
      endpoint: "/api/admin/hepsijet/pod-test",
      httpStatus: res.httpStatus,
      body: res.json,
    } as Record<string, unknown>);
  };

  const handleLegacyImport = async () => {
    setImportLoading(true);
    setImportError(null);
    setImportResult(null);
    const res = await runLegacyImport({ replaceCategories });
    setImportLoading(false);
    if (res.success && res.data) {
      setImportResult(res.data);
    } else {
      setImportError(res.error || "İçe aktarma başarısız");
    }
  };

  return (
    <div>
      <h1 className="mb-4 display-5 fw-bold">Dev</h1>
      <p className="text-muted mb-4">Geliştirici / veri aktarım araçları</p>

      <div className="card mb-4" style={{ maxWidth: 720 }}>
        <div className="card-body">
          <h5 className="card-title">Sipariş test modu (stok / ödeme yok)</h5>
          <p className="text-muted small mb-2">
            Açıkken, <strong>bu tarayıcıda</strong> <code>/odeme</code> sayfasında &quot;Test siparişi&quot; ile sipariş
            oluşturabilirsiniz: <strong>stok düşmez</strong>, <strong>PayTR veya kapıda ödeme gerekmez</strong>. Yine de
            sepetten gerçek bir checkout akışı ve sipariş kaydı çalışır; sipariş notu{" "}
            <code>[TEST]</code> ile öneklenir, ödeme yöntemi <code>TestCheckout</code> olur.
          </p>
          <p className="small mb-2">
            API:{" "}
            <span className={apiTestCheckoutEnabled ? "text-success" : "text-danger"}>
              {apiTestCheckoutEnabled
                ? "Test checkout açık (Checkout:TestCheckoutEnabled)"
                : "Test checkout kapalı — Kestrel’de Checkout:TestCheckoutEnabled açın"}
            </span>
            <span className="text-muted"> (ör. </span>
            <code>appsettings.Development.json</code> veya ortam <code>Checkout__TestCheckoutEnabled=true</code>
            <span className="text-muted">)</span>
          </p>
          <div className="form-check mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="checkoutTestUi"
              checked={checkoutTestUi}
              onChange={(e) => onToggleCheckoutTestUi(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="checkoutTestUi">
              <strong>Ödeme sayfasında test butonunu göster</strong> (localStorage: {LAVINIA_CHECKOUT_TEST_UI_KEY})
            </label>
          </div>
          <p className="text-muted small mt-2 mb-0">
            Üretimde <code>TestCheckoutEnabled</code> mutlaka <code>false</code> kalmalı; aksi halde stoksuz test
            siparişi açılır.
          </p>
        </div>
      </div>

      <div className="card mb-4" style={{ maxWidth: 720 }}>
        <div className="card-body">
          <h5 className="card-title">HepsiJET (test entegrasyonu)</h5>
          <p className="text-muted small mb-2">
            Sunucu, HepsiJET <code>integration-apitest</code> / üretim adresine sadece <code>HEPSIJET_*</code> ortam
            değişkenleriyle bağlanır. Aşağıdaki düğmeler <code>HEPSIJET_DEV_API_ENABLED=1</code> iken
            <code> /api/hepsijet/test</code> üzerinden token alma, takip sorgulama ve örnek RETAIL gönderisi
            denemesi için kullanılır. HepsiJET ürün barkodu istiyorsa ikinci RETAIL düğmesini ve GTIN alanını kullanın.
          </p>
          {hepsijetStatus && (
            <p className="small mb-3">
              <span className={hepsijetStatus.devApiEnabled ? "text-success" : "text-warning"}>
                API: {hepsijetStatus.devApiEnabled ? "açık" : "kapalı"}{" "}
              </span>
              <span className="text-muted">|</span>{" "}
              <span className={hepsijetStatus.configured ? "text-success" : "text-danger"}>
                Yapılandırma: {hepsijetStatus.configured ? "tam" : "eksik"}
              </span>
              {hepsijetStatus.configured && hepsijetStatus.username && (
                <>
                  {" "}
                  <span className="text-muted">|</span> Kullanıcı:{" "}
                  <code className="small">{hepsijetStatus.username}</code>
                </>
              )}
            </p>
          )}
          {!hepsijetStatus?.devApiEnabled && (
            <div className="alert alert-warning small py-2 mb-3">
              Test çağrıları için <code>.env.local</code> içine <code>HEPSIJET_DEV_API_ENABLED=1</code> ve
              HepsiJET e-postanızdaki tüm gerekli <code>HEPSIJET_*</code> değişkenlerini ekleyin. Örnek
              isimler <code>lavinia/.env.example</code> dosyasındadır. Sunucuyu yeniden başlatın.
            </div>
          )}
          <div className="d-flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => void runHepsijet("token")}
              disabled={hepsijetLoading || !hepsijetStatus?.devApiEnabled}
            >
              {hepsijetLoading ? "…" : "Token (getToken)"}
            </button>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => void runHepsijet("track")}
              disabled={hepsijetLoading || !hepsijetStatus?.devApiEnabled}
            >
              {hepsijetLoading ? "…" : "Takip sorgula"}
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => void runHepsijet("createTestShipment")}
              disabled={hepsijetLoading || !hepsijetStatus?.devApiEnabled}
            >
              {hepsijetLoading ? "…" : "Test RETAIL gönderisi oluştur"}
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => void runHepsijet("createTestShipmentWithGtin")}
              disabled={hepsijetLoading || !hepsijetStatus?.devApiEnabled}
            >
              {hepsijetLoading ? "…" : "Test RETAIL + ürün barkodu (GTIN)"}
            </button>
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted" htmlFor="hepsijet-product-gtin">
              Ürün barkodu / GTIN (RETAIL + barkod testi — örn. EAN-13)
            </label>
            <input
              id="hepsijet-product-gtin"
              className="form-control form-control-sm"
              placeholder="Örn: 8680000000001"
              value={hepsijetProductGtin}
              onChange={(e) => setHepsijetProductGtin(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label small text-muted" htmlFor="hepsijet-barcodes">
              Takip barkodları (virgül, boşluk veya noktalı virgül ile)
            </label>
            <input
              id="hepsijet-barcodes"
              className="form-control form-control-sm"
              placeholder="Örn: LAVİNİAB1234567"
              value={hepsijetBarcode}
              onChange={(e) => setHepsijetBarcode(e.target.value)}
            />
          </div>

          <hr className="my-3" />
          <h6 className="fw-semibold mb-2">POD testi (Kestrel / SimplCommerce API)</h6>
          <p className="text-muted small mb-2">
            Yukarıdaki düğmeler Next.js <code>/api/hepsijet/test</code> ve <code>HEPSIJET_*</code> kullanır. Bu bölüm
            doğrudan Kestrel&apos;deki <code>POST /api/admin/hepsijet/pod-test</code> çağrısını yapar; sunucuda API
            konteynerının <code>HepsiJet__*</code> (kök <code>.env</code>) değerleri kullanılır. Yönetim hesabıyla
            giriş yapılmış olmalıdır (Bearer token).
          </p>
          <div className="mb-2">
            <label className="form-label small text-muted" htmlFor="kestrel-pod-recipient-id">
              Alıcı <code>companyAddressId</code> (opsiyonel — boşsa API&apos;deki{" "}
              <code>HepsiJet__PodRecipientCompanyAddressId</code> kullanılır)
            </label>
            <input
              id="kestrel-pod-recipient-id"
              className="form-control form-control-sm"
              placeholder="HepsiJET RETAIL/POD dokümanındaki test adres ID"
              value={kestrelRecipientAddressId}
              onChange={(e) => setKestrelRecipientAddressId(e.target.value)}
            />
          </div>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => void runKestrelPodTest()}
              disabled={kestrelPodLoading}
            >
              {kestrelPodLoading ? "…" : "POD testi (Kestrel API)"}
            </button>
          </div>
          {hepsijetError && (
            <div className="alert alert-danger py-2 small mb-2" role="alert">
              {hepsijetError}
            </div>
          )}
          {kestrelPodError && (
            <div className="alert alert-danger py-2 small mb-2" role="alert">
              {kestrelPodError}
            </div>
          )}
          {kestrelPodResult && (
            <pre
              className="small p-2 rounded border bg-white mb-2"
              style={{ maxHeight: 360, overflow: "auto" }}
            >
              {JSON.stringify(kestrelPodResult, null, 2)}
            </pre>
          )}
          {hepsijetResult && (
            <pre
              className="small p-2 rounded border bg-light mb-0"
              style={{ maxHeight: 360, overflow: "auto" }}
            >
              {JSON.stringify(hepsijetResult, null, 2)}
            </pre>
          )}
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-body">
          <h5 className="card-title">Legacy veri aktarımı</h5>
          <p className="text-muted small mb-3">
            legacyDBs klasöründeki Ticimax Excel dosyalarından ürün, marka, kategori ve üye verilerini içe aktarır.
            Sadece <strong>BREADCRUMBKAT</strong> sütunundaki temiz kategori verileri kullanılır (Üst&gt;Giyim&gt;Elbise vb.).
            Docker kullanıyorsanız legacyDBs klasörünün mount edildiğinden emin olun.
          </p>
          <div className="alert alert-warning py-2 mb-3">
            <strong>Mağaza menüsünde junk görüyorsanız:</strong> Aşağıdaki &quot;Kategorileri temizle&quot; kutusu{" "}
            <strong>işaretli</strong> olmalı. İşaretleyip tekrar import edin.
          </div>
          <div className="alert alert-info py-2 small mb-3" role="note">
            <strong>504:</strong> Bu istek nginx üzerinden <strong>doğrudan Kestrel :5000</strong> gitmeli (Next :3000
            değil). <code>updateServer.md</code> içindeki <code>location ^~ /api/legacy-import</code> örneği{" "}
            <code>proxy_pass http://127.0.0.1:5000</code> kullanır; sırayı genel <code>location /</code> öncesine
            koyun, ardından <code>{`sudo nginx -t && sudo systemctl reload nginx`}</code>. Ürün adı kırpması C# tarafında;
            504 ağ zaman aşımıdır.
          </div>
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="replaceCategoriesDev"
              checked={replaceCategories}
              onChange={(e) => setReplaceCategories(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="replaceCategoriesDev">
              <strong>Kategorileri temizle ve yeniden oluştur</strong> — Tüm mevcut kategorileri siler, sadece
              BREADCRUMBKAT&apos;tan temiz veri alır (Üst Giyim, Alt Giyim, Dış Giyim, Aksesuar, Diğer)
            </label>
          </div>
          <button className="btn btn-outline-dark" onClick={handleLegacyImport} disabled={importLoading}>
            {importLoading ? "İçe aktarılıyor..." : "Legacy Verileri İçe Aktar"}
          </button>
          {importError && (
            <div className="alert alert-danger mt-3 mb-0 py-2" role="alert">
              {importError}
            </div>
          )}
          {importResult && (
            <div className="alert alert-success mt-3 mb-0 py-2" role="alert">
              İçe aktarma tamamlandı: Marka: {importResult.brandsImported ?? 0}, Kategori:{" "}
              {importResult.categoriesImported ?? 0}, Ürün: {importResult.productsImported ?? 0}, Üye:{" "}
              {importResult.usersImported ?? 0}
              {importResult.warnings && importResult.warnings.length > 0 && (
                <div className="mt-2 small text-warning">Uyarılar: {importResult.warnings.join("; ")}</div>
              )}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 small text-danger">Hatalar: {importResult.errors.join("; ")}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
