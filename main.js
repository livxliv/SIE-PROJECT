// 1. Get the canvas and its drawing context
const canvas = document.getElementById('city');
const ctx = canvas.getContext('2d');

// 2. Read the colors from the CSS variables
const css = getComputedStyle(document.documentElement);
const scale = [];
for (let i = 0; i < 8; i++) {
  scale.push(css.getPropertyValue(`--scale-${i}`).trim());
}

// 3. Test drawing: one colored square per scale step
scale.forEach((color, i) => {
  ctx.fillStyle = color;
  ctx.fillRect(10 + i * 24, 10, 20, 20);
});

// 4. Keep your button code
document.getElementById('start').addEventListener('click', () => {
  alert('Level select coming soon!');
});

const TILE = 16;                      // pixels per tile
const COLS = canvas.width / TILE;     // 320 / 16 = 20 tiles across
const ROWS = canvas.height / TILE;    // 180 / 16 = 11.25 (see tip)

ctx.fillStyle = scale[4];
ctx.fillRect(0, 0, TILE, TILE);
