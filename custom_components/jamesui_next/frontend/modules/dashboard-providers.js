import { MANIFEST as WEATHER } from "./provider.weather/manifest.js";
import { MANIFEST as CALENDAR } from "./provider.calendar/manifest.js";
import { MANIFEST as TASKS } from "./provider.tasks/manifest.js";
import { MANIFEST as LIGHTING } from "./provider.house-lighting/manifest.js";
import { MANIFEST as HEATING } from "./provider.house-heating/manifest.js";
import { MANIFEST as ENERGY } from "./provider.house-energy/manifest.js";
import { MANIFEST as DEVICES } from "./provider.house-devices/manifest.js";
import { MANIFEST as CONTROL } from "./provider.control-state/manifest.js";

const PROVIDERS = Object.freeze([
  [WEATHER, "provider.weather"],
  [CALENDAR, "provider.calendar"],
  [TASKS, "provider.tasks"],
  [LIGHTING, "provider.house-lighting"],
  [HEATING, "provider.house-heating"],
  [ENERGY, "provider.house-energy"],
  [DEVICES, "provider.house-devices"],
  [CONTROL, "provider.control-state"],
]);
const EMPTY_CONFIG_PROVIDERS = new Set(["provider.weather", "provider.calendar", "provider.tasks"]);

export function registerDashboardProviders(registry, baseUrl = import.meta.url) {
  if (!registry || typeof registry.register !== "function") throw new TypeError("Module registry is required");
  for (const [manifest, folder] of PROVIDERS) {
    registry.register(manifest, { entryUrl: new URL("./" + folder + "/index.js", baseUrl).href });
  }
}

export function resolveDashboardProviderSettings(config = {}) {
  const settings = { ...(config.module_settings ?? {}) };
  const calendars = new Set(settings["provider.calendar"]?.source_entity_ids ?? []);
  const tasks = new Set(settings["provider.tasks"]?.source_entity_ids ?? []);
  for (const instance of Object.values(config.widget_instances ?? {})) {
    if (instance?.module_id !== "widget.calendar-agenda") continue;
    const options = instance.config ?? {};
    if (options.calendar_enabled !== false) {
      for (const item of options.calendars ?? []) calendars.add(item.entity_id);
    }
    if (options.tasks_enabled !== false) {
      for (const item of options.task_lists ?? []) tasks.add(item.entity_id);
    }
  }
  settings["provider.calendar"] = { source_entity_ids: [...calendars] };
  settings["provider.tasks"] = { source_entity_ids: [...tasks] };
  return settings;
}

export async function startDashboardProviders(loader, config) {
  if (!loader || typeof loader.load !== "function" || typeof loader.mount !== "function") {
    throw new TypeError("Module loader is required");
  }
  const settings = resolveDashboardProviderSettings(config);
  const started = [];
  for (const [manifest] of PROVIDERS) {
    const id = manifest.id;
    const options = settings[id];
    if (options === undefined && !EMPTY_CONFIG_PROVIDERS.has(id)) continue;
    const success = await loader.load(id, { config: options ?? {} });
    if (!success || !loader.mount(id, null)) {
      for (const startedId of started.reverse()) loader.destroy(startedId);
      throw new Error("Provider failed to start: " + id);
    }
    started.push(id);
  }
  return () => {
    for (const id of started.reverse()) loader.destroy(id);
  };
}
