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