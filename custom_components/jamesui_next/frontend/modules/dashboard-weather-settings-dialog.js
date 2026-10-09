import { validateWeatherProviderConfig } from "./provider.weather/config.js";

const FIELDS = Object.freeze([
  ["entity_id", "Wetter-Entität (weather.*)", "weather.home"],
  ["outdoor_temperature_entity_id", "Außentemperatur (optional)", "sensor.outdoor_temperature"],
  ["moon_entity_id", "Mondphase (optional)", "sensor.moon_phase"],
  ["illuminance_entity_id", "Helligkeit (optional)", "sensor.illuminance"],
]);

export function createWeatherSettingsDialog({ document, onSave } = {}) {
  if (!document?.createElement || typeof onSave !== "function") {
    throw new TypeError("Weather settings require document and onSave");
  }
  const root = document.createElement("section");
  root.setAttribute("data-jui-weather-settings", "");
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Wetter-Datenquellen konfigurieren");
  root.hidden = true;
  const heading = document.createElement("h3");
  heading.textContent = "Wetter-Datenquellen";
  root.appendChild(heading);
  const fields = new Map();
  for (const [key, caption, placeholder] of FIELDS) {
    const label = document.createElement("label");
    label.textContent = caption;
    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("aria-label", caption);
    input.setAttribute("placeholder", placeholder);
    label.appendChild(input);
    root.appendChild(label);
    fields.set(key, input);
  }
  const error = document.createElement("p");
  error.setAttribute("role", "alert");
  root.appendChild(error);
  const actions = document.createElement("div");
  let saving = false;
  const close = document.createElement("button");
  close.setAttribute("type", "button");
  close.textContent = "Abbrechen";
  close.addEventListener("click", () => { if (!saving) hide(); });
  actions.appendChild(close);
  const save = document.createElement("button");
  save.setAttribute("type", "button");
  save.textContent = "Übernehmen";
  save.addEventListener("click", async () => {
    if (saving) return;
    try {
      const config = {};
      for (const [key, input] of fields) {
        const value = (input.value ?? "").trim();
        if (value) config[key] = value;
      }
      const validated = validateWeatherProviderConfig(config);
      saving = true;
      save.disabled = true;
      await onSave({ ...validated });
      hide();
    } catch (cause) {
      error.textContent = String(cause?.message ?? cause);
    } finally {
      saving = false;
      save.disabled = false;
    }
  });
  actions.appendChild(save);
  root.appendChild(actions);
  function hide() {
    root.hidden = true;
    error.textContent = "";
  }
  return Object.freeze({
    root,
    open(config = {}) {
      const validated = validateWeatherProviderConfig(config);
      for (const [key, input] of fields) input.value = validated[key] ?? "";
      error.textContent = "";
      root.hidden = false;
    },
    close: hide,
  });
}
