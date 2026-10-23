#!/usr/bin/env node
/* IMD Legal Register — server.
   Plain Node.js (no packages): serves the app, checks the login, and keeps the
   register as one JSON file on the server, with rolling backups.

   Settings (environment variables):
     PORT         default 1875  (the year IMD was founded)
     LEGAL_USER   default legal
     LEGAL_PASS   default legal_imd
     DATA_DIR     default ./data   (/data inside Docker)
     SESSION_HOURS  default 12     (idle time before you have to log in again)
     KEEP_BACKUPS   default 120
     COOKIE_SECURE  set to 1 when the app is served through https
*/
'use strict';

const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const { mergeData, validate } = require('./public/js/merge.js');

const VERSION = '1.1.0';
const PORT = parseInt(process.env.PORT || '1875', 10);
const USER = process.env.LEGAL_USER || 'legal';
const PASS = process.env.LEGAL_PASS || 'legal_imd';
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const DATA_FILE = path.join(DATA_DIR, 'imd-legal-register.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const PUBLIC = path.join(__dirname, 'public');
const SESSION_MS = (parseFloat(process.env.SESSION_HOURS || '12') || 12) * 3600e3;
const KEEP_BACKUPS = parseInt(process.env.KEEP_BACKUPS || '120', 10);
const COOKIE = 'imdlr';
const SECURE = process.env.COOKIE_SECURE === '1' ? '; Secure' : '';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8',
};
// Files anyone may load before logging in (the login page and its look).
const OPEN = new Set(['/login.html', '/login.js', '/css/login.css', '/icons/scales.svg', '/icons/favicon.svg']);

/* ---------------- sessions and login ---------------- */
const sessions = new Map();          // token -> { exp, ip, name }
const failures = new Map();          // ip -> { n, until }

function cookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function session(req) {
  const t = cookies(req)[COOKIE];
  if (!t) return null;
  const s = sessions.get(t);
  if (!s) return null;
  if (s.exp < Date.now()) { sessions.delete(t); return null; }
  if (s.exp - Date.now() < SESSION_MS - 300e3) { s.exp = Date.now() + SESSION_MS; saveSessions(); }
  return Object.assign({ token: t }, s);
}
function same(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}
function ipOf(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '?';
}
// Sessions are kept in a small file so a restart of the container does not log everyone out.
const SESS_FILE = path.join(DATA_DIR, '.sessions.json');
try { for (const [t, v] of Object.entries(JSON.parse(fs.readFileSync(SESS_FILE, 'utf8')))) if (v.exp > Date.now()) sessions.set(t, v); } catch (_) {}
let sessTimer = null;
function saveSessions() {
  clearTimeout(sessTimer);
  sessTimer = setTimeout(() => {
    const out = {}; for (const [t, v] of sessions) if (v.exp > Date.now()) out[t] = v;
    fs.writeFile(SESS_FILE, JSON.stringify(out), { mode: 0o600 }, () => {});
  }, 2000);
}
setInterval(() => {
  const now = Date.now();
  for (const [t, s] of sessions) if (s.exp < now) sessions.delete(t);
  for (const [ip, f] of failures) if (f.until < now && f.last < now - 3600e3) failures.delete(ip);
}, 600e3).unref();

/* ---------------- the data file ---------------- */
let cache = null;                    // the register as stored
let chain = Promise.resolve();       // writes happen one after another

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}
function empty() {
  return { app: 'IMD-Legal-Register', format: 1, meta: { rev: 0, createdAt: Date.now(), updatedAt: 0, fresh: true },
    settings: {}, cases: [], matters: [], notices: [], rti: [], counsel: [], fees: [], courts: [], refs: [], tasks: [],
    actionState: {}, audit: [], deleted: {} };
}
async function load() {
  if (cache) return cache;
  await fsp.mkdir(BACKUP_DIR, { recursive: true });
  try {
    cache = JSON.parse(await fsp.readFile(DATA_FILE, 'utf8'));
    cache.meta = cache.meta || {};
    if (typeof cache.meta.rev !== 'number') cache.meta.rev = 1;
  } catch (e) {
    if (e.code !== 'ENOENT') {
      // A damaged file is kept aside, never overwritten silently.
      const bad = DATA_FILE + '.damaged-' + stamp();
      try { await fsp.copyFile(DATA_FILE, bad); } catch (_) {}
      console.error('Could not read the data file; kept a copy at', bad, e.message);
    }
    cache = empty();
  }
  return cache;
}
async function backup(reason) {
  try { await fsp.access(DATA_FILE); } catch (_) { return null; }
  const name = 'imd-legal-register-' + stamp() + (reason ? '-' + reason : '') + '.json';
  await fsp.copyFile(DATA_FILE, path.join(BACKUP_DIR, name));
  const files = (await fsp.readdir(BACKUP_DIR)).filter((f) => f.endsWith('.json')).sort();
  for (const f of files.slice(0, Math.max(0, files.length - KEEP_BACKUPS))) await fsp.unlink(path.join(BACKUP_DIR, f)).catch(() => {});
  return name;
}
let lastHourly = 0;
function write(data, reason) {
  chain = chain.then(async () => {
    if (reason) await backup(reason);
    else if (Date.now() - lastHourly > 3600e3) { await backup('hourly'); lastHourly = Date.now(); }
    const tmp = DATA_FILE + '.tmp';
    const fh = await fsp.open(tmp, 'w');
    try { await fh.writeFile(JSON.stringify(data)); await fh.sync(); } finally { await fh.close(); }
    await fsp.rename(tmp, DATA_FILE);
    cache = data;
  });
  return chain;
}
function audit(data, by, what) {
  data.audit = data.audit || [];
  data.audit.unshift({ id: 'au-' + crypto.randomBytes(6).toString('hex'), at: Date.now(), by: by || 'server', what });
  data.audit = data.audit.slice(0, 600);
}

