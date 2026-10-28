/* ============================ التحضير اليومي والشِفتات ============================ */
/* حضور يومي داخل المقر · شِفت لكل موظف · طلب تبديل شِفت يمرّ بالليدر ثم الكنترول */

const SHIFTS = {
  am:   { l:'صباحي',  from:6,  to:14, i:'i-sun',   c:'#B8791A' },
  pm:   { l:'مسائي',  from:14, to:22, i:'i-clock', c:'#1B6E9C' },
  night:{ l:'ليلي',   from:22, to:6,  i:'i-hour',  c:'#4A3F7A' }
};
const HQ = 'مقر البعثة — العزيزية';
const DAY_AB = ['أحد','اثن','ثلا','أرب','خمي','جمع','سبت'];
const SWAP_STATE = {
  pending:  ['بانتظار الليدر', 'wait'],
  escalated:['مرفوعة للكنترول', 'blue'],
  approved: ['معتمدة', 'live'],
  rejected: ['مرفوضة', 'no']
};

const shiftOf = id => (S.shifts && S.shifts[id]) || 'am';
const shiftInfo = id => SHIFTS[shiftOf(id)];
const inHQ = () => S.myPlace === 'hq';

/* ============================================================
   دورةُ الدوام — الدوامُ ليس يوميًّا

   منهم من يداوم يومًا ويرتاح يومًا، ومنهم من يداوم يومًا من كلّ
   ثلاثة، ولكلٍّ شِفتُه. وكان التقويمُ يسوّي بينهم فيُظهر الجميعَ
   حاضرين كلَّ يوم، فلا يُقرأ منه شيء. وصار يفرّق: دوامٌ وراحة،
   والالتزامُ يُحسب على أيّام الدوام وحدَها.
   ============================================================ */
const ROTA_L = { 2: 'يوم بعد يوم', 3: 'يوم من كلّ ثلاثة' };
const rotaOf = id => (S.rota && S.rota[id]) || { every: 1, off: 0 };
/* اليومُ يُعدّ من مبدأ الحقبة، والإزاحةُ تفرّق بين الزملاء فلا
   يرتاح الفريقُ كلُّه في يومٍ واحد. */
function onDuty(id, ts) {
  const r = rotaOf(id);
  if (!r.every || r.every < 2) return true;
  const d = Math.round(dayStart(ts) / DAY);
  return (((d - (r.off || 0)) % r.every) + r.every) % r.every === 0;
}
const rotaTxt = id => { const r = rotaOf(id); return ROTA_L[r.every] || 'دوام يوميّ'; };
/* أقربُ يومِ دوامٍ قادم — يُقال لمن يومُه راحة */
function nextDuty(id, ts) {
  for (let i = 1; i <= 7; i++) { const d = dayStart(ts) + i * DAY; if (onDuty(id, d)) return d; }
  return null;
}

/* سجل حضور يوم بعينه */
const dayRec = (id, ts) => (S.attend || []).find(a => a.userId === id && a.day === dayStart(ts));
const attendedToday = id => !!dayRec(id, now());

function canCheckIn(id) {
  if (dayRec(id, now())) return false;
  return inHQ();
}
function checkInReason() {
  if (attendedToday(S.session.id)) return 'حضّرت اليوم بالفعل';
  if (!inHQ()) return 'التحضير اليومي من داخل المقر فقط — بدّل موقعك إلى «داخل المقر»';
  return '';
}
/* الانصراف: لا يُفتح قبل الحضور، ولا يتكرّر. وبينهما المدّةُ تُقرأ،
   فتُعرَف ساعاتُ اليوم لا حضورُه وحده. */
const checkedOutToday = id => { const r = dayRec(id, now()); return !!(r && r.outAt); };
/* هل انقضى الشِفت؟ الليليُّ يعبر منتصفَ الليل فيُحسَب على طرفين.
   وعليه يتبدّل نصُّ الزرّ: خروجٌ مبكرٌ ما دام الشِفتُ ساريًا،
   وانصرافٌ متى حلّ وقتُه. */
function shiftEnded(id) {
  const s = SHIFTS[shiftOf(id)];
  const h = new Date(now()).getHours();
  return s.to > s.from ? h >= s.to : (h >= s.to && h < s.from);
}
const outLabel = id => shiftEnded(id) ? 'تسجيل الانصراف' : 'تسجيل خروج مبكر';

