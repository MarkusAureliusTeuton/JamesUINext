import test from "node:test";
import assert from "node:assert/strict";
import { createDashboardEditSession } from "../custom_components/jamesui_next/frontend/core/dashboard-edit-session.js";
import { createDashboardController } from "../custom_components/jamesui_next/frontend/core/dashboard-controller.js";
import { createConfigService } from "../custom_components/jamesui_next/frontend/core/config-service.js";

const initial = () => ({
  schema_version: 1,
  pages: { start: { kind: "dashboard", layout_id: "main", elements: [
    { id: "a", kind: "widget", ref_id: "agenda", column: 0, row: 0, column_span: 6, row_span: 3 },
    { id: "b", kind: "button", ref_id: "scene", column: 6, row: 0, column_span: 3, row_span: 2 },
  ] } },
  layouts: { main: { kind: "hero-deck", scroll: "fixed", hero_ratio: 0.42 } },
  widget_instances: { agenda: { module_id: "widget.calendar-agenda" } },
  dynamic_buttons: { scene: { name: "Scene", mode: "trigger" } },
  data_sources: {}, module_settings: {},
});

function setup() {
  let remote = initial();
  let writes = 0;
  const configService = createConfigService({ homeAssistant: {
    async callWS(request) {
      if (request.type === "jamesui_next/config/get") return { config: structuredClone(remote) };
      if (request.type === "jamesui_next/config/replace") {
        writes += 1;
        remote = structuredClone(request.config);
        return { config: structuredClone(remote) };
      }
    },
  } });
  const controller = createDashboardController({ configService });
  const editor = createDashboardEditSession({ controller, configService, pageId: "start", maxRows: 12 });
  return { configService, editor, getWrites: () => writes };
}

test("Block 14 editing previews locally, undo restores and save commits once", async () => {
  const { configService, editor, getWrites } = setup();
  await configService.load();
  editor.enter();
  const moved = editor.move("a", { column: 6 });
  assert.deepEqual(moved.elements.map((e) => [e.id, e.column, e.row]), [["a", 6, 0], ["b", 6, 3]]);
  assert.equal(getWrites(), 0);
  assert.equal(editor.canUndo, true);
  editor.undo();
  assert.equal(editor.snapshot().elements[0].column, 0);
  editor.move("a", { column: 6 });
  await editor.save();
  assert.equal(getWrites(), 1);
  assert.equal(configService.snapshot().pages.start.elements[0].column, 6);
  assert.equal(editor.canUndo, false);
  editor.finish();
  assert.equal(editor.active, false);
});

test("Block 14 impossible move leaves session untouched", async () => {
  const { configService, editor } = setup();
  await configService.load();
  editor.enter();
  assert.equal(editor.move("a", { column: 6, row: 11 }), null);
  assert.equal(editor.canUndo, false);
  assert.equal(editor.snapshot().elements[0].column, 0);
});

test("Block 14 detects external element changes instead of overwriting them", async () => {
  const { configService, editor } = setup();
  await configService.load();
  editor.enter();
  editor.move("a", { row: 5 });
  const external = configService.snapshot();
  external.pages.start.elements.pop();
  await configService.replace(external);
  await assert.rejects(() => editor.save(), /externally/);
  assert.equal(configService.snapshot().pages.start.elements.length, 1);
});


test("Block 14 catalog widgets are independent, undoable and saved atomically", async () => {
  const { configService, editor, getWrites } = setup();
  await configService.load();
  editor.enter();
  const added = editor.addWidget("widget.calendar-agenda", { config: { calendar: "work" } });
  assert.equal(added.elements.length, 3);
  assert.equal(getWrites(), 0);
  editor.undo();
  assert.equal(editor.snapshot().elements.length, 2);
  const again = editor.addWidget("widget.calendar-agenda", { config: { calendar: "family" } });
  assert.equal(again.elements.length, 3);
  await editor.save();
  const saved = configService.snapshot();
  const ref = saved.pages.start.elements[2].ref_id;
  assert.equal(saved.widget_instances[ref].module_id, "widget.calendar-agenda");
  assert.equal(saved.widget_instances[ref].config.calendar, "family");
  assert.equal(getWrites(), 1);
});

test("Next widget configuration is independent, undoable and committed once", async () => {
  const { configService, editor, getWrites } = setup();
  await configService.load();
  editor.enter();
  editor.configureWidget("agenda", { instance_id: "agenda", calendar_enabled: true, tasks_enabled: false, calendars: [{ entity_id: "calendar.family" }], task_lists: [] });
  assert.equal(getWrites(), 0);
  assert.equal(editor.workingConfig().widget_instances.agenda.config.calendars[0].entity_id, "calendar.family");
  editor.undo();
  assert.equal(editor.workingConfig().widget_instances.agenda.config, undefined);
  editor.configureWidget("agenda", { instance_id: "agenda", calendar_enabled: false, tasks_enabled: true, calendars: [], task_lists: [{ entity_id: "todo.family" }] });
  await editor.save();
  assert.equal(getWrites(), 1);
  assert.equal(configService.snapshot().widget_instances.agenda.config.task_lists[0].entity_id, "todo.family");
  assert.equal(configService.snapshot().pages.start.elements.length, 2);
});

