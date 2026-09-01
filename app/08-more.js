/* ============================ التذاكر (تشمل ما كان يُسمّى تقارير) ============================ */
const PRI_C = { 'عاجلة':'no', 'متوسطة':'wait', 'عادية':'grey' };
const ST_C  = { 'مفتوحة':'wait', 'مُسندة':'blue', 'قيد المعالجة':'blue', 'مُصعّدة':'no', 'مغلقة':'live' };
const SRC_LBL = { 'حاج':'من حاج', 'كنترول':'من الكنترول', 'محسن':'من محسن', 'ليدر':'من الليدر' };

function ticketsPane() {
  const L = isLeader();
  const f = S.tab.tk || 'open';
  let list = myTickets();
  if (f === 'open') list = list.filter(k => k.status !== 'مغلقة');
  else if (f === 'closed') list = list.filter(k => k.status === 'مغلقة');
  else if (f === 'mine') list = list.filter(k => k.assignedTo === S.session.id);
  else if (f === 'hajj') list = list.filter(k => k.src === 'حاج');
  else if (f === 'ctrl') list = list.filter(k => k.src === 'كنترول');
  else if (f === 'muh') list = list.filter(k => k.src === 'محسن');

  const segs = L ? [['open','المفتوحة'],['hajj','الحجاج'],['ctrl','الكنترول'],['muh','المحسنون'],['closed','المغلقة']]
                 : [['open','المفتوحة'],['mine','المسندة إليّ'],['closed','المغلقة']];

  return '<button class="btn p" data-a="newticket">' + icon('i-plus','s16') +
      (L || !me().leaderId ? 'رفع تذكرة إلى الكنترول' : 'رفع تذكرة إلى الليدر') + '</button>' +
    '<div class="seg">' + segs.map(x =>
      '<button class="' + (f === x[0] ? 'on' : '') + '" data-a="seg" data-k="tk" data-v="' + x[0] + '">' +
      x[1] + '</button>').join('') + '</div>' +
    (list.length ? list.map(k => ticketRow(k)).join('')
      : '<div class="c center" style="padding:26px"><b>لا توجد تذاكر في هذا التصنيف</b></div>');
}

/* التوافق: من يفتح «التذاكر» مباشرة يصل الشاشة المدمجة على تبويبها */
function screenTickets() { S.tab.desk = 'tk'; return screenDesk(); }


function ticketRow(k) {
  const t = k.taskId ? taskById(k.taskId) : null;
  return '<button class="c" data-a="go" data-n="ticket" data-id="' + k.id + '" style="width:100%;text-align:right">' +
    '<div class="fl" style="align-items:flex-start;gap:8px"><b style="font-size:14px;line-height:1.5" class="sp">' + E(k.title) + '</b>' +
      pill(k.pri, PRI_C[k.pri]) + '</div>' +
    '<div class="fl" style="margin:9px 0 6px">' +
      (k.fromAv ? '<span class="av sm ' + k.fromAv + '"><svg viewBox="0 0 44 44"><use href="#av-' + k.fromG + '"/></svg></span>'
        : '<span class="ico" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:#EFF4F0;color:var(--g)">' + icon('i-shield','s16') + '</span>') +
      '<span class="sp"><b class="tiny" style="display:block">' + E(k.from) + '</b>' +
      '<span class="tiny dim2">' + E(k.no) + ' · ' + (SRC_LBL[k.src] || '') + ' · ' + ago(k.at) + '</span></span>' +
      pill(k.status, ST_C[k.status] || 'grey') + '</div>' +
    '<div class="fl" style="gap:6px;flex-wrap:wrap">' + pill(k.cat, 'gold') +
      (t ? pill(t.title, 'blue') : '') +
      (k.assignedTo ? pill('لدى ' + userById(k.assignedTo).name.split(' ')[0], 'live') : '') +
      (k.replies.length ? pill(AR(k.replies.length) + ' رد', 'grey') : '') + '</div></button>';
}

