/* مسح شامل: كل شاشة × كل دور — يكشف الانهيارات والتناقضات قبل النشر */
const fs = require('fs'), path = require('path'), vm = require('vm');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');

const el = { className: '', innerHTML: '', querySelector: () => null, querySelectorAll: () => [] };
const store = {}, handlers = [];
const sandbox = {
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }), navigator: { standalone: false }, innerHeight: 900 },
  document: {
    documentElement: { classList: { add() {}, contains: () => false }, style: { setProperty() {} } },
    getElementById: () => el, addEventListener: (t, fn) => { if (t === 'click') handlers.push(fn); },
    querySelector: () => null, querySelectorAll: () => []
  },
  localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } },
  navigator: { vibrate() {} }, setInterval: () => 0, setTimeout: () => 0,
  Intl, Date, Math, JSON, console, Array, Object, String, Number, Set, Boolean, isNaN
};
sandbox.window.IMG = {};
sandbox.globalThis = sandbox;

const FILES = ['03-data.js','04-core.js','05-ui.js','06-task.js','07-muhsen.js','08-more.js','09-admin.js',
  '11-reqcenter.js','12-photos.js','13-docs.js','14-guide.js','15-daily.js','16-push.js','17-reports.js','18-assign.js','10-router.js'];
const ctx = vm.createContext(sandbox);
vm.runInContext(FILES.map(read).join('\n'), ctx, { filename: 'app.js' });
const run = c => vm.runInContext(c, ctx);

let bad = 0;
const fail = (who, what, e) => { bad++; console.log('  ✗ [' + who + '] ' + what + ' → ' + e); };

/* أدوار التجربة: ليدر · محسن في فريق · محسن احتياطي */
const roles = [
  ['ليدر', run('S.users.find(u=>u.role==="leader").id')],
  ['محسن', run('S.users.find(u=>u.role==="muhsen"&&!u.reserve).id')],
  ['احتياطي', run('S.users.find(u=>u.role==="muhsen"&&u.reserve).id')]
];
const screens = run('Object.keys(SCREENS)');

console.log('مسح الشاشات لكل دور');
roles.forEach(([label, id]) => {
  run('S.session={id:"' + id + '",at:Date.now()}');
  screens.forEach(n => {
    /* معرّفات نموذجية للشاشات التي تحتاجها */
    const ids = {
      task: 'myTasks()[0]&&myTasks()[0].id', assign: 'myTasks()[0]&&myTasks()[0].id',
      timeline: 'myTasks()[0]&&myTasks()[0].id', taskrating: 'myTasks().find(t=>t.rating)&&myTasks().find(t=>t.rating).id',
      ticket: 'myTickets()[0]&&myTickets()[0].id', report: 'myReports()[0]&&myReports()[0].id',
      photo: '(S.photos[0]||{}).id', doc: '(S.tasks.find(t=>hasDocs(t))||{}).id+"~naql"',
      guide: '"airport"', profile: '"' + id + '"'
    };
    try {
      const rid = ids[n] ? run(ids[n]) : null;
      run('S.route={n:"' + n + '",id:' + JSON.stringify(rid || null) + '}');
      const html = run('SCREENS["' + n + '"]()');
      if (!html || html.length < 40) fail(label, 'شاشة ' + n, 'مخرجات فارغة');
    } catch (e) { fail(label, 'شاشة ' + n, e.message); }
  });
});

console.log('\nمسح الأوراق المنبثقة');
const sheets = [
  ['placeSheet', 'placeSheet()'],
  ['bucketSheet', 'bucketSheet()'],
  ['swapSheet', 'swapSheet()'],
  ['reportSheet', 'reportSheet(null)'],
  ['ticketSheet', 'ticketSheet(null)'],
  ['reminderSheet', 'reminderSheet()'],
  ['addTaskSheet', 'addTaskSheet()'],
  ['photoMetaSheet', 'photoMetaSheet()'],
  ['pushAskSheet', 'pushAskSheet()'],
  ['stepTextSheet', 'stepTextSheet("airport")'],
  ['subPickSheet', 'subPickSheet(myTasks()[0]||null)'],
  ['delegSheet', 'delegSheet(myTasks()[0]||null)'],
  ['editTaskSheet', 'editTaskSheet(myTasks()[0]||null)'],
  ['ticketAssignSheet', 'ticketAssignSheet(myTickets()[0]||null)'],
  ['reportStateSheet', 'reportStateSheet(S.reports[0])'],
  ['reasonSheet', 'reasonSheet("x","y","z","p","resp",(myTasks()[0]||{}).id)']
];
roles.forEach(([label, id]) => {
  run('S.session={id:"' + id + '",at:Date.now()}');
  sheets.forEach(([nm, code]) => {
    try { const h = run(code); if (!h) fail(label, 'ورقة ' + nm, 'فارغة'); }
    catch (e) { fail(label, 'ورقة ' + nm, e.message); }
  });
});

