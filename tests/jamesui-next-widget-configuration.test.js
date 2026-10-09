import test from "node:test";
import assert from "node:assert/strict";
import { buildAgendaInstanceConfig, agendaConfigAsText } from "../custom_components/jamesui_next/frontend/modules/dashboard-widget-configuration.js";

test("agenda selection yields a valid isolated calendar-only instance", () => {
  const value = buildAgendaInstanceConfig("agenda-1", {calendars:"calendar.family calendar.work"});
  assert.equal(value.instance_id, "agenda-1");
  assert.equal(value.calendar_enabled, true);
  assert.equal(value.tasks_enabled, false);
  assert.deepEqual(agendaConfigAsText(value), {calendars:"calendar.family, calendar.work",tasks:""});
});

test("agenda selection supports tasks only", () => {
  const value = buildAgendaInstanceConfig("agenda-2", {tasks:"todo.shopping"});
  assert.equal(value.calendar_enabled, false);
  assert.equal(value.tasks_enabled, true);
});

test("invalid, empty and duplicate sources are rejected", () => {
  assert.throws(() => buildAgendaInstanceConfig("x", {}), /at least one/);
  assert.throws(() => buildAgendaInstanceConfig("x", {calendars:"sensor.temp"}), /Invalid calendar/);
  assert.throws(() => buildAgendaInstanceConfig("x", {tasks:"todo.one todo.one"}), /Duplicate todo/);
});
