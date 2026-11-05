// =====================================================================
//  STORY TEXTS: TEXT A AJOUTER?
// =====================================================================
const TEXTS = {
  hook: 'Pick a city, travel from 1980 to 2100 and watch it grow, spread out or climb.',
  cityIntro: 'Four urban systems, four players. Which one do you want to follow?',
  city: {
    China:    'A AJOUTER',
    CIV:      'A AJOUTER',
    Pakistan: 'A AJOUTER',
    Rwanda:   'A AJOUTER',
  },
  // One line per observed year (Level 1)
  history: {
    1980: '1980',
    1990: '1990',
    2000: '2000',
    2010: '2010',
    2015: '2015',
  },
  ssp: {
    SSP1: 'SSP1',
    SSP2: 'SSP2',
    SSP3: 'SSP3',
    SSP4: 'SSP4',
    SSP5: 'SSP5',
  },
  pathway: {
    sprawl:     'SPRAWL',
    historical: 'HISTORICAL',
    vertical:   'VERTICAL',
  },
  worldDefault: 'Pick a society (SSP) and a way of growing. Hover over a button to read about it.',
  level2: 'Drag the slider. 2015 is real. Everything after that is a model scenario.',
  endLearned: 'WHAT YOU SAW: the same city can end up very different in 2100. Society (the SSP) sets how much it grows. The shape (sprawl, historical or vertical) decides whether it spreads out or piles up.',
  endUncertain: 'WHAT WE DO NOT KNOW: these are scenarios, not predictions. Each combination is one model run, and no one can say which future is the most likely.',
};

// =====================================================================
//  SETTINGS
// =====================================================================
const TILE = 16;
const HISTORY_YEARS = [1980, 1990, 2000, 2010, 2015];
const FUTURE_YEARS  = [2015, 2020, 2030, 2040, 2050, 2060, 2070, 2080, 2090, 2100]; // 2015 = last real year
const CITY_KEYS = { 'China': 'China', "Cote d'Ivoire": 'Cote_d_Ivoire', 'Pakistan': 'Pakistan', 'Rwanda': 'Rwanda' };

const state = { city: null, cityKey: null, ssp: null, pathway: null };

const css = getComputedStyle(document.documentElement);
const cssVar = n => css.getPropertyValue(n).trim();
const scale = Array.from({ length: 8 }, (_, i) => cssVar(`--scale-${i}`));

const $ = id => document.getElementById(id);

// Fill every data-text="a.b" element
document.querySelectorAll('[data-text]').forEach(el => {
  el.textContent = el.dataset.text.split('.').reduce((o, k) => o[k], TEXTS);
});

// =====================================================================
//  REAL DATA (manifest + images), with fake fallback
// =====================================================================
let manifest = null;
const imgCache = {};

async function loadManifest() {
  try { manifest = await (await fetch('data/manifest.json')).json(); }
  catch (e) { console.warn('No data/manifest.json yet: fake data.', e); manifest = {}; }
}
const manifestReady = loadManifest();

function getImage(path) {
  if (!imgCache[path]) {
    imgCache[path] = new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error('Missing image: ' + path));
      img.src = path;
    });
  }
  return imgCache[path];
}

function candidateKeys(year, historyOnly) {
  if (historyOnly || year <= 2015) return [`history|${year}`];
  return [`ours|${state.ssp}|${state.pathway}|${year}`, `fu3d|${state.ssp}|${year}`];
}

function fakeHeight(col, year, growth) {
  const r = Math.abs(Math.sin(col * 12.9898) * 43758.5453) % 1;
  return Math.floor(r * 3 + ((year - 1980) / 120) * growth * 8);
}
function drawFake(canvas, year) {
  const growth = { sprawl: 1, historical: 2, vertical: 4 }[state.pathway] || 2;
  canvas.width = 320; canvas.height = 192;
  const ctx = canvas.getContext('2d');
  const cols = canvas.width / TILE, rows = canvas.height / TILE;
  for (let c = 0; c < cols; c++) {
    const h = Math.min(rows, fakeHeight(c, year, growth));
    for (let r = 0; r < h; r++) {
      ctx.fillStyle = scale[Math.min(7, r)];
      ctx.fillRect(c * TILE, canvas.height - (r + 1) * TILE, TILE - 1, TILE - 1);
    }
  }
}

const drawToken = new WeakMap();
async function drawFrame(canvas, year, sourceEl, historyOnly) {
  const token = Symbol(); drawToken.set(canvas, token);
  const entry = manifest && manifest[state.cityKey];
  let used = 'FAKE DATA';
  if (entry) {
    for (const key of candidateKeys(year, historyOnly)) {
      const path = entry.files[key]; if (!path) continue;
      try {
        const img = await getImage(path);
        if (drawToken.get(canvas) !== token) return;
        canvas.width = entry.width; canvas.height = entry.height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0);
        used = key.startsWith('fu3d') ? 'TEST DATA' : 'REAL DATA';
        break;
      } catch (e) { /* next candidate */ }
    }
  }
  if (drawToken.get(canvas) !== token) return;
  if (used === 'FAKE DATA') drawFake(canvas, year);
  sourceEl.textContent = used;
}