function screenTicket() {
  const k = S.tickets.find(x => x.id === S.route.id); if (!k) return screenTickets();
  const L = isLeader(), t = k.taskId ? taskById(k.taskId) : null;
  const closed = k.status === 'مغلقة';
  return bar('تذكرة ' + AR(k.no), { back: 1 }) + '<div class="view">' + ground() +
    '<div class="c gold"><div class="fl" style="align-items:flex-start;gap:8px">' +
      '<b style="font-size:15px;line-height:1.5" class="sp">' + E(k.title) + '</b>' + pill(k.pri, PRI_C[k.pri]) + '</div>' +
      '<div class="fl" style="margin:11px 0">' +
        (k.fromAv ? '<span class="av ' + k.fromAv + '"><svg viewBox="0 0 44 44"><use href="#av-' + k.fromG + '"/></svg></span>'
          : '<span class="ico" style="width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:#EFF4F0;color:var(--g)">' + icon('i-shield','s18') + '</span>') +
        '<span class="sp"><b class="sm" style="display:block">' + E(k.from) + '</b>' +
        '<span class="tiny dim2">' + (SRC_LBL[k.src] || '') + ' · ' + ago(k.at) + '</span></span>' +
        pill(k.status, ST_C[k.status] || 'grey') + '</div>' +
      '<div class="sm" style="background:#F8F6F0;border-radius:13px;padding:12px">' + E(k.body) + '</div>' +
      '<div class="fl" style="gap:6px;margin-top:9px;flex-wrap:wrap">' + pill(k.cat, 'gold') +
        (t ? pill(t.title, 'blue') : '') + '</div>' +
      (t ? '<button class="btn l sm" style="margin-top:10px" data-a="go" data-n="task" data-id="' + t.id + '">' +
        icon('i-tasks','s16') + 'فتح المهمة</button>' : '') + '</div>' +

    ((isLeader() || photosFor(null, null, k.id).length) ?
      '<div class="lbl">صور التذكرة</div><div class="c">' +
        photoStrip({ taskId: k.taskId || null, subId: null, ticketId: k.id }, '') + '</div>' : '') +
    (k.assignedTo ? '<div class="prow">' + avat(userById(k.assignedTo)) +
      '<span class="nm sp"><b>' + E(userById(k.assignedTo).name) + '</b><span>المسؤول عن التذكرة</span></span>' +
      pill('مُسندة','blue') + '</div>' : '') +

    (k.replies.length ? '<div class="lbl">المتابعة</div>' + k.replies.map(r =>
      '<div class="c" style="' + (r.sys ? 'background:#F4F6F3' : '') + '">' +
        '<div class="fl" style="gap:8px;margin-bottom:6px">' +
        (r.sys ? icon('i-info','s16') : avat(userById(r.by), 'sm')) +
        '<b class="tiny">' + E(r.sys ? 'النظام' : (userById(r.by) || {name:''}).name) + '</b>' +
        '<span class="tiny dim2 sp" style="text-align:left">' + ago(r.at) + '</span></div>' +
        '<div class="sm">' + E(r.text) + '</div></div>').join('') : '') +

    (!closed ? '<div class="lbl">إجراء</div>' +
      '<button class="btn p" data-a="kreply" data-id="' + k.id + '">' + icon('i-send','s16') + 'كتابة رد</button>' +
      (L ? '<div class="grid2">' +
            '<button class="btn l sm" data-a="kassign" data-id="' + k.id + '">' + icon('i-assign','s16') + 'إسناد لمحسن</button>' +
            '<button class="btn l sm" data-a="kstate" data-id="' + k.id + '">' + icon('i-list','s16') + 'تغيير الحالة</button></div>'
        : '<div class="grid2">' +
            '<button class="btn l sm" data-a="kesc" data-id="' + k.id + '">' + icon('i-warn','s16') + 'تصعيد للّيدر</button>' +
            '<button class="btn l sm" data-a="kstate" data-id="' + k.id + '">' + icon('i-list','s16') + 'تغيير الحالة</button></div>') +
      '<button class="btn g" data-a="kclose" data-id="' + k.id + '">' + icon('i-checkc','s16') + 'إغلاق التذكرة</button>'
      : '<div class="note g">' + icon('i-checkc','s16') + '<span>التذكرة مغلقة.</span></div>' +
        '<button class="btn l" data-a="kreopen" data-id="' + k.id + '">إعادة فتح</button>') +
    '</div>' + tabs();
}