function canCheckOut(id) { const r = dayRec(id, now()); return !!r && !r.outAt; }
function checkOut(id) {
  if (!canCheckOut(id)) return false;
  const r = dayRec(id, now());
  r.outAt = now();
  const u = userById(id);
  if (u.role === "muhsen" && u.leaderId) notify(u.leaderId, "i-out", "انصراف",
    u.name + " انصرف " + t12(r.outAt) + " · " + workedTxt(r), { n: "daily" });
  return true;
}
/* المدّةُ بين الطرفين — والجاريةُ تُقرأ حتّى اللحظة */
/* لا تنقلب المدّةُ سالبةً: تقديمُ الساعة من شاشة التحكّم قد يجعل
   «الآن» قبل وقت التسجيل، فتُقرأ «-٤ س -٢٣ د». */
const workedMin = r => r ? Math.max(0, Math.round(((r.outAt || now()) - r.at) / MIN)) : 0;
function workedTxt(r) {
  const m = workedMin(r);
  return AR(Math.floor(m / 60)) + " س " + AR(m % 60) + " د";
}

function checkIn(id) {
  if (!canCheckIn(id)) return false;
  const sh = shiftOf(id), s = SHIFTS[sh];
  const d = new Date(now());
  const late = d.getHours() > s.from || (d.getHours() === s.from && d.getMinutes() > 15);
  S.attend.unshift({ id: uid('A'), userId: id, day: dayStart(now()), at: now(), shift: sh, late });
  const u = userById(id);
  if (u.role === 'muhsen' && u.leaderId) notify(u.leaderId, 'i-check', 'تحضير يومي',
    u.name + ' حضّر ' + t12(now()) + (late ? ' — متأخرًا' : ''), { n: 'daily' });
  return true;
}

/* ---------- الالتزام: يُحسب على أيّام الدوام وحدَها ---------- */
function weekStats(id, weeksAgo) {
  const end = dayStart(now()) - weeksAgo * 7 * DAY;
  let done = 0, late = 0, days = 0;
  for (let i = 0; i < 7; i++) {
    const d = end - i * DAY;
    if (d > dayStart(now())) continue;
    if (!onDuty(id, d)) continue;          /* الراحةُ ليست غيابًا */
    days++;
    const r = dayRec(id, d);
    if (r) { done++; if (r.late) late++; }
  }
  return { days, done, late, pct: days ? Math.round(done / days * 100) : 0 };
}

/* ---------- طلبات تبديل الشِفت ---------- */
function pendingSwaps() {
  const u = me(); if (!u) return [];
  if (u.role === 'leader') return (S.swaps || []).filter(s => s.leaderId === u.id && s.state === 'pending');
  return (S.swaps || []).filter(s => s.from === u.id && s.state === 'pending');
}
const mySwaps = () => {
  const u = me(); if (!u) return [];
  return (S.swaps || []).filter(s => s.from === u.id || s.leaderId === u.id)
    .sort((a, b) => b.at - a.at);
};
function addSwap(fromId, toShift, day, reason) {
  const u = userById(fromId);
  const s = {
    id: uid('W'), no: 'SW-' + AR(3100 + (S.swaps || []).length),
    from: fromId, leaderId: u.role === 'muhsen' ? u.leaderId : null,
    fromShift: shiftOf(fromId), toShift, day, reason,
    state: u.role === 'muhsen' ? 'pending' : 'escalated', at: now(),
    log: [{ at: now(), by: fromId, text: 'قدّم ' + u.name + ' طلب تبديل الشِفت' }]
  };
  S.swaps.unshift(s);
  if (s.leaderId) notify(s.leaderId, 'i-swap', 'طلب تبديل شِفت',
    u.name + ' يطلب التحويل إلى الشِفت ' + SHIFTS[toShift].l + ' — ' + reason, { n: 'daily' });
  else s.log.push({ at: now(), by: fromId, text: 'رُفع الطلب إلى الكنترول مباشرة' });
  return s;
}
function swapAct(s, act, note_) {
  const by = me();
  if (act === 'approve') {
    s.state = 'approved'; s.at2 = now();
    S.shifts[s.from] = s.toShift;
    s.log.push({ at: now(), by: by.id, text: 'اعتمد ' + by.name + ' التبديل — صار الشِفت ' + SHIFTS[s.toShift].l });
    notify(s.from, 'i-checkc', 'اعتُمد تبديل الشِفت',
      'الشِفت الجديد: ' + SHIFTS[s.toShift].l + ' · ' + shiftWindow(s.toShift), { n: 'daily' });
  } else if (act === 'reject') {
    s.state = 'rejected'; s.at2 = now(); s.note = note_;
    s.log.push({ at: now(), by: by.id, text: 'رفض ' + by.name + ' الطلب — ' + note_ });
    notify(s.from, 'i-xc', 'رُفض تبديل الشِفت', note_, { n: 'daily' });
  } else if (act === 'escalate') {
    s.state = 'escalated'; s.at2 = now(); s.note = note_ || '';
    s.log.push({ at: now(), by: by.id, text: 'رفع ' + by.name + ' الطلب إلى الكنترول' +
      (note_ ? ' — ' + note_ : '') });
    notify(s.from, 'i-send', 'رُفع طلبك للكنترول',
      'رفع الليدر طلب تبديل الشِفت إلى غرفة العمليات.', { n: 'daily' });
  }
}
const hh = h => AR(h) + ':' + AR('00');
const shiftWindow = k => hh(SHIFTS[k].from) + ' — ' + hh(SHIFTS[k].to);

