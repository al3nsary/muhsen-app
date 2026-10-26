/* ============================================================
   البناء — تطبيقٌ واحدٌ ورابطٌ واحد

   الدورُ يُقرأ من الحساب بعد الدخول لا من بناءٍ منفصل: الليدرُ
   يرى شاشاتِه والمُحسنُ يرى شاشاتِه، والشريطُ يتبدّل معهما.

       node build.cjs
   ============================================================ */
const fs = require('fs');
const path = require('path');

const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const imgs = JSON.parse(read(path.join('assets', 'images.json')));

/* الصور تُعرَّف مرة واحدة كأصناف — بدل تكرار روابط base64 في كل رسم */
const imgCSS = '<style>\n' +
  Object.keys(imgs).filter(k => /_t$/.test(k)).map(k =>
    '.bg-' + k.replace(/_t$/, '') + '{background-image:url(' + imgs[k] + ')}').join('\n') + '\n' +
  Object.keys(imgs).filter(k => /_w$/.test(k)).map(k =>
    '.bgw-' + k.replace(/_w$/, '') + '{background-image:url(' + imgs[k] + ')}').join('\n') + '\n' +
  '.ground::after{background-image:url(' + imgs.logo_pattern + ')}\n' +
  '.pat{background-image:url(' + imgs.logo_pattern + ')}\n' +
  '.mlogo{background-image:url(' + imgs.logo_white + ')}\n' +
  '.mlockup{background-image:url(' + imgs.logo_lockup + ')}\n' +
  '.mnozoly{background-image:url(' + imgs.nozoly + ')}\n' +
  '.mnozoly.dark{background-image:url(' + imgs.nozoly_dark + ')}\n' +
  '</style>\n';

/* ترتيبُ الوحدات — واحدٌ لا يتكرّر، فلا تُضاف وحدةٌ وتُنسى من السلسلة */
const JS = [
  '20-i18n.js', '21-dict.js', '03-data.js', '25-api.js', '04-core.js', '05-ui.js',
  '06-task.js', '07-muhsen.js', '08-more.js', '09-admin.js', '11-reqcenter.js',
  '12-photos.js', '13-docs.js', '14-guide.js', '15-daily.js', '16-push.js',
  '19-escal.js', '22-rides.js', '23-settings.js', '24-bio.js', '17-reports.js', '18-assign.js',
  '10-router.js'
];

const HIDDEN = 'position:fixed;inset-inline-start:-9999px;width:1px;height:1px;opacity:0';
const file = (id, accept, extra) =>
  '<input id="' + id + '" type="file" accept="' + accept + '"' + (extra || '') +
  ' aria-hidden="true" style="' + HIDDEN + '">\n';

function body() {
  return read('01-style.html') + '\n' +
    read('02-defs.html') + '\n' +
    imgCSS +
    '<div id="device"><div id="screen"></div></div>\n' +
    file('cam', 'image/*', ' capture="environment"') +
    file('vid', 'video/*') +
    file('gal', 'image/*', ' multiple') +
    file('pdf', 'application/pdf') +
    '<script>window.IMG={};</scr' + 'ipt>' + '\n' +
    '<script>\n' + JS.map(read).join('\n') + '\n</scr' + 'ipt>\n';
}

const MANIFEST = {
  name: 'تطبيق مُحسن',
  short_name: 'مُحسن',
  description: 'تطبيق الميدان لفريق مُحسن — المهامُّ والحضورُ والردودُ والبلاغات',
  lang: 'ar', dir: 'rtl',
  start_url: './index.html', scope: './',
  display: 'standalone', orientation: 'portrait',
  background_color: '#0B3527', theme_color: '#14593F',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
};

const OUT = path.join(__dirname, '..', 'docs');
fs.mkdirSync(OUT, { recursive: true });

