/* ============================================================
   الردود — دورةُ محسن النقل في المشاعر

   الرَّدُّ صعودٌ مع حافلةٍ من موضعٍ إلى موضع. والمحسنُ هو من
   يُنشئه: لا يُسنَد إليه مسبقًا، لأنّ الحركةَ في المشاعر تتبدّل
   بأسرع ممّا تُخطَّط.

   الدورةُ أربعُ خطواتٍ لا غير:
     إضافةُ ردٍّ (المسار) ← عددُ الحجّاج ← بدءُ الرَّدّ ← إنهاؤه
   ومع البدء والإنهاء تُلتقط إحداثيّةُ الجهاز — فالوصولُ يُؤكَّد
   بالموقع لا بالقول.

   والردُّ التالي لا يُفتح قبل أن يُغلق الذي قبله: فالمحسنُ في
   حافلةٍ واحدةٍ لا في اثنتين.
   ============================================================ */

const RIDE_ST = {
  draft:   { ar:'لم يبدأ', p:'grey' },
  running: { ar:'جارٍ',    p:'wait' },
  done:    { ar:'وصل',     p:'live' },
  late:    { ar:'متأخّر',  p:'no'   }
};
const SITE_GEO = {
  'مكة المكرمة':  { lat:21.4225, lng:39.8262 },
  'مشعر منى':     { lat:21.4135, lng:39.8930 },
  'مشعر عرفة':    { lat:21.3550, lng:39.9840 },
  'مزدلفة':       { lat:21.3890, lng:39.9370 },
  'جسر الجمرات':  { lat:21.4210, lng:39.8730 }
};
const MOVE_LEGS = [
  { from:'مكة المكرمة', to:'مشعر منى',    ar:'مكة ← منى',     mins:55 },
  { from:'مشعر منى',    to:'مشعر عرفة',   ar:'منى ← عرفة',    mins:45 },
  { from:'مشعر عرفة',   to:'مزدلفة',      ar:'عرفة ← مزدلفة', mins:40 },
  { from:'مزدلفة',      to:'مشعر منى',    ar:'مزدلفة ← منى',  mins:35 },
  { from:'مشعر منى',    to:'جسر الجمرات', ar:'منى ← الجمرات', mins:25 },
  { from:'جسر الجمرات', to:'مشعر منى',    ar:'الجمرات ← منى', mins:25 },
  { from:'مشعر منى',    to:'مكة المكرمة', ar:'منى ← مكة',     mins:55 }
];

const rideDue = r => (r.startedAt || now()) + Math.round((r.mins || 40) * 1.5) * MIN;
function rideState(r) {
  if (r.endedAt) return 'done';
  if (r.startedAt) return now() > rideDue(r) ? 'late' : 'running';
  return 'draft';
}
const myRides = () => (S.rides || []).filter(r => r.userId === S.session.id)
  .sort((a, b) => a.seq - b.seq);
/* المفتوح: الجاري، وإلّا المُنشأُ الذي لم يبدأ */
const rideNow = () => myRides().find(r => r.startedAt && !r.endedAt)
  || myRides().find(r => !r.startedAt) || null;
const openRides = () => myRides().filter(r => !r.endedAt).length;

/* متوسّطُ زمن الرَّدّ — من المنتهية وحدها، فالجاري لم يكتمل بعد */
function rideAvg() {
  const d = myRides().filter(r => r.endedAt && r.startedAt);
  if (!d.length) return null;
  return Math.round(d.reduce((a, r) => a + (r.endedAt - r.startedAt), 0) / d.length / MIN);
}

