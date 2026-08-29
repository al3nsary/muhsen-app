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

const FILES = ['03-data.js','04-core.js','05-ui.js','06-task.js','07-muhsen.js','08-more.js','09-admin.js','11-reqcenter.js','12-photos.js','13-docs.js','14-guide.js','10-router.js'];
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
step('٣ قادة و١٥ محسنًا — ٥ لكل ليدر', () => {
  const L = run('S.users.filter(u=>u.role==="leader").length');
  const M = run('S.users.filter(u=>u.role==="muhsen").length');
  const per = run('teamOf("L1").length');
  if (L !== 3 || M !== 15 || per !== 5) throw new Error(L + ' قادة، ' + M + ' محسن، ' + per + ' لكل ليدر');
});
step('لا وجود للمجموعات', () => { if (run('S.tasks.some(t=>t.groups)')) throw new Error('ما زالت موجودة'); });
step('الحجاج على مستوى الـKT', () => { if (!run('pilgrimsOf("KT085").length')) throw new Error('لا يوجد حجاج'); });
step('مهام منتهية مقيَّمة جاهزة', () => {
  const n = run('S.tasks.filter(t=>t.status==="done"&&t.rating).length');
  if (n < 5) throw new Error('فقط ' + n);
});
step('التقارير مدموجة في التذاكر', () => {
  if (run('!!S.reports')) throw new Error('ما زال هناك reports');
  if (!run('S.tickets.some(k=>k.src==="محسن")')) throw new Error('لا تذاكر من محسنين');
});

console.log('\nتصفّح شاشات الليدر');
click({ a: 'login', id: 'L1' });
['home','tasks','lreq','muhsens','rating','tickets','notifs','calendar','pilgrims','more','profile','admin']
  .forEach(n => step('شاشة ' + n, () => { click({ a: 'go', n }); if (!el.innerHTML) throw new Error('فارغة'); }));

console.log('\nقواعد التسكين');
let TID;
step('فتح مهمة قادمة', () => {
  TID = run('S.tasks.filter(t=>t.leaderId==="L1"&&t.start>now()).sort((a,b)=>a.start-b.start)[0].id');
  click({ a: 'go', n: 'assign', id: TID });
  if (!el.innerHTML) throw new Error('فارغة');
});
step('إرسال طلبين', () => {
  click({ a: 'send', id: TID, u: 'M1001' });
  click({ a: 'send', id: TID, u: 'M1002' });
  const p = run('taskById("' + TID + '").assigned.filter(a=>a.req==="pending").length');
  if (p !== 2) throw new Error('أُرسل ' + p);
});
step('منع تكرار الطلب لنفس الشخص', () => {
  const before = run('taskById("' + TID + '").assigned.length');
  click({ a: 'send', id: TID, u: 'M1001' });
  if (run('taskById("' + TID + '").assigned.length') !== before) throw new Error('تكرر');
});
step('المحسن يقبل', () => {
  run('S.session={id:"M1001"}'); click({ a: 'resp', id: TID, v: '1' });
  if (!run('acceptedSlots(taskById("' + TID + '")).some(a=>a.muhsenId==="M1001")')) throw new Error('لم يُقبل');
});
step('الرفض يضع المهمة في «غير المنجزة» للمحسن مع السبب', () => {
  run('respondRequest(taskById("' + TID + '"),"M1002",false,"مرتبط بمهمة أخرى")');
  const b = run('taskBucket(taskById("' + TID + '"),"M1002")');
  if (b !== 'undone') throw new Error('التصنيف ' + b);
  if (!run('undoneReason(taskById("' + TID + '"),"M1002")').includes('رفض')) throw new Error('السبب غير صحيح');
});
step('الحالة تبقى بانتظار التسكين دون الحد الأدنى', () => {
  const st = run('recomputeStatus(taskById("' + TID + '"))');
  if (st !== 'pending_assign') throw new Error(st);
});
step('اكتمال الحد الأدنى ٢ يغيّر الحالة', () => {
  run('S.session={id:"L1"}'); click({ a: 'send', id: TID, u: 'M1003' });
  run('respondRequest(taskById("' + TID + '"),"M1003",true)');
  const st = run('recomputeStatus(taskById("' + TID + '"))');
  if (st !== 'assigned') throw new Error(st);
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
  sandbox.T_ = run('S.tasks.filter(x=>x.leaderId==="L1"&&x.start>now()&&!x.assigned.length)[0].id');
  sandbox.M_ = run('teamOf("L1")[3].id');
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
  run('S.clockOffset=0');
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
step('زر الرئيسية واحد وخارج الجانبين', () => {
  const h = run('tabs()');
  if ((h.match(/class="home/g) || []).length !== 1) throw new Error('عدد أزرار الرئيسية خاطئ');
  const sides = h.split('class="home')[0];
  if (sides.indexOf('data-side="r"') < 0) throw new Error('لا يوجد الجانب الأيمن قبل الرئيسية');
  if (h.split('class="home')[1].indexOf('data-side="l"') < 0) throw new Error('لا يوجد الجانب الأيسر بعدها');
});
step('الجانبان متساويان في المدى', () => {
  const h = run('tabs()');
  const parts = h.split('data-side=');
  const rCount = (parts[1] || '').split('data-a="go"').length - 1;
  const lCount = (parts[2] || '').split('data-a="go"').length - 1;
  if (Math.abs(rCount - lCount) > 1) throw new Error('غير متوازنين: ' + rCount + ' و' + lCount);
});
step('تاب الدليل موجود للدورين', () => {
  if (run('tabs().indexOf("data-n=\\"guide\\"")') < 0) throw new Error('غائب عن الليدر');
  const m = run('teamOf("L1")[0].id');
  run('S.session={id:"' + m + '",at:Date.now()}');
  if (run('tabs().indexOf("data-n=\\"guide\\"")') < 0) throw new Error('غائب عن المحسن');
  run('S.session={id:"L1",at:Date.now()}');
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

console.log('\n' + (fail ? '✗ فشل ' + fail : '✓ نجحت كل الاختبارات'));
process.exitCode = fail ? 1 : 0;
