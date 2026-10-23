/* js/store.js — the register lives on the server as one JSON file.
   This file loads it, saves every change (merging when two people save at once),
   checks every 20 seconds for changes made by others, and handles upload / download. */
(function () {
  'use strict';
  const LR = window.LR, U = LR.util;
  const S = LR.store = { data: null, rev: 0, dirty: false, saving: false, status: 'ok', savedAt: 0, savedBy: '', online: true };
  const COLLS = ['cases', 'matters', 'notices', 'rti', 'counsel', 'fees', 'courts', 'refs', 'tasks'];
  let timer = null, poller = null, sentJson = '';

  S.me = () => { try { return localStorage.getItem('imdlr-name') || 'legal'; } catch (_) { return 'legal'; } };

  async function api(path, opt = {}) {
    if (LR.demoApi) return LR.demoApi(path, opt);
    const r = await fetch(path, Object.assign({ credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } }, opt));
    if (r.status === 401) { S.loggedOut(); throw new Error('Please log in again.'); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || ('The server answered ' + r.status));
    return j;
  }
  S.api = api;

  S.migrate = (d) => {
    d = d || {};
    d.app = 'IMD-Legal-Register'; d.format = 1;
    d.meta = d.meta || {};
    for (const c of COLLS) if (!Array.isArray(d[c])) d[c] = [];
    d.settings = Object.assign(LR.sample.settings(), d.settings || {});
    d.settings.alerts = Object.assign(LR.sample.settings().alerts, d.settings.alerts || {});
    d.actionState = d.actionState || {};
    d.audit = d.audit || [];
    d.deleted = d.deleted || {};
    if (!Array.isArray(d.settings.regions) || !d.settings.regions.length) d.settings.regions = LR.refs.REGIONS.slice();
    for (const c of d.cases) {
      for (const k of ['hearings', 'orders', 'docs', 'letters']) if (!Array.isArray(c[k])) c[k] = [];
    }
    for (const m of d.matters) if (!Array.isArray(m.history)) m.history = [];
    // The Legal Section does not run an RTI register: earlier RTI entries become "RTI — legal opinion" matters.
    if (d.rti.length) {
      for (const r of d.rti) {
        if (d.matters.some((m) => m.id === 'mt-' + r.id)) continue;
        d.matters.push({ id: 'mt-' + r.id, type: 'RTI — legal opinion', ref: r.regNo || '', receivedOn: r.receivedOn || '', dueOn: '', fromOffice: r.cpio || '',
          subject: (r.applicant ? r.applicant + ' — ' : '') + (r.subject || ''), status: r.status === 'Closed' ? 'Closed' : 'Opinion given / vetted', notes: r.notes || '', history: [], sample: r.sample, updatedAt: Date.now() });
        d.deleted[r.id] = Date.now();
      }
      d.rti = [];
      S.migrated = true;
    }
    return d;
  };

  S.init = async () => {
    const j = await api('/api/data');
    S.rev = j.meta.rev; S.savedAt = j.meta.savedAt; S.savedBy = j.meta.savedBy;
    S.data = S.migrate(j.data);
    if (j.meta.fresh || (!S.data.cases.length && !S.data.courts.length && !S.data.meta.seeded)) {
      LR.sample.seed(S.data);
      S.commit('Started the register with the court list and example entries');
    }
    if (S.migrated) { S.migrated = false; S.commit('Moved earlier RTI entries to Opinions & vetting', { silent: true }); }
    // Changes that could not reach the server last time (server was down) are merged back in.
    try {
      const left = localStorage.getItem('imdlr-unsaved');
      if (left) {
        S.data = S.migrate(LR.merge.mergeData(S.data, JSON.parse(left)));
        localStorage.removeItem('imdlr-unsaved');
        S.recovered = true;
        S.commit('Sent changes that had not reached the server earlier', { silent: true });
      }
    } catch (_) {}
    poller = setInterval(S.poll, 20000);
    window.addEventListener('online', () => { if (S.dirty) S.save(); });
  };

  S.touch = (o) => { o.updatedAt = Date.now(); return o; };
  S.audit = (what) => {
    S.data.audit.unshift({ id: U.uid('au'), at: Date.now(), by: S.me(), what: String(what).slice(0, 200) });
    if (S.data.audit.length > 600) S.data.audit.length = 600;
  };

  /** After changing S.data: commit('what was done') saves it and redraws the screen. */
  S.commit = (what, opts = {}) => {
    S.data.meta.updatedAt = Date.now();
    if (what) S.audit(what);
    S.dirty = true;
    S.setStatus('busy');
    clearTimeout(timer);
    timer = setTimeout(S.save, opts.now ? 10 : 900);
    if (!opts.silent && LR.app) LR.app.render();
  };

  S.upsert = (coll, item, what) => {
    S.touch(item);
    const list = S.data[coll];
    const i = list.findIndex((x) => x.id === item.id);
    if (i >= 0) list[i] = item; else list.push(item);
    delete S.data.deleted[item.id];
    S.commit(what);
    return item;
  };
  S.remove = (coll, id, what) => {
    const list = S.data[coll];
    const i = list.findIndex((x) => x.id === id);
    if (i < 0) return;
    const [gone] = list.splice(i, 1);
    S.data.deleted[id] = Date.now();
    S.commit(what);
    LR.ui.toast((what || 'Deleted') + '.', '', { label: 'Undo', fn: () => { S.data[coll].push(S.touch(gone)); delete S.data.deleted[id]; S.commit('Undid: ' + (what || 'delete')); } });
  };
  S.get = (coll, id) => (S.data[coll] || []).find((x) => x.id === id) || null;

  S.save = async () => {
    if (!S.dirty) return true;
    if (S.saving) { S.again = true; return false; }
    S.saving = true; S.again = false;
    sentJson = JSON.stringify(S.data);
    const sentAt = S.data.meta.updatedAt;
    try {
      const j = await api('/api/data', { method: 'PUT', body: JSON.stringify({ baseRev: S.rev, data: S.data, by: S.me(), mode: 'save' }) });
      S.rev = j.meta.rev; S.savedAt = j.meta.savedAt; S.savedBy = j.meta.savedBy;
      const changedMeanwhile = S.data.meta.updatedAt !== sentAt;
      if (j.merged && j.data) {
        S.data = S.migrate(changedMeanwhile ? LR.merge.mergeData(j.data, S.data) : j.data);
        if (LR.app) LR.app.render();
      }
      S.dirty = changedMeanwhile || !!(j.merged && changedMeanwhile);
      S.online = true;
      S.setStatus(S.dirty ? 'busy' : 'ok');
      try { localStorage.removeItem('imdlr-unsaved'); } catch (_) {}
    } catch (err) {
      S.online = false;
      S.setStatus('err', err.message);
      try { localStorage.setItem('imdlr-unsaved', sentJson); } catch (_) {}
      clearTimeout(timer); timer = setTimeout(S.save, 10000);
    } finally {
      S.saving = false;
      if (S.dirty && (S.again || S.online)) { clearTimeout(timer); timer = setTimeout(S.save, 300); }
    }
    return !S.dirty;
  };
  S.flush = async () => { clearTimeout(timer); for (let i = 0; i < 4 && S.dirty; i++) { if (S.saving) await new Promise((r) => setTimeout(r, 300)); else await S.save(); } return !S.dirty; };

  S.poll = async () => {
    if (S.saving || document.hidden) return;
    try {
      const m = await api('/api/meta');
      S.online = true;
      if (m.rev !== S.rev) {
        if (S.dirty) return S.save();                 // our save will merge
        const j = await api('/api/data');
        S.rev = j.meta.rev; S.savedAt = j.meta.savedAt; S.savedBy = j.meta.savedBy;
        S.data = S.migrate(j.data);
        if (LR.app) LR.app.render();
        if (m.savedBy && m.savedBy !== S.me()) LR.ui.toast('Brought in the changes saved by ' + m.savedBy + '.');
      }
      if (S.status === 'err' && !S.dirty) S.setStatus('ok');
    } catch (err) { S.online = false; S.setStatus('err', err.message); }
  };

  S.setStatus = (st, msg) => {
    S.status = st; S.statusMsg = msg || '';
    const el = document.getElementById('sync');
    if (!el) return;
    el.className = 'sync' + (st === 'busy' ? ' busy' : st === 'err' ? ' err' : '');
    el.querySelector('span').textContent = st === 'busy' ? 'Saving…' : st === 'err' ? 'Not saved — server unreachable' : (LR.demo ? 'Demo — saved in this browser' : 'Saved on server');
    el.title = st === 'err' ? (msg || '') + ' — changes are kept and sent when the server is back.' : 'Revision ' + S.rev + (S.savedBy ? ' · last saved by ' + S.savedBy : '') + (S.savedAt ? ' · ' + U.fmtTime(S.savedAt) : '');
  };

  /* -------- download / upload -------- */
  S.fileName = () => (S.data.settings.filePrefix || 'IMD-Legal-Register') + '-' + U.stamp() + '.json';
  S.download = (quiet) => {
    const name = S.fileName();
    if (LR.demo) { if (!quiet) LR.ui.toast('Demo: downloads are switched off here. On the server this saves ' + name + '.'); return name; }
    U.download(name, JSON.stringify(S.data, null, 1));
    if (!quiet) LR.ui.toast('Downloaded ' + name);
    return name;
  };

  S.upload = async () => {
    const f = await U.pickFile('.json,application/json');
    if (!f) return;
    let incoming;
    try { incoming = LR.merge.validate(JSON.parse(await U.readText(f))); }
    catch (err) { LR.ui.toast('This file cannot be used: ' + err.message, 'err'); return; }
    const im = incoming.meta || {};
    const msg = '<p style="margin:0 0 10px"><b>' + U.esc(f.name) + '</b><br><span class="muted small">' +
      U.plural(incoming.cases.length, 'case') + ', ' + U.plural((incoming.notices || []).length, 'notice') + ', ' + U.plural((incoming.matters || []).length, 'advisory matter') +
      (im.savedAt ? ' · saved ' + U.fmtTime(im.savedAt) + (im.savedBy ? ' by ' + U.esc(im.savedBy) : '') : '') + '</span></p>' +
      '<p style="margin:0 0 10px">The register on the server now has ' + U.plural(S.data.cases.length, 'case') + (S.savedAt ? ' (last saved ' + U.fmtTime(S.savedAt) + ')' : '') + '.</p>' +
      '<p style="margin:0;font-weight:600">Do you want to override the existing data?</p>';
    const v = await LR.ui.choose(msg, [
      { v: 'merge', label: 'No — merge, keep both' },
      { v: 'replace', label: 'Yes, override existing data', cls: 'pri' },
    ], { title: 'Upload a register file', width: 560,
      detail: '<b>Override</b> replaces everything on the server with this file. <b>Merge</b> adds what is new in the file and keeps the newer copy of anything changed in both. Either way the server first keeps a backup of the present data (Settings → Data → Server backups).' });
    if (!v) return;
    if (v === 'replace' && !(await LR.ui.confirm('Replace the whole register on the server with <b>' + U.esc(f.name) + '</b>?', { ok: 'Override', danger: true, detail: 'Everyone using the register will see the uploaded data. A backup of the present data is kept on the server.' }))) return;
    await S.flush();
    try {
      const j = await api('/api/data', { method: 'PUT', body: JSON.stringify({ baseRev: S.rev, data: incoming, by: S.me(), mode: v }) });
      S.rev = j.meta.rev; S.savedAt = j.meta.savedAt; S.savedBy = j.meta.savedBy;
      S.data = S.migrate(j.data); S.dirty = false; S.setStatus('ok');
      LR.app.render();
      LR.ui.toast(v === 'replace' ? 'The register was replaced with the uploaded file.' : 'The uploaded file was merged into the register.');
    } catch (err) { LR.ui.toast('Upload failed: ' + err.message, 'err'); }
  };

  S.loggedOut = () => {
    if (S.out) return; S.out = true;
    clearInterval(poller);
    LR.ui.toast('Your session has ended. Please log in again.', 'err');
    setTimeout(() => { location.href = '/'; }, 1600);
  };
  S.logout = async () => { clearInterval(poller); if (LR.demo) return; try { await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }); } catch (_) {} };
})();
