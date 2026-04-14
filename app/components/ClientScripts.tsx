"use client";

import BootstrapInit from "./BootstrapInit";

/** @deprecated Prefer root `Providers` (Bootstrap + AOS). Kept for any legacy imports. */
export default function ClientScripts() {
  return <BootstrapInit />;
}
