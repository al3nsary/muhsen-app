/* ============================ تفاصيل المهمة (الليدر / المفوَّض) ============================ */
function screenTask() {
  const t = taskById(S.route.id); if (!t) return screenTasks();
  recomputeStatus(t);
  const u = me(), lead = actsAsLeader(t, u.id), deleg = isDelegate(t, u.id);
  const org = orgOf(t), isCo = org.type === 'شركة';
  const ok = t.groups.filter(g => g.req === 'accepted').length;
  const att = t.groups.filter(g => g.attendedAt).length;
  const doneSubs = t.subs.filter(s => s.done).length;
  const canStart = t.status === 'ready';
  const started = t.status === 'running';
  const closed = ['done','cancelled'].includes(t.status);

  let cta = '';
  if (closed) cta = '';
  else if (started) cta = '<button class="cta" data-a="end" data-id="' + t.id + '">' + icon('i-stop','s26') +
      '<span class="t"><b>إنهاء المهمة</b><span>' + AR(doneSubs) + ' من ' + AR(t.subs.length) + ' مهمة فرعية منجزة</span></span></button>';
  else cta = '<button class="cta ' + (canStart ? '' : 'off') + '" ' + (canStart ? 'data-a="start" data-id="' + t.id + '"' : 'disabled') + '>' +
      icon('i-play','s26 f') + '<span class="t"><b>بدء المهمة</b><span>' +
      (t.status === 'pending_assign' ? 'يكتمل التسكين أولًا — ' + AR(ok) + ' من ' + AR(t.groups.length)
        : t.status === 'assigned' ? 'بانتظار إثبات حضور الجميع — ' + AR(att + (t.leaderAttendedAt?1:0)) + ' من ' + AR(t.groups.length + 1)
        : 'يمكن بدء المهمة الآن') + '</span></span></button>';

  return bar('تفاصيل المهمة', { back: 1, right: '<button data-a="hist" data-id="' + t.id + '">' + icon('i-hist') + '</button>' }) +
    '<div class="view">' + ground() +
    svcCard(t) + metaCard(t) +

    (deleg ? '<div class="note b">' + icon('i-shield','s16') + '<span>تعمل بصلاحية قائد لهذه المهمة فقط. الإسناد والاستبدال غير متاحين لك.</span></div>' : '') +
    (t.status === 'cancelled' ? '<div class="note r">' + icon('i-xc','s16') + '<span>أُلغيت المهمة — ' + E(t.cancelReason) + '</span></div>' : '') +

    /* حضور القائد */
    (!closed ? attendCard(t, u, lead) : '') +
    cta +

    /* التسكين */
    '<div class="lbl">المجموعات<small>' + AR(ok) + ' من ' + AR(t.groups.length) + ' مكتملة · ' + AR(att) + ' أثبتوا حضورهم</small></div>' +
    t.groups.map(g => groupRow(t, g, lead && !deleg, closed)).join('') +

    '<button class="btn l" data-a="go" data-n="timeline" data-id="' + t.id + '">' + icon('i-hist','s16') + 'تسلسل الإجراءات لكل مجموعة</button>' +
    (lead && !deleg && !closed ? '<button class="btn l" data-a="go" data-n="assign" data-id="' + t.id + '">' +
      icon('i-swap','s16') + 'إدارة التسكين والاستبدال</button>' : '') +

    /* المهام الفرعية */
    '<div class="lbl">المهام الفرعية<small>' + AR(doneSubs) + ' من ' + AR(t.subs.length) + '</small></div>' +
    '<div class="c">' + t.subs.map((s, i) => subRow(t, s, i, lead && started)).join('') + '</div>' +

    /* التفويض */
    (!closed ? delegCard(t, isCo, lead && !deleg) : '') +

    /* الملاحظات */
    (t.notes.length ? '<div class="lbl">ملاحظات المهمة</div>' + t.notes.map(n =>
      '<div class="note ' + (n.kind === 'auto' ? 'a' : 'b') + '">' + icon(n.kind === 'auto' ? 'i-info' : 'i-edit','s16') +
      '<span>' + E(n.text) + '<br><span class="tiny dim2">' + t12(n.at) + '</span></span></div>').join('') : '') +

    (!closed ? '<button class="btn l" data-a="note" data-id="' + t.id + '">' + icon('i-edit','s16') + 'إضافة ملاحظة</button>' : '') +
    (lead && !closed ? '<button class="btn d" data-a="cancel" data-id="' + t.id + '">' + icon('i-cancel','s16') + 'إلغاء المهمة</button>' : '') +
    '</div>' + tabs();
}

