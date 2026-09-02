/* ============================ التسكين: حالات لا حذف ============================ */
/* لا يخرج محسن من المهمة أبدًا — تتغيّر حالته فقط، وتبقى أمام الليدر والكنترول.
   والمحسن لا يرى إلا إجراءه هو. */

/* نافذة الطلبات: مفتوحة من الآن، وتُغلق قبل المهمة بـ ١٢ ساعة. وعمر الطلب ٤ ساعات.
   بعد إغلاقها لا يبقى للّيدر إلا طلب الدعم من الكنترول. */
const REQ_CLOSE_H = 12, REQ_TTL_H = 4;
/* طلب الدعم من الكنترول: آخر أبواب التسكين — يُغلق قبل المهمة بـ ٨ ساعات */
const SUPPORT_CLOSE_H = 8;
const supportCloseAt = t => t.start - SUPPORT_CLOSE_H * HR;
const supportOpen = t => now() < supportCloseAt(t) && !lockedForAssign(t);
function supportWhy(t) {
  if (lockedForAssign(t)) return 'المهمة بدأت — لا تغيير في التسكين';
  if (now() >= supportCloseAt(t))
    return 'أُغلق طلب الدعم — لم يبقَ على المهمة إلا ' +
      untilTxt(t.start).replace('بعد ', '') + '، والحد الأدنى ' + AR(SUPPORT_CLOSE_H) + ' ساعات';
  return '';
}
/* كل تغيير في التسكين — تسكين واستبدال واستبعاد ودعم — لليدر الأصيل وحده:
   لا للمحسن، ولا لمن أُسندت إليه صفة الليدر على المهمة */
const canAssign = (t, id) => canDecide(t, id) && !isDelegate(t, id);
const reqCloseAt = t => t.start - REQ_CLOSE_H * HR;
/* مفتوحة ما دام يفصلنا عن المهمة أكثر من ١٢ ساعة */
const reqWindowOpen = t => now() < reqCloseAt(t);
function reqWindowWhy(t) {
  if (now() >= reqCloseAt(t))
    return 'أُغلقت الطلبات — لم يبقَ على المهمة إلا ' + untilTxt(t.start).replace('بعد ', '') +
      '، والحد الأدنى ' + AR(REQ_CLOSE_H) + ' ساعة';
  return '';
}

/* حالة المحسن على المهمة */
const SLOT_STATE = {
  active:    ['على المهمة',        'live'],
  pending:   ['بانتظار ردّه',      'wait'],
  declined:  ['اعتذر',             'no'],
  expired:   ['انتهت مهلة الطلب',  'grey'],
  withdrawn: ['منسحب بموافقة',     'grey'],
  excluded:  ['مستبعد',            'no'],
  excluding: ['طلب استبعاد',       'wait'],
  replacing: ['بانتظار البديل',    'wait'],
  replaced:  ['مستبدل',            'grey'],
  standin:   ['بديل',              'live']
};
function slotState(a) {
  if (a.out) return a.out.kind;
  if (a.ex && a.ex.state === 'pending') return 'excluding';
  if (a.repl && a.repl.state === 'pending') return 'replacing';
  if (a.req === 'pending') return 'pending';
  if (a.req === 'rejected') return 'declined';
  if (a.req === 'expired') return 'expired';
  if (a.standin) return 'standin';
  return 'active';
}
/* من يُحتسب فعلًا على المهمة */
const onTask = a => !a.out && a.req === 'accepted';
/* متاح للتسكين: من لا صفَّ له قائمًا — ومن اعتذر أو انقضت مهلته يعود متاحًا */
const freeForTask = (t, id) => !t.assigned.some(a =>
  a.muhsenId === id && !a.out && (a.req === 'accepted' || a.req === 'pending'));
/* مهلة الطلب المعلّق: أربع ساعات أو إغلاق النافذة — أيّهما أقرب */
const reqDeadline = (t, a) => Math.min((a.reqAt || now()) + REQ_TTL_H * HR, reqCloseAt(t));
function exCountdown(a) {
  const dl = (a.ex && a.ex.deadline) || 0;
  if (!dl) return '';
  const left = dl - now();
  if (left <= 0) return 'انقضت المهلة';
  const h = Math.floor(left / HR), m = Math.floor((left % HR) / MIN);
  return 'يتبقّى ' + (h ? AR(h) + ' س ' : '') + AR(m) + ' د للرد';
}
function replCountdown(t, a) {
  const dl = (a.repl && a.repl.deadline) || 0;
  const left = dl - now();
  if (!dl) return '';
  if (left <= 0) return 'انقضت المهلة.';
  const h = Math.floor(left / HR), m = Math.floor((left % HR) / MIN);
  return 'يتبقّى ' + (h ? AR(h) + ' س ' : '') + AR(m) + ' د.';
}
function reqCountdown(t, a) {
  if (a.req !== 'pending') return '';
  const left = reqDeadline(t, a) - now();
  if (left <= 0) return '<span class="cdown out">انقضت المهلة</span>';
  const h = Math.floor(left / HR), m = Math.floor((left % HR) / MIN);
  return '<span class="cdown' + (left < HR ? ' hot' : '') + '">' + icon('i-clock','s14') +
    'يتبقّى ' + (h ? AR(h) + ' س ' : '') + AR(m) + ' د للرد</span>';
}
const slotLabel = a => {
  const s = slotState(a), d = SLOT_STATE[s] || ['—', 'grey'];
  if (s === 'replaced' && a.out && a.out.byName) return ['مستبدل بـ ' + a.out.byName, 'grey'];
  return d;
};

