/* ============================================================
   اللغات الثلاث — العربية والإنجليزية والماليزية

   القاعدةُ التي بُني عليها هذا: **النصُّ العربيُّ يبقى في الشيفرة كما
   هو**، ولا يُستبدل بمفاتيحَ مثل `t('nav.tasks')`. لسببين:

   ١) استبدالُ ستّة آلاف موضعٍ بمفاتيحَ يفتح ستّة آلاف فرصةٍ للخطأ،
      والعربيّةُ تختفي من الشيفرة فتصير غيرَ مقروءة لمن يصونها.
   ٢) النصُّ العربيُّ **هو المفتاح**: لا يُنسى مفتاحٌ ولا يُكتب خطأً،
      وإن سقطت الترجمةُ ظهرت العربيّةُ لا فراغٌ ولا `undefined`.

   والترجمةُ تقع على **ناتج الرسم** لا على الشيفرة: يُمرَّر HTML كاملًا
   فتُترجَم مواضعُ العرض وحدها — النصُّ بين الوسمين، وسماتٌ معدودة.
   وما كان منطقًا (`data-v="منجزة"`, `t.status === 'منجزة'`) لا يُمسّ،
   فالحالةُ تبقى عربيّةً في الذاكرة مهما كانت لغةُ الشاشة.
   ============================================================ */

const LANGS = {
  ar: { ar:'العربية',   en:'Arabic',  ms:'Arab',        dir:'rtl', code:'ar-SA', f:'ع' },
  en: { ar:'الإنجليزية', en:'English', ms:'Inggeris',    dir:'ltr', code:'en-GB', f:'EN' },
  ms: { ar:'الماليزية',  en:'Malay',   ms:'Bahasa Melayu', dir:'ltr', code:'ms-MY', f:'MS' }
};
const langOf = () => (S && S.lang) || 'ar';
const isRTL  = () => LANGS[langOf()].dir === 'rtl';
/* اسمُ اللغة بلغتها هي — فالمستخدمُ يبحث عن لغته لا عن ترجمتها */
const langName = k => LANGS[k][k];

/* ---------- القاموس ---------- */
/* DICT[lang][arabic] = translation — يُملأ من 41-dict.js */
const DICT = { en:{}, ms:{} };
let _re = null, _cache = null, _reLang = null;

function dictKeys() {
  const L = langOf();
  if (_reLang !== L) {
    const d = DICT[L] || {};
    const keys = Object.keys(d).sort((a, b) => b.length - a.length);
    _re = keys.length
      ? new RegExp(keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')
      : null;
    _cache = new Map();
    _reLang = L;
  }
  return _re;
}
/* يُنادى حين يتغيّر القاموس أو اللغة */
function i18nReset() { _reLang = null; _re = null; _cache = null; }

/* ترجمةُ قطعةٍ واحدة: بحثٌ كاملٌ أوّلًا، فإن أخفق فاستبدالٌ داخليّ */
/* الأرقامُ تُستبدل بفجوةٍ قبل البحث ثم تُعاد — فـ«٥ مهام» و«٧ مهام»
   مفتاحٌ واحد «{n} مهام»، ولولا ذلك لاحتاج كلُّ عددٍ مدخلًا. */
const NUM_HOLE = /[٠-٩0-9]+(?:[.,٫][٠-٩0-9]+)?/g;
function TT(piece) {
  const L = langOf();
  if (L === 'ar' || !piece) return piece;
  const d = DICT[L] || {};
  const t = piece.trim();
  if (!t || !AR_RE.test(t)) return piece;
  if (_cache && _cache.has(piece)) return _cache.get(piece);

  let hit = d[t];
  if (hit == null) {
    /* بحثٌ بالفجوة: تُحفظ الأعدادُ بترتيبها ثم تُعاد إلى مواضعها */
    const nums = [];
    const key = t.replace(NUM_HOLE, m => { nums.push(m); return '{n}'; });
    const tpl = d[key];
    if (tpl != null) {
      let i = 0;
      hit = tpl.replace(/{n}/g, () => {
        const v = nums[i++];
        return v == null ? '' : NUM(v);
      });
    }
  }
  /* إمّا تُترجَم القطعةُ كاملةً أو تبقى عربيّةً كاملة. والاستبدالُ
     الجزئيُّ يُنتج «غرفة Operations»: مشوّهًا لا عربيًّا ولا إنجليزيًّا. */
  const out = hit != null ? piece.replace(t, hit) : piece;
  if (_cache) _cache.set(piece, out);
  return out;
}
const AR_RE = /[؀-ۿ]/;

/* ---------- ترجمةُ ناتج الرسم ---------- */
/* السماتُ التي تُعرض للقارئ — وما عداها منطقٌ لا يُترجم */
const TR_ATTRS = /\b(placeholder|title|aria-label|alt)="([^"]*)"/g;
/* نصٌّ بين وسمين */
const TR_TEXT  = />([^<>]*[؀-ۿ][^<>]*)</g;

