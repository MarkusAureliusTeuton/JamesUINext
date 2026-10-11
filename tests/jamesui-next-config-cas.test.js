import test from "node:test";
import assert from "node:assert/strict";
import { createConfigService } from "../custom_components/jamesui_next/frontend/core/config-service.js";

const initial = () => ({
  schema_version: 1,
  pages: {}, layouts: {}, widget_instances: {}, dynamic_buttons: {}, data_sources: {}, module_settings: {},
});

test("independent Next clients cannot overwrite another editor's committed configuration", async () => {
  let persisted = initial();
  let counter = 0;
  const revision = () => String(counter).padStart(64, "0");
  const transport = {
    async callWS(msg) {
      if (msg.type === "jamesui_next/config/get") {
        return { config: structuredClone(persisted), revision: revision() };
      }
      if (msg.type === "jamesui_next/config/replace") {
        if (msg.expected_revision !== revision()) throw new Error("config_conflict");
        persisted = structuredClone(msg.config);
        counter += 1;
        return { config: structuredClone(persisted), revision: revision() };
      }
      throw new Error("unexpected API call");
    },
  };
  const a = createConfigService({ homeAssistant: transport });
  const b = createConfigService({ homeAssistant: transport });
  await Promise.all([a.load(), b.load()]);
  assert.equal(a.revision, b.revision);
  await a.update(config => ({ ...config, module_settings: { a: { active: true } } }));
  assert.equal(a.revision, revision());
  await assert.rejects(
    b.update(config => ({ ...config, module_settings: { b: { active: true } } })),
    /config_conflict/,
  );
  assert.deepEqual(persisted.module_settings, { a: { active: true } });
  assert.deepEqual(b.snapshot().module_settings, {});
  await b.load();
  await b.update(config => ({ ...config, module_settings: { ...config.module_settings, b: { active: true } } }));
  assert.deepEqual(persisted.module_settings, { a: { active: true }, b: { active: true } });
  a.destroy();
  b.destroy();
});
