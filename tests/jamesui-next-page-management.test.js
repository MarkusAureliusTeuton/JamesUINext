import test from "node:test";
import assert from "node:assert/strict";
import {activeDashboardPages,createDashboardPage,trashDashboardPage,
  restoreDashboardPage,permanentlyDeleteDashboardPage} from "../custom_components/jamesui_next/frontend/core/page-management.js";
import {createRouter} from "../custom_components/jamesui_next/frontend/core/router.js";

function config() {
  return {schema_version:1,pages:{home:{kind:"dashboard",layout_id:"main",hero_widget_id:"hero",elements:[]}},
    layouts:{main:{kind:"hero-deck",scroll:"fixed",hero_ratio:.42}},
    widget_instances:{hero:{module_id:"widget.weather-today",config:{}}},dynamic_buttons:{},
    data_sources:{},module_settings:{}};
}
test("pages are ordered, independently laid out and restored intact from trash",()=>{
  let current=config();
  current=createDashboardPage(current,{title:"Wohnzimmer"});
  const before=structuredClone(current.pages.wohnzimmer);
  current=createDashboardPage(current,{title:"Wohnzimmer",layoutKind:"hero-deck"});
  assert.deepEqual(activeDashboardPages(current).map(p=>p.id),["home","wohnzimmer","wohnzimmer-2"]);
  assert.equal(current.pages["wohnzimmer-2"].hero_widget_id,"hero");
  assert.equal(current.pages.wohnzimmer.layout_id,"page-layout-wohnzimmer");
  current=trashDashboardPage(current,"wohnzimmer");
  assert.deepEqual(activeDashboardPages(current).map(p=>p.id),["home","wohnzimmer-2"]);
  assert.deepEqual(current.pages.wohnzimmer.elements,[]);
  current=restoreDashboardPage(current,"wohnzimmer");
  assert.deepEqual(current.pages.wohnzimmer,before);
  assert.equal(current.pages.wohnzimmer.trashed,undefined);
});
test("home is protected, deletion is confirmed via trash and orphaned widgets cleaned",()=>{
  let current=createDashboardPage(config(),{title:"Büro"});
  const id="bu-ro"; // slug transliterates ü -> u
  const actual=Object.keys(current.pages).find(k=>k!=="home");
  current.pages[actual].elements=[{id:"extra",kind:"widget",ref_id:"extra",column:0,row:0,column_span:6,row_span:3}];
  current.widget_instances.extra={module_id:"widget.house-quick",config:{buttons:[]}};
  assert.throws(()=>trashDashboardPage(current,"home"),/Startseite/);
  assert.throws(()=>permanentlyDeleteDashboardPage(current,actual),/Papierkorb/);
  current=trashDashboardPage(current,actual);
  current=permanentlyDeleteDashboardPage(current,actual);
  assert.equal(current.pages[actual],undefined);
  assert.equal(current.layouts["page-layout-"+actual],undefined);
  assert.equal(current.widget_instances.extra,undefined);
  assert.ok(current.widget_instances.hero);
});
test("router adopts configured routes, rejects discarded pages and falls back to home",()=>{
  const router=createRouter();
  router.setRoutes([{id:"home",label:"Start"},{id:"house",label:"Haus"},{id:"office",label:"Büro"}]);
  assert.equal(router.navigate("office"),true);
  let returned=null;
  router.subscribe(({from,to})=>{returned={from,to};});
  router.setRoutes([{id:"home",label:"Start"}]);
  assert.deepEqual(returned,{from:"office",to:"home"});
  assert.equal(router.navigate("office"),false);
});
