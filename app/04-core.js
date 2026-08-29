/* ============================ الحالة ============================ */
const KEY = 'muhsen_app_v1';
const APP_VER = 'نسخة ١٫٨';
const SCHEMA = 15;              /* يُرفع مع كل تغيير في البنية فتُعاد التهيئة تلقائيًا */
let S = null;

const uid = (p) => p + Math.random().toString(36).slice(2, 8);
const MIN = 60000, HR = 3600000, DAY = 86400000;
const MIN_ASSIGN = 2;           /* أقل عدد محسنين للتسكين على مهمة */
const RADIUS_KM = 2;            /* نطاق إثبات الحضور */

/* ============================ الوقت ============================ */
const now = () => Date.now() + (S && S.clockOffset ? S.clockOffset : 0) * MIN;
const AR = n => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const two = n => (n < 10 ? '0' : '') + n;
const dayStart = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };

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
const greg = ts => { const d = new Date(ts); return AR(two(d.getDate()) + '/' + two(d.getMonth() + 1) + '/' + d.getFullYear()); };
const dayName = ts => ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][new Date(ts).getDay()];
const isoDate = ts => { const d = new Date(ts); return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()); };

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
  const h = Math.floor(m / 60);
  if (h < 24) return s + AR(h) + ' ساعة' + (m % 60 ? ' و' + AR(m % 60) + ' د' : '');
  const dd = Math.round(h / 24); return dd === 1 ? (d < 0 ? 'أمس' : 'غدًا') : s + AR(dd) + ' أيام';
}
function hms(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { h: two(Math.floor(s / 3600)), m: two(Math.floor(s / 60) % 60), s: two(s % 60) };
}

/* ============================ نوافذ المهمة ============================ */
const EARLY_START_H = 2;                       /* يبدأها المسؤول قبل موعدها بساعتين */
const prepOpen = t => dayStart(t.start);       /* التحضير من أول يوم المهمة */
const prepDeadline = t => t.start;             /* ينتهي التحضير ببداية المهمة */
const inPrep = t => now() >= prepOpen(t) && now() < t.start;
const earlyStartFrom = t => t.start - EARLY_START_H * HR;

/* ============================ التهيئة ============================ */
function makePilgrims(n, seedNo) {
  return Array.from({ length: Math.min(n, 14) }, (_, i) => {
    const f = (i + seedNo) % 3 === 0;
    return {
      id: uid('P'),
      name: f ? PN_F[(i * 3 + seedNo) % PN_F.length] : PN_M[(i * 5 + seedNo) % PN_M.length],
      g: f ? 'f' : 'm', av: f ? 'p' + (5 + i % 3) : 'p' + (1 + i % 4),
      pp: 'A' + (7349120 + i * 7 + seedNo * 31), room: 700 + seedNo * 20 + i,
      flag: null, note: null
    };
  });
}

function newTask(L, kind, start, code) {
  const c = CAT[kind];
  return {
    id: uid('T'), code: '#' + code, kind, title: c.ar, desc: c.desc, photo: c.photo,
    place: c.place, city: c.city, leaderId: L.id, kt: L.kt, orgId: L.orgId,
    start, end: start + c.dur * HR, durH: c.dur,
    status: 'pending_assign',
    assigned: [],
    startedAt: null, endedAt: null, startedBy: null, endedBy: null, autoStarted: false,
    leaderAttendedAt: null, leaderFarKm: 0,
    delegate: null, cancelReason: null, notes: [],
    subs: c.subs.map((n, i) => ({ id: uid('S'), no: i + 1, name: n, done: false, at: null, by: null })),
    history: [{ at: Date.now(), text: 'أُنشئت المهمة من كتالوج الأنشطة' }],
    rating: null
  };
}

