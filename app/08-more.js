/* ============================ التذاكر (تشمل ما كان يُسمّى تقارير) ============================ */
const PRI_C = { 'عاجلة':'no', 'متوسطة':'wait', 'عادية':'grey' };
const ST_C  = { 'مفتوحة':'wait', 'مُسندة':'blue', 'قيد المعالجة':'blue', 'مُصعّدة':'no', 'مغلقة':'live' };
const SRC_LBL = { 'حاج':'من حاج', 'كنترول':'من الكنترول', 'محسن':'من محسن', 'ليدر':'من الليدر' };

function screenTickets() {
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

  return bar('التذاكر') + '<div class="view">' + ground() +
    '<button class="btn p" data-a="newticket">' + icon('i-plus','s16') +
      (L ? 'رفع تذكرة إلى الكنترول' : 'رفع تذكرة إلى الليدر') + '</button>' +
    (L ? '<div class="note b">' + icon('i-info','s16') +
      '<span>كل التذاكر تصل إليك — من الحجاج والكنترول والمحسنين. أسند ما تريد لمحسن بعينه.</span></div>' : '') +
    '<div class="seg">' + segs.map(x =>
      '<button class="' + (f === x[0] ? 'on' : '') + '" data-a="seg" data-k="tk" data-v="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>' +
    (list.length ? list.map(k => ticketRow(k)).join('')
      : '<div class="c center dim sm" style="padding:24px">لا توجد تذاكر في هذا التصنيف</div>') +
    '</div>' + tabs();
}

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

  const bigStars = v => '<div class="bigstars">' + stars(v, 'lg') + '</div>';
  const col = (label, v) => '<div class="kpi"><div class="tiny dim2">' + label + '</div>' +
    '<b style="font-size:20px">' + E(String(v).replace(/\.0$/, '')) + '</b>' +
    '<span style="color:var(--gold)">★</span></div>';

  let body = '';
  if (seg === 'mine') {
    body = '<div class="c gold center"><div class="tiny dim2">تقييمك التراكمي</div>' +
      '<div style="font-size:38px;font-weight:800;color:var(--g);line-height:1.3">' +
        E(String(rt.avg || 0).replace(/\.0$/, '')) + '</div>' + bigStars(rt.avg || 0) +
      '<div class="tiny dim" style="margin-top:6px">' + AR(rt.n) + ' مهمة مقيَّمة</div></div>' +
      '<div class="grid3">' + col('النظام', rt.sys) + col('المشرف', rt.sup) + col('الحجاج', rt.pil) + '</div>' +
      '<div class="note b">' + icon('i-info','s16') +
        '<span>تقييم النظام يُحتسب آليًا: التحضير ٤٠٪ · بدء المهمة ٢٠٪ · المهام الفرعية ٢٥٪ · الإغلاق ١٥٪.</span></div>' +
      '<div class="lbl">تقييم كل مهمة</div>' +
      (rated.length ? rated.map(t => ratingRow(t)).join('')
        : '<div class="c center dim sm" style="padding:24px">لا توجد مهام مقيَّمة بعد</div>');
  } else {
    const people = L ? teamOf(u.id) : S.users.filter(x => x.leaderId === u.leaderId && x.id !== u.id);
    const rows = people.map(p => ({ p, r: personRating(p.id) })).sort((a, b) => b.r.avg - a.r.avg);
    body = '<div class="lbl">' + (L ? 'ترتيب فريقك' : 'زملاؤك في الفريق') + '<small>حسب المتوسط التراكمي</small></div>' +
      rows.map((x, i) => '<button class="c" data-a="go" data-n="profile" data-id="' + x.p.id + '" style="width:100%;text-align:right">' +
        '<div class="fl">' +
          '<span class="rank">' + AR(i + 1) + '</span>' + avat(x.p) +
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
  const r = t.rating;
  return '<button class="c" data-a="go" data-n="taskrating" data-id="' + t.id + '" style="width:100%;text-align:right">' +
    '<div class="fl" style="align-items:flex-start;gap:10px">' +
      '<span class="thumb" style="width:56px;height:56px;background-image:url(' + IMG[t.photo + '_t'] + ')"></span>' +
      '<span class="sp"><b class="sm" style="display:block;line-height:1.5">' + E(t.title) + '</b>' +
      '<span class="tiny dim2">' + hijri(t.start) + ' · ' + t12(t.start) + '</span></span>' +
      '<span class="center"><div style="font-size:19px;font-weight:800;color:var(--g)">' +
        E(String(avgRating(r)).replace(/\.0$/, '')) + '</div><span class="tiny dim2">المتوسط</span></span></div>' +
    '<div class="grid3" style="margin-top:10px">' +
      '<div class="center"><div class="tiny dim2">النظام</div>' + stars(r.system) + '</div>' +
      '<div class="center"><div class="tiny dim2">المشرف</div>' + stars(r.supervisor) + '</div>' +
      '<div class="center"><div class="tiny dim2">الحجاج</div>' + stars(r.pilgrims) + '</div></div></button>';
}

function screenTaskRating() {
  const t = taskById(S.route.id); if (!t || !t.rating) return screenRating();
  const r = t.rating, b = r.breakdown;
  const barRow = (l, v, w) => '<div style="margin-bottom:11px"><div class="row tiny">' +
    '<span class="dim">' + l + '<span class="dim2"> · وزنه ' + AR(w) + '٪</span></span><b>' + AR(v) + '٪</b></div>' +
    '<div class="meter" style="margin-top:5px"><i style="width:' + v + '%"></i></div></div>';
  return bar('تقييم المهمة', { back: 1 }) + '<div class="view">' + ground() + svcCard(t) +
    '<div class="c gold center"><div class="tiny dim2">المتوسط العام</div>' +
      '<div style="font-size:36px;font-weight:800;color:var(--g);line-height:1.3">' +
        E(String(avgRating(r)).replace(/\.0$/, '')) + '</div>' +
      '<div class="bigstars">' + stars(avgRating(r), 'lg') + '</div></div>' +

    '<div class="lbl">تقييم النظام<small>آلي — مبناه الالتزام بالأوقات</small></div>' +
    '<div class="c"><div class="row" style="margin-bottom:12px"><b class="sm">النتيجة</b>' + stars(r.system, 'lg') + '</div>' +
      barRow('التحضير وإثبات الحضور', b.prep, 40) +
      barRow('بدء المهمة في وقتها', b.start, 20) +
      barRow('إنجاز المهام الفرعية', b.subs, 25) +
      barRow('الإغلاق في وقته', b.close, 15) +
      '<div class="row" style="margin-top:4px"><b class="sm">الإجمالي</b><b>' + AR(b.total) + '٪</b></div></div>' +

    '<div class="lbl">تقييم مشرف السكن</div>' +
    '<div class="c"><div class="row"><b class="sm">التقييم</b>' + stars(r.supervisor, 'lg') + '</div>' +
      '<div class="note b" style="margin-top:10px">' + icon('i-user','s16') + '<span>' + E(r.supNote) + '</span></div></div>' +

    '<div class="lbl">تقييم الحجاج</div>' +
    '<div class="c"><div class="row"><b class="sm">التقييم</b>' + stars(r.pilgrims, 'lg') + '</div>' +
      '<div class="note b" style="margin-top:10px">' + icon('i-users','s16') + '<span>' + E(r.pilNote) + '</span></div></div>' +

    (t.notes.length ? '<div class="lbl">ملاحظات أثّرت في التقييم</div>' +
      t.notes.map(n => '<div class="note a">' + icon('i-info','s16') + '<span>' + E(n.text) + '</span></div>').join('') : '') +

    (isLeader() ? '<button class="btn l" data-a="rerate" data-id="' + t.id + '">' +
      icon('i-reset','s16') + 'إعادة احتساب تقييم النظام</button>' : '') +
    '</div>' + tabs();
}

/* ============================ الإشعارات ============================ */
function screenNotifs() {
  const list = myNotifs();
  return bar('الإشعارات', { right: list.some(n => !n.read)
      ? '<button data-a="readall" aria-label="تعليم الكل كمقروء">' + icon('i-check') + '</button>'
      : '<button data-a="go" data-n="profile" class="avbtn">' + avat(me(), 'sm') + '</button>' }) +
    '<div class="view">' + ground() + statusBoxes() +
    '<div class="lbl">سجل الإشعارات<small>' + AR(list.length) + ' إشعارًا</small></div>' +
    (list.length ? list.map(n =>
      '<button class="listitem" data-a="opennotif" data-id="' + n.id + '" style="' + (n.read ? 'opacity:.62' : '') + '">' +
        '<span class="ico" style="' + (n.read ? '' : 'background:#E4F2E9;color:#0B6540') + '">' + icon(n.icon, 's18') + '</span>' +
        '<span class="sp"><b style="font-size:13.5px;display:block">' + E(n.title) + '</b>' +
        '<span class="tiny dim" style="display:block;line-height:1.6">' + E(n.body) + '</span>' +
        '<span class="tiny dim2">' + ago(n.at) + '</span></span>' +
        (n.read ? '' : '<span class="dotred"></span>') + '</button>').join('')
      : '<div class="c center" style="padding:30px 16px"><b>لا توجد إشعارات</b></div>') +
    '</div>' + tabs();
}

/* ============================ الحجاج — كلهم لكل المحسنين ============================ */
function screenPilgrims() {
  const u = me();
  const kt = u.role === 'leader' ? u.kt : userById(u.leaderId).kt;
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
  const u = me(), team = teamOf(u.id);
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
    }).join('') + '</div>' + tabs();
}