/* ---------- الاستبعاد: استبدال أو عدم حاجة ---------- */
const EXCLUDE_KINDS = {
  swap: { l: 'استبدال بمحسن آخر', d: 'يبقى على المهمة حتى يقبل البديل' },
  none: { l: 'عدم الحاجة',        d: 'العدد المتبقي يكفي — وتتحمّل مسؤولية النتيجة' }
};

/* طلب استبدال: لا يخرج الأول حتى يقبل الثاني */
function requestReplace(t, outId, inId, why) {
  if (!canAssign(t, S.session.id)) return false;
  if (isReserve(inId)) return false;   /* الاحتياط يُسنده الكنترول وحده */
  if (lockedForAssign(t) || !reqWindowOpen(t)) return false;   /* لا تسكين بعد القفل */
  const a = t.assigned.find(x => x.muhsenId === outId && onTask(x));
  /* يُمنع طلب ثانٍ ما دام الأول معلّقًا فقط — أما المرفوض والمنتهي فيُعاد بعدهما */
  if (!a || (a.repl && a.repl.state === 'pending')) return false;
  a.tries = (a.tries || 0) + 1;
  const inU = userById(inId), outU = userById(outId);
  if (!inU || !outU) return false;
  /* أي بديل سابق اعتذر أو انقضت مهلته يُنحّى من القائمة حتى لا تتكدّس الصفوف */
  t.assigned = t.assigned.filter(x => !(x.standin && x.forId === outId && x.req !== 'accepted'));
  a.repl = { toId: inId, state: 'pending', at: now(), why: why || '', deadline: now() + REQ_TTL_H * HR };
  /* البديل يدخل بحالة «بانتظار ردّه» ولا يُحتسب إلا بعد القبول */
  t.assigned.push({
    muhsenId: inId, req: 'pending', standin: true, forId: outId,
    reqAt: now(), reqNote: 'بديلًا عن ' + outU.name, respAt: null, respNote: '',
    attendedAt: null, farKm: 0
  });
  addReq('استبدال', t.leaderId, inId, t.id, 'بديلًا عن ' + outU.name + (why ? ' — ' + why : ''));
  histReq(t, 'طلب استبدال ' + outU.name + ' بـ ' + inU.name + (why ? ' — «' + why + '»' : ''));
  notify(inId, 'i-swap', 'طلب حلول مكان زميل',
    'يُطلب حلولك مكان ' + outU.name + ' في «' + t.title + '».', { n: 'requests' });
  notify(outId, 'i-info', 'طلب استبدالك',
    'طُلب استبدالك في «' + t.title + '» — تبقى على المهمة حتى يقبل البديل.', { n: 'task', id: t.id });
  return true;
}
function respondReplace(t, inId, ok, note_) {
  const b = t.assigned.find(x => x.muhsenId === inId && x.standin && x.req === 'pending');
  if (!b) return false;
  const a = t.assigned.find(x => x.muhsenId === b.forId && x.repl && x.repl.state === 'pending');
  const inU = userById(inId), outU = userById(b.forId);
  closeReq(t.id, inId, 'استبدال', ok ? 'accepted' : 'rejected', note_);
  b.respAt = now(); b.respNote = note_ || '';
  if (ok) {
    b.req = 'accepted';
    if (a) {
      a.repl.state = 'accepted'; a.repl.respAt = now();
      a.out = { kind: 'replaced', why: a.repl.why || 'استبدال', by: t.leaderId,
        byId: inId, byName: inU.name, at: now() };
    }
    hist(t, 'قبِل ' + inU.name + ' الحلول مكان ' + outU.name);
    note(t, 'استُبدل ' + outU.name + ' بـ ' + inU.name + (a && a.repl.why ? ' — ' + a.repl.why : ''));
    notify(outU.id, 'i-swap', 'اكتمل استبدالك',
      'حلّ ' + inU.name + ' مكانك في «' + t.title + '».', { n: 'tasks' });
    notify(t.leaderId, 'i-checkc', 'قبول الاستبدال',
      inU.name + ' حلّ مكان ' + outU.name + ' في «' + t.title + '».', { n: 'task', id: t.id });
  } else {
    b.req = 'rejected';
    if (a) { a.repl.state = 'rejected'; a.repl.respAt = now(); a.repl.respNote = note_ || ''; }
    hist(t, 'رفض ' + inU.name + ' الحلول مكان ' + outU.name + (note_ ? ' — «' + note_ + '»' : ''));
    notify(t.leaderId, 'i-xc', 'رفض الاستبدال',
      inU.name + ' اعتذر — يبقى ' + outU.name + ' على المهمة.', { n: 'task', id: t.id });
    notify(outU.id, 'i-checkc', 'أُلغي استبدالك',
      'اعتذر البديل — تبقى على «' + t.title + '».', { n: 'task', id: t.id });
  }
  recomputeStatus(t);
  return true;
}

