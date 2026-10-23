/* login.js — sends the username and password; the server sets a session cookie */
(function () {
  'use strict';
  try { const lk = JSON.parse(localStorage.getItem('imdlr-look') || 'null'); if (lk) document.documentElement.dataset.look = lk.look; } catch (_) {}
  const f = document.getElementById('login'), err = document.getElementById('err'), btn = document.getElementById('go');
  try { document.getElementById('n').value = localStorage.getItem('imdlr-name') || ''; } catch (_) {}
  f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    err.textContent = ''; btn.disabled = true; btn.textContent = 'Opening…';
    const name = document.getElementById('n').value.trim();
    try {
      const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ username: document.getElementById('u').value, password: document.getElementById('p').value, name }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Could not log in.');
      try { localStorage.setItem('imdlr-name', name || 'legal'); } catch (_) {}
      f.classList.add('opening');
      setTimeout(() => location.replace('/'), 450);
    } catch (e) {
      err.textContent = e.message; btn.disabled = false; btn.textContent = 'Open the register';
      f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
      document.getElementById('p').select();
    }
  });
})();
