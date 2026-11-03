/* js/app.js — starts everything: the binder, tabs, drawing pages, clicks, keys, the cover, and closing (with download) */
(function () {
  'use strict';
  const LR = window.LR, U = LR.util, M = LR.rules, e = U.esc, I = LR.icon, UI = LR.ui, S = LR.store, V = LR.views, SET = LR.settings, Ed = LR.editors;
  const TABS = ['board', 'cases', 'notices', 'hearings', 'orders', 'counsel', 'reference', 'reports'];
  const state = { tab: 'board', sub: {}, cf: { status: 'open', sort: 'next' }, caseTab: 'summary', calMonth: null, calDay: null };
  const app = LR.app = { state };
  let closing = false, unloadDownloaded = false;

  /* ---------------- shell ---------------- */
  app.renderShell = () => {
    const s = S.data.settings;
    document.title = 'Legal Register — ' + (s.orgName || 'IMD');
    document.getElementById('app').innerHTML =
      '<div class="binder"><header class="topbar">' +
      '<a class="brand" href="#" data-act="go" data-tab="board" title="Action Board">' + LR.emblem() + '<span><span class="bt">Legal Register</span><span class="bs">' + e(s.section || 'Legal Section') + ' · IMD</span></span></a>' +
      '<nav class="subnav" id="subnav"></nav><span class="tb-spacer"></span>' +
      '<button class="emerg-pill" id="emerg-pill" data-act="emergencies" hidden></button>' +
      '<button class="tb-search" data-act="search" title="Search (/ or Ctrl K)">' + I('search') + '<span>Search</span> <kbd>/</kbd></button>' +
      '<button class="sync" id="sync" data-act="sync-now"><i></i><span>Saved on server</span></button>' +
      '<button class="tb-btn" data-act="download" title="Download the register (JSON)">' + I('download') + '</button>' +
      '<button class="tb-btn" data-act="upload" title="Upload a register file (JSON)">' + I('upload') + '</button>' +
      '<button class="tb-btn" data-act="looks" title="Look and theme">' + I('palette') + '</button>' +
      '<button class="tb-btn" data-act="settings" title="Settings">' + I('cog') + '</button>' +
      '<button class="tb-btn" data-act="close-book" title="Close the register (downloads a copy and logs out)">' + I('close') + '</button>' +
      '</header><main class="book" id="book"><section class="page left" id="pl"></section><div class="rings">' + '<span></span>'.repeat(7) + '</div><section class="page right" id="pr"></section><div class="ribbon"></div></main>' +
      '<nav class="tabs" id="tabs"></nav></div>';
    S.setStatus(S.status, S.statusMsg);
  };

  app.render = (turn) => {
    if (!S.data || !document.getElementById('pl')) return;
    SET.applyLook();
    const v = V[state.tab];
    const subs = v.subs || [];
    const sub = subs.length ? (state.sub[state.tab] || subs[0][0]) : null;
    const act = document.activeElement, key = act && act.dataset && act.dataset.change ? act.dataset.change + '|' + (act.dataset.k || '') : null;
    const caret = key && act.selectionStart != null ? [act.selectionStart, act.selectionEnd] : null;
    const pl = document.getElementById('pl'), pr = document.getElementById('pr');
    const keepL = turn ? 0 : pl.scrollTop, keepR = turn ? 0 : pr.scrollTop;
    pl.innerHTML = v.left(sub); pr.innerHTML = v.right(sub);
    pl.scrollTop = keepL; pr.scrollTop = keepR;
    document.getElementById('subnav').innerHTML = subs.map(([k, l]) => '<button class="' + (k === sub ? 'on' : '') + '" data-act="sub" data-v="' + k + '">' + e(l) + '</button>').join('');
    document.getElementById('tabs').innerHTML = TABS.map((t, i) => {
      const c = V[t].count ? V[t].count() : null;
      return '<button class="tab ' + (t === state.tab ? 'on' : '') + '" data-tab="' + t + '" data-act="go" title="' + e(V[t].label) + ' (' + (i + 1) + ')">' + I(V[t].icon) + '<span>' + e(V[t].label) + '</span>' + (c && c.n ? '<span class="n' + (c.hot ? ' hot' : '') + '">' + c.n + '</span>' : '') + '</button>';
    }).join('');
    const em = M.emergencies(), pill = document.getElementById('emerg-pill');
    if (pill) { pill.hidden = !em.length; pill.innerHTML = I('alert') + '<span>' + em.length + (em.length === 1 ? ' emergency' : ' emergencies') + '</span>'; pill.title = em.map((a) => (a.ref || '') + ': ' + a.hint).join('\n'); }
    if (turn && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const b = document.getElementById('book'); b.classList.remove('turn'); void b.offsetWidth; b.classList.add('turn');
    }
    if (key) {
      const [ch, k] = key.split('|');
      const el = document.querySelector('[data-change="' + ch + '"]' + (k ? '[data-k="' + k + '"]' : ''));
      if (el) { el.focus(); if (caret && el.setSelectionRange) try { el.setSelectionRange(caret[0], caret[1]); } catch (_) {} }
    }
  };

  app.go = (tab, sub) => {
    if (tab && V[tab]) state.tab = tab;
    if (sub) state.sub[state.tab] = sub;
    app.render(true);
    if (innerWidth <= 980) window.scrollTo({ top: 0 });
  };

  /* ---------------- actions ---------------- */
  const caseOf = (d) => M.caseById(d.id);
  const subOf = (c, list, id) => (c[list] || []).find((x) => x.id === id);
  const A = {
    go: (d) => app.go(d.tab, d.sub),
    sub: (d) => { state.sub[state.tab] = d.v; app.render(true); },
    search: () => SET.search(),
    settings: () => SET.open(),
    looks: () => SET.looks(),
    download: () => S.download(),
    upload: () => S.upload(),
    'sync-now': async () => { if (S.dirty) await S.save(); else await S.poll(); UI.toast(S.status === 'err' ? 'The server cannot be reached; changes are kept and sent when it is back.' : 'The register is saved on the server (revision ' + S.rev + ').'); },
    'close-book': () => closeBook(),
    'new-case': () => Ed.caseForm(null),
    'edit-case': (d) => Ed.caseForm(caseOf(d)),
    'open-case': (d) => { state.caseId = d.id; if (state.tab !== 'cases') { state.caseTab = 'summary'; app.go('cases'); } else app.render(); if (innerWidth <= 980) document.getElementById('pr').scrollIntoView({ behavior: 'smooth' }); },
    'case-tab': (d) => { state.caseTab = d.v; app.render(); },
    'case-menu': (d, el) => { const c = caseOf(d); UI.menu(el, [
      { label: 'Add hearing', icon: 'calendar', fn: () => Ed.hearing(c) }, { label: 'Add order / judgment', icon: 'order', fn: () => Ed.order(c) },
      { label: 'Add document', icon: 'folder', fn: () => Ed.doc(c) }, { label: 'Add letter', icon: 'mail', fn: () => Ed.letter(c) }, { label: 'Add follow-up', icon: 'check', fn: () => Ed.task(null, c.id) }, '-',
      { label: 'Print case sheet', icon: 'print', fn: () => SET.printCase(c) }, { label: 'Edit case', icon: 'edit', fn: () => Ed.caseForm(c) }]); },
    'add-hearing': (d) => Ed.hearing(caseOf(d)), 'edit-hearing': (d) => { const c = caseOf(d); Ed.hearing(c, subOf(c, 'hearings', d.sub)); },
    'add-order': (d) => Ed.order(caseOf(d)), 'edit-order': (d) => { const c = caseOf(d); Ed.order(c, subOf(c, 'orders', d.sub)); },
    'add-doc': (d) => Ed.doc(caseOf(d)), 'edit-doc': (d) => { const c = caseOf(d); Ed.doc(c, subOf(c, 'docs', d.sub)); },
    'add-letter': (d) => Ed.letter(caseOf(d)), 'edit-letter': (d) => { const c = caseOf(d); Ed.letter(c, subOf(c, 'letters', d.sub)); },
    'add-task': (d) => Ed.task(null, d.id), 'edit-task': (d) => Ed.task(S.get('tasks', d.id)),
    'task-toggle': (d) => { const t = S.get('tasks', d.id); t.done = !t.done; S.upsert('tasks', t, (t.done ? 'Done: ' : 'Reopened: ') + t.text); },
    'cases-filter': (d) => { state.cf.status = d.v; if (state.tab !== 'cases') app.go('cases'); else app.render(); },
    'sev-filter': (d) => { state.sevFilter = state.sevFilter === d.v ? '' : d.v; app.render(); },
    'act-done': (d) => {
      if (d.task) { const t = S.get('tasks', d.task); if (t) { t.done = true; S.upsert('tasks', t, 'Done: ' + t.text); return; } }
      S.data.actionState[d.key] = { at: Date.now(), done: true };
      S.commit('Marked an action done');
      UI.toast('Marked done.', '', { label: 'Undo', fn: () => { S.data.actionState[d.key] = { at: Date.now() }; S.commit(); } });
    },
    'act-snooze': (d, el) => {
      const sn = (n) => { S.data.actionState[d.key] = { at: Date.now(), snooze: U.addDays(U.today(), n) }; S.commit('Put off an action for ' + n + ' days'); UI.toast('I’ll show it again on ' + U.fmt(U.addDays(U.today(), n)) + '.'); };
      UI.menu(el, [{ label: 'Tomorrow', icon: 'snooze', fn: () => sn(1) }, { label: 'In 3 days', icon: 'snooze', fn: () => sn(3) }, { label: 'In a week', icon: 'snooze', fn: () => sn(7) }]);
    },
    'clear-examples': async () => {
      const has = S.data.cases.some((c) => c.sample);
      if (has) {
        if (!(await UI.confirm('Remove all example entries (cases, matters, notices, counsel, fee bills and follow-ups marked “Example”)?', { ok: 'Clear examples' }))) return;
        LR.sample.clearExamples(S.data); state.caseId = null; S.commit('Cleared the example entries');
      } else { LR.sample.addExamples(S.data); S.commit('Added the example entries'); }
    },
    'new-notice': () => Ed.notice(null), 'edit-notice': (d) => Ed.notice(S.get('notices', d.id)),
    'open-notice': (d) => { state.noticeId = d.id; state.sub.notices = 'notices'; state.tab === 'notices' ? app.render() : app.go('notices'); },
    'new-matter': () => Ed.matter(null), 'edit-matter': (d) => Ed.matter(S.get('matters', d.id)),
    'open-matter': (d) => { state.matterId = d.id; state.sub.notices = 'matters'; state.tab === 'notices' ? app.render() : app.go('notices'); if (innerWidth <= 980) document.getElementById('pr').scrollIntoView({ behavior: 'smooth' }); },
    picture: (d) => LR.picture(d.kind, d.id),
    'cf-clear-region': () => { state.cf.region = ''; app.render(); },
    mf: (d) => { state.mf = state.mf || { show: 'open' }; state.mf[d.k] = d.v; state.matterId = null; state.sub.notices = 'matters'; state.tab === 'notices' ? app.render() : app.go('notices'); },
    region: (d) => { state.cf = { status: 'all', sort: 'next', region: d.v }; state.caseId = null; app.go('cases'); },
    'go-proc': (d) => { state.refProc = d.v; app.go('reference', 'procedures'); },
    emergencies: () => { state.sevFilter = ''; app.go('board'); },
    'new-counsel': () => Ed.counsel(null), 'edit-counsel': (d) => Ed.counsel(S.get('counsel', d.id)),
    'open-counsel': (d) => { state.counselId = d.id; state.sub.counsel = 'counsel'; state.tab === 'counsel' ? app.render() : app.go('counsel'); },
    'new-fee': () => Ed.fee(null), 'edit-fee': (d) => Ed.fee(S.get('fees', d.id)),
    'new-court': () => Ed.court(null), 'edit-court': (d) => Ed.court(S.get('courts', d.id)),
    'open-court': (d) => { state.courtId = d.id; app.render(); },
    'new-ref': () => Ed.refNote(null), 'edit-ref': (d) => Ed.refNote(S.get('refs', d.id)), 'open-ref': (d) => { state.refId = d.id; app.render(); },
    'ref-proc': (d) => { state.refProc = d.v; app.render(); },
    'copy-tpl': (d) => copy(LR.refs.TEMPLATES[+d.v].x),
    'copy-proc': (d) => { const p = LR.refs.PROCEDURES.find((x) => x.id === d.v); copy(p.t + '\n' + p.steps.map((s, i) => (i + 1) + '. ' + s).join('\n')); },
    'cal-move': (d) => { const m = U.parse(state.calMonth || U.today().slice(0, 8) + '01'); m.setMonth(m.getMonth() + (+d.v)); state.calMonth = U.key(m).slice(0, 8) + '01'; app.render(); },
    'cal-today': () => { state.calMonth = null; state.calDay = U.today(); app.render(); },
    'cal-day': (d) => { state.calDay = d.v; app.render(); if (innerWidth <= 980) document.getElementById('pr').scrollIntoView({ behavior: 'smooth' }); },
    'orders-all': (d) => { state.ordersAll = !!d.v; app.render(); },
    'print-cause': (d) => SET.printCause(d.v), 'print-actions': () => SET.printActions(), 'print-register': () => SET.printRegister(), 'print-orders': () => SET.printOrders(),
    'print-case': (d) => SET.printCase(caseOf(d)),
    'export-cases': () => SET.exportCases(), 'export-hearings': () => SET.exportHearings(),
  };
  app.act = (name, data) => A[name] && A[name](data || {}, document.body);
  app.copy = (t) => copy(t);
  function copy(text) {
    (navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => UI.toast('Copied.'), () => {
      const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); UI.toast('Copied.'); } catch (_) { UI.toast('Could not copy; select the text instead.', 'err'); } t.remove();
    });
  }

  const CH = {
    'cf-q': U.debounce((v) => { state.cf.q = v; app.render(); }, 180),
    'cf-court': (v) => { state.cf.court = v; app.render(); }, 'cf-cat': (v) => { state.cf.cat = v; app.render(); },
    'cf-office': (v) => { state.cf.office = v; app.render(); }, 'cf-region': (v) => { state.cf.region = v; app.render(); },
    qref: U.debounce((v) => { state.qref = v; app.render(); }, 160),
    'mf-show': (v) => { state.mf.show = v; app.render(); }, 'mf-region': (v) => { state.mf.region = v; app.render(); }, 'cf-sort': (v) => { state.cf.sort = v; app.render(); },
    calc: (v, el) => { state.calc[el.dataset.k] = v; app.render(); },
    'gloss-q': U.debounce((v) => { state.glossQ = v; app.render(); }, 150),
    'tl-q': U.debounce((v) => { state.tlQ = v; app.render(); }, 150),
    'log-q': U.debounce((v) => { state.logQ = v; app.render(); }, 150),
  };

  function bind() {
    document.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-stop]')) return;
      const el = ev.target.closest('[data-act]');
      if (!el || el.closest('.modal')) return;
      const fn = A[el.dataset.act];
      if (!fn) return;
      ev.preventDefault();
      fn(Object.assign({}, el.dataset), el, ev);
    });
    const onCh = (ev) => {
      const el = ev.target.closest('[data-change]');
      if (!el || el.closest('.modal')) return;
      const fn = CH[el.dataset.change];
      if (!fn) return;
      const isText = el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search' || !el.type);
      if ((ev.type === 'input') !== isText) return;
      fn(el.value, el);
    };
    document.addEventListener('input', onCh);
    document.addEventListener('change', onCh);
    document.addEventListener('keydown', (ev) => {
      if (UI.open() || closing) return;
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); SET.search(); return; }
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); A['sync-now'](); return; }
      if (typing || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.key === '/') { ev.preventDefault(); SET.search(); }
      else if (/^[1-8]$/.test(ev.key)) app.go(TABS[+ev.key - 1]);
      else if (ev.key === 'n' || ev.key === 'N') { ev.preventDefault(); Ed.caseForm(null); }
      else if (ev.key === 'm' || ev.key === 'M') { ev.preventDefault(); Ed.matter(null); }
      else if (ev.key === '?') help();
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => SET.applyLook());
    // a new day: redraw so the Action Board moves on
    let day = U.today();
    setInterval(() => { if (U.today() !== day) { day = U.today(); app.render(); } }, 60000);

    // Closing the tab or window: download a copy, and ask if anything is not yet saved.
    window.addEventListener('beforeunload', (ev) => {
      if (closing || !S.data || LR.demo) return;
      const s = S.data.settings;
      if (s.autoDownload && !unloadDownloaded) { unloadDownloaded = true; try { S.download(true); } catch (_) {} setTimeout(() => { unloadDownloaded = false; }, 3000); }
      if (S.dirty) {
        try { const body = JSON.stringify({ baseRev: S.rev, data: S.data, by: S.me(), mode: 'save' }); if (body.length < 60000) fetch('/api/data', { method: 'PUT', body, keepalive: true, headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' }); } catch (_) {}
      }
      if (S.dirty || s.askBeforeClose) { ev.preventDefault(); ev.returnValue = ''; }
    });
  }

  function help() {
    UI.modal({ title: 'Keys and tips', width: 520, body: '<dl class="kv-list"><dt><kbd>1</kbd>–<kbd>8</kbd></dt><dd>Open a tab</dd><dt><kbd>/</kbd> or <kbd>Ctrl K</kbd></dt><dd>Search</dd><dt><kbd>N</kbd></dt><dd>New case</dd><dt><kbd>M</kbd></dt><dd>New opinion / vetting matter</dd><dt><kbd>Ctrl S</kbd></dt><dd>Save now</dd><dt><kbd>Ctrl Enter</kbd></dt><dd>Save a dialog</dd><dt><kbd>Esc</kbd></dt><dd>Close a dialog</dd></dl>' +
      '<p class="small muted">Every change is saved to the server within a second. Closing the register with the book button (top right) downloads a copy to this computer and logs out.</p>' });
  }

  /* ---------------- the cover ---------------- */
  function coverHtml(opts) {
    const s = (S.data && S.data.settings) || LR.sample.settings();
    return '<div class="cover">' + LR.emblem('emb') +
      '<div class="hi">' + e(s.orgHindi || '') + '</div><div class="en">' + e(s.orgName || '') + '</div><div class="rule"></div>' +
      '<h1>Legal Register</h1><div class="sub">' + e(s.section || '') + (s.sectionHindi ? ' · ' + e(s.sectionHindi) : '') + '<br>Cases, Hearings, Orders &amp; Ready Reference</div>' +
      (opts.button ? '<button class="open-btn" id="cover-btn">' + e(opts.button) + '</button>' : '') + (opts.note ? '<div class="note">' + opts.note + '</div>' : '') +
      '<div class="yr">' + e(s.ministry || '') + '</div></div>';
  }
  function showCover() {
    return new Promise((resolve) => {
      const w = document.createElement('div');
      w.className = 'cover-wrap';
      w.innerHTML = coverHtml({ button: 'Open the register', note: LR.demo ? 'Demo copy with example entries. The installed register first asks for the login (legal / legal_imd).' : 'Press Enter to open' });
      document.body.appendChild(w);
      const open = () => {
        document.removeEventListener('keydown', key);
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) { w.remove(); resolve(); return; }
        w.classList.add('opening'); setTimeout(() => { w.remove(); resolve(); }, 900);
      };
      const key = (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); } };
      document.addEventListener('keydown', key);
      w.querySelector('#cover-btn').onclick = open;
      w.querySelector('#cover-btn').focus();
    });
  }

  async function closeBook() {
    const s = S.data.settings;
    const ok = await UI.confirm('Close the register and log out?', { ok: 'Close the register', detail: s.autoDownload ? 'A copy of the whole register (JSON) will be downloaded to this computer. The register itself stays saved on the server.' : 'The register stays saved on the server.' });
    if (!ok) return;
    const saved = await S.flush();
    closing = true;
    let name = '';
    if (s.autoDownload) name = S.download(true);
    await S.logout();
    const w = document.createElement('div');
    w.className = 'cover-wrap';
    w.innerHTML = coverHtml({ button: 'Log in again', note: (saved ? 'The register is closed and saved on the server.' : '<b>Some changes could not reach the server.</b> They are in the downloaded copy — upload it when the server is back.') + (name ? '<br>A copy was downloaded as <b>' + e(name) + '</b>.' : '') });
    document.body.appendChild(w);
    document.getElementById('app').innerHTML = '';
    w.querySelector('#cover-btn').onclick = () => { if (LR.demo) location.reload(); else location.href = '/'; };
  }

  /* ---------------- start ---------------- */
  async function start() {
    try { const lk = JSON.parse(localStorage.getItem('imdlr-look') || 'null'); if (lk) { document.documentElement.dataset.look = lk.look; document.documentElement.dataset.dark = lk.dark; } } catch (_) {}
    try {
      await S.init();
    } catch (err) {
      if (S.out) return;
      document.getElementById('app').innerHTML = '<div class="cover-wrap">' + coverHtml({ button: 'Try again', note: 'The register could not be loaded: ' + e(err.message) }) + '</div>';
      document.getElementById('cover-btn').onclick = () => location.reload();
      return;
    }
    SET.applyLook();
    state.calDay = U.today();
    app.renderShell();
    bind();
    app.render();
    if (S.data.settings.cover !== false) await showCover();
    if (S.recovered) UI.toast('Changes from your last visit that had not reached the server were merged in and saved.');
  }
  start();
})();
