/* ============================ رئيسية المحسن ============================ */
function screenMuhsenHome() {
  const u = me(), L = userById(u.leaderId), t = currentTask();
  const reqs = myRequests().length;
  const tk = myTickets().filter(k => k.status !== 'مغلقة').length;
  return bar('المهمة الحالية', { right: '<button data-a="go" data-n="profile" style="width:34px;height:34px">' + avat(u, 'sm') + '</button>' }) +
    '<div class="view">' + ground() +
    '<div class="c gold"><div class="fl">' + avat(u, 'lg') +
      '<div class="sp"><div class="row"><b style="font-size:16px">' + E(u.name) + '</b>' + pill(u.code, 'gold') + '</div>' +
      '<div class="sm dim">' + E(u.specialty) + ' · فريق ' + E(L.name) + ' · ' + E(L.kt) + '</div></div></div></div>' +

    (reqs ? '<button class="note a" data-a="go" data-n="requests" style="width:100%">' + icon('i-bell','s16') +
      '<span><b>' + AR(reqs) + ' طلب بانتظار ردك</b> — تسكين أو استبدال أو تفويض</span></button>' : '') +

    (!t ? '<div class="c center" style="padding:30px 16px">' +
        '<div style="color:var(--dim2);margin-bottom:8px">' + icon('i-tasks','s26') + '</div>' +
        '<b>لا توجد مهمة حالية</b><div class="sm dim" style="margin-top:4px">ستظهر مهمتك هنا فور قبولك طلب تسكين.</div></div>'
      : muhsenTaskCard(t, u)) +

    '<button class="listitem" data-a="go" data-n="tickets">' +
      '<span class="ico" style="background:#FBF1DE;color:#7F5310">' + icon('i-ticket','s18') + '</span>' +
      '<span class="sp"><b style="font-size:13.5px;display:block">' + AR(tk) + ' تذكرة مُسندة إليك</b>' +
      '<span class="tiny dim2">من الحجاج والكونترول</span></span>' + icon('i-back','s16') + '</button>' +
    '</div>' + tabs();
}

function muhsenTaskCard(t, u) {
  recomputeStatus(t);
  const g = t.groups.find(x => x.muhsenId === u.id);
  const deleg = isDelegate(t, u.id);
  const attended = (g && g.attendedAt) || (deleg && t.leaderAttendedAt);
  const open = inPrep(t) || now() >= t.start;
  const rem = hms(prepDeadline(t) - now());
  const doneSubs = t.subs.filter(s => s.done).length;

  let block = '';
  if (t.status === 'running') {
    block = '<div class="note g">' + icon('i-play','s16') + '<span>المهمة جارية — نفّذ المهام الفرعية.</span></div>' +
      '<button class="btn p" data-a="go" data-n="mytask" data-id="' + t.id + '">' + icon('i-tasks','s16') +
      'فتح المهام الفرعية (' + AR(doneSubs) + '/' + AR(t.subs.length) + ')</button>';
  } else if (attended) {
    block = '<div class="note g">' + icon('i-checkc','s16') + '<span>حضورك مُثبَت ' +
      t12(g ? g.attendedAt : t.leaderAttendedAt) + ' — بانتظار بدء القائد للمهمة.</span></div>';
  } else if (!open) {
    block = '<div class="note a">' + icon('i-clock','s16') + '<span>تُفتح نافذة التحضير قبل الموعد بساعتين — ' + untilTxt(prepOpen(t)) + '</span></div>';
  } else {
    block = '<div class="center" style="margin:6px 0 10px"><div class="tiny dim2" style="margin-bottom:5px">وقت التحضير المتبقي</div>' +
      '<div class="timer" data-deadline="' + prepDeadline(t) + '"><b>' + AR(rem.h) + '</b><i>:</i><b>' + AR(rem.m) + '</b><i>:</i><b>' + AR(rem.s) + '</b></div>' +
      '<div class="tunits"><span>ساعة</span><span>دقيقة</span><span>ثانية</span></div>' +
      '<div class="tiny dim" style="margin-top:8px">آخر وقت لإثبات الحضور ' + t12(prepDeadline(t)) + '</div></div>' +
      mapBox(t, true) +
      '<div class="grid2" style="margin-top:11px">' +
        '<button class="btn g sm" data-a="place">' + icon('i-pin','s16') + 'تغيير موقعي</button>' +
        '<button class="btn p sm" data-a="attend" data-id="' + t.id + '">' + icon('i-target','s16') + 'إثبات الحضور</button></div>' +
      '<div class="tiny dim2 center" style="margin-top:7px">وضع التجربة: الحضور متاح من أي موقع</div>';
  }

  return svcCard(t) + metaCard(t) +
    (deleg ? '<div class="note b">' + icon('i-shield','s16') +
      '<span>أُسندت إليك صلاحية قيادة هذه المهمة — تستطيع بدأها وإغلاقها، ولا تستطيع الإسناد أو الاستبدال.</span></div>' +
      '<button class="btn l" data-a="go" data-n="task" data-id="' + t.id + '">' + icon('i-shield','s16') + 'فتح شاشة القيادة</button>' : '') +
    '<div class="c">' + (g ? '<div class="row" style="margin-bottom:10px"><b class="sm">مجموعتك</b>' +
      pill('مجموعة ' + AR(g.no) + ' · ' + AR(g.pilgrims) + ' حاجًا', 'gold') + '</div>' : '') + block + '</div>';
}

