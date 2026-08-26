/* ============================ المُوجِّه ============================ */
const SCREENS = {
  login: screenLogin,
  home: screenLeaderHome, tasks: screenTasks, task: screenTask, assign: screenAssign,
  mhome: screenMuhsenHome, mytask: screenMyTask, requests: screenReqCenter,
  tickets: screenTickets, ticket: screenTicket, reports: screenReports, report: screenReport, notifs: screenNotifs,
  pilgrims: screenPilgrims, muhsens: screenMuhsens, profile: screenProfile, more: screenMore,
  filter: screenFilter, pending: screenPending, lreq: screenReqCenter, timeline: screenTimeline, calendar: screenCalendar, completed: screenCompleted, admin: screenAdmin
};

function render() {
  if (!S.session) S.route = { n: 'login' };
  autoNotifs();
  S.tasks.forEach(recomputeStatus);
  const n = S.route.n;
  const fn = SCREENS[n] || (isLeader() ? screenLeaderHome : screenMuhsenHome);
  const el = document.getElementById('screen');
  el.className = n === 'admin' ? 'adm' : '';
  let html = fn();
  html = html.replace('<div class="view">', '<div class="view">' + alertsHTML());

  /* تنبيه بارز لأي إشعار جديد لم يُعرض بعد */
  const fresh = S.session ? S.notifs.filter(x => x.to === S.session.id && !x.read) : [];
  if (fresh.length && fresh[0].id !== S._seen) { S._seen = fresh[0].id; S.push = fresh[0].id; S._pushAt = Date.now(); }
  let pushHTML = '';
  if (S.push && S.session) {
    const p = S.notifs.find(x => x.id === S.push);
    if (!p || p.read) S.push = null;
    else {
      const kind = /تحذير|متأخر|رفض|تخلّف|بدأ وقت/.test(p.title) ? 'bad'
        : /بلا رد|لم يبدأ|تذكير/.test(p.title) ? 'warn' : '';
      pushHTML = '<div class="push ' + kind + '" data-a="opennotif" data-id="' + p.id + '">' +
        icon(p.icon, 's26') + '<span class="sp"><b>' + E(p.title) + '</b><span>' + E(p.body) + '</span></span>' +
        '<button class="x" data-a="dismiss">' + icon('i-x','s16') + '</button></div>';
    }
  }

  if (pushHTML) html = html.replace('<div class="view">', '<div class="view">' + pushHTML);
  if (S.sheet) html += '<div class="scrim" data-a="close"></div><div class="sheet">' + S.sheet + '</div>';
  if (S.toast) html += '<div class="toast">' + icon(S.toast.kind === 'r' ? 'i-warn' : 'i-checkc', 's18') +
    '<span class="sp">' + E(S.toast.text) + '</span></div>';

  /* حفظ موضع التمرير: لا نعيده إلى الأعلى إن بقينا في الشاشة نفسها */
  const key = n + ':' + (S.route.id || '');
  const prev = el.querySelector('.view');
  const keep = S._viewKey === key && prev ? prev.scrollTop : 0;
  el.innerHTML = html;
  const now_ = el.querySelector('.view');
  if (now_ && keep) now_.scrollTop = keep;
  S._viewKey = key;
  centerActiveTab();
  save();
  if (S.toast) { const t = S.toast; setTimeout(() => { if (S.toast === t) { S.toast = null; render(); } }, 2600); }
}

/* ===== شريط التابات: سحب بالماوس، تمرير لمسي أصيل، وإظهار التاب النشط ===== */
function centerActiveTab() {
  const bar = document.querySelector('.tabs'); if (!bar) return;
  const on = bar.querySelector('button.on'); if (!on) return;
  bar.scrollLeft = on.offsetLeft - (bar.clientWidth - on.offsetWidth) / 2;
}

