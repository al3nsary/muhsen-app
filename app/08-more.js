/* ============================ التذاكر ============================ */
function screenTickets() {
  const u = me(), L = isLeader();
  const f = S.tab.tk || 'open';
  let list = myTickets();
  if (f === 'open') list = list.filter(k => k.status !== 'مغلقة');
  else if (f === 'closed') list = list.filter(k => k.status === 'مغلقة');
  else if (f === 'hajj') list = list.filter(k => k.src === 'حاج');
  else if (f === 'ctrl') list = list.filter(k => k.src === 'كونترول');
  const PRI = { 'عاجلة': 'no', 'متوسطة': 'wait', 'عادية': 'grey' };
  const ST = { 'مفتوحة': 'wait', 'مُسندة': 'blue', 'قيد المعالجة': 'blue', 'مُصعّدة': 'no', 'مغلقة': 'live' };
  return bar('التذاكر', { back: 1 }) + '<div class="view">' + ground() +
    '<div class="seg">' + [['open','المفتوحة'],['hajj','من الحجاج'],['ctrl','الكونترول'],['closed','المغلقة']].map(([k, l]) =>
      '<button class="' + (f === k ? 'on' : '') + '" data-a="seg" data-k="tk" data-v="' + k + '">' + l + '</button>').join('') + '</div>' +
    (list.length ? list.map(k =>
      '<button class="c" data-a="go" data-n="ticket" data-id="' + k.id + '" style="width:100%;text-align:right">' +
        '<div class="row"><b style="font-size:14px">' + E(k.title) + '</b>' + pill(k.pri, PRI[k.pri]) + '</div>' +
        '<div class="fl" style="margin:8px 0 6px">' +
          (k.src === 'حاج' ? '<span class="av sm ' + k.fromAv + '"><svg viewBox="0 0 44 44"><use href="#av-' + k.fromG + '"/></svg></span>'
            : '<span class="eav" style="width:36px;height:36px;border-style:solid;border-color:rgba(20,89,63,.15)">' + icon('i-shield','s16') + '</span>') +
          '<span class="sp"><b class="tiny" style="display:block">' + E(k.from) + '</b>' +
          '<span class="tiny dim2">' + E(k.no) + ' · مجموعة ' + AR(k.groupNo) + ' · ' + ago(k.at) + '</span></span>' +
          pill(k.status, ST[k.status] || 'grey') + '</div>' +
        (k.assignedTo ? '<div class="tiny dim2">مُسندة إلى ' + E(userById(k.assignedTo).name) + '</div>' : '') +
        (k.replies.length ? '<div class="tiny dim2">' + AR(k.replies.length) + ' رد</div>' : '') +
      '</button>').join('')
      : '<div class="c center dim sm">لا توجد تذاكر في هذا التصنيف</div>') +
    '</div>' + tabs();
}

function screenTicket() {
  const k = S.tickets.find(x => x.id === S.route.id); if (!k) return screenTickets();
  const u = me(), L = isLeader();
  const PRI = { 'عاجلة': 'no', 'متوسطة': 'wait', 'عادية': 'grey' };
  return bar('تذكرة ' + AR(k.no), { back: 1 }) + '<div class="view">' + ground() +
    '<div class="c gold"><div class="row"><b style="font-size:15px">' + E(k.title) + '</b>' + pill(k.pri, PRI[k.pri]) + '</div>' +
      '<div class="fl" style="margin:11px 0">' +
        (k.src === 'حاج' ? '<span class="av ' + k.fromAv + '"><svg viewBox="0 0 44 44"><use href="#av-' + k.fromG + '"/></svg></span>'
          : '<span class="eav" style="border-style:solid;border-color:rgba(20,89,63,.15)">' + icon('i-shield','s18') + '</span>') +
        '<span class="sp"><b class="sm" style="display:block">' + E(k.from) + '</b>' +
        '<span class="tiny dim2">' + (k.src === 'حاج' ? 'من الحاج مباشرة' : 'محوّلة من الكونترول') + ' · ' + ago(k.at) + '</span></span>' +
        pill(k.status, k.status === 'مغلقة' ? 'live' : k.status === 'مُصعّدة' ? 'no' : 'wait') + '</div>' +
      '<div class="sm" style="background:#F8F6F0;border-radius:13px;padding:12px">' + E(k.body) + '</div>' +
      '<div class="tiny dim2" style="margin-top:9px">' + E(taskById(k.taskId) ? taskById(k.taskId).title : '') + ' · مجموعة ' + AR(k.groupNo) + '</div></div>' +

    (k.assignedTo ? '<div class="prow">' + avat(userById(k.assignedTo)) +
      '<span class="nm sp"><b>' + E(userById(k.assignedTo).name) + '</b><span>المسؤول عن التذكرة</span></span>' + pill('مُسندة','blue') + '</div>' : '') +

    (k.replies.length ? '<div class="lbl">الردود</div>' + k.replies.map(r =>
      '<div class="c" style="' + (r.sys ? 'background:#F4F6F3' : '') + '">' +
        '<div class="fl" style="gap:8px;margin-bottom:6px">' + (r.sys ? icon('i-info','s16') : avat(userById(r.by), 'sm')) +
        '<b class="tiny">' + E(r.sys ? 'النظام' : userById(r.by).name) + '</b>' +
        '<span class="tiny dim2 sp" style="text-align:left">' + ago(r.at) + '</span></div>' +
        '<div class="sm">' + E(r.text) + '</div></div>').join('') : '') +

    (k.status !== 'مغلقة' ? '<div class="lbl">إجراء</div>' +
      '<button class="btn p" data-a="kreply" data-id="' + k.id + '">' + icon('i-send','s16') + 'كتابة رد</button>' +
      (L ? '<div class="grid2">' +
            '<button class="btn l sm" data-a="kassign" data-id="' + k.id + '">' + icon('i-assign','s16') + 'إسناد لمحسن</button>' +
            '<button class="btn l sm" data-a="kstate" data-id="' + k.id + '">' + icon('i-list','s16') + 'تغيير الحالة</button></div>'
        : '<div class="grid2">' +
            '<button class="btn l sm" data-a="kesc" data-id="' + k.id + '">' + icon('i-warn','s16') + 'تصعيد للقائد</button>' +
            '<button class="btn l sm" data-a="kstate" data-id="' + k.id + '">' + icon('i-list','s16') + 'تغيير الحالة</button></div>') +
      '<button class="btn g" data-a="kclose" data-id="' + k.id + '">' + icon('i-checkc','s16') + 'إغلاق التذكرة</button>'
      : '<div class="note g">' + icon('i-checkc','s16') + '<span>التذكرة مغلقة.</span></div>' +
        '<button class="btn l" data-a="kreopen" data-id="' + k.id + '">إعادة فتح</button>') +
    '</div>' + tabs();
}

