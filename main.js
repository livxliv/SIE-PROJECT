// ---------- Settings ----------
const TILE = 16;
const HISTORY_YEARS = [1980, 1990, 2000, 2010, 2015];
const FUTURE_YEARS  = [2015, 2020, 2030, 2040, 2050, 2060, 2070, 2080, 2090, 2100]; // 2015 = last real year
const CITY_KEYS = {            // button text -> folder name in data/manifest.json
  'China': 'China',
  "Cote d'Ivoire": 'Cote_d_Ivoire',
  'Pakistan': 'Pakistan',
  'Rwanda': 'Rwanda',
};

// ---------- Game state (the player's choices) ----------
const state = { city: null, cityKey: null, ssp: null, pathway: null };

// ---------- Palette from CSS (used by the fake drawing) ----------
const css = getComputedStyle(document.documentElement);
const scale = [];
for (let i = 0; i < 8; i++) scale.push(css.getPropertyValue(`--scale-${i}`).trim());

// ---------- Real data: manifest + image loading ----------
let manifest = null;
const imgCache = {};

async function loadManifest() {
  try {
    manifest = await (await fetch('data/manifest.json')).json();
  } catch (e) {
    console.warn('No data/manifest.json yet: the game will use fake data.', e);
    manifest = {};
  }
}
const manifestReady = loadManifest();

function getImage(path) {
  if (!imgCache[path]) {
    imgCache[path] = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Missing image: ' + path));
      img.src = path;
    });
  }
  return imgCache[path];
}

// Possible image keys for a year, best first.
//  - up to 2015: observed history
//  - after 2015: the urban-form model ("ours"); while those files are missing, the FU3D test files
function candidateKeys(year, historyOnly) {
  if (historyOnly || year <= 2015) return [`history|${year}`];
  return [
    `ours|${state.ssp}|${state.pathway}|${year}`,
    `fu3d|${state.ssp}|${year}`,
  ];
}

// ---------- Fake drawing (fallback when an image is missing) ----------
function fakeHeight(col, year, growth) {
  const r = Math.abs(Math.sin(col * 12.9898) * 43758.5453) % 1;
  const t = (year - 1980) / 120;
  return Math.floor(r * 3 + t * growth * 8);
}
function drawFake(canvas, year) {
  const growth = { sprawl: 1, historical: 2, vertical: 4 }[state.pathway] || 2;
  canvas.width = 320; canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cols = canvas.width / TILE, rows = canvas.height / TILE;
  for (let c = 0; c < cols; c++) {
    const h = Math.min(rows, fakeHeight(c, year, growth));
    for (let r = 0; r < h; r++) {
      ctx.fillStyle = scale[Math.min(7, r)];
      ctx.fillRect(c * TILE, canvas.height - (r + 1) * TILE, TILE - 1, TILE - 1);
    }
  }
}

// ---------- Draw one frame (real if possible, fake otherwise) ----------
const drawToken = new WeakMap();   // avoids old frames overwriting new ones when the slider moves fast
async function drawFrame(canvas, year, sourceLabel, historyOnly) {
  const token = Symbol();
  drawToken.set(canvas, token);
  const entry = manifest && manifest[state.cityKey];
  let used = 'FAKE DATA';

  if (entry) {
    for (const key of candidateKeys(year, historyOnly)) {
      const path = entry.files[key];
      if (!path) continue;
      try {
        const img = await getImage(path);
        if (drawToken.get(canvas) !== token) return;
        canvas.width = entry.width;      // 1 canvas pixel = 1 image pixel, CSS scales it up
        canvas.height = entry.height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        used = key.startsWith('fu3d') ? 'TEST DATA (FU3D)' : 'REAL DATA';
        break;
      } catch (e) { /* try next candidate, then fake */ }
    }
  }
  if (drawToken.get(canvas) !== token) return;
  if (used === 'FAKE DATA') drawFake(canvas, year);
  sourceLabel.textContent = used;
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
document.querySelectorAll('[data-goto]').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.goto));
});

// ---------- City select ----------
document.querySelectorAll('[data-city]').forEach(btn => {
  btn.addEventListener('click', async () => {
    await manifestReady;
    state.city = btn.dataset.city;
    state.cityKey = CITY_KEYS[state.city];
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
      document.getElementById('world-go').disabled = !(state.ssp && state.pathway);
    });
  });
}
setupChoice('ssp-choices', 'ssp', 'ssp');
setupChoice('path-choices', 'pathway', 'pathway');

// ---------- Small label showing where the picture comes from ----------
function makeSourceLabel(canvas) {
  const p = document.createElement('p');
  p.className = 'info';
  canvas.insertAdjacentElement('afterend', p);
  return p;
}
const l1Source = makeSourceLabel(document.getElementById('canvas1'));
const l2Source = makeSourceLabel(document.getElementById('canvas2'));

function vmaxText() {
  const e = manifest && manifest[state.cityKey];
  return e ? ` | COLOUR SCALE 0-${e.vmax} M` : '';
}

// ---------- Level 1: the past ----------
const l1Slider = document.getElementById('l1-slider');
l1Slider.max = HISTORY_YEARS.length - 1;

function updateLevel1() {
  const year = HISTORY_YEARS[l1Slider.value];
  document.getElementById('l1-year').textContent = year;
  drawFrame(document.getElementById('canvas1'), year, l1Source, true);
}
function startLevel1() {
  document.getElementById('l1-city').textContent = state.city.toUpperCase() + vmaxText();
  l1Slider.value = 0;
  updateLevel1();
}
l1Slider.addEventListener('input', updateLevel1);

// ---------- Level 2: the future ----------
const l2Slider = document.getElementById('l2-slider');
l2Slider.max = FUTURE_YEARS.length - 1;

function updateLevel2() {
  const year = FUTURE_YEARS[l2Slider.value];
  document.getElementById('l2-year').textContent = year;
  drawFrame(document.getElementById('canvas2'), year, l2Source, false);
}
function startLevel2() {
  document.getElementById('l2-info').textContent =
    `${state.city.toUpperCase()} | ${state.ssp} | ${state.pathway.toUpperCase()}` + vmaxText();
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
  state.city = state.cityKey = state.ssp = state.pathway = null;
  document.querySelectorAll('button.selected').forEach(b => b.classList.remove('selected'));
  document.getElementById('world-go').disabled = true;
}