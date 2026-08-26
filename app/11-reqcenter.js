/* ============================ مركز الطلبات — للدورين ============================ */
const REQST = { pending: ['بانتظار الرد', 'wait'], accepted: ['مقبول', 'live'],
  rejected: ['مرفوض', 'no'], withdrawn: ['مسحوب', 'grey'] };

function reqCardFull(r, actionable) {
  const t = reqTask(r);
  const from = userById(r.from), to = userById(r.to);
  if (!from || !to) return '';
  const gno = reqGroupNo(r);
  const st = REQST[r.state] || [r.state, 'grey'];
  const urgent = r.state === 'pending' && t && t.start - now() < 3 * HR;
  const phone = to.phone ? to.phone.replace(/[^0-9]/g, '') : '';

  return '<div class="c ' + (urgent ? 'urgent' : '') + '">' +
    '<div class="row"><b style="font-size:14px">طلب ' + E(r.kind) + '</b>' + pill(st[0], st[1]) + '</div>' +

    '<div class="fl" style="gap:8px;margin:11px 0 9px;flex-wrap:wrap">' +
      avat(from, 'sm') +
      '<span class="tiny"><b>' + E(from.name) + '</b><br><span class="dim2">' +
        'من · ' + (from.role === 'leader' ? 'قائد' : 'مُحسن') + '</span></span>' +
      '<span style="color:var(--gold);display:flex">' + icon('i-back', 's16') + '</span>' +
      avat(to, 'sm') +
      '<span class="tiny"><b>' + E(to.name) + '</b><br><span class="dim2">' +
        'إلى · ' + (to.role === 'leader' ? 'قائد' : 'مُحسن') + '</span></span>' +
    '</div>' +

    (t ? '<button class="fl" data-a="go" data-n="task" data-id="' + t.id + '" style="gap:9px;width:100%;' +
        'background:#F8F6F0;border-radius:13px;padding:10px">' +
        '<span class="thumb" style="width:40px;height:40px;background-image:url(' + IMG[t.photo + '_t'] + ')"></span>' +
        '<span class="sp" style="text-align:right"><b class="tiny" style="display:block">' + E(t.title) + '</b>' +
        '<span class="tiny dim2">' + hijri(t.start) + ' · ' + t12(t.start) +
        (gno ? ' · مجموعة ' + AR(gno) : '') + '</span></span>' + icon('i-back', 's16') + '</button>' : '') +

    '<div class="row tiny dim2" style="margin-top:9px">' +
      '<span>أُرسل ' + t12(r.at) + ' · ' + hijri(r.at) + '</span>' +
      (r.respAt ? '<span>الرد ' + t12(r.respAt) + '</span>' : '<span>' + ago(r.at) + '</span>') + '</div>' +

    (r.note ? '<div class="note a" style="margin-top:9px">' + icon('i-edit', 's16') +
      '<span>ملاحظة المرسِل: ' + E(r.note) + '</span></div>' : '') +
    (r.respNote ? '<div class="note ' + (r.state === 'rejected' ? 'r' : 'g') + '" style="margin-top:8px">' +
      icon('i-info', 's16') + '<span>رد المستقبِل: ' + E(r.respNote) + '</span></div>' : '') +
    (urgent ? '<div class="strip r">' + icon('i-warn', 's16') + '<span>بقي أقل من ٣ ساعات على المهمة</span></div>' : '') +

    (actionable && r.state === 'pending' ? (function () {
      const g = t && r.groupId ? t.groups.find(x => x.id === r.groupId) : null;
      if (r.kind === 'تسكين' && g) return '<div class="grid2" style="margin-top:10px">' +
        '<button class="btn d sm" data-a="resp" data-id="' + t.id + '" data-g="' + g.id + '" data-v="0">رفض</button>' +
        '<button class="btn p sm" data-a="resp" data-id="' + t.id + '" data-g="' + g.id + '" data-v="1">قبول</button></div>';
      if (r.kind === 'استبدال' && g) return '<div class="grid2" style="margin-top:10px">' +
        '<button class="btn d sm" data-a="rswap" data-id="' + t.id + '" data-g="' + g.id + '" data-v="0">رفض</button>' +
        '<button class="btn p sm" data-a="rswap" data-id="' + t.id + '" data-g="' + g.id + '" data-v="1">قبول</button></div>';
      if (r.kind === 'تفويض' && t) return '<div class="grid2" style="margin-top:10px">' +
        '<button class="btn d sm" data-a="rdeleg" data-id="' + t.id + '" data-v="0">رفض</button>' +
        '<button class="btn p sm" data-a="rdeleg" data-id="' + t.id + '" data-v="1">قبول</button></div>';
      return '';
    })() : '') +

    (!actionable && r.state === 'pending' && r.from === S.session.id && r.groupId ?
      '<div class="grid3" style="margin-top:10px">' +
        (phone ? '<a class="btn l sm" href="tel:' + phone + '">' + icon('i-phone', 's16') + 'اتصال</a>' +
                 '<a class="btn l sm" href="https://wa.me/' + phone + '" target="_blank" rel="noopener">' + icon('i-send', 's16') + 'واتساب</a>' : '') +
        '<button class="btn d sm" data-a="withdraw" data-id="' + r.taskId + '" data-g="' + r.groupId + '">' + icon('i-x', 's16') + 'سحب</button>' +
      '</div>' +
      '<button class="btn p sm" style="margin-top:8px" data-a="replacepick" data-id="' + r.taskId + '" data-g="' + r.groupId + '">' +
        icon('i-swap', 's16') + 'سحب وإسناد لمحسن آخر</button>' : '') +
  '</div>';
}

