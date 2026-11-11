// =====================================================================
//  STORY TEXTS: edit everything the visitor reads here
// =====================================================================
const TEXTS = {
  hook: 'Pick a city, travel in time from 1980 to 2100, and watch it grow: wider, taller, or both.',
  cityIntro: 'Four places, four stories. Which one do you want to follow?',
  city: {
    China:    'Around Beijing. The biggest map in the game: about 5,900 km² of squares.',
    CIV:      'Around Abidjan, on the coast of West Africa. About 2,200 km² of squares.',
    Pakistan: 'A fast-changing area of about 3,000 km² with a very dense centre.',
    Rwanda:   'The smallest map: about 1,050 km². Every pixel counts.',
  },
  // One line per observed year (Level 1)
  history: {
    1980: '1980. The first satellite picture. Tall, bright squares are places with big buildings.',
    1990: '1990. Look at the edges: the city is getting wider.',
    2000: '2000. The middle gets taller and new patches appear around it.',
    2010: '2010. Not every place grows the same way: some shoot up, others hardly change.',
    2015: '2015. This is the last year with real data. After this, a computer model imagines the future.',
  },
  // SSP = Shared Socioeconomic Pathway: a story about how the world may change (people, money, energy)
  ssp: {
    SSP1: 'SSP1, GREEN WORLD. Fewer people, care for nature, and cities that stay compact.',
    SSP2: 'SSP2, KEEP GOING (the middle road). The world goes on like it does today: not the best, not the worst. Many people see this as the "normal" future.',
    SSP3: 'SSP3, DIVIDED WORLD. Countries do not work together. Many people, and the economy grows slowly.',
    SSP4: 'SSP4, UNEQUAL WORLD. A few places get rich, many are left behind.',
    SSP5: 'SSP5, FAST-GROWTH WORLD. The economy grows very fast, powered by oil, gas and coal.',
  },
  // The shape is HOW the city adds buildings
  pathway: {
    sprawl:     'SPRAWL (spread out). New buildings take new ground. The city gets wider but stays low, like a pancake.',
    historical: 'HISTORICAL (like in the past). The city grows the same way it did between 1980 and 2015: a bit of new ground and a bit of taller buildings. Use it for "what if nothing changes?".',
    vertical:   'VERTICAL (build up). New buildings go on ground that is already built, so they get taller. The city stays small on the map, like a pile.',
  },
  mission: 'MISSION: try all 15 futures of a city. Which one spreads out the most? Which one climbs the highest?',
  newWorld: 'NEW WORLD DISCOVERED! ',
  worldDefault: 'Pick a world (an SSP) and a way of growing. People and money decide how much a city builds. Move the mouse over a button to read about it.',
  level2: 'Move the slider. Up to 2015 the pictures are real. After 2015 they come from a computer model: they show one possible future, not a promise.',
  pickExplain: 'Move the mouse over a button to read what it means. Or open the GUIDE.',
  endPlanning: 'NOBODY DRAWS A CITY FROM ABOVE. A city grows from thousands of small local decisions, a bit like a crowd finding its own path. Planning can change WHERE the buildings go. But HOW MUCH gets built depends on people and money.',
  endLearned: 'WHAT YOU SAW: the same city can look very different in 2100. The society (the SSP) decides how much gets built. The shape (sprawl, historical or vertical) decides if the city spreads out or piles up. And the same society can build a lot in one country and little in another, because people and money grow differently there.',
  endUncertain: 'WHAT WE DO NOT KNOW: these are possible futures, not predictions. Each one is a single model run, and nobody can say which future is the most likely.',
  guide: {
    sspIntro: 'An SSP is a story about how the world might change by 2100: how many people there will be, how rich countries get, and what energy they use. There are 5 stories. They are not predictions. They are different "what if" worlds.',
    sspNames: { SSP1: 'SSP1 GREEN', SSP2: 'SSP2 KEEP GOING', SSP3: 'SSP3 DIVIDED', SSP4: 'SSP4 UNEQUAL', SSP5: 'SSP5 FAST GROWTH' },
    ssp: {
      SSP1: 'Fewer people. Care for nature. Compact cities.',
      SSP2: 'The middle road. The world goes on like today. Your reference.',
      SSP3: 'Countries do not cooperate. Many people, slow economy.',
      SSP4: 'Big gaps between rich and poor.',
      SSP5: 'Very fast economic growth, lots of oil, gas and coal.',
    },
    shapeIntro: 'The SHAPE is how the city adds new buildings. The society decides how much is built. The shape decides where it goes.',
    shapeNames: { sprawl: 'SPRAWL', historical: 'HISTORICAL', vertical: 'VERTICAL' },
    shape: {
      sprawl: 'SPREAD OUT. New buildings take new ground. Wide and low, like a pancake.',
      historical: 'LIKE IN THE PAST. The city keeps its habits from 1980 to 2015: some new ground, some taller buildings. This is the "nothing changes" choice.',
      vertical: 'BUILD UP. New buildings go on land that is already built. Small on the map, but tall.',
    },
    wordNames: { ground: 'GROUND', volume: 'VOLUME', floor: 'ONE FLOOR', square: 'SQUARE' },
    words: {
      ground: 'How much land has buildings on it, seen from above.',
      volume: 'How much building there is in total: the ground covered times the height.',
      floor: 'About 3 metres of height. A square lower than this is more like a low shed than a building.',
      square: 'One small piece of the map (a cell). The map is made of many squares.',
    },
    tip: 'Not sure where to start? Try SSP2 + HISTORICAL first. It is the "keep going" future. Then ask: what changes if I pick another SSP, or another shape?',
  },
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
  if (id === 'screen-world')  { $('world-dialog').textContent = TEXTS.worldDefault; renderExplore(); drawIcons(); }
  if (id === 'screen-level2') startLevel2();
  if (id === 'screen-end')    showEnding();
  if (id === 'screen-missions') renderMissionList();
  if (id === 'screen-badges') renderBadges();
  if (id === 'screen-title')  resetGame();
  syncGuide();
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

// ---------------------------------------------------------------------
//  Minimum building height (open question with the supervisors: ~3 m = 1 floor).
//  Not applied to the maps yet. One constant so it is easy to use later.
// ---------------------------------------------------------------------
const MIN_HEIGHT_M = 0;

// ---------------------------------------------------------------------
//  Pixel icons (8x8 drawings, coloured with the text colour of their parent)
// ---------------------------------------------------------------------
const ICONS = {
  people: ['...XX...','..XXXX..','..XXXX..','...XX...','.XXXXXX.','XXXXXXXX','XXXXXXXX','X.XXXX.X'],
  co2:    ['........','...XX...','..XXXXX.','.XXXXXXX','XXXXXXXX','XXXXXXXX','.XXXXXX.','........'],
  coin:   ['......XX','......XX','....XXXX','....XXXX','..XXXXXX','..XXXXXX','XXXXXXXX','XXXXXXXX'],
  sprawl: ['........','..X..X..','.XX..XX.','XXXXXXXX','.XX..XX.','..X..X..','........','........'],
  tower:  ['...XX...','..XXXX..','...XX...','..XXXX..','..XXXX..','.XXXXXX.','.XXXXXX.','.XXXXXX.'],
  mix:    ['.XXXXXX.','X......X','X..X...X','X..X...X','X..XXX.X','X......X','.XXXXXX.','........'],
};
function drawIcons(root = document) {
  root.querySelectorAll('[data-ico]').forEach(el => {
    if (el.firstChild) return;
    const c = document.createElement('canvas'); c.width = 8; c.height = 8;
    const ctx = c.getContext('2d');
    ctx.fillStyle = getComputedStyle(el.parentElement).color;
    ICONS[el.dataset.ico].forEach((row, y) => [...row].forEach((ch, x) => ch === 'X' && ctx.fillRect(x, y, 1, 1)));
    el.appendChild(c);
  });
}

// ---------------------------------------------------------------------
//  SSP cards. Levels 1-4 are QUALITATIVE and approximate: check them against
//  O'Neill et al. 2017 and Riahi et al. 2017 before publishing, and cite them.
// ---------------------------------------------------------------------
const SSP_INFO = {
  SSP1: { name: 'GREEN',       pop: 1, co2: 1, coin: 3 },
  SSP2: { name: 'KEEP GOING',  pop: 2, co2: 2, coin: 2 },
  SSP3: { name: 'DIVIDED',     pop: 4, co2: 3, coin: 1 },
  SSP4: { name: 'UNEQUAL',     pop: 3, co2: 2, coin: 2 },
  SSP5: { name: 'FAST GROWTH', pop: 1, co2: 4, coin: 4 },
};
(function buildSspCards() {
  const box = $('ssp-choices');
  Object.entries(SSP_INFO).forEach(([id, d]) => {
    const b = document.createElement('button');
    b.dataset.ssp = id;
    const rows = ['pop', 'co2', 'coin'].map(k => {
      const ico = k === 'pop' ? 'people' : k;
      const pips = [1, 2, 3, 4].map(i => `<i class="pip${i <= d[k] ? ' on' : ''}"></i>`).join('');
      return `<div class="row${k === 'co2' ? ' ctx-row' : ''}"><span class="ico" data-ico="${ico}"></span><span class="pips">${pips}</span></div>`;
    }).join('');
    b.innerHTML = `<b>${id}</b><span class="sub">${d.name}</span>${rows}`;
    box.appendChild(b);
  });
  drawIcons();
})();

// ---------------------------------------------------------------------
//  Exploration board: which of the 15 futures of a city were visited
// ---------------------------------------------------------------------
const SSP_ORDER = ['SSP1', 'SSP2', 'SSP3', 'SSP4', 'SSP5'];
const PATH_ORDER = ['sprawl', 'historical', 'vertical'];
function loadExplored() { try { return JSON.parse(localStorage.getItem('explored') || '{}'); } catch (e) { return {}; } }
function saveExplored(o) { try { localStorage.setItem('explored', JSON.stringify(o)); } catch (e) { /* ignore */ } }
function exploredFor(city) { return loadExplored()[city] || []; }
function markExplored() {
  const all = loadExplored(), list = all[state.cityKey] || [], id = `${state.ssp}|${state.pathway}`;
  if (list.includes(id)) return false;
  list.push(id); all[state.cityKey] = list; saveExplored(all);
  return true;
}
function renderExplore() {
  const done = exploredFor(state.cityKey);
  $('explore-title').textContent = `WORLDS EXPLORED ${done.length}/15`;
  const grid = $('explore-grid'); grid.innerHTML = '';
  PATH_ORDER.forEach(p => SSP_ORDER.forEach(s => {
    const i = document.createElement('i');
    if (done.includes(`${s}|${p}`)) i.className = 'done';
    i.title = `${s} · ${p}`;
    grid.appendChild(i);
  }));
}

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
  $('l1-year').parentElement.className = 'chip year kind-obs';
  $('l1-dialog').textContent = TEXTS.history[year];
  drawFrame($('canvas1'), year, $('l1-source'), true);
  refreshViews(1, year);
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
  const kind = year <= 2015 ? 'obs' : 'sim';
  l2Slider.dataset.kind = kind;
  $('l2-year').parentElement.className = `chip year kind-${kind}`;
  $('l2-dialog').textContent = year <= 2015 ? TEXTS.level2 : TEXTS.pathway[state.pathway];
  if (+l2Slider.value === FUTURE_YEARS.length - 1 && markExplored()) {
    $('l2-dialog').textContent = TEXTS.newWorld + `${exploredFor(state.cityKey).length}/15. ` + TEXTS.pathway[state.pathway];
  }
  drawFrame($('canvas2'), year, $('l2-source'), false);
  refreshViews(2, year);
}
function startLevel2() {
  $('l2-info').textContent = `${state.city.toUpperCase()} | ${state.ssp} | ${state.pathway.toUpperCase()}`;
  updateLegends();
  l2Slider.value = 0; updateLevel2();
}
l2Slider.addEventListener('input', updateLevel2);

