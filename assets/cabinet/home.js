/* cabinet.html: the title plate and the twelve halls of drawer rows. */
(() => {
  const { T, $, G, GROUP, AG, BY, WALL, U, still, word, cap, esc, fmt, no3, actWord, term, rowSub, hallDesc, search, rail, seen, here, live, keys, lead } = CAB;
  const tally = () => document.querySelectorAll('[data-count]').forEach(el => { el.textContent = cap(word(AG.length)); });
  tally();

  /* ---------- the title plate ---------- */
  const FORMS = [['scale', 'affinity', 'the longer, the tighter'], ['rise', 'agonist', 'activates'], ['partial', 'partial', 'activates, to a ceiling'], ['pam', 'pam', 'boosts the natural signal'], ['hang', 'antagonist', 'blocks, or stops reuptake'], ['inverse', 'inverse', 'pushes below rest'], ['thread', 'uncurated', 'binds, effect unrecorded'], ['none', '', 'tested, nothing bound']];
  $('key').innerHTML = FORMS.map(([k, t, l]) => `<li>${FIG.formMark(k)}${t ? term(t, cap(l)) : cap(l)}</li>`).join('');
  const contentsHTML = () => G.map(g => `<a href="${U.hall(g)}"><span>${g.roman}</span><span>${esc(g.label)}</span><span>${AG.filter(a => a.g === g.id).length}</span></a>`).join('');


  function renderContents(q = '') {
    const r = search(q);
    if (!r) { $('contents').innerHTML = contentsHTML(); return; }
    const exact = r.targets.filter(t => t.label.toLowerCase().replace('-', '').startsWith(q.trim().toLowerCase().replace('-', '')));
    const rows = [
      ...exact.map(t => `<a href="${U.t(t)}"><span>◇</span><span>${t.label}</span><span>target</span></a>`),
      ...r.drugs.map(a => `<a href="${U.m(a)}"><span class="n">${no3(a)}</span><span>${esc(a.name)}</span><span></span></a>`),
      ...r.groups.map(g => `<a href="${U.hall(g)}"><span>${g.roman}</span><span>${esc(g.label)}</span><span>${AG.filter(a => a.g === g.id).length}</span></a>`),
      ...r.targets.filter(t => !exact.includes(t)).map(t => `<a href="${U.t(t)}"><span>◇</span><span>${t.label}</span><span>target</span></a>`),
    ].slice(0, 12);
    $('contents').innerHTML = rows.join('') || `<p>Nothing in the Cabinet matches “${esc(q)}”.</p>`;
    $('contents').querySelector('a')?.classList.add('first');
  }
  renderContents();
  document.fonts.ready.then(() => { $('contents').style.minHeight = $('contents').offsetHeight + 'px'; });

  /* ---------- halls ---------- */
  function drawHalls() {
    $('halls').innerHTML = G.map(g => `
      <section class="hall" id="${g.id}" data-room="${WALL[g.id]}" data-g="${g.i}" aria-labelledby="hn-${g.id}">
        <header class="hall-head">
          <span class="hall-num" aria-hidden="true">${g.roman}</span>
          <h2 id="hn-${g.id}">${esc(g.label)}</h2>
          <p class="hall-desc">${hallDesc(g)}</p>
        </header>
        <div class="hall-rule"></div>
        <div class="drawers">
          <div class="scale"></div>
          ${AG.filter(a => a.g === g.id).map(a => `<a class="drawer" id="${a.slug}" href="${U.m(a)}" data-slug="${a.slug}">
            <span class="drawer-no">No. ${no3(a)}</span>
            <span class="drawer-name"><b>${esc(a.name)}</b><small>${esc(rowSub(a))}</small></span>
            <span class="drawer-fig"></span><i class="hairline"></i></a>`).join('')}
        </div>
      </section>`).join('');
  }
  drawHalls();

  let figW = 0;
  function layoutRows() {
    const w = document.querySelector('.drawers').clientWidth;
    const next = Math.floor(Math.min(1060, w - 5.6 * 16 - Math.max(262, w * 0.23)));
    if (!w || next === figW) return; figW = next;
    const { u, xs } = FIG.columns(figW), font = Math.min(12.5, u / 4.1);
    const sc = `<svg class="memb" width="${figW}" height="26" viewBox="0 0 ${figW} 26" role="group" aria-label="Targets">
      <path class="rail-line" d="M${xs.map((x, i) => `${(x - u / 2).toFixed(1)} .5 H${(x + u / 2).toFixed(1)} M${(x - u / 2).toFixed(1)} 25.5 H${(x + u / 2).toFixed(1)}`).join(' M')}"/>
      ${T.map((t, i) => `<a href="${U.t(t)}" data-i="${i}" aria-label="${t.label}: every medication that holds it"><rect x="${(xs[i] - u / 2).toFixed(1)}" y="-6" width="${u.toFixed(1)}" height="38" fill="transparent"/><text x="${xs[i].toFixed(1)}" y="17" text-anchor="middle" style="font-size:${font.toFixed(1)}px">${t.label}</text></a>`).join('')}</svg>`;
    document.querySelectorAll('.drawers').forEach(d => d.style.setProperty('--fig', figW + 'px'));
    document.querySelectorAll('.scale').forEach(s => { s.innerHTML = sc; });
    document.querySelectorAll('.drawer').forEach(d => { d.querySelector('.drawer-fig').innerHTML = FIG.row(BY[d.dataset.slug], T, figW, 84); });
  }

  /* pointing along a row reads it out under the name, and lights the target above */
  let lastRow = null;
  function clearRow() {
    if (!lastRow) return;
    lastRow.querySelector('small').textContent = rowSub(BY[lastRow.dataset.slug]);
    lastRow.querySelector('.hairline').classList.remove('on');
    lastRow.parentElement.querySelectorAll('.scale a.on').forEach(a => a.classList.remove('on'));
    lastRow = null;
  }
  $('halls').addEventListener('mousemove', e => {
    const row = e.target.closest('.drawer');
    if (row !== lastRow) clearRow();
    if (!row) return;
    const svg = row.querySelector('.memb'), x = e.clientX - svg.getBoundingClientRect().left;
    const { u, xs } = FIG.columns(figW), i = xs.findIndex(c => Math.abs(c - x) <= u / 2 + .5);
    lastRow = row;
    const heads = row.parentElement.querySelectorAll('.scale a'), line = row.querySelector('.hairline'), small = row.querySelector('small');
    heads.forEach((h, k) => h.classList.toggle('on', k === i));
    if (x < 0 || i < 0) { small.textContent = rowSub(BY[row.dataset.slug]); line.classList.remove('on'); return; }
    const t = T[i], b = BY[row.dataset.slug].b[t.id];
    small.innerHTML = !b ? `<em>${t.label}</em> never tested` : b.n === 0 ? `<em>${t.label}</em> nothing bound` : `<em>${t.label}</em> ${fmt(b.pki)}, ${esc(actWord(b))}`;
    line.style.left = (svg.getBoundingClientRect().left - row.getBoundingClientRect().left + xs[i]) + 'px';
    line.classList.add('on');
  });
  $('halls').addEventListener('mouseleave', clearRow);

  /* ---------- the rail and the walls ---------- */
  let cur = -1;
  function onScroll() {
    const line = innerHeight * .55; cur = -1;
    const halls = [...document.querySelectorAll('.hall')];
    halls.forEach((h, i) => { if (h.getBoundingClientRect().top < line) cur = i; });
    const foot = document.querySelector('.colophon').getBoundingClientRect().top < line;
    document.body.dataset.room = foot ? 'vault' : cur < 0 ? 'atrium' : halls[cur].dataset.room;
    rail(cur);
  }
  here.hall = () => cur >= 0 ? G[cur].id : null;
  addEventListener('scroll', onScroll, { passive: true });
  const ruleSeen = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.closest('.hall').classList.add('ruled'); }), { threshold: 0 });
  function watch() {
    document.querySelectorAll('.drawer').forEach(d => seen.observe(d));
    document.querySelectorAll('.hall-desc').forEach(d => ruleSeen.observe(d));
  }

  /* ---------- arriving ---------- */
  const rowOf = url => { try { const m = new URL(url).searchParams.get('m'); return m ? document.getElementById(m) : null; } catch (e) { return null; } };
  function goTo(id, smooth) {
    const el = document.getElementById(id); if (!el || !el.matches('.hall, .drawer')) return;
    const row = el.matches('.drawer');
    el.scrollIntoView({ block: row ? 'center' : 'start', behavior: smooth && !still ? 'smooth' : 'instant' });
    if (row) el.focus({ preventScroll: true });
  }
  const at = () => decodeURIComponent(location.hash.slice(1));
  addEventListener('hashchange', () => goTo(at()));
  document.addEventListener('click', e => { // a hall on this page is walked to, not jumped to
    const a = e.target.closest('a[href^="cabinet.html#"]'); if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault(); history.pushState(null, '', a.getAttribute('href')); goTo(at(), true);
  });

  /* the row's drawing becomes the specimen's plate, and goes back to its row */
  const carry = (url, vt) => {
    const row = rowOf(url), m = row?.querySelector('.memb'); if (!m) return;
    const r = row.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    m.style.viewTransitionName = 'specimen';
    vt.finished.finally(() => { m.style.viewTransitionName = ''; });
  };
  addEventListener('pageswap', e => { if (e.viewTransition && e.activation) carry(e.activation.entry.url, e.viewTransition); });
  addEventListener('pagereveal', e => { if (e.viewTransition) { e.viewTransition.ready.catch(() => {}); carry(window.navigation?.activation?.from?.url, e.viewTransition); } });
  addEventListener('pageshow', () => lead.set(''));

  const find = $('find');
  find.addEventListener('input', () => renderContents(find.value));
  find.addEventListener('keydown', e => { if (e.key === 'Enter') { const a = $('contents').querySelector('a'); if (a && find.value.trim()) { a.click(); find.value = ''; renderContents(); } } });
  keys.slash = () => { if (scrollY >= innerHeight * .4) return false; find.focus(); find.select(); return true; };
  keys.escape = () => { if (document.activeElement === find) { find.value = ''; renderContents(); find.blur(); } };
  keys.row = (d, e) => {
    if (!document.activeElement?.classList.contains('drawer')) return;
    e.preventDefault();
    const all = [...document.querySelectorAll('.drawer')], n = all[all.indexOf(document.activeElement) + d];
    if (n) { n.focus({ preventScroll: true }); n.scrollIntoView({ block: 'nearest' }); }
  };
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(layoutRows, 120); });

  layoutRows();
  watch();
  if (at() && performance.getEntriesByType('navigation')[0]?.type === 'navigate') goTo(at());
  onScroll();
  live.then(changed => {
    if (!changed) return;
    const y = scrollY; figW = 0; lastRow = null;
    tally(); renderContents(find.value); drawHalls(); layoutRows(); watch(); scrollTo({ top: y, behavior: 'instant' }); onScroll();
  });
})();
