import test from "node:test";
import assert from "node:assert/strict";
import { createFakeDocument } from "./helpers/fake-dom.js";
import { createForecastOverlay } from "../custom_components/jamesui_next/frontend/modules/widget.weather-today/overlay.js";

test("forecast panel shows current hourly and daily entries", () => {
  const panel = createForecastOverlay(createFakeDocument(), { onClose: () => {} });
  panel.update({
    now: new Date("2026-10-09T09:00:00Z"),
    hourlySnapshot: { status: "available", value: { time_zone: "Europe/Berlin", units: {temperature: "°C"}, items: [
      { datetime: "2026-10-09T10:00:00Z", temperature: 14, condition: "cloudy" }
    ] } },
    dailySnapshot: { status: "available", value: { time_zone: "Europe/Berlin", units: {temperature: "°C"}, items: [
      { date: "2026-10-09", temperature_high: 17, temperature_low: 9, condition: "cloudy" }
    ] } },
  });
  assert.equal(panel.root.querySelectorAll("[data-jui-weather-forecast-hour]").length, 1);
  assert.equal(panel.root.querySelectorAll("[data-jui-weather-forecast-day]").length, 1);
  panel.update({ now: new Date(), hourlySnapshot: { status:"unavailable" }, dailySnapshot: { status:"unavailable" } });
  assert.equal(panel.root.querySelectorAll("[data-jui-weather-forecast-hour]").length, 0);
  assert.match(panel.root.querySelector("[data-jui-weather-forecast-empty]").textContent, /nicht verfügbar/);
  panel.destroy();
});
