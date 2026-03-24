"use client";

import { useState } from "react";
import { runLegacyImport, LegacyImportResult } from "../../lib/api/legacyImport";

export default function AdminDevPage() {
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<LegacyImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [replaceCategories, setReplaceCategories] = useState(true);

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
