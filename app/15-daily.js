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

/* ---------- التزام الأسابيع الماضية ---------- */
function weekStats(id, weeksAgo) {
  const end = dayStart(now()) - weeksAgo * 7 * DAY;
  let done = 0, late = 0, days = 0;
  for (let i = 0; i < 7; i++) {
    const d = end - i * DAY;
    if (d > dayStart(now())) continue;
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
      'شِفتك الجديد: ' + SHIFTS[s.toShift].l + ' · ' + shiftWindow(s.toShift), { n: 'daily' });
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
const shiftWindow = k => AR(SHIFTS[k].from) + ':٠٠ — ' + AR(SHIFTS[k].to) + ':٠٠';

/* ---------- الشاشة ---------- */
function screenDaily() {
  const u = me(), L = isLeader();
  const sh = shiftInfo(u.id), me_ = dayRec(u.id, now());
  const team = L ? teamOf(u.id) : [];
  const swaps = mySwaps();
  const inbox = pendingSwaps();
  const seg = S.tab.dl || 'me';

  const weekCells = id => {
    let out = '';
    for (let i = 6; i >= 0; i--) {
      const d = dayStart(now()) - i * DAY;
      const r = dayRec(id, d);
      const isToday = d === dayStart(now());
      out += '<span class="wk ' + (r ? (r.late ? 'late' : 'ok') : 'no') + (isToday ? ' today' : '') + '">' +
        '<i>' + DAY_AB[new Date(d).getDay()] + '</i><b>' + AR(new Date(d).getDate()) + '</b>' +
        '<u>' + (r ? (r.late ? 'متأخر' : 'حاضر') : 'غائب') + '</u></span>';
    }
    return '<div class="wkrow">' + out + '</div>';
  };

  return bar('التحضير اليومي', { right: '<button data-a="place" aria-label="موقعي">' + icon('i-pin') + '</button>' }) +
    '<div class="view">' + ground() +

    '<div class="seg">' +
      '<button class="' + (seg === 'me' ? 'on' : '') + '" data-a="seg" data-k="dl" data-v="me">تحضيري</button>' +
      (L ? '<button class="' + (seg === 'team' ? 'on' : '') + '" data-a="seg" data-k="dl" data-v="team">الفريق<i>' +
        AR(team.filter(m => attendedToday(m.id)).length) + '</i></button>' : '') +
      '<button class="' + (seg === 'swap' ? 'on' : '') + '" data-a="seg" data-k="dl" data-v="swap">تبديل الشِفت' +
        (inbox.length ? '<i>' + AR(inbox.length) + '</i>' : '') + '</button>' +
    '</div>' +

    (seg === 'me' ? (
      '<div class="shift" style="--sc:' + sh.c + '">' +
        '<span class="si">' + icon(sh.i, 's26') + '</span>' +
        '<span class="sp"><b>الشِفت ' + sh.l + '</b>' +
        '<span>' + shiftWindow(shiftOf(u.id)) + ' · ' + E(HQ) + '</span></span>' +
        (me_ ? '<span class="ok">' + icon('i-checkc','s18') + '</span>' : '') + '</div>' +

      (me_
        ? '<div class="note g">' + icon('i-checkc','s16') +
          '<span><b>حضّرت اليوم ' + t12(me_.at) + '</b>' + (me_.late ? ' — بعد بداية الشِفت' : ' — في الوقت') +
          '<br>' + dayName(now()) + ' ' + hijri(now()) + '</span></div>'
        : '<button class="cta ' + (canCheckIn(u.id) ? '' : 'off') + '" ' +
            (canCheckIn(u.id) ? 'data-a="checkin"' : 'disabled') + '>' + icon('i-check','s26') +
            '<span class="t"><b>تحضير اليوم</b><span>' +
            (canCheckIn(u.id) ? 'داخل المقر — ' + t12(now()) : E(checkInReason())) + '</span></span></button>') +

      (!inHQ() ? '<button class="note a" data-a="place" style="width:100%">' + icon('i-pin','s16') +
        '<span class="sp" style="text-align:right">موقعك الآن: ' +
        (S.myPlace === 'site' ? 'موقع مهمة' : 'خارج النطاق') +
        ' — التحضير اليومي لا يُقبل إلا من داخل المقر. اضغط للتبديل.</span></button>' : '') +

      '<div class="lbl">هذا الأسبوع<small>' + AR(weekStats(u.id, 0).done) + ' من ' + AR(weekStats(u.id, 0).days) + '</small></div>' +
      '<div class="c">' + weekCells(u.id) +
        '<div class="row tiny dim2" style="margin-top:10px">' +
          '<span>' + icon('i-check','s14') + ' في الوقت</span>' +
          '<span>' + icon('i-clock','s14') + ' متأخر</span>' +
          '<span>' + icon('i-x','s14') + ' لم يحضر</span></div></div>' +

      '<div class="lbl">الأسابيع الماضية</div>' +
      '<div class="grid3">' + [1, 2, 3].map(w => {
        const st = weekStats(u.id, w);
        return '<div class="kpi"><b style="color:' + (st.pct >= 90 ? 'var(--g)' : st.pct >= 70 ? 'var(--amber)' : 'var(--red)') + '">' +
          AR(st.pct) + '٪</b><span>قبل ' + AR(w) + ' أسبوع</span></div>';
      }).join('') + '</div>' +

      '<button class="btn l" data-a="swapreq">' + icon('i-swap','s16') + 'طلب تبديل الشِفت</button>'
    ) : seg === 'team' ? (
      '<div class="lbl">حضور اليوم<small>' + AR(team.filter(m => attendedToday(m.id)).length) +
        ' من ' + AR(team.length) + '</small></div>' +
      (team.length ? team.map(m => {
        const r = dayRec(m.id, now()), s2 = shiftInfo(m.id), st = weekStats(m.id, 0);
        return '<button class="c" data-a="go" data-n="profile" data-id="' + m.id + '" style="width:100%;text-align:right">' +
          '<div class="fl">' + avat(m) +
            '<span class="nm sp"><b>' + E(m.name) + '</b>' +
            '<span>الشِفت ' + s2.l + ' · ' + shiftWindow(shiftOf(m.id)) + '</span></span>' +
            (r ? pill(r.late ? 'حضر متأخرًا ' + t12(r.at) : 'حضر ' + t12(r.at), r.late ? 'wait' : 'live')
               : pill('لم يحضر', 'no')) + '</div>' +
          weekCells(m.id) +
          '<div class="row tiny dim2" style="margin-top:8px"><span>التزام الأسبوع</span>' +
          '<b>' + AR(st.pct) + '٪</b></div></button>';
      }).join('') : '<div class="c center dim sm" style="padding:24px">لا يوجد فريق</div>')
    ) : (
      (inbox.length ? '<div class="lbl">بانتظار قرارك<small>' + AR(inbox.length) + '</small></div>' +
        inbox.map(s => swapCard(s, true)).join('') : '') +
      '<button class="btn p" data-a="swapreq">' + icon('i-swap','s16') + 'طلب تبديل شِفت جديد</button>' +
      '<div class="lbl">سجل الطلبات<small>' + AR(swaps.length) + '</small></div>' +
      (swaps.length ? swaps.map(s => swapCard(s, s.state === 'pending' && L && s.leaderId === u.id)).join('')
        : '<div class="c center dim sm" style="padding:24px">لا توجد طلبات بعد</div>')
    )) +
    '</div>' + tabs();
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
    '<div class="tiny dim2" style="margin-bottom:10px">شِفتك الحالي: ' + SHIFTS[cur].l + ' · ' + shiftWindow(cur) + '</div>' +
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
    '<div class="field" style="margin:8px 0"><input id="swr" maxlength="140" placeholder="اذكر سببًا واضحًا — يصل الليدر"></div>' +
    '<div class="note a">' + icon('i-info','s16') +
      '<span>يصل الطلب إلى ليدرك، وله أن يعتمده أو يرفعه إلى الكنترول.</span></div>' +
    '<div class="grid2" style="margin-top:12px">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" data-a="dosendswap">إرسال الطلب</button></div>';
}

/* ---------- بذر ثلاثة أسابيع ماضية وأسبوع جارٍ ---------- */
function seedDaily(st) {
  st.shifts = {}; st.attend = []; st.swaps = [];
  const keys = Object.keys(SHIFTS);
  st.users.forEach((u, i) => { st.shifts[u.id] = keys[i % keys.length]; });

  const today = (function () { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
  st.users.forEach((u, ui) => {
    for (let d = 27; d >= 0; d--) {          /* أربعة أسابيع: ٣ ماضية + الجاري */
      const day = today - d * DAY;
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
}
