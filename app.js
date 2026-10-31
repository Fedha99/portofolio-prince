(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* muncul saat scroll, sekali saja */
  const rv = $$('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(el => io.observe(el));
  } else rv.forEach(el => el.classList.add('in'));

  /* kalkulator subnet IPv4 */
  const dot = n => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
  const grp = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  function calc(raw) {
    const s = raw.trim();
    if (!s) return { e: 'Isi alamat IPv4 dengan prefiks, misalnya 192.168.10.0/24.' };
    const m = s.split('/');
    if (m.length !== 2 || !m[1].trim()) return { e: 'Tambahkan prefiks setelah garis miring, misalnya /24.' };
    const o = m[0].trim().split('.');
    if (o.length !== 4) return { e: 'Alamat IPv4 harus punya 4 bagian, misalnya 192.168.10.0.' };
    let a = 0;
    for (const x of o) {
      if (!/^\d{1,3}$/.test(x)) return { e: `Bagian “${x}” bukan angka. Gunakan angka 0–255.` };
      if (+x > 255) return { e: `Bagian ${x} di luar rentang 0–255.` };
      a = a * 256 + +x;
    }
    const ps = m[1].trim();
    if (!/^\d{1,2}$/.test(ps) || +ps > 32) return { e: 'Prefiks harus berupa angka 0–32.' };
    const p = +ps;
    const mk = p ? (0xFFFFFFFF << (32 - p)) >>> 0 : 0;
    const net = (a & mk) >>> 0, wc = ~mk >>> 0, bc = (net | wc) >>> 0;
    const pt = p >= 31;
    const n = p === 32 ? 1 : p === 31 ? 2 : 2 ** (32 - p) - 2;
    const rows = [['Network', dot(net)], ['Broadcast', dot(bc)], ['Netmask', dot(mk)], ['Wildcard', dot(wc)],
      ['Host pertama', dot(pt ? net : net + 1)], ['Host terakhir', dot(pt ? bc : bc - 1)], ['Host usable', grp(n)]];
    const note = p === 31 ? 'RFC 3021: pada /31 kedua alamat dipakai sebagai host, tanpa network dan broadcast.'
      : p === 32 ? 'Prefiks /32 menunjuk satu host.' : '';
    return { rows, note };
  }
  const form = $('#sn');
  if (form) {
    const out = $('#sn-out'), err = $('#sn-err'), note = $('#sn-note'), inp = $('#ip');
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const r = calc(inp.value);
      if (r.e) {
        err.textContent = r.e; err.hidden = false; inp.setAttribute('aria-invalid', 'true');
        out.innerHTML = ''; note.textContent = ''; return;
      }
      err.hidden = true; inp.removeAttribute('aria-invalid');
      out.innerHTML = r.rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
      note.textContent = r.note;
    });
  }

  /* command palette */
  const kbd = $('#kbd');
  if (kbd && !/Mac|iPhone|iPad/.test(navigator.userAgent)) kbd.textContent = 'Ctrl K';
  const items = [['Beranda', '#top'], ['Proyek', '#proyek'], ['Pipeline monitoring', '#p-monitoring'], ['Lab OSPF multi-area', '#p-ospf'],
    ['Web Monitor', '#p-web'], ['Orkestrasi AI', '#p-ai'], ['blackarch-fixing', '#p-ba'], ['Tulisan: Tecotechno', '#tulisan'],
    ['Keahlian', '#keahlian'], ['Alat: kalkulator subnet', '#alat'], ['Kontak', '#kontak']];
  const d = document.createElement('dialog');
  d.className = 'pal';
  d.setAttribute('aria-label', 'Lompat ke bagian');
  d.innerHTML = '<input class="pq" type="text" role="combobox" aria-label="Cari bagian" aria-expanded="true" aria-controls="pl" aria-autocomplete="list" placeholder="Lompat ke bagian…" autocomplete="off" spellcheck="false"><ul id="pl" role="listbox" aria-label="Bagian"></ul><p class="keys">↑↓ pilih · Enter buka · Esc tutup</p>';
  document.body.append(d);
  const pq = $('.pq', d), pl = $('#pl', d);
  let vis = [], ix = 0;
  const draw = () => {
    const q = pq.value.trim().toLowerCase();
    vis = items.filter(i => i[0].toLowerCase().includes(q));
    ix = Math.min(ix, Math.max(vis.length - 1, 0));
    pl.innerHTML = vis.length
      ? vis.map((i, k) => `<li role="option" id="o${k}" aria-selected="${k === ix}" data-h="${i[1]}">${i[0]}</li>`).join('')
      : '<li class="none" role="option" aria-disabled="true">Tidak ada yang cocok</li>';
    if (vis.length) pq.setAttribute('aria-activedescendant', 'o' + ix); else pq.removeAttribute('aria-activedescendant');
  };
  const go = h => { d.close(); if (h) location.hash = h; };
  const open = () => { pq.value = ''; ix = 0; draw(); d.showModal(); pq.focus(); };
  pq.addEventListener('input', () => { ix = 0; draw(); });
  pq.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!vis.length) return;
      ix = (ix + (e.key === 'ArrowDown' ? 1 : vis.length - 1)) % vis.length;
      draw(); $('#o' + ix, pl).scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') { e.preventDefault(); if (vis[ix]) go(vis[ix][1]); }
  });
  pl.addEventListener('click', e => { const li = e.target.closest('li[data-h]'); if (li) go(li.dataset.h); });
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
  $('#pal-open')?.addEventListener('click', open);
  addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); d.open ? d.close() : open(); }
  });
})();
