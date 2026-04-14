declare module "bootstrap/js/dist/offcanvas" {
  const Offcanvas: {
    getOrCreateInstance(element: HTMLElement): { hide(): void };
    getInstance(element: HTMLElement): { hide(): void } | null;
  };
  export default Offcanvas;
}

declare module "bootstrap/js/dist/collapse" {
  const Collapse: unknown;
  export default Collapse;
}
