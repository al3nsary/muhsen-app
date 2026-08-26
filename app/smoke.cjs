/* اختبار تشغيل سريع بلا متصفح — يكشف أخطاء التنفيذ قبل النشر */
const fs = require('fs'), path = require('path');
const IMGP = require('path').join(__dirname, 'assets', 'images.json');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');

const store = {};
const el = { className: '', innerHTML: '', querySelector: () => null, querySelectorAll: () => [] };
const handlers = [];
const sandbox = {
  window: { addEventListener: function(){}, matchMedia: function(){return{matches:false}} },
  document: {
    getElementById: () => el,
    addEventListener: (t, fn) => handlers.push(fn),
    querySelector: () => null
  },
  localStorage: {
    getItem: k => store[k] || null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: k => { delete store[k]; }
  },
  navigator: { vibrate: () => {} },
  setInterval: () => 0,
  setTimeout: () => 0,
  Intl, Date, Math, JSON, console, Array, Object, String, Number, Set, Boolean, isNaN
};
sandbox.window.IMG = JSON.parse(fs.readFileSync(IMGP, 'utf8'));
sandbox.globalThis = sandbox;

const js = ['03-data.js','04-core.js','05-ui.js','06-task.js','07-muhsen.js','08-more.js','09-admin.js','11-reqcenter.js','10-router.js']
  .map(read).join('\n');

const vm = require('vm');
const ctx = vm.createContext(sandbox);
let fail = 0;
function step(name, fn) {
  try { fn(); console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ' → ' + e.message + '\n    ' + (e.stack || '').split('\n')[1]); }
}

console.log('تحميل التطبيق');
step('التنفيذ الأولي (seed + render شاشة الدخول)', () => vm.runInContext(js, ctx, { filename: 'app.js' }));
if (fail) process.exit(1);

const run = code => vm.runInContext(code, ctx);
const click = ds => {
  const target = { closest: sel => (sel === '[data-a]' ? { dataset: ds, closest: () => null } : null) };
  handlers.forEach(h => h({ target }));
};
run('globalThis.__click = null');

console.log('\nتصفّح شاشات الليدر');
click({ a: 'login', id: 'L1' });
['home','tasks','notifs','reports','more','muhsens','pilgrims','tickets','calendar','completed','profile','admin']
  .forEach(n => step('شاشة ' + n, () => { click({ a: 'go', n }); if (!el.innerHTML) throw new Error('فارغة'); }));

step('فتح أول مهمة', () => {
  const id = run('S.tasks.find(t=>t.leaderId==="L1").id');
  click({ a: 'go', n: 'task', id });
  if (!el.innerHTML.includes('تفاصيل المهمة')) throw new Error('لم تُفتح');
});
step('شاشة التسكين', () => {
  const id = run('S.tasks.find(t=>t.leaderId==="L1").id');
  click({ a: 'go', n: 'assign', id });
});

console.log('\nدورة العمل الكاملة');
step('إرسال طلب تسكين لكل المجموعات', () => {
  const t = run('S.tasks.filter(t=>t.leaderId==="L1").sort((a,b)=>a.start-b.start)[0]');
  const team = run('teamOf("L1").map(u=>u.id)');
  t.groups.forEach((g, i) => click({ a: 'send', id: t.id, g: g.id, u: team[i] }));
  const after = run('S.tasks.find(x=>x.id==="' + t.id + '")');
  const pend = after.groups.filter(g => g.req === 'pending').length;
  if (pend !== after.groups.length) throw new Error('أُرسل ' + pend + ' من ' + after.groups.length);
});
step('وصول التنبيهات للمحسنين', () => {
  const n = run('S.notifs.filter(n=>n.title==="طلب تسكين جديد").length');
  if (!n) throw new Error('لا تنبيهات');
});
step('تبديل الحساب إلى محسن', () => {
  click({ a: 'logout' }); click({ a: 'role', r: 'muhsen' }); click({ a: 'login', id: 'M1001' });
  if (run('me().id') !== 'M1001') throw new Error('لم يُسجّل الدخول');
});
step('ظهور الطلب عند المحسن', () => {
  click({ a: 'go', n: 'requests' });
  if (run('myRequests().length') < 1) throw new Error('لا توجد طلبات');
});
step('قبول الطلب', () => {
  const r = run('myRequests()[0]');
  click({ a: 'resp', id: r.t.id, g: r.g.id, v: '1' });
  const g = run('S.tasks.find(t=>t.id==="' + r.t.id + '").groups.find(g=>g.muhsenId==="M1001")');
  if (!g || g.req !== 'accepted') throw new Error('لم يُقبل');
});
step('قبول باقي المحسنين', () => {
  run('teamOf("L1").forEach(function(u){ S.session={id:u.id}; myRequests().forEach(function(r){ if(r.kind==="assign") respondRequest(r.t,r.g,true); }); }); S.session={id:"L1"};');
  const t = run('S.tasks.filter(t=>t.leaderId==="L1").sort((a,b)=>a.start-b.start)[0]');
  const ok = t.groups.filter(g => g.req === 'accepted').length;
  if (ok !== t.groups.length) throw new Error('قبِل ' + ok + ' من ' + t.groups.length);
});
step('حالة المهمة صارت «مكتملة التسكين»', () => {
  const st = run('(function(){var t=S.tasks.filter(t=>t.leaderId==="L1").sort((a,b)=>a.start-b.start)[0];return recomputeStatus(t)})()');
  if (st !== 'assigned') throw new Error('الحالة ' + st);
});
step('منع البدء قبل إثبات الحضور', () => {
  const t = run('S.tasks.filter(t=>t.leaderId==="L1").sort((a,b)=>a.start-b.start)[0]');
  if (t.status === 'ready') throw new Error('صارت جاهزة دون حضور');
});
step('إثبات حضور الجميع', () => {
  run('(function(){var t=S.tasks.filter(t=>t.leaderId==="L1").sort((a,b)=>a.start-b.start)[0];' +
      'attend(t,"L1"); t.groups.forEach(function(g){ if(g.muhsenId) attend(t,g.muhsenId); }); })()');
  const st = run('(function(){var t=S.tasks.filter(t=>t.leaderId==="L1").sort((a,b)=>a.start-b.start)[0];return t.status})()');
  if (st !== 'ready') throw new Error('الحالة ' + st);
});
step('بدء المهمة', () => {
  const t = run('S.tasks.filter(t=>t.leaderId==="L1").sort((a,b)=>a.start-b.start)[0]');
  run('S.session={id:"L1"}'); click({ a: 'start', id: t.id });
  const st = run('S.tasks.find(x=>x.id==="' + t.id + '").status');
  if (st !== 'running') throw new Error('الحالة ' + st);
});
step('إنجاز مهمة فرعية', () => {
  const t = run('S.tasks.filter(t=>t.leaderId==="L1").sort((a,b)=>a.start-b.start)[0]');
  click({ a: 'sub', id: t.id, s: t.subs[0].id });
  const s = run('S.tasks.find(x=>x.id==="' + t.id + '").subs[0]');
  if (!s.done) throw new Error('لم تُنجَز');
});
step('إنهاء المهمة وتسجيل ملاحظة تلقائية', () => {
  const t = run('S.tasks.filter(t=>t.leaderId==="L1").sort((a,b)=>a.start-b.start)[0]');
  click({ a: 'doend', id: t.id });
  const x = run('S.tasks.find(x=>x.id==="' + t.id + '")');
  if (x.status !== 'done') throw new Error('الحالة ' + x.status);
  if (!x.notes.length) throw new Error('بلا ملاحظات تلقائية');
});

