import test from "node:test";
import assert from "node:assert/strict";
import { validateHouseDashboardSettings } from "../custom_components/jamesui_next/frontend/modules/dashboard-house-settings.js";

test("house quick settings accept configured light and energy sources", () => {
  const result = validateHouseDashboardSettings({
    buttons: [
      {id:"light",type:"lights"},
      {id:"power",type:"energy",source_id:"total",average_window_minutes:15,warning_threshold_w:800,critical_threshold_w:1200},
    ],
  }, {
    "provider.house-lighting":{lights:[{id:"hall",name:"Flur",state:{entity_id:"light.hall"}}],ambient_lights:[]},
    "provider.house-energy":{sources:[{id:"total",name:"Haus",power:{entity_id:"sensor.power"}}]},
  });
  assert.equal(result.instanceConfig.buttons.length,2);
  assert.equal(result.moduleSettings["provider.house-energy"].sources[0].id,"total");
});

test("house quick settings reject missing providers and mismatched source references", () => {
  assert.throws(()=>validateHouseDashboardSettings({buttons:[{id:"lighting",type:"lights"}]},{}),/Lichtprovider/);
  assert.throws(()=>validateHouseDashboardSettings({
    buttons:[{id:"zone",type:"heating_zone",source_id:"nonexistent"}],
  },{"provider.house-heating":{zones:[]}}),/Datenquelle/);
});

test("house quick settings reject overlapping threshold values and invalid provider data", () => {
  assert.throws(()=>validateHouseDashboardSettings({
    buttons:[{id:"power",type:"energy",source_id:"total",average_window_minutes:15,warning_threshold_w:1500,critical_threshold_w:1200}],
  },{"provider.house-energy":{sources:[{id:"total",name:"Haus",power:{entity_id:"sensor.power"}}]}}),/greater/);
  assert.throws(()=>validateHouseDashboardSettings({buttons:[]},{
    "provider.house-lighting":{lights:"not-an-array",ambient_lights:[]},
  }),/array/);
});
