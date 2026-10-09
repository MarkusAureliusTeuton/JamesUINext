import test from "node:test";
import assert from "node:assert/strict";
import { buildDashboardButtonChange, removeDashboardButtonUse } from "../custom_components/jamesui_next/frontend/modules/dashboard-button-settings-dialog.js";

test("trigger button creates a validated HA action and widget assignment", () => {
  const changed=buildDashboardButtonChange({
    instanceId:"widget-1",instanceConfig:{buttons:[]},definitions:{},
    id:"light_hall",name:"Flurlicht",mode:"trigger",entityId:"light.hall",
  });
  assert.equal(changed.definitions.light_hall.action.type,"entity.toggle");
  assert.equal(changed.definitions.light_hall.action.entity_id,"light.hall");
  assert.equal(changed.instanceConfig.buttons[0].button_id,"light_hall");
  assert.equal(changed.buttonId,"light_hall");
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

test("removing one button preserves other widget assignments", () => {
  const instance = { buttons: [
    { id: "one-a", button_id: "a", size: "normal" },
    { id: "one-b", button_id: "b", size: "wide" },
  ] };
  const changed = removeDashboardButtonUse(instance, "a");
  assert.deepEqual(changed.buttons.map(button => button.button_id), ["b"]);
  assert.equal(instance.buttons.length, 2);
  assert.throws(() => removeDashboardButtonUse(instance, "missing"), /nicht im Widget/);
});

test("editing the first button preserves second button assignment", () => {
  const initial = {
    buttons: [
      {id:"panel-first",button_id:"first",size:"normal"},
      {id:"panel-second",button_id:"second",size:"wide"},
    ],
  };
  const changes = buildDashboardButtonChange({
    instanceId:"panel", instanceConfig:initial,
    definitions:{
      first:{name:"First",mode:"trigger",action:{type:"entity.toggle",entity_id:"light.first"}},
      second:{name:"Second",mode:"trigger",action:{type:"entity.toggle",entity_id:"light.second"}},
    },
    id:"first",name:"Updated first",mode:"toggle",entityId:"switch.first",
  });
  assert.equal(changes.buttonId,"first");
  assert.equal(changes.stateSource.id,"first");
  assert.deepEqual(changes.instanceConfig.buttons.map(x=>x.button_id),["first","second"]);
});

test("scene activation uses the existing HA action provider", () => {
  const changed = buildDashboardButtonChange({
    instanceId:"panel", instanceConfig:{buttons:[]}, definitions:{},
    id:"evening", name:"Abend", mode:"trigger",
    entityId:"scene.evening", actionType:"scene.activate",
  });
  assert.deepEqual(changed.definitions.evening.action,
    {type:"scene.activate",entity_id:"scene.evening"});
  assert.throws(() => buildDashboardButtonChange({
    instanceId:"panel",instanceConfig:{buttons:[]},definitions:{},
    id:"bad",name:"Falsch",mode:"trigger",entityId:"light.hall",actionType:"scene.activate",
  }), /Szene/);
});

test("service action validates domain and service before committing", () => {
  const base={instanceId:"panel",instanceConfig:{buttons:[]},definitions:{},
    id:"lamp",name:"Licht",mode:"trigger",entityId:"light.hall",actionType:"ha.service"};
  const changed=buildDashboardButtonChange({...base,serviceDomain:"light",serviceName:"turn_on"});
  assert.deepEqual(changed.definitions.lamp.action,{
    type:"ha.service",domain:"light",service:"turn_on",target:{entity_id:"light.hall"},
  });
  assert.throws(()=>buildDashboardButtonChange({...base,serviceDomain:"light",serviceName:"turn on"}),/Service/);
});
