/* ============================ الصور — تصوير مباشر من داخل التطبيق ============================ */
/* الليدر وحده يصوّر · الصور تُربط بمهمة رئيسية أو فرعية أو تذكرة
   · يراها كل من له صلاحية الوصول للمهمة، حتى بعد انتهائها */

const MAX_PHOTO_W = 900;     /* أقصى عرض بعد الضغط */
const PHOTO_Q = 0.62;        /* جودة JPEG */
const PHOTO_CAP = 60;        /* أقصى عدد صور محفوظة محليًا */

/* المبذورة تُرسم بصنف CSS (لا تُحمَّل مرتين)، والملتقطة برابطها */
const fullTag = (p, cls) => (String(p.src).indexOf('IMG:') === 0
  ? '<div class="' + cls + ' bgw-' + String(p.src).slice(4).replace(/_w$/, '') + '" role="img"></div>'
  : '<img class="' + cls + '" src="' + p.src + '" alt="">');
/* المصغّرة: نسخة أصغر للصور المبذورة حتى لا يثقُل الألبوم */
const seeded = p => String(p.src).indexOf('IMG:') === 0;
const thumbKey = p => String(p.src).slice(4).replace(/_w$/, '');
/* المبذورة تُعرض بصنف CSS، والملتقطة برابطها المباشر */
const thumbAttr = p => seeded(p)
  ? 'class="__C__ bg-' + thumbKey(p) + '"'
  : 'class="__C__" style="background-image:url(' + p.src + ')"';
/* المحسن يصوّر المهام الفرعية فقط · والليدر يرفع «ميموريز» للمهمة الرئيسية */
const canShootSub = t => isLeader() || (t && !!slotOf(t, S.session.id));
const canMemories = () => isLeader();
const canShoot = () => isLeader();
/* اسم مختصر نظيف: نقطع عند أول فاصل ثم نقصّ إن طال */
function shortTitle(s) {
  let x = String(s).split(' — ')[0].trim();
  return x.length > 15 ? x.slice(0, 15).trim() + '…' : x;
}

function photosFor(taskId, subId, ticketId) {
  S.photos = S.photos || [];
  return S.photos.filter(p => !p.excuse &&
    (taskId ? p.taskId === taskId : true) &&
    (subId !== undefined ? p.subId === subId : true) &&
    (ticketId !== undefined ? p.ticketId === ticketId : true)
  ).sort((a, b) => b.at - a.at);
}
const taskPhotos = tid => (S.photos || []).filter(p => p.taskId === tid).sort((a, b) => b.at - a.at);

function addPhoto(src, title, desc, ctx) {
  S.photos = S.photos || [];
  const p = {
    id: uid('F'), src, title: title, desc: desc || '',
    by: S.session.id, at: now(),
    taskId: ctx.taskId || null, subId: ctx.subId || null, ticketId: ctx.ticketId || null
  };
  S.photos.unshift(p);
  while (S.photos.length > PHOTO_CAP) {
    const i = S.photos.map((x, k) => ({ x, k })).reverse().find(o => o.x.src.indexOf('IMG:') !== 0);
    if (!i) break;
    S.photos.splice(i.k, 1);
  }
  const t = ctx.taskId ? taskById(ctx.taskId) : null;
  if (t) {
    const sub = ctx.subId ? t.subs.find(s => s.id === ctx.subId) : null;
    hist(t, 'أرفق ' + me().name + ' صورة' + (sub ? ' على «' + sub.name + '»' : '') + ' — ' + title);
    acceptedSlots(t).forEach(a => notify(a.muhsenId, 'i-camera', 'صورة جديدة على المهمة',
      '«' + t.title + '» — ' + title, { n: 'album', id: t.id }));
  }
  if (ctx.ticketId) {
    const k = S.tickets.find(x => x.id === ctx.ticketId);
    if (k) k.replies.push({ by: S.session.id, text: 'أُرفقت صورة: ' + title, at: now(), sys: true });
  }
  return p;
}
function deletePhoto(id) {
  S.photos = (S.photos || []).filter(p => p.id !== id);
}

