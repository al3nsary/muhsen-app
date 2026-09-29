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
/* ─── تركيبٌ في وقت التشغيل ─────────────────────────────────
   البذرةُ تُولّد أسماءً جديدةً كلَّ مرّة، فلا يسعها قاموسٌ ساكن.
   وما كان مركّبًا من مفرداتٍ مترجَمة يُبنى هنا بدل أن يُخزَّن. */
/* رموزُ الماليزيّة ونظائرُها: يُبحَث بالنظير ويُردُّ الجوابُ إلى أصله */
const MS2EN = {
  'PG':'am', 'PTG':'pm', 'MLM':'pm', 'TGH':'pm',
  'Mac':'Mar', 'Mei':'May', 'Ogo':'Aug', 'Sep':'Sept', 'Okt':'Oct', 'Dis':'Dec',
  'Isnin':'Monday', 'Selasa':'Tuesday', 'Rabu':'Wednesday', 'Khamis':'Thursday',
  'Jumaat':'Friday', 'Sabtu':'Saturday', 'Ahad':'Sunday'
};
const EN2MS = (function () {
  const o = {};
  Object.keys(MS2EN).forEach(k => { if (o[MS2EN[k]] == null) o[MS2EN[k]] = k; });
  return o;
})();
const MS_RE = new RegExp('\\b(' + Object.keys(MS2EN).join('|') + ')\\b', 'g');
const EN_RE = new RegExp('\\b(' + Object.keys(EN2MS).join('|') + ')\\b', 'g');
const TR_NAME = { "أحمد":"Ahmed", "أروى":"Arwa", "أسماء":"Asma", "أغوس":"Agus", "أمل":"Amal", "أمينة":"Aminah", "أندي":"Andi", "أنس":"Anas", "إبراهيم":"Ibrahim", "إدريس":"Idris", "إسماعيل":"Ismail", "إندا":"Indah", "الأحمدي":"Al-Ahmadi", "البقمي":"Al-Buqami", "الثقفي":"Al-Thaqafi", "الجهني":"Al-Juhani", "الحارثي":"Al-Harthi", "الحربي":"Al-Harbi", "الخالدي":"Al-Khalidi", "الدوسري":"Al-Dosari", "الرشيدي":"Al-Rashidi", "الزهراني":"Al-Zahrani", "السبيعي":"Al-Subaie", "السلمي":"Al-Sulami", "السهلي":"Al-Suhali", "الشريف":"Al-Sharif", "الشمري":"Al-Shammari", "الشهري":"Al-Shehri", "الصاعدي":"Al-Saedi", "العتيبي":"Al-Otaibi", "العسيري":"Al-Asiri", "العنزي":"Al-Anzi", "الغامدي":"Al-Ghamdi", "الفيفي":"Al-Faifi", "القحطاني":"Al-Qahtani", "القرني":"Al-Qarni", "المالكي":"Al-Maliki", "المطيري":"Al-Mutairi", "النفيعي":"Al-Nufaie", "بامبانغ":"Bambang", "بدر":"Badr", "براتاما":"Pratama", "بشاير":"Bashayer", "بندر":"Bandar", "بودي":"Budi", "تركي":"Turki", "جواهر":"Jawaher", "جود":"Joud", "جوكو":"Joko", "حارث":"Harith", "حسن":"Hassan", "حليمة":"Halimah", "حمد":"Hamad", "خالد":"Khalid", "خيري":"Khairi", "دانة":"Dana", "ديدي":"Dedi", "ديوي":"Dewi", "رائد":"Raed", "راشد":"Rashid", "راكان":"Rakan", "رحمن":"Rahman", "رحمواتي":"Rahmawati", "رزان":"Razan", "رغد":"Raghad", "رقية":"Ruqayyah", "ريان":"Rayan", "ريتنو":"Retno", "ريم":"Reem", "ريما":"Rima", "زكريا":"Zakaria", "زياد":"Ziyad", "زينب":"Zainab", "سارة":"Sara", "ساري":"Sari", "سالم":"Salim", "سانتوسو":"Santoso", "سري":"Sri", "سعد":"Saad", "سعود":"Saud", "سعيد":"Saeed", "سلطان":"Sultan", "سميرة":"Samira", "سوتريسنو":"Sutrisno", "سيتي":"Siti", "شذى":"Shatha", "شهد":"Shahd", "طلال":"Talal", "ظافر":"Zafir", "عائشة":"Aishah", "عادل":"Adel", "عايض":"Ayedh", "عبدالرحمن":"Abdul Rahman", "عبدالعزيز":"Abdulaziz", "عبدالله":"Abdullah", "عبير":"Abeer", "عثمان":"Othman", "علي":"Ali", "عمر":"Omar", "عهود":"Uhud", "غادة":"Ghada", "فاطمة":"Fatimah", "فهد":"Fahd", "فيصل":"Faisal", "لؤي":"Luay", "لطيفة":"Latifa", "لمياء":"Lamia", "ليان":"Layan", "ماجد":"Majed", "مازن":"Mazen", "مبارك":"Mubarak", "محمد":"Mohammed", "مرزوق":"Marzouq", "مسفر":"Musfir", "مشعل":"Mishal", "منال":"Manal", "منى":"Muna", "مها":"Maha", "مولياني":"Mulyani", "ناصر":"Nasser", "نافل":"Nafel", "نايف":"Nayef", "نور":"Nur", "نورة":"Noura", "نورول":"Nurul", "نوف":"Nouf", "هارتونو":"Hartono", "هاري":"Hari", "هشام":"Hisham", "هند":"Hind", "هيا":"Haya", "هيفاء":"Haifa", "وجدان":"Wijdan", "وليد":"Waleed", "ويجايا":"Wijaya", "ويوين":"Wiwin", "ياسر":"Yasser", "ياني":"Yani", "يحيى":"Yahya", "يوسف":"Yusuf" };
const TR_JOIN = { 'بن':'bin', 'بنت':'bint', 'ابن':'ibn' };
const TR_WRAP = [
  [/^· ([\s\S]+)$/,                 '· $',               '· $'],
  [/^([\s\S]+) ·$/,                 '$ ·',               '$ ·'],
  [/^([\s\S]+) —$/,                 '$ —',               '$ —'],
  [/^إنذارات ([\s\S]+)$/,           'Warnings — $',      'Amaran — $'],
  [/^كل إنذارات ([\s\S]+)$/,        'All warnings — $',  'Semua amaran — $'],
  [/^إنذار غياب على ([\s\S]+)$/,    'Absence warning — $', 'Amaran ketidakhadiran — $'],
  [/^لم يُثبت حضوره في «([\s\S]+)»$/, 'Did not check in for “$”', 'Tidak mendaftar hadir untuk “$”'],
  [/^المقترح بناءً على سجلّه: ([\s\S]+)$/, 'Proposed on their record: $', 'Dicadangkan berdasarkan rekodnya: $'],
  [/^أُرسل طلب تسكين إلى ([\s\S]+)$/, 'Rooming request sent to $', 'Permintaan penempatan dihantar kepada $'],
  [/^أُسند إلى ([\s\S]+)$/,         'Assigned to $',     'Ditugaskan kepada $'],
  [/^بديلٌ عن ([\s\S]+)$/,          'Substitute for $',  'Pengganti untuk $'],
  [/^([\s\S]+) أثبت حضوره$/,        '$ checked in',      '$ telah mendaftar hadir'],
  [/^لم يثبت ([\s\S]+) حضوره$/,     '$ did not check in', '$ tidak mendaftar hadir'],
  [/^([\s\S]+) قبل التسكين$/,       '$ — before rooming', '$ — sebelum penempatan'],
  [/^المشرف ([\s\S]+)$/,            'Supervisor $',      'Penyelia $'],
  [/^الليدر ([\s\S]+)$/,            'Leader $',          'Ketua $'],
  [/^المحسن ([\s\S]+)$/,            'Muhsen $',          'Muhsin $'],
  [/^الحاجّ ([\s\S]+)$/,            'Pilgrim $',         'Jemaah $'],
  [/^أُغلقت مهمّة ([\s\S]+)$/,      'Task closed — $',   'Tugas ditutup — $'],
  [/^سُكِّن (\{n\}) محسنًا على ([\s\S]+)$/, '{n} Muhsens rostered for $', '{n} Muhsin ditempatkan untuk $'],
  [/^حُفظت مسودّة ([\s\S]+)$/,      'Draft saved — $',   'Draf disimpan — $'],
  [/^إنذار عدم استخدام التطبيق على ([\s\S]+)$/, 'App-non-use warning — $', 'Amaran tidak menggunakan aplikasi — $']
];
/* «س من ص» و«س إلى ص»: رابطٌ يُنقَل وطرفاه يُبنيان */
const TR_LINK = [['\u0645\u0646', ' from ', ' daripada '], ['\u0625\u0644\u0649', ' to ', ' hingga ']];
const TR_SEPS = [' — ', ' · ', ' ← ', ' › ', ': ', ' – '];