/* ============================ التقييم ============================ */
function screenRating() {
  const u = me(), L = isLeader();
  const seg = S.tab.rt || 'mine';
  const rt = personRating(u.id);
  const rated = myTasks().filter(t => t.rating).sort((a, b) => b.rating.at - a.rating.at);

  let body = '';
  if (seg === 'mine') {
    body = '<div class="score"><span class="tiny dim2">تقييمك التراكمي</span>' +
      '<b>' + AR(String(rt.avg || 0).replace(/\.0$/, '')) + '</b>' +
      '<div class="bigstars">' + stars(rt.avg || 0, 'lg') + '</div>' +
      '<span class="tiny dim">من ' + AR(rt.n) + ' مهمة مقيَّمة</span></div>' +
      '<div class="note b">' + icon('i-info','s16') +
        '<span>التقييم متوسط عام لكل مهمة — يُحتسب من الالتزام بالأوقات وإنجاز المهام ورضا المستفيدين.</span></div>' +
      '<div class="lbl">تقييم كل مهمة</div>' +
      (rated.length ? rated.map(t => ratingRow(t)).join('')
        : '<div class="c center dim sm" style="padding:24px">لا توجد مهام مقيَّمة بعد</div>');
  } else {
    const people = L ? teamOf(u.id) : S.users.filter(x => x.leaderId === u.leaderId && x.id !== u.id);
    const rows = people.map(p => ({ p, r: personRating(p.id) })).sort((a, b) => b.r.avg - a.r.avg);
    body = '<div class="lbl">' + (L ? 'ترتيب فريقك' : 'زملاؤك في الفريق') + '<small>حسب المتوسط التراكمي</small></div>' +
      rows.map((x, i) => '<button class="c" data-a="go" data-n="profile" data-id="' + x.p.id + '" style="width:100%;text-align:right">' +
        '<div class="fl">' +
          '<span class="rank' + (i === 0 ? ' top' : '') + '">' + AR(i + 1) + '</span>' + avat(x.p) +
          '<span class="nm sp"><b>' + E(x.p.name) + '</b><span>' + E(x.p.specialty) + ' · ' + AR(x.r.n) + ' مهمة</span></span>' +
          (x.r.n ? stars(x.r.avg) : pill('بلا تقييم', 'grey')) + '</div></button>').join('');
  }

  return bar('التقييم') + '<div class="view">' + ground() +
    '<div class="seg">' +
      '<button class="' + (seg === 'mine' ? 'on' : '') + '" data-a="seg" data-k="rt" data-v="mine">تقييمي</button>' +
      '<button class="' + (seg === 'team' ? 'on' : '') + '" data-a="seg" data-k="rt" data-v="team">' + (L ? 'الفريق' : 'الزملاء') + '</button>' +
    '</div>' + body + '</div>' + tabs();
}

function ratingRow(t) {
  const v = avgRating(t.rating), ui = kindUI(t);
  return '<button class="c" data-a="go" data-n="taskrating" data-id="' + t.id +
    '" style="width:100%;text-align:right;--kc:' + ui.c + '">' +
    '<div class="fl" style="align-items:center;gap:10px">' +
      '<span class="tthumb bg-' + t.photo + '" style="width:52px;height:52px;border-radius:15px">' +
        '<span class="kb">' + icon(ui.i, 's14') + '</span></span>' +
      '<span class="sp"><b class="sm" style="display:block;line-height:1.5">' + E(t.title) + '</b>' +
      '<span class="tiny dim2">' + hijri(t.start) + '</span>' +
      '<span class="fl" style="margin-top:5px">' + stars(v, 'lg') + '</span></span>' +
      icon('i-back', 's16') + '</div></button>';
}


function screenTaskRating() {
  const t = taskById(S.route.id); if (!t || !t.rating) return screenRating();
  const v = avgRating(t.rating);
  return bar('تقييم المهمة', { back: 1 }) + '<div class="view">' + ground() + svcCard(t) +
    '<div class="score"><span class="tiny dim2">تقييم هذه المهمة</span>' +
      '<b>' + AR(String(v).replace(/\.0$/, '')) + '</b>' +
      '<div class="bigstars">' + stars(v, 'lg') + '</div>' +
      '<span class="tiny dim">متوسط عام · ' + hijri(t.rating.at) + '</span></div>' +
    (t.notes.length && isLeader() ? '<div class="lbl">ملاحظات أثّرت في التقييم</div>' +
      t.notes.map(n => '<div class="note a">' + icon('i-info','s16') + '<span>' + E(n.text) + '</span></div>').join('') : '') +
    '<button class="btn g" data-a="go" data-n="task" data-id="' + t.id + '">' +
      icon('i-tasks','s16') + 'العودة إلى المهمة</button>' +
    '</div>' + tabs();
}

