/* اختبار شامل بلا متصفح — يكشف أخطاء التنفيذ وقواعد العمل قبل النشر */
const fs = require('fs'), path = require('path'), vm = require('vm');
const IMGP = path.join(__dirname, 'assets', 'images.json');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');

const store = {};
const el = { className: '', innerHTML: '', querySelector: () => null, querySelectorAll: () => [] };
const handlers = [];
const sandbox = {
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }), navigator: { standalone: false }, innerHeight: 900 },
  document: {
    documentElement: { classList: { add() {} }, style: { setProperty() {} } },
    getElementById: () => el,
    addEventListener: (t, fn) => { if (t === 'click') handlers.push(fn); },
    querySelector: () => null, querySelectorAll: () => []
  },
  localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } },
  navigator: { vibrate() {} },
  setInterval: () => 0, setTimeout: () => 0,
  Intl, Date, Math, JSON, console, Array, Object, String, Number, Set, Boolean, isNaN
};
sandbox.window.IMG = JSON.parse(fs.readFileSync(IMGP, 'utf8'));
sandbox.globalThis = sandbox;

const FILES = ['03-data.js','04-core.js','05-ui.js','06-task.js','07-muhsen.js','08-more.js','09-admin.js','11-reqcenter.js','12-photos.js','13-docs.js','14-guide.js','15-daily.js','16-push.js','17-reports.js','10-router.js'];
const js = FILES.map(read).join('\n');
const ctx = vm.createContext(sandbox);

let fail = 0;
function step(name, fn) {
  try { fn(); console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ' → ' + e.message + '\n    ' + (e.stack || '').split('\n')[1]); }
}
const run = code => vm.runInContext(code, ctx);
const click = ds => {
  const target = { closest: sel => (sel === '[data-a]' ? { dataset: ds, closest: () => null } : null) };
  handlers.forEach(h => h({ target }));
};

console.log('تحميل التطبيق');
step('التنفيذ الأولي', () => vm.runInContext(js, ctx, { filename: 'app.js' }));
if (fail) process.exit(1);

console.log('\nالبيانات');
step('٣ ليدرات · ٥ محسنين لكل واحد · وفريق احتياطي', () => {
  const L = run('S.users.filter(u=>u.role==="leader").length');
  const per = run('teamOf("L1").length');
  const res = run('reserveTeam().length');
  if (L !== 3) throw new Error(L + ' ليدر');
  if (per !== 5) throw new Error(per + ' لكل ليدر');
  if (res < 4) throw new Error('الاحتياط ' + res);
  if (run('reserveTeam().some(u=>u.leaderId)')) throw new Error('احتياطي مرتبط بليدر');
  if (run('teamOf("L1").some(u=>u.reserve)')) throw new Error('احتياطي داخل فريق');
});
step('لا وجود للمجموعات', () => { if (run('S.tasks.some(t=>t.groups)')) throw new Error('ما زالت موجودة'); });
step('الحجاج على مستوى الـKT', () => { if (!run('pilgrimsOf("KT085").length')) throw new Error('لا يوجد حجاج'); });
step('مهام منتهية مقيَّمة جاهزة', () => {
  const n = run('S.tasks.filter(t=>t.status==="done"&&t.rating).length');
  if (n < 5) throw new Error('فقط ' + n);
});
step('التذاكر والتقارير منفصلتان', () => {
  if (!run('S.reports.length')) throw new Error('لا توجد تقارير');
  if (!run('S.tickets.length')) throw new Error('لا توجد تذاكر');
  if (!run('S.tickets.some(k=>k.src==="محسن")')) throw new Error('لا تذاكر من محسنين');
  if (!run('S.reports.some(r=>r.to==="CONTROL")')) throw new Error('لا تقارير للكنترول');
  if (!run('S.reports.some(r=>r.to!=="CONTROL")')) throw new Error('لا تقارير من محسنين');
});
step('كل المهام مسكَّنة تلقائيًّا', () => {
  const bad = run('S.tasks.filter(function(t){return !acceptedSlots(t).length}).length');
  if (bad) throw new Error(bad + ' مهمة بلا محسنين');
  if (!run('S.tasks.some(function(t){return t.assigned.some(function(a){return a.auto})})'))
    throw new Error('لا يوجد تسكين تلقائي');
});

console.log('\nتصفّح شاشات الليدر');
click({ a: 'login', id: 'L1' });
['home','tasks','lreq','muhsens','rating','tickets','notifs','calendar','pilgrims','more','profile','admin']
  .forEach(n => step('شاشة ' + n, () => { click({ a: 'go', n }); if (!el.innerHTML) throw new Error('فارغة'); }));

