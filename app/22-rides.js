/* ============================================================
   الردود — شاشةُ محسن النقل في المشاعر

   الرَّدُّ صعودٌ مع حافلةٍ من موضعٍ إلى موضع. وثلاثةُ أشياءَ تُسجَّل
   ولا رابع: متى بدأ، وكم حمل، ومتى وصل. ومع البداية والوصول تُلتقط
   إحداثيّةُ الجهاز — فالوصولُ يُؤكَّد بالموقع لا بالقول.

   والردُّ التالي لا يُفتح قبل أن يُغلق الذي قبله: فالمحسنُ في حافلةٍ
   واحدةٍ لا في اثنتين.
   ============================================================ */

const RIDE_ST = {
  planned: { ar:'مجدول', p:'grey' },
  running: { ar:'جارٍ',   p:'wait' },
  done:    { ar:'وصل',    p:'live' },
  late:    { ar:'متأخّر', p:'no'   }
};
const SITE_GEO = {
  'مكة المكرمة':  { lat:21.4225, lng:39.8262 },
  'مشعر منى':     { lat:21.4135, lng:39.8930 },
  'مشعر عرفة':    { lat:21.3550, lng:39.9840 },
  'مزدلفة':       { lat:21.3890, lng:39.9370 },
  'جسر الجمرات':  { lat:21.4210, lng:39.8730 }
};
const rideDue   = r => (r.startedAt || r.planAt) + Math.round((r.mins || 40) * 1.5) * MIN;
function rideState(r) {
  if (r.endedAt) return 'done';
  if (r.startedAt) return now() > rideDue(r) ? 'late' : 'running';
  return now() > r.planAt + 15 * MIN ? 'late' : 'planned';
}
const myRides = () => (S.rides || []).filter(r => r.userId === S.session.id)
  .sort((a, b) => a.seq - b.seq);
/* الردُّ المفتوح: الجاري، وإلّا أوّلُ ما لم يبدأ */
const rideNow = () => myRides().find(r => r.startedAt && !r.endedAt)
  || myRides().find(r => !r.startedAt) || null;

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

/* لقطةُ الموقع: يُطلب من الجهاز، وإن رُفض الإذن سُجّل الرفضُ ولم يُختلق موقع */
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

/* ---------- الشاشة ---------- */
function screenRides() {
  const rs = myRides();
  const cur = rideNow();
  const done = rs.filter(r => r.endedAt).length;
  const pax = rs.reduce((a, r) => a + (r.endedAt ? (r.pax || 0) : 0), 0);

  return bar('الردود') + '<div class="view">' + ground() +
    (rs.length ? '' : empty2('لا ردود مُسنَدة إليك اليوم',
      'يُسنِد الكنترولُ الردودَ على الحركة، فتظهر هنا مرقّمةً بترتيبها.')) +

    (rs.length ? '<div class="kpi3">' +
      kcell(AR(done) + '/' + AR(rs.length), 'ردودٌ وصلت') +
      kcell(AR(pax), 'حاجًّا نُقلوا') +
      kcell(cur ? AR(cur.seq) : '—', 'الرَّدُّ الحالي') +
    '</div>' : '') +

    (cur ? rideCard(cur) : '') +

    (rs.length ? '<div class="lbl">كلُّ ردودك اليوم<small>' + AR(rs.length) + ' ردًّا</small></div>' +
      rs.map(rideLine).join('') : '') +
    '</div>' + tabs();
}

const kcell = (b, s) => '<div class="kc"><b>' + b + '</b><span>' + E(s) + '</span></div>';
const empty2 = (t, s) => '<div class="c center" style="padding:26px 16px">' +
  icon('i-target','s26') + '<b style="display:block;margin-top:10px">' + E(t) + '</b>' +
  '<span class="tiny dim2" style="display:block;margin-top:5px;line-height:1.8">' + E(s) + '</span></div>';