/* ---------- شريط الصور داخل المهمة أو المهمة الفرعية ---------- */
function photoStrip(ctx, label) {
  const list = photosFor(ctx.taskId, ctx.subId === undefined ? null : ctx.subId,
    ctx.ticketId === undefined ? null : ctx.ticketId);
  const can = ctx.subId ? canShootSub(ctx.taskId ? taskById(ctx.taskId) : null) : canMemories();
  if (!list.length && !can) return '';
  const ctxAttr = 'data-tid="' + (ctx.taskId || '') + '" data-sid="' + (ctx.subId || '') +
    '" data-kid="' + (ctx.ticketId || '') + '"';
  return '<div class="pstrip">' +
    (label ? '<div class="tiny dim2" style="margin-bottom:7px">' + E(label) +
      (list.length ? ' · ' + AR(list.length) + ' صورة' : '') + '</div>' : '') +
    '<div class="pscroll">' +
      (can ? '<button class="padd" data-a="shoot" ' + ctxAttr + '>' + icon('i-camera','s26') +
        '<span>تصوير</span></button>' : '') +
      list.map(p => '<button ' + thumbAttr(p).replace('__C__', 'pthumb') + ' data-a="viewphoto" data-id="' + p.id + '">' +
        '<span>' + E(p.title) + '</span></button>').join('') +
    '</div></div>';
}

/* ---------- ورقة العنوان والوصف بعد التصوير ---------- */
function photoMetaSheet() {
  const c = S.camCtx || {};
  const t = c.taskId ? taskById(c.taskId) : null;
  const sub = t && c.subId ? t.subs.find(s => s.id === c.subId) : null;
  const k = c.ticketId ? S.tickets.find(x => x.id === c.ticketId) : null;
  return '<div class="grip"></div><h3>عنوان الصورة ووصفها</h3>' +
    '<div class="tiny dim2" style="margin-bottom:10px">' +
      (sub ? 'مرتبطة بالمهمة الفرعية «' + E(sub.name) + '»'
        : k ? 'مرتبطة بالتذكرة «' + E(k.title) + '»'
        : t ? 'مرتبطة بمهمة «' + E(t.title) + '»' : 'صورة عامة') + '</div>' +
    (S.pendingPhoto ? '<img class="ppreview" src="' + S.pendingPhoto + '" alt="">' : '') +
    '<div class="note a" style="margin:12px 0">' + icon('i-info','s16') +
      '<span><b>العنوان والوصف يجب أن يكونا لائقين</b><br>' +
      'اربط الصورة بحدث فعلي في المهمة — لا وصفًا عشوائيًا. مثال: «استلام المفاتيح من الاستقبال» لا «صورة ١».</span></div>' +
    '<div class="lbl plain">العنوان</div>' +
    '<div class="field" style="margin:8px 0"><input id="ftitle" maxlength="60" placeholder="مثال: تسليم وجبات الوصول"></div>' +
    '<div class="lbl plain">الوصف</div>' +
    '<div class="field" style="margin:8px 0"><input id="fdesc" maxlength="140" placeholder="ماذا يوثّق هذا المشهد؟"></div>' +
    '<div class="grid2" style="margin-top:12px">' +
      '<button class="btn g" data-a="cancelshot">إلغاء</button>' +
      '<button class="btn p" data-a="savephoto">حفظ الصورة</button></div>';
}