/* ============================================================
   الاستئذان — خروجٌ مأذونٌ فيه داخل الشِفت

   مسارُه مسارُ تبديل الشِفت نفسُه: يرفعه صاحبُه، فيعتمده ليدرُه
   أو يرفعه إلى الكنترول. وسجلُّهما واحدٌ في الشاشة لأنّ السؤالَ
   واحد: ما الذي ينتظر قرارًا على دوامي؟
   ============================================================ */
const LEAVE_WHY = ['موعد طبّيّ', 'ظرف عائليّ', 'مراجعة جهة حكوميّة', 'سببٌ آخر'];

function pendingLeaves() {
  const u = me(); if (!u) return [];
  if (u.role === 'leader') return (S.leaves || []).filter(x => x.leaderId === u.id && x.state === 'pending');
  return (S.leaves || []).filter(x => x.from === u.id && x.state === 'pending');
}
const myLeaves = () => {
  const u = me(); if (!u) return [];
  return (S.leaves || []).filter(x => x.from === u.id || x.leaderId === u.id);
};
function addLeave(fromId, day, fromT, toT, reason) {
  const u = userById(fromId);
  const x = {
    id: uid('L'), no: 'LV-' + AR(5200 + (S.leaves || []).length),
    from: fromId, leaderId: u.role === 'muhsen' ? u.leaderId : null,
    day, fromT, toT, reason,
    state: u.role === 'muhsen' ? 'pending' : 'escalated', at: now(),
    log: [{ at: now(), by: fromId, text: 'قدّم ' + u.name + ' طلب استئذان' }]
  };
  S.leaves.unshift(x);
  if (x.leaderId) notify(x.leaderId, 'i-out', 'طلب استئذان',
    u.name + ' يطلب الاستئذان ' + hhmm(fromT) + ' — ' + hhmm(toT) + ' · ' + reason, { n: 'daily' });
  else x.log.push({ at: now(), by: fromId, text: 'رُفع الطلب إلى الكنترول مباشرة' });
  return x;
}
function leaveAct(x, act, note_) {
  const by = me();
  if (act === 'approve') {
    x.state = 'approved'; x.at2 = now();
    x.log.push({ at: now(), by: by.id, text: 'أذن ' + by.name + ' بالاستئذان' });
    notify(x.from, 'i-checkc', 'اعتُمد استئذانك',
      hijri(x.day) + ' · ' + hhmm(x.fromT) + ' — ' + hhmm(x.toT), { n: 'daily' });
  } else if (act === 'reject') {
    x.state = 'rejected'; x.at2 = now(); x.note = note_;
    x.log.push({ at: now(), by: by.id, text: 'رفض ' + by.name + ' الطلب — ' + note_ });
    notify(x.from, 'i-xc', 'رُفض الاستئذان', note_, { n: 'daily' });
  } else if (act === 'escalate') {
    x.state = 'escalated'; x.at2 = now(); x.note = note_ || '';
    x.log.push({ at: now(), by: by.id, text: 'رفع ' + by.name + ' الطلب إلى الكنترول' +
      (note_ ? ' — ' + note_ : '') });
    notify(x.from, 'i-send', 'رُفع طلبك للكنترول',
      'رفع الليدر طلب الاستئذان إلى غرفة العمليات.', { n: 'daily' });
  }
}
const hhmm = m => AR(String(Math.floor(m / 60))) + ':' + AR(String(m % 60).padStart(2, '0'));
const leaveMins = x => Math.max(0, x.toT - x.fromT);
const durTxt = m => m >= 60
  ? AR(Math.floor(m / 60)) + ' س' + (m % 60 ? ' ' + AR(m % 60) + ' د' : '')
  : AR(m) + ' د';

