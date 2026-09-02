/* ============================ قائمة المهام — موحّدة للدورين ============================ */
function screenTasks() {
  const uid_ = S.session.id, L = isLeader();
  const all = myTasks();
  const seg = S.tab.tasks || 'all';
  const count = k => all.filter(x => taskBucket(x, uid_) === k).length;
  const list = seg === 'all' ? all : all.filter(x => taskBucket(x, uid_) === seg);
  const cur = bucketOf(seg);
  const un = L ? unassignedTasks().length : 0;

  return bar('المهام', { left:'<button data-a="go" data-n="calendar" aria-label="التقويم">' + icon('i-cal') + '</button>' }) +
    '<div class="view">' + ground() +
    (L && un ? '<button class="note a" data-a="pickbucket" data-v="next" style="width:100%">' +
      icon('i-assign','s18') + '<span class="sp" style="text-align:right"><b>' + AR(un) + ' مهمة تحتاج تسكينًا</b><br>' +
      'التسكين مطلوب فور استلام التطبيق — ولو كانت المهمة بعد أسابيع.</span></button>' : '') +

    '<button class="drop" data-a="bucketmenu">' + icon('i-filter','s18') +
      '<span class="sp"><span class="tiny dim2">التصنيف المعروض</span><b>' + cur.l + '</b></span>' +
      '<span class="cnt">' + AR(list.length) + '</span>' +
      icon('i-down','s16') + '</button>' +

    (list.length ? list.map(t2 => taskRow(t2)).join('')
      : '<div class="c center" style="padding:28px"><b>لا توجد مهام في «' + cur.l + '»</b>' +
        '<div class="sm dim" style="margin-top:6px">' +
        (seg === 'undone' ? 'لا شيء مسجَّل عليك — أحسنت.' : 'جرّب تصنيفًا آخر من القائمة.') + '</div>' +
        '<button class="btn l sm" style="margin-top:12px" data-a="pickbucket" data-v="all">' +
          icon('i-list','s16') + 'عرض كل المهام</button></div>') +
    '</div>' + tabs();
}

/* قائمة التصنيفات */
function bucketSheet() {
  const uid_ = S.session.id, all = myTasks(), seg = S.tab.tasks || 'all';
  return '<div class="grip"></div><h3>عرض المهام</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">' +
      (isLeader() ? 'مهام الـKT الذي تقوده' : 'المهام التي لك فيها دور') + '</div>' +
    '<div class="col" style="gap:7px">' + TBUCKETS.map(b => {
      const n = b.k === 'all' ? all.length : all.filter(x => taskBucket(x, uid_) === b.k).length;
      return '<button class="listitem' + (b.k === seg ? ' on' : '') + '" data-a="pickbucket" data-v="' + b.k + '">' +
        '<span class="ico">' + icon(b.i, 's18') + '</span>' +
        '<span class="sp"><b style="font-size:13.5px;display:block">' + b.l + '</b>' +
        '<span class="tiny dim2">' + AR(n) + ' مهمة</span></span>' +
        (b.k === seg ? icon('i-check','s16') : '') + '</button>';
    }).join('') + '</div>' +
    '<button class="btn g" style="margin-top:12px" data-a="close">إغلاق</button>';
}

