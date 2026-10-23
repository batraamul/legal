/* js/merge.js — combines two copies of the register item by item.
   Used by the server (when two people save at the same time, or "Merge" on upload)
   and by the browser. Works in Node (module.exports) and in the browser (LR.merge). */
(function (root) {
  'use strict';

  const COLLECTIONS = ['cases', 'matters', 'notices', 'rti', 'counsel', 'fees', 'courts', 'refs', 'tasks'];

  function num(v) { return typeof v === 'number' ? v : (Date.parse(v) || 0); }

  function mergeList(a, b, deleted) {
    const map = new Map();
    for (const it of (a || [])) if (it && it.id) map.set(it.id, it);
    for (const it of (b || [])) {
      if (!it || !it.id) continue;
      const cur = map.get(it.id);
      if (!cur || num(it.updatedAt) > num(cur.updatedAt)) map.set(it.id, it);
    }
    const out = [];
    for (const it of map.values()) {
      const d = deleted[it.id];
      if (d && d >= num(it.updatedAt)) continue;
      out.push(it);
    }
    return out;
  }

  /** Merge copy b into copy a. Neither argument is changed. */
  function mergeData(a, b) {
    a = a || {}; b = b || {};
    const deleted = Object.assign({}, a.deleted || {});
    for (const [k, v] of Object.entries(b.deleted || {})) if (!deleted[k] || v > deleted[k]) deleted[k] = v;

    const out = Object.assign({}, a);
    for (const c of COLLECTIONS) out[c] = mergeList(a[c], b[c], deleted);

    // Settings: the copy changed last wins as a whole.
    const sa = a.settings || {}, sb = b.settings || {};
    out.settings = num(sb._at) > num(sa._at) ? sb : sa;

    // Done / snoozed actions: per key, the later wins.
    const as = Object.assign({}, a.actionState || {});
    for (const [k, v] of Object.entries(b.actionState || {})) {
      if (!as[k] || num(v.at) > num(as[k].at)) as[k] = v;
    }
    out.actionState = as;

    // Change log: union by id, newest first, capped.
    const seen = new Set(), log = [];
    for (const e of [].concat(a.audit || [], b.audit || [])) {
      if (!e || !e.id || seen.has(e.id)) continue;
      seen.add(e.id); log.push(e);
    }
    log.sort((x, y) => num(y.at) - num(x.at));
    out.audit = log.slice(0, 600);

    // Keep tombstones for 400 days only.
    const cutoff = Date.now() - 400 * 864e5;
    for (const k of Object.keys(deleted)) if (deleted[k] < cutoff) delete deleted[k];
    out.deleted = deleted;

    out.meta = Object.assign({}, a.meta || {}, b.meta || {}, {
      updatedAt: Math.max(num((a.meta || {}).updatedAt), num((b.meta || {}).updatedAt)),
    });
    out.app = 'IMD-Legal-Register';
    out.format = 1;
    return out;
  }

  /** A quick sanity check for an uploaded file. Returns the data object or throws. */
  function validate(obj) {
    if (!obj || typeof obj !== 'object') throw new Error('The file is not a register file.');
    const d = obj.data && obj.app && !obj.cases ? obj.data : obj; // accept {app, data:{…}} wrappers too
    if (d.app && d.app !== 'IMD-Legal-Register') throw new Error('This file belongs to another program (' + d.app + ').');
    if (!Array.isArray(d.cases)) throw new Error('No case list was found in the file.');
    for (const c of COLLECTIONS) if (d[c] != null && !Array.isArray(d[c])) throw new Error('The "' + c + '" part of the file is damaged.');
    return d;
  }

  const api = { mergeData, validate, COLLECTIONS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.LR = root.LR || {}; root.LR.merge = api; }
})(typeof window !== 'undefined' ? window : globalThis);
