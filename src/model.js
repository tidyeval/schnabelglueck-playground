export const W = 480, H = 850, WATER = 360, LENGTH = 6500, SPEED = 170;
export const ROCK = { left: 3080, right: 4080, top: 535, bottom: 600 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function createRun() {
  const fish = [];
  for (const [group, cx, cy] of [[0, 650, 480], [1, 1950, 505], [2, 5350, 480]]) {
    for (let i = 0; i < 12; i++) fish.push({ id: `${group}-${i}`, group, x: cx + (i % 4) * 27, y: cy + Math.floor(i / 4) * 24,
      homeY: cy + Math.floor(i / 4) * 24, vx: 0, vy: 0, phase: i * 1.7, caught: false, reacted: false });
  }
  for (let i = 0; i < 3; i++) fish.push({ id: `gold-${i}`, group: -1, golden: true, x: 3260 + i * 300, y: 680, caught: false });
  return { mode: 'playing', time: 0, distance: 0, player: { x: 110, y: 265, vy: 0, wet: false, breath: 8 }, fish,
    score: 0, caught: 0, gold: 0, reactions: 0, rockHits: 0, scares: 0, bubbleUsed: false, tunnelEntered: false,
    routeComplete: false, invulnerable: 0, event: '', eventUntil: 0, shark: { x: 2170, y: 620 } };
}
function message(s, text) { s.event = text; s.eventUntil = s.time + 2.2; }
export function stepSchool(s, dt) {
  const px = s.distance + s.player.x;
  const groups = new Map();
  for (const f of s.fish) if (!f.caught && !f.golden) {
    const g = groups.get(f.group) || { x: 0, y: 0, n: 0 }; g.x += f.x; g.y += f.y; g.n++; groups.set(f.group, g);
  }
  for (const f of s.fish) {
    if (f.caught || f.golden) continue;
    const g = groups.get(f.group);
    let ax = (g.x / g.n - f.x) * .6, ay = (g.y / g.n - f.y) * .7 + (f.homeY + Math.sin(s.time * 2 + f.phase) * 10 - f.y) * .8;
    for (const other of s.fish) {
      if (other === f || other.caught || other.group !== f.group) continue;
      const dx = f.x - other.x, dy = f.y - other.y, d2 = dx * dx + dy * dy;
      if (d2 > 0 && d2 < 24 * 24) { ax += dx * 20; ay += dy * 20; }
    }
    let scared = false;
    for (const threat of [s.player.wet ? { x: px, y: s.player.y, radius: 135 } : null, { ...s.shark, radius: 190 }]) {
      if (!threat) continue;
      const dx = f.x - threat.x, dy = f.y - threat.y, d = Math.hypot(dx, dy);
      if (d < threat.radius) {
        const strength = (1 - d / threat.radius) * 450;
        ax += (d ? dx / d : 1) * strength; ay += (d ? dy / d : -1) * strength; scared = true;
      }
    }
    if (scared && !f.reacted) { f.reacted = true; s.reactions++; }
    f.scared = scared;
    f.vx = clamp((f.vx + ax * dt) * Math.exp(-dt * 1.4), -90, 90);
    f.vy = clamp((f.vy + ay * dt) * Math.exp(-dt * 1.4), -95, 95);
    f.x += f.vx * dt; f.y = clamp(f.y + f.vy * dt, WATER + 35, 735);
  }
}
export function stepRun(s, dt, holding) {
  if (!Number.isFinite(dt) || dt <= 0 || dt > .1) throw new RangeError('Simulation step must be between 0 and 0.1 seconds.');
  if (s.mode !== 'playing') return;
  s.time += dt; s.distance += SPEED * dt; s.invulnerable = Math.max(0, s.invulnerable - dt);
  const p = s.player;
  // Same hold/release target speeds and response rates as Pip's original controller, without tricks or cargo drag.
  const target = holding ? (p.wet ? 240 : 255) : (p.wet ? -210 : -100);
  p.vy += (target - p.vy) * (1 - Math.exp(-dt * (p.wet ? 9 : 6)));
  const previousY = p.y;
  p.y = clamp(p.y + p.vy * dt, 265, 735); if (p.y === 265 || p.y === 735) p.vy = 0;
  p.wet = p.y > WATER + 12;
  p.breath = clamp(p.breath + (p.wet ? -dt : dt * 4), 0, 8);
  s.shark.x = 2170 + Math.sin(s.time * .8) * 65; s.shark.y = 620 + Math.sin(s.time * 1.1) * 35;
  stepSchool(s, dt);
  const px = s.distance + p.x;
  if (px > ROCK.left - 18 && px < ROCK.right + 18 && p.y > ROCK.top - 18 && p.y < ROCK.bottom + 18) {
    p.y = previousY < (ROCK.top + ROCK.bottom) / 2 ? ROCK.top - 18 : ROCK.bottom + 18; p.vy = 0;
    if (!s.invulnerable) { s.rockHits++; s.score = Math.max(0, s.score - 20); s.invulnerable = 1.2; message(s, 'Vor dem Riff tief abtauchen – oder oben bleiben.'); }
  }
  if (px > ROCK.left && px < ROCK.right && p.y > ROCK.bottom + 18) s.tunnelEntered = true;
  if (s.tunnelEntered && px > ROCK.right + 30) s.routeComplete = true;
  if (p.wet && Math.hypot(px - s.shark.x, p.y - s.shark.y) < 62 && !s.invulnerable) {
    s.scares++; s.score = Math.max(0, s.score - 30); s.invulnerable = 1.3; message(s, 'Zu nah am Hai! Oben ist Platz.');
  }
  for (const f of s.fish) if (!f.caught && p.wet && Math.hypot(f.x - (px + 40), f.y - (p.y - 15)) < 31) {
    f.caught = true; s.caught++; s.score += f.golden ? 60 : 10;
    if (f.golden) { s.gold++; message(s, 'Schatzfisch! +60'); }
  }
  if (!s.bubbleUsed && Math.hypot(px - 3590, p.y - 680) < 43) { s.bubbleUsed = true; p.breath = Math.min(8, p.breath + 3); message(s, 'Luftblase · +3 Sekunden'); }
  if (p.breath <= 0) { s.mode = 'lost'; message(s, 'Pip braucht Luft. Versuch es noch einmal!'); }
  else if (s.distance >= LENGTH) { s.mode = 'won'; if (s.routeComplete && s.gold === 3) s.score += 100; }
}
export function demoHolding(s, route = 'safe') {
  const x = s.distance;
  let depth = 265;
  if (x < 720) depth = 500;
  else if (x > 1450 && x < 2100) depth = 485;
  else if (route === 'risk' && x > 2640 && x < 4040) depth = 695;
  else if (route === 'safe' && x > 3110 && x < 3500) depth = 440;
  else if (x > 4920 && x < 5450) depth = 485;
  return s.player.y < depth;
}