/* ============================ التقارير ============================ */
const RCATS = ['حالة صحية','مشكلة سكن','مشكلة نقل','مشكلة إعاشة','حاج مفقود','وفاة','ازدحام أو أمن','ملاحظة تشغيلية','أخرى'];

function screenReports() {
  const u = me(), L = isLeader();
  const sent = S.reports.filter(r => r.from === u.id);
  const got = S.reports.filter(r => r.to === u.id);
  const seg = S.tab.rep || (L ? 'in' : 'out');
  const list = seg === 'out' ? sent : got;
  return bar('التقارير') + '<div class="view">' + ground() +
    (L ? '<div class="seg">' +
      '<button class="' + (seg==='in'?'on':'') + '" data-a="seg" data-k="rep" data-v="in">واردة من المحسنين</button>' +
      '<button class="' + (seg==='out'?'on':'') + '" data-a="seg" data-k="rep" data-v="out">مرفوعة للكونترول</button></div>' : '') +
    '<button class="btn p" data-a="report">' + icon('i-flag','s16') + (L ? 'رفع تقرير إلى الكونترول' : 'رفع تقرير إلى القائد') + '</button>' +
    (list.length ? list.map(r =>
      '<button class="c" data-a="go" data-n="report" data-id="' + r.id + '" style="width:100%;text-align:right">' +
        '<div class="row"><b class="sm trunc">' + E(r.title) + '</b>' + pill(r.cat, 'gold') + '</div>' +
        '<div class="sm dim" style="margin:7px 0">' + E(r.body) + '</div>' +
        (r.pilgrim ? '<div class="tiny dim2">بخصوص الحاج: ' + E(r.pilgrim) + '</div>' : '') +
        '<div class="row tiny dim2" style="margin-top:6px"><span>' +
          (seg === 'out' ? 'إلى ' + (r.to === 'CONTROL' ? 'الكونترول' : userById(r.to).name) : 'من ' + userById(r.from).name) +
        '</span><span>' + ago(r.at) + '</span></div>' +
        '<div class="fl" style="gap:6px;margin-top:8px">' + pill(r.status, r.status === 'مغلق' ? 'live' : r.escalated ? 'no' : 'wait') +
        (r.replies.length ? pill(AR(r.replies.length) + ' رد', 'grey') : '') +
        (r.taskId && taskById(r.taskId) ? pill(taskById(r.taskId).title, 'blue') : '') + '</div>' +
      '</button>').join('')
      : '<div class="c center dim sm">لا توجد تقارير</div>') +
    '</div>' + tabs();
}

/* تفاصيل التقرير — رد وتصعيد وتغيير حالة */
function screenReport() {
  const r = reportById(S.route.id); if (!r) return screenReports();
  const u = me(), L = isLeader();
  const mine = r.from === u.id;
  const t = r.taskId ? taskById(r.taskId) : null;
  const closed = r.status === 'مغلق';
  return bar('تفاصيل التقرير', { back: 1 }) + '<div class="view">' + ground() +
    '<div class="c gold"><div class="row"><b style="font-size:15px">' + E(r.title) + '</b>' + pill(r.cat, 'gold') + '</div>' +
      '<div class="fl" style="margin:11px 0">' + avat(userById(r.from)) +
        '<span class="nm sp"><b class="sm" style="display:block">' + E(userById(r.from).name) + '</b>' +
        '<span class="tiny dim2">' + (userById(r.from).role === 'leader' ? 'محسن ليدر' : 'مُحسن') + ' · ' + ago(r.at) + '</span></span>' +
        pill(r.status, closed ? 'live' : r.escalated ? 'no' : 'wait') + '</div>' +
      '<div class="sm" style="background:#F8F6F0;border-radius:13px;padding:12px">' + E(r.body || '—') + '</div>' +
      (r.pilgrim ? '<div class="tiny dim2" style="margin-top:8px">بخصوص الحاج: <b>' + E(r.pilgrim) + '</b></div>' : '') +
      '<div class="tiny dim2">إلى: ' + (r.to === 'CONTROL' ? 'غرفة العمليات — الكونترول' : E(userById(r.to).name)) + '</div>' +
      (t ? '<button class="btn l sm" style="margin-top:10px" data-a="go" data-n="task" data-id="' + t.id + '">' +
        icon('i-tasks','s16') + 'فتح المهمة: ' + E(t.title) + '</button>' : '') + '</div>' +

    (r.replies.length ? '<div class="lbl">المتابعة</div>' + r.replies.map(x =>
      '<div class="c" style="' + (x.sys ? 'background:#F4F6F3' : '') + '">' +
        '<div class="fl" style="gap:8px;margin-bottom:6px">' + (x.sys ? icon('i-info','s16') : avat(userById(x.by), 'sm')) +
        '<b class="tiny">' + E(x.sys ? 'النظام' : userById(x.by).name) + '</b>' +
        '<span class="tiny dim2 sp" style="text-align:left">' + ago(x.at) + '</span></div>' +
        '<div class="sm">' + E(x.text) + '</div></div>').join('') : '') +

    (!closed ? '<div class="lbl">إجراء</div>' +
      '<button class="btn p" data-a="rreply" data-id="' + r.id + '">' + icon('i-send','s16') +
        (mine ? 'إضافة متابعة' : 'رد على ' + E(userById(r.from).name.split(' ')[0])) + '</button>' +
      (L && !mine && !r.escalated ? '<button class="btn l" data-a="resc" data-id="' + r.id + '">' +
        icon('i-warn','s16') + 'تصعيد إلى الكونترول</button>' : '') +
      '<div class="grid2">' +
        '<button class="btn l sm" data-a="rstate" data-id="' + r.id + '">' + icon('i-list','s16') + 'تغيير الحالة</button>' +
        '<button class="btn g sm" data-a="rclose" data-id="' + r.id + '">' + icon('i-checkc','s16') + 'إغلاق</button></div>'
      : '<div class="note g">' + icon('i-checkc','s16') + '<span>التقرير مغلق.</span></div>' +
        '<button class="btn l" data-a="rreopen" data-id="' + r.id + '">إعادة فتح</button>') +
    '</div>' + tabs();
}

function reportStateSheet(r) {
  const opts = ['مرسل','قيد المعالجة','مُصعّد للكونترول','بانتظار معلومات','مغلق'];
  return '<div class="grip"></div><h3>حالة التقرير</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">' + E(r.title) + '</div>' +
    '<div class="col">' + opts.map(o => '<button class="prow" data-a="dorstate" data-id="' + r.id + '" data-v="' + o + '">' +
      '<span class="sp b">' + o + '</span>' + (r.status === o ? icon('i-checkc','s16') : icon('i-back','s16')) + '</button>').join('') + '</div>' +
    '<button class="btn g" style="margin-top:12px" data-a="close">إغلاق</button>';
}

