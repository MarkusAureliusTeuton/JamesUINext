import { HOUSE_CONFIG_SECTIONS, validateHouseDashboardSettings } from "./dashboard-house-settings.js";

export function createHouseSettingsDialog({ document, onSave } = {}) {
  if (!document?.createElement || typeof onSave !== "function") throw new TypeError("Hausstatus-Dialog benötigt Dokument und Speichern");
  const root = document.createElement("section");
  root.setAttribute("data-jui-house-settings", "");
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Hausstatus und Datenquellen");
  root.hidden = true;
  const heading = document.createElement("h3");
  heading.textContent = "Hausstatus und Datenquellen";
  root.appendChild(heading);
  const fields = new Map();
  for (const [key, caption] of HOUSE_CONFIG_SECTIONS) {
    const label = document.createElement("label");
    label.textContent = caption + " (JSON)";
    const input = document.createElement("textarea");
    input.setAttribute("aria-label", caption);
    input.setAttribute("rows", "5");
    label.appendChild(input);
    root.appendChild(label);
    fields.set(key, input);
  }
  const error = document.createElement("p");
  error.setAttribute("role", "alert");
  root.appendChild(error);
  let instanceId = null;
  let saving = false;
  let initialSettings = null;
  const cancel = document.createElement("button");
  cancel.setAttribute("type", "button");
  cancel.textContent = "Abbrechen";
  cancel.addEventListener("click", () => { if (!saving) close(); });
  root.appendChild(cancel);
  const save = document.createElement("button");
  save.setAttribute("type", "button");
  save.textContent = "Übernehmen";
  save.addEventListener("click", async () => {
    if (saving || !instanceId) return;
    try {
      let widget;
      const settings = {};
      for (const [key, , fallback] of HOUSE_CONFIG_SECTIONS) {
        const data = JSON.parse(fields.get(key).value);
        if (key === "widget") widget = data;
        else if (initialSettings[key] !== undefined || JSON.stringify(data) !== JSON.stringify(fallback)) settings[key] = data;
      }
      const validated = validateHouseDashboardSettings(widget, settings);
      saving = true;
      save.disabled = true;
      await onSave(instanceId, validated);
      close();
    } catch (cause) {
      error.textContent = String(cause?.message ?? cause);
    } finally {
      saving = false;
      save.disabled = false;
    }
  });
  root.appendChild(save);
  function close() {
    instanceId = null;
    initialSettings = null;
    root.hidden = true;
    error.textContent = "";
  }
  return Object.freeze({
    root, close,
    open(id, config, settings = {}) {
      instanceId = id;
      initialSettings = structuredClone(settings);
      for (const [key, , fallback] of HOUSE_CONFIG_SECTIONS) {
        fields.get(key).value = JSON.stringify(key === "widget" ? config : settings[key] ?? fallback, null, 2);
      }
      error.textContent = "";
      root.hidden = false;
    },
  });
}