console.log('\nفحص التناقضات');
const chk = (name, code, want) => {
  try {
    const got = run(code);
    if (got !== want) { bad++; console.log('  ✗ ' + name + ' → ' + JSON.stringify(got)); }
    else console.log('  ✓ ' + name);
  } catch (e) { bad++; console.log('  ✗ ' + name + ' → ' + e.message); }
};
run('S.session={id:"L1",at:Date.now()}');
chk('لا مستخدم بلا اسم', 'S.users.filter(u=>!u.name).length', 0);
chk('كل محسن غير احتياطي له ليدر', 'S.users.filter(u=>u.role==="muhsen"&&!u.reserve&&!userById(u.leaderId)).length', 0);
chk('كل احتياطي بلا ليدر', 'reserveTeam().filter(u=>u.leaderId).length', 0);
chk('كل مهمة لها ليدر موجود', 'S.tasks.filter(t=>!userById(t.leaderId)).length', 0);
chk('كل تسكين لمستخدم موجود', 'S.tasks.filter(t=>t.assigned.some(a=>!userById(a.muhsenId))).length', 0);
chk('كل تذكرة لها ليدر', 'S.tickets.filter(k=>!userById(k.leaderId)).length', 0);
chk('كل تقرير له مُرسِل موجود', 'S.reports.filter(r=>!userById(r.from)).length', 0);
chk('كل تقرير له وجهة صالحة', 'S.reports.filter(r=>r.to!=="CONTROL"&&!userById(r.to)).length', 0);
chk('كل صورة لمهمة موجودة', 'S.photos.filter(p=>p.taskId&&!taskById(p.taskId)).length', 0);
chk('كل طلب لمهمة موجودة', 'S.requests.filter(r=>r.taskId&&!taskById(r.taskId)).length', 0);
chk('كل إشعار لمستخدم موجود', 'S.notifs.filter(n=>!userById(n.to)).length', 0);
chk('كل حضور يومي لمستخدم موجود', 'S.attend.filter(a=>!userById(a.userId)).length', 0);
chk('كل شِفت لمستخدم موجود', 'Object.keys(S.shifts).filter(k=>!userById(k)).length', 0);
chk('كل تبديل شِفت لمستخدم موجود', 'S.swaps.filter(s=>!userById(s.from)).length', 0);
chk('لا مهمة بلا مهام فرعية', 'S.tasks.filter(t=>!t.subs.length).length', 0);
chk('كل مهمة مسكَّنة', 'S.tasks.filter(t=>!acceptedSlots(t).length).length', 0);
chk('كل نوع نشاط له هوية', 'Object.keys(CAT).filter(k=>!KIND_UI[k]).length', 0);
chk('كل نوع نشاط له دليل', 'Object.keys(CAT).filter(k=>!guideSteps(k).length).length', 0);
chk('كل نوع نشاط له مقطع', 'Object.keys(CAT).filter(k=>!CLIPS[k]).length', 0);
chk('لا وجود للمجموعات القديمة', 'S.tasks.some(t=>t.groups)', false);
chk('لا وجود للحد الأدنى', 'typeof MIN_ASSIGN', 'undefined');

/* كل وجهة في الشريط لها شاشة، وكل شاشة يصلها المستخدم */
roles.forEach(([label, id]) => {
  run('S.session={id:"' + id + '",at:Date.now()}');
  const missing = run('tabItems().filter(function(x){return !SCREENS[x.k]}).map(function(x){return x.k})');
  if (missing.length) { bad++; console.log('  ✗ [' + label + '] وجهات بلا شاشة: ' + missing.join(', ')); }
  run('S.route={n:"more"}');
  const covered = run('tabItems().reduce(function(a,x){return a.concat(x.on)},[])');
  const more = run('screenMore()');
  const skip = ['login', 'home', 'mhome'];
  const miss = run('Object.keys(SCREENS)').filter(n =>
    skip.indexOf(n) < 0 && covered.indexOf(n) < 0 && more.indexOf('data-n="' + n + '"') < 0);
  if (miss.length) { bad++; console.log('  ✗ [' + label + '] شاشات بلا طريق: ' + miss.join(', ')); }
});
if (!bad) console.log('  ✓ كل وجهة لها شاشة، وكل شاشة لها طريق');

console.log('\n' + (bad ? '✗ ' + bad + ' مشكلة' : '✓ لا مشكلات'));
process.exitCode = bad ? 1 : 0;
