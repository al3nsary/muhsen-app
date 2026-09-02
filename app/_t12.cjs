const fs = require('fs');
const CRLF = String.fromCharCode(13) + String.fromCharCode(10);
const P = 'C:/Users/al3ns/OneDrive/Desktop/Muhesn-App/app/smoke.cjs';
let s = fs.readFileSync(P, 'utf8');
const crlf = s.indexOf(CRLF) >= 0;
let t = crlf ? s.split(CRLF).join('\n') : s;

/* الاختيار الأول: نُفرّغ زميلًا من الفريق ثم نطلبه بديلًا — كما يقع في الواقع */
const A = `  /* نختار مهمة يوجد لها بديل متاح فعلًا */
  const pick = run('(function(){' +
    'var pool = teamOf("L1").concat(reserveTeam());' +
    'var ts = myTasks().filter(function(t){return t.start>now()+13*HR && acceptedSlots(t).length>1});' +
    'for (var i=0;i<ts.length;i++){' +
      'var t=ts[i];' +
      'var c=pool.filter(function(x){return !t.assigned.some(function(a){return a.muhsenId===x.id})})[0];' +
      'if (c) return {t:t.id, out:acceptedSlots(t)[0].muhsenId, cand:c.id};' +
    '} return null; })()');
  if (!pick) throw new Error('لا توجد مهمة ببديل متاح');`;

const B = `  /* الفريق مسكَّن كاملًا، والاحتياط للكنترول وحده —
     فالبديل من داخل الفريق لا يتوفّر إلا بعد خروج أحد. نُفرّغ واحدًا كما يقع في الواقع. */
  const pick = run('(function(){' +
    'var ts = myTasks().filter(function(t){' +
      'return t.start>now()+13*HR && acceptedSlots(t).length>2 && ' +
      '["done","cancelled","running"].indexOf(t.status)<0; });' +
    'if (!ts.length) return null;' +
    'var t = ts[0];' +
    'var free = acceptedSlots(t)[2].muhsenId;' +
    'excludeNoNeed(t, free, "تفريغ للاختبار");' +
    'return {t:t.id, out:acceptedSlots(t)[0].muhsenId, cand:free}; })()');
  if (!pick) throw new Error('لا توجد مهمة ببديل متاح');`;

if (t.indexOf(A) < 0) throw 'anchor A';
t = t.replace(A, B);

/* أي بقايا تستعمل الاحتياط بديلًا */
t = t.split('teamOf("L1").concat(reserveTeam()).filter(function(x){return !taskById(')
     .join('teamOf("L1").filter(function(x){return !taskById(');

/* اختبار صريح: الليدر لا يرى الاحتياط ولا يُسنده */
const EXTRA = `
step('الليدر لا يرى الفريق الاحتياطي ولا يُسنده', () => {
  run('S.session={id:"L1",at:Date.now()};S.clockOffset=0');
  const h = run('S.route={n:"muhsens"}; screenMuhsens()').split('<nav class="tabs"')[0];
  if (h.indexOf('الفريق الاحتياطي') >= 0) throw new Error('قائمة الاحتياط ظاهرة للّيدر');
  run('reserveTeam()').forEach(function (m) {
    if (h.indexOf(m.name) >= 0) throw new Error('اسم احتياطي ظاهر: ' + m.name);
  });
  if (h.indexOf('طلب دعم من الكنترول') < 0) throw new Error('لا يوجد توجيه لطلب الدعم');
  /* ولا يُسكِّن احتياطيًّا بنفسه */
  const tid = run('myTasks().filter(function(x){return x.start>now()+13*HR&&["done","cancelled","running"].indexOf(x.status)<0})[0].id');
  const rs = run('reserveTeam().find(function(r){return !taskById("' + tid + '").assigned.some(function(a){return a.muhsenId===r.id})}).id');
  const before = run('taskById("' + tid + '").assigned.length');
  click({ a: 'send', id: tid, u: rs });
  if (run('taskById("' + tid + '").assigned.length') !== before) throw new Error('سكّن الليدر احتياطيًّا مباشرة');
  /* ولا يطلبه بديلًا */
  const out = run('acceptedSlots(taskById("' + tid + '"))[0].muhsenId');
  if (run('requestReplace(taskById("' + tid + '"),"' + out + '","' + rs + '","محاولة")'))
    throw new Error('طلب الليدر احتياطيًّا بديلًا');
});
step('الاحتياطي يرى فريقه، والكنترول هو من يُسنده', () => {
  const rs = run('reserveTeam()[0].id');
  run('S.session={id:"' + rs + '",at:Date.now()}');
  const h = run('S.route={n:"muhsens"}; screenMuhsens()').split('<nav class="tabs"')[0];
  if (h.indexOf('الفريق الاحتياطي') < 0) throw new Error('الاحتياطي لا يرى فريقه');
  run('S.session={id:"L1",at:Date.now()}');
  /* الكنترول يُسند من الاحتياط عند تلبية طلب الدعم */
  const src = read('18-assign.js');
  if (src.indexOf('u.reserve') < 0) throw new Error('الكنترول لا يختار من الاحتياط');
});
`;
const anchor2 = "console.log('\\nترتيب الإشعارات');";
if (t.indexOf(anchor2) < 0) throw 'anchor2';
if (t.indexOf('الليدر لا يرى الفريق الاحتياطي ولا يُسنده') < 0)
  t = t.replace(anchor2, EXTRA.trim() + '\n\n' + anchor2);

fs.writeFileSync(P, crlf ? t.split('\n').join(CRLF) : t);
console.log('reserve tests updated');