/* طلب استبعاد لعدم الحاجة — لا ينفذ إلا بموافقة صاحبه */
function excludeNoNeed(t, muhsenId, why) {
  if (!canAssign(t, S.session.id)) return false;
  if (lockedForAssign(t) || !reqWindowOpen(t)) return false;
  const a = t.assigned.find(x => x.muhsenId === muhsenId && onTask(x));
  if (!a || (a.ex && a.ex.state === 'pending') || (a.repl && a.repl.state === 'pending')) return false;
  a.ex = { state: 'pending', why: reasonOr(why), by: S.session.id, at: now(),
    deadline: Math.min(now() + REQ_TTL_H * HR, reqCloseAt(t)) };
  const nm = userById(muhsenId).name;
  addReq('استبعاد', S.session.id, muhsenId, t.id, a.ex.why);
  histReq(t, 'رفع ' + me().name + ' طلب استبعاد ' + nm + ' — «' + a.ex.why + '»');
  notify(muhsenId, 'i-xc', 'طلب استبعاد من مهمة',
    '«' + t.title + '»', { n: 'requests' });
  recomputeStatus(t);
  return true;
}

/* رد المحسن: يقبل فيخرج، أو يرفض فيبقى ويُسجَّل رفضه بوقتيه */
function respondExclude(t, muhsenId, ok, note_) {
  const a = t.assigned.find(x => x.muhsenId === muhsenId && x.ex && x.ex.state === 'pending');
  if (!a) return false;
  const nm = (userById(muhsenId) || {}).name || '';
  const askedAt = a.ex.at;
  a.ex.state = ok ? 'accepted' : 'rejected';
  a.ex.respAt = now(); a.ex.respNote = note_ ? String(note_).trim() : '';
  closeReq(t.id, muhsenId, 'استبعاد', ok ? 'accepted' : 'rejected', a.ex.respNote);
  if (ok) {
    a.out = { kind: 'excluded', why: a.ex.why, by: a.ex.by, at: now(), owned: true };
    hist(t, 'قبِل ' + nm + ' الاستبعاد من المهمة — ' + a.ex.why);
    note(t, 'استُبعد ' + nm + ' بموافقته — ' + a.ex.why);
    notify(t.leaderId, 'i-checkc', 'قبول الاستبعاد',
      nm + ' — «' + t.title + '»', { n: 'task', id: t.id });
  } else {
    hist(t, 'رفض ' + nm + ' الاستبعاد من المهمة ' + t12(now()) + ' — وقُدّم الطلب ' + t12(askedAt) +
      (a.ex.respNote ? ' — «' + a.ex.respNote + '»' : ''));
    notify(t.leaderId, 'i-xc', 'رفض الاستبعاد',
      nm + ' — «' + t.title + '»', { n: 'task', id: t.id });
  }
  recomputeStatus(t);
  return true;
}

/* الانسحاب: يبقى على المهمة وتتغيّر حالته */
function markWithdrawn(t, muhsenId) {
  const a = t.assigned.find(x => x.muhsenId === muhsenId);
  if (!a) return;
  a.out = { kind: 'withdrawn', why: (a.wd && a.wd.reason) || 'انسحاب معتمد', by: t.leaderId, at: now() };
}

