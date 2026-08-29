/* ============================ الإشعارات الخارجية ============================ */
/* إشعار نظام حقيقي على الجوال عبر عامل الخدمة — يظهر خارج التطبيق ما دام مثبَّتًا.
   بلا خادم لا يمكن إيصاله لجهاز آخر، فما يصل الفئة المستهدفة يُسجَّل داخل التطبيق
   ويظهر لها إشعارًا خارجيًّا عند فتحها التطبيق على أجهزتها. */

const pushSupported = () => typeof Notification !== 'undefined' && 'serviceWorker' in navigator;
const pushState = () => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
const pushOn = () => pushState() === 'granted' && S.pushEnabled !== false;

const AUDIENCE = {
  all:      { l:'الجميع',     d:'كل الليدرز والمحسنين' },
  leaders:  { l:'الليدرز',    d:'قادة الفرق فقط' },
  muhsens:  { l:'المحسنون',   d:'كل المحسنين' },
  myteam:   { l:'فريقي',      d:'محسنو فريقك أنت' }
};
function audienceUsers(k) {
  const u = me();
  if (k === 'leaders') return S.users.filter(x => x.role === 'leader');
  if (k === 'muhsens') return S.users.filter(x => x.role === 'muhsen');
  if (k === 'myteam') return teamOf(u.id);
  return S.users.slice();
}

function askPush() {
  if (!pushSupported()) { toast('جهازك لا يدعم الإشعارات الخارجية', 'r'); return; }
  Notification.requestPermission().then(p => {
    S.pushEnabled = p === 'granted';
    toast(p === 'granted' ? 'فُعِّلت الإشعارات الخارجية'
      : p === 'denied' ? 'رُفض الإذن — فعّله من إعدادات المتصفح' : 'لم يُمنح الإذن', p === 'granted' ? 'g' : 'r');
    render();
  }).catch(() => { toast('تعذّر طلب الإذن', 'r'); render(); });
}

/* إطلاق إشعار نظام فعلي */
function firePush(title, body, tag) {
  if (!pushOn()) return false;
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body: body, tag: tag || 'muhsen', dir: 'rtl', lang: 'ar',
          icon: 'icon-192.png', badge: 'icon-192.png', renotify: true
        });
      }).catch(() => { try { new Notification(title, { body: body, dir: 'rtl' }); } catch (e) {} });
    } else { new Notification(title, { body: body, dir: 'rtl' }); }
    return true;
  } catch (e) { return false; }
}

/* كل إشعار داخلي يصل المستخدم الحالي يخرج إلى نظام الجهاز أيضًا */
function pushBridge(toId, title, body) {
  if (!S.session || toId !== S.session.id) return;
  firePush(title, body, 'n-' + toId);
}

/* أول فتح بعد التفعيل: ما فات المستخدم يخرج مرة واحدة */
function flushPending() {
  if (!pushOn() || !S.session) return;
  const fresh = S.notifs.filter(n => n.to === S.session.id && !n.read && !n.pushed);
  if (!fresh.length) return;
  if (fresh.length === 1) firePush(fresh[0].title, fresh[0].body, 'n-flush');
  else firePush('لديك ' + AR(fresh.length) + ' إشعارات جديدة',
    fresh[0].title + ' — وغيرها في تطبيق مُحسن', 'n-flush');
  fresh.forEach(n => { n.pushed = true; });
}

/* ---------- بثّ إشعار لفئة ---------- */
function broadcast(aud, title, body) {
  const list = audienceUsers(aud).filter(x => x.id !== S.session.id);
  list.forEach(x => notify(x.id, 'i-bell', title, body, { n: x.role === 'leader' ? 'home' : 'mhome' }));
  S.broadcasts = S.broadcasts || [];
  S.broadcasts.unshift({ id: uid('B'), aud, title, body, by: S.session.id, at: now(), n: list.length });
  /* على هذا الجهاز يظهر فورًا كإشعار نظام لتتأكد من وصوله */
  firePush(title, body + ' · إلى ' + AUDIENCE[aud].l, 'bc');
  return list.length;
}

