window.BRUSHES = [
  {
    id: 'neon',
    name: 'Neon',
    colors: ['#ff007f', '#ff2a85', '#a259ff', '#7928ca', '#00f0ff', '#4deeea'],
    lineWidth: 3.0,
    glowBlur: 14,
    starSize: 2.4,
    nodeShape: 'star'
  },
  {
    id: 'fire',
    name: 'Solar Fire',
    colors: ['#ff1e00', '#ff5500', '#ff9900', '#ffcc00', '#ffe600', '#ffffff'],
    lineWidth: 4.2,
    glowBlur: 18,
    starSize: 3.0,
    nodeShape: 'spark'
  },
  {
    id: 'ice',
    name: 'Ice Crystal',
    colors: ['#e0f7fa', '#80deea', '#26c6da', '#00e5ff', '#ffffff', '#b2ebf2'],
    lineWidth: 2.2,
    glowBlur: 10,
    starSize: 2.0,
    nodeShape: 'diamond'
  },
  {
    id: 'rainbow',
    name: 'Aurora',
    colors: ['#ff0055', '#ff7700', '#ffee00', '#00ff66', '#00eeff', '#aa00ff'],
    lineWidth: 3.4,
    glowBlur: 16,
    starSize: 2.6,
    nodeShape: 'star'
  },
  {
    id: 'gold',
    name: 'Gold Dust',
    colors: ['#ffe082', '#ffd54f', '#ffca28', '#ffb300', '#ffffff', '#fff8e1'],
    lineWidth: 2.6,
    glowBlur: 12,
    starSize: 2.2,
    nodeShape: 'spark'
  }
];

window.currentBrushIndex = 0;

window.getCurrentBrush = function() {
  return window.BRUSHES[window.currentBrushIndex];
};

window.cycleBrush = function() {
  window.currentBrushIndex = (window.currentBrushIndex + 1) % window.BRUSHES.length;
  return window.getCurrentBrush();
};