/* ============================ أدوات العرض ============================ */
const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const icon = (n, cls) => '<svg class="ic ' + (cls || '') + '"><use href="#' + n + '"/></svg>';
const avat = (u, cls) => '<span class="av ' + (cls || '') + ' ' + u.av + '"><svg viewBox="0 0 44 44"><use href="#av-' + u.g + '"/></svg></span>';
const pill = (t, c) => '<span class="pill ' + c + '">' + E(t) + '</span>';
const IMG = window.IMG;

function toast(text, kind) { S.toast = { text, kind: kind || 'g', at: Date.now() }; }
function go(n, id) { S.route = { n, id }; save(); render(); }

/* نجوم */
function stars(v, size) {
  const full = Math.floor(v), half = v - full >= 0.5;
  let out = '<span class="stars ' + (size || '') + '">';
  for (let i = 1; i <= 5; i++) {
    const on = i <= full, hf = !on && i === full + 1 && half;
    out += '<svg class="ic ' + (size === 'lg' ? 's18' : 's14') + ' ' + (on ? 'on' : hf ? 'half' : 'off') + '"><use href="#i-star"/></svg>';
  }
  return out + '<b>' + AR(String(v).replace(/\.0$/, '')) + '</b></span>';
}

/* شريط علوي — كل زر له وجهة صحيحة */
function bar(title, opt) {
  opt = opt || {};
  const u = me();
  const right = opt.right !== undefined ? opt.right
    : '<button data-a="go" data-n="profile" class="avbtn" aria-label="الملف الشخصي">' + (u ? avat(u, 'sm') : '') + '</button>';
  const left = opt.back
    ? '<button data-a="back" aria-label="رجوع">' + icon('i-back') + '</button>'
    : (opt.left !== undefined ? opt.left
      : '<button data-a="go" data-n="notifs" aria-label="الإشعارات" class="wi">' + icon('i-bell') +
        (unread() ? '<span class="badge">' + AR(unread()) + '</span>' : '') + '</button>');
  /* مبدّلُ اللغة خرج من الترويسة: كان يزاحم العنوانَ على عرض
     الجوّال، وهو إعدادٌ لا أداةُ شاشة. وموضعُه الآن شاشةُ الدخول
     (قبل أيّ حساب) والإعداداتُ — نقرتان من «المزيد». */
  return '<div class="top"><div class="sbar"><span>' + t12(now()) + '</span>' +
    '<svg class="ic s16 f" viewBox="0 0 44 16"><rect x="0" y="9" width="3" height="5" rx="1"/><rect x="5" y="6.5" width="3" height="7.5" rx="1"/><rect x="10" y="4" width="3" height="10" rx="1"/><rect x="15" y="1.5" width="3" height="12.5" rx="1"/><path d="M26.5 4.2a8 8 0 019 0l-4.5 6z"/><rect x="38" y="4" width="5.5" height="9" rx="1.6"/></svg></div>' +
    '<div class="nav">' + left + '<span class="t">' + E(title) + '</span>' + right + '</div></div>';
}

/* ============================================================
   الشريطُ السفليّ — خمسةُ مواضعَ ثابتةٍ لا تنزلق

   كان صفحتين تنزلقان بالسحب، فيختفي نصفُ الوجهات خلف نقطتين لا
   تكادان تُريان، وتُقلَب الإزاحةُ في اللغات اللاتينيّة فتخرج
   التبويباتُ من الشاشة. وصار خمسةً لا تتحرّك:
     [مخصَّص] [مخصَّص] · الرئيسية · [مخصَّص] [المزيد]
   و«المزيد» يفتح بقيّةَ الأبواب لوحًا عائمًا. والثلاثةُ المخصَّصة
   يرتّبها المستخدمُ من الإعدادات.
   ============================================================ */
const TAB_SLOTS = 3;

/* من يملك ردودًا: محسنو النقل — والليدرُ لا يركب */
const mayRide = () => {
  const u = me();
  return !!u && u.role === 'muhsen' && u.specialty === 'نقل';
};

