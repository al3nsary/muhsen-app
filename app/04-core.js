/* ============================ الحالة ============================ */
const KEY = 'muhsen_app_v1';
const SCHEMA = 8;   /* يُرفع مع كل تغيير في بنية البيانات فتُعاد التهيئة تلقائيًا */
let S = null;

const uid = (p) => p + Math.random().toString(36).slice(2, 8);
const MIN = 60000, HR = 3600000;

function seed() {
  const base = Date.now();
  const st = {
    v: SCHEMA, clockOffset: 0, myPlace: 'site', session: null, route: { n: 'login' },
    tab: {}, orgs: ORGS, users: USERS, tasks: [], tickets: [], reports: [], notifs: [], requests: [], reminders: [], toast: null
  };

  USERS.filter(u => u.role === 'leader').forEach(L => {
    const org = ORGS.find(o => o.id === L.orgId);
    const per = Math.ceil(L.pilgrims / L.groups);
    PLAN.forEach((p, idx) => {
      const c = CAT[p.k];
      const start = base + p.h * HR;
      st.tasks.push({
        id: uid('T'), code: '#' + (1200 + idx * 7 + (L.id === 'L1' ? 0 : L.id === 'L2' ? 3 : 6)),
        kind: p.k, title: c.ar, desc: c.desc, photo: c.photo, place: c.place, city: c.city,
        leaderId: L.id, kt: L.kt, orgId: L.orgId, orgType: org.type,
        start, end: start + c.dur * HR, durH: c.dur,
        status: 'pending_assign', startedAt: null, endedAt: null, startedBy: null, endedBy: null,
        cancelReason: null, leaderAttendedAt: null, delegate: null, notes: [],
        groups: Array.from({ length: L.groups }, (_, i) => ({
          id: uid('G'), no: i + 1, pilgrims: i === L.groups - 1 ? L.pilgrims - per * (L.groups - 1) : per,
          muhsenId: null, req: null, reqAt: null, reqNote: '', respAt: null, respNote: '', attendedAt: null,
          swap: null
        })),
        subs: c.subs.map((n, i) => ({ id: uid('S'), no: i + 1, name: n, done: false, at: null, by: null })),
        history: [{ at: base, text: 'أُنشئت المهمة من كتالوج الأنشطة' }]
      });
    });
  });

  // الحجاج لكل مجموعة
  st.tasks.forEach(t => t.groups.forEach(g => {
    g.pilgrims_list = Array.from({ length: Math.min(g.pilgrims, 10) }, (_, i) => {
      const f = (i + g.no) % 3 === 0;
      const nm = f ? PN_F[(i * 3 + g.no) % PN_F.length] : PN_M[(i * 5 + g.no) % PN_M.length];
      return { id: uid('P'), name: nm, g: f ? 'f' : 'm', av: f ? 'p' + (5 + i % 3) : 'p' + (1 + i % 4),
        pp: 'A' + (7349120 + i * 7 + g.no * 31), room: 700 + g.no * 20 + i, flag: null };
    });
  }));

  // التذاكر
  const L1 = 'L1';
  TICKET_SEED.forEach((k, i) => {
    const lead = USERS.filter(u => u.role === 'leader')[i % 3];
    const tks = st.tasks.filter(t => t.leaderId === lead.id);
    const tk = tks[i % tks.length];
    const grp = tk.groups[i % tk.groups.length];
    const pl = grp.pilgrims_list[i % grp.pilgrims_list.length];
    st.tickets.push({
      id: uid('K'), no: 'TK-' + (4100 + i), title: k.t, body: k.body, src: k.src, pri: k.pri,
      leaderId: lead.id, taskId: tk.id, groupNo: grp.no,
      from: k.src === 'حاج' ? pl.name : 'غرفة العمليات — الكونترول',
      fromAv: k.src === 'حاج' ? pl.av : null, fromG: k.src === 'حاج' ? pl.g : null,
      at: base - k.ago * MIN, status: 'مفتوحة', assignedTo: null, replies: [], escalated: false
    });
  });

  return st;
}

