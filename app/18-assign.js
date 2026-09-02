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
  replacing: ['بانتظار البديل',    'wait'],
  replaced:  ['مستبدل',            'grey'],
  standin:   ['بديل',              'live']
};
function slotState(a) {
  if (a.out) return a.out.kind;
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

/* استبعاد لعدم الحاجة — بإقرار مسؤولية */
function excludeNoNeed(t, muhsenId, why) {
  if (!canAssign(t, S.session.id)) return false;
  if (lockedForAssign(t) || !reqWindowOpen(t)) return false;
  const a = t.assigned.find(x => x.muhsenId === muhsenId && onTask(x));
  if (!a) return false;
  a.out = { kind: 'excluded', why: why || 'عدم الحاجة', by: S.session.id, at: now(), owned: true };
  const nm = userById(muhsenId).name;
  hist(t, 'استبعد ' + me().name + ' ' + nm + ' لعدم الحاجة — «' + a.out.why + '»');
  note(t, 'استُبعد ' + nm + ' لعدم الحاجة بقرار الليدر ومسؤوليته — ' + a.out.why);
  notify(muhsenId, 'i-xc', 'استُبعدت من مهمة',
    '«' + t.title + '» — ' + a.out.why, { n: 'task', id: t.id });
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
function slotCard(t, a, canAct) {
  const m = userById(a.muhsenId); if (!m) return '';
  const st = slotState(a), lab = slotLabel(a);
  const ph = String(m.phone || '').replace(/[^0-9]/g, '');
  const canReq = canAct && reqWindowOpen(t) && !lockedForAssign(t);
  return '<div class="c slot s-' + st + '">' +
    '<div class="fl">' + avat(m) +
      '<span class="nm sp"><b>' + E(m.name) + '</b><span>' + E(m.code) + ' · ' + E(m.specialty) +
        (a.bySupport ? ' · دعم من الكنترول'
          : a.standin ? ' · بديل عن ' + E(((userById(a.forId) || {}).name || '').split(' ')[0]) : '') +
        '</span></span>' +
      pill(lab[0], lab[1]) + '</div>' +

    (a.req === 'pending' ? '<div class="strip a" style="margin-top:9px">' + reqCountdown(t, a) + '</div>' : '') +
    (a.attendedAt ? '<div class="strip a" style="margin-top:9px">' + icon('i-check','s16') +
      '<span>أثبت حضوره ' + t12(a.attendedAt) + '</span></div>' : '') +
    (a.out ? '<div class="note ' + (a.out.kind === 'excluded' ? 'r' : 'a') + '" style="margin-top:9px">' +
      icon('i-info','s16') + '<span>' +
      (a.out.kind === 'replaced' ? 'استُبدل بـ ' + E(a.out.byName || '') : SLOT_STATE[a.out.kind][0]) +
      ' — ' + E(a.out.why) + '</span></div>' : '') +
    (a.repl && a.repl.state === 'pending' ? '<div class="note a" style="margin-top:9px">' + icon('i-swap','s16') +
      '<span><b>بانتظار قبول ' + E((userById(a.repl.toId) || {}).name) + '</b><br>' +
      'يبقى على المهمة حتى يقبل البديل. ' + E(replCountdown(t, a)) + '</span></div>' : '') +
    (a.repl && a.repl.state === 'rejected' ? '<div class="note r" style="margin-top:9px">' + icon('i-xc','s16') +
      '<span>اعتذر ' + E((userById(a.repl.toId) || {}).name || 'البديل') + ' — بقي على المهمة' +
      (a.repl.respNote ? ' · ' + E(a.repl.respNote) : '') + '. يمكنك طلب بديل آخر.</span></div>' : '') +
    (a.repl && a.repl.state === 'expired' ? '<div class="note a" style="margin-top:9px">' + icon('i-clock','s16') +
      '<span>لم يُرد على طلب الاستبدال خلال المهلة — بقي على المهمة، ويمكنك طلب بديل آخر.</span></div>' : '') +
    (a.respNote && a.req === 'rejected' ? '<div class="note r" style="margin-top:9px">' + icon('i-info','s16') +
      '<span>' + E(a.respNote) + '</span></div>' : '') +
    (a.wd && a.wd.state === 'pending' ? '<div class="note a" style="margin-top:9px">' + icon('i-out','s16') +
      '<span><b>طلب انسحاب</b> — ' + E(a.wd.reason) + '</span></div>' +
      (canAct ? '<div class="grid2" style="margin-top:9px">' +
        '<button class="btn d sm" data-a="wdno" data-id="' + t.id + '" data-u="' + m.id + '">رفض</button>' +
        '<button class="btn p sm" data-a="wdok" data-id="' + t.id + '" data-u="' + m.id + '">اعتماد الانسحاب</button></div>' : '') : '') +

    (canReq && onTask(a) && !a.repl && !a.wd ?
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
    '<div class="field" style="margin:8px 0"><input id="exwhy" maxlength="140" placeholder="سبب مختصر — إلزامي"></div>' +
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