/* ============================ الإشعارات ============================ */
/* تصنيف الإشعار: يحدّد لونه وأيقونته ووسمه */
const NKIND = [
  { k:'bad',   c:'#C0392B', i:'i-warn',   t:'يحتاج إجراءً',
    re:/تأخر|تأخرت|تخلّف|رفض|رُفض|أُزلت|أُلغيت|بدأها النظام|تجاوزت|خارج النطاق/ },
  { k:'ask',   c:'#B8791A', i:'i-assign', t:'بانتظار ردّك',
    re:/طلب|تسكين|تفويض|إسناد|تبديل|بلا رد|تحتاج|راجع/ },
  { k:'ok',    c:'#0B8A4B', i:'i-checkc', t:'تمّ',
    re:/قبول|قبِل|اعتُمد|اكتمل|أثبت|حضّر|أُغلقت|أُنجزت|تحضير/ },
  { k:'info',  c:'#1B6E9C', i:'i-info',   t:'معلومة',
    re:/صورة|تذكرة|رُفع|الكنترول|تذكير|فُتحت|جديدة|بدأت/ }
];
function nkind(n) {
  const s = (n.title || '') + ' ' + (n.body || '');
  for (const k of NKIND) if (k.re.test(s)) return k;
  return NKIND[3];
}
const dayLabel = ts => {
  const d = dayStart(ts), t0 = dayStart(now());
  if (d === t0) return 'اليوم';
  if (d === t0 - DAY) return 'أمس';
  if (d > t0 - 7 * DAY) return dayName(ts);
  return hijri(ts);
};

function notifRow(n) {
  const k = nkind(n);
  return '<button class="nrow ' + (n.read ? 'read' : '') + '" style="--nc:' + k.c + '" ' +
    'data-a="opennotif" data-id="' + n.id + '">' +
    '<span class="ni">' + icon(n.icon || k.i, 's18') + '</span>' +
    '<span class="nb"><b>' + E(n.title) + '</b>' +
      '<p>' + E(n.body) + '</p>' +
      '<span class="nm2"><span class="ntag">' + k.t + '</span>' +
      '<span class="nt">' + t12(n.at) + ' · ' + ago(n.at) + '</span></span></span>' +
    (n.read ? '' : '<span class="nd"></span>') + '</button>';
}

function screenNotifs() {
  const all = myNotifs().slice().sort((a2, b2) => b2.at - a2.at);
  const seg = S.tab.nf || 'all';
  const unreadN = all.filter(n => !n.read).length;
  const needs = all.filter(n => ['bad', 'ask'].indexOf(nkind(n).k) >= 0).length;
  const list = seg === 'unread' ? all.filter(n => !n.read)
    : seg === 'act' ? all.filter(n => ['bad', 'ask'].indexOf(nkind(n).k) >= 0)
    : all;

  /* تجميع بالأيام — القراءة تصير متسلسلة لا كومة */
  let out = '', lastDay = null;
  list.forEach(n => {
    const d = dayStart(n.at);
    if (d !== lastDay) {
      lastDay = d;
      out += '<div class="nday"><b>' + dayLabel(n.at) + '</b><i></i></div>';
    }
    out += notifRow(n);
  });

  return bar('الإشعارات', { right: unreadN
      ? '<button data-a="readall" aria-label="تعليم الكل كمقروء">' + icon('i-check') + '</button>'
      : '<button data-a="go" data-n="profile" class="avbtn">' + avat(me(), 'sm') + '</button>' }) +
    '<div class="view">' + ground() +

    '<div class="nsum">' +
      '<button class="' + (seg === 'all' ? 'on' : '') + '" data-a="seg" data-k="nf" data-v="all">' +
        '<b>' + AR(all.length) + '</b><span>الكل</span></button>' +
      '<button class="' + (seg === 'unread' ? 'on' : '') + '" data-a="seg" data-k="nf" data-v="unread">' +
        '<b style="color:var(--g)">' + AR(unreadN) + '</b><span>غير مقروء</span></button>' +
      '<button class="' + (seg === 'act' ? 'on' : '') + '" data-a="seg" data-k="nf" data-v="act">' +
        '<b style="color:var(--red)">' + AR(needs) + '</b><span>يحتاج إجراءً</span></button>' +
    '</div>' +

    (unreadN ? '<button class="btn l sm" data-a="readall">' + icon('i-check','s16') +
      'تعليم الكل كمقروء</button>' : '') +

    (list.length ? out
      : '<div class="c center" style="padding:34px 16px">' + icon('i-bell','s26') +
        '<b style="display:block;margin-top:10px">' +
        (seg === 'unread' ? 'قرأت كل شيء' : seg === 'act' ? 'لا شيء ينتظر إجراءً' : 'لا توجد إشعارات') +
        '</b><div class="sm dim" style="margin-top:6px">ستصلك التحديثات هنا أولًا بأول.</div></div>') +
    '</div>' + tabs();
}