function showEnding() {
  $('end-summary').textContent =
    `${state.city.toUpperCase()}, ${state.ssp}, ${state.pathway.toUpperCase()}. ` + TEXTS.ssp[state.ssp].split('.')[0].replace(/^SSP\d, /, 'World: ') + `. WORLDS EXPLORED: ${exploredFor(state.cityKey).length}/15.`;
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


// =====================================================================
//  MUSIC: assets/music.mp3 (Think Factory, Eldorado, PremiumBeat), looped.
//  If the file is missing, a tiny chiptune loop is used instead. Starts after PRESS START.
// =====================================================================
const Music = (() => {
  let ctx = null, master = null, timer = null, step = 0, on = true, started = false;
  try { on = localStorage.getItem('music') !== 'off'; } catch (e) { /* ignore */ }
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);
  const lead = [69,72,76,72, 65,69,72,69, 67,71,74,71, 64,67,71,67];   // Am, F, G, Em arpeggios
  const bass = [45, 41, 43, 40];
  function tone(f, dur, type, vol) {
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur);
  }
  function tick() {
    tone(hz(lead[step % 16] + 12), 0.18, 'square', 0.04);
    if (step % 4 === 0) tone(hz(bass[Math.floor(step / 4) % 4]), 0.7, 'triangle', 0.09);
    step++;
  }
  function label() { $('mute').textContent = on ? '♪ ON' : '♪ OFF'; }
  const song = new Audio('assets/music.mp3'); song.loop = true; song.volume = 0.5; let songOk = true;
  song.addEventListener('error', () => { songOk = false; if (on && started) play(); });
  function play() {
    if (songOk) { song.play().catch(() => {}); return; }
    if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); }
    if (ctx.state === 'suspended') ctx.resume();
    if (!timer) timer = setInterval(tick, 230);
  }
  function stop() { song.pause(); clearInterval(timer); timer = null; }
  return {
    start() { started = true; if (on) play(); label(); },
    toggle() {
      on = !on; try { localStorage.setItem('music', on ? 'on' : 'off'); } catch (e) { /* ignore */ }
      if (on && started) play(); else stop();
      label();
    },
    label,
  };
})();
$('mute').addEventListener('click', () => Music.toggle());
Music.label();
document.querySelector('#screen-title [data-goto]').addEventListener('click', () => Music.start());