(function tabDrag() {
  let st = null;
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;   /* اللمس يستخدم التمرير الأصيل */
    const bar = e.target.closest && e.target.closest('.tabs'); if (!bar) return;
    st = { bar: bar, x: e.clientX, left: bar.scrollLeft, moved: false, id: e.pointerId };
  });
  document.addEventListener('pointermove', function (e) {
    if (!st || e.pointerId !== st.id) return;
    const dx = e.clientX - st.x;
    if (!st.moved && Math.abs(dx) < 5) return;
    if (!st.moved) {
      st.moved = true; st.bar.classList.add('dragging');
      try { st.bar.setPointerCapture(e.pointerId); } catch (err) {}
    }
    st.bar.scrollLeft = st.left - dx;
    e.preventDefault();
  });
  function stop() {
    if (!st) return;
    const bar = st.bar;
    if (st.moved) {
      bar.classList.remove('dragging');
      bar.dataset.dragged = '1';
      setTimeout(function () { delete bar.dataset.dragged; }, 220);
    }
    try { bar.releasePointerCapture(st.id); } catch (err) {}
    st = null;
  }
  document.addEventListener('pointerup', stop);
  document.addEventListener('pointercancel', stop);

  /* عجلة الماوس تمرّر الشريط أفقيًا */
  document.addEventListener('wheel', function (e) {
    const bar = e.target.closest && e.target.closest('.tabs'); if (!bar) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!d) return;
    bar.scrollLeft += d; e.preventDefault();
  }, { passive: false });
})();

/* عدّاد حي — يحدّث الأرقام فقط بلا إعادة رسم الشاشة (حتى لا يقفز التمرير) */
setInterval(() => {
  if (!S || !S.session) return;
  document.querySelectorAll('.timer[data-deadline]').forEach(el => {
    const r = hms(Number(el.dataset.deadline) - now());
    const b = el.querySelectorAll('b');
    if (b.length === 3) { b[0].textContent = AR(r.h); b[1].textContent = AR(r.m); b[2].textContent = AR(r.s); }
  });
}, 1000);

/* ============================ الأحداث ============================ */
const val = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };

