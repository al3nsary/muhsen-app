/* ============================ المُوجِّه ============================ */
const SCREENS = {
  login: screenLogin,
  home: screenLeaderHome, mhome: screenMuhsenHome,
  tasks: screenTasks, task: screenTask, assign: screenAssign, timeline: screenTimeline,
  lreq: screenReqCenter, requests: screenRequests,
  tickets: screenTickets, ticket: screenTicket,
  rating: screenRating, taskrating: screenTaskRating,
  notifs: screenNotifs, pilgrims: screenPilgrims, muhsens: screenMuhsens,
  profile: screenProfile, more: screenMore, calendar: screenCalendar, admin: screenAdmin,
  album: screenAlbum, photo: screenPhoto, doc: screenDoc
};

function render() {
  if (!S.session) S.route = { n: 'login' };
  if (S.session) { autoTick(); S.tasks.forEach(recomputeStatus); }
  const n = S.route.n;
  const fn = SCREENS[n] || (isLeader() ? screenLeaderHome : screenMuhsenHome);
  const el = document.getElementById('screen');
  el.className = n === 'admin' ? 'adm' : '';
  let html = fn();
  html = html.replace('<div class="view">', '<div class="view">' + alertsHTML());

  let pushHTML = '';
  const fresh = S.session ? S.notifs.filter(x => x.to === S.session.id && !x.read) : [];
  if (fresh.length && fresh[0].id !== S._seen) { S._seen = fresh[0].id; S.push = fresh[0].id; }
  if (S.push && S.session) {
    const p = S.notifs.find(x => x.id === S.push);
    if (!p || p.read) S.push = null;
    else {
      const kind = /تحذير|متأخر|رفض|تخلّف|بدأها النظام|تجاوزت/.test(p.title) ? 'bad'
        : /بلا رد|تحتاج|تذكير|فُتحت|بقيت/.test(p.title) ? 'warn' : '';
      pushHTML = '<div class="push ' + kind + '" data-a="opennotif" data-id="' + p.id + '">' +
        icon(p.icon, 's26') + '<span class="sp"><b>' + E(p.title) + '</b><span>' + E(p.body) + '</span></span>' +
        '<button class="x" data-a="dismiss">' + icon('i-x','s16') + '</button></div>';
    }
  }
  if (pushHTML) html = html.replace('<div class="view">', '<div class="view">' + pushHTML);
  if (S.sheet) html += '<div class="scrim" data-a="close"></div><div class="sheet">' + S.sheet + '</div>';
  if (S.toast) html += '<div class="toast">' + icon(S.toast.kind === 'r' ? 'i-warn' : 'i-checkc', 's18') +
    '<span class="sp">' + E(S.toast.text) + '</span></div>';

  const key = n + ':' + (S.route.id || '');
  const prev = el.querySelector('.view');
  const keep = S._viewKey === key && prev ? prev.scrollTop : 0;
  el.innerHTML = html;
  const nv = el.querySelector('.view');
  if (nv && keep) nv.scrollTop = keep;
  S._viewKey = key;
  centerActiveTab();
  save();
  if (S.toast) { const t = S.toast; setTimeout(() => { if (S.toast === t) { S.toast = null; render(); } }, 2600); }
}

/* ===== شريط التابات ===== */
function centerActiveTab() {
  const bar_ = document.querySelector('.tabs'); if (!bar_) return;
  const on = bar_.querySelector('button.on'); if (!on) return;
  bar_.scrollLeft = on.offsetLeft - (bar_.clientWidth - on.offsetWidth) / 2;
}
(function tabDrag() {
  let st = null;
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const b = e.target.closest && e.target.closest('.tabs'); if (!b) return;
    st = { bar: b, x: e.clientX, left: b.scrollLeft, moved: false, id: e.pointerId };
  });
  document.addEventListener('pointermove', function (e) {
    if (!st || e.pointerId !== st.id) return;
    const dx = e.clientX - st.x;
    if (!st.moved && Math.abs(dx) < 5) return;
    if (!st.moved) { st.moved = true; st.bar.classList.add('dragging');
      try { st.bar.setPointerCapture(e.pointerId); } catch (err) {} }
    st.bar.scrollLeft = st.left - dx; e.preventDefault();
  });
  function stop() {
    if (!st) return;
    const b = st.bar;
    if (st.moved) { b.classList.remove('dragging'); b.dataset.dragged = '1';
      setTimeout(function () { delete b.dataset.dragged; }, 220); }
    try { b.releasePointerCapture(st.id); } catch (err) {}
    st = null;
  }
  document.addEventListener('pointerup', stop);
  document.addEventListener('pointercancel', stop);
  document.addEventListener('wheel', function (e) {
    const b = e.target.closest && e.target.closest('.tabs'); if (!b) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!d) return; b.scrollLeft += d; e.preventDefault();
  }, { passive: false });
})();

