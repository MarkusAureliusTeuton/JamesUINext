import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { chromium } from "playwright";

const frontend = resolve("custom_components/jamesui_next/frontend");
const mime = { ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".css": "text/css" };

const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  if (url.pathname === "/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end('<!doctype html><html lang="de"><meta name="viewport" content="width=device-width, initial-scale=1"><script src="/jamesui_next_static/jamesui-next-entry.js"></script><body></body></html>');
    return;
  }
  const prefix = "/jamesui_next_static/";
  if (!url.pathname.startsWith(prefix)) {
    response.writeHead(404);
    response.end();
    return;
  }
  // Resolve only paths belonging to this standalone integration.
  const actual = resolve(frontend, url.pathname.slice(prefix.length));
  if (!actual.startsWith(frontend + sep)) {
    response.writeHead(403);
    response.end();
    return;
  }
  try {
    const data = await readFile(actual);
    response.writeHead(200, { "content-type": mime[extname(actual)] || "application/octet-stream" });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end();
  }
});

await new Promise((done) => server.listen(0, "127.0.0.1", done));
const address = server.address();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 960, height: 1440 }, deviceScaleFactor: 1.5 });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto("http://127.0.0.1:" + address.port + "/");
  await page.waitForFunction(() => Boolean(customElements.get("jamesui-next-panel")));
  await page.evaluate(() => {
    const config = {
      schema_version: 1,
      pages: { home: { kind: "dashboard", layout_id: "main", hero_widget_id: "home_weather", elements: [] } },
      layouts: { main: { kind: "hero-deck", scroll: "fixed", hero_ratio: 0.42 } },
      widget_instances: { home_weather: { module_id: "widget.weather-today", config: {} } },
      dynamic_buttons: {},
      data_sources: {},
      module_settings: { "provider.weather": { entity_id: "weather.home" } },
    };
    const remote = { config, revisionIndex: 0, writes: 0 };
    const revision = () => String(remote.revisionIndex).padStart(64, "0");
    window.__nextTest = remote;
    const hass = {
      connected: true,
      states: {
        "weather.home": {
          entity_id: "weather.home",
          state: "sunny",
          attributes: { friendly_name: "Wetter", temperature: 19, humidity: 50, forecast: [] },
        },
        "sun.sun": { entity_id: "sun.sun", state: "above_horizon", attributes: { elevation: 25 } },
      },
      config: { time_zone: "Europe/Berlin", location_name: "Zuhause" },
      connection: { subscribeMessage: async () => () => {} },
      callService: async () => {},
      async callWS(message) {
        if (message.type === "jamesui_next/config/get") {
          return { config: structuredClone(remote.config), revision: revision() };
        }
        if (message.type === "jamesui_next/config/replace") {
          if (message.expected_revision !== revision()) throw new Error("config_conflict");
          remote.config = structuredClone(message.config);
          remote.writes += 1;
          remote.revisionIndex += 1;
          return { config: structuredClone(remote.config), revision: revision() };
        }
        if (message.type === "weather/get_forecasts") return {};
        throw new Error("Unexpected HA WebSocket request: " + message.type);
      },
    };
    const panel = document.createElement("jamesui-next-panel");
    document.body.appendChild(panel);
    panel.hass = hass;
  });
  const root = page.locator("jamesui-next-panel");
  await root.locator('[data-jui-layout="home-hero-deck"]').waitFor({ timeout: 15000 });
  await root.locator('[data-jui-editor-toolbar]').waitFor();
  await page.waitForFunction(() => {
    const toolbar = document.querySelector("jamesui-next-panel")?.shadowRoot?.querySelector("[data-jui-editor-toolbar]");
    return toolbar && !toolbar.hidden;
  });
  const nav = await page.evaluate(() => [...document.querySelector("jamesui-next-panel").shadowRoot.querySelectorAll('[data-role="bottom-navigation"] button')]
    .map((button) => ({ route: button.dataset.routeId, disabled: button.disabled })));
  assert.deepEqual(nav, [
    { route: "home", disabled: false },
    { route: "house", disabled: true },
    { route: "climate", disabled: true },
    { route: "media", disabled: true },
    { route: "door", disabled: true },
  ]);
  await root.locator('[data-jui-editor-toolbar] button').filter({ hasText: "+ Hinzufügen" }).click();
  await root.locator('[data-jui-catalog-module="widget.dynamic-buttons"]').click();
  await root.locator('[data-jui-editor-toolbar] button').filter({ hasText: "Fertig" }).click();
  await page.waitForFunction(() => window.__nextTest?.writes === 1);
  const saved = await page.evaluate(() => structuredClone(window.__nextTest.config));
  assert.equal(saved.pages.home.elements.length, 1);
  assert.equal(saved.pages.home.elements[0].kind, "widget");
  assert.equal(saved.widget_instances[saved.pages.home.elements[0].ref_id].module_id, "widget.dynamic-buttons");
  await root.locator('[data-jui-widget="dynamic-buttons"]').waitFor({ state: "visible", timeout: 10000 });

  // A populated dashboard must remain editable after "Fertig". Earlier
  // builds entered edit mode only on an empty page and stranded users here.
  const editAgain = root.locator("[data-jui-open-editor]");
  await editAgain.waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const toolbar = document.querySelector("jamesui-next-panel")?.shadowRoot?.querySelector("[data-jui-editor-toolbar]");
    return toolbar && getComputedStyle(toolbar).display === "none";
  });
  await editAgain.click();
  await root.locator('[data-jui-editor-toolbar] button').filter({ hasText: "+ Hinzufügen" }).click();
  const catalog = root.locator("[data-jui-dashboard-catalog]");
  await catalog.locator('input[aria-label="Kalender-Entitäten"]').fill("calendar.family");
  await catalog.locator('[data-jui-catalog-module="widget.calendar-agenda"]').click();
  await root.locator('[data-jui-editor-toolbar] button').filter({ hasText: "Fertig" }).click();
  await page.waitForFunction(() => window.__nextTest?.writes === 2);
  let configured = await page.evaluate(() => structuredClone(window.__nextTest.config));
  const agenda = configured.pages.home.elements.find(item =>
    configured.widget_instances[item.ref_id]?.module_id === "widget.calendar-agenda");
  assert.ok(agenda, "Agenda widget must persist after the second save");
  assert.equal(configured.widget_instances[agenda.ref_id].config.calendars[0].entity_id, "calendar.family");
  await root.locator('[data-jui-widget="calendar-agenda"]').waitFor({ state: "visible", timeout: 10000 });

  // The same widget must be independently configurable on the next edit.
  await editAgain.click();
  await root.locator('[data-jui-dashboard-item="' + agenda.id + '"] [data-jui-editor-settings]').click();
  await root.locator('[data-jui-widget-settings] input[aria-label="Aufgaben-Entitäten"]').fill("todo.shopping");
  await root.locator('[data-jui-widget-settings] button').filter({ hasText: "Übernehmen" }).click();
  await root.locator('[data-jui-editor-toolbar] button').filter({ hasText: "Fertig" }).click();
  await page.waitForFunction(() => window.__nextTest?.writes === 3);
  configured = await page.evaluate(() => structuredClone(window.__nextTest.config));
  assert.equal(configured.widget_instances[agenda.ref_id].config.task_lists[0].entity_id, "todo.shopping");
  assert.equal(await root.locator('[data-jui-widget="calendar-agenda"]').count(), 1);
  await editAgain.waitFor({ state: "visible" });
  assert.deepEqual(errors, [], "Unexpected browser errors");
  console.log("JamesUI Next Chromium portrait boot, re-edit, add, settings and three durable saves: PASS");
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
