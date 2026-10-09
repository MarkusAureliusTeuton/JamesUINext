import test from "node:test";
import assert from "node:assert/strict";
import { registerDashboardProviders, startDashboardProviders, resolveDashboardProviderSettings } from "../custom_components/jamesui_next/frontend/modules/dashboard-providers.js";

test("dashboard registers all provider manifests with independent Next paths", () => {
  const entries = [];
  registerDashboardProviders({ register(manifest, record) { entries.push({manifest, record}); } });
  assert.equal(entries.length, 8);
  assert.equal(new Set(entries.map(v => v.manifest.id)).size, 8);
  assert.ok(entries.every(v => v.record.entryUrl.includes("/modules/provider.")));
});

test("only safe providers start without device configuration and all are cleaned up", async () => {
  const calls = [];
  const loader = {
    async load(id, options) { calls.push(["load", id, options.config]); return true; },
    mount(id) { calls.push(["mount", id]); return true; },
    destroy(id) { calls.push(["destroy", id]); },
  };
  const stop = await startDashboardProviders(loader, {module_settings:{}});
  assert.deepEqual(calls.filter(v => v[0] === "load").map(v => v[1]),
    ["provider.weather", "provider.calendar", "provider.tasks"]);
  stop();
  assert.deepEqual(calls.filter(v => v[0] === "destroy").map(v => v[1]),
    ["provider.tasks", "provider.calendar", "provider.weather"]);
});

test("configured house provider starts with explicit config", async () => {
  const loaded = [];
  const loader = {
    async load(id, options) { loaded.push([id, options.config]); return true; },
    mount() { return true; }, destroy() {},
  };
  const source = {lights:[],ambient_lights:[]};
  await startDashboardProviders(loader, {module_settings:{"provider.house-lighting":source}});
  assert.deepEqual(loaded.find(v => v[0] === "provider.house-lighting")[1], source);
});

test("provider startup failure rolls back previously mounted providers", async () => {
  const destroyed = [];
  const loader = {
    async load(id) { return id !== "provider.calendar"; },
    mount() { return true; },
    destroy(id) { destroyed.push(id); },
  };
  await assert.rejects(startDashboardProviders(loader, {module_settings:{}}), /provider.calendar/);
  assert.deepEqual(destroyed, ["provider.weather"]);
});

test("independent agenda instances contribute deduplicated sources to providers", () => {
  const settings = resolveDashboardProviderSettings({
    module_settings: { "provider.calendar": { source_entity_ids: ["calendar.team"] } },
    widget_instances: {
      one: { module_id: "widget.calendar-agenda", config: {
        calendar_enabled: true, tasks_enabled: false, calendars: [{entity_id: "calendar.family"}], task_lists: [],
      }},
      two: { module_id: "widget.calendar-agenda", config: {
        calendar_enabled: true, tasks_enabled: true,
        calendars: [{entity_id: "calendar.team"},{entity_id: "calendar.family"}],
        task_lists: [{entity_id: "todo.shopping"}],
      }},
    },
  });
  assert.deepEqual(settings["provider.calendar"].source_entity_ids, ["calendar.team", "calendar.family"]);
  assert.deepEqual(settings["provider.tasks"].source_entity_ids, ["todo.shopping"]);
});
