"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getImageUrl, isApiHostedMediaSrc } from "@/app/lib/api/config";
import { getProductsGrid } from "@/app/lib/api/products";
import { searchProducts } from "@/app/lib/api/search";

export type SelectedCollectionProduct = { id: number; name: string };

type Row = { id: number; name: string; thumb: string | undefined };

export function CollectionProductPicker({
  selected,
  onChange,
}: {
  selected: SelectedCollectionProduct[];
  onChange: (next: SelectedCollectionProduct[]) => void;
}) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (debounced.length >= 2) {
          const r = await searchProducts({ query: debounced, pageSize: 24 });
          if (cancelled) return;
          const list =
            r?.products?.map((p) => ({
              id: p.id,
              name: p.name,
              thumb: p.thumbnailUrl,
            })) ?? [];
          setRows(list);
        } else {
          const g = await getProductsGrid({
            pageIndex: 0,
            pageSize: 24,
            sort: [{ field: "id", dir: "desc" }],
          });
          if (cancelled) return;
          const list =
            g?.data?.map((p) => ({
              id: p.id,
              name: p.name,
              thumb: p.thumbnailImageUrl,
            })) ?? [];
          setRows(list);
        }
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const selectedIds = new Set(selected.map((s) => s.id));

  function add(p: Row) {
    if (selectedIds.has(p.id)) return;
    onChange([...selected, { id: p.id, name: p.name }]);
  }

  function remove(id: number) {
    onChange(selected.filter((s) => s.id !== id));
  }

  return (
    <div className="border rounded p-3 bg-light">
      <label className="form-label fw-semibold mb-2">Ürün ekle</label>
      <p className="small text-muted mb-2">
        Arayın (en az 2 karakter) veya aşağıdan son eklenen ürünleri seçin. Sıra, eklediğiniz sırayı takip eder.
      </p>
      <input
        type="search"
        className="form-control mb-3"
        placeholder="Ürün adı veya SKU ile ara…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoComplete="off"
      />

      <div className="mb-3">
        <div className="small fw-semibold text-secondary mb-1">Seçilen ürünler ({selected.length})</div>
        {selected.length === 0 ? (
          <p className="small text-muted mb-0">Henüz ürün seçilmedi.</p>
        ) : (
          <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
            {selected.map((s) => (
              <li key={s.id} className="d-flex align-items-center justify-content-between gap-2 bg-white border rounded px-2 py-1">
                <span className="small text-break">
                  #{s.id} — {s.name}
                </span>
                <button type="button" className="btn btn-sm btn-outline-danger flex-shrink-0" onClick={() => remove(s.id)}>
                  Kaldır
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="small fw-semibold text-secondary mb-1">{loading ? "Yükleniyor…" : "Sonuçlar"}</div>
      <div className="border rounded bg-white" style={{ maxHeight: 280, overflowY: "auto" }}>
        {rows.length === 0 && !loading ? (
          <p className="small text-muted mb-0 p-2">Sonuç yok.</p>
        ) : (
          <ul className="list-group list-group-flush">
            {rows.map((p) => {
              const src = getImageUrl(p.thumb);
              const already = selectedIds.has(p.id);
              return (
                <li key={p.id} className="list-group-item d-flex align-items-center gap-2 py-2">
                  <div className="flex-shrink-0 rounded overflow-hidden bg-secondary" style={{ width: 40, height: 40 }}>
                    {p.thumb ? (
                      <Image
                        src={src}
                        alt=""
                        width={40}
                        height={40}
                        style={{ objectFit: "cover" }}
                        unoptimized={isApiHostedMediaSrc(src)}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-grow-1 small fw-medium text-break">{p.name}</div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary flex-shrink-0"
                    disabled={already}
                    onClick={() => add(p)}
                  >
                    {already ? "Eklendi" : "Ekle"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
