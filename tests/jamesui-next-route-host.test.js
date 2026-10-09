import test from "node:test";
import assert from "node:assert/strict";
import { createDashboardRouteHost } from "../custom_components/jamesui_next/frontend/modules/dashboard-route-host.js";

function harness(config) {
  const calls = [];
  let listener;
  const region = { textContent: "", replaceChildren() { calls.push("clear"); } };
  const core = { router: { currentRouteId: "home", subscribe(fn) { listener = fn; return () => { listener = null; }; } } };
  const composer = {
    async mount(_node, id) { calls.push("mount:" + id); },
    destroy() { calls.push("destroy"); },
    enterEdit() { calls.push("edit"); },
  };
  const routeHost = createDashboardRouteHost({ core, composer, getConfig: () => config });
  return { routeHost, calls, region, navigate(id) { core.router.currentRouteId = id; listener({to:id}); } };
}

test("configured home mounts and empty page opens editor", async () => {
  const h = harness({pages:{home:{kind:"dashboard",elements:[]}}});
  assert.equal(await h.routeHost.mount({querySelector: () => h.region}), true);
  assert.ok(h.calls.includes("mount:home"));
  assert.ok(h.calls.includes("edit"));
  h.routeHost.destroy();
  assert.equal(h.calls.at(-1), "destroy");
});

test("moving to unconfigured route tears down dashboard without remounting", async () => {
  const h = harness({pages:{home:{kind:"dashboard",elements:[{id:"one"}]}}});
  await h.routeHost.mount({querySelector: () => h.region});
  h.navigate("media");
  await Promise.resolve();
  assert.equal(h.calls.filter(x => x.startsWith("mount:")).length, 1);
  assert.equal(h.calls.at(-1), "destroy");
});

test("moving between configured dashboard routes mounts each separately", async () => {
  const h = harness({pages:{
    home:{kind:"dashboard",elements:[{id:"one"}]},
    house:{kind:"dashboard",elements:[{id:"two"}]},
  }});
  await h.routeHost.mount({querySelector: () => h.region});
  h.navigate("house");
  await Promise.resolve();
  assert.deepEqual(h.calls.filter(x => x.startsWith("mount:")), ["mount:home","mount:house"]);
});
