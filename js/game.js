/* =====================================================
   ANUBIS WRATH — BET 777
   Complete 1024-ways slot engine. Pure client-side demo:
   no login, no server, demo credits only.
   ===================================================== */
(() => {
'use strict';

if (window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

/* ---------------- config ---------------- */
const COLS = 5, ROWS = 4, CELL = 132;
const REEL_W = COLS * CELL, REEL_H = ROWS * CELL;

const SYMS = {
  nine:    { pay: [0,0,0,  5, 12,  25], weight: 11 },
  ten:     { pay: [0,0,0,  5, 12,  25], weight: 11 },
  j:       { pay: [0,0,0,  6, 15,  30], weight: 10 },
  q:       { pay: [0,0,0,  6, 15,  30], weight: 10 },
  k:       { pay: [0,0,0,  8, 20,  40], weight: 9  },
  a:       { pay: [0,0,0,  8, 20,  40], weight: 9  },
  ankh:    { pay: [0,0,0, 12, 30,  80], weight: 6  },
  eye:     { pay: [0,0,0, 15, 40, 100], weight: 5  },
  scales:  { pay: [0,0,0, 20, 60, 160], weight: 4  },
  anubis:  { pay: [0,0,0, 30,100, 300], weight: 3  },
  wild:    { pay: null, weight: 2.2 }, // reels 2-4 only, substitutes all but scatter
  scatter: { pay: null, weight: 2   }  // 3+ anywhere triggers free spins
};
const PAY_ORDER = ['anubis','scales','eye','ankh','a','k','q','j','ten','nine'];
const SCATTER_PAY = { 3: 2, 4: 10, 5: 50 };       // × total bet
const SCATTER_SPINS = { 3: 15, 4: 20, 5: 25 };
const BETS = [30, 60, 150, 300, 600, 1500, 3000, 7500, 15000];
const FEATURE_BUY_X = 75;
const START_BALANCE = 100000;

// multiplier reels: [value, weight]
const MULT_BASE = [[2,40],[3,26],[5,15],[8,8],[10,6],[25,3],[50,1.3],[100,.5],[250,.15],[500,.05]];
const MULT_FREE = [[2,24],[3,22],[5,18],[10,12],[25,7],[50,3.5],[100,1.2],[250,.4],[500,.15]];

const TICKER_MSGS = [
  'TRIGGERS 15 OR MORE FREE SPINS!',
  'UP TO x500 IN MULTIPLIER REELS!',
  'WIN UP TO 10000x YOUR BET!',
  '1024 WAYS TO WIN — EVERY SPIN!',
  'ANUBIS WRATH • BY BET 777'
];

/* ---------------- state ---------------- */
const state = {
  balance: parseFloat(localStorage.getItem('aw_balance')) || START_BALANCE,
  betIdx: 3,
  spinning: false,
  busy: false,          // full round in progress (spin + presentation)
  turbo: false,
  auto: 0,
  freeSpins: 0,
  inFree: false,
  fsTotal: 0,
  lastWin: 0,
  mults: [3, 50, 3, 10, 3],
  multLock: [true, true, true, true, true],
  grid: null,
  winCells: new Set(),
  scatterCells: new Set(),
  quickStop: false
};
const bet = () => BETS[state.betIdx];

/* ---------------- dom ---------------- */
const $ = s => document.querySelector(s);
const el = {
  stage: $('#stage'), bg: $('#bg'), reels: $('#reels'), mults: $('#mults'),
  win: $('#lbl-win'), bet: $('#lbl-bet'), balance: $('#lbl-balance'),
  spin: $('#btn-spin'), spinCount: $('#spin-count'),
  turbo: $('#btn-turbo'), auto: $('#btn-auto'), plus: $('#btn-plus'), minus: $('#btn-minus'),
  sound: $('#btn-sound'), info: $('#btn-info'),
  fb: $('#feature-buy'), fbCost: $('#fb-cost'),
  ticker: $('#ticker-text'),
  fsCounter: $('#fs-counter'), fsLeft: $('#fs-left'),
  loader: $('#loader'), loaderFill: $('#loader-fill'), loaderPct: $('#loader-pct'), loaderEnter: $('#loader-enter'),
  bigwin: $('#bigwin'), bigwinTitle: $('#bigwin-title'), bigwinAmount: $('#bigwin-amount'),
  fsIntro: $('#fs-intro'), fsIntroNum: $('#fs-intro-num'), fsStart: $('#fs-start'),
  fsEnd: $('#fs-end'), fsTotal: $('#fs-total'), fsCollect: $('#fs-collect'),
  buyDlg: $('#buy-dialog'), buyCost: $('#buy-cost'), buyOk: $('#buy-confirm'), buyNo: $('#buy-cancel'),
  autoDlg: $('#auto-dialog'), autoCancel: $('#auto-cancel'),
  paytable: $('#paytable'), paytableBody: $('#paytable-body'), paytableClose: $('#paytable-close'),
  toast: $('#toast'), winPlate: $('#win-plate'), flash: $('#flash'), gameUi: $('#game-ui')
};

const fmt = n => 'Rs' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------------- utils ---------------- */
function pickWeighted(pairs) {
  let total = 0;
  for (const [, w] of pairs) total += w;
  let r = Math.random() * total;
  for (const [v, w] of pairs) { r -= w; if (r <= 0) return v; }
  return pairs[pairs.length - 1][0];
}

function pickSymbol(col, inFree) {
  const pairs = [];
  for (const id in SYMS) {
    if (id === 'wild' && (col === 0 || col === COLS - 1)) continue;
    let w = SYMS[id].weight;
    if (id === 'scatter' && inFree) w = 1.2;
    pairs.push([id, w]);
  }
  return pickWeighted(pairs);
}

function genResult() {
  const grid = [];
  for (let c = 0; c < COLS; c++) {
    const col = [];
    let hasScatter = false;
    for (let r = 0; r < ROWS; r++) {
      let s = pickSymbol(c, state.inFree);
      while (s === 'scatter' && hasScatter) s = pickSymbol(c, state.inFree);
      if (s === 'scatter') hasScatter = true;
      col.push(s);
    }
    grid.push(col);
  }
  return grid;
}

function genMults() {
  const table = state.inFree ? MULT_FREE : MULT_BASE;
  return Array.from({ length: COLS }, () => pickWeighted(table));
}

/* win evaluation: 1024 ways, wild substitutes, multiplier of the
   reel where each way ends applies to that way's win */
function evaluate(grid, mults) {
  const unit = bet() / 100;
  let total = 0;
  const cells = new Set();
  const winSyms = [];

  for (const sym of PAY_ORDER) {
    const counts = [];
    for (let c = 0; c < COLS; c++) {
      let n = 0;
      for (let r = 0; r < ROWS; r++)
        if (grid[c][r] === sym || grid[c][r] === 'wild') n++;
      if (!n) break;
      counts.push(n);
    }
    const len = counts.length;
    if (len < 3) continue;
    const pay = SYMS[sym].pay[len];
    if (!pay) continue;
    const ways = counts.reduce((a, b) => a * b, 1);
    const win = pay * unit * ways * mults[len - 1];
    total += win;
    winSyms.push({ sym, len, ways, win });
    for (let c = 0; c < len; c++)
      for (let r = 0; r < ROWS; r++)
        if (grid[c][r] === sym || grid[c][r] === 'wild') cells.add(c + ',' + r);
  }

  // scatters
  const scCells = new Set();
  let scatters = 0;
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r < ROWS; r++)
      if (grid[c][r] === 'scatter') { scatters++; scCells.add(c + ',' + r); }

  let scatterWin = 0, freeSpins = 0;
  if (scatters >= 3) {
    scatterWin = SCATTER_PAY[Math.min(scatters, 5)] * bet();
    freeSpins = SCATTER_SPINS[Math.min(scatters, 5)];
    total += scatterWin;
  }
  return { total, cells, winSyms, scatters, scCells, scatterWin, freeSpins };
}

/* ================= rendering ================= */
const rx = el.reels.getContext('2d');
const mx = el.mults.getContext('2d');
const bx = el.bg.getContext('2d');

/* cell plaque tile (stone slate like reference) */
const plaque = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = CELL;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, CELL);
  g.addColorStop(0, '#5b6f86');
  g.addColorStop(0.5, '#46586e');
  g.addColorStop(1, '#33404f');
  x.fillStyle = g;
  x.fillRect(0, 0, CELL, CELL);
  // stone mottling
  for (let i = 0; i < 40; i++) {
    x.fillStyle = `rgba(${Math.random() > .5 ? '255,255,255' : '0,10,30'},${rnd(.015, .05)})`;
    x.beginPath();
    x.arc(rnd(0, CELL), rnd(0, CELL), rnd(4, 22), 0, Math.PI * 2);
    x.fill();
  }
  // faint carved hieroglyphs
  x.strokeStyle = 'rgba(10,20,38,.30)';
  x.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const gx = rnd(14, CELL - 28), gy = rnd(14, CELL - 28), t = Math.random();
    x.beginPath();
    if (t < 0.34) { x.arc(gx + 7, gy + 7, 6, 0, Math.PI * 2); }
    else if (t < 0.67) { x.moveTo(gx, gy + 12); x.quadraticCurveTo(gx + 7, gy - 6, gx + 14, gy + 12); }
    else { x.rect(gx, gy, 12, 9); }
    x.stroke();
  }
  // bevel
  x.strokeStyle = 'rgba(180,205,230,.35)'; x.lineWidth = 2;
  x.strokeRect(2, 2, CELL - 4, CELL - 4);
  x.strokeStyle = 'rgba(0,8,20,.6)';
  x.strokeRect(0.5, 0.5, CELL - 1, CELL - 1);
  return c;
})();