function pushBox() {
  const st = pushState();
  const on = pushOn();
  const aud = S.bcAud || 'muhsens';
  const L = isLeader();
  return '<div class="admcard"><div class="lbl">الإشعارات الخارجية</div>' +
    '<div class="row sm" style="margin:10px 0"><span>حالة الإذن</span>' +
      pill(st === 'granted' ? (on ? 'مفعّلة' : 'موقوفة') : st === 'denied' ? 'مرفوضة'
        : st === 'unsupported' ? 'غير مدعومة' : 'لم تُطلب',
        st === 'granted' ? (on ? 'live' : 'wait') : st === 'denied' ? 'no' : 'grey') + '</div>' +

    (st === 'granted'
      ? '<div class="grid2">' +
          '<button class="btn ' + (on ? 'd' : 'p') + ' sm" data-a="pushtoggle">' +
            icon('i-bell','s16') + (on ? 'إيقافها' : 'تشغيلها') + '</button>' +
          '<button class="btn l sm" data-a="pushtest">' + icon('i-send','s16') + 'إشعار تجريبي</button></div>'
      : st === 'denied'
      ? '<div class="tiny" style="opacity:.75;line-height:1.9">رُفض الإذن على هذا الجهاز. فعّله من إعدادات الموقع في المتصفح ثم أعد المحاولة.</div>'
      : st === 'unsupported'
      ? '<div class="tiny" style="opacity:.75;line-height:1.9">هذا المتصفح لا يدعم إشعارات النظام. ثبّت التطبيق على الشاشة الرئيسية ليعمل.</div>'
      : '<button class="btn p sm" data-a="pushask">' + icon('i-bell','s16') + 'تفعيل إشعارات الجوال</button>') +

    '<div class="tiny" style="margin-top:10px;opacity:.75;line-height:1.9">' +
      'يظهر الإشعار خارج التطبيق ما دام مثبَّتًا على الشاشة الرئيسية. ' +
      'وبلا خادم مركزي لا يمكن دفعه إلى جهاز شخص آخر وهو مغلق — يصله داخل التطبيق، ' +
      'ويظهر له إشعار النظام فور فتحه.</div></div>' +

    '<div class="admcard"><div class="lbl">إرسال إشعار لفئة</div>' +
    '<div class="tiny" style="margin:8px 0;opacity:.75">اختر الفئة واكتب نصًّا — يصل كل من فيها.</div>' +
    '<div class="col" style="gap:6px">' +
      Object.keys(AUDIENCE).filter(k => k !== 'myteam' || L).map(k =>
        '<button class="admrow' + (k === aud ? ' on' : '') + '" data-a="bcaud" data-v="' + k + '" ' +
          'style="display:flex;align-items:center;gap:9px;text-align:right">' +
          icon(k === 'leaders' ? 'i-shield' : k === 'muhsens' ? 'i-users' : k === 'myteam' ? 'i-user' : 'i-bell', 's18') +
          '<span style="flex:1"><b style="display:block;font-size:12.5px">' + AUDIENCE[k].l + '</b>' +
          '<span style="font-size:10px;opacity:.7">' + AUDIENCE[k].d + ' · ' +
          AR(audienceUsers(k).length) + ' شخصًا</span></span>' +
          (k === aud ? icon('i-check','s16') : '') + '</button>').join('') + '</div>' +
    '<div class="field dark" style="margin:10px 0"><input id="bct" maxlength="60" placeholder="عنوان الإشعار"></div>' +
    '<div class="field dark" style="margin:10px 0"><input id="bcb" maxlength="160" placeholder="نص الإشعار"></div>' +
    '<button class="btn p sm" data-a="dobroadcast">' + icon('i-send','s16') + 'إرسال إلى ' + AUDIENCE[aud].l + '</button>' +
    ((S.broadcasts || []).length ? '<div class="tiny" style="margin-top:11px;opacity:.7">آخر إرسال: ' +
      E(S.broadcasts[0].title) + ' — ' + AR(S.broadcasts[0].n) + ' مستلمًا · ' + t12(S.broadcasts[0].at) + '</div>' : '') +
    '</div>';
}

/* ---------- سؤال الإذن عند أول فتح ---------- */
function pushAskSheet() {
  return '<div class="grip"></div>' +
    '<div class="center" style="padding:4px 0 2px">' +
      '<span class="askic">' + icon('i-bell','s26') + '</span>' +
      '<h3 style="margin:12px 0 4px">نُنبّهك بمهامك في وقتها</h3>' +
      '<div class="sm dim" style="line-height:1.9">فعّل تنبيهات الجوال ليصلك خارج التطبيق:<br>' +
      'اقتراب موعد مهمة · طلب تسكين ينتظر ردّك · تذكرة عاجلة · تذكير التحضير.</div></div>' +
    '<div class="note a" style="margin:14px 0">' + icon('i-info','s16') +
      '<span>يمكنك إيقافها متى شئت من شاشة التحكم.</span></div>' +
    '<div class="grid2">' +
      '<button class="btn g" data-a="pushlater">لاحقًا</button>' +
      '<button class="btn p" data-a="pushask">' + icon('i-bell','s16') + 'تفعيل التنبيهات</button></div>';
}
/* تُعرض مرة واحدة بعد تسجيل الدخول */
function maybeAskPush() {
  if (!S.session) return false;
  if (S.pushAsked) return false;
  if (!pushSupported() || pushState() !== 'default') { S.pushAsked = true; return false; }
  S.pushAsked = true;
  S.sheet = pushAskSheet();
  return true;
}