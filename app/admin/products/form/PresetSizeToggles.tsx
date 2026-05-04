"use client";

import { parseCustomerOptions } from "../../../lib/api/products";

/** Mağaza ve API ile aynı: tek “standart” beden sütunu adı Standart (eski veride "Stok" da kabul edilir). */
export const PRESET_SIZE_KEYS = ["Standart", "XS", "S", "M", "L", "XL"] as const;

function eq(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Girişteki metni sabit beden anahtarına eşler; eski "Stok" → Standart. */
export function canonicalPresetFromParsed(token: string): (typeof PRESET_SIZE_KEYS)[number] | null {
  const t = token.trim();
  if (!t) return null;
  if (/^stok$/i.test(t)) return "Standart";
  if (/^standart$|^standard$/i.test(t)) return "Standart";
  for (const k of PRESET_SIZE_KEYS) {
    if (eq(t, k)) return k;
  }
  return null;
}

function serializeSizes(
  orderedPresets: (typeof PRESET_SIZE_KEYS)[number][],
  extras: string[]
): string {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of orderedPresets) {
    const lk = p.toLowerCase();
    if (!seen.has(lk)) {
      out.push(p);
      seen.add(lk);
    }
  }
  for (const e of extras) {
    const k = e.trim();
    if (!k) continue;
    if (orderedPresets.some((p) => eq(p, k))) continue;
    const lk = k.toLowerCase();
    if (!seen.has(lk)) {
      out.push(k);
      seen.add(lk);
    }
  }
  return out.length ? JSON.stringify(out) : "";
}

type Props = {
  value: string;
  onChange: (next: string) => void;
};

export function PresetSizeToggles({ value, onChange }: Props) {
  const raw = typeof value === "string" ? value : "";
  const parsed = parseCustomerOptions(raw);
  const selectedPresets = PRESET_SIZE_KEYS.filter((k) =>
    parsed.some((p) => canonicalPresetFromParsed(p) === k)
  );
  const extras = parsed.filter((p) => canonicalPresetFromParsed(p) === null);
  const extrasStr = extras.join(", ");

  const toggle = (key: (typeof PRESET_SIZE_KEYS)[number]) => {
    const on = selectedPresets.includes(key);
    const nextPresets = on
      ? selectedPresets.filter((k) => k !== key)
      : [...selectedPresets, key];
    const ordered = PRESET_SIZE_KEYS.filter((k) => nextPresets.includes(k));
    onChange(serializeSizes(ordered, extras));
  };

  const onExtrasChange = (raw: string) => {
    const extraParts = raw
      .split(/[,;\n\r]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    onChange(serializeSizes(selectedPresets, extraParts));
  };

  return (
    <div className="tw-space-y-3">
      <div>
        <span className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-stone-600">
          Beden sütunları
        </span>
        <p className="tw-mb-2 tw-text-xs tw-leading-relaxed tw-text-stone-500">
          Mağazada ve stok matrisinde görünecek bedenleri seçin. Boş bırakırsanız varsayılan tam liste
          (Standart, XS–XXL) kullanılır.
        </p>
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          {PRESET_SIZE_KEYS.map((k) => {
            const on = selectedPresets.includes(k);
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(k)}
                className={`tw-min-h-[44px] tw-min-w-[3rem] tw-rounded-xl tw-border tw-px-3 tw-text-sm tw-font-semibold tw-transition focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-lavinia-sage/30 ${
                  on
                    ? "tw-border-lavinia-sage tw-bg-lavinia-sage tw-text-white tw-shadow-sm"
                    : "tw-border-stone-300 tw-bg-white tw-text-stone-700 hover:tw-border-stone-400"
                }`}
              >
                {k}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label
          className="tw-mb-1.5 tw-block tw-text-xs tw-font-medium tw-text-stone-600"
          htmlFor="preset-size-extras"
        >
          Ek bedenler (isteğe bağlı, virgülle)
        </label>
        <input
          id="preset-size-extras"
          type="text"
          className="tw-block tw-w-full tw-min-h-[44px] tw-rounded-xl tw-border tw-border-stone-200 tw-bg-white tw-px-3 tw-text-sm tw-text-stone-900 tw-outline-none focus:tw-border-lavinia-sage focus:tw-ring-2 focus:tw-ring-lavinia-sage/20"
          value={extrasStr}
          onChange={(e) => onExtrasChange(e.target.value)}
          placeholder="Örn. XXL, 36, 38"
          autoComplete="off"
        />
      </div>
    </div>
  );
}
