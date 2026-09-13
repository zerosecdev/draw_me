window.updateBodyPhysics = function(body, width, height) {
  if (body.isDragged) return;

  body.vx += window.state.gx;
  body.vy += window.state.gy;
  body.cx += body.vx;
  body.cy += body.vy;
  body.angle += body.vRot;

  body.vx *= window.PHYSICS.AIR_FRICTION;
  body.vy *= window.PHYSICS.AIR_FRICTION;
  body.vRot *= 0.992;
  body.vRot = Math.max(-window.PHYSICS.MAX_ANGULAR_VELOCITY, Math.min(window.PHYSICS.MAX_ANGULAR_VELOCITY, body.vRot));

  const points = body.getWorldPoints();
  const floorLimit = Math.max(100, height - 20);
  let maxPen = 0;
  let contact = null;

  for (let p of points) {
    if (p.y > floorLimit) {
      const pen = p.y - floorLimit;
      if (pen > maxPen) { maxPen = pen; contact = p; }
    }
  }

  if (maxPen > 0 && contact) {
    body.cy -= maxPen;
    if (body.vy > 0) {
      const speed = body.vy;
      body.vy = -body.vy * window.PHYSICS.BOUNCE;
      body.vx *= window.PHYSICS.GROUND_FRICTION;
      body.applySquash(speed, 'y');

      const arm = contact.x - body.cx;
      body.vRot *= 0.65;
      body.vRot += (arm * 0.0001) + (body.vx * 0.0004);

      window.playChime(speed);
      for (let i = 0; i < 2; i++) window.spawnSpark(contact.x, floorLimit, contact.color, 1.2);
    }
  }

  for (let p of points) {
    if (p.x < 15) {
      body.cx += (15 - p.x);
      body.applySquash(body.vx, 'x');
      body.vx = Math.abs(body.vx) * window.PHYSICS.BOUNCE;
      body.vRot *= 0.7;
      window.playChime(body.vx);
    } else if (p.x > width - 15) {
      body.cx -= (p.x - (width - 15));
      body.applySquash(body.vx, 'x');
      body.vx = -Math.abs(body.vx) * window.PHYSICS.BOUNCE;
      body.vRot *= 0.7;
      window.playChime(body.vx);
    }
    if (p.y < 15) {
      body.cy += (15 - p.y);
      body.applySquash(body.vy, 'y');
      body.vy = Math.abs(body.vy) * window.PHYSICS.BOUNCE;
      body.vRot *= 0.8;
      window.playChime(body.vy);
    }
  }
};

// PERFECT CONTOUR-BASED COLLISION (Points & Segments)
window.resolveCollisions = function(bodies) {
  const contactRadius = 14; // Contact thickness of strokes
  const contactRadiusSq = contactRadius * contactRadius;

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const b1 = bodies[i];
      const b2 = bodies[j];

      // Broadphase circle check
      const dCentroid = Math.hypot(b2.cx - b1.cx, b2.cy - b1.cy);
      if (dCentroid > b1.radius + b2.radius + contactRadius) continue;

      const pts1 = b1.getWorldPoints();
      const pts2 = b2.getWorldPoints();

      let collisionOccurred = false;

      // Narrowphase: Check points of b1 against segments of b2
      for (let p of pts1) {
        for (let k = 0; k < pts2.length - 1; k++) {
          const s1 = pts2[k];
          const s2 = pts2[k + 1];

          const l2 = (s2.x - s1.x) * (s2.x - s1.x) + (s2.y - s1.y) * (s2.y - s1.y);
          if (l2 === 0) continue;

          let t = ((p.x - s1.x) * (s2.x - s1.x) + (p.y - s1.y) * (s2.y - s1.y)) / l2;
          t = Math.max(0, Math.min(1, t));

          const projX = s1.x + t * (s2.x - s1.x);
          const projY = s1.y + t * (s2.y - s1.y);
          const distSq = (p.x - projX) * (p.x - projX) + (p.y - projY) * (p.y - projY);

          if (distSq < contactRadiusSq && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const nx = (p.x - projX) / dist; // Collision Normal
            const ny = (p.y - projY) / dist;
            const overlap = contactRadius - dist;

            const totalMass = b1.mass + b2.mass;

            // Position separation
            if (!b1.isDragged && !b2.isDragged) {
              b1.cx += nx * overlap * (b2.mass / totalMass);
              b1.cy += ny * overlap * (b2.mass / totalMass);
              b2.cx -= nx * overlap * (b1.mass / totalMass);
              b2.cy -= ny * overlap * (b1.mass / totalMass);
            }

            // Relative contact velocity (linear + angular)
            const r1x = p.x - b1.cx;
            const r1y = p.y - b1.cy;
            const r2x = projX - b2.cx;
            const r2y = projY - b2.cy;

            const v1x = b1.vx - b1.vRot * r1y;
            const v1y = b1.vy + b1.vRot * r1x;
            const v2x = b2.vx - b2.vRot * r2y;
            const v2y = b2.vy + b2.vRot * r2x;

            const rvx = v1x - v2x;
            const rvy = v1y - v2y;
            const velNorm = rvx * nx + rvy * ny;

            if (velNorm < 0) {
              const r1CrossN = r1x * ny - r1y * nx;
              const r2CrossN = r2x * ny - r2y * nx;

              const invMassSum = (1 / b1.mass) + (1 / b2.mass) +
                                 (r1CrossN * r1CrossN / b1.inertia) +
                                 (r2CrossN * r2CrossN / b2.inertia);

              const impulse = -(1 + window.PHYSICS.BOUNCE) * velNorm / invMassSum;

              if (!b1.isDragged) {
                b1.vx += (impulse / b1.mass) * nx;
                b1.vy += (impulse / b1.mass) * ny;
                b1.vRot += (r1CrossN * impulse) / b1.inertia * 0.4;
                b1.applySquash(impulse * 0.015, 'y');
              }
              if (!b2.isDragged) {
                b2.vx -= (impulse / b2.mass) * nx;
                b2.vy -= (impulse / b2.mass) * ny;
                b2.vRot -= (r2CrossN * impulse) / b2.inertia * 0.4;
                b2.applySquash(impulse * 0.015, 'y');
              }

              window.playChime(Math.abs(velNorm));
              window.spawnSpark((p.x + projX) / 2, (p.y + projY) / 2, '#00f0ff', 1.2);
            }

            collisionOccurred = true;
            break;
          }
        }
        if (collisionOccurred) break;
      }
    }
  }
};