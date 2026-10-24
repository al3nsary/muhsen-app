/* ============================================================
   توليدُ المعجم — من دفعاتِ JSON لا باليد

   المعجمُ مولَّد: تُضاف الترجماتُ إلى `i18n/bNN.json` ثمّ يُعاد
   توليدُه. فلا يقع تعارضٌ ولا تكرارُ مفتاح، وتبقى اللغتان
   متساويتين — وهو ما يفحصه حارسُ البناء.

     node i18n-merge.cjs
   ============================================================ */
const fs = require('fs');
const path = require('path');

const DICT = path.join(__dirname, '21-dict.js');
const DIR  = path.join(__dirname, 'i18n');

/* ما في المعجم الآن — يُقرأ بتشغيله لا بتحليل نصِّه */
function current() {
  if (!fs.existsSync(DICT)) return { en: {}, ms: {} };
  const src = fs.readFileSync(DICT, 'utf8');
  try { return (new Function('const DICT={en:{},ms:{}};' + src + ';return DICT'))(); }
  catch (e) { console.log('✗ تعذّرت قراءةُ المعجم: ' + e.message); process.exit(1); }
}
const acc = current();
const before = Object.keys(acc.en).length;

/* الدفعات بترتيبها العدديّ — لا اللفظيّ، وإلّا سبقت b34 الـ b4 */
let added = 0, changed = 0;
if (fs.existsSync(DIR)) {
  fs.readdirSync(DIR).filter(f => /^b\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10))
    .forEach(f => {
      const d = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
      Object.keys(d).forEach(k => {
        const v = d[k];
        if (!Array.isArray(v) || v.length < 2) {
          console.log('✗ ' + f + ' · «' + k + '» ليست زوجًا'); process.exitCode = 1; return;
        }
        if (acc.en[k] === undefined) added++; else if (acc.en[k] !== v[0]) changed++;
        acc.en[k] = v[0]; acc.ms[k] = v[1];
      });
    });
}

const block = (name, o) => '/* ─────────────  ' + name + '  ───────────── */\n' +
  'DICT.' + (name === 'الإنجليزية' ? 'en' : 'ms') + ' = {\n' +
  Object.keys(o).sort().map(k =>
    '  ' + JSON.stringify(k) + ': ' + JSON.stringify(o[k])).join(',\n') + '\n};\n';

const head = '/* ============================================================\n' +
'   قاموسُ اللغات — العربيّةُ مفتاحٌ، والإنجليزيّةُ والماليزيّةُ قيمتان\n' +
'\n' +
'   **مولَّد. لا يُحرَّر بيد.** تُضاف الترجماتُ إلى `i18n/bNN.json`\n' +
'   ثمّ يُعاد توليدُه بـ `node i18n-merge.cjs`.\n' +
'\n' +
'   والمفاتيحُ مطبَّعةُ الأرقام: «{n}» فجوةٌ يحلّ محلَّها العددُ بلغته،\n' +
'   و«{t}» فجوةُ رمزٍ محلّيّ (ص/م · am/pm · PG/PTG).\n' +
'   ============================================================ */\n\n';

fs.writeFileSync(DICT, head + block('الإنجليزية', acc.en) + '\n' + block('الماليزية', acc.ms));

const en = Object.keys(acc.en).length, ms = Object.keys(acc.ms).length;
console.log('المعجم: ' + en + ' مدخلًا (كان ' + before + ') · جديد ' + added + ' · مُعدَّل ' + changed);
if (en !== ms) { console.log('✗ اللغتان غيرُ متساويتين: en=' + en + ' ms=' + ms); process.exitCode = 1; }
else console.log('✓ اللغتان متساويتان');