function load() {
  try {
    S = JSON.parse(localStorage.getItem(KEY));
    if (!S || S.v !== SCHEMA) S = seed();      /* بنية قديمة → تهيئة نظيفة */
  } catch (e) { S = seed(); }
  S.reminders = S.reminders || [];
  S.requests = S.requests || [];
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function reset() { localStorage.removeItem(KEY); S = seed(); go('login'); toast('أُعيد ضبط كل البيانات إلى حالتها الأولى', 'g'); }

/* ============================ الوقت ============================ */
const now = () => Date.now() + (S.clockOffset || 0) * MIN;
const AR = n => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const two = n => (n < 10 ? '0' : '') + n;

function t12(ts) {
  const d = new Date(ts); let h = d.getHours(); const m = d.getMinutes();
  const s = h < 12 ? 'ص' : 'م'; h = h % 12 || 12;
  return AR(two(h) + ':' + two(m)) + ' ' + s;
}
function hijri(ts) {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab',
      { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ts)).replace(/\s*هـ?$/, '');
  } catch (e) { const d = new Date(ts); return AR(d.getFullYear() + '/' + two(d.getMonth() + 1) + '/' + two(d.getDate())); }
}
function greg(ts) { const d = new Date(ts); return AR(two(d.getDate()) + '/' + two(d.getMonth() + 1) + '/' + d.getFullYear()); }
function dayName(ts) { return ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][new Date(ts).getDay()]; }

function ago(ts) {
  const d = Math.max(0, now() - ts), m = Math.floor(d / MIN);
  if (m < 1) return 'الآن';
  if (m < 60) return 'قبل ' + AR(m) + ' دقيقة';
  const h = Math.floor(m / 60); if (h < 24) return 'قبل ' + AR(h) + ' ساعة';
  const dd = Math.floor(h / 24); return dd === 1 ? 'أمس' : 'قبل ' + AR(dd) + ' أيام';
}
function untilTxt(ts) {
  const d = ts - now(); const a = Math.abs(d), m = Math.floor(a / MIN);
  const s = d < 0 ? 'منذ ' : 'بعد ';
  if (m < 60) return s + AR(m) + ' دقيقة';
  const h = Math.floor(m / 60); if (h < 24) return s + AR(h) + ' ساعة' + (m % 60 ? ' و' + AR(m % 60) + ' د' : '');
  const dd = Math.round(h / 24); return dd === 1 ? (d < 0 ? 'أمس' : 'غدًا') : s + AR(dd) + ' أيام';
}
function hms(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { h: two(Math.floor(s / 3600)), m: two(Math.floor(s / 60) % 60), s: two(s % 60) };
}

/* ============================ نوافذ المهمة ============================ */
const PREP_H = 2, DEADLINE_MIN = 15, NORESP_H = 3;
const prepOpen = t => t.start - PREP_H * HR;
const prepDeadline = t => t.start - DEADLINE_MIN * MIN;
const inPrep = t => now() >= prepOpen(t) && now() < t.start;

/* الأدوار والصلاحيات */
const me = () => S.users.find(u => u.id === (S.session && S.session.id)) || null;
const isLeader = () => { const u = me(); return u && u.role === 'leader'; };
const userById = id => S.users.find(u => u.id === id);
const orgOf = t => S.orgs.find(o => o.id === t.orgId);
const taskById = id => S.tasks.find(t => t.id === id);

/* هل هذا المستخدم يقود هذه المهمة (ليدر أصلي أو مفوَّض مقبول) */
function actsAsLeader(t, uid_) {
  if (t.leaderId === uid_) return true;
  return !!(t.delegate && t.delegate.muhsenId === uid_ && t.delegate.state === 'accepted');
}
function isDelegate(t, uid_) { return !!(t.delegate && t.delegate.muhsenId === uid_ && t.delegate.state === 'accepted'); }

/* ============================ حالة المهمة ============================ */
function recomputeStatus(t) {
  if (['running', 'done', 'cancelled'].includes(t.status)) return t.status;
  const full = t.groups.every(g => g.muhsenId && g.req === 'accepted');
  if (!full) { t.status = t.groups.some(g => g.req) ? 'pending_assign' : 'pending_assign'; return t.status; }
  const allAtt = t.groups.every(g => g.attendedAt) && !!t.leaderAttendedAt;
  t.status = allAtt ? 'ready' : 'assigned';
  return t.status;
}
const STATUS = {
  pending_assign: { t: 'بانتظار التسكين', c: 'wait' },
  assigned: { t: 'مكتملة التسكين', c: 'blue' },
  ready: { t: 'جاهزة للبدء', c: 'live' },
  running: { t: 'جارية', c: 'live' },
  done: { t: 'منتهية', c: 'grey' },
  cancelled: { t: 'ملغاة', c: 'no' },
  draft: { t: 'مسودة', c: 'grey' }
};