/* ما ينتظر قرارًا على الدوام — تبديلٌ واستئذان */
const pendingDayRequests = () => pendingSwaps().length + pendingLeaves().length;

/* ---------- الشاشة ---------- */
function screenDaily() {
  const u = me(), L = isLeader();
  const sh = shiftInfo(u.id), me_ = dayRec(u.id, now());
  const team = L ? teamOf(u.id) : [];
  const swaps = mySwaps();
  const inbox = pendingSwaps();

  /* خليّةُ اليوم تفرّق بين أربعٍ لا ثلاث: حاضرٌ ومتأخّرٌ وغائبٌ
     و«راحة». وكان يومُ الراحة يُرسَم غيابًا، فيبدو الالتزامُ
     مثقوبًا بلا ذنب. */
  const weekCells = id => {
    let out = '';
    for (let i = 6; i >= 0; i--) {
      const d = dayStart(now()) - i * DAY;
      const r = dayRec(id, d);
      const duty2 = onDuty(id, d);
      const isToday = d === dayStart(now());
      const cls = r ? (r.late ? 'late' : 'ok') : duty2 ? 'no' : 'off';
      out += '<span class="wk ' + cls + (isToday ? ' today' : '') + '">' +
        '<i>' + DAY_AB[new Date(d).getDay()] + '</i><b>' + AR(new Date(d).getDate()) + '</b>' +
        '<u>' + (r ? (r.late ? 'متأخر' : 'حاضر') : duty2 ? 'غائب' : 'راحة') + '</u></span>';
    }
    return '<div class="wkrow">' + out + '</div>';
  };

  const duty = onDuty(u.id, now());
  const leaveInbox = pendingLeaves();
  const leaves = myLeaves();
  const todayLeave = leaves.find(x => dayStart(x.day) === dayStart(now()) && x.state === 'approved');

  return bar('التحضير اليومي', { right: '<button data-a="place" aria-label="موقعي">' + icon('i-pin') + '</button>' }) +
    '<div class="view">' + ground() +

    /* التبويباتُ سقطت: الفريقُ والتبديلُ صارا قسمين في الصفحة نفسِها،
       فلا يُخبَّأ خلف تبويبٍ ما يُقرأ في سطر. */
    '<div class="shift" style="--sc:' + sh.c + '">' +
      '<span class="si">' + icon(sh.i, 's26') + '</span>' +
      '<span class="sp"><b>الشِفت ' + sh.l + '</b>' +
      '<span>' + shiftWindow(shiftOf(u.id)) + ' · ' + rotaTxt(u.id) + '</span></span>' +
      (me_ ? '<span class="ok">' + icon('i-checkc','s18') + '</span>'
           : duty ? '' : '<span class="ok">' + icon('i-hour','s18') + '</span>') + '</div>' +

    /* خبرُ التسجيل يُقال مرّةً ثمّ ينصرف — وما يبقى هو الحالةُ في الزرّ */
    (me_ ? flash('g', 'i-checkc',
        '<b>تم تسجيل الحضور ' + t12(me_.at) + '</b>' +
        (me_.late ? ' · متأخّرًا' : ' · في الوقت') +
        (me_.outAt ? '<br>الانصراف ' + t12(me_.outAt) + ' · ' + workedTxt(me_) : ''), 7) : '') +

    (!me_
      ? '<button class="cta ' + (canCheckIn(u.id) ? '' : 'off') + '" ' +
          (canCheckIn(u.id) ? 'data-a="checkin"' : 'disabled') + '>' + icon('i-check','s26') +
          '<span class="t"><b>تسجيل الحضور</b><span>' +
          (canCheckIn(u.id)
            ? (duty ? 'داخل المقر — ' + t12(now())
                    : 'اليوم راحتك — والتسجيل متاح إن استُدعيت')
            : E(checkInReason())) +
          '</span></span></button>'
      : !me_.outAt
      ? '<button class="cta out' + (shiftEnded(u.id) ? '' : ' early') + '" data-a="checkout">' +
          icon('i-out','s26') +
          '<span class="t"><b>' + outLabel(u.id) + '</b><span>' + t12(now()) +
          ' · مضى ' + workedTxt(me_) +
          (shiftEnded(u.id) ? '' : ' · ينتهي الشِفت ' + hh(SHIFTS[shiftOf(u.id)].to)) +
          '</span></span></button>'
      : '<div class="cta off done">' + icon('i-checkc','s26') +
          '<span class="t"><b>اكتمل دوام اليوم</b><span>مدّة الدوام ' + workedTxt(me_) +
          ' · ' + dayName(now()) + ' ' + hijri(now()) + '</span></span></div>') +

    (todayLeave ? '<div class="note g">' + icon('i-out','s16') +
      '<span>استئذانٌ معتمدٌ اليوم ' + hhmm(todayLeave.fromT) + ' — ' + hhmm(todayLeave.toT) +
      '</span></div>' : '') +

    '<div class="lbl">هذا الأسبوع<small>' + AR(weekStats(u.id, 0).done) + ' من ' +
      AR(weekStats(u.id, 0).days) + ' يوم دوام</small></div>' +
    '<div class="c">' + weekCells(u.id) +
      '<div class="row tiny dim2" style="margin-top:10px">' +
        '<span>' + icon('i-check','s14') + ' في الوقت</span>' +
        '<span>' + icon('i-clock','s14') + ' متأخر</span>' +
        '<span>' + icon('i-hour','s14') + ' راحة</span></div></div>' +

    '<div class="grid2">' +
      '<button class="btn l sm" data-a="swapreq">' + icon('i-swap','s16') + 'تبديل الشِفت</button>' +
      '<button class="btn l sm" data-a="leavereq">' + icon('i-out','s16') + 'طلب استئذان</button></div>' +

    /* حضورُ الفريق: قسمٌ يُطوى بدل تبويبٍ يُخبّئ */
    (L && team.length ? foldOf('daily', 'team', 'حضور الفريق اليوم',
        AR(team.filter(m => attendedToday(m.id)).length) + ' من ' + AR(team.length),
        team.map(m => {
          const r = dayRec(m.id, now()), s2 = shiftInfo(m.id), st = weekStats(m.id, 0);
          const d2 = onDuty(m.id, now());
          return '<button class="c" data-a="go" data-n="profile" data-id="' + m.id +
            '" style="width:100%;text-align:right">' +
            '<div class="fl">' + avat(m) +
              '<span class="nm sp"><b>' + E(m.name) + '</b>' +
              '<span>الشِفت ' + s2.l + ' · ' + rotaTxt(m.id) + '</span></span>' +
              (r ? pill(r.late ? 'حضر متأخرًا ' + t12(r.at) : 'حضر ' + t12(r.at), r.late ? 'wait' : 'live')
                 : d2 ? pill('لم يحضر', 'no') : pill('راحة', 'grey')) + '</div>' +
            weekCells(m.id) +
            '<div class="row tiny dim2" style="margin-top:8px"><span>التزام الأسبوع</span>' +
            '<b>' + AR(st.pct) + '٪</b></div></button>';
        }).join(''), 'i-users') : '') +

    ((inbox.length + leaveInbox.length)
      ? '<div class="lbl">بانتظار قرارك<small>' + AR(inbox.length + leaveInbox.length) + '</small></div>' +
        inbox.map(s => swapCard(s, true)).join('') +
        leaveInbox.map(x => leaveCard(x, true)).join('') : '') +

    ((swaps.length + leaves.length)
      ? foldOf('daily', 'log', 'سجل طلبات الدوام',
          AR(swaps.length + leaves.length) + ' طلبًا',
          swaps.map(s => swapCard(s, s.state === 'pending' && L && s.leaderId === u.id)).join('') +
          leaves.map(x => leaveCard(x, x.state === 'pending' && L && x.leaderId === u.id)).join(''),
          'i-hist') : '') +
    '</div>' + tabs();
}

