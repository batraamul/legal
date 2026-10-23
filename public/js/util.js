/* js/util.js — the one global object LR, date helpers, text escaping, files */
(function () {
  'use strict';
  const LR = window.LR = window.LR || {};
  const U = LR.util = {};
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  U.MON = MON; U.MONTHS = MONTHS; U.WD = WD;

  const p2 = (n) => String(n).padStart(2, '0');
  U.key = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  U.today = () => U.key(new Date());
  U.parse = (k) => { if (!k) return null; const [y, m, d] = String(k).slice(0, 10).split('-').map(Number); return y ? new Date(y, (m || 1) - 1, d || 1) : null; };
  U.addDays = (k, n) => { const d = U.parse(k); d.setDate(d.getDate() + n); return U.key(d); };
  U.addMonths = (k, n) => {
    const d = U.parse(k), day = d.getDate();
    d.setDate(1); d.setMonth(d.getMonth() + n);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last)); return U.key(d);
  };
  U.diff = (a, b) => Math.round((U.parse(b) - U.parse(a)) / 864e5);      // days from a to b
  U.fromToday = (k) => U.diff(U.today(), k);
  U.fmt = (k, withWd) => {
    const d = U.parse(k); if (!d) return '';
    return (withWd ? WD[d.getDay()] + ', ' : '') + d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
  };
  U.fmtShort = (k) => { const d = U.parse(k); return d ? d.getDate() + ' ' + MON[d.getMonth()] : ''; };
  U.fmtTime = (ms) => { if (!ms) return ''; const d = new Date(ms); return U.fmt(U.key(d)) + ', ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); };
  U.rel = (k) => {
    const n = U.fromToday(k);
    if (n === 0) return 'today'; if (n === 1) return 'tomorrow'; if (n === -1) return 'yesterday';
    if (n > 0) return 'in ' + n + ' days'; return Math.abs(n) + ' days ago';
  };
  U.stamp = () => { const d = new Date(); return U.key(d) + '-' + p2(d.getHours()) + p2(d.getMinutes()); };

  U.uid = (pre) => (pre || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.attr = U.esc;
  U.nl = (s) => U.esc(s).replace(/\n/g, '<br>');
  U.safeUrl = (u) => { u = String(u || '').trim(); return /^(https?:|mailto:|tel:|file:|\\\\)/i.test(u) ? u : (u && !/^[a-z]+:/i.test(u) ? u : ''); };
  U.money = (n) => n == null || n === '' || isNaN(n) ? '' : '₹ ' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  U.moneyShort = (n) => { n = +n || 0; return n >= 1e7 ? '₹' + (n / 1e7).toFixed(2).replace(/\.?0+$/, '') + ' Cr' : n >= 1e5 ? '₹' + (n / 1e5).toFixed(1).replace(/\.0$/, '') + ' L' : U.money(n); };
  U.debounce = (fn, ms) => { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; };
  U.clone = (o) => JSON.parse(JSON.stringify(o));
  U.by = (k, dir = 1) => (a, b) => { const x = typeof k === 'function' ? k(a) : a[k], y = typeof k === 'function' ? k(b) : b[k];
    if (x === y) return 0; if (x == null || x === '') return 1; if (y == null || y === '') return -1; return (x < y ? -1 : 1) * dir; };
  U.plural = (n, w, ws) => n + ' ' + (n === 1 ? w : (ws || w + 's'));
  U.norm = (s) => String(s || '').toLowerCase();

  U.download = (name, text, type = 'application/json') => {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener'; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 4000);
  };
  U.pickFile = (accept) => new Promise((resolve) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = accept || ''; inp.style.display = 'none';
    inp.onchange = () => { resolve(inp.files[0] || null); inp.remove(); };
    document.body.appendChild(inp); inp.click();
  });
  U.readText = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file); });
  U.csv = (rows) => '﻿' + rows.map((r) => r.map((v) => {
    v = v == null ? '' : String(v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }).join(',')).join('\r\n');
})();