/* ============================ تفاصيل المهمة ============================ */
function screenTask() {
  const t = taskById(S.route.id); if (!t) return screenTasks();
  recomputeStatus(t);
  const u = me(), lead = actsAsLeader(t, u.id), deleg = isDelegate(t, u.id);
  const act = canDecide(t, u.id), watch = watching(t, u.id);
  const bucket = taskBucket(t, u.id);
  const isCo = orgOf(t).type === 'شركة';
  const acc = acceptedSlots(t), att = acc.filter(a => a.attendedAt).length;
  const doneSubs = t.subs.filter(s => s.done).length;
  const closed = ['done','cancelled'].includes(t.status);
  const running = t.status === 'running';
  const locked = lockedForAssign(t);
  const open = key => !!(S.open && S.open[t.id + ':' + key]);

  /* المحسن في مهمة غير منجزة: السبب فقط بلا تفاصيل تشغيلية */
  if (!lead && bucket === 'undone') {
    return bar('تفاصيل المهمة', { back: 1 }) + '<div class="view">' + ground() +
      svcCard(t) + metaCard(t) +
      '<div class="note r">' + icon('i-info','s16') +
        '<span><b>هذه المهمة غير منجزة بالنسبة لك</b><br>' + E(undoneReason(t, u.id)) + '</span></div>' +
      '<div class="c center dim sm" style="padding:22px">لا يُعرض سجل المهمة ولا المحسنون المسكَّنون عليها.</div>' +
      '</div>' + tabs();
  }

  /* زر البدء: باهت خارج نافذته أو قبل إثبات الحضور، وسببه مكتوب */
  let startCta = '';
  if (!closed && !running && act) {
    const can = canStart(t, u.id), why = startWhy(t, u.id);
    startCta = '<button class="cta ' + (can ? '' : 'off') + '" ' +
      (can ? 'data-a="start" data-id="' + t.id + '"' : 'disabled') + '>' +
      icon('i-play','s26 f') + '<span class="t"><b>بدء المهمة</b><span>' +
      (can ? 'وتبدأ تلقائيًّا ' + t12(t.start) + ' على كل حال' : E(why)) + '</span></span></button>';
  }

  /* قسم قابل للطيّ */
  const fold = (key, title, sub2, body, ic) =>
    '<div class="fold' + (open(key) ? ' on' : '') + '">' +
      '<button class="fhead" data-a="fold" data-id="' + t.id + '" data-v="' + key + '">' +
        icon(ic || 'i-list','s18') +
        '<span class="sp"><b>' + title + '</b>' + (sub2 ? '<span>' + sub2 + '</span>' : '') + '</span>' +
        icon('i-down','s16') + '</button>' +
      (open(key) ? '<div class="fbody">' + body + '</div>' : '') + '</div>';

  return bar('تفاصيل المهمة', { back: 1,
    right: lead ? '<button data-a="go" data-n="timeline" data-id="' + t.id + '" aria-label="سجل الإجراءات">' + icon('i-hist') + '</button>'
                : '<button data-a="go" data-n="profile" class="avbtn">' + avat(u, 'sm') + '</button>' }) +
    '<div class="view">' + ground() +
    svcCard(t) + metaCard(t) +

    (t.autoStarted && lead ? '<div class="note r">' + icon('i-warn','s16') +
      '<span><b>بدأها النظام تلقائيًّا</b><br>حان وقتها ولم تبدأها — ويُحتسب ذلك في تقييمك.</span></div>' : '') +
    (watch ? '<div class="note b">' + icon('i-shield','s16') +
      '<span><b>الليدر على هذه المهمة: ' + E(userById(t.delegate.muhsenId).name) + '</b><br>' +
      'أسندتَ صفتك إليه — تتابع التقدّم ولا تتخذ قرارات.</span></div>' : '') +
    (deleg ? '<div class="note b">' + icon('i-shield','s16') +
      '<span>تعمل بصلاحية ليدر لهذه المهمة فقط. التسكين والإسناد غير متاحين لك.</span></div>' : '') +

    (!closed ? attendCard(t, u, lead) : '') +
    startCta +

    guideChip(t, 1) +

    '<div class="lbl">المهام الفرعية<small>' + AR(doneSubs) + ' من ' + AR(t.subs.length) + '</small></div>' +
    (!act && !closed ? '<div class="note ' + (canShootSub(t) ? 'b' : 'a') + '">' + icon('i-info','s16') +
      '<span>' + (canShootSub(t)
        ? 'الليدر هو من يؤشّر على الإنجاز — ولك توثيق كل خطوة بالكاميرا.'
        : 'الليدر هو من يؤشّر على الإنجاز. ' + E(shootSubWhy(t)) + '.') + '</span></div>' : '') +
    '<div class="c">' + t.subs.map((s, i2) => subRow(t, s, i2, running)).join('') + '</div>' +

    (t.rating ? '<button class="c gold" data-a="go" data-n="taskrating" data-id="' + t.id + '" style="width:100%;text-align:right">' +
      '<div class="row"><b class="sm">تقييم المهمة</b>' + pill('التفاصيل', 'gold') + '</div>' +
      '<div class="fl" style="margin-top:10px;justify-content:center">' + stars(avgRating(t.rating), 'lg') + '</div></button>' : '') +

    (lead ? fold('team', 'المحسنون على المهمة',
        AR(acc.length) + ' فعليًّا · ' + AR(att) + ' أثبتوا حضورهم',
        (allSlots(t).length ? allSlots(t).map(a2 => slotCard(t, a2, act && !deleg)).join('')
          : '<div class="c center dim sm" style="padding:20px">لا يوجد أحد على المهمة</div>'),
      'i-users') : '') +

    /* نوافذ التسكين: مشروحة للّيدر الأصيل وحده */
    (canAssign(t, u.id) ? (locked
      ? '<div class="note a">' + icon('i-info','s16') +
        '<span>' + (running || closed ? 'المهمة بدأت — التسكين مقفل.' : 'حان وقت المهمة — التسكين مقفل.') + '</span></div>'
      : (reqWindowOpen(t)
        ? '<div class="note b">' + icon('i-clock','s16') +
          '<span>الطلبات مفتوحة — تُغلق ' + untilTxt(reqCloseAt(t)) + '. ومهلة كل طلب ' + AR(REQ_TTL_H) + ' ساعات.</span></div>'
        : '<div class="note a">' + icon('i-clock','s16') + '<span>' + E(reqWindowWhy(t)) +
          (supportOpen(t) ? ' — ولم يبقَ إلا طلب الدعم.' : '') + '</span></div>')) : '') +
      (canAssign(t, u.id) && !closed
        ? (supportOpen(t)
          ? '<button class="btn l" data-a="supportsheet" data-id="' + t.id + '">' +
            icon('i-send','s16') + 'طلب دعم من الكنترول</button>' +
            '<div class="tiny dim2 center">يُغلق ' + untilTxt(supportCloseAt(t)) +
            ' — قبل المهمة بـ ' + AR(SUPPORT_CLOSE_H) + ' ساعات</div>'
          : '<button class="btn l off" disabled>' + icon('i-send','s16') +
            'طلب دعم من الكنترول</button>' +
            '<div class="tiny dim2 center">' + E(supportWhy(t)) + '</div>') : '') +
      (lead && taskSupport(t.id).length ? '<div class="lbl">طلبات الدعم<small>' +
        AR(taskSupport(t.id).length) + '</small></div>' +
        taskSupport(t.id).map(s2 => supportCard(s2)).join('') : '') +

    (lead && hasDocs(t)
      ? fold('docs', 'مستندات المهمة', 'عقد النقل وعقد السكن', docButtons(t), 'i-file') : '') +

    (!lead && !closed && slotOf(t, u.id) && slotOf(t, u.id).req === 'accepted'
      ? (function () {
          const w = myWithdraw(t, u.id);
          if (w && w.state === 'pending') return '<div class="note a">' + icon('i-out','s16') +
            '<span><b>طلب انسحابك قيد المراجعة</b><br>' + E(w.reason) + '</span></div>';
          if (w && w.state === 'rejected') return '<div class="note r">' + icon('i-xc','s16') +
            '<span><b>رُفض طلب انسحابك</b>' + (w.respNote ? '<br>' + E(w.respNote) : '') + '</span></div>';
          if (lockedForAssign(t)) return '<div class="note a">' + icon('i-out','s16') +
            '<span>بدأت المهمة — لا انسحاب بعد بدايتها.</span></div>';
          if (!reqWindowOpen(t)) return '<button class="btn l off" disabled>' +
            icon('i-out','s16') + 'طلب الانسحاب من المهمة</button>' +
            '<div class="tiny dim2 center">' + E(reqWindowWhy(t)) + '</div>';
          return '<button class="btn l" data-a="askwd" data-id="' + t.id + '">' +
            icon('i-out','s16') + 'طلب الانسحاب من المهمة</button>' +
            '<div class="tiny dim2 center">يُغلق ' + untilTxt(reqCloseAt(t)) +
            ' — قبل المهمة بـ ' + AR(REQ_CLOSE_H) + ' ساعة</div>';
        })() : '') +

    taskPhotoSection(t, lead) +

    (!lead && bucket !== 'undone' && acc.length > 1
      ? fold('mates', 'معك على المهمة', AR(acc.length - 1) + ' زميلًا',
        acc.filter(a2 => a2.muhsenId !== u.id).map(a2 => {
          const mm = userById(a2.muhsenId); if (!mm) return '';
          const ph = String(mm.phone || '').replace(/[^0-9]/g, '');
          return '<div class="c"><div class="fl">' + avat(mm, 'sm') +
            '<span class="nm sp"><b>' + E(mm.name) + '</b><span>' + E(mm.specialty) +
              (mm.reserve ? ' · احتياط' : '') + '</span></span>' +
            (a2.attendedAt ? pill('حاضر ' + t12(a2.attendedAt), 'live') : pill('لم يحضر بعد', 'wait')) + '</div>' +
            (ph ? '<div class="grid2" style="margin-top:9px">' +
              '<a class="btn l sm" href="tel:' + ph + '">' + icon('i-phone','s16') + 'اتصال</a>' +
              '<a class="btn l sm" href="https://wa.me/' + ph + '" target="_blank" rel="noopener">' +
                icon('i-send','s16') + 'واتساب</a></div>' : '') + '</div>';
        }).join(''), 'i-users') : '') +

    (lead && !deleg && !closed ? delegCard(t, isCo, !locked && act) : '') +

    (t.notes.length && lead ? fold('notes', 'ملاحظات المهمة', AR(t.notes.length) + ' ملاحظة',
      t.notes.map(n => '<div class="note ' + (n.kind === 'auto' ? 'a' : 'b') + '">' +
        icon(n.kind === 'auto' ? 'i-info' : 'i-edit','s16') +
        '<span>' + E(n.text) + '<br><span class="tiny dim2">' + t12(n.at) + '</span></span></div>').join(''),
      'i-edit') : '') +

    (!closed ? '<div class="grid2">' +
      '<button class="btn l sm" data-a="note" data-id="' + t.id + '">' + icon('i-edit','s16') + 'ملاحظة</button>' +
      '<button class="btn l sm" data-a="report" data-id="' + t.id + '">' + icon('i-flag','s16') + 'تقرير</button></div>' : '') +

    (running ? (act
      ? '<div class="endzone"><button class="cta stop" data-a="end" data-id="' + t.id + '">' +
        icon('i-stop','s26') + '<span class="t"><b>إنهاء المهمة</b><span>' +
        AR(doneSubs) + ' من ' + AR(t.subs.length) + ' مهمة فرعية منجزة</span></span></button></div>'
      : '<div class="note g">' + icon('i-play','s16') +
        '<span>المهمة جارية — الإنهاء من صلاحية الليدر.</span></div>') : '') +
    '</div>' + tabs();
}


