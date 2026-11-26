/* The Cabinet's engravings.
   One drawing at three sizes: a medication as a membrane with sixteen targets set in it.
     rises from the membrane   the drug activates that target
     hangs from it             the drug blocks it (a transporter is stopped)
     a thread through it       it binds; what it does has not been recorded
     bare membrane             tested, nothing bound
     no membrane               never tested
   Length is affinity. Vermilion marks the tightest hold, as the Archive warms one helix per plate.
   Receptor engravings are the Archive's own three archetypes, redrawn with the drug in place.
   Membranes are laid out in real pixels, so a stroke is always one pixel wide. */
window.FIG = (() => {
  const FAMILIES = [3, 2, 3, 3, 1, 2, 1, 1]; // transporters, dopamine, serotonin, adrenergic, H1, muscarinic, GABA-A, mu
  const GAP = 0.42, PMIN = 5, PMAX = 9.8;
  const h01 = p => Math.max(0.05, Math.min(1, (p - PMIN) / (PMAX - PMIN)));
  const r1 = n => Math.round(n * 10) / 10;

  function columns(W) {
    const u = W / (16 + GAP * (FAMILIES.length - 1)), xs = [], fam = [];
    let x = 0;
    FAMILIES.forEach((n, f) => { if (f) x += GAP * u; for (let k = 0; k < n; k++) { xs.push(x + u / 2); fam.push(f); x += u; } });
    return { u, xs, fam };
  }

  const st = (cls, order, d) => `<path class="stroke${cls}" style="--draw-order:${order}" pathLength="1" d="${d}"/>`;
  const c = (cls, o, x, y, r) => `<circle class="stroke${cls}" style="--draw-order:${o}" pathLength="1" cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}"/>`;

  /* how a binding is drawn */
  function form(b) {
    const f = (b.actFull || '').toLowerCase();
    if (!b.act) return 'thread';
    if (f.includes('allosteric')) return 'pam';
    if (f.includes('partial')) return 'partial';
    if (f.includes('inverse')) return 'inverse';
    return b.act === 'ag' ? 'rise' : 'hang';
  }
  const hangs = k => k === 'hang' || k === 'inverse';

  /* one binding. yt, yb: the two rails. L: length. r: half the hairpin's width */
  function binding(kind, x, yt, yb, L, r, cls, order) {
    if (kind === 'thread') {
      if (yb - yt > 16) { // a label lies in the membrane, so the thread breaks around it
        const h = Math.max(4, L / 2);
        return st(' quiet' + cls, order, `M${r1(x)} ${yt} V${r1(yt - h)}`) + st(' quiet' + cls, order, `M${r1(x)} ${yb} V${r1(yb + h)}`);
      }
      const half = L / 2 + (yb - yt) / 2, m = (yt + yb) / 2;
      return st(' quiet' + cls, order, `M${r1(x)} ${r1(m - half)} V${r1(m + half)}`);
    }
    const s = hangs(kind) ? 1 : -1, y0 = s < 0 ? yt : yb, rr = Math.min(r, L * 0.75);
    const yk = r1(y0 + s * (L - rr)), cy = r1(y0 + s * (L + rr * 0.33)), tip = y0 + s * L;
    let out = st(cls, order, `M${r1(x - r)} ${y0} V${yk} C ${r1(x - r)} ${cy}, ${r1(x + r)} ${cy}, ${r1(x + r)} ${yk} V${y0}`);
    const w = r * 1.8;
    if (kind === 'partial') out += st(cls, order + 1, `M${r1(x - w)} ${r1(tip - 3)} H${r1(x + w)}`);
    if (kind === 'inverse') out += st(cls, order + 1, `M${r1(x - w)} ${r1(tip + 3)} H${r1(x + w)}`);
    if (kind === 'pam') { const q = Math.max(2, r * 0.4); out += c(cls, order + 1, x + r + q + 2, y0 - q - 2, q); }
    return out;
  }

  const screened = b => b && (b.n > 0 || b.nc);
  function tightest(a, T) { let k = -1, best = 0; T.forEach((t, i) => { const b = a.b[t.id]; if (b && b.n > 0 && b.pki > best) { best = b.pki; k = i; } }); return k; }

  /* the engraving in a catalogue row */
  function row(a, T, W, H) {
    const { u, xs } = columns(W), band = 5, yt = Math.floor((H - band) / 2) + 0.5, yb = yt + band, amp = yt - 8, warm = tightest(a, T);
    let rails = '', marks = '';
    T.forEach((t, i) => {
      const b = a.b[t.id]; if (!screened(b)) return;
      const x0 = r1(xs[i] - u / 2), x1 = r1(xs[i] + u / 2);
      rails += `M${x0} ${yt} H${x1} M${x0} ${yb} H${x1} `;
      if (b.n > 0) marks += binding(form(b), xs[i], yt, yb, h01(b.pki) * amp, 4.5, i === warm ? ' warm' : '', i % 4);
    });
    return `<svg class="memb" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path class="rail-line" d="${rails || 'M0 0'}"/>${marks}</svg>`;
  }

  /* the specimen plate: labels lie in the membrane, values stand at the tips */
  function plate(a, T, W, opts = {}) {
    const { u, xs } = columns(W), amp = opts.amp || 150, band = 44, pad = 30;
    const twin = opts.twin;
    let reachUp = 46, reachDown = 46;
    [a, twin].filter(Boolean).forEach(d => T.forEach(t => { const b = d.b[t.id]; if (!b || !(b.n > 0)) return; const L = h01(b.pki) * amp, k = form(b);
      if (k === 'thread') { reachUp = Math.max(reachUp, L / 2); reachDown = Math.max(reachDown, L / 2); } else if (hangs(k)) reachDown = Math.max(reachDown, L); else reachUp = Math.max(reachUp, L); }));
    const yt = Math.ceil(pad + reachUp) + 0.5, yb = yt + band, H = Math.ceil(yb + reachDown + pad);
    const warm = tightest(a, T), r = Math.min(11, u * 0.16) * (twin ? 0.78 : 1), dx = twin ? r + 5 : 0, font = r1(Math.min(13, u / 4.6));
    let rails = '', marks = '', twins = '', text = '', links = '';
    const tipY = b => {
      const k = form(b), L = h01(b.pki) * amp;
      if (k === 'thread') return yt - Math.max(4, L / 2) - 9;
      const extra = k === 'partial' || k === 'inverse' ? 4 : 0;
      return hangs(k) ? yb + L + extra + 19 : yt - L - extra - 9;
    };
    T.forEach((t, i) => {
      const b = a.b[t.id], tb = twin && twin.b[t.id], x0 = r1(xs[i] - u / 2), x1 = r1(xs[i] + u / 2);
      if (screened(b) || screened(tb)) rails += `M${x0} ${yt} H${x1} M${x0} ${yb} H${x1} `;
      if (b && b.n > 0) {
        const cls = i === warm ? ' warm' : '';
        marks += binding(form(b), xs[i] - dx, yt, yb, h01(b.pki) * amp, r, cls, 1 + i % 5);
        if (!twin || b.pki >= 6) text += `<text class="fv${cls || (b.act ? '' : ' dim')}" x="${r1(xs[i] - dx)}" y="${r1(tipY(b))}" text-anchor="middle">${b.pki.toFixed(1)}</text>`;
      }
      if (tb && tb.n > 0) {
        twins += binding(form(tb), xs[i] + dx, yt, yb, h01(tb.pki) * amp, r, '', 0);
        const clash = b && b.n > 0 && b.pki >= 6 && Math.abs(tipY(b) - tipY(tb)) < 11;
        if (tb.pki >= 6) text += `<text class="fv twin" x="${r1(xs[i] + dx + (clash ? 8 : 0))}" y="${r1(tipY(tb))}" text-anchor="middle">${tb.pki.toFixed(1)}</text>`;
        if (clash) text = text.replace(`x="${r1(xs[i] - dx)}" y="${r1(tipY(b))}"`, `x="${r1(xs[i] - dx - 8)}" y="${r1(tipY(b))}"`);
      }
      const off = !screened(b) && !screened(tb) ? ' off' : '';
      links += `<a href="cabinet-target.html?t=${t.id}" class="fl${off}${i === warm ? ' warm' : ''}" data-i="${i}" aria-label="${t.label}: every medication that holds it"><rect x="${x0}" y="0" width="${r1(u)}" height="${H}" fill="transparent"/><text x="${r1(xs[i])}" y="${yt + band / 2 + 4}" text-anchor="middle" style="font-size:${font}px">${t.label}</text></a>`;
    });
    return `<svg class="memb memb-plate" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="group" aria-label="${opts.label || ''}"><path class="rail-line" d="${rails || 'M0 0'}"/>${marks}<g class="twin">${twins.replaceAll(' pathLength="1"', '')}</g>${text}${links}</svg>`;
  }

  /* everything that holds one target, set in one membrane */
  function chandelier(groups, W) {
    const amp = 132, band = 34, pad = 34, gap = 2.4;
    const need = g => g.short.length * 7.3 + 18;
    let step = 40;
    const width = () => groups.reduce((s, g) => s + Math.max(g.items.length * step, need(g)), 0) + gap * step * (groups.length - 1);
    while (width() > W && step > 8) step -= 0.25;
    const r = Math.min(8, step * 0.25);
    const down = groups.some(g => g.items.some(i => hangs(form(i.b)))), up = groups.some(g => g.items.some(i => ['rise', 'partial', 'pam'].includes(form(i.b))));
    const ampUp = up ? amp : amp / 2, yt = pad + ampUp + 0.5, yb = yt + band, H = Math.ceil(yb + (down ? amp : amp / 2) + pad);
    let x = step / 2, marks = '', rails = '', text = '';
    groups.forEach(g => {
      const x0 = x - step / 2;
      g.items.forEach((it, k) => {
        const L = h01(it.b.pki) * amp, f = form(it.b);
        marks += `<a href="cabinet-medication.html?m=${it.slug}" class="ch" data-slug="${it.slug}" data-name="${it.name}" data-pki="${it.b.pki.toFixed(1)}" data-x="${r1(x)}" data-y="${r1(hangs(f) ? yb + L + 24 : yt - (f === 'thread' ? L / 2 : L) - 14)}" aria-label="${it.name}, ${it.b.pki.toFixed(1)}"><rect x="${r1(x - step / 2)}" y="${pad / 2}" width="${r1(step)}" height="${H - pad}" fill="transparent"/>${binding(f, x, yt, yb, L, r, it.top ? ' warm' : '', Math.min(8, k % 9))}</a>`;
        x += step;
      });
      const x1 = Math.max(x - step / 2, x0 + need(g));
      rails += `M${r1(x0)} ${yt} H${r1(x1)} M${r1(x0)} ${yb} H${r1(x1)} `;
      text += `<text class="fb" x="${r1(x0 + 9)}" y="${yt + band / 2 + 4}">${g.short}</text>`;
      x = x1 + step / 2;
      x += gap * step;
    });
    return `<svg class="memb memb-ch" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="group" aria-label="Every medication measured here, by what it does and how tightly it holds"><path class="rail-line" d="${rails}"/>${marks}${text}<text class="fv readout" text-anchor="middle"></text></svg>`;
  }

  /* the six forms, for the key */
  function formMark(k) {
    const yt = 45.5, yb = 50.5;
    return `<svg class="memb" width="56" height="96" viewBox="0 0 56 96" aria-hidden="true"><path class="rail-line" d="M0 ${yt} H56 M0 ${yb} H56"/>${k === 'none' ? '' : k === 'scale' ? [[10, 9], [28, 21], [46, 34]].map(([x, L]) => binding('rise', x, yt, yb, L, 5, '', 1)).join('') : binding(k, 28, yt, yb, 34, 5, '', 1)}</svg>`;
  }

  /* ---------- the Archive's archetypes, with the drug in place ---------- */
  const rails2 = st(' faint', 0, 'M46 150 H474') + st(' faint', 0, 'M46 290 H474');
  function gpcr(kind, accent) {
    const xs = [110, 160, 210, 260, 310, 360, 410], top = 150, bot = 290;
    let s = rails2;
    xs.forEach((x, i) => { s += `<rect class="stroke${i === accent ? ' warm' : ''}" style="--draw-order:${1 + i % 3}" pathLength="1" x="${x - 10}" y="${top}" width="20" height="140" rx="10"/>`; });
    [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]].forEach(([p, q], i) => { const y = i % 2 ? top : bot, k = i % 2 ? y - 44 : y + 44; s += st(' faint', 2, `M${xs[p]} ${y} C ${xs[p]} ${k}, ${xs[q]} ${k}, ${xs[q]} ${y}`); });
    s += st(' faint', 2, 'M110 150 C 88 122, 64 120, 54 92') + st(' faint', 2, 'M410 290 C 430 318, 452 320, 464 346');
    if (kind !== 'rest') s += c(' warm', 3, 260, 128, 11);
    if (hangs(kind)) { // the pocket is capped, the G protein lies idle
      s += st(' warm', 4, 'M222 106 H298') + c(' faint', 5, 248, 372, 17) + c(' faint', 5, 285, 386, 12) + c(' faint', 5, 221, 392, 9);
      if (kind === 'inverse') s += st(' warm', 5, 'M216 336 H296');
    } else if (kind === 'partial') { // it reaches the G protein and stops at a ceiling
      s += st(' faint', 4, 'M260 290 C 256 308, 250 316, 248 341') + c('', 5, 248, 358, 17) + c('', 5, 285, 372, 12) + c('', 5, 221, 378, 9) + st(' warm', 6, 'M231 358 A17 17 0 0 0 265 358 Z') + st(' warm', 6, 'M214 333 H296');
    } else if (kind === 'rest') {
      s += c('', 5, 248, 358, 17) + c('', 5, 285, 372, 12) + c('', 5, 221, 378, 9);
    } else {
      s += st(' warm', 4, 'M260 290 C 256 308, 250 316, 248 341') + c(' warm', 5, 248, 358, 17) + c(' warm', 6, 285, 372, 12) + c('', 6, 221, 378, 9);
    }
    return s;
  }
  function transporter(kind) {
    let s = rails2 + st('', 1, 'M150 150 L212 150 L242 220 L212 290 L150 290 Z') + st('', 1, 'M370 150 L308 150 L278 220 L308 290 L370 290 Z');
    const dots = [[206, 118, 6], [320, 108, 5], [300, 128, 4], [176, 92, 5], [236, 84, 4], [348, 78, 6], [280, 64, 5], [142, 122, 4], [118, 72, 5], [390, 120, 4]];
    dots.slice(0, kind === 'rest' ? 3 : 10).forEach(([x, y, r], i) => { s += c(kind === 'rest' ? ' faint' : '', 2 + i % 3, x, y, r); });
    if (kind === 'rest') return s + st(' warm', 4, 'M260 96 V140') + st(' warm', 4, 'M249 128 L260 142 L271 128') + c(' warm', 3, 260, 212, 15) + c('', 3, 260, 250, 7);
    return s + c(' warm', 3, 260, 182, 20) + st(' warm', 4, 'M222 142 H298');
  }
  function channel(kind) {
    const cx = 260, cy = 210, R = 104, open = kind === 'pam' || kind === 'rise';
    let s = c(' faint', 0, cx, cy, 190);
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; s += c('', 1 + i, cx + R * Math.cos(a), cy + R * Math.sin(a), 60); }
    if (kind !== 'rest') { const a = -Math.PI / 2 + Math.PI / 5; s += c(' warm', 6, cx + 150 * Math.cos(a), cy + 150 * Math.sin(a), 14); }
    return s + c('', 6, cx, cy, 40) + c(' warm', 7, cx, cy, open ? 26 : 9);
  }
  function receptor(tid, kind, i) {
    const s = ['sert', 'net', 'dat'].includes(tid) ? transporter(kind) : tid === 'gaba_a' ? channel(kind) : gpcr(kind, [3, 5, 1, 4, 2, 6, 0][i % 7]);
    return `<svg class="eng" viewBox="0 0 520 420" aria-hidden="true">${s}</svg>`;
  }

  return { columns, row, plate, chandelier, formMark, receptor, form, tightest };
})();
