import { pelican } from './original/art.js';
import { W, H } from './model.js';
import { flightBlend } from './flight.js';
const ellipse = (c, x, y, rx, ry, fill, tilt = 0) => { c.fillStyle = fill; c.beginPath(); c.ellipse(x, y, rx, ry, tilt, 0, Math.PI * 2); c.fill(); };
export function drawFlight(c, f, time, reduced, sideY = 210) {
  const blend = flightBlend(f, reduced); if (!f.active) return;
  c.save(); c.globalAlpha = blend;
  const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#a8dce3'); sky.addColorStop(.38, '#e5f0d3'); sky.addColorStop(.55, '#9dd0bf'); sky.addColorStop(1, '#397e89'); c.fillStyle = sky; c.fillRect(0, 0, W, H);
  ellipse(c, 370, 140, 42, 42, '#ffeab0'); ellipse(c, 370, 140, 63, 63, '#fff2c44d');
  for (let i = 0; i < 7; i++) {
    const z = ((i * 330 - time * 200) % 2300 + 2300) % 2300, s = 380 / (380 + z);
    for (const side of [-1, 1]) {
      const x = W / 2 + side * (260 + i % 3 * 75) * s, y = 245 + 390 * s;
      ellipse(c, x, y, 140 * s, 22 * s, '#f4f7e5a8'); ellipse(c, x - 20 * s, y - 14 * s, 70 * s, 28 * s, '#fff9e5ba');
    }
  }
  const horizon = 360 - 115 * blend;
  // Rings use a perspective divide: size, lateral position and depth all converge toward the horizon.
  for (const ring of [...f.rings].reverse()) {
    const z = (ring.at - f.elapsed) * 290; if (z < -200 || z > 2400) continue;
    const s = 380 / (380 + z), x = W / 2 + ring.x * 155 * s, y = horizon + (550 - horizon) * s;
    c.globalAlpha = blend * (ring.judged ? Math.max(0, 1 + z / 200) : 1);
    c.strokeStyle = ring.judged ? ring.passed ? '#b8ffd2' : '#db9c7f' : '#ffe0a0'; c.lineWidth = Math.max(1.5, 8 * s);
    c.beginPath(); c.ellipse(x, y, 102 * s, 100 * s, -.08, 0, Math.PI * 2); c.stroke();
    if (!ring.judged) { c.strokeStyle = '#fff4ca'; c.lineWidth = Math.max(1, 2 * s); c.beginPath(); c.ellipse(x, y, 95 * s, 93 * s, -.08, -.7, .7); c.stroke(); }
  }
  c.globalAlpha = blend;
  const x = 110 + (W / 2 + f.x * 155 - 110) * blend, y = sideY + (550 - sideY) * blend;
  // One opaque bird throughout the turn: narrow the side silhouette, then unfold the frontal wings.
  if (blend < .5) {
    c.save(); c.globalAlpha = 1; c.translate(x, y); c.scale(1 - .6 * blend, 1);
    pelican(c, { x: 0, y: 0, scale: .76, time: reduced ? 0 : time, wet: false, breath: 8, reducedMotion: reduced, expression: { energy: 100 } });
    c.restore(); c.restore(); return;
  }
  c.globalAlpha = 1;
  c.save(); c.translate(x, y); c.scale(.4 + .6 * blend, 1); c.rotate(-f.vx * .11 * blend);
  const flap = reduced ? 0 : Math.sin(time * 4.5) * .12;
  for (const side of [-1, 1]) {
    const folding = 1 - .35 * Math.max(0, 1 - Math.min(...f.rings.map(r => Math.abs(r.at - f.elapsed))) / .45);
    c.save(); c.scale(side * folding * (.3 + .7 * blend), 1); c.rotate(flap);
    c.fillStyle = '#e6ecda'; c.strokeStyle = '#8caa98'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(12, 12); c.bezierCurveTo(40, -8, 70, -8, 99, 9); c.quadraticCurveTo(90, 19, 80, 18); c.quadraticCurveTo(79, 28, 68, 24); c.quadraticCurveTo(62, 35, 48, 26); c.lineTo(15, 30); c.closePath(); c.fill(); c.stroke();
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(28 + i * 10, 12); c.lineTo(61 + i * 9, 20 - i * 3); c.stroke(); } c.restore();
  }
  ellipse(c, 0, 19, 29, 43, '#dbe5d1'); ellipse(c, -2, 14, 25, 38, '#fffbed');
  ellipse(c, 0, -26, 24, 31, '#fffbed');
  ellipse(c, -7, -55, 5, 12, '#fffbed', -.45); ellipse(c, 3, -57, 4, 11, '#fffbed', .12);
  for (const side of [-1, 1]) { ellipse(c, side * 12, -28, 7, 8, '#fffdf0'); ellipse(c, side * 12 - f.x, -27, 3.8, 5, '#315c62'); ellipse(c, side * 12 - 1, -29, 1.3, 1.6, '#fff'); ellipse(c, side * 19, -17, 5, 3, '#efb9a0'); }
  const beak = c.createLinearGradient(0, -17, 0, 31); beak.addColorStop(0, '#ffdc8d'); beak.addColorStop(1, '#de9b50'); c.fillStyle = beak; c.strokeStyle = '#c68a47'; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(-17, -17); c.quadraticCurveTo(0, -25, 17, -17); c.quadraticCurveTo(19, 12, 0, 31); c.quadraticCurveTo(-19, 12, -17, -17); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-15, -13); c.quadraticCurveTo(0, -5, 15, -13); c.stroke(); c.restore();
  c.fillStyle = '#fff7dc'; c.textAlign = 'center'; c.font = 'bold 14px system-ui'; c.fillText('IM AUFWIND · DURCH DIE RINGE', W / 2, 105);
  c.font = '12px system-ui'; c.fillText(`${f.passed}/${f.rings.length} Ringe · ← → oder auf dem Bildschirm ziehen`, W / 2, 133);
  const next = f.rings.find(r => !r.judged); if (next && f.elapsed > 1) { c.fillStyle = '#fff8deaa'; c.beginPath(); c.arc(W / 2 + next.x * 155, 550, 4, 0, Math.PI * 2); c.fill(); }
  c.restore();
}