/* ============================ الحجاج — كلهم لكل المحسنين ============================ */
function screenPilgrims() {
  const u = me();
  const kt = isLeader() ? me().kt
    : (userById(me().leaderId) || {}).kt
      || ((myTasks()[0] || {}).kt) || Object.keys(S.pilgrims)[0];
  const list = pilgrimsOf(kt);
  const q = (S.tab.pq || '').trim();
  const shown = q ? list.filter(p => p.name.includes(q) || String(p.room).includes(q) || p.pp.includes(q)) : list;
  return bar('الحجاج') + '<div class="view">' + ground() +
    '<div class="c gold"><div class="row"><b class="sm">' + E(kt) + '</b>' +
      pill(AR(ktCount(kt)) + ' حاجًا', 'gold') + '</div>' +
      '<div class="tiny dim" style="margin-top:4px">جميع الحجاج مرتبطون بالـKT — يخدمهم الفريق كاملًا</div></div>' +
    '<div class="field"><span class="fl sp" style="gap:8px">' + icon('i-search','s16') +
      '<input id="pq" placeholder="ابحث بالاسم أو الغرفة أو الجواز" value="' + E(q) + '" data-a="psearch"></span></div>' +
    '<div class="col">' + shown.map(p =>
      '<button class="prow" data-a="pflag" data-p="' + p.id + '" data-kt="' + kt + '">' +
        '<span class="av ' + p.av + '"><svg viewBox="0 0 44 44"><use href="#av-' + p.g + '"/></svg></span>' +
        '<span class="nm sp"><b>' + E(p.name) + '</b><span>' + E(p.pp) + ' · غرفة ' + AR(p.room) + '</span>' +
        (p.note ? '<span class="tiny" style="color:var(--amber);display:block">✎ ' + E(p.note) + '</span>' : '') + '</span>' +
        (p.flag ? pill(p.flag, 'no') : icon('i-flag','s16')) + '</button>').join('') + '</div>' +
    '<div class="tiny dim2 center">عرض ' + AR(shown.length) + ' من ' + AR(ktCount(kt)) + '</div>' +
    '</div>' + tabs();
}

/* ============================ المحسنون ============================ */
function screenMuhsens() {
  /* الفريق: يراه الليدر ويراه المحسن */
  const u = me();
  const team = isLeader() ? teamOf(u.id) : teamOf(u.leaderId).filter(x => x.id !== u.id);
  return bar('المحسنون') + '<div class="view">' + ground() +
    '<div class="c gold"><div class="row"><b class="sm">فريق ' + E(u.kt) + '</b>' +
      pill(AR(team.length) + ' محسن', 'gold') + '</div></div>' +
    team.map(m => {
      const r = personRating(m.id);
      const active = S.tasks.find(t => t.status === 'running' && acceptedSlots(t).some(a => a.muhsenId === m.id));
      const notes = personNotes(m.id).length;
      return '<button class="c" data-a="go" data-n="profile" data-id="' + m.id + '" style="width:100%;text-align:right">' +
        '<div class="fl">' + avat(m) + '<span class="nm sp"><b style="font-size:14px">' + E(m.name) + '</b>' +
        '<span class="tiny dim2">' + E(m.code) + ' · ' + E(m.specialty) + '</span></span>' +
        (active ? pill('في مهمة الآن', 'live') : r.n ? stars(r.avg) : pill('بلا تقييم', 'grey')) + '</div>' +
        '<div class="row tiny dim2" style="margin-top:8px"><span>' + AR(r.n) + ' مهمة مقيَّمة</span>' +
        (notes ? '<span style="color:var(--amber)">' + AR(notes) + ' ملاحظة</span>' : '<span>بلا ملاحظات</span>') + '</div></button>';
    }).join('') +
    '<div class="lbl">الفريق الاحتياطي<small>مشترك بين الليدرز · يُطلب من داخل المهمة</small></div>' +
    reserveTeam().map(m2 => {
      const n2 = S.tasks.filter(t => acceptedSlots(t).some(a2 => a2.muhsenId === m2.id)).length;
      return '<button class="prow" data-a="go" data-n="profile" data-id="' + m2.id + '">' +
        avat(m2) + '<span class="nm sp"><b>' + E(m2.name) + '</b><span>' + E(m2.specialty) + ' · احتياط</span></span>' +
        pill(n2 ? AR(n2) + ' مهمة' : 'متاح', n2 ? 'live' : 'grey') + icon('i-back','s16') + '</button>';
    }).join('') + '</div>' + tabs();
}

