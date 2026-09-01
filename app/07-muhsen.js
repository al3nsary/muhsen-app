/* ============================ صناديق الوضع الآن ============================ */
function statusBoxes() {
  const L = isLeader(), ts = myTasks();
  const running = ts.filter(t => t.status === 'running');
  const auto = running.filter(t => t.autoStarted);
  const soon = ts.filter(t => !['done','cancelled','running'].includes(t.status) && t.start > now() && t.start - now() < 12 * HR);
  const un = L ? unassignedTasks() : [];
  const inbox = L ? 0 : myRequests().length;
  const tks = myTickets().filter(k => k.status !== 'مغلقة').length;
  const over = running.filter(t => now() > t.end);

  const box = (cls, ic, n, title, sub, act) =>
    '<button class="c ' + cls + '" ' + (act || '') + ' style="width:100%;text-align:right">' +
      '<div class="fl" style="gap:11px">' +
        '<span class="ico" style="width:42px;height:42px;border-radius:13px;display:grid;place-items:center;' +
          (cls === 'urgent' ? 'background:#FCEDEB;color:#93261C' : cls === 'soon' ? 'background:#FCF5E7;color:#7A5512'
            : 'background:#E4F2E9;color:#0B6540') + '">' + icon(ic, 's18') + '</span>' +
        '<span class="sp"><b style="font-size:14px;display:block">' + E(title) + '</b>' +
        '<span class="tiny dim">' + E(sub) + '</span></span>' +
        '<b style="font-size:22px;font-weight:800;' +
          (cls === 'urgent' ? 'color:var(--red)' : cls === 'soon' ? 'color:var(--amber)' : 'color:var(--g)') + '">' + AR(n) + '</b>' +
      '</div></button>';

  let out = '<div class="lbl">الوضع الآن<small>' + dayName(now()) + ' · ' + t12(now()) + '</small></div>';
  let any = false;
  if (auto.length)    { any = 1; out += box('urgent','i-warn',auto.length,'مهمة بدأها النظام','حان وقتها ولم تبدأها — أغلقها','data-a="go" data-n="tasks"'); }
  if (over.length)    { any = 1; out += box('urgent','i-clock',over.length,'مهمة تجاوزت وقتها','لم تُغلق بعد انتهاء مدتها','data-a="go" data-n="tasks"'); }
  if (running.length) { any = 1; out += box('','i-play',running.length,'مهمة جارية الآن',
    running.map(t => t.title).slice(0,2).join(' · ') + (running.length > 2 ? ' وغيرها' : ''),'data-a="go" data-n="tasks"'); }
  if (un.length)      { any = 1; out += box('urgent','i-assign',un.length,'مهمة بلا محسنين','اطلب تعزيزًا من الفريق الاحتياطي','data-a="go" data-n="tasks"'); }
  const wd = ts.reduce((n, t) => n + (L ? pendingWithdraws(t).length : 0), 0);
  if (wd)             { any = 1; out += box('soon','i-out',wd,'طلب انسحاب من مهمة','بانتظار موافقتك أو رفضك','data-a="go" data-n="tasks"'); }
  if (soon.length)    { any = 1; out += box('soon','i-clock',soon.length,'مهمة خلال ١٢ ساعة',
    soon.map(t => t.title + ' ' + t12(t.start)).slice(0,2).join(' · '),'data-a="go" data-n="tasks"'); }
  if (inbox)          { any = 1; out += box('soon','i-bell',inbox,'طلب بانتظار ردك','تسكين أو تفويض','data-a="go" data-n="requests"'); }
  if (tks)            { any = 1; out += box('','i-ticket',tks,'تذكرة مفتوحة','من الحجاج والكنترول والمحسنين','data-a="go" data-n="tickets"'); }
  if (!any) out += '<div class="note g">' + icon('i-checkc','s16') + '<span>لا يوجد ما يستدعي انتباهك الآن.</span></div>';
  return out;
}

