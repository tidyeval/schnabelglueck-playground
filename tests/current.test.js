import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { createCurrentStep, CURRENT } from '../src/current.js';
import { createRun, stepRun, demoHolding } from '../src/model.js';
// The browser supplies Phaser's public Matter namespace; Node loads that same bundled engine without DOM setup.
const require = createRequire(import.meta.url);
const Matter = require(resolve(dirname(require.resolve('phaser/package.json')), 'src/physics/matter-js/CustomMain.js'));
const flow = createCurrentStep(Matter);
test('Matter sensor applies a measurable current only underwater, then fades outside', () => {
  const inWater = createRun('2026-11-07'); inWater.distance = CURRENT.left; inWater.player.y = 490; inWater.player.wet = true;
  for (let i = 0; i < 120; i++) flow(inWater, 1 / 120);
  assert.equal(inWater.current.active, true); assert.ok(inWater.current.speed > 100);
  const air = createRun('2026-11-07'); air.distance = CURRENT.left; air.player.y = 265;
  for (let i = 0; i < 120; i++) flow(air, 1 / 120);
  assert.equal(air.current.active, false); assert.equal(air.current.speed, 0);
  const before = inWater.current.speed; inWater.player.y = 265; inWater.player.wet = false;
  for (let i = 0; i < 120; i++) flow(inWater, 1 / 120);
  assert.ok(inWater.current.speed < before / 4);
});
test('both whole routes survive a month of layouts with actual Matter forces', () => {
  for (let day = 1; day <= 30; day++) for (const route of ['safe', 'risk']) {
    const s = createRun(`2026-11-${String(day).padStart(2, '0')}`);
    while (s.mode === 'playing' && s.time < 80) stepRun(s, 1 / 120, demoHolding(s, route), flow);
    assert.equal(s.mode, 'won', `${s.day} ${route}`); assert.equal(s.rockHits + s.scares + s.boat.netHits, 0);
    assert.equal(s.helpUsed, true); assert.equal(s.current.entered, true); assert.ok(s.current.catches > 0);
    assert.ok(Object.values(s.features).every(Boolean)); assert.equal(s.gold, route === 'risk' ? 3 : 0);
  }
});