/* كلُّ وجهةٍ تصلح للشريط في هذا البناء */
function tabCatalog() {
  const L = isLeader();
  const inbox = S.requests.filter(x => x.to === S.session.id && x.state === 'pending').length +
    pendingSwaps().length;
  const openTk = myTickets().filter(k => k.status !== 'مغلقة').length;
  const out = [
    { k:'tasks',   i:'i-tasks',  l:'المهام',    on:['tasks','task','assign','timeline','doc'] },
    { k: L ? 'lreq' : 'requests', i:'i-swap', l:'الطلبات', b:inbox, on:['lreq','requests'] },
    { k:'daily',   i:'i-check',  l:'التحضير',   on:['daily'] },
    { k:'desk',    i:'i-ticket', l:'البلاغات',  b:openTk + openReports(),
      on:['desk','tickets','ticket','report'] },
    { k:'notifs',  i:'i-bell',   l:'الإشعارات', b:unread(), on:['notifs'] },
    { k:'guide',   i:'i-guide',  l:'الدليل',    on:['guide'] },
    { k:'rating',  i:'i-star',   l:'التقييم',   on:['rating','taskrating'] },
    { k:'calendar',i:'i-cal',    l:'التقويم',   on:['calendar'] },
    { k:'album',   i:'i-album',  l:'الصور',     on:['album','photo'] },
    { k:'pilgrims',i:'i-user',   l:'الحجاج',    on:['pilgrims'] }
  ];
  if (L) out.splice(3, 0, { k:'muhsens', i:'i-users', l:'المحسنون', on:['muhsens'] });
  if (mayRide()) out.splice(3, 0,
    { k:'rides', i:'i-bus', l:'الردود', b:openRides(), on:['rides'] });
  return out;
}

/* الافتراضيُّ: ما يُفتح كلَّ يوم. ولكلّ دورٍ يومُه. */
const TAB_DEFAULT = () => isLeader()
  ? ['tasks', 'lreq', 'desk']
  : ['tasks', 'daily', 'desk'];

/* الاختيارُ يُحترَم كما هو. وكان يُعاد ملؤه من الافتراضيّ متى نقص،
   فإخراجُ وجهةٍ افتراضيّةٍ لا يقع — تُحذف ثمّ تعود في النداء نفسِه.
   فصار: ما دام المستخدمُ لم يختر فالافتراضيُّ، وإذا اختار فاختيارُه. */
function tabChosen() {
  const cat = tabCatalog(), has = k => cat.some(x => x.k === k);
  if (S.tabs) return S.tabs.filter(has).slice(0, TAB_SLOTS);
  const out = [];
  const fill = k => { if (out.length < TAB_SLOTS && has(k) && out.indexOf(k) < 0) out.push(k); };
  TAB_DEFAULT().forEach(fill);
  cat.forEach(x => fill(x.k));
  return out;
}
const tabRest = () => {
  const c = tabChosen();
  return tabCatalog().filter(x => c.indexOf(x.k) < 0);
};

function tabs() {
  const r = S.route.n, cat = tabCatalog();
  const sel = tabChosen().map(k => cat.find(x => x.k === k));

  const btn = it => {
    if (!it) return '<span class="tspacer"></span>';
    const on = it.on.indexOf(r) >= 0;
    return '<button class="' + (on ? 'on' : '') + '" role="tab"' + (on ? ' aria-selected="true"' : '') +
      ' data-a="go" data-n="' + it.k + '">' +
      '<span class="wi">' + icon(it.i) + (it.b ? '<span class="badge">' + AR(it.b) + '</span>' : '') +
      '</span><span class="tl">' + it.l + '</span></button>';
  };

  /* شارةُ «المزيد» تجمع ما خلفها — وإلّا اختفى العاجلُ بلا أثر */
  const restN = tabRest().reduce((a, x) => a + (x.b || 0), 0);
  const moreOn = ['profile','admin','settings'].indexOf(r) >= 0;
  const more = '<button class="' + (moreOn ? 'on' : '') + '" role="tab" data-a="moresheet" ' +
    'aria-haspopup="dialog">' +
    '<span class="wi">' + icon('i-dots') +
    (restN ? '<span class="badge">' + AR(restN) + '</span>' : '') +
    '</span><span class="tl">المزيد</span></button>';

  const homeOn = ['home','mhome'].indexOf(r) >= 0;
  return '<nav class="tabs" role="tablist" aria-label="التنقّل">' +
    '<div class="tside">' + btn(sel[0]) + btn(sel[1]) + '</div>' +
    '<button class="home' + (homeOn ? ' on' : '') + '" role="tab"' +
      (homeOn ? ' aria-selected="true"' : '') +
      ' data-a="go" data-n="' + (isLeader() ? 'home' : 'mhome') + '">' +
      '<span class="wi hb"><i class="mlogo"></i></span>' +
      '<span class="hl">الرئيسية</span></button>' +
    '<div class="tside">' + btn(sel[2]) + more + '</div>' +
    '</nav>';
}

