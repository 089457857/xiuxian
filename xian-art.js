// 萬妖仙途 — 向量 Q 版美術（角色分層、妖獸、武器造型、光環、地面）
// 遊戲裡不會每一格都重畫向量圖：先畫進快取的小畫布，之後只貼圖，手機才跑得動
(function (root) {
  const OUT = '#2b1d2a', SKIN = '#ffdcc0', SKIN2 = '#f2bea0';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  function shade(hex, f) { const n = parseInt(hex.slice(1), 16); const m = x => clamp(Math.round(f < 0 ? x * (1 + f) : x + (255 - x) * f), 0, 255); return '#' + ((1 << 24) | (m(n >> 16) << 16) | (m(n >> 8 & 255) << 8) | m(n & 255)).toString(16).slice(1); }
  function P(c, pts) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); }
  let R = 1; const rnd = () => { R = (R * 16807) % 2147483647; return R / 2147483647; };
  const lin = (c, c1, c2, y0, y1) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c1); g.addColorStop(1, c2); return g; };

  // ---------------- 門派預設外觀 ----------------
  const BASE = {
    sword: { robe: '#eef4fb', shade: '#bccde4', trim: '#3a7fd0', trim2: '#2a5c9a', hair: '#2a2638', hair2: '#433d5c', iris: '#3a7fd0', acc: 'sword' },
    pill: { robe: '#eef6e4', shade: '#c4dcae', trim: '#3c9a52', trim2: '#2a6c3a', hair: '#5a3424', hair2: '#7c4a34', iris: '#3c9a52', acc: 'pill' },
    talis: { robe: '#f1eafb', shade: '#cdbbe8', trim: '#7a4fd0', trim2: '#56349a', hair: '#1e1a2c', hair2: '#38304e', iris: '#8a5ae0', acc: 'talis' },
    vajra: { robe: '#f5b84c', shade: '#d48a2c', trim: '#b5432a', trim2: '#7e2a1a', hair: '#f2c9a0', hair2: '#e0b088', iris: '#5a3a20', acc: 'vajra', skin: '#f6cfa4' },
  };
  // 由角色資料組出外觀：門派 → 時裝 → 頭飾 → 正邪變色
  function lookOf(p, D) {
    const w = (p && p.wear) || {}, sect = (p && p.sect) || 'sword';
    let o = { ...BASE[sect] };
    const oc = w.outfit && D.COS[w.outfit]; if (oc) Object.assign(o, oc.look, { acc: BASE[sect].acc, skin: BASE[sect].skin });
    if (sect === 'vajra') { delete o.hairStyle; }
    const hc = w.head && D.COS[w.head]; if (hc) o.head = hc.look.head;
    if (p && p.path === 'x' && !(oc && oc.dark)) { // 邪道：同款式、暗色系、紅眼
      o.robe = shade(o.robe, -.62); o.shade = shade(o.shade, -.66); o.trim = '#c0303a'; o.trim2 = '#7a1a22'; o.iris = '#e0303a'; o.evil = 1;
      if (o.cape) { o.cape = shade(o.cape, -.6); o.cape2 = shade(o.cape2 || o.cape, -.65); }
      if (sect !== 'vajra') { o.hair = '#e8e4f0'; o.hair2 = '#b8b0cc'; }
    }
    o.blade = bladeOf(p, D); o.aura = w.aura && D.COS[w.aura] ? D.COS[w.aura].fx : ''; o.trail = w.trail && D.COS[w.trail] ? D.COS[w.trail].fx : '';
    return o;
  }
  // ---------------- 武器造型 ----------------
  const BLADE = {
    qingming: { blade: '#dff2ff', edge: '#7fc4ff', hilt: '#2a5c9a', guard: '#e8c050', glow: '#5fb0ff', col: '#bfe2ff' },
    xuemo: { blade: '#ffd0d0', edge: '#e0303a', hilt: '#3a1018', guard: '#8a1a22', glow: '#ff2a3a', col: '#ff6a6a' },
    chixiao: { blade: '#ffe0c8', edge: '#ff7a3a', hilt: '#8a1a1a', guard: '#ffcf4a', glow: '#ff5a1a', col: '#ff9a5a' },
    gujian: { blade: '#f2ecdc', edge: '#b8ac90', hilt: '#4a3a3a', guard: '#7a6a5a', glow: '#8a5ad0', col: '#d8c8ff' },
    xinghe: { blade: '#e8dcff', edge: '#b07aff', hilt: '#2a1a5a', guard: '#ffe27a', glow: '#7a5aff', col: '#c8b0ff' },
  };
  // 其他門派的武器造型＝主要特效的顏色
  const SKINCOL = { zijin: '#c9a0ff', cuiyu: '#5fe0c0', jinfu: '#ffe27a', xuefu: '#ff4a5a', zilian: '#c9a0ff', qinglian: '#7fe0d0' };
  function bladeOf(p, D) { const k = p && p.wear && p.wear.weapon, c = k && D.COS[k]; if (c && c.sect === p.sect && BLADE[c.fx]) return c.fx; return p && p.path === 'x' ? 'xuemo' : 'qingming'; }
  function skinCol(p, D) { const k = p && p.wear && p.wear.weapon, c = k && D.COS[k]; return c && c.sect === p.sect ? (SKINCOL[c.fx] || (BLADE[c.fx] && BLADE[c.fx].col)) : null; }

  // ---------------- Q 版角色 ----------------
  function chibi(ctx, o, pose = {}) {
    const sk = o.skin || SKIN; ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const ol = (w = 2.2) => { ctx.strokeStyle = OUT; ctx.lineWidth = w; ctx.stroke(); };
    const fill = (c1, c2, y0, y1) => { ctx.fillStyle = c2 ? lin(ctx, c1, c2, y0, y1) : c1; ctx.fill(); };
    const B = BLADE[o.blade || 'qingming'];
    if (o.cape) { ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-24, 18, -20, 33); ctx.quadraticCurveTo(0, 37, 20, 33); ctx.quadraticCurveTo(24, 18, 10, 0); fill(o.cape, o.cape2 || o.cape, 0, 34); ol(); }
    if (o.acc === 'sword') { ctx.save(); ctx.translate(9, -4); ctx.rotate(-.55); ctx.fillStyle = B.hilt; ctx.fillRect(-2.5, -30, 5, 10); ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.strokeRect(-2.5, -30, 5, 10); ctx.fillStyle = B.guard; ctx.fillRect(-6, -21, 12, 3.5); ctx.strokeRect(-6, -21, 12, 3.5); ctx.restore(); }
    if (o.acc === 'pill') { const pc = o.skinCol || '#e8a040'; ctx.save(); ctx.translate(-12, 8); ctx.beginPath(); ctx.arc(0, 4, 6, 0, 7); ctx.arc(0, -4, 4, 0, 7); fill(pc, shade(pc, -.3), -8, 10); ol(1.6); ctx.fillStyle = '#c0402a'; ctx.fillRect(-4, -1, 8, 2); ctx.restore(); }
    if (o.hairStyle === 'long' && o.acc !== 'vajra') { ctx.beginPath(); ctx.moveTo(-20, -14); ctx.quadraticCurveTo(-24, 14, -15, 24); ctx.lineTo(15, 24); ctx.quadraticCurveTo(24, 14, 20, -14); ctx.closePath(); fill(o.hair2, o.hair, -14, 24); ol(); }
    if (o.acc !== 'vajra') { ctx.beginPath(); ctx.ellipse(0, -15, 23, 22, 0, 0, 7); if (o.acc === 'sword' && o.hairStyle !== 'long') { ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-4, 18, 4, 16); ctx.quadraticCurveTo(10, 10, 8, 0); } fill(o.hair, o.hair2, -37, 10); ol(); }
    const st = pose.step || 0;
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.roundRect(sx * 5 - 3.5, 24 + st * sx, 7, 10, 3); fill('#3a3046', '#2a2234', 24, 34); ol(); }
    ctx.beginPath(); ctx.moveTo(-11, 2); ctx.lineTo(11, 2); ctx.quadraticCurveTo(15, 16, 16, 27); ctx.quadraticCurveTo(0, 31, -16, 27); ctx.quadraticCurveTo(-15, 16, -11, 2); fill(o.robe, o.shade, 2, 30); ol();
    ctx.save(); ctx.clip(); ctx.fillStyle = o.shade; ctx.globalAlpha = .55; ctx.beginPath(); ctx.moveTo(4, 2); ctx.lineTo(18, 2); ctx.lineTo(18, 32); ctx.lineTo(7, 32); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = o.trim; ctx.fillRect(-20, 24, 40, 8); ctx.fillStyle = o.trim2; ctx.fillRect(-20, 13, 40, 3.5);
    if (o.pattern === 'cloud') { ctx.strokeStyle = o.trim; ctx.lineWidth = 1.3; for (const [x, y] of [[-7, 20], [6, 19]]) { ctx.beginPath(); ctx.arc(x, y, 2.4, 3.4, 6.6); ctx.arc(x + 3.4, y, 2, 3.4, 6.4); ctx.stroke(); } }
    if (o.pattern === 'flame') { ctx.fillStyle = '#ffb040'; for (let x = -16; x < 16; x += 5) { ctx.beginPath(); ctx.moveTo(x, 24); ctx.quadraticCurveTo(x + 1, 19, x + 2.5, 16); ctx.quadraticCurveTo(x + 3, 20, x + 5, 24); ctx.fill(); } }
    if (o.pattern === 'gold') { ctx.fillStyle = '#e8c050'; ctx.fillRect(-20, 23, 40, 1.6); ctx.fillRect(-20, 30, 40, 1.2); ctx.fillRect(-1, 16, 2, 8); }
    if (o.pattern === 'sakura') { ctx.fillStyle = '#ffd0dc'; for (const [x, y] of [[-8, 8], [6, 20], [-3, 21], [9, 7], [-12, 19]]) for (let k = 0; k < 5; k++) { const a = k * 1.256; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 1.3, y + Math.sin(a) * 1.3, 1, 0, 7); ctx.fill(); } }
    ctx.restore();
    ctx.fillStyle = o.trim; P(ctx, [[-7, 2], [0, 11], [7, 2], [4, 2], [0, 7], [-4, 2]]); ctx.fill();
    if (o.acc === 'vajra') { ctx.fillStyle = '#7a3a1a'; for (let i = 0; i < 9; i++) { const a = Math.PI * (.15 + i * .0875); ctx.beginPath(); ctx.arc(Math.cos(a) * 10, 2 + Math.sin(a) * 8, 1.8, 0, 7); ctx.fill(); } }
    const arm = pose.arm || 0;
    for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * 13, 8); ctx.rotate(sx * (.25 + (sx > 0 ? arm : 0))); ctx.beginPath(); ctx.ellipse(0, 5, 4.5, 8, 0, 0, 7); fill(o.robe, o.shade, -3, 13); ol(); ctx.beginPath(); ctx.arc(0, 12, 3.6, 0, 7); ctx.fillStyle = sk; ctx.fill(); ol(); ctx.restore(); }
    if (o.acc === 'talis') { const fc = o.skinCol || '#d03a2a'; ctx.save(); ctx.translate(16, 18); ctx.rotate(.3); ctx.fillStyle = '#f6e7a8'; ctx.fillRect(-3.5, -7, 7, 13); ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.strokeRect(-3.5, -7, 7, 13); ctx.fillStyle = fc; ctx.fillRect(-1, -5, 2, 9); ctx.fillRect(-2.5, -2, 5, 1.4); ctx.restore(); }
    if (o.acc === 'vajra') { ctx.save(); ctx.translate(-17, 10); ctx.fillStyle = '#8a5a2a'; ctx.fillRect(-1.6, -26, 3.2, 40); ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.strokeRect(-1.6, -26, 3.2, 40); ctx.strokeStyle = o.skinCol || '#e8c050'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -28, 4, 0, 7); ctx.stroke(); ctx.restore(); }
    // 頭
    ctx.beginPath(); ctx.ellipse(0, -14, 20, 19, 0, 0, 7); ctx.fillStyle = sk; ctx.fill(); ol();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, -14, 20, 19, 0, 0, 7); ctx.clip(); ctx.fillStyle = o.skin ? '#e8b888' : SKIN2; ctx.globalAlpha = .5; ctx.beginPath(); ctx.ellipse(6, 0, 16, 10, 0, 0, 7); ctx.fill(); ctx.restore();
    const ey = -11;
    for (const sx of [-1, 1]) { const x = sx * 8;
      if (pose.blink) { ctx.strokeStyle = '#2a1a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 3.5, ey + 1); ctx.quadraticCurveTo(x, ey + 3, x + 3.5, ey + 1); ctx.stroke(); continue; }
      ctx.fillStyle = '#24182a'; ctx.beginPath(); ctx.ellipse(x, ey, 4.2, 5.6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = o.iris; ctx.beginPath(); ctx.ellipse(x, ey + 1.6, 3, 3.2, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 1.4, ey - 2.2, 1.6, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x + 1.6, ey + 2, .8, 0, 7); ctx.fill();
      if (o.evil) { ctx.strokeStyle = '#24182a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - sx * 4.5, ey - 8); ctx.lineTo(x + sx * 4.5, ey - 5.5); ctx.stroke(); } }
    ctx.fillStyle = '#ff8fa0'; ctx.globalAlpha = .55; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 13, -4, 3.2, 1.8, 0, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
    ctx.strokeStyle = '#6a2a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); if (o.evil) { ctx.moveTo(-3, -2); ctx.quadraticCurveTo(0, -3.5, 3, -1); } else { ctx.moveTo(-2.5, -3); ctx.quadraticCurveTo(0, -.5, 2.5, -3); } ctx.stroke();
    if (o.acc === 'vajra') { ctx.fillStyle = '#c48a5a'; for (const [x, y] of [[-5, -27], [0, -28.5], [5, -27], [-5, -23], [0, -24.5], [5, -23]]) { ctx.beginPath(); ctx.arc(x, y, 1.2, 0, 7); ctx.fill(); } }
    else { ctx.beginPath(); ctx.moveTo(-21, -12); ctx.quadraticCurveTo(-23, -36, 0, -36); ctx.quadraticCurveTo(23, -36, 21, -12);
      ctx.lineTo(17, -18); ctx.lineTo(14, -14); ctx.lineTo(10, -21); ctx.lineTo(5, -17); ctx.lineTo(1, -23); ctx.lineTo(-4, -18); ctx.lineTo(-9, -22); ctx.lineTo(-13, -15); ctx.lineTo(-17, -19); ctx.closePath(); fill(o.hair2, o.hair, -36, -12); ol();
      ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-4, -28, 9, 3.6, 4.6); ctx.stroke(); }
    if (o.acc === 'sword' && o.head !== 'douli') { ctx.beginPath(); ctx.ellipse(0, -38, 7, 5.5, 0, 0, 7); fill(o.hair2, o.hair, -44, -32); ol(); ctx.fillStyle = B.guard; ctx.fillRect(-11, -39, 22, 2.2); }
    if (o.acc === 'pill' && o.head !== 'douli') { for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * 15, -33, 6, 0, 7); fill(o.hair2, o.hair, -39, -27); ol(); } ctx.fillStyle = '#5fd07a'; ctx.beginPath(); ctx.ellipse(15, -38, 4, 2, -.6, 0, 7); ctx.fill(); }
    if (o.acc === 'talis' && o.head !== 'douli' && o.head !== 'crown') { ctx.beginPath(); ctx.moveTo(-12, -33); ctx.lineTo(12, -33); ctx.lineTo(9, -43); ctx.lineTo(-9, -43); ctx.closePath(); fill('#2a2438', '#16121e', -43, -33); ol(); ctx.fillStyle = '#e8c050'; ctx.fillRect(-2, -41, 4, 5); }
    if (o.head === 'crown') { ctx.beginPath(); ctx.moveTo(-9, -40); ctx.lineTo(-9, -46); ctx.lineTo(-4.5, -42); ctx.lineTo(0, -49); ctx.lineTo(4.5, -42); ctx.lineTo(9, -46); ctx.lineTo(9, -40); ctx.closePath(); fill('#ffe27a', '#d89c2a', -49, -40); ol(); ctx.fillStyle = '#e0303a'; ctx.beginPath(); ctx.arc(0, -43, 1.6, 0, 7); ctx.fill(); }
    if (o.head === 'mask') { ctx.save(); ctx.translate(15, -30); ctx.rotate(.4); ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-7, -11); ctx.lineTo(-2, -6); ctx.lineTo(2, -6); ctx.lineTo(7, -11); ctx.lineTo(6, -4); ctx.quadraticCurveTo(6, 5, 0, 7); ctx.quadraticCurveTo(-6, 5, -6, -4); fill('#ffffff', '#e8e0e8', -11, 7); ol(); ctx.fillStyle = '#e0303a'; ctx.fillRect(-4, -2, 3, 1.2); ctx.fillRect(1, -2, 3, 1.2); ctx.fillRect(-.6, 1, 1.2, 3); ctx.restore(); }
    if (o.head === 'flower') { for (let k = 0; k < 5; k++) { const a = k * 1.256; ctx.fillStyle = '#ffb0c8'; ctx.beginPath(); ctx.arc(-14 + Math.cos(a) * 3, -31 + Math.sin(a) * 3, 2.6, 0, 7); ctx.fill(); } ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(-14, -31, 1.6, 0, 7); ctx.fill(); }
    if (o.head === 'douli') { ctx.beginPath(); ctx.moveTo(-30, -30); ctx.quadraticCurveTo(0, -54, 30, -30); ctx.quadraticCurveTo(0, -36, -30, -30); fill('#e8c878', '#b8904a', -48, -30); ol(); ctx.strokeStyle = '#9a7438'; ctx.lineWidth = 1; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 9, -33); ctx.lineTo(i * 3, -44); ctx.stroke(); } }
    ctx.restore();
  }
  // ---------------- 妖獸（中心在 0,0，大約 -30～30） ----------------
  function mkFill(ctx) { return (c1, c2, y0, y1) => { ctx.fillStyle = lin(ctx, c1, c2, y0, y1); ctx.fill(); }; }
  const ol = ctx => { ctx.strokeStyle = OUT; ctx.lineWidth = 2.2; ctx.stroke(); };
  const eyes = (ctx, pts, r = 3.4, col = '#e0303a', angry = 1) => { for (const [x, y] of pts) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.15, 0, 0, 7); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x - .5, y + .5, r * .6, 0, 7); ctx.fill(); ctx.fillStyle = '#2a1a24'; ctx.beginPath(); ctx.arc(x - .5, y + .5, r * .3, 0, 7); ctx.fill(); if (angry) { ctx.strokeStyle = '#2a1a24'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - r - .5, y - r * 1.5 + (x < 0 ? 0 : 2)); ctx.lineTo(x + r + .5, y - r * 1.5 + (x < 0 ? 2 : 0)); ctx.stroke(); } } };
  const MART = {
    wolf(ctx, c, c2, o = {}) { const f = mkFill(ctx); ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(14, 2); ctx.quadraticCurveTo(30, -8, 28, -18); ctx.quadraticCurveTo(22, -4, 12, -2); f(c, c2, -18, 4); ol(ctx);
      ctx.beginPath(); ctx.ellipse(4, 4, 17, 12, 0, 0, 7); f(c, c2, -8, 16); ol(ctx);
      if (o.stripes) { ctx.save(); ctx.clip(); ctx.fillStyle = '#2a1a24'; for (const x of [-2, 6, 14]) { ctx.beginPath(); ctx.moveTo(x, -8); ctx.lineTo(x + 3, -8); ctx.lineTo(x + 1, 4); ctx.fill(); } ctx.restore(); }
      for (const x of [-6, 4, 12]) { ctx.beginPath(); ctx.roundRect(x - 3, 10, 6, 8, 2.5); ctx.fillStyle = c2; ctx.fill(); ol(ctx); }
      ctx.beginPath(); ctx.ellipse(-10, -6, 14, 13, 0, 0, 7); f(c, c2, -19, 7); ol(ctx);
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-10 + sx * 5 - 4, -15); ctx.lineTo(-10 + sx * 8, -27); ctx.lineTo(-10 + sx * 9 + 3, -13); ctx.closePath(); f(c, c2, -27, -13); ol(ctx); ctx.fillStyle = '#ff9aa8'; ctx.beginPath(); ctx.moveTo(-10 + sx * 6, -16); ctx.lineTo(-10 + sx * 8, -23); ctx.lineTo(-10 + sx * 9.5, -15); ctx.fill(); }
      ctx.beginPath(); ctx.ellipse(-18, -1, 7, 5, 0, 0, 7); ctx.fillStyle = '#e8ecf2'; ctx.fill(); ol(ctx); ctx.fillStyle = '#2a1a24'; ctx.beginPath(); ctx.arc(-24, -3, 2, 0, 7); ctx.fill();
      if (o.tusk) { ctx.fillStyle = '#fff8e0'; for (const x of [-20, -14]) { ctx.beginPath(); ctx.moveTo(x, 2); ctx.quadraticCurveTo(x - 3, -6, x - 1, -9); ctx.lineTo(x + 2, 2); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke(); } }
      eyes(ctx, [[-15, -8], [-6, -8]]);
      ctx.fillStyle = '#fff'; P(ctx, [[-21, 3], [-19.5, 7], [-18, 3]]); ctx.fill(); P(ctx, [[-16, 3], [-14.5, 6.5], [-13, 3]]); ctx.fill(); },
    boar(ctx, c, c2) { MART.wolf(ctx, c, c2, { tusk: 1 }); },
    tiger(ctx, c, c2) { MART.wolf(ctx, c, c2, { stripes: 1 }); ctx.fillStyle = '#2a1a24'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('王', -10, -14); },
    snake(ctx, c, c2) { const f = mkFill(ctx); ctx.lineCap = 'round';
      ctx.strokeStyle = OUT; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(22, 12); ctx.quadraticCurveTo(10, 0, 2, 12); ctx.quadraticCurveTo(-8, 22, -14, 6); ctx.stroke();
      ctx.strokeStyle = c; ctx.lineWidth = 8; ctx.stroke(); ctx.strokeStyle = shade(c, .35); ctx.lineWidth = 2.5; ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.ellipse(-16, -4, 10, 8, -.3, 0, 7); f(c, c2, -12, 4); ol(ctx);
      eyes(ctx, [[-20, -6], [-12, -8]], 2.6, '#ffd84a');
      ctx.strokeStyle = '#e0303a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-25, -1); ctx.lineTo(-30, 1); ctx.moveTo(-30, 1); ctx.lineTo(-32, -1); ctx.moveTo(-30, 1); ctx.lineTo(-32, 3); ctx.stroke(); },
    ape(ctx, c, c2) { const f = mkFill(ctx);
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 17, 6, 6, 12, sx * .3, 0, 7); f(c, c2, -6, 18); ol(ctx); }
      ctx.beginPath(); ctx.ellipse(0, 6, 16, 16, 0, 0, 7); f(c, c2, -10, 22); ol(ctx);
      ctx.beginPath(); ctx.ellipse(0, -12, 15, 13, 0, 0, 7); f(c, c2, -25, 1); ol(ctx);
      ctx.beginPath(); ctx.ellipse(0, -9, 10, 8, 0, 0, 7); ctx.fillStyle = shade(c, .45); ctx.fill();
      eyes(ctx, [[-5, -12], [5, -12]], 2.8);
      ctx.fillStyle = '#5a2a2a'; ctx.beginPath(); ctx.ellipse(0, -4, 4, 2, 0, 0, 7); ctx.fill(); },
    toad(ctx, c, c2) { const f = mkFill(ctx);
      ctx.beginPath(); ctx.ellipse(0, 4, 24, 15, 0, 0, 7); f(c, c2, -11, 19); ol(ctx);
      ctx.fillStyle = shade(c, -.3); for (const [x, y] of [[-12, 0], [8, -2], [14, 8], [-4, 10]]) { ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 7); ctx.fill(); }
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * 10, -10, 7, 0, 7); f(c, c2, -17, -3); ol(ctx); }
      eyes(ctx, [[-10, -11], [10, -11]], 3.6, '#ffd84a', 0);
      ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-14, 4); ctx.quadraticCurveTo(0, 10, 14, 4); ctx.stroke();
      ctx.fillStyle = shade(c, .4); ctx.beginPath(); ctx.ellipse(0, 12, 14, 5, 0, 0, 7); ctx.fill(); },
    wisp(ctx, c, c2) { ctx.beginPath(); ctx.moveTo(0, -26); ctx.quadraticCurveTo(6, -14, 12, -8); ctx.quadraticCurveTo(18, 6, 8, 12); ctx.quadraticCurveTo(0, 16, -8, 12); ctx.quadraticCurveTo(-18, 6, -12, -8); ctx.quadraticCurveTo(-4, -16, 0, -26);
      const g = ctx.createRadialGradient(0, 2, 2, 0, 0, 20); g.addColorStop(0, '#ffffff'); g.addColorStop(.5, c); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fill(); ol(ctx);
      ctx.fillStyle = '#1a2a2a'; for (const x of [-5, 5]) { ctx.beginPath(); ctx.ellipse(x, 0, 2.4, 3.4, 0, 0, 7); ctx.fill(); } ctx.fillStyle = '#fff'; for (const x of [-5.8, 4.2]) { ctx.beginPath(); ctx.arc(x, -1.2, 1, 0, 7); ctx.fill(); }
      ctx.strokeStyle = '#1a2a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 5, 2.5, .2, Math.PI - .2); ctx.stroke(); },
    imp(ctx, c, c2) { const f = mkFill(ctx);
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 8, -2); ctx.lineTo(sx * 26, -14); ctx.lineTo(sx * 22, -2); ctx.lineTo(sx * 26, 4); ctx.lineTo(sx * 10, 6); ctx.closePath(); f(shade(c, -.3), shade(c, -.5), -14, 6); ol(ctx); }
      ctx.beginPath(); ctx.moveTo(8, 12); ctx.quadraticCurveTo(22, 18, 20, 6); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.stroke(); ctx.fillStyle = c2; P(ctx, [[18, 2], [24, 6], [18, 9]]); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 2, 14, 15, 0, 0, 7); f(c, c2, -13, 17); ol(ctx);
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 5, -10); ctx.quadraticCurveTo(sx * 9, -20, sx * 12, -22); ctx.quadraticCurveTo(sx * 10, -14, sx * 10, -8); ctx.closePath(); ctx.fillStyle = '#3a2a24'; ctx.fill(); ol(ctx); }
      eyes(ctx, [[-5, -2], [5, -2]], 3.2, '#ffd84a');
      ctx.fillStyle = '#2a1a24'; ctx.beginPath(); ctx.arc(0, 7, 4, 0, Math.PI); ctx.fill(); ctx.fillStyle = '#fff'; P(ctx, [[-3, 7], [-2, 10], [-1, 7]]); ctx.fill(); P(ctx, [[1, 7], [2, 10], [3, 7]]); ctx.fill(); },
    bird(ctx, c, c2) { const f = mkFill(ctx);
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 6, -2); ctx.quadraticCurveTo(sx * 28, -20, sx * 30, -4); ctx.quadraticCurveTo(sx * 20, 0, sx * 8, 8); ctx.closePath(); f(shade(c, .3), c2, -20, 8); ol(ctx); }
      ctx.beginPath(); ctx.moveTo(-4, 12); ctx.lineTo(0, 26); ctx.lineTo(4, 12); ctx.closePath(); f(c, c2, 12, 26); ol(ctx);
      ctx.beginPath(); ctx.ellipse(0, 2, 12, 13, 0, 0, 7); f(c, c2, -11, 15); ol(ctx);
      ctx.beginPath(); ctx.moveTo(-2, -10); ctx.quadraticCurveTo(0, -22, 6, -20); ctx.quadraticCurveTo(2, -16, 2, -10); ctx.fillStyle = shade(c, .5); ctx.fill(); ol(ctx);
      eyes(ctx, [[-4, -2], [4, -2]], 2.8, '#2a4aa0', 0);
      ctx.fillStyle = '#ffcf4a'; P(ctx, [[-3, 3], [3, 3], [0, 8]]); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke(); },
    eye(ctx, c, c2) { const f = mkFill(ctx);
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 12, -4); ctx.lineTo(sx * 28, -16); ctx.lineTo(sx * 24, -4); ctx.lineTo(sx * 28, 6); ctx.closePath(); f(c, c2, -16, 6); ol(ctx); }
      ctx.strokeStyle = c2; ctx.lineWidth = 3; for (const x of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(x, 12); ctx.quadraticCurveTo(x + 4, 20, x, 26); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, 15, 0, 7); f(c, c2, -15, 15); ol(ctx);
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, 7); ctx.fillStyle = '#fff6f0'; ctx.fill(); ctx.beginPath(); ctx.arc(0, 1, 6, 0, 7); ctx.fillStyle = '#e0303a'; ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 1, 2, 5, 0, 0, 7); ctx.fillStyle = '#1a0a10'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-3, -3, 1.8, 0, 7); ctx.fill(); },
  };
  // ---------------- 快取 ----------------
  let DENS = 4; const CACHE = new Map();
  function setDensity(d) { const n = Math.max(2, Math.min(4.5, Math.round(d * 2) / 2)); if (n !== DENS) { DENS = n; CACHE.clear(); } }
  // box：[寬, 高, 中心 x, 中心 y]（單位座標）；scale：單位 → 世界
  function cached(key, box, scale, draw) {
    const k = key + '|' + scale.toFixed(3) + '|' + DENS; let s = CACHE.get(k); if (s) return s;
    const [bw, bh, cx, cy] = box, pw = Math.ceil(bw * scale * DENS), ph = Math.ceil(bh * scale * DENS);
    const mk = (flip, white) => { const c = document.createElement('canvas'); c.width = pw; c.height = ph; const x = c.getContext('2d'); x.scale(scale * DENS * (flip ? -1 : 1), scale * DENS); x.translate(flip ? -cx : cx, cy); draw(x); if (white) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, pw, ph); } return c; };
    s = { r: mk(false), l: mk(true), w: bw * scale, h: bh * scale, ax: cx * scale, ay: cy * scale, wr: null, wl: null, mkW() { if (!this.wr) { this.wr = mk(false, 1); this.wl = mk(true, 1); } } };
    if (CACHE.size > 260) CACHE.delete(CACHE.keys().next().value);
    CACHE.set(k, s); return s;
  }
  const CHIBI_BOX = [80, 100, 40, 56];
  function heroSprite(o, scale, pose) { return cached('h' + JSON.stringify(o) + (pose ? JSON.stringify(pose) : ''), CHIBI_BOX, scale, x => chibi(x, o, pose || {})); }
  const MON_BOX = [72, 64, 36, 32];
  function monSprite(art, col, scale) { return cached('m' + art + col, MON_BOX, scale, x => { x.fillStyle = '#00000038'; x.beginPath(); x.ellipse(0, 22, 22, 6, 0, 0, 7); x.fill(); (MART[art] || MART.wisp)(x, col, shade(col, -.38)); }); }
  // ---------------- 飛劍與拖尾 ----------------
  function sword(c, b, s) { c.fillStyle = b.hilt; c.fillRect(-14 * s, -2 * s, 7 * s, 4 * s); c.fillStyle = b.guard; c.fillRect(-7 * s, -5 * s, 3 * s, 10 * s);
    c.beginPath(); c.moveTo(-4 * s, -2.6 * s); c.lineTo(16 * s, -1.6 * s); c.lineTo(22 * s, 0); c.lineTo(16 * s, 1.6 * s); c.lineTo(-4 * s, 2.6 * s); c.closePath(); const g = c.createLinearGradient(0, -3 * s, 0, 3 * s); g.addColorStop(0, b.blade); g.addColorStop(1, b.edge); c.fillStyle = g; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.2 * s; c.stroke();
    c.fillStyle = '#ffffffcc'; c.fillRect(-2 * s, -1 * s, 15 * s, .9 * s); }
  function swordSprite(bk, size) { const b = BLADE[bk] || BLADE.qingming; return cached('s' + bk, [40, 14, 16, 7], size, x => sword(x, b, 1)); }
  const TRAILCOL = { fire: ['#ff5a1a', '#ffd04a'], thunder: ['#7a8aff', '#ffffff'], star: ['#7a5aff', '#ffffff'], sakura: ['#ff9ab8', '#ffe6ee'] };
  function trail(c, kind, x, y, vx, vy, len, base, t) { const sp = Math.hypot(vx, vy) || 1, ux = vx / sp, uy = vy / sp;
    const cols = TRAILCOL[kind] || [base, '#ffffff'];
    c.globalAlpha = .55; c.strokeStyle = cols[0]; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x - ux * len, y - uy * len); c.stroke();
    if (kind) { const seed = (x * 13 + y * 7) | 0; for (let i = 0; i < 3; i++) { const k = ((seed + i * 37 + (t * 30 | 0)) % 100) / 100, px = x - ux * len * k + (-uy) * (k * 6 - 3), py = y - uy * len * k + ux * (k * 6 - 3); c.globalAlpha = .9 * (1 - k); c.fillStyle = cols[1];
      if (kind === 'sakura') { c.fillStyle = cols[0]; c.beginPath(); c.arc(px, py, 1.6, 0, 7); c.fill(); }
      else if (kind === 'star') { c.fillRect(px - 2, py - .4, 4, .8); c.fillRect(px - .4, py - 2, .8, 4); }
      else if (kind === 'thunder') { c.strokeStyle = cols[1]; c.lineWidth = .8; c.beginPath(); c.moveTo(px - 2, py - 2); c.lineTo(px + 1, py); c.lineTo(px - 1, py + 1); c.lineTo(px + 2, py + 3); c.stroke(); }
      else { c.beginPath(); c.arc(px, py, 1.4, 0, 7); c.fill(); } } }
    c.globalAlpha = 1; }
  // ---------------- 光環 ----------------
  function auraDraw(c, t) {
    if (t === 'lotus') { for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; c.save(); c.translate(Math.cos(a) * 18, 34 + Math.sin(a) * 6); c.rotate(a + Math.PI / 2); c.beginPath(); c.ellipse(0, 0, 4, 8, 0, 0, 7); c.fillStyle = lin(c, '#fff0f6', '#ff8ab0', -8, 8); c.fill(); c.strokeStyle = '#c0507a'; c.lineWidth = .8; c.stroke(); c.restore(); } }
    if (t === 'moon') { const g = c.createRadialGradient(0, -12, 26, 0, -12, 42); g.addColorStop(0, '#ffe27a00'); g.addColorStop(.6, '#ffe27a66'); g.addColorStop(1, '#ffe27a00'); c.fillStyle = g; c.beginPath(); c.arc(0, -12, 42, 0, 7); c.fill(); c.strokeStyle = '#ffe9a0'; c.lineWidth = 2; c.beginPath(); c.arc(0, -12, 33, 0, 7); c.stroke(); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(Math.cos(a) * 33, -12 + Math.sin(a) * 33, 1.6, 0, 7); c.fill(); } }
    if (t === 'flame') { R = 3; for (let k = 0; k < 16; k++) { const a = -Math.PI + k / 15 * Math.PI, r = 28 + rnd() * 6, fx = Math.cos(a) * r, fy = 6 + Math.sin(a) * r * 1.3; const g = c.createRadialGradient(fx, fy, 1, fx, fy, 9); g.addColorStop(0, '#ffd04acc'); g.addColorStop(.5, '#ff3a1a66'); g.addColorStop(1, '#ff3a1a00'); c.fillStyle = g; c.beginPath(); c.arc(fx, fy, 9, 0, 7); c.fill(); } }
    if (t === 'star') { R = 9; for (let k = 0; k < 22; k++) { const px = (rnd() - .5) * 70, py = -40 + rnd() * 80; c.fillStyle = rnd() < .5 ? '#c8a0ff' : '#ffffff'; c.globalAlpha = .4 + rnd() * .6; const z = 1 + rnd() * 1.5; c.fillRect(px - z * 2, py - .5, z * 4, 1); c.fillRect(px - .5, py - z * 2, 1, z * 4); } c.globalAlpha = 1; }
  }
  function auraSprite(t, scale, front) { return cached('a' + t + (front ? 'f' : ''), [100, 110, 50, 62], scale, x => { if ((t === 'lotus') === !!front) auraDraw(x, t); }); }
  // ---------------- 地面（以區塊快取） ----------------
  const CH = 160; const GROUND = new Map();
  function groundChunk(mi, map, ix, iy) {
    const key = mi + ':' + ix + ':' + iy + ':' + DENS; let c = GROUND.get(key); if (c) return c;
    const d = Math.min(DENS, 3), px = CH * d; c = document.createElement('canvas'); c.width = px; c.height = px; const x = c.getContext('2d'); x.scale(d, d);
    R = (ix * 73856093 ^ iy * 19349663 ^ mi * 83492791) >>> 0 || 7; for (let i = 0; i < 5; i++) rnd();
    const g = map.ground; x.fillStyle = g[0]; x.fillRect(0, 0, CH, CH);
    for (let i = 0; i < 12; i++) { const rx = 10 + rnd() * 16, ry = 6 + rnd() * 10, cx = rx + rnd() * (CH - 2 * rx), cy = rx + rnd() * (CH - 2 * rx); x.fillStyle = i % 2 ? g[1] : g[2]; x.globalAlpha = .32; x.beginPath(); x.ellipse(cx, cy, rx, ry, rnd() * 3, 0, 7); x.fill(); }
    x.globalAlpha = 1;
    for (let i = 0; i < 26; i++) { const tx = rnd() * CH, ty = rnd() * CH; x.strokeStyle = map.deco; x.lineWidth = 1.1; x.beginPath(); x.moveTo(tx, ty); x.lineTo(tx - 1.5, ty - 4); x.moveTo(tx + 2, ty); x.lineTo(tx + 2, ty - 5); x.moveTo(tx + 4, ty); x.lineTo(tx + 5.5, ty - 3.5); x.stroke(); }
    const fl = map.flower || ['#ffd84a', '#ff9ab0', '#ffffff'];
    for (let i = 0; i < 7; i++) { const tx = rnd() * CH, ty = rnd() * CH, col = fl[(rnd() * fl.length) | 0]; for (let k = 0; k < 5; k++) { const a = k * 1.256; x.fillStyle = col; x.beginPath(); x.arc(tx + Math.cos(a) * 1.6, ty + Math.sin(a) * 1.6, 1.2, 0, 7); x.fill(); } x.fillStyle = '#ffe27a'; x.beginPath(); x.arc(tx, ty, .9, 0, 7); x.fill(); }
    for (let i = 0; i < 2; i++) { const tx = rnd() * CH, ty = rnd() * CH, s = .6 + rnd() * .6; x.fillStyle = '#00000030'; x.beginPath(); x.ellipse(tx, ty + 3 * s, 8 * s, 2.5 * s, 0, 0, 7); x.fill(); x.fillStyle = map.rock || '#8a8f99'; x.beginPath(); x.ellipse(tx, ty, 7 * s, 4.5 * s, 0, 0, 7); x.fill(); x.fillStyle = shade(map.rock || '#8a8f99', .3); x.beginPath(); x.ellipse(tx - 1.5 * s, ty - 1.5 * s, 3.5 * s, 2 * s, 0, 0, 7); x.fill(); }
    if (rnd() < .7) { const tx = 20 + rnd() * (CH - 40), ty = 20 + rnd() * (CH - 40), s = .8 + rnd() * .5, tc = map.tree || ['#2f6a2a', '#3a7a30', '#4a9a3c'];
      x.fillStyle = '#00000035'; x.beginPath(); x.ellipse(tx, ty + 2 * s, 12 * s, 4 * s, 0, 0, 7); x.fill(); x.fillStyle = map.trunk || '#6a4a2a'; x.fillRect(tx - 1.8 * s, ty - 8 * s, 3.6 * s, 10 * s);
      for (const [dx, dy, r, ci] of [[0, -17, 11, 0], [-6, -13, 8, 1], [6, -14, 8, 1], [-2, -21, 6, 2], [3, -17, 4, 2]]) { x.fillStyle = tc[ci]; x.beginPath(); x.arc(tx + dx * s, ty + dy * s, r * s, 0, 7); x.fill(); } }
    if (GROUND.size > 40) GROUND.delete(GROUND.keys().next().value);
    GROUND.set(key, c); return c;
  }
  root.XA = { shade, chibi, MART, BLADE, SKINCOL, TRAILCOL, lookOf, bladeOf, skinCol, heroSprite, monSprite, swordSprite, sword, trail, auraSprite, auraDraw, groundChunk, CH, setDensity, get DENS() { return DENS; }, CHIBI_BOX };
})(typeof window !== 'undefined' ? window : this);