/* عدّاد حي */
setInterval(() => {
  if (!S || !S.session) return;
  let due = false;
  document.querySelectorAll('.timer[data-deadline]').forEach(el => {
    const target = Number(el.dataset.deadline);
    if (now() >= target) due = true;
    const r = hms(Math.abs(target - now()));
    const b = el.querySelectorAll('b');
    if (b.length === 3) { b[0].textContent = AR(r.h); b[1].textContent = AR(r.m); b[2].textContent = AR(r.s); }
  });
  if (due) render();
}, 1000);

/* ============================ الأحداث ============================ */
const val = id => { const e = document.getElementById(id); return e ? String(e.value).trim() : ''; };

document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-a]'); if (!b) return;
  const inTabs = b.closest ? b.closest('.tabs') : null;
  if (inTabs && inTabs.dataset.dragged) return;
  const a = b.dataset.a, id = b.dataset.id, uid_ = b.dataset.u, v = b.dataset.v;
  const T = () => taskById(id);
  const K = () => S.tickets.find(x => x.id === id);
  const buzz = () => { try { navigator.vibrate && navigator.vibrate(18); } catch (e) {} };

  switch (a) {
    case 'go': S.sheet = null; S.route = { n: b.dataset.n, id }; break;
    case 'back': S.sheet = null; S.route = { n: isLeader() ? 'home' : 'mhome' }; break;
    case 'close': S.sheet = null; break;
    case 'dismiss': S.push = null; break;
    case 'seg': S.tab[b.dataset.k] = v; break;
    case 'psearch': return;

    case 'role': S.loginRole = b.dataset.r; break;
    case 'login': { const u = userById(id); S.session = { id: u.id, at: Date.now() };
      S.route = { n: u.role === 'leader' ? 'home' : 'mhome' };
      toast('مرحبًا ' + u.name, 'g'); buzz(); break; }
    case 'logout': S.session = null; S.route = { n: 'login' }; S.sheet = null; break;

    case 'place': S.sheet = placeSheet(); break;
    case 'setplace': S.myPlace = v; S.sheet = null;
      toast(v === 'site' ? 'موقعك داخل موقع المهمة' : 'موقعك خارج النطاق — يُسجَّل ملاحظةً'); break;
    case 'attend': { const t = T(); if (!t) break;
      if (now() < prepOpen(t)) { toast('يفتح التحضير من بداية يوم المهمة', 'r'); break; }
      attend(t, S.session.id); buzz(); toast('أُثبت حضورك ' + t12(now())); break; }

    case 'send': { const t = T(); if (!t) break;
      if (lockedForAssign(t)) { toast('التسكين مقفل — بدأت المهمة', 'r'); break; }
      if (busyIn(uid_, t)) { toast('المحسن مرتبط بمهمة متداخلة', 'r'); break; }
      if (sendRequest(t, uid_)) { S.sheet = null; toast('أُرسل الطلب إلى ' + userById(uid_).name); }
      else toast('تعذّر الإرسال — الطلب قائم بالفعل', 'r');
      break; }
    case 'withdraw': { const t = T(); if (!t || lockedForAssign(t)) { toast('التسكين مقفل', 'r'); break; }
      withdrawRequest(t, uid_); S.sheet = null; toast('سُحب الطلب'); break; }
    case 'removeasg': { const t = T(); if (!t || lockedForAssign(t)) { toast('التسكين مقفل', 'r'); break; }
      S.pendingExcuse = null;
      S.sheet = reasonSheet('سبب الإزالة من التسكين', userById(uid_).name,
        'data-a="doremove" data-id="' + id + '" data-u="' + uid_ + '"', 'سبب الإزالة', 'remove', id, uid_); break; }
    case 'doremove': { const rr = val('txt');
      if (!rr) { toast('سبب الإزالة إلزامي', 'r'); break; }
      removeAssignee(T(), uid_, rr, S.pendingExcuse); S.pendingExcuse = null;
      S.sheet = null; toast('أُزيل من المهمة'); break; }
    case 'smenu': S.sheet = slotMenuSheet(T(), uid_); break;

    case 'resp': { const t = T(); if (!t) break;
      if (v === '1') { respondRequest(t, S.session.id, true); buzz(); toast('قبلت التسكين'); }
      else { S.pendingExcuse = null;
        S.sheet = reasonSheet('سبب رفض التسكين', t.title, 'data-a="doresp" data-id="' + id + '"',
          'مثال: مرتبط بمهمة أخرى', 'resp', id); }
      break; }
    case 'doresp': { const rr = val('txt');
      if (!rr) { toast('سبب الرفض إلزامي — يصل الليدر', 'r'); break; }
      respondRequest(T(), S.session.id, false, rr, S.pendingExcuse); S.pendingExcuse = null;
      S.sheet = null; toast('رُفض الطلب وأُبلغ الليدر', 'r'); break; }

    case 'deleg': S.delegKeep = true; S.sheet = delegSheet(T()); break;
    case 'dkeep': S.delegKeep = v === '1'; S.sheet = delegSheet(taskById(S.route.id) || T()); break;
    case 'dsend': { const t = T() || taskById(S.route.id); if (!t) break;
      if (orgOf(t).type !== 'شركة') { toast('الإسناد للشركات فقط', 'r'); S.sheet = null; break; }
      sendDelegate(t, uid_, S.delegKeep !== false); S.sheet = null;
      toast('أُرسل الإسناد إلى ' + userById(uid_).name); break; }
    case 'undeleg': { const t = T(); if (!t || !t.delegate) break;
      notify(t.delegate.muhsenId, 'i-xc', 'أُلغي التفويض', 'سُحبت منك قيادة «' + t.title + '».', { n:'requests' });
      hist(t, 'سحب الليدر إسناد القيادة'); t.delegate = null; toast('أُلغي الإسناد'); break; }
    case 'rdeleg': { const t = T(); if (!t) break;
      if (v === '1') { respondDelegate(t, true); buzz(); toast('قبلت قيادة المهمة'); }
      else { S.pendingExcuse = null;
        S.sheet = reasonSheet('سبب رفض التفويض', t.title, 'data-a="dordeleg" data-id="' + id + '"',
          'اكتب سببك', 'rdeleg', id); }
      break; }
    case 'dordeleg': { const rr = val('txt');
      if (!rr) { toast('سبب الرفض إلزامي', 'r'); break; }
      respondDelegate(T(), false, rr, S.pendingExcuse); S.pendingExcuse = null;
      S.sheet = null; toast('رُفض التفويض', 'r'); break; }

    case 'start': { const t = T(); if (!canStart(t, S.session.id)) { toast('لا يمكن البدء الآن', 'r'); break; }
      startTask(t, S.session.id); buzz(); toast('بدأت المهمة'); break; }
    case 'end': S.sheet = confirmSheet('إنهاء المهمة',
      'ستُسجَّل الملاحظات التلقائية ويُحتسب تقييم النظام.', 'data-a="doend" data-id="' + id + '"'); break;
    case 'doend': { const t = T(); endTask(t, S.session.id); S.sheet = null; buzz();
      toast('أُغلقت المهمة — التقييم ' + t.rating.system + ' من ٥'); break; }
    case 'cancel': S.pendingExcuse = null;
      S.sheet = reasonSheet('إلغاء المهمة', 'المبرر إلزامي ويصل كل المسكَّنين',
        'data-a="docancel" data-id="' + id + '"', 'سبب الإلغاء', 'cancel', id); break;
    case 'docancel': { const r = val('txt'); if (!r) { toast('المبرر إلزامي', 'r'); break; }
      cancelTask(T(), S.session.id, r, S.pendingExcuse); S.pendingExcuse = null;
      S.sheet = null; toast('أُلغيت المهمة', 'r'); break; }
    case 'sub': { const t = T(); if (t.status !== 'running') { toast('المهمة لم تبدأ بعد', 'r'); break; }
      const s = t.subs.find(x => x.id === b.dataset.s); toggleSub(t, s, S.session.id); buzz(); break; }
    case 'note': S.sheet = textSheet('إضافة ملاحظة', 'تُسجَّل على المهمة',
      'data-a="donote" data-id="' + id + '"', '', 'اكتب ملاحظتك'); break;
    case 'donote': { const t = T(), x = val('txt');
      if (x) { note(t, x + ' — ' + me().name, 'user'); hist(t, 'أضاف ' + me().name + ' ملاحظة'); toast('أُضيفت الملاحظة'); }
      S.sheet = null; break; }

    case 'rerate': { const t = T(); rateTask(t); toast('أُعيد الاحتساب — ' + t.rating.system + ' من ٥'); break; }
    case 'rateall': { let n2 = 0; S.tasks.filter(t => t.status === 'done').forEach(t => { rateTask(t); n2++; });
      toast('أُعيد تقييم ' + AR(n2) + ' مهمة'); break; }
    case 'finishsome': { const t = S.tasks.find(x => x.status === 'running');
      if (!t) { toast('لا توجد مهمة جارية', 'r'); break; }
      endTask(t, ownerOf(t)); toast('أُنهيت «' + t.title + '» — التقييم ' + t.rating.system); break; }

    case 'newticket': S.sheet = ticketSheet(id); break;
    case 'sendticket': { const ti = val('kti'); if (!ti) { toast('العنوان مطلوب', 'r'); break; }
      const k = addTicket(S.session.id, ti, val('kb'), val('kc'), val('kp'), val('kt2') || null);
      S.sheet = null; toast('رُفعت التذكرة ' + k.no); break; }
    case 'kreply': S.sheet = textSheet('رد على التذكرة', K().title, 'data-a="dokreply" data-id="' + id + '"', '', 'اكتب ردك'); break;
    case 'dokreply': { const x = val('txt'); if (x) { ticketReply(K(), S.session.id, x, 'قيد المعالجة'); toast('أُرسل الرد'); }
      S.sheet = null; break; }
    case 'kassign': S.sheet = ticketAssignSheet(K()); break;
    case 'doassign': ticketAssign(K(), uid_, S.session.id); S.sheet = null;
      toast('أُسندت إلى ' + userById(uid_).name); break;
    case 'kstate': S.sheet = ticketStateSheet(K()); break;
    case 'dostate': ticketState(K(), S.session.id, v); S.sheet = null; toast('صارت الحالة: ' + v); break;
    case 'kesc': S.sheet = textSheet('تصعيد للّيدر', K().title, 'data-a="dokesc" data-id="' + id + '"', '', 'سبب التصعيد'); break;
    case 'dokesc': ticketEscalate(K(), S.session.id, val('txt')); S.sheet = null; toast('صُعّدت التذكرة'); break;
    case 'kclose': ticketState(K(), S.session.id, 'مغلقة'); toast('أُغلقت التذكرة'); break;
    case 'kreopen': ticketState(K(), S.session.id, 'مفتوحة'); toast('أُعيد فتح التذكرة'); break;

    case 'pflag': { const kt = b.dataset.kt; const p = pilgrimsOf(kt).find(x => x.id === b.dataset.p);
      S.sheet = flagSheet(kt, p); break; }
    case 'doflag': { const kt = b.dataset.kt; const p = pilgrimsOf(kt).find(x => x.id === b.dataset.p);
      p.flag = v === 'بلا ملاحظة' ? null : v;
      if (p.flag) addTicket(S.session.id, 'بلاغ عن ' + p.name + ' — ' + v,
        'الحاج ' + p.name + ' · غرفة ' + p.room + ' · ' + p.pp, 'حالة صحية', 'عاجلة', null, p.id);
      S.sheet = null; toast(p.flag ? 'سُجّل البلاغ كتذكرة' : 'أُزيلت الملاحظة'); break; }
    case 'pnote': S.sheet = textSheet('ملاحظة عن حاج', '',
      'data-a="dopnote" data-kt="' + b.dataset.kt + '" data-p="' + b.dataset.p + '"', '', 'اكتب ملاحظتك'); break;
    case 'dopnote': { const kt = b.dataset.kt; const p = pilgrimsOf(kt).find(x => x.id === b.dataset.p);
      const x = val('txt');
      if (x) { p.note = x; addTicket(S.session.id, 'ملاحظة عن ' + p.name, x, 'ملاحظة تشغيلية', 'عادية', null, p.id);
        toast('سُجّلت الملاحظة كتذكرة'); }
      S.sheet = null; break; }

    case 'opennotif': { const n2 = S.notifs.find(x => x.id === id); if (n2) { n2.read = true; S.push = null;
      if (n2.route) S.route = { n: n2.route.n, id: n2.route.id }; } break; }
    case 'readall': myNotifs().forEach(n2 => n2.read = true); S.push = null; toast('عُلّمت كمقروءة'); break;

    case 'week': S.calWeek = v === '0' ? 0 : (S.calWeek || 0) + Number(v); break;
    case 'calday': S.calDay = Number(v); break;
    case 'addrem': S.sheet = reminderSheet(); break;
    case 'dorem': {
      const d = val('qd'), tm = val('qtime'), tx = val('qtxt');
      if (!d || !tm) { toast('اختر التاريخ والوقت', 'r'); break; }
      const at = new Date(d + 'T' + tm).getTime();
      if (isNaN(at)) { toast('تاريخ غير صالح', 'r'); break; }
      S.reminders.push({ id: uid('R'), who: S.session.id, at, text: tx || 'تذكير', fired: false });
      S.calDay = dayStart(at);
      S.calWeek = Math.round((dayStart(at) - dayStart(now())) / (7 * DAY));
      S.sheet = null; toast('حُفظ التذكير ' + hijri(at) + ' ' + t12(at)); break;
    }
    case 'delrem': S.reminders = S.reminders.filter(r => r.id !== id); toast('حُذف التذكير'); break;

    case 'assignto': S.sheet = assignToSheet(uid_); break;

    case 'clock': S.clockOffset = v === '0' ? 0 : (S.clockOffset || 0) + Number(v);
      toast('الوقت الآن ' + t12(now())); break;
    case 'shift': { const t = T(), d = Number(v) * MIN; t.start += d; t.end += d; t._f = {};
      if (t.status === 'running' && t.start > now()) { t.status = 'assigned'; t.startedAt = null; t.autoStarted = false; }
      hist(t, 'عُدّل موعد المهمة'); toast('عُدّل الموعد'); break; }
    case 'edittask': S.sheet = editTaskSheet(T()); break;
    case 'savetask': { const t = T(); const d = val('ed'), tm = val('et'), h = Number(val('eh')) || t.durH;
      if (d && tm) { const nd = new Date(d + 'T' + tm).getTime();
        if (isNaN(nd)) { toast('تاريخ غير صالح', 'r'); break; }
        t.start = nd; t.durH = h; t.end = t.start + h * HR; t._f = {};
        if (t.start > now() && t.status === 'running') { t.status = 'assigned'; t.startedAt = null; t.autoStarted = false; }
        hist(t, 'عُدّلت المهمة من شاشة التحكم'); toast('حُفظت التعديلات'); }
      S.sheet = null; break; }
    case 'addtask': S.sheet = addTaskSheet(); break;
    case 'createtask': {
      const k = val('ak'), lid = val('al'), d = val('ad'), tm = val('at2');
      const L = userById(lid);
      const start = new Date(d + 'T' + tm).getTime();
      if (isNaN(start)) { toast('تاريخ غير صالح', 'r'); break; }
      const nt = newTask(L, k, start, 1900 + S.tasks.length);
      S.tasks.push(nt);
      notify(L.id, 'i-tasks', 'مهمة جديدة', '«' + nt.title + '» — ' + hijri(nt.start) + '. سكّن محسنيك.', { n:'assign', id: nt.id });
      S.sheet = null; toast('أُضيفت المهمة'); break;
    }
    /* ===== الصور — التصوير من داخل التطبيق ===== */
    case 'shoot': {
      if (!canShoot()) { toast('التصوير من صلاحية الليدر', 'r'); break; }
      const tid = b.dataset.tid || '', sid = b.dataset.sid || '', kid = b.dataset.kid || '';
      if (tid) { const t = taskById(tid); if (!t) { toast('المهمة غير موجودة', 'r'); break; } }
      S.pendingPhoto = null;
      openCamera({ taskId: tid || null, subId: sid || null, ticketId: kid || null });
      return; }
    case 'shootexcuse': {
      S.camCtx = { mode: 'excuse', kind: b.dataset.k, taskId: id || null, extraId: uid_ || null };
      S.sheetDraft = val('txt');
      openCamera(S.camCtx); return; }
    case 'dropexcuse': { S.pendingExcuse = null; const sh = reopenReason(); if (sh) S.sheet = sh; break; }
    case 'savephoto': {
      const ti = val('ftitle'), de = val('fdesc');
      if (!S.pendingPhoto) { toast('لا توجد صورة', 'r'); break; }
      if (ti.length < 4) { toast('اكتب عنوانًا لائقًا يصف الحدث', 'r'); break; }
      if (/^[0-9٠-٩s.-_]+$/.test(ti)) { toast('العنوان يجب أن يصف حدثًا لا رقمًا', 'r'); break; }
      if (de && de.length < 8) { toast('الوصف قصير — اشرح ما توثّقه الصورة', 'r'); break; }
      addPhoto(S.pendingPhoto, ti, de, S.camCtx || {});
      S.pendingPhoto = null; S.camCtx = null; S.sheet = null; buzz();
      toast('حُفظت الصورة وارتبطت بالمهمة'); break; }
    case 'cancelshot': S.pendingPhoto = null; S.camCtx = null; S.sheet = null; break;
    case 'viewphoto': S.sheet = null; S.route = { n: 'photo', id }; break;
    case 'delphoto': {
      const p = photoById(id);
      if (!p) break;
      if (!(isLeader() && p.by === S.session.id)) { toast('الحذف لمن التقط الصورة فقط', 'r'); break; }
      const back = p.taskId;
      deletePhoto(id); toast('حُذفت الصورة', 'r');
      S.route = back ? { n: 'task', id: back } : { n: 'album' }; break; }
    case 'picksub': { const t = T(); if (!t) break;
      if (!canShoot()) { toast('التصوير من صلاحية الليدر', 'r'); break; }
      S.sheet = subPickSheet(t); break; }
    case 'printdoc': try { window.print(); } catch (e) { toast('الطباعة غير متاحة', 'r'); } return;

    case 'askreset': S.sheet = confirmSheet('إعادة ضبط كل شيء',
      'ستُحذف كل التسكينات والردود والتنبيهات والتذاكر والتقييمات.', 'data-a="doreset"', true); break;
    case 'doreset': S.sheet = null; reset(); return;
  }
  render();
});

