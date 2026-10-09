import test from "node:test";
import assert from "node:assert/strict";
import { createFakeDocument } from "./helpers/fake-dom.js";
import { createWidgetSettingsDialog } from "../custom_components/jamesui_next/frontend/modules/dashboard-widget-settings-dialog.js";

test("agenda settings edit only selected instance and retain visual options", () => {
  const saved = [];
  const dialog = createWidgetSettingsDialog({ document: createFakeDocument(), onSave: (id, config) => saved.push({id,config}) });
  dialog.open("agenda-one", { instance_id: "agenda-one", calendars: [{entity_id:"calendar.home"}], task_lists: [], calendar_enabled: true, tasks_enabled:false, max_visible_items:7 });
  assert.equal(dialog.root.hidden, false);
  const fields = dialog.root.querySelectorAll("input");
  fields[0].value = "calendar.work";
  fields[1].value = "todo.shopping";
  const apply = dialog.root.querySelectorAll("button").find(b => b.textContent === "Übernehmen");
  apply.dispatchEvent("click");
  assert.equal(saved.length, 1);
  assert.equal(saved[0].id, "agenda-one");
  assert.equal(saved[0].config.max_visible_items, 7);
  assert.equal(saved[0].config.calendars[0].entity_id, "calendar.work");
  assert.equal(dialog.root.hidden, true);
});

test("invalid sources remain in settings dialog; cancel never saves", () => {
  const saved = [];
  const dialog = createWidgetSettingsDialog({ document: createFakeDocument(), onSave: (...args) => saved.push(args) });
  dialog.open("agenda", {instance_id:"agenda", calendars:[{entity_id:"calendar.home"}],task_lists:[]});
  dialog.root.querySelectorAll("input")[0].value = "sensor.bad";
  dialog.root.querySelectorAll("button").find(b=>b.textContent==="Übernehmen").dispatchEvent("click");
  assert.equal(dialog.root.hidden, false);
  assert.ok(dialog.root.querySelector('[role="alert"]').textContent);
  dialog.root.querySelectorAll("button").find(b=>b.textContent==="Abbrechen").dispatchEvent("click");
  assert.equal(dialog.root.hidden, true);
  assert.equal(saved.length, 0);
});
