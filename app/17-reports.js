/* ============================ التقارير — منفصلة عن التذاكر ============================ */
/* المحسن يرفع تقريره إلى ليدره، والليدر يرفع إلى الكنترول أو يُصعّد ما وصله */

function addReport(fromId, toId, cat, title, body, taskId, pilgrimName) {
  const r = {
    id: uid('R'), no: 'RP-' + AR(5200 + S.reports.length),
    from: fromId, to: toId, cat, title, body, taskId: taskId || null,
    pilgrim: pilgrimName || null, at: now(), status: 'مرسل', escalated: false, replies: []
  };
  S.reports.unshift(r);
  const f = userById(fromId);
  if (toId !== 'CONTROL') notify(toId, 'i-report', 'تقرير جديد',
    (f ? f.name : '') + ': ' + title, { n: 'report', id: r.id });
  return r;
}
function reportReply(r, byId, text, status) {
  r.replies.push({ by: byId, text, at: now() });
  if (status) r.status = status;
  const other = r.from === byId ? r.to : r.from;
  if (other && other !== 'CONTROL')
    notify(other, 'i-report', 'رد على التقرير',
      userById(byId).name + ': ' + text.slice(0, 60), { n: 'report', id: r.id });
}
function reportEscalate(r, byId, note_) {
  r.escalated = true; r.status = 'مُصعّد للكنترول';
  r.replies.push({ by: byId, text: 'صُعّد التقرير إلى غرفة العمليات' + (note_ ? ' — ' + note_ : ''), at: now(), sys: true });
  if (r.from !== byId) notify(r.from, 'i-warn', 'صُعّد تقريرك',
    'صعّد ' + userById(byId).name + ' تقريرك «' + r.title + '» إلى الكنترول.', { n: 'report', id: r.id });
}
function reportSetStatus(r, byId, st) {
  r.status = st;
  r.replies.push({ by: byId, text: 'تغيّرت الحالة إلى «' + st + '»', at: now(), sys: true });
  const other = r.from === byId ? r.to : r.from;
  if (other && other !== 'CONTROL') notify(other, 'i-report', 'تحديث تقرير',
    r.title + ' — ' + st, { n: 'report', id: r.id });
}
const reportById = id => S.reports.find(r => r.id === id);
const myReports = () => {
  const u = me(); if (!u) return [];
  return S.reports.filter(r => r.from === u.id || r.to === u.id);
};
const openReports = () => myReports().filter(r => r.status !== 'مغلق').length;
const rStateColor = r => r.status === 'مغلق' ? 'live' : r.escalated ? 'no' : 'wait';

/* ---------- قائمة التقارير ---------- */
function reportsPane() {
  const u = me(), L = isLeader();
  const sent = S.reports.filter(r => r.from === u.id);
  const got = S.reports.filter(r => r.to === u.id);
  const seg = S.tab.rep || (L ? 'in' : 'out');
  const list = (seg === 'out' ? sent : got).slice().sort((a, b) => b.at - a.at);

  return '<button class="btn p" data-a="report">' + icon('i-flag','s16') +
      (L ? 'رفع تقرير إلى الكنترول' : 'رفع تقرير إلى الليدر') + '</button>' +
    (L ? '<div class="seg">' +
      '<button class="' + (seg === 'in' ? 'on' : '') + '" data-a="seg" data-k="rep" data-v="in">واردة من المحسنين<i>' +
        AR(got.length) + '</i></button>' +
      '<button class="' + (seg === 'out' ? 'on' : '') + '" data-a="seg" data-k="rep" data-v="out">مرفوعة للكنترول<i>' +
        AR(sent.length) + '</i></button></div>' : '') +
    (list.length ? list.map(r => reportRow(r, seg)).join('')
      : '<div class="c center" style="padding:28px"><b>لا توجد تقارير</b>' +
        '<div class="sm dim" style="margin-top:6px">' +
        (L ? 'ما يرفعه محسنوك يظهر هنا، وما ترفعه للكنترول في التبويب الآخر.'
           : 'ارفع تقريرًا لليدرك عند أي حالة تحتاج قرارًا.') + '</div></div>');
}

function reportRow(r, seg) {
  const t = r.taskId ? taskById(r.taskId) : null;
  const who = seg === 'out'
    ? 'إلى ' + (r.to === 'CONTROL' ? 'الكنترول' : (userById(r.to) || {}).name)
    : 'من ' + ((userById(r.from) || {}).name || '');
  return '<button class="c" data-a="go" data-n="report" data-id="' + r.id + '" style="width:100%;text-align:right">' +
    '<div class="row"><b class="sm sp">' + E(r.title) + '</b>' + pill(r.cat, 'gold') + '</div>' +
    '<div class="sm dim" style="margin:7px 0;line-height:1.8">' + E(r.body) + '</div>' +
    (r.pilgrim ? '<div class="tiny dim2">بخصوص الحاج: ' + E(r.pilgrim) + '</div>' : '') +
    '<div class="row tiny dim2" style="margin-top:6px"><span>' + E(who) + ' · ' + E(r.no) + '</span>' +
      '<span>' + ago(r.at) + '</span></div>' +
    '<div class="fl" style="gap:6px;margin-top:8px;flex-wrap:wrap">' +
      pill(r.status, rStateColor(r)) +
      (r.replies.length ? pill(AR(r.replies.length) + ' رد', 'grey') : '') +
      (t ? pill(t.title, 'blue') : '') + '</div></button>';
}