/* ============================ الإشعارات ============================ */
/* صناديق «الوضع الآن» — ملخص تشغيلي فوري */
function statusBoxes() {
  const ts = myTasks(), L = isLeader();
  const running = ts.filter(t => t.status === 'running');
  const late = ts.filter(t => t.status !== 'running' && !['done','cancelled'].includes(t.status) && now() >= t.start);
  const soon = ts.filter(t => !['done','cancelled','running'].includes(t.status) && t.start > now() && t.start - now() < 3 * HR);
  const pend = ts.reduce((a, t) => a + t.groups.filter(g => g.req === 'pending').length, 0);
  const empty = ts.filter(t => !['done','cancelled'].includes(t.status))
    .reduce((a, t) => a + t.groups.filter(g => !g.muhsenId).length, 0);
  const reqs = L ? 0 : myRequests().length;
  const tks = myTickets().filter(k => k.status !== 'مغلقة').length;

  const box = (cls, ic, n, title, sub, act) =>
    '<button class="c ' + cls + '" ' + (act || '') + ' style="width:100%;text-align:right">' +
      '<div class="fl" style="gap:11px">' +
        '<span class="ico" style="width:42px;height:42px;border-radius:13px;display:grid;place-items:center;' +
          (cls === 'urgent' ? 'background:#FCEDEB;color:#93261C' : cls === 'soon' ? 'background:#FCF5E7;color:#7A5512'
            : 'background:#E4F2E9;color:#0B6540') + '">' + icon(ic, 's18') + '</span>' +
        '<span class="sp"><b style="font-size:14px;display:block">' + E(title) + '</b>' +
        '<span class="tiny dim">' + E(sub) + '</span></span>' +
        '<b style="font-size:22px;font-weight:800;' +
          (cls === 'urgent' ? 'color:#C0392B' : cls === 'soon' ? 'color:#B8791A' : 'color:var(--g)') + '">' + AR(n) + '</b>' +
      '</div></button>';

  let out = '<div class="lbl">الوضع الآن<small>' + dayName(now()) + ' · ' + t12(now()) + '</small></div>';
  let any = false;

  if (late.length) { any = true;
    out += box('urgent', 'i-warn', late.length, 'مهمة متأخرة عن البداية',
      'السبب: ' + (empty ? 'عدم تسكين محسنين — ' + AR(empty) + ' مجموعة شاغرة' : 'لم تُبدأ بعد رغم حلول وقتها'),
      'data-a="filter" data-v="late"');
  }
  if (running.length) { any = true;
    out += box('', 'i-play', running.length, 'مهمة جارية الآن',
      running.map(t => t.title).slice(0, 2).join(' · ') + (running.length > 2 ? ' وغيرها' : ''),
      'data-a="filter" data-v="running"');
  }
  if (soon.length) { any = true;
    out += box('soon', 'i-clock', soon.length, 'مهمة تبدأ خلال ٣ ساعات',
      soon.map(t => t.title + ' ' + t12(t.start)).slice(0, 2).join(' · '), 'data-a="filter" data-v="soon"');
  }
  if (L && pend) { any = true;
    out += box('soon', 'i-bell', pend, 'طلب تسكين بلا رد', 'تواصل أو استبدل', 'data-a="go" data-n="pending"');
  }
  if (!L && reqs) { any = true;
    out += box('soon', 'i-bell', reqs, 'طلب بانتظار ردك', 'تسكين أو استبدال أو تفويض', 'data-a="go" data-n="requests"');
  }
  if (tks) { any = true;
    out += box('', 'i-ticket', tks, 'تذكرة مفتوحة', 'من الحجاج والكونترول', 'data-a="go" data-n="tickets"');
  }
  if (!any) out += '<div class="note g">' + icon('i-checkc','s16') + '<span>لا يوجد ما يستدعي انتباهك الآن.</span></div>';
  return out;
}

/* قائمة المهام المفلترة من صناديق الوضع */
function screenFilter() {
  const k = S.route.id, ts = myTasks();
  const title = k === 'running' ? 'المهام الجارية الآن' : k === 'late' ? 'المهام المتأخرة عن البداية' : 'مهام تبدأ خلال ٣ ساعات';
  const list = k === 'running' ? ts.filter(t => t.status === 'running')
    : k === 'late' ? ts.filter(t => t.status !== 'running' && !['done','cancelled'].includes(t.status) && now() >= t.start)
    : ts.filter(t => !['done','cancelled','running'].includes(t.status) && t.start > now() && t.start - now() < 3 * HR);
  return bar(title, { back: 1 }) + '<div class="view">' + ground() +
    '<div class="c gold"><div class="row"><b class="sm">' + E(title) + '</b>' + pill(AR(list.length) + ' مهمة', 'gold') + '</div></div>' +
    (list.length ? list.map(t => taskRow(t)).join('') : '<div class="c center dim sm">لا توجد مهام هنا الآن</div>') +
    '</div>' + tabs();
}

function screenNotifs() {
  const list = myNotifs();
  return bar('الإشعارات', { right: list.some(n => !n.read)
      ? '<button data-a="readall">' + icon('i-check') + '</button>' : '<span style="width:30px"></span>' }) +
    '<div class="view">' + ground() + statusBoxes() +
    '<div class="lbl">سجل الإشعارات<small>' + AR(list.length) + ' إشعارًا</small></div>' +
    (list.length ? list.map(n =>
      '<button class="listitem" data-a="opennotif" data-id="' + n.id + '" style="' + (n.read ? 'opacity:.62' : '') + '">' +
        '<span class="ico" style="' + (n.read ? '' : 'background:#E4F2E9;color:#0B6540') + '">' + icon(n.icon, 's18') + '</span>' +
        '<span class="sp"><b style="font-size:13.5px;display:block">' + E(n.title) + '</b>' +
        '<span class="tiny dim" style="display:block;line-height:1.6">' + E(n.body) + '</span>' +
        '<span class="tiny dim2">' + ago(n.at) + '</span></span>' +
        (n.read ? '' : '<span style="width:8px;height:8px;border-radius:50%;background:#D0342C;flex:none"></span>') +
      '</button>').join('')
      : '<div class="c center" style="padding:34px 16px"><b>لا توجد إشعارات</b>' +
        '<div class="sm dim" style="margin-top:4px">ستصلك هنا كل تحديثات المهام والطلبات والتذاكر.</div></div>') +
    '</div>' + tabs();
}

