import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createFakeDocument } from "./helpers/fake-dom.js";

const entry = readFileSync(new URL("../custom_components/jamesui_next/frontend/jamesui-next-entry.js", import.meta.url), "utf8")
  .replace('await import("/jamesui_next_static/jamesui-next-preview.js")', "await mockImport()");
const tick = () => new Promise(resolve => setImmediate(resolve));

function harness() {
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
        const instance = { core: {}, async mount() { events.push("mount"); }, destroy() { events.push("destroy"); } };
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