test("Next widget configuration refuses unknown or foreign instances", async () => {
  const { configService, editor } = setup();
  await configService.load();
  editor.enter();
  assert.throws(() => editor.configureWidget("absent", {}), /Unknown widget/);
  assert.equal(editor.canUndo, false);
});

test("Next edit session detects simultaneous modification of the same widget", async () => {
  const { configService, editor } = setup();
  await configService.load();
  editor.enter();
  editor.configureWidget("agenda", { instance_id: "agenda", calendar_enabled: false, tasks_enabled: true, calendars: [], task_lists: [{ entity_id: "todo.personal" }] });
  const remote = configService.snapshot();
  remote.widget_instances.agenda.config = { source: "external" };
  await configService.replace(remote);
  await assert.rejects(editor.save(), /configuration changed externally/);
  assert.equal(configService.snapshot().widget_instances.agenda.config.source, "external");
});

test("Block 13 dynamic button definition, source and widget assignment save atomically with undo", async () => {
  const { configService, editor, getWrites } = setup();
  await configService.load();
  editor.enter();
  const before = editor.addWidget("widget.dynamic-buttons", { config: { buttons: [] } });
  const id = before.elements.at(-1).ref_id;
  const change = {
    buttonId: "hall",
    instanceConfig: { buttons: [{ id: id + "-hall", button_id: "hall", size: "normal" }] },
    definitions: { ...editor.workingConfig().dynamic_buttons,
      hall: { name: "Flur", mode: "toggle", state_source_id: "hall",
        activate_action: { type: "ha.service", domain: "homeassistant", service: "turn_on", target: { entity_id: "light.hall" } },
        deactivate_action: { type: "ha.service", domain: "homeassistant", service: "turn_off", target: { entity_id: "light.hall" } } },
    },
    stateSource: { id: "hall", entity_id: "light.hall", active_values: ["on"], inactive_values: ["off"] },
  };
  editor.configureDynamicButtons(id, change);
  assert.equal(getWrites(), 0);
  assert.equal(editor.workingConfig().module_settings["provider.control-state"].sources[0].id, "hall");
  editor.undo();
  assert.equal(editor.workingConfig().dynamic_buttons.hall, undefined);
  editor.configureDynamicButtons(id, change);
  await editor.save();
  assert.equal(getWrites(), 1);
  const snapshot = configService.snapshot();
  assert.equal(snapshot.dynamic_buttons.hall.name, "Flur");
  assert.equal(snapshot.widget_instances[id].config.buttons[0].button_id, "hall");
  assert.equal(snapshot.module_settings["provider.control-state"].sources[0].entity_id, "light.hall");
});

test("Block 13 button removal keeps shared definitions and state sources intact", async () => {
  const { configService, editor } = setup();
  await configService.load();
  editor.enter();
  const page = editor.addWidget("widget.dynamic-buttons", { config: {
    buttons: [{ id: "button-one", button_id: "scene", size: "normal" }],
  } });
  const id = page.elements.at(-1).ref_id;
  editor.configureDynamicButtons(id, { instanceConfig: { buttons: [] } });
  await editor.save();
  assert.deepEqual(configService.snapshot().widget_instances[id].config.buttons, []);
  assert.ok(configService.snapshot().dynamic_buttons.scene);
});

test("removing a widget is undoable and cleans an otherwise unreferenced instance", async () => {
  const { configService, editor, getWrites } = setup();
  await configService.load();
  editor.enter();
  editor.removeElement("a");
  assert.equal(editor.snapshot().elements.length,1);
  assert.equal(editor.workingConfig().widget_instances.agenda,undefined);
  assert.equal(getWrites(),0);
  editor.undo();
  assert.ok(editor.workingConfig().widget_instances.agenda);
  editor.removeElement("a");
  await editor.save();
  assert.equal(getWrites(),1);
  assert.equal(configService.snapshot().widget_instances.agenda,undefined);
  assert.equal(configService.snapshot().dynamic_buttons.scene.name,"Scene");
});

test("house widget/provider settings are committed atomically and undoable", async () => {
  const {configService,editor,getWrites}=setup();
  await configService.load();
  editor.enter();
  const added=editor.addWidget("widget.house-quick",{config:{buttons:[]}});
  const id=added.elements.at(-1).ref_id;
  const change={
    instanceConfig:{buttons:[{id:"lights",type:"lights"}]},
    moduleSettings:{"provider.house-lighting":{lights:[],ambient_lights:[]}},
  };
  editor.configureHouseQuick(id,change);
  assert.equal(getWrites(),0);
  editor.undo();
  assert.deepEqual(editor.workingConfig().widget_instances[id].config.buttons,[]);
  editor.configureHouseQuick(id,change);
  await editor.save();
  assert.equal(getWrites(),1);
  assert.equal(configService.snapshot().widget_instances[id].config.buttons[0].type,"lights");
  assert.deepEqual(configService.snapshot().module_settings["provider.house-lighting"],{lights:[],ambient_lights:[]});
});
