/* TECHNOVA — Atelier de conception (ES5). Trois projets ouverts : plusieurs solutions valides, à optimiser. */
(function () {
  'use strict';
  var TN = window.TN, el = TN.el, $ = TN.$, clear = TN.clear;

  function num(v, d) { return String(Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).replace('.', ','); }

  var P = [
    {
      nom: 'Pont de jardin', icone: '🌉',
      brief: 'Un petit pont de 60 cm doit permettre à un chariot de 3 kg de franchir une rigole du jardin du collège. Il reste dehors toute l’année. Budget : 4 € maximum.',
      mats: [
        { nom: 'Carton', info: 'léger, bon marché', k: 0.10, prix: 0.15, eau: false, couleur: '#d9a976' },
        { nom: 'Contreplaqué', info: 'rigide, traité extérieur', k: 0.30, prix: 0.45, eau: true, couleur: '#c9a06a' },
        { nom: 'Aluminium', info: 'très résistant, cher', k: 0.90, prix: 1.50, eau: true, couleur: '#b9d6e4' }],
      params: [{ nom: 'Épaisseur du tablier', min: 1, max: 6, step: 1, v: 2, unit: 'mm' }, { nom: 'Renforts en triangle', min: 0, max: 4, step: 1, v: 0, unit: '' }],
      calc: function (m, v) {
        var cap = m.k * v[0] * v[0] * (1 + 0.5 * v[1]);
        var cout = m.prix * v[0] + 0.4 * v[1];
        return {
          crit: [
            { ok: cap >= 3, t: 'Charge supportée : ' + num(cap, 2) + ' kg (au moins 3 kg)' },
            { ok: cout <= 4.0001, t: 'Coût : ' + num(cout, 2) + ' € (4 € maximum)' },
            { ok: m.eau, t: m.eau ? 'Résiste à l’humidité' : 'Ne résiste pas à l’humidité : le carton gonfle et s’effondre dehors' }],
          score: cout, scoreTxt: num(cout, 2) + ' €', cap: cap
        };
      },
      scoreLabel: 'le pont valide le moins cher'
    },
    {
      nom: 'Support de téléphone', icone: '📱',
      brief: 'Un support doit tenir un téléphone incliné pour regarder une vidéo sur une table. Confort : angle entre 55° et 70°. Il doit être stable, rigide, et peser 40 g au maximum (matière limitée).',
      mats: [
        { nom: 'PLA', info: 'impression 3D, rigide', rho: 1.24, rigide: true, couleur: '#7fd3ff' },
        { nom: 'Carton', info: 'léger, souple', rho: 0.70, rigide: false, couleur: '#d9a976' },
        { nom: 'Contreplaqué', info: 'découpe laser, rigide', rho: 0.55, rigide: true, couleur: '#c9a06a' }],
      params: [{ nom: 'Largeur de la base', min: 6, max: 16, step: 1, v: 6, unit: 'cm' }, { nom: 'Angle du dossier', min: 45, max: 80, step: 5, v: 45, unit: '°' }],
      calc: function (m, v) {
        var besoin = 2 + 12 * Math.cos(v[1] * Math.PI / 180);
        var stable = v[0] >= besoin;
        var masse = m.rho * (6 * v[0] + 40) * 0.3;
        return {
          crit: [
            { ok: stable, t: stable ? 'Stable : la base est assez large pour cet angle' : 'Bascule : à ' + v[1] + '°, il faudrait une base d’au moins ' + Math.ceil(besoin) + ' cm' },
            { ok: v[1] >= 55 && v[1] <= 70, t: 'Angle : ' + v[1] + '° (confort entre 55° et 70°)' },
            { ok: masse <= 40, t: 'Masse : ' + num(masse, 1) + ' g (40 g maximum)' },
            { ok: m.rigide, t: m.rigide ? 'Rigide : ne plie pas sous le téléphone' : 'Trop souple : le carton plie sous le poids du téléphone' }],
          score: masse, scoreTxt: num(masse, 1) + ' g', stable: stable
        };
      },
      scoreLabel: 'le support valide le plus léger'
    },
    {
      nom: 'Robot de livraison', icone: '🤖',
      brief: 'Le robot transporte un colis de 1 kg pendant au moins 3 h. Il doit peser 1,6 kg au maximum sans le colis, et coûter 60 € au plus. Attention : une batterie plus grosse est aussi plus lourde, et un robot lourd consomme plus.',
      mats: [
        { nom: 'Plastique recyclé', info: 'châssis 600 g, 8 €', masse: 600, prix: 8, couleur: '#7fe0a4' },
        { nom: 'Aluminium', info: 'châssis 900 g, 20 €', masse: 900, prix: 20, couleur: '#b9d6e4' },
        { nom: 'Acier', info: 'châssis 1 800 g, 12 €', masse: 1800, prix: 12, couleur: '#8a97a8' }],
      params: [{ nom: 'Capacité de la batterie', min: 10, max: 60, step: 5, v: 20, unit: 'Wh' }],
      calc: function (m, v) {
        var masse = m.masse + 500 + 6 * v[0];
        var puissance = 6 + 4 * (masse + 1000) / 1000;
        var auto = v[0] * 0.9 / puissance;
        var cout = m.prix + 15 + 0.6 * v[0];
        return {
          crit: [
            { ok: auto >= 3, t: 'Autonomie : ' + num(auto, 2) + ' h (au moins 3 h) — consommation ' + num(puissance, 1) + ' W' },
            { ok: masse <= 1600, t: 'Masse sans colis : ' + num(masse / 1000, 2) + ' kg (1,6 kg maximum)' },
            { ok: cout <= 60, t: 'Coût : ' + num(cout, 0) + ' € (60 € maximum)' }],
          score: cout, scoreTxt: num(cout, 0) + ' €', masse: masse
        };
      },
      scoreLabel: 'le robot valide le moins cher'
    }
  ];

  var cur = 0, mat = 0, vals = [], last = null, log = [];

  function tabs() {
    var box = clear($('projects')), st = TN.get().atelier;
    for (var i = 0; i < P.length; i++) {
      var b = el('button', { type: 'button', className: 'project-tab', 'aria-current': i === cur ? 'true' : 'false' }, [
        P[i].icone + ' ' + P[i].nom, el('small', { text: st[i] ? '🏅 Validé · record ' + (i === 1 ? num(st[i].best, 1) + ' g' : num(st[i].best, i === 0 ? 2 : 0) + ' €') : 'À concevoir' })]);
      b.addEventListener('click', (function (k) { return function () { select(k); }; })(i));
      box.appendChild(b);
    }
    var n = 0; for (var k in st) { if (st.hasOwnProperty(k)) { n++; } }
    $('atelierCount').textContent = n + ' prototype' + (n > 1 ? 's' : '') + ' validé' + (n > 1 ? 's' : '') + ' sur 3';
  }

  function select(i) {
    cur = i; mat = 0; last = null; log = [];
    var p = P[i];
    vals = p.params.map(function (x) { return x.v; });
    $('pTitle').textContent = p.icone + ' ' + p.nom;
    $('pBrief').textContent = p.brief;
    var mr = clear($('mats'));
    for (var m = 0; m < p.mats.length; m++) {
      var b = el('button', { type: 'button', className: 'mat', 'aria-pressed': m === mat ? 'true' : 'false' }, [p.mats[m].nom, el('small', { text: p.mats[m].info })]);
      b.addEventListener('click', (function (k) { return function () { mat = k; var all = mr.querySelectorAll('button'); for (var j = 0; j < all.length; j++) { all[j].setAttribute('aria-pressed', j === k ? 'true' : 'false'); } changed(); }; })(m));
      mr.appendChild(b);
    }
    var sl = clear($('sliders'));
    for (var s = 0; s < p.params.length; s++) {
      var q = p.params[s];
      var out = el('strong', { className: 'readout', text: q.v + (q.unit === '°' ? '°' : (q.unit ? ' ' + q.unit : '')) });
      var r = el('input', { type: 'range', min: q.min, max: q.max, step: q.step, value: q.v, 'aria-label': q.nom });
      r.addEventListener('input', (function (k, o, qq) { return function () { vals[k] = parseFloat(this.value); o.textContent = vals[k] + (qq.unit === '°' ? '°' : (qq.unit ? ' ' + qq.unit : '')); changed(); }; })(s, out, q));
      sl.appendChild(el('div', { className: 'range-block' }, [el('div', { className: 'range-head' }, [el('span', { text: q.nom }), out]), r]));
    }
    clear($('report')); $('report').className = 'feedback';
    clear($('logBody'));
    $('logWrap').hidden = true;
    $('status').textContent = 'En conception';
    tabs();
    draw();
  }

  function changed() { last = null; $('status').textContent = 'En conception'; $('status').style.color = ''; draw(); }

  function test() {
    var p = P[cur], m = p.mats[mat], r = p.calc(m, vals);
    var ok = true, i;
    for (i = 0; i < r.crit.length; i++) { if (!r.crit[i].ok) { ok = false; } }
    last = { r: r, ok: ok };
    log.unshift({ m: m.nom, v: vals.slice(), ok: ok, s: r.scoreTxt });
    var rep = clear($('report'));
    rep.className = 'feedback ' + (ok ? 'ok' : 'bad');
    var ul = el('ul', { className: 'criteria' });
    for (i = 0; i < r.crit.length; i++) { ul.appendChild(el('li', { className: r.crit[i].ok ? 'ok' : 'bad', text: (r.crit[i].ok ? '✓ ' : '✗ ') + r.crit[i].t })); }
    rep.appendChild(el('p', { className: 'win-title', text: ok ? 'Prototype conforme au cahier des charges' : 'Prototype non conforme' }));
    rep.appendChild(ul);
    var st = TN.get().atelier;
    if (ok) {
      var rec = st[cur];
      if (!rec || r.score < rec.best - 1e-9) {
        st[cur] = { best: Math.round(r.score * 100) / 100 }; TN.save();
        rep.appendChild(el('p', { text: rec ? '🏅 Nouveau record : ' + r.scoreTxt + ' ! Peux-tu faire encore mieux ?' : '🏅 Prototype validé. Défi : trouve ' + p.scoreLabel + '.' }));
      } else {
        rep.appendChild(el('p', { text: 'Conforme, mais ton record reste meilleur. Défi : ' + p.scoreLabel + '.' }));
      }
    } else {
      rep.appendChild(el('p', { text: 'Modifie un seul réglage à la fois, puis relance les essais pour voir son effet.' }));
    }
    $('status').textContent = ok ? 'Essais réussis' : 'À améliorer';
    $('status').style.color = ok ? '' : 'var(--bad)';
    var tb = clear($('logBody'));
    for (i = 0; i < log.length && i < 12; i++) {
      var L = log[i], txt = [];
      for (var j = 0; j < p.params.length; j++) { txt.push(L.v[j] + (p.params[j].unit ? ' ' + p.params[j].unit : '')); }
      tb.appendChild(el('tr', { className: L.ok ? 'ok' : 'bad' }, [el('td', { text: '#' + (log.length - i) }), el('td', { text: L.m }), el('td', { text: txt.join(' · ') }), el('td', { text: L.s }), el('td', { text: L.ok ? 'conforme' : 'non conforme' })]));
    }
    $('logWrap').hidden = false;
    tabs();
    draw();
  }

  /* ---------- Dessin ---------- */
  function draw() {
    var c = $('canvas'), ctx = c.getContext('2d');
    if (!ctx) { return; }
    var w = c.width, h = c.height, p = P[cur], m = p.mats[mat], x, i;
    ctx.clearRect(0, 0, w, h);
    var g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#143b63'); g.addColorStop(1, '#071c36');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#21507a'; ctx.lineWidth = 1;
    for (x = 0; x < w; x += 36) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (x = 0; x < h; x += 36) { ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(w, x); ctx.stroke(); }
    var fail = last && !last.ok;
    ctx.fillStyle = m.couleur; ctx.strokeStyle = m.couleur;
    if (cur === 0) {
      ctx.fillStyle = '#2f6c9a'; ctx.fillRect(0, 330, w, 100);
      ctx.fillStyle = '#4a8bc0'; ctx.fillRect(210, 330, 300, 100);
      ctx.fillStyle = '#5b6f84'; ctx.fillRect(80, 250, 130, 180); ctx.fillRect(510, 250, 130, 180);
      var th = 6 + vals[0] * 5;
      var sag = fail && last.r.cap < 3 ? 40 : 0;
      ctx.fillStyle = m.couleur;
      ctx.beginPath(); ctx.moveTo(150, 250 - th); ctx.quadraticCurveTo(360, 250 - th + sag * 2, 570, 250 - th); ctx.lineTo(570, 250); ctx.quadraticCurveTo(360, 250 + sag * 2, 150, 250); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 5;
      var n = vals[1];
      for (i = 0; i < n; i++) {
        var x0 = 210 + i * (300 / n), x1 = x0 + 300 / n, mid = (x0 + x1) / 2;
        ctx.beginPath(); ctx.moveTo(x0, 252); ctx.lineTo(mid, 310); ctx.lineTo(x1, 252); ctx.stroke();
      }
      if (n) { ctx.beginPath(); ctx.moveTo(210, 310); ctx.lineTo(510, 310); ctx.stroke(); }
      ctx.fillStyle = '#ffd36b'; ctx.fillRect(320, 250 - th - 46 + sag, 80, 44);
      ctx.fillStyle = '#04142c'; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center'; ctx.fillText('3 kg', 360, 250 - th - 18 + sag);
    } else if (cur === 1) {
      ctx.fillStyle = '#3a5878'; ctx.fillRect(40, 360, w - 80, 14);
      var base = vals[0] * 22, a = vals[1] * Math.PI / 180;
      var tip = last && last.r && !last.r.stable;
      ctx.save(); ctx.translate(360, 360); if (tip) { ctx.rotate(0.28); }
      ctx.fillStyle = m.couleur; ctx.fillRect(-base / 2, -12, base, 12);
      ctx.save(); ctx.translate(-base / 2 + 14, -12); ctx.rotate(-(Math.PI / 2 - a));
      var bend = !m.rigide && last ? 0.25 : 0;
      ctx.rotate(bend);
      ctx.fillRect(-6, -190, 12, 190);
      ctx.fillStyle = '#24364c'; ctx.fillRect(8, -205, 46, 180);
      ctx.fillStyle = '#7fe6ff'; ctx.fillRect(13, -198, 36, 166);
      ctx.restore(); ctx.restore();
      ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(360 - base / 2 + 14, 348, 40, -a, 0); ctx.stroke();
      ctx.fillStyle = '#ffd36b'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'left'; ctx.fillText(vals[1] + '°', 360 - base / 2 + 60, 340);
      if (tip) { ctx.fillStyle = '#ff9a86'; ctx.font = 'bold 20px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Il bascule !', 360, 120); }
    } else {
      var bw = 110 + vals[0] * 2.2;
      ctx.fillStyle = '#3a5878'; ctx.fillRect(40, 340, w - 80, 10);
      ctx.fillStyle = m.couleur; ctx.fillRect(200, 210, 320, 100);
      ctx.fillStyle = '#ffd36b'; ctx.fillRect(225, 228, bw * 0.9, 60);
      ctx.fillStyle = '#04142c'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'left'; ctx.fillText(vals[0] + ' Wh', 235, 264);
      ctx.fillStyle = '#9b6a3f'; ctx.fillRect(300, 140, 120, 70);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('colis 1 kg', 360, 180);
      ctx.fillStyle = '#1b2838'; ctx.strokeStyle = '#d9f4ff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(250, 315, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(470, 315, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.textAlign = 'left'; ctx.fillStyle = '#e9faff'; ctx.font = 'bold 22px system-ui'; ctx.fillText(p.nom, 22, 36);
    ctx.font = '16px system-ui'; ctx.fillText('Matériau : ' + m.nom, 22, 62);
    if (last) { ctx.fillStyle = last.ok ? '#5ff0a8' : '#ff9a86'; ctx.font = 'bold 17px system-ui'; ctx.fillText(last.ok ? '✓ Conforme' : '✗ À améliorer', 22, 90); }
  }

  $('testBtn').addEventListener('click', test);
  var start = parseInt(TN.param('p'), 10) - 1;
  select(start >= 0 && start < 3 ? start : 0);
})();