/* ============================ التنبيهات ============================ */
function notify(toId, icon, title, body, route) {
  S.notifs.unshift({ id: uid('N'), to: toId, icon, title, body, at: now(), read: false, route: route || null });
}
const unread = () => S.notifs.filter(n => n.to === (S.session && S.session.id) && !n.read).length;
function myNotifs() { return S.notifs.filter(n => n.to === (S.session && S.session.id)); }

/* تنبيهات تلقائية تعتمد على الوقت */
function autoNotifs() {
  const t0 = now();
  (S.reminders || []).forEach(function (r) {
    if (!r.fired && t0 >= r.at) { r.fired = true;
      notify(r.who, "i-bell", "تذكير", r.text, { n: "calendar" }); }
  });
  S.tasks.forEach(t => {
    if (['done', 'cancelled'].includes(t.status)) return;
    t._flags = t._flags || {};
    // تسكين متأخر — مجموعات لم يُرسل لها طلب أصلًا
    const empty = t.groups.filter(g => !g.muhsenId).length;
    if (empty && t0 >= t.start - 12 * HR && !t._flags.late12) {
      notify(t.leaderId, 'i-clock', 'تسكين لم يبدأ',
        AR(empty) + ' مجموعة بلا محسن في «' + t.title + '» — تبدأ ' + untilTxt(t.start) + '.', { n: 'assign', id: t.id });
      t._flags.late12 = 1;
    }
    if (empty && t0 >= t.start - NORESP_H * HR && !t._flags.late3) {
      notify(t.leaderId, 'i-warn', 'تحذير: تسكين متأخر',
        'بقي أقل من ٣ ساعات على «' + t.title + '» و' + AR(empty) + ' مجموعة بلا محسن.', { n: 'assign', id: t.id });
      t._flags.late3 = 1;
    }
    if (empty && t0 >= t.start && !t._flags.late0) {
      notify(t.leaderId, 'i-warn', 'بدأ وقت المهمة والتسكين ناقص',
        '«' + t.title + '» حان وقتها و' + AR(empty) + ' مجموعة بلا محسن.', { n: 'assign', id: t.id });
      t.notes.push({ at: t0, kind: 'auto', text: 'حان وقت المهمة و' + AR(empty) + ' مجموعة بلا محسن' });
      t._flags.late0 = 1;
    }
    // عدم رد قبل ٣ ساعات
    if (t0 >= t.start - NORESP_H * HR && !t._flags.noresp) {
      const pend = t.groups.filter(g => g.muhsenId && g.req === 'pending');
      if (pend.length) {
        notify(t.leaderId, 'i-warn', 'طلبات بلا رد', AR(pend.length) + ' طلب لم يُرد عليه في «' + t.title + '» — راجعها أو اسحبها.', { n: 'assign', id: t.id });
        t._flags.noresp = 1;
      }
    }
    // فتح نافذة التحضير
    if (t0 >= prepOpen(t) && !t._flags.prep) {
      t.groups.filter(g => g.req === 'accepted').forEach(g =>
        notify(g.muhsenId, 'i-clock', 'فُتحت نافذة التحضير', '«' + t.title + '» تبدأ ' + t12(t.start) + ' — أثبت حضورك.', { n: 'mhome' }));
      notify(t.leaderId, 'i-clock', 'فُتحت نافذة التحضير', '«' + t.title + '» تبدأ ' + t12(t.start) + ' — أثبت حضورك.', { n: 'task', id: t.id });
      t._flags.prep = 1;
    }
    // انتهاء مهلة الحضور
    if (t0 >= prepDeadline(t) && !t._flags.late) {
      const miss = t.groups.filter(g => g.req === 'accepted' && !g.attendedAt);
      if (miss.length) {
        miss.forEach(g => {
          notify(t.leaderId, 'i-warn', 'تخلّف عن الحضور',
            (userById(g.muhsenId) || {}).name + ' لم يثبت حضوره في «' + t.title + '» قبل انتهاء المهلة.', { n: 'task', id: t.id });
          t.notes.push({ at: t0, kind: 'auto', text: 'لم يثبت ' + (userById(g.muhsenId) || {}).name + ' حضوره قبل انتهاء مهلة التحضير' });
        });
        t._flags.late = 1;
      }
    }
    // تجاوزت وقت الانتهاء
    if (t.status === 'running' && t0 > t.end && !t._flags.over) {
      notify(t.leaderId, 'i-warn', 'المهمة تجاوزت وقتها', '«' + t.title + '» تجاوزت وقت الانتهاء ولم تُغلق بعد.', { n: 'task', id: t.id });
      t._flags.over = 1;
    }
  });
}

