/* ============================ شاشة التحكم ============================ */
function screenAdmin() {
  const off = S.clockOffset || 0;
  const tasks = S.tasks.slice().sort((a, b) => a.start - b.start);
  const doneN = S.tasks.filter(t => t.status === 'done').length;
  return bar('شاشة التحكم', { back: 1, right:'<span style="width:30px"></span>' }) + '<div class="view">' +
    '<div class="note b">' + icon('i-info','s16') +
      '<span>هذه الشاشة للتجربة فقط وليست جزءًا من أدوار العمل. كل ما تغيّره ينعكس فورًا.</span></div>' +

    '<div class="admcard"><div class="lbl">الوقت</div>' +
      '<div class="row" style="margin:10px 0"><span class="sm">وقت التطبيق</span><b>' + t12(now()) + ' · ' + hijri(now()) + '</b></div>' +
      '<div class="row sm" style="margin-bottom:10px"><span>الإزاحة</span><b>' +
        (off === 0 ? 'بلا إزاحة' : (off > 0 ? '+' : '−') + AR(Math.abs(off)) + ' دقيقة') + '</b></div>' +
      '<div class="grid3">' +
        '<button class="btn l sm" data-a="clock" data-v="-60">‏−ساعة</button>' +
        '<button class="btn l sm" data-a="clock" data-v="0">تصفير</button>' +
        '<button class="btn l sm" data-a="clock" data-v="60">+ساعة</button></div>' +
      '<div class="grid3" style="margin-top:8px">' +
        '<button class="btn l sm" data-a="clock" data-v="-15">‏−١٥ د</button>' +
        '<button class="btn l sm" data-a="clock" data-v="15">+١٥ د</button>' +
        '<button class="btn l sm" data-a="clock" data-v="240">+٤ ساعات</button></div>' +
      '<div class="tiny" style="margin-top:9px;opacity:.75">تقديم الوقت يفتح التحضير ويُطلق التنبيهات، ويبدأ المهام آليًا عند حلول وقتها.</div></div>' +

    '<div class="admcard"><div class="lbl">الموقع</div>' +
      '<div class="row sm" style="margin:10px 0"><span>موقعي</span><b>' +
        (S.myPlace === 'site' ? 'داخل الموقع (٠٫٤ كم)' : 'خارج النطاق (٣٫٤ كم)') + '</b></div>' +
      '<div class="grid2">' +
        '<button class="btn ' + (S.myPlace === 'site' ? 'p' : 'l') + ' sm" data-a="setplace" data-v="site">داخل الموقع</button>' +
        '<button class="btn ' + (S.myPlace !== 'site' ? 'p' : 'l') + ' sm" data-a="setplace" data-v="away">خارج النطاق</button></div>' +
      '<div class="tiny" style="margin-top:9px;opacity:.75">الحضور متاح من أي موقع — والبُعد يُسجَّل ملاحظةً ويؤثر في التقييم.</div></div>' +

    '<div class="admcard"><div class="lbl">التقييم</div>' +
      '<div class="row sm" style="margin:10px 0"><span>المهام المنتهية</span><b>' + AR(doneN) + '</b></div>' +
      '<div class="grid2">' +
        '<button class="btn l sm" data-a="rateall">' + icon('i-star','s16') + 'أعد تقييم الكل</button>' +
        '<button class="btn l sm" data-a="finishsome">' + icon('i-checkc','s16') + 'أنهِ مهمة جارية</button></div>' +
      '<div class="tiny" style="margin-top:9px;opacity:.75">«أعد تقييم الكل» يعيد احتساب تقييم النظام بمعادلة الالتزام لكل مهمة منتهية.</div></div>' +

    pushBox() +

    '<div class="admcard"><div class="lbl">دليل المهام</div>' +
      '<div class="tiny" style="margin:8px 0;opacity:.75">تعليمات كل نوع مهمة: نص · صور متتابعة · فيديو قصير · ملف PDF. يقرؤها كل الفريق على كل مهمة من النوع نفسه.</div>' +
      '<button class="btn p sm" data-a="go" data-n="guide">' + icon('i-guide','s16') + 'تحرير التعليمات</button></div>' +

    '<div class="admcard"><div class="lbl">المهام</div>' +
      '<button class="btn p sm" style="margin:10px 0" data-a="addtask">' + icon('i-plus','s16') + 'إضافة مهمة جديدة</button>' +
      '<div class="col">' + tasks.map(t => {
        const L = userById(t.leaderId);
        return '<div class="admrow">' +
          '<div class="row"><b class="sm sp">' + E(t.title) + '</b>' + pill(STATUS[t.status].t, STATUS[t.status].c) + '</div>' +
          '<div class="tiny" style="opacity:.75;margin:4px 0 9px">' + E(L.name) + ' · ' + E(t.kt) + ' · ' + E(orgOf(t).type) +
            ' · ' + hijri(t.start) + ' ' + t12(t.start) + ' · ' + AR(acceptedSlots(t).length) + ' محسن</div>' +
          '<div class="grid3">' +
            '<button class="btn l sm" data-a="shift" data-id="' + t.id + '" data-v="-60">‏−ساعة</button>' +
            '<button class="btn l sm" data-a="edittask" data-id="' + t.id + '">تعديل</button>' +
            '<button class="btn l sm" data-a="shift" data-id="' + t.id + '" data-v="60">+ساعة</button></div>' +
          '<div class="grid2" style="margin-top:8px">' +
            '<button class="btn l sm" data-a="shift" data-id="' + t.id + '" data-v="-1440">أمس</button>' +
            '<button class="btn l sm" data-a="shift" data-id="' + t.id + '" data-v="1440">غدًا</button></div></div>';
      }).join('') + '</div></div>' +

    '<div class="admcard"><div class="lbl">إعادة الضبط</div>' +
      '<div class="tiny" style="margin:9px 0;opacity:.75">تُعيد كل البيانات إلى حالتها الأولى: التسكينات والردود والتنبيهات والتذاكر والتقييمات.</div>' +
      '<button class="btn d" data-a="askreset">' + icon('i-reset','s16') + 'إعادة ضبط كل شيء</button></div>' +

    '<div class="admcard"><div class="lbl">لمحة</div>' +
      '<div class="row sm" style="margin-top:8px"><span>المستخدمون</span><b>' + AR(S.users.length) + '</b></div>' +
      '<div class="row sm"><span>المهام</span><b>' + AR(S.tasks.length) + '</b></div>' +
      '<div class="row sm"><span>التذاكر</span><b>' + AR(S.tickets.length) + '</b></div>' +
      '<div class="row sm"><span>الطلبات</span><b>' + AR(S.requests.length) + '</b></div>' +
      '<div class="row sm"><span>التنبيهات</span><b>' + AR(S.notifs.length) + '</b></div></div>' +
    '</div>' + tabs();
}