function screenReqCenter() {
  const uid_ = S.session.id;
  const all = S.requests.slice();
  const inbox = all.filter(r => r.to === uid_ && r.state === 'pending');
  const sent = all.filter(r => r.from === uid_);
  const recv = all.filter(r => r.to === uid_);
  const done = all.filter(r => (r.from === uid_ || r.to === uid_) && r.state !== 'pending');
  const mine = all.filter(r => r.from === uid_ || r.to === uid_);
  const seg = S.tab.rq || (inbox.length ? 'inbox' : 'sent');
  const list = seg === 'inbox' ? inbox : seg === 'sent' ? sent : seg === 'recv' ? recv
    : seg === 'done' ? done : mine;

  return bar('الطلبات') + '<div class="view">' + ground() +
    '<div class="grid3">' +
      '<div class="kpi"><b style="color:#B8791A">' + AR(inbox.length) + '</b><span>بانتظار ردي</span></div>' +
      '<div class="kpi"><b>' + AR(sent.length) + '</b><span>مرسلة</span></div>' +
      '<div class="kpi"><b style="color:var(--dim)">' + AR(done.length) + '</b><span>منتهية</span></div></div>' +

    '<div class="seg" style="flex-wrap:wrap">' +
      [['inbox', 'بانتظار ردي'], ['sent', 'المرسلة'], ['recv', 'المستقبلة'], ['done', 'المنتهية'], ['all', 'الكل']]
        .map(function (x) {
          return '<button class="' + (seg === x[0] ? 'on' : '') + '" data-a="seg" data-k="rq" data-v="' + x[0] + '">' + x[1] + '</button>';
        }).join('') +
    '</div>' +

    (list.length ? list.map(function (r) { return reqCardFull(r, r.to === uid_ && r.state === 'pending'); }).join('')
      : '<div class="c center" style="padding:26px"><b>لا توجد طلبات في هذا التصنيف</b>' +
        '<div class="sm dim" style="margin-top:6px">' +
          (isLeader() ? 'ابدأ التسكين من شاشة المهام.' : 'ستصلك طلبات القائد هنا.') + '</div>' +
        (isLeader() ? '<button class="btn l sm" style="margin-top:12px" data-a="go" data-n="tasks">' +
          icon('i-tasks', 's16') + 'فتح المهام</button>' : '') + '</div>') +
    '</div>' + tabs();
}