/* ============================================================
   قائمةُ «المزيد» — أزرارٌ عائمةٌ متصاعدة (Speed dial)

   زرٌّ رئيسيٌّ في زاوية الإبهام، ونقرُه يُخرج الأزرارَ الفرعيّةَ
   عموديًّا فوقه واحدًا بعد واحد، وخلفَها حجابٌ ضبابيٌّ يُركّز
   النظرَ عليها.

   وما له موضعٌ آخرُ لا يُكرَّر هنا: الإشعاراتُ والملفُّ الشخصيُّ
   زرّان في الترويسة، والدليلُ والصورُ والتقييمُ تحت الإعدادات.
   ============================================================ */

/* لا يظهر في القائمة العائمة: له بابٌ أقربُ منها */
const FAB_OUT = ['notifs', 'profile', 'album', 'rating', 'guide'];

function fabItems() {
  return tabRest()
    .filter(x => FAB_OUT.indexOf(x.k) < 0)
    .map(x => [x.k, x.i, x.l, x.b])
    .concat([['settings', 'i-gear', 'الإعدادات', 0]]);
}

function moreSheet() {
  const rows = fabItems();
  const n = rows.length;

  /* الأوّلُ في النصّ أعلى الشاشة، والأقربُ إلى الإبهام يصعد آخرًا:
     فيُقرأ الترتيبُ من الأعلى ويُلمَس من الأسفل. */
  const btn = (x, i) =>
    '<button class="fab" data-a="go" data-n="' + x[0] + '" ' +
      'style="--i:' + (n - i) + '">' +
      '<b>' + x[2] + '</b>' +
      '<span class="fi">' + icon(x[1], 's19') +
      (x[3] ? '<span class="badge">' + AR(x[3]) + '</span>' : '') + '</span>' +
    '</button>';

  return '<div class="fabwrap">' +
    '<div class="fabs" role="menu" aria-label="المزيد">' +
      rows.map(btn).join('') +
    '</div>' +
    '<button class="fabmain" data-a="close" aria-label="إغلاق القائمة" ' +
      'aria-expanded="true">' + icon('i-x', 's22') + '</button>' +
  '</div>';
}

/* ختم بيئة الجهاز — يكشف سبب أي فراغ في الميدان بلا تخمين */
function envStamp() { return '<span id="envst"></span>'; }
function envStampNow() {
  try {
    const st = document.documentElement.classList.contains('app-standalone') ? 'مثبَّت' : 'متصفح';
    const tb = document.querySelector('.tabs');
    const gap = tb ? Math.round(window.innerHeight - tb.getBoundingClientRect().bottom) : '—';
    return st + ' · ' + AR(window.innerWidth) + '×' + AR(window.innerHeight) + ' · فراغ ' + AR(gap);
  } catch (e) { return ''; }
}
const ground = () => '<div class="ground"></div>';

