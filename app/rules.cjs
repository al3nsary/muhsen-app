/* ============================================================
   قواعدُ العمل — تُجرَّب تشغيلًا لا تُقرأ في الشيفرة

   كلُّ فحصٍ هنا وُلد من علّةٍ رآها المستخدمُ على جهازه:
     ١ · تأشيرةٌ على فرعيّةٍ واحدةٍ كانت تفتح لوحَ إغلاق المهمّة
         كلِّها، فلا تُؤشَّر البقيّة.
     ٢ · مهمّةٌ أُسندت قيادتُها إلى محسنٍ كانت تنقلب في تطبيقه
         «غير منجزة» ساعةَ قبولِه.
     ٣ · المحسنُ لم يكن يملك تصويرَ مهمّته.
     ٤ · العددُ على زرّ «كل المهام» كان غيرَ عدد ما يُفتح به.
     ٥ · الدوامُ ليس يوميًّا — والتقويمُ كان يسوّي الأيّام.

     node rules.cjs
   ============================================================ */
const fs = require('fs'), cp = require('child_process');
const SC = __dirname.split('\\').join('/') + '/';
const h = fs.readFileSync(SC + '../docs/index.html', 'utf8');

const inj = `<script>
setTimeout(function () {
  var O = [];
  var ok = function (c, t) { O.push((c ? '+ ' : 'X ') + t); };

  var L = S.users.filter(function (u) { return u.role === 'leader' && !u.admin; })[0];
  var team = S.users.filter(function (u) { return u.role === 'muhsen' && u.leaderId === L.id; });
  S.pushAsked = true; S.bioAsked = true;

  /* ═════ ١ · المهام الفرعية: واحدةٌ لا تُنهي البقيّة ═════ */
  (function () {
    var t = S.tasks.filter(function (x) { return x.leaderId === L.id && x.subs.length >= 3; })[0];
    t.status = 'running'; t.startedAt = Date.now(); t.delegate = null;
    t.subs.forEach(function (s) { s.done = false; s.at = null; });
    S.session = { id: L.id, at: Date.now() };
    S.route = { n: 'task', id: t.id }; S.sheet = null; S.sheetBare = false;
    render();
    var rows = document.querySelectorAll('.sub[data-a="sub"]');
    O.push('المهام الفرعية: ' + t.subs.length + ' · خاناتٌ قابلةٌ للنقر = ' + rows.length);
    ok(rows.length === t.subs.length, 'كلُّ الخانات قابلةٌ للتأشير');
    rows[0].click();
    ok(t.subs[0].done === true, 'أُشّرت الأولى');
    ok(!S.sheet, 'لم يُفتح لوحُ الإغلاق بعد واحدة');
    var rows2 = document.querySelectorAll('.sub[data-a="sub"]:not([disabled])');
    ok(rows2.length === t.subs.length, 'البقيّةُ ما زالت قابلةً للتأشير');
    rows2[1].click();
    ok(t.subs[1].done === true, 'أُشّرت الثانية بعد الأولى');
    ok(!S.sheet, 'ولا لوحَ إغلاقٍ بعد الثانية');
    /* تُشّك البقيّةُ كلُّها: هنا وحدَه يُفتح اللوح */
    t.subs.forEach(function (s, i) {
      if (s.done) return;
      var all = document.querySelectorAll('.sub[data-a="sub"]');
      all[i].click();
    });
    ok(t.subs.every(function (s) { return s.done; }), 'اكتملت الفرعيّةُ كلُّها');
    ok(!!S.sheet && S.sheet.indexOf('إغلاق المهمة') >= 0, 'وعندها فُتح لوحُ الإغلاق');
    S.sheet = null; S.sheetBare = false;
  })();

  /* ═════ ٢ · المفوَّض: مهمّةٌ عاديّةٌ مميَّزةٌ لا «غير منجزة» ═════ */
  (function () {
    var t = S.tasks.filter(function (x) { return x.leaderId === L.id; })[1];
    var m = team[0];
    t.status = 'assigned'; t.startedAt = null; t.start = Date.now() + 6 * 3600000;
    t.end = t.start + 3 * 3600000;
    sendDelegate(t, m.id, false);            /* بلا إبقائه محسنًا — يُفرَّغ للقيادة */
    S.session = { id: m.id, at: Date.now() };
    respondDelegate(t, true);
    ok(isDelegate(t, m.id), 'قبِل المحسنُ القيادة');
    O.push('تصنيفُها عنده = ' + taskBucket(t, m.id));
    ok(taskBucket(t, m.id) !== 'undone', 'ولم تنقلب «غير منجزة»');
    ok(myTasks().some(function (x) { return x.id === t.id; }), 'وهي في قائمة مهامّه');
    ok(activeTasks(m.id).some(function (x) { return x.id === t.id; }), 'وفي مهامّه القائمة');
    S.route = { n: 'tasks' }; S.tab.tasks = 'all'; render();
    var card = document.querySelector('.c.task[data-id="' + t.id + '"]');
    ok(!!card && card.classList.contains('lead'), 'وبطاقتُها مميَّزةٌ بلون الليدر');
    ok(!!card && card.textContent.indexOf('أنت الليدر') >= 0, 'وتقول إنّ الصفة أُسندت إليه');
    ok(canDecide(t, m.id), 'ويملك قرارَ البدء والإغلاق');
    ok(!canAssign(t, m.id), 'ولا يملك التسكين');
  })();

  /* ═════ ٣ · تصويرُ المحسن ═════ */
  (function () {
    /* مهمّةٌ لم تُغلق: المنتهيةُ تُحجب عمّن خرج منها، وليس ذلك موضوعَنا */
    var t = S.tasks.filter(function (x) {
      return x.leaderId === L.id && ['done','cancelled'].indexOf(x.status) < 0; })[2];
    var m = team[1] || team[0];
    t.delegate = null;
    var a = t.assigned.filter(function (x) { return x.muhsenId === m.id; })[0];
    if (!a) { t.assigned.push({ muhsenId: m.id, req: 'accepted', reqAt: Date.now() });
      a = t.assigned[t.assigned.length - 1]; }
    a.req = 'accepted'; a.removed = false; a.out = null; a.attendedAt = null;
    S.session = { id: m.id, at: Date.now() };
    /* «مثل الليدر»: من قبِل تسكينَه صوّر — ولا يُنتظر إثباتُ حضورٍ
       لا يُفتح بابُه إلّا في نافذةِ ساعتين قبل المهمّة. */
    ok(canShootSub(t), 'على المهمّة بلا حضورٍ بعد: يصوّر الخطوة الفرعيّة');
    ok(canMemories(t), 'ويرفع ميموريز المهمّة');
    S.route = { n: 'task', id: t.id }; render();
    ok(!!document.querySelector('[data-a="shoot"][data-tid="' + t.id + '"]'),
      'وزرُّ التصوير ظاهرٌ له في المهمّة');
    var sub = t.subs[0];
    ok(!!document.querySelector('[data-a="shoot"][data-sid="' + sub.id + '"]'),
      'وعلى كلّ خطوةٍ فرعيّةٍ زرُّها');
    /* والصورُ التذكاريّةُ مثلُها: طُلبت للمحسن كما هي للّيدر */
    ok(!!document.querySelector('[data-a="memories"][data-tid="' + t.id + '"]'),
      'وزرُّ الصور التذكاريّة ظاهرٌ له');
    a.attendedAt = Date.now();
    ok(canShootSub(t), 'وبعد إثبات الحضور كذلك');
    /* والحدُّ قائم: من ليس على المهمّة لا يصوّرها */
    a.req = 'rejected';
    ok(!canShootSub(t), 'ومن ليس على المهمّة: لا تصوير');
    ok(shootSubWhy(t) === 'لستَ على هذه المهمة', 'ويُقال له السبب');
    a.req = 'accepted'; a.attendedAt = Date.now();
    S.route = { n: 'album' }; render();
    ok(!!document.querySelector('[data-a="shoot"]'), 'وفي الألبوم كذلك');
  })();

  /* ═════ ٤ · عددُ المهام على الزرّ = عددُ ما يُفتح به ═════ */
  (function () {
    S.session = { id: L.id, at: Date.now() };
    S.route = { n: 'home' }; S.sheet = null; render();
    var btn = document.querySelector('[data-a="pickbucket"][data-v="all"]');
    var total = myTasks().length;
    if (!btn) { ok(total <= 3, 'لا زرَّ لأنّ المهامّ ثلاثٌ فأقلّ'); return; }
    var num = (btn.textContent.match(/[0-9\\u0660-\\u0669]+/) || [''])[0];
    var west = num.replace(/[\\u0660-\\u0669]/g, function (d) { return d.charCodeAt(0) - 1632; });
    O.push('الزرُّ يقول ' + west + ' · وجهتُه تعرض ' + total);
    ok(Number(west) === total, 'العددُ على الزرّ هو عددُ ما يُفتح به');
    btn.click();
    ok(document.querySelectorAll('.c.task').length === total, 'وما ظهر بعد النقر يطابقه');
  })();

  /* ═════ ٥ · الدوامُ ليس يوميًّا ═════ */
  (function () {
    var m = team[0];
    var days = [], on = 0;
    for (var i = 0; i < 14; i++) {
      var d = dayStart(Date.now()) - i * 86400000;
      var duty = onDuty(m.id, d);
      if (duty) on++;
      days.push(duty ? 'د' : '.');
    }
    O.push('أربعةَ عشرَ يومًا: ' + days.reverse().join('') + ' · دوام=' + on);
    ok(on > 0 && on < 14, 'الدوامُ متقطّعٌ لا يوميّ');
    var r = rotaOf(m.id);
    ok(r.every === 2 || r.every === 3, 'الدورةُ يومٌ بعد يومٍ أو يومٌ من ثلاثة — ' + r.every);
    /* ولا يُحسب يومُ الراحة غيابًا */
    S.session = { id: m.id, at: Date.now() };
    S.route = { n: 'daily' }; S.sheet = null; render();
    var off = document.querySelectorAll('.wk.off').length;
    O.push('خاناتُ الراحة في الأسبوع = ' + off);
    ok(off > 0, 'والتقويمُ يفرّق بينها وبين الغياب');
    ok(!document.querySelector('.view .seg'), 'ولا تبويباتِ فريقٍ ولا تبديلٍ في الجمع');
    ok(!!document.querySelector('[data-a="leavereq"]'), 'وزرُّ طلب الاستئذان موجود');
    ok(!!document.querySelector('[data-a="swapreq"]'), 'وزرُّ تبديل الشِفت معه');
  })();

  /* ═════ ٦ · الاستئذان: مسارٌ كاملٌ ═════ */
  (function () {
    var m = team[0];
    S.leaves = [];
    S.session = { id: m.id, at: Date.now() };
    var x = addLeave(m.id, dayStart(Date.now()), 15 * 60, 17 * 60, 'موعد طبّيّ');
    ok(x.state === 'pending' && x.leaderId === L.id, 'الطلبُ يصل الليدر');
    S.session = { id: L.id, at: Date.now() };
    ok(pendingLeaves().length === 1, 'ويظهر عنده بانتظار القرار');
    leaveAct(x, 'approve');
    ok(x.state === 'approved', 'واعتمادُه يغيّر حالتَه');
    ok(S.notifs.some(function (n) { return n.to === m.id && n.title.indexOf('استئذانك') >= 0; }),
      'ويصل صاحبَه إشعار');
  })();

  /* ═════ ٧ · الملاحظاتُ العابرةُ تنصرف ═════ */
  (function () {
    var m = team[0];
    S.session = { id: m.id, at: Date.now() };
    S.attend = (S.attend || []).filter(function (a) {
      return !(a.userId === m.id && a.day === dayStart(Date.now())); });
    S.myPlace = 'hq';
    checkIn(m.id);
    S.route = { n: 'daily' }; S.sheet = null; render();
    var f = document.querySelector('.note.flash');
    ok(!!f, 'خبرُ التسجيل يظهر عند فتح الشاشة');
    ok(!!f && f.textContent.indexOf('تم تسجيل الحضور') >= 0, 'ونصُّه هو هو');
    setTimeout(function () {
      ok(!document.querySelector('.note.flash'), 'ثمّ ينصرف وحدَه');
      dump();
    }, 8200);
  })();

  function dump() {
    var fails = O.filter(function (l) { return l.indexOf('X ') === 0; }).length;
    O.push(fails ? '\\n✗ سقط ' + fails : '\\n+ كلُّ القواعد');
    var p = document.createElement('pre'); p.id = 'PP';
    p.textContent = O.join(String.fromCharCode(10));
    document.body.appendChild(p);
  }
}, 900);
</scr` + `ipt>`;

const i = h.lastIndexOf('</body>');
fs.writeFileSync(SC + '_rules.html', h.slice(0, i) + inj + h.slice(i));
const r = cp.execSync('"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new ' +
  '--disable-gpu --window-size=430,900 --virtual-time-budget=40000 --dump-dom ' +
  '"file:///' + SC + '_rules.html"',
  { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const m = r.match(/<pre id="PP">([\s\S]*?)<\/pre>/);
const out = m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>').replace(/&quot;/g, '"') : 'X لا مخرجات';
console.log(out);
if (/^X /m.test(out) || out.indexOf('لا مخرجات') >= 0) process.exitCode = 1;
