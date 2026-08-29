/* ============================ دليل المهام — تعليمات لكل نوع مهمة ============================ */
/* لكل نشاط دليل مستقل: خطوات نصية · صور متتابعة · فيديو قصير · ملف PDF
   يقرؤه الجميع، ويحرّره الليدر من الإعدادات */

const MAX_MEDIA = 1.6 * 1024 * 1024;    /* حد الملف المرفوع في النسخة المحلية */
const STEP_KIND = {
  text:  { l:'تعليمة مكتوبة', i:'i-text' },
  photo: { l:'صورة توضيحية',  i:'i-camera' },
  video: { l:'فيديو قصير',    i:'i-video' },
  pdf:   { l:'ملف PDF',       i:'i-file' }
};

const seededMedia = s => String(s.src).indexOf('IMG:') === 0;
const mediaKey = s => String(s.src).slice(4).replace(/_w$/, '');
const mediaSrc = s => s.src;
const guideOf = kind => (S.guides && S.guides[kind]) || null;
const guideSteps = kind => { const g = guideOf(kind); return g ? g.steps : []; };
const hasGuide = t => guideSteps(t.kind).length > 0;
const canEditGuide = () => isLeader();

function ensureGuide(kind) {
  S.guides = S.guides || {};
  if (!S.guides[kind]) S.guides[kind] = { steps: [], at: now(), by: S.session.id };
  return S.guides[kind];
}
function addStep(kind, step) {
  const g = ensureGuide(kind);
  g.steps.push(Object.assign({ id: uid('G'), at: now(), by: S.session.id }, step));
  g.at = now(); g.by = S.session.id;
}
function moveStep(kind, id, dir) {
  const g = ensureGuide(kind), i = g.steps.findIndex(s => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= g.steps.length) return;
  const tmp = g.steps[i]; g.steps[i] = g.steps[j]; g.steps[j] = tmp;
  g.at = now();
}
function delStep(kind, id) {
  const g = ensureGuide(kind);
  g.steps = g.steps.filter(s => s.id !== id);
  g.at = now();
}

/* ---------- زر «للمهمة دليل» — داخل المهمة وخارجها ---------- */
function guideChip(t, big) {
  const n = guideSteps(t.kind).length;
  if (!n) return '';
  return '<button class="gchip' + (big ? ' big' : '') + '" data-a="go" data-n="guide" data-id="' + t.kind + '">' +
    icon('i-guide', big ? 's18' : 's14') +
    '<span>' + (big ? 'دليل تنفيذ المهمة · ' + AR(n) + ' خطوة' : 'دليل') + '</span>' +
    (big ? icon('i-back','s16') : '') + '</button>';
}

/* ---------- عرض خطوة ---------- */
function stepCard(s, i, editing, kind) {
  const head = '<div class="row" style="margin-bottom:8px">' +
    '<span class="fl" style="gap:7px"><span class="gnum">' + AR(i + 1) + '</span>' +
    '<b class="sm">' + E(s.title || STEP_KIND[s.kind].l) + '</b></span>' +
    (editing ? '<span class="fl" style="gap:4px">' +
      '<button class="gbtn" data-a="stepup" data-k="' + kind + '" data-id="' + s.id + '" aria-label="أعلى">' + icon('i-down','s14') + '</button>' +
      '<button class="gbtn dn" data-a="stepdn" data-k="' + kind + '" data-id="' + s.id + '" aria-label="أسفل">' + icon('i-down','s14') + '</button>' +
      '<button class="gbtn del" data-a="stepdel" data-k="' + kind + '" data-id="' + s.id + '" aria-label="حذف">' + icon('i-x','s14') + '</button>' +
      '</span>' : pill(STEP_KIND[s.kind].l, 'gold')) + '</div>';

  let body = '';
  if (s.kind === 'text') body = '<div class="sm" style="line-height:2">' + E(s.body) + '</div>';
  else if (s.kind === 'photo') body =
    (seededMedia(s) ? '<div class="gimg bgw-' + mediaKey(s) + '" role="img"></div>'
      : '<img class="gimg" src="' + mediaSrc(s) + '" alt="' + E(s.title || '') + '">') +
    (s.body ? '<div class="tiny dim" style="margin-top:8px">' + E(s.body) + '</div>' : '');
  else if (s.kind === 'video') body =
    '<video class="gimg" src="' + mediaSrc(s) + '" controls playsinline preload="metadata"></video>' +
    (s.body ? '<div class="tiny dim" style="margin-top:8px">' + E(s.body) + '</div>' : '');
  else if (s.kind === 'pdf') body =
    '<a class="docbtn" href="' + mediaSrc(s) + '" target="_blank" rel="noopener" download="' + E(s.file || 'guide.pdf') + '">' +
      '<span class="fi"><b>PDF</b></span>' +
      '<span class="sp"><b>' + E(s.file || 'ملف الدليل') + '</b><span>' + E(s.size || '') + '</span></span>' +
      '<span class="eye">' + icon('i-eye','s16') + '</span></a>' +
    (s.body ? '<div class="tiny dim" style="margin-top:8px">' + E(s.body) + '</div>' : '');

  return '<div class="c gstep">' + head + body + '</div>';
}