/* ----- gold sparkles on the reel canvas ----- */
const sparkles = [];
function spawnSparkle(cx, cy, spread = 36, up = false) {
  sparkles.push({
    x: cx + rnd(-spread, spread), y: cy + rnd(-spread, spread),
    vx: rnd(-0.5, 0.5), vy: up ? rnd(-2.2, -0.8) : rnd(-0.5, 0.4),
    life: 1, decay: rnd(0.02, 0.05), r: rnd(2.2, 5.5), rot: rnd(0, 7), vr: rnd(-0.18, 0.18)
  });
}
function drawSparkles() {
  if (!sparkles.length) return;
  rx.save();
  rx.globalCompositeOperation = 'lighter';
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    s.x += s.vx; s.y += s.vy; s.rot += s.vr; s.life -= s.decay;
    if (s.life <= 0) { sparkles.splice(i, 1); continue; }
    const r = s.r * s.life;
    rx.save();
    rx.translate(s.x, s.y);
    rx.rotate(s.rot);
    rx.globalAlpha = s.life;
    const g = rx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, '#fff8dc'); g.addColorStop(0.5, '#ffd86b'); g.addColorStop(1, 'rgba(200,120,20,0)');
    rx.fillStyle = g;
    rx.beginPath();
    // four-point star
    rx.moveTo(0, -r * 2);
    rx.quadraticCurveTo(r * 0.3, -r * 0.3, r * 2, 0);
    rx.quadraticCurveTo(r * 0.3, r * 0.3, 0, r * 2);
    rx.quadraticCurveTo(-r * 0.3, r * 0.3, -r * 2, 0);
    rx.quadraticCurveTo(-r * 0.3, -r * 0.3, 0, -r * 2);
    rx.fill();
    rx.restore();
  }
  rx.restore();
}

/* ----- reels ----- */
const reels = [];
function initReels() {
  const ids = Object.keys(SYMS);
  for (let c = 0; c < COLS; c++) {
    reels.push({
      strip: Array.from({ length: ROWS }, () => ids[(Math.random() * 10) | 0]),
      offset: 0, travel: 0, start: 0, dur: 0,
      spinning: false, landed: true, anticipation: false
    });
  }
  // showcase layout close to the reference screenshot
  state.grid = [
    ['ankh','ten','j','a'],
    ['nine','scatter','anubis','scales'],
    ['k','wild','wild','ten'],
    ['nine','scatter','anubis','scales'],
    ['ankh','ten','j','a']
  ];
  for (let c = 0; c < COLS; c++) reels[c].strip = state.grid[c].slice();
}

function buildStrip(c, result, travel) {
  const ids = Object.keys(SYMS).filter(s => s !== 'scatter' && s !== 'wild');
  const strip = [];
  for (let k = 0; k < travel; k++) {
    if (k < ROWS) strip.push(reels[c].strip[k] || ids[(Math.random() * ids.length) | 0]);
    else strip.push(ids[(Math.random() * ids.length) | 0]);
  }
  for (let r = 0; r < ROWS; r++) strip.push(result[r]);
  strip.push(ids[(Math.random() * ids.length) | 0]);
  return strip;
}

function easeTravel(p) {
  // gentle launch, fast middle, strong deceleration
  if (p < 0.14) return 0.5 * (p / 0.14) * (p / 0.14) * 0.14 * 2 / 2;
  return 1 - Math.pow(1 - p, 2.6) * (1 - 0.14 * 0.5) / Math.pow(0.86, 2.6);
}