/* ---------- عارض الصورة ---------- */
function screenPhoto() {
  const p = (S.photos || []).find(x => x.id === S.route.id);
  if (!p) return screenAlbum();
  const t = p.taskId ? taskById(p.taskId) : null;
  const sub = t && p.subId ? t.subs.find(s => s.id === p.subId) : null;
  const k = p.ticketId ? S.tickets.find(x => x.id === p.ticketId) : null;
  const by = userById(p.by);
  const mine = p.by === S.session.id && isLeader();
  return bar('الصورة', { back: 1, right:'<span style="width:30px"></span>' }) +
    '<div class="view">' + ground() +
    fullTag(p, 'pfull') +
    '<div class="c gold"><b style="font-size:15.5px;line-height:1.5">' + E(p.title) + '</b>' +
      (p.desc ? '<div class="sm dim" style="margin-top:6px">' + E(p.desc) + '</div>' : '') +
      '<div class="fl" style="margin-top:11px;gap:9px">' + (by ? avat(by, 'sm') : '') +
        '<span class="sp"><b class="tiny" style="display:block">' + E(by ? by.name : 'النظام') + '</b>' +
        '<span class="tiny dim2">' + t12(p.at) + ' · ' + hijri(p.at) + '</span></span></div></div>' +

    (t ? '<div class="lbl">مرتبطة بـ</div>' +
      '<button class="c" data-a="go" data-n="task" data-id="' + t.id + '" style="width:100%;text-align:right">' +
        '<div class="fl" style="gap:10px">' +
          '<span class="thumb bg-' + t.photo + '" style="width:48px;height:48px"></span>' +
          '<span class="sp"><b class="sm" style="display:block">' + E(t.title) + '</b>' +
          '<span class="tiny dim2">' + hijri(t.start) + ' · ' + t12(t.start) + '</span></span>' +
          icon('i-back','s16') + '</div>' +
        (sub ? '<div class="strip a" style="margin-top:9px">' + icon('i-check','s16') +
          '<span>إثبات المهمة الفرعية: ' + E(sub.name) + '</span></div>' : '') + '</button>' : '') +
    (k ? '<button class="c" data-a="go" data-n="ticket" data-id="' + k.id + '" style="width:100%;text-align:right">' +
      '<div class="row"><b class="sm">' + E(k.title) + '</b>' + pill('تذكرة','gold') + '</div></button>' : '') +

    (mine ? '<button class="btn d" data-a="delphoto" data-id="' + p.id + '">' +
      icon('i-x','s16') + 'حذف الصورة</button>' : '') +
    '</div>' + tabs();
}

/* ---------- ألبوم الصور ---------- */
function screenAlbum() {
  S.photos = S.photos || [];
  const u = me();
  const mine = myTasks().map(t => t.id);
  const list = S.photos.filter(p => !p.taskId || mine.indexOf(p.taskId) >= 0);
  const seg = (S.route.id && list.some(p => p.taskId === S.route.id)) ? S.route.id : (S.tab.alb || 'all');
  const byTask = {};
  list.forEach(p => { const k = p.taskId || 'none'; (byTask[k] = byTask[k] || []).push(p); });
  const shown = seg === 'all' ? list : (byTask[seg] || []);

  return bar('ألبوم الصور', { back: 1, right: canShoot()
      ? '<button data-a="shoot" data-tid="" data-sid="" data-kid="" aria-label="تصوير">' + icon('i-camera') + '</button>'
      : '<span style="width:30px"></span>' }) +
    '<div class="view">' + ground() +
    '<div class="c gold"><div class="row"><b class="sm">صور المهام</b>' +
      pill(AR(list.length) + ' صورة', 'gold') + '</div>' +
      '<div class="tiny dim" style="margin-top:5px">' +
      (canShoot() ? 'التصوير من داخل التطبيق فقط — والصور تبقى مع المهمة بعد انتهائها.'
                  : 'يصوّر الليدر ويوثّق، وتظهر الصور لكل من له صلاحية المهمة.') + '</div></div>' +

    (canShoot() ? '<div class="note a">' + icon('i-info','s16') +
      '<span><b>العنوان والوصف يجب أن يكونا لائقين ومرتبطين بحدث فعلي</b> — لا صورًا عامة بلا سياق.</span></div>' : '') +

    '<div class="seg">' +
      '<button class="' + (seg === 'all' ? 'on' : '') + '" data-a="seg" data-k="alb" data-v="all">الكل<i>' + AR(list.length) + '</i></button>' +
      Object.keys(byTask).filter(k => k !== 'none')
        .sort((x, y) => (x === seg ? -1 : y === seg ? 1 : 0)).slice(0, 7).map(k => {
        const t = taskById(k); if (!t) return '';
        return '<button class="' + (seg === k ? 'on' : '') + '" data-a="seg" data-k="alb" data-v="' + k + '">' +
          E(shortTitle(t.title)) + '<i>' + AR(byTask[k].length) + '</i></button>';
      }).join('') + '</div>' +

    (shown.length ? '<div class="pgrid">' + shown.map(p => {
        const t = p.taskId ? taskById(p.taskId) : null;
        return '<button class="pcard" data-a="viewphoto" data-id="' + p.id + '">' +
          '<span ' + thumbAttr(p).replace('__C__', 'ph') + '></span>' +
          '<span class="meta"><b>' + E(p.title) + '</b>' +
          '<span>' + (t ? E(t.title) : 'بلا مهمة') + ' · ' + hijri(p.at) + '</span></span></button>';
      }).join('') + '</div>'
      : '<div class="c center" style="padding:30px 16px"><b>لا توجد صور</b>' +
        '<div class="sm dim" style="margin-top:6px">' +
        (canShoot() ? 'اضغط أيقونة الكاميرا في الأعلى لتصوير أول لقطة.' : 'سيوثّق الليدر المهام بالصور.') + '</div></div>') +
    '</div>' + tabs();
}

