import test from "node:test";
import assert from "node:assert/strict";
import { createFakeDocument } from "./helpers/fake-dom.js";
import { createDashboardWidgetHosts } from "../custom_components/jamesui_next/frontend/modules/dashboard-widget-hosts.js";

test("dynamic button widget instances resolve central definitions before loading", async () => {
  const calls=[];
  const loader={
    async load(moduleId, options){calls.push({moduleId,options});return true;},
    mount(){return true;},
    destroy(){},
  };
  const definitions={
    hall:{name:"Flurlicht",mode:"trigger",action:{type:"entity.toggle",entity_id:"light.hall"}},
  };
  const createHost=createDashboardWidgetHosts({
    moduleLoader:loader,
    getConfig:()=>({module_id:"widget.dynamic-buttons",config:{
      buttons:[{id:"hall-use",button_id:"hall",size:"normal"}],
    }}),
    getButtonDefinitions:()=>definitions,
  });
  const doc=createFakeDocument();
  const clean=createHost(doc.createElement("section"),{id:"buttons",kind:"widget",ref_id:"buttons"});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls.length,1);
  assert.equal(calls[0].moduleId,"widget.dynamic-buttons");
  assert.equal(calls[0].options.config.buttons[0].definition.action.entity_id,"light.hall");
  clean();
});

test("widget instance rejects missing dynamic button definitions", () => {
  const loader={load:async()=>true,mount:()=>true,destroy(){}};
  const createHost=createDashboardWidgetHosts({
    moduleLoader:loader,
    getConfig:()=>({module_id:"widget.dynamic-buttons",config:{
      buttons:[{id:"missing-use",button_id:"missing",size:"normal"}],
    }}),
    getButtonDefinitions:()=>({}),
  });
  assert.throws(()=>createHost(createFakeDocument().createElement("section"),{
    id:"buttons",kind:"widget",ref_id:"buttons",
  }),/definition is missing/);
});
