/**
 * Bootstrap JS modüler yüklendiği için `window.bootstrap` yok; offcanvas kapatma buradan.
 */
export async function hideOffcanvasById(elementId: string): Promise<void> {
  if (typeof document === "undefined") return;
  const el = document.getElementById(elementId);
  if (!el) return;
  const mod = await import("bootstrap/js/dist/offcanvas");
  mod.default.getOrCreateInstance(el)?.hide();
}