function updateLegends() {
  const e = manifest && manifest[state.cityKey];
  document.querySelectorAll('.legend-max').forEach(el => el.textContent = (e ? e.vmax : 30) + ' M');
}

// =====================================================================
//  SCREENS
// =====================================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  document.body.dataset.screen = id;
  window.scrollTo(0, 0);
  if (id === 'screen-level1') startLevel1();
  if (id === 'screen-world')  $('world-dialog').textContent = TEXTS.worldDefault;
  if (id === 'screen-level2') startLevel2();
  if (id === 'screen-end')    showEnding();
  if (id === 'screen-title')  resetGame();
}
document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => showScreen(b.dataset.goto)));

document.querySelectorAll('[data-city]').forEach(btn => {
  btn.addEventListener('click', async () => {
    await manifestReady;
    state.city = btn.dataset.city;
    state.cityKey = CITY_KEYS[state.city];
    showScreen('screen-level1');
  });
});

// World select: click to choose, hover to read
function setupChoice(containerId, attr, key, textGroup) {
  const buttons = document.querySelectorAll(`#${containerId} button`);
  const show = btn => { $('world-dialog').textContent = TEXTS[textGroup][btn.dataset[attr]]; };
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state[key] = btn.dataset[attr];
      show(btn);
      $('world-go').disabled = !(state.ssp && state.pathway);
    });
    btn.addEventListener('mouseenter', () => show(btn));
  });
}
setupChoice('ssp-choices', 'ssp', 'ssp', 'ssp');
setupChoice('path-choices', 'pathway', 'pathway', 'pathway');

// Level 1
const l1Slider = $('l1-slider'); l1Slider.max = HISTORY_YEARS.length - 1;
function updateLevel1() {
  const year = HISTORY_YEARS[l1Slider.value];
  $('l1-year').textContent = year;
  $('l1-dialog').textContent = TEXTS.history[year];
  drawFrame($('canvas1'), year, $('l1-source'), true);
}
function startLevel1() {
  $('l1-city').textContent = state.city.toUpperCase();
  updateLegends();
  l1Slider.value = 0; updateLevel1();
}
l1Slider.addEventListener('input', updateLevel1);

// Level 2
const l2Slider = $('l2-slider'); l2Slider.max = FUTURE_YEARS.length - 1;
function updateLevel2() {
  const year = FUTURE_YEARS[l2Slider.value];
  $('l2-year').textContent = year;
  $('l2-dialog').textContent = year <= 2015 ? TEXTS.level2 : TEXTS.pathway[state.pathway];
  drawFrame($('canvas2'), year, $('l2-source'), false);
}
function startLevel2() {
  $('l2-info').textContent = `${state.city.toUpperCase()} | ${state.ssp} | ${state.pathway.toUpperCase()}`;
  updateLegends();
  l2Slider.value = 0; updateLevel2();
}
l2Slider.addEventListener('input', updateLevel2);

function showEnding() {
  $('end-summary').textContent =
    `${state.city.toUpperCase()}, ${state.ssp}, ${state.pathway.toUpperCase()}. ` + TEXTS.ssp[state.ssp].split('.')[0].replace(/^SSP\d, /, 'World: ') + '.';
}
function resetGame() {
  state.city = state.cityKey = state.ssp = state.pathway = null;
  document.querySelectorAll('button.selected').forEach(b => b.classList.remove('selected'));
  $('world-go').disabled = true;
}

// =====================================================================
//  PIXEL SKYLINE (background decoration, reacts to the mouse)
// =====================================================================
(function skyline() {
  const c = $('skyline'), ctx = c.getContext('2d');
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const back = [cssVar('--c-indigo-700'), cssVar('--c-indigo-900')];
  const lit = cssVar('--c-peach');
  let x = 0;
  while (x < c.width) {
    const w = 8 + Math.floor(rnd() * 10), h = 10 + Math.floor(rnd() * 40);
    ctx.fillStyle = back[Math.floor(rnd() * 2)];
    ctx.fillRect(x, c.height - h, w, h);
    for (let yy = c.height - h + 3; yy < c.height - 3; yy += 4)
      for (let xx = x + 2; xx < x + w - 2; xx += 3)
        if (rnd() < 0.25) { ctx.fillStyle = lit; ctx.fillRect(xx, yy, 1, 2); }
    x += w + Math.floor(rnd() * 2);
  }
  window.addEventListener('mousemove', e => {
    const dx = (e.clientX / window.innerWidth - 0.5) * -24;
    c.style.transform = `translateX(${dx}px)`;
  });
})();
