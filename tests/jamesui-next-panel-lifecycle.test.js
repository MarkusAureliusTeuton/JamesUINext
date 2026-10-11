import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createFakeDocument } from "./helpers/fake-dom.js";

const entry = readFileSync(new URL("../custom_components/jamesui_next/frontend/jamesui-next-entry.js", import.meta.url), "utf8")
  .replace('await import("/jamesui_next_static/jamesui-next-preview.js")', "await mockImport()");
const tick = () => new Promise(resolve => setImmediate(resolve));

function harness({ failMount = false } = {}) {
  const document = createFakeDocument();
  let panelClass = null;
  const events = [];
  class HTMLElement {
    constructor() { this.isConnected = false; }
    attachShadow() { this.shadowRoot = document.createElement("section"); return this.shadowRoot; }
  }
  vm.runInNewContext(entry, {
    document, HTMLElement,
    customElements: { get: () => panelClass, define: (_tag, klass) => { panelClass = klass; } },
    mockImport: async () => ({
      createJamesUINextPreview: () => {
        const instance = { core: {}, async mount() { events.push("mount"); if (failMount) throw new Error("HA config unavailable"); }, destroy() { events.push("destroy"); } };
        events.push("create");
        return instance;
      },
    }),
  });
  const panel = new panelClass();
  return {panel,events};
}

test("panel waits for HA context before booting and mounts on later assignment", async () => {
  const {panel,events} = harness();
  panel.isConnected = true;
  panel.connectedCallback();
  await tick();
  assert.deepEqual(events, []);
  panel.hass = { connected: true };
  await tick();
  assert.deepEqual(events, ["create","mount"]);
  panel.disconnectedCallback();
  assert.equal(events.at(-1),"destroy");
});

test("panel does not mount after it has been detached", async () => {
  const {panel,events} = harness();
  panel.isConnected = true;
  panel.connectedCallback();
  panel.isConnected = false;
  panel.disconnectedCallback();
  panel.hass = {connected:true};
  await tick();
  assert.deepEqual(events,[]);
});

test("a failed HA startup shows a visible error instead of a black panel", async () => {
  const { panel, events } = harness({ failMount: true });
  panel.isConnected = true;
  panel.connectedCallback();
  panel.hass = { connected: true };
  await tick();
  await tick();
  const issue = panel.shadowRoot.querySelector("[data-jui-startup-error]");
  assert.ok(issue, "a readable startup error must be rendered");
  assert.equal(issue.getAttribute("role"), "alert");
  assert.match(issue.textContent, /HA config unavailable/);
  assert.ok(events.includes("destroy"), "failed startup must clean up its runtime");
  panel.disconnectedCallback();
});

test("waiting for Home Assistant always renders a readable status", () => {
  const { panel } = harness();
  panel.isConnected = true;
  panel.connectedCallback();
  const status = panel.host.children[0];
  assert.ok(status, "status must be visible before hass arrives");
  assert.equal(status.getAttribute("role"), "status");
  assert.match(status.textContent, /wartet auf Home Assistant/);
  assert.equal(panel.host.style.color, "#f2eee7");
  panel.disconnectedCallback();
});