/* ---------- شاشة الدليل ---------- */
function screenGuide() {
  const kind = S.route.id && CAT[S.route.id] ? S.route.id : (S.tab.gk || Object.keys(CAT)[0]);
  S.tab.gk = kind;
  const cat = CAT[kind], ui = KIND_UI[kind] || { i:'i-tasks', c:'#5A6C63' };
  const steps = guideSteps(kind);
  const edit = canEditGuide() && S.guideEdit;
  const mine = myTasks().filter(t => t.kind === kind);

  return bar('دليل المهام', { back: 1, right: canEditGuide()
      ? '<button data-a="guidedit" aria-label="تحرير">' + icon(S.guideEdit ? 'i-check' : 'i-edit') + '</button>'
      : '<span style="width:30px"></span>' }) +
    '<div class="view">' + ground() +

    '<div class="ghero" style="--kc:' + ui.c + '">' +
      '<span class="gicon">' + icon(ui.i, 's26') + '</span>' +
      '<span class="sp"><b>' + E(cat.ar) + '</b><span>' + E(cat.desc) + ' · ' +
        AR(cat.subs.length) + ' مهمة فرعية</span></span></div>' +

    '<div class="kpicker">' + Object.keys(CAT).map(k => {
      const u2 = KIND_UI[k] || { i:'i-tasks', c:'#5A6C63' };
      const n = guideSteps(k).length;
      return '<button class="' + (k === kind ? 'on' : '') + '" style="--kc:' + u2.c + '" ' +
        'data-a="go" data-n="guide" data-id="' + k + '">' + icon(u2.i, 's18') +
        '<span>' + E(shortTitle(CAT[k].ar)) + '</span>' +
        (n ? '<i>' + AR(n) + '</i>' : '') + '</button>';
    }).join('') + '</div>' +

    (edit ? '<div class="note a">' + icon('i-edit','s16') +
      '<span><b>وضع التحرير</b><br>أضف خطوات الدليل ورتّبها. ما تكتبه هنا يراه كل الفريق على كل مهمة من هذا النوع.</span></div>' +
      '<div class="grid2">' +
        '<button class="btn l sm" data-a="addstep" data-k="' + kind + '" data-v="text">' + icon('i-text','s16') + 'تعليمة</button>' +
        '<button class="btn l sm" data-a="addstep" data-k="' + kind + '" data-v="photo">' + icon('i-camera','s16') + 'صورة</button>' +
        '<button class="btn l sm" data-a="addstep" data-k="' + kind + '" data-v="video">' + icon('i-video','s16') + 'فيديو</button>' +
        '<button class="btn l sm" data-a="addstep" data-k="' + kind + '" data-v="pdf">' + icon('i-file','s16') + 'ملف PDF</button>' +
      '</div>' : '') +

    '<div class="lbl">خطوات التنفيذ<small>' + AR(steps.length) + ' خطوة</small></div>' +
    (steps.length ? steps.map((s, i) => stepCard(s, i, edit, kind)).join('')
      : '<div class="c center" style="padding:26px"><b>لا يوجد دليل لهذا النوع بعد</b>' +
        '<div class="sm dim" style="margin-top:6px">' +
        (canEditGuide() ? 'افتح التحرير من الأعلى وأضف أول خطوة.' : 'سيضيفه الليدر قريبًا.') + '</div></div>') +

    '<div class="lbl">المهام الفرعية المعتمدة<small>من الكتالوج</small></div>' +
    '<div class="c">' + cat.subs.map((n, i) =>
      '<div class="sub" style="cursor:default"><span class="gnum sm">' + AR(i + 1) + '</span>' +
      '<span class="t sp">' + E(n) + '</span></div>').join('') + '</div>' +

    (mine.length ? '<div class="lbl">مهامك من هذا النوع</div>' +
      mine.slice(0, 4).map(t => '<button class="listitem" data-a="go" data-n="task" data-id="' + t.id + '">' +
        '<span class="ico">' + icon(ui.i,'s18') + '</span>' +
        '<span class="sp"><b style="font-size:13px;display:block">' + E(t.title) + '</b>' +
        '<span class="tiny dim2">' + hijri(t.start) + ' · ' + t12(t.start) + '</span></span>' +
        icon('i-back','s16') + '</button>').join('') : '') +
    '</div>' + tabs();
}

