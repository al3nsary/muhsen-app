/* ============================================================
   حصرُ لوحة النظام — هل هي لحساب النظام وحدَه فعلًا؟

   لا يكفي أن يُخفى الزرّ: من كتب الوجهةَ يجب أن يُردّ. هنا
   تُجرَّب الحالتان بكلّ دور.
   ============================================================ */
const fs = require('fs'), cp = require('child_process');
const SC = __dirname.split('\\').join('/') + '/';
const h = fs.readFileSync(SC + '../docs/index.html', 'utf8');

const inj = `<script>
setTimeout(function () {
  var o = [];
  function test(u, label) {
    S.session = { id: u.id, at: Date.now() };
    /* ١ · هل يظهر البابُ في الإعدادات؟ */
    S.route = { n: 'settings' }; S.sheet = null; S.pushAsked = true;
    try { render(); } catch (e) { o.push('X ' + label + ' : ' + e.message); return; }
    var door = !!document.querySelector('[data-n="admin"]');
    /* ٢ · وإن كتب الوجهةَ مباشرةً؟ */
    S.route = { n: 'admin' };
    try { render(); } catch (e) { o.push('X ' + label + ' : ' + e.message); return; }
    var landed = S.route.n;
    o.push('  ' + label.padEnd(14) +
      ' بابٌ في الإعدادات: ' + (door ? 'نعم' : 'لا') +
      ' · كتابةُ الوجهة تُنزله على: ' + landed +
      ((u.admin ? (door && landed === 'admin') : (!door && landed !== 'admin'))
        ? '   ✓' : '   X'));
  }
  test(S.users.filter(function (x) { return x.admin; })[0], 'حساب النظام');
  test(S.users.filter(function (x) { return x.role === 'leader' && !x.admin; })[0], 'ليدر');
  test(S.users.filter(function (x) { return x.role === 'muhsen'; })[0], 'مُحسن');

  /* ٣ · هل يظهر حسابُ النظام في قائمة الدخول؟ */
  S.session = null; S.loginOpen = true; S.loginU = '';
  S.route = { n: 'login' }; render();
  var names = [].map.call(document.querySelectorAll('.lopt'), function (b) { return b.dataset.id; });
  o.push('  قائمةُ الدخول: ' + names.length + ' حسابًا · فيها حسابُ النظام: ' +
    (names.indexOf('AD1') >= 0 ? 'نعم ✓' : 'لا X'));

  var p = document.createElement('pre'); p.id = 'PP';
  p.textContent = o.join(String.fromCharCode(10));
  document.body.appendChild(p);
}, 900);
</scr` + `ipt>`;

const i = h.lastIndexOf('</body>');
fs.writeFileSync(SC + '_adm.html', h.slice(0, i) + inj + h.slice(i));
const r = cp.execSync('"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new ' +
  '--disable-gpu --virtual-time-budget=25000 --dump-dom "file:///' + SC + '_adm.html"',
  { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const m = r.match(/<pre id="PP">([\s\S]*?)<\/pre>/);
const out = m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : 'X لا مخرجات';
console.log(out);
if (/X/.test(out)) process.exitCode = 1;
