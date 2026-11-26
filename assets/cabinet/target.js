/* cabinet-target.html: one target and everything that holds it. */
(() => {
  const { T, RX, $, AG, TWALL, TRANSPORTERS, U, word, low, cap, esc, fmt, param, rail, here, keys, page, width, lead } = CAB;

  function targetHTML(t) {
    const rx = RX[t.id], ti = T.indexOf(t), trans = TRANSPORTERS.has(t.id);
    const all = AG.filter(a => a.b[t.id]?.n > 0).map(a => ({ ...a, b: a.b[t.id] })).sort((x, y) => y.b.pki - x.b.pki);
    const none = AG.filter(a => a.b[t.id] && a.b[t.id].n === 0);
    if (all[0]) all[0].top = true;
    const kinds = [['Activate it', 'activate', ['rise']], ['Boost it', 'boost', ['pam']], ['Partly activate it', 'partly activate', ['partial']], [trans ? 'Stop it' : 'Block it', trans ? 'stop' : 'block', ['hang']], ['Push it below rest', 'below rest', ['inverse']], ['Effect unrecorded', 'unrecorded', ['thread']]];
    const groups = kinds.map(([title, short, ks]) => ({ title, short, items: all.filter(x => ks.includes(FIG.form(x.b))) })).filter(x => x.items.length);
    const known = groups.filter(x => x.short !== 'unrecorded'), un = groups.find(x => x.short === 'unrecorded');
    const unWide = un && (un.items.length > 16 || known.length > 3), alone = known.length === 1 && (unWide || !un); // one list alone runs the full width
    const li = x => `<li><a href="${U.m(x)}">${esc(x.name)}<span>${fmt(x.b.pki)}</span></a></li>`;
    const st = (kind, title, s) => s ? `<div class="reveal">${FIG.receptor(t.id, kind, ti)}<h2>${title}</h2><p class="st">${esc(s.title)}</p><ul>${s.presentation.slice(0, 3).map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>` : '';
    const states = !rx ? '' : trans ? st('rest', 'At rest', rx.normal_state) + st('hang', 'Stopped', rx.overstimulated)
      : st('hang', 'Blocked', rx.understimulated) + st('rest', 'At rest', rx.normal_state) + st(t.id === 'gaba_a' ? 'pam' : 'rise', 'Activated', rx.overstimulated);
    const def = t.def.replace(/:.*$/, '').replace(/ \((?:[A-Z0-9, &a-z]+)\)/, m => m);
    const after = /:/.test(t.def) ? cap(t.def.split(':').slice(1).join(':').trim()) + '.' : '';
    return { groups, html: `
      <div class="topline"><a href="${back()}">← ${from ? esc(from.a.name) : 'The Cabinet'}</a><span><kbd>←</kbd> <kbd>→</kbd> walk the targets · <kbd>Esc</kbd> return</span></div>
      <article>
        <header class="target-head reveal">
          <div>
            <h1>${t.label}</h1>
            <p class="lede">${esc(def)}. ${cap(word(all.length))} of ${word(AG.length)} medications ${all.length === 1 ? 'holds' : 'hold'} it${all[0] ? `, ${esc(low(all[0].name))} most tightly` : ''}.</p>
            <p class="more">${esc(after)} ${U.archive(t) ? `<a href="${U.archive(t)}">Its entry in the Archive</a>` : ''}</p>
          </div>
          ${FIG.receptor(t.id, 'rest', ti)}
        </header>
        <figure class="chandelier reveal" id="chandelier"></figure>
        <div class="roll" style="--cols:${Math.max(2, Math.min(4, known.length + (un ? 1 : 0)))}">
          ${known.map(g => `<section class="${alone ? 'wide' : ''}"><h2>${g.title}</h2><ul>${g.items.map(li).join('')}</ul></section>`).join('')}
          ${un ? `<section class="${unWide ? 'wide' : ''}"><h2>${un.title}</h2><ul>${un.items.map(li).join('')}</ul></section>` : ''}
        </div>
        ${none.length ? `<p class="unbound">Tested here, nothing bound: ${none.map(a => `<a href="${U.m(a)}">${esc(a.name)}</a>`).join(', ')}.</p>` : ''}
        ${states ? `<section class="states" style="--n:${trans ? 2 : 3}" aria-label="What each state looks like">${states}</section>` : ''}
        <nav class="walk" aria-label="Neighbouring targets">
          ${T[ti - 1] ? `<a href="${U.t(T[ti - 1])}">← Before it<b>${T[ti - 1].label}</b></a>` : '<span></span>'}
          ${T[ti + 1] ? `<a href="${U.t(T[ti + 1])}">After it →<b>${T[ti + 1].label}</b></a>` : '<span></span>'}
        </nav>
      </article>` };
  }

  let t, groups, from;
  const back = () => from ? U.m(from.a, from.z) : 'cabinet.html';
  function draw() {
    t = T.find(x => x.id === param('t')); if (!t) return false;
    here.t = t; from = lead.get();
    document.body.dataset.room = TWALL[t.id];
    document.title = `${t.label} · The Cabinet`;
    const r = targetHTML(t); groups = r.groups; $('view').innerHTML = r.html;
    rail(-1);
    return true;
  }
  page(draw, () => { $('chandelier').innerHTML = FIG.chandelier(groups, width()); });

  keys.step = d => { const n = T[T.indexOf(t) + d]; if (t && n) location.href = U.t(n); };
  keys.escape = () => { location.href = back(); };
  $('view').addEventListener('mouseover', e => {
    const c = e.target.closest('.ch'); const out = $('view').querySelector('.readout'); if (!out) return;
    if (!c) { out.textContent = ''; return; }
    const W = +out.ownerSVGElement.getAttribute('width'), x = +c.dataset.x;
    out.textContent = `${c.dataset.name} ${c.dataset.pki}`;
    const half = out.getComputedTextLength() / 2;
    out.setAttribute('x', Math.max(half, Math.min(W - half, x))); out.setAttribute('y', c.dataset.y);
  });
})();
