"use client";

import AOSInit from "@/app/components/AOSInit";
import BootstrapInit from "@/app/components/BootstrapInit";

/**
 * Client-only providers. Bootstrap JS must load once so `data-bs-toggle` (offcanvas, collapse) works site-wide.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BootstrapInit />
      <AOSInit />
      {children}
    </>
  );
}