// =====================================================================
//  MISSIONS: puzzles built from data/metrics.json (made by make_metrics.py)
//  Every mission is generated from the numbers of the 15 futures, so it always has a solution.
// =====================================================================
const MISSION_STORE = 'missions_v2';          // v2: missions now have ids (older progress is not reused)
function loadStore() {
  try { return Object.assign({ progress: {}, badges: {}, stats: { tests: 0 } }, JSON.parse(localStorage.getItem(MISSION_STORE) || '{}')); }
  catch (e) { return { progress: {}, badges: {}, stats: { tests: 0 } }; }
}
function saveStore(s) { try { localStorage.setItem(MISSION_STORE, JSON.stringify(s)); } catch (e) { /* ignore */ } }

let metrics = null;
const metricsReady = fetch('data/bars/metrics.json').then(r => r.json()).then(j => { metrics = j; }).catch(() => { metrics = null; });   // exact numbers made by prepare_bars.py

const BADGE_DEFS = {
  first_win:     ['FIRST WIN',      'Complete your first mission.'],
  gold:          ['GOLD STANDARD',  'Win a mission on the first try, without a hint.'],
  tester:        ['TESTER',         'Test 25 different worlds in the missions.'],
  floor_spotter: ['FLOOR SPOTTER',  'Finish the boss mission and spot the twist.'],
  master:        ['CITY MASTER',    'Complete every mission in one city.'],
  globetrotter:  ['GLOBETROTTER',   'Become City Master in all 4 cities.'],
};
const CITY_LIST = ['China', 'Cote_d_Ivoire', 'Pakistan', 'Rwanda'];

// ---------- Build the missions of the current city ----------
function buildMissions(cityKey) {
  const cm = metrics && metrics[cityKey];
  if (!cm || !cm['history|2015']) return null;
  const base = cm['history|2015'];
  const worlds = [];
  SSP_ORDER.forEach(s => PATH_ORDER.forEach(p => {
    const m = cm[`ours|${s}|${p}|2100`];
    if (m) worlds.push({ ssp: s, path: p, m });
  }));
  if (worlds.length < 15) return null;
  const pct = x => Math.round(x);
  const NOLAND = 1.001;
  const noNewLand = w => w.m.footprint_01 <= base.footprint_01 * NOLAND;
  const ref = worlds.find(w => w.ssp === 'SSP2' && w.path === 'historical');     // the "keep going" reference world

  // 0. START HERE: meet the "keep going" future
  const m0 = { id: 'trend', free: true, level: 'Start here', title: 'KEEP GOING',
    text: 'START HERE. What if nothing special changes? Pick SSP2 (the world goes on like today) and HISTORICAL (the city grows like it did from 1980 to 2015). This is the "keep going" future.',
    ok: w => w === ref,
    feedback: w => `Not that one. You need BOTH: SSP2 (the middle world) and HISTORICAL (growing like in the past). You picked ${w.ssp} + ${w.path.toUpperCase()}.`,
    twist: () => `THIS IS YOUR REFERENCE. If nothing special changes, in 2100 this city covers ${pct((ref.m.footprint_01 / base.footprint_01 - 1) * 100)}% more ground and has ${pct((ref.m.volume / base.volume - 1) * 100)}% more building volume than in 2015. The next missions ask you to do better or different.` };

  // 1. beat the trend on land
  const m1 = { id: 'beat', level: 'Easy', title: 'BEAT THE TREND',
    text: 'Find a future where the city takes LESS new ground than the "keep going" future (SSP2 + HISTORICAL). You can change the society, the shape, or both.',
    ok: w => w.m.footprint_01 < ref.m.footprint_01 * 0.999,
    feedback: w => `Not better. This city covers ${pct(w.m.footprint_01 / ref.m.footprint_01 * 100)}% of the ground of the "keep going" future. You need less than 100%.`,
    twist: w => w.ssp === 'SSP2'
      ? 'You kept the same society (SSP2) and only changed the shape. The shape alone saved ground.'
      : 'You changed the society (SSP). The society sets how many people and how much money there is, and that changes how much gets built.' };

  // 2. no new land
  const m2 = { id: 'noland', level: 'Easy', title: 'NO NEW GROUND',
    text: 'In 2100 the city must not cover more ground than today (2015). It can only get taller. Pick a society and a shape.',
    ok: noNewLand,
    feedback: w => `TOO SPREAD OUT. This city covers ${pct((w.m.footprint_01 / base.footprint_01 - 1) * 100)}% more ground than in 2015.` };

  // 3. fewest floors
  const minF = Math.min(...worlds.map(w => w.m.footprint_3m));
  const m3 = { id: 'floors', level: 'Medium', title: 'FEWEST TALL SPOTS',
    text: 'Find the future with the FEWEST map squares that are at least one floor high (3 m). Think about where the buildings go.',
    ok: w => w.m.footprint_3m <= minF * 1.02,
    feedback: w => `TOO MANY: ${w.m.footprint_3m} squares reach one floor. A better world has about ${pct((1 - minF / w.m.footprint_3m) * 100)}% fewer.` };

  // 4. biggest volume: decided by the SSP; the three shapes give the same total
  const maxV = Math.max(...worlds.map(w => w.m.volume));
  const sameAcrossShapes = SSP_ORDER.every(s => {
    const v = worlds.filter(w => w.ssp === s).map(w => w.m.volume);
    return Math.max(...v) - Math.min(...v) <= 0.005 * Math.max(...v);
  });
  const m4 = { id: 'big', level: 'Medium', title: 'BUILD BIG',
    text: 'Build the BIGGEST city: the most building in total ("volume") in 2100. What matters more: the society or the shape?',
    ok: w => w.m.volume >= maxV * 0.9999,
    feedback: w => `Not the biggest. This world has ${pct(w.m.volume / maxV * 100)}% of the biggest possible volume.`,
    twist: sameAcrossShapes ? () => 'LOOK: for the same society, sprawl, historical and vertical build the SAME total. The shape changes WHERE the buildings go, not HOW MUCH is built.' : null };

  // 5. no new land AND a lot of volume
  const cand = worlds.filter(noNewLand).sort((a, b) => b.m.volume - a.m.volume);
  let k = 1, bestGap = -1;
  for (let i = 1; i <= Math.min(3, cand.length - 1); i++) {
    const gap = (cand[i - 1].m.volume - cand[i].m.volume) / cand[i - 1].m.volume;
    if (i >= 2 && gap > bestGap) { bestGap = gap; k = i; }
  }
  if (cand.length < 3) k = Math.max(1, cand.length - 1);
  const thr = cand.length ? (cand.length > k ? (cand[k - 1].m.volume + cand[k].m.volume) / 2 : cand[k - 1].m.volume) : Infinity;
  const need = (thr / base.volume - 1) * 100;
  const m5 = { id: 'updown', level: 'Hard', title: 'UP, NOT OUT',
    text: `No new ground, and build at least ${need.toFixed(1)}% MORE total volume than in 2015. Two rules, few answers.`,
    ok: w => noNewLand(w) && w.m.volume >= thr,
    feedback: w => !noNewLand(w)
      ? `YOU USED NEW GROUND (+${pct((w.m.footprint_01 / base.footprint_01 - 1) * 100)}%). This mission allows none.`
      : `NOT ENOUGH GROWTH: +${((w.m.volume / base.volume - 1) * 100).toFixed(1)}% volume, you need +${need.toFixed(1)}%.` };

  // 6. boss
  const widest = worlds.reduce((a, b) => (b.m.footprint_01 > a.m.footprint_01 ? b : a));
  const m6 = { id: 'boss', level: 'Hardest', title: 'BOSS: GROUND GRAB',
    text: 'BOSS: cover the MOST ground in 2100. But what exactly counts as "ground"?',
    ok: w => w === widest,
    feedback: w => `Not the widest. This world covers ${pct(w.m.footprint_01 / widest.m.footprint_01 * 100)}% of the biggest possible area.`,
    twist: w => {
      const rank = worlds.slice().sort((a, b) => b.m.footprint_3m - a.m.footprint_3m).indexOf(w) + 1;
      return `TWIST! If you only count squares with at least one floor (3 m), this same world ranks ${rank} of 15 for ground covered. Where you draw the line changes the answer.`;
    } };

  const list = [m0, m1, m2, m3, m4, m5, m6].filter(ms => { ms.solutions = worlds.filter(ms.ok); return ms.solutions.length >= 1; });
  return list.length >= 5 && list[0].id === 'trend' ? list : null;
}

