const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');

let width = 360;
let height = 640;

// Viewport layout fix for Android previewers
function updateDimensions() {
  const w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || screen.width || 360;
  const h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || screen.height || 640;

  if (w > 20 && h > 20) {
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      width = w;
      height = h;
      return true;
    }
  }
  return false;
}

updateDimensions();
window.addEventListener('resize', () => {
  updateDimensions();
  window.initAmbientStars(width, height);
});

const bodies = [];

// Spawn heart using the active brush styling
function spawnCosmicHeart(cx, cy, scale) {
  const targetX = cx || (width > 50 ? width / 2 : 180);
  const targetY = cy || (height > 50 ? height * 0.32 : 240);
  const s = scale || (width < 500 ? 5.5 : 7.5);
  const brush = window.getCurrentBrush ? window.getCurrentBrush() : window.BRUSHES[0];

  const pts = [];
  const steps = 54;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push({ x: targetX + x * s, y: targetY + y * s, color: brush.colors[i % brush.colors.length] });
  }
  bodies.push(new window.CelestialBody(pts, true, brush));
}

// --- HUD BUTTON ACTIONS ---
document.getElementById('btnSpawnHeart').onclick = (e) => {
  e.stopPropagation();
  window.initAudio();
  spawnCosmicHeart();
};

// Cycle through all brushes (Neon, Solar Fire, Ice Crystal, Aurora, Gold Dust)
const btnBrush = document.getElementById('btnBrush');
btnBrush.onclick = (e) => {
  e.stopPropagation();
  const nextBrush = window.cycleBrush();
  btnBrush.textContent = '🎨 ' + nextBrush.name;
};

const btnGrav = document.getElementById('btnToggleGravity');
btnGrav.onclick = (e) => {
  e.stopPropagation();
  window.state.gravityMode = (window.state.gravityMode + 1) % 3;
  if (window.state.gravityMode === 0) {
    window.state.gy = window.PHYSICS.DEFAULT_GRAVITY;
    btnGrav.textContent = '🌌 Gravity: Normal';
  } else if (window.state.gravityMode === 1) {
    window.state.gy = 0;
    btnGrav.textContent = '🛸 Gravity: Zero-G';
  } else {
    window.state.gy = -window.PHYSICS.DEFAULT_GRAVITY;
    btnGrav.textContent = '🚀 Gravity: Inverted';
  }
};

const btnHole = document.getElementById('btnToggleBlackHole');
btnHole.onclick = (e) => {
  e.stopPropagation();
  window.state.blackHoleMode = !window.state.blackHoleMode;
  btnHole.classList.toggle('active', window.state.blackHoleMode);
  if (window.state.blackHoleMode && window.blackHoles.length === 0) {
    window.blackHoles.push(new window.BlackHole(width / 2, height / 2));
  }
};

const btnAudio = document.getElementById('btnToggleAudio');
btnAudio.onclick = (e) => {
  e.stopPropagation();
  window.initAudio();
  window.state.soundEnabled = !window.state.soundEnabled;
  btnAudio.textContent = window.state.soundEnabled ? '🔊 Sound: On' : '🔇 Sound: Off';
  btnAudio.classList.toggle('active', window.state.soundEnabled);
};

document.getElementById('btnClear').onclick = (e) => {
  e.stopPropagation();
  bodies.length = 0;
  window.stardust.length = 0;
  window.blackHoles.length = 0;
};

// Setup controls with active brush passing
window.setupControls(canvas, bodies, (points, activeBrush) => {
  bodies.push(new window.CelestialBody(points, false, activeBrush));
});

// Staggered initialization for Android file previewers
[50, 180, 450].forEach(delay => {
  setTimeout(() => {
    const resized = updateDimensions();
    if (resized || window.ambientStars.length === 0) window.initAmbientStars(width, height);
    if (bodies.length === 0) spawnCosmicHeart();
  }, delay);
});

// --- MAIN LOOP ---
function loop() {
  if (canvas.width <= 10 || canvas.height <= 10) {
    updateDimensions();
    if (window.ambientStars.length === 0) window.initAmbientStars(width, height);
    if (bodies.length === 0) spawnCosmicHeart();
  }

  ctx.fillStyle = 'rgba(3, 1, 9, 0.3)';
  ctx.fillRect(0, 0, width, height);

  // 1. Ambient Stars
  for (let s of window.ambientStars) {
    s.alpha += Math.sin(Date.now() * s.pulseSpeed) * 0.012;
    ctx.save();
    ctx.globalAlpha = Math.max(0.15, Math.min(1, s.alpha));
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. Stardust Particles
  for (let i = window.stardust.length - 1; i >= 0; i--) {
    window.stardust[i].update();
    window.stardust[i].draw(ctx);
    if (window.stardust[i].alpha <= 0) window.stardust.splice(i, 1);
  }

  // 3. Black Holes
  for (let hole of window.blackHoles) {
    hole.updateAndPull(bodies);
    hole.draw(ctx);
  }

  // 4. Object-to-Object Collisions
  window.resolveCollisions(bodies);

  // 5. Celestial Bodies (Update & Render)
  for (let i = bodies.length - 1; i >= 0; i--) {
    const b = bodies[i];
    window.updateBodyPhysics(b, width, height);
    b.update();
    b.draw(ctx);
  }

  // 6. Active Drawing Stroke using current brush style
  if (window.isDrawing && window.currentStroke.length > 1) {
    const activeBrush = window.getCurrentBrush ? window.getCurrentBrush() : window.BRUSHES[0];
    ctx.save();
    ctx.lineWidth = activeBrush.lineWidth || 3.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < window.currentStroke.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(window.currentStroke[i].x, window.currentStroke[i].y);
      ctx.lineTo(window.currentStroke[i + 1].x, window.currentStroke[i + 1].y);
      ctx.strokeStyle = window.currentStroke[i].color;
      ctx.shadowColor = window.currentStroke[i].color;
      ctx.shadowBlur = activeBrush.glowBlur || 14;
      ctx.stroke();
    }
    ctx.restore();
  }

  requestAnimationFrame(loop);
}

loop();