/* ============================ أدوات العرض ============================ */
const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const icon = (n, cls) => '<svg class="ic ' + (cls || '') + '"><use href="#' + n + '"/></svg>';
const avat = (u, cls) => '<span class="av ' + (cls || '') + ' ' + u.av + '"><svg viewBox="0 0 44 44"><use href="#av-' + u.g + '"/></svg></span>';
const pill = (t, c) => '<span class="pill ' + c + '">' + E(t) + '</span>';
const IMG = window.IMG;

function toast(text, kind) { S.toast = { text, kind: kind || 'g', at: Date.now() }; }
function go(n, id) { S.route = { n, id }; save(); render(); }
function back() { const r = S.route; go(r.back || (isLeader() ? 'home' : 'mhome')); }

/* شريط علوي */
function bar(title, opt) {
  opt = opt || {};
  return '<div class="top"><div class="sbar"><span>' + t12(now()) + '</span>' +
    '<svg class="ic s16 f" viewBox="0 0 44 16"><rect x="0" y="9" width="3" height="5" rx="1"/><rect x="5" y="6.5" width="3" height="7.5" rx="1"/><rect x="10" y="4" width="3" height="10" rx="1"/><rect x="15" y="1.5" width="3" height="12.5" rx="1"/><path d="M26.5 4.2a8 8 0 019 0l-4.5 6z"/><rect x="38" y="4" width="5.5" height="9" rx="1.6"/></svg></div>' +
    '<div class="nav">' +
      (opt.back ? '<button data-a="back">' + icon('i-back') + '</button>' : '<button data-a="go" data-n="notifs">' + icon('i-bell') + '</button>') +
      '<span class="t">' + E(title) + '</span>' +
      (opt.right || '<button data-a="go" data-n="more">' + icon('i-menu') + '</button>') +
    '</div></div>';
}