function seed() {
  const st = {
    v: SCHEMA, clockOffset: 0, myPlace: 'site', session: null, route: { n: 'login' },
    tab: {}, orgs: ORGS, users: USERS, tasks: [], tickets: [], notifs: [],
    requests: [], reminders: [], pilgrims: {}, photos: [], guides: {},
    shifts: {}, attend: [], swaps: [], broadcasts: [], tabPage: 0, toast: null
  };
  S = st;   /* لتعمل الدوال المعتمِدة على S أثناء التهيئة */

  USERS.filter(u => u.role === 'leader').forEach((L, li) => {
    st.pilgrims[L.kt] = makePilgrims(L.pilgrims, li + 1);
    PLAN.forEach((p, idx) => {
      st.tasks.push(newTask(L, p.k, Date.now() + p.h * HR, 1200 + idx * 7 + li * 3));
    });
  });

  /* المهام الماضية: تُسكَّن وتُنفَّذ وتُقيَّم لتظهر أمثلة حقيقية للتقييم */
  st.tasks.filter(t => t.start < Date.now()).forEach((t, i) => {
    const team = st.users.filter(u => u.role === 'muhsen' && u.leaderId === t.leaderId);
    const take = team.slice(0, 2 + (i % 3));
    take.forEach((m, k) => {
      const late = (i + k) % 4 === 0;
      t.assigned.push({
        muhsenId: m.id, req: 'accepted', reqAt: t.start - 30 * HR, reqNote: '',
        respAt: t.start - 28 * HR, respNote: '',
        attendedAt: (i + k) % 7 === 0 ? null : t.start + (late ? 20 : -90) * MIN,
        farKm: 0.4, removed: false, removedWhy: null
      });
    });
    if (i % 3 === 1 && team[4]) t.assigned.push({
      muhsenId: team[4].id, req: 'rejected', reqAt: t.start - 30 * HR, reqNote: '',
      respAt: t.start - 29 * HR, respNote: 'مرتبط بمهمة أخرى', attendedAt: null,
      farKm: 0, removed: false, removedWhy: null
    });

    t.leaderAttendedAt = i % 5 === 0 ? null : t.start - 100 * MIN;
    t.leaderFarKm = 0.6;
    t.autoStarted = i % 4 === 0;
    t.startedAt = t.start + (t.autoStarted ? 0 : (i % 5 === 2 ? 35 : -12)) * MIN;
    t.startedBy = t.autoStarted ? 'SYSTEM' : t.leaderId;
    const doneCount = Math.max(2, t.subs.length - (i % 4));
    t.subs.forEach((s, k) => {
      if (k < doneCount) { s.done = true; s.at = t.start + (k + 1) * 18 * MIN; s.by = take[k % take.length].muhsenId; }
    });
    t.endedAt = t.end + (i % 3 === 0 ? -25 : 15) * MIN;
    t.endedBy = t.leaderId;
    t.status = 'done';
    autoNote(t);
    rateTask(t, i);
    t.history.unshift({ at: t.endedAt, text: 'أُغلقت المهمة' });
  });

  /* التذاكر — كلها تصل الليدر */
  TICKET_SEED.forEach((k, i) => {
    const lead = USERS.filter(u => u.role === 'leader')[i % 3];
    const tks = st.tasks.filter(t => t.leaderId === lead.id);
    const tk = tks[i % tks.length];
    const pls = st.pilgrims[lead.kt];
    const pl = pls[i % pls.length];
    const team = USERS.filter(u => u.role === 'muhsen' && u.leaderId === lead.id);
    const fromMuhsen = k.src === 'محسن' ? team[i % team.length] : null;
    st.tickets.push({
      id: uid('K'), no: 'TK-' + (4100 + i), title: k.t, body: k.body, cat: k.cat, src: k.src, pri: k.pri,
      leaderId: lead.id, taskId: tk.id, pilgrimId: k.src === 'حاج' ? pl.id : null,
      from: k.src === 'حاج' ? pl.name : k.src === 'محسن' ? fromMuhsen.name : 'غرفة العمليات — الكنترول',
      fromId: k.src === 'محسن' ? fromMuhsen.id : null,
      fromAv: k.src === 'حاج' ? pl.av : (fromMuhsen ? fromMuhsen.av : null),
      fromG: k.src === 'حاج' ? pl.g : (fromMuhsen ? fromMuhsen.g : null),
      at: Date.now() - k.ago * MIN, status: 'مفتوحة', assignedTo: null, replies: [], escalated: false
    });
  });

  seedPhotos(st);
  seedGuides(st);
  seedDaily(st);
  return st;
}

function load() {
  try {
    S = JSON.parse(localStorage.getItem(KEY));
    if (!S || S.v !== SCHEMA) S = seed();
  } catch (e) { S = seed(); }
  S.reminders = S.reminders || []; S.requests = S.requests || []; S.pilgrims = S.pilgrims || {};
  S.photos = S.photos || [];
  S.guides = S.guides || {};
  S.attend = S.attend || []; S.swaps = S.swaps || [];
  S.shifts = S.shifts || {}; S.broadcasts = S.broadcasts || [];
}
/* الحفظ: عند امتلاء المساحة نُسقط أقدم الصور الملتقطة ونعيد المحاولة
   — وإلا ضاعت كل البيانات بصمت عند أول صورة تتجاوز الحد. */
function save() {
  for (let i = 0; i < 8; i++) {
    try { localStorage.setItem(KEY, JSON.stringify(S)); return true; }
    catch (e) {
      const shot = (S.photos || []).map((p, k) => ({ p, k }))
        .filter(o => o.p.src.indexOf("IMG:") !== 0);
      if (!shot.length) return false;
      S.photos.splice(shot[shot.length - 1].k, 1);
      if (i === 0) toast("المساحة ممتلئة — حُذفت أقدم صورة ملتقطة", "r");
    }
  }
  return false;
}
function reset() { localStorage.removeItem(KEY); S = seed(); go('login'); toast('أُعيد ضبط كل البيانات إلى حالتها الأولى', 'g'); }

/* ============================ الأدوار ============================ */
const me = () => (S.session ? S.users.find(u => u.id === S.session.id) : null) || null;
const isLeader = () => { const u = me(); return !!u && u.role === 'leader'; };
const userById = id => S.users.find(u => u.id === id);
const orgOf = t => S.orgs.find(o => o.id === t.orgId);
const taskById = id => S.tasks.find(t => t.id === id);
const teamOf = leaderId => S.users.filter(u => u.role === 'muhsen' && u.leaderId === leaderId);
const pilgrimsOf = kt => S.pilgrims[kt] || [];
const ktCount = kt => { const L = S.users.find(u => u.kt === kt); return L ? L.pilgrims : 0; };