console.log('\nالتسكين والاحتياط والانسحاب');
let TID;
step('فتح مهمة قادمة مسكَّنة', () => {
  TID = run('S.tasks.filter(t=>t.leaderId==="L1"&&t.start>now()).sort((a,b)=>a.start-b.start)[0].id');
  if (!TID) throw new Error('لا توجد مهمة قادمة');
  if (!run('acceptedSlots(taskById("' + TID + '")).length')) throw new Error('غير مسكَّنة');
  click({ a: 'go', n: 'assign', id: TID });
  if (!el.innerHTML) throw new Error('شاشة التسكين فارغة');
});
step('لا حد أدنى ولا أعلى', () => {
  if (run('typeof MIN_ASSIGN')  !== 'undefined') throw new Error('ما زال الحد الأدنى موجودًا');
  const t = run('taskById("' + TID + '")');
  if (run('recomputeStatus(taskById("' + TID + '"))') !== 'assigned') throw new Error('الحالة خاطئة');
});
step('إزالة محسن لا تُسقط الحالة ما دام غيره باقيًا', () => {
  const mid = run('acceptedSlots(taskById("' + TID + '"))[0].muhsenId');
  sandbox.document.getElementById = () => Object.assign({}, el, { value: 'استبدال' });
  click({ a: 'doremove', id: TID, u: mid });
  sandbox.document.getElementById = () => el;
  if (run('slotOf(taskById("' + TID + '"),"' + mid + '")')) throw new Error('لم يُزل');
  if (run('recomputeStatus(taskById("' + TID + '"))') !== 'assigned') throw new Error('سقطت الحالة');
  sandbox.RM_ = mid;
});
step('طلب تعزيز من الفريق الاحتياطي', () => {
  const r = run('reserveTeam()[0].id');
  click({ a: 'send', id: TID, u: r });
  const sl = run('taskById("' + TID + '").assigned.find(x=>x.muhsenId==="' + r + '")');
  if (!sl) throw new Error('لم يُرسل الطلب');
  if (sl.req !== 'pending') throw new Error('الحالة ' + sl.req);
  run('respondRequest(taskById("' + TID + '"),"' + r + '",true)');
  if (!run('acceptedSlots(taskById("' + TID + '")).some(a=>a.muhsenId==="' + r + '")'))
    throw new Error('لم يُقبل');
  sandbox.RS_ = r;
});
step('الاحتياط يعمل ولو كان الفريق كاملًا', () => {
  const t2 = run('S.tasks.filter(t=>t.leaderId==="L1"&&t.start>now()&&t.id!=="' + TID + '")[0]');
  const full = run('acceptedSlots(taskById("' + t2.id + '")).length');
  if (full < 5) throw new Error('الفريق غير كامل: ' + full);
  const r2 = run('reserveTeam()[1].id');
  click({ a: 'send', id: t2.id, u: r2 });
  if (!run('taskById("' + t2.id + '").assigned.some(x=>x.muhsenId==="' + r2 + '")'))
    throw new Error('مُنع الطلب رغم توفر الاحتياط');
});
step('المحسن يطلب الانسحاب والليدر يقرّر', () => {
  const mid = run('acceptedSlots(taskById("' + TID + '")).find(a=>!isReserve(a.muhsenId)).muhsenId');
  run('S.session={id:"' + mid + '",at:Date.now()}');
  sandbox.document.getElementById = () => Object.assign({}, el, { value: '' });
  click({ a: 'doaskwd', id: TID });
  sandbox.document.getElementById = () => el;
  if (run('myWithdraw(taskById("' + TID + '"),"' + mid + '")')) throw new Error('قُبل طلب بلا سبب');

  sandbox.document.getElementById = () => Object.assign({}, el, { value: 'ارتباط عائلي طارئ' });
  click({ a: 'doaskwd', id: TID });
  sandbox.document.getElementById = () => el;
  const w = run('myWithdraw(taskById("' + TID + '"),"' + mid + '")');
  if (!w || w.state !== 'pending') throw new Error('لم يُسجَّل الطلب');
  if (!run('S.notifs.some(n=>n.to==="L1"&&n.title.indexOf("انسحاب")>=0)')) throw new Error('لم يصل الليدر');

  /* المحسن لا يعتمد انسحابه بنفسه */
  click({ a: 'wdok', id: TID, u: mid });
  if (run('myWithdraw(taskById("' + TID + '"),"' + mid + '").state') !== 'pending')
    throw new Error('اعتمد انسحابه بنفسه');

  run('S.session={id:"L1",at:Date.now()}');
  click({ a: 'wdok', id: TID, u: mid });
  const w2 = run('taskById("' + TID + '").assigned.find(a=>a.muhsenId==="' + mid + '").wd');
  if (w2.state !== 'accepted') throw new Error('لم يُعتمد');
  if (!run('taskById("' + TID + '").assigned.find(a=>a.muhsenId==="' + mid + '").removed'))
    throw new Error('لم يخرج من المهمة');
  sandbox.WD_ = mid;
});
step('رفض الانسحاب يُبقي المحسن', () => {
  const mid = run('acceptedSlots(taskById("' + TID + '")).find(a=>!isReserve(a.muhsenId)).muhsenId');
  run('requestWithdraw(taskById("' + TID + '"),"' + mid + '","سبب آخر")');
  sandbox.document.getElementById = () => Object.assign({}, el, { value: 'الحاجة قائمة إليك' });
  click({ a: 'dowdno', id: TID, u: mid });
  sandbox.document.getElementById = () => el;
  const a2 = run('taskById("' + TID + '").assigned.find(a=>a.muhsenId==="' + mid + '")');
  if (a2.wd.state !== 'rejected') throw new Error('لم يُرفض');
  if (a2.removed) throw new Error('خرج رغم الرفض');
});
console.log('\nالتحضير والبدء الآلي');
step('التحضير من بداية اليوم', () => {
  if (run('prepOpen(taskById("' + TID + '"))') !== run('dayStart(taskById("' + TID + '").start)'))
    throw new Error('النافذة غير مطابقة');
});
step('البدء اليدوي ممنوع قبل ساعتين', () => {
  const far = run('S.tasks.find(t=>t.leaderId==="L1"&&t.start-now()>3*HR)');
  if (far && run('canStart(taskById("' + far.id + '"),"L1")')) throw new Error('سُمح بالبدء مبكرًا');
});
step('النظام يبدأ المهمة عند حلول وقتها', () => {
  run('(function(){var t=taskById("' + TID + '"); t.start=now()-MIN; t.end=t.start+t.durH*HR; t._f={};})()');
  run('autoTick()');
  const t = run('taskById("' + TID + '")');
  if (t.status !== 'running' || !t.autoStarted) throw new Error('الحالة ' + t.status);
  if (!t.notes.some(n => n.text.includes('النظام'))) throw new Error('بلا ملاحظة تلقائية');
});
step('التسكين مقفل بعد البدء', () => {
  if (!run('lockedForAssign(taskById("' + TID + '"))')) throw new Error('ما زال مفتوحًا');
  const before = run('taskById("' + TID + '").assigned.length');
  click({ a: 'send', id: TID, u: 'M1004' });
  if (run('taskById("' + TID + '").assigned.length') !== before) throw new Error('نجح رغم القفل');
});
step('إنجاز فرعية ثم الإغلاق والتقييم', () => {
  const s = run('taskById("' + TID + '").subs[0]');
  click({ a: 'sub', id: TID, s: s.id });
  if (!run('taskById("' + TID + '").subs[0].done')) throw new Error('لم تُنجز');
  click({ a: 'doend', id: TID });
  const t = run('taskById("' + TID + '")');
  if (t.status !== 'done') throw new Error('الحالة ' + t.status);
  if (!t.rating) throw new Error('بلا تقييم');
  if (t.rating.breakdown.start !== 0) throw new Error('البدء الآلي لم يُخصم');
});
step('ما بدأها النظام «غير منجزة» للّيدر', () => {
  const b = run('taskBucket(taskById("' + TID + '"),"L1")');
  if (b !== 'undone') throw new Error(b);
});

console.log('\nالتقييم');
step('تقييم ثلاثي ضمن ١–٥', () => {
  const t = run('S.tasks.find(t=>t.status==="done"&&t.rating)');
  ['system','supervisor','pilgrims'].forEach(k => {
    if (!(t.rating[k] >= 1 && t.rating[k] <= 5)) throw new Error(k + '=' + t.rating[k]);
  });
});
step('المتوسط التراكمي للشخص', () => {
  const r = run('personRating("M1001")');
  if (!r.n || r.avg < 1 || r.avg > 5) throw new Error('n=' + r.n + ' avg=' + r.avg);
});
step('ملاحظات مسجّلة على المحسن', () => {
  if (!run('personNotes("M1001").length + personNotes("M1002").length + personNotes("M1003").length'))
    throw new Error('لا ملاحظات');
});
step('إعادة تقييم الكل', () => { click({ a: 'rateall' }); });

console.log('\nالتذاكر الموحّدة');
step('المحسن لا يستقبل تذاكر الحجاج', () => {
  run('S.session={id:"M1001"}');
  const n = run('myTickets().filter(k=>k.src==="حاج"&&k.assignedTo!=="M1001").length');
  if (n) throw new Error(n + ' تذكرة ظهرت له');
});
step('تذكرة المحسن تصل الليدر', () => {
  const before = run('S.tickets.length');
  run('addTicket("M1001","ملاحظة اختبار","نص","ملاحظة تشغيلية","عادية",null,null)');
  if (run('S.tickets.length') !== before + 1) throw new Error('لم تُضف');
  if (run('S.tickets[0].leaderId') !== 'L1') throw new Error('لم تصل الليدر');
});
step('الليدر يسند ويغلق', () => {
  run('S.session={id:"L1"}');
  const k = run('S.tickets.find(k=>k.leaderId==="L1")');
  click({ a: 'doassign', id: k.id, u: 'M1001' });
  click({ a: 'kclose', id: k.id });
  const x = run('S.tickets.find(k=>k.id==="' + k.id + '")');
  if (x.status !== 'مغلقة' || !x.assignedTo) throw new Error(x.status);
});

console.log('\nالتفويض والتقويم والتحكم');
step('التفويض ممنوع في البعثات', () => {
  const t = run('S.tasks.find(t=>t.leaderId==="L1"&&t.start>now())');
  click({ a: 'dsend', id: t.id, u: 'M1001' });
  if (run('taskById("' + t.id + '").delegate')) throw new Error('نجح في بعثة');
});
step('التفويض متاح في الشركات', () => {
  run('S.session={id:"L2"}');
  const t = run('S.tasks.find(t=>t.leaderId==="L2"&&t.start>now())');
  click({ a: 'dsend', id: t.id, u: 'M2001' });
  if (!run('taskById("' + t.id + '").delegate')) throw new Error('لم يُرسل');
  run('S.session={id:"M2001"}'); click({ a: 'rdeleg', id: t.id, v: '1' });
  if (!run('actsAsLeader(taskById("' + t.id + '"),"M2001")')) throw new Error('لم يكتسب الصلاحية');
});
step('تذكير بتاريخ مختار', () => {
  run('S.session={id:"L1"}');
  const iso = run('isoDate(now()+2*DAY)');
  const vals = { qd: iso, qtime: '07:30', qtxt: 'تذكير اختبار' };
  sandbox.document.getElementById = idv => (vals[idv] !== undefined ? Object.assign({}, el, { value: vals[idv] }) : el);
  click({ a: 'dorem' });
  sandbox.document.getElementById = () => el;
  const r = run('S.reminders[S.reminders.length-1]');
  if (!r || isNaN(r.at)) throw new Error('لم يُحفظ');
  if (run('dayStart(' + r.at + ')') !== run('dayStart(now()+2*DAY)')) throw new Error('التاريخ خاطئ');
});
step('تقديم الوقت', () => {
  const b = run('S.clockOffset'); click({ a: 'clock', v: '60' });
  if (run('S.clockOffset') !== b + 60) throw new Error('لم يتقدّم');
});
step('إعادة الضبط', () => {
  click({ a: 'doreset' });
  if (run('S.requests.length')) throw new Error('بقيت طلبات');
  if (run('S.clockOffset')) throw new Error('بقيت إزاحة الوقت');
});

