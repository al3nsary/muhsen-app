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
/* ١ · الكتابةُ تفتح القائمةَ وتُصفّيها */
await type('#lu', 'مح');
log('كتابةُ «مح» → قائمة=' + (q('.cmenu') ? 'مفتوحة ✓' : 'مغلقة ✗') +
    ' · مطابقون=' + document.querySelectorAll('.lopt').length);

/* ٢ · الاختيارُ يملأ الحقلين */
await click('.lopt');
log('بعد الاختيار → اسم="' + (q('#lu') ? q('#lu').value : '') + '"' +
    ' · مرور=' + (S.loginP === '48162048' ? 'امتلأت ✓' : 'فارغة ✗') +
    ' · قائمة=' + (q('.cmenu') ? 'ما زالت ✗' : 'أُغلقت ✓'));

/* ٣ · مرورٌ خاطئةٌ تُردّ */
await type('#lp', 'xxxx');
await click('[data-a="dologin"]');
log('مرورٌ خاطئة → ' + (q('.autherr') ? 'رُدّ ✓' : 'دخل ✗') +
    ' · جلسة=' + (S.session ? 'نعم ✗' : 'لا ✓'));

/* ٤ · الدخولُ الصحيح */
await type('#lu', 'مح'); await click('.lopt');
await click('[data-a="dologin"]');
await wait(900);
log('دخولٌ صحيح → جلسة=' + (S.session ? S.session.id : 'لا ✗') +
    ' · وجهة=' + S.route.n + ' · شريط=' + document.querySelectorAll('.tabs button').length);

/* ٥ · لوحُ المزيد */
await click('[data-a="moresheet"]');
log('لوحُ المزيد → فرعيّة=' + document.querySelectorAll('.fab').length +
    ' · رئيسيّ=' + (q('.fabmain') ? 'موجود ✓' : 'غائب ✗') +
    ' · حجابٌ ضبابيّ=' + (q('.scrim.soft') ? 'نعم ✓' : 'لا ✗') +
    ' · بلا صندوق=' + (q('.sheet') ? 'ملفوف ✗' : 'عارٍ ✓'));
var fabKeys = [].map.call(document.querySelectorAll('.fab'), function (b) { return b.dataset.n; });
log('عناصرُ القائمة → ' + fabKeys.join(' · ') +
    (fabKeys.some(function (k) { return ['notifs','profile','album','rating','guide'].indexOf(k) >= 0; })
      ? '  X فيها محذوف' : '  ✓ بلا محذوف'));
await click('[data-a="close"]');

/* ٥ · الردود: إضافةٌ ← بدءٌ ← إنهاء */
S.session = { id: S.users.filter(function(u){return u.role==='muhsen'&&u.specialty==='نقل';})[0].id, at: Date.now() };
S.route = { n:'rides' }; render(); await wait(150);
var n0 = S.rides.filter(function(r){return r.userId===S.session.id;}).length;
await click('[data-a="rdnew"]');
log('لوحُ الإضافة → ' + (q('#rdpax') ? 'فُتح ✓' : 'لم يُفتح ✗') +
    ' · غلاف=' + (q('.sheet') ? '.sheet' : q('.fabwrap') ? '.fabwrap' : 'بلا') +
    ' · عارٍ=' + S.sheetBare +
    ' · أزرار=' + [].map.call(document.querySelectorAll('[data-a]'), function(b){return b.dataset.a;})
        .filter(function(x){return x.indexOf('rd')===0;}).join(','));

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
  /* جلسةٌ باقيةٌ من تشغيلٍ سابقٍ تُنزلنا على الرئيسيّة لا الدخول */
  S.session = null; S.route = { n: 'login' };
  S.loginU = ''; S.loginP = ''; S.loginId = null; S.loginOpen = false;
  S.pushAsked = true; S.bioAsked = true; render(); await wait(200);
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