function attendCard(t, u, lead) {
  const mine = t.groups.find(g => g.muhsenId === u.id);
  const already = (u.role === 'leader' && t.leaderAttendedAt) || (mine && mine.attendedAt);
  const open = inPrep(t) || now() >= t.start;
  const rem = hms(prepDeadline(t) - now());
  if (already) return '<div class="note g">' + icon('i-checkc','s16') +
    '<span>حضورك مُثبَت ' + t12(u.role === 'leader' ? t.leaderAttendedAt : mine.attendedAt) + '</span></div>';
  if (!open) return '<div class="note a">' + icon('i-clock','s16') +
    '<span>تُفتح نافذة التحضير قبل الموعد بساعتين — ' + untilTxt(prepOpen(t)) + '</span></div>';
  return '<div class="c gold"><div class="center"><div class="tiny dim2" style="margin-bottom:5px">وقت التحضير المتبقي</div>' +
    '<div class="timer" data-deadline="' + prepDeadline(t) + '"><b>' + AR(rem.h) + '</b><i>:</i><b>' + AR(rem.m) + '</b><i>:</i><b>' + AR(rem.s) + '</b></div>' +
    '<div class="tunits"><span>ساعة</span><span>دقيقة</span><span>ثانية</span></div>' +
    '<div class="tiny dim" style="margin-top:9px">آخر وقت لإثبات الحضور ' + t12(prepDeadline(t)) + '</div></div>' +
    mapBox(t, true) +
    '<div class="grid2" style="margin-top:11px">' +
      '<button class="btn g sm" data-a="place">' + icon('i-pin','s16') + 'تغيير موقعي</button>' +
      '<button class="btn p sm" data-a="attend" data-id="' + t.id + '">' + icon('i-target','s16') + 'إثبات الحضور</button>' +
    '</div><div class="tiny dim2 center" style="margin-top:7px">وضع التجربة: الحضور متاح من أي موقع</div></div>';
}

function groupRow(t, g, canManage, closed) {
  const u = g.muhsenId ? userById(g.muhsenId) : null;
  let right = '', sub = 'مجموعة ' + AR(g.no) + ' · ' + AR(g.pilgrims) + ' حاجًا';
  if (!u) right = pill('بلا محسن', 'wait');
  else if (g.req === 'pending') { right = pill('بانتظار الرد', 'wait'); sub = 'مجموعة ' + AR(g.no) + ' · أُرسل ' + ago(g.reqAt); }
  else if (g.attendedAt) { right = '<span class="fl" style="gap:5px;color:#0B6540;font-weight:700;font-size:12px">' + icon('i-checkc','s16') + 'حاضر</span>'; sub = 'مجموعة ' + AR(g.no) + ' · ' + t12(g.attendedAt); }
  else right = pill('قبِل', 'live');
  if (g.swap && g.swap.state === 'pending') right = pill('استبدال معلّق', 'blue');
  return '<div class="prow">' + (u ? avat(u) : '<span class="eav">' + icon('i-user','s16') + '</span>') +
    '<span class="nm sp"><b>' + (u ? E(u.name) : 'مجموعة ' + AR(g.no)) + '</b><span>' + E(sub) + '</span></span>' +
    right + (canManage && !closed ? '<button data-a="gmenu" data-id="' + t.id + '" data-g="' + g.id + '" style="color:#B4BEB7">' + icon('i-vdots','s16') + '</button>' : '') + '</div>';
}

function subRow(t, s, i, canToggle) {
  const nextIdx = t.subs.findIndex(x => !x.done);
  const isNext = i === nextIdx && t.status === 'running';
  return '<button class="sub ' + (isNext ? 'next' : '') + '" ' + (canToggle ? 'data-a="sub" data-id="' + t.id + '" data-s="' + s.id + '"' : 'disabled') + '>' +
    '<span class="tick ' + (s.done ? 'on' : '') + '">' + (s.done ? icon('i-check','s14') : '') + '</span>' +
    '<span class="t ' + (s.done ? '' : isNext ? 'b' : 'dim') + '">' + E(s.name) + '</span>' +
    (s.done ? '<span class="tiny dim2">' + t12(s.at) + '</span>' : isNext ? pill('التالية','wait') : '') + '</button>';
}

