export const CURRENT = { left: 7150, right: 7650, top: 435, bottom: 565 };
export function createCurrentStep({ Engine, Bodies, Body, Composite, Query }) {
  const worlds = new WeakMap();
  return function stepCurrent(s, dt) {
    const px = s.distance + s.player.x;
    if (px < CURRENT.left - 200 || px > CURRENT.right + 300) { s.current.active = false; s.current.speed = 0; return; }
    let world = worlds.get(s);
    if (!world) {
      const engine = Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
      const sensor = Bodies.rectangle((CURRENT.left + CURRENT.right) / 2, (CURRENT.top + CURRENT.bottom) / 2, CURRENT.right - CURRENT.left, CURRENT.bottom - CURRENT.top, { isStatic: true, isSensor: true });
      const body = Bodies.circle(px, s.player.y, 18, { frictionAir: .035, inertia: Infinity });
      Composite.add(engine.world, [sensor, body]); world = { engine, sensor, body }; worlds.set(s, world);
    }
    const { engine, sensor, body } = world;
    Body.setPosition(body, { x: px, y: s.player.y }); Body.setVelocity(body, { x: s.current.speed / 60, y: 0 });
    s.current.active = s.player.wet && Query.collides(body, [sensor]).length > 0;
    if (s.current.active) { s.current.entered = true; Body.applyForce(body, body.position, { x: body.mass * .00032, y: 0 }); }
    Engine.update(engine, dt * 1000);
    s.current.speed = Math.max(0, Math.min(165, Body.getVelocity(body).x * 60));
  }
}