/* بطاقةُ الاستئذان — على بناء بطاقة التبديل: الحالةُ ثمّ المدّةُ ثمّ المسار */
function leaveCard(x, actionable) {
  const u = userById(x.from), st = SWAP_STATE[x.state] || [x.state, 'grey'];
  const L = userById(x.leaderId);
  return '<div class="c">' +
    '<div class="row"><b class="sm">طلب استئذان · ' + E(x.no) + '</b>' + pill(st[0], st[1]) + '</div>' +
    '<div class="fl" style="margin:10px 0;gap:9px">' + avat(u, 'sm') +
      '<span class="sp"><b class="tiny" style="display:block">' + E(u.name) + '</b>' +
      '<span class="tiny dim2">' + hijri(x.day) + ' · ' + dayName(x.day) + '</span></span></div>' +
    '<div class="swapflow">' +
      '<span class="sb" style="--sc:#1B6E9C">' + icon('i-clock','s16') + hhmm(x.fromT) + '</span>' +
      '<span class="arrow">' + icon('i-back','s16') + '</span>' +
      '<span class="sb" style="--sc:#1B6E9C">' + icon('i-clock','s16') + hhmm(x.toT) + '</span>' +
      '<span class="tiny dim2 sp" style="text-align:left">' + durTxt(leaveMins(x)) + '</span></div>' +
    '<div class="note b" style="margin-top:9px">' + icon('i-edit','s16') + '<span>' + E(x.reason) + '</span></div>' +
    (x.note ? '<div class="note ' + (x.state === 'rejected' ? 'r' : 'a') + '" style="margin-top:8px">' +
      icon('i-info','s16') + '<span>' + E(x.note) + '</span></div>' : '') +
    (x.state === 'escalated' ? '<div class="strip b">' + icon('i-send','s16') +
      '<span>لدى غرفة العمليات — الكنترول' + (L ? ' · رفعه ' + E(L.name) : '') + '</span></div>' : '') +
    '<div class="lbl plain" style="margin-top:10px">مسار الطلب</div>' +
    '<div class="tline">' + x.log.map(e => '<div class="ti"><span class="d"></span>' +
      '<span class="tiny"><b>' + E(e.text) + '</b><br><span class="dim2">' + t12(e.at) + ' · ' +
      hijri(e.at) + '</span></span></div>').join('') + '</div>' +
    (actionable ? '<div class="grid3" style="margin-top:11px">' +
      '<button class="btn d sm" data-a="leaveno" data-id="' + x.id + '">رفض</button>' +
      '<button class="btn l sm" data-a="leaveesc" data-id="' + x.id + '">' + icon('i-send','s16') + 'للكنترول</button>' +
      '<button class="btn p sm" data-a="leaveok" data-id="' + x.id + '">إذن</button></div>' : '') +
  '</div>';
}