console.log('\nالصور والتوثيق');
click({ a: 'login', id: 'L1' });
step('صور مبذورة على المهام المنتهية', () => {
  const n = run('S.photos.length');
  if (n < 10) throw new Error('فقط ' + n);
  if (run('S.photos.some(p=>!p.title||!p.desc)')) throw new Error('صورة بلا عنوان أو وصف');
});
step('كل صورة مرتبطة بمهمة فعلية', () => {
  if (run('S.photos.some(p=>p.taskId && !taskById(p.taskId))')) throw new Error('صورة يتيمة');
});
step('صور تُثبت مهامّ فرعية', () => {
  if (!run('S.photos.some(p=>p.subId)')) throw new Error('لا يوجد إثبات فرعي');
});
step('التصوير من صلاحية الليدر فقط', () => {
  if (!run('canShoot()')) throw new Error('الليدر لا يستطيع');
  const m = run('S.users.find(u=>u.role==="muhsen"&&u.leaderId==="L1").id');
  run('S.session={id:"' + m + '",at:Date.now()}');
  if (run('canShoot()')) throw new Error('المحسن يستطيع التصوير');
  if (run('photoStrip({taskId:S.tasks[0].id,subId:null,ticketId:null},"x").indexOf("shoot")') >= 0)
    throw new Error('زر التصوير ظاهر للمحسن');
  run('S.session={id:"L1",at:Date.now()}');
});
step('المحسن يرى صور المهام', () => {
  const m = run('S.users.find(u=>u.role==="muhsen"&&u.leaderId==="L1").id');
  run('S.session={id:"' + m + '",at:Date.now()}');
  run('S.route={n:"album"}');
  const html = run('screenAlbum()');
  if (!html || html.indexOf('ألبوم الصور') < 0) throw new Error('الألبوم لا يفتح');
  run('S.session={id:"L1",at:Date.now()}');
});
step('رفض عنوان لا يصف حدثًا', () => {
  run('S.route={n:"task",id:myTasks()[0].id}');
  run('S.pendingPhoto="data:image/jpeg;base64,AAA"');
  run('S.camCtx={taskId:myTasks()[0].id,subId:null,ticketId:null}');
  const vals = { ftitle: '١٢٣', fdesc: 'وصف كافٍ للحدث الموثق' };
  sandbox.document.getElementById = idv => (vals[idv] !== undefined ? Object.assign({}, el, { value: vals[idv] }) : el);
  const before = run('S.photos.length');
  click({ a: 'savephoto' });
  sandbox.document.getElementById = () => el;
  if (run('S.photos.length') !== before) throw new Error('قُبل عنوان رقمي');
});
step('قبول عنوان ووصف لائقين', () => {
  const vals = { ftitle: 'استلام مفاتيح الغرف', fdesc: 'استلام المفاتيح من الاستقبال قبل وصول الحجاج' };
  sandbox.document.getElementById = idv => (vals[idv] !== undefined ? Object.assign({}, el, { value: vals[idv] }) : el);
  const before = run('S.photos.length');
  click({ a: 'savephoto' });
  sandbox.document.getElementById = () => el;
  if (run('S.photos.length') !== before + 1) throw new Error('لم تُحفظ');
  if (run('S.pendingPhoto')) throw new Error('لم يُفرَّغ المؤقت');
});
step('الصورة تبقى بعد انتهاء المهمة', () => {
  const tid = run('S.tasks.find(t=>t.status==="done"&&taskPhotos(t.id).length).id');
  if (!run('taskPhotos("' + tid + '").length')) throw new Error('اختفت');
});

console.log('\nالمرفقات مع الرفض');
step('رفض التسكين بلا سبب مرفوض', () => {
  /* نستعمل محسنًا احتياطيًّا غير مسكَّن — لأن الفريق مسكَّن تلقائيًّا */
  sandbox.T_ = run('S.tasks.filter(x=>x.leaderId==="L1"&&x.start>now())[0].id');
  sandbox.M_ = run('reserveTeam().find(function(r){return !taskById("'+sandbox.T_+'").assigned.some(function(a){return a.muhsenId===r.id})}).id');
  run('sendRequest(taskById("' + sandbox.T_ + '"),"' + sandbox.M_ + '")');
  run('S.session={id:"' + sandbox.M_ + '",at:Date.now()}');
  sandbox.document.getElementById = () => Object.assign({}, el, { value: '' });
  click({ a: 'doresp', id: sandbox.T_ });
  sandbox.document.getElementById = () => el;
  const req = run('slotOf(taskById("' + sandbox.T_ + '"),"' + sandbox.M_ + '").req');
  if (req === 'rejected') throw new Error('قُبل رفض بلا سبب');
});
step('رفض مع سبب ومرفق يُحفظ ويُعرض', () => {
  run('S.pendingExcuse="data:image/jpeg;base64,BBB"');
  sandbox.document.getElementById = () => Object.assign({}, el, { value: 'مرتبط بمهمة أخرى' });
  click({ a: 'doresp', id: sandbox.T_ });
  sandbox.document.getElementById = () => el;
  const a = run('taskById("' + sandbox.T_ + '").assigned.find(x=>x.muhsenId==="' + sandbox.M_ + '")');
  if (a.req !== 'rejected') throw new Error('لم يُرفض');
  if (!a.respPhoto) throw new Error('لم يُحفظ المرفق');
  if (!run('photoById("' + a.respPhoto + '").excuse')) throw new Error('لم يُعلَّم كعذر');
  if (run('excuseChip("' + a.respPhoto + '").indexOf("مرفق العذر")') < 0) throw new Error('لا يظهر في البطاقة');
  if (run('S.pendingExcuse')) throw new Error('لم يُفرَّغ المرفق المؤقت');
  run('S.session={id:"L1",at:Date.now()}');
});
step('مرفق العذر لا يظهر في توثيق المهمة', () => {
  const tid = run('S.photos.find(p=>p.excuse).taskId');
  if (run('taskPhotoSection(taskById("' + tid + '"), true).indexOf("مرفق عذر")') >= 0)
    throw new Error('ظهر العذر مع صور التوثيق');
});

console.log('\nعقود مهام الاستقبال');
step('مهمة استقبال منتهية جاهزة للمراجعة', () => {
  const t = run('!!S.tasks.find(x=>x.kind==="airport"&&x.status==="done"&&x.leaderId==="L1")');
  if (!t) throw new Error('غير موجودة');
});
step('العقدان على مهام الاستقبال فقط', () => {
  if (!run('hasDocs(S.tasks.find(t=>t.kind==="airport"))')) throw new Error('الاستقبال بلا عقود');
  if (!run('hasDocs(S.tasks.find(t=>t.kind==="checkin"))')) throw new Error('التسكين بلا عقود');
  if (run('hasDocs(S.tasks.find(t=>t.kind==="arafah"))')) throw new Error('عرفة عليها عقود');
});
step('عقد النقل يُصاغ كاملًا', () => {
  run('S.route={n:"doc",id:S.tasks.find(t=>t.kind==="airport").id+"~naql"}');
  const html = run('screenDoc()');
  ['الطرف الأول', 'خط السير', 'الجزاءات', 'سريان العقد', 'صفحة'].forEach(k => {
    if (html.indexOf(k) < 0) throw new Error('ينقصه: ' + k);
  });
});
step('عقد السكن يُصاغ كاملًا', () => {
  run('S.route={n:"doc",id:S.tasks.find(t=>t.kind==="airport").id+"~sakan"}');
  const html = run('screenDoc()');
  ['رخصة الإيواء', 'الخدمات المشمولة', 'الجزاءات'].forEach(k => {
    if (html.indexOf(k) < 0) throw new Error('ينقصه: ' + k);
  });
});
step('زر العين يفتح العارض', () => {
  const html = run('docButtons(S.tasks.find(t=>t.kind==="airport"))');
  if (html.indexOf('i-eye') < 0) throw new Error('لا يوجد زر عين');
  if (html.indexOf('data-n="doc"') < 0) throw new Error('لا يوجّه للعارض');
});


console.log('\nالمصطلحات');
step('الكنترول لا الكونترول', () => {
  if (run('JSON.stringify(S).indexOf("كونترول")') >= 0) throw new Error('ما زالت «كونترول»');
});
step('لا كلمة «قائد» في الواجهة', () => {
  const src = FILES.map(read).join('\n');
  if (/[^ل]قائد/.test(src.replace(/القائد/g, ''))) throw new Error('ما زالت «قائد»');
});

