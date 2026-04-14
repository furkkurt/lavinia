"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getApiBase, adminAuthHeaders, mediaUrl } from "@/app/lib/apiBase";
import { CollectionProductPicker, type SelectedCollectionProduct } from "./CollectionProductPicker";

export type CollectionFormState = {
  id?: number;
  name: string;
  slug: string;
  description: string;
  isPublished: boolean;
  displayOrder: number;
  homepageSlot: string;
  productIdsText: string;
  thumbnailFileName: string;
  thumbnailImageUrl: string | null;
};

function parseProductIds(text: string): number[] {
  return text
    .split(/[\s,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function fileNameFromUploadResponse(url: string): string {
  try {
    const u = url.startsWith("http") ? new URL(url) : new URL(url, "http://x");
    const seg = u.pathname.split("/").filter(Boolean).pop() ?? "";
    return decodeURIComponent(seg);
  } catch {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1] ?? "");
  }
}

function initialSelectedFromText(text: string): SelectedCollectionProduct[] {
  return parseProductIds(text).map((id) => ({ id, name: `Ürün #${id}` }));
}

export function CollectionForm({ initial }: { initial: CollectionFormState }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [selectedProducts, setSelectedProducts] = useState<SelectedCollectionProduct[]>(() =>
    initialSelectedFromText(initial.productIdsText)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function uploadThumbnail(file: File) {
    const base = getApiBase();
    const fd = new FormData();
    fd.append("file", file);
    const headers: HeadersInit = {};
    const t =
      typeof window !== "undefined"
        ? localStorage.getItem("authToken") || localStorage.getItem("access_token")
        : null;
    if (t) headers.Authorization = `Bearer ${t}`;
    const res = await fetch(`${base}/api/common/upload`, { method: "POST", body: fd, headers });
    if (!res.ok) {
      setError("Kapak yüklenemedi (giriş gerekli olabilir).");
      return;
    }
    const raw = await res.text();
    let url: string;
    try {
      const parsed = JSON.parse(raw) as unknown;
      url = typeof parsed === "string" ? parsed : String(parsed);
    } catch {
      url = raw.replace(/^"|"$/g, "").trim();
    }
    if (typeof url !== "string") url = String(url);
    const name = fileNameFromUploadResponse(url);
    setForm((f) => ({
      ...f,
      thumbnailFileName: name,
      thumbnailImageUrl: url.startsWith("http") ? url : mediaUrl(url),
    }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const base = getApiBase();
    const slotStr = form.homepageSlot.trim();
    const homepageSlot =
      slotStr === "" ? null : Number(slotStr) >= 1 && Number(slotStr) <= 3 ? Number(slotStr) : null;
    if (slotStr !== "" && homepageSlot === null) {
      setError("Ana sayfa sırası boş bırakın veya 1, 2 veya 3 girin.");
      setSaving(false);
      return;
    }
    const body = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description,
      isPublished: form.isPublished,
      displayOrder: form.displayOrder,
      homepageSlot,
      productIds: selectedProducts.map((p) => p.id),
      thumbnailFileName: form.thumbnailFileName.trim() || null,
    };
    const url =
      form.id != null
        ? `${base}/api/product-collections/${form.id}`
        : `${base}/api/product-collections`;
    const res = await fetch(url, {
      method: form.id != null ? "PUT" : "POST",
      headers: adminAuthHeaders(),
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.status === 401 || res.status === 403) {
      setError("Yetki yok: admin olarak giriş yapın (access_token).");
      return;
    }
    if (!res.ok) {
      let msg = "Kayıt başarısız.";
      try {
        const j = await res.json();
        if (j.error) msg = j.error;
      } catch {
        /* ignore */
      }
      setError(msg);
      return;
    }
    if (form.id == null) {
      const j = (await res.json().catch(() => null)) as { id?: number } | null;
      if (j?.id) router.push(`/admin/collections/${j.id}`);
      else router.push("/admin/collections");
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 720, display: "grid", gap: "0.75rem" }}>
      {error ? (
        <p role="alert" style={{ color: "#a00", margin: 0 }}>
          {error}
        </p>
      ) : null}
      <label>
        Ad
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={{ display: "block", width: "100%", marginTop: 4 }}
        />
      </label>
      <label>
        Slug
        <input
          required
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          style={{ display: "block", width: "100%", marginTop: 4 }}
        />
      </label>
      <label>
        Açıklama
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          style={{ display: "block", width: "100%", marginTop: 4 }}
        />
      </label>
      <label>
        Liste sırası
        <input
          type="number"
          value={form.displayOrder}
          onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) || 0 })}
          style={{ display: "block", width: "100%", marginTop: 4 }}
        />
      </label>
      <label>
        Ana sayfa kutusu (1–3, boş = yok)
        <input
          value={form.homepageSlot}
          onChange={(e) => setForm({ ...form, homepageSlot: e.target.value })}
          placeholder="örn. 1"
          style={{ display: "block", width: "100%", marginTop: 4 }}
        />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={form.isPublished}
          onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
        />
        Yayında
      </label>
      <div>
        <span className="fw-semibold d-block mb-2">Koleksiyon ürünleri</span>
        <CollectionProductPicker selected={selectedProducts} onChange={setSelectedProducts} />
        <details className="mt-2">
          <summary className="small text-muted" style={{ cursor: "pointer" }}>
            Gelişmiş: ID listesi (virgül veya satır)
          </summary>
          <textarea
            key={selectedProducts.map((p) => p.id).join(",")}
            defaultValue={selectedProducts.map((p) => p.id).join("\n")}
            rows={5}
            placeholder={"123\n456"}
            className="form-control font-monospace mt-2"
            onBlur={(e) => {
              const ids = parseProductIds(e.target.value);
              setSelectedProducts((prev) =>
                ids.map((id) => prev.find((x) => x.id === id) ?? { id, name: `Ürün #${id}` })
              );
            }}
          />
        </details>
      </div>
      <label>
        Kapak görseli
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadThumbnail(f);
          }}
          style={{ display: "block", marginTop: 4 }}
        />
      </label>
      {form.thumbnailImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={form.thumbnailImageUrl} alt="" style={{ maxWidth: 200 }} />
      ) : null}
      <button type="submit" disabled={saving}>
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