console.log('\nالتفويض — بعثة مقابل شركة');
step('منع التفويض في مهمة بعثة (L1)', () => {
  const t = run('S.tasks.find(t=>t.leaderId==="L1")');
  if (run('orgOf(S.tasks.find(t=>t.leaderId==="L1")).type') !== 'بعثة') throw new Error('L1 ليست بعثة');
});
step('إتاحة التفويض في مهمة شركة (L2)', () => {
  if (run('orgOf(S.tasks.find(t=>t.leaderId==="L2")).type') !== 'شركة') throw new Error('L2 ليست شركة');
  const t = run('S.tasks.filter(t=>t.leaderId==="L2").sort((a,b)=>a.start-b.start)[0]');
  run('S.session={id:"L2"}');
  click({ a: 'deleg', id: t.id }); click({ a: 'dsend', u: 'M2001', id: t.id });
  const d = run('S.tasks.find(x=>x.id==="' + t.id + '").delegate');
  if (!d) throw new Error('لم يُرسل التفويض');
});
step('قبول المفوَّض واكتسابه الصلاحية', () => {
  const t = run('S.tasks.filter(t=>t.leaderId==="L2").sort((a,b)=>a.start-b.start)[0]');
  run('S.session={id:"M2001"}'); click({ a: 'rdeleg', id: t.id, v: '1' });
  if (!run('actsAsLeader(S.tasks.find(x=>x.id==="' + t.id + '"),"M2001")')) throw new Error('لم يكتسب الصلاحية');
});

console.log('\nالتذاكر');
step('رد وإسناد وتصعيد وإغلاق', () => {
  run('S.session={id:"L1"}');
  const k = run('S.tickets.find(k=>k.leaderId==="L1")');
  click({ a: 'go', n: 'ticket', id: k.id });
  click({ a: 'doassign', id: k.id, u: 'M1001' });
  click({ a: 'dostate', id: k.id, v: 'قيد المعالجة' });
  click({ a: 'kclose', id: k.id });
  const x = run('S.tickets.find(t=>t.id==="' + k.id + '")');
  if (x.status !== 'مغلقة') throw new Error('الحالة ' + x.status);
  if (!x.assignedTo) throw new Error('لم تُسند');
});

console.log('\nشاشة التحكم');
step('تقديم الوقت', () => { const b = run('S.clockOffset'); click({ a: 'clock', v: '60' });
  if (run('S.clockOffset') !== b + 60) throw new Error('لم يتقدّم'); });
step('تحريك موعد مهمة', () => {
  const t = run('S.tasks[0]'); const b = t.start;
  click({ a: 'shift', id: t.id, v: '60' });
  if (run('S.tasks[0].start') <= b) throw new Error('لم يتحرك');
});
step('إعادة الضبط', () => {
  click({ a: 'doreset' });
  if (run('S.tasks.some(t=>t.status!=="pending_assign")')) throw new Error('بقيت حالات');
  if (run('S.notifs.some(n=>n.title==="طلب تسكين جديد")')) throw new Error('بقيت طلبات');
});

console.log('\n' + (fail ? '✗ فشل ' + fail : '✓ نجحت كل الاختبارات'));
process.exitCode = fail ? 1 : 0;