/* ============================ الحجاج ============================ */
function screenPilgrims() {
  const u = me(), L = isLeader();
  const t = S.route.id ? taskById(S.route.id) : (myTasks()[0] || null);
  if (!t) return bar('الحجاج', { back: 1 }) + '<div class="view">' + ground() +
    '<div class="c center dim sm">لا توجد مجموعة مرتبطة</div></div>' + tabs();
  const groups = L ? t.groups : t.groups.filter(g => g.muhsenId === u.id);
  return bar('الحجاج', { back: 1, right: '<button>' + icon('i-search') + '</button>' }) +
    '<div class="view">' + ground() +
    '<div class="c gold"><div class="row"><b class="sm">' + E(t.title) + '</b>' + pill(t.kt, 'gold') + '</div>' +
      '<div class="tiny dim" style="margin-top:4px">' + E(orgOf(t).ar) + ' · ' + AR(groups.reduce((a, g) => a + g.pilgrims, 0)) + ' حاجًا</div></div>' +
    groups.map(g => '<div><div class="lbl">مجموعة ' + AR(g.no) + '<small>' + AR(g.pilgrims) + ' حاجًا' +
        (g.muhsenId ? ' · المحسن ' + E(userById(g.muhsenId).name) : ' · بلا محسن') + '</small></div>' +
      '<div class="col">' + g.pilgrims_list.map(p =>
        '<button class="prow" data-a="pflag" data-id="' + t.id + '" data-g="' + g.id + '" data-p="' + p.id + '">' +
          '<span class="av ' + p.av + '"><svg viewBox="0 0 44 44"><use href="#av-' + p.g + '"/></svg></span>' +
          '<span class="nm sp"><b>' + E(p.name) + '</b><span>' + E(p.pp) + ' · غرفة ' + AR(p.room) + '</span>' +
            (p.note ? '<span style="color:#7A5512;font-size:11px;display:block">✎ ' + E(p.note) + '</span>' : '') + '</span>' +
          (p.flag ? pill(p.flag, 'no') : icon('i-flag','s16')) + '</button>').join('') + '</div>' +
      '<div class="tiny dim2 center" style="margin:6px 0 2px">عرض ' + AR(g.pilgrims_list.length) + ' من ' + AR(g.pilgrims) + '</div></div>').join('') +
    '</div>' + tabs();
}

/* ============================ المحسنون (للّيدر) ============================ */
function screenMuhsens() {
  const u = me(), team = teamOf(u.id);
  return bar('المحسنون', { back: 1 }) + '<div class="view">' + ground() +
    '<div class="c gold"><div class="row"><b class="sm">فريق ' + E(u.kt) + '</b>' + pill(AR(team.length) + ' محسن', 'gold') + '</div></div>' +
    team.map(m => {
      const tasks = S.tasks.filter(t => t.groups.some(g => g.muhsenId === m.id && g.req === 'accepted'));
      const active = tasks.find(t => t.status === 'running');
      const reps = S.reports.filter(r => r.from === m.id).length;
      return '<button class="c" data-a="muhsenp" data-id="' + m.id + '" style="width:100%;text-align:right">' +
        '<div class="fl">' + avat(m) + '<span class="nm sp"><b style="font-size:14px">' + E(m.name) + '</b>' +
        '<span class="tiny dim2">' + E(m.code) + ' · ' + E(m.specialty) + '</span></span>' +
        (active ? pill('في مهمة الآن', 'live') : pill(AR(tasks.length) + ' مهمة', 'grey')) + '</div>' +
        '<div class="row tiny dim2" style="margin-top:8px"><span>' + AR(reps) + ' تقرير مرفوع</span>' +
        '<span>' + E(m.phone) + '</span></div></button>';
    }).join('') + '</div>' + tabs();
}

/* ============================ الملف الشخصي ============================ */
function screenProfile() {
  const id = S.route.id || (S.session && S.session.id);
  const u = userById(id), L = u.role === 'leader';
  const org = L ? ORGS.find(o => o.id === u.orgId) : ORGS.find(o => o.id === userById(u.leaderId).orgId);
  const tasks = L ? S.tasks.filter(t => t.leaderId === u.id)
    : S.tasks.filter(t => t.groups.some(g => g.muhsenId === u.id && g.req === 'accepted'));
  const done = tasks.filter(t => t.status === 'done').length;
  const isMe = id === (S.session && S.session.id);
  return bar('الملف الشخصي', { back: 1 }) + '<div class="view">' + ground() +
    '<div class="phead"><img class="pat" src="' + IMG.logo_pattern + '" alt=""><div class="in">' +
      avat(u, 'xl') + '<h3>' + E(u.name) + '</h3>' +
      '<div class="r">' + (L ? 'محسن ليدر · ' + u.kt : 'مُحسن · ' + u.specialty) + '</div>' +
      '<div class="fl" style="justify-content:center;gap:8px;margin-top:11px">' +
        pill(u.code, 'gold') + pill(org.type, 'live') + '</div></div></div>' +

    '<div class="grid3">' +
      '<div class="kpi"><b>' + AR(tasks.length) + '</b><span>مهمة</span></div>' +
      '<div class="kpi"><b>' + AR(done) + '</b><span>منجزة</span></div>' +
      '<div class="kpi"><b>' + AR(L ? teamOf(u.id).length : S.reports.filter(r => r.from === u.id).length) + '</b><span>' + (L ? 'محسن' : 'تقرير') + '</span></div></div>' +

    '<div class="lbl">البيانات</div><div class="c">' +
      kv('الاسم', u.name) + kv('الرقم الوظيفي', u.code) + kv('الدور', L ? 'محسن ليدر' : 'مُحسن') +
      (L ? kv('المجموعة', u.kt) + kv('عدد الحجاج', AR(u.pilgrims)) + kv('عدد المجموعات', AR(u.groups))
         : kv('التخصص', u.specialty) + kv('القائد', userById(u.leaderId).name) + kv('المجموعة', userById(u.leaderId).kt)) +
      kv('الجهة', org.ar) + kv('النوع', org.type) + kv('الدولة', org.country) + kv('الجوال', u.phone) +
    '</div>' +

    /* عرض القائد لمحسن: مهامه وملاحظاته وإسناد مباشر */
    (!isMe && !L && isLeader() ? (function () {
      const his = S.tasks.filter(t => t.leaderId === S.session.id &&
        t.groups.some(g => g.muhsenId === u.id) || (t.delegate && t.delegate.muhsenId === u.id));
      const openSlots = S.tasks.filter(t => t.leaderId === S.session.id &&
        !['done','cancelled'].includes(t.status) && t.groups.some(g => !g.muhsenId));
      /* كل ما سُجّل عنه */
      const notes = [];
      S.tasks.filter(t => t.leaderId === S.session.id).forEach(t => {
        t.history.forEach(h => { if (h.text.includes(u.name)) notes.push({ at: h.at, t, text: h.text, kind: 'سجل' }); });
        t.notes.forEach(n => { if (n.text.includes(u.name)) notes.push({ at: n.at, t, text: n.text, kind: 'ملاحظة' }); });
      });
      S.reports.filter(r => r.from === u.id).forEach(r =>
        notes.push({ at: r.at, t: r.taskId ? taskById(r.taskId) : null, text: r.title + (r.body ? ' — ' + r.body : ''), kind: 'تقرير', rid: r.id }));
      notes.sort((a, b) => b.at - a.at);

      return '<div class="lbl">مهامه<small>' + AR(his.length) + ' مهمة</small></div>' +
        (his.length ? his.sort((a, b) => b.start - a.start).slice(0, 8).map(t => {
          const g = t.groups.find(x => x.muhsenId === u.id);
          const st = STATUS[t.status];
          return '<button class="prow" data-a="go" data-n="task" data-id="' + t.id + '">' +
            '<span class="thumb" style="width:44px;height:44px;background-image:url(' + IMG[t.photo + '_t'] + ')"></span>' +
            '<span class="nm sp"><b>' + E(t.title) + '</b><span>' + hijri(t.start) + ' · ' + t12(t.start) +
            (g ? ' · مجموعة ' + AR(g.no) : ' · مفوَّض') + '</span></span>' +
            pill(st.t, st.c) + '</button>';
        }).join('') : '<div class="c center dim sm">لم يُسند إليه شيء بعد</div>') +

        (openSlots.length
          ? '<button class="btn p" data-a="assignto" data-u="' + u.id + '">' + icon('i-assign','s16') +
            'إسناد مهمة إلى ' + E(u.name.split(' ')[0]) + '</button>'
          : '<div class="note b">' + icon('i-info','s16') + '<span>لا توجد مجموعات شاغرة لإسنادها حاليًا.</span></div>') +

        '<div class="lbl">الملاحظات والتقارير<small>' + AR(notes.length) + ' سجل</small></div>' +
        (notes.length ? notes.slice(0, 12).map(n =>
          '<div class="c"' + (n.rid ? ' data-a="go" data-n="report" data-id="' + n.rid + '"' : '') + '>' +
            '<div class="row"><b class="tiny">' + n.kind + '</b>' +
            '<span class="tiny dim2">' + ago(n.at) + '</span></div>' +
            '<div class="sm" style="margin-top:5px">' + E(n.text) + '</div>' +
            (n.t ? '<div class="tiny dim2" style="margin-top:4px">' + E(n.t.title) + '</div>' : '') +
          '</div>').join('')
          : '<div class="c center dim sm">لا توجد ملاحظات مسجّلة عليه</div>');
    })() : '') +

    (isMe ? '<div class="lbl">الحساب</div>' +
      '<button class="listitem" data-a="go" data-n="notifs"><span class="ico">' + icon('i-bell','s18') + '</span>' +
        '<span class="sp b" style="font-size:13.5px">الإشعارات</span>' + (unread() ? pill(AR(unread()),'no') : '') + icon('i-back','s16') + '</button>' +
      '<button class="listitem" data-a="go" data-n="admin"><span class="ico" style="background:#E7EEF6;color:#2A4A73">' + icon('i-gear','s18') + '</span>' +
        '<span class="sp b" style="font-size:13.5px">شاشة التحكم والتجربة</span>' + icon('i-back','s16') + '</button>' +
      '<button class="btn d" data-a="logout">' + icon('i-out','s16') + 'تسجيل الخروج</button>' : '') +
    '</div>' + tabs();
}
const kv = (k, v) => '<div class="kv"><span>' + E(k) + '</span><b>' + E(v) + '</b></div>';