/* ============================ سجل الطلبات ============================ */
function addReq(kind, from, to, taskId, groupId, note) {
  const r = { id: uid("Q"), kind, from, to, taskId, groupId: groupId || null, note: note || "",
    at: now(), state: "pending", respAt: null, respNote: "" };
  S.requests.unshift(r); return r;
}
function closeReq(taskId, groupId, kind, state, note) {
  const r = S.requests.find(x => x.taskId === taskId && x.kind === kind && x.state === "pending" &&
    (groupId ? x.groupId === groupId : true));
  if (r) { r.state = state; r.respAt = now(); r.respNote = note || ""; }
  return r;
}
const reqTask = r => taskById(r.taskId);
function reqGroupNo(r) { const t = reqTask(r); if (!t || !r.groupId) return null;
  const g = t.groups.find(x => x.id === r.groupId); return g ? g.no : null; }

/* ============================ إجراءات ============================ */
function hist(t, text) { t.history.unshift({ at: now(), text }); }

function sendRequest(t, g, muhsenId, note) {
  g.muhsenId = muhsenId; g.req = 'pending'; g.reqAt = now(); g.reqNote = note || ''; g.respAt = null; g.respNote = '';
  addReq('تسكين', t.leaderId, muhsenId, t.id, g.id, note);
  hist(t, 'أُرسل طلب تسكين إلى ' + userById(muhsenId).name + ' — مجموعة ' + AR(g.no));
  notify(muhsenId, 'i-assign', 'طلب تسكين جديد',
    '«' + t.title + '» — مجموعة ' + AR(g.no) + ' · تبدأ ' + t12(t.start), { n: 'requests' });
  recomputeStatus(t);
}
function withdrawRequest(t, g) {
  const n = userById(g.muhsenId);
  notify(g.muhsenId, 'i-x', 'سُحب طلب التسكين', 'سحب القائد طلب تسكينك في «' + t.title + '».', { n: 'requests' });
  closeReq(t.id, g.id, 'تسكين', 'withdrawn', 'سحبه القائد');
  hist(t, 'سحب القائد طلب التسكين المرسل إلى ' + n.name + ' — مجموعة ' + AR(g.no));
  g.muhsenId = null; g.req = null; g.reqAt = null; recomputeStatus(t);
}
function respondRequest(t, g, ok, note) {
  g.req = ok ? 'accepted' : 'rejected'; g.respAt = now(); g.respNote = note || '';
  closeReq(t.id, g.id, 'تسكين', ok ? 'accepted' : 'rejected', note);
  const n = userById(g.muhsenId);
  hist(t, (ok ? 'قبِل ' : 'رفض ') + n.name + ' التسكين على مجموعة ' + AR(g.no) + (note ? ' — «' + note + '»' : ''));
  notify(t.leaderId, ok ? 'i-checkc' : 'i-xc', ok ? 'قبول طلب تسكين' : 'رفض طلب تسكين',
    n.name + (ok ? ' قبل ' : ' رفض ') + 'مجموعة ' + AR(g.no) + ' في «' + t.title + '»' + (note ? ' — «' + note + '»' : ''), { n: 'assign', id: t.id });
  if (!ok) { g.muhsenId = null; g.req = null; }
  recomputeStatus(t);
  if (t.status === 'assigned') notify(t.leaderId, 'i-checkc', 'اكتمل التسكين', 'كل مجموعات «' + t.title + '» لها محسن. بانتظار إثبات الحضور.', { n: 'task', id: t.id });
}
function sendSwap(t, g, note) {
  g.swap = { at: now(), note: note || '', state: 'pending' };
  addReq('استبدال', t.leaderId, g.muhsenId, t.id, g.id, note);
  hist(t, 'أُرسل طلب استبدال إلى ' + userById(g.muhsenId).name + ' — مجموعة ' + AR(g.no));
  notify(g.muhsenId, 'i-swap', 'طلب استبدال', '«' + t.title + '» — مجموعة ' + AR(g.no) + (note ? ' · ' + note : ''), { n: 'requests' });
}
function respondSwap(t, g, ok, note) {
  const n = userById(g.muhsenId);
  g.swap.state = ok ? 'accepted' : 'rejected'; g.swap.respNote = note || '';
  closeReq(t.id, g.id, 'استبدال', ok ? 'accepted' : 'rejected', note);
  hist(t, (ok ? 'قبِل ' : 'رفض ') + n.name + ' الاستبدال — مجموعة ' + AR(g.no) + (note ? ' — «' + note + '»' : ''));
  notify(t.leaderId, ok ? 'i-checkc' : 'i-xc', ok ? 'قبول الاستبدال' : 'رفض الاستبدال',
    n.name + (ok ? ' قبل الاستبدال — المجموعة ' + AR(g.no) + ' صارت شاغرة' : ' رفض الاستبدال ويكمل مهمته') + (note ? ' — «' + note + '»' : ''), { n: 'assign', id: t.id });
  if (ok) { g.muhsenId = null; g.req = null; g.attendedAt = null; g.swap = null; }
  else { g.swap = null; }
  recomputeStatus(t);
}
function sendDelegate(t, muhsenId, keepGroup) {
  t.delegate = { muhsenId, keepGroup, state: 'pending', at: now() };
  addReq('تفويض', t.leaderId, muhsenId, t.id, null, keepGroup ? 'مع الإبقاء على مهامه كمحسن' : 'ليدر لهذه المهمة فقط');
  hist(t, 'أُرسل طلب إسناد صلاحية الليدر إلى ' + userById(muhsenId).name + (keepGroup ? ' — مع الإبقاء على مهامه كمحسن' : ' — ليدر لهذه المهمة فقط'));
  notify(muhsenId, 'i-shield', 'إسناد صلاحية الليدر',
    'أُسندت إليك صلاحية قيادة «' + t.title + '»' + (keepGroup ? ' مع بقائك على مجموعتك.' : ' وستُزال من مجموعتك.'), { n: 'requests' });
}
function respondDelegate(t, ok, note) {
  const n = userById(t.delegate.muhsenId);
  if (ok) {
    t.delegate.state = 'accepted'; t.delegate.respAt = now();
    closeReq(t.id, null, 'تفويض', 'accepted', note);
    if (!t.delegate.keepGroup) {
      const g = t.groups.find(x => x.muhsenId === t.delegate.muhsenId);
      if (g) { g.muhsenId = null; g.req = null; g.attendedAt = null;
        hist(t, 'أُزيل ' + n.name + ' من مجموعة ' + AR(g.no) + ' لتفرّغه للقيادة — المجموعة شاغرة');
        notify(t.leaderId, 'i-warn', 'مجموعة شاغرة', 'أُزيل ' + n.name + ' من مجموعته بعد قبوله التفويض — سكّن بديلًا.', { n: 'assign', id: t.id }); }
    }
    hist(t, 'قبِل ' + n.name + ' إسناد صلاحية الليدر');
  } else { closeReq(t.id, null, 'تفويض', 'rejected', note); hist(t, 'رفض ' + n.name + ' إسناد صلاحية الليدر' + (note ? ' — «' + note + '»' : '')); t.delegate = null; }
  notify(t.leaderId, ok ? 'i-shield' : 'i-xc', ok ? 'قبول التفويض' : 'رفض التفويض',
    n.name + (ok ? ' قبل صلاحية قيادة «' + t.title + '»' : ' رفض التفويض') + (note ? ' — «' + note + '»' : ''), { n: 'task', id: t.id });
  recomputeStatus(t);
}
function attend(t, who) {
  const u = userById(who);
  if (u.role === 'leader' || isDelegate(t, who)) { if (t.leaderId === who) t.leaderAttendedAt = now(); }
  const g = t.groups.find(x => x.muhsenId === who);
  if (g) g.attendedAt = now();
  if (t.leaderId === who) t.leaderAttendedAt = now();
  hist(t, 'أثبت ' + u.name + ' حضوره' + (g ? ' — مجموعة ' + AR(g.no) : ''));
  if (u.role !== 'leader') notify(t.leaderId, 'i-checkc', 'إثبات حضور', u.name + ' أثبت حضوره في «' + t.title + '».', { n: 'task', id: t.id });
  recomputeStatus(t);
  if (t.status === 'ready') notify(t.leaderId, 'i-play', 'المهمة جاهزة', '«' + t.title + '» اكتمل حضور الجميع — يمكنك البدء.', { n: 'task', id: t.id });
}
function startTask(t, by) {
  t.status = 'running'; t.startedAt = now(); t.startedBy = by;
  hist(t, 'بدأ ' + userById(by).name + ' المهمة');
  t.groups.filter(g => g.muhsenId).forEach(g =>
    notify(g.muhsenId, 'i-play', 'بدأت المهمة', '«' + t.title + '» بدأت — ابدأ تنفيذ المهام الفرعية.', { n: 'mytask', id: t.id }));
}
function endTask(t, by) {
  t.status = 'done'; t.endedAt = now(); t.endedBy = by;
  const diff = Math.round((t.end - t.endedAt) / MIN);
  if (diff > 0) t.notes.push({ at: now(), kind: 'auto', text: 'انتهت قبل وقتها بـ ' + AR(diff) + ' دقيقة' });
  else if (diff < 0) t.notes.push({ at: now(), kind: 'auto', text: 'تجاوزت وقتها بـ ' + AR(-diff) + ' دقيقة' });
  const undone = t.subs.filter(s => !s.done).length;
  if (undone) t.notes.push({ at: now(), kind: 'auto', text: 'أُغلقت و' + AR(undone) + ' مهمة فرعية غير منجزة' });
  hist(t, 'أنهى ' + userById(by).name + ' المهمة');
  t.groups.filter(g => g.muhsenId).forEach(g =>
    notify(g.muhsenId, 'i-checkc', 'أُغلقت المهمة', '«' + t.title + '» انتهت.', { n: 'completed' }));
}
function cancelTask(t, by, reason) {
  t.status = 'cancelled'; t.cancelReason = reason; hist(t, 'ألغى ' + userById(by).name + ' المهمة — «' + reason + '»');
  t.groups.filter(g => g.muhsenId).forEach(g =>
    notify(g.muhsenId, 'i-xc', 'أُلغيت المهمة', '«' + t.title + '» أُلغيت — ' + reason, { n: 'mhome' }));
}
function toggleSub(t, s, by) {
  s.done = !s.done; s.at = s.done ? now() : null; s.by = s.done ? by : null;
  hist(t, (s.done ? 'أنجز ' : 'أعاد فتح ') + userById(by).name + ' «' + s.name + '»');
  if (s.done && by !== t.leaderId) notify(t.leaderId, 'i-check', 'إنجاز مهمة فرعية', userById(by).name + ' أنجز «' + s.name + '» في «' + t.title + '».', { n: 'task', id: t.id });
}

