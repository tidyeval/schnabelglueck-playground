import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { createMechanismStep, MACHINE } from '../src/mechanism.js';
import { createCurrentStep, CURRENT } from '../src/current.js';
import { createRun, stepRun, demoHolding } from '../src/model.js';
// The browser supplies Phaser's public Matter namespace; Node loads that same bundled engine without DOM setup.
const require = createRequire(import.meta.url);
const Matter = require(resolve(dirname(require.resolve('phaser/package.json')), 'src/physics/matter-js/CustomMain.js'));
const flow = createCurrentStep(Matter);
const machine = createMechanismStep(Matter);
const physics = (s, dt) => { flow(s, dt); machine(s, dt); };
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
    while (s.mode === 'playing' && s.time < 100) stepRun(s, 1 / 120, demoHolding(s, route), physics);
    assert.equal(s.mode, 'won', `${s.day} ${route}`); assert.equal(s.rockHits + s.scares + s.boat.netHits, 0);
    assert.equal(s.helpUsed, true); assert.equal(s.mechanism.passed, true); assert.ok(Number.isFinite(s.mechanism.angle)); assert.equal(s.cave.caught, route === 'risk' ? 4 : 0); assert.equal(s.current.entered, true); assert.ok(s.current.catches > 0);
    assert.ok(Object.values(s.features).every(Boolean)); assert.equal(s.gold, route === 'risk' ? 3 : 0);
  }
});

test('a tethered buoy stays latched without contact; a real push releases the counterweight', () => {
  const untouched = createRun('2026-11-07'); untouched.distance = MACHINE.buoyX - 400;
  for (let i = 0; i < 360; i++) machine(untouched, 1 / 120);
  assert.equal(untouched.mechanism.activated, false); assert.equal(untouched.mechanism.gateY, MACHINE.gateY);
  const pushed = createRun('2026-11-07'); pushed.distance = MACHINE.buoyX - 150; pushed.player.y = pushed.water + 60; pushed.player.wet = true;
  for (let i = 0; i < 480; i++) {
    machine(pushed, 1 / 120);
    for (const key of ['buoyX', 'buoyY', 'angle', 'weightX', 'weightY', 'gateX', 'gateY']) assert.ok(Number.isFinite(pushed.mechanism[key]), key);
  }
  assert.equal(pushed.mechanism.activated, true); assert.equal(pushed.mechanism.open, true);
  assert.ok(pushed.mechanism.weightY > MACHINE.pivotY + 100); assert.ok(pushed.mechanism.gateY < MACHINE.gateY - 95);
});
test('an unopened counterweight gate lets Pip retreat upward without getting stuck', () => {
  const s = createRun('2026-11-07'); s.distance = MACHINE.gateX - 110 - 42; s.player.y = 600; s.player.wet = true;
  const before = s.distance; stepRun(s, .02, true); assert.equal(s.distance, before);
  for (let i = 0; i < 480; i++) stepRun(s, 1 / 120, false);
  assert.equal(s.mode, 'playing'); assert.ok(s.distance > before + 200); assert.ok(s.player.y < 350); assert.equal(s.mechanism.passed, false);
});