/* ============================ المزيد ============================ */
function screenMore() {
  const u = me(), L = isLeader();
  const items = L
    ? [['muhsens','i-users','المحسنون','فريقك وبياناتهم'],
       ['pilgrims','i-user','الحجاج','حجاج مجموعاتك والبلاغات'],
       ['tickets','i-ticket','التذاكر','من الحجاج والكونترول'],
       ['calendar','i-cal','تقويم المهام','كل المهام بترتيبها'],
       ['completed','i-checkc','المهام المكتملة','الأرشيف والملاحظات'],
       ['notifs','i-bell','الإشعارات','كل التحديثات'],
       ['profile','i-user','الملف الشخصي','بياناتك وحسابك'],
       ['admin','i-gear','شاشة التحكم','للتجربة وإعادة الضبط']]
    : [['pilgrims','i-user','الحجاج','حجاج مجموعتك والبلاغات'],
       ['tickets','i-ticket','التذاكر','المسندة إليك'],
       ['calendar','i-cal','تقويم المهام','مهامك بترتيبها'],
       ['completed','i-checkc','المهام المكتملة','الأرشيف'],
       ['notifs','i-bell','الإشعارات','كل التحديثات'],
       ['profile','i-user','الملف الشخصي','بياناتك وحسابك'],
       ['admin','i-gear','شاشة التحكم','للتجربة وإعادة الضبط']];
  return bar('المزيد') + '<div class="view">' + ground() +
    '<button class="c" data-a="go" data-n="profile" style="width:100%;text-align:right"><div class="fl">' + avat(u, 'lg') +
      '<span class="nm sp"><b style="font-size:15px">' + E(u.name) + '</b>' +
      '<span class="tiny dim2">' + (L ? 'محسن ليدر · ' + u.kt : 'مُحسن · ' + u.specialty) + '</span></span>' +
      icon('i-back','s16') + '</div></button>' +
    items.map(([n, i, t, s]) => '<button class="listitem" data-a="go" data-n="' + n + '">' +
      '<span class="ico">' + icon(i, 's18') + '</span>' +
      '<span class="sp"><b style="font-size:13.5px;display:block">' + t + '</b><span class="tiny dim2">' + s + '</span></span>' +
      (n === 'notifs' && unread() ? pill(AR(unread()), 'no') : '') + icon('i-back','s16') + '</button>').join('') +
    '<button class="btn d" data-a="logout">' + icon('i-out','s16') + 'تسجيل الخروج</button>' +
    '<div class="tiny dim2 center" style="margin-top:6px;line-height:1.9">تطبيق مُحسن · نسخة تجريبية<br>' +
      'مصادر الصور: ويكيميديا كومنز — Adli Wahid · Basheer Olakara · Omar Chatriwala (Al Jazeera English) · Shah134pk — برخص المشاع الإبداعي</div>' +
    '<img src="' + IMG.nozoly_dark + '" alt="نُزلي" style="width:82px;margin:4px auto 10px;display:block;opacity:.6">' +
    '</div>' + tabs();
}

/* ============================ التقويم والمكتملة ============================ */
const DAY = 86400000;
const dayKey = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
const D_SHORT = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];