/* ============================ الأوراق المنبثقة ============================ */
function textSheet(title, sub, action, extra, ph) {
  return '<div class="grip"></div><h3>' + E(title) + '</h3>' +
    (sub ? '<div class="tiny dim2" style="margin-bottom:12px">' + E(sub) + '</div>' : '') + (extra || '') +
    '<div class="field" style="margin:10px 0"><input id="txt" placeholder="' + E(ph || 'اكتب هنا…') + '"></div>' +
    '<div class="grid2" style="margin-top:12px">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" ' + action + '>إرسال</button></div>';
}
function confirmSheet(title, body, action, danger) {
  return '<div class="grip"></div><h3>' + E(title) + '</h3>' +
    '<div class="sm dim" style="margin:8px 0 14px">' + E(body) + '</div>' +
    '<div class="grid2"><button class="btn g" data-a="close">تراجع</button>' +
    '<button class="btn ' + (danger ? 'd' : 'p') + '" ' + action + '>تأكيد</button></div>';
}
function placeSheet() {
  return '<div class="grip"></div><h3>تحديد موقعي</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">وضع التجربة — التحضير اليومي من المقر، وحضور المهمة من موقعها.</div>' +
    '<div class="col">' +
      '<button class="prow" data-a="setplace" data-v="hq"><span class="ico" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#EAF0FA;color:#1B5876">' + icon('i-home','s18') + '</span>' +
        '<span class="nm sp"><b>داخل المقر</b><span>مقر البعثة — للتحضير اليومي</span></span>' + (S.myPlace === 'hq' ? icon('i-checkc','s16') : '') + '</button>' +
    '</div>' +
    '<div class="col">' +
      '<button class="prow" data-a="setplace" data-v="site"><span class="ico" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#E4F2E9;color:#0B6540">' + icon('i-target','s18') + '</span>' +
        '<span class="nm sp"><b>داخل موقع المهمة</b><span>٠٫٤ كم</span></span>' + (S.myPlace === 'site' ? icon('i-checkc','s16') : '') + '</button>' +
      '<button class="prow" data-a="setplace" data-v="away"><span class="ico" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#FBE9E7;color:#93261C">' + icon('i-pin','s18') + '</span>' +
        '<span class="nm sp"><b>خارج النطاق</b><span>٣٫٤ كم — لا يُقبل تحضير</span></span>' + (S.myPlace === 'away' ? icon('i-checkc','s16') : '') + '</button>' +
    '</div><button class="btn g" style="margin-top:12px" data-a="close">إغلاق</button>';
}
function delegSheet(t) {
  const team = teamOf(t.leaderId);
  const keep = S.delegKeep !== false;
  return '<div class="grip"></div><h3>إسناد صلاحية القيادة</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">لمهمة «' + E(t.title) + '» فقط · المفوَّض لا يملك التسكين</div>' +
    '<div class="seg" style="margin-bottom:12px">' +
      '<button class="' + (keep ? 'on' : '') + '" data-a="dkeep" data-v="1">يبقى محسنًا</button>' +
      '<button class="' + (!keep ? 'on' : '') + '" data-a="dkeep" data-v="0">ليدر فقط</button></div>' +
    (!keep ? '<div class="note a" style="margin-bottom:12px">' + icon('i-warn','s16') +
      '<span>سيُزال من التسكين إن كان مسكَّنًا — وعليك تسكين بديل.</span></div>' : '') +
    '<div class="col">' + team.map(u => {
      const a = slotOf(t, u.id);
      return '<button class="prow" data-a="dsend" data-id="' + t.id + '" data-u="' + u.id + '">' + avat(u) +
        '<span class="nm sp"><b>' + E(u.name) + '</b><span>' +
        (a && a.req === 'accepted' ? 'مسكَّن على المهمة' : 'غير مسكَّن') + '</span></span>' + pill('إسناد','gold') + '</button>';
    }).join('') + '</div>' +
    '<button class="btn g" style="margin-top:12px" data-a="close">إغلاق</button>';
}
function ticketSheet(taskId) {
  const L = isLeader();
  const tasks = myTasks();
  return '<div class="grip"></div><h3>رفع تذكرة</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">' + (L ? 'تصل إلى غرفة العمليات — الكنترول' : 'تصل إلى ليدر فريقك') + '</div>' +
    '<div class="lbl plain">التصنيف</div>' +
    '<div class="field" style="margin:8px 0"><select id="kc">' + TCATS.map(c => '<option>' + c + '</option>').join('') + '</select></div>' +
    '<div class="lbl plain">الأولوية</div>' +
    '<div class="field" style="margin:8px 0"><select id="kp">' + TPRI.map(c => '<option' + (c === 'متوسطة' ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></div>' +
    '<div class="lbl plain">المهمة</div>' +
    '<div class="field" style="margin:8px 0"><select id="kt2"><option value="">بدون ربط بمهمة</option>' +
      tasks.map(t => '<option value="' + t.id + '"' + (t.id === taskId ? ' selected' : '') + '>' + t.title + ' — ' + hijri(t.start) + '</option>').join('') + '</select></div>' +
    '<div class="lbl plain">العنوان</div>' +
    '<div class="field" style="margin:8px 0"><input id="kti" placeholder="عنوان مختصر"></div>' +
    '<div class="lbl plain">التفاصيل</div>' +
    '<div class="field" style="margin:8px 0"><input id="kb" placeholder="اشرح الحالة"></div>' +
    '<div class="grid2" style="margin-top:12px">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" data-a="sendticket">رفع التذكرة</button></div>';
}
function ticketStateSheet(k) {
  return '<div class="grip"></div><h3>حالة التذكرة</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">' + E(k.title) + '</div>' +
    '<div class="col">' + TSTATES.map(o => '<button class="prow" data-a="dostate" data-id="' + k.id + '" data-v="' + o + '">' +
      '<span class="sp b">' + o + '</span>' + (k.status === o ? icon('i-checkc','s16') : icon('i-back','s16')) + '</button>').join('') + '</div>' +
    '<button class="btn g" style="margin-top:12px" data-a="close">إغلاق</button>';
}
function ticketAssignSheet(k) {
  const team = teamOf(k.leaderId);
  return '<div class="grip"></div><h3>إسناد التذكرة</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">' + E(k.title) + '</div>' +
    '<div class="col">' + team.map(u => '<button class="prow" data-a="doassign" data-id="' + k.id + '" data-u="' + u.id + '">' +
      avat(u) + '<span class="nm sp"><b>' + E(u.name) + '</b><span>' + E(u.specialty) + '</span></span>' +
      (k.assignedTo === u.id ? icon('i-checkc','s16') : pill('إسناد','live')) + '</button>').join('') + '</div>' +
    '<button class="btn g" style="margin-top:12px" data-a="close">إغلاق</button>';
}
function flagSheet(kt, p) {
  const opts = ['مريض','حالة حرجة','نُقل للمستشفى','كرسي متحرك','متخلّف عن المجموعة','مفقود','وفاة','بلا ملاحظة'];
  return '<div class="grip"></div><h3>بلاغ عن حاج</h3>' +
    '<div class="fl" style="margin:10px 0 14px">' +
      '<span class="av ' + p.av + '"><svg viewBox="0 0 44 44"><use href="#av-' + p.g + '"/></svg></span>' +
      '<span class="nm sp"><b>' + E(p.name) + '</b><span>' + E(p.pp) + ' · غرفة ' + AR(p.room) + '</span></span></div>' +
    (p.note ? '<div class="note a" style="margin-bottom:10px">' + icon('i-edit','s16') + '<span>' + E(p.note) + '</span></div>' : '') +
    '<div class="col">' + opts.map(o => '<button class="prow" data-a="doflag" data-kt="' + kt + '" data-p="' + p.id + '" data-v="' + o + '">' +
      '<span class="sp b">' + o + '</span>' + (p.flag === o ? icon('i-checkc','s16') : icon('i-back','s16')) + '</button>').join('') + '</div>' +
    '<button class="btn l" style="margin-top:10px" data-a="pnote" data-kt="' + kt + '" data-p="' + p.id + '">' +
      icon('i-edit','s16') + 'كتابة ملاحظة أخرى</button>' +
    '<div class="tiny dim2" style="margin-top:10px">يُسجَّل البلاغ كتذكرة تصل الليدر.</div>' +
    '<button class="btn g" style="margin-top:10px" data-a="close">إغلاق</button>';
}
function assignToSheet(uid_) {
  const u = userById(uid_);
  const rows = myTasks().filter(t => !lockedForAssign(t) && !slotOf(t, uid_)).sort((a, b) => a.start - b.start);
  return '<div class="grip"></div><h3>إسناد مهمة إلى ' + E(u.name) + '</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">المهام التي لم تُقفل بعد</div>' +
    (rows.length ? '<div class="col">' + rows.map(t => {
      const b = busyIn(uid_, t);
      return '<button class="prow" ' + (b ? 'disabled style="opacity:.5"' : 'data-a="send" data-id="' + t.id + '" data-u="' + uid_ + '"') + '>' +
        '<span class="thumb bg-' + t.photo + '" style="width:42px;height:42px"></span>' +
        '<span class="nm sp"><b>' + E(t.title) + '</b><span>' + hijri(t.start) + ' ' + t12(t.start) +
        (b ? ' · مرتبط بـ«' + E(b.title) + '»' : '') + '</span></span>' +
        (b ? pill('غير متاح','no') : pill('إرسال طلب','live')) + '</button>';
    }).join('') + '</div>' : '<div class="c center dim sm">لا توجد مهام متاحة</div>') +
    '<button class="btn g" style="margin-top:12px" data-a="close">إغلاق</button>';
}
function reminderSheet() {
  const d = S.calDay || dayStart(now());
  return '<div class="grip"></div><h3>تذكير جديد</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">يصلك إشعار داخل التطبيق في الوقت المحدد</div>' +
    '<div class="lbl plain">التاريخ</div>' +
    '<div class="field" style="margin:8px 0">' + icon('i-cal','s16') +
      '<input type="date" id="qd" value="' + isoDate(d) + '"></div>' +
    '<div class="lbl plain">الوقت</div>' +
    '<div class="field" style="margin:8px 0">' + icon('i-clock','s16') +
      '<input type="time" id="qtime" value="06:00"></div>' +
    '<div class="lbl plain">الملاحظة</div>' +
    '<div class="field" style="margin:8px 0"><input id="qtxt" placeholder="مثال: تأكد من جاهزية الباصات"></div>' +
    '<div class="grid2" style="margin-top:12px">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" data-a="dorem">حفظ التذكير</button></div>';
}
function editTaskSheet(t) {
  const d = new Date(t.start);
  return '<div class="grip"></div><h3>تعديل «' + E(t.title) + '»</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">' + E(userById(t.leaderId).name) + ' · ' + E(t.kt) + '</div>' +
    '<div class="lbl plain">التاريخ</div>' +
    '<div class="field" style="margin:8px 0">' + icon('i-cal','s16') + '<input type="date" id="ed" value="' + isoDate(t.start) + '"></div>' +
    '<div class="lbl plain">وقت البداية</div>' +
    '<div class="field" style="margin:8px 0">' + icon('i-clock','s16') + '<input type="time" id="et" value="' + two(d.getHours()) + ':' + two(d.getMinutes()) + '"></div>' +
    '<div class="lbl plain">المدة بالساعات</div>' +
    '<div class="field" style="margin:8px 0"><input type="number" id="eh" min="1" max="24" value="' + t.durH + '"></div>' +
    '<div class="grid2" style="margin-top:14px">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" data-a="savetask" data-id="' + t.id + '">حفظ</button></div>';
}
function addTaskSheet() {
  const leaders = S.users.filter(u => u.role === 'leader');
  const d = new Date(now() + 3 * HR);
  return '<div class="grip"></div><h3>إضافة مهمة جديدة</h3>' +
    '<div class="lbl plain">النشاط</div>' +
    '<div class="field" style="margin:8px 0"><select id="ak">' +
      Object.entries(CAT).map(([k, c]) => '<option value="' + k + '">' + c.ar + '</option>').join('') + '</select></div>' +
    '<div class="lbl plain">الليدر</div>' +
    '<div class="field" style="margin:8px 0"><select id="al">' +
      leaders.map(l => '<option value="' + l.id + '">' + l.name + ' — ' + l.kt + ' (' + ORGS.find(o => o.id === l.orgId).type + ')</option>').join('') + '</select></div>' +
    '<div class="lbl plain">التاريخ</div>' +
    '<div class="field" style="margin:8px 0">' + icon('i-cal','s16') + '<input type="date" id="ad" value="' + isoDate(d.getTime()) + '"></div>' +
    '<div class="lbl plain">الوقت</div>' +
    '<div class="field" style="margin:8px 0">' + icon('i-clock','s16') + '<input type="time" id="at2" value="' + two(d.getHours()) + ':' + two(d.getMinutes()) + '"></div>' +
    '<div class="grid2" style="margin-top:14px">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" data-a="createtask">إضافة</button></div>';
}
function slotMenuSheet(t, muhsenId) {
  const u = userById(muhsenId), a = slotOf(t, muhsenId);
  return '<div class="grip"></div><h3>' + E(u.name) + '</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">' + E(t.title) + '</div>' +
    '<div class="col">' +
      (a && a.req === 'pending' ? '<button class="prow" data-a="withdraw" data-id="' + t.id + '" data-u="' + muhsenId + '">' +
        '<span class="sp b">سحب الطلب</span>' + icon('i-x','s16') + '</button>' : '') +
      (a && a.req === 'accepted' ? '<button class="prow" data-a="removeasg" data-id="' + t.id + '" data-u="' + muhsenId + '">' +
        '<span class="sp b">إزالة من المهمة</span>' + icon('i-x','s16') + '</button>' : '') +
      '<button class="prow" data-a="go" data-n="profile" data-id="' + muhsenId + '"><span class="sp b">الملف الشخصي</span>' + icon('i-user','s16') + '</button>' +
      '<a class="prow" href="tel:' + u.phone.replace(/[^0-9]/g,'') + '"><span class="sp b">اتصال</span>' + icon('i-phone','s16') + '</a>' +
    '</div><button class="btn g" style="margin-top:12px" data-a="close">إغلاق</button>';
}