/* ============================ مهمتي — المهام الفرعية ============================ */
function screenMyTask() {
  const u = me();
  const t = S.route.id ? taskById(S.route.id) : currentTask();
  if (!t) return bar('مهمتي') + '<div class="view">' + ground() +
    '<div class="c center" style="padding:34px 16px"><b>لا توجد مهمة</b>' +
    '<div class="sm dim" style="margin-top:4px">اقبل طلب تسكين لتظهر مهمتك.</div></div></div>' + tabs();
  recomputeStatus(t);
  const g = t.groups.find(x => x.muhsenId === u.id);
  const running = t.status === 'running';
  const done = t.subs.filter(s => s.done).length;
  const deleg = isDelegate(t, u.id);
  return bar(t.title, { back: 1, right: '<button data-a="hist" data-id="' + t.id + '">' + icon('i-hist') + '</button>' }) +
    '<div class="view">' + ground() + svcCard(t) + metaCard(t) +
    (g ? '<div class="c"><div class="row"><b class="sm">مجموعتك</b>' +
      pill('مجموعة ' + AR(g.no) + ' · ' + AR(g.pilgrims) + ' حاجًا', 'gold') + '</div>' +
      (g.attendedAt ? '<div class="tiny dim" style="margin-top:6px">حضورك مُثبَت ' + t12(g.attendedAt) + '</div>' : '') +
      '<button class="btn l sm" style="margin-top:10px" data-a="go" data-n="pilgrims" data-id="' + t.id + '">' +
      icon('i-users','s16') + 'حجاج مجموعتي (' + AR(g.pilgrims) + ')</button></div>' : '') +

    (!running ? '<div class="note a">' + icon('i-info','s16') +
      '<span>لم تبدأ المهمة بعد — تُفتح المهام الفرعية فور بدء القائد لها.</span></div>' : '') +

    '<div class="lbl">المهام الفرعية<small>' + AR(done) + ' من ' + AR(t.subs.length) + '</small></div>' +
    '<div class="c">' + t.subs.map((s, i) => subRow(t, s, i, running)).join('') + '</div>' +

    (running ? (function () {
      const nx = t.subs.find(s => !s.done);
      return nx ? '<button class="cta" data-a="sub" data-id="' + t.id + '" data-s="' + nx.id + '">' + icon('i-checkc','s26') +
        '<span class="t"><b>تسجيل إنجاز «' + E(nx.name) + '»</b><span>المهمة الفرعية ' + AR(t.subs.indexOf(nx) + 1) + ' من ' + AR(t.subs.length) + '</span></span></button>'
        : '<div class="note g">' + icon('i-checkc','s16') + '<span>أنجزت كل المهام الفرعية. الإغلاق من صلاحية القائد.</span></div>';
    })() : '') +

    (deleg && running ? '<button class="cta" data-a="end" data-id="' + t.id + '">' + icon('i-stop','s26') +
      '<span class="t"><b>إنهاء المهمة</b><span>بصلاحية القيادة المسندة إليك</span></span></button>' : '') +

    '<button class="btn l" data-a="go" data-n="timeline" data-id="' + t.id + '">' + icon('i-hist','s16') + 'تسلسل الإجراءات</button>' +
    '<div class="grid2">' +
      '<button class="btn l sm" data-a="note" data-id="' + t.id + '">' + icon('i-edit','s16') + 'ملاحظة</button>' +
      '<button class="btn l sm" data-a="report" data-id="' + t.id + '">' + icon('i-flag','s16') + 'رفع تقرير</button></div>' +
    '</div>' + tabs();
}