const slotOf = (t, id) => t.assigned.find(a => a.muhsenId === id && !a.removed);
const activeSlots = t => t.assigned.filter(a => !a.removed && a.req !== 'rejected');
const acceptedSlots = t => t.assigned.filter(a => !a.removed && a.req === 'accepted');
const pendingSlots = t => t.assigned.filter(a => !a.removed && a.req === 'pending');

function actsAsLeader(t, id) {
  if (t.leaderId === id) return true;
  return !!(t.delegate && t.delegate.muhsenId === id && t.delegate.state === 'accepted');
}
/* الليدر الذي أسند صفته يتابع ولا يقرّر — القرار للمفوَّض وحده */
function canDecide(t, id) {
  if (!actsAsLeader(t, id)) return false;
  if (t.delegate && t.delegate.state === 'accepted') return t.delegate.muhsenId === id;
  return true;
}
const watching = (t, id) => actsAsLeader(t, id) && !canDecide(t, id);
const isDelegate = (t, id) => !!(t.delegate && t.delegate.muhsenId === id && t.delegate.state === 'accepted');
const ownerOf = t => (t.delegate && t.delegate.state === 'accepted') ? t.delegate.muhsenId : t.leaderId;

/* ============================ حالة المهمة ============================ */
const STATUS = {
  pending_assign: { t: 'بانتظار التسكين', c: 'wait' },
  assigned:       { t: 'مُسكَّنة',        c: 'blue' },
  running:        { t: 'جارية',           c: 'live' },
  done:           { t: 'منتهية',          c: 'grey' },
  cancelled:      { t: 'ملغاة',           c: 'no' }
};

function recomputeStatus(t) {
  if (['done', 'cancelled', 'running'].includes(t.status)) return t.status;
  t.status = acceptedSlots(t).length >= MIN_ASSIGN ? 'assigned' : 'pending_assign';
  return t.status;
}
function canStart(t, id) {
  if (!['pending_assign', 'assigned'].includes(t.status)) return false;
  if (!actsAsLeader(t, id)) return false;
  return now() >= earlyStartFrom(t) && now() < t.start;
}
const lockedForAssign = t => now() >= t.start || ['running', 'done', 'cancelled'].includes(t.status);

/* ============================ التنبيهات ============================ */
function notify(toId, icon, title, body, route) {
  S.notifs.unshift({ id: uid('N'), to: toId, icon, title, body, at: now(), read: false, route: route || null });
  if (typeof pushBridge === 'function') { const _n = S.notifs[0];
    setTimeout(function () { pushBridge(toId, title, body, _n && _n.id); }, 0); }
}
const unread = () => S.notifs.filter(n => n.to === (S.session && S.session.id) && !n.read).length;
const myNotifs = () => S.notifs.filter(n => n.to === (S.session && S.session.id));

function hist(t, text) { t.history.unshift({ at: now(), text }); }
function note(t, text, kind) { t.notes.push({ at: now(), kind: kind || 'auto', text }); }

/* ملاحظات تلقائية تُسجَّل على المهمة */
function autoNote(t) {
  const acc = acceptedSlots(t);
  if (!acc.length) note(t, 'لم يُسكَّن أي محسن على المهمة');
  else if (acc.length < MIN_ASSIGN) note(t, 'التسكين ناقص — ' + AR(acc.length) + ' محسن فقط، والحد الأدنى ' + AR(MIN_ASSIGN));
  acc.forEach(a => {
    const nm = userById(a.muhsenId).name;
    if (!a.attendedAt) note(t, 'لم يثبت ' + nm + ' حضوره');
    else if (a.attendedAt > t.start) note(t, 'تأخر ' + nm + ' في التحضير — أثبت حضوره بعد بداية المهمة');
  });
  const own = userById(ownerOf(t));
  if (!t.leaderAttendedAt && own) note(t, 'لم يثبت ' + own.name + ' حضوره');
  if (t.autoStarted) note(t, 'بدأها النظام تلقائيًا — لم يبدأها المسؤول عنها');
  else if (t.startedAt && t.startedAt > t.start) note(t, 'بدأت متأخرة ' + AR(Math.round((t.startedAt - t.start) / MIN)) + ' دقيقة');
}

/* ============================ التقييم ============================ */
function systemScore(t) {
  const acc = acceptedSlots(t);
  let prep = 0;
  if (acc.length) {
    const good = acc.filter(a => a.attendedAt && a.attendedAt <= t.start).length;
    const half = acc.filter(a => a.attendedAt && a.attendedAt > t.start).length;
    prep = (good + half * 0.5) / acc.length;
  }
  if (acc.length < MIN_ASSIGN) prep *= 0.5;
  if (t.leaderAttendedAt && t.leaderAttendedAt <= t.start) prep = Math.min(1, prep + 0.1);

  const startScore = t.autoStarted ? 0
    : t.startedAt && t.startedAt <= t.start ? 1
    : t.startedAt ? Math.max(0, 1 - (t.startedAt - t.start) / (60 * MIN)) : 0;
  const subs = t.subs.length ? t.subs.filter(s => s.done).length / t.subs.length : 0;
  const close = !t.endedAt ? 0 : t.endedAt <= t.end ? 1
    : Math.max(0, 1 - (t.endedAt - t.end) / (60 * MIN));

  const pct = prep * 0.40 + startScore * 0.20 + subs * 0.25 + close * 0.15;
  return {
    stars: Math.max(1, Math.round(pct * 5 * 2) / 2),
    breakdown: {
      prep: Math.round(prep * 100), start: Math.round(startScore * 100),
      subs: Math.round(subs * 100), close: Math.round(close * 100), total: Math.round(pct * 100)
    }
  };
}

