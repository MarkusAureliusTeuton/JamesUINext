import { createHouseSettingsDialog } from "../modules/dashboard-house-settings-dialog.js";
import { createDashboardButtonSettingsDialog } from "../modules/dashboard-button-settings-dialog.js";
import { createWeatherSettingsDialog } from "../modules/dashboard-weather-settings-dialog.js";
import { createWidgetSettingsDialog } from "../modules/dashboard-widget-settings-dialog.js";
import { buildAgendaInstanceConfig } from "../modules/dashboard-widget-configuration.js";
import { createDashboardCatalog, createDashboardCatalogView } from "../modules/dashboard-catalog.js";
import { createDashboardController } from "./dashboard-controller.js";
import { createDashboardEditSession } from "./dashboard-edit-session.js";
import { createDashboardEditorToolbar } from "./dashboard-editor-toolbar.js";
import { createDashboardTouchEditor } from "./dashboard-touch-editor.js";
import { bindDashboardTouchEvents } from "./dashboard-touch-events.js";
import { createDashboardHeroLayout } from "../modules/dashboard-layout-factory.js";
import { createDashboardGrid } from "./dashboard-grid.js";
import { createDashboardWidgetHosts } from "../modules/dashboard-widget-hosts.js";
import { validateDashboardPage } from "./dashboard-config.js";
import { DASHBOARD_EDITOR_STYLES } from "./dashboard-editor-styles.js";

