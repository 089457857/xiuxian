// 萬妖仙途 — 共用資料與規則（伺服器和遊戲畫面都用這一份）
// 所有「局外」進度的變化都經過 act()，伺服器用它判定，離線模式也用同一份，結果一致
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.XD = factory();
})(this, function () {
  const VERSION = '0.3.0';
  const TITLE = '萬妖仙途';

  // ---------------- 境界：5 個大境界 × 初／中／後 = 15 階 ----------------
  const REALMS = ['練氣', '築基', '金丹', '元嬰', '化神'];
  const STAGES = ['初期', '中期', '後期'];
  const STAGEN = REALMS.length * 3;
  const stageName = s => REALMS[Math.floor(s / 3)] + STAGES[s % 3];
  const realmOf = s => Math.floor(s / 3);
  // 每一階要累積多少修為（後期修滿後要渡劫才能進下一個大境界）
  // 設計：練氣每階約 1 局，越後面越久，化神每階約 2～3 局（成功的一局約 1500～2300 隻）
  const NEED = Array.from({ length: 15 }, (_, s) => { const r = Math.floor(s / 3), i = s % 3; return Math.round(800 * Math.pow(1.9, r) * (1 + 0.4 * i) * (1 + 0.6 * r) / 10) * 10; });
  const PATH_STAGE = 6;   // 金丹初期：渡過心魔劫才分正邪
  const FORBID_STAGE = 6; // 金丹之後開放禁地
  const SOUL_STAGE = 9;   // 元嬰之後才有「元嬰出竅」

  // ---------------- 地圖（每個大境界一張） ----------------
  const MAPS = [
    { n: '青丘山林', ground: ['#6aa84f', '#78b65a', '#5c9a44'], deco: '#4a8a3a', flower: ['#ffd84a', '#ff9ab0', '#ffffff'], rock: '#9aa0a8', tree: ['#2f7a3a', '#3a8a40', '#5aaa4c'], trunk: '#6a4a2a', mobs: ['wolf', 'snake', 'ape'], elite: 'boar', boss: 'tigerking' },
    { n: '幽冥沼澤', ground: ['#4f6a52', '#5a785c', '#445c46'], deco: '#36503a', flower: ['#b8f0d0', '#9a7ad8'], rock: '#6a7a70', tree: ['#2a4a3a', '#34584a', '#4a7060'], trunk: '#3a3a2a', mobs: ['toad', 'leech', 'wisp'], elite: 'crocodile', boss: 'marshmother' },
    { n: '赤炎火山', ground: ['#8a4a34', '#9a563c', '#7a3e2c'], deco: '#5a2a1e', flower: ['#ffb040', '#ff6a3a'], rock: '#4a3a3a', tree: ['#3a2a2a', '#4a3030', '#ff7a3a'], trunk: '#2a1a1a', mobs: ['firerat', 'salamander', 'lavaimp'], elite: 'firebull', boss: 'firequeen' },
    { n: '北冥冰原', ground: ['#cfe2ee', '#dcebf4', '#bfd6e6'], deco: '#9ab8cc', flower: ['#ffffff', '#9fdcff'], rock: '#8aa4b8', tree: ['#5a8aa8', '#7aa8c4', '#e8f4fa'], trunk: '#5a4a4a', mobs: ['icefox', 'snowape', 'icewisp'], elite: 'mammoth', boss: 'icephoenix' },
    { n: '九幽魔域', ground: ['#3a2c46', '#443452', '#30243a'], deco: '#22182c', flower: ['#c03a5a', '#8a5ad0'], rock: '#4a3a56', tree: ['#2a1a34', '#3a2448', '#8a2a5a'], trunk: '#1a1220', mobs: ['shade', 'bonedog', 'demoneye'], elite: 'demonguard', boss: 'demonlord' },
  ];

  // 妖獸：hp/atk 是第 0 張地圖的基準，實際依地圖倍率放大；spr 是像素圖代號
  const MON = {
    wolf: { n: '山狼', hp: 14, atk: 5, spd: 38, r: 6, xp: 1, spr: 'wolf', col: '#8a8f99' },
    snake: { n: '青蛇', hp: 10, atk: 4, spd: 46, r: 5, xp: 1, spr: 'snake', col: '#5fae4c' },
    ape: { n: '山魈', hp: 30, atk: 8, spd: 30, r: 7, xp: 2, spr: 'ape', col: '#7a5236' },
    boar: { n: '鐵鬃野豬', hp: 220, atk: 12, spd: 34, r: 11, xp: 12, spr: 'boar', col: '#5b3b2a', elite: 1 },
    tigerking: { n: '白額虎王', hp: 2600, atk: 18, spd: 40, r: 18, xp: 60, spr: 'tiger', col: '#e0a040', boss: 1, sk: ['dash', 'roar'] },
    toad: { n: '毒蟾', hp: 16, atk: 5, spd: 34, r: 6, xp: 1, spr: 'toad', col: '#7d8f3a' },
    leech: { n: '血蛭', hp: 12, atk: 6, spd: 48, r: 5, xp: 1, spr: 'snake', col: '#8c2f3a' },
    wisp: { n: '沼澤鬼火', hp: 26, atk: 8, spd: 40, r: 6, xp: 2, spr: 'wisp', col: '#6fe0b0' },
    crocodile: { n: '老鱷', hp: 260, atk: 13, spd: 30, r: 12, xp: 12, spr: 'boar', col: '#4a6a3a', elite: 1 },
    marshmother: { n: '萬毒蟾母', hp: 3000, atk: 18, spd: 34, r: 20, xp: 60, spr: 'toad', col: '#a0c040', boss: 1, sk: ['spit', 'summon'] },
    firerat: { n: '火鼠', hp: 15, atk: 5, spd: 50, r: 5, xp: 1, spr: 'wolf', col: '#d06030' },
    salamander: { n: '火蜥', hp: 20, atk: 7, spd: 38, r: 6, xp: 1, spr: 'snake', col: '#e08a30' },
    lavaimp: { n: '熔岩小鬼', hp: 32, atk: 9, spd: 34, r: 7, xp: 2, spr: 'imp', col: '#c0402a' },
    firebull: { n: '炎角牛', hp: 300, atk: 14, spd: 34, r: 12, xp: 12, spr: 'boar', col: '#a03020', elite: 1 },
    firequeen: { n: '赤焰妖后', hp: 3400, atk: 20, spd: 38, r: 18, xp: 60, spr: 'imp', col: '#ff6a3a', boss: 1, sk: ['ring', 'dash'] },
    icefox: { n: '雪狐', hp: 15, atk: 5, spd: 48, r: 5, xp: 1, spr: 'wolf', col: '#e8f2fa' },
    snowape: { n: '雪猿', hp: 34, atk: 9, spd: 30, r: 7, xp: 2, spr: 'ape', col: '#dfe8ee' },
    icewisp: { n: '冰魄', hp: 22, atk: 7, spd: 42, r: 6, xp: 1, spr: 'wisp', col: '#9fdcff' },
    mammoth: { n: '玄冰巨象', hp: 340, atk: 15, spd: 28, r: 13, xp: 12, spr: 'boar', col: '#8fb0c8', elite: 1 },
    icephoenix: { n: '冰凰', hp: 3800, atk: 21, spd: 42, r: 18, xp: 60, spr: 'bird', col: '#7fd0ff', boss: 1, sk: ['ring', 'spit'] },
    shade: { n: '幽影', hp: 18, atk: 6, spd: 46, r: 6, xp: 1, spr: 'wisp', col: '#8a6ab0' },
    bonedog: { n: '骨犬', hp: 22, atk: 7, spd: 44, r: 6, xp: 1, spr: 'wolf', col: '#d8d0c0' },
    demoneye: { n: '魔眼', hp: 36, atk: 9, spd: 32, r: 7, xp: 2, spr: 'eye', col: '#c03a5a' },
    demonguard: { n: '魔將', hp: 380, atk: 16, spd: 32, r: 12, xp: 12, spr: 'imp', col: '#5a2a6a', elite: 1 },
    demonlord: { n: '九幽魔尊', hp: 4400, atk: 23, spd: 40, r: 20, xp: 60, spr: 'imp', col: '#9a2aff', boss: 1, sk: ['ring', 'dash', 'summon'] },
    // 特殊敵人
    heartdemon: { n: '心魔', hp: 60, atk: 10, spd: 44, r: 7, xp: 3, spr: 'shadowman', col: '#3a2a4a' },
    tribulation: { n: '劫雷化身', hp: 3600, atk: 20, spd: 40, r: 18, xp: 80, spr: 'wisp', col: '#b8c8ff', boss: 1, sk: ['ring', 'dash'] },
    mirror: { n: '心魔・另一個你', hp: 3200, atk: 18, spd: 46, r: 10, xp: 80, spr: 'shadowman', col: '#2a1f33', boss: 1, sk: ['dash', 'ring'] },
    hunter: { n: '追殺者', hp: 900, atk: 14, spd: 50, r: 9, xp: 30, spr: 'man', col: '#ffffff', elite: 1, hunter: 1 },
  };
  // 地圖強度倍率（血量、攻擊）
  const MAPMUL = [1, 2.6, 6.5, 16, 40];
  const HUNTER_TIERS = ['外門弟子', '內門師兄', '長老', '掌門'];
  const HUNTER_MUL = [1, 1.8, 3, 5];

  // ---------------- 門派 ----------------
  const SECTS = {
    sword: { n: '青雲劍宗', short: '劍', col: '#5fb0ff', robe: '#dfeaf5', trim: '#3a7fd0', desc: '飛劍自動追敵，攻守兼備', base: 'flysword', paths: { z: 'wanjian', x: 'bloodsword' } },
    pill: { n: '百草丹谷', short: '丹', col: '#6fd08a', robe: '#e7f2dc', trim: '#3c9a52', desc: '丟出丹藥炸開藥霧，續航最強', base: 'pillfire', paths: { z: 'yaowang', x: 'gu' } },
    talis: { n: '紫霄符府', short: '符', col: '#b98cff', robe: '#efe6fb', trim: '#7a4fd0', desc: '雷符連鎖跳躍，控場與召喚', base: 'thunder', paths: { z: 'tianlei', x: 'ghost' } },
    vajra: { n: '金剛寺', short: '體', col: '#ffc24a', robe: '#f3c36a', trim: '#b5562a', desc: '貼身罡氣震開妖獸，體修硬派', base: 'gang', paths: { z: 'mingwang', x: 'shura' } },
  };
  const PATHN = { z: '正道', x: '邪道' };
  const PATHLINE = { // 8 條支線名稱
    sword: { z: '萬劍歸宗', x: '血魔劍' }, pill: { z: '藥王', x: '萬蠱' },
    talis: { z: '天雷正法', x: '幽冥鬼道' }, vajra: { z: '不動明王', x: '修羅' },
  };

  // ---------------- 功法 ----------------
  // t：機制。proj 飛射、orbit 環繞、aura 光環、zone 落地區域、chain 連鎖、strike 天降、summon 召喚、nova 衝擊波
  // lv 1～5；dmg 是相對「靈力」的倍率；cd 秒
  // sect：所屬門派；path：'z' 正、'x' 邪、無則中立；main：主招式（一局固定帶著）
  const SK = {
    // 劍宗
    flysword: { n: '飛劍', sect: 'sword', main: 1, t: 'proj', icon: '劍', d: '飛劍自動射向最近的妖獸', base: { dmg: 1.3, cd: 0.7, cnt: 2, spd: 260, pierce: 2, size: 1 }, up: { cnt: [0, 1, 0, 1, 1], dmg: [0.25, 0, 0.3, 0, 0.3] } },
    wanjian: { n: '萬劍歸宗', sect: 'sword', path: 'z', main: 1, t: 'proj', icon: '萬', d: '劍數越疊越多，貫穿多隻妖獸', base: { dmg: 1.25, cd: 0.75, cnt: 3, spd: 280, pierce: 3, size: 1 }, up: { cnt: [1, 1, 1, 1, 1], dmg: [0.15, 0.15, 0.2, 0.2, 0.25] }, evo: { need: 'jianxin', to: 'wanjianzz' } },
    bloodsword: { n: '血魔劍', sect: 'sword', path: 'x', main: 1, t: 'proj', icon: '血', d: '每殺一隻劍就更強（本局疊加），命中吸血', base: { dmg: 1.8, cd: 0.8, cnt: 2, spd: 300, pierce: 3, size: 1.3, stack: 0.004, steal: 0.02 }, up: { cnt: [0, 1, 0, 0, 1], dmg: [0.3, 0.2, 0.35, 0.35, 0.4] }, evo: { need: 'shixue', to: 'xuehai' } },
    wanjianzz: { n: '萬劍朝宗', sect: 'sword', path: 'z', evolved: 1, t: 'proj', icon: '宗', d: '【大成】劍雨滿天，劍陣繞身', base: { dmg: 2.2, cd: 0.55, cnt: 8, spd: 320, pierce: 6, size: 1.2, orbit: 6 } },
    xuehai: { n: '血海魔劍', sect: 'sword', path: 'x', evolved: 1, t: 'proj', icon: '魔', d: '【大成】血劍巨大化，殺意無上限', base: { dmg: 4.2, cd: 0.8, cnt: 3, spd: 320, pierce: 8, size: 2.2, stack: 0.006, steal: 0.035 } },
    jianhuan: { n: '御劍環身', sect: 'sword', t: 'orbit', icon: '環', d: '數把小劍繞身旋轉', base: { dmg: 0.7, cnt: 2, rad: 34, rot: 3.2 }, up: { cnt: [1, 0, 1, 0, 1], dmg: [0, 0.2, 0, 0.25, 0.2] } },
    jianqi: { n: '劍氣斬', sect: 'sword', t: 'nova', icon: '斬', d: '週期性放出一圈劍氣', base: { dmg: 1.8, cd: 2.6, rad: 70 }, up: { dmg: [0.3, 0.3, 0.4, 0.4, 0.5], rad: [8, 8, 10, 10, 12] } },
    jianyu: { n: '劍雨', sect: 'sword', t: 'strike', icon: '雨', d: '飛劍從天而降，隨機落在妖獸群中', base: { dmg: 2.0, cd: 2.2, cnt: 3, rad: 18 }, up: { cnt: [1, 1, 1, 1, 2], dmg: [0.2, 0.2, 0.3, 0.3, 0.3] } },
    // 丹谷
    pillfire: { n: '丹火彈', sect: 'pill', main: 1, t: 'zone', icon: '丹', d: '丟出丹藥，落地爆出藥火', base: { dmg: 0.75, cd: 1.3, cnt: 2, rad: 28, dur: 2.2 }, up: { cnt: [0, 1, 0, 1, 0], dmg: [0.12, 0, 0.15, 0, 0.2], rad: [0, 3, 0, 3, 4] } },
    yaowang: { n: '藥王丹', sect: 'pill', path: 'z', main: 1, t: 'zone', icon: '藥', d: '藥霧傷敵也療傷，偶爾生出靈丹', base: { dmg: 0.8, cd: 1.3, cnt: 3, rad: 30, dur: 2.6, heal: 0.6, pill: 0.06 }, up: { cnt: [0, 1, 0, 1, 1], dmg: [0.12, 0.1, 0.15, 0.15, 0.2], rad: [2, 2, 3, 3, 4] }, evo: { need: 'huichun', to: 'jiuzhuan' } },
    gu: { n: '萬蠱', sect: 'pill', path: 'x', main: 1, t: 'zone', icon: '蠱', d: '毒霧蝕骨，中毒的妖獸死時會傳染', base: { dmg: 0.95, cd: 1.3, cnt: 3, rad: 28, dur: 3.0, poison: 1, spread: 2 }, up: { cnt: [0, 1, 0, 1, 0], dmg: [0.15, 0.1, 0.2, 0.2, 0.25], spread: [0, 1, 0, 1, 1] }, evo: { need: 'dujing', to: 'guwang' } },
    jiuzhuan: { n: '九轉金丹', sect: 'pill', path: 'z', evolved: 1, t: 'zone', icon: '轉', d: '【大成】金色丹霧覆蓋四方，附帶護盾', base: { dmg: 1.3, cd: 1.1, cnt: 5, rad: 42, dur: 3.2, heal: 1.4, pill: 0.1, shield: 1 } },
    guwang: { n: '蠱王降世', sect: 'pill', path: 'x', evolved: 1, t: 'zone', icon: '王', d: '【大成】蠱霧跟隨，傳染無窮', base: { dmg: 1.5, cd: 1.0, cnt: 4, rad: 38, dur: 3.6, poison: 1, spread: 6, follow: 1 } },
    yaolu: { n: '藥爐護體', sect: 'pill', t: 'aura', icon: '爐', d: '身邊藥香繚繞，持續回血並灼傷妖獸', base: { dmg: 0.45, rad: 36, regen: 0.4 }, up: { dmg: [0.05, 0.05, 0.08, 0.08, 0.1], rad: [3, 3, 4, 4, 5], regen: [0.2, 0.2, 0.3, 0.3, 0.4] } },
    dulei: { n: '丹雷', sect: 'pill', t: 'zone', icon: '雷', d: '埋下會爆炸的丹雷', base: { dmg: 2.4, cd: 2.4, cnt: 1, rad: 32, dur: 0.35, burst: 1 }, up: { cnt: [0, 1, 0, 1, 1], dmg: [0.3, 0.2, 0.4, 0.3, 0.4] } },
    baicao: { n: '百草毒霧', sect: 'pill', t: 'aura', icon: '霧', d: '身邊毒霧讓妖獸變慢', base: { dmg: 0.55, rad: 46, slow: 0.25 }, up: { dmg: [0.06, 0.06, 0.08, 0.08, 0.1], rad: [4, 4, 5, 5, 6] } },
    // 符府
    thunder: { n: '雷符', sect: 'talis', main: 1, t: 'chain', icon: '符', d: '雷符命中後在妖獸間跳躍', base: { dmg: 1.4, cd: 0.8, cnt: 2, jump: 4, range: 60 }, up: { jump: [1, 0, 1, 1, 1], dmg: [0.15, 0.25, 0.2, 0.2, 0.3], cnt: [0, 1, 0, 0, 1] } },
    tianlei: { n: '天雷正法', sect: 'talis', path: 'z', main: 1, t: 'strike', icon: '天', d: '天雷降世，劈中的妖獸會被定身', base: { dmg: 2.0, cd: 1.15, cnt: 3, rad: 22, stun: 0.6 }, up: { cnt: [1, 1, 1, 1, 2], dmg: [0.2, 0.2, 0.3, 0.3, 0.3] }, evo: { need: 'leifa', to: 'jiuxiao' } },
    ghost: { n: '幽冥鬼道', sect: 'talis', path: 'x', main: 1, t: 'summon', icon: '鬼', d: '煉化妖魂成鬼兵，替你撲殺妖獸', base: { dmg: 1.25, cd: 1.4, cnt: 4, life: 7, spd: 120, onkill: 0.12 }, up: { cnt: [1, 1, 1, 1, 2], dmg: [0.15, 0.15, 0.2, 0.2, 0.25] }, evo: { need: 'lianhun', to: 'baigui' } },
    jiuxiao: { n: '九霄神雷', sect: 'talis', path: 'z', evolved: 1, t: 'strike', icon: '霄', d: '【大成】滿屏神雷，萬妖定身', base: { dmg: 3.4, cd: 0.9, cnt: 10, rad: 28, stun: 1.0 } },
    baigui: { n: '百鬼夜行', sect: 'talis', path: 'x', evolved: 1, t: 'summon', icon: '百', d: '【大成】百鬼橫行，殺妖即生新鬼', base: { dmg: 2.0, cd: 0.9, cnt: 6, life: 9, spd: 150, onkill: 0.35, max: 40 } },
    dingshen: { n: '定身符', sect: 'talis', t: 'zone', icon: '定', d: '貼出定身符，區域內妖獸動彈不得', base: { dmg: 0.2, cd: 3.2, cnt: 1, rad: 34, dur: 1.8, freeze: 1 }, up: { cnt: [0, 1, 0, 0, 1], rad: [3, 3, 4, 4, 5] } },
    huofu: { n: '火符', sect: 'talis', t: 'proj', icon: '火', d: '射出火符，命中爆炸', base: { dmg: 1.4, cd: 1.4, cnt: 1, spd: 200, pierce: 1, size: 1.2, boom: 22 }, up: { cnt: [1, 0, 1, 0, 1], dmg: [0, 0.3, 0, 0.35, 0.35] } },
    jiejie: { n: '結界', sect: 'talis', t: 'nova', icon: '結', d: '張開結界震退周圍妖獸', base: { dmg: 1.0, cd: 3.4, rad: 64, kb: 60 }, up: { dmg: [0.2, 0.2, 0.3, 0.3, 0.3], rad: [6, 6, 8, 8, 10] } },
    // 金剛寺
    gang: { n: '金剛罡氣', sect: 'vajra', main: 1, t: 'aura', icon: '罡', d: '貼身罡氣持續傷害並推開妖獸，受到傷害 -20%', base: { dmg: 1.6, rad: 40, kb: 5, dr: 0.2 }, up: { dmg: [0.12, 0.12, 0.15, 0.15, 0.2], rad: [4, 4, 5, 5, 6] } },
    mingwang: { n: '不動明王', sect: 'vajra', path: 'z', main: 1, t: 'aura', icon: '明', d: '罡氣更廣，受到傷害大減', base: { dmg: 1.8, rad: 46, kb: 6, dr: 0.3}, up: { dmg: [0.12, 0.12, 0.15, 0.15, 0.2], rad: [4, 4, 5, 5, 6], dr: [0.02, 0.02, 0.03, 0.03, 0.05] }, evo: { need: 'jinzhong', to: 'mingwangfx' } },
    shura: { n: '修羅', sect: 'vajra', path: 'x', main: 1, t: 'aura', icon: '修', d: '越是殘血傷害越高，攻擊吸血', base: { dmg: 2.1, rad: 40, kb: 4, rage: 2.2, steal: 0.015, dr: 0.12 }, up: { dmg: [0.15, 0.15, 0.2, 0.2, 0.25], rad: [3, 3, 4, 4, 5] }, evo: { need: 'xuenu', to: 'shuraxh' } },
    mingwangfx: { n: '明王法相', sect: 'vajra', path: 'z', evolved: 1, t: 'aura', icon: '相', d: '【大成】金身法相，反震一切', base: { dmg: 3.6, rad: 72, kb: 10, dr: 0.45, reflect: 1.5 } },
    shuraxh: { n: '修羅血海', sect: 'vajra', path: 'x', evolved: 1, t: 'aura', icon: '海', d: '【大成】血海翻騰，殘血即無敵', base: { dmg: 4.2, rad: 64, kb: 6, rage: 3.5, steal: 0.03 } },
    fumo: { n: '伏魔掌', sect: 'vajra', t: 'proj', icon: '掌', d: '推出巨大掌印，貫穿一排妖獸', base: { dmg: 2.2, cd: 2.0, cnt: 1, spd: 170, pierce: 99, size: 2.2 }, up: { cnt: [0, 1, 0, 0, 1], dmg: [0.3, 0.2, 0.4, 0.4, 0.4] } },
    chanzhang: { n: '禪杖', sect: 'vajra', t: 'orbit', icon: '杖', d: '禪杖繞身橫掃', base: { dmg: 1.0, cnt: 1, rad: 44, rot: 2.4, size: 1.6 }, up: { cnt: [0, 1, 0, 1, 0], dmg: [0.25, 0, 0.3, 0, 0.35] } },
    shizi: { n: '獅子吼', sect: 'vajra', t: 'nova', icon: '吼', d: '佛門獅子吼，震暈周圍妖獸', base: { dmg: 1.2, cd: 3.6, rad: 80, stun: 0.8 }, up: { dmg: [0.25, 0.25, 0.3, 0.3, 0.35], rad: [6, 6, 8, 8, 10] } },
  };
  // 每個門派可以在局內抽到的本門功法（主招式之外）
  const SECT_SK = { sword: ['jianhuan', 'jianqi', 'jianyu'], pill: ['yaolu', 'dulei', 'baicao'], talis: ['dingshen', 'huofu', 'jiejie'], vajra: ['fumo', 'chanzhang', 'shizi'] };
  // 旁門左道：其他門派可學的招式，標記正／邪；學了邪的道心往邪偏
  const SIDE = { jianyu: 'z', jianqi: 'z', baicao: 'x', dulei: 'z', huofu: 'z', dingshen: 'z', shizi: 'z', fumo: 'z', jianhuan: 'z', yaolu: 'z', jiejie: 'z', chanzhang: 'z' };
  const SIDE_EVIL = { // 旁門魔功：只會以「邪」旁門出現
    xuejian: { n: '血煞劍氣', sect: 'sword', t: 'proj', icon: '煞', d: '【魔功】血色劍氣，命中吸血', base: { dmg: 1.8, cd: 1.5, cnt: 2, spd: 260, pierce: 3, size: 1.2, steal: 0.02 }, up: { cnt: [0, 1, 0, 1, 0], dmg: [0.3, 0.2, 0.3, 0.3, 0.4] } },
    shigu: { n: '屍蠱', sect: 'pill', t: 'zone', icon: '屍', d: '【魔功】屍毒爆散，會傳染', base: { dmg: 0.8, cd: 2.0, cnt: 2, rad: 30, dur: 2.5, poison: 1, spread: 2 }, up: { cnt: [0, 1, 0, 1, 0], dmg: [0.15, 0.1, 0.2, 0.2, 0.25] } },
    youhun: { n: '拘魂', sect: 'talis', t: 'summon', icon: '拘', d: '【魔功】拘來亡魂撲殺妖獸', base: { dmg: 1.2, cd: 2.0, cnt: 2, life: 6, spd: 120 }, up: { cnt: [1, 0, 1, 0, 1], dmg: [0, 0.25, 0, 0.3, 0.3] } },
    xueshou: { n: '血手印', sect: 'vajra', t: 'nova', icon: '印', d: '【魔功】以血換力的爆發掌印', base: { dmg: 2.4, cd: 3.0, rad: 70, cost: 0.03 }, up: { dmg: [0.4, 0.4, 0.5, 0.5, 0.6], rad: [6, 6, 8, 8, 10] } },
  };
  Object.assign(SK, SIDE_EVIL);
  for (const k in SIDE_EVIL) SIDE[k] = 'x';
  const SIDE_DAO = { z: 4, x: -12 }; // 學旁門時道心變化

  // 心法（被動）；evo：某主招式大成的必要心法（只有對應門派、路線才會抽到）
  const PASSIVE = {
    lingli: { n: '靈力', icon: '靈', d: '所有功法傷害 +10%', per: { dmg: 0.1 } },
    shenfa: { n: '身法', icon: '步', d: '移動速度 +8%', per: { spd: 0.08 } },
    shenshi: { n: '神識', icon: '識', d: '拾取靈氣範圍 +25%', per: { pick: 0.25 } },
    gengu: { n: '根骨', icon: '骨', d: '氣血上限 +12%', per: { hp: 0.12 } },
    huiqi: { n: '回氣', icon: '氣', d: '功法冷卻 -6%', per: { cdr: 0.06 } },
    wudao: { n: '悟道', icon: '悟', d: '局內靈氣獲得 +10%', per: { xp: 0.1 } },
    jianxin: { n: '劍心通明', icon: '心', d: '飛劍速度 +10%，可讓萬劍歸宗大成', per: { dmg: 0.04 }, evo: 'wanjian' },
    shixue: { n: '嗜血', icon: '嗜', d: '吸血 +0.5%，可讓血魔劍大成', per: { steal: 0.005 }, evo: 'bloodsword' },
    huichun: { n: '回春訣', icon: '春', d: '每秒回血 +0.3%，可讓藥王丹大成', per: { regen: 0.003 }, evo: 'yaowang' },
    dujing: { n: '毒經', icon: '經', d: '毒傷 +8%，可讓萬蠱大成', per: { dmg: 0.05 }, evo: 'gu' },
    leifa: { n: '雷法真解', icon: '解', d: '雷法傷害 +8%，可讓天雷正法大成', per: { dmg: 0.05 }, evo: 'tianlei' },
    lianhun: { n: '煉魂術', icon: '魂', d: '鬼兵存在更久，可讓幽冥鬼道大成', per: { dmg: 0.05 }, evo: 'ghost' },
    jinzhong: { n: '金鐘罩', icon: '鐘', d: '受到傷害 -4%，可讓不動明王大成', per: { dr: 0.04 }, evo: 'mingwang' },
    xuenu: { n: '血怒', icon: '怒', d: '殘血時更強，可讓修羅大成', per: { dmg: 0.05 }, evo: 'shura' },
  };
  const MAX_ACT = 4, MAX_PAS = 4, MAX_SIDE = 1, MAXLV = 5;

  // ---------------- 奇遇 ----------------
  const EVENTS = [
    { n: '受傷的村民', d: '山道旁倒著一位受傷的村民，懷裡緊抱著一個發光的布包。', a: { t: '出手相救', dao: 10, heal: 0.5 }, b: { t: '奪走布包', dao: -15, stone: 1 } },
    { n: '無主靈脈', d: '你發現一條無主靈脈，附近還有幾個散修在打坐。', a: { t: '與散修共享', dao: 8, xpOrb: 1 }, b: { t: '趕走他們獨吞', dao: -12, xpOrb: 3 } },
    { n: '被困的妖獸幼崽', d: '一隻妖獸幼崽被獵網纏住，牠體內的妖丹隱隱發光。', a: { t: '放牠回山林', dao: 10, heal: 0.3 }, b: { t: '剖取妖丹', dao: -12, buff: 'atk' } },
    { n: '魔功殘卷', d: '石縫裡夾著一卷散發黑氣的殘卷，上面寫著速成魔功。', a: { t: '將它焚毀', dao: 6, heal: 0.2 }, b: { t: '偷偷修習', dao: -20, evilSkill: 1 } },
    { n: '落難的正道弟子', d: '一名正道弟子被妖獸圍困，身上帶著宗門的丹藥。', a: { t: '護送他脫困', dao: 10, buff: 'shield' }, b: { t: '趁亂劫掠', dao: -15, stone: 1 } },
  ];

  // ---------------- 法寶 ----------------
  const ITEMS = {
    qiankun: { n: '乾坤袋', d: '拾取範圍 +30%', fx: { pick: 0.3 } },
    huxin: { n: '護心鏡', d: '氣血上限 +15%', fx: { hp: 0.15 } },
    zijin: { n: '紫金葫蘆', d: '修為獲得 +15%', fx: { cult: 0.15 } },
    zhanxian: { n: '斬仙飛刀', d: '傷害 +12%', fx: { dmg: 0.12 } },
    fenghuo: { n: '風火輪', d: '移動速度 +12%', fx: { spd: 0.12 } },
    dinghai: { n: '定海珠', d: '受到傷害 -10%', fx: { dr: 0.1 } },
    juling: { n: '聚靈陣盤', d: '靈石獲得 +25%', fx: { stone: 0.25 } },
    shenhuo: { n: '九龍神火罩', d: '功法冷卻 -8%', fx: { cdr: 0.08 } },
  };
  const ITEM_SLOTS = 3;

  // ---------------- 洞府（永久升級，花靈石） ----------------
  const CAVE = {
    gengu: { n: '根骨', d: '氣血 +8%', fx: { hp: 0.08 }, max: 20 },
    lingli: { n: '靈力', d: '傷害 +6%', fx: { dmg: 0.06 }, max: 20 },
    wuxing: { n: '悟性', d: '修為獲得 +5%', fx: { cult: 0.05 }, max: 20 },
    shenfa: { n: '身法', d: '移動速度 +3%', fx: { spd: 0.03 }, max: 10 },
    shenshi: { n: '神識', d: '拾取範圍 +8%', fx: { pick: 0.08 }, max: 10 },
  };
  const caveCost = lv => Math.round(60 * Math.pow(1.45, lv));
  const PUPPET_COST = 4000; // 替死傀儡


  // ================= 造型（只改外觀，不影響數值） =================
  // type：outfit 時裝、head 頭飾、weapon 武器造型（限定門派）、trail 技能拖尾、aura 光環、title 稱號
  // r：稀有度 1 普通 2 稀有 3 史詩 4 傳說；price：{ stone } 靈石或 { jade } 仙玉；gacha：只能祈願取得
  // ================= 外貌（建角免費選；之後用洞府「易容鏡」改） =================
  const LOOK = {
    hair: { ponytail: '高馬尾', lowtail: '低馬尾', braid: '側辮', long: '中分長髮', short: '短碎髮', bob: '齊肩短髮', bald: '光頭' },
    eye: { round: '圓圓大眼', cat: '上揚貓眼', droop: '下垂溫柔眼', phoenix: '細長鳳眼', bean: '豆豆眼', smile: '瞇瞇眼' },
    iris: { blue: ['靛藍', '#3a7fd0'], green: ['翠綠', '#3c9a52'], purple: ['紫羅蘭', '#8a5ae0'], gold: ['琥珀金', '#d89a20'], brown: ['栗棕', '#7a4a2a'], black: ['墨黑', '#2a2230'] },
    sectHair: { sword: 'ponytail', pill: 'braid', talis: 'long', vajra: 'bald' },
    sectIris: { sword: 'blue', pill: 'green', talis: 'purple', vajra: 'brown' },
    hairCol: '#45405e', mirror: 300,
  };
  function cleanLook(l, sect) { l = l || {};
    return { hair: LOOK.hair[l.hair] ? l.hair : LOOK.sectHair[sect] || 'ponytail', eye: LOOK.eye[l.eye] ? l.eye : 'round', iris: LOOK.iris[l.iris] ? l.iris : LOOK.sectIris[sect] || 'blue' }; }
  const RARITY = { 1: { n: '普通', col: '#c8c8c8' }, 2: { n: '稀有', col: '#4aa0ff' }, 3: { n: '史詩', col: '#b07aff' }, 4: { n: '傳說', col: '#ffb020' } };
  const COS = {
    o_qingshan: { type: 'outfit', n: '青衫書生', r: 1, price: { stone: 300 }, look: { robe: '#d8ecd8', shade: '#a8c8a8', trim: '#4a8a5a', trim2: '#2a5a3a' } },
    o_xuanyi: { type: 'outfit', n: '玄衣夜行', r: 2, price: { stone: 900 }, look: { robe: '#2e2e40', shade: '#18181f', trim: '#5a6a8a', trim2: '#3a4a6a', hairStyle: 'long' } },
    o_baiyi: { type: 'outfit', n: '白衣劍仙', r: 2, price: { stone: 1200 }, look: { robe: '#ffffff', shade: '#d8e4f0', trim: '#7fb8e8', trim2: '#4a7ab0', hairStyle: 'long', pattern: 'cloud', cape: '#eef6ff', cape2: '#c4d8ee' } },
    o_chiyan: { type: 'outfit', n: '赤焰嫁衣', r: 3, price: { jade: 680 }, look: { robe: '#e8403a', shade: '#a8201e', trim: '#ffcf4a', trim2: '#b8861a', hair: '#1a1420', hair2: '#3a2a34', iris: '#ff6a3a', pattern: 'flame' } },
    o_yueying: { type: 'outfit', n: '月影仙子', r: 3, gacha: 1, look: { robe: '#dfe6ff', shade: '#a8b4e8', trim: '#6a7ad8', trim2: '#3a4aa8', hair: '#d8dcf0', hair2: '#f4f6ff', iris: '#6a7ad8', hairStyle: 'long', pattern: 'cloud', cape: '#c8d0ff', cape2: '#8a96e0' } },
    o_mozun: { type: 'outfit', n: '黑金魔尊', r: 4, gacha: 1, dark: 1, look: { robe: '#1e1824', shade: '#0e0a12', trim: '#e8c050', trim2: '#9a7420', hair: '#e8e4f0', hair2: '#b8b0cc', iris: '#e0303a', pattern: 'gold', cape: '#3a1020', cape2: '#1a0610', evil: 1 } },
    o_sakura: { type: 'outfit', n: '櫻花祭', r: 4, gacha: 1, look: { robe: '#ffe6ee', shade: '#f2b8c8', trim: '#e86a90', trim2: '#b8406a', hair: '#3a2a3a', hair2: '#5a405a', iris: '#e86a90', hairStyle: 'long', pattern: 'sakura' } },
    h_flower: { type: 'head', n: '桃花簪', r: 1, price: { stone: 200 }, look: { head: 'flower' } },
    h_douli: { type: 'head', n: '竹斗笠', r: 2, price: { stone: 600 }, look: { head: 'douli' } },
    h_mask: { type: 'head', n: '狐仙面', r: 2, gacha: 1, look: { head: 'mask' } },
    h_crown: { type: 'head', n: '紫金冠', r: 3, price: { jade: 300 }, look: { head: 'crown' } },
    w_xinghe: { type: 'weapon', sect: 'sword', n: '星河劍', r: 2, price: { stone: 1500 }, fx: 'xinghe' },
    w_chixiao: { type: 'weapon', sect: 'sword', n: '赤霄劍', r: 3, price: { jade: 480 }, fx: 'chixiao' },
    w_gujian: { type: 'weapon', sect: 'sword', n: '白骨劍', r: 3, price: { jade: 480 }, fx: 'gujian' },
    w_zijin: { type: 'weapon', sect: 'pill', n: '紫金丹', r: 2, price: { stone: 1500 }, fx: 'zijin' },
    w_cuiyu: { type: 'weapon', sect: 'pill', n: '翠玉丹', r: 3, price: { jade: 480 }, fx: 'cuiyu' },
    w_jinfu: { type: 'weapon', sect: 'talis', n: '金光符', r: 2, price: { stone: 1500 }, fx: 'jinfu' },
    w_xuefu: { type: 'weapon', sect: 'talis', n: '血煞符', r: 3, price: { jade: 480 }, fx: 'xuefu' },
    w_zilian: { type: 'weapon', sect: 'vajra', n: '紫蓮罡', r: 2, price: { stone: 1500 }, fx: 'zilian' },
    w_qinglian: { type: 'weapon', sect: 'vajra', n: '青蓮罡', r: 3, price: { jade: 480 }, fx: 'qinglian' },
    t_fire: { type: 'trail', n: '火焰拖尾', r: 2, price: { stone: 1500 }, fx: 'fire' },
    t_thunder: { type: 'trail', n: '雷電拖尾', r: 2, gacha: 1, fx: 'thunder' },
    t_star: { type: 'trail', n: '星光拖尾', r: 3, price: { jade: 380 }, fx: 'star' },
    t_sakura: { type: 'trail', n: '櫻花拖尾', r: 3, gacha: 1, fx: 'sakura' },
    a_star: { type: 'aura', n: '星辰環繞', r: 3, price: { jade: 580 }, fx: 'star' },
    a_flame: { type: 'aura', n: '業火纏身', r: 3, gacha: 1, fx: 'flame' },
    a_moon: { type: 'aura', n: '皓月輪', r: 4, gacha: 1, fx: 'moon' },
    a_lotus: { type: 'aura', n: '步步生蓮', r: 4, gacha: 1, fx: 'lotus' },
    ti_jianchi: { type: 'title', n: '劍癡', r: 1, price: { stone: 500 } },
    ti_tufu: { type: 'title', n: '萬妖屠夫', r: 2, price: { stone: 2000 } },
    ti_xianyuan: { type: 'title', n: '仙緣深厚', r: 3, gacha: 1 },
    c_brown: { type: 'hcol', n: '栗棕髮', r: 1, price: { stone: 150 }, look: { hair: '#6a4028' } },
    c_red: { type: 'hcol', n: '赤紅髮', r: 1, price: { stone: 200 }, look: { hair: '#b8323a' } },
    c_blue: { type: 'hcol', n: '靛藍髮', r: 1, price: { stone: 200 }, look: { hair: '#2e4a9a' } },
    c_silver: { type: 'hcol', n: '銀白髮', r: 1, price: { stone: 300 }, look: { hair: '#dcdcec' } },
    c_pink: { type: 'hcol', n: '桃粉髮', r: 1, price: { stone: 300 }, look: { hair: '#f2a0bc' } },
    c_gold: { type: 'hcol', n: '鎏金髮', r: 2, price: { stone: 800 }, look: { hair: '#e8b840' } },
    c_star: { type: 'hcol', n: '星空髮', r: 3, price: { jade: 280 }, look: { hair: '#2a2a6a', hfx: 'star' } },
    c_flame: { type: 'hcol', n: '業火髮', r: 3, gacha: 1, look: { hair: '#d8302a', hfx: 'flame' } },
    hr_twin: { type: 'hair', n: '超長雙馬尾', r: 3, price: { jade: 380 }, look: { hs: 'twin' } },
    hr_cloud: { type: 'hair', n: '祥雲高髻', r: 3, price: { jade: 380 }, look: { hs: 'cloud' } },
    hr_dragon: { type: 'hair', n: '龍角髮', r: 4, gacha: 1, look: { hs: 'dragon' } },
  };
  const COS_TYPES = { outfit: '時裝', hair: '髮型', hcol: '髮色', head: '頭飾', weapon: '武器', trail: '拖尾', aura: '光環', title: '稱號' };
  // 限定祈願：機率公開；80 抽必出傳說，每 10 抽至少一件史詩以上
  const GACHA = { n: '魔尊降世', d: '限時祈願・傳說時裝「黑金魔尊」機率提升', cost1: 16, cost10: 160, pity: 80, pity10: 10,
    rates: [[4, 0.016], [3, 0.13], [2, 0.354], [0, 0.5]], // 0 = 仙緣碎片 ×5
    up: 'o_mozun', upShare: 0.5,
    pool: { 4: ['o_mozun', 'o_sakura', 'a_moon', 'a_lotus', 'hr_dragon'], 3: ['o_yueying', 't_sakura', 'a_flame', 'ti_xianyuan', 'c_flame'], 2: ['h_mask', 't_thunder', 'o_xuanyi', 'h_douli'] },
    dupShards: { 4: 60, 3: 20, 2: 6, 1: 2 }, shardPrice: { 4: 360, 3: 120, 2: 40 }, freeShards: 5 };
  const JADE = { start: 320, stage: 20, realm: 100, daily: 20 };
  // ================= 儲值（上架前是測試模式：不扣錢直接給；上架後改由 App 內購驗證後呼叫 payGrant） =================
  const PAY = {
    packs: [
      { id: 'p60', n: '一小袋仙玉', price: 30, jade: 60, bonus: 0 },
      { id: 'p330', n: '一袋仙玉', price: 150, jade: 300, bonus: 30 },
      { id: 'p680', n: '一盒仙玉', price: 300, jade: 600, bonus: 80 },
      { id: 'p1280', n: '一箱仙玉', price: 590, jade: 1100, bonus: 180 },
      { id: 'p3280', n: '一櫃仙玉', price: 1490, jade: 2800, bonus: 480 },
      { id: 'p6480', n: '仙玉寶庫', price: 2990, jade: 5600, bonus: 880 },
    ],
    card: { id: 'card', n: '修仙月卡', price: 150, now: 300, daily: 50, days: 30, maxDays: 180 },
  };
  const today = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10); // 台灣日期
  const dayAdd = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
  // 發放儲值內容；orderId 用來避免同一筆訂單重複發放
  function payGrant(p, k, orderId) {
    ensure(p); if (orderId) { if (p.orders.includes(orderId)) return { ok: false, msg: '這筆訂單已經發放過了' }; p.orders.unshift(orderId); p.orders.length = Math.min(p.orders.length, 300); }
    if (k === PAY.card.id) { const C = PAY.card, t = today(); const left = p.card && p.card.until >= t ? (Date.parse(p.card.until) - Date.parse(t)) / 864e5 + 1 : 0;
      if (left + C.days > C.maxDays) return { ok: false, msg: `月卡最多累積 ${C.maxDays} 天` };
      p.card = { until: dayAdd(left ? p.card.until : dayAdd(t, -1), C.days), last: p.card && left ? p.card.last : '' };
      p.jade += C.now; p.paid = (p.paid || 0) + C.price; return { ok: true, msg: `月卡生效至 ${p.card.until}，獲得仙玉 ${C.now}`, jade: C.now }; }
    const pk = PAY.packs.find(x => x.id === k); if (!pk) return { ok: false, msg: '沒有這個商品' };
    const first = !p.firstPay.includes(k), got = first ? pk.jade * 2 : pk.jade + pk.bonus;
    if (first) p.firstPay.push(k); p.jade += got; p.paid = (p.paid || 0) + pk.price;
    return { ok: true, msg: `獲得仙玉 ${got}${first ? '（首儲雙倍）' : ''}`, jade: got };
  }
  function ensure(p) { // 舊存檔補上造型欄位
    if (!p) return p;
    if (!p.look) { p.look = cleanLook(null, p.sect); p.mirrorFree = 1; } // 舊角色：沿用門派原本的樣子，第一次易容免費
    if (p.jade == null) p.jade = JADE.start; if (!p.own) p.own = []; if (!p.wear) p.wear = {};
    if (p.shards == null) p.shards = 0; if (p.pity == null) p.pity = 0; if (p.pity10 == null) p.pity10 = 0; if (!p.glog) p.glog = []; if (!p.daily) p.daily = ''; if (!p.orders) p.orders = []; if (!p.firstPay) p.firstPay = []; if (p.card === undefined) p.card = null;
    return p;
  }
  function gachaRoll(p, rnd) {
    const G = GACHA; p.pity++; p.pity10++;
    let r;
    if (p.pity >= G.pity) r = 4;
    else { let x = rnd(), acc = 0; r = 0; for (const [k, w] of G.rates) { acc += w; if (x < acc) { r = k; break; } } }
    if (r < 3 && p.pity10 >= G.pity10) r = 3;
    if (r >= 3) p.pity10 = 0; if (r === 4) p.pity = 0;
    if (r === 0) { p.shards += G.freeShards; return { r: 0, n: `仙緣碎片 ×${G.freeShards}` }; }
    let k; const pool = G.pool[r];
    if (r === 4 && rnd() < G.upShare) k = G.up; else k = pool[Math.floor(rnd() * pool.length)];
    if (p.own.includes(k)) { const sh = G.dupShards[r]; p.shards += sh; return { r, k, n: COS[k].n, dup: sh }; }
    p.own.push(k); return { r, k, n: COS[k].n, isNew: 1 };
  }

  // ---------------- 規則數值 ----------------
  const RUN = { normal: 300, tribulation: 180, forbidden: 300, atone: 180, entry: 180, punish: 180 }; // 一局秒數（到時間後王出現）
  const RULE = {
    deathKeep: 0.5,            // 一般陣亡：戰利品帶走一半
    injuryRuns: 3, injuryMul: 0.8, // 重傷：之後幾局屬性 ×0.8
    soulInjuryRuns: 5, soulCd: 10, // 元嬰出竅：受損局數、冷卻局數
    hardcoreMul: 1.3,          // 一命修仙修為加成
    rebuildMul: 1.5,           // 散功後重修加成
    karmaRuns: 10,             // 洗白後業障局數
    convertCd: 20, defectCd: 30, // 轉正邪、叛逃後的冷卻局數
    huntRuns: 15,              // 叛逃後被追殺局數
    daoStable: 30,             // 道心穩固門檻
    daoFree: 20,               // 心魔劫時，道心在 ±20 以內可自己選路
    forbidMul: 2,              // 禁地收益倍率
  };
  // 局內角色基礎數值（依境界成長）
  const baseAtk = s => Math.round(12 * Math.pow(1.32, s));
  const baseHp = s => Math.round(130 * Math.pow(1.3, s));
  // 一局最多合理的擊殺速度（防作弊用）：每秒幾隻
  const MAX_KPS = 14;

  // ---------------- 角色 ----------------
  function newProfile(name, sect, hardcore, look) {
    return { v: 1, name, sect, look: cleanLook(look, sect), mirrorFree: 0, hardcore: hardcore ? 1 : 0, dead: 0, stage: 0, cult: 0, dao: 0, path: '', stone: 0,
      cave: {}, items: [], equip: [], puppet: 0, injury: 0, soulInjury: 0, soulCd: 0,
      runs: 0, kills: 0, best: 0, cd: 0, karma: 0, rebuildTo: -1, expelled: 0,
      formerSect: '', returnLeft: 1, hunt: null, pending: null, log: [], created: Date.now(),
      jade: JADE.start, own: [], wear: {}, shards: 0, pity: 0, pity10: 0, glog: [], daily: '', orders: [], firstPay: [], card: null };
  }
  const isZ = p => p.path === 'z', isX = p => p.path === 'x';
  const mainSkill = p => (p.path ? SECTS[p.sect].paths[p.path] : SECTS[p.sect].base);
  const lineName = p => (p.path ? PATHLINE[p.sect][p.path] : '未分正邪');
  function sumFx(p) {
    const f = { hp: 0, dmg: 0, cult: 0, spd: 0, pick: 0, dr: 0, stone: 0, cdr: 0 };
    for (const k in p.cave || {}) { const c = CAVE[k]; if (c) for (const e in c.fx) f[e] += c.fx[e] * p.cave[k]; }
    for (const k of p.equip || []) { const it = ITEMS[k]; if (it) for (const e in it.fx) f[e] += it.fx[e]; }
    return f;
  }
  // 進場時的角色數值
  function runStats(p) {
    const f = sumFx(p), inj = (p.injury > 0 || p.soulInjury > 0) ? RULE.injuryMul : 1;
    const stable = (isZ(p) && p.dao >= RULE.daoStable) || (isX(p) && p.dao <= -RULE.daoStable);
    return { atk: baseAtk(p.stage) * (1 + f.dmg) * inj * (stable ? 1.1 : 1), hp: Math.round(baseHp(p.stage) * (1 + f.hp) * inj),
      spd: 72 * (1 + f.spd), pick: 30 * (1 + f.pick), dr: Math.min(0.6, f.dr), cdr: Math.min(0.4, f.cdr), stable };
  }
  // 這一局會不會有心魔：道心跟路線相反、或業障未消
  function heartDemonRate(p) {
    let r = 0; if (p.karma > 0) r += 0.5;
    if (isZ(p) && p.dao < 0) r += Math.min(1, -p.dao / 60);
    if (isX(p) && p.dao > 0) r += Math.min(1, p.dao / 60);
    return r;
  }
  const clampDao = d => Math.max(-100, Math.min(100, Math.round(d)));
  const canTribulate = p => p.stage % 3 === 2 && p.cult >= NEED[p.stage] && p.stage < STAGEN - 1;
  const logp = (p, t) => { p.log.unshift({ t, at: Date.now() }); p.log.length = Math.min(p.log.length, 30); };

  // 加修為：自動在同一個大境界內升小階；後期滿了停住（要渡劫）
  function addCult(p, n) {
    p.cult += n;
    while (p.stage < STAGEN - 1 && p.stage % 3 !== 2 && p.cult >= NEED[p.stage]) { p.cult -= NEED[p.stage]; p.stage++; p.jade = (p.jade || 0) + JADE.stage; logp(p, `突破至 ${stageName(p.stage)}`); }
    if (p.stage % 3 === 2 || p.stage === STAGEN - 1) p.cult = Math.min(p.cult, NEED[p.stage]);
    if (p.rebuildTo >= 0 && p.stage >= p.rebuildTo) p.rebuildTo = -1;
  }
  // 掉境界：n 階，最低到 floor
  function dropStage(p, n, floor) { p.stage = Math.max(floor || 0, p.stage - n); p.cult = 0; }

  // ---------------- 一局的結算 ----------------
  // 報告 r：{ mode, sec, kills, elites, boss(0/1), died, dao, stone(局內撿到的靈石數), hunterTier(擊殺到第幾級追殺者, -1 沒殺), item(撿到的法寶 key) }
  function settleRun(p, r, srv) {
    const mode = r.mode, f = sumFx(p), out = { cult: 0, stone: 0, msgs: [] };
    const sec = Math.max(0, Math.min(r.sec | 0, (RUN[mode] || 300) + 600));
    let kills = Math.max(0, Math.min(r.kills | 0, Math.ceil(sec * MAX_KPS) + 50));
    if (srv && srv.elapsed != null && srv.elapsed < sec - 8) { out.msgs.push('時間不符，這局不予計算'); return out; }
    const elites = Math.max(0, Math.min(r.elites | 0, Math.floor(sec / 12) + 4)), win = !!r.boss && !r.died && sec >= (RUN[mode] || 300) - 5;
    const rm = realmOf(p.stage), mapMul = Math.pow(1.9, rm);
    let cult = (kills * 0.25 + elites * 8 + (win ? 80 : 0)) * mapMul * (1 + f.cult);
    let stone = (kills * 0.08 + elites * 4 + (r.stone | 0) * 6 + (win ? 40 : 0)) * mapMul * (1 + f.stone);
    if (mode === 'forbidden') { cult *= RULE.forbidMul; stone *= RULE.forbidMul; }
    if (p.hardcore) cult *= RULE.hardcoreMul;
    if (p.rebuildTo >= 0) cult *= RULE.rebuildMul;
    if (mode === 'tribulation' || mode === 'atone' || mode === 'entry' || mode === 'punish') { cult *= 0.3; stone *= 0.5; }
    p.runs++; p.kills += kills; p.best = Math.max(p.best, kills);
    p.dao = clampDao(p.dao + Math.max(-60, Math.min(40, r.dao | 0)));
    if (p.injury > 0) p.injury--; if (p.soulInjury > 0) p.soulInjury--; if (p.soulCd > 0) p.soulCd--;
    if (p.cd > 0) p.cd--; if (p.karma > 0) p.karma--;
    // 追殺
    if (p.hunt) {
      const t = r.hunterTier | 0;
      if (r.hunterTier != null && t >= p.hunt.tier && t <= p.hunt.tier) { p.hunt.tier++; out.msgs.push(`擊殺追殺者（${HUNTER_TIERS[t]}）`); }
      if (p.hunt.tier >= HUNTER_TIERS.length) { p.hunt = null; out.msgs.push('斬殺掌門，因果已斷，追殺結束'); }
      else if (--p.hunt.left <= 0) { p.hunt = null; out.msgs.push('追殺令期滿，原門派不再追殺'); }
    }
    if (r.died) {
      // 硬核：一死就永久消失
      if (p.hardcore) { p.dead = Date.now(); logp(p, `於 ${stageName(p.stage)} 身死道消，一命修仙至此終結`); out.msgs.push('一命修仙……你的仙途在此終結。'); return out; }
      if (mode === 'forbidden') {
        // 第三層：身死道消
        if (p.puppet > 0) { p.puppet--; out.msgs.push('替死傀儡碎裂，替你擋下身死道消！'); }
        else if (p.stage >= SOUL_STAGE && p.soulCd <= 0) { p.soulInjury = RULE.soulInjuryRuns; p.soulCd = RULE.soulCd; out.msgs.push('元嬰出竅逃過一劫，元嬰受損，需休養數局'); }
        else {
          const from = stageName(p.stage); dropStage(p, 3, 0);
          let broke = ''; if (p.items.length) { const i = Math.floor(Math.random() * p.items.length); broke = p.items[i]; p.items.splice(i, 1); p.equip = p.equip.filter(k => p.items.includes(k)); }
          out.msgs.push(`身死道消！奪舍重生，境界從 ${from} 跌至 ${stageName(p.stage)}` + (broke ? `，法寶「${ITEMS[broke].n}」碎裂` : ''));
          logp(p, `禁地身死道消，奪舍重生至 ${stageName(p.stage)}`);
        }
        cult = 0; stone *= RULE.deathKeep;
      } else if (mode === 'tribulation') {
        // 第二層：渡劫失敗
        const from = stageName(p.stage); dropStage(p, 1, 0); p.injury = RULE.injuryRuns;
        out.msgs.push(`渡劫失敗！境界從 ${from} 跌至 ${stageName(p.stage)}，身受重傷（${RULE.injuryRuns} 局內屬性下降）`);
        logp(p, `渡劫失敗，跌落 ${stageName(p.stage)}`); cult = 0; stone *= RULE.deathKeep;
      } else { cult *= RULE.deathKeep; stone *= RULE.deathKeep; out.msgs.push('不敵妖獸，只帶回一半戰利品'); }
    }
    cult = Math.round(cult); stone = Math.round(stone); out.cult = cult; out.stone = stone;
    p.stone += stone;
    if (r.item && ITEMS[r.item] && win && !p.items.includes(r.item)) { p.items.push(r.item); if (p.equip.length < ITEM_SLOTS) p.equip.push(r.item); out.msgs.push(`獲得法寶「${ITEMS[r.item].n}」`); }
    // 特殊局的勝利結果
    if (win && mode === 'tribulation') {
      if (p.stage === PATH_STAGE - 1) { p.stage++; p.cult = 0; p.pending = { type: 'choosePath' }; out.msgs.push('渡過雷劫，心魔劫將至——你必須選擇自己的道'); }
      else { p.stage++; p.cult = 0; out.msgs.push(`渡劫成功！晉升 ${stageName(p.stage)}`); logp(p, `渡劫成功，晉升 ${stageName(p.stage)}`); }
      p.jade += JADE.realm; out.msgs.push(`突破大境界，獲得仙玉 ${JADE.realm}`);
    }
    if (win) { const day = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10); if (p.daily !== day) { p.daily = day; p.jade += JADE.daily; out.msgs.push(`今日首勝，獲得仙玉 ${JADE.daily}`); } }
    if (win && p.pending && p.pending.trial === mode) finishPending(p, out);
    addCult(p, cult);
    return out;
  }

  // 轉換完成（通過試煉後）
  function finishPending(p, out) {
    const pd = p.pending; p.pending = null;
    if (pd.type === 'atone') { p.path = 'z'; p.dao = Math.max(p.dao, 20); p.karma = RULE.karmaRuns; p.expelled = 0; p.cd = RULE.convertCd; out.msgs.push('洗心池試煉通過，回頭是岸，重歸正道（業障未消，心魔仍會找上門）'); logp(p, '回頭是岸，重歸正道'); }
    if (pd.type === 'defect') { p.formerSect = p.sect; p.sect = pd.to; if (pd.path) p.path = pd.path; p.hunt = { tier: 0, left: RULE.huntRuns, from: p.formerSect }; p.cd = RULE.defectCd; p.expelled = 0;
      out.msgs.push(`入門試煉通過，正式拜入${SECTS[p.sect].n}。${SECTS[p.formerSect].n}已發出追殺令！`); logp(p, `叛出${SECTS[p.formerSect].n}，拜入${SECTS[p.sect].n}`); }
    if (pd.type === 'return') { const from = p.sect; p.sect = p.formerSect; p.formerSect = ''; p.returnLeft = 0; p.hunt = null; p.cd = RULE.defectCd;
      out.msgs.push(`受完宗門懲戒，重回${SECTS[p.sect].n}。此生不得再叛。`); logp(p, `負荊請罪，從${SECTS[from].n}重回${SECTS[p.sect].n}`); }
  }

  // ---------------- 局外動作（伺服器和離線共用） ----------------
  // 回傳 { ok, msg, out }，會直接修改 p
  function act(p, a, srv) {
    const no = msg => ({ ok: false, msg });
    if (!a || typeof a.type !== 'string') return no('指令錯誤');
    if (a.type === 'create') return no('請用建立角色');
    if (!p) return no('尚未建立角色');
    if (p.dead) return no('此角色已身死道消');
    ensure(p);
    switch (a.type) {
      case 'mirror': { // 洞府易容鏡
        const nl = cleanLook(a.look, p.sect), free = p.mirrorFree;
        if (!free && p.stone < LOOK.mirror) return no('靈石不足');
        if (!free) p.stone -= LOOK.mirror; p.mirrorFree = 0; p.look = nl;
        return { ok: true, msg: free ? '易容完成（本次免費）' : `易容完成，花費 ${LOOK.mirror} 靈石` };
      }
      case 'buy': {
        const c = COS[a.k]; if (!c || c.gacha || !c.price) return no('這件造型不能直接購買'); if (p.own.includes(a.k)) return no('已經擁有了');
        if (c.sect && c.sect !== p.sect) return no(`這是${SECTS[c.sect].n}專用的武器造型`);
        if (c.price.stone) { if (p.stone < c.price.stone) return no('靈石不足'); p.stone -= c.price.stone; }
        else { if (p.jade < c.price.jade) return no('仙玉不足'); p.jade -= c.price.jade; }
        p.own.push(a.k); p.wear[c.type] = a.k; return { ok: true, msg: `獲得「${c.n}」，已自動穿上` };
      }
      case 'wear': {
        const t = a.t; if (!COS_TYPES[t]) return no('沒有這個部位');
        if (!a.k) { delete p.wear[t]; return { ok: true }; }
        const c = COS[a.k]; if (!c || c.type !== t || !p.own.includes(a.k)) return no('還沒擁有這件造型');
        if (c.sect && c.sect !== p.sect) return no(`這是${SECTS[c.sect].n}專用的武器造型`);
        p.wear[t] = a.k; return { ok: true };
      }
      case 'gacha': {
        const n = a.n === 10 ? 10 : 1, cost = n === 10 ? GACHA.cost10 : GACHA.cost1;
        if (p.jade < cost) return no('仙玉不足'); p.jade -= cost;
        const rnd = (srv && srv.rnd) || Math.random, res = [];
        for (let i = 0; i < n; i++) res.push(gachaRoll(p, rnd));
        const at = Date.now(); for (const x of res) p.glog.unshift({ at, r: x.r, n: x.n }); p.glog.length = Math.min(p.glog.length, 200);
        return { ok: true, res };
      }
      case 'topup': { // 測試模式儲值；正式版由伺服器的內購驗證呼叫 payGrant
        if (srv && srv.payTest === false) return no('請使用 App 內購');
        const r = payGrant(p, a.k, 'test-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)); return r.ok ? { ok: true, msg: r.msg } : no(r.msg);
      }
      case 'cardClaim': {
        const t = today(); if (!p.card || p.card.until < t) return no('沒有生效中的月卡'); if (p.card.last === t) return no('今天已經領過了');
        p.card.last = t; p.jade += PAY.card.daily; return { ok: true, msg: `月卡：領取仙玉 ${PAY.card.daily}` };
      }
      case 'exchange': {
        const c = COS[a.k]; if (!c || !c.gacha) return no('只能兌換祈願造型'); if (p.own.includes(a.k)) return no('已經擁有了');
        const cost = GACHA.shardPrice[c.r]; if (p.shards < cost) return no('仙緣碎片不足'); p.shards -= cost; p.own.push(a.k);
        return { ok: true, msg: `兌換「${c.n}」` };
      }
      case 'run': { // 結算一局
        if (!RUN[a.r && a.r.mode]) return no('未知的關卡');
        const out = settleRun(p, a.r, srv); return { ok: true, out };
      }
      case 'cave': {
        const c = CAVE[a.k]; if (!c) return no('沒有這個項目'); const lv = p.cave[a.k] || 0;
        if (lv >= c.max) return no('已經修到極致'); const cost = caveCost(lv); if (p.stone < cost) return no('靈石不足');
        p.stone -= cost; p.cave[a.k] = lv + 1; return { ok: true };
      }
      case 'puppet': { if (p.hardcore) return no('一命修仙不能使用替死傀儡'); if (p.stone < PUPPET_COST) return no('靈石不足'); if (p.puppet >= 3) return no('最多持有 3 個'); p.stone -= PUPPET_COST; p.puppet++; return { ok: true }; }
      case 'equip': {
        if (!p.items.includes(a.k)) return no('沒有這件法寶');
        if (p.equip.includes(a.k)) p.equip = p.equip.filter(x => x !== a.k);
        else { if (p.equip.length >= ITEM_SLOTS) return no(`最多裝備 ${ITEM_SLOTS} 件`); p.equip.push(a.k); }
        return { ok: true };
      }
      case 'choosePath': {
        if (!p.pending || p.pending.type !== 'choosePath') return no('現在不能選道');
        const want = a.path === 'z' || a.path === 'x' ? a.path : '';
        const forced = p.dao >= RULE.daoFree ? 'z' : p.dao <= -RULE.daoFree ? 'x' : '';
        if (forced && want !== forced) return no(`你的道心已${forced === 'z' ? '偏向正道' : '偏向邪道'}，心魔劫中由不得你`);
        if (!want) return no('請選擇正道或邪道');
        p.path = want; p.pending = null; logp(p, `心魔劫後，踏上${PATHN[want]}：${PATHLINE[p.sect][want]}`);
        return { ok: true, msg: `你踏上了${PATHN[want]}——${PATHLINE[p.sect][want]}` };
      }
      case 'fall': { // 正 → 邪：入魔
        if (!isZ(p)) return no('只有正道修士才能入魔'); if (p.pending) return no('有尚未完成的試煉'); if (p.cd > 0) return no(`道心未穩，還要 ${p.cd} 局才能再轉換`);
        p.path = 'x'; p.dao = Math.min(p.dao, -30); p.expelled = 1; p.cd = RULE.convertCd;
        logp(p, `入魔，被${SECTS[p.sect].n}逐出師門`); return { ok: true, msg: `你墮入魔道，被${SECTS[p.sect].n}逐出師門，正道功法盡數封印` };
      }
      case 'atone': { // 邪 → 正：散功 + 洗心池試煉
        if (!isX(p)) return no('只有邪修需要回頭'); if (p.pending) return no('有尚未完成的試煉'); if (p.cd > 0) return no(`道心未穩，還要 ${p.cd} 局才能再轉換`);
        const before = p.stage; dropStage(p, 1, PATH_STAGE); p.rebuildTo = before; p.pending = { type: 'atone', trial: 'atone' };
        logp(p, `散功回頭，跌至 ${stageName(p.stage)}`);
        return { ok: true, msg: `你自散功力，跌至 ${stageName(p.stage)}。通過「洗心池」試煉後才能重歸正道` };
      }
      case 'defect': { // 叛逃
        const to = a.to; if (!SECTS[to] || to === p.sect) return no('請選擇其他門派'); if (p.pending) return no('有尚未完成的試煉'); if (p.cd > 0) return no(`還要 ${p.cd} 局才能再轉換`);
        if (!p.returnLeft) return no('你已背叛過師門又負荊請罪，此生不得再叛');
        if (p.formerSect) return no('你已叛逃過一次，只能選擇回歸原門派');
        if (p.stage < 3) return no('築基之後才能叛出師門');
        const newPath = a.path === 'z' || a.path === 'x' ? a.path : p.path;
        if (!p.path && newPath) return no('還沒分正邪，不能指定');
        const before = p.stage; let drop = 3; if (p.path && newPath !== p.path) drop += 1; // 同時改正邪：代價疊加
        dropStage(p, drop, 3); p.rebuildTo = before; p.pending = { type: 'defect', trial: 'entry', to, path: newPath };
        logp(p, `叛出師門，廢功重修至 ${stageName(p.stage)}`);
        return { ok: true, msg: `你廢去功力叛出師門，跌至 ${stageName(p.stage)}。通過${SECTS[to].n}的入門試煉（投名狀）後才能拜入` };
      }
      case 'return': { // 回歸原門派
        if (!p.formerSect || !p.returnLeft) return no('無法回歸'); if (p.pending) return no('有尚未完成的試煉'); if (p.cd > 0) return no(`還要 ${p.cd} 局才能再轉換`);
        const before = p.stage; dropStage(p, 3, 3); p.rebuildTo = before; p.pending = { type: 'return', trial: 'punish' };
        logp(p, `負荊請罪，跌至 ${stageName(p.stage)}`);
        return { ok: true, msg: `你再次廢功，跌至 ${stageName(p.stage)}。熬過「宗門懲戒」才能重回${SECTS[p.formerSect].n}` };
      }
      case 'cancelPending': { if (!p.pending || p.pending.type === 'choosePath') return no('無可取消'); p.pending = null; return { ok: true, msg: '已放棄試煉（散去的功力無法挽回）' }; }
    }
    return no('未知的指令');
  }
  // 能進哪些關卡
  function modes(p) {
    const m = [{ k: 'normal', n: `歷練・${MAPS[realmOf(p.stage)].n}`, ok: true }];
    if (p.pending && p.pending.trial) { const n = { atone: '洗心池試煉', entry: '入門試煉（投名狀）', punish: '宗門懲戒' }[p.pending.trial]; m.unshift({ k: p.pending.trial, n, ok: true, hot: 1 }); }
    if (p.stage % 3 === 2 && p.stage < STAGEN - 1) m.push({ k: 'tribulation', n: p.stage === PATH_STAGE - 1 ? '渡劫・心魔劫' : '渡劫', ok: canTribulate(p), why: canTribulate(p) ? '' : '修為未滿' });
    if (p.stage >= FORBID_STAGE) m.push({ k: 'forbidden', n: '禁地（收益×2，死亡即身死道消）', ok: true, danger: 1 });
    return m;
  }

  return { LOOK, cleanLook, PAY, payGrant, today, RARITY, COS, COS_TYPES, GACHA, JADE, ensure, VERSION, TITLE, REALMS, STAGES, STAGEN, NEED, stageName, realmOf, PATH_STAGE, FORBID_STAGE, SOUL_STAGE, MAPS, MON, MAPMUL, HUNTER_TIERS, HUNTER_MUL,
    SECTS, PATHN, PATHLINE, SK, SECT_SK, SIDE, SIDE_DAO, PASSIVE, MAX_ACT, MAX_PAS, MAX_SIDE, MAXLV, EVENTS, ITEMS, ITEM_SLOTS, CAVE, caveCost, PUPPET_COST,
    RUN, RULE, baseAtk, baseHp, MAX_KPS, newProfile, mainSkill, lineName, sumFx, runStats, heartDemonRate, canTribulate, act, modes, clampDao };
});