/* تقارير */
function addReport(fromId, toId, cat, title, body, taskId, pilgrimName) {
  const r = { id: uid('R'), from: fromId, to: toId, cat, title, body, taskId: taskId || null,
    pilgrim: pilgrimName || null, at: now(), status: 'مرسل', escalated: false, replies: [] };
  S.reports.unshift(r);
  const f = userById(fromId);
  if (toId !== 'CONTROL') notify(toId, 'i-report', 'تقرير جديد', f.name + ': ' + title, { n: 'report', id: r.id });
  return r;
}
function reportReply(r, byId, text, status) {
  r.replies.push({ by: byId, text, at: now() });
  if (status) r.status = status;
  const other = r.from === byId ? r.to : r.from;
  if (other && other !== 'CONTROL')
    notify(other, 'i-report', 'رد على التقرير', userById(byId).name + ': ' + text.slice(0, 60), { n: 'report', id: r.id });
}
function reportEscalate(r, byId, note) {
  r.escalated = true; r.status = 'مُصعّد للكونترول';
  r.replies.push({ by: byId, text: 'صُعّد التقرير إلى غرفة العمليات' + (note ? ' — ' + note : ''), at: now(), sys: true });
  if (r.from !== byId) notify(r.from, 'i-warn', 'صُعّد تقريرك', 'صعّد ' + userById(byId).name + ' تقريرك «' + r.title + '» إلى الكونترول.', { n: 'report', id: r.id });
}
function reportSetStatus(r, byId, st) {
  r.status = st;
  r.replies.push({ by: byId, text: 'تغيّرت الحالة إلى «' + st + '»', at: now(), sys: true });
  const other = r.from === byId ? r.to : r.from;
  if (other && other !== 'CONTROL') notify(other, 'i-report', 'تحديث تقرير', r.title + ' — ' + st, { n: 'report', id: r.id });
}
const reportById = id => S.reports.find(r => r.id === id);