/* ---------- تفاصيل التقرير ---------- */
function screenReport() {
  const r = reportById(S.route.id); if (!r) return screenDesk();
  const u = me(), L = isLeader();
  const mine = r.from === u.id;
  const t = r.taskId ? taskById(r.taskId) : null;
  const closed = r.status === 'مغلق';
  const from = userById(r.from) || { name: '', role: 'muhsen' };

  return bar('تفاصيل التقرير', { back: 1 }) + '<div class="view">' + ground() +
    '<div class="c gold"><div class="row"><b style="font-size:15px" class="sp">' + E(r.title) + '</b>' +
      pill(r.cat, 'gold') + '</div>' +
      '<div class="fl" style="margin:11px 0">' + avat(from) +
        '<span class="nm sp"><b class="sm" style="display:block">' + E(from.name) + '</b>' +
        '<span class="tiny dim2">' + (from.role === 'leader' ? 'محسن ليدر' : 'مُحسن') + ' · ' + ago(r.at) + '</span></span>' +
        pill(r.status, rStateColor(r)) + '</div>' +
      '<div class="sm" style="background:#F8F6F0;border-radius:13px;padding:12px;line-height:1.9">' + E(r.body || '—') + '</div>' +
      (r.pilgrim ? '<div class="tiny dim2" style="margin-top:8px">بخصوص الحاج: <b>' + E(r.pilgrim) + '</b></div>' : '') +
      '<div class="tiny dim2" style="margin-top:6px">' + E(r.no) + ' · إلى ' +
        (r.to === 'CONTROL' ? 'غرفة العمليات — الكنترول' : E((userById(r.to) || {}).name)) + '</div>' +
      (t ? '<button class="btn l sm" style="margin-top:10px" data-a="go" data-n="task" data-id="' + t.id + '">' +
        icon('i-tasks','s16') + 'فتح المهمة: ' + E(t.title) + '</button>' : '') + '</div>' +

    (r.replies.length ? '<div class="lbl">المتابعة<small>' + AR(r.replies.length) + '</small></div>' +
      r.replies.map(x => '<div class="c" style="' + (x.sys ? 'background:#F4F6F3' : '') + '">' +
        '<div class="fl" style="gap:8px;margin-bottom:6px">' +
        (x.sys ? icon('i-info','s16') : avat(userById(x.by) || from, 'sm')) +
        '<b class="tiny">' + E(x.sys ? 'النظام' : (userById(x.by) || {}).name) + '</b>' +
        '<span class="tiny dim2 sp" style="text-align:left">' + ago(x.at) + '</span></div>' +
        '<div class="sm" style="line-height:1.9">' + E(x.text) + '</div></div>').join('') : '') +

    (!closed ? '<div class="lbl">إجراء</div>' +
      '<button class="btn p" data-a="rreply" data-id="' + r.id + '">' + icon('i-send','s16') +
        (mine ? 'إضافة متابعة' : 'رد على ' + E(from.name.split(' ')[0])) + '</button>' +
      (L && !mine && !r.escalated ? '<button class="btn l" data-a="resc" data-id="' + r.id + '">' +
        icon('i-warn','s16') + 'تصعيد إلى الكنترول</button>' : '') +
      '<div class="grid2">' +
        '<button class="btn l sm" data-a="rstate" data-id="' + r.id + '">' + icon('i-list','s16') + 'تغيير الحالة</button>' +
        '<button class="btn g sm" data-a="rclose" data-id="' + r.id + '">' + icon('i-checkc','s16') + 'إغلاق</button></div>'
      : '<div class="note g">' + icon('i-checkc','s16') + '<span>التقرير مغلق.</span></div>' +
        '<button class="btn l" data-a="rreopen" data-id="' + r.id + '">إعادة فتح</button>') +
    '</div>' + tabs();
}