function screenCalendar() {
  const list = myTasks();
  S.reminders = S.reminders || [];
  const mine = S.reminders.filter(r => r.who === S.session.id);

  /* الأسبوع المعروض والي وم المختار */
  const today = dayKey(now());
  if (S.calWeek == null) S.calWeek = 0;
  if (S.calDay == null) S.calDay = today;
  const weekStart = dayKey(today + S.calWeek * 7 * DAY) - (new Date(today).getDay() * DAY);
  const days = Array.from({ length: 7 }, (_, i) => weekStart + i * DAY);

  const tasksOn = d => list.filter(t => dayKey(t.start) === d);
  const remsOn  = d => mine.filter(r => dayKey(r.at) === d);
  const sel = S.calDay;
  const selTasks = tasksOn(sel).sort((a, b) => a.start - b.start);
  const selRems = remsOn(sel).sort((a, b) => a.at - b.at);

  return bar('التقويم', { back: 1, right: '<button data-a="addrem">' + icon('i-plus') + '</button>' }) +
    '<div class="view">' + ground() +

    /* شريط التنقّل بين الأسابيع */
    '<div class="c"><div class="row">' +
      '<button data-a="week" data-v="1" style="padding:6px">' + icon('i-fwd','s18') + '</button>' +
      '<div class="center sp"><b style="font-size:14px">' + hijri(weekStart) + ' — ' + hijri(weekStart + 6 * DAY) + '</b>' +
        '<div class="tiny dim2">' + greg(weekStart) + ' إلى ' + greg(weekStart + 6 * DAY) + '</div></div>' +
      '<button data-a="week" data-v="-1" style="padding:6px">' + icon('i-back','s18') + '</button>' +
    '</div>' +

    /* شبكة الأسبوع */
    '<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;margin-top:12px">' +
      days.map(d => {
        const n = tasksOn(d).length, rn = remsOn(d).length;
        const on = d === sel, isToday = d === today;
        const hot = tasksOn(d).some(t => urgency(t) && urgency(t).c === 'r');
        return '<button data-a="calday" data-v="' + d + '" style="border-radius:12px;padding:7px 2px;text-align:center;' +
          (on ? 'background:linear-gradient(150deg,var(--g3),var(--g2));color:#fff'
              : isToday ? 'background:#E4F2E9;color:#0B6540' : 'background:#F4F6F2;color:#5A6C63') + '">' +
          '<div style="font-size:9.5px;opacity:.85">' + D_SHORT[new Date(d).getDay()] + '</div>' +
          '<div style="font-size:15px;font-weight:800;line-height:1.5">' + AR(new Date(d).getDate()) + '</div>' +
          '<div style="height:5px;display:flex;gap:2px;justify-content:center">' +
            (n ? '<span style="width:5px;height:5px;border-radius:50%;background:' +
              (on ? '#fff' : hot ? '#C0392B' : '#0B8A4B') + '"></span>' : '') +
            (rn ? '<span style="width:5px;height:5px;border-radius:50%;background:' + (on ? '#DFCFAE' : '#B8791A') + '"></span>' : '') +
          '</div></button>';
      }).join('') +
    '</div>' +
    '<div class="row tiny dim2" style="margin-top:9px">' +
      '<span>● مهام &nbsp; ● تذكيرات</span>' +
      (S.calWeek !== 0 ? '<button data-a="week" data-v="0" style="color:var(--g);font-weight:700">هذا الأسبوع</button>' : '<span>' + AR(list.length) + ' مهمة إجمالًا</span>') +
    '</div></div>' +

    /* اليوم المختار */
    '<div class="lbl">' + dayName(sel) + ' · ' + hijri(sel) +
      '<small>' + greg(sel) + ' · ' + AR(selTasks.length) + ' مهمة · ' + AR(selRems.length) + ' تذكير</small></div>' +

    (selRems.length ? selRems.map(r =>
      '<div class="note ' + (r.fired ? 'g' : 'a') + '">' + icon('i-bell','s16') +
        '<span class="sp">' + E(r.text) + '<br><span class="tiny" style="opacity:.8">' + t12(r.at) +
        (r.fired ? ' · وصلك الإشعار' : ' · بانتظار الوقت') + '</span></span>' +
        '<button data-a="delrem" data-id="' + r.id + '" style="color:#93261C">' + icon('i-x','s16') + '</button></div>').join('') : '') +

    (selTasks.length ? selTasks.map(t => taskRow(t)).join('')
      : '<div class="c center dim sm" style="padding:22px">لا توجد مهام في هذا اليوم' +
        '<div style="margin-top:10px"><button class="btn l sm" data-a="addrem">' + icon('i-plus','s16') + 'أضف تذكيرًا</button></div></div>') +

    '<button class="btn l" data-a="addrem">' + icon('i-bell','s16') + 'تذكير جديد على هذا اليوم</button>' +
    '</div>' + tabs();
}

function reminderSheet() {
  const list = myTasks().filter(t => !['done','cancelled'].includes(t.status));
  return '<div class="grip"></div><h3>تذكير على يوم مهمة</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">يصلك إشعار داخل التطبيق في الوقت المحدد</div>' +
    '<div class="lbl plain">المهمة</div>' +
    '<div class="field" style="margin:8px 0"><select id="qt">' +
      list.map(t => '<option value="' + t.id + '">' + t.title + ' — ' + hijri(t.start) + ' ' + t12(t.start) + '</option>').join('') +
    '</select></div>' +
    '<div class="lbl plain">وقت التذكير</div>' +
    '<div class="field" style="margin:8px 0"><input type="time" id="qtime" value="06:00"></div>' +
    '<div class="lbl plain">الملاحظة</div>' +
    '<div class="field" style="margin:8px 0"><input id="qtxt" placeholder="مثال: تأكد من جاهزية الباصات"></div>' +
    '<div class="grid2" style="margin-top:12px">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" data-a="dorem">حفظ التذكير</button></div>';
}
function screenCompleted() {
  const list = myTasks().filter(t => ['done','cancelled'].includes(t.status));
  return bar('المهام المكتملة', { back: 1 }) + '<div class="view">' + ground() +
    (list.length ? list.map(t => {
      const done = t.subs.filter(s => s.done).length;
      return '<button class="c" data-a="go" data-n="task" data-id="' + t.id + '" style="width:100%;text-align:right">' +
        '<div class="row"><b style="font-size:14px">' + E(t.title) + '</b>' + pill(STATUS[t.status].t, STATUS[t.status].c) + '</div>' +
        '<div class="tiny dim" style="margin:5px 0">' + hijri(t.start) + ' · ' + t12(t.start) + ' → ' + (t.endedAt ? t12(t.endedAt) : '—') + '</div>' +
        '<div class="row tiny dim2"><span>المجموعات ' + AR(t.groups.length) + '</span>' +
        '<span>الفرعية ' + AR(done) + '/' + AR(t.subs.length) + '</span></div>' +
        (t.notes.length ? '<div class="note a" style="margin-top:9px">' + icon('i-info','s16') + '<span>' + E(t.notes[t.notes.length-1].text) + '</span></div>' : '') +
      '</button>';
    }).join('') : '<div class="c center dim sm">لا توجد مهام مكتملة بعد</div>') + '</div>' + tabs();
}