function rateTask(t, salt) {
  const sys = systemScore(t);
  const s = (salt == null ? (t.code.replace(/\D/g, '') | 0) : salt);
  const clamp = v => Math.max(1, Math.min(5, Math.round(v * 2) / 2));
  t.rating = {
    system: sys.stars, breakdown: sys.breakdown,
    supervisor: clamp(sys.stars + ((s % 5) - 2) * 0.5),
    pilgrims:   clamp(sys.stars + (((s + 3) % 5) - 2) * 0.5),
    supNote: SUP_NOTES[s % SUP_NOTES.length],
    pilNote: PIL_NOTES[s % PIL_NOTES.length],
    at: t.endedAt || now()
  };
  return t.rating;
}
const avgRating = r => r ? Math.round(((r.system + r.supervisor + r.pilgrims) / 3) * 10) / 10 : 0;

function personRating(id) {
  const u = userById(id); if (!u) return { avg: 0, n: 0, sys: 0, sup: 0, pil: 0 };
  const ts = S.tasks.filter(t => t.status === 'done' && t.rating &&
    (u.role === 'leader' ? t.leaderId === id : acceptedSlots(t).some(a => a.muhsenId === id)));
  if (!ts.length) return { avg: 0, n: 0, sys: 0, sup: 0, pil: 0 };
  const m = k => Math.round((ts.reduce((a, t) => a + t.rating[k], 0) / ts.length) * 10) / 10;
  const sys = m('system'), sup = m('supervisor'), pil = m('pilgrims');
  return { avg: Math.round(((sys + sup + pil) / 3) * 10) / 10, n: ts.length, sys, sup, pil };
}

function personNotes(id) {
  const u = userById(id); if (!u) return [];
  const out = [];
  S.tasks.forEach(t => (t.notes || []).forEach(n => {
    if (n.text.includes(u.name)) out.push({ at: n.at, t, text: n.text });
  }));
  return out.sort((a, b) => b.at - a.at);
}

/* ============================ سجل الطلبات ============================ */
function addReq(kind, from, to, taskId, note_) {
  const r = { id: uid('Q'), kind, from, to, taskId, note: note_ || '',
    at: now(), state: 'pending', respAt: null, respNote: '' };
  S.requests.unshift(r); return r;
}
function closeReq(taskId, toId, kind, state, note_, photoId) {
  const r = S.requests.find(x => x.taskId === taskId && x.kind === kind && x.state === 'pending' &&
    (toId ? x.to === toId : true));
  if (r) { r.state = state; r.respAt = now(); r.respNote = note_ || ''; if (photoId) r.respPhoto = photoId; }
  return r;
}
const reqTask = r => taskById(r.taskId);

