import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, stepRun, stepSchool, demoHolding, ROCK, TIDE } from '../src/model.js';

for (const dt of [1 / 60, 1 / 120]) for (const route of ['safe', 'risk']) test(`${route} route is finishable at ${Math.round(1 / dt)} Hz`, () => {
  const s = createRun('2026-11-07');
  while (s.mode === 'playing' && s.time < 60) stepRun(s, dt, demoHolding(s, route));
  assert.equal(s.mode, 'won'); assert.ok(s.caught > 0); assert.ok(s.reactions > 0); assert.equal(s.rockHits, 0);
  if (route === 'risk') { assert.equal(s.gold, 3); assert.equal(s.bubbleUsed, true); assert.equal(s.routeComplete, true); }
  else { assert.equal(s.gold, 0); assert.equal(s.tunnelEntered, false); }
});
test('a nearby underwater Pip disperses the school; distant Pip does not trigger fear', () => {
  const s = createRun('2026-11-07'); s.player.wet = true; s.player.y = 480; s.distance = 500;
  const far = structuredClone(s); far.distance = 0;
  stepSchool(s, .02); stepSchool(far, .02);
  assert.ok(s.fish.some(f => f.group === 0 && f.reacted)); assert.equal(far.fish.filter(f => f.group === 0 && f.reacted).length, 0);
  assert.notEqual(s.fish[0].vy, far.fish[0].vy); assert.ok(s.fish.every(f => f.group < 0 || f.vx < 0));
});
test('air runs out underwater and recovers at the surface', () => {
  const s = createRun('2026-11-07'); for (let i = 0; i < 1200 && s.mode === 'playing'; i++) stepRun(s, 1 / 120, true);
  assert.equal(s.mode, 'lost'); assert.equal(s.player.breath, 0);
  const fresh = createRun('2026-11-07'); fresh.player.breath = 2; stepRun(fresh, .1, false); assert.ok(fresh.player.breath > 2);
});
test('reef collision resolves Pip to a free side and counts one hit', () => {
  const s = createRun('2026-11-07'); s.distance = ROCK.left - 110; s.player.y = ROCK.top - 10; s.player.wet = true;
  stepRun(s, .02, true); assert.equal(s.rockHits, 1); assert.ok(s.player.y <= ROCK.top - 18);
  stepRun(s, .02, true); assert.equal(s.rockHits, 1);
});
test('completed runs are immutable; invalid timesteps fail with context', () => {
  const s = createRun('2026-11-07'); s.mode = 'won'; const before = structuredClone(s); stepRun(s, .02, true); assert.deepEqual(s, before);
  for (const dt of [NaN, -1, 0, 1]) assert.throws(() => stepRun(s, dt, false), /Simulation step/);
});

test('fish dodge smoothly without reversing direction', () => {
  const s = createRun('2026-11-07'); s.player.wet = true; s.player.y = 490; s.distance = 500;
  for (let i = 0; i < 600; i++) {
    s.time += 1 / 120;
    const previous = s.fish.map(f => ({ x: f.x, heading: f.heading })); stepSchool(s, 1 / 120);
    s.fish.forEach((f, j) => { if (f.group >= 0) { assert.ok(f.x < previous[j].x); assert.ok(Math.abs(f.heading) <= .32); assert.ok(Math.abs(f.heading - previous[j].heading) < .03); } });
  }
});
test('shark disperses fish even when Pip stays above water', () => {
  const near = createRun('2026-11-07'), far = structuredClone(near);
  near.shark = { x: near.fish[12].x, y: 510, active: true }; far.shark.active = false;
  stepSchool(near, .02); stepSchool(far, .02);
  assert.ok(near.fish.some(f => f.group === 1 && f.reacted)); assert.equal(far.reactions, 0);
});
test('closed tide passage waits; opening commits passage without trapping Pip', () => {
  const s = createRun('2026-11-07'); s.distance = TIDE.left - 110 - 22; s.player.y = 480; s.player.wet = true;
  const phase = s.seed % 628 / 100; s.time = ((Math.PI / 2 - phase + Math.PI * 2) % (Math.PI * 2)) * 4 / Math.PI;
  const before = s.distance; stepRun(s, .02, true); assert.equal(s.distance, before); assert.ok(s.tideWait > 0);
  s.time += 4; stepRun(s, .02, false); assert.equal(s.tideCommitted, true); assert.ok(s.distance > before);
  s.time += 4; stepRun(s, .02, true); assert.equal(s.tideOpen, true);
});
test('later animal help requires the earlier rescue', () => {
  const missed = createRun('2026-11-07'); missed.distance = 5950; stepRun(missed, .02, false); assert.equal(missed.guideRevealed, false);
  const helped = createRun('2026-11-07'); helped.player.y = 470; helped.player.wet = true; helped.distance = helped.turtle.x - 140;
  stepRun(helped, .02, true); assert.equal(helped.turtle.helped, true);
  helped.distance = 5950; stepRun(helped, .02, false); assert.equal(helped.guideRevealed, true);
  helped.distance = 6150 - 110; helped.player.y = 475; helped.player.breath = 2; stepRun(helped, .02, false);
  assert.equal(helped.guideBubbleUsed, true); assert.ok(helped.player.breath > 4);
});
test('both demonstrations finish the six ideas across a month of daily layouts', () => {
  for (let day = 1; day <= 30; day++) for (const route of ['safe', 'risk']) {
    const s = createRun(`2026-11-${String(day).padStart(2, '0')}`);
    while (s.mode === 'playing' && s.time < 65) stepRun(s, 1 / 120, demoHolding(s, route));
    assert.equal(s.mode, 'won', `${s.day} ${route}`); assert.equal(s.rockHits, 0); assert.equal(s.scares, 0);
    assert.ok(Object.values(s.features).every(Boolean)); assert.deepEqual(s.story, ['shark', 'boat', 'rest']);
    assert.ok(s.guideCaught > 0); assert.equal(s.tidePassed, route === 'risk'); assert.equal(s.tideBypassed, route === 'safe');
    assert.equal(s.gold, route === 'risk' ? 3 : 0);
  }
});

test('the solid tide reef cannot be swum through above or below the passage', () => {
  for (const y of [410, 560]) {
    const s = createRun('2026-11-07'); s.distance = TIDE.left - 110; s.player.y = y; s.player.wet = true;
    stepRun(s, .02, true); assert.equal(s.rockHits, 1); assert.ok(s.player.y <= 377 || s.player.y === 443 || s.player.y === 527 || s.player.y >= 625);
  }
});
