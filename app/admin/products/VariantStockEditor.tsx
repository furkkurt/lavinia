"use client";

import { useState } from "react";

export type VariantColorRow = { name: string; stocks: Record<string, number> };

const PRESET_NAMES: { name: string; hex: string }[] = [
  { name: "Siyah", hex: "#1a1a1a" },
  { name: "Beyaz", hex: "#f5f5f5" },
  { name: "Bej", hex: "#d4c4b0" },
  { name: "Krem", hex: "#faf5eb" },
  { name: "Gri", hex: "#9ca3af" },
  { name: "Lacivert", hex: "#1e3a5f" },
  { name: "Mavi", hex: "#3b82f6" },
  { name: "Bordo", hex: "#7f1d1d" },
  { name: "Kırmızı", hex: "#dc2626" },
  { name: "Pembe", hex: "#f472b6" },
  { name: "Yeşil", hex: "#166534" },
  { name: "Haki", hex: "#6b7c59" },
  { name: "Sarı", hex: "#eab308" },
  { name: "Turuncu", hex: "#ea580c" },
  { name: "Mor", hex: "#7c3aed" },
  { name: "Kahverengi", hex: "#78350f" },
];

type Props = {
  sizeLabels: string[];
  rows: VariantColorRow[];
  onChange: (rows: VariantColorRow[]) => void;
};