/* ============================ رئيسية الليدر ============================ */
function screenLeaderHome() {
  const u = me(), org = ORGS.find(o => o.id === u.orgId) || ORGS[0], ts = myTasks();
  const live = activeTasks(u.id), upcoming = live.slice(0, 3);
  const rt = personRating(u.id);
  return bar('مُحسن ليدر') + '<div class="view">' + ground() +
    '<div class="c gold"><div class="fl">' + avat(u, 'lg') +
      '<div class="sp"><div class="row"><b style="font-size:16px">' + E(u.name) + '</b>' + pill(u.kt, 'gold') + '</div>' +
      '<div class="sm dim">' + E(org.ar) + ' · ' + E(org.country) + '</div>' +
      (rt.n ? '<div style="margin-top:6px">' + stars(rt.avg) + '</div>' : '') + '</div></div></div>' +

    '<div class="banner bgw-haram"><span class="bt">' +
      '<b>' + E(dayName(now())) + ' · ' + hijri(now()) + '</b><span>' +
      AR(ts.filter(t => dayStart(t.start) === dayStart(now())).length) + ' مهمة اليوم</span></span></div>' +

    '<div class="grid3">' +
      '<div class="kpi"><b>' + AR(u.pilgrims) + '</b><span>حاج</span></div>' +
      '<div class="kpi"><b>' + AR(teamOf(u.id).length) + '</b><span>محسن</span></div>' +
      '<div class="kpi"><b>' + AR(ts.length) + '</b><span>مهمة</span></div></div>' +

    statusBoxes() +
    '<div class="lbl">المهام القادمة<small>' + AR(live.length) + ' مهمة قائمة</small></div>' +
    (upcoming.length ? upcoming.map(t => taskRow(t)).join('') +
      (live.length > upcoming.length
        ? '<button class="btn l sm" data-a="pickbucket" data-v="all">' + icon('i-tasks','s16') +
          'عرض بقية المهام (' + AR(live.length - upcoming.length) + ')</button>' : '')
      : '<div class="c center" style="padding:24px"><b>لا توجد مهام قائمة</b>' +
        '<div class="sm dim" style="margin-top:6px">كل ما لديك مُغلق — راجع «المنجزة» في المهام.</div>' +
        '<button class="btn l sm" style="margin-top:12px" data-a="pickbucket" data-v="done">' +
          icon('i-checkc','s16') + 'المهام المنجزة</button></div>') +
    '</div>' + tabs();
}

/* ============================ رئيسية المحسن ============================ */
function screenMuhsenHome() {
  const u = me(), L = userById(u.leaderId), t = currentTask();
  const teamLine = u.reserve ? 'فريق احتياطي — مشترك بين الليدرز'
    : L ? 'فريق ' + L.name + ' · ' + L.kt : 'بلا فريق';
  const rt = personRating(u.id);
  return bar('المهمة الحالية') + '<div class="view">' + ground() +
    '<div class="c gold"><div class="fl">' + avat(u, 'lg') +
      '<div class="sp"><div class="row"><b style="font-size:16px">' + E(u.name) + '</b>' + pill(u.code, 'gold') + '</div>' +
      '<div class="sm dim">' + E(u.specialty) + ' · ' + E(teamLine) + '</div>' +
      (rt.n ? '<div style="margin-top:6px">' + stars(rt.avg) + '</div>' : '') + '</div></div></div>' +

    statusBoxes() +

    (!t ? '<div class="c center" style="padding:30px 16px">' +
        '<div style="color:var(--dim2);margin-bottom:8px;display:flex;justify-content:center">' + icon('i-tasks','s26') + '</div>' +
        '<b>لا توجد مهمة حالية</b><div class="sm dim" style="margin-top:4px">ستظهر مهمتك هنا فور قبولك طلب تسكين.</div></div>'
      : muhsenTaskCard(t, u)) +

    (function () {
      const live = activeTasks(u.id).filter(x => !t || x.id !== t.id);
      if (!live.length) return '';
      return '<div class="lbl">مهامك القادمة<small>' + AR(live.length) + '</small></div>' +
        live.slice(0, 3).map(x => taskRow(x)).join('') +
        (live.length > 3 ? '<button class="btn l sm" data-a="pickbucket" data-v="all">' +
          icon('i-tasks','s16') + 'عرض الكل (' + AR(live.length) + ')</button>' : '');
    })() +
    '</div>' + tabs();
}