/* بحثٌ متدرّج: نصًّا، ثم بفجوة العدد، ثم بمسافةٍ مطويّة */
function trLookup(d, t) {
  const direct = d[t];
  if (direct != null) return direct;
  const nums = [];
  const key = t.replace(NUM_HOLE, m => { nums.push(m); return '{n}'; });
  let tpl = d[key];
  if (tpl == null) {
    const flat = key.replace(/\s+/g, ' ');
    if (flat !== key) tpl = d[flat];
  }
  if (tpl != null) {
    let i = 0;
    return tpl.replace(/{n}/g, () => {
      const v = nums[i++];
      return v == null ? '' : NUM(v);
    });
  }
  /* الماليزيّةُ تُبحَث بمفتاح الإنجليزيّة ثمّ يُردُّ جوابُها إلى رموزها */
  if (langOf() === 'ms') {
    const alt = t.replace(MS_RE, m => MS2EN[m]);
    if (alt !== t) {
      const r = trLookup(d, alt);
      if (r != null) return r.replace(EN_RE, m => EN2MS[m]);
    }
  }
  return null;
}

/* اسمُ علمٍ: كلُّ مقاطعه معروفة وإلّا فلا — فلا يُنقَل نصفُ اسم */
function trName(t) {
  const toks = t.split(' ');
  if (toks.length < 2 || toks.length > 5) return null;
  const out = [];
  for (let i = 0; i < toks.length; i++) {
    const h = TR_JOIN[toks[i]] || TR_NAME[toks[i]];
    if (!h) return null;
    out.push(h);
  }
  if (out[0] === 'bin' || out[0] === 'bint') return null;
  return out.join(' ');
}