/* ============================ الطلبات المعلّقة (للّيدر) ============================ */
function screenPending() {
  const ts = myTasks().filter(t => !['done','cancelled'].includes(t.status));
  const rows = [];
  ts.forEach(t => t.groups.forEach(g => { if (g.req === 'pending') rows.push({ t, g }); }));
  rows.sort((a, b) => a.t.start - b.t.start);
  return bar('طلبات بلا رد', { back: 1 }) + '<div class="view">' + ground() +
    '<div class="c gold"><div class="row"><b class="sm">طلبات لم يُرد عليها</b>' +
      pill(AR(rows.length) + ' طلب', rows.length ? 'wait' : 'live') + '</div>' +
      '<div class="tiny dim" style="margin-top:5px">تواصل مع المحسن، أو اسحب الطلب وأسنده لغيره.</div></div>' +
    (rows.length ? rows.map(({ t, g }) => {
      const u = userById(g.muhsenId);
      const left = t.start - now();
      const cls = left < 3 * HR ? 'urgent' : left < 12 * HR ? 'soon' : '';
      return '<div class="c ' + cls + '">' +
        '<div class="fl">' + avat(u) +
          '<span class="nm sp"><b>' + E(u.name) + '</b><span>' + E(u.code) + ' · ' + E(u.specialty) + '</span></span>' +
          pill('معلّق ' + ago(g.reqAt), 'wait') + '</div>' +
        '<div class="tiny dim" style="margin:9px 0 4px">' + E(t.title) + ' · مجموعة ' + AR(g.no) + '</div>' +
        '<div class="tiny dim2">' + hijri(t.start) + ' · ' + t12(t.start) + ' · تبدأ ' + untilTxt(t.start) + '</div>' +
        (left < 3 * HR ? '<div class="strip r">' + icon('i-warn','s16') +
          '<span>بقي أقل من ٣ ساعات — استبدله أو تواصل معه الآن</span></div>' : '') +
        '<div class="grid3" style="margin-top:10px">' +
          '<a class="btn l sm" href="tel:' + u.phone.replace(/[^\d]/g, '') + '">' + icon('i-phone','s16') + 'اتصال</a>' +
          '<a class="btn l sm" href="https://wa.me/' + u.phone.replace(/[^\d]/g, '') + '" target="_blank" rel="noopener">' + icon('i-send','s16') + 'واتساب</a>' +
          '<button class="btn d sm" data-a="withdraw" data-id="' + t.id + '" data-g="' + g.id + '">' + icon('i-x','s16') + 'سحب</button>' +
        '</div>' +
        '<button class="btn p sm" style="margin-top:8px" data-a="replacepick" data-id="' + t.id + '" data-g="' + g.id + '">' +
          icon('i-swap','s16') + 'سحب وإسناد لمحسن آخر</button>' +
      '</div>';
    }).join('')
      : '<div class="c center" style="padding:26px"><b>لا توجد طلبات معلّقة</b>' +
        '<div class="sm dim" style="margin-top:4px">كل الطلبات المرسلة تم الرد عليها.</div></div>') +
    '</div>' + tabs();
}

/* ============================ شاشة الطلبات — للّيدر ============================ */
function allRequests() {
  const ts = myTasks();
  const out = [];
  ts.forEach(t => {
    t.groups.forEach(g => {
      if (g.req === 'pending') out.push({ kind: 'تسكين', state: 'pending', t, g, u: userById(g.muhsenId), at: g.reqAt });
      else if (g.req === 'accepted') out.push({ kind: 'تسكين', state: 'accepted', t, g, u: userById(g.muhsenId), at: g.respAt || g.reqAt });
      if (g.swap && g.swap.state === 'pending') out.push({ kind: 'استبدال', state: 'pending', t, g, u: userById(g.muhsenId), at: g.swap.at, note: g.swap.note });
    });
    t.history.forEach(h => {
      if (h.text.indexOf('رفض') === 0 && h.text.indexOf('التسكين') > 0)
        out.push({ kind: 'تسكين', state: 'rejected', t, g: null, u: null, at: h.at, text: h.text });
    });
    if (t.delegate) out.push({ kind: 'تفويض', state: t.delegate.state, t, g: null,
      u: userById(t.delegate.muhsenId), at: t.delegate.at, note: t.delegate.keepGroup ? 'مع بقائه على مجموعته' : 'ليدر لهذه المهمة فقط' });
  });
  return out.sort((a, b) => (b.at || 0) - (a.at || 0));
}

function screenLeaderRequests() {
  const seg = S.tab.req || 'pending';
  const all = allRequests();
  const list = seg === 'all' ? all : all.filter(r => r.state === seg);
  const n = k => all.filter(r => r.state === k).length;
  const ST = { pending: ['معلّق', 'wait'], accepted: ['مقبول', 'live'], rejected: ['مرفوض', 'no'] };

  return bar('الطلبات', { right: '<button data-a="go" data-n="tasks">' + icon('i-tasks') + '</button>' }) +
    '<div class="view">' + ground() +
    '<div class="grid3">' +
      '<div class="kpi"><b style="color:#B8791A">' + AR(n('pending')) + '</b><span>بانتظار الرد</span></div>' +
      '<div class="kpi"><b>' + AR(n('accepted')) + '</b><span>مقبول</span></div>' +
      '<div class="kpi"><b style="color:#C0392B">' + AR(n('rejected')) + '</b><span>مرفوض</span></div></div>' +

    '<div class="seg">' + [['pending','المعلّقة'],['accepted','المقبولة'],['rejected','المرفوضة'],['all','الكل']].map(([k, l]) =>
      '<button class="' + (seg === k ? 'on' : '') + '" data-a="seg" data-k="req" data-v="' + k + '">' + l + '</button>').join('') + '</div>' +

    (list.length ? list.map(r => {
      const left = r.t.start - now();
      const urgent = r.state === 'pending' && left < 3 * HR;
      return '<div class="c ' + (urgent ? 'urgent' : '') + '">' +
        '<div class="fl">' + (r.u ? avat(r.u) : '<span class="eav">' + icon('i-user','s16') + '</span>') +
          '<span class="nm sp"><b>' + E(r.u ? r.u.name : 'محسن سابق') + '</b>' +
          '<span>' + E(r.kind) + (r.g ? ' · مجموعة ' + AR(r.g.no) : '') + ' · ' + ago(r.at) + '</span></span>' +
          pill(ST[r.state] ? ST[r.state][0] : r.state, ST[r.state] ? ST[r.state][1] : 'grey') + '</div>' +
        '<div class="tiny dim" style="margin:9px 0 3px">' + E(r.t.title) + '</div>' +
        '<div class="tiny dim2">' + hijri(r.t.start) + ' · ' + t12(r.t.start) + ' · تبدأ ' + untilTxt(r.t.start) + '</div>' +
        (r.note ? '<div class="note a" style="margin-top:8px">' + icon('i-edit','s16') + '<span>' + E(r.note) + '</span></div>' : '') +
        (r.text ? '<div class="note r" style="margin-top:8px">' + icon('i-xc','s16') + '<span>' + E(r.text) + '</span></div>' : '') +
        (urgent ? '<div class="strip r">' + icon('i-warn','s16') + '<span>بقي أقل من ٣ ساعات — تواصل أو استبدل</span></div>' : '') +

        (r.state === 'pending' && r.kind === 'تسكين' && r.u ?
          '<div class="grid3" style="margin-top:10px">' +
            '<a class="btn l sm" href="tel:' + r.u.phone.replace(/[^\d]/g, '') + '">' + icon('i-phone','s16') + 'اتصال</a>' +
            '<a class="btn l sm" href="https://wa.me/' + r.u.phone.replace(/[^\d]/g, '') + '" target="_blank" rel="noopener">' + icon('i-send','s16') + 'واتساب</a>' +
            '<button class="btn d sm" data-a="withdraw" data-id="' + r.t.id + '" data-g="' + r.g.id + '">' + icon('i-x','s16') + 'سحب</button></div>' +
          '<button class="btn p sm" style="margin-top:8px" data-a="replacepick" data-id="' + r.t.id + '" data-g="' + r.g.id + '">' +
            icon('i-swap','s16') + 'سحب وإسناد لمحسن آخر</button>' : '') +

        (r.state === 'accepted' && r.g ?
          '<div class="grid2" style="margin-top:10px">' +
            '<button class="btn l sm" data-a="go" data-n="task" data-id="' + r.t.id + '">' + icon('i-tasks','s16') + 'المهمة</button>' +
            '<button class="btn l sm" data-a="swap" data-id="' + r.t.id + '" data-g="' + r.g.id + '">' + icon('i-swap','s16') + 'استبدال</button></div>' : '') +

        (r.state === 'rejected' ?
          '<button class="btn p sm" style="margin-top:10px" data-a="go" data-n="assign" data-id="' + r.t.id + '">' +
            icon('i-assign','s16') + 'أسند لمحسن آخر</button>' : '') +
      '</div>';
    }).join('')
      : '<div class="c center" style="padding:26px"><b>لا توجد طلبات في هذا التصنيف</b>' +
        '<div class="sm dim" style="margin-top:6px">ابدأ التسكين من شاشة المهام.</div>' +
        '<button class="btn l sm" style="margin-top:12px" data-a="go" data-n="tasks">' + icon('i-tasks','s16') + 'فتح المهام</button></div>') +
    '</div>' + tabs();
}