const cityTotal = (store, cityKey) => Object.values(store.progress[cityKey] || {}).reduce((s, r) => s + (r.score || 0), 0);
const cityDone = (store, cityKey, list) => !!list && list.every(ms => { const r = (store.progress[cityKey] || {})[ms.id]; return r && r.medal !== 'skip'; });

// ---------- Mission list ----------
const pm = { list: null, idx: 0, lives: 3, fails: 0, hint: false, ssp: null, path: null, done: false, lastTest: null };

async function renderMissionList() {
  await metricsReady;
  const box = $('mission-list'); box.innerHTML = '';
  $('missions-city').textContent = state.city ? state.city.toUpperCase() : '';
  pm.list = state.cityKey ? buildMissions(state.cityKey) : null;
  if (!pm.list) {
    box.innerHTML = '<div class="dialog"><p>Missions need data/bars/metrics.json for this city. Run prepare_bars.py and reload.</p></div>';
    return;
  }
  const store = loadStore(), prog = store.progress[state.cityKey] || {};
  $('missions-total').textContent = 'TOTAL SCORE: ' + cityTotal(store, state.cityKey);
  pm.list.forEach((ms, i) => {
    const b = document.createElement('button');
    b.className = 'mission-row';
    const locked = i > 0 && !prog[pm.list[i - 1].id];
    b.disabled = locked;
    const r = prog[ms.id];
    const medal = r ? `<span class="medal ${r.medal}">${r.medal === 'skip' ? 'SKIPPED' : r.medal.toUpperCase() + ' ' + r.score}</span>`
                    : `<span class="medal">${locked ? 'LOCKED' : 'NEW'}</span>`;
    b.innerHTML = `<span class="n">${i + 1}</span><span class="t"><b>${ms.title}</b><small>${ms.level}</small></span>${medal}`;
    b.addEventListener('click', () => startMission(i));
    box.appendChild(b);
  });
}

// ---------- Play a mission ----------
(function buildPlayPickers() {
  const box = $('pm-ssp');
  SSP_ORDER.forEach(s => {
    const b = document.createElement('button'); b.dataset.pmSsp = s;
    b.innerHTML = `${s}<small>${SSP_INFO[s].name}</small>`; box.appendChild(b);
  });
})();

function setSelected(containerId, key, value) {
  document.querySelectorAll(`#${containerId} button`).forEach(b => b.classList.toggle('selected', b.dataset[key] === value));
}

// points you would get if you found the answer on your next test
const pointsNow = () => Math.max(10, 100 - 25 * pm.fails - (pm.hint ? 20 : 0));
function showPoints(final) {
  const el = $('pm-score');
  el.textContent = (final === undefined ? 'POINTS: ' : 'EARNED: ') + (final === undefined ? pointsNow() : final);
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}
function showTotal() { $('pm-total').textContent = 'TOTAL: ' + cityTotal(loadStore(), state.cityKey); }
function updatePlayHud() {
  $('pm-lives').textContent = 'LIVES: ' + '■'.repeat(pm.lives) + '·'.repeat(3 - pm.lives);
  $('pm-try').textContent = 'WRONG TESTS: ' + pm.fails;
}
const locked = () => pm.done || pm.lives === 0;

