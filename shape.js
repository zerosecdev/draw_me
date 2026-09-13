window.CelestialBody = class CelestialBody {
  constructor(points, isHeart = false, brush = null) {
    this.isHeart = isHeart;
    this.brush = brush || (window.getCurrentBrush ? window.getCurrentBrush() : window.BRUSHES[0]);

    let sumX = 0, sumY = 0;
    points.forEach(p => { sumX += p.x; sumY += p.y; });
    this.cx = sumX / points.length;
    this.cy = sumY / points.length;

    let maxDist = 0;
    let inertia = 0;

    this.offsets = points.map(p => {
      const dx = p.x - this.cx;
      const dy = p.y - this.cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxDist) maxDist = dist;
      inertia += dist * dist;
      return {
        dist: dist,
        initialAngle: Math.atan2(dy, dx),
        color: p.color || this.brush.colors[0],
        starSize: this.brush.starSize || 2.4
      };
    });

    this.radius = Math.max(maxDist, 16);
    this.mass = Math.max(points.length, 10);
    this.inertia = Math.max(inertia * 0.4, 250); // Moment of inertia for realistic torque

    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 1.2) * 2;
    this.angle = 0;
    this.vRot = (Math.random() - 0.5) * 0.012;
    this.isDragged = false;

    // Firm micro-squash
    this.squashX = 1;
    this.squashY = 1;
    this.vSquashX = 0;
    this.vSquashY = 0;

    this.heartbeatTimer = 0;
    this.heartbeatScale = 1;
  }

  applySquash(speed, axis = 'y') {
    const intensity = Math.min(0.06, Math.abs(speed) * 0.006);
    if (axis === 'y') {
      this.vSquashY -= intensity;
      this.vSquashX += intensity * 0.35;
    } else {
      this.vSquashX -= intensity;
      this.vSquashY += intensity * 0.35;
    }
  }

  getWorldPoints() {
    const scale = this.heartbeatScale;
    return this.offsets.map(o => {
      const a = this.angle + o.initialAngle;
      const ox = Math.cos(a) * o.dist * this.squashX * scale;
      const oy = Math.sin(a) * o.dist * this.squashY * scale;
      return {
        x: this.cx + ox,
        y: this.cy + oy,
        color: o.color,
        size: o.starSize * scale
      };
    });
  }

  // ACCURATE PICKING: Check distance to actual line segments (within 24px)
  containsPoint(px, py) {
    const pts = this.getWorldPoints();
    if (pts.length < 2) return false;

    // Quick distance cutoff
    if (Math.hypot(px - this.cx, py - this.cy) > this.radius + 30) return false;

    const thresholdSq = 24 * 24; // 24px touch detection zone around the stroke

    for (let i = 0; i < pts.length - 1; i++) {
      const x1 = pts[i].x, y1 = pts[i].y;
      const x2 = pts[i + 1].x, y2 = pts[i + 1].y;

      const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
      let distSq = 0;
      if (l2 === 0) {
        distSq = (px - x1) * (px - x1) + (py - y1) * (py - y1);
      } else {
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projX = x1 + t * (x2 - x1);
        const projY = y1 + t * (y2 - y1);
        distSq = (px - projX) * (px - projX) + (py - projY) * (py - projY);
      }

      if (distSq < thresholdSq) return true;
    }
    return false;
  }

  update() {
    const fX = (1 - this.squashX) * 0.16;
    this.vSquashX = (this.vSquashX + fX) * 0.78;
    this.squashX += this.vSquashX;

    const fY = (1 - this.squashY) * 0.16;
    this.vSquashY = (this.vSquashY + fY) * 0.78;
    this.squashY += this.vSquashY;

    if (this.isHeart) {
      this.heartbeatTimer += 0.035;
      const cycle = this.heartbeatTimer % (Math.PI * 2);
      if (cycle < 0.28) {
        this.heartbeatScale = 1 + Math.sin(cycle * (Math.PI / 0.28)) * 0.12;
      } else if (cycle > 0.42 && cycle < 0.7) {
        this.heartbeatScale = 1 + Math.sin((cycle - 0.42) * (Math.PI / 0.28)) * 0.06;
      } else {
        this.heartbeatScale = 1;
      }
      if (Math.abs(cycle - 0.05) < 0.02) window.playHeartbeatPulse();
    }
  }

  draw(c) {
    const pts = this.getWorldPoints();
    if (pts.length < 2) return;
    c.save();

    c.lineWidth = this.brush.lineWidth || 3.0;
    c.lineCap = 'round';
    c.lineJoin = 'round';

    for (let i = 0; i < pts.length - 1; i++) {
      c.beginPath();
      c.moveTo(pts[i].x, pts[i].y);
      c.lineTo(pts[i + 1].x, pts[i + 1].y);
      c.strokeStyle = pts[i].color;
      c.shadowColor = pts[i].color;
      c.shadowBlur = this.brush.glowBlur || 14;
      c.stroke();
    }

    for (let p of pts) {
      c.beginPath();
      if (this.brush.nodeShape === 'diamond') {
        c.moveTo(p.x, p.y - p.size * 1.4);
        c.lineTo(p.x + p.size * 1.4, p.y);
        c.lineTo(p.x, p.y + p.size * 1.4);
        c.lineTo(p.x - p.size * 1.4, p.y);
        c.closePath();
      } else {
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      }
      c.fillStyle = '#ffffff';
      c.shadowColor = p.color;
      c.shadowBlur = 10;
      c.fill();
    }
    c.restore();
  }
};