function muhsenTaskCard(t, u) {
  recomputeStatus(t);
  const a = acceptedSlots(t).find(x => x.muhsenId === u.id);
  const deleg = isDelegate(t, u.id);
  const doneSubs = t.subs.filter(s => s.done).length;
  let block = '';
  if (t.status === 'running') {
    block = '<div class="note g">' + icon('i-play','s16') + '<span>المهمة جارية — نفّذ المهام الفرعية.</span></div>' +
      '<button class="btn p" data-a="go" data-n="task" data-id="' + t.id + '">' + icon('i-tasks','s16') +
      'فتح المهام الفرعية (' + AR(doneSubs) + ' من ' + AR(t.subs.length) + ')</button>';
  } else {
    block = attendCard(t, u, deleg) ||
      '<div class="note b">' + icon('i-info','s16') + '<span>تبدأ المهمة ' + t12(t.start) + ' — ' + untilTxt(t.start) + '</span></div>';
  }
  return svcCard(t) + metaCard(t) +
    (deleg ? '<div class="note b">' + icon('i-shield','s16') +
      '<span>أُسندت إليك قيادة هذه المهمة — تبدأها وتغلقها، ولا تملك التسكين.</span></div>' : '') +
    '<div class="c">' +
      '<div class="row" style="margin-bottom:10px"><b class="sm">حجاج ' + E(t.kt) + '</b>' +
        pill(AR(ktCount(t.kt)) + ' حاجًا', 'gold') + '</div>' + block + '</div>' +
    '<button class="btn l" data-a="go" data-n="task" data-id="' + t.id + '">' +
      icon('i-tasks','s16') + 'تفاصيل المهمة</button>';
}

/* ============================ الطلبات — للمحسن ============================ */
function screenRequests() {
  const rq = myRequests();
  const u = me();
  const log = S.requests.filter(r => r.to === u.id || r.from === u.id).slice(0, 20);
  return bar('الطلبات') + '<div class="view">' + ground() +
    (rq.length ? rq.map(r => reqActionCard(r)).join('')
      : '<div class="c center" style="padding:30px 16px"><b>لا توجد طلبات معلّقة</b>' +
        '<div class="sm dim" style="margin-top:4px">ستصلك طلبات التسكين والتفويض هنا.</div></div>') +
    '<div class="lbl">السجل<small>' + AR(log.length) + ' طلبًا</small></div>' +
    (log.length ? log.map(r => reqCardFull(r, false)).join('')
      : '<div class="c center dim sm">لا يوجد سجل بعد</div>') +
    '</div>' + tabs();
}

function reqActionCard(r) {
  const t = r.t;
  if (r.kind === 'assign') {
    const a = t.assigned.find(x => x.muhsenId === S.session.id && x.req === 'pending');
    return '<div class="c gold"><div class="row"><b style="font-size:14.5px">طلب تسكين</b>' + pill('يحتاج ردًا', 'wait') + '</div>' +
      '<div class="fl" style="gap:10px;background:#F8F6F0;border-radius:14px;padding:12px;margin:11px 0">' +
        '<span class="thumb bg-' + t.photo + '" style="width:52px;height:52px"></span>' +
        '<span class="sp"><b class="sm" style="display:block">' + E(t.title) + '</b>' +
        '<span class="tiny dim">' + hijri(t.start) + ' · ' + t12(t.start) + ' إلى ' + t12(t.end) + '</span>' +
        '<span class="tiny dim2">' + E(t.place) + ' · ' + AR(t.subs.length) + ' مهمة فرعية</span></span></div>' +
      (a && a.reqNote ? '<div class="note a">' + icon('i-edit','s16') + '<span>' + E(a.reqNote) + '</span></div>' : '') +
      '<div class="fl tiny dim2" style="margin:10px 0">' + avat(userById(t.leaderId), 'sm') +
        '<span>من ' + E(userById(t.leaderId).name) + ' · ' + (a ? ago(a.reqAt) : '') + '</span></div>' +
      '<div class="grid2"><button class="btn d sm" data-a="resp" data-id="' + t.id + '" data-v="0">رفض</button>' +
      '<button class="btn p sm" data-a="resp" data-id="' + t.id + '" data-v="1">قبول</button></div></div>';
  }
  const d = t.delegate;
  return '<div class="c gold"><div class="row"><b style="font-size:14.5px">إسناد صلاحية القيادة</b>' + pill('يحتاج ردًا', 'wait') + '</div>' +
    '<div class="tiny dim" style="margin:6px 0 10px">' + E(t.title) + ' · ' + hijri(t.start) + ' · ' + E(orgOf(t).ar) + '</div>' +
    '<div class="note b">' + icon('i-shield','s16') + '<span>ستملك: بدء المهمة · إغلاقها · المهام الفرعية.<br>' +
      'لن تملك: التسكين ولا الإسناد.<br>' + (d.keepGroup ? 'وتبقى محسنًا في المهمة.' : '<b>وتُزال من التسكين لتتفرّغ للقيادة.</b>') + '</span></div>' +
    '<div class="grid2" style="margin-top:11px">' +
      '<button class="btn d sm" data-a="rdeleg" data-id="' + t.id + '" data-v="0">رفض</button>' +
      '<button class="btn p sm" data-a="rdeleg" data-id="' + t.id + '" data-v="1">قبول</button></div></div>';
}