/* يُفكَّك المركَّبُ عند فاصله ويُبنى طرفاه، وإلّا فلا شيء */
function trCompose(d, t, depth) {
  if (!AR_RE.test(t)) return t;
  const hit = trLookup(d, t);
  if (hit != null) return hit;
  if (depth > 4) return null;
  const nm = trName(t);
  if (nm) return nm;
  for (let w = 0; w < TR_WRAP.length; w++) {
    const g = t.match(TR_WRAP[w][0]);
    if (!g) continue;
    const last = g.length - 1;
    const inner = trCompose(d, g[last], depth + 1);
    if (inner == null) continue;
    const tpl = TR_WRAP[w][langOf() === 'ms' ? 2 : 1];
    const built = tpl.replace('$', inner);
    return last === 2 ? built.replace('{n}', NUM(g[1].replace(/[^\u0660-\u06690-9]/g, ''))) : built;
  }
  for (let l = 0; l < TR_LINK.length; l++) {
    const sep = ' ' + TR_LINK[l][0] + ' ';
    const i2 = t.indexOf(sep);
    if (i2 <= 0) continue;
    const a2 = trCompose(d, t.slice(0, i2), depth + 1);
    if (a2 == null) continue;
    const b2 = trCompose(d, t.slice(i2 + sep.length), depth + 1);
    if (b2 == null) continue;
    return a2 + TR_LINK[l][langOf() === 'ms' ? 2 : 1] + b2;
  }
  for (let s = 0; s < TR_SEPS.length; s++) {
    const sep = TR_SEPS[s];
    let i = -1;
    for (;;) {
      i = t.indexOf(sep, i + 1);
      if (i <= 0) break;
      const a = trCompose(d, t.slice(0, i), depth + 1);
      if (a == null) continue;
      const b = trCompose(d, t.slice(i + sep.length), depth + 1);
      if (b == null) continue;
      return a + sep + b;
    }
  }
  return null;
}

function TT(piece, inText) {
  const L = langOf();
  if (L === 'ar' || !piece) return piece;
  const d = DICT[L] || {};
  const t = piece.trim();
  if (!t || !AR_RE.test(t)) return piece;
  if (_cache && _cache.has(piece)) return _cache.get(piece);

  /* نصًّا، ثمّ بفجوة العدد، ثمّ تركيبًا من مفرداتٍ مترجَمة */
  const hit = trCompose(d, t, 0);
  /* إمّا تُترجَم القطعةُ كاملةً أو تبقى عربيّةً كاملة. والاستبدالُ
     الجزئيُّ يُنتج «غرفة Operations»: مشوّهًا لا عربيًّا ولا إنجليزيًّا. */
  /* ما لم يُترجَم يبقى عربيًّا — لكنّ العربيَّ داخل تخطيطٍ لاتينيٍّ
     يتشظّى: النقطتان تقفزان إلى آخر السطر، والأرقامُ تنقلب. فيُعزَل
     في <bdi dir="rtl"> فيُقرأ صحيحًا وإن لم يُترجَم بعد. */
  let out;
  if (hit != null) out = piece.replace(t, hit);
  else if (inText) out = piece.replace(t, bdiWrap(t));
  else out = piece;
  if (_cache) _cache.set(piece, out);
  return out;
}
const AR_RE = /[؀-ۿ]/;
/* عزلٌ ثنائيُّ الاتّجاه لنصٍّ عربيٍّ لم تصله الترجمةُ بعد */
const bdiWrap = t => '<bdi dir="rtl" class="arx">' + t + '</bdi>';

/* ---------- ترجمةُ ناتج الرسم ---------- */
/* السماتُ التي تُعرض للقارئ — وما عداها منطقٌ لا يُترجم */
const TR_ATTRS = /\b(placeholder|title|aria-label|alt)="([^"]*)"/g;
/* نصٌّ بين وسمين */
const TR_TEXT  = />([^<>]*[؀-ۿ][^<>]*)</g;

function TR(html) {
  if (langOf() === 'ar' || !html) return html;
  dictKeys();
  return String(html)
    .replace(TR_TEXT, (m, txt) => '>' + TT(txt, true) + '<')
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
    /* الفاصلةُ العربيّة ٫ تبقى داخل رقمٍ لاتينيٍّ فتُقرأ خطأً — فتُقلَب */
    : s.replace(/[٠-٩]/g, d => String(AR_DIGITS.indexOf(d))).replace(/٫/g, '.').replace(/٬/g, ',');
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
