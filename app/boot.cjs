/* ============================================================
   إقلاعُ الصفحة — ما سقط قبل أن يُرسم شيء

   المُلتقِطُ يُحقَن **قبل** سكربت التطبيق لا بعده: ما يُرمى أثناء
   تنفيذ السكربت نفسِه لا يراه مُلتقِطٌ يُسجَّل بعده.
   ============================================================ */
const fs = require('fs'), cp = require('child_process');
const SC = __dirname.split('\\').join('/') + '/';
const SRC = process.argv[2] || (SC + '../docs/index.html');
const h = fs.readFileSync(SRC, 'utf8');

const head = `<script>
window.__E = [];
window.addEventListener('error', function (e) {
  window.__E.push((e.message || 'خطأ') + '  @سطر ' + (e.lineno || '?') + ':' + (e.colno || '?'));
});
window.addEventListener('unhandledrejection', function (e) {
  window.__E.push('وعدٌ مرفوض: ' + (e.reason && e.reason.message || e.reason));
});
</scr` + `ipt>`;

const tail = `<script>
setTimeout(function () {
  var o = [];
  o.push('أخطاء = ' + window.__E.length);
  window.__E.slice(0, 6).forEach(function (x) { o.push('  X ' + x); });
  o.push('S = ' + (typeof S === 'undefined' ? 'غير معرَّف' : (S ? 'موجود' : 'فارغ')));
  o.push('KEY = ' + (typeof KEY !== 'undefined' ? KEY : '؟'));
  o.push('SCHEMA = ' + (typeof SCHEMA !== 'undefined' ? SCHEMA : '؟'));
  var sc = document.getElementById('screen');
  o.push('الشاشة = ' + (sc ? sc.innerHTML.length + ' حرفًا' : 'لا عنصر'));
  o.push('render = ' + (typeof render));
  if (sc && !sc.innerHTML.length && typeof render === 'function') {
    try { render(); o.push('رسمٌ يدويّ → ' + sc.innerHTML.length + ' حرفًا'); }
    catch (e) { o.push('رسمٌ يدويّ سقط: ' + e.message); }
  }
  var p = document.createElement('pre'); p.id = 'PP';
  p.textContent = o.join(String.fromCharCode(10));
  document.body.appendChild(p);
}, 1500);
</scr` + `ipt>`;

let out = h.replace('<body>', '<body>\n' + head);
const i = out.lastIndexOf('</body>');
out = out.slice(0, i) + tail + out.slice(i);
fs.writeFileSync(SC + '_boot.html', out);

const r = cp.execSync('"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new ' +
  '--disable-gpu --virtual-time-budget=12000 --dump-dom "file:///' + SC + '_boot.html"',
  { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const m = r.match(/<pre id="PP">([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : 'X لا مخرجات');