function TR(html) {
  if (langOf() === 'ar' || !html) return html;
  dictKeys();
  return String(html)
    .replace(TR_TEXT, (m, txt) => '>' + TT(txt) + '<')
    .replace(TR_ATTRS, (m, a, v) => AR_RE.test(v) ? a + '="' + TT(v).replace(/"/g, '&quot;') + '"' : m);
}

/* ---------- الأرقام والتواريخ تتبع اللغة ---------- */
/* AR() كانت تُحوّل دائمًا إلى الهنديّة. صارت تسأل عن اللغة أوّلًا. */
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
function NUM(n) {
  if (n == null || n === '') return '';
  const s = String(n);
  return langOf() === 'ar'
    ? s.replace(/[0-9]/g, d => AR_DIGITS[+d])
    : s.replace(/[٠-٩]/g, d => String(AR_DIGITS.indexOf(d)));
}

/* التقويم: هجريٌّ بالعربية، وميلاديٌّ بغيرها — ومعه الهجريُّ بين قوسين */
function DATE(ts) {
  const L = langOf();
  if (L === 'ar') return hijriAr(ts);
  const d = new Date(ts);
  const g = new Intl.DateTimeFormat(LANGS[L].code,
    { day:'numeric', month:'short', year:'numeric' }).format(d);
  return g;
}
function TIME(ts) {
  const L = langOf();
  if (L === 'ar') return t12Ar(ts);
  return new Intl.DateTimeFormat(LANGS[L].code,
    { hour:'numeric', minute:'2-digit', hour12:true }).format(new Date(ts));
}
function DAYNAME(ts) {
  const L = langOf();
  if (L === 'ar') return dayNameAr(ts);
  return new Intl.DateTimeFormat(LANGS[L].code, { weekday:'long' }).format(new Date(ts));
}

/* ---------- الاتّجاه ---------- */
function applyDir() {
  const L = langOf(), d = LANGS[L].dir;
  const r = document.documentElement;
  /* الاتّجاهُ يُكتب على العنصر الجذر — وقد يُشغَّل المحرّك بلا DOM
     (في اختبارٍ أو توليدٍ خارج المتصفّح)، فيُترك بلا ضرر. */
  if (!r || !r.setAttribute) return;
  r.setAttribute('dir', d);
  r.setAttribute('lang', L);
  r.classList.toggle('ltr', d === 'ltr');
}

/* ---------- مبدّلُ اللغة ---------- */
function langSwitch() {
  const cur = langOf();
  return '<div class="langsw">' +
    '<span class="langi">' + icon('i-globe','s16') + '</span>' +
    Object.keys(LANGS).map(k =>
      '<button class="langb' + (k === cur ? ' on' : '') + '" data-a="lang" data-v="' + k + '" ' +
      'aria-label="' + E(langName(k)) + '" lang="' + k + '">' + E(LANGS[k].f) + '</button>').join('') +
  '</div>';
}

function setLang(k) {
  if (!LANGS[k]) return;
  S.lang = k;
  i18nReset();
  applyDir();
  save();
  render();
}
