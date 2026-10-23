/* js/editors.js — the dialogs that add and change entries */
(function () {
  'use strict';
  const LR = window.LR, U = LR.util, R = LR.refs, M = LR.rules, UI = LR.ui, S = LR.store;
  const Ed = LR.editors = {};
  const courtOpts = () => S.data.courts.slice().sort(U.by('name')).map((c) => [c.id, c.name]);
  const counselOpts = () => S.data.counsel.slice().sort(U.by('name')).map((c) => [c.id, c.name + (c.type ? ' — ' + c.type : '')]);
  const caseOpts = () => S.data.cases.slice().sort(U.by((c) => M.caseNo(c))).map((c) => [c.id, M.caseNo(c) + ' — ' + (c.petitioner || '')]);
  const regionOpts = () => M.regions();
  const used = (k) => () => [...new Set(S.data.cases.map((c) => c[k]).filter(Boolean))].sort();

  /* ---------------- case ---------------- */
  Ed.caseForm = (c) => {
    const isNew = !c;
    c = c ? U.clone(c) : { id: U.uid('cs'), caseType: 'OA', year: String(new Date().getFullYear()), imdRole: 'Respondent', respondents: 'Union of India through the Secretary, Ministry of Earth Sciences & Ors.', status: 'Pending', stage: 'Notice received', priority: 'normal', noticeOn: U.today(), hearings: [], orders: [], docs: [], letters: [], createdAt: Date.now() };
    const m = UI.form({
      title: isNew ? 'New case' : 'Edit ' + M.caseNo(c), width: 820, value: c,
      fields: [
        { type: 'group', label: 'Case' },
        { k: 'caseType', label: 'Type', type: 'select', opts: R.CASE_TYPES },
        { type: 'html', html: '<div class="inline"><label class="f">Number<input class="field" id="cf-num" value="' + U.esc(c.number || '') + '" placeholder="1234"></label><label class="f">Year<input class="field" id="cf-yr" value="' + U.esc(c.year || '') + '" placeholder="2026"></label></div>' },
        { k: 'courtId', label: 'Court / Tribunal / Forum', type: 'select', opts: courtOpts, blank: '— choose —', req: true },
        { k: 'bench', label: 'Bench (High Courts)', type: 'select', opts: R.BENCH },
        { k: 'petitioner', label: 'Petitioner / Applicant', req: true, ph: 'e.g. R. K. Verma' },
        { k: 'imdRole', label: 'IMD is', type: 'select', opts: R.ROLES },
        { k: 'respondents', label: 'Respondents', type: 'textarea', rows: 2, ph: 'Union of India through the Secretary, MoES & Ors.' },
        { k: 'category', label: 'Subject category', type: 'select', opts: R.CATEGORIES, blank: '— choose —' },
        { k: 'priority', label: 'Priority', type: 'select', opts: R.PRIORITY },
        { k: 'subject', label: 'Subject matter', type: 'textarea', rows: 2 },
        { k: 'relief', label: 'Relief sought', type: 'textarea', rows: 2 },
        { type: 'group', label: 'Who handles it' },
        { k: 'region', label: 'Region / RMC', type: 'select', opts: regionOpts, blank: '— choose —' },
        { k: 'office', label: 'Office / unit concerned', list: used('office'), ph: 'e.g. MC Patna, Agromet Division' },
        { k: 'section', label: 'Dealing section', list: used('section') },
        { k: 'nodal', label: 'Nodal / officer-in-charge', list: used('nodal') },
        { k: 'counselId', label: 'Government counsel', type: 'select', opts: counselOpts, blank: '— none yet —' },
        { k: 'oppCounsel', label: 'Counsel for the other side' },
        { k: 'fileNo', label: 'e-Office file no.' },
        { type: 'group', label: 'Dates' },
        { k: 'filedOn', label: 'Filed on', type: 'date' },
        { k: 'noticeOn', label: 'Notice received on', type: 'date' },
        { k: 'replyDue', label: 'Counter / reply due', type: 'date' },
        { k: 'paraSentOn', label: 'Para-wise comments sent on', type: 'date' },
        { k: 'counterOn', label: 'Counter / reply filed on', type: 'date' },
        { k: 'nextDate', label: 'Next date of hearing', type: 'date' },
        { k: 'nextPurpose', label: 'Next date for', type: 'select', opts: R.HEARING_PURPOSES, blank: '—' },
        { type: 'group', label: 'Status' },
        { k: 'status', label: 'Status', type: 'select', opts: R.STATUSES },
        { k: 'stage', label: 'Stage', type: 'select', opts: R.STAGES },
        { k: 'result', label: 'Result', type: 'select', opts: R.RESULTS.map((x) => [x, x || '—']) },
        { k: 'reservedOn', label: 'Reserved for judgment on', type: 'date' },
        { k: 'contempt', label: 'Contempt matter', type: 'check' },
        { k: 'dola', label: 'DoLA involved (approval / advice / their matter)', type: 'check' },
        { k: 'dolaRef', label: 'DoLA reference no. and date' },
        { k: 'stay', label: 'Interim order / stay in force', type: 'check' },
        { k: 'stayText', label: 'Interim order — what it says', full: true },
        { k: 'amount', label: 'Financial implication (₹)', type: 'number', min: 0 },
        { k: 'limbs', label: 'LIMBS / other ID' },
        { k: 'linked', label: 'Linked / connected cases', full: true, ph: 'e.g. OA 980/2022; WP(C) 123/2026' },
        { k: 'notes', label: 'Notes', type: 'textarea', rows: 3 },
      ],
      onSave: (v) => {
        Object.assign(c, v);
        c.number = m.el.querySelector('#cf-num').value.trim();
        c.year = m.el.querySelector('#cf-yr').value.trim();
        if (!c.number) { UI.toast('Please give the case number.', 'err'); return false; }
        if (c.status === 'Reserved' && !c.reservedOn) c.reservedOn = U.today();
        if (c.sample && !isNew) delete c.sample;
        S.upsert('cases', c, (isNew ? 'Added ' : 'Changed ') + M.caseNo(c));
        LR.app.state.caseId = c.id;
        if (isNew) LR.app.go('cases');
      },
      onDelete: isNew ? null : async (mm) => {
        if (!(await UI.confirm('Delete <b>' + U.esc(M.caseNo(c)) + '</b> with its hearings, orders and documents?', { ok: 'Delete', danger: true, detail: 'You can undo straight after, and the server keeps backups.' }))) return;
        mm.close(); S.remove('cases', c.id, 'Deleted ' + M.caseNo(c));
      },
    });
  };

  /* ---------------- parts of a case ---------------- */
  function sub(c, list, item, fields, title, what, after) {
    const isNew = !item;
    const v = item ? U.clone(item) : { id: U.uid(list.slice(0, 2)) };
    if (isNew && fields.defaults) Object.assign(v, fields.defaults(c));
    UI.form({ title: (isNew ? 'Add ' : 'Edit ') + title + ' — ' + M.caseNo(c), value: v, fields: fields.list, width: 700, intro: fields.intro,
      onSave: (val) => {
        Object.assign(v, val);
        const arr = c[list] = c[list] || [];
        const i = arr.findIndex((x) => x.id === v.id);
        if (i >= 0) arr[i] = v; else arr.push(v);
        if (after) after(c, v, isNew);
        S.upsert('cases', c, (isNew ? 'Added ' : 'Changed ') + what + ' in ' + M.caseNo(c));
      },
      onDelete: isNew ? null : async (mm) => {
        if (!(await UI.confirm('Delete this ' + title.toLowerCase() + '?', { ok: 'Delete', danger: true }))) return;
        mm.close();
        c[list] = c[list].filter((x) => x.id !== v.id);
        if (after) after(c, null);
        S.upsert('cases', c, 'Deleted ' + what + ' in ' + M.caseNo(c));
      } });
  }

  Ed.hearing = (c, h) => sub(c, 'hearings', h, {
    defaults: (cc) => ({ date: cc.nextDate && cc.nextDate <= U.today() ? cc.nextDate : U.today(), purpose: cc.nextPurpose || '' }),
    intro: 'Entering the next date here updates the case’s next date of hearing.',
    list: [
      { k: 'date', label: 'Date of hearing', type: 'date', req: true },
      { k: 'purpose', label: 'Listed for', type: 'select', opts: R.HEARING_PURPOSES, blank: '—' },
      { k: 'item', label: 'Court no. / item no.', ph: 'Court 3, Item 21' },
      { k: 'attended', label: 'Attended by', ph: 'Counsel / officer' },
      { k: 'proceedings', label: 'What happened (proceedings / order in brief)', type: 'textarea', rows: 4 },
      { k: 'nextDate', label: 'Next date', type: 'date' },
      { k: 'nextPurpose', label: 'Next date for', type: 'select', opts: R.HEARING_PURPOSES, blank: '—' },
    ] }, 'hearing', 'a hearing', (cc) => M.syncNext(cc));

  Ed.order = (c, o) => {
    const ct = M.court(c);
    const rem = Object.entries(R.REMEDIES).map(([k, r]) => [k, r.label + (r.days ? ' (' + (k === 'arb-34' ? '3 months' : r.days + ' days') + ')' : '')]);
    sub(c, 'orders', o, {
      defaults: () => ({ date: U.today(), kind: 'Final order / Judgment', action: 'Decision pending', remedy: R.defaultRemedy(ct && ct.kind, c.bench) }),
      intro: 'A time-bound direction becomes a compliance deadline; an adverse final order gets a last date for appeal. Both appear on the Action Board well ahead.',
      list: [
        { k: 'date', label: 'Date of order', type: 'date', req: true },
        { k: 'kind', label: 'Type', type: 'select', opts: R.ORDER_KINDS },
        { k: 'copyOn', label: 'Copy received on', type: 'date' },
        { k: 'result', label: 'For IMD, the order is', type: 'select', opts: ['', 'In favour of IMD', 'Against IMD', 'Partly against IMD', 'Neutral / procedural'].map((x) => [x, x || '—']) },
        { k: 'summary', label: 'Order in brief', type: 'textarea', rows: 2 },
        { k: 'direction', label: 'Direction to IMD (what must be done)', type: 'textarea', rows: 2 },
        { type: 'html', full: true, html: '<div class="inline" style="align-items:flex-end"><label class="f">Time allowed<input class="field" id="od-n" type="number" min="1" placeholder="8"></label><label class="f">&nbsp;<select class="field" id="od-u"><option value="w">weeks</option><option value="d">days</option><option value="m">months</option></select></label><label class="f">from<select class="field" id="od-f"><option value="copy">receipt of copy</option><option value="order">date of order</option></select></label><button class="btn" id="od-go" type="button">Work out the date</button></div>' },
        { k: 'complianceDue', label: 'Compliance due by', type: 'date' },
        { k: 'action', label: 'Decision / action', type: 'select', opts: R.ORDER_ACTIONS },
        { k: 'remedy', label: 'Remedy if challenged', type: 'select', opts: rem, full: true },
        { k: 'compliedOn', label: 'Complied on', type: 'date' },
        { k: 'appealRef', label: 'Appeal / review filed (number, date)' },
        { k: 'notes', label: 'Notes', type: 'textarea', rows: 2 },
      ] }, 'order', 'an order', (cc, v) => { if (v && v.compliedOn && v.action !== 'Complied') v.action = 'Complied'; });
    // the "Work out the date" helper
    setTimeout(() => {
      const box = document.querySelector('.modal-back:last-of-type');
      const go = box && box.querySelector('#od-go');
      if (!go) return;
      go.onclick = () => {
        const n = +box.querySelector('#od-n').value, u = box.querySelector('#od-u').value, f = box.querySelector('#od-f').value;
        const inputs = box.querySelectorAll('input[type=date]');
        const date = inputs[0].value, copy = inputs[1].value;
        const base = f === 'copy' ? (copy || date) : date;
        if (!n || !base) { UI.toast('Enter the date of order (and copy received) and the time allowed.', 'err'); return; }
        const due = u === 'm' ? U.addMonths(base, n) : U.addDays(base, u === 'w' ? n * 7 : n);
        inputs[2].value = due;
        UI.toast('Compliance due by ' + U.fmt(due));
      };
    }, 50);
  };

  Ed.doc = (c, x) => sub(c, 'docs', x, { defaults: () => ({ date: U.today() }), list: [
    { k: 'date', label: 'Date', type: 'date' }, { k: 'kind', label: 'Kind', type: 'select', opts: R.DOC_KINDS },
    { k: 'title', label: 'Title', full: true, req: true }, { k: 'ref', label: 'Reference / letter no.' },
    { k: 'link', label: 'Where it is kept (link or shared-drive path)', ph: 'https://… or \\\\server\\legal\\…' },
    { k: 'notes', label: 'Notes', type: 'textarea', rows: 2 } ] }, 'document', 'a document');

  Ed.letter = (c, x) => sub(c, 'letters', x, { defaults: () => ({ date: U.today(), dir: 'out' }), list: [
    { k: 'date', label: 'Date', type: 'date' }, { k: 'dir', label: 'Direction', type: 'select', opts: [['out', 'Sent'], ['in', 'Received']] },
    { k: 'with', label: 'With', type: 'select', opts: R.LETTER_WITH }, { k: 'ref', label: 'Letter no.' },
    { k: 'subject', label: 'Subject', full: true, req: true }, { k: 'replyBy', label: 'Reply needed by', type: 'date' },
    { k: 'notes', label: 'Notes', type: 'textarea', rows: 2 } ] }, 'letter', 'a letter');

  /* ---------------- other registers ---------------- */
  function simple(coll, item, title, fields, what, defaults, after) {
    const isNew = !item;
    const v = item ? U.clone(item) : Object.assign({ id: U.uid(coll.slice(0, 2)), createdAt: Date.now() }, defaults || {});
    UI.form({ title: (isNew ? 'New ' : 'Edit ') + title, value: v, fields, width: 700,
      onSave: (val) => { Object.assign(v, val); if (after) after(v); if (v.sample) delete v.sample; S.upsert(coll, v, (isNew ? 'Added ' : 'Changed ') + what(v)); },
      onDelete: isNew ? null : async (mm) => {
        if (!(await UI.confirm('Delete ' + U.esc(what(v)) + '?', { ok: 'Delete', danger: true }))) return;
        mm.close(); S.remove(coll, v.id, 'Deleted ' + what(v));
      } });
  }

  Ed.task = (t, caseId) => simple('tasks', t, 'follow-up', [
    { k: 'text', label: 'What is to be done', full: true, req: true },
    { k: 'due', label: 'By', type: 'date' }, { k: 'who', label: 'With / by whom' },
    { k: 'caseId', label: 'Case', type: 'select', opts: caseOpts, blank: '— general —', full: true },
    { k: 'done', label: 'Done', type: 'check' } ], (v) => 'follow-up “' + v.text + '”', { due: U.addDays(U.today(), 3), caseId: caseId || '', done: false });

  Ed.notice = (n) => simple('notices', n, 'legal notice', [
    { k: 'kind', label: 'Kind', type: 'select', opts: R.NOTICE_KINDS }, { k: 'receivedOn', label: 'Received on', type: 'date', req: true },
    { k: 'from', label: 'From (party)', req: true }, { k: 'advocate', label: 'Through advocate' },
    { k: 'subject', label: 'Subject', type: 'textarea', rows: 2 }, { k: 'demand', label: 'Demand / claim', full: true },
    { k: 'region', label: 'Region / RMC', type: 'select', opts: regionOpts, blank: '—' }, { k: 'office', label: 'Office concerned', list: used('office') },
    { k: 'replyDue', label: 'Reply due by', type: 'date', help: 'blank = worked out: 2 months for s.80 CPC, else 30 days' },
    { k: 'repliedOn', label: 'Replied on', type: 'date' }, { k: 'replyRef', label: 'Reply letter no.' },
    { k: 'status', label: 'Status', type: 'select', opts: R.NOTICE_STATUS },
    { k: 'caseId', label: 'Became case', type: 'select', opts: caseOpts, blank: '—' },
    { k: 'notes', label: 'Notes', type: 'textarea', rows: 2 } ], (v) => v.kind + ' from ' + v.from, { kind: 'Legal notice', receivedOn: U.today(), status: 'Open' },
    (v) => { if (!v.replyDue && v.receivedOn) v.replyDue = /80/.test(v.kind) ? U.addMonths(v.receivedOn, 2) : U.addDays(v.receivedOn, 30); if (v.repliedOn && v.status === 'Open') v.status = 'Replied'; });

  /** Advisory & vetting work: LOA / MOU vetting, RTI legal opinions, recruitment / extension, administrative, DoLA references. */
  Ed.matter = (m, preset) => {
    const isNew = !m;
    const v = m ? U.clone(m) : Object.assign({ id: U.uid('mt'), type: 'LOA / MOU vetting', receivedOn: U.today(), status: 'Received', priority: 'normal', history: [], createdAt: Date.now() }, preset || {});
    const hist = (v.history || []).slice().sort(U.by('date', -1));
    const f = UI.form({ title: (isNew ? 'New matter' : 'Edit matter'), value: v, width: 760,
      intro: isNew ? 'Leave “Opinion due by” blank and it is set from the type: vetting 7 days, RTI opinion 3 days, recruitment / administrative 10 days, DoLA 30 days.' : null,
      fields: [
        { k: 'type', label: 'Type of work', type: 'select', opts: R.MATTER_TYPES.map((x) => x[0]) },
        { k: 'priority', label: 'Priority', type: 'select', opts: R.PRIORITY },
        { k: 'ref', label: 'File / e-Office / letter no.', ph: 'IMD/UAID/MOU/14/2026' },
        { k: 'receivedOn', label: 'Received in Legal Section on', type: 'date', req: true },
        { k: 'region', label: 'Region / RMC', type: 'select', opts: regionOpts, blank: '— choose —' },
        { k: 'fromOffice', label: 'From (division / office)', list: () => [...new Set(S.data.matters.map((x) => x.fromOffice).filter(Boolean))] },
        { k: 'subject', label: 'Subject', type: 'textarea', rows: 2, req: true },
        { k: 'party', label: 'Other party (for LOA / MOU)' }, { k: 'value', label: 'Value (₹)', type: 'number', min: 0 },
        { k: 'dueOn', label: 'Opinion due by', type: 'date' }, { k: 'assigned', label: 'Dealt by' },
        { k: 'status', label: 'Status', type: 'select', opts: R.MATTER_STATUS },
        { k: 'opinionOn', label: 'Opinion given / vetted on', type: 'date' },
        { k: 'dolaRef', label: 'DoLA reference no.' }, { k: 'dolaOn', label: 'Referred to DoLA on', type: 'date' },
        { k: 'caseId', label: 'Related court case', type: 'select', opts: caseOpts, blank: '—', full: true },
        { k: 'advice', label: 'Opinion / vetting in brief', type: 'textarea', rows: 3 },
        { k: 'note', label: 'Add to the movement log (what happened today)', full: true, ph: 'e.g. Sent back to the division for the approved draft' },
        { type: 'html', full: true, html: hist.length ? '<div class="small muted" style="margin-top:-4px">' + hist.map((x) => '<div>' + U.fmt(x.date) + ' — ' + U.esc(x.note) + '</div>').join('') + '</div>' : '' },
        { k: 'notes', label: 'Notes', type: 'textarea', rows: 2 },
      ],
      onSave: (val) => {
        const note = val.note; delete val.note;
        Object.assign(v, val);
        if (!v.dueOn && v.receivedOn) v.dueOn = U.addDays(v.receivedOn, R.matterDays(v.type));
        if (v.opinionOn && !R.MATTER_DONE.includes(v.status)) v.status = 'Opinion given / vetted';
        if (v.dolaOn && v.status === 'Received') v.status = 'Referred to DoLA';
        v.history = v.history || [];
        if (note) v.history.push({ date: U.today(), note });
        if (isNew) v.history.push({ date: v.receivedOn, note: 'Received from ' + (v.fromOffice || 'the office') + '.' });
        if (v.sample) delete v.sample;
        S.upsert('matters', v, (isNew ? 'Added ' : 'Changed ') + R.matterShort(v.type).toLowerCase() + ' matter ' + (v.ref || ''));
        LR.app.state.matterId = v.id;
      },
      onDelete: isNew ? null : async (mm) => {
        if (!(await UI.confirm('Delete this matter?', { ok: 'Delete', danger: true }))) return;
        mm.close(); S.remove('matters', v.id, 'Deleted matter ' + (v.ref || ''));
      } });
    return f;
  };

  Ed.counsel = (c) => simple('counsel', c, 'counsel', [
    { k: 'name', label: 'Name', req: true }, { k: 'type', label: 'Engaged as', type: 'select', opts: R.COUNSEL_TYPES },
    { k: 'courts', label: 'Courts / benches', full: true }, { k: 'phone', label: 'Phone' }, { k: 'email', label: 'E-mail' },
    { k: 'address', label: 'Chamber / address', full: true }, { k: 'termFrom', label: 'Engaged from', type: 'date' }, { k: 'termTo', label: 'Engaged up to', type: 'date' },
    { k: 'notes', label: 'Notes', type: 'textarea', rows: 2 } ], (v) => 'counsel ' + v.name, { type: 'CGSC' });

  Ed.fee = (f) => simple('fees', f, 'fee bill', [
    { k: 'counselId', label: 'Counsel', type: 'select', opts: counselOpts, blank: '—', req: true },
    { k: 'caseId', label: 'Case', type: 'select', opts: caseOpts, blank: '—' },
    { k: 'billNo', label: 'Bill no.' }, { k: 'billDate', label: 'Bill date', type: 'date' },
    { k: 'stage', label: 'For (appearances / drafting)', full: true }, { k: 'amount', label: 'Amount (₹)', type: 'number', min: 0 },
    { k: 'status', label: 'Status', type: 'select', opts: R.FEE_STATUS }, { k: 'paidOn', label: 'Paid on', type: 'date' },
    { k: 'notes', label: 'Notes', type: 'textarea', rows: 2 } ], (v) => 'fee bill ' + (v.billNo || ''), { billDate: U.today(), status: 'Received' },
    (v) => { if (v.paidOn) v.status = 'Paid'; });

  Ed.court = (c) => simple('courts', c, 'court / forum', [
    { k: 'name', label: 'Full name', full: true, req: true }, { k: 'short', label: 'Short name' },
    { k: 'kind', label: 'Kind', type: 'select', opts: R.COURT_KINDS }, { k: 'place', label: 'Place' },
    { k: 'site', label: 'Website / case status page', full: true }, { k: 'notes', label: 'Notes', type: 'textarea', rows: 2 } ],
    (v) => v.short || v.name, { kind: 'cat' });

  Ed.refNote = (r) => simple('refs', r, 'reference note', [
    { k: 'title', label: 'Title', full: true, req: true }, { k: 'cat', label: 'Group', list: () => [...new Set(S.data.refs.map((x) => x.cat).filter(Boolean))] },
    { k: 'source', label: 'Source (OM / judgment / rule)' },
    { k: 'body', label: 'Text', type: 'textarea', rows: 10 } ], (v) => 'note “' + v.title + '”', {});
})();
