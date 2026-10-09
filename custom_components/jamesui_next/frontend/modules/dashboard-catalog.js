// Deterministic catalog of installed widget modules. Descriptions and
// defaults come from registered module metadata; no fabricated device data.
export function createDashboardCatalog({ moduleRegistry } = {}) {
  if (!moduleRegistry || typeof moduleRegistry.get !== "function") {
    throw new TypeError("Dashboard catalog requires Module Registry");
  }
  const known = [
    ["widget.weather-today", "Wetter"],
    ["widget.calendar-agenda", "Kalender und Aufgaben"],
    ["widget.house-quick", "Hausstatus"],
    ["widget.dynamic-buttons", "Dynamische Buttons"],
  ];
  return Object.freeze({
    entries() {
      return known.filter(([id]) => moduleRegistry.get(id)?.manifest?.type === "widget")
        .map(([id, title]) => Object.freeze({ module_id: id, title }));
    },
  });
}

export function createDashboardCatalogView({ document, catalog, onSelect } = {}) {
  if (!document?.createElement || !catalog?.entries || typeof onSelect !== "function") {
    throw new TypeError("Dashboard catalog view requires document, catalog and onSelect");
  }
  const root = document.createElement("section");
  root.setAttribute("data-jui-dashboard-catalog", "");
  root.hidden = true;
  const error = document.createElement("p");
  error.setAttribute("data-jui-catalog-error", "");
  const close = document.createElement("button");
  close.setAttribute("type", "button");
  close.textContent = "Schließen";
  close.addEventListener("click", () => { root.hidden = true; });
  root.appendChild(close);
  root.appendChild(error);
  return Object.freeze({
    root,
    open() {
      error.textContent = "";
      for (const child of [...root.children]) if (child !== close && child !== error) root.removeChild(child);
      for (const item of catalog.entries()) {
        const button = document.createElement("button");
        button.setAttribute("type", "button");
        button.setAttribute("data-jui-catalog-module", item.module_id);
        button.textContent = item.title;
        if (item.module_id === "widget.calendar-agenda") {
          const calendar = document.createElement("input");
          calendar.placeholder = "calendar.familie, calendar.privat";
          calendar.setAttribute("aria-label", "Kalender-Entitäten");
          const tasks = document.createElement("input");
          tasks.placeholder = "todo.einkauf";
          tasks.setAttribute("aria-label", "Aufgaben-Entitäten");
          button.addEventListener("click", () => {
            try { onSelect(item.module_id, { calendars: calendar.value, tasks: tasks.value }); root.hidden = true; }
            catch (cause) { error.textContent = cause.message; }
          });
          root.appendChild(calendar);
          root.appendChild(tasks);
        } else {
          button.addEventListener("click", () => {
            try { onSelect(item.module_id, {}); root.hidden = true; }
            catch (cause) { error.textContent = cause.message; }
          });
        }
        root.appendChild(button);
      }
      root.hidden = false;
    },
    close() { root.hidden = true; },
  });
}