/* ---------- انتهاء مهلة الطلبات ---------- */
function expireRequests(t) {
  let n = 0;
  /* طلبات الاستبعاد لها مهلتها — وانقضاؤها يُبقي صاحبها على المهمة */
  t.assigned.forEach(a => {
    if (!a.ex || a.ex.state !== 'pending') return;
    if (now() < a.ex.deadline) return;
    a.ex.state = 'expired'; a.ex.respAt = now();
    const nm2 = (userById(a.muhsenId) || {}).name || '';
    closeReq(t.id, a.muhsenId, 'استبعاد', 'expired', 'انتهت مهلة الرد');
    hist(t, 'قُدّم طلب استبعاد ' + nm2 + ' ' + t12(a.ex.at) + ' ولم يُرد عليه — بقي على المهمة');
    notify(t.leaderId, 'i-clock', 'انتهت مهلة الاستبعاد',
      nm2 + ' — «' + t.title + '»', { n: 'task', id: t.id });
    n++;
  });
  t.assigned.forEach(a => {
    if (a.req !== 'pending') return;
    const dead = Math.min(a.reqAt + REQ_TTL_H * HR, reqCloseAt(t));
    if (now() < dead) return;
    a.req = 'expired'; a.respAt = now();
    a.respNote = 'انتهت مهلة الرد (' + AR(REQ_TTL_H) + ' ساعات)';
    if (a.standin) {
      const src = t.assigned.find(x => x.muhsenId === a.forId && x.repl && x.repl.state === 'pending');
      if (src) {
        src.repl.state = 'expired'; src.repl.respAt = now();
        /* الأول يبقى على المهمة كما كان — ولم يتغيّر شيء في حالته */
        const on = userById(src.muhsenId);
        hist(t, 'قُدّم طلب استبدال ' + (on ? on.name : '') + ' ولم يُرد عليه — بقي على المهمة');
        notify(t.leaderId, 'i-clock', 'انتهت مهلة الاستبدال',
          '«' + t.title + '» — يمكنك طلب بديل آخر.', { n: 'task', id: t.id });
      }
    }
    closeReq(t.id, a.muhsenId, a.standin ? 'استبدال' : 'تسكين', 'expired', a.respNote);
    const nm = (userById(a.muhsenId) || {}).name || '';
    histReq(t, 'انتهت مهلة طلب ' + nm + ' بلا رد');
    notify(t.leaderId, 'i-clock', 'انتهت مهلة طلب',
      'لم يردّ ' + nm + ' على «' + t.title + '» خلال ' + AR(REQ_TTL_H) + ' ساعات.', { n: 'task', id: t.id });
    notify(a.muhsenId, 'i-clock', 'انتهت مهلة طلبك',
      'انقضت مهلة الرد على «' + t.title + '».', { n: 'tasks' });
    n++;
  });
  if (n) recomputeStatus(t);
  return n;
}

/* ---------- طلب دعم من الكنترول ---------- */
/* الليدر لا يعرف الفريق الاحتياطي ولا يختار منه — يطلب دعمًا، والكنترول يلبّي ويوضّح */
const SUPPORT_STATE = { pending:['لدى الكنترول','wait'], done:['لُبّي','live'], denied:['غير متاح','no'] };
function requestSupport(t, count, why) {
  if (!canAssign(t, S.session.id)) return null;   /* المحسن لا يطلب دعمًا */
  if (!supportOpen(t)) return null;
  S.support = S.support || [];
  const s = {
    id: uid('SP'), no: 'SP-' + AR(7100 + S.support.length),
    taskId: t.id, by: S.session.id, count: count, why: why,
    at: now(), state: 'pending', log: [{ at: now(), text: 'رفع ' + me().name + ' طلب دعم — ' + why }]
  };
  S.support.unshift(s);
  hist(t, 'طلب دعم من الكنترول: ' + AR(count) + ' محسن — «' + why + '»');
  notify(t.leaderId, 'i-send', 'وصل طلب الدعم للكنترول',
    'طلبك على «' + t.title + '» قيد الدراسة لدى غرفة العمليات.', { n: 'task', id: t.id });
  return s;
}
/* استجابة الكنترول — تُحاكى بزر في شاشة التحكم */
function controlAnswerSupport(s, ok, reason) {
  const t = taskById(s.taskId); if (!t) return;
  s.state = ok ? 'done' : 'denied';
  s.at2 = now(); s.reason = reason;
  if (ok) {
    const pool = S.users.filter(u => u.role === 'muhsen' && u.reserve &&
      !t.assigned.some(a => a.muhsenId === u.id) && !busyIn(u.id, t));
    const take = pool.slice(0, s.count);
    take.forEach(m => {
      t.assigned.push({
        muhsenId: m.id, req: 'accepted', bySupport: true,
        reqAt: now(), reqNote: 'دعم من الكنترول', respAt: now(), respNote: '',
        attendedAt: null, farKm: 0
      });
      hist(t, 'أسند الكنترول ' + m.name + ' دعمًا للمهمة');
    });
    s.assigned = take.map(m => m.id);
    s.log.push({ at: now(), text: 'لبّى الكنترول الطلب بـ ' + AR(take.length) + ' محسن — ' + reason });
    notify(t.leaderId, 'i-checkc', 'لُبّي طلب الدعم',
      'أسند الكنترول ' + AR(take.length) + ' محسن للمهمة — ' + reason, { n: 'task', id: t.id });
    take.forEach(m => notify(m.id, 'i-assign', 'أُسندت إليك مهمة دعمًا',
      '«' + t.title + '» — بقرار غرفة العمليات.', { n: 'task', id: t.id }));
  } else {
    s.log.push({ at: now(), text: 'اعتذر الكنترول — ' + reason });
    notify(t.leaderId, 'i-xc', 'تعذّر تلبية طلب الدعم', reason, { n: 'task', id: t.id });
  }
  recomputeStatus(t);
}
const taskSupport = tid => (S.support || []).filter(s => s.taskId === tid);
const openSupport = tid => taskSupport(tid).filter(s => s.state === 'pending');