/* ============================ إجراءات التسكين ============================ */
function sendRequest(t, muhsenId, note_) {
  if (lockedForAssign(t)) return false;
  const ex = t.assigned.find(a => a.muhsenId === muhsenId && !a.removed);
  if (ex && ex.req !== 'rejected') return false;
  if (ex) { ex.removed = true; ex.removedWhy = 'أُعيد الإرسال'; }
  t.assigned.push({ muhsenId, req: 'pending', reqAt: now(), reqNote: note_ || '',
    respAt: null, respNote: '', attendedAt: null, farKm: 0, removed: false, removedWhy: null });
  addReq('تسكين', t.leaderId, muhsenId, t.id, note_);
  hist(t, 'أُرسل طلب تسكين إلى ' + userById(muhsenId).name);
  notify(muhsenId, 'i-assign', 'طلب تسكين جديد',
    '«' + t.title + '» · تبدأ ' + t12(t.start) + ' ' + hijri(t.start), { n: 'requests' });
  recomputeStatus(t); return true;
}
function withdrawRequest(t, muhsenId) {
  const a = slotOf(t, muhsenId); if (!a) return;
  a.removed = true; a.removedWhy = 'سحب الليدر الطلب';
  closeReq(t.id, muhsenId, 'تسكين', 'withdrawn', 'سحبه الليدر');
  hist(t, 'سحب الليدر طلب التسكين المرسل إلى ' + userById(muhsenId).name);
  notify(muhsenId, 'i-x', 'سُحب طلب التسكين', 'سحب الليدر طلب تسكينك في «' + t.title + '».', { n: 'requests' });
  recomputeStatus(t);
}
function removeAssignee(t, muhsenId, why, excuse) {
  const a = slotOf(t, muhsenId); if (!a) return;
  a.removed = true; a.removedWhy = why || 'أزاله الليدر';
  if (excuse) a.removePhoto = attachExcuse(t.id, excuse, 'مرفق قرار الإزالة', S.session.id);
  hist(t, 'أُزيل ' + userById(muhsenId).name + ' من المهمة — ' + a.removedWhy);
  note(t, 'أُزيل ' + userById(muhsenId).name + ' من التسكين — ' + a.removedWhy);
  notify(muhsenId, 'i-xc', 'أُزلت من المهمة', '«' + t.title + '» — ' + a.removedWhy, { n: 'tasks' });
  recomputeStatus(t);
}
function respondRequest(t, muhsenId, ok, note_, excuse) {
  const a = t.assigned.find(x => x.muhsenId === muhsenId && x.req === 'pending' && !x.removed);
  if (!a) return;
  a.req = ok ? 'accepted' : 'rejected'; a.respAt = now(); a.respNote = note_ || '';
  if (excuse) a.respPhoto = attachExcuse(t.id, excuse, 'مرفق عذر — ' + userById(muhsenId).name, muhsenId);
  closeReq(t.id, muhsenId, 'تسكين', ok ? 'accepted' : 'rejected', note_, a.respPhoto);
  const nm = userById(muhsenId).name;
  hist(t, (ok ? 'قبِل ' : 'رفض ') + nm + ' التسكين' + (note_ ? ' — «' + note_ + '»' : ''));
  notify(t.leaderId, ok ? 'i-checkc' : 'i-xc', ok ? 'قبول طلب تسكين' : 'رفض طلب تسكين',
    nm + (ok ? ' قبل ' : ' رفض ') + 'التسكين على «' + t.title + '»' + (note_ ? ' — «' + note_ + '»' : ''),
    { n: 'assign', id: t.id });
  recomputeStatus(t);
  if (t.status === 'assigned') notify(t.leaderId, 'i-checkc', 'اكتمل التسكين',
    '«' + t.title + '» صار عليها ' + AR(acceptedSlots(t).length) + ' محسنين.', { n: 'task', id: t.id });
}

/* ============================ التفويض — للشركات فقط ============================ */
function sendDelegate(t, muhsenId, keepDuties) {
  t.delegate = { muhsenId, keepGroup: keepDuties, state: 'pending', at: now() };
  addReq('تفويض', t.leaderId, muhsenId, t.id, keepDuties ? 'مع الإبقاء على مهامه كمحسن' : 'ليدر لهذه المهمة فقط');
  hist(t, 'أُرسل طلب إسناد صلاحية القيادة إلى ' + userById(muhsenId).name);
  notify(muhsenId, 'i-shield', 'إسناد صلاحية القيادة',
    'أُسندت إليك قيادة «' + t.title + '».', { n: 'requests' });
}
function respondDelegate(t, ok, note_, excuse) {
  if (!t.delegate) return;
  const nm = userById(t.delegate.muhsenId).name;
  const ph = excuse ? attachExcuse(t.id, excuse, 'مرفق عذر — ' + nm, t.delegate.muhsenId) : null;
  closeReq(t.id, t.delegate.muhsenId, 'تفويض', ok ? 'accepted' : 'rejected', note_, ph);
  if (ok) {
    t.delegate.state = 'accepted'; t.delegate.respAt = now();
    if (!t.delegate.keepGroup) {
      const a = slotOf(t, t.delegate.muhsenId);
      if (a) { a.removed = true; a.removedWhy = 'تفرّغ للقيادة'; }
    }
    hist(t, 'قبِل ' + nm + ' إسناد صلاحية القيادة');
  } else { hist(t, 'رفض ' + nm + ' إسناد صلاحية القيادة' + (note_ ? ' — «' + note_ + '»' : '')); t.delegate = null; }
  notify(t.leaderId, ok ? 'i-shield' : 'i-xc', ok ? 'قبول التفويض' : 'رفض التفويض',
    nm + (ok ? ' قبل قيادة «' + t.title + '»' : ' رفض التفويض') + (note_ ? ' — «' + note_ + '»' : ''),
    { n: 'task', id: t.id });
  recomputeStatus(t);
}

