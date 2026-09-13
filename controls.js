window.isDrawing = false;
window.currentStroke = [];

let colorIdx = 0;
let draggedBody = null;
let dragOffset = { x: 0, y: 0 };
let moveHistory = []; // Rolling window for accurate throw velocity

function getCoords(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

window.setupControls = function(canvas, bodies, onShapeComplete) {
  function onStart(e) {
    if (e.target.closest('.hud-panel')) return;
    window.initAudio();

    const pos = getCoords(e);
    const px = pos.x;
    const py = pos.y;

    if (window.state.blackHoleMode || e.button === 2) {
      window.blackHoles.push(new window.BlackHole(px, py));
      return;
    }

    // 1. Pick & Hold
    for (let i = bodies.length - 1; i >= 0; i--) {
      if (bodies[i].containsPoint(px, py)) {
        draggedBody = bodies[i];
        draggedBody.isDragged = true;
        draggedBody.vx = 0;
        draggedBody.vy = 0;
        dragOffset.x = draggedBody.cx - px;
        dragOffset.y = draggedBody.cy - py;
        moveHistory = [{ x: px, y: py, t: performance.now() }];

        document.body.classList.add('is-dragging');
        return;
      }
    }

    // 2. Draw with Active Brush
    window.isDrawing = true;
    window.currentStroke.length = 0;
    const brush = window.getCurrentBrush ? window.getCurrentBrush() : window.BRUSHES[0];
    const color = brush.colors[colorIdx++ % brush.colors.length];
    window.currentStroke.push({ x: px, y: py, color: color });
  }

  function onMove(e) {
    const pos = getCoords(e);
    const px = pos.x;
    const py = pos.y;
    const now = performance.now();

    // Move existing shape & record throw trajectory
    if (draggedBody) {
      draggedBody.cx = px + dragOffset.x;
      draggedBody.cy = py + dragOffset.y;

      moveHistory.push({ x: px, y: py, t: now });
      if (moveHistory.length > 5) moveHistory.shift();
      return;
    }

    // Draw active stroke
    if (window.isDrawing) {
      const last = window.currentStroke[window.currentStroke.length - 1];
      const dist = Math.hypot(px - last.x, py - last.y);
      if (dist > 8) {
        const brush = window.getCurrentBrush ? window.getCurrentBrush() : window.BRUSHES[0];
        const color = brush.colors[colorIdx++ % brush.colors.length];
        window.currentStroke.push({ x: px, y: py, color: color });
        window.spawnSpark(px, py, color, 0.8);
      }
    }
  }

  function onEnd() {
    // Release and throw with real momentum
    if (draggedBody) {
      if (moveHistory.length >= 2) {
        const first = moveHistory[0];
        const last = moveHistory[moveHistory.length - 1];
        const dt = Math.max(16, last.t - first.t);
        const vx = ((last.x - first.x) / dt) * 16.6;
        const vy = ((last.y - first.y) / dt) * 16.6;

        // Apply energetic throw vector
        draggedBody.vx = Math.max(-25, Math.min(25, vx * 1.15));
        draggedBody.vy = Math.max(-25, Math.min(25, vy * 1.15));
        draggedBody.vRot = Math.max(-0.04, Math.min(0.04, (vx * 0.002)));
      }

      draggedBody.isDragged = false;
      draggedBody = null;
      moveHistory = [];
      document.body.classList.remove('is-dragging');
    }

    // Finish Drawing
    if (window.isDrawing) {
      window.isDrawing = false;
      if (window.currentStroke.length >= 3) {
        const activeBrush = window.getCurrentBrush ? window.getCurrentBrush() : window.BRUSHES[0];
        onShapeComplete([...window.currentStroke], activeBrush);
      }
      window.currentStroke.length = 0;
    }
  }

  canvas.addEventListener('pointerdown', onStart);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onEnd);

  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onStart(e); }, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onEnd);
};