/* ============================ مكوّنات مشتركة ============================ */
function svcCard(t) {
  const st = STATUS[t.status];
  return '<div class="c gold"><div class="fl" style="align-items:flex-start">' +
    '<div class="sp"><b style="font-size:15.5px;line-height:1.5">' + E(t.title) + '</b>' +
      '<div class="sm dim" style="margin-top:3px">' + E(t.desc) + '</div>' +
      '<div class="fl sm dim" style="gap:5px;margin-top:3px">' + icon('i-pin','s14') + '<span>' + E(t.place) + '</span></div>' +
      '<div class="sm dim2">' + E(t.city) + '</div></div>' +
    '<span class="thumb bg-' + t.photo + '"></span></div>' +
    '<div class="fl" style="margin-top:11px;justify-content:space-between;flex-wrap:wrap;gap:6px">' +
      pill(st.t, st.c) +
      '<span class="tiny dim2">' + E(orgOf(t).ar) + ' · ' + E(t.kt) + '</span></div></div>';
}
function metaCard(t) {
  return '<div class="meta">' +
    '<div><span class="k">' + icon('i-hash','s14') + 'رقم المهمة</span><b>' + AR(t.code) + '</b></div>' +
    '<div><span class="k">' + icon('i-cal','s14') + 'التاريخ</span><b>' + hijri(t.start) + '<span>' + greg(t.start) + '</span></b></div>' +
    '<div><span class="k">' + icon('i-clock','s14') + 'الوقت</span><b>' + t12(t.start) + '<span>إلى ' + t12(t.end) + '</span></b></div>' +
    '<div><span class="k">' + icon('i-hour','s14') + 'المدة</span><b>' + AR(t.durH) + ' ساعات</b></div></div>';
}
function mapBox(t, showMe) {
  const inside = S.myPlace === 'site';
  const mx = inside ? 50 : 20, my = inside ? 50 : 26;
  return '<div class="map"><svg viewBox="0 0 360 170" preserveAspectRatio="none">' +
    '<rect width="360" height="170" fill="#ECEFE8"/>' +
    '<g stroke="#DEE3D8" stroke-width="11" fill="none"><path d="M-10 44H370"/><path d="M-10 124H370"/><path d="M92-10V180"/><path d="M258-10V180"/></g>' +
    '<g fill="#E3E7DD"><rect x="106" y="58" width="66" height="42" rx="5"/><rect x="272" y="56" width="60" height="48" rx="5"/><rect x="18" y="58" width="60" height="42" rx="5"/><rect x="106" y="134" width="66" height="30" rx="5"/></g>' +
    (showMe && !inside ? '<path d="M72 44L176 78" stroke="#C0392B" stroke-width="2" stroke-dasharray="6 6" fill="none"/>' : '') +
    '</svg><span class="ring' + (showMe && !inside ? ' bad' : '') + '"></span><span class="dot"></span>' +
    (showMe ? '<span class="dot me' + (inside ? '' : ' bad') + '" style="inset-block-start:' + my + '%;inset-inline-start:' + mx + '%"></span>' : '') +
    '<span class="scale">النطاق ' + AR(RADIUS_KM) + ' كم</span>' +
    (showMe ? '<span class="legend">' + (inside ? 'داخل النطاق' : 'خارج النطاق') + '</span>' : '') + '</div>';
}

/* درجة الإلحاح */
function urgency(t) {
  if (['done', 'cancelled', 'running'].includes(t.status)) return null;
  const left = t.start - now(), acc = acceptedSlots(t).length;
  const pend = pendingWithdraws(t).length;
  if (left < 0) return null;
  if (!acc) return left < 3 * HR
    ? { k:'urgent', c:'r', i:'i-warn', txt:'تبدأ ' + untilTxt(t.start) + ' — ولا يوجد محسن عليها' }
    : { k:'soon', c:'a', i:'i-assign', txt:'بلا محسنين — اطلب تعزيزًا من الاحتياط' };
  if (pend) return { k:'soon', c:'a', i:'i-out',
    txt:AR(pend) + ' طلب انسحاب ينتظر قرارك' };
  if (left < 3 * HR) return { k:'soon', c:'a', i:'i-clock',
    txt:'تبدأ ' + untilTxt(t.start) + ' — ' + AR(acc) + ' محسن جاهزون' };
  return null;
}


