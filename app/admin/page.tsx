"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /admin için sunucu redirect() kullanmayın: Next 15+ / React 19 bazen
 * "Minified React error #310" (Rendered more hooks than during the previous render) üretebiliyor
 * (layout ile redirect yarışı). İstemci yönlendirmesi güvenli.
 */
export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/statistics");
  }, [router]);

  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="spinner-border text-secondary" role="status">
        <span className="visually-hidden">Yönlendiriliyor…</span>
      </div>
    </div>
  );
}