/* ============================ الملف الشخصي ============================ */
const kv = (k, v) => '<div class="kv"><span>' + E(k) + '</span><b>' + E(v) + '</b></div>';

function screenProfile() {
  const id = S.route.id || S.session.id;
  const u = userById(id); if (!u) return screenMore();
  const L = u.role === 'leader';
  const org = ORGS.find(o => o.id === (L ? u.orgId : userById(u.leaderId).orgId));
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
    '<div class="phead"><img class="pat" src="' + IMG.logo_pattern + '" alt=""><div class="in">' +
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
      '<div class="c"><div class="grid3">' +
        '<div class="center"><div class="tiny dim2">النظام</div>' + stars(r.sys) + '</div>' +
        '<div class="center"><div class="tiny dim2">المشرف</div>' + stars(r.sup) + '</div>' +
        '<div class="center"><div class="tiny dim2">الحجاج</div>' + stars(r.pil) + '</div></div></div>' : '') +

    '<div class="lbl">الملاحظات المسجّلة<small>' + AR(notes.length) + ' ملاحظة</small></div>' +
    (notes.length ? notes.slice(0, 15).map(n =>
      '<div class="note a">' + icon('i-info','s16') + '<span>' + E(n.text) +
      '<br><span class="tiny dim2">' + E(n.t.title) + ' · ' + hijri(n.at) + '</span></span></div>').join('')
      : '<div class="note g">' + icon('i-checkc','s16') + '<span>لا توجد ملاحظات مسجّلة — سجلّ نظيف.</span></div>') +

    '<div class="lbl">البيانات</div><div class="c">' +
      kv('الاسم', u.name) + kv('الرقم الوظيفي', u.code) + kv('الدور', L ? 'محسن ليدر' : 'مُحسن') +
      (L ? kv('المجموعة', u.kt) + kv('عدد الحجاج', AR(u.pilgrims)) + kv('عدد المحسنين', AR(teamOf(u.id).length))
         : kv('التخصص', u.specialty) + kv('الليدر', userById(u.leaderId).name) + kv('المجموعة', userById(u.leaderId).kt)) +
      kv('الجهة', org.ar) + kv('النوع', org.type) + kv('الدولة', org.country) + kv('الجوال', u.phone) +
    '</div>' +

    (!isMe && isLeader() && !L ? '<button class="btn p" data-a="assignto" data-u="' + u.id + '">' +
      icon('i-assign','s16') + 'إسناد مهمة إلى ' + E(u.name.split(' ')[0]) + '</button>' +
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
       ['tickets','i-ticket','التذاكر','من الحجاج والكنترول والمحسنين'],
       ['pilgrims','i-user','الحجاج','حجاج الـKT والبلاغات'],
       ['album','i-album','ألبوم الصور','توثيق المهام بالصور'],
       ['calendar','i-cal','التقويم','أسبوعي مع التذكيرات'],
       ['notifs','i-bell','الإشعارات','كل التحديثات'],
       ['profile','i-user','الملف الشخصي','بياناتك وتقييمك'],
       ['admin','i-gear','شاشة التحكم','للتجربة وإعادة الضبط']]
    : [['tasks','i-tasks','المهام','الحالية والمنجزة وغير المنجزة'],
       ['requests','i-swap','الطلبات','التسكين والتفويض'],
       ['rating','i-star','التقييم','تقييمك وتقييم الزملاء'],
       ['tickets','i-ticket','التذاكر','المسندة إليك وما رفعته'],
       ['pilgrims','i-user','الحجاج','حجاج الـKT والبلاغات'],
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
    '<div class="tiny dim2 center" style="margin-top:6px;line-height:1.9">تطبيق مُحسن · نسخة تجريبية<br>' +
      'مصادر الصور: ويكيميديا كومنز — Adli Wahid · Basheer Olakara · Omar Chatriwala · Shah134pk</div>' +
    '<img src="' + IMG.nozoly_dark + '" alt="نُزلي" style="width:82px;margin:4px auto 10px;display:block;opacity:.6">' +
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