function taskRow(t) {
  recomputeStatus(t);
  const uid_ = S.session.id;
  const acc = acceptedSlots(t).length;
  const ug = urgency(t);
  const bucket = taskBucket(t, uid_), bk = bucketOf(bucket);
  const ui = kindUI(t);
  const doneSubs = t.subs.filter(s => s.done).length;
  const hideDetail = !isLeader() && bucket === 'undone';
  const deleg = t.delegate && t.delegate.state === 'accepted';
  const watchOnly = isLeader() && deleg;

  return '<div class="c task b-' + bucket + (ug ? ' ' + ug.k : '') + '" role="button" tabindex="0" style="--kc:' + ui.c + '" ' +
    'data-a="go" data-n="task" data-id="' + t.id + '">' +
    '<div class="fl" style="align-items:flex-start;gap:11px">' +
      '<span class="tthumb bg-' + t.photo + '">' +
        '<span class="kb">' + icon(ui.i, 's14') + '</span></span>' +
      '<div class="sp">' +
        '<div class="fl" style="align-items:flex-start;gap:8px">' +
          '<b style="font-size:14.5px;line-height:1.5" class="sp">' + E(t.title) + '</b>' +
          '<span class="bpill ' + bk.c + '">' + icon(bk.i, 's14') + bk.l + '</span></div>' +
        '<div class="tiny dim" style="margin-top:4px">' + hijri(t.start) + ' · ' + t12(t.start) + '</div>' +
        '<div class="tiny dim2">' + E(t.place) + '</div>' +
        (hideDetail ? '' :
        '<div class="fl" style="gap:6px;margin-top:7px;flex-wrap:wrap">' +
          pill(AR(t.subs.length) + ' فرعية', 'grey') +
          pill(AR(acc) + ' محسن', acc ? 'live' : 'no') +
          (t.status === 'running' ? pill(AR(doneSubs) + ' من ' + AR(t.subs.length) + ' منجزة', 'live') : '') +
          (t.rating ? pill('★ ' + AR(avgRating(t.rating)), 'gold') : '') +
          photoBadge(t) + guideChip(t) + '</div>') +
      '</div></div>' +
    (watchOnly ? '<div class="strip b">' + icon('i-shield', 's16') +
      '<span>الليدر عليها: ' + E(userById(t.delegate.muhsenId).name) + ' — متابعة بلا قرارات</span></div>' : '') +
    (bucket === 'undone'
      ? '<div class="strip r">' + icon('i-warn', 's16') +
        '<span>' + E(undoneReason(t, uid_)) + '</span></div>'
      : (ug ? '<div class="strip ' + ug.c + '">' + icon(ug.i, 's16') + '<span>' + E(ug.txt) + '</span></div>' : '')) +
    '</div>';
}

/* ============================ تسجيل الدخول ============================ */
/* ============================================================
   الدخول — على بنية شاشة الدخول في «نُزلي لإدارة المشاريع»

   قرأتُ شاشتَها من مصدرها (LoginPage.tsx و AuthLayout.tsx)
   وأنماطَها المبنيّة، وبنيتُ هذه عليها:

     شعارٌ في الأعلى · عنوانٌ وسطرٌ تحته
     نموذجٌ: اسم المستخدم · كلمة المرور بزرّ إظهار · «نسيت؟»
     زرُّ «تسجيل الدخول» بعرض الحقل
     فاصلٌ ثمّ أزرارُ الصفات للتجربة السريعة
     سطرٌ أخيرٌ فيه كلمةُ المرور التجريبيّة

   وأزرارُ الصفات هي ما يقوم مقامَ القائمة: نقرةٌ واحدةٌ تدخلك
   بصفةٍ جاهزة، والنموذجُ فوقها يبقى نموذجًا حقيقيًّا.
   ============================================================ */

const DEMO_PW = '48162048';