/* ---------- بطاقة محسن داخل المهمة (للّيدر والكنترول) ---------- */
/* ---------- كل محسن بطاقة واحدة تُطوى وتُفتح، وفيها سجل حركاته ---------- */

/* كل صفوف الشخص على المهمة — قد يكون له صفٌّ خرج منه وآخر عاد به */
const personRows = (t, id) => t.assigned.filter(a => a.muhsenId === id);

/* الصف المعتمد للعرض: القائم إن وُجد، وإلا آخر صفوفه */
function primaryRow(t, id) {
  const rows = personRows(t, id);
  return rows.find(a => !a.out && a.req !== 'rejected' && a.req !== 'expired') ||
    rows[rows.length - 1];
}

/* هل اتُّخذ عليه إجراء؟ — من اتُّخذ عليه شيء يُعرض أسفل القائمة */
function slotTouched(t, id) {
  return personRows(t, id).some(a =>
    a.out || a.ex || a.repl || a.wd || a.req === 'rejected' || a.req === 'expired');
}

/* آخر وقت وقع فيه إجراء عليه — لترتيب المتَّخَذ عليهم بينهم */
function lastActionAt(t, id) {
  let m = 0;
  personRows(t, id).forEach(a => {
    [a.reqAt, a.respAt, a.attendedAt, a.out && a.out.at,
     a.ex && a.ex.at, a.ex && a.ex.respAt,
     a.repl && a.repl.at, a.repl && a.repl.respAt,
     a.wd && a.wd.at, a.wd && a.wd.respAt].forEach(x => { if (x && x > m) m = x; });
  });
  return m;
}

/* أمرٌ ينتظر قرار الليدر على هذا المحسن */
function slotNeedsAct(t, id) {
  return personRows(t, id).some(a => a.wd && a.wd.state === 'pending');
}

/* ترتيب العرض: من لم يُمسّ أولًا بترتيب تسكينهم، ثم من اتُّخذ عليه إجراء */
function slotPeople(t) {
  const seen = [];
  t.assigned.forEach(a => { if (seen.indexOf(a.muhsenId) < 0) seen.push(a.muhsenId); });
  const rank = id => (slotTouched(t, id) ? 1 : 0);
  return seen.slice().sort((x, y) => {
    const rx = rank(x), ry = rank(y);
    if (rx !== ry) return rx - ry;
    if (rx === 0) {
      const ax = primaryRow(t, x) || {}, ay = primaryRow(t, y) || {};
      return (ax.reqAt || 0) - (ay.reqAt || 0);
    }
    return lastActionAt(t, x) - lastActionAt(t, y);
  });
}