/* ورقةُ طلب الاستئذان */
function leaveSheet() {
  const why = S.lvWhy || LEAVE_WHY[0];
  const sh = SHIFTS[shiftOf(S.session.id)];
  return '<div class="grip"></div><h3>طلب استئذان</h3>' +
    '<div class="tiny dim2" style="margin-bottom:10px">الشِفت ' + sh.l + ' · ' +
      shiftWindow(shiftOf(S.session.id)) + '</div>' +
    '<div class="lbl plain">اليوم</div>' +
    '<div class="field" style="margin:8px 0"><input type="date" id="lvd" value="' + isoDate(now()) + '"></div>' +
    '<div class="grid2">' +
      '<div><div class="lbl plain">من</div>' +
        '<div class="field" style="margin:8px 0"><input type="time" id="lvf" value="' +
          String(sh.from).padStart(2, '0') + ':00"></div></div>' +
      '<div><div class="lbl plain">إلى</div>' +
        '<div class="field" style="margin:8px 0"><input type="time" id="lvt" value="' +
          String((sh.from + 2) % 24).padStart(2, '0') + ':00"></div></div>' +
    '</div>' +
    '<div class="lbl plain">السبب</div>' +
    '<div class="col" style="gap:7px;margin:8px 0">' + LEAVE_WHY.map(k =>
      '<button class="listitem' + (k === why ? ' on' : '') + '" data-a="lvwhy" data-v="' + E(k) + '">' +
        '<span class="sp"><b style="font-size:13.5px">' + k + '</b></span>' +
        (k === why ? icon('i-check','s16') : '') + '</button>').join('') + '</div>' +
    '<div class="field" style="margin:8px 0"><input id="lvn" maxlength="140" placeholder="تفصيلٌ مختصر — اختياري"></div>' +
    '<div class="grid2" style="margin-top:12px">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" data-a="dosendleave">إرسال الطلب</button></div>';
}