function drawReels(now) {
  rx.clearRect(0, 0, REEL_W, REEL_H);

  // plaques
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r < ROWS; r++)
      rx.drawImage(plaque, c * CELL, r * CELL);

  const allStopped = reels.every(R => R.landed);
  const dim = allStopped && state.winCells.size > 0;

  for (let c = 0; c < COLS; c++) {
    const R = reels[c];
    rx.save();
    rx.beginPath();
    rx.rect(c * CELL, 0, CELL, REEL_H);
    rx.clip();

    if (R.spinning) {
      const t = now - R.start;
      let o, speed = 0;
      if (t < R.dur) {
        const p = Math.max(0, t / R.dur);
        o = R.travel * easeTravel(p);
        speed = R.travel * (easeTravel(Math.min(1, p + 0.01)) - easeTravel(p)) / 0.01 / R.dur * 16;
      } else if (t < R.dur + 240) {
        // bounce settle
        if (!R.landed) {
          R.landed = true; SND.reelStop(c);
          for (let k = 0; k < 6; k++)
            spawnSparkle(c * CELL + CELL / 2, REEL_H - 16, 56, true);
        }
        const q = (t - R.dur) / 240;
        o = R.travel + Math.sin(q * Math.PI) * 0.22 * (1 - q);
      } else {
        R.spinning = false; R.landed = true;
        R.strip = state.grid[c].slice();
        o = R.travel;
      }
      R.offset = o;
      const blur = speed > 9;
      const k0 = Math.max(0, Math.floor(o) - 1);
      const k1 = Math.min(R.fullStrip.length - 1, Math.floor(o) + ROWS + 1);
      for (let k = k0; k <= k1; k++) {
        const y = (k - o) * CELL;
        if (y < -CELL || y > REEL_H) continue;
        const img = SymbolArt.get(R.fullStrip[k]);
        if (blur) {
          rx.globalAlpha = 0.32;
          rx.drawImage(img, c * CELL + 4, y - 16, CELL - 8, CELL - 8);
          rx.drawImage(img, c * CELL + 4, y + 16, CELL - 8, CELL - 8);
          rx.globalAlpha = 0.78;
        }
        rx.drawImage(img, c * CELL + 4, y + 4, CELL - 8, CELL - 8);
        rx.globalAlpha = 1;
      }
      // anticipation glow
      if (R.anticipation) {
        const a = 0.35 + 0.25 * Math.sin(now / 110);
        const g = rx.createLinearGradient(c * CELL, 0, (c + 1) * CELL, 0);
        g.addColorStop(0, `rgba(255,190,50,${a})`);
        g.addColorStop(0.5, 'rgba(255,190,50,0)');
        g.addColorStop(1, `rgba(255,190,50,${a})`);
        rx.fillStyle = g;
        rx.fillRect(c * CELL, 0, CELL, REEL_H);
      }
    } else {
      for (let r = 0; r < ROWS; r++) {
        const id = R.strip[r];
        const key = c + ',' + r;
        const isWin = state.winCells.has(key) || state.scatterCells.has(key);
        if (dim && !isWin) rx.globalAlpha = 0.32;
        let dx = c * CELL + 4, dy = r * CELL + 4, dw = CELL - 8;
        if (isWin && dim) {
          if (Math.random() < 0.06)
            spawnSparkle(c * CELL + CELL / 2, r * CELL + CELL / 2, 44);
          const s = 1 + 0.07 * Math.sin(now / 140);
          const grow = (dw * s - dw) / 2;
          dx -= grow; dy -= grow; dw *= s;
          // gold frame
          rx.save();
          rx.globalAlpha = 1;
          rx.shadowColor = 'rgba(255,200,70,.9)';
          rx.shadowBlur = 18;
          rx.lineWidth = 4;
          rx.strokeStyle = '#ffd86b';
          rx.strokeRect(c * CELL + 3, r * CELL + 3, CELL - 6, CELL - 6);
          rx.restore();
        }
        rx.drawImage(SymbolArt.get(id), dx, dy, dw, dw);
        rx.globalAlpha = 1;
      }
    }
    rx.restore();
  }

  // reel separators
  rx.strokeStyle = 'rgba(200,160,70,.5)';
  rx.lineWidth = 2;
  for (let c = 1; c < COLS; c++) {
    rx.beginPath();
    rx.moveTo(c * CELL, 0); rx.lineTo(c * CELL, REEL_H);
    rx.stroke();
  }
  // top/bottom inner shading
  const sh = rx.createLinearGradient(0, 0, 0, REEL_H);
  sh.addColorStop(0, 'rgba(0,0,10,.5)');
  sh.addColorStop(0.08, 'rgba(0,0,10,0)');
  sh.addColorStop(0.92, 'rgba(0,0,10,0)');
  sh.addColorStop(1, 'rgba(0,0,10,.5)');
  rx.fillStyle = sh;
  rx.fillRect(0, 0, REEL_W, REEL_H);

  // periodic gloss sweep across the symbols
  if (allStopped && !dim) {
    const sw = (now % 7000) / 7000;
    if (sw < 0.22) {
      const t = sw / 0.22;
      const sx = -260 + (REEL_W + 520) * t;
      rx.save();
      rx.globalCompositeOperation = 'lighter';
      const lg = rx.createLinearGradient(sx, 0, sx + 260, REEL_H * 0.5);
      lg.addColorStop(0, 'rgba(255,240,190,0)');
      lg.addColorStop(0.5, 'rgba(255,240,190,.09)');
      lg.addColorStop(1, 'rgba(255,240,190,0)');
      rx.fillStyle = lg;
      rx.fillRect(0, 0, REEL_W, REEL_H);
      rx.restore();
    }
  }
  drawSparkles();
}

/* ----- multiplier strip ----- */
let multCycle = 0;
function drawMults(now) {
  mx.clearRect(0, 0, 660, 92);
  const g = mx.createLinearGradient(0, 0, 0, 92);
  g.addColorStop(0, '#2c2114'); g.addColorStop(1, '#171008');
  mx.fillStyle = g;
  mx.fillRect(0, 0, 660, 92);
  // beaded gold edges
  for (let bxp = 12; bxp < 660; bxp += 18) {
    const bg2 = mx.createRadialGradient(bxp - 1, 3.4, 0.5, bxp, 4.5, 3.4);
    bg2.addColorStop(0, '#ffe9a0'); bg2.addColorStop(1, '#8a5a10');
    mx.fillStyle = bg2;
    mx.beginPath(); mx.arc(bxp, 4.5, 3.4, 0, Math.PI * 2); mx.fill();
    mx.beginPath(); mx.arc(bxp, 87.5, 3.4, 0, Math.PI * 2); mx.fill();
  }

  for (let c = 0; c < COLS; c++) {
    const px = c * CELL, locked = state.multLock[c];
    // carved cartouche plaque — navy face with bronze ring like the buttons
    const pg = mx.createLinearGradient(0, 10, 0, 82);
    pg.addColorStop(0, '#27335a'); pg.addColorStop(0.55, '#10162c'); pg.addColorStop(1, '#1a2240');
    mx.fillStyle = pg;
    mx.beginPath();
    mx.roundRect(px + 8, 11, CELL - 16, 70, 22);
    mx.fill();
    mx.lineWidth = 3.5;
    mx.strokeStyle = locked ? '#caa14e' : '#54400f';
    mx.stroke();
    mx.lineWidth = 1.5;
    mx.strokeStyle = '#2a1c08';
    mx.beginPath();
    mx.roundRect(px + 4.5, 7.5, CELL - 9, 77, 25);
    mx.stroke();
    // engraved inner rope ring
    mx.save();
    mx.setLineDash([5, 4]);
    mx.lineWidth = 1.6;
    mx.strokeStyle = locked ? 'rgba(255,233,160,.55)' : 'rgba(160,130,70,.4)';
    mx.beginPath();
    mx.roundRect(px + 13, 16, CELL - 26, 60, 17);
    mx.stroke();
    mx.restore();
    // gem studs on the sides
    [[px + 14, c % 2 ? 168 : 0], [px + CELL - 14, c % 2 ? 0 : 168]].forEach(([gx, hue]) => {
      const gg = mx.createRadialGradient(gx - 1.4, 44.5, 0.6, gx, 46, 4.6);
      gg.addColorStop(0, `hsl(${hue},90%,85%)`);
      gg.addColorStop(0.5, `hsl(${hue},90%,50%)`);
      gg.addColorStop(1, `hsl(${hue},90%,18%)`);
      mx.fillStyle = gg;
      mx.beginPath(); mx.arc(gx, 46, 4.6, 0, Math.PI * 2); mx.fill();
      mx.lineWidth = 1.4; mx.strokeStyle = '#8a5a10'; mx.stroke();
    });

    let v = state.mults[c];
    if (!locked) v = [2, 3, 5, 10, 25, 50, 100, 500][((now / 80) | 0) + c * 3 & 7];

    const hot = v >= 100, warm = v >= 25;
    mx.save();
    mx.translate(px + CELL / 2, 50);
    if (locked && state.multFlash && state.multFlash[c] && now - state.multFlash[c] < 400) {
      const q = (now - state.multFlash[c]) / 400;
      mx.scale(1 + 0.35 * Math.sin(q * Math.PI), 1 + 0.35 * Math.sin(q * Math.PI));
    }
    mx.font = `900 ${v >= 100 ? 34 : 40}px Cinzel, "Times New Roman", serif`;
    mx.textAlign = 'center'; mx.textBaseline = 'middle';
    mx.lineJoin = 'round';
    if (locked) {
      mx.shadowColor = hot ? 'rgba(255,60,30,.95)' : warm ? 'rgba(255,140,30,.8)' : 'rgba(255,200,80,.5)';
      mx.shadowBlur = hot ? 22 : warm ? 16 : 8;
    }
    mx.lineWidth = 7;
    mx.strokeStyle = '#2e1c06';
    mx.strokeText('x' + v, 0, 2);
    mx.shadowColor = 'transparent';
    const tg = mx.createLinearGradient(0, -22, 0, 22);
    if (hot) { tg.addColorStop(0, '#ffd9c0'); tg.addColorStop(.5, '#ff6a2a'); tg.addColorStop(1, '#a51208'); }
    else if (warm) { tg.addColorStop(0, '#fff0b8'); tg.addColorStop(.5, '#ffae35'); tg.addColorStop(1, '#b34508'); }
    else { tg.addColorStop(0, '#fff3c4'); tg.addColorStop(.45, '#ffd86b'); tg.addColorStop(1, '#9c6c12'); }
    mx.fillStyle = locked ? tg : 'rgba(190,170,120,.65)';
    mx.fillText('x' + v, 0, 2);
    mx.restore();
  }
}