function geoDist(a, b) {
  if (!a || !b) return null;
  const R = 6371000, t = x => x * Math.PI / 180;
  const dLat = t(b.lat - a.lat), dLng = t(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
const distTxt = m => m == null ? '—'
  : m < 1000 ? AR(m) + ' م' : AR((m / 1000).toFixed(1)) + ' كم';
const minTxt = m => m == null ? '—'
  : m < 60 ? AR(m) + ' د' : AR(Math.floor(m / 60)) + ' س ' + AR(m % 60) + ' د';

/* لقطةُ الموقع: تُطلب من الجهاز، وإن رُفض الإذن سُجّل الرفضُ ولم يُختلق موقع */
function grabLoc(cb) {
  if (!navigator.geolocation) { cb(null, 'الجهاز لا يدعم تحديد الموقع'); return; }
  let done = false;
  const t = setTimeout(() => { if (!done) { done = true; cb(null, 'تعذّر تحديد الموقع'); } }, 7000);
  navigator.geolocation.getCurrentPosition(
    p => { if (done) return; done = true; clearTimeout(t);
      cb({ lat:p.coords.latitude, lng:p.coords.longitude,
           acc:Math.round(p.coords.accuracy || 0), at:now() }, null); },
    () => { if (done) return; done = true; clearTimeout(t); cb(null, 'رُفض إذن الموقع'); },
    { enableHighAccuracy:true, timeout:6000, maximumAge:30000 });
}

/* ============================ الشاشة ============================ */
function screenRides() {
  const rs = myRides(), cur = rideNow();
  const done = rs.filter(r => r.endedAt).length;
  const pax = rs.reduce((a, r) => a + (r.endedAt ? (r.pax || 0) : 0), 0);
  const avg = rideAvg();

  return bar('الردود') + '<div class="view">' + ground() +

    '<div class="kpi3">' +
      kcell(AR(done), 'ردودٌ وصلت') +
      kcell(avg == null ? '—' : minTxt(avg), 'متوسّطُ الرَّدّ') +
      kcell(AR(pax), 'حاجًّا نُقلوا') +
    '</div>' +

    (cur ? rideCard(cur) : rideNewCard()) +

    (rs.length
      ? '<div class="lbl">ردودُ اليوم<small>' + AR(rs.length) + '</small></div>' +
        rs.slice().reverse().map(rideLine).join('')
      : '') +
  '</div>' + tabs();
}

const kcell = (b, s) => '<div class="kc"><b>' + b + '</b><span>' + E(s) + '</span></div>';

/* لا ردَّ مفتوحًا: زرُّ الإضافة وحده — بابٌ واحدٌ لا يُخطئه أحد */
function rideNewCard() {
  const n = myRides().length;
  return '<div class="c rdnew">' +
    '<span class="rdmark big">' + icon('i-bus', 's26') + '</span>' +
    '<b>' + (n ? 'أنهيتَ ردودَك حتّى الآن' : 'لم تبدأ ردودَ اليوم') + '</b>' +
    '<span class="tiny dim2">' +
      (n ? 'أضِف الرَّدَّ ' + AR(n + 1) + ' حين تركب الحافلةَ التالية.'
         : 'أضِف رَدًّا حين تركب الحافلة.') + '</span>' +
    '<button class="btn p" data-a="rdnew">' + icon('i-plus', 's16') + 'إضافة رد</button>' +
  '</div>';
}

/* لوحُ الإضافة: المسارُ ثمّ العدد — خطوتان قبل البدء */
function rideSheet() {
  const pick = S.rdLeg == null ? 0 : S.rdLeg;
  return '<div class="sheeth"><b>رَدٌّ جديد</b>' +
      '<button class="sx" data-a="close" aria-label="إغلاق">' + icon('i-x', 's18') + '</button></div>' +
    '<div class="lbl plain">المسار</div>' +
    '<div class="legs">' + MOVE_LEGS.map((l, i) =>
      '<button class="listitem' + (i === pick ? ' on' : '') + '" data-a="rdleg" data-v="' + i + '">' +
        icon('i-bus', 's18') + '<span class="sp"><b>' + E(l.ar) + '</b>' +
        '<span class="tiny dim2">' + AR(l.mins) + ' دقيقة تقديرًا</span></span>' +
        (i === pick ? icon('i-checkc', 's18') : '') + '</button>').join('') + '</div>' +
    '<div class="lbl plain" style="margin-top:12px">عدد الحجّاج على متن الحافلة</div>' +
    '<div class="field"><input id="rdpax" type="number" inputmode="numeric" min="1" max="80" ' +
      'placeholder="مثال: ٤٥" aria-label="عدد الحجّاج"></div>' +
    '<div class="sheetbtns">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" data-a="rdadd">' + icon('i-plus', 's16') + 'إضافة الرد</button>' +
    '</div>';
}

/* بطاقةُ الرَّدّ المفتوح — خطوةٌ واحدةٌ ظاهرةٌ في كلّ حال.

   والأزرارُ الثانويّةُ كانت صفًّا يفيض خارج البطاقة على عرض
   الجوّال. صارت صفًّا يلتفّ، وكلٌّ منها يملأ نصفَ العرض. */
function rideCard(r) {
  const st = rideState(r);
  const busy = S.rdBusy === r.id;
  const step = !r.startedAt ? 2 : 3;      /* ١ الإضافةُ تمّت بإنشائه */
  const dot = (n, lbl) => '<span class="rstep' + (step > n ? ' done' : step === n ? ' on' : '') + '">' +
    '<i>' + AR(n) + '</i><b>' + E(lbl) + '</b></span>';

  /* في الطريق: شريطٌ حيٌّ يبقى حتّى يُغلَق الرَّدّ، فلا يُترك
     المحسنُ يسأل «هل بدأ فعلًا؟» */
  const transit = r.startedAt && !r.endedAt
    ? '<div class="rtransit">' +
        '<span class="rpulse"></span>' +
        '<span class="sp"><b>الرَّدُّ في الطريق</b>' +
          '<span>' + E(r.from) + ' ← ' + E(r.to) + ' · بدأ ' + t12(r.startedAt) +
          ' · منذ ' + minTxt(Math.round((now() - r.startedAt) / MIN)) + '</span></span>' +
        cdown(rideDue(r), { sla: Math.round(r.mins * 1.5) }) +
      '</div>'
    : '';

  return '<div class="c ridecard">' +
    '<div class="fl" style="gap:10px;align-items:flex-start">' +
      '<span class="rdmark">' + icon('i-bus', 's20') + '</span>' +
      '<span class="sp"><b style="font-size:15px;display:block">' + E(r.legAr) + '</b>' +
        '<span class="tiny dim2">الرَّدُّ ' + AR(r.seq) + ' · ' + E(r.no) +
        ' · ' + AR(r.pax) + ' حاجًّا</span></span>' +
      pill(RIDE_ST[st].ar, RIDE_ST[st].p) + '</div>' +

    '<div class="rsteps">' +
      dot(1, 'إضافة الرد') + dot(2, 'بدء الرد') + dot(3, 'إنهاء الرد') + '</div>' +

    transit +

    (step === 2
      ? '<button class="btn p wide' + (busy ? ' busy' : '') + '" ' +
          (busy ? 'disabled' : 'data-a="rdstart" data-id="' + r.id + '"') + '>' +
          (busy ? '<span class="spin"></span>جارٍ تحديد موقعك…'
                : icon('i-play', 's16') + 'بدء الرد') + '</button>' +
        (busy ? '' :
          '<div class="rdsub">' +
            '<button class="btn l" data-a="rdedit" data-id="' + r.id + '">' +
              icon('i-edit', 's16') + 'تعديل</button>' +
            '<button class="btn d" data-a="rddel" data-id="' + r.id + '">' +
              icon('i-x', 's16') + 'حذف</button></div>')
      : '<button class="btn p wide' + (busy ? ' busy' : '') + '" ' +
          (busy ? 'disabled' : 'data-a="rdend" data-id="' + r.id + '"') + '>' +
          (busy ? '<span class="spin"></span>جارٍ تأكيد وصولك…'
                : icon('i-checkc', 's16') + 'إنهاء الرد') + '</button>') +
  '</div>';
}

function rideLine(r) {
  const st = rideState(r), d = r.endLoc ? geoDist(r.endLoc, SITE_GEO[r.to]) : null;
  const took = r.endedAt && r.startedAt ? Math.round((r.endedAt - r.startedAt) / MIN) : null;
  return '<div class="c rdline">' +
    '<span class="rdn">' + AR(r.seq) + '</span>' +
    '<span class="sp"><b>' + E(r.legAr) + '</b>' +
      '<span class="tiny dim2">' +
      (r.startedAt ? 'بدأ ' + t12(r.startedAt) : 'لم يبدأ') +
      (r.endedAt ? ' · وصل ' + t12(r.endedAt) : '') +
      (took != null ? ' · ' + minTxt(took) : '') +
      (r.pax != null ? ' · ' + AR(r.pax) + ' حاجًّا' : '') +
      (d != null ? ' · ' + distTxt(d) + ' عن الوجهة' : '') + '</span></span>' +
    pill(RIDE_ST[st].ar, RIDE_ST[st].p) + '</div>';
}

/* ============================ الأفعال ============================ */
const rdPaxRead = () => {
  const el = document.getElementById('rdpax');
  const n = el ? Number(String(el.value).replace(/[^0-9]/g, '')) : NaN;
  if (!isFinite(n) || n <= 0) { toast('اكتب عدد الحجّاج', 'r'); return null; }
  if (n > 80) { toast('العدد أكبر من سعة الحافلة', 'r'); return null; }
  return n;
};

function rideAdd() {
  if (myRides().some(r => !r.endedAt)) {
    toast('أنهِ الرَّدَّ المفتوحَ أوّلًا', 'r'); return;
  }
  const n = rdPaxRead(); if (n == null) return;
  const leg = MOVE_LEGS[S.rdLeg || 0];
  const seq = myRides().length + 1;
  S.rides = S.rides || [];
  S.rides.push({
    id: uid('RD'), no: 'RD-' + (4300 + S.rides.length),
    userId: S.session.id, seq: seq,
    from: leg.from, to: leg.to, mins: leg.mins, legAr: leg.ar,
    pax: n, addedAt: now(), startedAt: null, startLoc: null, endedAt: null, endLoc: null
  });
  S.sheet = null; S.rdLeg = null;
  toast('أُضيف الرَّدُّ ' + AR(seq) + ' — ' + AR(n) + ' حاجًّا', 'g');
  save(); render();
}

/* الفعلُ يُعلن عن نفسه فورًا: كان الزرُّ يُنقَر فلا شيءَ يظهر حتّى
   تردَّ خدمةُ الموقع — سبعَ ثوانٍ في أسوأ الأحوال. فبدا معطوبًا.
   الآن يُقفل ويُعلن، ثمّ يقع الفعل. */
function rideBusy(id, on) { S.rdBusy = on ? id : null; }

function rideStart(id) {
  const r = (S.rides || []).find(x => x.id === id);
  if (!r || r.startedAt || S.rdBusy) return;
  rideBusy(id, true);
  toast('جارٍ تحديد موقعك…');
  save(); render();                       /* يُرسم قبل الانتظار لا بعده */
  grabLoc(loc => {
    rideBusy(id, false);
    r.startedAt = now(); r.startLoc = loc;
    if (!loc) r.startNote = 'بلا لقطة موقع';
    toast(loc ? 'بدأ الرَّدُّ — وسُجّلت لقطةُ الموقع' : 'بدأ الرَّدُّ — وتعذّرت لقطةُ الموقع',
      loc ? 'g' : 'r');
    buzz(); save(); render();
  });
}

function rideEnd(id) {
  const r = (S.rides || []).find(x => x.id === id);
  if (!r || !r.startedAt || r.endedAt || S.rdBusy) return;
  rideBusy(id, true);
  toast('جارٍ تأكيد وصولك…');
  save(); render();
  grabLoc(loc => {
    rideBusy(id, false);
    r.endedAt = now(); r.endLoc = loc;
    if (!loc) r.endNote = 'بلا لقطة موقع';
    const d = loc ? geoDist(loc, SITE_GEO[r.to]) : null;
    const took = Math.round((r.endedAt - r.startedAt) / MIN);
    toast(loc ? 'انتهى الرَّدُّ في ' + minTxt(took) + ' · ' + distTxt(d) + ' عن ' + r.to
              : 'انتهى الرَّدُّ في ' + minTxt(took) + ' — وتعذّرت لقطةُ الموقع',
      loc ? 'g' : 'r');
    const u = me();
    if (u && u.leaderId) notify(u.leaderId, 'i-bus', 'وصل رَدّ',
      u.name + ' أنهى ' + r.legAr + ' · ' + AR(r.pax) + ' حاجًّا في ' + minTxt(took),
      { n:'muhsens' });
    buzz(); save(); render();
  });
}

function rideEdit(id) {
  const r = (S.rides || []).find(x => x.id === id);
  if (!r || r.startedAt) { toast('بدأ الرَّدُّ — لا يُعدَّل', 'r'); return; }
  S.rdLeg = MOVE_LEGS.findIndex(l => l.ar === r.legAr);
  S.rdEdit = id;
  S.sheet = rideSheet();
}

function rideDel(id) {
  const i = (S.rides || []).findIndex(x => x.id === id);
  if (i < 0) return;
  if (S.rides[i].startedAt) { toast('بدأ الرَّدُّ — لا يُحذف', 'r'); return; }
  S.rides.splice(i, 1);
  /* الترقيمُ يُعاد فلا تبقى فجوةٌ في تسلسل اليوم */
  myRides().forEach((r, n) => { r.seq = n + 1; });
  toast('حُذف الرَّدّ'); save(); render();
}

/* البذرة: يومٌ بدأ — ردّان منتهيان لمحسني النقل، والثالثُ يُضيفه هو */
function seedRides(st) {
  st.rides = [];
  const crew = st.users.filter(u => u.role === 'muhsen' && u.specialty === 'نقل');
  crew.forEach((u, ui) => {
    const rounds = 2;
    for (let i = 0; i < rounds; i++) {
      const leg = MOVE_LEGS[i % MOVE_LEGS.length];
      const startedAt = Date.now() - (190 - i * 85 - ui * 4) * MIN;
      const took = leg.mins + ((ui * 5 + i * 3) % 13) - 4;
      const jit = k => ({ lat:SITE_GEO[k].lat + ((ui * 7 + i * 3) % 9 - 4) * 0.0011,
                          lng:SITE_GEO[k].lng + ((ui * 5 + i) % 9 - 4) * 0.0011,
                          acc:7 + (ui % 4) * 5, at:startedAt });
      st.rides.push({
        id:'RD' + (700 + st.rides.length), no:'RD-' + (4300 + st.rides.length),
        userId:u.id, seq:i + 1,
        from:leg.from, to:leg.to, mins:leg.mins, legAr:leg.ar,
        pax: 40 + ((ui * 9 + i * 7) % 12),
        addedAt: startedAt - 6 * MIN,
        startedAt: startedAt, startLoc: jit(leg.from),
        endedAt: startedAt + took * MIN, endLoc: jit(leg.to)
      });
    }
  });
}
