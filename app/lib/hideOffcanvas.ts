"use client";

/** Bootstrap dismiss, <a> için preventDefault yapıp Next.js Link’i kırıyor; programatik kapat. */
export function hideOffcanvasById(id: string): void {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;
  void import("bootstrap/js/dist/offcanvas").then((mod) => {
    mod.default.getOrCreateInstance(el)?.hide();
  });
}