/* ---------- بذر صور توثيقية على المهام المنتهية ---------- */
const PHOTO_SEED = [
  { img:'airport_w', t:'استقبال الحجاج في صالة الحج',      d:'وصول الفوج وبدء إجراءات الاستقبال في صالة الحج بمطار الملك عبدالعزيز.' },
  { img:'kaaba_w',   t:'توجيه الحجاج داخل المسجد الحرام',   d:'تجميع المجموعة عند باب الملك فهد قبل بدء الطواف.' },
  { img:'haram_w',   t:'إرشادات الطواف والسعي',             d:'شرح المناسك للحجاج قبل الدخول إلى صحن المطاف.' },
  { img:'mina_w',    t:'جاهزية مخيم منى',                   d:'التأكد من ترتيب الفرش وتجهيز المخيم قبل وصول الحجاج.' },
  { img:'pilgrims_w',t:'تفويج الحجاج إلى عرفة',             d:'انطلاق الحافلات من المخيم في وقتها المحدد.' },
  { img:'kaaba_w',   t:'تسليم بطاقات نُسك',                 d:'توزيع البطاقات على الحجاج والتأكد من مطابقة الأسماء.' },
  { img:'haram_w',   t:'ختام طواف الوداع',                  d:'اكتمال المجموعة بعد الطواف والعودة إلى الفندق.' },
  { img:'airport_w', t:'تسليم الأمتعة قبل المغادرة',        d:'التحقق من عدد الحقائب وتسليمها لعمال المناولة.' },
  { img:'mina_w',    t:'متابعة الرمي في الجمرات',           d:'مرافقة الحجاج ذهابًا وإيابًا والتحقق من العدد.' },
  { img:'pilgrims_w',t:'ضيافة الوجبات في المشاعر',          d:'توزيع الوجبات على الحجاج في وقتها.' }
];

function seedPhotos(st) {
  st.photos = [];
  const done = st.tasks.filter(t => t.status === 'done');
  done.forEach((t, i) => {
    const n = (typeof hasDocs === 'function' && hasDocs(t)) ? 4 : 1 + (i % 3);
    for (let k = 0; k < n; k++) {
      const s = PHOTO_SEED[(i * 3 + k) % PHOTO_SEED.length];
      const withSub = k > 0 && t.subs.filter(x => x.done).length;
      const sub = withSub ? t.subs.filter(x => x.done)[k % t.subs.filter(x => x.done).length] : null;
      st.photos.push({
        id: uid('F'), src: 'IMG:' + s.img,
        title: sub ? sub.name : s.t,
        desc: sub ? ('توثيق تنفيذ «' + sub.name + '» ضمن ' + t.title + '.') : s.d,
        by: t.leaderId, at: (t.startedAt || t.start) + (k + 1) * 40 * MIN,
        taskId: t.id, subId: sub ? sub.id : null, ticketId: null
      });
    }
  });
  st.photos.sort((a, b) => b.at - a.at);
}

