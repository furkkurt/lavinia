"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  adminSearchOrders,
  adminSearchProducts,
  adminSearchUsers,
  type AdminSearchOrderHit,
  type AdminSearchProductHit,
  type AdminSearchResource,
} from "../lib/api/adminSearch";
import type { User } from "../lib/api/users";

type FieldProducts = "name" | "sku" | "id";
type FieldUsers = "fullName" | "email" | "id";
type FieldOrders = "id" | "customerName";

const RESOURCE_OPTIONS: { value: AdminSearchResource; label: string }[] = [
  { value: "products", label: "Ürünler" },
  { value: "users", label: "Kullanıcılar" },
  { value: "orders", label: "Siparişler" },
];

const FIELD_LABELS: Record<
  AdminSearchResource,
  { value: string; label: string }[]
> = {
  products: [
    { value: "name", label: "Ürün adı" },
    { value: "sku", label: "SKU" },
    { value: "id", label: "ID" },
  ],
  users: [
    { value: "fullName", label: "Ad Soyad" },
    { value: "email", label: "E-posta" },
    { value: "id", label: "ID" },
  ],
  orders: [
    { value: "id", label: "Sipariş no" },
    { value: "customerName", label: "Müşteri adı" },
  ],
};

function minQueryLength(field: string, _resource: AdminSearchResource): number {
  if (field === "id") return 1;
  return 2;
}

export default function AdminGlobalSearch() {
  const [resource, setResource] = useState<AdminSearchResource>("products");
  const [field, setField] = useState<string>("name");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hitsProducts, setHitsProducts] = useState<AdminSearchProductHit[]>([]);
  const [hitsUsers, setHitsUsers] = useState<User[]>([]);
  const [hitsOrders, setHitsOrders] = useState<AdminSearchOrderHit[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fieldOptions = useMemo(() => FIELD_LABELS[resource], [resource]);

  useEffect(() => {
    const first = FIELD_LABELS[resource][0]?.value ?? "name";
    setField(first);
  }, [resource]);

  const executeSearch = useCallback(async () => {
    const t = q.trim();
    const minLen = minQueryLength(field, resource);
    if (t.length < minLen) {
      setHitsProducts([]);
      setHitsUsers([]);
      setHitsOrders([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);
    try {
      if (resource === "products") {
        setHitsUsers([]);
        setHitsOrders([]);
        setHitsProducts(await adminSearchProducts(t, field as FieldProducts));
      } else if (resource === "users") {
        setHitsProducts([]);
        setHitsOrders([]);
        setHitsUsers(await adminSearchUsers(t, field as FieldUsers));
      } else {
        setHitsProducts([]);
        setHitsUsers([]);
        setHitsOrders(await adminSearchOrders(t, field as FieldOrders));
      }
    } finally {
      setLoading(false);
    }
  }, [q, resource, field]);

  useEffect(() => {
    const t = q.trim();
    const minLen = minQueryLength(field, resource);
    if (t.length < minLen) {
      setHitsProducts([]);
      setHitsUsers([]);
      setHitsOrders([]);
      setOpen(false);
      return;
    }
    const id = window.setTimeout(() => {
      void executeSearch();
    }, 380);
    return () => window.clearTimeout(id);
  }, [q, resource, field, executeSearch]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeSearch();
  };

  const hasHits =
    hitsProducts.length > 0 || hitsUsers.length > 0 || hitsOrders.length > 0;

  const minLen = minQueryLength(field, resource);

  return (
    <div ref={wrapRef} className="admin-global-search mb-3 position-relative">
      <form
        className="row g-2 align-items-center flex-wrap"
        onSubmit={onSubmit}
        role="search"
        aria-label="Yönetim paneli arama"
      >
        <div className="col-12 col-lg-auto" style={{ minWidth: "8.5rem" }}>
          <select
            className="form-select form-select-sm rounded-0"
            value={resource}
            onChange={(e) => setResource(e.target.value as AdminSearchResource)}
            aria-label="Kaynak"
          >
            {RESOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-12 col-lg-auto" style={{ minWidth: "9.5rem" }}>
          <select
            className="form-select form-select-sm rounded-0"
            value={field}
            onChange={(e) => setField(e.target.value)}
            aria-label="Alan"
          >
            {fieldOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-12 col-lg">
          <div className="input-group input-group-sm">
            <input
              type="search"
              className="form-control rounded-0"
              placeholder="Ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => {
                if (q.trim().length >= minLen) setOpen(true);
              }}
              autoComplete="off"
              aria-label="Arama metni"
            />
            <button
              type="submit"
              className="btn btn-primary rounded-0 px-3"
              disabled={loading}
            >
              {loading ? "…" : "Ara"}
            </button>
          </div>
        </div>
      </form>

      {open && (
        <div
          className="position-absolute top-100 start-0 end-0 mt-1 bg-white border rounded shadow-sm py-2"
          style={{ zIndex: 4000, maxHeight: "min(70vh, 22rem)", overflowY: "auto" }}
        >
          {loading && !hasHits ? (
            <div className="px-3 py-2 text-muted small">Aranıyor…</div>
          ) : !hasHits ? (
            <div className="px-3 py-2 text-muted small">Sonuç yok.</div>
          ) : (
            <ul className="list-unstyled mb-0">
              {resource === "products" &&
                hitsProducts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="d-block px-3 py-2 text-decoration-none text-dark admin-global-search-hit"
                      onClick={() => setOpen(false)}
                    >
                      <span className="fw-semibold">#{p.id}</span> {p.name}
                      {p.sku ? (
                        <span className="text-muted small ms-1">· {p.sku}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              {resource === "users" &&
                hitsUsers.map((u) => (
                  <li key={u.id}>
                    <Link
                      href={`/admin/users?highlightId=${u.id}`}
                      className="d-block px-3 py-2 text-decoration-none text-dark admin-global-search-hit"
                      onClick={() => setOpen(false)}
                    >
                      <span className="fw-semibold">#{u.id}</span> {u.fullName}
                      <span className="text-muted small ms-1">· {u.email}</span>
                    </Link>
                  </li>
                ))}
              {resource === "orders" &&
                hitsOrders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="d-block px-3 py-2 text-decoration-none text-dark admin-global-search-hit"
                      onClick={() => setOpen(false)}
                    >
                      <span className="fw-semibold">#{o.id}</span> {o.customerName}
                      <span className="text-muted small ms-1">
                        · {o.orderStatus}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
