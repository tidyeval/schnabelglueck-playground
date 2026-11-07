import { WIND, FLIGHT, createFlight, stepFlight } from './flight.js';
import { MACHINE } from './mechanism.js';
import { netShape, hitsNet } from './original/game.js';
import { dayKey, seedForDay } from './daily.js';
export const W = 480, H = 850, WATER = 360, LENGTH = 14000, SPEED = 170;
export const CAVE = { left: 9780, right: 10580, top: 495, ceiling: 560, floor: 760 };
export const ROCK = { left: 3480, right: 4480, top: 535, bottom: 600 };
export const HELP = { left: 6080, right: 6400, top: 425, bottom: 560 };
export const TIDE = { left: 5500, right: 5750, top: 425, bottom: 545 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function createRun(day = dayKey()) {
  const seed = seedForDay(day), shift = (seed % 61) - 30;
  const fish = [];
  for (const [group, cx, cy] of [[0, 650 + shift, 480], [1, 2400 - shift, 505], [2, 6240 + shift, 480]]) {
    for (let i = 0; i < 12; i++) fish.push({ id: `${group}-${i}`, group, x: cx + (i % 4) * 27, y: cy + Math.floor(i / 4) * 24,
      homeY: cy + Math.floor(i / 4) * 24, vx: -24, vy: 0, heading: 0, phase: i * 1.7, caught: false, reacted: false });
  }
  for (let i = 0; i < 3; i++) fish.push({ id: `gold-${i}`, group: -1, golden: true, x: 3660 + i * 300, y: 680, caught: false, heading: 0 });
  for (let i = 0; i < 3; i++) fish.push({ id: `guide-${i}`, group: -1, guide: true, x: 6060 + i * 120, y: 470 + i * 10, caught: false, heading: 0 });
  for (let i = 0; i < 3; i++) fish.push({ id: `flow-${i}`, group: -1, flow: true, x: 7260 + i * 145, y: 480, caught: false, heading: 0 });
  for (let i = 0; i < 4; i++) fish.push({ id: `chain-${i}`, group: -1, chain: true, x: 9060 + i * 60, y: 650, homeY: [595, 585, 600, 590][i], caught: false, heading: 0 });
  for (let i = 0; i < 4; i++) fish.push({ id: `glow-${i}`, group: -1, glowing: true, x: 9900 + i * 160, y: [640, 655, 650, 640][i], caught: false, heading: 0 });
  return { mode: 'playing', day, seed, time: 0, distance: 0, water: WATER, player: { x: 110, y: 265, vy: 0, wet: false, breath: 8, gulp: 0, breach: 0, relief: 0 }, fish,
    score: 0, caught: 0, gold: 0, reactions: 0, rockHits: 0, scares: 0, bubbleUsed: false, tunnelEntered: false,
    routeComplete: false, invulnerable: 0, event: '', eventUntil: 0, shark: { x: 2170, y: 620, active: false }, boat: { x: 2500 + shift, active: false, cast: -1, thrown: false, warned: false, netHits: 0, dodged: false },
    turtle: { x: 1110 + shift, y: 470, netX: 1030 + shift, netY: 515, helped: false, freedAt: 0 }, guide: { x: 6100, y: 475 }, helpOpen: false, helpEntered: false, helpUsed: false, guideRevealed: false, guideCaught: 0, guideBubbleUsed: false,
    mechanism: { touched: false, activated: false, open: false, passed: false, splashed: false, splashAt: 0, splashX: 0, chainCaught: 0, buoyX: MACHINE.buoyX, buoyY: 405, angle: 0, weightX: MACHINE.pivotX - MACHINE.arm, weightY: MACHINE.pivotY + 35, gateX: MACHINE.gateX, gateY: MACHINE.gateY },
    wind: { active: false, visited: false, highest: 265 }, flight: createFlight(),
    cave: { entered: false, caught: 0, bubbleUsed: false, passed: false },
    current: { active: false, entered: false, speed: 0, catches: 0 }, combo: 0, comboUntil: 0, bestCombo: 0,
    tideOpen: false, tideCommitted: false, tidePassed: false, tideBypassed: false, tideWait: 0,
    story: [], section: 'swarm', features: { swarm: false, tide: false, help: false, risk: false, story: false, daily: true }, effects: [] };
}
function message(s, text) { s.event = text; s.eventUntil = s.time + 2.8; }
export function stepSchool(s, dt) {
  const px = s.distance + s.player.x, groups = new Map();
  for (const f of s.fish) if (!f.caught && f.group >= 0) {
    const g = groups.get(f.group) || { x: 0, y: 0, n: 0 }; g.x += f.x; g.y += f.y; g.n++; groups.set(f.group, g);
  }
  for (const f of s.fish) {
    if (f.caught || f.group < 0) continue;
    const g = groups.get(f.group);
    let ax = (g.x / g.n - f.x) * .4, ay = (g.y / g.n - f.y) * .7 + (f.homeY + Math.sin(s.time * 2 + f.phase) * 10 - f.y) * .8;
    for (const other of s.fish) {
      if (other === f || other.caught || other.group !== f.group) continue;
      const dx = f.x - other.x, dy = f.y - other.y, d2 = dx * dx + dy * dy;
      if (d2 > 0 && d2 < 24 * 24) { ax += dx * 8; ay += dy * 20; }
    }
    let scared = false, escapeSpeed = -24;
    for (const threat of [s.player.wet ? { x: px, y: s.player.y, radius: 135 } : null, s.shark.active ? { ...s.shark, radius: 190 } : null]) {
      if (!threat) continue;
      const dx = f.x - threat.x, dy = f.y - threat.y, d = Math.hypot(dx, dy);
      if (d < threat.radius) {
        const strength = (1 - d / threat.radius) * 330;
        // Keep swimming left: escape above/below, or accelerate when danger approaches from behind.
        const side = Math.abs(dy) < 3 ? (f.phase % 3 < 1.5 ? -1 : 1) : Math.sign(dy);
        ay += side * strength; escapeSpeed = Math.min(escapeSpeed, -24 - Math.max(0, -dx / Math.max(1, d)) * 50); scared = true;
      }
    }
    if (scared && !f.reacted) { f.reacted = true; s.reactions++; }
    if (scared && s.player.wet && Math.hypot(f.x - px, f.y - s.player.y) < 135) s.features.swarm = true;
    f.scared = scared;
    f.vx = clamp(f.vx + (ax + (escapeSpeed - f.vx) * 2) * dt, -80, -12);
    f.vy = clamp((f.vy + ay * dt) * Math.exp(-dt * 1.4), -90, 90);
    f.x += f.vx * dt; f.y = clamp(f.y + f.vy * dt, s.water + 35, 735);
    f.heading += (clamp(-f.vy / 220, -.32, .32) - f.heading) * (1 - Math.exp(-dt * 5));
  }
}
export function stepRun(s, dt, holding, stepCurrent, flightInput = 0, flightTarget = null) {
  if (!Number.isFinite(dt) || dt <= 0 || dt > .1) throw new RangeError('Simulation step must be between 0 and 0.1 seconds.');
  if (s.mode !== 'playing') return;
  if (s.practice && !s.flight.started) holding = false;
  s.time += dt; s.water = WATER + 28 * Math.sin(s.time * Math.PI / 4 + s.seed % 628 / 100);
  if (s.flight.active) {
    s.distance += SPEED * dt; s.player.breath = Math.min(8, s.player.breath + dt * 4);
    s.score += stepFlight(s.flight, dt, flightInput, flightTarget);
    s.section = 'flight';
    if (s.flight.elapsed > FLIGHT.duration - FLIGHT.transition) { const exit = Math.min(1, (s.flight.elapsed - FLIGHT.duration + FLIGHT.transition) / FLIGHT.transition); s.player.y = s.flight.sideY + (210 - s.flight.sideY) * exit; }
    if (s.flight.completed) { s.player.y = 210; s.player.vy = 0; s.player.wet = false; message(s, 'Zurück an der Küste! Wieder halten zum Tauchen.'); }
    return;
  }
  const splashed = s.mechanism.splashed;
  stepCurrent?.(s, dt);
  if (!splashed && s.mechanism.splashed) { s.effects.push({ kind: 'splash', x: s.mechanism.splashX - s.distance, y: s.water, life: 1 }); message(s, 'Platsch! Das Gegengewicht scheucht Fische aus dem Seegras.'); }
  const helperBoost = s.helpEntered && !s.helpUsed && s.player.y > HELP.top && s.player.y < HELP.bottom ? 45 : 0;
  s.distance += (SPEED + s.current.speed + helperBoost) * dt; s.invulnerable = Math.max(0, s.invulnerable - dt);
  s.tideOpen = s.water < WATER || s.tideCommitted;
  const p = s.player, wasWet = p.wet, previousY = p.y;
  const cargoDrag = Math.min(20, s.caught) * .8;
  const inWind = s.distance + p.x > WIND.left && s.distance + p.x < WIND.right && p.y > WIND.top && p.y < WIND.bottom && !p.wet;
  s.wind.active = inWind; if (inWind) s.wind.visited = true;
  const glide = Math.max(-100, Math.min(85, (265 - p.y) * 3));
  const target = (holding ? (p.wet ? 240 + cargoDrag : 255) : (p.wet ? -210 + cargoDrag : glide)) - (inWind ? 150 : 0);
  p.vy += (target - p.vy) * (1 - Math.exp(-dt * (p.wet ? 9 : 6)));
  p.y = clamp(p.y + p.vy * dt, 160, 735); if (p.y === 160 || p.y === 735) p.vy = 0;
  p.wet = p.y > s.water + 12;
  for (const key of ['gulp', 'breach', 'relief']) p[key] = Math.max(0, p[key] - dt);
  if (p.wet !== wasWet) { s.effects.push({ kind: p.wet ? 'splash' : 'breach', x: p.x, y: s.water, life: 1 }); if (!p.wet) { p.breach = .6; p.relief = .7; } }
  p.breath = clamp(p.breath + (p.wet ? -dt : dt * 4), 0, 8);
  s.wind.highest = Math.min(s.wind.highest, p.y);
  if (!s.flight.started && s.distance >= FLIGHT.start && s.distance < FLIGHT.start + 220 && !p.wet && p.y < 255) {
    s.flight.sideY = p.y; s.flight.started = s.flight.active = true; s.wind.active = false; s.section = 'flight';
    message(s, 'Perspektivwechsel! Jetzt mit ← → oder Ziehen durch die Ringe.'); return;
  }
  let px = s.distance + p.x;
  if (px > TIDE.left + 18 && px <= TIDE.right + 22) for (const [top, bottom] of [[395, TIDE.top], [TIDE.bottom, 607]]) {
    if (p.y > top - 18 && p.y < bottom + 18) {
      p.y = previousY < (top + bottom) / 2 ? top - 18 : bottom + 18; p.vy = 0;
      if (!s.invulnerable) { s.rockHits++; s.invulnerable = 1.2; message(s, 'Das Riff ist fest. Nutze den Durchgang oder fliege darüber.'); }
    }
  }
  if (px >= TIDE.left - 22 && px < TIDE.right && p.y > TIDE.top && p.y < TIDE.bottom && !s.tidePassed) {
    if (!s.tideOpen) { s.distance = TIDE.left - p.x - 22; px = s.distance + p.x; s.tideWait += dt; message(s, 'Die Ebbe öffnet den Durchgang. Warten oder oben vorbeifliegen.'); }
    else s.tideCommitted = true;
  }
  if (px > TIDE.right + 22) {
    s.tidePassed = s.tideCommitted; s.tideBypassed = !s.tideCommitted; s.features.tide = true;
  }
  s.shark.active = s.distance > 1400 && s.distance < 2600;
  s.shark.x = 2170 + Math.sin(s.time * .8) * 65; s.shark.y = 620 + Math.sin(s.time * 1.1) * 35;
  s.boat.active = s.distance > 1900 && s.distance < 2800;
  if (s.boat.active && !s.boat.thrown && s.boat.x - px < 420) { s.boat.thrown = true; s.boat.warned = true; s.boat.cast = 0; message(s, 'Der Fischer holt aus! Tief unter das Netz oder über das Boot.'); }
  const previousCast = s.boat.cast;
  if (s.boat.thrown && s.boat.cast < 3.4) s.boat.cast += dt;
  if (previousCast < .85 && s.boat.cast >= .85) message(s, 'Das Netz fliegt! Tief bleiben oder darüber hinweg.');
  if (previousCast < 2.55 && s.boat.cast >= 2.55) message(s, 'Er zieht das Netz ein. Gleich ist der Weg wieder frei.');
  if (s.boat.cast >= 3.25 && !s.boat.dodged) { s.boat.dodged = s.boat.netHits === 0; }
  const net = netShape(s.boat, s.water);
  if (net && hitsNet({ x: px, y: p.y }, net) && !s.invulnerable) {
    s.boat.netHits++; s.score = Math.max(0, s.score - 30); s.invulnerable = 1.3;
    message(s, 'Vom Netz gestreift! Achte auf die Wurf-Ankündigung.');
  }
  const phase = s.distance < 1400 ? 'swarm' : s.distance < 2000 ? 'shark' : s.distance < 2500 ? 'boat' : s.distance < 3250 ? 'rest' : s.distance < 4600 ? 'risk' : s.distance < 5900 ? 'tide' : s.distance < 6800 ? 'help' : s.distance < 7900 ? 'current' : s.distance < 9400 ? 'mechanism' : s.distance < 10800 ? 'cave' : 'wind';
  s.section = phase;
  for (const name of ['shark', 'boat', 'rest']) if (phase === name && !s.story.includes(name)) s.story.push(name);
  if (s.distance > 2800 && s.story.length === 3) s.features.story = true;
  stepSchool(s, dt);
  if (px > ROCK.left - 18 && px < ROCK.right + 18 && p.y > ROCK.top - 18 && p.y < ROCK.bottom + 18) {
    p.y = previousY < (ROCK.top + ROCK.bottom) / 2 ? ROCK.top - 18 : ROCK.bottom + 18; p.vy = 0;
    if (!s.invulnerable) { s.rockHits++; s.score = Math.max(0, s.score - 20); s.invulnerable = 1.2; message(s, 'Vor dem Riff tief abtauchen – oder oben bleiben.'); }
  }
  if (px > ROCK.left && px < ROCK.right && p.y > ROCK.bottom + 18) s.tunnelEntered = true;
  if (px > ROCK.right + 30) { s.features.risk = true; s.routeComplete = s.tunnelEntered; }
  if (p.wet && s.shark.active && Math.hypot(px - s.shark.x, p.y - s.shark.y) < 62 && !s.invulnerable) {
    s.scares++; s.score = Math.max(0, s.score - 30); s.invulnerable = 1.3; message(s, 'Zu nah am Hai! Oben ist Platz.');
  }
  if (s.boat.active && Math.abs(px - s.boat.x) < 95 && p.y > s.water - 25 && p.y < s.water + 66) {
    p.y = s.water + 78; p.vy = Math.max(0, p.vy);
    if (!s.invulnerable) { s.rockHits++; s.invulnerable = 1.2; message(s, 'Das Boot versperrt das Auftauchen. Erst darunter hindurch.'); }
  }
  if (!s.turtle.helped && p.wet && Math.hypot(px + 40 - s.turtle.netX, p.y - 15 - s.turtle.netY) < 30) {
    s.turtle.helped = true; s.turtle.freedAt = s.time; p.breath = Math.min(8, p.breath + 3); s.score += 30; p.gulp = .42;
    message(s, 'Netzfaden gelöst! Deine neue Freundin ist frei. +30');
  }
  if (s.turtle.helped && s.distance > 5750) {
    if (!s.guideRevealed) message(s, 'Da ist deine Freundin! Folge ihr zum Muscheltor.');
    s.guideRevealed = true; s.guide.x = Math.min(HELP.right + 100, px + 160); s.guide.y = 470 + Math.sin(s.time * 2) * 10;
    if (s.guide.x > HELP.left && !s.helpOpen) { s.helpOpen = true; message(s, 'Sie öffnet das Muscheltor! Folge ihr durch die Fisch-Abkürzung.'); }
  }
  if (px >= HELP.left - 22 && px < HELP.right + 22) {
    if (px > HELP.left + 18 && p.y > 395 - 18 && p.y < HELP.top + 18) { p.y = previousY < 410 ? 377 : HELP.top + 18; p.vy = 0; }
    if (px > HELP.left + 18 && p.y > HELP.bottom - 18 && p.y < 620 + 18) { p.y = previousY < 590 ? HELP.bottom - 18 : 638; p.vy = 0; }
    if (p.y > HELP.top && p.y < HELP.bottom) {
      if (!s.helpOpen) { s.distance = HELP.left - p.x - 22; message(s, 'Das Muscheltor ist zu. Fliege oben vorbei – oder hilf ihr beim nächsten Mal.'); }
      else s.helpEntered = true;
    }
  }
  if (s.helpEntered && px > HELP.right + 22 && !s.helpUsed) {
    s.helpUsed = true; s.features.help = true; s.score += 50; message(s, 'Tierfreundin-Abkürzung geschafft! +50');
  }
  const m = s.mechanism;
  if (px > MACHINE.gateX - 130 && px < MACHINE.gateX + 250 && p.y > MACHINE.floor - 18) { p.y = MACHINE.floor - 18; p.vy = 0; }
  if (Math.abs(px - m.gateX) < 42 && p.y > m.gateY - MACHINE.gateHeight / 2 - 18 && p.y < m.gateY + MACHINE.gateHeight / 2 + 18) {
    s.distance = m.gateX - 42 - p.x; px = s.distance + p.x;
    message(s, 'Tor geschlossen: Stoße die gelbe Boje an – oder fliege oben vorbei.');
  }
  if (!m.passed && m.activated && px > MACHINE.gateX + 90 && p.wet && p.y > m.gateY + MACHINE.gateHeight / 2 + 18) {
    m.passed = true; s.score += 60; message(s, 'Tor geschafft! +60 · Jetzt Luft holen vor der Leuchthöhle.');
  }
  if (px > CAVE.left - 18 && px < CAVE.right + 18) {
    if (p.y > CAVE.top - 18 && p.y < CAVE.ceiling + 18) {
      p.y = previousY < (CAVE.top + CAVE.ceiling) / 2 ? CAVE.top - 18 : CAVE.ceiling + 18; p.vy = 0;
      if (!s.invulnerable) { s.rockHits++; s.invulnerable = 1; message(s, 'Für die Leuchtfische vor dem Felsen tief tauchen. Oben bleibt es frei.'); }
    }
    if (p.y > CAVE.floor - 18) { p.y = CAVE.floor - 18; p.vy = 0; }
    if (p.y > CAVE.ceiling + 18) s.cave.entered = true;
  }
  if (px > CAVE.right + 25 && s.cave.entered && !s.cave.passed) { s.cave.passed = true; if (s.cave.caught === 4) { s.score += 80; message(s, 'Alle vier Leuchtfische gefunden! +80'); } }
  if (!s.cave.bubbleUsed && Math.hypot(px - 10180, p.y - 650) < 45) { s.cave.bubbleUsed = true; p.breath = Math.min(8, p.breath + 4); message(s, 'Luft in der Leuchthöhle · +4 Sekunden'); }
  for (const f of s.fish) if (f.chain && s.mechanism.splashed && !f.caught) { f.x -= 18 * dt; f.y += (f.homeY - f.y) * (1 - Math.exp(-dt * 4)); }
  for (const f of s.fish) if (!f.caught && (!f.chain || s.mechanism.splashed) && (!f.guide || s.guideRevealed) && p.wet && Math.hypot(f.x - (px + 40), f.y - (p.y - 15)) < 31) {
    f.caught = true; s.caught++; s.combo = s.time < s.comboUntil ? s.combo + 1 : 1; s.comboUntil = s.time + 1.2; s.bestCombo = Math.max(s.bestCombo, s.combo);
    const points = (f.golden ? 60 : f.guide ? 20 : 10) + Math.min(4, s.combo - 1) * 2;
    s.score += points; p.gulp = .42;
    s.effects.push({ kind: 'catch', x: p.x + 40, y: p.y - 15, life: 1, label: `+${points}${s.combo > 1 ? ` · ${s.combo}er Fangserie` : ''}` });
    if (f.guide) s.guideCaught++;
    if (f.flow) s.current.catches++;
    if (f.glowing) s.cave.caught++;
    if (f.chain) s.mechanism.chainCaught++;
    if (f.golden) { s.gold++; message(s, 'Schatzfisch! +60'); }
  }
  if (!s.bubbleUsed && Math.hypot(px - 3990, p.y - 680) < 43) { s.bubbleUsed = true; p.breath = Math.min(8, p.breath + 5); message(s, 'Luftblase · +5 Sekunden'); }
  if (s.guideRevealed && !s.guideBubbleUsed && Math.hypot(px - 6150, p.y - 475) < 43) { s.guideBubbleUsed = true; p.breath = Math.min(8, p.breath + 4); message(s, 'Deine Freundin zeigt dir frische Luft und Fische.'); }
  s.effects = s.effects.map(e => ({ ...e, life: e.life - dt })).filter(e => e.life > 0);
  if (p.breath <= 0) { s.mode = 'lost'; message(s, 'Pip braucht Luft. Versuch es noch einmal!'); }
  else if (s.distance >= LENGTH) { s.mode = 'won'; if (s.routeComplete && s.gold === 3) s.score += 100; }
}
export function demoHolding(s, route = 'safe') {
  const x = s.distance;
  let depth = 265;
  if (x > 10850 && x < 11650) return false;
  if (x < 550) depth = 495;
  else if (x > 650 && x < 1140) depth = 530;
  else if (x > 1450 && x < 2100) depth = 480;
  else if (x >= 2100 && x < 2530) depth = 620;
  else if (route === 'risk' && x > 3040 && x < 4440) depth = 695;
  else if (route === 'safe' && x > 3510 && x < 3900) depth = 440;
  else if (route === 'risk' && x > 5200 && x < 5750) depth = 480;
  else if (x > 5750 && x < 6500) depth = 485;
  else if (x > 6900 && x < 7560) depth = 495;
  else if (x > 8100 && x < 8650) depth = s.mechanism.buoyY + 15;
  else if (s.mechanism.activated && x > 8660 && x < 8980) depth = 610;
  else if (route === 'risk' && x > 9400 && x < 10470) depth = 660;
  return s.player.y < depth;
}