/* ============================ الحضور والتنفيذ ============================ */
const myFarKm = () => (S.myPlace === 'site' ? 0.4 : S.myPlace === 'hq' ? 1.4 : 3.4);
/* التحضير لا يُقبل إلا من داخل نطاق ٢ كم من حدود الموقع */
const canAttend = t => now() >= prepOpen(t) && myFarKm() <= RADIUS_KM;
function attendBlockReason(t) {
  if (now() < prepOpen(t)) return 'يفتح التحضير من بداية يوم المهمة';
  if (myFarKm() > RADIUS_KM) return 'أنت خارج النطاق — ' + AR(myFarKm()) + ' كم، والمسموح ' + AR(RADIUS_KM) + ' كم';
  return '';
}
function attend(t, who) {
  const u = userById(who); if (!u) return false;
  const far = myFarKm();
  if (far > RADIUS_KM) return false;   /* حارس أخير: لا يُسجَّل حضور من خارج النطاق */
  if (actsAsLeader(t, who)) { t.leaderAttendedAt = now(); t.leaderFarKm = far; }
  const a = slotOf(t, who);
  if (a) { a.attendedAt = now(); a.farKm = far; }
  hist(t, 'أثبت ' + u.name + ' حضوره داخل النطاق (' + AR(far) + ' كم)');
  if (now() > t.start) note(t, 'تأخر ' + u.name + ' في التحضير — أثبت حضوره بعد بداية المهمة');
  if (!actsAsLeader(t, who)) notify(ownerOf(t), 'i-checkc', 'إثبات حضور',
    u.name + ' أثبت حضوره في «' + t.title + '».', { n: 'task', id: t.id });
  return true;
}
function startTask(t, by) {
  t.status = 'running'; t.startedAt = now(); t.startedBy = by; t.autoStarted = by === 'SYSTEM';
  hist(t, by === 'SYSTEM' ? 'بدأها النظام تلقائيًا عند حلول وقتها' : 'بدأ ' + userById(by).name + ' المهمة');
  if (by === 'SYSTEM') {
    note(t, 'بدأها النظام تلقائيًا — لم يبدأها المسؤول عنها');
    if (!acceptedSlots(t).length) note(t, 'بدأت بلا أي محسن مسكَّن');
    else if (acceptedSlots(t).length < MIN_ASSIGN) note(t, 'بدأت والتسكين ناقص — ' + AR(acceptedSlots(t).length) + ' محسن');
    notify(ownerOf(t), 'i-warn', 'بدأها النظام',
      '«' + t.title + '» حان وقتها فبدأها النظام. لم تعد تستطيع التسكين — يمكنك إغلاقها فقط.', { n: 'task', id: t.id });
  }
  acceptedSlots(t).forEach(a => notify(a.muhsenId, 'i-play', 'بدأت المهمة',
    '«' + t.title + '» بدأت — ابدأ تنفيذ المهام الفرعية.', { n: 'mytask', id: t.id }));
}
function endTask(t, by) {
  t.status = 'done'; t.endedAt = now(); t.endedBy = by;
  const diff = Math.round((t.end - t.endedAt) / MIN);
  if (diff > 0) note(t, 'انتهت قبل وقتها بـ ' + AR(diff) + ' دقيقة');
  else if (diff < 0) note(t, 'تجاوزت وقتها بـ ' + AR(-diff) + ' دقيقة');
  const undone = t.subs.filter(s => !s.done).length;
  if (undone) note(t, 'أُغلقت و' + AR(undone) + ' مهمة فرعية غير منجزة');
  autoNote(t);
  rateTask(t);
  hist(t, 'أنهى ' + userById(by).name + ' المهمة');
  acceptedSlots(t).forEach(a => notify(a.muhsenId, 'i-star', 'أُغلقت المهمة',
    '«' + t.title + '» انتهت — تقييم النظام ' + t.rating.system + ' من ٥.', { n: 'rating' }));
  notify(t.leaderId, 'i-star', 'تقييم مهمة',
    '«' + t.title + '» — النظام ' + t.rating.system + ' · المشرف ' + t.rating.supervisor + ' · الحجاج ' + t.rating.pilgrims, { n: 'rating' });
}
function cancelTask(t, by, reason, excuse) {
  t.status = 'cancelled'; t.cancelReason = reason;
  if (excuse) t.cancelPhoto = attachExcuse(t.id, excuse, 'مرفق مبرر الإلغاء', by);
  hist(t, 'ألغى ' + userById(by).name + ' المهمة — «' + reason + '»');
  acceptedSlots(t).forEach(a => notify(a.muhsenId, 'i-xc', 'أُلغيت المهمة',
    '«' + t.title + '» أُلغيت — ' + reason, { n: 'tasks' }));
}
function toggleSub(t, s, by) {
  s.done = !s.done; s.at = s.done ? now() : null; s.by = s.done ? by : null;
  hist(t, (s.done ? 'أنجز ' : 'أعاد فتح ') + userById(by).name + ' «' + s.name + '»');
  if (s.done && !actsAsLeader(t, by)) notify(ownerOf(t), 'i-check', 'إنجاز مهمة فرعية',
    userById(by).name + ' أنجز «' + s.name + '» في «' + t.title + '».', { n: 'task', id: t.id });
}

