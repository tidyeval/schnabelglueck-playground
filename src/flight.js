export const WIND = { left: 11080, right: 11900, top: 145, bottom: 350 };
export const FLIGHT = { start: 11400, finish: 13600, duration: 12.5, transition: 1.35 };
export function createFlight() {
  return { started: false, active: false, completed: false, elapsed: 0, x: 0, vx: 0, passed: 0, missed: 0,
    rings: [-.62, .62, 0, -.45, .45].map((x, i) => ({ x, at: 2.7 + i * 1.9, judged: false, passed: false })) };
}
export function stepFlight(f, dt, input = 0, target = null) {
  f.elapsed += dt;
  const direction = target === null ? input : Math.max(-1, Math.min(1, (target - f.x) * 5));
  f.vx += (direction * 1.6 - f.vx) * (1 - Math.exp(-dt * 9));
  f.x = Math.max(-1, Math.min(1, f.x + f.vx * dt));
  let points = 0;
  for (const ring of f.rings) if (!ring.judged && f.elapsed >= ring.at) {
    ring.judged = true; ring.passed = Math.abs(f.x - ring.x) < .24;
    if (ring.passed) { f.passed++; points += 25; } else f.missed++;
  }
  if (f.elapsed >= FLIGHT.duration) { f.active = false; f.completed = true; }
  return points;
}
export function flightBlend(f, reduced = false) {
  if (!f.active) return 0;
  const amount = Math.min(1, f.elapsed / FLIGHT.transition, (FLIGHT.duration - f.elapsed) / FLIGHT.transition);
  return reduced ? 1 : amount * amount * (3 - 2 * amount);
}
export function demoFlightTarget(f) { return f.rings.find(r => !r.judged)?.x ?? 0; }
