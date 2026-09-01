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
  return '<div class="top"><div class="sbar"><span>' + t12(now()) + '</span>' +
    '<svg class="ic s16 f" viewBox="0 0 44 16"><rect x="0" y="9" width="3" height="5" rx="1"/><rect x="5" y="6.5" width="3" height="7.5" rx="1"/><rect x="10" y="4" width="3" height="10" rx="1"/><rect x="15" y="1.5" width="3" height="12.5" rx="1"/><path d="M26.5 4.2a8 8 0 019 0l-4.5 6z"/><rect x="38" y="4" width="5.5" height="9" rx="1.6"/></svg></div>' +
    '<div class="nav">' + left + '<span class="t">' + E(title) + '</span>' + right + '</div></div>';
}

/* شريط سفلي — كل الوجهات، ثلاث عن يمين الرئيسية وثلاث عن يسارها،
   والكتلة كلها تتبدّل صفحةً واحدة بالسحب أو بنقر النقاط */
const TABS_SIDE = 3;

function tabItems() {
  const L = isLeader();
  const inbox = S.requests.filter(x => x.to === S.session.id && x.state === 'pending').length +
    pendingSwaps().length;
  const openTk = myTickets().filter(k => k.status !== 'مغلقة').length;
  const base = [
    { k:'tasks',   i:'i-tasks',  l:'المهام',    on:['tasks','task','assign','timeline','doc'] },
    { k: L ? 'lreq' : 'requests', i:'i-swap', l:'الطلبات', b:inbox, on:['lreq','requests'] },
    { k:'daily',   i:'i-check',  l:'التحضير',   on:['daily'] },
    { k:'desk', i:'i-ticket', l:'التذاكر والتقارير', b:openTk + openReports(),
      on:['desk','tickets','ticket','report'] },
    { k:'notifs',  i:'i-bell',   l:'الإشعارات', b:unread(), on:['notifs'] },
    { k:'guide',   i:'i-guide',  l:'الدليل',    on:['guide'] },
    { k:'rating',  i:'i-star',   l:'التقييم',   on:['rating','taskrating'] },
    { k:'calendar',i:'i-cal',    l:'التقويم',   on:['calendar'] },
    { k:'album',   i:'i-album',  l:'الصور',     on:['album','photo'] },
    { k:'pilgrims',i:'i-user',   l:'الحجاج',    on:['pilgrims'] }
  ];
  if (L) base.splice(3, 0, { k:'muhsens', i:'i-users', l:'المحسنون', on:['muhsens'] });
  base.push({ k:'more', i:'i-dots', l:'المزيد', on:['more','profile','admin'] });
  return base;
}
const tabPer = () => TABS_SIDE * 2;
const tabPageCount = () => Math.ceil(tabItems().length / tabPer());
function tabPageOf(route) {
  const it = tabItems();
  for (let i = 0; i < it.length; i++) if (it[i].on.indexOf(route) >= 0) return Math.floor(i / tabPer());
  return null;
}

