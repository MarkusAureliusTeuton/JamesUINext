import test from "node:test";
import assert from "node:assert/strict";
import { buildDashboardButtonChange } from "../custom_components/jamesui_next/frontend/modules/dashboard-button-settings-dialog.js";

test("trigger button creates a validated HA action and widget assignment", () => {
  const changed=buildDashboardButtonChange({
    instanceId:"widget-1",instanceConfig:{buttons:[]},definitions:{},
    id:"light_hall",name:"Flurlicht",mode:"trigger",entityId:"light.hall",
  });
  assert.equal(changed.definitions.light_hall.action.type,"entity.toggle");
  assert.equal(changed.definitions.light_hall.action.entity_id,"light.hall");
  assert.equal(changed.instanceConfig.buttons[0].button_id,"light_hall");
  assert.equal(changed.stateSource,null);
});

test("toggle button includes control state mapping and separate on/off actions", () => {
  const changed=buildDashboardButtonChange({
    instanceId:"widget-2",instanceConfig:{buttons:[]},definitions:{},
    id:"pump",name:"Pumpe",mode:"toggle",entityId:"switch.pump",
  });
  assert.deepEqual(changed.stateSource,{
    id:"pump",entity_id:"switch.pump",active_values:["on"],inactive_values:["off"],
  });
  assert.equal(changed.definitions.pump.activate_action.service,"turn_on");
  assert.equal(changed.definitions.pump.deactivate_action.service,"turn_off");
});

test("editing an existing button does not duplicate its widget assignment", () => {
  const initial=buildDashboardButtonChange({
    instanceId:"one",instanceConfig:{buttons:[]},definitions:{},
    id:"scene",name:"Szene",mode:"trigger",entityId:"scene.evening",
  });
  const revised=buildDashboardButtonChange({
    instanceId:"one",instanceConfig:initial.instanceConfig,definitions:initial.definitions,
    id:"scene",name:"Abend",mode:"trigger",entityId:"scene.evening",
  });
  assert.equal(revised.instanceConfig.buttons.length,1);
  assert.equal(revised.definitions.scene.name,"Abend");
});

test("reject invalid entity identifiers and unrecognized mode", () => {
  const base={instanceId:"one",instanceConfig:{buttons:[]},definitions:{},id:"good",name:"Gültig",mode:"trigger"};
  assert.throws(()=>buildDashboardButtonChange({...base,entityId:"not valid"}),/Entität/);
  assert.throws(()=>buildDashboardButtonChange({...base,entityId:"light.hall",mode:"invalid"}),/Modus/);
});
