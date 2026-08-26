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
  return out + '<b>' + E(String(v).replace(/\.0$/, '')) + '</b></span>';
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

/* شريط سفلي — شريط واحد قابل للسحب */
function tabs() {
  const L = isLeader(), r = S.route.n;
  const inbox = S.requests.filter(x => x.to === S.session.id && x.state === 'pending').length;
  const openTk = myTickets().filter(k => k.status !== 'مغلقة').length;
  const items = L
    ? [{ k:'tasks', i:'i-tasks', l:'المهام', on:['tasks','task','assign','timeline'] },
       { k:'lreq', i:'i-swap', l:'الطلبات', b:inbox, on:['lreq'] },
       { k:'muhsens', i:'i-users', l:'المحسنون', on:['muhsens'] },
       { home:1 },
       { k:'rating', i:'i-star', l:'التقييم', on:['rating','taskrating'] },
       { k:'tickets', i:'i-ticket', l:'التذاكر', b:openTk, on:['tickets','ticket'] },
       { k:'notifs', i:'i-bell', l:'الإشعارات', b:unread(), on:['notifs'] },
       { k:'calendar', i:'i-cal', l:'التقويم', on:['calendar'] },
       { k:'pilgrims', i:'i-user', l:'الحجاج', on:['pilgrims'] },
       { k:'more', i:'i-dots', l:'المزيد', on:['more','profile','admin'] }]
    : [{ k:'tasks', i:'i-tasks', l:'المهام', on:['tasks','mytask','task'] },
       { k:'requests', i:'i-swap', l:'الطلبات', b:inbox, on:['requests'] },
       { k:'pilgrims', i:'i-user', l:'الحجاج', on:['pilgrims'] },
       { home:1 },
       { k:'rating', i:'i-star', l:'التقييم', on:['rating','taskrating'] },
       { k:'tickets', i:'i-ticket', l:'التذاكر', b:openTk, on:['tickets','ticket'] },
       { k:'notifs', i:'i-bell', l:'الإشعارات', b:unread(), on:['notifs'] },
       { k:'calendar', i:'i-cal', l:'التقويم', on:['calendar'] },
       { k:'more', i:'i-dots', l:'المزيد', on:['more','profile','admin'] }];

  const homeOn = ['home','mhome'].includes(r);
  return '<nav class="tabs" role="tablist" aria-label="التنقّل">' + items.map(it => {
    if (it.home) return '<button class="home' + (homeOn ? ' on' : '') + '" role="tab"' +
      (homeOn ? ' aria-selected="true"' : '') + ' data-a="go" data-n="' + (L ? 'home' : 'mhome') + '">' +
      '<span class="wi hb"><img src="' + IMG.logo_white + '" alt="" style="width:24px"></span>الرئيسية</button>';
    const on = it.on.includes(r);
    return '<button class="' + (on ? 'on' : '') + '" role="tab"' + (on ? ' aria-selected="true"' : '') +
      ' data-a="go" data-n="' + it.k + '">' +
      '<span class="wi">' + icon(it.i) + (it.b ? '<span class="badge">' + AR(it.b) + '</span>' : '') +
      '</span>' + it.l + '</button>';
  }).join('') + '</nav>';
}

const ground = () => '<div class="ground"><img src="' + IMG.logo_pattern + '" alt=""></div>';

/* ============================ مكوّنات مشتركة ============================ */
function svcCard(t) {
  const st = STATUS[t.status];
  return '<div class="c gold"><div class="fl" style="align-items:flex-start">' +
    '<div class="sp"><b style="font-size:15.5px;line-height:1.5">' + E(t.title) + '</b>' +
      '<div class="sm dim" style="margin-top:3px">' + E(t.desc) + '</div>' +
      '<div class="fl sm dim" style="gap:5px;margin-top:3px">' + icon('i-pin','s14') + '<span>' + E(t.place) + '</span></div>' +
      '<div class="sm dim2">' + E(t.city) + '</div></div>' +
    '<span class="thumb" style="background-image:url(' + IMG[t.photo + '_t'] + ')"></span></div>' +
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
  if (acc >= MIN_ASSIGN) return null;
  if (left < 0) return null;
  if (left < 3 * HR) return { k:'urgent', c:'r', i:'i-warn',
    txt:'تبدأ ' + untilTxt(t.start) + ' — التسكين ناقص (' + AR(acc) + ' من ' + AR(MIN_ASSIGN) + ')' };
  if (left < 24 * HR) return { k:'soon', c:'a', i:'i-clock',
    txt:'تبدأ ' + untilTxt(t.start) + ' — أكمل التسكين' };
  return { k:'', c:'a', i:'i-clock', txt:'بحاجة إلى تسكين — ' + AR(acc) + ' من ' + AR(MIN_ASSIGN) };
}

