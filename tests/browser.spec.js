import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
for (const route of ['safe', 'risk']) test(`${route}: complete course, pause and fresh restart`, async ({ page }, info) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.clock.install(); await page.goto(''); await page.locator(`#${route}`).click();
  const snap = () => page.evaluate(() => window.playground.snapshot());
  await page.clock.runFor(1500);
  await expect.poll(async () => (await snap()).player.wet).toBe(true);
  await page.locator('#pause').click(); const paused = await snap();
  await page.waitForTimeout(250); expect(await snap()).toEqual(paused);
  await page.locator('#start').click();
  await page.clock.runFor(100000);
  await expect.poll(async () => (await snap()).mode, { timeout: 60000 }).toBe('won');
  const s = await snap(); expect(s.reactions).toBeGreaterThan(0); expect(s.rockHits).toBe(0);
  expect(s.gold).toBe(route === 'risk' ? 3 : 0); expect(s.routeComplete).toBe(route === 'risk');
  expect(Object.values(s.features).every(Boolean)).toBe(true); expect(s.tidePassed).toBe(route === 'risk'); expect(s.guideCaught).toBeGreaterThan(0); expect(s.helpUsed).toBe(true); expect(s.boat.warned).toBe(true); expect(s.boat.netHits).toBe(0); expect(s.current.entered).toBe(true); expect(s.current.catches).toBeGreaterThan(0); expect(s.bestCombo).toBeGreaterThan(1); expect(s.presentation.audioReady).toBe(true); expect(s.mechanism.passed).toBe(true); expect(s.cave.caught).toBe(route === 'risk' ? 4 : 0); expect(s.presentation.camera.maxAhead).toBeGreaterThan(30); expect(s.presentation.camera.minZoom).toBeLessThan(.97); expect(s.presentation.glowFilters).toBe(4); expect(s.flight.completed).toBe(true); expect(s.flight.passed).toBe(5); expect(s.mechanism.splashed).toBe(true); expect(s.mechanism.chainCaught).toBeGreaterThan(0);
  await expect(page.locator('#daily')).toContainText(`Dein Rekord: ${s.score}`);
  expect(errors).toEqual([]); mkdirSync('results', { recursive: true });
  await page.screenshot({ path: `results/${route}-${info.project.name}.png`, fullPage: true });
  await page.reload(); await expect(page.locator('#daily')).toContainText(`Dein Rekord: ${s.score}`);
  await page.locator('#start').click(); const fresh = await snap(); expect(fresh.caught).toBe(0); expect(fresh.distance).toBeLessThan(30);
});
test('real keyboard hold/release and narrow touch layout', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await context.newPage(); await page.goto(process.env.PLAYGROUND_URL || 'http://127.0.0.1:4199');
  await page.locator('#start').click();
  expect(await page.locator('#game').evaluate(c => c.width)).toBe(960);
  const world = await page.locator('#world').evaluate(c => ({ width: c.width, pixel: [...c.getContext('2d').getImageData(500, 200, 1, 1).data] }));
  expect(world.width).toBe(960); expect(world.pixel[0]).toBeGreaterThan(100); expect(world.pixel[3]).toBe(255);
  expect(await page.evaluate(() => window.playground.snapshot().presentation.renderer)).toBe('webgl');
  await page.keyboard.down('Space'); await expect.poll(() => page.evaluate(() => window.playground.snapshot().player.y)).toBeGreaterThan(400);
  await page.keyboard.up('Space'); await expect.poll(() => page.evaluate(() => window.playground.snapshot().player.y)).toBeLessThan(350);
  await page.locator('#game').scrollIntoViewIfNeeded(); const box = await page.locator('#game').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await expect.poll(() => page.evaluate(() => window.playground.snapshot().player.y)).toBeGreaterThan(400); await page.mouse.up();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await expect.poll(() => page.evaluate(() => window.playground.snapshot().mode)).toBe('paused');
  await context.close();
});