/* بطاقةُ الرد الحالي: خطوةٌ واحدةٌ ظاهرةٌ في كلّ حال */
function rideCard(r) {
  const st = rideState(r);
  const step = !r.startedAt ? 1 : (r.pax == null ? 2 : 3);
  const dot = (n, lbl) => '<span class="rstep' + (step > n ? ' done' : step === n ? ' on' : '') + '">' +
    '<i>' + AR(n) + '</i><b>' + E(lbl) + '</b></span>';

  return '<div class="c ridecard">' +
    '<div class="fl" style="gap:10px;align-items:flex-start">' +
      '<span class="rdmark">' + icon('i-bus','s20') + '</span>' +
      '<span class="sp"><b style="font-size:15px;display:block">' + E(r.legAr) + '</b>' +
        '<span class="tiny dim2">الرَّدُّ ' + AR(r.seq) + ' · ' + E(r.no) +
        ' · مجدول ' + t12(r.planAt) + '</span></span>' +
      pill(RIDE_ST[st].ar, RIDE_ST[st].p) + '</div>' +

    '<div class="rsteps">' + dot(1, 'بدء الرد') + dot(2, 'عدد الحجّاج') + dot(3, 'تأكيد الوصول') + '</div>' +

    (r.startedAt ? '<div class="note a">' + icon('i-clock','s16') +
      '<span>بدأ ' + t12(r.startedAt) + (r.startLoc
        ? ' · ' + distTxt(geoDist(r.startLoc, SITE_GEO[r.from])) + ' عن ' + E(r.from)
        : ' · بلا لقطة موقع') + '</span></div>' : '') +

    (step === 1
      ? '<button class="btn p" style="width:100%" data-a="rdstart" data-id="' + r.id + '">' +
          icon('i-play','s16') + 'بدء الرد — وتُلتقط لقطةُ موقعك</button>'
      : step === 2
      ? '<div class="field" style="margin:10px 0"><input id="rdpax" type="number" inputmode="numeric" ' +
          'min="0" max="80" placeholder="عدد الحجّاج على متن الحافلة"></div>' +
        '<button class="btn p" style="width:100%" data-a="rdpax" data-id="' + r.id + '">' +
          icon('i-users','s16') + 'تثبيت العدد</button>'
      : '<div class="note" style="margin:10px 0">' + icon('i-users','s16') +
          '<span>على متن الحافلة <b>' + AR(r.pax) + '</b> حاجًّا</span></div>' +
        '<div class="fl" style="gap:8px">' +
          '<button class="btn l" data-a="rdpaxedit" data-id="' + r.id + '">' +
            icon('i-edit','s16') + 'تعديل العدد</button>' +
          '<button class="btn p sp" data-a="rdend" data-id="' + r.id + '">' +
            icon('i-checkc','s16') + 'تأكيد الوصول</button></div>') +

    (r.startedAt && !r.endedAt ? '<div class="fl" style="margin-top:10px;gap:8px">' +
      '<span class="tiny dim2">حتى يُحتسب متأخّرًا</span>' +
      cdown(rideDue(r), { sla:Math.round(r.mins * 1.5) }) + '</div>' : '') +
  '</div>';
}

function rideLine(r) {
  const st = rideState(r), d = r.endLoc ? geoDist(r.endLoc, SITE_GEO[r.to]) : null;
  return '<div class="c rdline">' +
    '<span class="rdn">' + AR(r.seq) + '</span>' +
    '<span class="sp"><b>' + E(r.legAr) + '</b>' +
      '<span class="tiny dim2">' + (r.startedAt ? 'بدأ ' + t12(r.startedAt) : 'مجدول ' + t12(r.planAt)) +
      (r.endedAt ? ' · وصل ' + t12(r.endedAt) : '') +
      (r.pax != null ? ' · ' + AR(r.pax) + ' حاجًّا' : '') +
      (d != null ? ' · ' + distTxt(d) + ' عن الوجهة' : '') + '</span></span>' +
    pill(RIDE_ST[st].ar, RIDE_ST[st].p) + '</div>';
}