function taskRow(t) {
  recomputeStatus(t);
  const acc = acceptedSlots(t).length, st = STATUS[t.status], u = urgency(t);
  const bucket = taskBucket(t, S.session.id);
  const doneSubs = t.subs.filter(s => s.done).length;
  const hideDetail = !isLeader() && bucket === 'undone';
  return '<button class="c ' + (u ? u.k : '') + '" data-a="go" data-n="task" data-id="' + t.id + '" style="width:100%;text-align:right">' +
    '<div class="fl" style="align-items:flex-start;gap:11px">' +
      '<span class="thumb" style="width:70px;height:70px;background-image:url(' + IMG[t.photo + '_t'] + ')"></span>' +
      '<div class="sp">' +
        '<div class="fl" style="align-items:flex-start;gap:8px"><b style="font-size:14.5px;line-height:1.5" class="sp">' + E(t.title) + '</b>' +
          pill(bucket === 'undone' ? 'غير منجزة' : st.t, bucket === 'undone' ? 'no' : st.c) + '</div>' +
        '<div class="tiny dim" style="margin-top:4px">' + hijri(t.start) + ' · ' + t12(t.start) + '</div>' +
        '<div class="tiny dim2">' + E(t.place) + '</div>' +
        (hideDetail ? '' :
        '<div class="fl" style="gap:6px;margin-top:7px;flex-wrap:wrap">' +
          pill(AR(t.subs.length) + ' مهمة فرعية', 'grey') +
          pill(AR(acc) + ' محسن', acc >= MIN_ASSIGN ? 'live' : 'wait') +
          (t.status === 'running' ? pill(AR(doneSubs) + ' من ' + AR(t.subs.length) + ' منجزة', 'live') : '') +
          (t.rating ? pill('★ ' + avgRating(t.rating), 'gold') : '') + '</div>') +
      '</div></div>' +
    (hideDetail
      ? '<div class="strip r" style="margin-top:10px">' + icon('i-info','s16') + '<span>' + E(undoneReason(t, S.session.id)) + '</span></div>'
      : (u ? '<div class="strip ' + u.c + '">' + icon(u.i,'s16') + '<span>' + E(u.txt) + '</span></div>' : '')) +
    '</button>';
}

/* ============================ تسجيل الدخول ============================ */
function screenLogin() {
  const role = S.loginRole || 'leader';
  const list = S.users.filter(u => u.role === role);
  return '<div class="login"><img class="pat" src="' + IMG.logo_pattern + '" alt="">' +
    '<div class="inner">' +
      '<img class="logo" src="' + IMG.logo_lockup + '" alt="مُحسن">' +
      '<div class="cap">تطبيق الميدان — موسم الحج ١٤٤٨ هـ</div>' +
      '<div class="panel">' +
        '<div class="lbl plain" style="margin-bottom:8px">اختر دورك</div>' +
        '<div class="rolebtns">' +
          '<button class="rolebtn ' + (role === 'leader' ? 'on' : '') + '" data-a="role" data-r="leader">' +
            '<span class="ci">' + icon('i-users','s26') + '</span><b>محسن ليدر</b><span>قائد فريق KT</span></button>' +
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
      '<div class="foot"><img src="' + IMG.nozoly + '" alt="نُزلي"><div>تطوير نُزلي · نسخة تجريبية</div></div>' +
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
  return out.length ? '<div class="alerts">' + out.join('') + '</div>' : '';
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
      if (!lockedForAssign(t) && acceptedSlots(t).length < MIN_ASSIGN) n++;
      if (t.status === 'running' && t.autoStarted) n++;
      if (t.status === 'running' && now() > t.end) n++;
    });
    if (S.tickets.some(k => k.leaderId === uid_ && k.status === 'مفتوحة')) n++;
  }
  return n;
}
