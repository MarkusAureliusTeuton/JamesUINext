import { createDashboardRouteHost } from "./modules/dashboard-route-host.js";
import { registerDashboardProviders, startDashboardProviders, createDashboardProviderUpdater } from "./modules/dashboard-providers.js";
import { createJamesUICore } from "./core/index.js";
import { createDashboardPageComposer } from "./core/dashboard-page-composer.js";
import { MANIFEST as WEATHER } from "./modules/widget.weather-today/manifest.js";
import { MANIFEST as AGENDA } from "./modules/widget.calendar-agenda/manifest.js";
import { MANIFEST as HOUSE } from "./modules/widget.house-quick/manifest.js";
import { MANIFEST as TASK_UPDATE } from "./modules/action.task-update/manifest.js";
import { MANIFEST as BUTTONS } from "./modules/widget.dynamic-buttons/manifest.js";

// Explicit opt-in preview. Neither the r11 panel nor its bootstrap imports this.
export function createJamesUINextPreview({ document = globalThis.document } = {}) {
  const core = createJamesUICore({ document });
  let providerUpdater = null;
  const composer = createDashboardPageComposer({
    document, moduleLoader: core.moduleLoader, moduleRegistry: core.moduleRegistry,
    configService: core.config, getConfig: () => core.config.snapshot(),
    onConfigCommitted: (config) => providerUpdater?.update(config),
  });
  const registered = [
    [WEATHER, "./modules/widget.weather-today/index.js"],
    [AGENDA, "./modules/widget.calendar-agenda/index.js"],
    [HOUSE, "./modules/widget.house-quick/index.js"],
    [BUTTONS, "./modules/widget.dynamic-buttons/index.js"],
    [TASK_UPDATE, "./modules/action.task-update/index.js"],
  ];
  for (const [manifest, relative] of registered) {
    core.moduleRegistry.register(manifest, {
      entryUrl: new URL(relative, import.meta.url).href,
    });
  }
  registerDashboardProviders(core.moduleRegistry);
  const routes = createDashboardRouteHost({ core, composer, getConfig: () => core.config.snapshot() });
  let stopProviders = null;
  let taskActionStarted = false;
  let mounted = false;
  let disposed = false;
  let startupGeneration = 0;
  const assertCurrent = (token) => {
    if (disposed || token !== startupGeneration) throw new Error("JamesUI Next startup cancelled");
  };
  return Object.freeze({
    async mount(target) {
      if (mounted || disposed) throw new Error("Preview is already mounted or destroyed");
      const token = ++startupGeneration;
      try {
        await core.config.load();
        assertCurrent(token);
        const config = core.config.snapshot();
        if (!config?.pages?.home || config.pages.home.kind !== "dashboard") {
          throw new Error("No configured JamesUI Next dashboard. Existing r11 data is not auto-migrated.");
        }
        if (!await core.moduleLoader.load(TASK_UPDATE.id, { config: {} }) || !core.moduleLoader.mount(TASK_UPDATE.id, null)) {
          throw new Error("Task action failed to start");
        }
        taskActionStarted = true;
        const stop = await startDashboardProviders(core.moduleLoader, config);
        if (disposed || token !== startupGeneration) {
          stop();
          assertCurrent(token);
        }
        stopProviders = stop;
        providerUpdater = createDashboardProviderUpdater(core.moduleLoader, config);
        core.mount(target);
        await routes.mount(target);
        assertCurrent(token);
        mounted = true;
        return true;
      } catch (error) {
        // Partial startup must not leave mounted widgets, shell or providers behind.
        if (!disposed) {
          disposed = true;
          ++startupGeneration;
        }
        routes.destroy();
        providerUpdater?.destroy();
        providerUpdater = null;
        stopProviders?.();
        stopProviders = null;
        if (taskActionStarted) core.moduleLoader.destroy(TASK_UPDATE.id);
        taskActionStarted = false;
        core.destroy();
        throw error;
      }
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      ++startupGeneration;
      routes.destroy();
      providerUpdater?.destroy();
      providerUpdater = null;
      stopProviders?.();
      stopProviders = null;
      if (taskActionStarted) core.moduleLoader.destroy(TASK_UPDATE.id);
      taskActionStarted = false;
      core.destroy();
      mounted = false;
    },
    get core() { return core; },
  });
}