function delegCard(t, isCo, canManage) {
  if (!isCo) return '<div class="note a">' + icon('i-shield','s16') +
    '<span>إسناد صلاحية الليدر غير متاح — هذه المهمة تتبع <b>بعثة</b>، والإسناد للشركات فقط.</span></div>';
  if (!t.delegate) return canManage
    ? '<div><div class="lbl">إسناد صلاحية الليدر<small>للشركات فقط · لمهمة واحدة · لمحسن واحد</small></div>' +
      '<button class="field" data-a="deleg" data-id="' + t.id + '">' + icon('i-assign','s16') +
      '<span class="sp ph">اختر محسنًا لإسناد صلاحية القيادة</span>' + icon('i-down','s16') + '</button></div>'
    : '';
  const d = t.delegate, u = userById(d.muhsenId);
  return '<div><div class="lbl">إسناد صلاحية الليدر</div><div class="c gold">' +
    '<div class="tiny dim2" style="margin-bottom:9px">' +
      (d.state === 'pending' ? 'بانتظار رد المحسن' : 'أُسندت صلاحية القيادة إلى') + '</div>' +
    '<div class="fl">' + avat(u, 'lg') + '<span class="sp"><b style="font-size:15px;display:block">' + E(u.name) +
      '</b><span class="tiny dim2">' + E(u.code) + ' · ' + (d.keepGroup ? 'مع بقائه على مجموعته' : 'ليدر لهذه المهمة فقط') + '</span></span></div>' +
    '<div class="row" style="margin-top:11px">' +
      pill(d.state === 'pending' ? 'بانتظار القبول' : 'يملك صلاحية بدء وإغلاق المهمة', d.state === 'pending' ? 'wait' : 'live') +
      (canManage ? '<button data-a="undeleg" data-id="' + t.id + '" style="color:var(--red);font-size:12.5px;font-weight:700">إلغاء الإسناد</button>' : '') +
    '</div></div></div>';
}

/* ============================ شاشة التسكين ============================ */
function screenAssign() {
  const t = taskById(S.route.id); if (!t) return screenTasks();
  recomputeStatus(t);
  const ok = t.groups.filter(g => g.req === 'accepted').length;
  return bar('تسكين المجموعات', { back: 1, right: '<button data-a="hist" data-id="' + t.id + '">' + icon('i-hist') + '</button>' }) +
    '<div class="view">' + ground() +
    '<div class="c gold"><div class="row"><b style="font-size:14.5px">' + E(t.title) + '</b>' +
      pill(untilTxt(t.start), 'wait') + '</div>' +
      '<div class="meter" style="margin:11px 0 7px"><i style="width:' + Math.round(ok / t.groups.length * 100) + '%"></i></div>' +
      '<div class="row tiny dim"><span>' + AR(ok) + ' من ' + AR(t.groups.length) + ' مجموعة مكتملة</span>' +
      '<span>' + AR(t.groups[0].pilgrims) + ' حاجًا للمجموعة</span></div></div>' +

    '<div class="note b">' + icon('i-info','s16') +
      '<span>محسن واحد لكل مجموعة · لا مجموعة فارغة · التسكين لهذه المهمة فقط.</span></div>' +

    '<div class="lbl">المجموعات</div>' +
    t.groups.map(g => {
      const u = g.muhsenId ? userById(g.muhsenId) : null;
      let state = '', act = '';
      if (!u) { state = pill('بلا محسن', 'wait'); act = '<button class="btn p sm" data-a="pick" data-id="' + t.id + '" data-g="' + g.id + '">اختر محسنًا</button>'; }
      else if (g.req === 'pending') { state = pill('بانتظار الرد · ' + ago(g.reqAt), 'wait');
        act = '<div class="grid2"><button class="btn d sm" data-a="withdraw" data-id="' + t.id + '" data-g="' + g.id + '">سحب الطلب</button>' +
              '<button class="btn g sm" data-a="pick" data-id="' + t.id + '" data-g="' + g.id + '">تغيير الشخص</button></div>'; }
      else { state = g.attendedAt ? pill('حاضر ' + t12(g.attendedAt), 'live') : pill('قبِل', 'live');
        act = g.swap && g.swap.state === 'pending'
          ? '<div class="note a" style="margin-top:2px">' + icon('i-swap','s16') + '<span>طلب استبدال معلّق — بانتظار رد المحسن</span></div>'
          : '<button class="btn l sm" data-a="swap" data-id="' + t.id + '" data-g="' + g.id + '">' + icon('i-swap','s16') + 'طلب استبدال</button>'; }
      return '<div class="c"><div class="fl">' + (u ? avat(u) : '<span class="eav">' + icon('i-user','s16') + '</span>') +
        '<span class="nm sp"><b style="font-size:13.5px">' + (u ? E(u.name) : 'مجموعة ' + AR(g.no)) + '</b>' +
        '<span class="tiny dim2">مجموعة ' + AR(g.no) + ' · ' + AR(g.pilgrims) + ' حاجًا' + (u ? ' · ' + E(u.code) : '') + '</span></span>' +
        state + '</div>' + (g.respNote ? '<div class="note r" style="margin-top:9px">' + icon('i-info','s16') + '<span>' + E(g.respNote) + '</span></div>' : '') +
        '<div style="margin-top:10px">' + act + '</div></div>';
    }).join('') +

    (ok < t.groups.length
      ? '<div class="note a">' + icon('i-warn','s16') + '<span>' + AR(t.groups.length - ok) + ' مجموعة بلا محسن مقبول — لا يمكن بدء المهمة.</span></div>'
      : '<div class="note g">' + icon('i-checkc','s16') + '<span>اكتمل التسكين. المتبقي إثبات الحضور.</span></div>') +
    '</div>' + tabs();
}

