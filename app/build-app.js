// 把網頁遊戲複製到 www/，並寫入 App 版的伺服器設定。用法：node build-app.js
const fs = require('fs'), path = require('path');
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'app-config.json'), 'utf8'));
const src = path.join(__dirname, '..'), out = path.join(__dirname, 'www');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
for (const f of ['index.html', 'xian-data.js', 'xian-art.js', 'privacy.html', 'icon.png']) fs.copyFileSync(path.join(src, f), path.join(out, f));
let html = fs.readFileSync(path.join(out, 'index.html'), 'utf8').replace('<link rel="manifest" href="manifest.json">', '');
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, 'xian-config.js'), `window.XIAN_SERVER = ${JSON.stringify(cfg.server)};\nwindow.XIAN_APP = true;\n`);
// 同步 capacitor 設定
const cap = { appId: cfg.appId, appName: cfg.appName, webDir: 'www', android: { backgroundColor: '#14101c' }, ios: { backgroundColor: '#14101c' },
  plugins: { SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover', style: 'DARK' } } };
fs.writeFileSync(path.join(__dirname, 'capacitor.config.json'), JSON.stringify(cap, null, 2) + '\n');
console.log('已建立 www/，伺服器：' + cfg.server);