/* ---------- التقاط الصورة وضغطها قبل الحفظ ---------- */
function readShot(file, cb) {
  if (!file) return cb(null);
  const fr = new FileReader();
  fr.onerror = () => cb(null);
  fr.onload = () => {
    const im = new Image();
    im.onerror = () => cb(null);
    im.onload = () => {
      const sc = Math.min(1, MAX_PHOTO_W / (im.width || MAX_PHOTO_W));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(im.width * sc));
      c.height = Math.max(1, Math.round(im.height * sc));
      const g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(im, 0, 0, c.width, c.height);
      try { cb(c.toDataURL('image/jpeg', PHOTO_Q)); } catch (e) { cb(null); }
    };
    im.src = fr.result;
  };
  fr.readAsDataURL(file);
}
function openCamera(ctx) {
  S.camCtx = ctx;
  const el = document.getElementById('cam');
  if (!el) { toast('الكاميرا غير متاحة على هذا الجهاز', 'r'); return; }
  el.value = '';
  el.click();
}

/* ---------- مرفق العذر عند الرفض ---------- */
function attachExcuse(taskId, src, title, byId) {
  S.photos = S.photos || [];
  const p = { id: uid('F'), src, title: title, desc: 'مرفق مقدَّم مع الرفض أو الإزالة',
    by: byId || S.session.id, at: now(), taskId: taskId || null, subId: null, ticketId: null, excuse: true };
  S.photos.unshift(p);
  return p.id;
}
const photoById = id => (S.photos || []).find(p => p.id === id);

/* ورقة سبب — مع إمكانية إرفاق صورة كعذر */
function reasonSheet(title, sub2, action, ph, kind, taskId, extraId) {
  title = title || 'السبب'; 
  return '<div class="grip"></div><h3>' + E(title) + '</h3>' +
    (sub2 ? '<div class="tiny dim2" style="margin-bottom:10px">' + E(sub2) + '</div>' : '') +
    '<div class="field" style="margin:10px 0"><input id="txt" placeholder="' + E(ph || 'اذكر السبب…') + '"></div>' +
    (S.pendingExcuse
      ? '<div class="c" style="padding:10px"><div class="row" style="margin-bottom:8px">' +
          '<b class="tiny">المرفق</b><button class="tiny" style="color:var(--red);font-weight:700" data-a="dropexcuse">إزالة</button></div>' +
          '<img class="ppreview" style="max-height:150px" src="' + S.pendingExcuse + '" alt=""></div>'
      : '<button class="btn l sm" data-a="shootexcuse" data-k="' + E(kind) + '" data-id="' + E(taskId || '') +
        '" data-u="' + E(extraId || '') + '">' + icon('i-clip','s16') + 'إرفاق صورة كعذر (اختياري)</button>') +
    '<div class="grid2" style="margin-top:12px">' +
      '<button class="btn g" data-a="close">تراجع</button>' +
      '<button class="btn p" ' + action + '>إرسال</button></div>';
}

/* إعادة بناء ورقة السبب بعد العودة من الكاميرا */
function reopenReason() {
  const c = S.camCtx || {};
  const t = c.taskId ? taskById(c.taskId) : null;
  const nm = t ? t.title : '';
  if (c.kind === 'resp')    return reasonSheet('سبب رفض التسكين', nm, 'data-a="doresp" data-id="' + c.taskId + '"', 'اذكر سببًا واضحًا', 'resp', c.taskId);
  if (c.kind === 'rdeleg')  return reasonSheet('سبب رفض التفويض', nm, 'data-a="dordeleg" data-id="' + c.taskId + '"', 'اذكر سببًا واضحًا', 'rdeleg', c.taskId);
  if (c.kind === 'remove')  return reasonSheet('سبب الإزالة من التسكين', nm, 'data-a="doremove" data-id="' + c.taskId + '" data-u="' + c.extraId + '"', 'سبب الإزالة', 'remove', c.taskId, c.extraId);
  if (c.kind === 'cancel')  return reasonSheet('إلغاء المهمة', 'المبرر إلزامي', 'data-a="docancel" data-id="' + c.taskId + '"', 'مبرر الإلغاء', 'cancel', c.taskId);
  return null;
}