/* بطاقة الحضور */
function attendCard(t, u, lead) {
  const a = slotOf(t, u.id);
  const mine = lead ? t.leaderAttendedAt : (a ? a.attendedAt : null);
  const involved = lead || (a && a.req === 'accepted');
  if (!involved) return '';
  if (mine) return '<div class="note g">' + icon('i-checkc','s16') +
    '<span>حضورك مُثبَت ' + t12(mine) + '</span></div>';
  if (now() < prepOpen(t)) return '<div class="note a">' + icon('i-clock','s16') +
    '<span>يُفتح التحضير قبل المهمة بساعتين — ' + untilTxt(prepOpen(t)) + '</span></div>';
  /* أُغلقت النافذة: الزر باهت ومعطّل، والسبب مكتوب */
  if (now() >= prepDeadline(t)) return '<div class="c">' +
    '<div class="note r">' + icon('i-xc','s16') +
      '<span><b>أُغلق التحضير</b><br>يُغلق قبل المهمة بساعة ونصف — ولم تثبت حضورك.</span></div>' +
    '<button class="btn p sm off" style="margin-top:10px" disabled>' + icon('i-target','s16') +
      'إثبات الحضور</button></div>';
  const late = now() >= t.start;
  const r = hms(Math.abs(t.start - now()));
  return '<div class="c gold"><div class="center">' +
    '<div class="tiny dim2" style="margin-bottom:5px">' + (late ? 'تأخرت عن بداية المهمة' : 'المتبقي على بداية المهمة') + '</div>' +
    '<div class="timer" data-deadline="' + t.start + '"><b' + (late ? ' style="color:var(--red)"' : '') + '>' + AR(r.h) +
      '</b><i>:</i><b' + (late ? ' style="color:var(--red)"' : '') + '>' + AR(r.m) +
      '</b><i>:</i><b' + (late ? ' style="color:var(--red)"' : '') + '>' + AR(r.s) + '</b></div>' +
    '<div class="tunits"><span>ساعة</span><span>دقيقة</span><span>ثانية</span></div>' +
    '<div class="tiny ' + (late ? '' : 'dim') + '" style="margin-top:9px' + (late ? ';color:var(--red);font-weight:700' : '') + '">' +
      (late ? 'يُسجَّل تأخرك في ملاحظات المهمة ويؤثر في تقييمك' : 'تبدأ المهمة ' + t12(t.start)) + '</div></div>' +
    mapBox(t, true) +
    '<div class="grid2" style="margin-top:11px">' +
      '<button class="btn g sm" data-a="place">' + icon('i-pin','s16') + 'تغيير موقعي</button>' +
      '<button class="btn p sm" data-a="attend" data-id="' + t.id + '">' + icon('i-target','s16') + 'إثبات الحضور</button></div>' +
    '<div class="tiny dim2 center" style="margin-top:7px">وضع التجربة: الحضور متاح من أي موقع — والبُعد يُسجَّل ملاحظةً</div></div>';
}



