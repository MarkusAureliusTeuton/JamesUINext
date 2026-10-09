import test from "node:test";
import assert from "node:assert/strict";
import { createFakeDocument } from "./helpers/fake-dom.js";
import { createWeatherSettingsDialog } from "../custom_components/jamesui_next/frontend/modules/dashboard-weather-settings-dialog.js";

const flush = () => new Promise((resolve) => setImmediate(resolve));

test("weather settings accept configured HA weather entity and optional sensors", async () => {
  const saved = [];
  const dialog = createWeatherSettingsDialog({document:createFakeDocument(), onSave: async value => {saved.push(value);}});
  dialog.open({});
  const fields = dialog.root.querySelectorAll("input");
  fields[0].value = "weather.home";
  fields[1].value = "sensor.outside";
  dialog.root.querySelectorAll("button").find(b => b.textContent === "Übernehmen").dispatchEvent("click");
  await flush();
  assert.equal(saved.length,1);
  assert.deepEqual(saved[0],{entity_id:"weather.home", outdoor_temperature_entity_id:"sensor.outside"});
  assert.equal(dialog.root.hidden,true);
});

test("invalid weather entity never invokes save", async () => {
  const saved=[];
  const dialog=createWeatherSettingsDialog({document:createFakeDocument(),onSave: async x=>saved.push(x)});
  dialog.open();
  dialog.root.querySelectorAll("input")[0].value="sensor.not_weather";
  dialog.root.querySelectorAll("button").find(b=>b.textContent==="Übernehmen").dispatchEvent("click");
  await flush();
  assert.equal(saved.length,0);
  assert.equal(dialog.root.hidden,false);
  assert.ok(dialog.root.querySelector('[role="alert"]').textContent);
});

test("weather save failures stay visible for retry and cancel does not save", async () => {
  let count=0;
  const dialog=createWeatherSettingsDialog({document:createFakeDocument(),onSave:async()=>{count++;throw Error("Disconnected");}});
  dialog.open({entity_id:"weather.home"});
  dialog.root.querySelectorAll("button").find(b=>b.textContent==="Übernehmen").dispatchEvent("click");
  await flush();
  assert.equal(count,1);
  assert.match(dialog.root.querySelector('[role="alert"]').textContent,/Disconnected/);
  assert.equal(dialog.root.hidden,false);
  dialog.root.querySelectorAll("button").find(b=>b.textContent==="Abbrechen").dispatchEvent("click");
  assert.equal(dialog.root.hidden,true);
});
