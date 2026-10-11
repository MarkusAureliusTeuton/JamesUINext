"""Real config-service CAS and persistence regression without a running HA instance."""
import importlib.util
import pathlib
import sys
import types
import unittest

BASE = pathlib.Path("custom_components/jamesui_next")
if "custom_components" not in sys.modules:
    pkg = types.ModuleType("custom_components")
    pkg.__path__ = [str(BASE.parent)]
    sys.modules[pkg.__name__] = pkg
if "custom_components.jamesui_next" not in sys.modules:
    pkg = types.ModuleType("custom_components.jamesui_next")
    pkg.__path__ = [str(BASE)]
    sys.modules[pkg.__name__] = pkg

def load_module(name):
    key = "custom_components.jamesui_next." + name
    if key in sys.modules:
        return sys.modules[key]
    spec = importlib.util.spec_from_file_location(key, BASE / (name + ".py"))
    module = importlib.util.module_from_spec(spec)
    sys.modules[key] = module
    spec.loader.exec_module(module)
    return module

schema = load_module("config_schema")
service_module = load_module("config_service")

class MemoryStorage:
    data = None
    writes = 0
    async def async_load(self):
        return self.data
    async def async_save(self, data):
        self.data = schema.validate_config(data)
        self.writes += 1

class RevisionedConfigTest(unittest.IsolatedAsyncioTestCase):
    async def test_conflicting_saves_are_rejected_and_survive_restart(self):
        storage = MemoryStorage()
        first = service_module.JamesUIConfigService(storage)
        self.assertTrue(await first.async_initialize(schema.initial_dashboard_config()))
        rev0 = first.revision
        self.assertEqual(len(rev0), 64)
        changed = first.snapshot()
        changed["module_settings"]["provider.weather"] = {"entity_id": "weather.home"}
        await first.async_replace(changed, expected_revision=rev0)
        self.assertNotEqual(first.revision, rev0)
        writes = storage.writes
        stale = schema.initial_dashboard_config()
        with self.assertRaises(service_module.ConfigConflictError):
            await first.async_replace(stale, expected_revision=rev0)
        self.assertEqual(writes, storage.writes)
        self.assertEqual(first.snapshot(), changed)
        restarted = service_module.JamesUIConfigService(storage)
        self.assertFalse(await restarted.async_initialize(schema.empty_config()))
        self.assertEqual(restarted.revision, first.revision)
        self.assertEqual(restarted.snapshot(), changed)

if __name__ == "__main__":
    unittest.main()