/* ---------- الأفعال ---------- */
function rideStart(id) {
  const r = (S.rides || []).find(x => x.id === id); if (!r || r.startedAt) return;
  toast('جارٍ تحديد الموقع…');
  grabLoc(loc => {
    r.startedAt = now(); r.startLoc = loc;
    if (!loc) r.startNote = 'بلا لقطة موقع';
    toast(loc ? 'بدأ الرد — وسُجّلت لقطةُ الموقع' : 'بدأ الرد — وتعذّرت لقطةُ الموقع', loc ? 'g' : 'r');
    save(); render();
  });
}
function ridePaxSet(id) {
  const r = (S.rides || []).find(x => x.id === id); if (!r) return;
  const el = document.getElementById('rdpax');
  const n = el ? Number(String(el.value).replace(/[^0-9]/g, '')) : NaN;
  if (!isFinite(n) || n <= 0) { toast('اكتب عدد الحجّاج', 'r'); return; }
  if (n > 80) { toast('العدد أكبر من سعة الحافلة', 'r'); return; }
  r.pax = n;
  toast('ثُبّت العدد — ' + AR(n) + ' حاجًّا');
  save(); render();
}
function rideEnd(id) {
  const r = (S.rides || []).find(x => x.id === id); if (!r || !r.startedAt || r.endedAt) return;
  if (r.pax == null) { toast('ثبّت عدد الحجّاج أوّلًا', 'r'); return; }
  toast('جارٍ تأكيد الوصول…');
  grabLoc(loc => {
    r.endedAt = now(); r.endLoc = loc;
    const d = loc ? geoDist(loc, SITE_GEO[r.to]) : null;
    toast(loc ? 'أُكّد الوصول — ' + distTxt(d) + ' عن ' + r.to : 'أُكّد الوصول بلا لقطة موقع',
      loc ? 'g' : 'r');
    save(); render();
  });
}

/* ---------- البذرة ---------- */
/* ردودٌ ليوم المشاعر: الأوّلُ وصل، والثاني جارٍ، والباقي مجدول —
   فيُرى الحالُ الثلاثة في شاشةٍ واحدة بلا انتظار. */
const MOVE_LEGS = [
  { from:'مكة المكرمة', to:'مشعر منى',    ar:'مكة ← منى',     mins:55 },
  { from:'مشعر منى',    to:'مشعر عرفة',   ar:'منى ← عرفة',    mins:45 },
  { from:'مشعر عرفة',   to:'مزدلفة',      ar:'عرفة ← مزدلفة', mins:40 },
  { from:'مزدلفة',      to:'مشعر منى',    ar:'مزدلفة ← منى',  mins:35 },
  { from:'مشعر منى',    to:'جسر الجمرات', ar:'منى ← الجمرات', mins:25 }
];
function seedRides(st) {
  st.rides = [];
  const crew = st.users.filter(u => u.role === 'muhsen').slice(0, 6);
  crew.forEach((u, ui) => {
    const rounds = 3 + (ui % 3);                 /* ٣ إلى ٥ ردود */
    for (let i = 0; i < rounds; i++) {
      const leg = MOVE_LEGS[i % MOVE_LEGS.length];
      const planAt = Date.now() - 70 * MIN + i * 95 * MIN + ui * 6 * MIN;
      const past = planAt < Date.now() - 20 * MIN;
      const jit = k => ({ lat:SITE_GEO[k].lat + ((ui * 7 + i * 3) % 9 - 4) * 0.0011,
                          lng:SITE_GEO[k].lng + ((ui * 5 + i) % 9 - 4) * 0.0011,
                          acc:7 + (ui % 4) * 5, at:planAt });
      st.rides.push({
        id:'RD' + (700 + st.rides.length), no:'RD-' + (4300 + st.rides.length),
        userId:u.id, seq:i + 1,
        from:leg.from, to:leg.to, mins:leg.mins, legAr:leg.ar, planAt:planAt,
        startedAt: past ? planAt + 4 * MIN : null,
        startLoc:  past ? jit(leg.from) : null,
        pax:       past ? 40 + ((ui * 9 + i * 7) % 12) : null,
        endedAt:   past && i === 0 ? planAt + (leg.mins + 7) * MIN : null,
        endLoc:    past && i === 0 ? jit(leg.to) : null
      });
    }
  });
  st.rides.sort((a, b) => a.planAt - b.planAt);
}