/* ----- ornate antique-bronze frame (matches the reference buttons) ----- */
const frameDeco = document.getElementById('frame-deco');
function paintFrameDeco() {
  const w = frameDeco.offsetWidth, h = frameDeco.offsetHeight;
  if (!w || !h) return;
  frameDeco.width = w; frameDeco.height = h;
  const x = frameDeco.getContext('2d');
  const band = 17, R = 20;

  // bronze band with metallic banding
  const ring = new Path2D();
  ring.roundRect(1.5, 1.5, w - 3, h - 3, R);
  ring.roundRect(band, band, w - band * 2, h - band * 2, R - 9);
  const bg = x.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#7c5a22');
  bg.addColorStop(0.18, '#3a2810');
  bg.addColorStop(0.5, '#8a6428');
  bg.addColorStop(0.82, '#2c1d0a');
  bg.addColorStop(1, '#6b4a1e');
  x.fillStyle = bg;
  x.fill(ring, 'evenodd');

  x.save();
  x.clip(ring, 'evenodd');
  // aged patina speckle
  for (let i = 0; i < 800; i++) {
    x.fillStyle = Math.random() < 0.5 ? 'rgba(18,9,2,.16)' : 'rgba(240,210,140,.09)';
    x.fillRect(Math.random() * w, Math.random() * h, 1.7, 1.7);
  }
  // greek meander engraving along all four sides
  x.strokeStyle = 'rgba(240,205,120,.7)';
  x.lineWidth = 1.9;
  x.lineJoin = 'miter';
  const u = 23, s = 9, mid = (band - s) / 2 + 1.5;
  const key = (ox, oy) => {
    x.moveTo(ox, oy + s);
    x.lineTo(ox, oy);
    x.lineTo(ox + u * 0.74, oy);
    x.lineTo(ox + u * 0.74, oy + s * 0.64);
    x.lineTo(ox + u * 0.32, oy + s * 0.64);
    x.lineTo(ox + u * 0.32, oy + s * 0.32);
    x.lineTo(ox + u * 0.52, oy + s * 0.32);
  };
  const row = len => {
    x.beginPath();
    for (let ox = R + 16; ox < len - R - 16 - u; ox += u) key(ox, mid);
    x.stroke();
  };
  row(w);                                                                   // top
  x.save(); x.translate(0, h); x.scale(1, -1); row(w); x.restore();         // bottom
  x.save(); x.translate(0, h); x.rotate(-Math.PI / 2); row(h); x.restore(); // left
  x.save(); x.translate(w, 0); x.rotate(Math.PI / 2); row(h); x.restore();  // right
  x.restore();

  // chiselled edge lines
  x.lineWidth = 2.5; x.strokeStyle = '#120a04';
  x.beginPath(); x.roundRect(1.5, 1.5, w - 3, h - 3, R); x.stroke();
  x.lineWidth = 1.4; x.strokeStyle = 'rgba(240,210,140,.85)';
  x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, R - 2); x.stroke();
  x.lineWidth = 2.2; x.strokeStyle = '#120a04';
  x.beginPath(); x.roundRect(band, band, w - band * 2, h - band * 2, R - 9); x.stroke();
  x.lineWidth = 1.3; x.strokeStyle = 'rgba(240,210,140,.7)';
  x.beginPath(); x.roundRect(band - 2.5, band - 2.5, w - (band - 2.5) * 2, h - (band - 2.5) * 2, R - 8); x.stroke();

  // gem medallions, same language as the reference buttons
  const med = (cx, cy, r, kind) => {
    const mg = x.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.2, cx, cy, r);
    mg.addColorStop(0, '#caa14e'); mg.addColorStop(0.55, '#8a6428'); mg.addColorStop(1, '#2c1d0a');
    x.fillStyle = mg;
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    x.lineWidth = 2; x.strokeStyle = '#120a04'; x.stroke();
    x.lineWidth = 1.2; x.strokeStyle = 'rgba(240,210,140,.85)';
    x.beginPath(); x.arc(cx, cy, r - 2.4, 0, Math.PI * 2); x.stroke();
    const gr = r * 0.45;
    const gg = x.createRadialGradient(cx - gr * 0.35, cy - gr * 0.4, gr * 0.15, cx, cy, gr);
    if (kind === 'red') {
      gg.addColorStop(0, '#ffc8c0'); gg.addColorStop(0.5, '#d92a22'); gg.addColorStop(1, '#4a0406');
      x.shadowColor = 'rgba(255,60,40,.85)';
    } else {
      gg.addColorStop(0, '#cfe2ff'); gg.addColorStop(0.5, '#2a62c8'); gg.addColorStop(1, '#0a1c4a');
      x.shadowColor = 'rgba(70,130,255,.85)';
    }
    x.shadowBlur = 10;
    x.fillStyle = gg;
    x.beginPath(); x.arc(cx, cy, gr, 0, Math.PI * 2); x.fill();
    x.shadowColor = 'transparent'; x.shadowBlur = 0;
    x.lineWidth = 1.4; x.strokeStyle = '#5e431a'; x.stroke();
    x.fillStyle = 'rgba(255,255,255,.85)';
    x.beginPath(); x.arc(cx - gr * 0.3, cy - gr * 0.35, gr * 0.22, 0, Math.PI * 2); x.fill();
  };
  med(band + 1, band + 1, 15, 'red');
  med(w - band - 1, band + 1, 15, 'red');
  med(band + 1, h - band - 1, 15, 'blue');
  med(w - band - 1, h - band - 1, 15, 'blue');
  med(band / 2 + 1.5, h / 2, 11, 'red');
  med(w - band / 2 - 1.5, h / 2, 11, 'red');

  // winged crest peeking out beside the ways banner
  const feather = (fx, fy, ang, len, wdt) => {
    x.save(); x.translate(fx, fy); x.rotate(ang);
    const fg = x.createLinearGradient(0, 0, len, 0);
    fg.addColorStop(0, '#8a6428'); fg.addColorStop(0.6, '#d8b15c'); fg.addColorStop(1, '#f0dca0');
    x.fillStyle = fg;
    x.beginPath(); x.ellipse(len / 2, 0, len / 2, wdt, 0, 0, Math.PI * 2); x.fill();
    x.lineWidth = 1; x.strokeStyle = 'rgba(18,10,4,.8)'; x.stroke();
    x.restore();
  };
  for (let i = 0; i < 5; i++) {
    const ang = (i - 2) * 0.15, len = 58 - Math.abs(i - 2) * 9, wd = 5 - Math.abs(i - 2) * 0.6;
    feather(w / 2 - 118, 14, Math.PI - ang, len, wd);
    feather(w / 2 + 118, 14, ang, len, wd);
  }
}

