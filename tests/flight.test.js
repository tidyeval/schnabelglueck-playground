import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFlight, stepFlight, demoFlightTarget, flightBlend, FLIGHT } from '../src/flight.js';
import { createRun, stepRun } from '../src/model.js';
import { cameraTarget } from '../src/camera.js';
test('flight demo passes every ring at 60 and 120 Hz with a continuous entry and exit', () => {
  for (const dt of [1 / 60, 1 / 120]) {
    const f = createFlight(); f.active = true; let score = 0, last = 0;
    while (!f.completed) { score += stepFlight(f, dt, 0, demoFlightTarget(f)); const blend = flightBlend(f); assert.ok(Math.abs(blend - last) < .03); last = blend; }
    assert.equal(score, 125); assert.equal(f.passed, 5); assert.equal(f.missed, 0); assert.equal(flightBlend(f), 0);
  }
});
test('flight input stays bounded; missed rings never trap or end a flight early', () => {
  const f = createFlight(); f.active = true;
  for (let i = 0; i < 1600; i++) { if (!f.completed) stepFlight(f, 1 / 120, 1); assert.ok(f.x <= 1 && f.x >= -1); }
  assert.equal(f.completed, true); assert.equal(f.missed, 5);
});
test('only the designated airborne scene triggers the perspective switch; wind can be overridden', () => {
  const s = createRun('2026-11-07'); s.distance = FLIGHT.start - 220;
  for (let i = 0; i < 240; i++) stepRun(s, 1 / 120, false);
  assert.equal(s.wind.visited, true); assert.ok(s.wind.highest < 210); assert.equal(s.flight.active, true);
  const bypass = createRun('2026-11-07'); bypass.distance = FLIGHT.start - 220; bypass.player.y = 500; bypass.player.wet = true;
  for (let i = 0; i < 400; i++) stepRun(bypass, 1 / 120, true);
  assert.equal(bypass.flight.started, false);
});
test('camera stays calm between encounters, looks gently down at dives and honors reduced motion', () => {
  const s = createRun('2026-11-07');
  for (const x of [500, 1700, 4800, 7000, 13900]) { s.distance = x; assert.deepEqual(cameraTarget(s), { scroll: 0, y: 0, zoom: 1 }); }
  s.distance = 3700; s.player.y = 660; const target = cameraTarget(s); assert.equal(target.y, 14); assert.equal(target.scroll, 32); assert.ok(target.zoom >= .965);
  assert.deepEqual(cameraTarget(s, true), { scroll: 0, y: 0, zoom: 1 }); s.flight.active = true; assert.deepEqual(cameraTarget(s), { scroll: 0, y: 0, zoom: 1 });
});