/* ---------- أوراق ---------- */
function reportSheet(taskId) {
  const L = isLeader(), tasks = myTasks();
  return '<div class="grip"></div><h3>رفع تقرير</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">' +
      (L ? 'يُرفع إلى غرفة العمليات — الكنترول' : 'يُرفع إلى ليدر فريقك') + '</div>' +
    '<div class="lbl plain">التصنيف</div>' +
    '<div class="field" style="margin:8px 0"><select id="rc">' +
      RCATS.map(c => '<option>' + c + '</option>').join('') + '</select></div>' +
    '<div class="lbl plain">المهمة</div>' +
    '<div class="field" style="margin:8px 0"><select id="rt"><option value="">بدون ربط بمهمة</option>' +
      tasks.map(t => '<option value="' + t.id + '"' + (t.id === taskId ? ' selected' : '') + '>' +
        E(t.title) + ' — ' + hijri(t.start) + '</option>').join('') + '</select></div>' +
    '<div class="lbl plain">العنوان</div>' +
    '<div class="field" style="margin:8px 0"><input id="rti" maxlength="70" placeholder="عنوان مختصر يصف الحالة"></div>' +
    '<div class="lbl plain">التفاصيل</div>' +
    '<div class="field" style="margin:8px 0"><input id="rb" maxlength="300" placeholder="اشرح ما حدث وما تحتاجه"></div>' +
    '<div class="grid2" style="margin-top:12px">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" data-a="sendreport">رفع التقرير</button></div>';
}

function reportStateSheet(r) {
  return '<div class="grip"></div><h3>حالة التقرير</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">' + E(r.title) + '</div>' +
    '<div class="col" style="gap:7px">' + RSTATES.map(o =>
      '<button class="listitem' + (r.status === o ? ' on' : '') + '" data-a="dorstate" data-id="' + r.id + '" data-v="' + o + '">' +
        '<span class="ico">' + icon(o === 'مغلق' ? 'i-checkc' : o === 'مُصعّد للكنترول' ? 'i-warn' : 'i-list', 's18') + '</span>' +
        '<span class="sp"><b style="font-size:13.5px;display:block">' + o + '</b></span>' +
        (r.status === o ? icon('i-check','s16') : '') + '</button>').join('') + '</div>' +
    '<button class="btn g" style="margin-top:12px" data-a="close">إغلاق</button>';
}

/* ---------- الشاشة المدمجة: التذاكر والتقارير ---------- */
function screenDesk() {
  const seg = S.tab.desk || 'tk';
  const openTk = myTickets().filter(k => k.status !== 'مغلقة').length;
  return bar('التذاكر والتقارير', { right: '<button data-a="' + (seg === 'tk' ? 'newticket' : 'report') +
      '" aria-label="جديد">' + icon('i-plus') + '</button>' }) +
    '<div class="view">' + ground() +
    '<div class="seg big">' +
      '<button class="' + (seg === 'tk' ? 'on' : '') + '" data-a="seg" data-k="desk" data-v="tk">' +
        icon('i-ticket','s16') + 'التذاكر' + (openTk ? '<i>' + AR(openTk) + '</i>' : '') + '</button>' +
      '<button class="' + (seg === 'rp' ? 'on' : '') + '" data-a="seg" data-k="desk" data-v="rp">' +
        icon('i-flag','s16') + 'التقارير' + (openReports() ? '<i>' + AR(openReports()) + '</i>' : '') + '</button>' +
    '</div>' +
    '<div class="note b">' + icon('i-info','s16') + '<span>' +
      (seg === 'tk'
        ? 'التذاكر ترد إليك من الحجاج والكنترول والمحسنين — تُسند وتُتابع وتُغلق.'
        : 'التقارير ترفعها أنت: المحسن إلى ليدره، والليدر إلى الكنترول.') + '</span></div>' +
    (seg === 'tk' ? ticketsPane() : reportsPane()) +
    '</div>' + tabs();
}

/* ---------- بذر التقارير ---------- */
function seedReports(st) {
  st.reports = [];
  const leaders = st.users.filter(u => u.role === 'leader');
  REPORT_SEED.forEach((r, i) => {
    const L = leaders[i % leaders.length];
    const team = st.users.filter(u => u.role === 'muhsen' && u.leaderId === L.id);
    const tks = st.tasks.filter(t => t.leaderId === L.id);
    const t = tks[i % tks.length];
    const from = r.up ? L.id : team[i % team.length].id;
    const to = r.up ? 'CONTROL' : L.id;
    const rep = {
      id: uid('R'), no: 'RP-' + AR(5200 + i), from, to, cat: r.cat, title: r.t, body: r.b,
      taskId: t ? t.id : null, pilgrim: null, at: Date.now() - r.ago * MIN,
      status: i % 4 === 0 ? 'قيد المعالجة' : i === 5 ? 'مغلق' : 'مرسل',
      escalated: i === 3, replies: []
    };
    if (i % 4 === 0) rep.replies.push({ by: to === 'CONTROL' ? L.id : L.id,
      text: 'استلمتُ التقرير، وجارٍ التنسيق مع الجهة المعنية.', at: rep.at + 25 * MIN });
    if (i === 3) rep.replies.push({ by: L.id, text: 'صُعّد التقرير إلى غرفة العمليات', at: rep.at + 40 * MIN, sys: true });
    if (i === 5) rep.replies.push({ by: L.id, text: 'تغيّرت الحالة إلى «مغلق»', at: rep.at + 90 * MIN, sys: true });
    st.reports.push(rep);
  });
  st.reports.sort((a, b) => b.at - a.at);
}