function subRow(t, s, i, running) {
  const nextIdx = t.subs.findIndex(x => !x.done);
  const isNext = i === nextIdx && running;
  const shots = photosFor(t.id, s.id).length;
  const canTick = canTickSub(t, S.session.id);   /* المحسن يرى ولا يؤشّر */
  return '<div class="subrow">' +
    '<button class="sub ' + (isNext && canTick ? 'next' : '') + (canTick ? '' : ' ro') + '" ' +
      (canTick ? 'data-a="sub" data-id="' + t.id + '" data-s="' + s.id + '"' : 'disabled') + '>' +
      '<span class="tick ' + (s.done ? 'on' : '') + '">' + (s.done ? icon('i-check','s14') : '') + '</span>' +
      '<span class="t ' + (s.done ? '' : isNext ? 'b' : 'dim') + '">' + E(s.name) + '</span>' +
      (s.done ? '<span class="tiny dim2">' + t12(s.at) + '</span>' : isNext && canTick ? pill('التالية','wait') : '') +
    '</button>' +
    (shots ? '<button class="sshot has" data-a="viewphoto" data-id="' + photosFor(t.id, s.id)[0].id + '" ' +
      'aria-label="إثباتات">' + icon('i-camera','s14') + '<i>' + AR(shots) + '</i></button>' : '') +
    (canShootSub(t) && ['done','cancelled'].indexOf(t.status) < 0
      ? '<button class="sshot" data-a="shoot" data-tid="' + t.id + '" data-sid="' + s.id + '" ' +
        'data-kid="" aria-label="توثيق بالكاميرا">' + icon('i-camera','s14') + '</button>' : '') +
    '</div>';
}

