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
  album: screenAlbum, photo: screenPhoto, doc: screenDoc, guide: screenGuide, daily: screenDaily
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
      const nk = nkind(p);
      const kind = nk.k === 'bad' ? 'bad' : nk.k === 'ask' ? 'warn' : '';
      pushHTML = '<div class="push ' + kind + '" data-a="opennotif" data-id="' + p.id + '">' +
        '<span class="pi">' + icon(p.icon || nk.i, 's18') + '</span>' +
        '<span class="sp"><b>' + E(p.title) + '</b><span>' + E(p.body) + '</span></span>' +
        '<button class="x" data-a="dismiss" aria-label="إخفاء">' + icon('i-x','s16') + '</button></div>';
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

/* لا سحب ولا صفحات — الشريط ثابت */
function centerActiveTab() {}

/* ===== ملاءمة الشاشة لأي جوال ===== */
(function fitScreen() {
  const root = document.documentElement;
  const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true;
  root.classList.add(standalone ? 'app-standalone' : 'app-browser');
  function fit() { root.style.setProperty('--appH', window.innerHeight + 'px'); }
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 220); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
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
      toast(v === 'site' ? 'موقعك داخل موقع المهمة'
        : v === 'hq' ? 'موقعك داخل المقر — التحضير اليومي متاح'
        : 'موقعك خارج النطاق — لا يُقبل تحضير', v === 'away' ? 'r' : 'g'); break;
    case 'attend': { const t = T(); if (!t) break;
      if (!canAttend(t)) { toast(attendBlockReason(t), 'r'); break; }
      if (!attend(t, S.session.id)) { toast('تعذّر إثبات الحضور', 'r'); break; }
      buzz(); toast('أُثبت حضورك ' + t12(now())); break; }

    case 'send': { const t = T(); if (!t) break;
      if (!canDecide(t, S.session.id)) { toast('التسكين للمفوَّض على هذه المهمة', 'r'); break; }
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

    case 'start': { const t = T();
      if (!canDecide(t, S.session.id)) { toast('القرار للمفوَّض على هذه المهمة', 'r'); break; }
      if (!canStart(t, S.session.id)) { toast('لا يمكن البدء الآن', 'r'); break; }
      startTask(t, S.session.id); buzz(); toast('بدأت المهمة'); break; }
    case 'end': S.sheet = confirmSheet('إنهاء المهمة',
      'ستُسجَّل الملاحظات التلقائية ويُحتسب تقييم النظام.', 'data-a="doend" data-id="' + id + '"'); break;
    case 'doend': { const t = T();
      if (!canDecide(t, S.session.id)) { toast('القرار للمفوَّض على هذه المهمة', 'r'); break; }
      endTask(t, S.session.id); S.sheet = null; buzz();
      toast('أُغلقت المهمة — التقييم ' + AR(avgRating(t.rating)) + ' من ٥'); break; }
    case 'cancel': S.pendingExcuse = null;
      S.sheet = reasonSheet('إلغاء المهمة', 'المبرر إلزامي ويصل كل المسكَّنين',
        'data-a="docancel" data-id="' + id + '"', 'سبب الإلغاء', 'cancel', id); break;
    case 'docancel': { const r = val('txt'); if (!r) { toast('المبرر إلزامي', 'r'); break; }
      if (!canDecide(T(), S.session.id)) { toast('القرار للمفوَّض على هذه المهمة', 'r'); break; }
      cancelTask(T(), S.session.id, r, S.pendingExcuse); S.pendingExcuse = null;
      S.sheet = null; toast('أُلغيت المهمة', 'r'); break; }
    case 'sub': { const t = T(); if (t.status !== 'running') { toast('المهمة لم تبدأ بعد', 'r'); break; }
      const s = t.subs.find(x => x.id === b.dataset.s); toggleSub(t, s, S.session.id); buzz(); break; }
    case 'note': S.sheet = textSheet('إضافة ملاحظة', 'تُسجَّل على المهمة',
      'data-a="donote" data-id="' + id + '"', '', 'اكتب ملاحظتك'); break;
    case 'donote': { const t = T(), x = val('txt');
      if (x) { note(t, x + ' — ' + me().name, 'user'); hist(t, 'أضاف ' + me().name + ' ملاحظة'); toast('أُضيفت الملاحظة'); }
      S.sheet = null; break; }

    case 'rerate': { const t = T(); rateTask(t); toast('أُعيد الاحتساب — ' + AR(avgRating(t.rating)) + ' من ٥'); break; }
    case 'rateall': { let n2 = 0; S.tasks.filter(t => t.status === 'done').forEach(t => { rateTask(t); n2++; });
      toast('أُعيد تقييم ' + AR(n2) + ' مهمة'); break; }
    case 'finishsome': { const t = S.tasks.find(x => x.status === 'running');
      if (!t) { toast('لا توجد مهمة جارية', 'r'); break; }
      endTask(t, ownerOf(t)); toast('أُنهيت «' + t.title + '» — التقييم ' + AR(avgRating(t.rating))); break; }

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

    case 'opennotif': {
      const n2 = S.notifs.find(x => x.id === id);
      if (!n2) break;
      n2.read = true; S.push = null; S.sheet = null;
      const rt = n2.route && SCREENS[n2.route.n] ? n2.route : null;
      /* وجهة صالحة أو الرئيسية — ولا يبقى المستخدم عالقًا في القائمة */
      const okId = !rt || !rt.id || taskById(rt.id) || S.tickets.some(k => k.id === rt.id) ||
        (S.photos || []).some(p => p.id === rt.id) || CAT[rt.id];
      S.route = rt && okId ? { n: rt.n, id: rt.id }
        : rt ? { n: rt.n } : { n: isLeader() ? 'home' : 'mhome' };
      buzz(); break; }
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
    /* ===== تصنيف المهام ===== */
    case 'bucketmenu': S.sheet = bucketSheet(); break;

    /* ===== التحضير اليومي ===== */
    case 'checkin': {
      if (!canCheckIn(S.session.id)) { toast(checkInReason(), 'r'); break; }
      checkIn(S.session.id); buzz(); toast('سُجّل تحضيرك ' + t12(now())); break; }
    case 'swapreq': S.swapTo = null; S.sheet = swapSheet(); break;
    case 'swapto': S.swapTo = v; S.sheet = swapSheet(); break;
    case 'dosendswap': {
      const to = S.swapTo || Object.keys(SHIFTS).find(k => k !== shiftOf(S.session.id));
      const rsn = val('swr'), dy = val('swd');
      if (!rsn || rsn.length < 6) { toast('اذكر سببًا واضحًا للتبديل', 'r'); break; }
      if (!dy) { toast('اختر اليوم المطلوب', 'r'); break; }
      const dts = new Date(dy + 'T00:00:00').getTime();
      if (isNaN(dts)) { toast('تاريخ غير صالح', 'r'); break; }
      if (to === shiftOf(S.session.id)) { toast('اختر شِفتًا مختلفًا', 'r'); break; }
      if ((S.swaps || []).some(x => x.from === S.session.id && x.state === 'pending'))
        { toast('لديك طلب قائم بانتظار الرد', 'r'); break; }
      addSwap(S.session.id, to, dts, rsn);
      S.sheet = null; S.tab.dl = 'swap'; buzz(); toast('أُرسل الطلب إلى ليدرك'); break; }
    case 'swapok': { const s = S.swaps.find(x => x.id === id);
      if (!s || s.leaderId !== S.session.id) { toast('ليست من صلاحيتك', 'r'); break; }
      swapAct(s, 'approve'); buzz(); toast('اعتُمد التبديل'); break; }
    case 'swapno': { const s = S.swaps.find(x => x.id === id);
      if (!s || s.leaderId !== S.session.id) { toast('ليست من صلاحيتك', 'r'); break; }
      S.sheet = textSheet('رفض طلب التبديل', 'السبب إلزامي ويصل مقدّم الطلب',
        'data-a="doswapno" data-id="' + id + '"', '', 'سبب الرفض'); break; }
    case 'doswapno': { const s = S.swaps.find(x => x.id === id), rr = val('txt');
      if (!rr) { toast('السبب إلزامي', 'r'); break; }
      swapAct(s, 'reject', rr); S.sheet = null; toast('رُفض الطلب', 'r'); break; }
    case 'swapesc': { const s = S.swaps.find(x => x.id === id);
      if (!s || s.leaderId !== S.session.id) { toast('ليست من صلاحيتك', 'r'); break; }
      S.sheet = textSheet('رفع الطلب للكنترول', 'يصل غرفة العمليات مع ملاحظتك',
        'data-a="doswapesc" data-id="' + id + '"', '', 'ملاحظة للكنترول (اختياري)'); break; }
    case 'doswapesc': { const s = S.swaps.find(x => x.id === id);
      swapAct(s, 'escalate', val('txt')); S.sheet = null; toast('رُفع الطلب للكنترول'); break; }

    /* ===== الإشعارات الخارجية ===== */
    case 'pushask': askPush(); return;
    case 'pushtoggle': S.pushEnabled = !pushOn();
      toast(S.pushEnabled ? 'شُغّلت الإشعارات الخارجية' : 'أُوقفت الإشعارات الخارجية'); break;
    case 'pushtest': {
      if (!pushOn()) { toast('فعّل الإذن أولًا', 'r'); break; }
      firePush('تطبيق مُحسن', 'هذا إشعار تجريبي — وصلك بنجاح.', 'test');
      toast('أُرسل إشعار تجريبي'); break; }
    case 'bcaud': S.bcAud = v; break;
    case 'dobroadcast': {
      const ti = val('bct'), bo = val('bcb');
      if (ti.length < 4) { toast('اكتب عنوانًا واضحًا', 'r'); break; }
      if (bo.length < 6) { toast('اكتب نص الإشعار', 'r'); break; }
      const n3 = broadcast(S.bcAud || 'muhsens', ti, bo);
      buzz(); toast('أُرسل إلى ' + AR(n3) + ' شخصًا'); break; }

    /* ===== دليل المهام ===== */
    case 'guidedit': {
      if (!canEditGuide()) { toast('التحرير من صلاحية الليدر', 'r'); break; }
      S.guideEdit = !S.guideEdit;
      toast(S.guideEdit ? 'وضع التحرير مفتوح' : 'أُغلق وضع التحرير'); break; }
    case 'addstep': {
      if (!canEditGuide()) { toast('التحرير من صلاحية الليدر', 'r'); break; }
      const k = b.dataset.k, mk = v;
      S.pendingMedia = null; S.pendingMediaName = null; S.pendingMediaSize = null;
      S.sheet = mk === 'text' ? stepTextSheet(k) : stepMediaSheet(k, mk); break; }
    case 'pickmedia': {
      S.mediaCtx = { kind: b.dataset.k, mk: v };
      S.sheetDraft = val('gt'); S.sheetDraft2 = val('gb');
      const el2 = document.getElementById(v === 'pdf' ? 'pdf' : v === 'video' ? 'vid' : 'cam');
      if (!el2) { toast('غير متاح على هذا الجهاز', 'r'); break; }
      el2.value = ''; el2.click(); return; }
    case 'cancelstep': S.pendingMedia = null; S.mediaCtx = null; S.sheet = null; break;
    case 'savestep': {
      if (!canEditGuide()) { toast('التحرير من صلاحية الليدر', 'r'); break; }
      const k = b.dataset.k, mk = v, ti = val('gt'), bo = val('gb');
      if (ti.length < 3) { toast('اكتب عنوانًا واضحًا للخطوة', 'r'); break; }
      if (mk === 'text' && bo.length < 10) { toast('نص التعليمة قصير — اشرحها بوضوح', 'r'); break; }
      if (mk !== 'text' && !S.pendingMedia) { toast('اختر الملف أولًا', 'r'); break; }
      addStep(k, { kind: mk, title: ti, body: bo, src: S.pendingMedia || null,
        file: S.pendingMediaName || null, size: S.pendingMediaSize || null });
      S.pendingMedia = null; S.pendingMediaName = null; S.pendingMediaSize = null; S.mediaCtx = null;
      S.sheet = null; buzz(); toast('أُضيفت الخطوة إلى الدليل'); break; }
    case 'stepup': moveStep(b.dataset.k, id, -1); break;
    case 'stepdn': moveStep(b.dataset.k, id, 1); break;
    case 'stepdel': {
      if (!canEditGuide()) { toast('الحذف من صلاحية الليدر', 'r'); break; }
      delStep(b.dataset.k, id); toast('حُذفت الخطوة', 'r'); break; }

    case 'appupdate': {
      toast('جارٍ التحديث…');
      try {
        if (window.caches) caches.keys().then(function (ks) { ks.forEach(function (k) { caches.delete(k); }); });
        if (navigator.serviceWorker) navigator.serviceWorker.getRegistrations()
          .then(function (rs) { rs.forEach(function (x) { x.unregister(); }); });
      } catch (e) {}
      setTimeout(function () { location.reload(true); }, 700);
      return; }
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

/* لوحة المفاتيح: العناصر ذات role=button تعمل بالمسافة والإدخال */
document.addEventListener('keydown', ev => {
  if (ev.key !== 'Enter' && ev.key !== ' ') return;
  const b = ev.target && ev.target.closest ? ev.target.closest('[role="button"][data-a]') : null;
  if (!b) return;
  ev.preventDefault(); b.click();
});

/* ============================ الكاميرا ============================ */
document.addEventListener('change', ev => {
  const id2 = ev.target && ev.target.id;
  if (id2 === 'vid' || id2 === 'pdf') return onGuideMedia(ev, id2 === 'vid' ? 'video' : 'pdf');
  if (id2 === 'cam' && S.mediaCtx) return onGuideMedia(ev, 'photo');
  if (id2 !== 'cam') return;
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

/* وسائط الدليل: صورة أو فيديو أو PDF */
function onGuideMedia(ev, mk) {
  const file = ev.target.files && ev.target.files[0];
  ev.target.value = '';
  const ctx = S.mediaCtx;
  if (!file || !ctx) return;
  const nm = file.name, sz = fileSize(file.size);
  toast('جارٍ تجهيز الملف…'); render();
  readMedia(file, mk, src => {
    if (src === 'TOOBIG') { S.toast = null; toast('الملف أكبر من ١٫٦ ميغابايت', 'r'); render(); return; }
    if (!src) { S.toast = null; toast('تعذّرت قراءة الملف', 'r'); render(); return; }
    S.toast = null;
    S.pendingMedia = src; S.pendingMediaName = nm; S.pendingMediaSize = sz;
    S.sheet = stepMediaSheet(ctx.kind, ctx.mk);
    render();
    const a1 = document.getElementById('gt'), a2 = document.getElementById('gb');
    if (a1 && S.sheetDraft) a1.value = S.sheetDraft;
    if (a2 && S.sheetDraft2) a2.value = S.sheetDraft2;
    S.sheetDraft = null; S.sheetDraft2 = null;
  });
}

/* ============================ إقلاع ============================ */
load();
if (typeof flushPending === 'function') setTimeout(flushPending, 900);
if (!S.session) S.route = { n: 'login' };
render();
