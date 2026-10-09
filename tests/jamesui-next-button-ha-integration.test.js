import test from "node:test";
import assert from "node:assert/strict";
import { createFakeDocument } from "./helpers/fake-dom.js";
import { createDynamicButtonsWidget } from "../custom_components/jamesui_next/frontend/modules/widget.dynamic-buttons/widget.js";
import { createActionRegistry } from "../custom_components/jamesui_next/frontend/core/action-registry.js";
import { createHomeAssistantAdapter } from "../custom_components/jamesui_next/frontend/ha/home-assistant-adapter.js";
import { registerHomeAssistantActionProviders } from "../custom_components/jamesui_next/frontend/ha/ha-action-providers.js";

const settle = () => new Promise(resolve => setImmediate(resolve));

function fixture({ state = "off", reject = false } = {}) {
  const doc = createFakeDocument();
  const host = doc.createElement("section");
  const calls = [];
  const listeners = [];
  const adapter = createHomeAssistantAdapter();
  let revision = 0;
  const entity = { entity_id:"switch.fan", state };
  adapter.setHass({
    connected:true,
    states:{ "switch.fan":entity },
    callService: async (...args) => {
      calls.push(args);
      if (reject) throw new Error("service denied");
    },
  });
  const actions = createActionRegistry();
  const unregister = registerHomeAssistantActionProviders({ actions, homeAssistant: adapter });
  const service = { subscribe(_request, callback) {
    listeners.push(callback);
    callback({ states:[{source_id:"fan",status: state === "on" ? "active" : "inactive",revision:revision++,detail:null}] });
    return () => {};
  } };
  const context = {
    module:{id:"widget.dynamic-buttons"},
    actions,
    capabilities:{subscribe(_key, callback) {
      callback({status:"available",value:service});
      return () => {};
    }},
  };
  const config={buttons:[{
    id:"fan-use",button_id:"fan",size:"normal",
    definition:{
      name:"Lüfter",mode:"toggle",state_source_id:"fan",timeout_ms:5000,
      activate_action:{type:"ha.service",domain:"homeassistant",service:"turn_on",target:{entity_id:"switch.fan"}},
      deactivate_action:{type:"ha.service",domain:"homeassistant",service:"turn_off",target:{entity_id:"switch.fan"}},
    },
  }]};
  const widget=createDynamicButtonsWidget(context,config);
  widget.mount(host);
  const button=()=>host.querySelector("[data-jui-dynamic-button]");
  const push=(next, detail=null)=>{
    listeners.at(-1)({states:[{source_id:"fan",status:next,detail,revision:revision++}]});
  };
  return {widget,button,push,calls,dispose:()=>{widget.destroy();unregister();actions.destroy();adapter.destroy();}};
}

test("toggle calls HA service, waits for genuine matching state revision", async () => {
  const f=fixture();
  try {
    assert.equal(f.button().getAttribute("data-jui-dynamic-real-status"),"inactive");
    f.button().dispatchEvent("click");
    assert.equal(f.button().getAttribute("data-jui-dynamic-feedback"),"pending");
    await settle();
    assert.equal(f.calls.length,1);
    assert.deepEqual(f.calls[0],["homeassistant","turn_on",{}, {entity_id:"switch.fan"}]);
    f.push("active");
    assert.equal(f.button().getAttribute("data-jui-dynamic-real-status"),"active");
    assert.equal(f.button().getAttribute("data-jui-dynamic-feedback"),"idle");
    f.button().dispatchEvent("click");
    await settle();
    assert.equal(f.calls[1][1],"turn_off");
    f.push("inactive");
    assert.equal(f.button().getAttribute("data-jui-dynamic-feedback"),"idle");
  } finally { f.dispose(); }
});

test("rejected HA call causes error feedback and prevents duplicate pending action", async () => {
  const f=fixture({reject:true});
  try {
    f.button().dispatchEvent("click");
    f.button().dispatchEvent("click");
    await settle();
    assert.equal(f.calls.length,1);
    assert.equal(f.button().getAttribute("data-jui-dynamic-feedback"),"error");
  } finally {f.dispose();}
});

test("unexpected terminal state after command signals failure rather than success", async () => {
  const f=fixture();
  try {
    f.button().dispatchEvent("click");
    await settle();
    f.push("inactive");
    assert.equal(f.button().getAttribute("data-jui-dynamic-feedback"),"error");
  } finally {f.dispose();}
});