function delegCard(t, isCo, canManage) {
  if (!t) return '';
  if (!isCo) return '<div class="note a">' + icon('i-shield','s16') +
    '<span>إسناد صلاحية القيادة غير متاح — هذه المهمة تتبع <b>بعثة</b>، والإسناد للشركات فقط.</span></div>';
  if (!t.delegate) return canManage
    ? '<div><div class="lbl">إسناد صلاحية القيادة<small>للشركات فقط · لهذه المهمة وحدها</small></div>' +
      '<button class="field" data-a="deleg" data-id="' + t.id + '">' + icon('i-assign','s16') +
      '<span class="sp ph">اختر محسنًا لإسناد القيادة</span>' + icon('i-down','s16') + '</button></div>' : '';
  const d = t.delegate, u = userById(d.muhsenId);
  return '<div><div class="lbl">إسناد صلاحية القيادة</div><div class="c gold">' +
    '<div class="tiny dim2" style="margin-bottom:9px">' +
      (d.state === 'pending' ? 'بانتظار رد المحسن' : d.state === 'accepted' ? 'الليدر المؤقت لهذه المهمة' : 'رُفض الإسناد') + '</div>' +
    '<div class="fl">' + avat(u, 'lg') + '<span class="sp"><b style="font-size:15px;display:block">' + E(u.name) +
      '</b><span class="tiny dim2">' + E(u.code) + ' · ' + (d.keepGroup ? 'مع بقائه محسنًا في المهمة' : 'ليدر لهذه المهمة فقط') + '</span></span></div>' +
    '<div class="row" style="margin-top:11px">' +
      pill(d.state === 'pending' ? 'بانتظار القبول' : 'يملك صلاحية البدء والإغلاق', d.state === 'pending' ? 'wait' : 'live') +
      (canManage ? '<button data-a="undeleg" data-id="' + t.id + '" style="color:var(--red);font-size:12.5px;font-weight:700">إلغاء الإسناد</button>' : '') +
    '</div></div></div>';
}