/* سجل حركات المحسن على هذه المهمة — مرتّبًا بوقته */
function slotEvents(t, id) {
  const ev = [];
  const add = (at, ic, text, state) => { if (at) ev.push({ at, ic, text, state }); };
  personRows(t, id).forEach(a => {
    const forU = a.forId ? (userById(a.forId) || {}).name : '';
    if (a.bySupport) add(a.reqAt, 'i-shield', 'أسنده الكنترول دعمًا للمهمة', 'على المهمة');
    else if (a.standin) add(a.reqAt, 'i-swap', 'طُلب حلوله مكان ' + E(forU), 'بانتظار ردّه');
    else if (a.auto) add(a.reqAt, 'i-assign', 'سُكِّن تلقائيًّا على المهمة', 'على المهمة');
    else add(a.reqAt, 'i-assign', 'أُرسل إليه طلب تسكين', 'بانتظار ردّه');

    if (a.req === 'accepted' && a.respAt && !a.auto && !a.bySupport)
      add(a.respAt, 'i-checkc', a.standin ? 'قبِل الحلول مكان ' + E(forU) : 'قبِل التسكين', 'على المهمة');
    if (a.req === 'rejected')
      add(a.respAt, 'i-xc', (a.standin ? 'اعتذر عن الحلول' : 'رفض التسكين') +
        (a.respNote ? ' — «' + E(a.respNote) + '»' : ''), 'اعتذر');
    if (a.req === 'expired')
      add(a.respAt, 'i-clock', 'انقضت مهلة ردّه على الطلب', 'انتهت مهلة الطلب');

    if (a.attendedAt) add(a.attendedAt, 'i-target', 'أثبت حضوره', 'حاضر');

    if (a.ex) {
      add(a.ex.at, 'i-xc', 'طُلب استبعاده — ' + E(reasonOr(a.ex.why)), 'طلب استبعاد');
      if (a.ex.state === 'accepted') add(a.ex.respAt, 'i-checkc', 'وافق على الاستبعاد', 'مستبعد');
      if (a.ex.state === 'rejected')
        add(a.ex.respAt, 'i-xc', 'رفض الاستبعاد' +
          (a.ex.respNote ? ' — «' + E(a.ex.respNote) + '»' : '') + ' — وبقي على المهمة', 'على المهمة');
      if (a.ex.state === 'expired')
        add(a.ex.respAt, 'i-clock', 'لم يُرد على طلب الاستبعاد — وبقي على المهمة', 'على المهمة');
    }
    if (a.repl) {
      const toU = (userById(a.repl.toId) || {}).name || '';
      add(a.repl.at, 'i-swap', 'طُلب استبداله بـ ' + E(toU) +
        (a.repl.why ? ' — ' + E(a.repl.why) : ''), 'بانتظار البديل');
      if (a.repl.state === 'accepted')
        add(a.repl.respAt, 'i-swap', 'قبِل ' + E(toU) + ' الحلول مكانه', 'مستبدل بـ ' + E(toU));
      if (a.repl.state === 'rejected')
        add(a.repl.respAt, 'i-xc', 'اعتذر ' + E(toU) + ' — وبقي على المهمة', 'على المهمة');
      if (a.repl.state === 'expired')
        add(a.repl.respAt, 'i-clock', 'لم يُرد البديل خلال المهلة — وبقي على المهمة', 'على المهمة');
    }
    if (a.wd) {
      add(a.wd.at, 'i-out', 'طلب الانسحاب — ' + E(reasonOr(a.wd.reason)), 'طلب انسحاب');
      if (a.wd.state === 'accepted') add(a.wd.respAt, 'i-checkc', 'اعتمد الليدر انسحابه', 'منسحب بموافقة');
      if (a.wd.state === 'rejected') add(a.wd.respAt, 'i-xc', 'رفض الليدر الانسحاب — وبقي على المهمة', 'على المهمة');
    }
    if (a.out && a.out.kind === 'excluded' && !(a.ex && a.ex.state === 'accepted'))
      add(a.out.at, 'i-xc', 'استُبعد من المهمة — ' + E(reasonOr(a.out.why)), 'مستبعد');
  });
  return ev.sort((x, y) => x.at - y.at);
}

function slotTimeline(t, id) {
  const ev = slotEvents(t, id);
  if (!ev.length) return '<div class="tiny dim2">لا توجد حركات مسجّلة.</div>';
  return '<div class="tline">' + ev.map(e =>
    '<div class="ti"><span class="d"></span>' +
    '<span class="tiny"><b>' + e.text + '</b>' +
    (e.state ? ' <span class="stg">' + E(e.state) + '</span>' : '') +
    '<br><span class="dim2">' + hijri(e.at) + ' · ' + t12(e.at) + '</span></span></div>').join('') + '</div>';
}