console.log('\nنطاق التحضير');
click({ a: 'login', id: 'L1' });
step('لا حضور من خارج نطاق ٢ كم', () => {
  const t = run('S.tasks.find(x=>x.leaderId==="L1"&&dayStart(x.start)===dayStart(now()))') ||
            run('S.tasks.filter(x=>x.leaderId==="L1"&&x.start>now())[0]');
  const tid = run('(S.tasks.find(x=>x.leaderId==="L1"&&x.start>now())||{}).id');
  run('S.myPlace="away"');
  /* نثبّت ساعة التطبيق على منتصف النهار حتى لا يتعلّق الاختبار بوقت التشغيل */
  run('S.clockOffset = 12*60 - (new Date().getHours()*60 + new Date().getMinutes())');
  run('var _T=taskById("' + tid + '"); _T.start = now()+30*MIN; _T.end=_T.start+3*HR; 1');
  if (run('canAttend(taskById("' + tid + '"))')) throw new Error('سُمح بالتحضير من خارج النطاق');
  click({ a: 'attend', id: tid });
  if (run('taskById("' + tid + '").leaderAttendedAt')) throw new Error('سُجِّل حضور من خارج النطاق');
  if (run('attendBlockReason(taskById("' + tid + '")).indexOf("خارج النطاق")') < 0) throw new Error('لا يبيّن السبب');
  sandbox.TT_ = tid;
});
step('الحضور يُقبل داخل النطاق', () => {
  run('S.myPlace="site"');
  click({ a: 'attend', id: sandbox.TT_ });
  if (!run('taskById("' + sandbox.TT_ + '").leaderAttendedAt')) throw new Error('لم يُسجَّل');
  if (run('taskById("' + sandbox.TT_ + '").leaderFarKm') > run('RADIUS_KM')) throw new Error('سُجِّل بمسافة خارج النطاق');
});
step('لا حضور مسجَّل من خارج النطاق في كل البيانات', () => {
  if (run('S.tasks.some(t=>t.assigned.some(a=>a.attendedAt && a.farKm>RADIUS_KM))'))
    throw new Error('يوجد حضور خارج النطاق');
});

console.log('\nالتقييم — بلا تفصيل المصادر');
step('التقييم التراكمي رقم واحد', () => {
  const html = run('S.route={n:"rating"}; S.tab.rt="mine"; screenRating()').split('<nav class="tabs"')[0];
  ['>النظام<', '>المشرف<', '>الحجاج</div>', 'تقييم النظام', 'مشرف السكن'].forEach(k => {
    if (html.indexOf(k) >= 0) throw new Error('ما زال يُظهر: ' + k);
  });
  if (html.indexOf('تقييمك التراكمي') < 0) throw new Error('لا يوجد تراكمي');
});
step('تقييم المهمة رقم واحد', () => {
  const tid = run('S.tasks.find(t=>t.rating&&t.leaderId==="L1").id');
  const html = run('S.route={n:"taskrating",id:"' + tid + '"}; screenTaskRating()').split('<nav class="tabs"')[0];
  ['تقييم النظام', 'مشرف السكن', 'تقييم الحجاج', 'وزنه'].forEach(k => {
    if (html.indexOf(k) >= 0) throw new Error('ما زال يُظهر: ' + k);
  });
  if (html.indexOf('تقييم هذه المهمة') < 0) throw new Error('لا يوجد متوسط المهمة');
});
step('بروفايل المحسن بلا تفصيل', () => {
  const m = run('teamOf("L1")[0].id');
  const html = run('S.route={n:"profile",id:"' + m + '"}; screenProfile()').split('<nav class="tabs"')[0];
  if (html.indexOf('>المشرف<') >= 0 || html.indexOf('>النظام<') >= 0) throw new Error('ما زال يفصّل');
});

console.log('\nتصنيف المهام بالدروب داون');
step('كل مهمة لها تصنيف واحد صالح', () => {
  const ok = run('myTasks().every(t=>TBUCKETS.some(b=>b.k===taskBucket(t,S.session.id)))');
  if (!ok) throw new Error('تصنيف غير معروف');
});
step('لا أزرار تصنيف ثابتة في الشاشة', () => {
  const html = run('S.route={n:"tasks"}; S.tab.tasks="all"; screenTasks()').split('<nav class="tabs"')[0];
  if (html.indexOf('data-a="bucketmenu"') < 0) throw new Error('لا يوجد دروب داون');
  if ((html.match(/data-k="tasks"/g) || []).length > 2) throw new Error('ما زالت التصنيفات أزرارًا');
});
step('القائمة تعرض كل التصنيفات بعدّادها', () => {
  const sh = run('bucketSheet()');
  run('TBUCKETS').forEach(b => { if (sh.indexOf(b.l) < 0) throw new Error('ينقص: ' + b.l); });
});
step('غير المنجزة للمُدان وحده', () => {
  const bad = run('myTasks().filter(t=>taskBucket(t,S.session.id)==="undone").some(t=>!isBlamed(t,S.session.id)&&t.status!=="cancelled")');
  if (bad) throw new Error('صُنّفت مهمة بلا إدانة');
});
step('المحسن يرى مهامه فقط', () => {
  const m = run('teamOf("L1")[0].id');
  run('S.session={id:"' + m + '",at:Date.now()}');
  const bad = run('myTasks().some(t=>!t.assigned.some(a=>a.muhsenId==="' + m + '")&&!isDelegate(t,"' + m + '"))');
  if (bad) throw new Error('يرى مهامّ ليست له');
  run('S.session={id:"L1",at:Date.now()}');
});
step('لكل نوع مهمة أيقونة ولون', () => {
  const miss = run('Object.keys(CAT).filter(k=>!KIND_UI[k])');
  if (miss.length) throw new Error('ينقص: ' + miss.join(', '));
});

console.log('\nالعقود داخل المهمة وللّيدر');
step('لا عقود في بطاقة القائمة', () => {
  const t = run('S.tasks.find(x=>x.kind==="airport"&&x.leaderId==="L1")');
  if (run('taskRow(S.tasks.find(x=>x.kind==="airport"&&x.leaderId==="L1")).indexOf("عقد النقل")') >= 0)
    throw new Error('ما زالت تظهر خارج المهمة');
});
step('العقود داخل المهمة للّيدر', () => {
  run('S.route={n:"task",id:S.tasks.find(x=>x.kind==="airport"&&x.leaderId==="L1").id}');
  if (run('screenTask().indexOf("عقد السكن")') < 0) throw new Error('غائبة عن الليدر');
});
step('العقود محجوبة عن المحسن', () => {
  const tid = run('S.tasks.find(x=>x.kind==="airport"&&x.leaderId==="L1"&&x.assigned.length).id');
  const m = run('(acceptedSlots(taskById("' + tid + '"))[0]||{}).muhsenId');
  if (!m) throw new Error('لا يوجد محسن مسكَّن للاختبار');
  run('S.session={id:"' + m + '",at:Date.now()}');
  run('S.route={n:"task",id:"' + tid + '"}');
  if (run('screenTask().indexOf("عقد النقل")') >= 0) throw new Error('المحسن يرى العقود');
  run('S.session={id:"L1",at:Date.now()}');
});

