/* ============================================================
   مسحُ ما لم يُترجَم — بالمصدر لا بالعين

   يقرأ النصوصَ العربيّةَ من الوحدات كما يراها المُترجِم: ما بين
   الوسوم، وما في السمات المسموحة. ثمّ يطرح منها ما في المعجم.

     node i18n-scan.cjs [ملفّ ...]      بلا وسائطَ: كلُّ الوحدات
   ============================================================ */
const fs = require('fs');
const path = require('path');

const AR = /[؀-ۿ]/;
const dict = fs.readFileSync(path.join(__dirname, '21-dict.js'), 'utf8');
const has = k => dict.indexOf(JSON.stringify(k) + ':') >= 0;

const files = process.argv.length > 2 ? process.argv.slice(2)
  : fs.readdirSync(__dirname).filter(f => /^\d\d-.*\.js$/.test(f) && f !== '21-dict.js');

const out = new Map();
const QUOTE = /'(?:[^'\\]|\\.)*'/g;

files.forEach(f => {
  const src = fs.readFileSync(path.join(__dirname, f), 'utf8');
  (src.match(QUOTE) || []).forEach(q => {
    const lit = q.slice(1, -1);
    if (!AR.test(lit)) return;
    /* الوسومُ تُستبدل بفاصلٍ، فتبقى القطعُ كما يراها TR */
    lit.replace(/<[^>]*>/g, '\u0001').split('\u0001').forEach(p => {
      const t = p.replace(/\s+/g, ' ').trim();
      if (!t || t.length < 2 || !AR.test(t)) return;
      const key = t.replace(/[٠-٩0-9]+/g, '{n}');
      if (has(t) || has(key)) return;
      if (!out.has(t)) out.set(t, f);
    });
  });
});

[...out.keys()].sort().forEach(k => console.log('  ' + k + '   ← ' + out.get(k)));
console.log('— ناقصٌ: ' + out.size + ' من ' + files.length + ' وحدة');
