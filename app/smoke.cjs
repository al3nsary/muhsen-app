/* ============================================================
   فحصٌ تشغيليٌّ لكلّ شاشةٍ بالدورين

   الحارسُ النصّيُّ لا يرى علّةً مثل «buzz ثابتٌ محلّيٌّ داخل act()»:
   النصُّ سليمٌ والنداءُ يسقط عند التشغيل وحده. فهذا يفتح الصفحةَ
   فعلًا، ويرسم كلَّ وجهةٍ لكلّ دور، ويلتقط كلَّ ما يُرمى.

     node smoke.cjs            العربيّة
     node smoke.cjs en         لغةٌ أخرى
   ============================================================ */
const fs = require('fs'), cp = require('child_process');
const SC = __dirname.split('\\').join('/') + '/';
const SRC = SC + '../docs/index.html';
const LANG = process.argv[2] || 'ar';

const harness = `<script>
(function () {
  var OUT = [], ERR = [];
  window.addEventListener('error', function (e) { ERR.push(e.message); });
  setTimeout(function () {
    try { S.lang = ${JSON.stringify(LANG)}; i18nReset(); applyDir(); } catch (e) {}
    var ROLES = [['leader', 'home'], ['muhsen', 'mhome']];
    var ROUTES = Object.keys(SCREENS);
    ROLES.forEach(function (pair) {
      var role = pair[0];
      var u = S.users.filter(function (x) { return x.role === role; })[0];
      /* محسنُ النقل وحده يملك ردودًا — فيُجرَّب به كذلك */
      var nq = S.users.filter(function (x) {
        return x.role === 'muhsen' && x.specialty === 'نقل'; })[0];
      [u, role === 'muhsen' ? nq : null].filter(Boolean).forEach(function (who) {
        ROUTES.forEach(function (r) {
          S.session = r === 'login' ? null : { id: who.id, at: Date.now() };
          S.route = { n: r, id: (S.tasks[0] || {}).id };
          S.sheet = null; S.sheetBare = false; S.pushAsked = true;
          var before = ERR.length;
          try { render(); }
          catch (e) { OUT.push('X ' + role + '/' + r + ' : ' + e.message); return; }
          if (ERR.length > before) OUT.push('X ' + role + '/' + r + ' : ' + ERR[before]);
          var sc = document.getElementById('screen');
          if (!sc || sc.innerHTML.length < 120)
            OUT.push('X ' + role + '/' + r + ' : الشاشةُ شبه فارغة');
        });
      });
    });

    /* الألواحُ والدروجُ: تُبنى وتُرسم */
    var mu = S.users.filter(function (x) {
      return x.role === 'muhsen' && x.specialty === 'نقل'; })[0];
    S.session = { id: mu.id, at: Date.now() };
    [['moreSheet', 'mhome'], ['rideSheet', 'rides'], ['placeSheet', 'mhome'],
     ['swapSheet', 'daily']].forEach(function (p) {
      S.route = { n: p[1] };
      var before = ERR.length;
      try {
        if (typeof window[p[0]] !== 'function' && typeof eval(p[0]) !== 'function') {
          OUT.push('X لوح ' + p[0] + ' : غيرُ معرَّف'); return;
        }
        S.rdLeg = 0; S.swapTo = null;
        S.sheet = eval(p[0])(); render();
      } catch (e) { OUT.push('X لوح ' + p[0] + ' : ' + e.message); return; }
      if (ERR.length > before) OUT.push('X لوح ' + p[0] + ' : ' + ERR[before]);
    });

    OUT.unshift('وجهات=' + Object.keys(SCREENS).length +
      ' · أدوار=٢ · لغة=' + ${JSON.stringify(LANG)});
    OUT.push(OUT.length > 1 ? '' : '+ لا علّة');
    var p = document.createElement('pre'); p.id = 'PP';
    p.textContent = OUT.join(String.fromCharCode(10));
    document.body.appendChild(p);
  }, 900);
})();
</scr` + `ipt>`;

const html = fs.readFileSync(SRC, 'utf8');
const i = html.lastIndexOf('</body>');
fs.writeFileSync(SC + '_smoke.html', html.slice(0, i) + harness + html.slice(i));

const r = cp.execSync('"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new ' +
  '--disable-gpu --window-size=430,900 --virtual-time-budget=40000 --dump-dom ' +
  '"file:///' + SC + '_smoke.html"', { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const m = r.match(/<pre id="PP">([\s\S]*?)<\/pre>/);
const out = m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>').replace(/&quot;/g, '"') : 'X لا مخرجات';
console.log(out);
if (/^X /m.test(out) || out.indexOf('لا مخرجات') >= 0) process.exitCode = 1;
