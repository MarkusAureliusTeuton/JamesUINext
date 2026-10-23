import { CORE_ROUTES } from "./routes.js";

export function createRouter({ routes = CORE_ROUTES, initialRoute = "home" } = {}) {
  let routeById = new Map(routes.map((route) => [route.id, route]));
  let currentRouteId = routeById.has(initialRoute) ? initialRoute : routes[0]?.id ?? null;
  const listeners = new Set();

  return {
    get currentRouteId() {
      return currentRouteId;
    },
    get currentRoute() {
      return routeById.get(currentRouteId) ?? null;
    },
    setRoutes(nextRoutes) {
      if (!Array.isArray(nextRoutes) || !nextRoutes.length) throw new TypeError("Navigation needs pages");
      const replacement = new Map(nextRoutes.map(route => [route.id, route]));
      if (replacement.size !== nextRoutes.length ||
          nextRoutes.some(route => typeof route.id !== "string" || !route.id.trim()))
        throw new TypeError("Invalid or duplicate page IDs");
      const previous = currentRouteId;
      routeById = replacement;
      if (!routeById.has(currentRouteId)) currentRouteId = replacement.has("home") ? "home" : nextRoutes[0].id;
      if (currentRouteId !== previous) {
        const change={from:previous,to:currentRouteId,route:routeById.get(currentRouteId)};
        for(const listener of [...listeners]) listener(change);
      }
      return [...routeById.values()];
    },
    navigate(routeId) {
      const route = routeById.get(routeId);
      if (!route) return false;
      if (routeId === currentRouteId) return true;
      const from = currentRouteId;
      currentRouteId = routeId;
      const change = { from, to: routeId, route };
      for (const listener of [...listeners]) listener(change);
      return true;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy() {
      listeners.clear();
    },
  };
}
