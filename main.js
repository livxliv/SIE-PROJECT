// ---------- Settings ----------
const TILE = 16;
const HISTORY_YEARS = [1980, 1990, 2000, 2010, 2015];
const FUTURE_YEARS  = [2015, 2030, 2050, 2075, 2100];

// ---------- Game state (the player's choices) ----------
const state = {
  city: null,
  ssp: null,
  pathway: null,
};

// ---------- Palette from CSS ----------
const css = getComputedStyle(document.documentElement);
const scale = [];
for (let i = 0; i < 8; i++) {
  scale.push(css.getPropertyValue(`--scale-${i}`).trim());
}

// ---------- Screen switching ----------
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  if (id === 'screen-level1') startLevel1();
  if (id === 'screen-level2') startLevel2();
  if (id === 'screen-end')    showEnding();
  if (id === 'screen-title')  resetGame();
}

// Every button with data-goto changes screen
document.querySelectorAll('[data-goto]').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.goto));
});

// ---------- City select ----------
document.querySelectorAll('[data-city]').forEach(btn => {
  btn.addEventListener('click', () => {
    state.city = btn.dataset.city;
    showScreen('screen-level1');
  });
});

// ---------- World select ----------
function setupChoice(containerId, attr, key) {
  const buttons = document.querySelectorAll(`#${containerId} button`);
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state[key] = btn.dataset[attr];
      // Enable the Go button once both choices are made
      document.getElementById('world-go').disabled = !(state.ssp && state.pathway);
    });
  });
}
setupChoice('ssp-choices', 'ssp', 'ssp');
setupChoice('path-choices', 'pathway', 'pathway');

// ---------- Fake drawing (replaced by real data later) ----------
function fakeHeight(col, year, growth) {
  const r = Math.abs(Math.sin(col * 12.9898) * 43758.5453) % 1; // fixed "random" per column
  const t = (year - 1980) / 120;                                // 0 to 1 over time
  return Math.floor(r * 3 + t * growth * 8);
}

function drawCity(canvas, year, growth) {
  const ctx = canvas.getContext('2d');
  const cols = canvas.width / TILE;
  const rows = canvas.height / TILE;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let c = 0; c < cols; c++) {
    const h = Math.min(rows, fakeHeight(c, year, growth));
    for (let r = 0; r < h; r++) {
      ctx.fillStyle = scale[Math.min(7, r)];
      ctx.fillRect(c * TILE, canvas.height - (r + 1) * TILE, TILE - 1, TILE - 1);
    }
  }
}

// ---------- Level 1 ----------
const l1Slider = document.getElementById('l1-slider');
function updateLevel1() {
  const year = HISTORY_YEARS[l1Slider.value];
  document.getElementById('l1-year').textContent = year;
  drawCity(document.getElementById('canvas1'), year, 1);
}
function startLevel1() {
  document.getElementById('l1-city').textContent = 'CITY: ' + state.city;
  l1Slider.value = 0;
  updateLevel1();
}
l1Slider.addEventListener('input', updateLevel1);

// ---------- Level 2 ----------
const l2Slider = document.getElementById('l2-slider');
const GROWTH = { sprawl: 0.5, historical: 1, vertical: 2 }; // fake, just to see a difference
function updateLevel2() {
  const year = FUTURE_YEARS[l2Slider.value];
  document.getElementById('l2-year').textContent = year;
  drawCity(document.getElementById('canvas2'), year, GROWTH[state.pathway] * 2);
}
function startLevel2() {
  document.getElementById('l2-info').textContent =
    `${state.city} | ${state.ssp} | ${state.pathway.toUpperCase()}`;
  l2Slider.value = 0;
  updateLevel2();
}
l2Slider.addEventListener('input', updateLevel2);

// ---------- Ending ----------
function showEnding() {
  document.getElementById('end-summary').textContent =
    `YOU CHOSE ${state.city}, ${state.ssp}, ${state.pathway.toUpperCase()}.`;
}

// ---------- Reset ----------
function resetGame() {
  state.city = state.ssp = state.pathway = null;
  document.querySelectorAll('button.selected').forEach(b => b.classList.remove('selected'));
  document.getElementById('world-go').disabled = true;
}