/* بحث الحجاج */
document.addEventListener('input', ev => {
  if (ev.target && ev.target.id === 'pq') {
    const v = ev.target.value;
    S.tab.pq = v;
    render();
    const el = document.getElementById('pq');
    if (el) { el.focus(); try { el.setSelectionRange(v.length, v.length); } catch (e) {} }
  }
});

/* ============================ الكاميرا ============================ */
document.addEventListener('change', ev => {
  if (!ev.target || ev.target.id !== 'cam') return;
  const file = ev.target.files && ev.target.files[0];
  ev.target.value = '';
  if (!file) return;
  if (file.size > 12 * 1024 * 1024) { toast('الصورة كبيرة جدًّا', 'r'); render(); return; }
  toast('جارٍ معالجة الصورة…');
  render();
  readShot(file, src => {
    if (!src) { toast('تعذّرت قراءة الصورة', 'r'); render(); return; }
    S.toast = null;
    if (S.camCtx && S.camCtx.mode === 'excuse') {
      S.pendingExcuse = src;
      const sh = reopenReason();
      if (sh) S.sheet = sh;
    } else {
      S.pendingPhoto = src;
      S.sheet = photoMetaSheet();
    }
    render();
    const d = S.sheetDraft; S.sheetDraft = null;
    if (d) { const el = document.getElementById('txt'); if (el) el.value = d; }
  });
});

/* ============================ إقلاع ============================ */
load();
if (!S.session) S.route = { n: 'login' };
render();
