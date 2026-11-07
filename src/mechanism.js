export const MACHINE = { buoyX: 8500, pivotX: 8860, pivotY: 355, arm: 160, gateX: 9020, gateY: 545, gateHeight: 190, floor: 670 };
export function createMechanismStep({ Engine, Bodies, Body, Composite, Constraint, Query }) {
  const worlds = new WeakMap();
  return function stepMechanism(s, dt) {
    const m = s.mechanism, px = s.distance + s.player.x;
    if (px < MACHINE.buoyX - 550 || px > MACHINE.gateX + 550) return;
    let w = worlds.get(s);
    if (!w) {
      const engine = Engine.create({ gravity: { x: 0, y: 1, scale: .001 } });
      const buoy = Bodies.circle(MACHINE.buoyX, s.water + 45, 23, { frictionAir: .08 });
      const beam = Bodies.rectangle(MACHINE.pivotX, MACHINE.pivotY, 340, 12, { frictionAir: .08 });
      const weight = Bodies.rectangle(MACHINE.pivotX - MACHINE.arm, MACHINE.pivotY + 35, 40, 44, { frictionAir: .08, inertia: Infinity });
      const gate = Bodies.rectangle(MACHINE.gateX, MACHINE.gateY, 38, MACHINE.gateHeight, { frictionAir: .08, inertia: Infinity });
      Body.setMass(beam, 1); Body.setMass(weight, 12); Body.setMass(gate, 1);
      for (const body of [beam, weight, gate]) Body.setStatic(body, true);
      const anchor = { x: MACHINE.buoyX, y: s.water + 210 };
      const tether = Constraint.create({ pointA: anchor, bodyB: buoy, length: 165, stiffness: .015, damping: .12 });
      const hinge = Constraint.create({ pointA: { x: MACHINE.pivotX, y: MACHINE.pivotY }, bodyB: beam, length: 0, stiffness: 1 });
      const left = Constraint.create({ bodyA: beam, pointA: { x: -MACHINE.arm, y: 0 }, bodyB: weight, length: 35, stiffness: .95, damping: .2 });
      const right = Constraint.create({ bodyA: beam, pointA: { x: MACHINE.arm, y: 0 }, bodyB: gate, length: MACHINE.gateY - MACHINE.pivotY, stiffness: .95, damping: .2 });
      const probe = Bodies.circle(px + 40, s.player.y - 15, 20, { isSensor: true });
      Composite.add(engine.world, [buoy, beam, weight, gate, tether, hinge, left, right]);
      w = { engine, buoy, beam, weight, gate, anchor, probe }; worlds.set(s, w);
    }
    const { engine, buoy, beam, weight, gate, anchor, probe } = w;
    anchor.y = s.water + 210;
    // Counter the world's gravity and gently restore the buoy to the moving surface.
    Body.applyForce(buoy, buoy.position, { x: 0, y: buoy.mass * (-.001 + (s.water + 45 - buoy.position.y) * .000025) });
    Body.setPosition(probe, { x: px + 40, y: s.player.y - 15 });
    if (s.player.wet && Query.collides(probe, [buoy]).length) {
      m.touched = true; Body.applyForce(buoy, buoy.position, { x: buoy.mass * .012, y: 0 });
    }
    if (!m.activated && m.touched && buoy.position.x > MACHINE.buoyX + 10) {
      m.activated = true;
      for (const body of [beam, weight, gate]) Body.setStatic(body, false);
    }
    Engine.update(engine, dt * 1000);
    if (beam.angle < -1) { Body.setAngle(beam, -1); Body.setAngularVelocity(beam, 0); }
    if (beam.angle > .05) { Body.setAngle(beam, .05); Body.setAngularVelocity(beam, 0); }
    m.buoyX = buoy.position.x; m.buoyY = buoy.position.y; m.angle = beam.angle;
    m.weightX = weight.position.x; m.weightY = weight.position.y; m.gateX = gate.position.x; m.gateY = gate.position.y;
    m.open = m.activated && gate.position.y < MACHINE.gateY - 95;
  };
}
