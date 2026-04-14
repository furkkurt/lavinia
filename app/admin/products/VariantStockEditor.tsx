"use client";

export type VariantColorRow = { name: string; stocks: Record<string, number> };

type Props = {
  sizeLabels: string[];
  rows: VariantColorRow[];
  onChange: (rows: VariantColorRow[]) => void;
};

export function VariantStockEditor({ sizeLabels, rows, onChange }: Props) {
  const addRow = () => {
    const stocks = Object.fromEntries(sizeLabels.map((s) => [s, 0])) as Record<string, number>;
    onChange([...rows, { name: "", stocks }]);
  };

  const removeRow = (i: number) => {
    onChange(rows.filter((_, j) => j !== i));
  };

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

  return (
    <div className="col-12 mb-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <label className="form-label mb-0 fw-semibold">Renk ve beden stoku</label>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={addRow}>
          Renk ekle
        </button>
      </div>
      <p className="small text-muted mb-3">
        Her renk için isim girin; satırdaki beden kutularına stok yazın. Üstteki beden alanı boşsa sütunlar XS–XXL olur.
        Mağazada renk ve stok bu tablodan gelir.
      </p>
      {rows.length === 0 ? (
        <p className="text-muted small mb-0">
          Henüz renk yok. Stok yalnızca üstteki &quot;Stok Adedi&quot; alanından takip edilir; renk/beden seçimi gösterilmez.
        </p>
      ) : (
        <div className="table-responsive border rounded">
          <table className="table table-sm table-bordered mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col">Renk adı</th>
                {sizeLabels.map((sz) => (
                  <th key={sz} scope="col" className="text-center text-nowrap">
                    {sz}
                  </th>
                ))}
                <th scope="col" className="text-end" style={{ width: "1%" }}>
                  Sil
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={row.name}
                      onChange={(e) => setName(i, e.target.value)}
                      placeholder="Örn. Siyah"
                    />
                  </td>
                  {sizeLabels.map((sz) => (
                    <td key={sz} className="p-1" style={{ minWidth: "4rem" }}>
                      <input
                        type="number"
                        min={0}
                        className="form-control form-control-sm text-center"
                        value={row.stocks[sz] ?? 0}
                        onChange={(e) => setQty(i, sz, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="text-end">
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeRow(i)}>
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