function slotCard(t, a, canAct) {
  const m = userById(a.muhsenId); if (!m) return '';
  const st = slotState(a), lab = slotLabel(a);
  const ph = String(m.phone || '').replace(/[^0-9]/g, '');
  const canReq = canAct && reqWindowOpen(t) && !lockedForAssign(t);
  const key = 's:' + m.id;
  const open = !!(S.open && S.open[t.id + ':' + key]);
  const need = slotNeedsAct(t, m.id);
  const n = slotEvents(t, m.id).length;

  const head = '<button class="slothead" data-a="fold" data-id="' + t.id + '" data-v="' + key + '">' +
    avat(m) +
    '<span class="nm sp"><b>' + E(m.name) + '</b><span>' + E(m.code) + ' · ' + E(m.specialty) +
      (a.bySupport ? ' · دعم من الكنترول'
        : a.standin ? ' · بديل عن ' + E(((userById(a.forId) || {}).name || '').split(' ')[0]) : '') +
      '</span></span>' +
    (need && !open ? pill('يحتاج قرارك', 'no') : '') +
    pill(lab[0], lab[1]) +
    '<span class="xp">' + icon('i-down','s16') + '</span></button>';

  if (!open) {
    /* مطويّة: الاسم وحالته وعدد حركاته لا أكثر */
    return '<div class="c slot s-' + st + '">' + head +
      '<div class="row tiny dim2" style="margin-top:7px">' +
        '<span>' + AR(n) + ' حركة على المهمة</span>' +
        (a.attendedAt ? '<span style="color:var(--live)">حاضر ' + t12(a.attendedAt) + '</span>'
          : a.req === 'pending' ? '<span style="color:var(--amber)">بانتظار ردّه</span>' : '<span>—</span>') +
      '</div></div>';
  }

  return '<div class="c slot s-' + st + ' on">' + head +

    '<div class="slog"><div class="row tiny dim2" style="margin-bottom:7px">' +
      '<span>سجل حركاته على المهمة</span><b>' + AR(n) + '</b></div>' +
      slotTimeline(t, m.id) + '</div>' +

    (a.req === 'pending' ? '<div class="strip a" style="margin-top:9px">' + reqCountdown(t, a) + '</div>' : '') +
    (a.out ? '<div class="note ' + (a.out.kind === 'excluded' ? 'r' : 'a') + '" style="margin-top:9px">' +
      icon('i-info','s16') + '<span>' +
      (a.out.kind === 'replaced' ? 'استُبدل بـ ' + E(a.out.byName || '') : SLOT_STATE[a.out.kind][0]) +
      ' — ' + E(reasonOr(a.out.why)) + '</span></div>' : '') +
    (a.ex && a.ex.state === 'pending' ? '<div class="note a" style="margin-top:9px">' + icon('i-xc','s16') +
      '<span><b>طلب استبعاد بانتظار رده</b><br>' + E(a.ex.why) + ' · ' + E(exCountdown(a)) +
      '<br>يبقى على المهمة حتى يوافق.</span></div>' : '') +
    (a.repl && a.repl.state === 'pending' ? '<div class="note a" style="margin-top:9px">' + icon('i-swap','s16') +
      '<span><b>بانتظار قبول ' + E((userById(a.repl.toId) || {}).name) + '</b><br>' +
      'يبقى على المهمة حتى يقبل البديل. ' + E(replCountdown(t, a)) + '</span></div>' : '') +
    (a.wd && a.wd.state === 'pending' ? '<div class="note a" style="margin-top:9px">' + icon('i-out','s16') +
      '<span><b>طلب انسحاب</b> — ' + E(reasonOr(a.wd.reason)) + '</span></div>' +
      (canAct ? '<div class="grid2" style="margin-top:9px">' +
        '<button class="btn d sm" data-a="wdno" data-id="' + t.id + '" data-u="' + m.id + '">رفض</button>' +
        '<button class="btn p sm" data-a="wdok" data-id="' + t.id + '" data-u="' + m.id + '">اعتماد الانسحاب</button></div>' : '') : '') +

    (canReq && onTask(a) && !(a.repl && a.repl.state === 'pending') &&
      !(a.ex && a.ex.state === 'pending') && !a.wd ?
      '<div class="grid3" style="margin-top:10px">' +
        (ph ? '<a class="btn l sm" href="tel:' + ph + '">' + icon('i-phone','s16') + 'اتصال</a>' : '') +
        '<button class="btn l sm" data-a="exclude" data-id="' + t.id + '" data-u="' + m.id + '">' +
          icon('i-swap','s16') + 'استبعاد</button>' +
      '</div>' : '') +
    (canReq && a.req === 'pending' ?
      '<button class="btn d sm" style="margin-top:9px" data-a="withdraw" data-id="' + t.id + '" data-u="' + m.id + '">' +
        icon('i-x','s16') + 'سحب الطلب</button>' : '') +
  '</div>';
}