export function VariantStockEditor({ sizeLabels, rows, onChange }: Props) {
  const [draftName, setDraftName] = useState("");

  const setName = (i: number, name: string) => {
    const next = rows.slice();
    next[i] = { ...next[i], name };
    onChange(next);
  };

  const setQty = (i: number, sizeKey: string, raw: string) => {
    const n = Math.max(0, Math.floor(parseInt(raw, 10) || 0));
    const next = rows.slice();
    next[i] = { ...next[i], stocks: { ...next[i].stocks, [sizeKey]: n } };
    onChange(next);
  };

  const addRow = (nameRaw: string) => {
    const name = nameRaw.trim();
    if (!name) return;
    if (rows.some((r) => r.name.trim().toLowerCase() === name.toLowerCase())) {
      return;
    }
    const stocks = Object.fromEntries(sizeLabels.map((s) => [s, 0])) as Record<string, number>;
    onChange([...rows, { name, stocks }]);
    setDraftName("");
  };

  const removeRow = (i: number) => {
    onChange(rows.filter((_, j) => j !== i));
  };

  return (
    <div className="tw-w-full tw-min-w-0">
      <div className="tw-mb-5 tw-rounded-md tw-border tw-border-stone-200 tw-bg-stone-50/90 tw-p-4">
        <p className="tw-mb-1 tw-text-sm tw-font-semibold tw-text-stone-900">1. Renk ekle</p>
        <p className="tw-mb-3 tw-text-xs tw-leading-relaxed tw-text-stone-600">
          Renk adını yazıp <strong>Renk ekle</strong> deyin. Satır oluşunca aşağıda 2. adımda her beden için
          stok girin.
        </p>
        <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-stretch">
          <div className="tw-min-w-0 tw-flex-1">
            <label
              className="tw-mb-1.5 tw-block tw-text-xs tw-font-medium tw-text-stone-700"
              htmlFor="variant-new-color"
            >
              Renk adı
            </label>
            <input
              id="variant-new-color"
              type="text"
              className="tw-w-full tw-min-h-[44px] tw-rounded-md tw-border tw-border-stone-300 tw-bg-white tw-px-3 tw-py-2.5 tw-text-sm tw-text-stone-900 tw-shadow-sm tw-outline-none tw-transition focus:tw-border-lavinia-sage focus:tw-ring-2 focus:tw-ring-lavinia-sage/20"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Örn. Siyah, Ekru"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRow(draftName);
                }
              }}
            />
          </div>
          <div className="tw-flex tw-items-end">
            <button
              type="button"
              onClick={() => addRow(draftName)}
              className="tw-w-full tw-min-h-[44px] tw-rounded-md tw-border tw-border-lavinia-sage tw-bg-lavinia-sage tw-px-5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm tw-transition hover:tw-bg-[#7a7e6c] sm:tw-w-auto"
            >
              Renk ekle
            </button>
          </div>
        </div>
        <div className="tw-mt-3 tw-border-t tw-border-stone-200/80 tw-pt-3">
          <p className="tw-mb-2 tw-text-xs tw-font-medium tw-text-stone-500">Hızlı seç (tek tıkla ekler)</p>
          <div className="tw-flex tw-flex-wrap tw-gap-1.5">
            {PRESET_NAMES.map((p) => (
              <button
                key={p.name}
                type="button"
                title={p.name}
                onClick={() => addRow(p.name)}
                className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-stone-300 tw-text-[0] tw-shadow-sm tw-transition hover:tw-border-lavinia-sage"
                style={{ backgroundColor: p.hex }}
                aria-label={p.name}
              />
            ))}
          </div>
        </div>
      </div>

        {rows.length === 0 ? (
        <p className="tw-mb-0 tw-text-sm tw-text-stone-500">
          Henüz renk yok. Stok için renk satırı ekleyin; toplam stok kayıtta matris toplamından güncellenir.
        </p>
      ) : (
        <div>
          <p className="tw-mb-2 tw-text-sm tw-font-semibold tw-text-stone-900">2. Bedenlere göre stok</p>
          <div className="tw-overflow-x-auto tw-rounded-md tw-border tw-border-stone-200 tw-shadow-sm">
            <table className="tw-mb-0 tw-min-w-[300px] tw-w-full tw-border-collapse tw-text-sm">
              <thead>
                <tr className="tw-border-b tw-border-stone-200 tw-bg-stone-100/90 tw-text-left">
                  <th className="tw-p-2.5 tw-pl-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-stone-600">
                    Renk adı
                  </th>
                  {sizeLabels.map((sz) => (
                    <th
                      key={sz}
                      className="tw-px-2 tw-py-2.5 tw-text-center tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-stone-600"
                    >
                      {sz}
                    </th>
                  ))}
                  <th className="tw-w-10 tw-px-1" aria-label="Kaldır" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`v-${i}-${row.name}`} className="tw-border-b tw-border-stone-100 last:tw-border-0">
                    <td className="tw-px-2 tw-py-2 tw-align-middle">
                      <label className="tw-sr-only" htmlFor={`v-name-${i}`}>
                        Renk {i + 1}
                      </label>
                      <input
                        id={`v-name-${i}`}
                        type="text"
                        className="tw-w-full tw-min-w-[8rem] tw-min-h-[40px] tw-rounded-md tw-border tw-border-stone-300 tw-bg-white tw-px-2.5 tw-py-2 tw-text-sm tw-text-stone-900 tw-outline-none focus:tw-border-lavinia-sage focus:tw-ring-1 focus:tw-ring-lavinia-sage/30"
                        value={row.name}
                        onChange={(e) => setName(i, e.target.value)}
                        autoComplete="off"
                      />
                    </td>
                    {sizeLabels.map((sz) => (
                      <td key={sz} className="tw-px-1.5 tw-py-1.5 tw-align-middle">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="tw-w-full tw-min-h-[40px] tw-min-w-[2.75rem] tw-rounded-md tw-border tw-border-stone-300 tw-bg-white tw-py-1.5 tw-text-center tw-text-sm tw-tabular-nums tw-outline-none focus:tw-border-lavinia-sage focus:tw-ring-1 focus:tw-ring-lavinia-sage/30"
                          value={row.stocks[sz] ?? 0}
                          onChange={(e) => setQty(i, sz, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="tw-px-1 tw-align-middle">
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-md tw-text-base tw-text-red-600 tw-transition hover:tw-bg-red-50"
                        aria-label="Renk satırını sil"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
