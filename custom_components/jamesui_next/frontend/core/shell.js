import { createButton } from "../design/primitives.js";
import { createIcon } from "../icons/icon.js";
import { CORE_ROUTES } from "./routes.js";
import { activeDashboardPages } from "./page-management.js";
import { createPageSettingsPanel } from "./page-settings.js";

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

export function createAppShell({ document, router, overlays, health, getContext, designSystem, renderPage = null, configService = null } = {}) {
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
  let settingsButton = null, pageSettings = null, unsubscribeConfig = null, navObserver = null;
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

  const resizeNavigation = () => {
    if(!navigation) return;
    const buttons=[...navigation.querySelectorAll("[data-route-id]")];
    const width=navigation.clientWidth || 960;
    const overflow=buttons.length * 152 > width - 28;
    navigation.setAttribute("data-jui-nav-mode",overflow?"slider":"distributed");
    navigation.style.overflowX=overflow?"auto":"hidden";
    navigation.style.scrollSnapType=overflow?"x mandatory":"none";
    navigation.style.overscrollBehaviorX="contain";
    navigation.style.touchAction="pan-x";
    for(const button of buttons) {
      button.style.flex=overflow?"0 0 144px":"1 1 0";
      button.style.scrollSnapAlign="start";
    }
  };

  const renderNavigation = () => {
    if(!navigation)return;
    for(const {button,listener} of navBindings.splice(0)) button.removeEventListener("click",listener);
    navigation.replaceChildren();
    const pages=configService ? activeDashboardPages(configService.snapshot()) : CORE_ROUTES;
    const routes=pages.length ? pages : [{id:"home",label:"Start"}];
    if(configService) router.setRoutes(routes);
    for(const route of routes) {
      const button=createButton(document,{label:route.label,variant:"ghost",size:"md"});
      const iconId=NAV_ICON_IDS[route.id] ?? "nav.house";
      button.prepend(createIcon(document,iconId,{size:"md"}));
      button.dataset.routeId=route.id;
      button.style.display="flex";
      button.style.flexDirection="column";
      button.style.alignItems="center";
      button.style.justifyContent="center";
      button.style.gap="4px";
      button.style.minWidth="0";
      button.style.minHeight="54px";
      button.style.fontSize="clamp(13px,1.15vw,16px)";
      button.style.padding="8px 10px";
      button.style.borderRadius="12px";
      button.style.whiteSpace="nowrap";
      const listener=()=>router.navigate(route.id);
      button.addEventListener("click",listener);
      navBindings.push({button,listener});
      navigation.appendChild(button);
    }
    resizeNavigation();
    updateNavigation();
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
    unsubscribeConfig?.(); unsubscribeConfig = null;
    navObserver?.disconnect?.(); navObserver = null;
    pageSettings?.destroy(); pageSettings = null;
    settingsButton?.remove(); settingsButton = null;
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
    root.style.position = "relative";
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
    navigation.style.alignItems = "stretch";
    navigation.style.justifyContent = "space-around";
    navigation.style.gap = "clamp(6px, 1vw, 18px)";
    navigation.style.padding = "10px clamp(10px, 2vw, 28px) max(10px, env(safe-area-inset-bottom))";
    navigation.style.minHeight = "70px";
    navigation.style.background = "rgba(13, 15, 17, .97)";
    navigation.style.borderTop = "1px solid var(--jui-color-border-strong)";
    navigation.style.zIndex = "5";

    // The navigation is based on persisted pages and recomputed on every
    // configuration update. A small number of entries uses equal widths;
    // overflowing entries use horizontal touch-scroll with snap.
    renderNavigation();
    if (configService) {
      unsubscribeConfig=configService.subscribe(()=>{
        renderNavigation();
        pageSettings?.refresh();
      },{emitCurrent:false});
    }
    if(typeof globalThis.ResizeObserver==="function") {
      navObserver=new globalThis.ResizeObserver(()=>resizeNavigation());
      navObserver.observe(navigation);
    }
    
    root.appendChild(pageRegion);
    root.appendChild(overlayRoot);
    root.appendChild(healthSurface);
    root.appendChild(navigation);

    if(configService) {
      settingsButton=document.createElement("button");
      settingsButton.setAttribute("type","button");
      settingsButton.setAttribute("data-jui-open-settings","");
      settingsButton.setAttribute("aria-label","JamesUI Einstellungen öffnen");
      settingsButton.setAttribute("title","Einstellungen");
      settingsButton.textContent="⚙";
      settingsButton.style.position="absolute";
      settingsButton.style.top="16px";
      settingsButton.style.right="16px";
      settingsButton.style.zIndex="55";
      settingsButton.style.width="49px";
      settingsButton.style.height="49px";
      settingsButton.style.fontSize="29px";
      settingsButton.style.lineHeight="1";
      settingsButton.style.borderRadius="14px";
      settingsButton.style.color="#fff";
      settingsButton.style.border="1px solid rgba(240,220,190,.4)";
      settingsButton.style.background="rgba(21,23,25,.74)";
      settingsButton.style.backdropFilter="blur(12px)";
      pageSettings=createPageSettingsPanel({document,configService,
        onNavigate:(id)=>router.navigate(id)});
      settingsButton.addEventListener("click",()=>pageSettings.open());
      root.appendChild(settingsButton);
      root.appendChild(pageSettings.root);
    }
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