/* ============================ الطلبات ============================ */
function screenRequests() {
  const rq = myRequests();
  const u = me();
  const log = [];
  S.tasks.forEach(t => t.history.forEach(h => {
    if (h.text.includes(u.name)) log.push({ at: h.at, text: h.text, t });
  }));
  log.sort((a, b) => b.at - a.at);

  return bar('الطلبات') + '<div class="view">' + ground() +
    (rq.length ? rq.map(r => reqCard(r)).join('')
      : '<div class="c center" style="padding:30px 16px"><b>لا توجد طلبات معلّقة</b>' +
        '<div class="sm dim" style="margin-top:4px">ستصلك طلبات التسكين والاستبدال والتفويض هنا.</div></div>') +
    '<div class="lbl">السجل</div>' +
    (log.length ? log.slice(0, 12).map(l => '<div class="c"><div class="sm">' + E(l.text) + '</div>' +
      '<div class="tiny dim2" style="margin-top:4px">' + E(l.t.title) + ' · ' + ago(l.at) + '</div></div>').join('')
      : '<div class="c center dim sm">لا يوجد سجل بعد</div>') +
    '</div>' + tabs();
}

function reqCard(r) {
  const t = r.t;
  if (r.kind === 'assign') {
    const g = r.g;
    return '<div class="c gold"><div class="row"><b style="font-size:14.5px">طلب تسكين</b>' + pill('يحتاج ردًا', 'wait') + '</div>' +
      '<div style="background:#F8F6F0;border-radius:14px;padding:13px;margin:11px 0">' +
        '<div class="row"><b class="sm">' + E(t.title) + '</b>' + pill(AR(t.subs.length) + ' مهمة فرعية', 'grey') + '</div>' +
        '<div class="tiny dim" style="margin-top:5px">مجموعة ' + AR(g.no) + ' · ' + AR(g.pilgrims) + ' حاجًا · ' + E(t.place) + '</div>' +
        '<div class="tiny dim">' + hijri(t.start) + ' · ' + t12(t.start) + ' إلى ' + t12(t.end) + ' · ' + AR(t.durH) + ' ساعات</div>' +
        '<button class="fl" data-a="go" data-n="task" data-id="' + t.id + '" style="gap:5px;margin-top:9px;color:var(--g);font-size:12.5px;font-weight:700">' +
          'عرض تفاصيل المهمة والمهام الفرعية' + icon('i-back','s14') + '</button></div>' +
      '<div class="fl tiny dim2" style="margin-bottom:11px">' + avat(userById(t.leaderId), 'sm') +
        '<span>من ' + E(userById(t.leaderId).name) + ' · ' + ago(g.reqAt) + '</span></div>' +
      '<div class="grid2"><button class="btn d sm" data-a="resp" data-id="' + t.id + '" data-g="' + g.id + '" data-v="0">رفض</button>' +
      '<button class="btn p sm" data-a="resp" data-id="' + t.id + '" data-g="' + g.id + '" data-v="1">قبول</button></div></div>';
  }
  if (r.kind === 'swap') {
    const g = r.g;
    return '<div class="c gold"><div class="row"><b style="font-size:14.5px">طلب استبدال</b>' + pill('يحتاج ردًا', 'wait') + '</div>' +
      '<div class="tiny dim" style="margin:6px 0 10px">' + E(t.title) + ' · مجموعة ' + AR(g.no) + ' · ' + hijri(t.start) + '</div>' +
      (g.swap.note ? '<div class="note a">' + icon('i-edit','s16') + '<span>ملاحظة القائد: «' + E(g.swap.note) + '»</span></div>' : '') +
      '<div class="note b" style="margin-top:9px">' + icon('i-info','s16') +
        '<span>القبول يزيلك من المجموعة. الرفض يبقيك عليها وتكمل مهمتك طبيعيًا.</span></div>' +
      '<div class="grid2" style="margin-top:11px">' +
        '<button class="btn d sm" data-a="rswap" data-id="' + t.id + '" data-g="' + g.id + '" data-v="0">رفض</button>' +
        '<button class="btn p sm" data-a="rswap" data-id="' + t.id + '" data-g="' + g.id + '" data-v="1">قبول</button></div></div>';
  }
  const d = t.delegate;
  return '<div class="c gold"><div class="row"><b style="font-size:14.5px">إسناد صلاحية الليدر</b>' + pill('يحتاج ردًا', 'wait') + '</div>' +
    '<div class="tiny dim" style="margin:6px 0 10px">' + E(t.title) + ' · ' + hijri(t.start) + ' · ' + E(orgOf(t).ar) + '</div>' +
    '<div class="note b">' + icon('i-shield','s16') + '<span>ستملك: بدء المهمة · المهام الفرعية · إغلاق المهمة · رفع تقرير.<br>' +
      'لن تملك: الإسناد ولا الاستبدال.<br>' + (d.keepGroup ? 'وتبقى على مجموعتك كما هي.' : '<b>وستُزال من مجموعتك للتفرّغ للقيادة.</b>') + '</span></div>' +
    '<div class="grid2" style="margin-top:11px">' +
      '<button class="btn d sm" data-a="rdeleg" data-id="' + t.id + '" data-v="0">رفض</button>' +
      '<button class="btn p sm" data-a="rdeleg" data-id="' + t.id + '" data-v="1">قبول</button></div></div>';
}