/* شريط سفلي — الشعار في المنتصف */
function tabs() {
  const L = isLeader(), r = S.route.n;
  const inbox = S.requests.filter(x => x.to === S.session.id && x.state === "pending").length;
  const items = L
    ? [{ k:"tasks", i:"i-tasks", l:"المهام", on:["tasks","task","assign","timeline","filter"] },
       { k:"lreq", i:"i-swap", l:"الطلبات", b:inbox, on:["lreq","pending"] },
       { k:"muhsens", i:"i-users", l:"المحسنون", on:["muhsens"] },
       { home:1 },
       { k:"notifs", i:"i-bell", l:"الإشعارات", b:unread(), on:["notifs"] },
       { k:"tickets", i:"i-ticket", l:"التذاكر", on:["tickets","ticket"] },
       { k:"reports", i:"i-report", l:"التقارير", on:["reports","report"] },
       { k:"calendar", i:"i-cal", l:"التقويم", on:["calendar"] },
       { k:"pilgrims", i:"i-user", l:"الحجاج", on:["pilgrims"] },
       { k:"more", i:"i-dots", l:"المزيد", on:["more","profile","admin","completed"] }]
    : [{ k:"mytask", i:"i-tasks", l:"مهمتي", on:["mytask","timeline"] },
       { k:"requests", i:"i-swap", l:"الطلبات", b:inbox, on:["requests"] },
       { k:"pilgrims", i:"i-user", l:"الحجاج", on:["pilgrims"] },
       { home:1 },
       { k:"notifs", i:"i-bell", l:"الإشعارات", b:unread(), on:["notifs"] },
       { k:"tickets", i:"i-ticket", l:"التذاكر", on:["tickets","ticket"] },
       { k:"reports", i:"i-report", l:"التقارير", on:["reports","report"] },
       { k:"calendar", i:"i-cal", l:"التقويم", on:["calendar"] },
       { k:"completed", i:"i-checkc", l:"المكتملة", on:["completed"] },
       { k:"more", i:"i-dots", l:"المزيد", on:["more","profile","admin"] }];

  const homeOn = ["home","mhome"].includes(r);
  return '<nav class="tabs" role="tablist" aria-label="التنقّل">' + items.map(function (it) {
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

/* بطاقة الخدمة */
function svcCard(t) {
  return '<div class="c gold"><div class="fl" style="align-items:flex-start">' +
    '<div class="sp"><b style="font-size:15.5px">' + E(t.title) + '</b>' +
      '<div class="sm dim" style="margin-top:3px">' + E(t.desc) + '</div>' +
      '<div class="fl sm dim" style="gap:5px;margin-top:2px">' + icon('i-pin','s14') + '<span>' + E(t.place) + '</span></div>' +
      '<div class="sm dim2">' + E(t.city) + '</div></div>' +
    '<span class="thumb" style="background-image:url(' + IMG[t.photo + '_t'] + ')"></span></div>' +
    '<div class="fl" style="margin-top:11px;justify-content:space-between">' +
      pill(STATUS[t.status].t, STATUS[t.status].c) +
      '<span class="tiny dim2">' + E(orgOf(t).ar) + ' · ' + E(t.kt) + '</span></div></div>';
}
function metaCard(t) {
  return '<div class="meta">' +
    '<div><span class="k">' + icon('i-hash','s14') + 'رقم المهمة</span><b>' + AR(t.code) + '</b></div>' +
    '<div><span class="k">' + icon('i-cal','s14') + 'التاريخ</span><b>' + hijri(t.start) + '<span>' + greg(t.start) + '</span></b></div>' +
    '<div><span class="k">' + icon('i-clock','s14') + 'الوقت</span><b>' + t12(t.start) + '<span>إلى ' + t12(t.end) + '</span></b></div>' +
    '<div><span class="k">' + icon('i-hour','s14') + 'المدة</span><b>' + AR(t.durH) + ' ساعات</b></div></div>';
}

/* خريطة */
function mapBox(t, showMe) {
  const at = S.myPlace, inside = at === 'site';
  const mx = inside ? 50 : 20, my = inside ? 50 : 26;
  return '<div class="map"><svg viewBox="0 0 360 170" preserveAspectRatio="none">' +
    '<rect width="360" height="170" fill="#ECEFE8"/>' +
    '<g stroke="#DEE3D8" stroke-width="11" fill="none"><path d="M-10 44H370"/><path d="M-10 124H370"/><path d="M92-10V180"/><path d="M258-10V180"/></g>' +
    '<g fill="#E3E7DD"><rect x="106" y="58" width="66" height="42" rx="5"/><rect x="272" y="56" width="60" height="48" rx="5"/><rect x="18" y="58" width="60" height="42" rx="5"/><rect x="106" y="134" width="66" height="30" rx="5"/></g>' +
    (showMe && !inside ? '<path d="M72 44L176 78" stroke="#C0392B" stroke-width="2" stroke-dasharray="6 6" fill="none"/>' : '') +
    '</svg>' +
    '<span class="ring' + (showMe && !inside ? ' bad' : '') + '"></span>' +
    '<span class="dot"></span>' +
    (showMe ? '<span class="dot me' + (inside ? '' : ' bad') + '" style="inset-block-start:' + my + '%;inset-inline-start:' + mx + '%"></span>' : '') +
    '<span class="scale">النطاق ٢ كم</span>' +
    (showMe ? '<span class="legend">' + (inside ? 'داخل النطاق' : 'خارج النطاق') + '</span>' : '') +
    '</div>';
}

/* ورقة منبثقة */
function sheet(html) { S.sheet = html; render(); }
function closeSheet() { S.sheet = null; render(); }

/* ============================ تسجيل الدخول ============================ */
function screenLogin() {
  const role = S.loginRole || 'leader';
  const list = S.users.filter(u => u.role === role);
  return '<div class="login"><img class="pat" src="' + IMG.logo_pattern + '" alt="">' +
    '<div class="inner">' +
      '<img class="logo" src="' + IMG.logo_lockup + '" alt="مُحسن">' +
      '<div class="cap">تطبيق الميدان — موسم الحج ١٤٤٨ هـ</div>' +
      '<div class="panel">' +
        '<div class="lbl plain" style="margin-bottom:10px">اختر دورك</div>' +
        '<div class="rolebtns">' +
          '<button class="rolebtn ' + (role === 'leader' ? 'on' : '') + '" data-a="role" data-r="leader">' +
            '<span class="ci">' + icon('i-users','s26') + '</span><b>محسن ليدر</b><span>قائد فريق KT</span></button>' +
          '<button class="rolebtn ' + (role === 'muhsen' ? 'on' : '') + '" data-a="role" data-r="muhsen">' +
            '<span class="ci">' + icon('i-user','s26') + '</span><b>مُحسن</b><span>عضو ميداني</span></button>' +
        '</div>' +
        '<div class="lbl plain" style="margin:18px 0 9px">اختر الحساب<small style="font-weight:400;color:var(--dim2)">' + AR(list.length) + ' حساب متاح للتجربة</small></div>' +
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
        '<div class="lbl plain" style="margin:16px 0 8px">رمز التحقق</div>' +
        '<div class="otp"><div>٤</div><div>٨</div><div>١</div><div>٦</div></div>' +
        '<div class="tiny dim2 center" style="margin-top:9px">رمز تجريبي — الدخول بالضغط على الحساب</div>' +
      '</div>' +
      '<div class="foot"><img src="' + IMG.nozoly + '" alt="نُزلي"><div>تطوير نُزلي · نسخة تجريبية ٠.٦</div></div>' +
    '</div></div>';
}

/* ============================ رئيسية الليدر ============================ */
function screenLeaderHome() {
  const u = me(), org = ORGS.find(o => o.id === u.orgId), ts = myTasks();
  const upcoming = ts.filter(t => !['done','cancelled'].includes(t.status)).slice(0, 3);
  const open = S.tickets.filter(k => k.leaderId === u.id && k.status !== 'مغلقة').length;
  const pend = ts.filter(t => t.status === 'pending_assign' && t.start > now()).length;
  return bar('مُحسن ليدر', { right: '<button data-a="go" data-n="profile" style="width:34px;height:34px">' + avat(u, 'sm') + '</button>' }) +
    '<div class="view">' + ground() +
    '<div class="c gold"><div class="fl">' + avat(u, 'lg') +
      '<div class="sp"><div class="row"><b style="font-size:16px">' + E(u.name) + '</b>' + pill(u.kt, 'gold') + '</div>' +
      '<div class="sm dim">' + E(org.ar) + ' · ' + E(org.country) + '</div></div></div></div>' +

    '<div class="banner" style="background-image:url(' + IMG.haram_w + ')"><span class="bt">' +
      '<b>' + E(dayName(now())) + ' · ' + hijri(now()) + '</b><span>' + AR(ts.filter(t=>new Date(t.start).toDateString()===new Date(now()).toDateString()).length) + ' مهمة اليوم</span></span></div>' +

    '<div class="grid3">' +
      '<div class="kpi"><b>' + AR(u.pilgrims) + '</b><span>حاج</span></div>' +
      '<div class="kpi"><b>' + AR(teamOf(u.id).length) + '</b><span>محسن</span></div>' +
      '<div class="kpi"><b>' + AR(u.groups) + '</b><span>مجموعة</span></div></div>' +

    (function () {
      const risky = ts.filter(t => urgency(t)).sort((a, b) => a.start - b.start);
      if (!risky.length) return '';
      const t = risky[0], g = urgency(t);
      return '<button class="note ' + (g.c === 'r' ? 'r' : 'a') + '" data-a="go" data-n="assign" data-id="' + t.id + '" style="width:100%">' +
        icon(g.i, 's18') + '<span class="sp" style="text-align:right"><b>' + E(t.title) + '</b><br>' + E(g.txt) +
        (risky.length > 1 ? '<br><span style="opacity:.8">و' + AR(risky.length - 1) + ' مهمة أخرى تحتاج تسكينًا</span>' : '') +
        '</span>' + icon('i-back','s16') + '</button>';
    })() +

    '<div class="lbl">المهام القادمة</div>' +
    (upcoming.length ? upcoming.map(t => taskRow(t)).join('') : '<div class="c center dim sm">لا توجد مهام قادمة</div>') +

    '<button class="listitem" data-a="go" data-n="tickets">' +
      '<span class="ico" style="background:#FBF1DE;color:#7F5310">' + icon('i-ticket','s18') + '</span>' +
      '<span class="sp"><b style="font-size:13.5px;display:block">' + AR(open) + ' تذكرة مفتوحة</b>' +
      '<span class="tiny dim2">من الحجاج والكونترول</span></span>' + icon('i-back','s16') + '</button>' +
    '</div>' + tabs();
}

/* درجة الإلحاح: كم بقي على المهمة وهل اكتمل تسكينها */
function urgency(t) {
  if (['done', 'cancelled', 'running'].includes(t.status)) return null;
  const left = t.start - now();
  const ok = t.groups.filter(g => g.req === 'accepted').length;
  const empty = t.groups.filter(g => !g.muhsenId).length;
  const pend = t.groups.filter(g => g.req === 'pending').length;
  if (ok === t.groups.length) return null;
  if (left < 0) return { k: 'urgent', c: 'r', i: 'i-warn', txt: 'بدأ وقتها والتسكين ناقص — ' + AR(t.groups.length - ok) + ' مجموعة' };
  if (left < 3 * HR) return { k: 'urgent', c: 'r', i: 'i-warn',
    txt: 'تبدأ ' + untilTxt(t.start) + ' و' + (empty ? AR(empty) + ' مجموعة بلا محسن' : AR(pend) + ' طلب بلا رد') };
  if (left < 12 * HR) return { k: 'soon', c: 'a', i: 'i-clock',
    txt: 'تبدأ ' + untilTxt(t.start) + ' — أكمل التسكين' };
  return null;
}

function taskRow(t) {
  recomputeStatus(t);
  const ok = t.groups.filter(g => g.req === 'accepted').length;
  const st = STATUS[t.status];
  const u = urgency(t);
  const doneSubs = t.subs.filter(s => s.done).length;
  return '<button class="c ' + (u ? u.k : '') + '" data-a="go" data-n="task" data-id="' + t.id + '" style="width:100%;text-align:right">' +
    '<div class="fl" style="align-items:flex-start;gap:11px">' +
      '<span class="thumb" style="width:72px;height:72px;background-image:url(' + IMG[t.photo + '_t'] + ')"></span>' +
      '<div class="sp">' +
        '<div class="fl" style="align-items:flex-start;gap:8px"><b style="font-size:14.5px;line-height:1.5" class="sp">' + E(t.title) + '</b>' + pill(st.t, st.c) + '</div>' +
        '<div class="tiny dim" style="margin-top:4px">' + hijri(t.start) + ' · ' + t12(t.start) + '</div>' +
        '<div class="tiny dim2 trunc">' + E(t.place) + '</div>' +
        '<div class="fl" style="gap:6px;margin-top:7px">' +
          pill(AR(t.subs.length) + ' مهمة فرعية', 'grey') +
          pill(AR(t.groups.length) + ' مجموعة', 'gold') +
          (t.status === 'running' ? pill(AR(doneSubs) + '/' + AR(t.subs.length) + ' منجزة', 'live') : '') +
        '</div>' +
      '</div></div>' +
    '<div class="meter" style="margin-top:11px"><i style="width:' + Math.round(ok / t.groups.length * 100) + '%"></i></div>' +
    '<div class="row tiny dim" style="margin-top:6px"><span>التسكين ' + AR(ok) + ' من ' + AR(t.groups.length) + '</span>' +
    '<span>' + untilTxt(t.start) + '</span></div>' +
    (u ? '<div class="strip ' + u.c + '">' + icon(u.i, 's16') + '<span>' + E(u.txt) + '</span></div>' : '') +
    '</button>';
}

/* ============================ قائمة مهام الليدر ============================ */
function screenTasks() {
  const seg = S.tab.tasks || 'cur';
  const all = myTasks();
  const list = seg === 'cur' ? all.filter(t => !['done','cancelled'].includes(t.status))
    : seg === 'done' ? all.filter(t => ['done','cancelled'].includes(t.status)) : all;
  return bar('المهام', { right: '<button data-a="go" data-n="calendar">' + icon('i-cal') + '</button>' }) +
    '<div class="view">' + ground() +
    '<div class="seg">' +
      '<button class="' + (seg==='cur'?'on':'') + '" data-a="seg" data-k="tasks" data-v="cur">الحالية</button>' +
      '<button class="' + (seg==='done'?'on':'') + '" data-a="seg" data-k="tasks" data-v="done">المكتملة</button>' +
      '<button class="' + (seg==='all'?'on':'') + '" data-a="seg" data-k="tasks" data-v="all">الكل</button></div>' +
    (list.length ? list.map(t => taskRow(t)).join('') : '<div class="c center dim sm">لا توجد مهام هنا</div>') +
    '</div>' + tabs();
}

/* ============================ تنبيهات ثابتة أعلى كل صفحة ============================ */
function alertsHTML() {
  if (!S.session) return '';
  const u = me(); if (!u) return '';
  const out = [];
  const box = (cls, ic, title, body, act) =>
    '<button class="alert ' + cls + '" ' + (act || '') + '>' + icon(ic, 's26') +
      '<span class="sp"><b>' + E(title) + '</b><span>' + E(body) + '</span></span>' +
      icon('i-back', 's16') + '</button>';

  if (u.role === 'muhsen') {
    /* تأخر عن التحضير — يبقى ثابتًا ما دام على المهمة */
    myTasks().filter(t => !['done', 'cancelled'].includes(t.status)).forEach(t => {
      const g = t.groups.find(x => x.muhsenId === u.id && x.req === 'accepted');
      if (!g || g.attendedAt) return;
      if (now() >= prepDeadline(t))
        out.push(box('bad', 'i-warn', 'تأخرت عن إثبات الحضور',
          '«' + t.title + '» — انتهت مهلة التحضير ' + t12(prepDeadline(t)) + ' وأُبلغ القائد والكونترول. أثبت حضورك الآن.',
          'data-a="go" data-n="mhome"'));
      else if (now() >= prepOpen(t)) {
        const r = hms(prepDeadline(t) - now());
        out.push(box('warn', 'i-clock', 'أثبت حضورك',
          '«' + t.title + '» — تبقّى ' + AR(r.h) + ':' + AR(r.m) + ':' + AR(r.s) + ' على انتهاء مهلة التحضير.',
          'data-a="go" data-n="mhome"'));
      }
    });
    const rq = myRequests().length;
    if (rq) out.push(box('warn', 'i-bell', 'لديك ' + AR(rq) + ' طلب بانتظار ردك',
      'تسكين أو استبدال أو تفويض — لا تبدأ المهمة قبل ردك.', 'data-a="go" data-n="requests"'));
  } else {
    const ts = myTasks().filter(t => !['done', 'cancelled'].includes(t.status));
    const lateStart = ts.filter(t => now() >= t.start && t.status !== 'running');
    if (lateStart.length) out.push(box('bad', 'i-warn', 'مهمة متأخرة عن البداية',
      lateStart[0].title + (lateStart[0].groups.some(g => !g.muhsenId) ? ' — السبب: عدم تسكين محسنين' : ' — لم تُبدأ بعد'),
      'data-a="go" data-n="task" data-id="' + lateStart[0].id + '"'));
    const pend = [];
    ts.forEach(t => t.groups.forEach(g => { if (g.req === 'pending' && t.start - now() < 3 * HR) pend.push({ t, g }); }));
    if (pend.length) out.push(box('warn', 'i-swap', AR(pend.length) + ' طلب بلا رد قبل موعد المهمة',
      'تواصل مع المحسن أو اسحب الطلب وأسنده لغيره.', 'data-a="go" data-n="lreq"'));
    const notAtt = ts.filter(t => inPrep(t) && !t.leaderAttendedAt);
    if (notAtt.length) out.push(box('warn', 'i-target', 'أثبت حضورك',
      '«' + notAtt[0].title + '» — لا تبدأ المهمة قبل حضورك وحضور المحسنين.',
      'data-a="go" data-n="task" data-id="' + notAtt[0].id + '"'));
  }
  return out.length ? '<div class="alerts">' + out.join('') + '</div>' : '';
}

/* من لديه إجراء ينتظره — يظهر في قائمة الحسابات */
function pendingCountFor(uid_) {
  const u = userById(uid_); if (!u) return 0;
  let n = 0;
  if (u.role === 'muhsen') {
    S.tasks.forEach(t => {
      if (['done', 'cancelled'].includes(t.status)) return;
      t.groups.forEach(g => {
        if (g.muhsenId === uid_ && g.req === 'pending') n++;
        if (g.muhsenId === uid_ && g.swap && g.swap.state === 'pending') n++;
        if (g.muhsenId === uid_ && g.req === 'accepted' && !g.attendedAt && now() >= prepOpen(t)) n++;
      });
      if (t.delegate && t.delegate.muhsenId === uid_ && t.delegate.state === 'pending') n++;
    });
  } else {
    S.tasks.filter(t => t.leaderId === uid_ && !['done', 'cancelled'].includes(t.status)).forEach(t => {
      if (t.groups.some(g => !g.muhsenId) && t.start - now() < 12 * HR) n++;
      if (t.status === 'ready') n++;
      if (now() >= t.start && t.status !== 'running') n++;
    });
    n += S.tickets.filter(k => k.leaderId === uid_ && k.status === 'مفتوحة').length ? 1 : 0;
  }
  return n;
}