/* ---------- ورقة الاستبعاد ---------- */
function excludeSheet(t, muhsenId) {
  const m = userById(muhsenId);
  const kind = S.exKind || 'swap';
  /* من فريق الليدر وحده — والاحتياط يُسنده الكنترول.
     ومن اعتذر عن استبدال سابق يعود مرشّحًا. */
  const cands = teamOf(t.leaderId).filter(x =>
    x.id !== muhsenId && freeForTask(t, x.id) && !busyIn(x.id, t));
  const pick = S.exTo && cands.some(c => c.id === S.exTo) ? S.exTo : (cands[0] || {}).id;
  return '<div class="grip"></div><h3>استبعاد من المهمة</h3>' +
    '<div class="tiny dim2" style="margin-bottom:10px">' + E(m.name) + ' · ' + E(t.title) + '</div>' +
    '<div class="lbl plain">السبب</div>' +
    '<div class="col" style="gap:7px;margin:8px 0">' + Object.keys(EXCLUDE_KINDS).map(k =>
      '<button class="listitem' + (k === kind ? ' on' : '') + '" data-a="exkind" data-v="' + k + '">' +
        '<span class="ico">' + icon(k === 'swap' ? 'i-swap' : 'i-x', 's18') + '</span>' +
        '<span class="sp"><b style="font-size:13.5px;display:block">' + EXCLUDE_KINDS[k].l + '</b>' +
        '<span class="tiny dim2">' + EXCLUDE_KINDS[k].d + '</span></span>' +
        (k === kind ? icon('i-check','s16') : '') + '</button>').join('') + '</div>' +

    (kind === 'swap'
      ? (cands.length
        ? '<div class="lbl plain">البديل من فريقك</div>' +
          '<div class="col" style="gap:6px;max-height:34vh;overflow:auto;margin:8px 0">' + cands.map(c =>
            '<button class="listitem' + (c.id === pick ? ' on' : '') + '" data-a="exto" data-v="' + c.id + '">' +
              avat(c, 'sm') + '<span class="sp"><b style="font-size:13px;display:block">' + E(c.name) + '</b>' +
              '<span class="tiny dim2">' + E(c.specialty) + '</span></span>' +
              (c.id === pick ? icon('i-check','s16') : '') + '</button>').join('') + '</div>' +
          '<div class="note a">' + icon('i-info','s16') +
            '<span>يبقى ' + E(m.name.split(' ')[0]) + ' على المهمة حتى يقبل البديل. وإن اعتذر، يبقى ولا يُستبعد.</span></div>'
        : '<div class="note r">' + icon('i-warn','s16') +
          '<span>لا يوجد بديل متاح من فريقك — اطلب دعمًا من الكنترول.</span></div>')
      : '<div class="note r">' + icon('i-warn','s16') +
        '<span><b>إقرار مسؤولية</b><br>باستبعاده لعدم الحاجة تتحمّل مسؤولية ما ينتج عن نقص العدد في هذه المهمة.</span></div>') +

    '<div class="lbl plain">ملاحظة</div>' +
    '<div class="field" style="margin:8px 0"><input id="exwhy" maxlength="140" placeholder="سبب مختصر — اختياري"></div>' +
    '<div class="grid2" style="margin-top:12px">' +
      '<button class="btn g" data-a="close">تراجع</button>' +
      (kind === 'swap' && !cands.length
        ? (supportOpen(t)
          ? '<button class="btn p" data-a="supportsheet" data-id="' + t.id + '">طلب دعم من الكنترول</button>'
          : '<button class="btn p off" disabled>' + E(supportWhy(t)) + '</button>')
        : '<button class="btn p" data-a="doexclude" data-id="' + t.id + '" data-u="' + muhsenId + '">' +
          (kind === 'swap' ? 'إرسال طلب الاستبدال' : 'استبعاد وأتحمّل المسؤولية') + '</button>') +
    '</div>';
}

/* ---------- ورقة طلب الدعم ---------- */
function supportSheet(t) {
  const n = S.spCount || 1;
  return '<div class="grip"></div><h3>طلب دعم من الكنترول</h3>' +
    '<div class="tiny dim2" style="margin-bottom:10px">' + E(t.title) + ' · ' + hijri(t.start) + '</div>' +
    '<div class="note b">' + icon('i-info','s16') +
      '<span>غرفة العمليات هي من تختار المحسنين وتسند الدعم — وتوضّح سبب قرارها.</span></div>' +
    '<div class="lbl plain" style="margin-top:12px">العدد المطلوب</div>' +
    '<div class="grid3" style="margin:8px 0">' + [1, 2, 3].map(k =>
      '<button class="btn ' + (k === n ? 'p' : 'l') + ' sm" data-a="spcount" data-v="' + k + '">' +
        AR(k) + ' محسن</button>').join('') + '</div>' +
    '<div class="lbl plain">سبب الطلب</div>' +
    '<div class="field" style="margin:8px 0"><input id="spwhy" maxlength="160" placeholder="لماذا تحتاج دعمًا؟"></div>' +
    '<div class="grid2" style="margin-top:12px">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" data-a="dosupport" data-id="' + t.id + '">رفع الطلب</button></div>';
}

/* ---------- بطاقة طلب الدعم داخل المهمة ---------- */
function supportCard(s) {
  const st = SUPPORT_STATE[s.state] || ['—', 'grey'];
  return '<div class="c"><div class="row"><span class="fl" style="gap:7px">' + icon('i-send','s16') +
    '<b class="sm">طلب دعم · ' + E(s.no) + '</b></span>' + pill(st[0], st[1]) + '</div>' +
    '<div class="sm dim" style="margin:8px 0">' + AR(s.count) + ' محسن · ' + E(s.why) + '</div>' +
    (s.reason ? '<div class="note ' + (s.state === 'done' ? 'g' : 'r') + '">' + icon('i-info','s16') +
      '<span>رد الكنترول: ' + E(s.reason) + '</span></div>' : '') +
    '<div class="tline" style="margin-top:9px">' + s.log.map(x =>
      '<div class="ti"><span class="d"></span><span class="tiny"><b>' + E(x.text) + '</b><br>' +
      '<span class="dim2">' + t12(x.at) + ' · ' + hijri(x.at) + '</span></span></div>').join('') + '</div></div>';
}