/* ============================ التذاكر (تشمل التقارير) ============================ */
function addTicket(fromId, title, body, cat, pri, taskId, pilgrimId) {
  const u = userById(fromId);
  const leaderId = u.role === 'leader' ? u.id : u.leaderId;
  const k = {
    id: uid('K'), no: 'TK-' + (4200 + S.tickets.length), title, body, cat, pri: pri || 'متوسطة',
    src: u.role === 'leader' ? 'ليدر' : 'محسن', leaderId, taskId: taskId || null, pilgrimId: pilgrimId || null,
    from: u.name, fromId, fromAv: u.av, fromG: u.g,
    at: now(), status: 'مفتوحة', assignedTo: null, replies: [], escalated: false
  };
  S.tickets.unshift(k);
  if (fromId !== leaderId) notify(leaderId, 'i-ticket', 'تذكرة جديدة', u.name + ': ' + title, { n: 'ticket', id: k.id });
  return k;
}
function ticketReply(k, byId, text, newStatus) {
  k.replies.push({ by: byId, text, at: now() });
  if (newStatus) k.status = newStatus;
  [k.assignedTo, k.leaderId, k.fromId].forEach(x => {
    if (x && x !== byId) notify(x, 'i-ticket', 'رد على تذكرة', k.title, { n: 'ticket', id: k.id });
  });
}
function ticketAssign(k, muhsenId, byId) {
  k.assignedTo = muhsenId; k.status = 'مُسندة';
  k.replies.push({ by: byId, text: 'أُسندت إلى ' + userById(muhsenId).name, at: now(), sys: true });
  notify(muhsenId, 'i-ticket', 'تذكرة أُسندت إليك', k.title, { n: 'ticket', id: k.id });
}
function ticketEscalate(k, byId, note_) {
  k.escalated = true; k.status = 'مُصعّدة';
  k.replies.push({ by: byId, text: 'صُعّدت' + (note_ ? ' — ' + note_ : ''), at: now(), sys: true });
  notify(k.leaderId, 'i-warn', 'تذكرة مُصعّدة', userById(byId).name + ': ' + k.title, { n: 'ticket', id: k.id });
}
function ticketState(k, byId, st) {
  k.status = st;
  k.replies.push({ by: byId, text: 'تغيّرت الحالة إلى «' + st + '»', at: now(), sys: true });
  [k.assignedTo, k.leaderId].forEach(x => {
    if (x && x !== byId) notify(x, 'i-ticket', 'تحديث تذكرة', k.title + ' — ' + st, { n: 'ticket', id: k.id });
  });
}

/* ============================ استعلامات ============================ */
function myTasks() {
  const u = me(); if (!u) return [];
  if (u.role === 'leader') return S.tasks.filter(t => t.leaderId === u.id).sort((a, b) => a.start - b.start);
  return S.tasks.filter(t => t.assigned.some(a => a.muhsenId === u.id) || isDelegate(t, u.id))
    .sort((a, b) => a.start - b.start);
}
/* تصنيف المهمة بالنسبة للمستخدم الحالي */
/* ============ تصنيف المهام — دروب داون موحّد، وحالة واحدة لكل مهمة ============ */
const TBUCKETS = [
  { k:'all',       l:'كل المهام', i:'i-list',   c:'grey' },
  { k:'running',   l:'جارية',     i:'i-play',   c:'live' },
  { k:'soon',      l:'اليوم',     i:'i-clock',  c:'wait' },
  { k:'next',      l:'قادمة',     i:'i-cal',    c:'blue' },
  { k:'done',      l:'منجزة',     i:'i-checkc', c:'live' },
  { k:'undone',    l:'غير منجزة', i:'i-warn',   c:'no'   },
  { k:'cancelled', l:'ملغاة',     i:'i-cancel', c:'grey' }
];
const bucketOf = k => TBUCKETS.find(b => b.k === k) || TBUCKETS[0];

/* «غير المنجزة» = ما يُدان فيه الشخص وحده، لا كل ما لم يكتمل */
function isBlamed(t, uid_) {
  const u = userById(uid_); if (!u) return false;
  if (u.role === 'muhsen') {
    const s = t.assigned.find(a => a.muhsenId === uid_);
    if (!s) return false;
    if (s.req === 'rejected') return true;
    if (s.removed) return true;
    if (t.status === 'done' && s.req === 'accepted' && !s.attendedAt) return true;
    if (t.status === 'done' && s.attendedAt && s.attendedAt > t.start) return true;
    return false;
  }
  if (t.status !== 'done') return false;
  if (!t.leaderAttendedAt) return true;
  if (t.autoStarted) return true;
  if (t.endedAt && t.endedAt > t.end + 30 * MIN) return true;
  return false;
}

function taskBucket(t, uid_) {
  if (t.status === 'cancelled') return 'cancelled';
  if (isBlamed(t, uid_)) return 'undone';
  if (t.status === 'running') return 'running';
  if (t.status === 'done') return 'done';
  if (dayStart(t.start) === dayStart(now())) return 'soon';
  return 'next';
}

function undoneReason(t, uid_) {
  const u = userById(uid_);
  if (t.status === 'cancelled') return 'أُلغيت المهمة — ' + (t.cancelReason || '');
  if (u.role === 'muhsen') {
    const s = t.assigned.find(a => a.muhsenId === uid_) || {};
    if (s.req === 'rejected') return 'رفضتَ الإسناد' + (s.respNote ? ' — «' + s.respNote + '»' : '');
    if (s.removed) return 'أُزيل إسنادك — ' + (s.removedWhy || 'بقرار من الليدر');
    if (!s.attendedAt) return 'لم تثبت حضورك في المهمة';
    if (s.attendedAt > t.start) return 'تأخرت عن التحضير — أثبت حضورك بعد بدايتها';
    return 'غير منجزة';
  }
  if (!t.leaderAttendedAt) return 'لم تثبت حضورك في المهمة';
  if (t.autoStarted) return 'بدأها النظام — لم تبدأها في وقتها';
  if (t.endedAt && t.endedAt > t.end + 30 * MIN)
    return 'تأخر الإغلاق ' + AR(Math.round((t.endedAt - t.end) / MIN)) + ' دقيقة عن وقت الانتهاء';
  return 'غير منجزة';
}

