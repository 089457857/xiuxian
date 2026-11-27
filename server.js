// 萬妖仙途 — 伺服器（帳號、雲端存檔、排行榜、成績驗證）
// 存檔方式跟屁眼王國一樣：有 DATABASE_URL 就用 Postgres（可以跟其他遊戲共用同一個資料庫，用 KV_KEY 分開），否則存本機 data.json
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const D = require('./xian-data');

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || '';
const KV_KEY = process.env.KV_KEY || 'xiuxian';

const S = { users: {}, sessions: {}, prof: {}, seq: 1 };
let pool = null;
const FILE = path.join(__dirname, 'data.json');
async function load() {
  if (DATABASE_URL) {
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: DATABASE_URL, ssl: /render\.com|sslmode=require/.test(DATABASE_URL) ? { rejectUnauthorized: false } : false });
    try { await pool.query('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v JSONB NOT NULL)'); } catch (e) { if (!['23505', '42P07'].includes(e.code)) throw e; }
    const r = await pool.query('SELECT v FROM kv WHERE k=$1', [KV_KEY]);
    if (r.rows[0]) Object.assign(S, r.rows[0].v);
    console.log('已連上 Postgres 資料庫');
  } else if (fs.existsSync(FILE)) {
    Object.assign(S, JSON.parse(fs.readFileSync(FILE, 'utf8')));
    console.log('使用本機 data.json（未設定 DATABASE_URL）');
  }
  if (!S.prof) S.prof = {};
}
let saveTimer = null, saving = false, again = false;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(flush, 800); }
async function flush() {
  if (saving) { again = true; return; }
  saving = true;
  try {
    const data = JSON.stringify(S);
    if (pool) await pool.query('INSERT INTO kv (k, v) VALUES ($1, $2) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v', [KV_KEY, data]);
    else fs.writeFileSync(FILE, data);
  } catch (e) { console.error('儲存失敗', e.message); }
  saving = false;
  if (again) { again = false; flush(); }
}
const newId = () => (S.seq++).toString(36) + crypto.randomBytes(3).toString('hex');