function startMission(i) {
  Object.assign(pm, { idx: i, lives: 3, fails: 0, hint: false, ssp: null, path: null, done: false, lastTest: null });
  const ms = pm.list[i];
  $('pm-title').textContent = `MISSION ${i + 1}: ${ms.title}`;
  $('pm-text').textContent = ms.text;
  $('pm-verdict').textContent = 'Pick a society (SSP) and a shape. The test starts as soon as you have picked both.';
  $('pm-verdict-box').className = 'dialog';
  $('pm-explain').textContent = TEXTS.pickExplain;
  ['pm-retry', 'pm-skip', 'pm-next'].forEach(id => { $(id).hidden = true; });
  $('pm-hint').disabled = false;
  document.querySelectorAll('#screen-play button.selected').forEach(b => b.classList.remove('selected'));
  const c = $('canvas3'); c.width = 320; c.height = 192; c.getContext('2d').clearRect(0, 0, 320, 192);
  $('pm-source').textContent = '';
  showScreen('screen-play');
  updatePlayHud(); showPoints(); showTotal();
  if (!Guide.seen) { Guide.open = true; Guide.seen = true; try { localStorage.setItem('guide_seen', '1'); } catch (e) { /* ignore */ } syncGuide(); }
}

// pick a society or a shape: read about it, and test as soon as both are chosen
function explain(text) { $('pm-explain').textContent = text; }
$('pm-ssp').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || locked()) return;
  pm.ssp = b.dataset.pmSsp; setSelected('pm-ssp', 'pmSsp', pm.ssp); explain(TEXTS.ssp[pm.ssp]); testNow();
});
document.querySelectorAll('#pm-path button').forEach(b => b.addEventListener('click', () => {
  if (locked()) return;
  pm.path = b.dataset.pmPath; setSelected('pm-path', 'pmPath', pm.path); explain(TEXTS.pathway[pm.path]); testNow();
}));
document.querySelectorAll('#pm-ssp, #pm-path').forEach(box => box.addEventListener('mouseover', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.pmSsp) explain(TEXTS.ssp[b.dataset.pmSsp]); else if (b.dataset.pmPath) explain(TEXTS.pathway[b.dataset.pmPath]);
}));

$('pm-hint').addEventListener('click', () => {
  if (pm.hint) return;
  pm.hint = true;
  const ms = pm.list[pm.idx];
  const shapes = [...new Set(ms.solutions.map(s => s.path))], ssps = [...new Set(ms.solutions.map(s => s.ssp))];
  const only = ms.solutions.length === 1 ? ms.solutions[0] : null;
  $('pm-verdict').textContent = only
    ? `HINT (-20 points): the answer is ${only.ssp} + ${only.path.toUpperCase()}.`
    : shapes.length === 1 ? `HINT (-20 points): the answer uses the ${shapes[0].toUpperCase()} shape.`
    : ssps.length === 1 ? `HINT (-20 points): the answer uses society ${ssps[0]}. The shape does not matter here.`
    : `HINT (-20 points): look at the ${ms.solutions[0].path.toUpperCase()} shape.`;
  $('pm-hint').disabled = true;
  showPoints();
});

function testNow() {
  if (locked() || !(pm.ssp && pm.path)) return;
  const id = `${pm.ssp}|${pm.path}`;
  if (pm.lastTest === id) return;                      // same world twice: no second test
  pm.lastTest = id;
  state.ssp = pm.ssp; state.pathway = pm.path;
  drawFrame($('canvas3'), 2100, $('pm-source'), false);
  const ms = pm.list[pm.idx];
  const w = findWorld(pm.ssp, pm.path);
  markExplored();
  const store = loadStore(); store.stats.tests = (store.stats.tests || 0) + 1; saveStore(store);
  if (ms.ok(w)) onWin(ms, w); else onMiss(ms, w);
  $('pm-verdict-box').scrollIntoView({ block: 'nearest', behavior: 'smooth' });   // the result is below the picture
}
function findWorld(ssp, path) {
  // the same world objects used inside buildMissions (identity matters for "best" checks)
  for (const ms of pm.list) { const s = ms.solutions.find(x => x.ssp === ssp && x.path === path); if (s) return s; }
  return { ssp, path, m: metrics[state.cityKey][`ours|${ssp}|${path}|2100`] };
}

function onMiss(ms, w) {
  if (!ms.free) { pm.lives--; pm.fails++; }              // the first (tutorial) mission costs nothing
  let msg = ms.feedback(w);
  $('pm-verdict-box').className = 'dialog lose-state';
  if (ms.free) msg += ' No lives lost here: this one is just to learn. Try again!';
  else if (pm.lives > 0) msg += ` ${pm.lives} ${pm.lives === 1 ? 'LIFE' : 'LIVES'} LEFT. Change your SSP or your shape to test again.`;
  else {
    msg += ' NO LIVES LEFT.';
    $('pm-retry').hidden = false; $('pm-skip').hidden = false;
  }
  $('pm-verdict').textContent = msg;
  updatePlayHud(); showPoints();
}

function onWin(ms, w) {
  pm.done = true;
  const store = loadStore();
  const score = pointsNow();
  const medal = pm.fails === 0 && !pm.hint ? 'gold' : pm.fails <= 1 ? 'silver' : 'bronze';
  const prog = store.progress[state.cityKey] = store.progress[state.cityKey] || {};
  const prev = prog[ms.id];
  if (!prev || prev.medal === 'skip' || score > prev.score) prog[ms.id] = { medal, score };

  const newBadges = [];
  const give = id => { if (!store.badges[id]) { store.badges[id] = true; newBadges.push(BADGE_DEFS[id][0]); } };
  give('first_win');
  if (medal === 'gold') give('gold');
  if ((store.stats.tests || 0) >= 25) give('tester');
  if (ms.id === 'boss') give('floor_spotter');
  if (cityDone(store, state.cityKey, pm.list)) give('master');
  if (CITY_LIST.every(c => cityDone(store, c, buildMissions(c)))) give('globetrotter');
  saveStore(store);

  let msg = `MISSION COMPLETE! ${medal.toUpperCase()} MEDAL, ${score} POINTS.`;
  if (ms.twist) msg += ' ' + ms.twist(w);
  if (newBadges.length) msg += ' NEW BADGE: ' + newBadges.join(', ') + '.';
  $('pm-verdict').textContent = msg;
  $('pm-verdict-box').className = 'dialog win-state';
  $('pm-next').hidden = false;
  $('pm-next').textContent = pm.idx < pm.list.length - 1 ? 'NEXT MISSION ▶' : 'BACK TO LIST ▶';
  $('pm-hint').disabled = true;
  updatePlayHud(); showPoints(score); showTotal();
}