/* ---------- أوراق التحرير ---------- */
function stepTextSheet(kind) {
  return '<div class="grip"></div><h3>تعليمة مكتوبة</h3>' +
    '<div class="tiny dim2" style="margin-bottom:10px">' + E(CAT[kind].ar) + '</div>' +
    '<div class="lbl plain">العنوان</div>' +
    '<div class="field" style="margin:8px 0"><input id="gt" maxlength="60" placeholder="مثال: قبل الوصول بساعتين"></div>' +
    '<div class="lbl plain">النص</div>' +
    '<div class="field" style="margin:8px 0"><input id="gb" maxlength="400" placeholder="اكتب التعليمة بوضوح…"></div>' +
    '<div class="grid2" style="margin-top:12px">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" data-a="savestep" data-k="' + kind + '" data-v="text">إضافة</button></div>';
}
function stepMediaSheet(kind, mk) {
  const has = !!S.pendingMedia;
  return '<div class="grip"></div><h3>' + STEP_KIND[mk].l + '</h3>' +
    '<div class="tiny dim2" style="margin-bottom:10px">' + E(CAT[kind].ar) + '</div>' +
    (has
      ? (mk === 'photo' ? '<img class="ppreview" src="' + S.pendingMedia + '" alt="">'
        : mk === 'video' ? '<video class="ppreview" src="' + S.pendingMedia + '" controls playsinline></video>'
        : '<div class="docbtn"><span class="fi"><b>PDF</b></span><span class="sp"><b>' +
          E(S.pendingMediaName || 'ملف') + '</b><span>' + E(S.pendingMediaSize || '') + '</span></span></div>')
      : '<button class="btn l" data-a="pickmedia" data-k="' + kind + '" data-v="' + mk + '">' +
        icon(STEP_KIND[mk].i,'s16') + (mk === 'photo' ? 'التقط أو اختر صورة' : mk === 'video' ? 'اختر فيديو قصيرًا' : 'اختر ملف PDF') + '</button>') +
    '<div class="note a" style="margin:11px 0">' + icon('i-info','s16') +
      '<span>الحد الأقصى ' + AR(1.6) + ' ميغابايت — لأن الدليل يُحفظ داخل الجهاز في هذه النسخة.</span></div>' +
    '<div class="lbl plain">العنوان</div>' +
    '<div class="field" style="margin:8px 0"><input id="gt" maxlength="60" placeholder="ماذا تشرح هذه الخطوة؟"></div>' +
    '<div class="lbl plain">شرح مختصر (اختياري)</div>' +
    '<div class="field" style="margin:8px 0"><input id="gb" maxlength="200" placeholder="سطر توضيحي"></div>' +
    '<div class="grid2" style="margin-top:12px">' +
      '<button class="btn g" data-a="cancelstep">إلغاء</button>' +
      '<button class="btn p' + (has ? '' : ' off') + '" ' + (has ? 'data-a="savestep" data-k="' + kind + '" data-v="' + mk + '"' : 'disabled') + '>إضافة</button></div>';
}

