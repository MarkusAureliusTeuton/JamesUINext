import { resolveDynamicButtonInstance } from "./widget.dynamic-buttons/config.js";

// Binds the layout-owned dashboard hosts to canonical widget module instances.
// The grid owns DOM geometry; this adapter owns only widget lifecycles.
export function createDashboardWidgetHosts({ moduleLoader, getConfig, getButtonDefinitions = null } = {}) {
  if (!moduleLoader || typeof moduleLoader.load !== "function" ||
      typeof moduleLoader.mount !== "function" || typeof moduleLoader.destroy !== "function") {
    throw new TypeError("Dashboard widget hosts require the canonical Module Loader");
  }
  if (typeof getConfig !== "function") throw new TypeError("getConfig must be a function");

  if (getButtonDefinitions !== null && typeof getButtonDefinitions !== "function") {
    throw new TypeError("getButtonDefinitions must be a function");
  }

  return function createItemHost(node, element) {
    let alive = true;
    const showError = (message) => {
      if (!alive) return;
      const warning = node.ownerDocument.createElement("div");
      warning.setAttribute("data-jui-widget-error", "");
      warning.setAttribute("role", "alert");
      warning.style.padding = "12px";
      warning.style.border = "1px solid var(--jui-color-status-error, #c98989)";
      warning.style.borderRadius = "12px";
      warning.style.background = "var(--jui-color-surface-raised, #222)";
      warning.style.color = "var(--jui-color-text-primary, white)";
      warning.style.overflowWrap = "anywhere";
      warning.textContent = "Widget nicht verfügbar: " + message;
      node.replaceChildren(warning);
    };
    node.setAttribute("data-jui-widget-instance", element.ref_id);
    let definition;
    try {
    if (element.kind === "widget") {
      definition = getConfig(element.ref_id);
      if (!definition || typeof definition.module_id !== "string" || !definition.module_id) {
        throw new TypeError(`Missing widget instance definition: ${element.ref_id}`);
      }
      if (definition.module_id === "widget.dynamic-buttons") {
        if (!getButtonDefinitions) throw new TypeError("Dynamic Buttons require central definitions");
        definition = {
          ...definition,
          config: resolveDynamicButtonInstance({
            definitions: getButtonDefinitions(),
            instance: definition.config ?? { buttons: [] },
          }),
        };
      }
    } else if (element.kind === "button") {
      if (!getButtonDefinitions) throw new TypeError("Dashboard buttons require central definitions");
      definition = {
        module_id: "widget.dynamic-buttons",
        config: resolveDynamicButtonInstance({
          definitions: getButtonDefinitions(),
          instance: { buttons: [{ id: element.id, button_id: element.ref_id, size: element.size ?? "normal" }] },
        }),
      };
    } else {
      throw new TypeError(`Unsupported dashboard element kind: ${element.kind}`);
    }
    } catch (error) {
      // A single invalid widget must not prevent its siblings from rendering.
      showError(String(error?.message || error));
      return () => { alive = false; };
    }
    const instanceId = `dashboard:${element.id}`;
    const ready = moduleLoader.load(definition.module_id, {
      instanceId, config: definition.config ?? {},
    }).then((success) => {
      if (!success) {
        showError("Modul " + definition.module_id + " konnte nicht geladen werden");
        return false;
      }
      if (!alive) {
        moduleLoader.destroy(instanceId);
        return false;
      }
      const mounted = moduleLoader.mount(instanceId, node);
      if (!mounted) {
        moduleLoader.destroy(instanceId);
        showError("Modul " + definition.module_id + " konnte nicht angezeigt werden");
      }
      return mounted;
    }).catch((error) => {
      showError(String(error?.message || error));
      return false;
    });
    // Keep async failures from turning unhandled; UI remains the owning grid host.
    void ready;
    return () => {
      alive = false;
      moduleLoader.destroy(instanceId); // Also cancels in-flight loading.
    };
  };
}
