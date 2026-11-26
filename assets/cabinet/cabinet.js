/* The Cabinet, shared by its three pages: the roster and its words, the search, the Index,
   margin notes, the rail, and the overlay of live binding data.
     cabinet.html                        the title plate and the halls   (#<class> or #<medication>)
     cabinet-medication.html?m=<slug>    one medication                  (&with=<slug> sets a second beside it)
     cabinet-target.html?t=<id>          one target                                                          */
window.CAB = (() => {
  const C = window.CATALOGUE, T = C.targets;
  const RX = Object.fromEntries(C.receptors.map(r => [r.id, r]));
  const $ = id => document.getElementById(id);
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const WALL = { ssri: 'celestial', adatyp: 'cobalt', tca: 'umber', sga: 'oxblood', fga: 'vault', stim: 'cobalt', anx: 'verdigris', opioid: 'umber', psy: 'celestial', adren: 'cobalt', da: 'oxblood', antichol: 'verdigris' };
  const TWALL = { sert: 'celestial', serotonin_5ht1a: 'celestial', serotonin_5ht2a: 'celestial', serotonin_5ht2c: 'celestial', dat: 'oxblood', dopamine_d2: 'oxblood', dopamine_d3: 'oxblood', net: 'cobalt', alpha_1: 'cobalt', alpha_2: 'cobalt', beta_1: 'cobalt', gaba_a: 'verdigris', histamine_h1: 'umber', muscarinic_m1: 'umber', muscarinic_m3: 'umber', mu_opioid: 'umber' };
  const TRANSPORTERS = new Set(['sert', 'net', 'dat']);
  const ARCHIVE = { serotonin_5ht1a: 1, serotonin_5ht2a: 2, serotonin_5ht2c: 3, sert: 5, dopamine_d2: 7, dopamine_d3: 8, dat: 9, alpha_1: 10, alpha_2: 11, beta_1: 12, net: 13, gaba_a: 16, muscarinic_m1: 18, histamine_h1: 20, mu_opioid: 21 };
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen'];
  WORDS.push('seventeen', 'eighteen', 'nineteen');
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const word = n => WORDS[n] || (n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + WORDS[n % 10] : '') : String(n));
  const low = n => /^[A-Z]{2}/.test(n) ? n : n[0].toLowerCase() + n.slice(1);
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const list = xs => xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];
  const fmt = p => p.toFixed(1);
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  /* ---------- addresses ---------- */
  const U = {
    hall: g => `cabinet.html#${g.id}`,
    row: a => `cabinet.html#${a.slug}`,
    m: (a, z) => `cabinet-medication.html?m=${a.slug}${z ? `&with=${z.slug}` : ''}`,
    t: t => `cabinet-target.html?t=${t.id}`,
    archive: t => ARCHIVE[t.id] ? `receptor-function.html#/entry/${ARCHIVE[t.id]}` : null,
  };
  const param = k => new URLSearchParams(location.search).get(k) || '';

  /* ---------- the roster ---------- */
  const G = C.groups.map((g, i) => ({ ...g, i, roman: ROMAN[i] }));
  const GROUP = Object.fromEntries(G.map(g => [g.id, g]));
  let agents = C.agents;
  const AG = [], BY = {};
  function fill() {
    AG.length = 0; Object.keys(BY).forEach(k => delete BY[k]);
    G.forEach(g => agents.filter(a => a.g === g.id).forEach(a => { const x = { ...a, no: AG.length + 1, slug: slug(a.name) }; AG.push(x); BY[x.slug] = x; }));
  }
  fill();

  /* The database is the authority where it can be reached; the embedded roster stands in for
     it offline. Resolves true when the live values differ from what was first drawn.        */
  const round = b => ({ ...b, pki: b.pki ?? (b.ki > 0 ? Math.round((9 - Math.log10(b.ki)) * 100) / 100 : 0) });
  const print = as => JSON.stringify(as.map(a => [a.name, a.g, T.map(t => { const b = a.b[t.id]; return b ? [b.n || 0, b.n ? b.pki : 0, !!b.nc, b.act || '', b.actFull || ''] : 0; })]));
  const live = (async () => {
    try {
      const got = await (await fetch('/api/atlas/cabinet/binding')).json();
      if (!Array.isArray(got) || !got.length) return false;
      const byName = new Map(got.map(a => [a.name, { ...a, b: Object.fromEntries(Object.entries(a.b || {}).map(([k, b]) => [k, round(b)])) }]));
      const next = agents.map(a => { const l = byName.get(a.name); byName.delete(a.name); return l || a; });
      byName.forEach(a => next.push(a));
      const changed = print(next) !== print(agents);
      agents = next; if (changed) fill();
      return changed;
    } catch (e) { return false; } // offline: keep the embedded roster
  })();

  const no3 = a => String(a.no).padStart(3, '0');
  const measured = a => T.map((t, i) => ({ t, i, b: a.b[t.id] })).filter(x => x.b && x.b.n > 0).sort((x, y) => y.b.pki - x.b.pki);

  /* ---------- words ---------- */
  const termFor = b => ({ thread: 'uncurated', pam: 'pam', partial: 'partial', inverse: 'inverse', rise: 'agonist', hang: b.act === 'ri' ? 'reuptake' : 'antagonist' }[FIG.form(b)]);
  const actWord = b => !b.act ? 'action unrecorded' : b.actFull === 'Inhibition' ? 'reuptake inhibitor' : b.actFull.toLowerCase();
  const verb = b => !b.act ? '' : FIG.form(b) === 'pam' ? 'boosts' : FIG.form(b) === 'partial' ? 'partly activates' : FIG.form(b) === 'inverse' ? 'quiets' : { ag: 'activates', an: 'blocks', ri: 'stops reuptake at', pa: 'partly activates' }[b.act];
  const GLOSS = {
    affinity: ['Affinity', 'How tightly a drug holds its target, written as pKᵢ: each step up is ten times tighter. A pKᵢ of 9 binds at nanomolar concentrations; 6 needs a thousand times more drug.', 'Affinity says nothing about what the drug does once bound.'],
    antagonist: ['Antagonist', 'Occupies the receptor and produces no response of its own, so its effect is whatever the natural signal would have done.', 'Naloxone and prazosin are neutral antagonists.'],
    inverse: ['Inverse agonist', 'Some receptors signal a little even when empty. An inverse agonist pushes that resting activity below baseline, so it does more than block.', 'Pimavanserin at 5-HT2A; propranolol at β receptors.'],
    agonist: ['Agonist', 'Binds and switches the receptor on. A full agonist can drive the maximal response the tissue allows.', 'Morphine and fentanyl at μ; clonidine at α2.'],
    partial: ['Partial agonist', 'Switches the receptor on, but only part of the way, even when every receptor is occupied. Where tone is low it adds signal; where tone is high it competes the full agonist off and lowers it.', 'Aripiprazole at D2; buprenorphine at μ.'],
    pam: ['Positive allosteric modulator', 'Binds away from the natural signal’s site and makes the receptor respond more strongly when the signal arrives. It cannot open the channel alone.', 'Benzodiazepines at GABA-A.'],
    reuptake: ['Reuptake inhibitor', 'Blocks the transporter that clears a neurotransmitter from the synapse, so the transmitter lingers and keeps acting on its receptors.', 'SSRIs at SERT; methylphenidate at DAT and NET.'],
    uncurated: ['Action unrecorded', 'The binding has been measured, but no curated source in this collection says what the drug does once bound. It is drawn as a thread so it is never mistaken for a known action.', ''],
  };
  const term = (key, text) => `<button type="button" class="term" data-term="${key}" aria-expanded="false">${text}</button>`;

  function gist(a) {
    const m = measured(a);
    if (!m.length) return 'No measured binding at any of these sixteen targets.';
    const top = m.filter(x => x.b.pki >= 7).slice(0, 3);
    if (!top.length) return `Nothing here holds tighter than pKᵢ 7; its strongest hold is ${m[0].t.label} at ${fmt(m[0].b.pki)}.`;
    const names = top.map(x => x.t.label);
    let s = top.length === 1 ? `Holds ${names[0]} most tightly` : `Holds ${names[0]} most tightly, then ${list(names.slice(1))}`;
    const known = top.filter(x => x.b.act), unknown = top.filter(x => !x.b.act), verbs = known.map(x => verb(x.b));
    if (known.length === top.length && verbs.every(v => v === verbs[0])) return `${s}. It ${verbs[0]} ${top.length === 1 ? 'it' : top.length === 2 ? 'both' : 'all three'}.`;
    const by = {};
    known.forEach(x => (by[verb(x.b)] ||= []).push(x.t.label));
    const parts = Object.entries(by).map(([v, ts]) => `${v} ${list(ts)}`);
    if (parts.length) s += `. It ${list(parts)}`;
    if (unknown.length) s += `${parts.length ? '; what it does at ' : '. What it does at '}${list(unknown.map(x => x.t.label))} is not recorded`;
    return s + '.';
  }
  function rowSub(a) {
    const m = measured(a); if (!m.length) return 'no measured binding';
    const s = m.filter(x => x.b.pki >= 7).slice(0, 3);
    return s.length ? s.map(x => x.t.label).join(', ') : `${m[0].t.label}, weakly`;
  }
  function hallDesc(g) {
    const as = AG.filter(a => a.g === g.id), tally = {}; let silent = 0;
    as.forEach(a => { const k = FIG.tightest(a, T); if (k < 0) silent++; else tally[T[k].label] = (tally[T[k].label] || 0) + 1; });
    const top = Object.entries(tally).sort((x, y) => y[1] - x[1]);
    const [first, second] = top;
    let s = `${cap(word(as.length))} medications. `;
    if (first[1] === as.length) s += `Every one of them holds ${first[0]} more tightly than anything else measured here.`;
    else if (first[1] === 1) s += 'No two of them agree on what they hold most tightly.';
    else s += `${cap(word(first[1]))} hold ${first[0]} most tightly${second && second[1] > 1 ? `, ${word(second[1])} ${second[0]}` : ''}${top.length > 2 || (second && second[1] === 1) ? `, and the rest scatter` : ''}.`;
    if (silent) s += ` ${cap(word(silent))} ${silent === 1 ? 'has' : 'have'} no measured binding at these sixteen targets.`;
    return s;
  }

  function search(q) {
    q = q.trim().toLowerCase(); if (!q) return null;
    const rank = n => { n = n.toLowerCase(); return n.startsWith(q) ? 0 : n.split(/[\s-]+/).some(w => w.startsWith(q)) ? 1 : q.length > 2 && n.includes(q) ? 2 : 9; };
    const drugs = AG.map(a => [rank(a.name), a]).filter(x => x[0] < 9).sort((x, y) => x[0] - y[0] || x[1].no - y[1].no).map(x => x[1]);
    const targets = T.filter(t => Math.min(rank(t.label), q.length > 3 ? rank(t.def) : 9, rank(t.label.replace('-', ''))) < 9);
    const groups = G.filter(g => rank(g.label) < 9);
    return { drugs, targets, groups };
  }

  /* ---------- the rail ---------- */
  $('rail').insertAdjacentHTML('beforeend', G.map((g, i) => `<i style="top:${(i / (G.length - 1)) * 100}%"></i>`).join(''));
  const dots = [...document.querySelectorAll('.rail i')];
  function rail(cur) {
    dots.forEach((d, i) => { d.classList.toggle('lit', i < cur); d.classList.toggle('here', i === cur); });
    $('railFill').style.transform = `scaleY(${Math.max(0, cur) / (G.length - 1)})`;
  }
  const seen = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); } }), { threshold: .12 });

  /* ---------- the index ---------- */
  const here = { a: null, t: null, hall: () => null }; // the page says where it is
  const index = $('index'), ixFind = $('indexFind');
  let choosing = null, openGroup = null;
  function renderIndex() {
    const q = ixFind.value, r = search(q);
    const cur = openGroup ?? (here.a ? here.a.g : here.hall());
    const href = a => choosing ? U.m(choosing, a) : U.m(a);
    const items = as => as.map(a => `<a href="${href(a)}"${here.a?.slug === a.slug ? ' class="at" aria-current="page"' : ''}>${esc(a.name)}</a>`).join('');
    let html = G.map(g => {
      const as = (r ? r.drugs : AG).filter(a => a.g === g.id && a.slug !== choosing?.slug);
      if (r && !as.length) return '';
      const n = AG.filter(a => a.g === g.id).length;
      return `<div class="ix${r || cur === g.id ? ' open' : ''}"><button type="button" class="ix-head" data-g="${g.id}" aria-expanded="${!!(r || cur === g.id)}"><span>${esc(g.label)}</span><span>${r ? as.length : n}</span></button><div class="ix-items">${items(as)}</div></div>`;
    }).join('');
    const ts = choosing ? [] : r ? r.targets : T;
    if (ts.length) html += `<div class="ix${r || cur === 'targets' || here.t ? ' open' : ''}"><button type="button" class="ix-head" data-g="targets" aria-expanded="${!!(r || cur === 'targets' || here.t)}"><span>Targets</span><span>${ts.length}</span></button><div class="ix-items">${ts.map(t => `<a href="${U.t(t)}"${here.t === t ? ' class="at" aria-current="page"' : ''}>${t.label}</a>`).join('')}</div></div>`;
    $('indexList').innerHTML = html || `<p class="index-empty">Nothing matches “${esc(q)}”.</p>`;
    $('indexAsk').hidden = !choosing;
    if (choosing) $('indexAsk').textContent = `Set ${choosing.name} beside`;
  }
  function openIndex(focus) {
    if (!index.classList.contains('open')) { renderIndex(); index.classList.add('open'); index.inert = false; $('indexTab').setAttribute('aria-expanded', 'true'); $('indexTab').textContent = 'Close'; $('indexList').querySelector('.ix.open')?.scrollIntoView({ block: 'nearest' }); }
    if (focus) { ixFind.focus(); ixFind.select(); }
  }
  function closeIndex() {
    if (!index.classList.contains('open')) return;
    index.classList.remove('open'); index.inert = true; choosing = null; openGroup = null; ixFind.value = '';
    $('indexTab').setAttribute('aria-expanded', 'false'); $('indexTab').textContent = 'Index';
  }
  $('indexTab').addEventListener('click', () => index.classList.contains('open') ? closeIndex() : openIndex(true));
  $('railEdge').addEventListener('mouseenter', () => openIndex(false));
  index.addEventListener('mouseleave', () => { if (!choosing && !index.contains(document.activeElement)) closeIndex(); });
  ixFind.addEventListener('input', renderIndex);
  ixFind.addEventListener('keydown', e => { if (e.key === 'Enter') $('indexList').querySelector('.ix.open .ix-items a')?.click(); });
  $('indexList').addEventListener('click', e => {
    const h = e.target.closest('.ix-head'); if (!h) return;
    const g = h.dataset.g;
    if (g !== 'targets' && !choosing && h.parentElement.classList.contains('open') && !ixFind.value) { closeIndex(); location.href = U.hall(GROUP[g]); return; }
    openGroup = g; renderIndex();
    $('indexList').querySelector(`[data-g="${g}"]`)?.focus();
  });

  /* ---------- margin notes ---------- */
  const note = $('note'); let noteFor = null;
  function openNote(btn) {
    if (noteFor === btn) return closeNote();
    closeNote();
    const g = GLOSS[btn.dataset.term]; if (!g) return;
    note.innerHTML = `<h2>${g[0]}</h2><p>${g[1]}</p>${g[2] ? `<p>${g[2]}</p>` : ''}`;
    note.hidden = false;
    const r = btn.getBoundingClientRect(), w = note.offsetWidth, h = note.offsetHeight;
    note.style.left = Math.max(12, Math.min(r.left, innerWidth - w - 16)) + 'px';
    note.style.top = (r.bottom + h + 16 > innerHeight ? r.top - h - 10 : r.bottom + 10) + 'px';
    btn.setAttribute('aria-expanded', 'true'); noteFor = btn;
  }
  function closeNote() { note.hidden = true; noteFor?.setAttribute('aria-expanded', 'false'); noteFor = null; }

  /* ---------- clicks and keys every page shares ---------- */
  document.addEventListener('click', e => {
    const tm = e.target.closest('.term'); if (tm) return openNote(tm);
    if (!e.target.closest('.note')) closeNote();
    if (e.target.closest('#beside')) { choosing = here.a; openIndex(true); renderIndex(); return; }
    if (index.classList.contains('open') && !e.target.closest('.index, .tab, .rail-edge')) closeIndex();
  });
  addEventListener('scroll', closeNote, { passive: true });
  addEventListener('pageshow', e => { if (e.persisted) { closeIndex(); closeNote(); } });

  const keys = {}; // a page may add: slash(), escape(), step(direction), row(direction)
  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName);
    if (e.key === '/' && !typing) { e.preventDefault(); if (!keys.slash?.()) openIndex(true); return; }
    if (e.key === 'Escape') {
      if (noteFor) { const b = noteFor; closeNote(); b.focus(); return; }
      if (index.classList.contains('open')) { closeIndex(); $('indexTab').focus({ preventScroll: true }); $('indexTab').blur(); return; }
      return keys.escape?.();
    }
    if (typing || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys.step?.(e.key === 'ArrowRight' ? 1 : -1);
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') keys.row?.(e.key === 'ArrowDown' ? 1 : -1, e);
  });

  /* ---------- a page of its own: draw now, and again if the live data differs ---------- */
  const view = $('view');
  function page(draw, figures) {
    const first = draw();
    if (first) { figures(); requestAnimationFrame(() => requestAnimationFrame(() => view.querySelectorAll('.reveal').forEach(el => seen.observe(el)))); }
    live.then(changed => {
      if (!changed && first) return;
      if (draw()) { figures(); view.querySelectorAll('.reveal').forEach(el => el.classList.add('in')); }
      else missing();
      renderIndex();
    });
    let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (view.querySelector('article')) figures(); }, 120); });
  }
  function missing() {
    document.title = 'Not in the Cabinet';
    view.innerHTML = '<div class="topline"><a href="cabinet.html">← The Cabinet</a></div><div class="absent"><h1>Not in the Cabinet</h1><p>No drawer carries that name. <a href="cabinet.html">Return to the halls</a>, or press <kbd>/</kbd> to look it up.</p></div>';
  }
  const width = () => Math.floor(view.clientWidth - parseFloat(getComputedStyle(view).paddingLeft) * 2);

  /* where a target was opened from, so it can be left the same way */
  const lead = {
    set: v => { try { v ? sessionStorage.setItem('cabinet.lead', v) : sessionStorage.removeItem('cabinet.lead'); } catch (e) {} },
    get: () => { try { const [m, w] = (sessionStorage.getItem('cabinet.lead') || '').split('+'); return BY[m] ? { a: BY[m], z: BY[w] || null } : null; } catch (e) { return null; } },
  };

  // Only these pages morph into one another; leaving for the Atlas or the Archive is a plain cut.
  addEventListener('pageswap', e => {
    if (!e.viewTransition || /\/cabinet(-\w+)?\.html$/.test(new URL(e.activation?.entry?.url || location.href).pathname)) return;
    e.viewTransition.ready.catch(() => {});
    e.viewTransition.skipTransition();
  });

  return { T, RX, $, G, GROUP, AG, BY, WALL, TWALL, TRANSPORTERS, U, still, word, low, cap, esc, list, fmt, slug, param, no3, measured, termFor, actWord, verb, term, gist, rowSub, hallDesc, search, rail, seen, here, renderIndex, live, keys, page, width, lead };
})();