/* ============================ الملف الشخصي ============================ */
const kv = (k, v) => '<div class="kv"><span>' + E(k) + '</span><b>' + E(v) + '</b></div>';

function screenProfile() {
  const id = S.route.id || S.session.id;
  const u = userById(id); if (!u) return screenMore();
  const L = u.role === 'leader';
  const org = ORGS.find(o => o.id === (L ? u.orgId : (userById(u.leaderId) || {}).orgId)) || ORGS[0];
  const isMe = id === S.session.id;
  const r = personRating(id);
  const notes = personNotes(id);
  const ts = S.tasks.filter(t => L ? t.leaderId === id : t.assigned.some(a => a.muhsenId === id));
  const doneN = ts.filter(t => taskBucket(t, id) === 'done').length;
  const undoneN = ts.filter(t => taskBucket(t, id) === 'undone').length;

  return bar('الملف الشخصي', { back: !isMe ? 1 : 0, right: isMe
      ? '<button data-a="logout" aria-label="خروج">' + icon('i-out') + '</button>'
      : '<span style="width:30px"></span>' }) +
    '<div class="view">' + ground() +
    '<div class="phead"><i class="pat"></i><div class="in">' +
      avat(u, 'xl') + '<h3>' + E(u.name) + '</h3>' +
      '<div class="r">' + (L ? 'محسن ليدر · ' + u.kt : 'مُحسن · ' + u.specialty) + '</div>' +
      (r.n ? '<div class="bigstars" style="margin-top:10px">' + stars(r.avg, 'lg') + '</div>' : '') +
      '<div class="fl" style="justify-content:center;gap:8px;margin-top:10px">' +
        pill(u.code, 'gold') + pill(org.type, 'live') + '</div></div></div>' +

    '<div class="grid3">' +
      '<div class="kpi"><b>' + AR(ts.length) + '</b><span>مهمة</span></div>' +
      '<div class="kpi"><b>' + AR(doneN) + '</b><span>منجزة</span></div>' +
      '<div class="kpi"><b style="color:' + (undoneN ? 'var(--red)' : 'var(--g)') + '">' + AR(undoneN) + '</b><span>غير منجزة</span></div></div>' +

    (r.n ? '<div class="lbl">التقييم التراكمي<small>' + AR(r.n) + ' مهمة مقيَّمة</small></div>' +
      '<div class="score sm"><b>' + AR(String(r.avg).replace(/\.0$/, '')) + '</b>' +
        '<div class="bigstars">' + stars(r.avg, 'lg') + '</div>' +
        '<span class="tiny dim">المتوسط العام لكل مهامه</span></div>' : '') +

    '<div class="lbl">الملاحظات المسجّلة<small>' + AR(notes.length) + ' ملاحظة</small></div>' +
    (notes.length ? notes.slice(0, 15).map(n =>
      '<div class="note a">' + icon('i-info','s16') + '<span>' + E(n.text) +
      '<br><span class="tiny dim2">' + E(n.t.title) + ' · ' + hijri(n.at) + '</span></span></div>').join('')
      : '<div class="note g">' + icon('i-checkc','s16') + '<span>لا توجد ملاحظات مسجّلة — سجلّ نظيف.</span></div>') +

    '<div class="lbl">البيانات</div><div class="c">' +
      kv('الاسم', u.name) + kv('الرقم الوظيفي', u.code) + kv('الدور', L ? 'محسن ليدر' : 'مُحسن') +
      (L ? kv('المجموعة', u.kt) + kv('عدد الحجاج', AR(u.pilgrims)) + kv('عدد المحسنين', AR(teamOf(u.id).length))
         : kv('التخصص', u.specialty) +
           (u.reserve ? kv('الفريق', 'احتياطي — مشترك بين الليدرز')
             : kv('الليدر', (userById(u.leaderId) || {}).name || '—') +
               kv('المجموعة', (userById(u.leaderId) || {}).kt || '—'))) +
      kv('الجهة', org.ar) + kv('النوع', org.type) + kv('الدولة', org.country) + kv('الجوال', u.phone) +
    '</div>' +

    (!isMe && isLeader() && !L ? '<div class="note b">' + icon('i-info','s16') +
      '<span>التسكين والطلبات تُدار من داخل المهمة نفسها — افتح المهمة ثم «إدارة التسكين».</span></div>' +
      '<a class="btn l" href="tel:' + u.phone.replace(/[^0-9]/g,'') + '">' + icon('i-phone','s16') + 'اتصال</a>' : '') +

    (isMe ? '<button class="btn d" data-a="logout">' + icon('i-out','s16') + 'تسجيل الخروج</button>' : '') +
    '</div>' + tabs();
}