fs.writeFileSync(path.join(OUT, 'index.html'),
  '<!doctype html>\n<html lang="ar" dir="rtl">\n<head>\n' + read('pwa-head.html') +
  '\n</head>\n<body>\n' + body() + read('pwa-tail.html') + '\n</body>\n</html>');
fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify(MANIFEST, null, 2));
fs.writeFileSync(path.join(OUT, 'sw.js'), read('sw-template.js'));

['icon-192.png', 'icon-512.png', 'icon-maskable.png', 'apple-touch-icon.png'].forEach(f => {
  const src = path.join(__dirname, 'assets', f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(OUT, f));
});
console.log('docs/index.html : ' +
  Math.round(fs.statSync(path.join(OUT, 'index.html')).size / 1024) + 'KB');

/* ============================ الحرّاس ============================
   يسقط البناءُ إن سقط أحدُها. وكلُّ حارسٍ هنا وُلد من علّةٍ وقعت. */
const js = JS.map(read).join('\n');
let bad = 0;
const fail = (t, d) => { console.log('X ' + t + ': ' + d); bad++; };

/* ١ · النحو */
try { new Function(js); console.log('+ النحو'); }
catch (e) { fail('النحو', e.message); }

/* ٢ · أسماءٌ عامّةٌ محجوزةٌ في المتصفح — إعلانها يُسقط السكربت كلَّه */
const RESERVED = ['top','self','parent','window','document','location','history','navigator','screen',
  'frames','length','name','status','origin','close','closed','open','focus','blur','print','stop',
  'alert','confirm','prompt','event','external','opener','scrollX','scrollY','innerWidth','innerHeight'];