/* اختيار محسن — ورقة منبثقة */
function pickSheet(t, g) {
  const team = teamOf(t.leaderId);
  const used = new Set(t.groups.filter(x => x.id !== g.id && x.muhsenId).map(x => x.muhsenId));
  return '<div class="grip"></div><h3>اختر محسنًا لمجموعة ' + AR(g.no) + '</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">' + AR(g.pilgrims) + ' حاجًا · ' + E(t.title) + '</div>' +
    '<div class="col">' + team.map(u => {
      const inTask = used.has(u.id);
      const busy = !inTask && busyIn(u.id, t);
      const blocked = inTask || busy;
      const why = inTask ? 'مسكَّن على مجموعة أخرى في هذه المهمة' : busy ? 'مرتبط بـ«' + busy.title + '» في وقت متداخل' : u.specialty;
      return '<button class="prow" ' + (blocked ? 'disabled style="opacity:.5"' : 'data-a="send" data-id="' + t.id + '" data-g="' + g.id + '" data-u="' + u.id + '"') + '>' +
        avat(u) + '<span class="nm sp"><b>' + E(u.name) + '</b><span>' + E(why) + '</span></span>' +
        (blocked ? pill('غير متاح','no') : pill('إرسال طلب','live')) + '</button>';
    }).join('') + '</div>' +
    '<button class="btn g" style="margin-top:14px" data-a="close">إغلاق</button>';
}

function delegSheet(t) {
  const team = teamOf(t.leaderId);
  const keep = S.delegKeep !== false;
  return '<div class="grip"></div><h3>إسناد صلاحية الليدر</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">لمهمة «' + E(t.title) + '» فقط · المفوَّض لا يملك الإسناد ولا الاستبدال</div>' +
    '<div class="seg" style="margin-bottom:12px">' +
      '<button class="' + (keep ? 'on' : '') + '" data-a="dkeep" data-v="1">مع الإبقاء على مهامه كمحسن</button>' +
      '<button class="' + (!keep ? 'on' : '') + '" data-a="dkeep" data-v="0">ليدر لهذه المهمة فقط</button></div>' +
    (!keep ? '<div class="note a" style="margin-bottom:12px">' + icon('i-warn','s16') +
      '<span>سيُزال من مجموعته إن كان مسكَّنًا، وعليك تسكين بديل قبل البدء.</span></div>' : '') +
    '<div class="col">' + team.map(u => {
      const g = t.groups.find(x => x.muhsenId === u.id && x.req === 'accepted');
      const sub = g ? 'مسكَّن على مجموعة ' + AR(g.no) : 'غير مسكَّن في هذه المهمة';
      const blocked = !keep && !g ? false : false;
      return '<button class="prow" data-a="dsend" data-id="' + t.id + '" data-u="' + u.id + '">' + avat(u) +
        '<span class="nm sp"><b>' + E(u.name) + '</b><span>' + E(sub) + '</span></span>' + pill('إسناد','gold') + '</button>';
    }).join('') + '</div>' +
    '<button class="btn g" style="margin-top:14px" data-a="close">إغلاق</button>';
}
