window.NEON_COLORS = [
  '#ff007f', '#ff2a85', '#ff77a9',
  '#a259ff', '#7928ca', '#00f0ff',
  '#00f2fe', '#4deeea', '#ffe600'
];

window.PHYSICS = {
  DEFAULT_GRAVITY: 0.35,
  BOUNCE: 0.68,
  AIR_FRICTION: 0.995,
  GROUND_FRICTION: 0.92,
  MAX_ANGULAR_VELOCITY: 0.042,
  // Low squash parameters: firm response with fast settling
  JELLY_ELASTICITY: 0.16,
  JELLY_DAMPING: 0.78
};

window.CHIME_FREQS = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];

window.state = {
  gravityMode: 0,
  gx: 0,
  gy: window.PHYSICS.DEFAULT_GRAVITY,
  soundEnabled: false,
  blackHoleMode: false
};