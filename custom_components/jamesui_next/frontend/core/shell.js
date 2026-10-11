import { createButton } from "../design/primitives.js";
import { createIcon } from "../icons/icon.js";
import { CORE_ROUTES } from "./routes.js";

const NAV_ICON_IDS = Object.freeze({
  home: "nav.start",
  house: "nav.house",
  climate: "nav.climate",
  media: "nav.media",
  door: "nav.door",
});

function requireDependency(value, name) {
  if (!value) throw new TypeError(`createAppShell requires ${name}`);
}

export function createAppShell({ document, router, overlays, health, getContext, designSystem, renderPage = null } = {}) {
  requireDependency(document, "document");
  requireDependency(router, "router");
  requireDependency(overlays, "overlays");
  requireDependency(health, "health");
  requireDependency(getContext, "getContext");
  requireDependency(designSystem, "designSystem");

  const pageRenderer = renderPage ?? (({ document: doc, route }) => {
    const node = doc.createElement("section");
    node.dataset.role = "page-placeholder";
    node.dataset.routeId = route.id;
    node.textContent = route.label;
    return node;
  });

  let target = null;
  let root = null;
  let pageRegion = null;
  let navigation = null;
  let overlayRoot = null;
  let healthSurface = null;
  let unsubscribeRouter = null;
  let unsubscribeOverlay = null;
  let unsubscribeHealth = null;
  let activeRouteId = null;
  const navBindings = [];

  const updateNavigation = () => {
    if (!navigation) return;
    for (const button of navigation.querySelectorAll("button")) {
      if (button.dataset.routeId === router.currentRouteId) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    }
  };

  const updateHealthSurface = () => {
    if (!healthSurface) return;
    const errors = health.list().filter((record) => record.status === "error");
    healthSurface.hidden = errors.length === 0;
    healthSurface.textContent = errors.map((record) => record.message || record.id).join(" · ");
  };

  const updateOverlay = () => {
    if (!overlayRoot) return;
    const descriptor = overlays.current;
    overlayRoot.replaceChildren();
    overlayRoot.textContent = "";
    if (!descriptor) {
      overlayRoot.hidden = true;
      delete overlayRoot.dataset.overlayId;
      return;
    }
    overlayRoot.hidden = false;
    overlayRoot.dataset.overlayId = descriptor.id;
    const content = descriptor.content;
    if (content?.nodeType === 1 && content.ownerDocument === document) {
      overlayRoot.replaceChildren(content);
      return;
    }
    overlayRoot.textContent = descriptor.title ?? descriptor.id;
  };

  const renderCurrentPage = () => {
    const route = router.currentRoute;
    if (!route || !pageRegion) return;
    if (activeRouteId && activeRouteId !== route.id) health.clear(`page:${activeRouteId}`);
    activeRouteId = route.id;
    try {
      const node = pageRenderer({ document, route, context: getContext() });
      if (!node) throw new Error(`Page renderer returned no node for ${route.id}`);
      health.clear(`page:${route.id}`);
      pageRegion.replaceChildren(node);
    } catch (error) {
      health.report(`page:${route.id}`, {
        status: "error",
        message: `Page ${route.id} failed to render`,
        error,
      });
      const errorNode = document.createElement("section");
      errorNode.dataset.role = "page-error";
      errorNode.dataset.routeId = route.id;
      errorNode.textContent = "Seite nicht verfügbar";
      pageRegion.replaceChildren(errorNode);
    }
    updateNavigation();
  };

  const destroy = () => {
    unsubscribeRouter?.();
    unsubscribeOverlay?.();
    unsubscribeHealth?.();
    unsubscribeRouter = null;
    unsubscribeOverlay = null;
    unsubscribeHealth = null;
    for (const { button, listener } of navBindings.splice(0)) button.removeEventListener("click", listener);
    designSystem.destroy();
    if (root?.parentNode) root.parentNode.removeChild(root);
    target = null;
    root = null;
    pageRegion = null;
    navigation = null;
    overlayRoot = null;
    healthSurface = null;
    activeRouteId = null;
  };

  const mount = (nextTarget) => {
    requireDependency(nextTarget, "mount target");
    if (root) destroy();
    target = nextTarget;

    root = document.createElement("div");
    root.dataset.role = "app-shell";
    // Size the tablet shell to its viewport. The navigation owns a real
    // layout row, so no editor controls can be hidden under sticky buttons.
    root.style.height = "100dvh";
    root.style.minHeight = "0";
    root.style.width = "100%";
    root.style.display = "grid";
    root.style.gridTemplateRows = "minmax(0, 1fr) auto";
    root.style.overflow = "hidden";
    designSystem.mount(root);

    pageRegion = document.createElement("main");
    pageRegion.dataset.role = "page-region";
    pageRegion.style.position = "relative";
    pageRegion.style.minHeight = "0";
    pageRegion.style.minWidth = "0";
    pageRegion.style.overflow = "hidden";

    overlayRoot = document.createElement("div");
    overlayRoot.dataset.role = "overlay-root";
    overlayRoot.hidden = true;

    healthSurface = document.createElement("div");
    healthSurface.dataset.role = "health-surface";
    healthSurface.hidden = true;

    navigation = document.createElement("nav");
    navigation.dataset.role = "bottom-navigation";
    navigation.style.position = "relative";
    navigation.style.display = "flex";
    navigation.style.justifyContent = "space-around";
    navigation.style.gap = "4px";
    navigation.style.padding = "6px 8px";
    navigation.style.zIndex = "5";

    for (const route of CORE_ROUTES) {
      const button = createButton(document, { label: route.label, variant: "ghost", size: "md" });
      const iconId = NAV_ICON_IDS[route.id];
      if (!iconId) throw new Error(`Missing navigation icon for route: ${route.id}`);
      button.prepend(createIcon(document, iconId, { size: "md" }));
      button.dataset.routeId = route.id;
      // This candidate implements only Start; do not present unfinished
      // sections as working navigation. Their icons remain visible as a preview.
      const available = route.id === "home";
      if (!available) {
        button.disabled = true;
        button.setAttribute("aria-disabled", "true");
        button.setAttribute("title", "Dieser Bereich folgt in einer späteren Version");
        button.style.opacity = "0.42";
      } else {
        const listener = () => router.navigate(route.id);
        button.addEventListener("click", listener);
        navBindings.push({ button, listener });
      }
      navigation.appendChild(button);
    }

    root.appendChild(pageRegion);
    root.appendChild(overlayRoot);
    root.appendChild(healthSurface);
    root.appendChild(navigation);
    target.appendChild(root);

    unsubscribeRouter = router.subscribe(() => renderCurrentPage());
    unsubscribeOverlay = overlays.subscribe(() => updateOverlay());
    unsubscribeHealth = health.subscribe(() => updateHealthSurface());

    renderCurrentPage();
    updateOverlay();
    updateHealthSurface();
    return root;
  };

  return { mount, destroy };
}
