/* Anubis Wrath — BET 777 : procedural high-detail symbol art (canvas, no image assets) */
const SymbolArt = (() => {
  const SIZE = 220;
  const cache = {};

  /* ---------- helpers ---------- */
  function make(draw) {
    const c = document.createElement('canvas');
    c.width = c.height = SIZE;
    const x = c.getContext('2d');
    draw(x);
    return c;
  }

  function goldGrad(x, y0, y1) {
    const g = x.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0.00, '#fff6cf');
    g.addColorStop(0.18, '#ffdf7e');
    g.addColorStop(0.40, '#c8901f');
    g.addColorStop(0.52, '#8f5d0e');
    g.addColorStop(0.66, '#eebc4a');
    g.addColorStop(0.85, '#a3741a');
    g.addColorStop(1.00, '#5e3c06');
    return g;
  }

  function darkGoldGrad(x, y0, y1) {
    const g = x.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#d8a93c');
    g.addColorStop(0.5, '#7a4d10');
    g.addColorStop(1, '#3e2604');
    return g;
  }

  function roundRect(x, px, py, w, h, r) {
    x.moveTo(px + r, py);
    x.arcTo(px + w, py, px + w, py + h, r);
    x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r);
    x.arcTo(px, py, px + w, py, r);
    x.closePath();
  }

  function gem(x, cx, cy, r, hue, sat = 92) {
    x.save();
    // glow
    x.shadowColor = `hsla(${hue},${sat}%,60%,.9)`;
    x.shadowBlur = r * 0.9;
    const g = x.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.08, cx, cy, r);
    g.addColorStop(0, `hsl(${hue},${sat}%,88%)`);
    g.addColorStop(0.35, `hsl(${hue},${sat}%,58%)`);
    g.addColorStop(0.8, `hsl(${hue},${sat}%,30%)`);
    g.addColorStop(1, `hsl(${hue},${sat}%,14%)`);
    x.fillStyle = g;
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    x.shadowColor = 'transparent';
    // bezel
    x.lineWidth = Math.max(2, r * 0.22);
    x.strokeStyle = '#caa24a';
    x.stroke();
    x.lineWidth = 1.2;
    x.strokeStyle = '#5e3c06';
    x.beginPath(); x.arc(cx, cy, r + Math.max(2, r * 0.22) / 2, 0, Math.PI * 2); x.stroke();
    // sparkle
    x.fillStyle = 'rgba(255,255,255,.95)';
    x.beginPath(); x.arc(cx - r * 0.38, cy - r * 0.42, r * 0.16, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,.5)';
    x.beginPath(); x.arc(cx + r * 0.3, cy + r * 0.25, r * 0.09, 0, Math.PI * 2); x.fill();
    x.restore();
  }

  function banner(x, cy, text, c1, c2) {
    x.save();
    const w = 178, h = 42, px = (SIZE - w) / 2;
    x.shadowColor = 'rgba(0,0,0,.85)'; x.shadowBlur = 10; x.shadowOffsetY = 4;
    const g = x.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
    g.addColorStop(0, c1); g.addColorStop(0.5, c2); g.addColorStop(1, '#1a0202');
    x.fillStyle = g;
    x.beginPath();
    // ribbon with notched ends
    x.moveTo(px, cy - h / 2);
    x.lineTo(px + w, cy - h / 2);
    x.lineTo(px + w - 10, cy);
    x.lineTo(px + w, cy + h / 2);
    x.lineTo(px, cy + h / 2);
    x.lineTo(px + 10, cy);
    x.closePath();
    x.fill();
    x.shadowColor = 'transparent';
    x.lineWidth = 2.5; x.strokeStyle = '#e8c560'; x.stroke();
    x.font = `900 27px Cinzel, "Times New Roman", serif`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 5; x.lineJoin = 'round';
    x.strokeStyle = '#2a0a02';
    x.strokeText(text, SIZE / 2, cy + 2);
    x.fillStyle = goldGrad(x, cy - 14, cy + 14);
    x.fillText(text, SIZE / 2, cy + 2);
    x.restore();
  }

  function symbolShadow(x) {
    x.shadowColor = 'rgba(0,0,0,.85)';
    x.shadowBlur = 16;
    x.shadowOffsetY = 7;
  }

  /* ---------- royals A K Q J 10 9 ---------- */
  function royal(letter, hue) {
    return make(x => {
      const cx = SIZE / 2, cy = 104;
      x.save();
      x.translate(cx, cy);
      const fs = letter.length > 1 ? 104 : 132;
      x.font = `900 ${fs}px Cinzel, "Times New Roman", serif`;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.lineJoin = 'round';
      symbolShadow(x);
      x.lineWidth = 18; x.strokeStyle = '#2e1c06';
      x.strokeText(letter, 0, 0);
      x.shadowColor = 'transparent';
      x.lineWidth = 11; x.strokeStyle = '#7a4d10';
      x.strokeText(letter, 0, 0);
      x.fillStyle = goldGrad(x, -fs / 2, fs / 2);
      x.fillText(letter, 0, 0);
      // engraved inner line
      x.lineWidth = 2; x.strokeStyle = 'rgba(120,70,10,.65)';
      x.strokeText(letter, 0, -2);
      // top sheen
      x.globalAlpha = 0.35;
      x.fillStyle = '#fffbe8';
      x.fillText(letter, 0, -4);
      x.globalAlpha = 1;
      x.restore();
      gem(x, cx, 182, 15, hue);
    });
  }

  /* ---------- Ankh ---------- */
  function ankh() {
    return make(x => {
      x.save();
      x.translate(SIZE / 2, 110);
      symbolShadow(x);
      x.beginPath();
      x.ellipse(0, -48, 37, 49, 0, 0, Math.PI * 2);
      x.ellipse(0, -50, 17, 27, 0, 0, Math.PI * 2);
      roundRect(x, -64, -8, 128, 26, 9);
      roundRect(x, -14, 6, 28, 90, 9);
      x.fillStyle = goldGrad(x, -100, 96);
      x.fill('evenodd');
      x.shadowColor = 'transparent';
      x.lineWidth = 4; x.strokeStyle = '#3e2604';
      x.stroke();
      // inner loop rim highlight
      x.beginPath();
      x.ellipse(0, -50, 17, 27, 0, 0, Math.PI * 2);
      x.lineWidth = 3; x.strokeStyle = '#fff0b8';
      x.stroke();
      // engraving on bar
      x.lineWidth = 2; x.strokeStyle = 'rgba(70,42,5,.7)';
      x.beginPath(); x.moveTo(-56, 5); x.lineTo(56, 5); x.stroke();
      x.restore();
      gem(x, SIZE / 2, 115, 13, 0);
    });
  }

  /* ---------- Eye of Horus ---------- */
  function eye() {
    return make(x => {
      x.save();
      x.translate(SIZE / 2, 100);
      x.lineCap = 'round'; x.lineJoin = 'round';
      symbolShadow(x);
      const gold = goldGrad(x, -70, 80);

      // eye socket fill (lapis)
      x.beginPath();
      x.moveTo(-72, -6);
      x.quadraticCurveTo(0, -56, 72, -6);
      x.quadraticCurveTo(0, 34, -72, -6);
      x.closePath();
      const lap = x.createLinearGradient(0, -40, 0, 26);
      lap.addColorStop(0, '#2a4a8f'); lap.addColorStop(1, '#0a1530');
      x.fillStyle = lap; x.fill();
      x.shadowColor = 'transparent';

      // iris gem inside the eye
      x.save();
      x.clip();
      gem(x, 0, -8, 22, 38);
      x.restore();

      // gold outline of eye
      x.lineWidth = 12; x.strokeStyle = gold;
      x.beginPath();
      x.moveTo(-72, -6);
      x.quadraticCurveTo(0, -56, 72, -6);
      x.quadraticCurveTo(0, 34, -72, -6);
      x.closePath();
      x.stroke();
      x.lineWidth = 3; x.strokeStyle = '#3e2604';
      x.stroke();

      // brow
      x.lineWidth = 14; x.strokeStyle = gold;
      x.beginPath();
      x.moveTo(-76, -44);
      x.quadraticCurveTo(0, -86, 76, -44);
      x.stroke();
      x.lineWidth = 3; x.strokeStyle = '#3e2604'; x.stroke();

      // kohl extension (outer corner)
      x.lineWidth = 11; x.strokeStyle = gold;
      x.beginPath();
      x.moveTo(70, -4);
      x.lineTo(94, 8);
      x.stroke();

      // teardrop line
      x.beginPath();
      x.moveTo(-22, 22);
      x.quadraticCurveTo(-30, 52, -26, 74);
      x.lineTo(-44, 74);
      x.stroke();

      // spiral tail
      x.beginPath();
      x.moveTo(34, 20);
      x.quadraticCurveTo(50, 48, 44, 66);
      x.stroke();
      x.lineWidth = 9;
      x.beginPath();
      x.arc(34, 64, 12, -0.4, Math.PI * 1.4);
      x.stroke();
      x.restore();
    });
  }

  /* ---------- Scales of Judgment ---------- */
  function scales() {
    return make(x => {
      x.save();
      x.translate(SIZE / 2, 108);
      symbolShadow(x);
      const gold = goldGrad(x, -92, 96);

      // base
      x.beginPath();
      x.moveTo(-44, 92); x.lineTo(44, 92); x.lineTo(28, 70); x.lineTo(-28, 70);
      x.closePath();
      x.fillStyle = gold; x.fill();
      // post
      x.beginPath(); roundRect(x, -8, -78, 16, 150, 6);
      x.fill();
      // beam
      x.beginPath(); roundRect(x, -82, -82, 164, 13, 6);
      x.fill();
      x.shadowColor = 'transparent';
      x.lineWidth = 3; x.strokeStyle = '#3e2604';
      x.beginPath();
      x.moveTo(-44, 92); x.lineTo(44, 92); x.lineTo(28, 70); x.lineTo(-28, 70); x.closePath();
      roundRect(x, -8, -78, 16, 150, 6);
      roundRect(x, -82, -82, 164, 13, 6);
      x.stroke();

      // chains
      x.lineWidth = 3; x.strokeStyle = '#e8c560';
      [[-66, -10], [66, -10]].forEach(([px, py]) => {
        x.beginPath();
        x.moveTo(px, -68); x.lineTo(px - 18, py + 16);
        x.moveTo(px, -68); x.lineTo(px + 18, py + 16);
        x.stroke();
      });

      // pans
      [-66, 66].forEach(px => {
        x.save();
        x.shadowColor = 'rgba(0,0,0,.7)'; x.shadowBlur = 8; x.shadowOffsetY = 4;
        x.beginPath();
        x.moveTo(px - 22, 6);
        x.quadraticCurveTo(px, 34, px + 22, 6);
        x.closePath();
        x.fillStyle = gold; x.fill();
        x.shadowColor = 'transparent';
        x.lineWidth = 2.5; x.strokeStyle = '#3e2604'; x.stroke();
        x.restore();
        gem(x, px, 2, 9, px < 0 ? 275 : 200);
      });
      x.restore();
      gem(x, SIZE / 2, 18, 11, 275);
    });
  }

  /* ---------- Anubis head (premium) ---------- */
  function anubis() {
    return make(x => {
      x.save();
      x.translate(SIZE / 2, 116);
      symbolShadow(x);
      const gold = goldGrad(x, -104, 96);

      // nemes headdress flaps
      x.beginPath();
      x.moveTo(-36, -62);
      x.quadraticCurveTo(-84, -34, -76, 22);
      x.quadraticCurveTo(-72, 62, -52, 80);
      x.lineTo(-30, 56);
      x.lineTo(-32, -40);
      x.closePath();
      x.moveTo(36, -62);
      x.quadraticCurveTo(84, -34, 76, 22);
      x.quadraticCurveTo(72, 62, 52, 80);
      x.lineTo(30, 56);
      x.lineTo(32, -40);
      x.closePath();
      x.fillStyle = gold; x.fill();
      x.shadowColor = 'transparent';
      x.lineWidth = 3; x.strokeStyle = '#3e2604'; x.stroke();
      // headdress stripes
      x.lineWidth = 5; x.strokeStyle = 'rgba(30,40,90,.85)';
      for (let i = 0; i < 4; i++) {
        x.beginPath();
        x.moveTo(-40 - i * 9, -40 + i * 22);
        x.quadraticCurveTo(-58 - i * 5, 10 + i * 16, -52 - i * 4, 60 + i * 5);
        x.moveTo(40 + i * 9, -40 + i * 22);
        x.quadraticCurveTo(58 + i * 5, 10 + i * 16, 52 + i * 4, 60 + i * 5);
        x.stroke();
      }

      // ears
      const fur = x.createLinearGradient(0, -120, 0, 0);
      fur.addColorStop(0, '#2c2d3a'); fur.addColorStop(1, '#0b0c12');
      [[-1, 0], [1, 0]].forEach(([s]) => {
        x.save();
        x.scale(s, 1);
        x.shadowColor = 'rgba(0,0,0,.8)'; x.shadowBlur = 10;
        x.beginPath();
        x.moveTo(14, -52);
        x.quadraticCurveTo(20, -116, 46, -112);
        x.quadraticCurveTo(56, -78, 42, -44);
        x.closePath();
        x.fillStyle = fur; x.fill();
        x.shadowColor = 'transparent';
        // inner ear
        x.beginPath();
        x.moveTo(24, -58);
        x.quadraticCurveTo(28, -100, 42, -98);
        x.quadraticCurveTo(48, -76, 38, -52);
        x.closePath();
        x.fillStyle = '#05060a'; x.fill();
        // gold ear rim
        x.lineWidth = 3; x.strokeStyle = '#caa24a';
        x.beginPath();
        x.moveTo(14, -52);
        x.quadraticCurveTo(20, -116, 46, -112);
        x.stroke();
        x.restore();
      });

      // head + snout
      x.beginPath();
      x.moveTo(-34, -56);
      x.quadraticCurveTo(0, -74, 34, -56);
      x.quadraticCurveTo(44, -20, 24, 16);
      x.quadraticCurveTo(14, 44, 9, 66);
      x.quadraticCurveTo(0, 76, -9, 66);
      x.quadraticCurveTo(-14, 44, -24, 16);
      x.quadraticCurveTo(-44, -20, -34, -56);
      x.closePath();
      const head = x.createLinearGradient(0, -74, 0, 76);
      head.addColorStop(0, '#343544');
      head.addColorStop(0.45, '#191a24');
      head.addColorStop(1, '#07080d');
      x.fillStyle = head; x.fill();
      x.lineWidth = 2.5; x.strokeStyle = '#000'; x.stroke();
      // snout bridge sheen
      x.globalAlpha = 0.22;
      x.beginPath();
      x.moveTo(-6, -50); x.quadraticCurveTo(-2, 10, -4, 58);
      x.lineTo(4, 58); x.quadraticCurveTo(2, 10, 6, -50);
      x.closePath();
      x.fillStyle = '#9aa0c8'; x.fill();
      x.globalAlpha = 1;
      // nose
      x.beginPath();
      x.ellipse(0, 66, 8, 6, 0, 0, Math.PI * 2);
      x.fillStyle = '#000'; x.fill();

      // glowing eyes
      [[-1], [1]].forEach(([s]) => {
        x.save();
        x.scale(s, 1);
        x.shadowColor = '#ffae2e'; x.shadowBlur = 18;
        x.beginPath();
        x.moveTo(10, -26);
        x.quadraticCurveTo(22, -36, 32, -26);
        x.quadraticCurveTo(22, -18, 10, -26);
        x.closePath();
        const eg = x.createLinearGradient(10, -36, 10, -18);
        eg.addColorStop(0, '#fff3b0'); eg.addColorStop(0.5, '#ffba35'); eg.addColorStop(1, '#c83a06');
        x.fillStyle = eg; x.fill();
        x.restore();
      });

      // forehead gem + circlet
      x.lineWidth = 6; x.strokeStyle = gold;
      x.beginPath();
      x.moveTo(-34, -52); x.quadraticCurveTo(0, -66, 34, -52);
      x.stroke();
      x.restore();
      gem(x, SIZE / 2, 56, 9, 0);

      // collar
      x.save();
      x.translate(SIZE / 2, 116);
      x.shadowColor = 'rgba(0,0,0,.7)'; x.shadowBlur = 8; x.shadowOffsetY = 4;
      x.beginPath();
      x.moveTo(-52, 78);
      x.quadraticCurveTo(0, 102, 52, 78);
      x.quadraticCurveTo(0, 122, -52, 78);
      x.closePath();
      x.fillStyle = goldGrad(x, 74, 116); x.fill();
      x.shadowColor = 'transparent';
      x.lineWidth = 2.5; x.strokeStyle = '#3e2604'; x.stroke();
      x.lineWidth = 2; x.strokeStyle = 'rgba(40,60,140,.8)';
      x.beginPath();
      x.moveTo(-40, 84); x.quadraticCurveTo(0, 102, 40, 84);
      x.stroke();
      x.restore();
    });
  }

  /* ---------- Scarab (SCATTER) ---------- */
  function scarab() {
    return make(x => {
      x.save();
      x.translate(SIZE / 2, 86);
      const gold = goldGrad(x, -78, 70);
      x.lineCap = 'round';

      // spread wing fans
      [[-1], [1]].forEach(([s]) => {
        x.save();
        x.scale(s, 1);
        x.globalAlpha = 0.9;
        for (let i = 0; i < 4; i++) {
          x.beginPath();
          x.moveTo(20, -8);
          x.quadraticCurveTo(64 + i * 9, -38 - i * 9, 86 + i * 7, -2 + i * 9);
          x.quadraticCurveTo(60, 8 + i * 5, 20, 6);
          x.closePath();
          x.fillStyle = i % 2 ? '#8f5d0e' : '#d8a93c';
          x.fill();
          x.lineWidth = 1.5; x.strokeStyle = '#3e2604'; x.stroke();
        }
        x.restore();
      });

      // legs
      x.lineWidth = 7; x.strokeStyle = '#7a4d10';
      [[-1], [1]].forEach(([s]) => {
        x.save(); x.scale(s, 1);
        [[-30, 26, -52, 6], [0, 34, -56, 36], [26, 30, -48, 66]].forEach(([y1, , , y2], i) => {
          x.beginPath();
          x.moveTo(30, y1);
          x.quadraticCurveTo(58, y1 + 6, 62, y2);
          x.stroke();
        });
        x.restore();
      });

      // head
      x.save();
      symbolShadow(x);
      x.beginPath();
      x.ellipse(0, -50, 26, 18, 0, Math.PI, 0);
      x.closePath();
      x.fillStyle = darkGoldGrad(x, -68, -34); x.fill();
      x.shadowColor = 'transparent';
      x.lineWidth = 2.5; x.strokeStyle = '#3e2604'; x.stroke();
      // serrated crown
      x.beginPath();
      for (let i = -2; i <= 2; i++) {
        x.moveTo(i * 10 - 4, -62);
        x.lineTo(i * 10, -74);
        x.lineTo(i * 10 + 4, -62);
      }
      x.lineWidth = 4; x.strokeStyle = '#caa24a'; x.stroke();

      // body (elytra)
      x.shadowColor = 'rgba(0,0,0,.85)'; x.shadowBlur = 14; x.shadowOffsetY = 6;
      x.beginPath();
      x.ellipse(0, 4, 44, 52, 0, 0, Math.PI * 2);
      x.fillStyle = gold; x.fill();
      x.shadowColor = 'transparent';
      x.lineWidth = 3; x.strokeStyle = '#3e2604'; x.stroke();
      // center split + texture
      x.lineWidth = 2.5; x.strokeStyle = 'rgba(70,42,5,.8)';
      x.beginPath(); x.moveTo(0, -44); x.lineTo(0, 54); x.stroke();
      x.lineWidth = 1.5;
      for (let i = 1; i <= 3; i++) {
        x.beginPath();
        x.ellipse(0, 4, 44 - i * 11, 52 - i * 12, 0, 0.5, Math.PI - 0.5);
        x.stroke();
      }
      x.restore();

      // ruby on the back
      x.save();
      x.translate(SIZE / 2, 86);
      x.shadowColor = 'rgba(255,30,30,.95)'; x.shadowBlur = 22;
      const rg = x.createRadialGradient(-7, -10, 3, 0, -2, 26);
      rg.addColorStop(0, '#ffd5d0');
      rg.addColorStop(0.3, '#ff4040');
      rg.addColorStop(0.75, '#a50f12');
      rg.addColorStop(1, '#4a0406');
      x.beginPath();
      x.ellipse(0, -2, 20, 27, 0, 0, Math.PI * 2);
      x.fillStyle = rg; x.fill();
      x.shadowColor = 'transparent';
      x.lineWidth = 4; x.strokeStyle = '#caa24a'; x.stroke();
      x.fillStyle = 'rgba(255,255,255,.9)';
      x.beginPath(); x.ellipse(-7, -13, 5, 8, -0.4, 0, Math.PI * 2); x.fill();
      x.restore();

      banner(x, 178, 'SCATTER', '#ff4a3a', '#a50f12');
    });
  }

  /* ---------- Crook & Flail (WILD) ---------- */
  function wild() {
    return make(x => {
      x.save();
      x.translate(SIZE / 2, 92);

      // magenta heart-gem glow behind
      const glow = x.createRadialGradient(0, 4, 4, 0, 4, 78);
      glow.addColorStop(0, 'rgba(255,60,140,.85)');
      glow.addColorStop(0.5, 'rgba(180,20,90,.35)');
      glow.addColorStop(1, 'rgba(120,10,60,0)');
      x.fillStyle = glow;
      x.beginPath(); x.arc(0, 4, 78, 0, Math.PI * 2); x.fill();

      const gold = goldGrad(x, -90, 84);
      x.lineCap = 'round';

      // crook (heqa) — left to right diagonal
      x.save();
      x.rotate(-0.6);
      symbolShadow(x);
      x.lineWidth = 15; x.strokeStyle = gold;
      x.beginPath();
      x.moveTo(0, 78);
      x.lineTo(0, -42);
      x.quadraticCurveTo(0, -70, -22, -68);
      x.quadraticCurveTo(-38, -66, -36, -48);
      x.stroke();
      x.shadowColor = 'transparent';
      x.lineWidth = 3; x.strokeStyle = '#3e2604'; x.stroke();
      // stripes
      x.lineWidth = 5; x.strokeStyle = 'rgba(30,40,90,.85)';
      for (let i = 0; i < 4; i++) {
        x.beginPath();
        x.moveTo(-7, 58 - i * 24);
        x.lineTo(7, 52 - i * 24);
        x.stroke();
      }
      x.restore();

      // flail (nekhakha)
      x.save();
      x.rotate(0.6);
      symbolShadow(x);
      x.lineWidth = 14; x.strokeStyle = gold;
      x.beginPath();
      x.moveTo(0, 78); x.lineTo(0, -34);
      x.stroke();
      x.shadowColor = 'transparent';
      x.lineWidth = 3; x.strokeStyle = '#3e2604'; x.stroke();
      // three beaded strands
      for (let s = 0; s < 3; s++) {
        const ang = -0.5 + s * 0.42;
        x.save();
        x.translate(0, -34);
        x.rotate(ang);
        x.lineWidth = 5; x.strokeStyle = '#caa24a';
        x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -54); x.stroke();
        for (let b = 1; b <= 4; b++) {
          x.beginPath(); x.arc(0, -b * 13, 6, 0, Math.PI * 2);
          x.fillStyle = b % 2 ? '#d8a93c' : '#2a4a8f';
          x.fill();
          x.lineWidth = 1.5; x.strokeStyle = '#3e2604'; x.stroke();
        }
        x.restore();
      }
      x.restore();

      // heart gem (heart of the dead)
      x.save();
      x.shadowColor = 'rgba(255,40,120,.95)'; x.shadowBlur = 24;
      x.beginPath();
      x.moveTo(0, 36);
      x.bezierCurveTo(-34, 10, -30, -22, -2, -12);
      x.bezierCurveTo(0, -16, 0, -16, 2, -12);
      x.bezierCurveTo(30, -22, 34, 10, 0, 36);
      x.closePath();
      const hg = x.createRadialGradient(-8, -4, 3, 0, 6, 36);
      hg.addColorStop(0, '#ffd0e8');
      hg.addColorStop(0.3, '#ff3f8e');
      hg.addColorStop(0.75, '#9c0a4e');
      hg.addColorStop(1, '#3c0220');
      x.fillStyle = hg; x.fill();
      x.shadowColor = 'transparent';
      x.lineWidth = 4; x.strokeStyle = '#caa24a'; x.stroke();
      x.fillStyle = 'rgba(255,255,255,.85)';
      x.beginPath(); x.ellipse(-10, -2, 5, 8, -0.5, 0, Math.PI * 2); x.fill();
      x.restore();

      x.restore();
      banner(x, 178, 'WILD', '#caa24a', '#6b4408');
    });
  }

  /* ---------- registry ---------- */
  const builders = {
    nine: () => royal('9', 174),
    ten: () => royal('10', 268),
    j: () => royal('J', 210),
    q: () => royal('Q', 130),
    k: () => royal('K', 0),
    a: () => royal('A', 28),
    ankh: ankh,
    eye: eye,
    scales: scales,
    anubis: anubis,
    scatter: scarab,
    wild: wild
  };

  return {
    SIZE,
    get(id) {
      if (!cache[id]) cache[id] = builders[id]();
      return cache[id];
    },
    rebuild() { Object.keys(cache).forEach(k => delete cache[k]); }
  };
})();
