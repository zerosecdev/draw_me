window.ambientStars = [];
window.stardust = [];

window.initAmbientStars = function(width, height) {
  window.ambientStars.length = 0;
  const count = Math.floor((width * height) / 3800) || 50;
  for (let i = 0; i < count; i++) {
    window.ambientStars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      color: window.NEON_COLORS[Math.floor(Math.random() * window.NEON_COLORS.length)],
      alpha: Math.random() * 0.7 + 0.3,
      pulseSpeed: Math.random() * 0.03 + 0.01
    });
  }
};

class StarSpark {
  constructor(x, y, color, mult = 1) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 2.5 + 1) * mult;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.alpha = 1;
    this.decay = Math.random() * 0.03 + 0.02;
    this.size = Math.random() * 2.2 + 1;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }
  draw(c) {
    c.save();
    c.globalAlpha = Math.max(0, this.alpha);
    c.fillStyle = this.color;
    c.beginPath();
    c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

window.spawnSpark = function(x, y, color, mult = 1) {
  window.stardust.push(new StarSpark(x, y, color, mult));
};