/* ============================ المزيد ============================ */
function screenMore() {
  const u = me(), L = isLeader();
  const items = (L
    ? [['tasks','i-tasks','المهام','الحالية والمنجزة وغير المنجزة'],
       ['lreq','i-swap','الطلبات','المرسلة والمستقبلة والمنتهية'],
       ['muhsens','i-users','المحسنون','فريقك وتقييماتهم'],
       ['rating','i-star','التقييم','تقييمك وتقييم الفريق'],
       ['desk','i-ticket','التذاكر والتقارير','التذاكر الواردة والتقارير المرفوعة'],
       ['pilgrims','i-user','الحجاج','حجاج الـKT والبلاغات'],
       ['daily','i-check','التحضير اليومي','حضورك وشِفتك وطلبات التبديل'],
       ['guide','i-guide','دليل المهام','تعليمات كل نوع مهمة — وتحريرها'],
       ['album','i-album','ألبوم الصور','توثيق المهام بالصور'],
       ['calendar','i-cal','التقويم','أسبوعي مع التذكيرات'],
       ['notifs','i-bell','الإشعارات','كل التحديثات'],
       ['profile','i-user','الملف الشخصي','بياناتك وتقييمك'],
       ['admin','i-gear','شاشة التحكم','للتجربة وإعادة الضبط']]
    : [['tasks','i-tasks','المهام','الحالية والمنجزة وغير المنجزة'],
       ['requests','i-swap','الطلبات','التسكين والتفويض'],
       ['rating','i-star','التقييم','تقييمك وتقييم الزملاء'],
       ['desk','i-ticket','التذاكر والتقارير','المسندة إليك وما ترفعه'],
       ['pilgrims','i-user','الحجاج','حجاج الـKT والبلاغات'],
       ['muhsens','i-users','الفريق','زملاؤك والفريق الاحتياطي'],
       ['daily','i-check','التحضير اليومي','حضورك وشِفتك وطلب التبديل'],
       ['guide','i-guide','دليل المهام','تعليمات تنفيذ كل نوع مهمة'],
       ['album','i-album','ألبوم الصور','صور المهام التي تشارك فيها'],
       ['calendar','i-cal','التقويم','أسبوعي مع التذكيرات'],
       ['notifs','i-bell','الإشعارات','كل التحديثات'],
       ['profile','i-user','الملف الشخصي','بياناتك وتقييمك'],
       ['admin','i-gear','شاشة التحكم','للتجربة وإعادة الضبط']]);
  return bar('المزيد') + '<div class="view">' + ground() +
    '<button class="c" data-a="go" data-n="profile" style="width:100%;text-align:right"><div class="fl">' + avat(u, 'lg') +
      '<span class="nm sp"><b style="font-size:15px">' + E(u.name) + '</b>' +
      '<span class="tiny dim2">' + (L ? 'محسن ليدر · ' + u.kt : 'مُحسن · ' + u.specialty) + '</span></span>' +
      icon('i-back','s16') + '</div></button>' +
    items.map(x => '<button class="listitem" data-a="go" data-n="' + x[0] + '">' +
      '<span class="ico">' + icon(x[1], 's18') + '</span>' +
      '<span class="sp"><b style="font-size:13.5px;display:block">' + x[2] + '</b>' +
      '<span class="tiny dim2">' + x[3] + '</span></span>' +
      (x[0] === 'notifs' && unread() ? pill(AR(unread()), 'no') : '') + icon('i-back','s16') + '</button>').join('') +
    '<button class="btn d" data-a="logout">' + icon('i-out','s16') + 'تسجيل الخروج</button>' +
    '<button class="btn l sm" data-a="appupdate">' + icon('i-reset','s16') + 'تحديث التطبيق إلى آخر نسخة</button>' +
    '<div class="tiny dim2 center" style="margin-top:6px;line-height:1.9">تطبيق مُحسن · ' + APP_VER + ' · ' + envStamp() + ' · بنية ' + AR(SCHEMA) + '<br>' +
      'مصادر الصور: ويكيميديا كومنز — Adli Wahid · Basheer Olakara · Omar Chatriwala · Shah134pk</div>' +
    '<i class="mnozoly dark" role="img" aria-label="نُزلي"></i>' +
    '</div>' + tabs();
}