/* صفةُ الحساب في سطرٍ واحد — تُقرأ تحت الاسم في القائمة */
const loginSub = u => {
  if (!u) return '';
  const L2 = userById(u.leaderId);
  return u.role === 'leader'
    ? 'محسن ليدر · ' + u.kt
    : 'مُحسن · ' + u.specialty +
      (u.reserve ? ' · فريق امتثال' : L2 ? ' · فريق ' + L2.name.split(' ')[0] : '');
};

/* القائمةُ تحت الحقل: تُصفَّى بما يُكتب — اسمًا أو رمزًا أو تخصّصًا.
   فلا أزرارَ صفاتٍ منفصلة: الكتابةُ هي الاختيار. */
function loginList() {
  const q = (S.loginU || '').trim();
  const list = S.users.slice().sort((a, b) =>
    (a.role === 'leader' ? 0 : 1) - (b.role === 'leader' ? 0 : 1));
  if (!q) return list;
  const low = q.toLowerCase().replace(/^#/, '');
  return list.filter(u =>
    u.name.indexOf(q) >= 0 ||
    String(u.code || '').toLowerCase().replace(/^#/, '').indexOf(low) >= 0 ||
    u.id.toLowerCase().indexOf(low) >= 0 ||
    String(u.specialty || '').indexOf(q) >= 0 ||
    String(u.kt || '').toLowerCase().indexOf(low) >= 0);
}

/* المكتوبُ يُطابَق بالرمز أو بالاسم — ومن اختار من القائمة فاختيارُه */
function loginMatch() {
  if (S.loginId) { const u = userById(S.loginId); if (u) return u; }
  const q = (S.loginU || '').trim();
  if (!q) return null;
  const low = q.toLowerCase().replace(/^#/, '');
  return S.users.find(u =>
    u.name === q ||
    String(u.code || '').toLowerCase().replace(/^#/, '') === low ||
    u.id.toLowerCase() === low) || null;
}

function screenLogin() {
  const picked = S.loginId ? userById(S.loginId) : null;
  const open = !!S.loginOpen;
  const list = open ? loginList() : [];

  const opt = u =>
    '<button type="button" class="lopt' + (picked && picked.id === u.id ? ' on' : '') + '" ' +
      'data-a="loginsel" data-id="' + u.id + '" role="option">' +
      avat(u, 'sm') +
      '<span class="nm sp"><b>' + E(u.name) + '</b>' +
        '<span>' + E(loginSub(u)) + ' · ' + E(u.code || '') + '</span></span>' +
      (picked && picked.id === u.id ? icon('i-checkc', 's18') : '') +
    '</button>';

  return '<div class="login"><i class="pat"></i>' +
    '<div class="loginlang">' + langSwitch() + '</div>' +

    '<div class="authmain">' +
      '<div class="authtop">' +
        '<i class="logo mlockup" role="img" aria-label="مُحسن"></i>' +
      '</div>' +

      '<div class="authcard">' +
        '<div class="authhead">' +
          '<h1>تسجيل الدخول</h1>' +
          '<p class="authsub">تطبيق الميدان — موسم الحج ١٤٤٨ هـ</p>' +
        '</div>' +

        '<form class="authbody" data-a="nosubmit">' +
          (S.loginErr ? '<div class="autherr" role="alert">' + icon('i-warn', 's16') +
            '<span>' + E(S.loginErr) + '</span></div>' : '') +

          '<div class="fld">' +
            '<label for="lu">اسم المستخدم</label>' +
            '<div class="combo' + (open ? ' open' : '') + '">' +
              '<div class="cbox' + (open ? ' on' : '') + '">' +
                icon('i-user', 's18') +
                '<input id="lu" type="text" autocomplete="off" role="combobox" ' +
                  'aria-expanded="' + (open ? 'true' : 'false') + '" ' +
                  'placeholder="اكتب الاسم أو الرمز" ' +
                  'value="' + E(S.loginU || '') + '" data-a="loginopen" ' +
                  'aria-label="اسم المستخدم">' +
                '<button type="button" class="cbtn" data-a="logintoggle" ' +
                  'aria-label="افتح قائمة الأسماء">' + icon('i-down', 's16') + '</button>' +
              '</div>' +
              (open
                ? '<div class="cmenu" role="listbox">' +
                    (list.length ? list.map(opt).join('')
                      : '<div class="cempty">' + icon('i-search', 's22') +
                        '<b>لا اسم يطابق</b></div>') +
                  '</div>'
                : '') +
            '</div>' +
          '</div>' +

          '<div class="fld">' +
            '<label for="lp">كلمة المرور</label>' +
            '<div class="pwrap">' +
              '<input id="lp" type="' + (S.loginShow ? 'text' : 'password') + '" ' +
                'autocomplete="current-password" value="' + E(S.loginP || '') + '" ' +
                'data-a="loginp" aria-label="كلمة المرور">' +
              '<button type="button" class="pweye" data-a="loginshow" ' +
                'aria-label="إظهار كلمة المرور أو إخفاؤها" ' +
                'aria-pressed="' + (S.loginShow ? 'true' : 'false') + '">' +
                icon('i-eye', 's18') + '</button>' +
            '</div>' +
            '<div class="fldend">' +
              '<button type="button" class="alink" data-a="loginforgot">نسيت كلمة المرور؟</button>' +
            '</div>' +
          '</div>' +

          '<button class="btn p wide" data-a="dologin"' + (S.loginBusy ? ' disabled' : '') + '>' +
            (S.loginBusy ? '<span class="spin"></span>' : icon('i-out', 's18')) +
            'تسجيل الدخول</button>' +
        '</form>' +

        '<p class="demonote">كلمة المرور لكل الحسابات التجريبية: ' +
          '<code class="ltr">' + DEMO_PW + '</code></p>' +
      '</div>' +

      '<div class="authfoot"><i class="mnozoly" role="img" aria-label="نُزلي"></i></div>' +
    '</div></div>';
}

function doLogin() {
  const u = loginMatch();
  if (!u) { S.loginErr = 'اختر اسمًا من القائمة أو اكتب رمزك'; save(); render(); return; }
  if ((S.loginP || '') !== DEMO_PW) {
    S.loginErr = 'كلمة المرور غير صحيحة'; save(); render(); return;
  }
  S.loginErr = null;
  enterAs(u.id);
}

function enterAs(id) {
  const u = userById(id); if (!u) return;
  S.loginBusy = true; S.loginErr = null; S.loginOpen = false;
  save(); render();
  setTimeout(function () {
    S.loginBusy = false;
    S.loginU = ''; S.loginP = ''; S.loginId = null; S.loginShow = false;
    S.session = { id: u.id, at: Date.now() };
    S.route = { n: u.role === 'leader' ? 'home' : 'mhome' };
    toast('مرحبًا ' + u.name, 'g'); buzz();
    save(); render();
    setTimeout(function () { if (maybeAskPush()) render(); }, 1400);
  }, 420);
}

/* ============================ تنبيهات ثابتة أعلى الصفحة ============================ */
function alertsHTML() {
  if (!S.session) return '';
  const u = me(); if (!u) return '';
  const out = [];
  const box = (cls, ic, title, body, act) =>
    '<button class="alert ' + cls + '" ' + (act || '') + '>' + icon(ic, 's26') +
      '<span class="sp"><b>' + E(title) + '</b><span>' + E(body) + '</span></span>' + icon('i-back','s16') + '</button>';

  if (u.role === 'muhsen') {
    myTasks().filter(t => ['running','assigned','pending_assign'].includes(t.status)).forEach(t => {
      const a = acceptedSlots(t).find(x => x.muhsenId === u.id);
      if (!a || a.attendedAt) return;
      if (now() >= t.start)
        out.push(box('bad', 'i-warn', 'تأخرت عن إثبات الحضور',
          '«' + t.title + '» بدأت ' + t12(t.start) + ' ولم تثبت حضورك — تُسجَّل عليك ملاحظة وتؤثر في تقييمك.',
          'data-a="go" data-n="mhome"'));
      else if (now() >= prepOpen(t)) {
        const r = hms(t.start - now());
        out.push(box('warn', 'i-clock', 'أثبت حضورك',
          '«' + t.title + '» — تبقّى ' + AR(r.h) + ':' + AR(r.m) + ':' + AR(r.s) + ' على بدايتها.',
          'data-a="go" data-n="mhome"'));
      }
    });
    const rq = myRequests().length;
    if (rq) out.push(box('warn', 'i-bell', 'لديك ' + AR(rq) + ' طلب بانتظار ردك',
      'تسكين أو تفويض — لا يكتمل التسكين قبل ردك.', 'data-a="go" data-n="requests"'));
  } else {
    const un = unassignedTasks();
    if (un.length) out.push(box(un.some(t => t.start - now() < 12 * HR) ? 'bad' : 'warn', 'i-assign',
      AR(un.length) + ' مهمة تحتاج تسكينًا',
      'أقربها «' + un[0].title + '» ' + untilTxt(un[0].start) + '. سكّن مبكرًا ولو كانت بعد أسابيع.',
      'data-a="go" data-n="tasks"'));
    const auto = myTasks().filter(t => t.status === 'running' && t.autoStarted);
    if (auto.length) out.push(box('bad', 'i-warn', AR(auto.length) + ' مهمة بدأها النظام',
      'حان وقتها ولم تبدأها — أغلقها، ويُحتسب ذلك في التقييم.',
      'data-a="go" data-n="task" data-id="' + auto[0].id + '"'));
    const notAtt = myTasks().filter(t => ['running','assigned','pending_assign'].includes(t.status) && inPrep(t) && !t.leaderAttendedAt);
    if (notAtt.length) out.push(box('warn', 'i-target', 'أثبت حضورك',
      '«' + notAtt[0].title + '»',
      'data-a="go" data-n="task" data-id="' + notAtt[0].id + '"'));
  }
  if (!out.length) return '';
  const atHome = ['home', 'mhome'].includes(S.route.n);
  if (atHome) return '<div class="alerts">' + out.join('') + '</div>';
  /* خارج الرئيسية: سطر واحد لا يزاحم محتوى الشاشة */
  const worst = out.some(x => x.indexOf('alert bad') >= 0);
  return '<button class="alerts one ' + (worst ? 'bad' : 'warn') + '" data-a="go" data-n="' +
    (u.role === 'leader' ? 'home' : 'mhome') + '">' + icon(worst ? 'i-warn' : 'i-bell', 's18') +
    '<span class="sp">' + AR(out.length) + (out.length === 1 ? ' تنبيه يحتاج إجراءً' : ' تنبيهات تحتاج إجراءً') + '</span>' +
    icon('i-back', 's16') + '</button>';
}

/* عدّاد الإجراءات على الحساب: ما ينتظر ردّه هو وحده — لا ما ينتظر وقته */
function pendingCountFor(uid_) {
  const u = userById(uid_); if (!u) return 0;
  let n = 0;
  if (u.role === 'muhsen') {
    S.tasks.forEach(t => {
      if (['done','cancelled'].includes(t.status)) return;
      t.assigned.forEach(a => {
        if (a.muhsenId !== uid_ || a.removed) return;
        if (a.req === 'pending') n++;                 /* طلب تسكين ينتظر ردّه */
      });
      if (t.delegate && t.delegate.muhsenId === uid_ && t.delegate.state === 'pending') n++;
    });
    n += S.tickets.filter(k => k.assignedTo === uid_ && k.status !== 'مغلقة').length;
  } else {
    S.tasks.filter(t => t.leaderId === uid_).forEach(t => {
      if (['done','cancelled'].includes(t.status)) return;
      if (!lockedForAssign(t) && !acceptedSlots(t).length) n++;   /* بلا محسنين */
      n += t.assigned.filter(a => a.wd && a.wd.state === 'pending' && !a.removed).length;
      if (t.status === 'running' && t.autoStarted) n++;
      if (t.status === 'running' && now() > t.end) n++;
    });
    n += (S.swaps || []).filter(s => s.leaderId === uid_ && s.state === 'pending').length;
    n += S.reports.filter(r => r.to === uid_ && r.status !== 'مغلق').length;
  }
  return n;
}