function swapCard(s, actionable) {
  const u = userById(s.from), st = SWAP_STATE[s.state] || [s.state, 'grey'];
  const L = userById(s.leaderId);
  return '<div class="c">' +
    '<div class="row"><b class="sm">طلب تبديل شِفت · ' + E(s.no) + '</b>' + pill(st[0], st[1]) + '</div>' +
    '<div class="fl" style="margin:10px 0;gap:9px">' + avat(u, 'sm') +
      '<span class="sp"><b class="tiny" style="display:block">' + E(u.name) + '</b>' +
      '<span class="tiny dim2">' + hijri(s.day) + ' · ' + dayName(s.day) + '</span></span></div>' +
    '<div class="swapflow">' +
      '<span class="sb" style="--sc:' + SHIFTS[s.fromShift].c + '">' + icon(SHIFTS[s.fromShift].i,'s16') +
        SHIFTS[s.fromShift].l + '</span>' +
      '<span class="arrow">' + icon('i-back','s16') + '</span>' +
      '<span class="sb" style="--sc:' + SHIFTS[s.toShift].c + '">' + icon(SHIFTS[s.toShift].i,'s16') +
        SHIFTS[s.toShift].l + '</span></div>' +
    '<div class="note b" style="margin-top:9px">' + icon('i-edit','s16') + '<span>' + E(s.reason) + '</span></div>' +
    (s.note ? '<div class="note ' + (s.state === 'rejected' ? 'r' : 'a') + '" style="margin-top:8px">' +
      icon('i-info','s16') + '<span>' + E(s.note) + '</span></div>' : '') +
    (s.state === 'escalated' ? '<div class="strip b">' + icon('i-send','s16') +
      '<span>لدى غرفة العمليات — الكنترول' + (L ? ' · رفعه ' + E(L.name) : '') + '</span></div>' : '') +
    '<div class="lbl plain" style="margin-top:10px">مسار الطلب</div>' +
    '<div class="tline">' + s.log.map(x => '<div class="ti"><span class="d"></span>' +
      '<span class="tiny"><b>' + E(x.text) + '</b><br><span class="dim2">' + t12(x.at) + ' · ' + hijri(x.at) + '</span></span></div>').join('') + '</div>' +
    (actionable ? '<div class="grid3" style="margin-top:11px">' +
      '<button class="btn d sm" data-a="swapno" data-id="' + s.id + '">رفض</button>' +
      '<button class="btn l sm" data-a="swapesc" data-id="' + s.id + '">' + icon('i-send','s16') + 'للكنترول</button>' +
      '<button class="btn p sm" data-a="swapok" data-id="' + s.id + '">اعتماد</button></div>' : '') +
  '</div>';
}

function swapSheet() {
  const cur = shiftOf(S.session.id);
  const pick = S.swapTo && S.swapTo !== cur ? S.swapTo : Object.keys(SHIFTS).find(k => k !== cur);
  return '<div class="grip"></div><h3>طلب تبديل الشِفت</h3>' +
    '<div class="tiny dim2" style="margin-bottom:10px">الشِفت الحالي: ' + SHIFTS[cur].l + ' · ' + shiftWindow(cur) + '</div>' +
    '<div class="lbl plain">الشِفت المطلوب</div>' +
    '<div class="col" style="gap:7px;margin:8px 0">' + Object.keys(SHIFTS).filter(k => k !== cur).map(k =>
      '<button class="listitem' + (k === pick ? ' on' : '') + '" data-a="swapto" data-v="' + k + '">' +
        '<span class="ico" style="color:' + SHIFTS[k].c + '">' + icon(SHIFTS[k].i, 's18') + '</span>' +
        '<span class="sp"><b style="font-size:13.5px;display:block">' + SHIFTS[k].l + '</b>' +
        '<span class="tiny dim2">' + shiftWindow(k) + '</span></span>' +
        (k === pick ? icon('i-check','s16') : '') + '</button>').join('') + '</div>' +
    '<div class="lbl plain">اليوم المطلوب</div>' +
    '<div class="field" style="margin:8px 0"><input type="date" id="swd" value="' + isoDate(now() + DAY) + '"></div>' +
    '<div class="lbl plain">السبب</div>' +
    '<div class="field" style="margin:8px 0"><input id="swr" maxlength="140" placeholder="سبب مختصر — اختياري"></div>' +
    '<div class="note a">' + icon('i-info','s16') +
      '<span>يصل الطلب إلى ليدرك، وله أن يعتمده أو يرفعه إلى الكنترول.</span></div>' +
    '<div class="grid2" style="margin-top:12px">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" data-a="dosendswap">إرسال الطلب</button></div>';
}

