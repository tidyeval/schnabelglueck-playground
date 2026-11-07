import Phaser from 'phaser';
import './style.css';
import { drawWorld } from './original/art.js';
import { createGame } from './original/game.js';
import { readBest, saveBest } from './daily.js';
import { CURRENT, createCurrentStep } from './current.js';
import { createRun, stepRun, demoHolding, W, H, LENGTH, ROCK, TIDE, HELP } from './model.js';

const $ = id => document.getElementById(id);
const stepCurrent = createCurrentStep(Phaser.Physics.Matter.Matter);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ratio = Math.min(devicePixelRatio || 1, 2), original = createGame(() => .5, 0);
let scene, run = createRun(), mode = 'menu', holding = false, demo = null;
let muted = false, soundError = '';
let best = readBest(run.day), storageError = '';
function showMode(next) {
  mode = next; holding = false;
  if (scene?.bubbles) {
    if (next === 'playing') { scene.tweens.resumeAll(); scene.bubbles.resume(); }
    else { scene.tweens.pauseAll(); scene.bubbles.pause(); scene.sound.stopAll(); }
  }
  if (next === 'won') {
    try { best = saveBest(run.day, run.score); } catch { storageError = 'Tagesrekord konnte hier nicht gespeichert werden.'; }
  }
  $('overlay').hidden = next === 'playing'; $('pause').disabled = !['playing', 'paused'].includes(next);
  $('pause').textContent = next === 'paused' ? '▶' : 'Ⅱ'; $('pause').setAttribute('aria-label', next === 'paused' ? 'Fortsetzen' : 'Pause');
  $('title').innerHTML = next === 'won' ? 'Pip ist angekommen.' : next === 'lost' ? 'Erst mal Luft holen.' : next === 'paused' ? 'Eine kleine Pause.' : 'Sechs Ideen.<br>Eine kleine Reise.';
  $('description').textContent = next === 'won' ? `${run.caught} Fische · ${run.gold}/3 Schatzfische · ${run.score} Punkte. ${run.helpUsed ? 'Tierfreundin-Abkürzung geschafft!' : run.turtle.helped ? 'Deine Freundin wartet am Muscheltor. Folge ihr beim nächsten Versuch.' : 'Hast du die gefangene Schildkröte entdeckt?'} ${run.tidePassed ? 'Gezeitenpassage geschafft!' : 'Du hast die Gezeiten oben umflogen.'}`
    : next === 'lost' ? 'Tauche zwischendurch auf. Unter dem Riff und auf dem Tierpfad helfen Luftblasen.'
    : next === 'paused' ? 'Dein Versuch wartet auf dich.' : 'Schwarm, Tierhilfe, Hai und Boot, Schatzhöhle und Gezeiten. Halte zum Tauchen, lass zum Auftauchen los. Die Schatz-Vorführung zeigt alle Stationen.';
  $('start').textContent = next === 'paused' ? 'Weiterfliegen' : ['won', 'lost'].includes(next) ? 'Noch eine Runde' : 'Los geht’s';
}
function start(route = null) { run = createRun(); scene.bubbles.killAll(); scene.tweens.killTweensOf(scene.juice); scene.juice.squash = 0; best = readBest(run.day); demo = route; scene.acc = 0; showMode('playing'); $('game').focus(); }
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
  if (run.boat.active) items.push({ kind: 'boat', x: sx(run.boat.x), cast: run.boat.cast, look: 0, hit: false });
  const freed = run.turtle.helped ? Math.min(2, run.time - run.turtle.freedAt) : 0;
  const tx = run.guideRevealed ? run.guide.x : run.turtle.x + freed * 45, ty = run.guideRevealed ? run.guide.y : run.turtle.y - freed * 25;
  items.push({ kind: 'turtle', x: sx(tx), y: ty, baseY: ty, reaction: 0, facingRight: run.turtle.helped });
  drawWorld(c, { ...original, distance: run.distance, time: run.time, waterLevel: run.water, cargo: Math.min(20, run.caught), items,
    player: { ...original.player, ...p, catchSquash: scene?.juice.squash || 0, hurt: run.invulnerable } }, 'playing', run.time, 'classic', run.effects, reduced);
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
  const hx = sx(HELP.left), hw = HELP.right - HELP.left;
  c.fillStyle = '#547e83'; c.beginPath(); c.roundRect(hx, 395, hw, HELP.top - 395, 14); c.roundRect(hx, HELP.bottom, hw, 620 - HELP.bottom, 18); c.fill();
  if (!run.helpOpen) {
    c.strokeStyle = '#d7b486'; c.lineWidth = 7;
    for (let x = 12; x < hw; x += 24) { c.beginPath(); c.moveTo(hx + x, HELP.top); c.quadraticCurveTo(hx + x + 12, 490, hx + x, HELP.bottom); c.stroke(); }
  }
  label(c, run.helpOpen ? '♥ SIE HÄLT DAS TOR FÜR DICH OFFEN →' : 'MUSCHELTOR · OBEN VORBEI ↑', hx - 65, 385);
  if (!run.turtle.helped) {
    const x = sx(run.turtle.x), nx = sx(run.turtle.netX), ny = run.turtle.netY;
    c.save(); c.strokeStyle = '#ba9875'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(x, run.turtle.y, 55, 40, 0, 0, Math.PI * 2); c.stroke();
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x - 45, run.turtle.y + i * 12); c.lineTo(x + 45, run.turtle.y - i * 12); c.stroke(); }
    c.beginPath(); c.moveTo(x - 40, run.turtle.y + 24); c.quadraticCurveTo(nx + 15, ny, nx, ny); c.stroke();
    c.strokeStyle = '#ffe29b'; c.lineWidth = 3; c.beginPath(); c.arc(nx, ny, 21 + (reduced ? 0 : Math.sin(run.time * 5) * 3), 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#ffe29b'; c.beginPath(); c.arc(nx, ny, 5, 0, Math.PI * 2); c.fill(); c.restore();
    label(c, 'SCHNABEL DURCH DEN GOLDENEN RING →', nx - 270, ny + 55);
  } else label(c, '♥ Frei! Bis gleich …', sx(run.turtle.x) - 70, 425, '#ffcfba');
  if (run.guideRevealed) {
    label(c, '♥ Folge mir durch das Tor →', sx(run.guide.x) - 110, run.guide.y - 65, '#d3ffce');
    if (!run.guideBubbleUsed) bubble(c, sx(6150), 475);
  }
  const cx = sx(CURRENT.left), cw = CURRENT.right - CURRENT.left;
  c.fillStyle = '#a2e7e72b'; c.beginPath(); c.roundRect(cx, CURRENT.top, cw, CURRENT.bottom - CURRENT.top, 45); c.fill();
  c.save(); c.beginPath(); c.rect(cx, CURRENT.top, cw, CURRENT.bottom - CURRENT.top); c.clip();
  c.strokeStyle = '#ddfff699'; c.lineWidth = 2;
  for (let i = 0; i < 20; i++) {
    const x = cx + ((i * 83 + (reduced ? 0 : run.time * 100)) % cw), y = CURRENT.top + 18 + i % 4 * 28;
    c.beginPath(); c.moveTo(x - 22, y); c.lineTo(x + 8, y); c.lineTo(x + 2, y - 5); c.moveTo(x + 8, y); c.lineTo(x + 2, y + 5); c.stroke();
  } c.restore(); label(c, 'STRÖMUNG → MITTAUCHEN FÜR SCHUB & FISCHE', cx - 180, CURRENT.top - 22);
  if (run.boat.thrown && run.boat.cast < .85) label(c, '⚠ DER FISCHER HOLT AUS · TIEF ODER DARÜBER', 15, 135, '#ffe09b');
  const names = { swarm: '01 · Schwarm & kleine Rettung', shark: '02 · Der Hai scheucht Fische auf', boat: '03 · Unter dem Boot hindurch', rest: '04 · Durchatmen', risk: '05 · Sicherer Weg oder Schatz?', tide: '06 · Die Gezeiten-Passage', help: '07 · Deine Freundin hilft zurück', current: '08 · Mit der Strömung auf Fischfang' };
  label(c, names[run.section], 15, 100);
}
class Playground extends Phaser.Scene {
  constructor() { super('playground'); }
  preload() {
    for (const key of ['catch', 'rescue', 'net', 'flow']) this.load.audio(key, `${import.meta.env.BASE_URL}audio/${key}.wav`);
    this.load.on('loaderror', () => { soundError = 'Ton konnte nicht geladen werden'; });
  }
  create() {
    scene = this; this.acc = 0; this.juice = { squash: 0 }; this.soundsPlayed = 0;
    const texture = this.textures.createCanvas('bubble', 12 * ratio, 12 * ratio), ctx = texture.context;
    ctx.strokeStyle = '#efffe8'; ctx.lineWidth = ratio; ctx.beginPath(); ctx.arc(6 * ratio, 6 * ratio, 4 * ratio, 0, Math.PI * 2); ctx.stroke(); texture.refresh();
    // Draw the original vector artwork directly: continuous animation without baked frames or texture uploads.
    this.add.extern().renderCanvas = renderer => {
      const c = renderer.currentContext; c.save(); c.setTransform(ratio, 0, 0, ratio, 0, 0); draw(c); c.restore();
    };
    this.bubbles = this.add.particles(0, 0, 'bubble', { speed: { min: 18 * ratio, max: 90 * ratio }, angle: { min: 190, max: 350 }, gravityY: -35 * ratio, lifespan: 550, alpha: { start: .9, end: 0 }, scale: { start: 1, end: .3 }, emitting: false });
    this.keys = this.input.keyboard.addKeys({ space: 'SPACE', escape: 'ESC', pause: 'P' }); this.input.keyboard.addCapture(['SPACE']);
    this.input.keyboard.on('keydown-ESC', pause); this.input.keyboard.on('keydown-P', pause);
    this.input.on('pointerdown', () => { if (mode === 'playing') { holding = true; demo = null; } });
    this.input.on('pointerup', () => holding = false); this.input.keyboard.on('keydown-SPACE', () => demo = null);
    $('start').disabled = $('safe').disabled = $('risk').disabled = $('sound').disabled = false; showMode('menu');
  }
  playCue(key, rate = 1) {
    if (!muted && !soundError && this.cache.audio.exists(key) && !this.sound.locked && this.sound.play(key, { volume: .28, rate })) this.soundsPlayed++;
  }
  update(now, delta) {
    if (mode === 'playing') {
      this.acc += Math.min(delta / 1000, .1);
      while (this.acc >= 1 / 120 && mode === 'playing') {
        const caught = run.caught, rescued = run.turtle.helped, warning = run.boat.warned, flowing = run.current.entered;
        stepRun(run, 1 / 120, demo ? demoHolding(run, demo) : holding || this.keys.space.isDown, stepCurrent); this.acc -= 1 / 120;
        if (run.caught > caught) {
          if (!reduced) { this.bubbles.explode(8, (run.player.x + 40) * ratio, (run.player.y - 15) * ratio); this.tweens.killTweensOf(this.juice); this.juice.squash = .7; this.tweens.add({ targets: this.juice, squash: 0, duration: 350, ease: 'Back.Out' }); }
          this.playCue('catch', Math.min(1.5, 1 + (run.combo - 1) * .05));
        }
        if (!rescued && run.turtle.helped) this.playCue('rescue');
        if (!warning && run.boat.warned) this.playCue('net');
        if (!flowing && run.current.entered) this.playCue('flow');
        if (run.mode !== 'playing') showMode(run.mode);
      }
    }
    $('combo').textContent = run.time < run.comboUntil && run.combo > 1 ? `${run.combo}er Serie` : run.current.active ? 'Strömung →' : '';
    const soundLabel = soundError ? 'Ton fehlt' : muted ? 'Ton aus' : 'Ton an';
    if ($('sound').textContent !== soundLabel) $('sound').textContent = soundLabel;
    $('sound').title = soundError;
    $('score').textContent = `${run.score} Punkte`; $('progress').textContent = `${Math.min(100, Math.floor(run.distance / LENGTH * 100))} %`;
    $('breath').value = run.player.breath; $('air').classList.toggle('low', run.player.breath < 2.3);
    $('daily').textContent = `Tagesroute ${run.day} · ${storageError || (best === null ? 'Rekord-Speicherung nicht verfügbar' : `Dein Rekord: ${best}`)}`;
    for (const [key, done] of Object.entries(run.features)) { $(`feature-${key}`).dataset.done = done; $(`status-${key}`).textContent = done ? '✓ Erlebt' : '○ Noch vor dir'; }
    $('toast').textContent = run.eventUntil > run.time ? run.event : !run.turtle.helped && run.distance > 600 && run.distance < 1100 ? 'Schildkröte im Netz! Tauche zum goldenen Ring – löse ihn mit dem Schnabel.' : demo && mode === 'playing' ? `Vorführung · ${demo === 'risk' ? 'alle Stationen & Schatz' : 'sicherer Weg'} · Tippen zum Übernehmen` : '';
  }
}
$('sound').onclick = () => { muted = !muted; scene.sound.mute = muted; $('sound').setAttribute('aria-pressed', String(muted)); };
$('start').onclick = () => mode === 'paused' ? pause() : start();
$('safe').onclick = () => start('safe'); $('risk').onclick = () => start('risk'); $('pause').onclick = pause;
for (const event of ['pointerup', 'pointercancel']) window.addEventListener(event, () => holding = false);
function suspend() { holding = false; scene?.input.keyboard.resetKeys(); if (mode === 'playing') pause(); }
window.addEventListener('blur', suspend); document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
window.playground = { snapshot: () => structuredClone({ ...run, mode, demo, presentation: { bubbles: scene?.bubbles.getAliveParticleCount() || 0, soundsPlayed: scene?.soundsPlayed || 0, audioReady: scene?.cache.audio.exists('catch') || false, muted } }) };
new Phaser.Game({ type: Phaser.CANVAS, canvas: $('game'), width: W * ratio, height: H * ratio, banner: false, transparent: true, scene: Playground });
