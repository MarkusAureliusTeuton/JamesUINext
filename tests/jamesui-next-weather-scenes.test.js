import test from "node:test";
import assert from "node:assert/strict";
import { resolveAtmosphere, sunPeriod, weatherClass } from "../custom_components/jamesui_next/frontend/modules/provider.weather/atmosphere.js";
import { alpineAssetForScene } from "../custom_components/jamesui_next/frontend/modules/widget.weather-today/assets.js";

test("all HA weather classes produce valid standalone images for daylight", () => {
  const conditions = ["sunny","clear-night","partlycloudy","cloudy","rainy","pouring",
    "lightning","lightning-rainy","hail","snowy-rainy","snowy","fog","windy","windy-variant","exceptional"];
  for (const condition of conditions) {
    assert.ok(weatherClass(condition), condition);
    const scene = resolveAtmosphere({condition,period:"day"}).scene_key;
    assert.ok(alpineAssetForScene(scene), condition + " -> " + scene);
  }
});

test("night, sunset and twilight always resolve to available scenes", () => {
  for (const condition of ["sunny","cloudy","rainy","snowy","fog"]) {
    for (const period of ["day","golden","twilight","night"]) {
      const scene = resolveAtmosphere({condition,period}).scene_key;
      assert.ok(alpineAssetForScene(scene), condition + ", " + period + " -> " + scene);
    }
  }
});

test("invalid weather does not invent a scene, and sun elevation controls dayparts", () => {
  assert.equal(resolveAtmosphere({condition:"unknown",period:"day"}).scene_key,null);
  assert.equal(resolveAtmosphere({condition:"sunny",period:null}).scene_key,null);
  assert.equal(sunPeriod(-7,"below_horizon"),"night");
  assert.equal(sunPeriod(-4,"below_horizon"),"twilight");
  assert.equal(sunPeriod(5,"above_horizon"),"golden");
  assert.equal(sunPeriod(20,"above_horizon"),"day");
});
