import { validateHouseQuickConfig } from "./widget.house-quick/config.js";
import { validateHouseLightingConfig } from "./provider.house-lighting/config.js";
import { validateHouseHeatingConfig } from "./provider.house-heating/config.js";
import { validateHouseEnergyConfig } from "./provider.house-energy/config.js";
import { validateHouseDevicesConfig } from "./provider.house-devices/config.js";

export const HOUSE_CONFIG_SECTIONS = Object.freeze([
  ["widget", "Hausstatus-Buttons", { buttons: [] }, validateHouseQuickConfig],
  ["provider.house-lighting", "Lichtquellen", { lights: [], ambient_lights: [] }, validateHouseLightingConfig],
  ["provider.house-heating", "Heizzonen", { zones: [] }, validateHouseHeatingConfig],
  ["provider.house-energy", "Energiequellen", { sources: [] }, validateHouseEnergyConfig],
  ["provider.house-devices", "Geräte", { devices: [] }, validateHouseDevicesConfig],
]);

export function validateHouseDashboardSettings(instanceConfig, moduleSettings) {
  const widget = validateHouseQuickConfig(instanceConfig);
  const providers = {};
  for (const [id, , , validate] of HOUSE_CONFIG_SECTIONS.slice(1)) {
    if (moduleSettings[id] !== undefined) providers[id] = validate(moduleSettings[id]);
  }
  for (const item of widget.buttons) {
    const sources = item.type === "heating_zone" ? moduleSettings["provider.house-heating"]?.zones
      : item.type === "energy" ? moduleSettings["provider.house-energy"]?.sources : null;
    if (sources && !sources.some(source => source.id === item.source_id)) throw new TypeError("Unbekannte Datenquelle: " + item.source_id);
    if ((item.type === "heating_zone" || item.type === "energy") && !sources) throw new TypeError("Datenprovider nicht konfiguriert: " + item.type);
    if (["lights", "ambient_lights"].includes(item.type) && !moduleSettings["provider.house-lighting"]) throw new TypeError("Lichtprovider fehlt");
    if (item.type === "devices" && !moduleSettings["provider.house-devices"]) throw new TypeError("Geräteprovider fehlt");
  }
  return { instanceConfig: widget, moduleSettings: providers };
}