$('pm-retry').addEventListener('click', () => {
  pm.lives = 3; pm.lastTest = null; $('pm-retry').hidden = true; $('pm-skip').hidden = true;
  $('pm-verdict').textContent = 'New lives. Each wrong test makes the points smaller, so think first. Pick a new world.';
  $('pm-verdict-box').className = 'dialog';
  updatePlayHud(); showPoints();
});
$('pm-skip').addEventListener('click', () => {
  const ms = pm.list[pm.idx], a = ms.solutions[0];
  const store = loadStore();
  const prog = store.progress[state.cityKey] = store.progress[state.cityKey] || {};
  if (!prog[ms.id]) prog[ms.id] = { medal: 'skip', score: 0 };
  saveStore(store);
  pm.done = true;
  $('pm-verdict').textContent = `ONE ANSWER WAS: ${a.ssp} + ${a.path.toUpperCase()}. The next mission is unlocked.`;
  $('pm-retry').hidden = true; $('pm-skip').hidden = true; $('pm-next').hidden = false;
  $('pm-next').textContent = pm.idx < pm.list.length - 1 ? 'NEXT MISSION ▶' : 'BACK TO LIST ▶';
  updatePlayHud();
});
$('pm-next').addEventListener('click', () => { if (pm.idx < pm.list.length - 1) startMission(pm.idx + 1); else showScreen('screen-missions'); });
$('pm-back').addEventListener('click', () => showScreen('screen-missions'));

// ---------- Guide window: what do SSP, sprawl, historical... mean? ----------
const Guide = { open: false, seen: false };
try { Guide.seen = localStorage.getItem('guide_seen') === '1'; } catch (e) { /* ignore */ }
(function buildGuide() {
  const g = TEXTS.guide;
  const rows = (obj, names) => Object.entries(obj).map(([k, v]) => `<dt>${names[k]}</dt><dd>${v}</dd>`).join('');
  $('guide-body').innerHTML =
    `<h3>WHAT IS AN SSP?</h3><p>${g.sspIntro}</p><dl>${rows(g.ssp, g.sspNames)}</dl>` +
    `<h3>HOW DOES THE CITY GROW?</h3><p>${g.shapeIntro}</p><dl>${rows(g.shape, g.shapeNames)}</dl>` +
    `<h3>WORDS YOU WILL SEE</h3><dl>${rows(g.words, g.wordNames)}</dl>` +
    `<h3>TIP</h3><p>${g.tip}</p>`;
})();
const GUIDE_SCREENS = ['screen-play', 'screen-world', 'screen-missions'];
function syncGuide() {
  const show = Guide.open && GUIDE_SCREENS.includes(document.body.dataset.screen);
  $('guide').hidden = !show;
  document.body.classList.toggle('guide-open', show);      // pushes the game window to the left so the guide sits beside it
  document.querySelectorAll('.guide-toggle').forEach(b => b.classList.toggle('selected', Guide.open));
}
document.querySelectorAll('.guide-toggle').forEach(b => b.addEventListener('click', () => { Guide.open = !Guide.open; syncGuide(); }));
$('guide-close').addEventListener('click', () => { Guide.open = false; syncGuide(); });

// ---------- Badges screen ----------
function renderBadges() {
  const store = loadStore(), box = $('badge-list'); box.innerHTML = '';
  Object.entries(BADGE_DEFS).forEach(([id, [name, desc]]) => {
    const d = document.createElement('div');
    d.className = 'badge-card' + (store.badges[id] ? '' : ' locked');
    d.innerHTML = `<b>${store.badges[id] ? '★ ' : ''}${name}</b>${desc}`;
    box.appendChild(d);
  });
}


