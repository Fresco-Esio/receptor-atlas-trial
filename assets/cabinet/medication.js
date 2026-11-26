/* cabinet-medication.html: one medication, or two set side by side. */
(() => {
  const { T, RX, $, GROUP, AG, BY, WALL, U, word, low, cap, esc, list, fmt, param, no3, measured, termFor, actWord, verb, term, gist, rail, here, keys, page, width, lead } = CAB;

  const tlink = x => `<a href="${U.t(x.t)}">${x.t.label}${x.b && x.b.n ? ` <span>${fmt(x.b.pki)}</span>` : ''}</a>`;
  function stateFor(t, b) {
    const rx = RX[t.id]; if (!rx || !b.act) return null;
    return b.act === 'an' ? rx.understimulated : rx.overstimulated;
  }
  function holdHTML({ t, b, i }, k) {
    const s = stateFor(t, b), rx = RX[t.id], f = FIG.form(b);
    const short = f === 'partial';
    return `<section class="hold reveal">
      <figure class="hold-fig">${FIG.receptor(t.id, f, i)}</figure>
      <div>
        <h2><a href="${U.t(t)}">${esc(rx ? rx.name.replace(/ \(.*\)$/, '') : t.label)}</a></h2>
        <p class="does">${cap(actWord(b)).match(/^[AEIOU]/) ? 'An' : 'A'} ${term(termFor(b), esc(actWord(b)))} here, holding at pKᵢ ${fmt(b.pki)} across ${b.n === 1 ? 'one measurement' : word(b.n) + ' measurements'}.</p>
        ${s ? `<p class="state">${short ? `Toward ${esc(s.title)}, stopping short of it` : esc(s.title)}</p><ul>${s.presentation.slice(0, 3).map(p => `<li>${esc(p)}</li>`).join('')}</ul>`
            : `<p class="state">${esc(t.def)}.</p>`}
        <p class="more"><a href="${U.t(t)}">Everything that holds ${t.label}</a>${U.archive(t) ? `<a href="${U.archive(t)}">Its entry in the Archive</a>` : ''}</p>
      </div>
    </section>`;
  }
  function compareSay(a, z) {
    const rows = T.map(t => ({ t, x: a.b[t.id], y: z.b[t.id] }));
    const both = rows.filter(r => r.x?.n > 0 && r.y?.n > 0 && r.x.pki >= 6.5 && r.y.pki >= 6.5);
    const only = (p, q) => rows.filter(r => r[p]?.n > 0 && r[p].pki >= 6.5 && !(r[q]?.n > 0 && r[q].pki >= 6.5)).sort((m, n) => n[p].pki - m[p].pki);
    const same = both.filter(r => r.x.act && r.y.act && verb(r.x) === verb(r.y)), differ = both.filter(r => r.x.act && r.y.act && verb(r.x) !== verb(r.y)), dim = both.filter(r => !r.x.act || !r.y.act);
    const wide = both.filter(r => Math.abs(r.x.pki - r.y.pki) >= 1).sort((m, n) => Math.abs(n.x.pki - n.y.pki) - Math.abs(m.x.pki - m.y.pki)).slice(0, 3);
    const times = d => Math.round(10 ** d) >= 100 ? 'over a hundred' : Math.round(10 ** d);
    const pv = (r, p) => `${r.t.label} <span class="mono">${fmt(r[p].pki)}</span>`;
    return `<section class="compare-say" aria-label="Side by side">
      <div><h2>Where they agree</h2>
        <p>${same.length ? `Both ${list(Object.entries(same.reduce((m, r) => ((m[verb(r.x).replace(/s\b/, '')] ||= []).push(r.t.label), m), {})).map(([v, ts]) => `${v} ${list(ts)}`))}.` : both.length ? 'They share targets, but no recorded action in common.' : 'They share no target held at 6.5 or tighter.'}</p>
        ${dim.length ? `<p>Both also hold ${list(dim.map(r => r.t.label))}, with an action unrecorded for at least one.</p>` : ''}</div>
      <div><h2>Where they part</h2>
        ${differ.length ? `<p>They act differently at ${list(differ.map(r => r.t.label))}.</p>` : ''}
        ${wide.map(r => { const d = r.x.pki - r.y.pki; return `<p>${d > 0 ? a.name : z.name} holds ${r.t.label} ${times(Math.abs(d))} times tighter.</p>`; }).join('')}
        ${!differ.length && !wide.length ? '<p>Nothing they share differs by a full step of affinity or in recorded action.</p>' : ''}</div>
      <div><h2>What only one holds</h2>
        <p>${a.name}: ${only('x', 'y').slice(0, 6).map(r => pv(r, 'x')).join(', ') || 'nothing the other lacks'}.</p>
        <p>${z.name}: ${only('y', 'x').slice(0, 6).map(r => pv(r, 'y')).join(', ') || 'nothing the other lacks'}.</p></div>
    </section>`;
  }
  function compareLede(a, z) {
    const r = T.map(t => ({ t, x: a.b[t.id], y: z.b[t.id] })).filter(q => q.x?.act && q.y?.act && q.x.n > 0 && q.y.n > 0 && Math.min(q.x.pki, q.y.pki) >= 6.5)
      .sort((p, q) => q.x.pki + q.y.pki - p.x.pki - p.y.pki);
    const differ = r.filter(q => verb(q.x) !== verb(q.y)), same = r.filter(q => verb(q.x) === verb(q.y));
    if (differ.length) return `At ${differ[0].t.label}, ${low(a.name)} ${verb(differ[0].x)} where ${low(z.name)} ${verb(differ[0].y)}.`;
    if (same.length) { const d = same[0].x.pki - same[0].y.pki; return `They act alike at ${list(same.slice(0, 3).map(q => q.t.label))}${Math.abs(d) >= .5 ? `, though ${d > 0 ? low(a.name) : low(z.name)} holds ${same[0].t.label} more tightly` : ''}.`; }
    return 'No recorded action in common at the targets they hold most tightly.';
  }
  function specimenHTML(a, z) {
    const g = GROUP[a.g], m = measured(a), k = AG.indexOf(a), prev = AG[k - 1], next = AG[k + 1];
    const strong = m.filter(x => x.b.pki >= 6.5), reads = strong.filter(x => x.b.act).slice(0, 4);
    const unrec = strong.filter(x => !x.b.act), weak = m.filter(x => x.b.pki < 6.5);
    const none = T.filter(t => a.b[t.id] && a.b[t.id].n === 0), never = T.filter(t => !a.b[t.id]);
    const name = esc(a.name);
    return `
      <div class="topline"><a href="${U.row(a)}">← ${g.roman} · ${esc(g.label)}</a><span>${z ? '' : '<kbd>←</kbd> <kbd>→</kbd> walk · '}<kbd>Esc</kbd> return</span></div>
      <article>
        <header class="spec-head">
          ${z ? `<h1 class="pair">${name} <span>${esc(z.name)}</span></h1>` : `<div><h1>${name}</h1><p class="no">No. ${no3(a)}</p></div>`}
          <p class="lede">${esc(z ? compareLede(a, z) : gist(a))}</p>
        </header>
        <figure class="membrane reveal"><div id="plate"></div>
          <figcaption><span>${z ? `<b>${name}</b> in full line, <b class="b">${esc(z.name)}</b> dotted. Rises where it activates, hangs where it blocks.` : 'Rises where it activates, hangs where it blocks; a thread where the effect is unrecorded. Numbers are pKᵢ.'}</span>
          ${z ? `<span><a class="beside" href="${U.m(z)}">Turn to ${esc(z.name)}</a> &nbsp; <a class="beside" href="${U.m(a)}">Put it away</a></span>` : `<button type="button" class="beside" id="beside">Set it beside another</button>`}</figcaption>
        </figure>
        ${z ? compareSay(a, z) : reads.map(holdHTML).join('')}
        <dl class="provenance">
          <dt>Class</dt><dd><a href="${U.hall(g)}">${esc(g.label)}</a></dd>
          ${unrec.length ? `<dt>Also holds, effect unrecorded</dt><dd>${unrec.map(tlink).join(', ')}</dd>` : ''}
          ${weak.length ? `<dt>Holds weakly</dt><dd>${weak.map(tlink).join(', ')}</dd>` : ''}
          ${none.length ? `<dt>Tested, nothing bound</dt><dd>${none.map(t => tlink({ t })).join(', ')}</dd>` : ''}
          ${never.length ? `<dt>Never tested</dt><dd>${never.map(t => tlink({ t })).join(', ')}</dd>` : ''}
          <dt>Source</dt><dd>${m.length ? `${m.reduce((s, x) => s + x.b.n, 0)} human measurements, PDSP KiDB; actions IUPHAR/BPS` : 'No human binding in PDSP KiDB for these targets'}</dd>
        </dl>
        <nav class="walk" aria-label="Neighbouring medications">
          ${prev ? `<a href="${U.m(prev)}">← No. ${no3(prev)}<b>${esc(prev.name)}</b></a>` : '<span></span>'}
          ${next ? `<a href="${U.m(next)}">No. ${no3(next)} →<b>${esc(next.name)}</b></a>` : '<span></span>'}
        </nav>
      </article>`;
  }

  let a, z;
  function draw() {
    a = BY[param('m')]; if (!a) return false;
    z = BY[param('with')]; if (!z || z === a) z = null;
    here.a = a;
    document.body.dataset.room = WALL[a.g];
    document.title = `${z ? `${a.name} and ${z.name}` : a.name} · The Cabinet`;
    $('view').innerHTML = specimenHTML(a, z);
    rail(GROUP[a.g].i);
    return true;
  }
  function figures() {
    const amp = Math.round(Math.max(105, Math.min(190, (innerHeight - 500) / 2)));
    $('plate').innerHTML = FIG.plate(a, T, width(), { amp, twin: z, label: `${a.name}, its hold on sixteen targets` });
  }
  page(draw, figures);

  keys.step = d => { if (!a || z) return; const n = AG[AG.indexOf(a) + d]; if (n) location.href = U.m(n); };
  keys.escape = () => { location.href = !a ? 'cabinet.html' : z ? U.m(a) : U.row(a); };
  addEventListener('pageshow', () => lead.set(a ? a.slug + (z ? '+' + z.slug : '') : ''));
})();