/* ---------------- helpers ---------------- */
function send(res, code, body, headers = {}) {
  const isObj = body !== null && typeof body === 'object' && !Buffer.isBuffer(body);
  const buf = isObj ? Buffer.from(JSON.stringify(body)) : Buffer.isBuffer(body) ? body : Buffer.from(String(body || ''));
  res.writeHead(code, Object.assign({
    'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Content-Length': buf.length,
    'Cache-Control': 'no-store',
  }, SECURITY, headers));
  res.end(buf);
}
const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
};
function body(req, limit = 60 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const parts = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(Object.assign(new Error('too large'), { code: 413 })); req.destroy(); } else parts.push(c); });
    req.on('end', () => {
      try { resolve(parts.length ? JSON.parse(Buffer.concat(parts).toString('utf8')) : {}); }
      catch (e) { reject(Object.assign(new Error('bad json'), { code: 400 })); }
    });
    req.on('error', reject);
  });
}
async function serveFile(res, rel, status = 200) {
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'Forbidden');
  try {
    const buf = await fsp.readFile(file);
    res.writeHead(status, Object.assign({
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': buf.length, 'Cache-Control': 'no-cache',
    }, SECURITY));
    res.end(buf);
  } catch (_) { send(res, 404, 'Not found'); }
}
function meta(d) { return { rev: d.meta.rev || 0, savedAt: d.meta.savedAt || 0, savedBy: d.meta.savedBy || '', fresh: !!d.meta.fresh }; }

