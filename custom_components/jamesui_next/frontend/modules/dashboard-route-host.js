// Owns page-level dashboard lifecycles; the Core shell keeps navigation and overlays.
export function createDashboardRouteHost({ core, composer, getConfig } = {}) {
  if (!core?.router || typeof core.router.subscribe !== "function") throw new TypeError("Router required");
  if (!composer || typeof composer.mount !== "function" || typeof composer.destroy !== "function") throw new TypeError("Composer required");
  if (typeof getConfig !== "function") throw new TypeError("Config getter required");
  let unsubscribe = null;
  let generation = 0;
  let host = null;

  async function show(routeId) {
    const token = ++generation;
    composer.destroy();
    if (!host) return false;
    const page = getConfig()?.pages?.[routeId];
    if (!page || page.kind !== "dashboard") return false;
    host.replaceChildren();
    try {
      await composer.mount(host, routeId);
      if (token !== generation) return false;
      if (page.elements.length === 0) composer.enterEdit();
      return true;
    } catch (error) {
      if (token === generation) {
        composer.destroy();
        host.textContent = "Dashboard nicht verfügbar: " + String(error?.message ?? error);
      }
      return false;
    }
  }

  return Object.freeze({
    async mount(target) {
      if (unsubscribe) throw new Error("Dashboard route host already mounted");
      if (!target || typeof target.querySelector !== "function") throw new TypeError("Shell target required");
      host = target.querySelector('[data-role="page-region"]');
      if (!host) throw new Error("Shell page region not found");
      unsubscribe = core.router.subscribe(({ to }) => {
        // The shell subscribes first and swaps its page placeholder synchronously.
        void show(to);
      });
      return show(core.router.currentRouteId);
    },
    destroy() {
      ++generation;
      unsubscribe?.();
      unsubscribe = null;
      composer.destroy();
      host = null;
    },
  });
}