console.log('\nدليل المهام');
step('دليل مبذور لكل نوع', () => {
  const miss = run('Object.keys(CAT).filter(k=>!guideSteps(k).length)');
  if (miss.length) throw new Error('بلا دليل: ' + miss.join(', '));
});
step('شاشة الدليل تفتح لكل نوع', () => {
  run('Object.keys(CAT)').forEach(k => {
    run('S.route={n:"guide",id:"' + '' + k + '"}');
    const h = run('screenGuide()');
    if (!h || h.indexOf('خطوات التنفيذ') < 0) throw new Error('لا تفتح: ' + k);
  });
});
step('زر الدليل داخل المهمة وخارجها', () => {
  const t = run('myTasks()[0]');
  if (run('guideChip(myTasks()[0]).indexOf("data-n=\\"guide\\"")') < 0) throw new Error('لا زر في البطاقة');
  run('S.route={n:"task",id:myTasks()[0].id}');
  if (run('screenTask().indexOf("دليل تنفيذ المهمة")') < 0) throw new Error('لا زر داخل المهمة');
});
step('التحرير من صلاحية الليدر', () => {
  if (!run('canEditGuide()')) throw new Error('الليدر لا يحرّر');
  const m = run('teamOf("L1")[0].id');
  run('S.session={id:"' + m + '",at:Date.now()}');
  if (run('canEditGuide()')) throw new Error('المحسن يحرّر');
  run('S.route={n:"guide",id:"airport"}');
  if (run('screenGuide().indexOf("data-a=\\"addstep\\"")') >= 0) throw new Error('أزرار التحرير ظاهرة للمحسن');
  run('S.session={id:"L1",at:Date.now()}');
});
step('إضافة خطوة نصية وترتيبها وحذفها', () => {
  const before = run('guideSteps("airport").length');
  const vals = { gt: 'خطوة اختبار', gb: 'نص تعليمة كافٍ للاختبار الآلي' };
  sandbox.document.getElementById = idv => (vals[idv] !== undefined ? Object.assign({}, el, { value: vals[idv] }) : el);
  click({ a: 'savestep', k: 'airport', v: 'text' });
  sandbox.document.getElementById = () => el;
  if (run('guideSteps("airport").length') !== before + 1) throw new Error('لم تُضف');
  const sid = run('guideSteps("airport")[guideSteps("airport").length-1].id');
  click({ a: 'stepup', k: 'airport', id: sid });
  if (run('guideSteps("airport")[guideSteps("airport").length-1].id') === sid) throw new Error('لم تتحرك');
  click({ a: 'stepdel', k: 'airport', id: sid });
  if (run('guideSteps("airport").length') !== before) throw new Error('لم تُحذف');
});
step('رفض خطوة بلا عنوان أو بنص قصير', () => {
  const before = run('guideSteps("umrah").length');
  const vals = { gt: 'x', gb: 'نص كافٍ جدًّا للاختبار' };
  sandbox.document.getElementById = idv => (vals[idv] !== undefined ? Object.assign({}, el, { value: vals[idv] }) : el);
  click({ a: 'savestep', k: 'umrah', v: 'text' });
  const vals2 = { gt: 'عنوان صالح', gb: 'قصير' };
  sandbox.document.getElementById = idv => (vals2[idv] !== undefined ? Object.assign({}, el, { value: vals2[idv] }) : el);
  click({ a: 'savestep', k: 'umrah', v: 'text' });
  sandbox.document.getElementById = () => el;
  if (run('guideSteps("umrah").length') !== before) throw new Error('قُبلت خطوة ناقصة');
});