/* ----- background ----- */
const staticBg = document.createElement('canvas');
staticBg.width = 720; staticBg.height = 1280;

/* guardian statues (provided artwork) flank the controls */
const statues = { left: new Image(), right: new Image(), ready: 0 };
['left', 'right'].forEach(k => {
  statues[k].onload = () => { statues.ready++; if (statues.ready === 2) paintStaticBg(); };
  statues[k].src = `assets/statue-${k}.png`;
});
function paintStaticBg() {
  const x = staticBg.getContext('2d');
  // temple interior
  let g = x.createLinearGradient(0, 0, 0, 1280);
  g.addColorStop(0, '#241a3d');
  g.addColorStop(0.4, '#150e28');
  g.addColorStop(1, '#070510');
  x.fillStyle = g;
  x.fillRect(0, 0, 720, 1280);

  // central light shaft
  g = x.createRadialGradient(360, 240, 30, 360, 380, 460);
  g.addColorStop(0, 'rgba(160,190,255,.30)');
  g.addColorStop(0.4, 'rgba(110,120,220,.12)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 720, 900);

  // columns
  [[0, 60], [660, 60]].forEach(([px]) => {
    const cg = x.createLinearGradient(px, 0, px + 60, 0);
    cg.addColorStop(0, '#1e1733'); cg.addColorStop(0.5, '#352a52'); cg.addColorStop(1, '#141022');
    x.fillStyle = cg;
    x.fillRect(px, 0, 60, 1100);
    x.fillStyle = 'rgba(200,160,70,.16)';
    for (let y = 60; y < 1060; y += 90) x.fillRect(px + 6, y, 48, 7);
  });

  // hieroglyph wall panels (subtle)
  x.fillStyle = 'rgba(220,190,120,.05)';
  x.strokeStyle = 'rgba(220,190,120,.07)';
  let seed = 9;
  const sr = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 90; i++) {
    const gx = 80 + sr() * 560, gy = 90 + sr() * 380, t = sr();
    x.lineWidth = 2;
    if (t < 0.33) { x.strokeRect(gx, gy, 10 + sr() * 12, 14 + sr() * 14); }
    else if (t < 0.66) { x.beginPath(); x.arc(gx, gy, 5 + sr() * 6, 0, Math.PI * 2); x.stroke(); }
    else { x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx + 14, gy + 4); x.lineTo(gx + 4, gy + 16); x.closePath(); x.stroke(); }
  }

  // procedural silhouettes only until the statue artwork is loaded
  if (statues.ready < 2)
    [[susStatue, 80, 1], [susStatue, 640, -1]].forEach(([fn, px, dir]) => fn(x, px, 1062, dir));
  function susStatue(x, cx, by, dir) {
    x.save();
    x.translate(cx, by);
    x.scale(dir, 1);
    x.fillStyle = '#0d0a18';
    x.strokeStyle = 'rgba(200,160,70,.4)';
    x.lineWidth = 2;
    x.beginPath();
    // seated jackal silhouette
    x.moveTo(-58, 0);
    x.lineTo(-58, -26); x.lineTo(-30, -34);
    x.quadraticCurveTo(-26, -90, 2, -104);          // back
    x.quadraticCurveTo(8, -130, 22, -132);          // neck
    x.lineTo(20, -154); x.lineTo(30, -134);          // ear
    x.quadraticCurveTo(48, -132, 56, -120);          // head
    x.lineTo(70, -112);                              // snout
    x.quadraticCurveTo(56, -104, 46, -102);
    x.quadraticCurveTo(44, -60, 40, -34);            // chest
    x.lineTo(58, -26); x.lineTo(58, 0);
    x.closePath();
    x.fill(); x.stroke();
    // pedestal
    x.fillStyle = '#120e20';
    x.fillRect(-70, 0, 140, 26);
    x.strokeRect(-70, 0, 140, 26);
    x.restore();
  }

  // stone floor
  g = x.createLinearGradient(0, 1080, 0, 1280);
  g.addColorStop(0, '#221a33'); g.addColorStop(1, '#0a0714');
  x.fillStyle = g;
  x.fillRect(0, 1088, 720, 192);
  x.strokeStyle = 'rgba(0,0,0,.5)';
  x.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const y = 1100 + i * 36;
    x.beginPath(); x.moveTo(0, y); x.lineTo(720, y); x.stroke();
  }

  // fire bowls
  [[86, 1218], [634, 1218]].forEach(([px, py]) => {
    const bg2 = x.createLinearGradient(0, py - 26, 0, py + 30);
    bg2.addColorStop(0, '#3a2c14'); bg2.addColorStop(1, '#0d0905');
    x.fillStyle = bg2;
    x.beginPath();
    x.moveTo(px - 56, py - 22);
    x.quadraticCurveTo(px, py + 38, px + 56, py - 22);
    x.closePath();
    x.fill();
    x.strokeStyle = '#c9a24a'; x.lineWidth = 3;
    x.beginPath();
    x.moveTo(px - 56, py - 22); x.lineTo(px + 56, py - 22);
    x.stroke();
  });
}

/* particles: flames, sparks, embers, dust, coins */
const flames = [], sparks = [], dust = [], coins = [];
const BOWLS = [[86, 1198], [634, 1198]];
for (let i = 0; i < 26; i++)
  dust.push({ x: rnd(0, 720), y: rnd(0, 1280), s: rnd(0.8, 2.4), v: rnd(4, 14), p: rnd(0, 7) });

function spawnFlames() {
  BOWLS.forEach(([px, py]) => {
    for (let i = 0; i < 4; i++)
      flames.push({
        x: px + rnd(-24, 24), y: py + rnd(-2, 6),
        vx: rnd(-0.25, 0.25), vy: rnd(-3.9, -1.8),
        life: 1, decay: rnd(0.026, 0.048),
        r: rnd(10, 23), wob: rnd(0, 7), ws: rnd(2, 4)
      });
    if (Math.random() < 0.85)
      sparks.push({
        x: px + rnd(-22, 22), y: py - rnd(0, 14),
        vx: rnd(-0.7, 0.7), vy: rnd(-6, -2.6),
        life: 1, decay: rnd(0.008, 0.02), r: rnd(1.2, 2.8), tw: rnd(0, 7)
      });
  });
  // embers drifting up behind the spin button
  if (Math.random() < 0.4)
    sparks.push({
      x: 360 + rnd(-85, 85), y: 1258,
      vx: rnd(-0.4, 0.4), vy: rnd(-3.2, -1.4),
      life: 1, decay: rnd(0.012, 0.024), r: rnd(1, 2.4), tw: rnd(0, 7)
    });
}

function burstCoins(n) {
  for (let i = 0; i < n; i++)
    coins.push({
      x: rnd(160, 560), y: rnd(380, 560),
      vx: rnd(-5, 5), vy: rnd(-14, -5),
      r: rnd(7, 13), rot: rnd(0, 7), vr: rnd(-0.25, 0.25), life: 1
    });
}

