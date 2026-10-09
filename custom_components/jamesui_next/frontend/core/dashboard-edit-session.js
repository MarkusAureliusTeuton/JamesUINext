import { moveDashboardElement, validateDashboardPage } from "./dashboard-config.js";

// Session state is detached from persisted config. Only commit writes.
export function createDashboardEditSession({ controller, configService, pageId, maxRows = null } = {}) {
  if (!controller || typeof controller.previewMove !== "function" || typeof controller.move !== "function") {
    throw new TypeError("edit session requires Dashboard Controller");
  }
  if (!configService || typeof configService.snapshot !== "function") {
    throw new TypeError("edit session requires Config Service");
  }
  if (typeof pageId !== "string" || !pageId) throw new TypeError("pageId is required");
  let working = null;
  let history = [];
  let active = false;
  let busy = false;
  let baseline = null;

  const ensureActive = () => { if (!active) throw new Error("Dashboard editor is not active"); };
  const page = () => validateDashboardPage(working, pageId);
  return Object.freeze({
    enter() {
      if (active) return page();
      const config = configService.snapshot();
      if (!config) throw new Error("JamesUI config must be loaded");
      validateDashboardPage(config, pageId);
      working = config;
      baseline = config;
      history = [];
      active = true;
      return page();
    },
    get active() { return active; },
    get canUndo() { return history.length > 0; },
    snapshot() { ensureActive(); return page(); },
    workingConfig() { ensureActive(); return structuredClone(working); },
    move(elementId, geometry) {
      ensureActive();
      if (busy) throw new Error("Dashboard editor is saving");
      const next = moveDashboardElement(working, pageId, elementId, geometry, { maxRows });
      if (next === null) return null;
      history.push(working);
      working = next;
      return page();
    },
    addWidget(moduleId, { config = {}, columnSpan = 4, rowSpan = 3 } = {}) {
      ensureActive();
      if (busy) throw new Error("Dashboard editor is saving");
      if (typeof moduleId !== "string" || !moduleId.startsWith("widget.")) throw new TypeError("invalid widget module");
      if (!Number.isInteger(columnSpan) || columnSpan < 1 || columnSpan > 12 ||
          !Number.isInteger(rowSpan) || rowSpan < 1) throw new TypeError("invalid widget size");
      const base = moduleId.replace(/[^a-z0-9-]/gi, "-");
      let i = 1;
      while (working.widget_instances[base + "-" + i] ||
             working.pages[pageId].elements.some((item) => item.id === base + "-" + i)) i += 1;
      const id = base + "-" + i;
      const elements = page().elements;
      let row = 0;
      while (elements.some((item) => item.column < columnSpan &&
          item.row < row + rowSpan && item.row + item.row_span > row)) row += 1;
      if (maxRows !== null && row + rowSpan > maxRows) return null;
      const initialConfig = typeof config === "function" ? config(id) : config;
      if (!initialConfig || typeof initialConfig !== "object" || Array.isArray(initialConfig)) throw new TypeError("Widget config must be an object");
      history.push(working);
      working = {
        ...working,
        widget_instances: { ...working.widget_instances,
          [id]: { module_id: moduleId, config: structuredClone(initialConfig) } },
        pages: { ...working.pages,
          [pageId]: { ...working.pages[pageId], elements: [
            ...working.pages[pageId].elements,
            { id, kind: "widget", ref_id: id, column: 0, row,
              column_span: columnSpan, row_span: rowSpan },
          ] } },
      };
      return page();
    },
    configureWidget(instanceId, config) {
      ensureActive();
      if (busy) throw new Error("Dashboard editor is saving");
      const instance = working.widget_instances[instanceId];
      if (!instance) throw new TypeError("Unknown widget instance: " + instanceId);
      if (!working.pages[pageId].elements.some((item) => item.kind === "widget" && item.ref_id === instanceId)) {
        throw new TypeError("Widget does not belong to this dashboard");
      }
      if (!config || typeof config !== "object" || Array.isArray(config)) throw new TypeError("Widget config must be an object");
      const nextConfig = structuredClone(config);
      history.push(working);
      working = {
        ...working,
        widget_instances: {
          ...working.widget_instances,
          [instanceId]: { ...instance, config: nextConfig },
        },
      };
      return page();
    },
    configureHouseQuick(instanceId, change) {
      ensureActive();
      if (busy) throw new Error("Dashboard editor is saving");
      const instance = working.widget_instances[instanceId];
      if (instance?.module_id !== "widget.house-quick" ||
          !working.pages[pageId].elements.some(item => item.kind === "widget" && item.ref_id === instanceId)) {
        throw new TypeError("House widget does not belong to this dashboard");
      }
      history.push(working);
      working = {
        ...working,
        module_settings: { ...working.module_settings, ...structuredClone(change.moduleSettings) },
        widget_instances: { ...working.widget_instances,
          [instanceId]: { ...instance, config: structuredClone(change.instanceConfig) } },
      };
      return page();
    },
    removeElement(elementId) {
      ensureActive();
      if (busy) throw new Error("Dashboard editor is saving");
      const target = working.pages[pageId].elements.find(item => item.id === elementId);
      if (!target) throw new TypeError("Unknown dashboard element: " + elementId);
      history.push(working);
      const elements = working.pages[pageId].elements.filter(item => item.id !== elementId);
      const instances = { ...working.widget_instances };
      if (target.kind === "widget") {
        const usedElsewhere = Object.values(working.pages).some((other, id) =>
          id !== pageId && other?.elements?.some(item => item.kind === "widget" && item.ref_id === target.ref_id));
        const usedHere = elements.some(item => item.kind === "widget" && item.ref_id === target.ref_id);
        if (!usedElsewhere && !usedHere && working.pages[pageId].hero_widget_id !== target.ref_id) delete instances[target.ref_id];
      }
      working = { ...working, widget_instances: instances,
        pages: { ...working.pages, [pageId]: { ...working.pages[pageId], elements } } };
      return page();
    },
    configureDynamicButtons(instanceId, change) {
      ensureActive();
      if (busy) throw new Error("Dashboard editor is saving");
      const instance = working.widget_instances[instanceId];
      if (instance?.module_id !== "widget.dynamic-buttons") throw new TypeError("Not a Dynamic Buttons widget");
      if (!working.pages[pageId].elements.some((item) => item.kind === "widget" && item.ref_id === instanceId)) {
        throw new TypeError("Widget does not belong to this dashboard");
      }
      if (!change.definitions) {
        history.push(working);
        working = {
          ...working,
          widget_instances: { ...working.widget_instances,
            [instanceId]: { ...instance, config: structuredClone(change.instanceConfig) } },
        };
        return page();
      }
      const sourceId = change.buttonId;
      const sources = (working.module_settings["provider.control-state"]?.sources ?? [])
        .filter((source) => source.id !== sourceId);
      if (change.stateSource) sources.push(change.stateSource);
      history.push(working);
      working = {
        ...working,
        dynamic_buttons: structuredClone(change.definitions),
        module_settings: { ...working.module_settings, "provider.control-state": { sources } },
        widget_instances: { ...working.widget_instances,
          [instanceId]: { ...instance, config: structuredClone(change.instanceConfig) } },
      };
      return page();
    },
    undo() {
      ensureActive();
      if (busy) throw new Error("Dashboard editor is saving");
      if (!history.length) return null;
      working = history.pop();
      return page();
    },
    async save() {
      ensureActive();
      if (busy) throw new Error("Dashboard editor is saving");
      busy = true;
      try {
        // Replay only the edited page placements onto the current serialized
        // Config Service snapshot; preserve unrelated latest config sections.
        const desired = page();
        const result = await configService.update((latest) => {
          const previous = validateDashboardPage(latest, pageId);
          const original = validateDashboardPage(baseline, pageId);
          if (previous.elements.length !== original.elements.length ||
              previous.elements.some((item, index) =>
                item.id !== original.elements[index].id ||
                item.ref_id !== original.elements[index].ref_id ||
                item.kind !== original.elements[index].kind)) {
            throw new Error("Dashboard changed externally during editing");
          }
          const modified = Object.fromEntries(
            Object.entries(working.widget_instances).filter(([id, instance]) =>
              id in baseline.widget_instances && JSON.stringify(instance) !== JSON.stringify(baseline.widget_instances[id])));
          if (Object.keys(modified).some((id) =>
            JSON.stringify(latest.widget_instances[id]) !== JSON.stringify(baseline.widget_instances[id]))) {
            throw new Error("Widget configuration changed externally");
          }
          const added = Object.fromEntries(
            Object.entries(working.widget_instances).filter(([id]) =>
              !(id in baseline.widget_instances)));
          if (Object.keys(added).some((id) => id in latest.widget_instances)) {
            throw new Error("Widget instance ID changed externally");
          }
          const houseKeys = ["provider.house-lighting", "provider.house-heating", "provider.house-energy", "provider.house-devices"];
          const houseChanges = houseKeys.filter(key => JSON.stringify(working.module_settings[key]) !== JSON.stringify(baseline.module_settings[key]));
          if (houseChanges.some(key => JSON.stringify(latest.module_settings[key]) !== JSON.stringify(baseline.module_settings[key]))) {
            throw new Error("House provider settings changed externally");
          }
          const removedInstances = Object.keys(baseline.widget_instances).filter(id => !(id in working.widget_instances));
          if (removedInstances.some(id => JSON.stringify(latest.widget_instances[id]) !== JSON.stringify(baseline.widget_instances[id]))) {
            throw new Error("Removed widget changed externally");
          }
          const buttonSectionsChanged =
            JSON.stringify(working.dynamic_buttons) !== JSON.stringify(baseline.dynamic_buttons) ||
            JSON.stringify(working.module_settings["provider.control-state"]) !==
              JSON.stringify(baseline.module_settings["provider.control-state"]);
          if (buttonSectionsChanged && (
            JSON.stringify(latest.dynamic_buttons) !== JSON.stringify(baseline.dynamic_buttons) ||
            JSON.stringify(latest.module_settings["provider.control-state"]) !==
              JSON.stringify(baseline.module_settings["provider.control-state"])
          )) throw new Error("Button settings changed externally");
          return {
            ...latest,
            dynamic_buttons: buttonSectionsChanged ? structuredClone(working.dynamic_buttons) : latest.dynamic_buttons,
            module_settings: { ...latest.module_settings,
              ...(buttonSectionsChanged ? { "provider.control-state": structuredClone(working.module_settings["provider.control-state"]) } : {}),
              ...Object.fromEntries(houseChanges.map(key => [key, structuredClone(working.module_settings[key])])),
            },
            widget_instances: Object.fromEntries(Object.entries({ ...latest.widget_instances, ...added, ...modified }).filter(([id]) => !removedInstances.includes(id))),
            pages: { ...latest.pages,
              [pageId]: { ...latest.pages[pageId],
                elements: structuredClone(working.pages[pageId].elements) } },
          };
        });
        if (result !== null) {
          working = result;
          baseline = result;
          history = [];
        }
        return result === null ? null : page();
      } finally {
        busy = false;
      }
    },
    finish() {
      ensureActive();
      if (busy) throw new Error("Dashboard editor is saving");
      active = false;
      working = null;
      history = [];
    },
  });
}