/* ---------- بذر ثلاثة أسابيع ماضية وأسبوع جارٍ ---------- */
function seedDaily(st) {
  st.shifts = {}; st.attend = []; st.swaps = []; st.leaves = []; st.rota = {};
  const keys = Object.keys(SHIFTS);
  /* شِفتٌ ودورةٌ لكلّ واحد: منهم من يداوم يومًا بعد يوم، ومنهم من
     يداوم يومًا من ثلاثة — والإزاحةُ تفرّق بينهم فلا يغيب الفريقُ
     كلُّه في يومٍ واحد. */
  st.users.forEach((u, i) => {
    st.shifts[u.id] = keys[i % keys.length];
    const every = (i % 3 === 2) ? 3 : 2;
    st.rota[u.id] = { every, off: i % every };
  });
  const duty = (id, ts) => {
    const r = st.rota[id];
    const d = Math.round(ts / DAY);
    return (((d - r.off) % r.every) + r.every) % r.every === 0;
  };

  const today = (function () { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
  st.users.forEach((u, ui) => {
    for (let d = 27; d >= 0; d--) {          /* أربعة أسابيع: ٣ ماضية + الجاري */
      const day = today - d * DAY;
      if (!duty(u.id, day)) continue;        /* يومُ راحةٍ لا يُبذَر حضورًا */
      /* غياب نادر ومتفرّق حتى تبدو البيانات حقيقية */
      const skip = ((ui * 7 + d) % 23) === 0;
      if (skip) continue;
      const s = SHIFTS[st.shifts[u.id]];
      const late = ((ui * 5 + d) % 9) === 0;
      st.attend.push({
        id: uid('A'), userId: u.id, day,
        at: day + s.from * HR + (late ? 34 : 6) * MIN,
        shift: st.shifts[u.id], late
      });
    }
  });
  st.attend.sort((a, b) => b.at - a.at);

  /* طلبان قائمان ليُجرَّب المسار */
  const L1 = st.users.find(u => u.role === 'leader');
  const team = st.users.filter(u => u.role === 'muhsen' && u.leaderId === L1.id);
  if (team[0]) st.swaps.push({
    id: uid('W'), no: 'SW-' + AR(3100), from: team[0].id, leaderId: L1.id,
    fromShift: st.shifts[team[0].id], toShift: keys.find(k => k !== st.shifts[team[0].id]),
    day: today + 2 * DAY, reason: 'موعد طبي في المستشفى صباح ذلك اليوم.',
    state: 'pending', at: Date.now() - 4 * HR,
    log: [{ at: Date.now() - 4 * HR, by: team[0].id, text: 'قدّم ' + team[0].name + ' طلب تبديل الشِفت' }]
  });
  if (team[1]) st.swaps.push({
    id: uid('W'), no: 'SW-' + AR(3101), from: team[1].id, leaderId: L1.id,
    fromShift: st.shifts[team[1].id], toShift: keys.find(k => k !== st.shifts[team[1].id]),
    day: today - DAY, reason: 'تعارض مع مهمة استقبال في المطار.',
    state: 'escalated', at: Date.now() - 2 * DAY, note: 'يحتاج موافقة الكنترول لتعارضه مع جدول الفوج.',
    log: [
      { at: Date.now() - 2 * DAY, by: team[1].id, text: 'قدّم ' + team[1].name + ' طلب تبديل الشِفت' },
      { at: Date.now() - 2 * DAY + 3 * HR, by: L1.id, text: 'رفع ' + L1.name + ' الطلب إلى الكنترول' }
    ]
  });

  /* استئذانٌ قائمٌ ليُجرَّب مسارُه كما جُرّب مسارُ التبديل */
  if (team[0]) st.leaves.push({
    id: uid('L'), no: 'LV-' + AR(5200), from: team[0].id, leaderId: L1.id,
    day: today, fromT: 15 * 60, toT: 17 * 60 + 30, reason: 'موعد طبّيّ',
    state: 'pending', at: Date.now() - 2 * HR,
    log: [{ at: Date.now() - 2 * HR, by: team[0].id, text: 'قدّم ' + team[0].name + ' طلب استئذان' }]
  });
}
