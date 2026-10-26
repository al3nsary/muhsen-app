/* ============================================================
   مسحُ نطاق الرؤية — ما يراه كلُّ دورٍ فعلًا

   لا يكفي أن تُقصَر الشاشةُ على دور: البياناتُ داخلَها قد تتجاوز
   صاحبَها. هنا يُفتح التطبيقُ بحسابٍ من كلّ دور، وتُرسم كلُّ
   وجهة، ويُقاس ما ظهر من أسماءٍ ومهامَّ وحجّاجَ لا يخصّونه.

     node scope.cjs
   ============================================================ */
const fs = require('fs'), cp = require('child_process');
const SC = __dirname.split('\\').join('/') + '/';
const SRC = SC + '../docs/index.html';

const harness = `<script>
(function () {
  var OUT = [];
  setTimeout(function () {
    var ROUTES = Object.keys(SCREENS).filter(function (r) { return r !== 'login'; });

    /* القياسُ بالمعرّفات لا بالعناوين: العناوينُ تتكرّر على مهامَّ
       كثيرةٍ فتُبلّغ عن تسرّبٍ لا وجودَ له. */
    function audit(who, label) {
      var leak = {};
      S.session = { id: who.id, at: Date.now() };
      var allowTasks = {};
      myTasks().forEach(function (t) { allowTasks[t.id] = 1; });
      var allowPpl = {};
      allowPpl[who.id] = 1;
      if (who.role === 'leader') {
        S.users.forEach(function (u) {
          if (u.leaderId === who.id || u.role === 'leader' || u.reserve) allowPpl[u.id] = 1; });
      } else {
        S.users.forEach(function (u) {
          if (u.id === who.leaderId || (u.leaderId && u.leaderId === who.leaderId) || u.reserve)
            allowPpl[u.id] = 1; });
      }

      ROUTES.forEach(function (r) {
        S.session = { id: who.id, at: Date.now() };
        S.route = { n: r, id: myTasks().length ? myTasks()[0].id : (S.tasks[0] || {}).id };
        S.sheet = null; S.pushAsked = true;
        try { render(); } catch (e) { return; }
        var el = document.getElementById('screen');
        var badT = {}, badP = {};
        el.querySelectorAll('[data-n="task"][data-id]').forEach(function (b) {
          if (!allowTasks[b.dataset.id]) badT[b.dataset.id] = 1; });
        el.querySelectorAll('[data-n="profile"][data-id]').forEach(function (b) {
          if (!allowPpl[b.dataset.id]) badP[b.dataset.id] = 1; });
        var nt = Object.keys(badT), np = Object.keys(badP);
        if (nt.length || np.length) leak[r] = { t: nt, p: np };
      });

      var keys = Object.keys(leak);
      OUT.push('══ ' + label + ' (' + who.name + ')  مسموح: ' +
        Object.keys(allowTasks).length + ' مهمّة · ' + Object.keys(allowPpl).length + ' شخصًا');
      if (!keys.length) { OUT.push('   + لا تسرّب'); return; }
      keys.forEach(function (r) {
        OUT.push('   X ' + r +
          (leak[r].t.length ? ' · مهامُّ غيره: ' + leak[r].t.join('،') : '') +
          (leak[r].p.length ? ' · أشخاصُ غيره: ' + leak[r].p.join('،') : ''));
      });
    }

    audit(S.users.filter(function (u) { return u.role === 'leader'; })[0], 'ليدر');
    audit(S.users.filter(function (u) {
      return u.role === 'muhsen' && !u.reserve; })[0], 'محسن');

    /* الأفعالُ المعروضة: ما يراه المحسنُ وهو من صنع الليدر */
    function actsOf(who) {
      var set = {};
      ROUTES.forEach(function (r) {
        S.session = { id: who.id, at: Date.now() };
        S.route = { n: r, id: myTasks().length ? myTasks()[0].id : (S.tasks[0] || {}).id };
        S.sheet = null; S.pushAsked = true;
        try { render(); } catch (e) { return; }
        document.getElementById('screen')
          .querySelectorAll('[data-a]').forEach(function (b) {
            (set[b.dataset.a] = set[b.dataset.a] || {})[S.route.n] = 1; });
      });
      return set;
    }
    var LD = S.users.filter(function (u) { return u.role === 'leader'; })[0];
    var MU = S.users.filter(function (u) { return u.role === 'muhsen' && !u.reserve; })[0];
    var aL = actsOf(LD), aM = actsOf(MU);
    var onlyL = Object.keys(aL).filter(function (k) { return !aM[k]; });
    var both  = Object.keys(aM).filter(function (k) { return aL[k]; });
    var onlyM = Object.keys(aM).filter(function (k) { return !aL[k]; });
    OUT.push('');
    OUT.push('══ الأفعال');
    OUT.push('   للّيدر وحده (' + onlyL.length + '): ' + onlyL.join(' '));
    OUT.push('   للمحسن وحده (' + onlyM.length + '): ' + onlyM.join(' '));
    OUT.push('   مشترك (' + both.length + ')');

    var p = document.createElement('pre'); p.id = 'PP';
    p.textContent = OUT.join(String.fromCharCode(10));
    document.body.appendChild(p);
  }, 900);
})();
</scr` + `ipt>`;

const html = fs.readFileSync(SRC, 'utf8');
const i = html.lastIndexOf('</body>');
fs.writeFileSync(SC + '_scope.html', html.slice(0, i) + harness + html.slice(i));

const r = cp.execSync('"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new ' +
  '--disable-gpu --window-size=430,900 --virtual-time-budget=60000 --dump-dom ' +
  '"file:///' + SC + '_scope.html"', { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const m = r.match(/<pre id="PP">([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<')
                   .replace(/&gt;/g, '>').replace(/&quot;/g, '"') : 'X لا مخرجات');
