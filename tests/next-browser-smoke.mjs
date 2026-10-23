import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { chromium } from "playwright";

const frontend = resolve("custom_components/jamesui_next/frontend");
const mime = { ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".css": "text/css" };

const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  if (url.pathname === "/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end('<!doctype html><html lang="de"><meta name="viewport" content="width=device-width, initial-scale=1"><script src="/jamesui_next_static/jamesui-next-entry.js"></script><body style="margin:0;padding:0;height:100dvh;overflow:hidden"></body></html>');
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
    window.__nextHass = hass;
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
  // Geometry, not just existence: widget guidance and controls must occupy
  // the visible deck and be reachable at native touch sizes.
  const empty = root.locator("[data-jui-dashboard-empty]");
  await empty.waitFor({ state: "visible" });
  const heroBounds = await root.locator('[data-jui-layout-region="hero"]').boundingBox();
  const emptyBounds = await empty.boundingBox();
  assert.ok(emptyBounds && heroBounds && emptyBounds.y >= heroBounds.y + heroBounds.height - 35,
    "Empty state must stay inside the widget deck, not cover weather");
  assert.ok(emptyBounds.x >= 0 && emptyBounds.x + emptyBounds.width <= 960,
    "Empty state must fit the portrait viewport");
  const navBounds = await root.locator('[data-role="bottom-navigation"]').boundingBox();
  assert.ok(navBounds && navBounds.y + navBounds.height <= 1441 && navBounds.height >= 65,
    "Navigation must be completely visible, legible and touchable: " + JSON.stringify(navBounds));
  const addBounds = await root.locator('[data-jui-editor-toolbar] button').filter({ hasText: "+ Hinzufügen" }).boundingBox();
  assert.ok(addBounds && addBounds.height >= 44, "Editor actions need a >=44px touch target");
  const factsFont = await root.locator('[data-jui-weather-fact-label]').first().evaluate(
    element => parseFloat(getComputedStyle(element).fontSize));
  assert.ok(factsFont >= 12, "Weather details must not shrink below 12px");
  assert.equal(await root.locator('[role="status"]').count(), 0,
    "No startup/waiting message after dashboard is ready");

  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/jamesui-next-empty-tablet.png", fullPage: true });

  const nav = await page.evaluate(() => [...document.querySelector("jamesui-next-panel").shadowRoot.querySelectorAll('[data-role="bottom-navigation"] button')]
    .map((button) => ({ route: button.dataset.routeId, disabled: button.disabled })));
  assert.deepEqual(nav, [{ route: "home", disabled: false }]);
  assert.equal(await root.locator('[data-jui-open-settings]').count(), 1);
  assert.equal(await root.locator('[data-role="bottom-navigation"]').getAttribute("data-jui-nav-mode"), "distributed");
  await root.locator('[data-jui-empty-add]').click();
  const catalogDialog = root.locator("[data-jui-dashboard-catalog]");
  await catalogDialog.waitFor({ state: "visible" });
  const dialogBounds = await catalogDialog.boundingBox();
  assert.ok(dialogBounds && dialogBounds.width >= 300 && dialogBounds.height >= 240,
    "Widget catalog must open as a usable settings panel");
  await root.locator('[data-jui-catalog-module="widget.dynamic-buttons"]').click();
  await root.locator('[data-jui-editor-toolbar] button').filter({ hasText: "Fertig" }).click();
  await page.waitForFunction(() => window.__nextTest?.writes === 1);
  assert.equal(await empty.isVisible(), false, "Onboarding must disappear when widgets exist");
  const saved = await page.evaluate(() => structuredClone(window.__nextTest.config));
  assert.equal(saved.pages.home.elements.length, 1);
  assert.equal(saved.pages.home.elements[0].kind, "widget");
  assert.equal(saved.widget_instances[saved.pages.home.elements[0].ref_id].module_id, "widget.dynamic-buttons");
  await root.locator('[data-jui-widget="dynamic-buttons"]').waitFor({ state: "visible", timeout: 10000 });
  await root.locator('[data-jui-dynamic-empty]').waitFor({ state: "visible", timeout: 10000 });

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
  const agendaBounds = await root.locator('[data-jui-widget="calendar-agenda"]').boundingBox();
  assert.ok(agendaBounds && agendaBounds.height >= 250,
    "A newly added Agenda must have enough room to display entries");
  assert.equal(await root.locator('[data-jui-agenda-too-small]').count(), 0,
    "Default Agenda size must never render the 'Nicht genug Platz' warning");
  const buttonItem = configured.pages.home.elements.find(item =>
    configured.widget_instances[item.ref_id]?.module_id === "widget.dynamic-buttons");
  assert.ok(buttonItem);
  assert.equal(agenda.row, buttonItem.row, "New widgets should occupy an available neighboring column");
  assert.equal(agenda.column, buttonItem.column + buttonItem.column_span,
    "New widget must fill the gap to the right, not stack on the left");

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

  // Simulate a real panel remount/reload: the application must reconstruct
  // its widgets and retain edit controls from persisted HA configuration.
  await page.evaluate(() => {
    const oldPanel = document.querySelector("jamesui-next-panel");
    oldPanel.remove();
    const next = document.createElement("jamesui-next-panel");
    document.body.appendChild(next);
    next.hass = window.__nextHass;
  });
  await root.locator('[data-jui-widget="calendar-agenda"]').waitFor({ state: "visible", timeout: 15000 });
  await root.locator('[data-jui-widget="dynamic-buttons"]').waitFor({ state: "visible", timeout: 15000 });
  await editAgain.waitFor({ state: "visible", timeout: 15000 });
  assert.equal(await root.locator('[data-jui-dashboard-item]').count(), 2);
  assert.equal(await page.evaluate(() => window.__nextTest.writes), 3, "Reload must not create phantom config writes");

  await page.screenshot({ path: "test-results/jamesui-next-widgets-tablet.png", fullPage: true });

  // The same persisted app must also remain usable at a desktop viewport.
  await page.setViewportSize({ width: 1366, height: 768 });
  assert.equal(await root.locator('[data-jui-agenda-too-small]').count(), 0,
    "Agenda should remain usable at desktop height");
  await editAgain.click();
  // Configure a previously blank dynamic-buttons widget end-to-end.
  await root.locator('[data-jui-dashboard-item="' + buttonItem.id + '"] [data-jui-editor-settings]').click();
  const buttonDialog = root.locator("[data-jui-button-settings]");
  await buttonDialog.waitFor({ state: "visible" });
  await buttonDialog.locator('input[aria-label="Button-ID"]').fill("test_light");
  await buttonDialog.locator('input[aria-label="Bezeichnung"]').fill("Testlicht");
  await buttonDialog.locator('input[aria-label="HA-Entität"]').fill("light.test");
  await buttonDialog.locator("button").filter({ hasText: "Button übernehmen" }).click();
  await root.locator('[data-jui-editor-toolbar] button').filter({ hasText: "Fertig" }).click();
  await page.waitForFunction(() => window.__nextTest?.writes === 4);
  await root.locator('[data-jui-dynamic-button-id="test_light"]').waitFor({ state: "visible", timeout: 12000 });
  assert.equal(await root.locator('[data-jui-dynamic-empty]').count(), 0,
    "Configured dynamic buttons must replace their initial placeholder");
  const storedAfterButtons = await page.evaluate(() => structuredClone(window.__nextTest.config));
  assert.equal(storedAfterButtons.dynamic_buttons.test_light.name, "Testlicht");
  assert.equal(storedAfterButtons.widget_instances[buttonItem.ref_id].config.buttons[0].button_id, "test_light");
  await editAgain.waitFor({ state: "visible" });
  const desktopNav = await root.locator('[data-role="bottom-navigation"]').boundingBox();
  assert.ok(desktopNav && desktopNav.y + desktopNav.height <= 769,
    "Desktop navigation must not disappear below the viewport");
  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/jamesui-next-desktop.png", fullPage: true });
  // Global settings must own real pages, not five hardwired disabled tabs.
  const openGlobal = root.locator("[data-jui-open-settings]");
  await openGlobal.click();
  const pageSettings = root.locator("[data-jui-global-settings]");
  await pageSettings.waitFor({state:"visible"});
  await pageSettings.locator('[aria-label="Neue Seite"]').fill("Testseite");
  await pageSettings.locator('[data-jui-page-create]').click();
  await page.waitForFunction(()=>window.__nextTest.writes===5);
  assert.equal(await root.locator('[data-role="bottom-navigation"] [data-route-id]').count(),2);
  assert.equal(await root.locator('[data-role="bottom-navigation"]').getAttribute("data-jui-nav-mode"),"distributed");
  await pageSettings.locator('[data-jui-page-row="testseite"] [data-jui-page-open]').click();
  await root.locator('[data-jui-layout="fullscreen"]').waitFor({state:"visible"});
  await root.locator("[data-jui-empty-add]").click();
  await root.locator('[data-jui-catalog-module="widget.house-quick"]').click();
  await root.locator('[data-jui-editor-toolbar] button').filter({hasText:"+ Hinzufügen"}).click();
  await root.locator('[data-jui-catalog-module="widget.calendar-agenda"]').click();
  // No sources yet: a blank Agenda must still be addable and editable.
  await root.locator('[data-jui-editor-toolbar] button').filter({hasText:"+ Hinzufügen"}).click();
  await root.locator('[data-jui-catalog-module="widget.dynamic-buttons"]').click();
  await root.locator('[data-jui-editor-toolbar] button').filter({hasText:"Fertig"}).click();
  await page.waitForFunction(()=>window.__nextTest.writes===6);
  const second=await page.evaluate(()=>structuredClone(window.__nextTest.config));
  assert.equal(second.pages.testseite.elements.length,3);
  assert.deepEqual(second.pages.testseite.elements.map(x=>second.widget_instances[x.ref_id].module_id),
    ["widget.house-quick","widget.calendar-agenda","widget.dynamic-buttons"]);
  await root.locator("[data-jui-house-empty]").waitFor({state:"visible"});
  await root.locator('[data-jui-widget="calendar-agenda"]').waitFor({state:"visible"});
  await root.locator("[data-jui-dynamic-empty]").waitFor({state:"visible"});

  // Trash and restore retain page contents and reconfigure the nav.
  await openGlobal.click();
  await pageSettings.locator('[data-jui-page-row="testseite"] [data-jui-page-trash-action]').click();
  await page.waitForFunction(()=>window.__nextTest.writes===7);
  assert.equal(await root.locator('[data-role="bottom-navigation"] [data-route-id]').count(),1);
  await pageSettings.locator('[data-jui-page-row="testseite"] [data-jui-page-restore-action]').click();
  await page.waitForFunction(()=>window.__nextTest.writes===8);
  await pageSettings.locator('[data-jui-page-row="testseite"] [data-jui-page-open]').click();
  await root.locator('[data-jui-widget="calendar-agenda"]').waitFor({state:"visible"});
  assert.equal(await root.locator('[data-jui-dashboard-item]').count(),3);

  // Lots of pages must switch to a horizontally swipable navigation strip.
  await openGlobal.click();
  for(let i=1;i<=9;i++){
    await pageSettings.locator('[aria-label="Neue Seite"]').fill("Raum "+i);
    await pageSettings.locator('[data-jui-page-create]').click();
    await page.waitForFunction(index=>window.__nextTest.writes===8+index,i);
  }
  const bottomNav=root.locator('[data-role="bottom-navigation"]');
  assert.equal(await bottomNav.getAttribute("data-jui-nav-mode"),"slider");
  assert.ok(await bottomNav.evaluate(el=>el.scrollWidth>el.clientWidth),
    "More navigation entries than available space must allow swipe/scroll");
  await bottomNav.evaluate(el=>{el.scrollLeft=el.scrollWidth;});
  assert.ok(await bottomNav.evaluate(el=>el.scrollLeft)>0);
  await pageSettings.locator('[data-jui-settings-close]').click();
  await page.screenshot({path:"test-results/jamesui-next-navigation-slider.png",fullPage:true});
  assert.deepEqual(errors, [], "Unexpected browser errors");
  console.log("JamesUI Next Chromium portrait boot, re-edit, add, settings and three durable saves: PASS");
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
