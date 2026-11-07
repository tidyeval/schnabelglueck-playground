import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, stepRun, stepSchool, demoHolding, ROCK } from '../src/model.js';

for (const dt of [1 / 60, 1 / 120]) for (const route of ['safe', 'risk']) test(`${route} route is finishable at ${Math.round(1 / dt)} Hz`, () => {
  const s = createRun();
  while (s.mode === 'playing' && s.time < 60) stepRun(s, dt, demoHolding(s, route));
  assert.equal(s.mode, 'won'); assert.ok(s.caught > 0); assert.ok(s.reactions > 0); assert.equal(s.rockHits, 0);
  if (route === 'risk') { assert.equal(s.gold, 3); assert.equal(s.bubbleUsed, true); assert.equal(s.routeComplete, true); }
  else { assert.equal(s.gold, 0); assert.equal(s.tunnelEntered, false); }
});
test('a nearby underwater Pip disperses the school; distant Pip does not trigger fear', () => {
  const s = createRun(); s.player.wet = true; s.player.y = 480; s.distance = 500;
  const far = structuredClone(s); far.distance = 0;
  stepSchool(s, .02); stepSchool(far, .02);
  assert.ok(s.fish.some(f => f.group === 0 && f.reacted)); assert.equal(far.fish.filter(f => f.group === 0 && f.reacted).length, 0);
  assert.ok(s.fish[0].vx > far.fish[0].vx);
});
test('air runs out underwater and recovers at the surface', () => {
  const s = createRun(); for (let i = 0; i < 1200 && s.mode === 'playing'; i++) stepRun(s, 1 / 120, true);
  assert.equal(s.mode, 'lost'); assert.equal(s.player.breath, 0);
  const fresh = createRun(); fresh.player.breath = 2; stepRun(fresh, .1, false); assert.ok(fresh.player.breath > 2);
});
test('reef collision resolves Pip to a free side and counts one hit', () => {
  const s = createRun(); s.distance = ROCK.left - 110; s.player.y = ROCK.top - 10; s.player.wet = true;
  stepRun(s, .02, true); assert.equal(s.rockHits, 1); assert.ok(s.player.y <= ROCK.top - 18);
  stepRun(s, .02, true); assert.equal(s.rockHits, 1);
});
test('completed runs are immutable; invalid timesteps fail with context', () => {
  const s = createRun(); s.mode = 'won'; const before = structuredClone(s); stepRun(s, .02, true); assert.deepEqual(s, before);
  for (const dt of [NaN, -1, 0, 1]) assert.throws(() => stepRun(s, dt, false), /Simulation step/);
});
