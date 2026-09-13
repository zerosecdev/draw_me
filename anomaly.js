window.BlackHole = class BlackHole {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 24;
    this.strength = 1200;
    this.diskRotation = 0;
  }

  updateAndPull(bodies) {
    this.diskRotation += 0.04;
    for (let b of bodies) {
      if (b.isDragged) continue;
      const dx = this.x - b.cx;
      const dy = this.y - b.cy;
      const dist = Math.hypot(dx, dy);
      if (dist < 400 && dist > 15) {
        const force = this.strength / (dist * dist + 700);
        const nx = dx / dist;
        const ny = dy / dist;
        b.vx += nx * force - ny * force * 0.4;
        b.vy += ny * force + nx * force * 0.4;
      }
    }
  }

  draw(c) {
    c.save();
    c.beginPath();
    c.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    c.lineWidth = 3;
    c.stroke();

    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = '#000000';
    c.shadowColor = '#a259ff';
    c.shadowBlur = 20;
    c.fill();
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.5;
    c.stroke();
    c.restore();
  }
};

window.blackHoles = [];