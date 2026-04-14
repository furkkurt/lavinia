"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAppSettings, putAppSettings, AppSettingItem } from "../../lib/api/appsettings";

const ORDER_CANCEL_MINUTES_KEY = "Orders.CustomerCancellationMinutes";
const WHATSAPP_KEY = "Orders.SupportWhatsAppE164";
const SALES_ENABLED_KEY = "Catalog.SalesEnabled";

export default function AdminShopSettingsPage() {
  const [allSettings, setAllSettings] = useState<AppSettingItem[]>([]);
  const [minutes, setMinutes] = useState("120");
  const [whatsapp, setWhatsapp] = useState("");
  const [salesOpen, setSalesOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const res = await getAppSettings();
      if (!res.success || !res.data) {
        setError(res.error || "Yüklenemedi");
        setLoading(false);
        return;
      }
      setAllSettings(res.data);
      const m = res.data.find((x) => x.key === ORDER_CANCEL_MINUTES_KEY);
      const w = res.data.find((x) => x.key === WHATSAPP_KEY);
      const s = res.data.find((x) => x.key === SALES_ENABLED_KEY);
      if (m?.value) setMinutes(m.value);
      if (w?.value != null) setWhatsapp(w.value);
      setSalesOpen(s?.value?.toLowerCase() !== "false");
      setLoading(false);
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const minutesNum = parseInt(minutes, 10);
    if (Number.isNaN(minutesNum) || minutesNum < 1 || minutesNum > 10080) {
      setError("İptal süresi 1 ile 10080 dakika (7 gün) arasında olmalıdır.");
      setSaving(false);
      return;
    }

    const digitsOnly = whatsapp.replace(/\D/g, "");
    if (!digitsOnly) {
      setError("WhatsApp numarası için en az bir rakam girin (ülke kodu ile, örn. 905551234567).");
      setSaving(false);
      return;
    }

    const next = allSettings.map((row) => {
      if (row.key === ORDER_CANCEL_MINUTES_KEY) {
        return { ...row, value: String(minutesNum) };
      }
      if (row.key === WHATSAPP_KEY) {
        return { ...row, value: digitsOnly };
      }
      if (row.key === SALES_ENABLED_KEY) {
        return { ...row, value: salesOpen ? "true" : "false" };
      }
      return { ...row };
    });

    const hasOrderKeys = next.some((x) => x.key === ORDER_CANCEL_MINUTES_KEY);
    if (!hasOrderKeys) {
      next.push(
        { key: ORDER_CANCEL_MINUTES_KEY, value: String(minutesNum) },
        { key: WHATSAPP_KEY, value: digitsOnly }
      );
    } else if (!next.some((x) => x.key === WHATSAPP_KEY)) {
      next.push({ key: WHATSAPP_KEY, value: digitsOnly });
    }
    if (!next.some((x) => x.key === SALES_ENABLED_KEY)) {
      next.push({ key: SALES_ENABLED_KEY, value: salesOpen ? "true" : "false" });
    }

    const res = await putAppSettings(next);
    setSaving(false);
    if (!res.success) {
      setError(res.error || "Kaydedilemedi");
      return;
    }
    setAllSettings(next);
    setWhatsapp(digitsOnly);
    setMessage("Ayarlar kaydedildi. Değişikliklerin uygulanması için API yapılandırması yenilenmiş olmalıdır.");
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  return (
    <div>
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/admin/statistics">Yönetim</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Mağaza ayarları
          </li>
        </ol>
      </nav>

      <h1 className="mb-4">Mağaza ayarları</h1>
      <p className="text-muted">
        Sipariş iptali süresi, WhatsApp ve çevrimiçi satış anahtarı. Yeni anahtarlar ilk kayıtta otomatik eklenir.
      </p>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="alert alert-success" role="alert">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="card" style={{ maxWidth: 520 }}>
        <div className="card-body">
          <div className="mb-3 form-check form-switch">
            <input
              id="salesOpen"
              type="checkbox"
              role="switch"
              className="form-check-input"
              checked={salesOpen}
              onChange={(e) => setSalesOpen(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="salesOpen">
              Satışa açık (kapalıyken müşteri ödeme adımına gidemez; sepette bilgi gösterilir)
            </label>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="cancelMinutes">
              İptal süresi (dakika)
            </label>
            <input
              id="cancelMinutes"
              type="number"
              min={1}
              max={10080}
              className="form-control"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              required
            />
            <div className="form-text">Sipariş oluşturulduktan sonra bu süre içinde müşteri panelinden iptal edilebilir (kargoya verilmeden önce).</div>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="whatsapp">
              WhatsApp (ülke kodu + numara, sadece rakam)
            </label>
            <input
              id="whatsapp"
              type="text"
              className="form-control"
              placeholder="905551234567"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
            />
            <div className="form-text">Süre dolduğunda veya iptal mümkün değilken müşteriye gösterilen bağlantı için kullanılır.</div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