function currentTask() {
  return myTasks().filter(t => ['running', 'assigned', 'pending_assign'].includes(t.status))
    .filter(t => taskBucket(t, S.session.id) === 'current')[0] || null;
}
function myRequests() {
  const u = me(); if (!u || u.role === 'leader') return [];
  const out = [];
  S.tasks.forEach(t => {
    if (lockedForAssign(t) && t.status !== 'running') return;
    t.assigned.forEach(a => { if (a.muhsenId === u.id && a.req === 'pending' && !a.removed) out.push({ kind: 'assign', t }); });
    if (t.delegate && t.delegate.muhsenId === u.id && t.delegate.state === 'pending') out.push({ kind: 'delegate', t });
  });
  return out;
}
function myTickets() {
  const u = me(); if (!u) return [];
  if (u.role === 'leader') return S.tickets.filter(k => k.leaderId === u.id).sort((a, b) => b.at - a.at);
  return S.tickets.filter(k => k.assignedTo === u.id || k.fromId === u.id).sort((a, b) => b.at - a.at);
}
/* تعارض زمني */
function busyIn(muhsenId, t) {
  return S.tasks.find(x => x.id !== t.id && !['done', 'cancelled'].includes(x.status) &&
    x.start < t.end && t.start < x.end &&
    (x.assigned.some(a => a.muhsenId === muhsenId && !a.removed && a.req !== 'rejected') ||
     (x.delegate && x.delegate.muhsenId === muhsenId && x.delegate.state === 'accepted')));
}
/* مهام لم تُسكَّن بعد — يجب على الليدر تسكينها فورًا */
const unassignedTasks = () => myTasks().filter(t =>
  !lockedForAssign(t) && acceptedSlots(t).length < MIN_ASSIGN);

/* ============================ التنبيهات التلقائية والبدء الآلي ============================ */
function autoTick() {
  const t0 = now();
  (S.reminders || []).forEach(r => {
    if (!r.fired && t0 >= r.at) { r.fired = true; notify(r.who, 'i-bell', 'تذكير', r.text, { n: 'calendar' }); }
  });
  S.tasks.forEach(t => {
    t._f = t._f || {};
    /* البدء الآلي عند حلول الوقت */
    if (t0 >= t.start && ['pending_assign', 'assigned'].includes(t.status)) { startTask(t, 'SYSTEM'); return; }
    if (['done', 'cancelled', 'running'].includes(t.status)) return;

    const empty = acceptedSlots(t).length < MIN_ASSIGN;
    if (empty && t0 >= t.start - 7 * DAY && !t._f.w7) {
      notify(t.leaderId, 'i-clock', 'مهمة تحتاج تسكينًا',
        '«' + t.title + '» — ' + hijri(t.start) + ' وما زالت بلا تسكين مكتمل.', { n: 'assign', id: t.id });
      t._f.w7 = 1;
    }
    if (empty && t0 >= t.start - 12 * HR && !t._f.w12) {
      notify(t.leaderId, 'i-warn', 'تحذير: تسكين متأخر',
        'بقي أقل من ١٢ ساعة على «' + t.title + '» والتسكين غير مكتمل.', { n: 'assign', id: t.id });
      t._f.w12 = 1;
    }
    if (t0 >= prepOpen(t) && !t._f.prep) {
      acceptedSlots(t).forEach(a => notify(a.muhsenId, 'i-clock', 'فُتحت نافذة التحضير',
        '«' + t.title + '» تبدأ ' + t12(t.start) + ' — أثبت حضورك.', { n: 'mhome' }));
      notify(ownerOf(t), 'i-clock', 'فُتحت نافذة التحضير',
        '«' + t.title + '» تبدأ ' + t12(t.start) + ' — أثبت حضورك.', { n: 'task', id: t.id });
      t._f.prep = 1;
    }
    if (t0 >= t.start - HR && !t._f.h1) {
      acceptedSlots(t).filter(a => !a.attendedAt).forEach(a =>
        notify(a.muhsenId, 'i-warn', 'بقيت ساعة على المهمة', 'لم تثبت حضورك في «' + t.title + '».', { n: 'mhome' }));
      t._f.h1 = 1;
    }
    const pend = pendingSlots(t).length;
    if (pend && t0 >= t.start - 3 * HR && !t._f.noresp) {
      notify(t.leaderId, 'i-warn', 'طلبات بلا رد',
        AR(pend) + ' طلب لم يُرد عليه في «' + t.title + '».', { n: 'lreq' });
      t._f.noresp = 1;
    }
  });
  S.tasks.forEach(t => {
    if (t.status === 'running' && now() > t.end && !t._f.over) {
      notify(ownerOf(t), 'i-warn', 'المهمة تجاوزت وقتها',
        '«' + t.title + '» تجاوزت وقت الانتهاء ولم تُغلق.', { n: 'task', id: t.id });
      t._f.over = 1;
    }
  });
}
