/* js/settings.js — Settings dialog (looks, alerts, closing, data, server backups), search, printing, CSV */
(function () {
  'use strict';
  const LR = window.LR, U = LR.util, M = LR.rules, R = LR.refs, e = U.esc, I = LR.icon, UI = LR.ui, S = LR.store;
  const SET = LR.settings = {};

  SET.LOOKS = [
    ['maroon', 'Court Maroon', '#6b161c', '#250608', '#c9a24a'], ['black', 'Barrister Black', '#2b2b2e', '#0b0b0c', '#c8c8c8'],
    ['green', 'Law Report Green', '#1f4a35', '#081a10', '#c9a24a'], ['navy', 'Navy Brief', '#1c2f55', '#080f1f', '#c9a24a'],
    ['file', 'Government File', '#c9a86b', '#7f6232', '#7a1d1d'], ['teal', 'Monsoon Teal', '#154e57', '#051c20', '#c9a24a'],
  ];
  SET.applyLook = () => {
    const s = S.data ? S.data.settings : {};
    const html = document.documentElement;
    html.dataset.look = s.look || 'maroon';
    const host = html.dataset.theme; // the viewer's own light / dark choice, when the page is shown inside Claude
    const dark = s.dark === 'dark' || (s.dark !== 'light' && (host ? host === 'dark' : window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches));
    html.dataset.dark = dark ? '1' : '0';
    try { localStorage.setItem('imdlr-look', JSON.stringify({ look: html.dataset.look, dark: html.dataset.dark })); } catch (_) {}
  };
  const saveSettings = (what) => { S.data.settings._at = Date.now(); SET.applyLook(); S.commit(what); };

  SET.looks = () => {
    const s = S.data.settings;
    const m = UI.modal({ title: 'The look of the register', width: 560,
      body: '<div class="looks">' + SET.LOOKS.map(([k, l, a, b, g]) => '<button class="look ' + (s.look === k ? 'on' : '') + '" data-look="' + k + '"><div class="sw" style="--a:' + a + ';--b:' + b + ';--g:' + g + '"></div><span>' + l + '</span></button>').join('') + '</div>' +
        '<h3 class="sec" style="margin-top:16px">Pages</h3><div class="chips">' + [['auto', 'As the computer'], ['light', 'Light paper'], ['dark', 'Dark paper']].map(([k, l]) => '<button class="chip ' + ((s.dark || 'auto') === k ? 'on' : '') + '" data-dark="' + k + '">' + l + '</button>').join('') + '</div>' +
        '<label class="ck" style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="lk-cover"' + (s.cover !== false ? ' checked' : '') + '> Open from the closed cover</label>',
      foot: '<button class="btn pri" data-primary>Done</button>' });
    m.el.querySelector('[data-primary]').onclick = () => m.close();
    m.el.onclick = (ev) => {
      const lk = ev.target.closest('[data-look]'), dk = ev.target.closest('[data-dark]');
      if (lk) { s.look = lk.dataset.look; m.el.querySelectorAll('.look').forEach((b) => b.classList.toggle('on', b === lk)); saveSettings('Changed the look'); }
      if (dk) { s.dark = dk.dataset.dark; m.el.querySelectorAll('[data-dark]').forEach((b) => b.classList.toggle('on', b === dk)); saveSettings('Changed the page colour'); }
    };
    m.el.querySelector('#lk-cover').onchange = (ev) => { s.cover = ev.target.checked; saveSettings(); };
  };

  SET.open = (tab) => {
    const s = S.data.settings, a = s.alerts;
    const fields = [
      { type: 'group', label: 'Office' },
      { k: 'orgName', label: 'Organisation' }, { k: 'orgHindi', label: 'Organisation (Hindi)' },
      { k: 'section', label: 'Section' }, { k: 'sectionHindi', label: 'Section (Hindi)' },
      { k: 'ministry', label: 'Ministry' }, { k: 'me', label: 'Your name (on this computer, for the change log)' },
      { k: 'regionsText', label: 'Regions / RMCs (one per line)', type: 'textarea', rows: 5 },
      { type: 'group', label: 'Warn me ahead (days)' },
      { k: 'a_hearing', label: 'Hearings', type: 'number', min: 1 }, { k: 'a_reply', label: 'Counter / reply and notice replies', type: 'number', min: 1 },
      { k: 'a_compliance', label: 'Compliance with orders', type: 'number', min: 1 }, { k: 'a_appeal', label: 'Last date for appeal / review', type: 'number', min: 1 },
      { k: 'a_writTarget', label: 'Target for a writ against a CAT order (days from order)', type: 'number', min: 1 }, { k: 'a_matter', label: 'Opinions and vetting due', type: 'number', min: 1 },
      { k: 'a_dola', label: 'DoLA reference without reply after (days)', type: 'number', min: 1 },
      { k: 'a_paraDays', label: 'Para-wise comments due after notice (days)', type: 'number', min: 1 }, { k: 'a_fees', label: 'Fee bill pending after (days)', type: 'number', min: 1 },
      { k: 'a_reserved', label: 'Judgment reserved longer than (days)', type: 'number', min: 1 }, { k: 'a_dormant', label: 'No hearing for (days)', type: 'number', min: 1 },
      { type: 'group', label: 'When the register is closed' },
      { k: 'autoDownload', label: 'Download a copy (JSON) to this computer', type: 'check' },
      { k: 'askBeforeClose', label: 'Ask before the browser tab is closed', type: 'check' },
      { k: 'filePrefix', label: 'File name starts with', full: true },
    ];
    const v = Object.assign({}, s, { me: S.me(), regionsText: (s.regions || []).join('\n') });
    for (const k of Object.keys(a)) v['a_' + k] = a[k];
    const dataHtml = '<div class="grp">Data</div><div class="full" style="display:flex;flex-wrap:wrap;gap:6px">' +
      '<button class="btn" type="button" data-s="download">' + I('download') + 'Download now</button>' +
      '<button class="btn" type="button" data-s="upload">' + I('upload') + 'Upload a file…</button>' +
      '<button class="btn" type="button" data-s="backups">' + I('history') + 'Server backups…</button>' +
      '<button class="btn" type="button" data-s="examples">' + (S.data.cases.some((c) => c.sample) ? 'Clear examples' : 'Add examples again') + '</button></div>' +
      '<div class="full small muted">The register is kept on the server as one JSON file (revision ' + S.rev + (S.savedBy ? ', last saved by ' + e(S.savedBy) : '') + (S.savedAt ? ' on ' + U.fmtTime(S.savedAt) : '') + '). The server keeps a backup every hour and before any upload or restore.</div>';
    fields.push({ type: 'html', full: true, html: dataHtml });
    const m = UI.form({ title: 'Settings', fields, value: v, width: 760,
      onSave: (val) => {
        for (const k of Object.keys(val)) {
          if (k.startsWith('a_')) { if (val[k]) a[k.slice(2)] = val[k]; }
          else if (k === 'regionsText') { const list = val.regionsText.split('\n').map((x) => x.trim()).filter(Boolean); if (list.length) s.regions = list; }
          else if (k === 'me') { try { localStorage.setItem('imdlr-name', val.me || 'legal'); } catch (_) {} }
          else s[k] = val[k];
        }
        saveSettings('Changed the settings');
        LR.app.renderShell();
      } });
    m.el.querySelectorAll('[data-s]').forEach((b) => { b.onclick = async () => {
      const k = b.dataset.s;
      if (k === 'download') S.download();
      if (k === 'upload') { m.close(); S.upload(); }
      if (k === 'backups') SET.backups();
      if (k === 'examples') { m.close(); LR.app.act('clear-examples'); }
    }; });
  };

  SET.backups = async () => {
    let list;
    try { list = (await S.api('/api/backups')).list; } catch (err) { UI.toast(err.message, 'err'); return; }
    const m = UI.modal({ title: 'Server backups', width: 640,
      body: '<p class="small muted" style="margin-top:0">Copies the server made of the register file. <b>Restore</b> puts one back for everyone (the present data is backed up first).</p>' +
        (list.length ? '<table class="tbl"><tr><th>Backup</th><th>Size</th><th></th></tr>' + list.slice(0, 80).map((b) => '<tr><td>' + U.fmtTime(b.at) + '<div class="muted small">' + e(b.name) + '</div></td><td class="num">' + Math.max(1, Math.round(b.size / 1024)) + ' KB</td><td style="white-space:nowrap"><a class="btn sm" href="/api/backups/' + encodeURIComponent(b.name) + '">' + I('download') + '</a> <button class="btn sm" data-restore="' + e(b.name) + '">Restore</button></td></tr>').join('') + '</table>' : '<div class="empty">No backups yet — the first is made after the first hour of use.</div>'),
      foot: '<button class="btn" data-primary>Close</button>' });
    m.el.querySelector('[data-primary]').onclick = () => m.close();
    m.el.querySelectorAll('[data-restore]').forEach((b) => { b.onclick = async () => {
      if (!(await UI.confirm('Restore the backup <b>' + e(b.dataset.restore) + '</b> for everyone?', { ok: 'Restore', danger: true, detail: 'The present data is backed up first.' }))) return;
      await S.flush();
      try {
        const j = await S.api('/api/backups/' + encodeURIComponent(b.dataset.restore) + '/restore', { method: 'POST', body: JSON.stringify({ by: S.me() }) });
        S.rev = j.meta.rev; S.data = S.migrate(j.data); S.dirty = false; S.setStatus('ok');
        m.close(); LR.app.render(); UI.toast('Backup restored.');
      } catch (err) { UI.toast(err.message, 'err'); }
    }; });
  };

  /* ---------------- search ---------------- */
  SET.search = () => {
    const m = UI.modal({ title: 'Look up by reference', width: 660, body: '<input class="field" id="sr-q" placeholder="Case no., file no., LOA / MOU no., party, region, counsel…" autofocus><div class="search-res" id="sr-r" style="margin-top:10px"></div>' });
    const q = m.el.querySelector('#sr-q'), out = m.el.querySelector('#sr-r');
    let hits = [], sel = 0;
    const run = () => {
      const t = q.value.trim();
      hits = LR.find(t, 40);
      for (const x of R.TIMELINES) if (t && U.norm([x.t, x.law, x.g].join(' ')).includes(U.norm(t))) hits.push({ kind: 'timeline', t: 'Timeline: ' + x.t, s: x.p + ' — ' + x.law, x });
      sel = 0;
      out.innerHTML = hits.map((h, i) => '<button data-i="' + i + '" class="' + (i === 0 ? 'on' : '') + '"><b>' + e(h.t) + '</b><span>' + e(h.s) + (h.tag ? ' · ' + e(h.tag) : '') + '</span></button>').join('') || (t ? '<div class="empty">Nothing found.</div>' : '<div class="small muted">Pick a result to see its complete picture.</div>');
    };
    const go = (h) => { m.close(); if (h.kind === 'timeline') { LR.app.state.tlQ = h.x.t; LR.app.go('reference', 'timelines'); } else LR.picture(h.kind, h.id); };
    q.oninput = run; run();
    q.onkeydown = (ev) => {
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); sel = Math.max(0, Math.min(hits.length - 1, sel + (ev.key === 'ArrowDown' ? 1 : -1))); out.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === sel)); }
      if (ev.key === 'Enter' && hits[sel]) go(hits[sel]);
    };
    out.onclick = (ev) => { const b = ev.target.closest('[data-i]'); if (b) go(hits[+b.dataset.i]); };
  };

  /* ---------------- printing ---------------- */
  function print(title, html) {
    if (LR.demo) { UI.toast('Demo: printing works in the installed register (this preview cannot open the print dialog).'); return; }
    let box = document.getElementById('print-area');
    if (!box) { box = document.createElement('div'); box.id = 'print-area'; box.className = 'print-only'; document.body.appendChild(box); }
    const s = S.data.settings;
    box.innerHTML = '<h1>' + e(s.orgName) + ' — ' + e(s.section) + '</h1><div class="meta">' + e(title) + ' · printed ' + U.fmtTime(Date.now()) + ' by ' + e(S.me()) + '</div>' + html;
    setTimeout(() => window.print(), 60);
  }
  SET.printCause = (k) => {
    const rows = S.data.cases.filter((c) => (c.nextDate === k && M.isOpen(c)));
    print('Cause list for ' + U.fmt(k, true), rows.length ? '<table><tr><th>#</th><th>Case</th><th>Court</th><th>Parties</th><th>Purpose</th><th>Counsel</th><th>Officer</th></tr>' + rows.map((c, i) => '<tr><td>' + (i + 1) + '</td><td>' + e(M.caseNo(c)) + '</td><td>' + e(M.courtShort(c)) + '</td><td>' + e(M.vs(c)) + '</td><td>' + e(c.nextPurpose || '') + '</td><td>' + e((M.counsel(c.counselId) || {}).name || '') + '</td><td>' + e(c.nodal || '') + '</td></tr>').join('') + '</table>' : '<p>No hearings.</p>');
  };
  SET.printActions = () => {
    const list = M.actions();
    print('Action report', ['over', 'crit', 'soon', 'up', 'watch'].map((k) => { const l = list.filter((a) => a.sev === k); return l.length ? '<h2>' + M.SEV[k] + ' (' + l.length + ')</h2><table><tr><th>Due</th><th>Reference</th><th>Action</th><th>Steps</th></tr>' + l.map((a) => '<tr><td>' + (a.due ? U.fmt(a.due) : '') + '</td><td>' + e(a.ref || '') + '<br>' + e(a.court || '') + '</td><td>' + e(a.title) + (a.note ? '<br><i>' + e(a.note) + '</i>' : '') + '</td><td>' + (a.steps || []).map(e).join('<br>') + '</td></tr>').join('') + '</table>' : ''; }).join('') || '<p>Nothing pending.</p>');
  };
  SET.printRegister = () => {
    const rows = S.data.cases.filter(M.isOpen).sort(U.by((c) => (c.region || 'zz') + M.courtShort(c) + (c.nextDate || '9')));
    print('Register of pending cases, region-wise (' + rows.length + ')', '<table><tr><th>#</th><th>Region</th><th>Case</th><th>Court</th><th>Parties</th><th>Subject</th><th>Stage</th><th>Next date</th><th>Counsel</th></tr>' + rows.map((c, i) => '<tr><td>' + (i + 1) + '</td><td>' + e(c.region || '') + '</td><td>' + e(M.caseNo(c)) + (c.contempt ? '<br><b>Contempt</b>' : '') + '</td><td>' + e(M.courtShort(c)) + '</td><td>' + e(M.vs(c)) + '</td><td>' + e(c.category || '') + '<br>' + e(c.subject || '') + '</td><td>' + e(c.stage || '') + '</td><td>' + (c.nextDate ? U.fmt(c.nextDate) : '') + '</td><td>' + e((M.counsel(c.counselId) || {}).name || '') + '</td></tr>').join('') + '</table>');
  };
  SET.printOrders = () => {
    const rows = [];
    for (const c of S.data.cases) for (const o of c.orders || []) if (o.direction) rows.push([c, o]);
    rows.sort((a, b) => (a[1].complianceDue || '9') < (b[1].complianceDue || '9') ? -1 : 1);
    print('Statement of compliance of court orders', '<table><tr><th>#</th><th>Case</th><th>Order</th><th>Direction</th><th>Comply by</th><th>Action / status</th></tr>' + rows.map(([c, o], i) => '<tr><td>' + (i + 1) + '</td><td>' + e(M.caseNo(c)) + '<br>' + e(M.courtShort(c)) + '</td><td>' + U.fmt(o.date) + '</td><td>' + e(o.direction) + '</td><td>' + (o.complianceDue ? U.fmt(o.complianceDue) : '') + '</td><td>' + e(o.action || '') + (o.compliedOn ? ' (' + U.fmt(o.compliedOn) + ')' : '') + '</td></tr>').join('') + '</table>');
  };
  SET.printCase = (c) => {
    const cn = M.counsel(c.counselId);
    print('Case sheet — ' + M.caseNo(c), '<h2>' + e(M.caseNo(c)) + ' — ' + e(M.court(c) ? M.court(c).name : '') + '</h2><p><b>' + e(c.petitioner) + '</b> versus <b>' + e(c.respondents) + '</b></p>' +
      '<table>' + [['Subject', (c.category || '') + ' — ' + (c.subject || '')], ['Relief', c.relief], ['Status / stage', c.status + ' / ' + (c.stage || '')], ['Next date', c.nextDate ? U.fmt(c.nextDate) + ' ' + (c.nextPurpose || '') : ''], ['Counsel', cn ? cn.name : ''], ['Office / officer', [c.office, c.section, c.nodal].filter(Boolean).join(' · ')], ['File no.', c.fileNo], ['Financial implication', U.money(c.amount)]].filter((r) => r[1]).map(([k, v]) => '<tr><th style="width:25%">' + k + '</th><td>' + e(v) + '</td></tr>').join('') + '</table>' +
      '<h2>Hearings</h2><table><tr><th>Date</th><th>Purpose</th><th>Proceedings</th><th>Next</th></tr>' + (c.hearings || []).slice().sort(U.by('date')).map((h) => '<tr><td>' + U.fmt(h.date) + '</td><td>' + e(h.purpose || '') + '</td><td>' + e(h.proceedings || '') + '</td><td>' + (h.nextDate ? U.fmt(h.nextDate) : '') + '</td></tr>').join('') + '</table>' +
      '<h2>Orders</h2><table><tr><th>Date</th><th>Type</th><th>Order / direction</th><th>Comply by</th><th>Action</th></tr>' + (c.orders || []).slice().sort(U.by('date')).map((o) => '<tr><td>' + U.fmt(o.date) + '</td><td>' + e(o.kind || '') + '</td><td>' + e(o.summary || '') + (o.direction ? '<br><b>Direction:</b> ' + e(o.direction) : '') + '</td><td>' + (o.complianceDue ? U.fmt(o.complianceDue) : '') + '</td><td>' + e(o.action || '') + '</td></tr>').join('') + '</table>');
  };

  /* ---------------- CSV ---------------- */
  SET.exportCases = () => {
    const rows = [['Case', 'Region', 'Court', 'Bench', 'Petitioner', 'Respondents', 'IMD is', 'Category', 'Subject', 'Office', 'Section', 'Officer', 'Counsel', 'Filed on', 'Notice on', 'Reply due', 'Counter filed', 'Status', 'Stage', 'Result', 'Next date', 'Next purpose', 'Contempt', 'Interim order', 'Amount (Rs)', 'File no', 'LIMBS', 'Notes']];
    for (const c of S.data.cases) rows.push([M.caseNo(c), c.region, M.courtShort(c), c.bench, c.petitioner, c.respondents, c.imdRole, c.category, c.subject, c.office, c.section, c.nodal, (M.counsel(c.counselId) || {}).name, c.filedOn, c.noticeOn, c.replyDue, c.counterOn, c.status, c.stage, c.result, c.nextDate, c.nextPurpose, c.contempt ? 'Yes' : '', c.stay ? (c.stayText || 'Yes') : '', c.amount, c.fileNo, c.limbs, c.notes]);
    U.download('IMD-Legal-Cases-' + U.today() + '.csv', U.csv(rows), 'text/csv;charset=utf-8');
  };
  SET.exportHearings = () => {
    const rows = [['Case', 'Court', 'Date', 'Purpose', 'Court / item', 'Attended by', 'Proceedings', 'Next date', 'Next purpose']];
    for (const c of S.data.cases) for (const h of (c.hearings || []).slice().sort(U.by('date'))) rows.push([M.caseNo(c), M.courtShort(c), h.date, h.purpose, h.item, h.attended, h.proceedings, h.nextDate, h.nextPurpose]);
    U.download('IMD-Legal-Hearings-' + U.today() + '.csv', U.csv(rows), 'text/csv;charset=utf-8');
  };
})();