const app = express();
const runs = {}; // 進行中的局：開始時間
app.use(express.json({ limit: '20kb' }));
// App 版（Capacitor）從 https://localhost 或 capacitor://localhost 連過來，要允許跨網域；登入靠 x-token，不用 cookie
app.use((req, res, next) => {
  res.set({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, x-token', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' });
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
const tries = {};
function limited(ip) { const now = Date.now(); const t = (tries[ip] || []).filter(x => now - x < 60000); t.push(now); tries[ip] = t; return t.length > 15; }
const auth = (req, res, next) => {
  const tok = String(req.get('x-token') || ''); const uid = S.sessions[tok];
  if (!uid || !S.users[uid]) return res.status(401).json({ error: '請重新登入' });
  req.uid = uid; next();
};

app.post('/api/register', async (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: '嘗試太多次，請稍後再試' });
  const name = String(req.body.name || '').trim(), pass = String(req.body.pass || '');
  if (!/^[\p{L}\p{N}_\-]{2,12}$/u.test(name)) return res.status(400).json({ error: '道號需 2～12 個字，只能用文字、數字、底線或減號' });
  if (pass.length < 4 || pass.length > 64) return res.status(400).json({ error: '密碼需 4～64 個字元' });
  if (Object.values(S.users).some(u => u.name.toLowerCase() === name.toLowerCase())) return res.status(400).json({ error: '這個道號已經有人用了' });
  const u = { id: newId(), name, hash: await bcrypt.hash(pass, 10), created: Date.now() };
  S.users[u.id] = u;
  const token = crypto.randomBytes(24).toString('hex'); S.sessions[token] = u.id; save();
  res.json({ token, name });
});
app.post('/api/login', async (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: '嘗試太多次，請稍後再試' });
  const name = String(req.body.name || '').trim(), pass = String(req.body.pass || '');
  const u = Object.values(S.users).find(x => x.name.toLowerCase() === name.toLowerCase());
  if (!u || !(await bcrypt.compare(pass, u.hash))) return res.status(400).json({ error: '道號或密碼錯誤' });
  const token = crypto.randomBytes(24).toString('hex'); S.sessions[token] = u.id; save();
  res.json({ token, name: u.name });
});
// 刪除帳號（App Store 規定有帳號的 App 必須能在 App 內刪除）：要再輸入一次密碼
app.post('/api/delete-account', auth, async (req, res) => {
  const u = S.users[req.uid]; const pass = String(req.body.pass || '');
  if (!(await bcrypt.compare(pass, u.hash))) return res.status(400).json({ error: '密碼錯誤' });
  const name = u.name;
  delete S.users[req.uid]; delete S.prof[req.uid]; delete runs[req.uid];
  for (const t of Object.keys(S.sessions)) if (S.sessions[t] === req.uid) delete S.sessions[t];
  if (S.tombs) S.tombs = S.tombs.filter(t => t.name !== name);
  save(); console.log('帳號已刪除', req.uid); res.json({ ok: true });
});
app.get('/api/me', auth, (req, res) => res.json({ name: S.users[req.uid].name, p: D.ensure(S.prof[req.uid]) || null }));
app.post('/api/create', auth, (req, res) => {
  const old = S.prof[req.uid]; if (old && !old.dead) return res.status(400).json({ error: '你已經有角色了' });
  const sect = String(req.body.sect || ''); if (!D.SECTS[sect]) return res.status(400).json({ error: '請選擇門派' });
  const p = D.newProfile(S.users[req.uid].name, sect, !!req.body.hardcore, req.body.look);
  if (old && old.dead) { (S.tombs = S.tombs || []).push({ name: old.name, sect: old.sect, stage: old.stage, hardcore: old.hardcore, at: old.dead }); S.tombs = S.tombs.slice(-100); }
  S.prof[req.uid] = p; save(); res.json({ p });
});
// 開局：伺服器記下開始時間，結算時用來檢查「這局真的打了這麼久」
app.post('/api/runstart', auth, (req, res) => {
  const p = S.prof[req.uid]; if (!p || p.dead) return res.status(400).json({ error: '沒有可用的角色' });
  const mode = String(req.body.mode || ''); const m = D.modes(p).find(x => x.k === mode);
  if (!m || !m.ok) return res.status(400).json({ error: '現在不能進入這個關卡' });
  const id = crypto.randomBytes(8).toString('hex'); runs[req.uid] = { id, mode, at: Date.now() };
  res.json({ runId: id });
});
app.post('/api/act', auth, (req, res) => {
  const p = S.prof[req.uid]; const a = req.body || {};
  let srv = null;
  if (a.type === 'run') {
    const r = runs[req.uid]; if (!r || r.id !== a.runId || !a.r || a.r.mode !== r.mode) return res.status(400).json({ error: '這局的紀錄對不上' });
    delete runs[req.uid]; srv = { elapsed: (Date.now() - r.at) / 1000 };
  }
  // 上架前預設是測試儲值（不扣錢）；正式上線時設定環境變數 PAY_TEST=0 關掉，改走 App 內購驗證
  srv = { ...(srv || {}), payTest: process.env.PAY_TEST !== '0' };
  const out = D.act(p, a, srv); if (!out.ok) return res.status(400).json({ error: out.msg });
  save(); res.json({ ...out, p });
});
app.get('/api/rank', (req, res) => {
  const all = Object.values(S.prof).filter(Boolean);
  const row = p => ({ name: p.name, sect: p.sect, path: p.path, stage: p.stage, cult: p.cult, best: p.best, hardcore: p.hardcore, dead: p.dead ? 1 : 0, title: p.wear && p.wear.title && D.COS[p.wear.title] ? D.COS[p.wear.title].n : '' });
  const byStage = (a, b) => b.stage - a.stage || b.cult - a.cult;
  res.json({
    realm: all.filter(p => !p.dead).sort(byStage).slice(0, 30).map(row),
    hardcore: all.filter(p => p.hardcore).sort((a, b) => (a.dead ? 1 : 0) - (b.dead ? 1 : 0) || byStage(a, b)).slice(0, 30).map(row),
    kills: all.filter(p => !p.dead).sort((a, b) => b.best - a.best).slice(0, 30).map(row),
    tombs: (S.tombs || []).slice(-20).reverse(),
  });
});
// 之後接 App 內購：在這裡驗證 Apple / Google 的收據，確認後呼叫 D.payGrant(p, 商品代號, 交易編號)
// app.post('/api/iap/apple', auth, async (req, res) => { ... });
// app.post('/api/iap/google', auth, async (req, res) => { ... });
app.get('/healthz', (_, res) => res.send('ok'));
const send = f => (req, res) => res.sendFile(path.join(__dirname, f));
app.get('/', send('index.html'));
app.get('/xian-data.js', (req, res) => res.type('application/javascript').sendFile(path.join(__dirname, 'xian-data.js')));
app.get('/xian-art.js', (req, res) => res.type('application/javascript').sendFile(path.join(__dirname, 'xian-art.js')));
app.get('/manifest.json', send('manifest.json'));
app.get('/privacy.html', send('privacy.html'));
app.get('/xian-config.js', send('xian-config.js'));
app.get('/icon.png', send('icon.png'));

load().then(() => app.listen(PORT, () => console.log('萬妖仙途 伺服器啟動於 port ' + PORT)))
  .catch(e => { console.error('啟動失敗', e); process.exit(1); });
process.on('SIGTERM', async () => { clearTimeout(saveTimer); await flush(); process.exit(0); });
