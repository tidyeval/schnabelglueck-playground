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
  await page.clock.runFor(65000);
  await expect.poll(async () => (await snap()).mode, { timeout: 60000 }).toBe('won');
  const s = await snap(); expect(s.reactions).toBeGreaterThan(0); expect(s.rockHits).toBe(0);
  expect(s.gold).toBe(route === 'risk' ? 3 : 0); expect(s.routeComplete).toBe(route === 'risk');
  expect(Object.values(s.features).every(Boolean)).toBe(true); expect(s.tidePassed).toBe(route === 'risk'); expect(s.guideCaught).toBeGreaterThan(0); expect(s.helpUsed).toBe(true); expect(s.boat.warned).toBe(true); expect(s.boat.netHits).toBe(0); expect(s.current.entered).toBe(true); expect(s.current.catches).toBeGreaterThan(0); expect(s.bestCombo).toBeGreaterThan(1); expect(s.presentation.audioReady).toBe(true);
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
  const sky = await page.locator('#game').evaluate(c => ({ width: c.width, rgba: [...c.getContext('2d').getImageData(500, 200, 1, 1).data] }));
  expect(sky.width).toBe(960); expect(sky.rgba[0]).toBeGreaterThan(100); expect(sky.rgba[3]).toBe(255);
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