/* ============================ تسلسل الإجراءات لكل مهمة ومجموعة ============================ */
function timelineFor(t, groupId) {
  const evs = [];
  t.groups.filter(g => !groupId || g.id === groupId).forEach(g => {
    const nm = g.muhsenId ? userById(g.muhsenId).name : null;
    if (g.reqAt) evs.push({ at: g.reqAt, g, ic: 'i-assign', c: 'wait',
      txt: 'أرسل القائد طلب تسكين' + (nm ? ' إلى ' + nm : '') });
    if (g.respAt) evs.push({ at: g.respAt, g, ic: g.req === 'accepted' ? 'i-checkc' : 'i-xc',
      c: g.req === 'accepted' ? 'live' : 'no',
      txt: (nm || 'المحسن') + (g.req === 'accepted' ? ' قبل الطلب' : ' رفض الطلب') + (g.respNote ? ' — «' + g.respNote + '»' : '') });
    if (g.swap) evs.push({ at: g.swap.at, g, ic: 'i-swap', c: 'blue',
      txt: 'طلب استبدال' + (g.swap.note ? ' — «' + g.swap.note + '»' : '') });
    if (g.attendedAt) evs.push({ at: g.attendedAt, g, ic: 'i-target', c: 'live',
      txt: (nm || 'المحسن') + ' أثبت حضوره' });
  });
  if (!groupId) {
    if (t.leaderAttendedAt) evs.push({ at: t.leaderAttendedAt, ic: 'i-target', c: 'live', txt: 'القائد أثبت حضوره' });
    if (t.delegate) evs.push({ at: t.delegate.at, ic: 'i-shield', c: 'gold',
      txt: 'إسناد صلاحية القيادة إلى ' + userById(t.delegate.muhsenId).name + ' — ' +
        (t.delegate.state === 'accepted' ? 'قُبل' : t.delegate.state === 'pending' ? 'بانتظار الرد' : 'رُفض') });
    if (t.startedAt) evs.push({ at: t.startedAt, ic: 'i-play', c: 'live', txt: 'بدأت المهمة — ' + userById(t.startedBy).name });
    t.subs.filter(s => s.done).forEach(s => evs.push({ at: s.at, ic: 'i-check', c: 'grey',
      txt: 'أُنجزت «' + s.name + '»' + (s.by ? ' — ' + userById(s.by).name : '') }));
    if (t.endedAt) evs.push({ at: t.endedAt, ic: 'i-stop', c: 'grey', txt: 'أُغلقت المهمة — ' + userById(t.endedBy).name });
  }
  return evs.sort((a, b) => b.at - a.at);
}

function screenTimeline() {
  const t = taskById(S.route.id); if (!t) return isLeader() ? screenTasks() : screenMyTask();
  const gid = S.tab.tl && S.tab.tl !== 'all' ? S.tab.tl : null;
  const evs = timelineFor(t, gid);
  return bar('تسلسل الإجراءات', { back: 1 }) + '<div class="view">' + ground() +
    svcCard(t) +
    '<div class="seg" style="flex-wrap:wrap">' +
      '<button class="' + (!gid ? 'on' : '') + '" data-a="seg" data-k="tl" data-v="all">الكل</button>' +
      t.groups.map(g => '<button class="' + (gid === g.id ? 'on' : '') + '" data-a="seg" data-k="tl" data-v="' + g.id + '">مجموعة ' + AR(g.no) + '</button>').join('') +
    '</div>' +
    (evs.length ? evs.map(e =>
      '<div class="c"><div class="fl" style="align-items:flex-start;gap:11px">' +
        '<span class="ico" style="width:36px;height:36px;border-radius:12px;display:grid;place-items:center;' +
          (e.c === 'no' ? 'background:#FBE9E7;color:#93261C' : e.c === 'wait' ? 'background:#FBF1DE;color:#7F5310'
            : e.c === 'gold' ? 'background:#F5EDDF;color:#6E5729' : e.c === 'blue' ? 'background:#E7EEF6;color:#2A4A73'
            : e.c === 'grey' ? 'background:#EFF1ED;color:#5A6C63' : 'background:#E4F2E9;color:#0B6540') + '">' +
          icon(e.ic, 's18') + '</span>' +
        '<span class="sp"><b class="sm" style="display:block">' + E(e.txt) + '</b>' +
        '<span class="tiny dim2">' + t12(e.at) + ' · ' + hijri(e.at) + (e.g ? ' · مجموعة ' + AR(e.g.no) : '') + '</span></span>' +
      '</div></div>').join('')
      : '<div class="c center dim sm">لا توجد إجراءات مسجّلة بعد على هذه المجموعة</div>') +
    '</div>' + tabs();
}
