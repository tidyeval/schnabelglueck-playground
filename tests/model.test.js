import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, stepRun, stepSchool, demoHolding, ROCK, TIDE, HELP } from '../src/model.js';

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
test('rescue requires the net knot, not mere proximity to the turtle', () => {
  const missed = createRun('2026-11-07'); missed.distance = missed.turtle.x - 140; missed.player.y = 470; missed.player.wet = true;
  stepRun(missed, .02, false); assert.equal(missed.turtle.helped, false);
  const rescued = createRun('2026-11-07'); rescued.distance = rescued.turtle.netX - 150; rescued.player.y = 530; rescued.player.wet = true;
  stepRun(rescued, .02, true); assert.equal(rescued.turtle.helped, true); assert.ok(rescued.turtle.freedAt > 0);
  rescued.distance = 5800; stepRun(rescued, .02, false); assert.equal(rescued.guideRevealed, true);
  rescued.distance = HELP.left - 80; stepRun(rescued, .02, false); assert.equal(rescued.helpOpen, true); assert.equal(rescued.helpEntered, true);
  rescued.distance = HELP.right; stepRun(rescued, .02, false); assert.equal(rescued.helpUsed, true); assert.equal(rescued.features.help, true);
});
test('unrescued turtle leaves the shortcut closed; upper bypass remains possible', () => {
  const s = createRun('2026-11-07'); s.distance = HELP.left - 110 - 22; s.player.y = 480; s.player.wet = true;
  const before = s.distance; stepRun(s, .02, false); assert.equal(s.distance, before); assert.equal(s.helpOpen, false);
  for (let i = 0; i < 360; i++) stepRun(s, 1 / 120, false);
  assert.equal(s.mode, 'playing'); assert.ok(s.distance > before + 200); assert.ok(s.player.y < 395); assert.equal(s.helpUsed, false);
});
test('net has a warning, a real shared outline, a penalty, and room below', () => {
  const s = createRun('2026-11-07'); s.distance = s.boat.x - 110 - 419;
  stepRun(s, .02, false); assert.equal(s.boat.warned, true); assert.ok(s.boat.cast < .85); assert.equal(s.boat.netHits, 0);
  s.boat.cast = 2.2; s.distance = s.boat.x - 70 - 110; s.player.y = s.water + 90; s.player.wet = true; s.score = 100;
  stepRun(s, .02, true); assert.equal(s.boat.netHits, 1); assert.ok(s.score < 100);
  const below = createRun('2026-11-07'); below.boat.thrown = true; below.boat.cast = 2.2; below.distance = below.boat.x - 70 - 110; below.player.y = 620; below.player.wet = true;
  stepRun(below, .02, true); assert.equal(below.boat.netHits, 0);
});
test('quick catches extend a rewarded series; a gap starts a new one', () => {
  const s = createRun('2026-11-07'); s.player.y = 480; s.player.wet = true;
  const putFish = () => s.fish.push({ id: 'test', group: -1, x: s.distance + 150, y: 465, caught: false });
  putFish(); stepRun(s, .02, true); const first = s.score;
  putFish(); stepRun(s, .02, false); assert.equal(s.combo, 2); assert.ok(s.score - first > first);
  s.time += 2; putFish(); stepRun(s, .02, true); assert.equal(s.combo, 1); assert.equal(s.bestCombo, 2);
});
test('both demonstrations finish the six ideas across a month of daily layouts', () => {
  for (let day = 1; day <= 30; day++) for (const route of ['safe', 'risk']) {
    const s = createRun(`2026-11-${String(day).padStart(2, '0')}`);
    while (s.mode === 'playing' && s.time < 65) stepRun(s, 1 / 120, demoHolding(s, route));
    assert.equal(s.mode, 'won', `${s.day} ${route}`); assert.equal(s.rockHits, 0); assert.equal(s.scares, 0);
    assert.ok(Object.values(s.features).every(Boolean)); assert.deepEqual(s.story, ['shark', 'boat', 'rest']);
    assert.ok(s.guideCaught > 0); assert.equal(s.helpUsed, true); assert.equal(s.boat.netHits, 0); assert.equal(s.boat.dodged, true); assert.equal(s.tidePassed, route === 'risk'); assert.equal(s.tideBypassed, route === 'safe');
    assert.equal(s.gold, route === 'risk' ? 3 : 0);
  }
});

test('the solid tide reef cannot be swum through above or below the passage', () => {
  for (const y of [410, 560]) {
    const s = createRun('2026-11-07'); s.distance = TIDE.left - 110 + 40; s.player.y = y; s.player.wet = true;
    stepRun(s, .02, true); assert.equal(s.rockHits, 1); assert.ok(s.player.y <= 377 || s.player.y === 443 || s.player.y === 527 || s.player.y >= 625);
  }
});