function drawBg(now, dt) {
  bx.clearRect(0, 0, 720, 1280);
  bx.drawImage(staticBg, 0, 0);

  // flicker on the light shaft
  bx.globalAlpha = 0.06 + 0.04 * Math.sin(now / 320) + 0.02 * Math.sin(now / 117);
  const fg = bx.createRadialGradient(360, 300, 20, 360, 380, 420);
  fg.addColorStop(0, '#ffce8a'); fg.addColorStop(1, 'rgba(255,180,90,0)');
  bx.fillStyle = fg;
  bx.fillRect(0, 0, 720, 820);
  bx.globalAlpha = 1;

  // guardian statues with breathing golden aura and firelight flicker
  if (statues.ready === 2) {
    const H = 312, W = Math.round(260 * H / 460);
    [[statues.left, 88], [statues.right, 632]].forEach(([img, cx], i) => {
      const pulse = 0.6 + 0.25 * Math.sin(now / 480 + i * 2.4) + 0.15 * Math.sin(now / 90 + i);
      bx.save();
      bx.globalCompositeOperation = 'lighter';
      let g = bx.createRadialGradient(cx, 1060, 10, cx, 1060, 170);
      g.addColorStop(0, `rgba(255,190,80,${0.16 * pulse})`);
      g.addColorStop(0.55, `rgba(255,140,40,${0.08 * pulse})`);
      g.addColorStop(1, 'rgba(120,40,0,0)');
      bx.fillStyle = g;
      bx.beginPath(); bx.arc(cx, 1060, 170, 0, Math.PI * 2); bx.fill();
      bx.restore();

      bx.save();
      bx.shadowColor = 'rgba(0,0,0,.85)';
      bx.shadowBlur = 22;
      bx.shadowOffsetY = 10;
      bx.drawImage(img, cx - W / 2, 1206 - H, W, H);
      bx.restore();

      // firelight licking the gold trim
      bx.save();
      bx.globalCompositeOperation = 'lighter';
      bx.globalAlpha = 0.05 + 0.05 * Math.sin(now / 130 + i * 3.1);
      bx.drawImage(img, cx - W / 2, 1206 - H, W, H);
      bx.restore();
    });
  }

  // dust
  bx.fillStyle = 'rgba(230,210,160,.5)';
  for (const d of dust) {
    d.y -= d.v * dt; d.p += dt;
    if (d.y < -5) { d.y = 1285; d.x = rnd(0, 720); }
    bx.globalAlpha = 0.12 + 0.1 * Math.sin(d.p);
    bx.beginPath(); bx.arc(d.x + Math.sin(d.p) * 14, d.y, d.s, 0, Math.PI * 2); bx.fill();
  }
  bx.globalAlpha = 1;

  // fire (additive): pulsing ground glow, layered teardrop flames, twinkling sparks
  spawnFlames();
  bx.globalCompositeOperation = 'lighter';

  for (const [px, py] of BOWLS) {
    const pulse = 0.7 + 0.18 * Math.sin(now / 140 + px) + 0.12 * Math.sin(now / 47 + px * 2);
    let g = bx.createRadialGradient(px, py - 14, 6, px, py - 14, 150 * pulse);
    g.addColorStop(0, `rgba(255,150,40,${0.20 * pulse})`);
    g.addColorStop(0.45, `rgba(220,80,15,${0.10 * pulse})`);
    g.addColorStop(1, 'rgba(120,20,0,0)');
    bx.fillStyle = g;
    bx.beginPath(); bx.arc(px, py - 14, 150 * pulse, 0, Math.PI * 2); bx.fill();
    // hot core sitting in the bowl
    g = bx.createRadialGradient(px, py - 8, 1, px, py - 8, 36);
    g.addColorStop(0, `rgba(255,235,170,${0.5 * pulse})`);
    g.addColorStop(0.5, `rgba(255,150,40,${0.3 * pulse})`);
    g.addColorStop(1, 'rgba(200,60,0,0)');
    bx.fillStyle = g;
    bx.beginPath(); bx.arc(px, py - 8, 36, 0, Math.PI * 2); bx.fill();
  }

  for (let i = flames.length - 1; i >= 0; i--) {
    const f = flames[i];
    f.x += f.vx + Math.sin(f.wob + (1 - f.life) * f.ws * 2) * 0.5;
    f.y += f.vy;
    f.life -= f.decay + dt * 0.25;
    f.r *= 0.975;
    if (f.life <= 0 || f.r < 1.5) { flames.splice(i, 1); continue; }
    const l = f.life;
    // teardrop: bright round base + stretched tip above
    let fg2 = bx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
    if (l > 0.65) {
      fg2.addColorStop(0, `rgba(255,240,190,${0.55 * l})`);
      fg2.addColorStop(0.45, `rgba(255,180,50,${0.4 * l})`);
    } else {
      fg2.addColorStop(0, `rgba(255,${(160 * l + 40) | 0},30,${0.45 * l})`);
      fg2.addColorStop(0.45, `rgba(235,${(80 * l) | 0},8,${0.26 * l})`);
    }
    fg2.addColorStop(1, 'rgba(110,8,0,0)');
    bx.fillStyle = fg2;
    bx.beginPath(); bx.arc(f.x, f.y, f.r, 0, Math.PI * 2); bx.fill();
    bx.save();
    bx.translate(f.x, f.y - f.r * 0.9);
    bx.scale(0.55, 1.5);
    bx.fillStyle = fg2;
    bx.globalAlpha = 0.5;
    bx.beginPath(); bx.arc(0, 0, f.r * 0.6, 0, Math.PI * 2); bx.fill();
    bx.restore();
    bx.globalAlpha = 1;
  }

  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.x += s.vx + Math.sin(now / 90 + s.tw) * 0.5;
    s.y += s.vy; s.vy *= 0.995;
    s.life -= s.decay;
    if (s.life <= 0 || s.y < 700) { sparks.splice(i, 1); continue; }
    const fl = 0.5 + 0.5 * Math.sin(now / 35 + s.tw * 3);
    bx.fillStyle = `rgba(255,${(150 + 80 * s.life) | 0},70,${s.life * (0.4 + 0.6 * fl)})`;
    bx.beginPath(); bx.arc(s.x, s.y, s.r * (0.6 + 0.4 * s.life), 0, Math.PI * 2); bx.fill();
  }
  bx.globalCompositeOperation = 'source-over';

  // coins
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.x += c.vx; c.vy += 0.45; c.y += c.vy; c.rot += c.vr;
    if (c.y > 1320) { coins.splice(i, 1); continue; }
    const sx = Math.abs(Math.cos(c.rot));
    bx.save();
    bx.translate(c.x, c.y);
    bx.scale(Math.max(0.15, sx), 1);
    const cg = bx.createRadialGradient(-c.r * 0.3, -c.r * 0.3, 1, 0, 0, c.r);
    cg.addColorStop(0, '#fff3c4'); cg.addColorStop(0.5, '#ffce53'); cg.addColorStop(1, '#8f5d0e');
    bx.fillStyle = cg;
    bx.beginPath(); bx.arc(0, 0, c.r, 0, Math.PI * 2); bx.fill();
    bx.strokeStyle = '#6b4408'; bx.lineWidth = 1.5; bx.stroke();
    bx.restore();
  }
}

/* ---------------- main loop ---------------- */
let lastT = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  drawBg(now, dt);
  drawReels(now);
  drawMults(now);
  requestAnimationFrame(loop);
}

/* ================= game flow ================= */
function setBalance(v) {
  state.balance = Math.round(v * 100) / 100;
  localStorage.setItem('aw_balance', state.balance);
  el.balance.textContent = fmt(state.balance);
}
function setWin(v) { state.lastWin = v; el.win.textContent = fmt(v); }
function setBet() { el.bet.textContent = fmt(bet()); el.fbCost.textContent = fmt(bet() * FEATURE_BUY_X); }