/* ============================ شاشة التسكين ============================ */
/* التسكين صار داخل المهمة نفسها */
function screenAssign() { return screenTask(); }



/* ============================ تسلسل الإجراءات — للّيدر فقط ============================ */
function screenTimeline() {
  const t = taskById(S.route.id); if (!t) return screenTasks();
  if (!actsAsLeader(t, S.session.id)) return screenTasks();
  const evs = [];
  t.assigned.forEach(a => {
    const nm = userById(a.muhsenId).name;
    if (a.reqAt) evs.push({ at:a.reqAt, ic:'i-assign', c:'wait', txt:'أُرسل طلب تسكين إلى ' + nm });
    if (a.respAt) evs.push({ at:a.respAt, ic:a.req === 'accepted' ? 'i-checkc' : 'i-xc',
      c:a.req === 'accepted' ? 'live' : 'no',
      txt:nm + (a.req === 'accepted' ? ' قبل التسكين' : ' رفض التسكين') + (a.respNote ? ' — «' + a.respNote + '»' : '') });
    if (a.attendedAt) evs.push({ at:a.attendedAt, ic:'i-target', c:a.farKm > RADIUS_KM ? 'wait' : 'live',
      txt:nm + ' أثبت حضوره' + (a.farKm > RADIUS_KM ? ' من ' + a.farKm + ' كم' : '') });
    if (a.removed) evs.push({ at:a.respAt || a.reqAt, ic:'i-x', c:'no', txt:'أُزيل ' + nm + ' — ' + (a.removedWhy || '') });
  });
  if (t.leaderAttendedAt) evs.push({ at:t.leaderAttendedAt, ic:'i-target', c:'live', txt:'الليدر أثبت حضوره' });
  if (t.delegate) evs.push({ at:t.delegate.at, ic:'i-shield', c:'gold',
    txt:'إسناد القيادة إلى ' + userById(t.delegate.muhsenId).name + ' — ' +
      (t.delegate.state === 'accepted' ? 'قُبل' : t.delegate.state === 'pending' ? 'بانتظار الرد' : 'رُفض') });
  if (t.startedAt) evs.push({ at:t.startedAt, ic:'i-play', c:t.autoStarted ? 'no' : 'live',
    txt:t.autoStarted ? 'بدأها النظام تلقائيًا' : 'بدأ ' + (userById(t.startedBy) || {name:'النظام'}).name + ' المهمة' });
  t.subs.filter(s => s.done).forEach(s => evs.push({ at:s.at, ic:'i-check', c:'grey',
    txt:'أُنجزت «' + s.name + '»' + (s.by && userById(s.by) ? ' — ' + userById(s.by).name : '') }));
  if (t.endedAt) evs.push({ at:t.endedAt, ic:'i-stop', c:'grey',
    txt:'أُغلقت المهمة' + (userById(t.endedBy) ? ' — ' + userById(t.endedBy).name : '') });
  evs.sort((a, b) => b.at - a.at);

  const clr = { no:'background:#FBE9E7;color:#93261C', wait:'background:#FBF1DE;color:#7F5310',
    gold:'background:#F5EDDF;color:#6E5729', grey:'background:#EFF1ED;color:#5A6C63',
    live:'background:#E4F2E9;color:#0B6540' };
  return bar('تسلسل الإجراءات', { back: 1 }) + '<div class="view">' + ground() + svcCard(t) +
    (evs.length ? evs.map(e => '<div class="c"><div class="fl" style="align-items:flex-start;gap:11px">' +
      '<span class="ico" style="width:36px;height:36px;border-radius:12px;display:grid;place-items:center;' + clr[e.c] + '">' +
        icon(e.ic,'s18') + '</span>' +
      '<span class="sp"><b class="sm" style="display:block">' + E(e.txt) + '</b>' +
      '<span class="tiny dim2">' + t12(e.at) + ' · ' + hijri(e.at) + '</span></span></div></div>').join('')
      : '<div class="c center dim sm">لا توجد إجراءات بعد</div>') +
    '</div>' + tabs();
}
