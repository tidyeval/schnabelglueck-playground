import Phaser from 'phaser';
import './style.css';
import { drawWorld } from './original/art.js';
import { createGame } from './original/game.js';
import { readBest, saveBest } from './daily.js';
import { createRun, stepRun, demoHolding, W, H, LENGTH, ROCK, TIDE } from './model.js';

const $ = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ratio = Math.min(devicePixelRatio || 1, 2), original = createGame(() => .5, 0);
let scene, run = createRun(), mode = 'menu', holding = false, demo = null;
let best = readBest(run.day), storageError = '';
function showMode(next) {
  mode = next; holding = false;
  if (next === 'won') {
    try { best = saveBest(run.day, run.score); } catch { storageError = 'Tagesrekord konnte hier nicht gespeichert werden.'; }
  }
  $('overlay').hidden = next === 'playing'; $('pause').disabled = !['playing', 'paused'].includes(next);
  $('pause').textContent = next === 'paused' ? '▶' : 'Ⅱ'; $('pause').setAttribute('aria-label', next === 'paused' ? 'Fortsetzen' : 'Pause');
  $('title').innerHTML = next === 'won' ? 'Pip ist angekommen.' : next === 'lost' ? 'Erst mal Luft holen.' : next === 'paused' ? 'Eine kleine Pause.' : 'Sechs Ideen.<br>Eine kleine Reise.';
  $('description').textContent = next === 'won' ? `${run.caught} Fische · ${run.gold}/3 Schatzfische · ${run.score} Punkte. ${run.turtle.helped ? 'Deine Tierfreundin hilft zurück.' : 'Hast du die gefangene Schildkröte entdeckt?'} ${run.tidePassed ? 'Gezeitenpassage geschafft!' : 'Du hast die Gezeiten oben umflogen.'}`
    : next === 'lost' ? 'Tauche zwischendurch auf. Unter dem Riff und auf dem Tierpfad helfen Luftblasen.'
    : next === 'paused' ? 'Dein Versuch wartet auf dich.' : 'Schwarm, Tierhilfe, Hai und Boot, Schatzhöhle und Gezeiten. Halte zum Tauchen, lass zum Auftauchen los. Die Schatz-Vorführung zeigt alle Stationen.';
  $('start').textContent = next === 'paused' ? 'Weiterfliegen' : ['won', 'lost'].includes(next) ? 'Noch eine Runde' : 'Los geht’s';
}
function start(route = null) { run = createRun(); best = readBest(run.day); demo = route; scene.acc = 0; showMode('playing'); $('game').focus(); }
function pause() { if (mode === 'playing') showMode('paused'); else if (mode === 'paused') { scene.acc = 0; showMode('playing'); $('game').focus(); } }
function label(c, text, x, y, colour = '#fff3ca') {
  if (x < -400 || x > W + 100) return;
  c.font = 'bold 12px system-ui'; c.textAlign = 'left'; c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = '#28565c'; c.strokeText(text, x, y); c.fillStyle = colour; c.fillText(text, x, y);
}
function bubble(c, x, y) {
  c.fillStyle = '#dbfff333'; c.strokeStyle = '#eaffeb'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(x, y, 18 + Math.sin(run.time * 3) * 2, 21, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  label(c, '+ Luft', x - 20, y + 38);
}
function draw(c) {
  const sx = x => x - run.distance, p = run.player;
  const items = run.fish.filter(f => !f.caught && (!f.guide || run.guideRevealed)).map(f => ({ ...f, kind: 'fish', x: sx(f.x), tilt: f.heading }));
  if (run.shark.active) items.push({ ...run.shark, kind: 'shark', x: sx(run.shark.x), baseY: run.shark.y, phase: 'dash', reaction: 0 });
  if (run.boat.active) items.push({ kind: 'boat', x: sx(run.boat.x), cast: -1, look: 0, hit: false });
  const tx = run.guideRevealed ? 6030 : run.turtle.x, ty = run.guideRevealed ? 440 : run.turtle.y;
  items.push({ kind: 'turtle', x: sx(tx), y: ty, baseY: ty, reaction: 0 });
  drawWorld(c, { ...original, distance: run.distance, time: run.time, waterLevel: run.water, cargo: Math.min(20, run.caught), items,
    player: { ...original.player, ...p, hurt: run.invulnerable } }, 'playing', run.time, 'classic', run.effects, reduced);
  const rx = sx(ROCK.left);
  c.fillStyle = '#376c6d'; c.beginPath(); c.roundRect(rx, ROCK.top, ROCK.right - ROCK.left, ROCK.bottom - ROCK.top, 20); c.fill();
  for (let i = 0; i < 20; i++) { c.fillStyle = i % 2 ? '#57998c' : '#8ab398'; c.beginPath(); c.ellipse(rx + 20 + i * 49, ROCK.top + 4, 28, 13 + i % 3 * 5, 0, 0, Math.PI * 2); c.fill(); }
  label(c, '↑ SICHERER WEG', rx + 70, 490); label(c, '↓ SCHATZHÖHLE', rx + 120, 748, '#ffda8d');
  label(c, 'Für den Schatz hier tief tauchen →', rx - 340, 645);
  if (!run.bubbleUsed) bubble(c, sx(3990), 680);
  const gx = sx(TIDE.left), width = TIDE.right - TIDE.left;
  c.fillStyle = '#527f77'; c.fillRect(gx, 395, width, 30); c.fillRect(gx, TIDE.bottom, width, 62);
  if (!run.tideOpen) { c.fillStyle = '#83b79e'; c.fillRect(gx, TIDE.top, width, TIDE.bottom - TIDE.top); }
  else { c.strokeStyle = '#c0f5d3'; c.lineWidth = 2; c.strokeRect(gx + 2, TIDE.top + 2, width - 4, TIDE.bottom - TIDE.top - 4); }
  label(c, run.tideOpen ? 'DURCHGANG OFFEN →' : 'BEI EBBE OFFEN · ODER OBEN ↑', gx - 55, 395);
  if (!run.turtle.helped) {
    const x = sx(run.turtle.x); c.strokeStyle = '#7d7860'; c.lineWidth = 3;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x - 22 + i * 14, 500); c.quadraticCurveTo(x + 22 - i * 12, 465, x - 12 + i * 10, 448); c.stroke(); }
    label(c, 'Hilfst du mir? →', x - 120, 425);
  } else label(c, '♥ Danke!', sx(run.turtle.x) - 25, 425, '#ffcfba');
  if (run.guideRevealed) {
    label(c, '♥ Dein sicherer Fischweg →', sx(5960), 405, '#d3ffce');
    if (!run.guideBubbleUsed) bubble(c, sx(6150), 475);
  }
  const names = { swarm: '01 · Schwarm & kleine Rettung', shark: '02 · Der Hai scheucht Fische auf', boat: '03 · Unter dem Boot hindurch', rest: '04 · Durchatmen', risk: '05 · Sicherer Weg oder Schatz?', tide: '06 · Die Gezeiten-Passage', help: '07 · Deine Freundin hilft zurück' };
  label(c, names[run.section], 15, 65);
}
class Playground extends Phaser.Scene {
  constructor() { super('playground'); }
  create() {
    scene = this; this.acc = 0;
    // Draw the original vector artwork directly: continuous animation without baked frames or texture uploads.
    this.add.extern().renderCanvas = renderer => {
      const c = renderer.currentContext; c.save(); c.setTransform(ratio, 0, 0, ratio, 0, 0); draw(c); c.restore();
    };
    this.keys = this.input.keyboard.addKeys({ space: 'SPACE', escape: 'ESC', pause: 'P' }); this.input.keyboard.addCapture(['SPACE']);
    this.input.keyboard.on('keydown-ESC', pause); this.input.keyboard.on('keydown-P', pause);
    this.input.on('pointerdown', () => { if (mode === 'playing') { holding = true; demo = null; } });
    this.input.on('pointerup', () => holding = false); this.input.keyboard.on('keydown-SPACE', () => demo = null);
    $('start').disabled = $('safe').disabled = $('risk').disabled = false; showMode('menu');
  }
  update(now, delta) {
    if (mode === 'playing') {
      this.acc += Math.min(delta / 1000, .1);
      while (this.acc >= 1 / 120 && mode === 'playing') {
        stepRun(run, 1 / 120, demo ? demoHolding(run, demo) : holding || this.keys.space.isDown); this.acc -= 1 / 120;
        if (run.mode !== 'playing') showMode(run.mode);
      }
    }
    $('score').textContent = `${run.score} Punkte`; $('progress').textContent = `${Math.min(100, Math.floor(run.distance / LENGTH * 100))} %`;
    $('breath').value = run.player.breath; $('air').classList.toggle('low', run.player.breath < 2.3);
    $('daily').textContent = `Tagesroute ${run.day} · ${storageError || (best === null ? 'Rekord-Speicherung nicht verfügbar' : `Dein Rekord: ${best}`)}`;
    for (const [key, done] of Object.entries(run.features)) { $(`feature-${key}`).dataset.done = done; $(`status-${key}`).textContent = done ? '✓ Erlebt' : '○ Noch vor dir'; }
    $('toast').textContent = run.eventUntil > run.time ? run.event : demo && mode === 'playing' ? `Vorführung · ${demo === 'risk' ? 'alle Stationen & Schatz' : 'sicherer Weg'} · Tippen zum Übernehmen` : '';
  }
}
$('start').onclick = () => mode === 'paused' ? pause() : start();
$('safe').onclick = () => start('safe'); $('risk').onclick = () => start('risk'); $('pause').onclick = pause;
for (const event of ['pointerup', 'pointercancel']) window.addEventListener(event, () => holding = false);
function suspend() { holding = false; scene?.input.keyboard.resetKeys(); if (mode === 'playing') pause(); }
window.addEventListener('blur', suspend); document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
window.playground = { snapshot: () => structuredClone({ ...run, mode, demo }) };
new Phaser.Game({ type: Phaser.CANVAS, canvas: $('game'), width: W * ratio, height: H * ratio, banner: false, transparent: true, audio: { noAudio: true }, scene: Playground });