/* ============================ التقويم ============================ */
const D_SHORT = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];

function screenCalendar() {
  const list = myTasks();
  S.reminders = S.reminders || [];
  const mine = S.reminders.filter(r => r.who === S.session.id);
  const today = dayStart(now());
  if (S.calWeek == null) S.calWeek = 0;
  if (S.calDay == null) S.calDay = today;
  const weekStart = dayStart(today + S.calWeek * 7 * DAY) - (new Date(today).getDay() * DAY);
  const days = Array.from({ length: 7 }, (_, i) => weekStart + i * DAY);
  const tasksOn = d => list.filter(t => dayStart(t.start) === d);
  const remsOn = d => mine.filter(r => dayStart(r.at) === d);
  const sel = S.calDay;
  const selTasks = tasksOn(sel).sort((a, b) => a.start - b.start);
  const selRems = remsOn(sel).sort((a, b) => a.at - b.at);

  return bar('التقويم', { right:'<button data-a="addrem" aria-label="تذكير جديد">' + icon('i-plus') + '</button>' }) +
    '<div class="view">' + ground() +
    '<div class="c"><div class="row">' +
      '<button data-a="week" data-v="1" class="navbtn">' + icon('i-fwd','s18') + '</button>' +
      '<div class="center sp"><b style="font-size:14px">' + hijri(weekStart) + ' — ' + hijri(weekStart + 6 * DAY) + '</b>' +
        '<div class="tiny dim2">' + greg(weekStart) + ' إلى ' + greg(weekStart + 6 * DAY) + '</div></div>' +
      '<button data-a="week" data-v="-1" class="navbtn">' + icon('i-back','s18') + '</button></div>' +
    '<div class="week">' + days.map(d => {
      const n = tasksOn(d).length, rn = remsOn(d).length;
      const on = d === sel, isToday = d === today;
      const hot = tasksOn(d).some(t => { const u = urgency(t); return u && u.c === 'r'; });
      return '<button data-a="calday" data-v="' + d + '" class="day' + (on ? ' on' : isToday ? ' today' : '') + '">' +
        '<span class="dn">' + D_SHORT[new Date(d).getDay()] + '</span>' +
        '<span class="dd">' + AR(new Date(d).getDate()) + '</span>' +
        '<span class="dots">' + (n ? '<i class="' + (hot ? 'r' : 'g') + '"></i>' : '') + (rn ? '<i class="a"></i>' : '') + '</span></button>';
    }).join('') + '</div>' +
    '<div class="row tiny dim2" style="margin-top:9px">' +
      '<span><i class="lg g"></i> مهام &nbsp; <i class="lg a"></i> تذكيرات</span>' +
      (S.calWeek !== 0 ? '<button data-a="week" data-v="0" style="color:var(--g);font-weight:700">هذا الأسبوع</button>'
        : '<span>' + AR(list.length) + ' مهمة إجمالًا</span>') + '</div></div>' +

    '<div class="lbl">' + dayName(sel) + ' · ' + hijri(sel) +
      '<small>' + greg(sel) + ' · ' + AR(selTasks.length) + ' مهمة · ' + AR(selRems.length) + ' تذكير</small></div>' +

    (selRems.length ? selRems.map(r =>
      '<div class="note ' + (r.fired ? 'g' : 'a') + '">' + icon('i-bell','s16') +
        '<span class="sp">' + E(r.text) + '<br><span class="tiny" style="opacity:.8">' + t12(r.at) +
        (r.fired ? ' · وصلك الإشعار' : ' · بانتظار الوقت') + '</span></span>' +
        '<button data-a="delrem" data-id="' + r.id + '" style="color:#93261C">' + icon('i-x','s16') + '</button></div>').join('') : '') +

    (selTasks.length ? selTasks.map(t => taskRow(t)).join('')
      : '<div class="c center dim sm" style="padding:22px">لا توجد مهام في هذا اليوم</div>') +

    '<button class="btn l" data-a="addrem">' + icon('i-bell','s16') + 'تذكير على ' + dayName(sel) + ' ' + hijri(sel) + '</button>' +
    '</div>' + tabs();
}
