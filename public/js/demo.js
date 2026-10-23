/* js/demo.js — used only in the demo build: a stand-in for the server that keeps the register in this browser.
   The real app talks to server.js instead; this file is not loaded by index.html. */
(function () {
  'use strict';
  const LR = window.LR;
  LR.demo = true;
  const KEY = 'imdlr-demo-v2';
  let db = null;
  try { db = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) {}
  if (!db) db = { app: 'IMD-Legal-Register', format: 1, meta: { rev: 0, fresh: true }, settings: {}, cases: [], matters: [], notices: [], rti: [], counsel: [], fees: [], courts: [], refs: [], tasks: [], actionState: {}, audit: [], deleted: {} };
  const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (_) {} };
  const meta = () => ({ rev: db.meta.rev || 0, savedAt: db.meta.savedAt || 0, savedBy: db.meta.savedBy || '', fresh: !!db.meta.fresh });
  const copy = (o) => JSON.parse(JSON.stringify(o));
  LR.demoApi = async (path, opt = {}) => {
    await new Promise((r) => setTimeout(r, 40));
    const method = (opt.method || 'GET').toUpperCase();
    if (path === '/api/meta') return meta();
    if (path === '/api/data' && method === 'GET') return { meta: meta(), data: copy(db) };
    if (path === '/api/data' && method === 'PUT') {
      const b = JSON.parse(opt.body);
      const incoming = LR.merge.validate(b.data);
      let out, merged = false;
      if (b.mode === 'replace') out = incoming;
      else if (b.mode === 'merge' || b.baseRev !== db.meta.rev) { out = LR.merge.mergeData(db, incoming); merged = true; }
      else out = incoming;
      out = copy(out);
      out.meta = Object.assign({}, out.meta, { rev: (db.meta.rev || 0) + 1, savedAt: Date.now(), savedBy: b.by || 'legal' });
      delete out.meta.fresh;
      db = out; keep();
      return { meta: meta(), merged, data: merged || b.mode !== 'save' ? copy(db) : undefined };
    }
    if (path === '/api/backups') return { list: [] };
    throw new Error('Not available in the demo.');
  };
  LR.demoReset = () => { try { localStorage.removeItem(KEY); } catch (_) {} location.reload(); };
})();