function tabs() {
  const L = isLeader(), r = S.route.n;
  const items = tabItems(), per = tabPer(), pages = tabPageCount();
  const auto = tabPageOf(r);
  if (auto !== null && S._tabAuto !== r) { S.tabPage = auto; S._tabAuto = r; }
  const pg = Math.min(Math.max(S.tabPage || 0, 0), pages - 1);

  const btn = it => {
    if (!it) return '<span class="tspacer"></span>';
    const on = it.on.indexOf(r) >= 0;
    return '<button class="' + (on ? 'on' : '') + '" role="tab"' + (on ? ' aria-selected="true"' : '') +
      ' data-a="go" data-n="' + it.k + '">' +
      '<span class="wi">' + icon(it.i) + (it.b ? '<span class="badge">' + AR(it.b) + '</span>' : '') +
      '</span><span class="tl">' + it.l + '</span></button>';
  };
  const rail = side => {
    let out = '';
    for (let p = 0; p < pages; p++) {
      const base = p * per + (side === 'r' ? 0 : TABS_SIDE);
      let cells = '';
      for (let i = 0; i < TABS_SIDE; i++) cells += btn(items[base + i]);
      out += '<div class="tpage">' + cells + '</div>';
    }
    return '<div class="tside"><div class="trail" style="transform:translateX(' + (pg * 100) + '%)">' +
      out + '</div></div>';
  };
  const homeOn = ['home','mhome'].indexOf(r) >= 0;

  return '<nav class="tabs" role="tablist" aria-label="التنقّل" data-pages="' + pages + '">' +
    (pages > 1 ? '<span class="dots">' + Array.from({ length: pages }, (_, i) =>
      '<button class="' + (i === pg ? 'on' : '') + '" data-a="tabpage" data-v="' + i + '" ' +
      'aria-label="الصفحة ' + AR(i + 1) + '"></button>').join('') + '</span>' : '') +
    rail('r') +
    '<button class="home' + (homeOn ? ' on' : '') + '" role="tab"' + (homeOn ? ' aria-selected="true"' : '') +
      ' data-a="go" data-n="' + (L ? 'home' : 'mhome') + '">' +
      '<span class="wi hb"><i class="mlogo"></i></span>' +
      '<span class="hl">الرئيسية</span></button>' +
    rail('l') +
    '</nav>';
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
function screenLogin() {
  const role = S.loginRole || 'leader';
  const list = S.users.filter(u => u.role === role);
  return '<div class="login"><i class="pat"></i>' +
    '<div class="inner">' +
      '<i class="logo mlockup" role="img" aria-label="مُحسن"></i>' +
      '<div class="cap">تطبيق الميدان — موسم الحج ١٤٤٨ هـ</div>' +
      '<div class="panel">' +
        '<div class="lbl plain" style="margin-bottom:8px">اختر دورك</div>' +
        '<div class="rolebtns">' +
          '<button class="rolebtn ' + (role === 'leader' ? 'on' : '') + '" data-a="role" data-r="leader">' +
            '<span class="ci">' + icon('i-users','s26') + '</span><b>محسن ليدر</b><span>ليدر فريق KT</span></button>' +
          '<button class="rolebtn ' + (role === 'muhsen' ? 'on' : '') + '" data-a="role" data-r="muhsen">' +
            '<span class="ci">' + icon('i-user','s26') + '</span><b>مُحسن</b><span>عضو ميداني</span></button>' +
        '</div>' +
        '<div class="lbl plain" style="margin:14px 0 7px">اختر الحساب<small style="font-weight:400;color:var(--dim2)">' + AR(list.length) + ' حساب متاح للتجربة</small></div>' +
        '<div class="acclist">' + list.map(u => {
          const sub = u.role === 'leader'
            ? u.kt + ' · ' + ORGS.find(o => o.id === u.orgId).ar
            : u.code + ' · ' + u.specialty + ' · فريق ' + userById(u.leaderId).name.split(' ')[0];
          const pc = pendingCountFor(u.id);
          return '<button class="prow" data-a="login" data-id="' + u.id + '">' + avat(u) +
            '<span class="nm sp"><b>' + E(u.name) + '</b><span>' + E(sub) + '</span></span>' +
            (pc ? '<span class="pill no">' + AR(pc) + ' إجراء</span>' : '') +
            icon('i-back','s16') + '</button>';
        }).join('') + '</div>' +
        '<div class="otp">' + ['٤','٨','١','٦'].map(d => '<div>' + d + '</div>').join('') + '</div>' +
        '<div class="tiny dim2 center" style="margin-top:7px">رمز تجريبي — الدخول بالضغط على الحساب</div>' +
      '</div>' +
      '<div class="foot"><i class="mnozoly" role="img" aria-label="نُزلي"></i><div>تطوير نُزلي · نسخة تجريبية</div></div>' +
    '</div></div>';
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
      '«' + notAtt[0].title + '» — التحضير مفتوح منذ بداية اليوم.',
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

function pendingCountFor(uid_) {
  const u = userById(uid_); if (!u) return 0;
  let n = 0;
  if (u.role === 'muhsen') {
    S.tasks.forEach(t => {
      if (['done','cancelled'].includes(t.status)) return;
      t.assigned.forEach(a => {
        if (a.muhsenId !== uid_ || a.removed) return;
        if (a.req === 'pending') n++;
        if (a.req === 'accepted' && !a.attendedAt && now() >= prepOpen(t)) n++;
      });
      if (t.delegate && t.delegate.muhsenId === uid_ && t.delegate.state === 'pending') n++;
    });
    if (S.tickets.some(k => k.assignedTo === uid_ && k.status !== 'مغلقة')) n++;
  } else {
    S.tasks.filter(t => t.leaderId === uid_).forEach(t => {
      if (!lockedForAssign(t) && !acceptedSlots(t).length) n++;
      if (t.status === 'running' && t.autoStarted) n++;
      if (t.status === 'running' && now() > t.end) n++;
    });
    if (S.tickets.some(k => k.leaderId === uid_ && k.status === 'مفتوحة')) n++;
  }
  return n;
}