console.log('\nالشريط السفلي');
step('زر الرئيسية واحد وثابت في المنتصف', () => {
  const h = run('tabs()');
  if ((h.match(/class="home/g) || []).length !== 1) throw new Error('عدد أزرار الرئيسية خاطئ');
  const before = h.split('class="home')[0], after = h.split('class="home')[1];
  if (before.indexOf('class="tside"') < 0) throw new Error('لا يوجد جانب قبل الرئيسية');
  if (after.indexOf('class="tside"') < 0) throw new Error('لا يوجد جانب بعدها');
});
step('كل الوجهات في الشريط، ثلاث لكل جانب', () => {
  const it = run('tabItems()');
  if (it.length < 10) throw new Error('عدد قليل: ' + it.length);
  if (run('TABS_SIDE') !== 3) throw new Error('عدد الجانب');
  const h = run('tabs()');
  const rails = h.split('class="trail"').length - 1;
  if (rails !== 2) throw new Error('الشرائط ' + rails);
  const pages = run('tabPageCount()');
  const pgs = h.split('class="tpage"').length - 1;
  if (pgs !== pages * 2) throw new Error('الصفحات ' + pgs + ' من ' + pages);
});
step('نقاط الصفحات قابلة للنقر', () => {
  const h = run('tabs()');
  const dots = (h.match(/data-a="tabpage"/g) || []).length;
  if (dots !== run('tabPageCount()')) throw new Error('النقاط ' + dots);
});
step('كل وجهة في الشريط لها شاشة', () => {
  const bad = run('tabItems().filter(function(x){return !SCREENS[x.k]}).map(function(x){return x.k})');
  if (bad.length) throw new Error('بلا شاشة: ' + bad.join(', '));
});
step('الصفحة تتبع الشاشة المفتوحة', () => {
  if (run('tabPageOf("calendar")') === null) throw new Error('التقويم بلا صفحة');
  if (run('tabPageOf("daily")') === null) throw new Error('التحضير بلا صفحة');
  if (run('tabPageOf("more")') === null) throw new Error('المزيد بلا صفحة');
});
step('كل شاشة يصلها المستخدم', () => {
  const covered = run('tabItems().reduce(function(a,x){return a.concat(x.on)},[])');
  const inMore = run('screenMore()');
  const skip = ['login','home','mhome'];
  const miss = run('Object.keys(SCREENS)').filter(k =>
    skip.indexOf(k) < 0 && covered.indexOf(k) < 0 && inMore.indexOf('data-n="' + k + '"') < 0);
  if (miss.length) throw new Error('غير مغطّاة: ' + miss.join(', '));
});

console.log('\nقائمة تصنيف المهام');
step('الاختيار يغلق القائمة ولا يعيد فتحها', () => {
  run('S.route={n:"tasks"}; S.tab.tasks="all"');
  click({ a: 'bucketmenu' });
  if (!run('S.sheet')) throw new Error('لم تُفتح');
  click({ a: 'pickbucket', v: 'done' });
  if (run('S.sheet')) throw new Error('بقيت مفتوحة');
  if (run('S.tab.tasks') !== 'done') throw new Error('لم يتغيّر التصنيف');
});
step('العدّاد يطابق المعروض فعلًا', () => {
  run('TBUCKETS').forEach(bk => {
    run('S.tab.tasks="' + bk.k + '"');
    const shown = (run('screenTasks()').split('<nav class="tabs"')[0].match(/class="c task /g) || []).length;
    const n = bk.k === 'all' ? run('myTasks().length')
      : run('myTasks().filter(function(t){return taskBucket(t,S.session.id)==="' + bk.k + '"}).length');
    if (shown !== n) throw new Error(bk.l + ': ظهر ' + shown + ' والعدّاد ' + n);
  });
  run('S.tab.tasks="all"');
});
step('لا يبقى زر تصنيف قديم', () => {
  const h = run('screenTasks()').split('<nav class="tabs"')[0];
  if (h.indexOf('data-k="tasks"') >= 0) throw new Error('ما زال هناك زر تصنيف');
});

console.log('\nسؤال الإشعارات عند أول فتح');
step('يُعرض مرة واحدة فقط', () => {
  run('S.pushAsked=false; S.sheet=null');
  const first = run('maybeAskPush()');
  const second = run('maybeAskPush()');
  if (second) throw new Error('تكرّر السؤال');
  if (!run('S.pushAsked')) throw new Error('لم يُسجَّل');
});
step('ورقة السؤال فيها الخياران', () => {
  const sh = run('pushAskSheet()');
  if (sh.indexOf('data-a="pushask"') < 0) throw new Error('بلا زر تفعيل');
  if (sh.indexOf('data-a="pushlater"') < 0) throw new Error('بلا زر لاحقًا');
});
step('«لاحقًا» يغلق ولا يمنع التفعيل من التحكم', () => {
  run('S.sheet=pushAskSheet()');
  click({ a: 'pushlater' });
  if (run('S.sheet')) throw new Error('لم تُغلق');
  const box = run('pushBox()');
  if (box.indexOf('الإشعارات الخارجية') < 0) throw new Error('اختفى الصندوق من التحكم');
  if (box.indexOf('إرسال إشعار لفئة') < 0) throw new Error('اختفى صندوق البثّ');
});

console.log('\nترتيب الإشعارات');
step('لكل إشعار تصنيف ولون ووسم', () => {
  const bad = run('myNotifs().filter(function(n){var k=nkind(n);return !k||!k.c||!k.t}).length');
  if (bad) throw new Error(bad + ' بلا تصنيف');
});
step('التحذيرات تُصنَّف «يحتاج إجراءً»', () => {
  run('notify(S.session.id,"i-warn","تأخرت عن إثبات الحضور","نص")');
  const n = run('myNotifs().find(function(x){return x.title.indexOf("تأخرت")>=0})');
  if (run('nkind(myNotifs().find(function(x){return x.title.indexOf("تأخرت")>=0})).k') !== 'bad')
    throw new Error('صُنّف خطأ');
});
step('القائمة مجمّعة بالأيام', () => {
  run('S.route={n:"notifs"}; S.tab.nf="all"');
  const h = run('screenNotifs()').split('<nav class="tabs"')[0];
  if (h.indexOf('class="nday"') < 0) throw new Error('بلا فواصل أيام');
  if (h.indexOf('اليوم') < 0) throw new Error('بلا عنوان يوم');
});
step('التصفية بغير المقروء وبما يحتاج إجراءً', () => {
  run('S.tab.nf="unread"');
  const u1 = (run('screenNotifs()').match(/class="nrow /g) || []).length;
  run('S.tab.nf="all"');
  const a1 = (run('screenNotifs()').match(/class="nrow /g) || []).length;
  if (u1 > a1) throw new Error('غير المقروء أكثر من الكل');
  run('S.tab.nf="act"');
  if (!run('screenNotifs()')) throw new Error('تصفية الإجراء فارغة');
  run('S.tab.nf="all"');
});

console.log('\nالتفويض: متابعة بلا قرارات');
run('S.session={id:"L1",at:Date.now()}');
step('الليدر المفوِّض يتابع ولا يقرّر', () => {
  const tid = run('S.tasks.filter(t=>t.leaderId==="L1"&&t.start>now()&&t.status!=="done")[0].id');
  const m = run('teamOf("L1")[1].id');
  run('taskById("' + tid + '").orgId = S.orgs.find(o=>o.type==="شركة").id');
  run('sendDelegate(taskById("' + tid + '"),"' + m + '",true)');
  run('respondDelegate(taskById("' + tid + '"),true)');
  if (!run('actsAsLeader(taskById("' + tid + '"),"L1")')) throw new Error('فقد الرؤية');
  if (run('canDecide(taskById("' + tid + '"),"L1")')) throw new Error('ما زال يقرّر');
  if (!run('watching(taskById("' + tid + '"),"L1")')) throw new Error('لا يظهر كمتابع');
  if (!run('canDecide(taskById("' + tid + '"),"' + m + '")')) throw new Error('المفوَّض لا يقرّر');
  sandbox.DT_ = tid; sandbox.DM_ = m;
});
step('اسم الليدر الفعلي يظهر للمفوِّض', () => {
  run('S.route={n:"task",id:"' + sandbox.DT_ + '"}');
  const h = run('screenTask()');
  if (h.indexOf('الليدر على هذه المهمة') < 0) throw new Error('لا يظهر');
  if (h.indexOf(run('userById("' + sandbox.DM_ + '").name')) < 0) throw new Error('لا يظهر الاسم');
});
step('قرارات المفوِّض محجوبة فعليًّا', () => {
  const before = run('taskById("' + sandbox.DT_ + '").assigned.length');
  click({ a: 'send', id: sandbox.DT_, u: run('teamOf("L1")[3].id') });
  if (run('taskById("' + sandbox.DT_ + '").assigned.length') !== before) throw new Error('سكّن رغم الإسناد');
  const st = run('taskById("' + sandbox.DT_ + '").status');
  click({ a: 'start', id: sandbox.DT_ });
  if (run('taskById("' + sandbox.DT_ + '").status') !== st) throw new Error('بدأ رغم الإسناد');
});
step('العقود تبقى مرئية للمفوِّض والمفوَّض', () => {
  const tid = run('S.tasks.find(x=>x.kind==="airport"&&x.leaderId==="L1").id');
  run('S.route={n:"task",id:"' + tid + '"}');
  if (run('screenTask().indexOf("عقد النقل")') < 0) throw new Error('غائبة عن الليدر');
});

console.log('\nالتحضير اليومي');
run('S.session={id:"L1",at:Date.now()}');
step('لكل موظف شِفت وأربعة أسابيع حضور', () => {
  const noShift = run('S.users.filter(u=>!S.shifts[u.id]).length');
  if (noShift) throw new Error(noShift + ' بلا شِفت');
  const days = run('new Set(S.attend.map(a=>a.day)).size');
  if (days < 25) throw new Error('أيام قليلة: ' + days);
  const per = run('S.attend.filter(a=>a.userId==="L1").length');
  if (per < 24) throw new Error('سجل ناقص: ' + per);
});
step('الأسابيع الثلاثة الماضية مكتملة', () => {
  [1, 2, 3].forEach(w => {
    const st = run('weekStats("L1",' + w + ')');
    if (st.pct < 70) throw new Error('الأسبوع ' + w + ' = ' + st.pct + '٪');
  });
});
step('التحضير مرفوض خارج المقر', () => {
  run('S.attend = S.attend.filter(a=>!(a.userId==="L1"&&a.day===dayStart(now())))');
  run('S.myPlace="site"');
  if (run('canCheckIn("L1")')) throw new Error('قُبل من موقع مهمة');
  run('S.myPlace="away"');
  if (run('canCheckIn("L1")')) throw new Error('قُبل من خارج النطاق');
  if (run('checkInReason().indexOf("المقر")') < 0) throw new Error('لا يبيّن السبب');
  click({ a: 'checkin' });
  if (run('attendedToday("L1")')) throw new Error('سُجّل رغم المنع');
});
step('التحضير يُقبل داخل المقر مرة واحدة', () => {
  run('S.myPlace="hq"');
  if (!run('canCheckIn("L1")')) throw new Error('مُنع داخل المقر');
  click({ a: 'checkin' });
  if (!run('attendedToday("L1")')) throw new Error('لم يُسجَّل');
  const n = run('S.attend.filter(a=>a.userId==="L1"&&a.day===dayStart(now())).length');
  click({ a: 'checkin' });
  if (run('S.attend.filter(a=>a.userId==="L1"&&a.day===dayStart(now())).length') !== n)
    throw new Error('سُجّل مرتين');
});
step('شاشة التحضير تفتح للدورين', () => {
  ['me', 'team', 'swap'].forEach(sg => {
    run('S.tab.dl="' + sg + '"; S.route={n:"daily"}');
    if (!run('screenDaily()')) throw new Error('فارغة: ' + sg);
  });
  const m = run('teamOf("L1")[0].id');
  run('S.session={id:"' + m + '",at:Date.now()}; S.tab.dl="me"');
  if (!run('screenDaily()')) throw new Error('فارغة للمحسن');
  run('S.session={id:"L1",at:Date.now()}');
});

console.log('\nتبديل الشِفت');
step('طلب بلا سبب أو بشِفت مطابق مرفوض', () => {
  const m = run('teamOf("L1")[2].id');
  run('S.session={id:"' + m + '",at:Date.now()}');
  const before = run('S.swaps.length');
  run('S.swapTo=Object.keys(SHIFTS).find(k=>k!==shiftOf(S.session.id))');
  let vals = { swr: 'قصير', swd: run('isoDate(now()+DAY)') };
  sandbox.document.getElementById = i2 => (vals[i2] !== undefined ? Object.assign({}, el, { value: vals[i2] }) : el);
  click({ a: 'dosendswap' });
  vals = { swr: 'سبب كافٍ وواضح للتبديل', swd: '' };
  click({ a: 'dosendswap' });
  sandbox.document.getElementById = () => el;
  if (run('S.swaps.length') !== before) throw new Error('قُبل طلب ناقص');
});
step('الطلب يصل الليدر', () => {
  const m = run('S.session.id');
  const vals = { swr: 'ارتباط عائلي في ذلك اليوم', swd: run('isoDate(now()+2*DAY)') };
  sandbox.document.getElementById = i2 => (vals[i2] !== undefined ? Object.assign({}, el, { value: vals[i2] }) : el);
  click({ a: 'dosendswap' });
  sandbox.document.getElementById = () => el;
  const s = run('S.swaps.find(x=>x.from==="' + m + '")');
  if (!s) throw new Error('لم يُنشأ');
  if (s.state !== 'pending') throw new Error('الحالة ' + s.state);
  if (s.leaderId !== 'L1') throw new Error('لم يصل الليدر');
  if (!run('S.notifs.some(n=>n.to==="L1"&&n.title.indexOf("تبديل")>=0)')) throw new Error('بلا إشعار');
  sandbox.SW_ = s.id;
});
step('طلب ثانٍ معلّق مرفوض', () => {
  const before = run('S.swaps.length');
  const vals = { swr: 'سبب آخر مكتمل', swd: run('isoDate(now()+3*DAY)') };
  sandbox.document.getElementById = i2 => (vals[i2] !== undefined ? Object.assign({}, el, { value: vals[i2] }) : el);
  click({ a: 'dosendswap' });
  sandbox.document.getElementById = () => el;
  if (run('S.swaps.length') !== before) throw new Error('قُبل طلبان معًا');
  run('S.session={id:"L1",at:Date.now()}');
});
step('المحسن لا يبتّ في الطلبات', () => {
  const m = run('S.swaps.find(x=>x.id==="' + sandbox.SW_ + '").from');
  run('S.session={id:"' + m + '",at:Date.now()}');
  click({ a: 'swapok', id: sandbox.SW_ });
  if (run('S.swaps.find(x=>x.id==="' + sandbox.SW_ + '").state') !== 'pending') throw new Error('بتّ فيه');
  run('S.session={id:"L1",at:Date.now()}');
});
step('الليدر يرفع الطلب للكنترول', () => {
  sandbox.document.getElementById = () => Object.assign({}, el, { value: 'يتعارض مع جدول الفوج' });
  click({ a: 'doswapesc', id: sandbox.SW_ });
  sandbox.document.getElementById = () => el;
  const s = run('S.swaps.find(x=>x.id==="' + sandbox.SW_ + '")');
  if (s.state !== 'escalated') throw new Error('الحالة ' + s.state);
  if (s.log.length < 2) throw new Error('المسار ناقص');
  if (!run('S.notifs.some(n=>n.to==="' + s.from + '"&&n.title.indexOf("كنترول")>=0)')) throw new Error('لم يُبلَّغ');
});
step('الاعتماد يبدّل الشِفت فعليًّا', () => {
  const s2 = run('S.swaps.find(x=>x.state==="pending"&&x.leaderId==="L1")');
  if (!s2) throw new Error('لا يوجد طلب معلّق');
  const to = s2.toShift;
  click({ a: 'swapok', id: s2.id });
  if (run('shiftOf("' + s2.from + '")') !== to) throw new Error('لم يتبدّل الشِفت');
  if (run('S.swaps.find(x=>x.id==="' + s2.id + '").state') !== 'approved') throw new Error('لم تُعتمد');
});

console.log('\nالإشعارات الخارجية');
step('حالة الإذن تُقرأ بلا انهيار', () => {
  if (typeof run('pushState()') !== 'string') throw new Error('حالة غير معروفة');
  if (run('pushOn()') !== false) throw new Error('مفعّلة بلا إذن');
});
step('الفئات محسوبة صحيحًا', () => {
  if (run('audienceUsers("leaders").length') !== 3) throw new Error('الليدرز');
  if (run('audienceUsers("muhsens").length') !== 21) throw new Error('المحسنون ' + run('audienceUsers("muhsens").length'));
  if (run('audienceUsers("myteam").length') !== 5) throw new Error('فريقي');
  if (run('audienceUsers("all").length') !== 24) throw new Error('الجميع ' + run('audienceUsers("all").length'));
});
step('البثّ يصل كل الفئة', () => {
  run('S.bcAud="muhsens"');
  const vals = { bct: 'اجتماع الفريق', bcb: 'اجتماع في المقر الساعة الثامنة مساءً.' };
  sandbox.document.getElementById = i2 => (vals[i2] !== undefined ? Object.assign({}, el, { value: vals[i2] }) : el);
  click({ a: 'dobroadcast' });
  sandbox.document.getElementById = () => el;
  const got = run('S.users.filter(u=>u.role==="muhsen"&&S.notifs.some(n=>n.to===u.id&&n.title==="اجتماع الفريق")).length');
  if (got !== 21) throw new Error('وصل ' + got + ' فقط');
  if (!run('S.broadcasts.length')) throw new Error('بلا سجل');
});
step('بثّ بلا عنوان أو نص مرفوض', () => {
  const before = run('S.broadcasts.length');
  const vals = { bct: 'ااا', bcb: 'نص كافٍ للاختبار' };
  sandbox.document.getElementById = i2 => (vals[i2] !== undefined ? Object.assign({}, el, { value: vals[i2] }) : el);
  click({ a: 'dobroadcast' });
  const v2 = { bct: 'عنوان صالح', bcb: 'قصير' };
  sandbox.document.getElementById = i2 => (v2[i2] !== undefined ? Object.assign({}, el, { value: v2[i2] }) : el);
  click({ a: 'dobroadcast' });
  sandbox.document.getElementById = () => el;
  if (run('S.broadcasts.length') !== before) throw new Error('قُبل بثّ ناقص');
});

console.log('\nالإشعارات الداخلية');
step('النقر على إشعار ينقل لوجهته', () => {
  const n2 = run('S.notifs.filter(n=>n.to==="L1"&&n.route)[0]');
  if (!n2) throw new Error('لا يوجد إشعار موجَّه');
  run('S.route={n:"notifs"}');
  click({ a: 'opennotif', id: n2.id });
  if (run('S.route.n') === 'notifs') throw new Error('بقي في القائمة');
  if (!run('S.notifs.find(n=>n.id==="' + n2.id + '").read')) throw new Error('لم يُعلَّم مقروءًا');
});
step('إشعار بلا وجهة ينقل للرئيسية', () => {
  run('notify("L1","i-bell","بلا وجهة","نص",null)');
  const n3 = run('S.notifs.find(n=>n.title==="بلا وجهة")');
  run('S.route={n:"notifs"}');
  click({ a: 'opennotif', id: n3.id });
  if (run('S.route.n') !== 'home') throw new Error('الوجهة ' + run('S.route.n'));
});
step('إشعار لمهمة محذوفة لا يعلّق', () => {
  run('notify("L1","i-bell","مهمة ذاهبة","نص",{n:"task",id:"XX-none"})');
  const n4 = run('S.notifs.find(n=>n.title==="مهمة ذاهبة")');
  click({ a: 'opennotif', id: n4.id });
  if (run('S.route.id')) throw new Error('انتقل لمعرّف غير موجود');
});

console.log('\nتسليم الإشعارات المتراكمة');
run('S.session={id:"L1",at:Date.now()}');
step('«ما زال قائمًا» يستبعد ما انتهى', () => {
  const done = run('S.tasks.find(function(t){return t.status==="done"&&t.leaderId==="L1"})');
  run('notify("L1","i-bell","على مهمة منتهية","نص",{n:"task",id:"' + done.id + '"})');
  const n1 = run('S.notifs.find(function(x){return x.title==="على مهمة منتهية"})');
  if (run('stillRelevant(S.notifs.find(function(x){return x.title==="على مهمة منتهية"}))'))
    throw new Error('عُدّ قائمًا رغم انتهاء المهمة');
});
step('يستبعد المقروء ويشمل العام', () => {
  run('notify("L1","i-bell","إشعار عام","نص",null)');
  if (!run('stillRelevant(S.notifs.find(function(x){return x.title==="إشعار عام"}))'))
    throw new Error('العام استُبعد');
  run('S.notifs.find(function(x){return x.title==="إشعار عام"}).read=true');
  if (run('stillRelevant(S.notifs.find(function(x){return x.title==="إشعار عام"}))'))
    throw new Error('المقروء عُدّ قائمًا');
});
step('يستبعد التذكرة المغلقة ويشمل المفتوحة', () => {
  const k = run('S.tickets.find(function(x){return x.status!=="مغلقة"})');
  run('notify("L1","i-ticket","تذكرة مفتوحة","نص",{n:"ticket",id:"' + k.id + '"})');
  if (!run('stillRelevant(S.notifs.find(function(x){return x.title==="تذكرة مفتوحة"}))'))
    throw new Error('المفتوحة استُبعدت');
  run('S.tickets.find(function(x){return x.id==="' + k.id + '"}).status="مغلقة"');
  if (run('stillRelevant(S.notifs.find(function(x){return x.title==="تذكرة مفتوحة"}))'))
    throw new Error('المغلقة عُدّت قائمة');
});
step('لا يُسلَّم شيء بلا إذن', () => {
  if (run('deliverBacklog(true)') !== 0) throw new Error('سُلِّم بلا إذن');
});
step('الجديد يحمل معرّفه للجسر', () => {
  run('notify("L1","i-bell","وافق المحسن","قبل التسكين",{n:"tasks"})');
  const n = run('S.notifs[0]');
  if (!n.id || n.title !== 'وافق المحسن') throw new Error('لم يُنشأ بمعرّف');
});

const CATNAME = k => run('CAT.' + k + '.ar');
console.log('\nالشرح المتحرك وثبات اختيار الدليل');
run('S.session={id:"L1",at:Date.now()}');
step('لكل نشاط مقطع من خمسة مشاهد', () => {
  const miss = run('Object.keys(CAT).filter(function(k){return !CLIPS[k]})');
  if (miss.length) throw new Error('بلا مقطع: ' + miss.join(', '));
  const bad = run('Object.keys(CLIPS).filter(function(k){return CLIPS[k].length!==CLIP_SCENES})');
  if (bad.length) throw new Error('عدد مشاهد خاطئ: ' + bad.join(', '));
});
step('كل مشهد له أيقونة وعنوان ونص', () => {
  const bad = run('Object.keys(CLIPS).filter(function(k){return CLIPS[k].some(function(s){return !s[0]||!s[1]||!s[2]})})');
  if (bad.length) throw new Error('مشهد ناقص: ' + bad.join(', '));
});
step('المقطع يظهر في كل صفحة دليل', () => {
  run('Object.keys(CAT)').forEach(k => {
    run('S.route={n:"guide",id:"' + k + '"}');
    const h = run('screenGuide()');
    if (h.indexOf('class="clip') < 0) throw new Error('بلا مقطع: ' + k);
    if (h.indexOf('data-a="clipplay"') < 0) throw new Error('بلا زر تشغيل: ' + k);
  });
});
step('اختيار النشاط يثبت بعد التبديل', () => {
  click({ a: 'go', n: 'guide', id: 'mina' });
  if (run('S.route.id') !== 'mina') throw new Error('المسار ' + run('S.route.id'));
  run('screenGuide()');
  if (run('S.tab.gk') !== 'mina') throw new Error('لم يُحفظ: ' + run('S.tab.gk'));
  const h = run('screenGuide()');
  if (h.indexOf(CATNAME('mina')) < 0) throw new Error('لم يعرض النشاط المختار');
  /* العودة من الشريط بلا معرّف تُبقي آخر اختيار */
  click({ a: 'go', n: 'guide' });
  run('screenGuide()');
  if (run('S.tab.gk') !== 'mina') throw new Error('ضاع الاختيار عند العودة');
});
step('التشغيل والإيقاف يعملان', () => {
  run('S.clipPaused=false');
  click({ a: 'clipplay' });
  if (!run('S.clipPaused')) throw new Error('لم يتوقف');
  if (run('screenGuide()').indexOf('clip paused') < 0) throw new Error('بلا صنف الإيقاف');
  click({ a: 'clipplay' });
  if (run('S.clipPaused')) throw new Error('لم يُستأنف');
});

console.log('\nالتذاكر والتقارير — مدمجتان في تاب ومنفصلتان في المحتوى');
run('S.session={id:"L1",at:Date.now()}');
step('شاشة واحدة بتبويبين', () => {
  run('S.route={n:"desk"}; S.tab.desk="tk"');
  const tk = run('screenDesk()').split('<nav class="tabs"')[0];
  if (tk.indexOf('التذاكر والتقارير') < 0) throw new Error('بلا عنوان');
  if (tk.indexOf('data-v="rp"') < 0) throw new Error('بلا تبويب تقارير');
  if (tk.indexOf('data-a="newticket"') < 0) throw new Error('بلا زر تذكرة');
  run('S.tab.desk="rp"');
  const rp = run('screenDesk()').split('<nav class="tabs"')[0];
  if (rp.indexOf('data-a="report"') < 0) throw new Error('بلا زر تقرير');
  if (rp.indexOf('data-a="newticket"') >= 0) throw new Error('اختلط المحتوى');
});
step('التقرير كيان مستقل عن التذكرة', () => {
  if (run('S.reports.some(function(r){return S.tickets.some(function(k){return k.id===r.id})})'))
    throw new Error('تداخل المعرّفات');
  const r = run('S.reports[0]');
  ['no','from','to','cat','status','replies'].forEach(k => {
    if (r[k] === undefined) throw new Error('ينقص الحقل ' + k);
  });
});
step('المحسن يرفع لليدره والليدر للكنترول', () => {
  const m = run('teamOf("L1")[0].id');
  run('S.session={id:"' + m + '",at:Date.now()}');
  const before = run('S.reports.length');
  const vals = { rti: 'ازدحام عند المصعد', rb: 'ازدحام شديد عند مصاعد الدور الخامس وقت الخروج للحرم.', rc: 'ازدحام أو أمن', rt: '' };
  sandbox.document.getElementById = i2 => (vals[i2] !== undefined ? Object.assign({}, el, { value: vals[i2] }) : el);
  click({ a: 'sendreport' });
  sandbox.document.getElementById = () => el;
  if (run('S.reports.length') !== before + 1) throw new Error('لم يُرفع');
  if (run('S.reports[0].to') !== 'L1') throw new Error('لم يصل الليدر');
  if (!run('S.notifs.some(function(n){return n.to==="L1"&&n.title==="تقرير جديد"})')) throw new Error('بلا إشعار');
  sandbox.RP_ = run('S.reports[0].id');

  run('S.session={id:"L1",at:Date.now()}');
  const v2 = { rti: 'نقص وجبات المشاعر', rb: 'نقص اثنتي عشرة وجبة عن كشف المجموعة في مخيم منى.', rc: 'مشكلة إعاشة', rt: '' };
  sandbox.document.getElementById = i2 => (v2[i2] !== undefined ? Object.assign({}, el, { value: v2[i2] }) : el);
  click({ a: 'sendreport' });
  sandbox.document.getElementById = () => el;
  if (run('S.reports[0].to') !== 'CONTROL') throw new Error('الليدر لم يرفع للكنترول');
});
step('تقرير بلا عنوان أو تفاصيل مرفوض', () => {
  const before = run('S.reports.length');
  const v = { rti: 'اا', rb: 'تفاصيل كافية جدًّا هنا', rc: 'أخرى', rt: '' };
  sandbox.document.getElementById = i2 => (v[i2] !== undefined ? Object.assign({}, el, { value: v[i2] }) : el);
  click({ a: 'sendreport' });
  const v2 = { rti: 'عنوان صالح', rb: 'قصير', rc: 'أخرى', rt: '' };
  sandbox.document.getElementById = i2 => (v2[i2] !== undefined ? Object.assign({}, el, { value: v2[i2] }) : el);
  click({ a: 'sendreport' });
  sandbox.document.getElementById = () => el;
  if (run('S.reports.length') !== before) throw new Error('قُبل تقرير ناقص');
});
step('الرد والتصعيد وتغيير الحالة والإغلاق', () => {
  const id = sandbox.RP_;
  sandbox.document.getElementById = () => Object.assign({}, el, { value: 'استلمتُ التقرير وسأنسّق مع السكن.' });
  click({ a: 'dorreply', id: id });
  sandbox.document.getElementById = () => el;
  if (!run('reportById("' + id + '").replies.length')) throw new Error('لم يُسجَّل الرد');
  if (run('reportById("' + id + '").status') !== 'قيد المعالجة') throw new Error('لم تتغيّر الحالة');

  sandbox.document.getElementById = () => Object.assign({}, el, { value: 'يحتاج تدخّل الكنترول' });
  click({ a: 'doresc', id: id });
  sandbox.document.getElementById = () => el;
  if (!run('reportById("' + id + '").escalated')) throw new Error('لم يُصعَّد');
  if (run('reportById("' + id + '").status') !== 'مُصعّد للكنترول') throw new Error('الحالة ' + run('reportById("' + id + '").status'));

  click({ a: 'dorstate', id: id, v: 'بانتظار معلومات' });
  if (run('reportById("' + id + '").status') !== 'بانتظار معلومات') throw new Error('لم تتغيّر');
  click({ a: 'rclose', id: id });
  if (run('reportById("' + id + '").status') !== 'مغلق') throw new Error('لم يُغلق');
  click({ a: 'rreopen', id: id });
  if (run('reportById("' + id + '").status') === 'مغلق') throw new Error('لم يُعد فتحه');
});
step('شاشة التقرير تفتح ولها إجراءات', () => {
  run('S.route={n:"report",id:"' + sandbox.RP_ + '"}');
  const h = run('screenReport()').split('<nav class="tabs"')[0];
  ['تفاصيل التقرير', 'المتابعة', 'إجراء'].forEach(k => {
    if (h.indexOf(k) < 0) throw new Error('ينقص: ' + k);
  });
});
step('طلبات التسكين من داخل المهمة فقط', () => {
  const m = run('teamOf("L1")[0].id');
  run('S.route={n:"profile",id:"' + m + '"}');
  const h = run('screenProfile()').split('<nav class="tabs"')[0];
  if (h.indexOf('data-a="assignto"') >= 0) throw new Error('ما زال الإسناد من البروفايل');
  if (h.indexOf('من داخل المهمة') < 0) throw new Error('لا يوجد توجيه للمهمة');
});

console.log('\n' + (fail ? '✗ فشل ' + fail : '✓ نجحت كل الاختبارات'));
process.exitCode = fail ? 1 : 0;