const declared = new Set();
let m; const reD = /(?:^|\n)(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g;
while ((m = reD.exec(js))) declared.add(m[1]);
const clash = RESERVED.filter(r => declared.has(r));
clash.length ? fail('أسماء عامّة', clash.join(', ')) : console.log('+ الأسماء العامّة');

/* ٣ · تكرارُ تعريفٍ على المستوى الأعلى — آخرُه يكسب صامتًا */
const seen = {}, dup = [];
const reF = /(?:^|\n)function\s+([A-Za-z_$][\w$]*)/g;
while ((m = reF.exec(js))) { if (seen[m[1]]) dup.push(m[1]); seen[m[1]] = 1; }
dup.length ? fail('دوالّ مكرّرة', [...new Set(dup)].join(', ')) : console.log('+ لا تكرار');

/* ٤ · كلُّ شاشةٍ في المُوجِّه معرَّفةٌ فعلًا */
const routed = [...new Set((js.match(/:\s*(screen[A-Za-z]+)/g) || []).map(s => s.split(':')[1].trim()))];
const defined = new Set((js.match(/function\s+(screen[A-Za-z]+)/g) || []).map(s => s.split(/\s+/)[1]));
const miss = routed.filter(n => !defined.has(n));
miss.length ? fail('شاشاتٌ ناقصة', miss.join(', ')) : console.log('+ الشاشات (' + defined.size + ')');

/* ٥ · كلُّ وجهةٍ في الشريط أو في قائمة «المزيد» لها شاشة */
(function () {
  const ui = read('05-ui.js');
  const a = ui.indexOf('function tabCatalog'), b = ui.indexOf('const TAB_DEFAULT');
  if (a < 0 || b < 0) return fail('الشريط', 'لم أجد tabCatalog');
  const smap = js.slice(js.indexOf('const SCREENS'), js.indexOf('function render'));
  const keys = new Set([...smap.matchAll(/(\w+):\s*screen/g)].map(x => x[1]));
  const navK = [...new Set([...ui.slice(a, b).matchAll(/k:\s*'([a-z]+)'/g)].map(x => x[1]))];
  const more = [...new Set([...ui.slice(ui.indexOf('function moreSheet'))
    .matchAll(/\['([a-z]+)',\s*'i-/g)].map(x => x[1]))];
  const orphan = navK.concat(more).filter(k => !keys.has(k));
  orphan.length ? fail('وجهاتٌ بلا شاشة', orphan.join(', '))
    : console.log('+ وجهات الشريط (' + (navK.length + more.length) + ')');
})();

/* ٦ · أنماطٌ خارج <style> تظهر نصًّا خامًا أعلى الصفحة — وقع مرّتين */
(function () {
  const s = read('01-style.html'), i = s.lastIndexOf('</style>');
  if (i < 0) return fail('الأنماط', 'لا وسمَ إغلاق');
  const tail = s.slice(i + 8).trim();
  tail ? fail('أنماط خارج style', tail.length + ' حرفًا') : console.log('+ الأنماط');
})();

/* ٧ · ثلاثُ لغاتٍ دائمًا: الكتلتان موجودتان ومتساويتا العدد */
(function () {
  const d = read('21-dict.js');
  const blk = k => {
    const a = d.indexOf('DICT.' + k + ' = {');
    if (a < 0) return null;
    return (d.slice(a, d.indexOf('\n};', a)).match(/^  "/gm) || []).length;
  };
  const en = blk('en'), ms = blk('ms');
  if (!en || !ms) return fail('المعجم', 'كتلةٌ ناقصة — en=' + en + ' ms=' + ms);
  if (en !== ms) return fail('المعجم', 'اللغتان غيرُ متساويتين — en=' + en + ' ms=' + ms);
  console.log('+ المعجم (' + en + ' مدخلًا لكلّ لغة)');
})();

/* ٨ · الشريط: خمسةُ مواضعَ ثابتةٌ لا تنزلق */
(function () {
  const ui = read('05-ui.js');
  if (!/const TAB_SLOTS = 3;/.test(ui)) return fail('الشريط', 'TAB_SLOTS تغيّر');
  if (/trail|tpage|goTabPage/.test(ui)) return fail('الشريط', 'بقايا الانزلاق في الشيفرة');
  const css = read('01-style.html').replace(/\/\*[\s\S]*?\*\//g, '');
  if (/\.(trail|tpage)\b/.test(css)) return fail('الشريط', 'بقايا الانزلاق في الأنماط');
  console.log('+ الشريط');
})();

/* ٩ · كلُّ شاشةٍ تُرسم داخل .view — وهي حاويةُ التمرير.
      نسيتُها في الإعدادات فجمدت الشاشةُ ولم تتمرّر. */
(function () {
  const bad2 = JS.filter(f => /^(0[5-9]|1\d|2\d)-/.test(f)).filter(f => {
    const s = read(f);
    return /bar\([^)]*\)\s*\+\s*\n?\s*'<div class="(?!view)/.test(s);
  });
  bad2.length ? fail('حاوية التمرير', bad2.join(', ') + ' — تستعمل غير .view')
    : console.log('+ حاوية التمرير');
})();

/* ١٠ · «return» وحدَه في سطرٍ وتحته تعبير.
      تُدرَج بعده فاصلةٌ تلقائيًّا فيعود undefined ويموت ما تحته،
      والنحوُ سليمٌ فلا يشكو منه أحد. وقعتْ حين حُذف سطرٌ كان يليه،
      فظهرت كلمةُ undefined مكانَ قائمةِ التذاكر. */
(function () {
  const hit = [];
  JS.forEach(f => {
    const L = read(f).split('\n');
    L.forEach((l, i) => {
      if (!/^\s*return\s*$/.test(l)) return;
      const nxt = (L[i + 1] || '').trim();
      if (nxt && !/^[}\])]/.test(nxt)) hit.push(f + ':' + (i + 1));
    });
  });
  hit.length ? fail('return معلَّق', hit.join(', ')) : console.log('+ الإرجاع');
})();

console.log(bad ? '\nX ' + bad + ' حارسًا سقط' : '\n+ كلُّ الحرّاس');
if (bad) process.exitCode = 1;
