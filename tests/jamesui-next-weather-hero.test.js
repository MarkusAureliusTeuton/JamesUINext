import test from "node:test";
import assert from "node:assert/strict";
import { buildHeroModel, conditionPresentation, moonIconForPhase } from "../custom_components/jamesui_next/frontend/modules/widget.weather-today/model.js";
import { ALPINE_SCENE_ASSETS, alpineAssetForScene } from "../custom_components/jamesui_next/frontend/modules/widget.weather-today/assets.js";

const ready = value => ({status:"available",value});
const missing = {status:"unavailable",value:null};

test("weather hero never invents weather data when disconnected", () => {
  const model = buildHeroModel({
    currentSnapshot:missing,dailySnapshot:missing,sunSnapshot:missing,
    moonSnapshot:missing,atmosphereSnapshot:missing,now:new Date("2026-10-09T12:00:00Z"),
  });
  assert.equal(model.temperature,"—");
  assert.equal(model.backgroundAsset,null);
  assert.equal(model.condition.label,"Wetterdaten nicht verfügbar");
  assert.equal(model.facts.length,7);
});

test("scene mapping covers all eight local Next scenes without r11 resources", () => {
  assert.equal(Object.keys(ALPINE_SCENE_ASSETS).length,8);
  for (const [scene,url] of Object.entries(ALPINE_SCENE_ASSETS)) {
    assert.equal(alpineAssetForScene(scene),url);
    assert.match(url,/^\/jamesui_next_static\/assets\/alpine\/[a-z-]+\.webp$/);
    assert.ok(!url.includes("/jamesui_static/"));
  }
  assert.equal(alpineAssetForScene("unrecognized"),null);
});

test("weather scene uses atmosphere capability, not a hardcoded daylight assumption", () => {
  const base={currentSnapshot:ready({temperature:18,temperature_unit:"°C",condition:"sunny"}),
    dailySnapshot:missing,sunSnapshot:missing,moonSnapshot:missing,now:new Date("2026-10-09T22:00:00Z")};
  const day=buildHeroModel({...base,atmosphereSnapshot:ready({scene_key:"clear-day"})});
  const night=buildHeroModel({...base,atmosphereSnapshot:ready({scene_key:"clear-night"})});
  assert.equal(day.backgroundAsset,alpineAssetForScene("clear-day"));
  assert.equal(night.backgroundAsset,alpineAssetForScene("clear-night"));
  assert.notEqual(day.backgroundAsset,night.backgroundAsset);
});

test("clear-night uses configured moon phase icon and moon remains optional", () => {
  const full=conditionPresentation("clear-night","full_moon");
  assert.equal(full.iconId,moonIconForPhase("full_moon"));
  assert.equal(conditionPresentation("clear-night").label,"Klar");
  assert.equal(moonIconForPhase("invalid"),null);
});