function toast(msg, ms = 2200) {
  el.toast.textContent = msg;
  el.toast.classList.remove('hidden');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.toast.classList.add('hidden'), ms);
}

function turboT(ms) { return state.turbo ? ms * 0.4 : ms; }

function shakeFx() {
  [el.bg, el.gameUi].forEach(n => {
    n.classList.remove('shake'); void n.offsetWidth;
    n.classList.add('shake');
    setTimeout(() => n.classList.remove('shake'), 620);
  });
}
function flashFx() {
  el.flash.classList.remove('go'); void el.flash.offsetWidth;
  el.flash.classList.add('go');
}

async function doSpin({ free = false } = {}) {
  if (state.spinning) return;

  if (!free) {
    if (state.balance < bet()) {
      setBalance(state.balance + START_BALANCE);
      toast('DEMO CREDITS REFILLED +' + fmt(START_BALANCE));
    }
    setBalance(state.balance - bet());
  }
  setWin(0);
  state.winCells.clear();
  state.scatterCells.clear();
  state.quickStop = false;

  // outcome decided up-front; reels animate to it
  state.grid = genResult();
  state.mults = genMults();
  const result = evaluate(state.grid, state.mults);

  // anticipation: 2+ scatters already promised on earlier reels
  const scPerReel = state.grid.map(col => col.filter(s => s === 'scatter').length);

  state.spinning = true;
  el.spin.classList.add('spinning');
  SND.spinStart();

  const base = turboT(900), gap = turboT(260);
  const now0 = performance.now();
  let extra = 0, anticipated = false;
  for (let c = 0; c < COLS; c++) {
    const R = reels[c];
    const before = scPerReel.slice(0, c).reduce((a, b) => a + b, 0);
    R.anticipation = c >= 3 && before >= 2 && !state.turbo;
    if (R.anticipation) {
      extra += 1300;
      if (!anticipated) { anticipated = true; setTimeout(() => SND.anticipation(), base + c * gap); }
    }
    R.dur = base + c * gap + extra;
    R.travel = Math.round(14 + c * 4 + extra / 90);
    R.fullStrip = buildStrip(c, state.grid[c], R.travel);
    R.start = now0;
    R.spinning = true;
    R.landed = false;
    state.multLock[c] = false;
  }
  state.multFlash = [0, 0, 0, 0, 0];

  // lock multipliers + scatter stings as reels land
  let landedCount = 0;
  await new Promise(resolve => {
    const iv = setInterval(() => {
      for (let c = 0; c < COLS; c++) {
        const R = reels[c];
        if (R.landed && !state.multLock[c]) {
          state.multLock[c] = true;
          state.multFlash[c] = performance.now();
          landedCount++;
          if (scPerReel[c] > 0) {
            const sc = scPerReel.slice(0, c + 1).reduce((a, b) => a + b, 0);
            for (let r = 0; r < ROWS; r++)
              if (state.grid[c][r] === 'scatter') state.scatterCells.add(c + ',' + r);
            SND.scatter(sc);
          }
        }
      }
      if (reels.every(R => !R.spinning)) { clearInterval(iv); resolve(); }
    }, 40);
  });

  state.spinning = false;
  el.spin.classList.remove('spinning');
  state.scatterCells.clear();

  return result;
}

async function presentWin(result) {
  if (result.total <= 0) return;

  state.winCells = new Set([...result.cells, ...result.scCells]);
  const level = result.total >= bet() * 5 ? 2 : result.total >= bet() ? 1 : 0;
  SND.win(level);
  burstCoins(Math.min(60, 6 + Math.round(result.total / bet() * 4)));

  // count-up with floating win plate over the reels
  el.winPlate.classList.remove('hidden');
  const dur = turboT(result.total >= bet() * 3 ? 1500 : 900);
  const t0 = performance.now();
  let lastCoin = 0;
  await new Promise(resolve => {
    function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      setWin(result.total * p);
      el.winPlate.textContent = 'WIN ' + fmt(result.total * p);
      if (now - lastCoin > 90) { SND.coin(); lastCoin = now; }
      if (p < 1) requestAnimationFrame(step); else resolve();
    }
    requestAnimationFrame(step);
  });
  setWin(result.total);
  el.winPlate.textContent = 'WIN ' + fmt(result.total);

  if (state.inFree) state.fsTotal += result.total;
  setBalance(state.balance + result.total);

  // big win celebration
  const xBet = result.total / bet();
  if (xBet >= 10) {
    el.bigwinTitle.textContent = xBet >= 80 ? 'EPIC WIN' : xBet >= 30 ? 'MEGA WIN' : 'BIG WIN';
    el.bigwinAmount.textContent = fmt(0);
    el.bigwin.classList.remove('hidden');
    SND.bigwin();
    shakeFx();
    flashFx();
    burstCoins(80);
    const bw0 = performance.now(), bwDur = 2600;
    let skipped = false;
    const skip = () => { skipped = true; };
    el.bigwin.addEventListener('pointerdown', skip);
    await new Promise(resolve => {
      function step(now) {
        const p = skipped ? 1 : Math.min(1, (now - bw0) / bwDur);
        el.bigwinAmount.textContent = fmt(result.total * p);
        if (p < 1) requestAnimationFrame(step); else resolve();
      }
      requestAnimationFrame(step);
    });
    el.bigwin.removeEventListener('pointerdown', skip);
    await sleep(900);
    el.bigwin.classList.add('hidden');
  } else {
    await sleep(turboT(1100));
  }
  el.winPlate.classList.add('hidden');
  state.winCells.clear();
}

async function round({ free = false } = {}) {
  const result = await doSpin({ free });
  if (!result) return;
  await presentWin(result);

  // free spins trigger / retrigger
  if (result.freeSpins > 0) {
    if (!state.inFree) {
      SND.fsTrigger();
      flashFx();
      shakeFx();
      await sleep(450);
      await startFreeSpins(result.freeSpins);
    } else {
      state.freeSpins += 5;
      el.fsLeft.textContent = state.freeSpins;
      toast('+5 FREE SPINS!');
      SND.fsTrigger();
      flashFx();
      await sleep(1000);
    }
  }
}

async function startFreeSpins(n) {
  state.auto = 0;
  updateAutoUi();
  el.fsIntroNum.textContent = n;
  el.fsIntro.classList.remove('hidden');
  await new Promise(resolve => {
    const go = () => { el.fsIntro.classList.add('hidden'); resolve(); };
    el.fsStart.onclick = () => { SND.click(); go(); };
    setTimeout(go, 3500);
  });

  state.inFree = true;
  state.freeSpins = n;
  state.fsTotal = 0;
  el.fsCounter.classList.remove('hidden');

  while (state.freeSpins > 0) {
    el.fsLeft.textContent = state.freeSpins;
    state.freeSpins--;
    await round({ free: true });
    await sleep(turboT(350));
  }

  state.inFree = false;
  el.fsCounter.classList.add('hidden');

  el.fsTotal.textContent = fmt(state.fsTotal);
  el.fsEnd.classList.remove('hidden');
  SND.bigwin();
  burstCoins(70);
  await new Promise(resolve => {
    const go = () => { el.fsEnd.classList.add('hidden'); resolve(); };
    el.fsCollect.onclick = () => { SND.click(); go(); };
    setTimeout(go, 6000);
  });
}

