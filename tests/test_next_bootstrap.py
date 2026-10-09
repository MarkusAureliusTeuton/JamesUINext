"""Pure-Python regression tests for first-run JamesUINext storage data."""

import importlib.util
import pathlib
import unittest

SCHEMA_PATH = pathlib.Path("custom_components/jamesui_next/config_schema.py")
spec = importlib.util.spec_from_file_location("jamesui_next_config_schema", SCHEMA_PATH)
schema = importlib.util.module_from_spec(spec)
spec.loader.exec_module(schema)


class InitialDashboardTest(unittest.TestCase):
    def test_home_has_self_contained_weather_hero(self):
        config = schema.initial_dashboard_config()
        self.assertEqual(config["schema_version"], 1)
        home = config["pages"]["home"]
        self.assertEqual(home["layout_id"], "main")
        self.assertEqual(home["kind"], "dashboard")
        self.assertEqual(home["hero_widget_id"], "home_weather")
        self.assertEqual(config["widget_instances"]["home_weather"]["module_id"], "widget.weather-today")
        self.assertEqual(home["elements"], [])
        self.assertEqual(schema.validate_config(config), config)

    def test_defaults_do_not_share_mutable_state(self):
        a = schema.initial_dashboard_config()
        b = schema.initial_dashboard_config()
        a["widget_instances"]["home_weather"]["config"]["custom"] = 1
        self.assertNotIn("custom", b["widget_instances"]["home_weather"]["config"])

    def test_no_legacy_r11_sources_in_default_config(self):
        text = str(schema.initial_dashboard_config()).lower()
        self.assertNotIn("jamesui_static", text)
        self.assertNotIn("r11", text)


if __name__ == "__main__":
    unittest.main()