/* ---------- قراءة ملف الوسائط ---------- */
function readMedia(file, mk, cb) {
  if (!file) return cb(null);
  if (mk === 'photo') return readShot(file, cb);
  if (file.size > MAX_MEDIA) return cb('TOOBIG');
  const fr = new FileReader();
  fr.onerror = () => cb(null);
  fr.onload = () => cb(fr.result);
  fr.readAsDataURL(file);
}
const fileSize = n => n > 1048576 ? AR((n / 1048576).toFixed(1)) + ' م.ب' : AR(Math.round(n / 1024)) + ' ك.ب';

/* ---------- أدلة مبذورة: تعليمات حقيقية لكل نوع ---------- */
const GUIDE_SEED = {
  airport: [
    ['قبل الوصول بيوم', 'اطبع كشف الوصول من النظام وتأكد من مطابقة عدد الحجاج لرقم الرحلة، وأبلغ شركة النقل بالموعد والبوابة.'],
    ['الوصول قبل ساعتين', 'كن في صالة الحج قبل هبوط الرحلة بساعتين، وأثبت حضورك من داخل نطاق المطار — التحضير لا يُقبل من خارج ٢ كم.'],
    ['الاستقبال', 'ارفع لوحة المجموعة عند مخرج الجوازات، ووزّع الأساور قبل مغادرة الصالة، ولا تسمح بخروج حاج بلا سوار.'],
    ['العدّ قبل الصعود', 'عُدّ الحجاج مرتين: عند التجميع وعند اكتمال صعود الحافلة، وسجّل الرقم في المهمة الفرعية.'],
    ['الجوازات', 'سلّم الجوازات للسائق بكشف موقّع، واحتفظ بصورة من الكشف قبل الانطلاق.']
  ],
  checkin: [
    ['جاهزية السكن', 'ادخل الفندق قبل وصول الحجاج بساعتين، وافحص عينة من الغرف: التكييف، المياه، النظافة، عدد الأسرّة.'],
    ['استلام المفاتيح', 'استلم المفاتيح بكشف مرقّم مطابق لكشف التسكين، ووثّق الاستلام بصورة.'],
    ['استقبال الحجاج', 'ابدأ بكبار السن وذوي الحالات الصحية، ثم وزّع المفاتيح حسب الكشف لا حسب الطلب.'],
    ['الجوازات وبطاقات نُسك', 'اجمع الجوازات بكشف، وسلّم بطاقات نُسك يدًا بيد مع التحقق من الاسم.'],
    ['قبل الإغلاق', 'مُر على الأدوار واطمئن على راحة الحجاج، وسجّل أي ملاحظة على السكن كتذكرة فورًا.']
  ],
  umrah: [
    ['قبل الخروج', 'تحقق من بطاقات نُسك وإحرام الرجال، وذكّر الجميع بنقطة التجمع ورقم الباب.'],
    ['في الحرم', 'حدّد نقطة تجمع ثابتة وأعلنها، وابقَ في مؤخرة المجموعة لا في مقدمتها.'],
    ['الطواف والسعي', 'اشرح المناسك قبل الدخول لا أثناءه، وراقب كبار السن ومن يشكو الإرهاق.'],
    ['العودة', 'عُدّ المجموعة عند الباب قبل التحرك، ولا تغادر قبل اكتمال العدد.']
  ],
  tour: [
    ['التنسيق', 'أكّد الحافلة والسائق قبل الموعد بيوم، وجهّز الوجبات والمرطبات حسب العدد.'],
    ['الانطلاق', 'وزّع الحجاج على المقاعد بكشف، وتحقق من العدد قبل تحرّك الحافلة.'],
    ['في المزار', 'حدّد وقت العودة بوضوح، وابقَ عند نقطة واحدة يعرفها الجميع.'],
    ['التصوير', 'صوّر المجموعة ووثّق الجولة على المهمة — الصورة إثبات لا ذكرى.']
  ],
  mina: [
    ['جاهزية المخيم', 'تأكد من الفرش والمياه والتكييف قبل وصول الفوج، وبلّغ عن أي نقص فورًا كتذكرة.'],
    ['النقل', 'التزم بجدول التفويج المعتمد، ولا تُقلع قبل اكتمال العدد.'],
    ['التوزيع', 'وزّع الأماكن بكشف مكتوب، واجعل كبار السن قرب المخارج ودورات المياه.'],
    ['الضيافة', 'تحقق من وصول الوجبة في وقتها، وسجّل أي تأخر.']
  ],
  arafah: [
    ['الوصول', 'تأكد من وصول كل الحجاج وسجّل العدد فور الاستقرار في المخيم.'],
    ['خلال اليوم', 'راقب الحالات الصحية ووزّع المياه بانتظام — الإجهاد الحراري أخطر ما في اليوم.'],
    ['قبل الدفع', 'جهّز المجموعة للمغادرة إلى مزدلفة قبل الغروب، وأعلن نقطة التجمع مبكرًا.']
  ],
  jamarat: [
    ['قبل الخروج', 'التزم بجدول الرمي المعتمد لمجموعتك، ولا تخالفه مهما كان الضغط.'],
    ['المرافقة', 'رافق المجموعة ذهابًا وإيابًا، وحدّد نقطة تجمع بعد الرمي.'],
    ['بعد العودة', 'عُدّ الحجاج فور العودة للمخيم وسجّل العدد.']
  ],
  wada: [
    ['التجهيز', 'تأكد من إنهاء الحقائب قبل الطواف، ومن أن الجميع يحمل بطاقة نُسك.'],
    ['الطواف', 'ذكّر بأن الوداع آخر العهد بالبيت، ونظّم الخروج من باب واحد.'],
    ['العودة', 'عُدّ المجموعة قبل مغادرة الحرم.']
  ],
  checkout: [
    ['قبل يوم', 'جهّز كشف المغادرة، وأكّد ختم قائمة الركاب والتنسيق مع النقل وعمال الحقائب.'],
    ['التجميع', 'ابدأ التجميع قبل الموعد بساعتين، وتحقق من عدد الحقائب لكل حاج.'],
    ['الجوازات', 'سلّم الجوازات للسائق بكشف موقّع، واحتفظ بنسخة.'],
    ['تأكيد المغادرة', 'لا تغادر الفندق قبل تأكيد اكتمال العدد على الحافلة.']
  ]
};

function seedGuides(st) {
  st.guides = {};
  const L = st.users.find(u => u.role === 'leader');
  Object.keys(GUIDE_SEED).forEach(k => {
    st.guides[k] = {
      at: Date.now(), by: L ? L.id : null,
      steps: GUIDE_SEED[k].map((s, i) => ({
        id: uid('G'), kind: 'text', title: s[0], body: s[1],
        at: Date.now() - (10 - i) * 60000, by: L ? L.id : null
      }))
    };
  });
  /* لقطة توضيحية على دليل الاستقبال — نموذج للصور المتتابعة */
  ['airport', 'checkin', 'mina'].forEach(k => {
    if (!st.guides[k]) return;
    const img = k === 'airport' ? 'airport_w' : k === 'checkin' ? 'kaaba_w' : 'mina_w';
    st.guides[k].steps.push({
      id: uid('G'), kind: 'photo', src: 'IMG:' + img,
      title: 'مشهد مرجعي من الموسم الماضي',
      body: 'استرشد بهذا الترتيب في الموقع نفسه.',
      at: Date.now(), by: L ? L.id : null
    });
  });
}
