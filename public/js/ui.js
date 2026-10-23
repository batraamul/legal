/* js/ui.js — dialogs built from a list of fields, confirm/choice, toasts, menus */
(function () {
  'use strict';
  const LR = window.LR, U = LR.util, e = U.esc;
  const UI = LR.ui = {};
  let stack = 0;

  UI.modal = ({ title, body, foot, width, onClose, cls }) => {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = '<div class="modal ' + (cls || '') + '" role="dialog" aria-modal="true" style="--w:' + (width || 640) + 'px"><header><h2>' + e(title || '') + '</h2><button class="icon-btn" data-x title="Close (Esc)">' + LR.icon('x') + '</button></header><div class="mb">' + (body || '') + '</div>' + (foot ? '<footer>' + foot + '</footer>' : '') + '</div>';
    document.body.appendChild(back);
    stack++;
    const m = back.querySelector('.modal');
    let closed = false;
    const close = (v) => { if (closed) return; closed = true; stack--; back.remove(); document.removeEventListener('keydown', key, true); if (onClose) onClose(v); };
    const key = (ev) => {
      if (back !== document.querySelector('.modal-back:last-of-type')) return;
      if (ev.key === 'Escape') { ev.stopPropagation(); close(); }
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { const b = m.querySelector('[data-primary]'); if (b) { ev.preventDefault(); b.click(); } }
    };
    document.addEventListener('keydown', key, true);
    back.addEventListener('mousedown', (ev) => { if (ev.target === back) back.dataset.down = '1'; });
    back.addEventListener('click', (ev) => { if (ev.target === back && back.dataset.down) close(); back.dataset.down = ''; });
    m.querySelector('[data-x]').onclick = () => close();
    setTimeout(() => { const f = m.querySelector('[autofocus], .mb input:not([type=checkbox]), .mb select, .mb textarea'); if (f) f.focus(); }, 30);
    return { el: m, close };
  };
  UI.open = () => stack > 0;

  function opts(list, v) {
    return (list || []).map((o) => {
      const [val, lab] = Array.isArray(o) ? o : [o, o];
      return '<option value="' + e(val) + '"' + (String(val) === String(v == null ? '' : v) ? ' selected' : '') + '>' + e(lab) + '</option>';
    }).join('');
  }
  function fieldHtml(f, v, id) {
    if (f.type === 'group') return '<div class="grp">' + e(f.label) + '</div>';
    if (f.type === 'html') return '<div class="' + (f.full ? 'full' : '') + '">' + f.html + '</div>';
    if (f.type === 'check') return '<label class="ck ' + (f.full ? 'full' : '') + '"><input type="checkbox" id="' + id + '"' + (v ? ' checked' : '') + '> ' + e(f.label) + '</label>';
    let inp;
    const ph = f.ph ? ' placeholder="' + e(f.ph) + '"' : '';
    if (f.type === 'textarea') inp = '<textarea class="field" id="' + id + '" rows="' + (f.rows || 3) + '"' + ph + '>' + e(v || '') + '</textarea>';
    else if (f.type === 'select') inp = '<select class="field" id="' + id + '">' + (f.blank != null ? '<option value="">' + e(f.blank) + '</option>' : '') + opts(typeof f.opts === 'function' ? f.opts() : f.opts, v) + '</select>';
    else {
      const list = f.list ? ' list="' + id + '-l"' : '';
      inp = '<input class="field" id="' + id + '" type="' + (f.type || 'text') + '" value="' + e(v == null ? '' : v) + '"' + ph + list + (f.step ? ' step="' + f.step + '"' : '') + (f.min != null ? ' min="' + f.min + '"' : '') + '>';
      if (f.list) inp += '<datalist id="' + id + '-l">' + (typeof f.list === 'function' ? f.list() : f.list).map((x) => '<option value="' + e(x) + '">').join('') + '</datalist>';
    }
    return '<label class="f ' + (f.full || f.type === 'textarea' ? 'full' : '') + '">' + e(f.label) + (f.help ? ' <span class="help">' + e(f.help) + '</span>' : '') + inp + '</label>';
  }

  /** A form dialog. fields: [{k,label,type,opts,full,help,ph,list,rows}] */
  UI.form = ({ title, fields, value = {}, onSave, saveLabel, onDelete, deleteLabel, width, intro, extra }) => {
    const P = 'f' + Math.random().toString(36).slice(2, 7);
    const body = (intro ? '<div class="hint" style="margin-top:0">' + intro + '</div>' : '') + '<div class="form">' + fields.map((f, i) => fieldHtml(f, value[f.k], P + '-' + i)).join('') + '</div>';
    const foot = (onDelete ? '<button class="btn danger l" data-del>' + LR.icon('trash') + e(deleteLabel || 'Delete') + '</button>' : '') +
      (extra || []).map((x, i) => '<button class="btn ' + (x.cls || '') + '" data-extra="' + i + '">' + e(x.label) + '</button>').join('') +
      '<button class="btn" data-cancel>Cancel</button><button class="btn pri" data-primary>' + e(saveLabel || 'Save') + '</button>';
    const m = UI.modal({ title, body, foot, width: width || 680 });
    const read = () => {
      const out = {};
      fields.forEach((f, i) => {
        if (!f.k) return;
        const el = m.el.querySelector('#' + P + '-' + i);
        if (!el) return;
        let v = f.type === 'check' ? el.checked : el.value;
        if (f.type === 'number') v = v === '' ? null : Number(v);
        else if (typeof v === 'string') v = v.trim();
        out[f.k] = v;
      });
      return out;
    };
    m.el.querySelector('[data-cancel]').onclick = () => m.close();
    m.el.querySelector('[data-primary]').onclick = () => {
      const v = read();
      for (const f of fields) if (f.req && !v[f.k]) { UI.toast('Please fill in “' + f.label + '”.', 'err'); return; }
      if (onSave(v, m) !== false) m.close();
    };
    if (onDelete) m.el.querySelector('[data-del]').onclick = () => { onDelete(m); };
    (extra || []).forEach((x, i) => { m.el.querySelector('[data-extra="' + i + '"]').onclick = () => x.act(read(), m); });
    m.read = read; m.P = P;
    m.input = (k) => { const i = fields.findIndex((f) => f.k === k); return m.el.querySelector('#' + P + '-' + i); };
    return m;
  };

  UI.confirm = (msg, { title, ok, danger, detail } = {}) => new Promise((res) => {
    const m = UI.modal({ title: title || 'Please confirm', width: 480,
      body: '<p style="margin:0 0 6px;font-size:14px">' + msg + '</p>' + (detail ? '<p class="muted small" style="margin:0">' + detail + '</p>' : ''),
      foot: '<button class="btn" data-n>Cancel</button><button class="btn ' + (danger ? 'danger' : 'pri') + '" data-primary>' + e(ok || 'OK') + '</button>',
      onClose: (v) => res(!!v) });
    m.el.querySelector('[data-n]').onclick = () => m.close(false);
    m.el.querySelector('[data-primary]').onclick = () => m.close(true);
  });

  /** Several choices: [{v, label, cls}] → resolves with v, or null on cancel. */
  UI.choose = (msg, choices, { title, width, detail } = {}) => new Promise((res) => {
    const m = UI.modal({ title: title || 'Choose', width: width || 520,
      body: '<div style="font-size:14px">' + msg + '</div>' + (detail ? '<div class="muted small" style="margin-top:8px">' + detail + '</div>' : ''),
      foot: '<button class="btn l" data-n>Cancel</button>' + choices.map((c, i) => '<button class="btn ' + (c.cls || '') + '" data-c="' + i + '"' + (c.cls && c.cls.includes('pri') ? ' data-primary' : '') + '>' + e(c.label) + '</button>').join(''),
      onClose: (v) => res(v == null ? null : v) });
    m.el.querySelector('[data-n]').onclick = () => m.close(null);
    m.el.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => m.close(choices[+b.dataset.c].v); });
  });

  UI.toast = (msg, kind, action) => {
    let box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast' + (kind === 'err' ? ' err' : '');
    t.innerHTML = '<span>' + e(msg) + '</span>' + (action ? '<button>' + e(action.label) + '</button>' : '');
    if (action) t.querySelector('button').onclick = () => { action.fn(); t.remove(); };
    box.appendChild(t);
    setTimeout(() => t.remove(), action ? 8000 : kind === 'err' ? 6000 : 3200);
  };

  UI.menu = (anchor, items) => {
    document.querySelectorAll('.menu').forEach((m) => m.remove());
    const m = document.createElement('div');
    m.className = 'menu';
    m.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : '<button data-i="' + i + '">' + (it.icon ? LR.icon(it.icon) : '') + e(it.label) + '</button>').join('');
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect();
    const w = m.offsetWidth, h = m.offsetHeight;
    m.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) + 'px';
    m.style.top = (r.bottom + h + 8 > window.innerHeight ? Math.max(8, r.top - h - 4) : r.bottom + 4) + 'px';
    const off = (ev) => { if (!m.contains(ev.target)) { m.remove(); document.removeEventListener('mousedown', off, true); } };
    setTimeout(() => document.addEventListener('mousedown', off, true));
    m.onclick = (ev) => { const b = ev.target.closest('[data-i]'); if (!b) return; m.remove(); document.removeEventListener('mousedown', off, true); items[+b.dataset.i].fn(); };
  };
})();