// Page composition owns one layout instance, one grid and the weather hero.
// Its DOM is independent of the persistent Core shell and navigation.
export function createDashboardPageComposer({ document, moduleLoader, getConfig, configService = null, moduleRegistry = null, onConfigCommitted = null } = {}) {
  if (!document || typeof document.createElement !== "function") throw new TypeError("Dashboard composer requires document");
  if (!moduleLoader || typeof moduleLoader.load !== "function") throw new TypeError("Dashboard composer requires Module Loader");
  if (typeof getConfig !== "function") throw new TypeError("Dashboard composer requires getConfig");

  const withWidgetKeys = (elements, config) => elements.map((item) => ({
    ...item,
    config_key: item.kind === "widget" ? JSON.stringify({
      instance: config.widget_instances?.[item.ref_id] ?? null,
      definitions: config.widget_instances?.[item.ref_id]?.module_id === "widget.dynamic-buttons" ? config.dynamic_buttons : null,
    }) : null,
  }));
  let target = null;
  let layout = null;
  let grid = null;
  let hero = null;
  let pageId = null;
  let generation = 0;
  let previewEditor = null;
  let emptyState = null, editorStyles = null;
  let editor = null, toolbar = null, editButton = null, touch = null, unbindTouch = null, gridRoot = null, catalogView = null, settingsDialog = null, weatherSettings = null, buttonSettings = null, houseSettings = null;

  function destroy() {
    generation += 1;
    emptyState?.remove(); emptyState = null;
    editorStyles?.remove(); editorStyles = null;
    houseSettings?.close();
    if (houseSettings?.root?.parentNode) houseSettings.root.parentNode.removeChild(houseSettings.root);
    houseSettings = null;
    buttonSettings?.close();
    if (buttonSettings?.root?.parentNode) buttonSettings.root.parentNode.removeChild(buttonSettings.root);
    buttonSettings = null;
    weatherSettings?.close();
    if (weatherSettings?.root?.parentNode) weatherSettings.root.parentNode.removeChild(weatherSettings.root);
    weatherSettings = null;
    settingsDialog?.close();
    if (settingsDialog?.root?.parentNode) settingsDialog.root.parentNode.removeChild(settingsDialog.root);
    settingsDialog = null;
    unbindTouch?.(); unbindTouch = null;
    touch?.destroy(); touch = null;
    if (toolbar?.root?.parentNode) toolbar.root.parentNode.removeChild(toolbar.root);
    toolbar = null;
    editButton?.remove();
    editButton = null;
    editor = null; gridRoot = null; previewEditor = null;
    if (catalogView?.root?.parentNode) catalogView.root.parentNode.removeChild(catalogView.root);
    catalogView = null;
    grid?.destroy();
    grid = null;
    if (hero) moduleLoader.destroy(hero);
    hero = null;
    layout?.destroy();
    layout = null;
    target = null;
    pageId = null;
  }

  function mount(nextTarget, nextPageId) {
    if (!nextTarget || typeof nextTarget.appendChild !== "function") throw new TypeError("Dashboard composer requires mount target");
    destroy();
    target = nextTarget;
    pageId = nextPageId;
    return render();
  }

  async function render() {
    if (!target) throw new Error("Dashboard composer must be mounted");
    const config = getConfig();
    const page = validateDashboardPage(config, pageId);
    const token = ++generation;
    // A change of layout invalidates all previous element mounts.
    if (layout) {
      emptyState?.remove(); emptyState = null;
      editorStyles?.remove(); editorStyles = null;
      unbindTouch?.(); unbindTouch = null;
      touch?.destroy(); touch = null;
      if (toolbar?.root?.parentNode) toolbar.root.parentNode.removeChild(toolbar.root);
      toolbar = null;
      editButton?.remove();
      editButton = null;
      editor = null; gridRoot = null;
    if (catalogView?.root?.parentNode) catalogView.root.parentNode.removeChild(catalogView.root);
    catalogView = null;
      grid?.destroy();
      grid = null;
      if (hero) moduleLoader.destroy(hero);
      hero = null;
      layout.destroy();
      layout = null;
    }

    if (page.layout.kind === "hero-deck") {
      layout = createDashboardHeroLayout({ hero_ratio: page.layout.hero_ratio });
      layout.mount(target);
      const heroSlot = layout.getSlot("hero");
      const heroRef = config.pages[pageId].hero_widget_id;
      const definition = heroRef ? config.widget_instances[heroRef] : null;
      if (heroRef && !definition) throw new TypeError(`Missing hero widget instance: ${heroRef}`);
      if (definition) {
        hero = `dashboard:${pageId}:hero`;
        const heroId = hero;
        const loading = moduleLoader.load(definition.module_id, { instanceId: heroId, config: definition.config ?? {} });
        const loaded = await loading;
        if (token !== generation) {
          if (loaded) moduleLoader.destroy(heroId);
          return false;
        }
        if (loaded) moduleLoader.mount(heroId, heroSlot);
      }
      if (token !== generation) return false;
    } else {
      const fullRoot = document.createElement("section");
      fullRoot.setAttribute("data-jui-layout", "fullscreen");
      fullRoot.style.height = "100%";
      fullRoot.style.minHeight = "0";
      target.appendChild(fullRoot);
      layout = {
        getSlot: (name) => name === "content" ? fullRoot : null,
        destroy() { if (fullRoot.parentNode) fullRoot.parentNode.removeChild(fullRoot); },
      };
    }

    const gridHost = layout.getSlot("content");
    // Empty-state guidance lives inside the deck rather than obscuring the weather hero.
    gridHost.style.position = "relative";
    const hosts = createDashboardWidgetHosts({
      moduleLoader,
      getConfig: (id) => (editor?.active ? editor.workingConfig() : getConfig()).widget_instances[id],
      getButtonDefinitions: () => (editor?.active ? editor.workingConfig() : getConfig()).dynamic_buttons,
    });
    grid = createDashboardGrid({ document, createItemHost: hosts });
    gridRoot = grid.mount(gridHost);
    editorStyles = document.createElement("style");
    editorStyles.textContent = DASHBOARD_EDITOR_STYLES;
    target.appendChild(editorStyles);
    grid.render(withWidgetKeys(page.elements, config), { scroll: page.layout.scroll });
    if (configService) {
      emptyState = document.createElement("section");
      emptyState.setAttribute("data-jui-dashboard-empty", "");
      const card = document.createElement("div");
      card.setAttribute("data-jui-dashboard-empty-card", "");
      const title = document.createElement("h2");
      title.textContent = "Deine Startseite gestalten";
      const note = document.createElement("p");
      note.textContent = "Füge Kalender, Hausstatus oder Schaltflächen hinzu. Jedes Widget kannst du später individuell einrichten.";
      const add = document.createElement("button");
      add.setAttribute("type", "button");
      add.setAttribute("data-jui-empty-add", "");
      add.textContent = "+ Erstes Widget hinzufügen";
      add.addEventListener("click", () => {
        if (!editor?.active) toolbar?.open();
        showHandles();
        catalogView?.open();
      });
      card.appendChild(title);
      card.appendChild(note);
      card.appendChild(add);
      emptyState.appendChild(card);
      gridHost.appendChild(emptyState);
      updateEmptyState(page.elements);
      attachEditor();
    }
    return true;
  }


  function updateEmptyState(elements) {
    if (!emptyState) return;
    const empty = elements.length === 0;
    emptyState.hidden = !empty;
    emptyState.style.display = empty ? "grid" : "none";
  }

  function showHandles() {
    if (editButton) {
      editButton.hidden = Boolean(editor?.active);
      editButton.style.display = editor?.active ? "none" : "inline-flex";
    }
    if (!gridRoot) return;
    for (const element of gridRoot.querySelectorAll("[data-jui-dashboard-item]")) {
      const existing = element.querySelector("[data-jui-editor-resize]");
      const settings = element.querySelector("[data-jui-editor-settings]");
      const remove = element.querySelector("[data-jui-editor-remove]");
      if (!editor?.active) {
        if (existing?.parentNode) existing.parentNode.removeChild(existing);
        if (settings?.parentNode) settings.parentNode.removeChild(settings);
        if (remove?.parentNode) remove.parentNode.removeChild(remove);
      } else if (!existing) {
        const handle = document.createElement("button");
        handle.setAttribute("type", "button");
        handle.setAttribute("data-jui-editor-resize", "");
        handle.setAttribute("aria-label", "Elementgröße ändern");
        handle.textContent = "↘";
        handle.style.position = "absolute";
        handle.style.right = "0";
        handle.style.bottom = "0";
        handle.style.zIndex = "3";
        element.style.position = "relative";
        element.appendChild(handle);
      }
      if (editor?.active && !remove) {
        const elementId = element.getAttribute("data-jui-dashboard-item");
        const button = document.createElement("button");
        button.setAttribute("type", "button");
        button.setAttribute("data-jui-editor-remove", "");
        button.setAttribute("aria-label", "Element entfernen");
        button.textContent = "×";
        button.style.position = "absolute";
        button.style.top = "0";
        button.style.right = "0";
        button.style.zIndex = "4";
        button.addEventListener("click", (event) => {
          event.stopPropagation?.();
          const next = editor.removeElement(elementId);
          previewEditor?.(next);
        });
        element.appendChild(button);
      }
      if (editor?.active && !settings) {
        const elementId = element.getAttribute("data-jui-dashboard-item");
        const item = editor.snapshot().elements.find((entry) => entry.id === elementId);
        const definition = item?.kind === "widget" ? editor.workingConfig().widget_instances[item.ref_id] : null;
        if (["widget.calendar-agenda", "widget.dynamic-buttons", "widget.house-quick"].includes(definition?.module_id)) {
          const button = document.createElement("button");
          button.setAttribute("type", "button");
          button.setAttribute("data-jui-editor-settings", "");
          button.setAttribute("aria-label", "Widget-Einstellungen");
          button.textContent = "⚙";
          button.addEventListener("click", () => {
            if (definition.module_id === "widget.dynamic-buttons") {
              const config = editor.workingConfig();
              buttonSettings?.open({ instanceId: item.ref_id, instanceConfig: definition.config ?? { buttons: [] }, definitions: config.dynamic_buttons, sources: config.module_settings["provider.control-state"]?.sources ?? [] });
            } else if (definition.module_id === "widget.house-quick") {
              const config = editor.workingConfig();
              houseSettings?.open(item.ref_id, definition.config ?? { buttons: [] }, config.module_settings);
            } else settingsDialog?.open(item.ref_id, definition.config ?? {});
          });
          element.appendChild(button);
        }
      }
    }
  }

  function attachEditor() {
    if (editor) return;
    const controller = createDashboardController({ configService });
    editor = createDashboardEditSession({ controller, configService, pageId });
    const preview = (next) => {
      const config = editor?.active ? editor.workingConfig() : getConfig();
      grid.render(withWidgetKeys(next.elements, config), { scroll: next.layout.scroll });
      updateEmptyState(next.elements);
      showHandles();
      toolbar?.refresh();
    };
    previewEditor = preview;
    toolbar = createDashboardEditorToolbar({
      document, session: editor, onChange: preview,
      onCommitted: async () => { if (onConfigCommitted) await onConfigCommitted(getConfig()); },
      onFinished: () => {
        settingsDialog?.close();
        buttonSettings?.close();
        houseSettings?.close();
        weatherSettings?.close();
        catalogView?.close();
        showHandles();
      },
      onAdd: () => catalogView?.open(),
    });
    // Editor controls and dialogs overlay the page region; a full-height
    // hero must never push them below the navigation into an invisible area.

    target.appendChild(toolbar.root);

    // Permanently accessible edit entry: after the first "Fertig" the page
    // is no longer empty and auto-enter does not run on reload. Without this
    // control users could never edit, add or configure widgets again.
    editButton = document.createElement("button");
    editButton.setAttribute("type", "button");
    editButton.setAttribute("data-jui-open-editor", "");
    editButton.setAttribute("aria-label", "Startseite bearbeiten");
    editButton.textContent = "Bearbeiten";

    editButton.addEventListener("click", () => {
      if (!editor?.active) {
        toolbar.open();
        showHandles();
      }
    });
    target.appendChild(editButton);
    showHandles();

    const placeEditorDialog = (root) => {
      root.setAttribute("data-jui-editor-dialog", "");
      target.appendChild(root);
    };
    weatherSettings = createWeatherSettingsDialog({
      document,
      onSave: async (next) => {
        const saved = await configService.update((latest) => ({
          ...latest,
          module_settings: { ...latest.module_settings, "provider.weather": next },
        }));
        if (saved && onConfigCommitted) await onConfigCommitted(saved);
      },
    });
    const weatherButton = document.createElement("button");
    weatherButton.setAttribute("type", "button");
    weatherButton.setAttribute("data-jui-weather-settings-trigger", "");
    weatherButton.textContent = "Wetter-Datenquelle";
    weatherButton.addEventListener("click", () =>
      weatherSettings.open(getConfig().module_settings["provider.weather"] ?? {}));
    toolbar.root.appendChild(weatherButton);
    placeEditorDialog(weatherSettings.root);
    settingsDialog = createWidgetSettingsDialog({ document, onSave: (id, config) => {
      const next = editor.configureWidget(id, config);
      preview(next);
    } });
    placeEditorDialog(settingsDialog.root);
    buttonSettings = createDashboardButtonSettingsDialog({
      document,
      onSave: async (id, change) => {
        const next = editor.configureDynamicButtons(id, change);
        preview(next);
      },
    });
    placeEditorDialog(buttonSettings.root);
    houseSettings = createHouseSettingsDialog({ document, onSave: (id, change) => {
      const next = editor.configureHouseQuick(id, change);
      preview(next);
    } });
    placeEditorDialog(houseSettings.root);
    if (moduleRegistry) {
      catalogView = createDashboardCatalogView({ document, catalog: createDashboardCatalog({ moduleRegistry }), onSelect: (moduleId, sources) => {
        const config = moduleId === "widget.calendar-agenda"
          ? (id) => buildAgendaInstanceConfig(id, sources)
          : moduleId === "widget.house-quick" || moduleId === "widget.dynamic-buttons"
            ? { buttons: [] } : {};
        const next = editor.addWidget(moduleId, { config });
        if (next) preview(next);
      } });
      placeEditorDialog(catalogView.root);
    }
    touch = createDashboardTouchEditor({ session: editor, onPreview: preview });
    unbindTouch = bindDashboardTouchEvents({
      gridRoot, editor: touch,
      getMetrics: (elementId) => {
        const element = gridRoot.querySelector('[data-jui-dashboard-item="' + elementId + '"]');
        const bounds = element?.getBoundingClientRect?.();
        const elements = editor.active ? editor.snapshot().elements : validateDashboardPage(getConfig(), pageId).elements;
        const item = elements.find((entry) => entry.id === elementId);
        if (!bounds || !item || bounds.width <= 0 || bounds.height <= 0) return null;
        return { columnPixels: bounds.width / item.column_span, rowPixels: bounds.height / item.row_span };
      },
    });
  }

  return Object.freeze({
    mount, render, destroy,
    enterEdit() {
      if (!toolbar) throw new Error("Dashboard editor is not configured");
      toolbar.open(); showHandles();
    },
    get editing() { return editor?.active ?? false; },
  });

}
