import { buildAgendaInstanceConfig, agendaConfigAsText } from "./dashboard-widget-configuration.js";

export function createWidgetSettingsDialog({ document, onSave } = {}) {
  if (!document?.createElement || typeof onSave !== "function") throw new TypeError("Widget settings dialog needs document and onSave");
  const root = document.createElement("section");
  root.setAttribute("data-jui-widget-settings", "");
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Widget-Einstellungen");
  root.hidden = true;
  const title = document.createElement("h3");
  title.textContent = "Kalender und Aufgaben";
  root.appendChild(title);
  const field = (caption) => {
    const label = document.createElement("label");
    label.textContent = caption;
    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("aria-label", caption);
    label.appendChild(input);
    root.appendChild(label);
    return input;
  };
  const calendars = field("Kalender-Entitäten");
  const tasks = field("Aufgaben-Entitäten");
  const error = document.createElement("p");
  error.setAttribute("role", "alert");
  root.appendChild(error);
  const buttons = document.createElement("div");
  const action = (caption, callback) => {
    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.textContent = caption;
    button.addEventListener("click", callback);
    buttons.appendChild(button);
    return button;
  };
  let current = null;
  action("Abbrechen", () => { root.hidden = true; current = null; error.textContent = ""; });
  action("Übernehmen", () => {
    if (!current) return;
    try {
      const next = buildAgendaInstanceConfig(current.id, { calendars: calendars.value, tasks: tasks.value });
      // Retain presentation, filtering and visual options not exposed by this form.
      const config = { ...current.config, ...next };
      onSave(current.id, config);
      root.hidden = true;
      current = null;
      error.textContent = "";
    } catch (cause) {
      error.textContent = String(cause?.message ?? cause);
    }
  });
  root.appendChild(buttons);
  return Object.freeze({
    root,
    open(instanceId, config) {
      if (typeof instanceId !== "string" || !instanceId) throw new TypeError("Instance ID required");
      const fields = agendaConfigAsText(config);
      current = { id: instanceId, config: structuredClone(config) };
      calendars.value = fields.calendars;
      tasks.value = fields.tasks;
      error.textContent = "";
      root.hidden = false;
    },
    close() { root.hidden = true; current = null; error.textContent = ""; },
  });
}