// =====================================================================
//  V(t) CURVE + 3D BARS
//  Data made by prepare_bars.py: data/bars/vt.json, data/bars/<Country>.json + .bin
// =====================================================================
const FLOOR_M = 3;                       // one floor, for the "hide low blocks" switch
// ?basemap=blank swaps the online map for an empty background (used for offline testing only)
const BASEMAP_OVERRIDE = new URLSearchParams(location.search).get('basemap') === 'blank'
  ? { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#401e2f' } }] } : null;

// ---------- load the files ----------
let vtAll = null;
const vtReady = fetch('data/bars/vt.json').then(r => r.json()).then(j => { vtAll = j; }).catch(() => { vtAll = null; });
const barsCache = {};
async function loadBars(key) {
  if (key in barsCache) return barsCache[key];
  try {
    const meta = await (await fetch(`data/bars/${key}.json`)).json();
    const u16 = new Uint16Array(await (await fetch(`data/bars/${key}.bin`)).arrayBuffer());
    barsCache[key] = { meta, u16 };
  } catch (e) { barsCache[key] = null; }
  return barsCache[key];
}

// ---------- V(t) panel (pixel line chart) ----------
function parseVt(key) {
  const v = vtAll && vtAll[key]; if (!v) return null;
  const obs = [], scen = {};
  Object.entries(v).forEach(([f, val]) => {
    let m = f.match(/^hist_(\d{4})$/);
    if (m) { obs.push([+m[1], val]); return; }
    m = f.match(/^ours_(SSP\d)_([a-z]+)_(\d{4})$/);
    if (m) (scen[`${m[1]}|${m[2]}`] = scen[`${m[1]}|${m[2]}`] || []).push([+m[3], val]);
  });
  obs.sort((a, b) => a[0] - b[0]);
  Object.values(scen).forEach(a => a.sort((x, y) => x[0] - y[0]));
  return { obs, scen };
}
function plotLine(ctx, x0, y0, x1, y1, color, w = 1) {          // crisp pixel line (Bresenham)
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy; ctx.fillStyle = color;
  for (;;) {
    ctx.fillRect(x0, y0, w, w);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function interp(points, x) {
  if (!points.length) return null;
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    if (x <= points[i][0]) { const [xa, ya] = points[i - 1], [xb, yb] = points[i]; return ya + (yb - ya) * (x - xa) / (xb - xa); }
  }
  return points[points.length - 1][1];
}
async function drawVt(level, year) {
  await vtReady;
  const cv = $(`vt${level}`), cap = $(`vt${level}-cap`), box = cv.parentElement;
  const d = parseVt(state.cityKey);
  $(`vtwin${level}`).classList.toggle('nodata', !d);
  document.querySelectorAll('.vt-toggle').forEach(b => { b.disabled = !d; });
  if (!d) return;
  const W = cv.width, H = cv.height, ctx = cv.getContext('2d');
  const X0 = 1980, X1 = level === 2 ? 2100 : 2015;
  const pad = 4, sx = y => pad + (y - X0) / (X1 - X0) * (W - 2 * pad);
  const future = level === 2;
  let ymax = Math.max(...d.obs.map(p => p[1]));
  if (future) Object.values(d.scen).forEach(a => a.forEach(p => { ymax = Math.max(ymax, p[1]); }));
  ymax *= 1.08;
  const sy = v => H - pad - v / ymax * (H - 2 * pad);
  ctx.clearRect(0, 0, W, H);
  if (future) { ctx.fillStyle = cssVar('--c-indigo-700'); ctx.fillRect(sx(2015), 0, W - sx(2015), H); }
  ctx.fillStyle = cssVar('--c-indigo-700');
  for (let g = 1; g <= 3; g++) for (let x = 0; x < W; x += 4) ctx.fillRect(x, Math.round(H - g * H / 4), 1, 1);   // dotted grid
  const poly = (pts, color, w) => { for (let i = 1; i < pts.length; i++) plotLine(ctx, sx(pts[i - 1][0]), sy(pts[i - 1][1]), sx(pts[i][0]), sy(pts[i][1]), color, w); };
  const last = d.obs[d.obs.length - 1];
  const sel = `${state.ssp}|${state.pathway}`;
  if (future) {
    const seen = new Set(d.scen[sel] ? [JSON.stringify(d.scen[sel])] : []);       // identical curves are drawn once
    Object.entries(d.scen).forEach(([k, a]) => {
      const sig = JSON.stringify(a);
      if (k !== sel && !seen.has(sig)) { seen.add(sig); poly([last, ...a], cssVar('--c-blue-500'), 1); }
    });
    if (d.scen[sel]) poly([last, ...d.scen[sel]], cssVar('--c-peach'), 2);
  }
  poly(d.obs, cssVar('--c-ice'), 2);
  // marker at the current year
  let line = d.obs; if (future && year > 2015 && d.scen[sel]) line = [last, ...d.scen[sel]];
  const val = interp(line, year);
  if (val != null) {
    ctx.fillStyle = cssVar('--c-night'); ctx.fillRect(Math.round(sx(year)) - 3, Math.round(sy(val)) - 3, 7, 7);
    ctx.fillStyle = year > 2015 ? cssVar('--c-peach') : cssVar('--c-ice'); ctx.fillRect(Math.round(sx(year)) - 2, Math.round(sy(val)) - 2, 5, 5);
    cap.textContent = `${year}: ${val.toFixed(2)} KM³` + (year > 2030 && year !== 2050 && year !== 2075 && year !== 2100 ? ' (LINE BETWEEN KNOWN YEARS)' : '');
  }
  box.querySelector('.vt-axis').lastElementChild.textContent = X1;
  const note = $(`vt${level}-note`);
  if (note) {
    const mine = d.scen[`${state.ssp}|sprawl`], sig = a => JSON.stringify(a);
    const same = future && ['sprawl', 'historical', 'vertical'].every(p => d.scen[`${state.ssp}|${p}`] && sig(d.scen[`${state.ssp}|${p}`]) === sig(mine));
    note.textContent = same ? 'SPRAWL, HISTORICAL AND VERTICAL GIVE THE SAME TOTAL VOLUME. THE SHAPE CHANGES WHERE IT IS BUILT, NOT HOW MUCH.' : '';
  }
}

// ---------- Map view and 3D bars (same data, same map) ----------
const BASEMAPS = { dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
                   light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' };
const Bars = { map: null, overlay: null, mode: 'map', hideLow: false, exag: 100, opacity: 0.85, base: 'dark',
               level: 1, lastYear: 1980, fitted: null };
const EXAG = [50, 100, 200];
const NEXT_MODE = { pixel: 'map', map: '3d', '3d': 'pixel' };
const MODE_LABEL = { pixel: 'PIXEL VIEW', map: 'MAP VIEW', '3d': '3D VIEW' };

function colorRamp(t) {        // 0..1 -> palette colours (blue -> teal -> peach -> coral -> wine)
  const stops = [[0, [94, 112, 166]], [0.3, [158, 198, 201]], [0.6, [237, 152, 124]], [0.8, [191, 95, 95]], [1, [140, 54, 87]]];
  t = Math.max(0, Math.min(1, t));
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, a] = stops[i - 1], [t1, b] = stops[i], u = (t - t0) / (t1 - t0);
      return a.map((v, j) => Math.round(v + (b[j] - v) * u));
    }
  }
  return stops[stops.length - 1][1];
}
function snapshotYears(meta, ssp, path) {
  const ys = []; meta.fields.forEach(f => { const m = f.match(new RegExp(`^ours_${ssp}_${path}_(\\d{4})$`)); if (m) ys.push(+m[1]); });
  return ys.sort((a, b) => a - b);
}
function pickField(meta, level, year) {
  if (level === 1 || year <= 2015) { const y = level === 1 ? year : 2015; return { name: `hist_${y}`, year: y }; }
  const ys = snapshotYears(meta, state.ssp, state.pathway);
  if (!ys.length) return null;
  const y = ys.reduce((best, c) => (Math.abs(c - year) < Math.abs(best - year) ? c : best), ys[0]);
  return { name: `ours_${state.ssp}_${state.pathway}_${y}`, year: y };
}
const viewPose = () => (Bars.mode === '3d' ? { pitch: 60, bearing: -20 } : { pitch: 0, bearing: 0 });

function ensureMap() {
  if (Bars.map) return true;
  if (!window.maplibregl || !window.deck) return false;
  const style = BASEMAP_OVERRIDE || BASEMAPS[Bars.base];
  Bars.map = new maplibregl.Map({ container: 'map3d', style, center: [0, 0], zoom: 2, attributionControl: true, ...viewPose() });
  Bars.overlay = new deck.MapboxOverlay({ layers: [] });
  Bars.map.addControl(Bars.overlay);
  Bars.map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
  return true;
}
function mountMap(level) {
  const stage = $(`stage${level}`), holder = $('map3d');
  [1, 2].forEach(n => $(`stage${n}`).classList.toggle('is3d', Bars.mode !== 'pixel' && n === level));
  if (holder.parentElement !== stage) { holder.hidden = false; stage.appendChild(holder); }
}