for (const depth of [470, 530]) test(`keyboard rescue at depth ${depth}: ring is a deliberate target`, async ({ page }) => {
  await page.clock.install(); await page.goto(''); await page.locator('#start').click();
  let down = false, s;
  for (let i = 0; i < 85; i++) {
    s = await page.evaluate(() => window.playground.snapshot());
    const target = s.distance < 550 ? 495 : depth, next = s.player.y < target;
    if (next !== down) { await page.keyboard[next ? 'down' : 'up']('Space'); down = next; }
    await page.clock.runFor(100);
  }
  await page.keyboard.up('Space'); s = await page.evaluate(() => window.playground.snapshot());
  expect(s.turtle.helped).toBe(depth === 530); expect(s.demo).toBe(null);
  expect(s.presentation.soundsPlayed).toBeGreaterThan(0);
  for (let i = 0; i < 6; i++) { await page.locator('#sound').click(); await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', String(i % 2 === 0)); }
});

for (const reducedMotion of ['no-preference', 'reduce']) test(`camera preview and pause with motion preference ${reducedMotion}`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion }); await page.clock.install(); await page.goto(''); await page.locator('#risk').click();
  await page.clock.runFor(19500);
  const view = await page.evaluate(() => window.playground.snapshot().presentation.camera);
  if (reducedMotion === 'reduce') { expect(view.scroll).toBe(0); expect(view.zoom).toBe(1); }
  else { expect(view.scroll).toBeGreaterThan(20); expect(view.zoom).toBeLessThan(.98); }
  await page.locator('#pause').click(); const paused = await page.evaluate(() => window.playground.snapshot());
  const before = await page.locator('#game').screenshot(); await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.playground.snapshot())).toEqual(paused);
  expect(await page.locator('#game').screenshot()).toEqual(before);
});

test('short frontal flight demo returns to side view, preserves records and pauses', async ({ page }) => {
  await page.clock.install(); await page.goto('?test=flight');
  const before = await page.evaluate(() => ({ ...localStorage }));
  await page.locator('#flight-demo').click(); await page.clock.runFor(4500);
  const snap = () => page.evaluate(() => window.playground.snapshot());
  expect((await snap()).flight.active).toBe(true); await expect(page.locator('#controls')).toContainText('A/D');
  await page.locator('#pause').click(); const paused = await snap(); await page.clock.runFor(700); expect(await snap()).toEqual(paused);
  await page.locator('#start').click(); await page.clock.runFor(16000); const end = await snap();
  expect(end.mode).toBe('won'); expect(end.flight.passed).toBe(5); expect(end.flight.active).toBe(false); expect(end.player.wet).toBe(false);
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before);
  await page.screenshot({ path: `results/flight-completed-${test.info().project.name}.png`, fullPage: true });
});
test('frontal flight accepts real arrow keys and dragging, then safely returns even after misses', async ({ page }) => {
  await page.clock.install(); await page.goto('?test=flight'); await page.locator('#start').click(); await page.clock.runFor(2500);
  const snap = () => page.evaluate(() => window.playground.snapshot()); expect((await snap()).flight.active).toBe(true);
  await page.keyboard.down('ArrowLeft'); await page.clock.runFor(450); await page.keyboard.up('ArrowLeft'); expect((await snap()).flight.x).toBeLessThan(-.35);
  await page.keyboard.down('ArrowRight'); await page.clock.runFor(950); await page.keyboard.up('ArrowRight'); expect((await snap()).flight.x).toBeGreaterThan(.3);
  await page.locator('#game').scrollIntoViewIfNeeded(); const box = await page.locator('#game').boundingBox();
  await page.mouse.move(box.x + box.width * .2, box.y + box.height * .65); await page.mouse.down(); await page.clock.runFor(1200);
  expect((await snap()).flight.x).toBeLessThan(-.4); await page.mouse.move(box.x + box.width * .8, box.y + box.height * .65); await page.clock.runFor(1300);
  expect((await snap()).flight.x).toBeGreaterThan(.4); await page.mouse.up();
  await page.clock.runFor(20000); expect((await snap()).mode).toBe('won'); expect((await snap()).flight.completed).toBe(true);
});
