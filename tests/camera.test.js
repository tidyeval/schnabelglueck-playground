import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, stepRun } from '../src/model.js';
import { cameraTarget } from '../src/camera.js';
import { WIND } from '../src/wind.js';
test('updraft remains controllable in side view and never activates a perspective scene', () => {
  const s = createRun('2026-11-07'); s.distance = WIND.left - 130;
  for (let i = 0; i < 300; i++) stepRun(s, 1 / 120, false);
  assert.equal(s.wind.visited, true); assert.ok(s.wind.highest < 210); assert.equal('flight' in s, false);
  const high = s.player.y;
  for (let i = 0; i < 100; i++) stepRun(s, 1 / 120, true);
  assert.ok(s.player.y > high + 30);
});
test('camera stays calm between encounters, looks gently down at dives and honors reduced motion', () => {
  const s = createRun('2026-11-07');
  for (const x of [500, 1700, 4800, 7000, 12200]) { s.distance = x; assert.deepEqual(cameraTarget(s), { scroll: 0, y: 0, zoom: 1 }); }
  s.distance = 3700; s.player.y = 660; const target = cameraTarget(s);
  assert.equal(target.y, 14); assert.equal(target.scroll, 32); assert.ok(target.zoom >= .965);
  assert.deepEqual(cameraTarget(s, true), { scroll: 0, y: 0, zoom: 1 });
});