/* ---------------- routes ---------------- */
async function api(req, res, url, s) {
  const p = url.pathname;

  if (p === '/api/logout' && req.method === 'POST') {
    if (s) { sessions.delete(s.token); saveSessions(); }
    return send(res, 200, { ok: true }, { 'Set-Cookie': COOKIE + '=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0' + SECURE });
  }
  if (p === '/api/meta' && req.method === 'GET') return send(res, 200, Object.assign(meta(await load()), { version: VERSION }));

  if (p === '/api/data' && req.method === 'GET') {
    const d = await load();
    return send(res, 200, { meta: meta(d), data: d });
  }

  if (p === '/api/data' && req.method === 'PUT') {
    const b = await body(req);
    let incoming;
    try { incoming = validate(b.data); } catch (e) { return send(res, 400, { error: e.message }); }
    const by = String(b.by || s.name || 'legal').slice(0, 60);
    const mode = b.mode || 'save';
    const cur = await load();
    let out, merged = false, reason = null;
    if (mode === 'replace') {
      out = incoming; reason = 'before-replace';
      audit(out, by, 'Replaced the whole register with an uploaded file');
    } else if (mode === 'merge') {
      out = mergeData(cur, incoming); merged = true; reason = 'before-merge';
      audit(out, by, 'Merged an uploaded file into the register');
    } else if (b.baseRev === cur.meta.rev) {
      out = incoming;
    } else {
      out = mergeData(cur, incoming); merged = true;        // someone else saved in between
    }
    out.meta = Object.assign({}, out.meta, { rev: (cur.meta.rev || 0) + 1, savedAt: Date.now(), savedBy: by });
    delete out.meta.fresh;
    await write(out, reason);
    return send(res, 200, { meta: meta(out), merged, data: merged || mode !== 'save' ? out : undefined });
  }

  if (p === '/api/download' && req.method === 'GET') {
    const d = await load();
    return send(res, 200, d, { 'Content-Disposition': 'attachment; filename="IMD-Legal-Register-' + stamp() + '.json"' });
  }

  if (p === '/api/backups' && req.method === 'GET') {
    await load();
    const files = (await fsp.readdir(BACKUP_DIR)).filter((f) => f.endsWith('.json')).sort().reverse();
    const list = [];
    for (const f of files) {
      const st = await fsp.stat(path.join(BACKUP_DIR, f)).catch(() => null);
      if (st) list.push({ name: f, size: st.size, at: st.mtimeMs });
    }
    return send(res, 200, { list });
  }
  const m = p.match(/^\/api\/backups\/([\w.\-]+\.json)(\/restore)?$/);
  if (m) {
    const file = path.join(BACKUP_DIR, m[1]);
    if (path.dirname(file) !== BACKUP_DIR) return send(res, 403, { error: 'Forbidden' });
    let txt;
    try { txt = await fsp.readFile(file, 'utf8'); } catch (_) { return send(res, 404, { error: 'No such backup' }); }
    if (!m[2] && req.method === 'GET') {
      return send(res, 200, Buffer.from(txt), { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="' + m[1] + '"' });
    }
    if (m[2] && req.method === 'POST') {
      const b = await body(req);
      const cur = await load();
      const out = validate(JSON.parse(txt));
      audit(out, String(b.by || 'legal').slice(0, 60), 'Restored the server backup ' + m[1]);
      out.meta = Object.assign({}, out.meta, { rev: (cur.meta.rev || 0) + 1, savedAt: Date.now(), savedBy: b.by || 'legal' });
      await write(out, 'before-restore');
      return send(res, 200, { meta: meta(out), data: out });
    }
  }
  return send(res, 404, { error: 'Unknown request' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = decodeURIComponent(url.pathname);
  try {
    if (p === '/api/health') return send(res, 200, { ok: true, version: VERSION });

    if (p === '/api/login' && req.method === 'POST') {
      const ip = ipOf(req);
      const f = failures.get(ip);
      if (f && f.until > Date.now()) {
        return send(res, 429, { error: 'Too many wrong attempts. Try again in ' + Math.ceil((f.until - Date.now()) / 60000) + ' minute(s).' });
      }
      const b = await body(req, 10000);
      const okUser = same(String(b.username || '').trim().toLowerCase(), USER.toLowerCase());
      const okPass = same(String(b.password || ''), PASS);
      if (!(okUser && okPass)) {
        const n = (f ? f.n : 0) + 1;
        failures.set(ip, { n, last: Date.now(), until: n >= 8 ? Date.now() + 15 * 60e3 : 0 });
        return send(res, 401, { error: 'The username or password is not right.' + (n >= 5 && n < 8 ? ' ' + (8 - n) + ' tries left before a 15-minute wait.' : '') });
      }
      failures.delete(ip);
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, { exp: Date.now() + SESSION_MS, ip, name: String(b.name || '').slice(0, 60) });
      saveSessions();
      return send(res, 200, { ok: true }, { 'Set-Cookie': COOKIE + '=' + token + '; Path=/; HttpOnly; SameSite=Strict' + SECURE });
    }

    const s = session(req);
    if (p.startsWith('/api/')) {
      if (!s) return send(res, 401, { error: 'Please log in again.', login: true });
      return await api(req, res, url, s);
    }
    if (OPEN.has(p)) return serveFile(res, p);
    if (!s) {
      if (p === '/' || p === '/index.html') return serveFile(res, '/login.html');
      if (req.headers.accept && req.headers.accept.includes('text/html')) { res.writeHead(302, { Location: '/' }); return res.end(); }
      return send(res, 401, 'Please log in.');
    }
    return serveFile(res, p === '/' ? '/index.html' : p);
  } catch (e) {
    if (e && e.code === 413) return send(res, 413, { error: 'The file is too large.' });
    if (e && e.code === 400) return send(res, 400, { error: 'The request could not be read.' });
    console.error(e);
    return send(res, 500, { error: 'Something went wrong on the server: ' + (e && e.message) });
  }
});

load().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log('IMD Legal Register ' + VERSION + ' is running on port ' + PORT + ' — data in ' + DATA_FILE);
    if (USER === 'legal' && PASS === 'legal_imd') console.log('Login: legal / legal_imd (change with LEGAL_USER and LEGAL_PASS)');
  });
});
function shut() { chain.finally(() => process.exit(0)); setTimeout(() => process.exit(0), 5000).unref(); }
process.on('SIGTERM', shut);
process.on('SIGINT', shut);
