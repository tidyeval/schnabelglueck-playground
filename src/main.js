import Phaser from 'phaser';
import './style.css';
import { pelican, fish } from './original/art.js';
import { createRun, stepRun, demoHolding, W, H, WATER, LENGTH, ROCK } from './model.js';

const $ = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let scene, run = createRun(), mode = 'menu', holding = false, demo = null;
function showMode(next) {
  mode = next; holding = false;
  $('overlay').hidden = next === 'playing'; $('pause').disabled = !['playing', 'paused'].includes(next);
  $('pause').textContent = next === 'paused' ? '▶' : 'Ⅱ'; $('pause').setAttribute('aria-label', next === 'paused' ? 'Fortsetzen' : 'Pause');
  $('title').innerHTML = next === 'won' ? 'Pip ist angekommen.' : next === 'lost' ? 'Erst mal Luft holen.' : next === 'paused' ? 'Eine kleine Pause.' : 'Ein Schwarm.<br>Zwei Wege.';
  $('description').textContent = next === 'won' ? `${run.caught} Fische · ${run.gold}/3 Schatzfische · ${run.score} Punkte.${run.routeComplete && run.gold === 3 ? ' Schatzroute geschafft: +100 Bonus!' : ' Die tiefe Route bleibt eine freiwillige Herausforderung.'}`
    : next === 'lost' ? 'Tauche zwischendurch auf. Auf der Schatzroute hilft die Luftblase unter dem Riff.'
    : next === 'paused' ? 'Dein Versuch wartet auf dich.' : 'Halte zum Tauchen, lass zum Auftauchen los. Fange Fische und behalte deine Luft im Blick.';
  $('start').textContent = next === 'paused' ? 'Weiterfliegen' : ['won', 'lost'].includes(next) ? 'Noch eine Runde' : 'Los geht’s';
}
function start(route = null) { run = createRun(); demo = route; scene.acc = 0; showMode('playing'); $('game').focus(); }
function pause() { if (mode === 'playing') showMode('paused'); else if (mode === 'paused') { scene.acc = 0; showMode('playing'); $('game').focus(); } }