async function renderBars(level, year) {
  const b = await loadBars(state.cityKey);
  const note = $(`l${level}-source`);
  const fail = msg => { note.textContent = msg; Bars.mode = 'pixel'; syncViewUi(); };
  if (!b) return fail('MAP DATA MISSING (RUN prepare_bars.py)');
  if (!window.maplibregl || !window.deck) return fail('MAP LIBRARIES NOT LOADED (OFFLINE?)');
  mountMap(level);                 // show + move the container first, so the map gets its real size
  ensureMap();
  Bars.map.resize();
  const { meta, u16 } = b;
  const fld = pickField(meta, level, year);
  if (!fld) { note.textContent = 'NO MAP DATA FOR THIS WORLD'; return; }
  const fi = meta.fields.indexOf(fld.name), n = meta.n, off = fi * n;
  const minH = Bars.hideLow ? FLOOR_M : 0.1;
  const data = [];
  for (let i = 0; i < n; i++) { const h = u16[off + i] / meta.scale; if (h >= minH) data.push({ p: meta.lonlat[i], h }); }
  const is3d = Bars.mode === '3d';
  note.textContent = (year > 2015 && fld.year !== year ? `SNAPSHOT: ${fld.year}` : 'REAL DATA') + (is3d ? ` | HEIGHT x${Bars.exag}` : ' | 500 M BLOCKS');
  document.querySelectorAll('.legend-max').forEach(el => { el.textContent = meta.hmax.toFixed(0) + ' M'; });
  const half = meta.block_m / 2 * (is3d ? 0.55 : 1.0);
  Bars.overlay.setProps({ layers: [new deck.ColumnLayer({
    id: 'bars', data, diskResolution: 4, angle: 45, radius: half * Math.SQRT2, extruded: is3d, flatShading: true,
    getPosition: d => d.p, getElevation: d => d.h, elevationScale: Bars.exag, opacity: Bars.opacity,
    getFillColor: d => colorRamp(d.h / meta.hmax),
    material: { ambient: 0.75, diffuse: 0.45, shininess: 0, specularColor: [0, 0, 0] },
    updateTriggers: { getFillColor: [state.cityKey], getElevation: [Bars.exag] },
    transitions: { getElevation: 300 },
  })] });
  if (Bars.fitted !== state.cityKey) {                  // fly to the city the first time
    const xs = meta.lonlat.map(p => p[0]), ys = meta.lonlat.map(p => p[1]);
    Bars.map.fitBounds([[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]], { padding: 40, duration: 0, ...viewPose() });
    Bars.fitted = state.cityKey;
  }
}

function syncViewUi() {
  document.body.classList.toggle('view3d', Bars.mode !== 'pixel');       // (class name kept: it styles the legend + tools)
  document.body.dataset.viewmode = Bars.mode;
  document.querySelectorAll('.view-toggle').forEach(b => { b.textContent = MODE_LABEL[NEXT_MODE[Bars.mode]]; });
  document.querySelectorAll('.floor-toggle').forEach(b => { b.textContent = Bars.hideLow ? 'HIDING BLOCKS UNDER 1 FLOOR' : 'SHOWING ALL BLOCKS'; });
  document.querySelectorAll('.exag-toggle').forEach(b => { b.textContent = `HEIGHT x${Bars.exag}`; });
  document.querySelectorAll('.base-toggle').forEach(b => { b.textContent = `BASEMAP: ${Bars.base.toUpperCase()}`; });
  document.querySelectorAll('.opacity-range').forEach(r => { r.value = Bars.opacity; });
  if (Bars.mode === 'pixel') [1, 2].forEach(n => $(`stage${n}`).classList.remove('is3d'));
}

syncViewUi();
function refreshViews(level, year) {
  Bars.level = level; Bars.lastYear = year;
  drawVt(level, year);
  syncVtWindows();
  if (Bars.mode !== 'pixel') renderBars(level, year);
}
document.querySelectorAll('.view-toggle').forEach(b => b.addEventListener('click', async () => {
  Bars.mode = NEXT_MODE[Bars.mode]; syncViewUi();
  const level = $('screen-level2').classList.contains('active') ? 2 : 1;
  if (Bars.mode === 'pixel') return;
  await renderBars(level, Bars.lastYear);
  if (Bars.map && Bars.mode !== 'pixel') Bars.map.easeTo({ ...viewPose(), duration: 700 });   // flat <-> tilted
}));
document.querySelectorAll('.floor-toggle').forEach(b => b.addEventListener('click', () => {
  Bars.hideLow = !Bars.hideLow; syncViewUi(); if (Bars.mode !== 'pixel') renderBars(Bars.level, Bars.lastYear);
}));
document.querySelectorAll('.exag-toggle').forEach(b => b.addEventListener('click', () => {
  Bars.exag = EXAG[(EXAG.indexOf(Bars.exag) + 1) % EXAG.length]; syncViewUi(); if (Bars.mode !== 'pixel') renderBars(Bars.level, Bars.lastYear);
}));
document.querySelectorAll('.opacity-range').forEach(r => r.addEventListener('input', () => {
  Bars.opacity = +r.value; syncViewUi(); if (Bars.mode !== 'pixel') renderBars(Bars.level, Bars.lastYear);
}));
document.querySelectorAll('.base-toggle').forEach(b => b.addEventListener('click', () => {
  Bars.base = Bars.base === 'dark' ? 'light' : 'dark'; syncViewUi();
  if (Bars.map) Bars.map.setStyle(BASEMAP_OVERRIDE || BASEMAPS[Bars.base]);
}));

// ---------- V(t) window: open with the button, drag by the title bar, close with the box ----------
const VtWin = { open: false };
function syncVtWindows() {
  [1, 2].forEach(n => { $(`vtwin${n}`).hidden = !(VtWin.open && $(`screen-level${n}`).classList.contains('active')); });
  document.querySelectorAll('.vt-toggle').forEach(b => b.classList.toggle('selected', VtWin.open));
}
document.querySelectorAll('.vt-toggle').forEach(b => b.addEventListener('click', () => { VtWin.open = !VtWin.open; syncVtWindows(); }));
document.querySelectorAll('.vt-close').forEach(b => b.addEventListener('click', () => { VtWin.open = false; syncVtWindows(); }));
document.querySelectorAll('.vt-bar').forEach(bar => bar.addEventListener('pointerdown', e => {
  if (e.target.closest('.vt-close')) return;
  const w = bar.closest('.vt-window'), r = w.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
  Object.assign(w.style, { right: 'auto', bottom: 'auto', left: r.left + 'px', top: r.top + 'px' });
  const move = ev => {
    w.style.left = Math.max(0, Math.min(innerWidth - w.offsetWidth, ev.clientX - dx)) + 'px';
    w.style.top = Math.max(0, Math.min(innerHeight - 40, ev.clientY - dy)) + 'px';
  };
  const up = () => removeEventListener('pointermove', move);
  addEventListener('pointermove', move); addEventListener('pointerup', up, { once: true });
}));