/* عرض المرفق داخل بطاقة الطلب أو التسكين */
function excuseChip(photoId) {
  const p = photoById(photoId); if (!p) return '';
  return '<button class="fl reqtask" style="margin-top:8px" data-a="viewphoto" data-id="' + p.id + '">' +
    '<span ' + thumbAttr(p).replace('__C__', 'thumb') + ' style="width:40px;height:40px"></span>' +
    '<span class="sp" style="text-align:right"><b class="tiny" style="display:block">مرفق العذر</b>' +
    '<span class="tiny dim2">صورة مرفقة مع الرفض · ' + t12(p.at) + '</span></span>' + icon('i-eye','s16') + '</button>';
}

/* ---------- اختيار المهمة الفرعية المراد توثيقها ---------- */
function subPickSheet(t) {
  if (!t) return '<div class="grip"></div><h3>لا توجد مهمة</h3>';
  return '<div class="grip"></div><h3>توثيق مهمة فرعية بصورة</h3>' +
    '<div class="tiny dim2" style="margin-bottom:10px">اختر ما تريد إثباته — تُربط الصورة به وتبقى معه بعد انتهاء المهمة.</div>' +
    '<div class="col" style="max-height:46vh;overflow:auto;gap:7px">' +
      t.subs.map(s => {
        const n = photosFor(t.id, s.id).length;
        return '<button class="listitem" data-a="shoot" data-tid="' + t.id + '" data-sid="' + s.id + '" data-kid="">' +
          '<span class="ico">' + icon(s.done ? 'i-check' : 'i-camera', 's18') + '</span>' +
          '<span class="sp"><b style="font-size:13px;display:block">' + E(s.name) + '</b>' +
          '<span class="tiny dim2">' + (s.done ? 'منجزة ' + t12(s.at) : 'لم تُنجز بعد') +
          (n ? ' · ' + AR(n) + ' صورة' : '') + '</span></span>' + icon('i-back','s16') + '</button>';
      }).join('') + '</div>' +
    '<button class="btn g" style="margin-top:12px" data-a="close">إغلاق</button>';
}

/* ---------- قسم التوثيق داخل تفاصيل المهمة ---------- */
function taskPhotoSection(t, lead) {
  const all = taskPhotos(t.id).filter(p => !p.excuse);
  const mem = all.filter(p => !p.subId);
  const subShots = all.length - mem.length;
  const canMem = canMemories() && !['cancelled'].includes(t.status);
  if (!all.length && !canMem) return '';
  return '<div class="lbl">ميموريز المهمة<small>' + AR(mem.length) + ' صورة' +
      (subShots ? ' · و' + AR(subShots) + ' إثبات فرعية' : '') + '</small></div>' +
    '<div class="c">' +
      (canMem ? '<div class="tiny dim2" style="margin-bottom:8px">صور عامة للمهمة — تُرفع من استوديو جهازك.</div>' : '') +
      '<div class="pscroll">' +
        (canMem ? '<button class="padd" data-a="memories" data-tid="' + t.id + '">' +
          icon('i-album','s26') + '<span>رفع صور</span></button>' : '') +
        mem.map(p => '<button ' + thumbAttr(p).replace('__C__', 'pthumb') + ' data-a="viewphoto" data-id="' + p.id + '">' +
          '<span>' + E(p.title) + '</span></button>').join('') +
      '</div>' +
      (!mem.length && canMem ? '<div class="tiny dim2" style="margin-top:9px">لا توجد ميموريز بعد.</div>' : '') +
      (all.length ? '<button class="btn l sm" style="margin-top:11px" data-a="go" data-n="album" data-id="' + t.id + '">' +
        icon('i-album','s16') + 'ألبوم المهمة كاملًا</button>' : '') +
    '</div>';
}


/* شارة عدد الصور على بطاقة المهمة في القوائم */
function photoBadge(t) {
  const n = taskPhotos(t.id).filter(p => !p.excuse).length;
  return n ? pill(AR(n) + ' صورة', 'gold') : '';
}
