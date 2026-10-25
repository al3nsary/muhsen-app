/* ============================================================
   اختبارُ تدفّقٍ حقيقيّ: نقرٌ وكتابةٌ كما يفعل المستخدم

   المنظرُ وحده لا يكفي — الزرُّ قد يبدو سليمًا ولا يفعل شيئًا.
   هنا تُملأ الحقولُ وتُنقَر الأزرارُ وتُقرأ الحالةُ بعدها.

     node flow.cjs
   ============================================================ */
const fs = require('fs'), cp = require('child_process');
const SC = __dirname.split('\\').join('/') + '/';
const SRC = SC + '../docs/index.html';

const steps = `
/* ١ · الدخول بكلمةِ مرورٍ خاطئة */
await type('#lu', 'M1001');
await type('#lp', 'xxxx');
await click('[data-a="dologin"]');
log('مرورٌ خاطئة → ' + (q('.autherr') ? 'رُدّ بخطأ ✓' : 'دخل رغم الخطأ ✗') +
    ' · جلسة=' + (S.session ? 'نعم ✗' : 'لا ✓'));

/* ٢ · اسمٌ لا وجود له */
await type('#lu', 'ZZZZ'); await type('#lp', '48162048');
await click('[data-a="dologin"]');
log('اسمٌ مجهول → ' + (q('.autherr') ? 'رُدّ بخطأ ✓' : 'دخل ✗'));

/* ٣ · الدخول الصحيح بالرمز */
await type('#lu', 'M1001'); await type('#lp', '48162048');
await click('[data-a="dologin"]');
await wait(900);
log('دخولٌ صحيح → جلسة=' + (S.session ? S.session.id : 'لا ✗') +
    ' · وجهة=' + S.route.n + ' · شريط=' + document.querySelectorAll('.tabs button').length);
try { render(); } catch (e) { log('X رسمُ mhome: ' + e.message); }
await wait(200);
log('بعد رسمٍ صريح → شريط=' + document.querySelectorAll('.tabs button').length +
    ' · أخطاء=' + (window.__E.length ? window.__E[0] : 'لا'));

/* ٤ · الخروج ثمّ الدخول السريع بصفة ليدر */
await click('[data-a="moresheet"]');
log('لوحُ المزيد → أزرار=' + document.querySelectorAll('.fab').length +
    ' · عارٍ=' + (S.sheetBare ? 'نعم ✓' : 'لا ✗'));
S.session = null; S.route = { n:'login' }; S.sheet = null; render();
await wait(120);
await click('[data-a="demologin"]');
await wait(900);
log('دخولٌ سريع → ' + (S.session ? userById(S.session.id).role : 'لا ✗') +
    ' · وجهة=' + S.route.n);

/* ٥ · الردود: إضافةٌ ← بدءٌ ← إنهاء */
S.session = { id: S.users.filter(function(u){return u.role==='muhsen'&&u.specialty==='نقل';})[0].id, at: Date.now() };
S.route = { n:'rides' }; render(); await wait(150);
var n0 = S.rides.filter(function(r){return r.userId===S.session.id;}).length;
await click('[data-a="rdnew"]');
log('لوحُ الإضافة → ' + (q('#rdpax') ? 'فُتح ✓' : 'لم يُفتح ✗'));
await type('#rdpax', '45');
await click('[data-a="rdadd"]');
await wait(200);
var mine = S.rides.filter(function(r){return r.userId===S.session.id;});
log('بعد الإضافة → ردود=' + mine.length + (mine.length === n0 + 1 ? ' ✓' : ' ✗'));
var cur = mine.filter(function(r){return !r.endedAt;})[0];
log('الزرُّ المعروض → ' + (q('[data-a="rdstart"]') ? 'بدء الرد ✓' : 'غائب ✗'));
rideStart(cur.id);
 log('تزامنيًّا بعد النداء → مشغول=' + (S.rdBusy === cur.id ? 'نعم ✓' : 'لا ✗') +
     ' · دوّارة=' + (q('.spin') ? 'ظاهرة ✓' : 'غائبة ✗'));

await wait(8000);
cur = S.rides.filter(function(r){return r.id===cur.id;})[0];
log('بعد الموقع → بدأ=' + (cur.startedAt ? 'نعم ✓' : 'لا ✗') +
    ' · مؤشّرُ الطريق=' + (q('.rtransit') ? 'ظاهر ✓' : 'غائب ✗'));
await click('[data-a="rdend"]');
await wait(8000);
cur = S.rides.filter(function(r){return r.id===cur.id;})[0];
log('الإنهاء → انتهى=' + (cur.endedAt ? 'نعم ✓' : 'لا ✗'));

/* ٦ · التحضير: حضورٌ ثمّ انصراف */
S.myPlace = 'hq';
S.attend = S.attend.filter(function(a){ return a.userId !== S.session.id; });
S.route = { n:'daily' }; S.tab.dl = 'me'; render(); await wait(150);
await click('[data-a="checkin"]'); await wait(200);
log('الحضور → ' + (dayRec(S.session.id, now()) ? 'سُجّل ✓' : 'لم يُسجَّل ✗'));
await click('[data-a="checkout"]'); await wait(200);
log('الانصراف → ' + (checkedOutToday(S.session.id) ? 'سُجّل ✓' : 'لم يُسجَّل ✗'));

/* ٧ · الإعدادات: تمريرٌ وتخصيصُ الشريط */
S.route = { n:'settings' }; render(); await wait(150);
var v = q('.view');
log('الإعدادات → view=' + (v ? 'موجود ✓' : 'غائب ✗') +
    ' · يتمرّر=' + (v && v.scrollHeight > v.clientHeight + 4 ? 'نعم ✓' : 'لا') +
    ' · شريط=' + document.querySelectorAll('.tabs button').length);
var b1 = tabChosen().join(',');
await click('[data-a="tabpick"][data-v="daily"]');
var b2 = tabChosen().join(',');
await click('[data-a="tabpick"][data-v="album"]');
log('تخصيصُ الشريط → ' + b1 + '  ← إخراجُ daily →  ' + b2 +
    '  ← إدخالُ album →  ' + tabChosen().join(',') +
    (tabChosen().indexOf('album') >= 0 ? '  ✓' : '  ✗'));
`;

const harness = `<script>
(async function () {
  var OUT = [];
  function log(s) { OUT.push(s); }
  function q(s) { return document.querySelector(s); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  async function click(sel) {
    var e = q(sel);
    if (!e) { log('X لا عنصر: ' + sel); return false; }
    e.click(); await wait(180); return true;
  }
  async function type(sel, val) {
    var e = q(sel);
    if (!e) { log('X لا حقل: ' + sel); return false; }
    e.value = val;
    e.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(180); return true;
  }
  window.__E = [];
  window.addEventListener('error', function (e) { window.__E.push(e.message); });
  await wait(700);
  try {
${steps}
  } catch (err) { log('X استثناء: ' + err.message); }
  var p = document.createElement('pre'); p.id = 'PP';
  p.textContent = OUT.join(String.fromCharCode(10));
  document.body.appendChild(p);
})();
</scr` + `ipt>`;

const html = fs.readFileSync(SRC, 'utf8');
const i = html.lastIndexOf('</body>');
fs.writeFileSync(SC + '_flow.html', html.slice(0, i) + harness + html.slice(i));

const r = cp.execSync('"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new ' +
  '--disable-gpu --window-size=430,900 --virtual-time-budget=90000 --dump-dom ' +
  '"file:///' + SC + '_flow.html"', { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const m = r.match(/<pre id="PP">([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>').replace(/&quot;/g, '"') : 'X لا مخرجات');
