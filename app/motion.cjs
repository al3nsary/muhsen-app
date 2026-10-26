/* ============================================================
   حركةُ القائمة — هل تصعد واحدةً بعد واحدة فعلًا؟

   الحركةُ لا تُرى في لقطة. هنا تُقرأ قيمُها المحسوبة: اسمُ الحركة
   ومدّتُها وتأخّرُ كلّ حبّةٍ عن سابقتها.
   ============================================================ */
const fs = require('fs'), cp = require('child_process');
const SC = __dirname.split('\\').join('/') + '/';
const h = fs.readFileSync(SC + '../docs/index.html', 'utf8');

const inj = `<script>
setTimeout(function () {
  var o = [];
  var L = S.users.filter(function (u) { return u.role === 'leader' && !u.admin; })[0];
  S.session = { id: L.id, at: Date.now() };
  S.route = { n: 'home' }; S.pushAsked = true; S.bioAsked = true;
  S.sheet = moreSheet(); S.sheetBare = true;
  render();
  setTimeout(function () {
    o.push('تقليلُ الحركة مفروض؟ ' +
      (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'نعم' : 'لا'));
    var f = document.querySelectorAll('.fab');
    o.push('حبّاتٌ: ' + f.length);
    var prev = null, ok = true;
    [].forEach.call(f, function (b, i) {
      var cs = getComputedStyle(b);
      var d = parseFloat(cs.animationDelay) * 1000;
      o.push('  ' + i + '  «' + b.textContent.trim().slice(0, 10) + '»' +
        '  حركة=' + cs.animationName +
        '  مدّة=' + cs.animationDuration +
        '  تأخّر=' + Math.round(d) + 'ms');
      if (prev !== null && !(d < prev)) ok = false;   /* الأعلى يصعد آخرًا */
      prev = d;
    });
    o.push(ok ? '+ التتابع: كلٌّ تسبق التي فوقها' : 'X التتابع: الترتيبُ غيرُ متدرّج');
    var m = document.querySelector('.fabmain');
    o.push(m ? 'الرئيسيّ: حركة=' + getComputedStyle(m).animationName : 'X لا زرَّ رئيسيّ');
    var sc = document.querySelector('.scrim.soft');
    o.push(sc ? 'الحجاب: ' + getComputedStyle(sc).backdropFilter : 'X لا حجاب');
    var p = document.createElement('pre'); p.id = 'PP';
    p.textContent = o.join(String.fromCharCode(10));
    document.body.appendChild(p);
  }, 300);
}, 900);
</scr` + `ipt>`;

/* المتصفّحُ الصامتُ يفرض prefers-reduced-motion، فتُلغى الحركةُ كلُّها
   ولا تُقاس. تُنزَع كتلُ التقليل من النصّ المفحوص وحدَه — ولا يُمَسّ
   المبنيُّ: احترامُ تفضيل المستخدم يبقى في المنتَج. */
const noRM = h.replace(/@media \(prefers-reduced-motion:\s*reduce\)\s*\{[^{}]*\{[^{}]*\}[^{}]*\}/g, '');
const i = noRM.lastIndexOf('</body>');
fs.writeFileSync(SC + '_mo.html', noRM.slice(0, i) + inj + noRM.slice(i));
const r = cp.execSync('"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new ' +
  '--disable-gpu --virtual-time-budget=20000 --dump-dom "file:///' + SC + '_mo.html"',
  { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const m = r.match(/<pre id="PP">([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : 'X لا مخرجات');