/* تذاكر */
function ticketReply(k, byId, text, newStatus) {
  k.replies.push({ by: byId, text, at: now() });
  if (newStatus) k.status = newStatus;
  if (k.assignedTo && k.assignedTo !== byId) notify(k.assignedTo, 'i-ticket', 'رد على تذكرة', k.title, { n: 'tickets' });
  if (k.leaderId !== byId) notify(k.leaderId, 'i-ticket', 'تحديث تذكرة', k.title + ' — ' + (newStatus || 'رد جديد'), { n: 'tickets' });
}
function ticketAssign(k, muhsenId, byId) {
  k.assignedTo = muhsenId; k.status = 'مُسندة';
  k.replies.push({ by: byId, text: 'أُسندت إلى ' + userById(muhsenId).name, at: now(), sys: true });
  notify(muhsenId, 'i-ticket', 'تذكرة أُسندت إليك', k.title, { n: 'tickets' });
}
function ticketEscalate(k, byId, note) {
  k.escalated = true; k.status = 'مُصعّدة';
  k.replies.push({ by: byId, text: 'صُعّدت إلى القائد' + (note ? ' — ' + note : ''), at: now(), sys: true });
  notify(k.leaderId, 'i-warn', 'تذكرة مُصعّدة', userById(byId).name + ' صعّد: ' + k.title, { n: 'tickets' });
}

