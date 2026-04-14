// Bootstrap dist alt modülleri için resmi @types yok.
// @ts-nocheck
"use client";

import { useEffect } from "react";

/**
 * Bootstrap bundle yerine yalnızca kullanılan bileşenler (Offcanvas, Collapse).
 * data-bs-toggle / data-bs-dismiss davranışı bu importlarla kayıt olur.
 */
export default function BootstrapInit() {
  useEffect(() => {
    void import("bootstrap/js/dist/offcanvas");
    void import("bootstrap/js/dist/collapse");
  }, []);
  return null;
}