async function playRound() {
  if (state.busy) return;
  state.busy = true;
  el.fb.disabled = true;
  try {
    await round();
    while (state.auto > 0) {
      state.auto--;
      updateAutoUi();
      if (state.auto <= 0) break;
      await sleep(turboT(400));
      await round();
    }
    state.auto = 0;
    updateAutoUi();
  } finally {
    state.busy = false;
    el.fb.disabled = false;
  }
}

function quickStopReels() {
  const now = performance.now();
  for (let c = 0; c < COLS; c++) {
    const R = reels[c];
    if (!R.spinning) continue;
    R.anticipation = false;
    const elapsed = now - R.start;
    R.dur = Math.min(R.dur, elapsed + 90 + c * 55);
  }
}

/* ---------------- ui wiring ---------------- */
function updateAutoUi() {
  if (state.auto > 0) {
    el.spinCount.textContent = state.auto;
    el.spinCount.classList.remove('hidden');
    el.spin.classList.add('autoplay');
    el.auto.classList.add('active');
  } else {
    el.spinCount.classList.add('hidden');
    el.spin.classList.remove('autoplay');
    el.auto.classList.remove('active');
  }
}

el.spin.addEventListener('click', () => {
  SND.init();
  if (state.spinning) { quickStopReels(); return; }
  if (state.auto > 0) { state.auto = 0; updateAutoUi(); return; }
  if (state.busy) return;
  SND.click();
  playRound();
});

el.turbo.addEventListener('click', () => {
  SND.init(); SND.click();
  state.turbo = !state.turbo;
  el.turbo.classList.toggle('active', state.turbo);
});

el.plus.addEventListener('click', () => {
  if (state.busy) return;
  SND.init(); SND.blip(1);
  state.betIdx = Math.min(BETS.length - 1, state.betIdx + 1);
  setBet();
});
el.minus.addEventListener('click', () => {
  if (state.busy) return;
  SND.init(); SND.blip(0);
  state.betIdx = Math.max(0, state.betIdx - 1);
  setBet();
});

el.auto.addEventListener('click', () => {
  SND.init(); SND.click();
  if (state.auto > 0) { state.auto = 0; updateAutoUi(); return; }
  if (state.busy) return;
  SND.open();
  el.autoDlg.classList.remove('hidden');
});
el.autoDlg.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
  SND.click();
  state.auto = parseInt(b.textContent, 10);
  el.autoDlg.classList.add('hidden');
  updateAutoUi();
  playRound();
}));
el.autoCancel.addEventListener('click', () => { SND.close(); el.autoDlg.classList.add('hidden'); });

el.fb.addEventListener('click', () => {
  if (state.busy) return;
  SND.init(); SND.open();
  el.buyCost.textContent = fmt(bet() * FEATURE_BUY_X);
  el.buyDlg.classList.remove('hidden');
});
el.buyNo.addEventListener('click', () => { SND.close(); el.buyDlg.classList.add('hidden'); });
el.buyOk.addEventListener('click', async () => {
  el.buyDlg.classList.add('hidden');
  if (state.busy) return;
  const cost = bet() * FEATURE_BUY_X;
  if (state.balance < cost) {
    setBalance(state.balance + START_BALANCE);
    toast('DEMO CREDITS REFILLED +' + fmt(START_BALANCE));
  }
  setBalance(state.balance - cost);
  SND.buy();
  state.busy = true;
  el.fb.disabled = true;
  try {
    SND.fsTrigger();
    await startFreeSpins(15);
  } finally {
    state.busy = false;
    el.fb.disabled = false;
  }
});

el.sound.addEventListener('click', () => {
  SND.init();
  SND.setMuted(!SND.isMuted());
  el.sound.classList.toggle('muted', SND.isMuted());
  if (!SND.isMuted()) SND.click();
});

/* paytable */
function buildPaytable() {
  const rows = [];
  const unitNote = 'per way × BET/100, then × the multiplier above the last reel of the way';
  for (const sym of PAY_ORDER) {
    const p = SYMS[sym].pay;
    rows.push({ sym, txt: `5 — <b>${p[5]}</b> &nbsp; 4 — <b>${p[4]}</b> &nbsp; 3 — <b>${p[3]}</b>` });
  }
  el.paytableBody.innerHTML = '';
  const mk = (sym, html) => {
    const row = document.createElement('div');
    row.className = 'pt-row';
    const cv = document.createElement('canvas');
    cv.width = cv.height = 76;
    cv.getContext('2d').drawImage(SymbolArt.get(sym), 0, 0, 76, 76);
    const t = document.createElement('div');
    t.className = 'pt-pays';
    t.innerHTML = html;
    row.append(cv, t);
    el.paytableBody.appendChild(row);
  };
  mk('wild', '<b>WILD</b> — substitutes for all symbols except SCATTER.<br>Appears on reels 2, 3 and 4.');
  mk('scatter', '<b>SCATTER</b> — 3 / 4 / 5 anywhere pay <b>2x / 10x / 50x</b> bet<br>and award <b>15 / 20 / 25 FREE SPINS</b>.');
  for (const r of rows) mk(r.sym, r.txt);
  const note = document.createElement('div');
  note.className = 'pt-note';
  note.innerHTML =
    `<b>1024 WAYS:</b> matching symbols on consecutive reels from the left, any row. ` +
    `Symbol pays are ${unitNote}. Multiplier reels show up to <b>x500</b>. ` +
    `Free spins use a richer multiplier table. 3 scatters during free spins award +5 spins. ` +
    `FEATURE BUY costs ${FEATURE_BUY_X}x bet and awards 15 free spins. ` +
    `Demo game by BET 777 — play money only, for entertainment.`;
  el.paytableBody.appendChild(note);
}
el.info.addEventListener('click', () => {
  SND.init(); SND.open();
  buildPaytable();
  el.paytable.classList.remove('hidden');
});
el.paytableClose.addEventListener('click', () => { SND.close(); el.paytable.classList.add('hidden'); });

/* ticker */
let tickerIdx = 0;
setInterval(() => {
  tickerIdx = (tickerIdx + 1) % TICKER_MSGS.length;
  el.ticker.style.animation = 'none';
  void el.ticker.offsetWidth;
  el.ticker.style.animation = '';
  el.ticker.textContent = TICKER_MSGS[tickerIdx];
}, 5000);

/* ---------------- scaling ---------------- */
function fit() {
  const s = Math.min(window.innerWidth / 720, window.innerHeight / 1280);
  el.stage.style.transform = `scale(${s})`;
}
window.addEventListener('resize', fit);

/* ---------------- loader ---------------- */
function runLoader() {
  // bar tracks real artwork loading (last 76%) then releases the enter button
  let p = 0, target = 24;
  SymbolArt.preload(prog => { target = 24 + prog * 76; })
    .then(() => { target = 100; });
  const iv = setInterval(() => {
    p = Math.min(target, p + rnd(2, 6));
    el.loaderFill.style.width = p + '%';
    el.loaderPct.textContent = `Loading Game  [${p | 0}%]`;
    if (p >= 100) {
      clearInterval(iv);
      el.loaderPct.classList.add('hidden');
      el.loaderEnter.classList.remove('hidden');
    }
  }, 110);
  el.loaderEnter.addEventListener('click', () => {
    SND.init(); SND.click();
    el.loader.classList.add('hidden');
  });
}

/* ---------------- boot ---------------- */
function boot() {
  fit();
  paintStaticBg();
  initReels();
  setBet();
  setBalance(state.balance);
  setWin(0);
  runLoader();
  requestAnimationFrame(loop);
  requestAnimationFrame(paintFrameDeco);
  // re-render symbols once the Cinzel webfont is available
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { SymbolArt.rebuild(); paintFrameDeco(); });
  }
}
boot();

})();