document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-a]'); if (!b) return;
  const inTabs = b.closest('.tabs');
  if (inTabs && inTabs.dataset.dragged) return;   /* كان سحبًا لا نقرًا */
  const a = b.dataset.a, id = b.dataset.id, gid = b.dataset.g, uid_ = b.dataset.u, v = b.dataset.v;
  const T = () => taskById(id), G = () => { const t = T(); return t.groups.find(x => x.id === gid); };
  const K = () => S.tickets.find(x => x.id === id);
  const buzz = () => { try { navigator.vibrate && navigator.vibrate(18); } catch (e) {} };

  switch (a) {
    /* تنقّل */
    case 'go': S.sheet = null; S.route = { n: b.dataset.n, id }; break;
    case 'back': S.sheet = null; S.route = { n: isLeader() ? 'home' : 'mhome' }; break;
    case 'close': S.sheet = null; break;
    case 'dismiss': S.push = null; break;
    case 'replacepick': { const t = T(), g = G(); withdrawRequest(t, g); S.sheet = pickSheet(t, g); break; }
    case 'seg': S.tab[b.dataset.k] = v; break;

    /* دخول وخروج */
    case 'role': S.loginRole = b.dataset.r; break;
    case 'login': {
      const u = userById(id); S.session = { id: u.id, at: Date.now() };
      S.route = { n: u.role === 'leader' ? 'home' : 'mhome' };
      toast('مرحبًا ' + u.name + ' — ' + (u.role === 'leader' ? 'محسن ليدر' : 'مُحسن'), 'g'); buzz(); break;
    }
    case 'logout': S.session = null; S.route = { n: 'login' }; S.sheet = null; break;

    /* موقع */
    case 'place': S.sheet = placeSheet(); break;
    case 'setplace': S.myPlace = v; S.sheet = null; toast(v === 'site' ? 'موقعك الآن داخل موقع المهمة' : 'موقعك الآن خارج النطاق'); break;

    /* حضور */
    case 'attend': attend(T(), S.session.id); buzz(); toast('أُثبت حضورك ' + t12(now())); break;

    /* تسكين */
    case 'pick': S.sheet = pickSheet(T(), G()); break;
    case 'send': { const t = T(), g = G(); sendRequest(t, g, uid_); S.sheet = null;
      toast('أُرسل الطلب إلى ' + userById(uid_).name); break; }
    case 'withdraw': withdrawRequest(T(), G()); toast('سُحب الطلب'); break;
    case 'swap': { const g = G(); S.sheet = textSheet('طلب استبدال', 'مجموعة ' + AR(g.no) + ' · ' + userById(g.muhsenId).name,
      'data-a="dswap" data-id="' + id + '" data-g="' + gid + '"', '', 'ملاحظة للمحسن (اختيارية)'); break; }
    case 'dswap': sendSwap(T(), G(), val('txt')); S.sheet = null; toast('أُرسل طلب الاستبدال'); break;

    /* ردود المحسن */
    case 'resp': {
      if (v === '1') { respondRequest(T(), G(), true); buzz(); toast('قبلت الطلب — أنت الآن على المجموعة'); }
      else { S.sheet = textSheet('سبب الرفض', 'يصل السبب للقائد مع الإشعار',
        'data-a="doresp" data-id="' + id + '" data-g="' + gid + '"', '', 'مثال: مسند على مهمة أخرى'); }
      break;
    }
    case 'doresp': respondRequest(T(), G(), false, val('txt') || 'بلا سبب'); S.sheet = null; toast('رُفض الطلب وأُبلغ القائد', 'r'); break;
    case 'rswap': {
      if (v === '1') { respondSwap(T(), G(), true); buzz(); toast('قبلت الاستبدال — أُزلت من المجموعة'); }
      else { S.sheet = textSheet('سبب رفض الاستبدال', 'تكمل مهمتك طبيعيًا',
        'data-a="dorswap" data-id="' + id + '" data-g="' + gid + '"', '', 'اكتب مبررك'); }
      break;
    }
    case 'dorswap': respondSwap(T(), G(), false, val('txt') || 'بلا مبرر'); S.sheet = null; toast('رُفض الاستبدال — تكمل مهمتك'); break;

    /* تفويض */
    case 'deleg': S.delegKeep = true; S.sheet = delegSheet(T()); break;
    case 'dkeep': S.delegKeep = v === '1'; S.sheet = delegSheet(T() || taskById(S.route.id)); break;
    case 'dsend': { const t = T() || taskById(S.route.id); if (!t) break;
      sendDelegate(t, uid_, S.delegKeep !== false); S.sheet = null;
      toast('أُرسل طلب الإسناد إلى ' + userById(uid_).name); break; }
    case 'undeleg': { const t = T(); const nm = userById(t.delegate.muhsenId).name;
      notify(t.delegate.muhsenId, 'i-xc', 'أُلغي التفويض', 'سُحبت منك صلاحية قيادة «' + t.title + '».', { n: 'requests' });
      hist(t, 'سحب القائد إسناد الصلاحية من ' + nm); t.delegate = null; toast('أُلغي الإسناد'); break; }
    case 'rdeleg': {
      if (v === '1') { respondDelegate(T(), true); buzz(); toast('قبلت صلاحية القيادة لهذه المهمة'); }
      else { S.sheet = textSheet('سبب الرفض', '', 'data-a="dordeleg" data-id="' + id + '"', '', 'اكتب سببك'); }
      break;
    }
    case 'dordeleg': respondDelegate(T(), false, val('txt')); S.sheet = null; toast('رُفض التفويض', 'r'); break;

    /* دورة المهمة */
    case 'start': startTask(T(), S.session.id); buzz(); toast('بدأت المهمة'); break;
    case 'end': S.sheet = confirmSheet('إنهاء المهمة', 'سيُغلق التنفيذ وتُسجَّل ملاحظة تلقائية بفارق الوقت والمهام غير المنجزة.',
      'data-a="doend" data-id="' + id + '"'); break;
    case 'doend': endTask(T(), S.session.id); S.sheet = null; buzz(); toast('أُغلقت المهمة'); break;
    case 'cancel': S.sheet = textSheet('إلغاء المهمة', 'المبرر إلزامي ويصل لكل المحسنين',
      'data-a="docancel" data-id="' + id + '"', '', 'سبب الإلغاء'); break;
    case 'docancel': { const r = val('txt'); if (!r) { toast('المبرر إلزامي', 'r'); break; }
      cancelTask(T(), S.session.id, r); S.sheet = null; toast('أُلغيت المهمة', 'r'); break; }
    case 'sub': { const t = T(), s = t.subs.find(x => x.id === b.dataset.s); toggleSub(t, s, S.session.id); buzz(); break; }
    case 'note': S.sheet = textSheet('إضافة ملاحظة', 'تُسجَّل على المهمة ويراها الطرفان',
      'data-a="donote" data-id="' + id + '"', '', 'اكتب ملاحظتك'); break;
    case 'donote': { const t = T(), x = val('txt'); if (x) { t.notes.push({ at: now(), kind: 'user', text: x + ' — ' + me().name });
      hist(t, 'أضاف ' + me().name + ' ملاحظة'); toast('أُضيفت الملاحظة'); } S.sheet = null; break; }
    case 'hist': S.sheet = histSheet(T()); break;
    case 'gmenu': { const t = T(), g = G();
      S.sheet = '<div class="grip"></div><h3>مجموعة ' + AR(g.no) + '</h3>' +
        '<div class="col" style="margin-top:10px">' +
        (g.muhsenId && g.req === 'pending' ? '<button class="prow" data-a="withdraw" data-id="' + t.id + '" data-g="' + g.id + '"><span class="sp b">سحب الطلب</span>' + icon('i-x','s16') + '</button>' : '') +
        (g.req === 'accepted' ? '<button class="prow" data-a="swap" data-id="' + t.id + '" data-g="' + g.id + '"><span class="sp b">طلب استبدال</span>' + icon('i-swap','s16') + '</button>' : '') +
        (!g.muhsenId ? '<button class="prow" data-a="pick" data-id="' + t.id + '" data-g="' + g.id + '"><span class="sp b">تسكين محسن</span>' + icon('i-assign','s16') + '</button>' : '') +
        '<button class="prow" data-a="go" data-n="pilgrims" data-id="' + t.id + '"><span class="sp b">حجاج المجموعة</span>' + icon('i-users','s16') + '</button>' +
        '</div><button class="btn g" style="margin-top:12px" data-a="close">إغلاق</button>';
      break; }

    /* تقارير — إجراءات */
    case 'rreply': S.sheet = textSheet('رد على التقرير', reportById(id).title,
      'data-a="dorreply" data-id="' + id + '"', '', 'اكتب ردك أو ملاحظتك'); break;
    case 'dorreply': { const x = val('txt'); if (x) { reportReply(reportById(id), S.session.id, x, 'قيد المعالجة'); toast('أُرسل الرد'); } S.sheet = null; break; }
    case 'resc': S.sheet = textSheet('تصعيد إلى الكونترول', reportById(id).title,
      'data-a="doresc" data-id="' + id + '"', '', 'سبب التصعيد (اختياري)'); break;
    case 'doresc': reportEscalate(reportById(id), S.session.id, val('txt')); S.sheet = null;
      toast('صُعّد التقرير إلى غرفة العمليات'); break;
    case 'rstate': S.sheet = reportStateSheet(reportById(id)); break;
    case 'dorstate': reportSetStatus(reportById(id), S.session.id, v); S.sheet = null; toast('صارت الحالة: ' + v); break;
    case 'rclose': reportSetStatus(reportById(id), S.session.id, 'مغلق'); toast('أُغلق التقرير'); break;
    case 'rreopen': reportSetStatus(reportById(id), S.session.id, 'قيد المعالجة'); toast('أُعيد فتح التقرير'); break;

    /* تقارير */
    case 'report': S.sheet = reportSheet(id); break;
    case 'sendreport': {
      const ti = val('rti'); if (!ti) { toast('العنوان مطلوب', 'r'); break; }
      const to = isLeader() ? 'CONTROL' : me().leaderId;
      addReport(S.session.id, to, val('rc'), ti, val('rb'), val('rt') || null);
      S.sheet = null; toast('رُفع التقرير' + (isLeader() ? ' إلى الكونترول' : ' إلى قائدك')); break;
    }

    /* بلاغات الحجاج */
    case 'pflag': { const t = T(), g = G(); const p = g.pilgrims_list.find(x => x.id === b.dataset.p);
      S.sheet = flagSheet(t, g, p); break; }
    case 'pnote': { const t=T(), g=G(); S.sheet = textSheet('ملاحظة عن حاج', g.pilgrims_list.find(x=>x.id===b.dataset.p).name,
      'data-a="dopnote" data-id="' + id + '" data-g="' + gid + '" data-p="' + b.dataset.p + '"', '', 'اكتب ملاحظتك'); break; }
    case 'dopnote': { const t=T(), g=G(); const p=g.pilgrims_list.find(x=>x.id===b.dataset.p); const x=val('txt');
      if (x) { p.note = x; hist(t, 'ملاحظة عن الحاج ' + p.name + ' — ' + x + ' (' + me().name + ')');
        addReport(S.session.id, isLeader() ? 'CONTROL' : me().leaderId, 'ملاحظة تشغيلية', 'ملاحظة عن ' + p.name, x, t.id, p.name);
        toast('سُجّلت الملاحظة'); } S.sheet = null; break; }
    case 'doflag': { const t = T(), g = G(); const p = g.pilgrims_list.find(x => x.id === b.dataset.p);
      p.flag = v === 'بلا ملاحظة' ? null : v;
      if (p.flag) { const to = isLeader() ? 'CONTROL' : me().leaderId;
        addReport(S.session.id, to, 'حالة حاج', 'بلاغ عن ' + p.name + ' — ' + v, 'مجموعة ' + AR(g.no) + ' · ' + t.title, t.id, p.name);
        hist(t, 'بلاغ عن الحاج ' + p.name + ' — ' + v + ' (' + me().name + ')'); }
      S.sheet = null; toast(p.flag ? 'سُجّل البلاغ ورُفع تقرير' : 'أُزيلت الملاحظة'); break; }

    /* تذاكر */
    case 'kreply': S.sheet = textSheet('رد على التذكرة', K().title, 'data-a="dokreply" data-id="' + id + '"', '', 'اكتب ردك'); break;
    case 'dokreply': { const x = val('txt'); if (x) { ticketReply(K(), S.session.id, x, 'قيد المعالجة'); toast('أُرسل الرد'); } S.sheet = null; break; }
    case 'kassign': S.sheet = ticketAssignSheet(K()); break;
    case 'doassign': ticketAssign(K(), uid_, S.session.id); S.sheet = null; toast('أُسندت التذكرة إلى ' + userById(uid_).name); break;
    case 'kstate': S.sheet = ticketStateSheet(K()); break;
    case 'dostate': { const k = K(); k.status = v; k.replies.push({ by: S.session.id, text: 'تغيّرت الحالة إلى «' + v + '»', at: now(), sys: true });
      if (k.leaderId !== S.session.id) notify(k.leaderId, 'i-ticket', 'تحديث تذكرة', k.title + ' — ' + v, { n: 'tickets' });
      S.sheet = null; toast('صارت الحالة: ' + v); break; }
    case 'kesc': S.sheet = textSheet('تصعيد للقائد', K().title, 'data-a="dokesc" data-id="' + id + '"', '', 'سبب التصعيد'); break;
    case 'dokesc': ticketEscalate(K(), S.session.id, val('txt')); S.sheet = null; toast('صُعّدت التذكرة للقائد'); break;
    case 'kclose': { const k = K(); k.status = 'مغلقة';
      k.replies.push({ by: S.session.id, text: 'أُغلقت التذكرة', at: now(), sys: true }); toast('أُغلقت التذكرة'); break; }
    case 'kreopen': { const k = K(); k.status = 'مفتوحة';
      k.replies.push({ by: S.session.id, text: 'أُعيد فتح التذكرة', at: now(), sys: true }); toast('أُعيد فتح التذكرة'); break; }

    /* إشعارات */
    case 'opennotif': { const n = S.notifs.find(x => x.id === id); n.read = true;
      if (n.route) S.route = { n: n.route.n, id: n.route.id }; break; }
    case 'readall': myNotifs().forEach(n => n.read = true); toast('عُلّمت كل الإشعارات كمقروءة'); break;

    /* المحسنون */
    case 'muhsenp': S.route = { n: 'profile', id }; break;

    case 'filter': S.route = { n: 'filter', id: v }; break;
    case 'assignto': S.sheet = assignToSheet(uid_); break;

    /* تذكيرات التقويم */
    case 'addrem': S.sheet = reminderSheet(); break;
    case 'dorem': {
      const tid = val('qt'), tm = val('qtime'), tx = val('qtxt');
      const t = taskById(tid);
      if (!t || !tm) { toast('اختر مهمة ووقتًا', 'r'); break; }
      const d = new Date(t.start);
      const [hh, mm] = tm.split(':').map(Number);
      d.setHours(hh, mm, 0, 0);
      S.reminders = S.reminders || [];
      S.reminders.push({ id: uid('Q'), who: S.session.id, taskId: t.id, at: d.getTime(),
        text: (tx || 'تذكير') + ' — ' + t.title, fired: false });
      S.sheet = null; toast('حُفظ التذكير ' + t12(d.getTime())); break;
    }
    case 'delrem': S.reminders = (S.reminders || []).filter(r => r.id !== id); toast('حُذف التذكير'); break;

    /* التحكم */
    case 'clock': S.clockOffset = v === '0' ? 0 : (S.clockOffset || 0) + Number(v);
      toast('الوقت الآن ' + t12(now())); break;
    case 'shift': { const t = T(), d = Number(v) * MIN; t.start += d; t.end += d; t._flags = {};
      hist(t, 'عُدّل موعد المهمة إلى ' + hijri(t.start) + ' ' + t12(t.start)); toast('عُدّل الموعد'); break; }
    case 'edittask': S.sheet = editTaskSheet(T()); break;
    case 'savetask': { const t = T(); const d = val('ed'), tm = val('et'), h = Number(val('eh')) || t.durH;
      if (d && tm) { const nd = new Date(d + 'T' + tm); t.start = nd.getTime(); t.durH = h; t.end = t.start + h * HR; t._flags = {};
        hist(t, 'عُدّلت المهمة من شاشة التحكم'); toast('حُفظت التعديلات'); }
      S.sheet = null; break; }
    case 'addtask': S.sheet = addTaskSheet(); break;
    case 'createtask': {
      const k = val('ak'), lid = val('al'), d = val('ad'), tm = val('at');
      const L = userById(lid), c = CAT[k], org = ORGS.find(o => o.id === L.orgId);
      const start = new Date(d + 'T' + tm).getTime();
      const per = Math.ceil(L.pilgrims / L.groups);
      const nt = { id: uid('T'), code: '#' + (1900 + S.tasks.length), kind: k, title: c.ar, desc: c.desc, photo: c.photo,
        place: c.place, city: c.city, leaderId: L.id, kt: L.kt, orgId: L.orgId, orgType: org.type,
        start, end: start + c.dur * HR, durH: c.dur, status: 'pending_assign', startedAt: null, endedAt: null,
        startedBy: null, endedBy: null, cancelReason: null, leaderAttendedAt: null, delegate: null, notes: [],
        groups: Array.from({ length: L.groups }, (_, i) => ({ id: uid('G'), no: i + 1,
          pilgrims: i === L.groups - 1 ? L.pilgrims - per * (L.groups - 1) : per,
          muhsenId: null, req: null, reqAt: null, reqNote: '', respAt: null, respNote: '', attendedAt: null, swap: null,
          pilgrims_list: Array.from({ length: Math.min(per, 10) }, (_, j) => {
            const f = (j + i) % 3 === 0;
            return { id: uid('P'), name: f ? PN_F[(j * 3 + i) % PN_F.length] : PN_M[(j * 5 + i) % PN_M.length],
              g: f ? 'f' : 'm', av: f ? 'p' + (5 + j % 3) : 'p' + (1 + j % 4),
              pp: 'A' + (7351000 + j * 7 + i * 31), room: 700 + i * 20 + j, flag: null };
          }) })),
        subs: c.subs.map((n2, i2) => ({ id: uid('S'), no: i2 + 1, name: n2, done: false, at: null, by: null })),
        history: [{ at: now(), text: 'أُضيفت المهمة من شاشة التحكم' }] };
      S.tasks.push(nt);
      notify(L.id, 'i-tasks', 'مهمة جديدة', '«' + nt.title + '» أُضيفت إلى جدولك — ' + hijri(nt.start), { n: 'task', id: nt.id });
      S.sheet = null; toast('أُضيفت المهمة'); break;
    }
    case 'askreset': S.sheet = confirmSheet('إعادة ضبط كل شيء',
      'ستُحذف كل التسكينات والردود والتنبيهات والتقارير وتعديلات التذاكر، وتعود البيانات إلى حالتها الأولى.',
      'data-a="doreset"', true); break;
    case 'doreset': S.sheet = null; reset(); return;
  }
  render();
});

/* ============================ إقلاع ============================ */
load();
if (!S.session) S.route = { n: 'login' };
render();