/* ============================ استعلامات ============================ */
function myTasks() {
  const u = me(); if (!u) return [];
  if (u.role === 'leader') return S.tasks.filter(t => t.leaderId === u.id).sort((a, b) => a.start - b.start);
  return S.tasks.filter(t => t.groups.some(g => g.muhsenId === u.id && g.req === 'accepted') || isDelegate(t, u.id))
    .sort((a, b) => a.start - b.start);
}
function myGroup(t) { const u = me(); return t.groups.find(g => g.muhsenId === u.id); }
function currentTask() {
  const list = myTasks().filter(t => !['done', 'cancelled'].includes(t.status));
  return list[0] || null;
}
function myRequests() {
  const u = me(); if (!u || u.role === 'leader') return [];
  const out = [];
  S.tasks.forEach(t => {
    t.groups.forEach(g => {
      if (g.muhsenId === u.id && g.req === 'pending') out.push({ kind: 'assign', t, g });
      if (g.muhsenId === u.id && g.swap && g.swap.state === 'pending') out.push({ kind: 'swap', t, g });
    });
    if (t.delegate && t.delegate.muhsenId === u.id && t.delegate.state === 'pending') out.push({ kind: 'delegate', t });
  });
  return out;
}
function myTickets() {
  const u = me(); if (!u) return [];
  if (u.role === 'leader') return S.tickets.filter(k => k.leaderId === u.id).sort((a, b) => b.at - a.at);
  return S.tickets.filter(k => k.assignedTo === u.id).sort((a, b) => b.at - a.at);
}
function teamOf(leaderId) { return S.users.filter(u => u.role === 'muhsen' && u.leaderId === leaderId); }

/* تعارض: هل المحسن مشغول في مهمة متداخلة زمنيًا */
function busyIn(muhsenId, t) {
  return S.tasks.find(x => x.id !== t.id && !['done', 'cancelled'].includes(x.status) &&
    x.start < t.end && t.start < x.end &&
    (x.groups.some(g => g.muhsenId === muhsenId && g.req !== 'rejected') ||
     (x.delegate && x.delegate.muhsenId === muhsenId && x.delegate.state === 'accepted')));
}