class Playground extends Phaser.Scene {
  constructor() { super('playground'); }
  create() {
    scene = this; this.acc = 0;
    const bake = (name, w, h, draw) => { const t = this.textures.createCanvas(name, w, h); draw(t.context); t.refresh(); };
    bake('coast', W, H, c => {
      const sky = c.createLinearGradient(0, 0, 0, WATER); sky.addColorStop(0, '#b8dfe0'); sky.addColorStop(1, '#fff0ce'); c.fillStyle = sky; c.fillRect(0, 0, W, WATER);
      c.fillStyle = '#fff7da'; c.beginPath(); c.arc(374, 135, 48, 0, Math.PI * 2); c.fill();
      for (const [x, y, a] of [[80, 80, 1], [260, 110, .7]]) { c.fillStyle = '#fffbee'; c.beginPath(); c.ellipse(x, y, 50 * a, 12 * a, 0, 0, Math.PI * 2); c.ellipse(x - 12, y - 9, 26 * a, 17 * a, 0, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#89b9a2'; c.beginPath(); c.moveTo(0, WATER); c.quadraticCurveTo(80, 250, 175, WATER); c.fill(); c.fillStyle = '#e6d6a8'; c.beginPath(); c.ellipse(105, WATER, 150, 17, 0, 0, Math.PI * 2); c.fill();
      const water = c.createLinearGradient(0, WATER, 0, H); water.addColorStop(0, '#6bc2b5'); water.addColorStop(1, '#205969'); c.fillStyle = water; c.fillRect(0, WATER, W, H - WATER);
      c.fillStyle = '#f8edc144'; c.beginPath(); c.moveTo(180, WATER); c.lineTo(335, H); c.lineTo(420, H); c.lineTo(220, WATER); c.fill();
      c.fillStyle = '#436e68'; c.beginPath(); c.moveTo(0, 800); c.quadraticCurveTo(230, 765, W, 806); c.lineTo(W, H); c.lineTo(0, H); c.fill();
      for (let x = 20; x < W; x += 55) { c.strokeStyle = '#76aa8c'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, H); c.quadraticCurveTo(x - 20, 800, x + 3, 775 - x % 40); c.stroke(); }
    });
    this.add.image(0, 0, 'coast').setOrigin(0);
    this.surface = this.add.graphics(); this.reef = this.add.graphics();
    for (const state of ['dry', 'wet', 'low']) for (let i = 0; i < 8; i++) bake(`pip-${state}-${i}`, 240, 220, c => pelican(c, { x: 100, y: 110, scale: .76, time: i / 8 * Math.PI,
      wet: state !== 'dry', breath: state === 'low' ? 1 : 8, cargo: 3, reducedMotion: reduced, expression: { energy: 100 } }));
    for (const type of ['normal', 'scared', 'gold']) for (let i = 0; i < 6; i++) bake(`fish-${type}-${i}`, 90, 60, c => fish(c, 40, 32, .65, type === 'gold', i / 6 * 2, type === 'scared' ? 1 : 0));
    bake('shark', 160, 90, c => {
      c.fillStyle = '#668e92'; c.beginPath(); c.moveTo(36, 43); c.lineTo(13, 11); c.lineTo(16, 76); c.lineTo(43, 55); c.closePath(); c.fill();
      c.beginPath(); c.ellipse(87, 45, 60, 23, -.05, 0, Math.PI * 2); c.fill(); c.beginPath(); c.moveTo(70, 30); c.lineTo(84, 4); c.lineTo(106, 34); c.fill();
      c.fillStyle = '#d6e4d4'; c.beginPath(); c.ellipse(99, 54, 38, 10, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#234749'; c.beginPath(); c.arc(125, 37, 4, 0, Math.PI * 2); c.fill();
    });
    this.fishSprites = run.fish.map(() => this.add.image(0, 0, 'fish-normal-0').setOrigin(40 / 90, 32 / 60));
    this.shark = this.add.image(0, 0, 'shark').setFlipX(true).setScale(.8);
    this.bubble = this.add.circle(0, 680, 19, 0xd6fff1, .15).setStrokeStyle(2, 0xd5fff0, .8);
    this.add.text(18, 22, 'SCHWARM & SCHATZ', { font: 'bold 10px system-ui', color: '#63897e' });
    this.sign = this.add.text(0, 490, '↑ SICHERER WEG', { font: 'bold 12px system-ui', color: '#eaffdc' });
    this.deepSign = this.add.text(0, 745, '↓ SCHATZROUTE', { font: 'bold 12px system-ui', color: '#f8d68a' });
    this.approach = this.add.text(0, 625, 'Schatz? Hier schon tief tauchen →', { font: '11px system-ui', color: '#eef6d4' });
    this.pip = this.add.image(110, 265, 'pip-dry-0').setOrigin(100 / 240, .5).setDepth(10);
    this.keys = this.input.keyboard.addKeys({ space: 'SPACE', escape: 'ESC', pause: 'P' }); this.input.keyboard.addCapture(['SPACE']);
    this.input.keyboard.on('keydown-ESC', pause); this.input.keyboard.on('keydown-P', pause);
    this.input.on('pointerdown', () => { if (mode === 'playing') { holding = true; demo = null; } });
    this.input.on('pointerup', () => holding = false);
    this.input.keyboard.on('keydown-SPACE', () => demo = null);
    $('start').disabled = $('safe').disabled = $('risk').disabled = false; showMode('menu');
  }
  update(now, delta) {
    if (mode === 'playing') {
      this.acc += Math.min(delta / 1000, .1);
      while (this.acc >= 1 / 120 && mode === 'playing') {
        stepRun(run, 1 / 120, demo ? demoHolding(run, demo) : holding || this.keys.space.isDown);
        this.acc -= 1 / 120;
        if (run.mode !== 'playing') showMode(run.mode);
      }
    }
    const motion = reduced ? 0 : run.time, p = run.player;
    this.surface.clear().lineStyle(3, 0xf5f5cd, .55).beginPath().moveTo(0, WATER);
    for (let x = 0; x <= W; x += 8) this.surface.lineTo(x, WATER + Math.sin(x / 45 + motion * 2) * 2); this.surface.strokePath();
    const rx = ROCK.left - run.distance;
    this.reef.clear().fillStyle(0x376b6c).fillRoundedRect(rx, ROCK.top, ROCK.right - ROCK.left, ROCK.bottom - ROCK.top, 20);
    for (let i = 0; i < 20; i++) this.reef.fillStyle(i % 2 ? 0x4d867b : 0x639384).fillEllipse(rx + 20 + i * 49, ROCK.top + 4, 48, 25 + i % 3 * 9);
    this.sign.setPosition(rx + 110, 490); this.deepSign.setPosition(rx + 130, 745); this.approach.setX(rx - 360);
    run.fish.forEach((f, i) => {
      const x = f.x - run.distance;
      this.fishSprites[i].setVisible(!f.caught && x > -70 && x < W + 70).setPosition(x, f.y)
        .setTexture(`fish-${f.golden ? 'gold' : f.scared ? 'scared' : 'normal'}-${Math.floor(motion * 8 + i) % 6}`).setFlipX(f.vx > 20);
    });
    this.shark.setPosition(run.shark.x - run.distance, run.shark.y);
    this.bubble.setPosition(3590 - run.distance, 680).setVisible(!run.bubbleUsed);
    this.pip.setPosition(p.x, p.y).setTexture(`pip-${p.wet ? p.breath < 2 ? 'low' : 'wet' : 'dry'}-${Math.floor(motion * 6) % 8}`)
      .setRotation(Phaser.Math.Clamp(p.vy / 340, -.4, .65)).setAlpha(run.invulnerable && Math.sin(motion * 22) > 0 ? .6 : 1);
    $('score').textContent = `${run.score} Punkte`; $('progress').textContent = `${Math.min(100, Math.floor(run.distance / LENGTH * 100))} %`;
    $('breath').value = p.breath; $('air').classList.toggle('low', p.breath < 2.3);
    $('toast').textContent = run.eventUntil > run.time ? run.event : demo && mode === 'playing' ? `Vorführung · ${demo === 'risk' ? 'Schatzroute' : 'sicherer Weg'} · Tippen zum Übernehmen` : '';
  }
}
$('start').onclick = () => mode === 'paused' ? pause() : start();
$('safe').onclick = () => start('safe'); $('risk').onclick = () => start('risk'); $('pause').onclick = pause;
for (const event of ['pointerup', 'pointercancel']) window.addEventListener(event, () => holding = false);
function suspend() { holding = false; scene?.input.keyboard.resetKeys(); if (mode === 'playing') pause(); }
window.addEventListener('blur', suspend); document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
window.playground = { snapshot: () => structuredClone({ ...run, mode, demo }) };
new Phaser.Game({ type: Phaser.WEBGL, canvas: $('game'), width: W, height: H, banner: false, audio: { noAudio: true }, scene: Playground });
