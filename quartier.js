/* TECHNOVA — moteur des missions (ES5). Le contenu est dans quartier.html (bloc JSON #missions-data). */
(function () {
  'use strict';
  var TN = window.TN, el = TN.el, $ = TN.$, clear = TN.clear;
  var DATA = JSON.parse($('missions-data').textContent);

  var zoneId = TN.param('q');
  if (!TN.zone(zoneId)) { zoneId = 'robot'; }
  var ZONE = TN.zone(zoneId);
  var LISTE = TN.missionsDe(zoneId);

  var cur = 0;          // index de la mission dans la zone
  var errors = 0;       // erreurs sur la tentative en cours
  var hintUsed = false;
  var solved = false;
  var busy = false;     // animation en cours
  var timers = [];
  var gen = 0;          // change à chaque mission : les animations d’avant s’arrêtent

  function later(fn, ms) { var g = gen; var t = setTimeout(function () { if (g === gen) { fn(); } }, ms); timers.push(t); return t; }
  function stopTimers() {
    for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); }
    timers = []; busy = false; gen++;
    TN.motor(false);
  }

  /* ---------- En-tête et onglets ---------- */
  function renderHeader() {
    document.title = ZONE.nom + ' — TECHNOVA';
    document.documentElement.style.setProperty('--zone', ZONE.couleur);
    document.documentElement.style.setProperty('--zone-soft', ZONE.couleur + '55');
    $('zoneTitle').textContent = '';
    $('zoneTitle').appendChild(el('span', { 'aria-hidden': 'true', text: ZONE.icone + ' ' }));
    $('zoneTitle').appendChild(document.createTextNode(ZONE.nom));
    $('zoneDesc').textContent = ZONE.desc;
    var tabs = clear($('zoneTabs'));
    for (var i = 0; i < TN.ZONES.length; i++) {
      var z = TN.ZONES[i];
      var a = el('a', { href: './quartier.html?q=' + z.id, className: 'zone-tab', style: '--c:' + z.couleur }, [el('span', { 'aria-hidden': 'true', text: z.icone }), el('span', { text: z.nom })]);
      if (z.id === zoneId) { a.setAttribute('aria-current', 'page'); }
      tabs.appendChild(a);
    }
  }

  function renderCards() {
    var box = clear($('missionCards'));
    for (var i = 0; i < LISTE.length; i++) {
      var m = LISTE[i], s = TN.missionStars(m.id);
      var b = el('button', { type: 'button', className: 'mission-card' + (i === cur ? ' active' : '') + (s ? ' done' : '') }, [
        el('span', { className: 'mc-num', text: 'Mission ' + (i + 1) }),
        el('strong', { text: m.titre }),
        el('span', { className: 'mc-skill', text: m.court }),
        el('span', { className: 'mc-stars', 'aria-label': s ? s + ' étoile(s) sur 3' : 'pas encore réussie', text: s ? TN.starsText(s) : 'À faire' })
      ]);
      b.addEventListener('click', (function (idx) { return function () { select(idx); window.scrollTo(0, $('workbench').offsetTop - 10); }; })(i));
      box.appendChild(b);
    }
  }

  /* ---------- Retour à l’élève ---------- */
  function feedback(msg, kind) {
    var f = $('feedback');
    f.className = 'feedback ' + (kind || '');
    f.textContent = msg;
  }

  function fail(msg) {
    errors++;
    TN.sfx('fail');
    feedback(msg, 'bad');
    updateHint();
  }

  function updateHint() {
    var d = DATA[LISTE[cur].id];
    var btn = $('hintBtn');
    if (!d.hint || solved) { btn.hidden = true; return; }
    btn.hidden = false;
    var seuil = TN.seuilAide();
    if (hintUsed) { btn.disabled = true; btn.textContent = '💡 Coup de pouce affiché'; return; }
    if (errors >= seuil) { btn.disabled = false; btn.textContent = '💡 Coup de pouce'; }
    else {
      btn.disabled = true;
      var reste = seuil - errors;
      btn.textContent = '💡 Coup de pouce dans ' + reste + ' essai' + (reste > 1 ? 's' : '');
    }
  }

  function showHint() {
    var d = DATA[LISTE[cur].id];
    hintUsed = true;
    TN.sfx('hint');
    var h = $('hintBox');
    h.hidden = false;
    h.textContent = d.hint;
    updateHint();
  }

  function win(extra) {
    if (solved) { return; }
    solved = true;
    var m = LISTE[cur], d = DATA[m.id];
    var stars = errors === 0 && !hintUsed ? 3 : (errors <= 2 ? 2 : 1);
    if (hintUsed && stars > 2) { stars = 2; }
    var best = TN.setMission(m.id, stars);
    TN.motor(false);
    TN.sfx(stars === 3 ? 'win3' : 'win');
    var f = $('feedback');
    f.className = 'feedback ok';
    clear(f);
    f.appendChild(el('p', { className: 'win-title', text: TN.starsText(stars) + '  Mission réussie' + (stars === 3 ? ' du premier coup !' : ' !') }));
    if (extra) { f.appendChild(el('p', { text: extra })); }
    if (d.retenir) { f.appendChild(el('p', { className: 'retenir' }, [el('strong', { text: 'À retenir : ' }), d.retenir])); }
    if (best > stars) { f.appendChild(el('p', { className: 'small', text: 'Ton meilleur résultat reste ' + TN.starsText(best) + '.' })); }
    $('hintBtn').hidden = true;
    $('nextBtn').hidden = false;
    $('nextBtn').textContent = cur < LISTE.length - 1 ? 'Mission suivante' : 'Retour à la cité';
    var act = $('activity').querySelectorAll('button, select, input');
    for (var i = 0; i < act.length; i++) { if (!act[i].classList.contains('keep')) { act[i].disabled = true; } }
    renderCards();
  }

  /* ---------- Documents ---------- */
  function renderDoc(doc) {
    var box = el('div', { className: 'doc' });
    box.appendChild(el('p', { className: 'doc-title', text: '📄 ' + (doc.titre || 'Document') }));
    var i, j;
    if (doc.lignes) {
      var ul = el('ul');
      for (i = 0; i < doc.lignes.length; i++) { ul.appendChild(el('li', { text: doc.lignes[i] })); }
      box.appendChild(ul);
    }
    if (doc.table) {
      var wrap = el('div', { className: 'table-wrap' });
      var t = el('table'), tr = el('tr');
      for (i = 0; i < doc.table.head.length; i++) { tr.appendChild(el('th', { scope: 'col', text: doc.table.head[i] })); }
      t.appendChild(el('thead', null, tr));
      var tb = el('tbody');
      for (i = 0; i < doc.table.rows.length; i++) {
        tr = el('tr');
        for (j = 0; j < doc.table.rows[i].length; j++) { tr.appendChild(el(j === 0 ? 'th' : 'td', j === 0 ? { scope: 'row', text: doc.table.rows[i][j] } : { text: doc.table.rows[i][j] })); }
        tb.appendChild(tr);
      }
      t.appendChild(tb);
      wrap.appendChild(t);
      box.appendChild(wrap);
    }
    if (doc.note) { box.appendChild(el('p', { className: 'doc-note', text: doc.note })); }
    return box;
  }

  /* ---------- Scène ---------- */
  var robotEl, colisEl, stageEl, bubbleEl;
  function renderScene(sc) {
    var box = clear($('scene'));
    box.className = 'scene scene-' + sc.type;
    $('sceneName').textContent = sc.nom || 'Atelier';
    if (sc.type === 'robot') {
      stageEl = el('div', { className: 'stage' });
      stageEl.appendChild(el('div', { className: 'floor', 'aria-hidden': 'true' }));
      var ruler = el('div', { className: 'ruler', 'aria-hidden': 'true' });
      stageEl.appendChild(ruler);
      robotEl = el('img', { className: 'robot', src: './assets/robot.webp', alt: 'Robot de livraison' });
      colisEl = el('img', { className: 'colis', src: './assets/colis.webp', alt: 'Colis posé au sol' });
      bubbleEl = el('div', { className: 'bubble', 'aria-hidden': 'true' });
      hudDist = el('strong'); hudMot = el('strong');
      stageEl.appendChild(el('div', { className: 'robot-hud', 'aria-hidden': 'true' }, [
        el('span', null, ['📡 Distance mesurée ', hudDist]), el('span', null, ['⚙️ Moteurs ', hudMot])]));
      stageEl.appendChild(robotEl);
      stageEl.appendChild(colisEl);
      stageEl.appendChild(bubbleEl);
      box.appendChild(stageEl);
    } else if (sc.type === 'image') {
      hudDist = null;
      box.appendChild(el('img', { id: 'sceneImg', className: 'scene-img', src: sc.src, alt: sc.alt || '' }));
      box.appendChild(el('div', { id: 'sceneOverlay', className: 'scene-overlay' }));
    } else if (sc.type === 'proto') {
      box.appendChild(el('div', { id: 'protoView', className: 'proto-view' }));
    } else {
      box.appendChild(el('div', { className: 'scene-icon-wrap' }, [el('div', { className: 'scene-orb', 'aria-hidden': 'true' }), el('div', { className: 'scene-icon', 'aria-hidden': 'true', text: sc.icone || ZONE.icone })]));
    }
  }

  /* Robot : position exprimée en cm entre l’avant du robot et le colis. */
  var START_CM = 80;
  var robotPos = START_CM;
  var hudDist, hudMot;
  function robotX(cm) {
    var W = stageEl.clientWidth;
    var rW = robotEl.offsetWidth || W * 0.3;
    var colisLeft = colisEl.offsetLeft || W * 0.76;
    var travel = colisLeft - rW - W * 0.02;
    return travel - cm * (travel / START_CM);
  }
  function robotDraw(cm) {
    robotPos = cm;
    robotEl.style.transform = 'translateX(' + Math.round(robotX(Math.max(cm, 0))) + 'px)';
  }
  function hud(dist, mot) {
    if (!hudDist) { return; }
    hudDist.textContent = typeof dist === 'number' ? Math.max(0, Math.round(dist)) + ' cm' : dist;
    if (hudMot.textContent !== mot) {
      if (mot === 'marche') { TN.motor(true); }
      else if (hudMot.textContent === 'marche') { TN.motor(false); TN.sfx('brake'); }
    }
    hudMot.textContent = mot;
    hudMot.className = mot === 'marche' ? 'm-on' : 'm-off';
  }
  /* Déplace le robot de sa position actuelle jusqu’à « to » (cm). ease = 'lin' ou 'out' (freinage). */
  function robotMove(to, ms, ease, onFrame, done) {
    var from = robotPos, t0 = null, g = gen;
    function frame(ts) {
      if (g !== gen) { return; }
      if (t0 === null) { t0 = ts; }
      var k = Math.min(1, (ts - t0) / ms);
      var e = ease === 'out' ? 1 - (1 - k) * (1 - k) : k;
      var cm = from + (to - from) * e;
      robotDraw(cm);
      if (onFrame) { onFrame(cm); }
      if (k < 1) { requestAnimationFrame(frame); } else if (done) { done(); }
    }
    requestAnimationFrame(frame);
  }
  function robotReset() {
    if (!robotEl) { return; }
    robotEl.className = 'robot';
    bubbleEl.textContent = '';
    bubbleEl.className = 'bubble';
    robotDraw(START_CM);
    if (hudMot) { hudMot.textContent = ''; }
    TN.motor(false);
    hud(START_CM, 'arrêt');
  }
  /* Sur téléphone, la scène est au-dessus des commandes : on la ramène à l’écran pendant l’animation. */
  function showScene() { if (window.innerWidth < 861) { $('scene').scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
  function bubble(txt, kind) { TN.motor(false); bubbleEl.textContent = txt; bubbleEl.className = 'bubble show ' + (kind || ''); }
  window.addEventListener('resize', function () { if (robotEl && !busy) { robotDraw(robotPos); } });

  /* ---------- Types d’activités ---------- */
  var R = {};

  R.qcm = function (d, box) {
    box.appendChild(el('p', { className: 'question', text: d.question }));
    var list = el('div', { className: 'choices' });
    var opts = TN.shuffle(d.options);
    for (var i = 0; i < opts.length; i++) {
      var b = el('button', { type: 'button', className: 'choice', text: opts[i].t });
      b.addEventListener('click', (function (o, btn) {
        return function () {
          if (solved) { return; }
          if (o.ok) { btn.classList.add('right'); win(o.fb); }
          else { btn.classList.add('wrong'); btn.disabled = true; fail(o.fb); }
        };
      })(opts[i], b));
      list.appendChild(b);
    }
    box.appendChild(list);
  };

  R.multi = function (d, box) {
    box.appendChild(el('p', { className: 'question', text: d.question }));
    var list = el('div', { className: 'choices' });
    var opts = TN.shuffle(d.options);
    var chosen = [];
    for (var i = 0; i < opts.length; i++) {
      var b = el('button', { type: 'button', className: 'choice toggle', 'aria-pressed': 'false', text: opts[i].t });
      b.addEventListener('click', (function (o, btn) {
        return function () {
          var k = chosen.indexOf(o);
          if (k >= 0) { chosen.splice(k, 1); btn.setAttribute('aria-pressed', 'false'); }
          else { chosen.push(o); btn.setAttribute('aria-pressed', 'true'); }
        };
      })(opts[i], b));
      list.appendChild(b);
    }
    box.appendChild(list);
    box.appendChild(el('button', {
      type: 'button', className: 'primary', text: 'Vérifier ma sélection', onclick: function () {
        var i, wrong = null, manque = 0;
        for (i = 0; i < chosen.length; i++) { if (!chosen[i].ok) { wrong = chosen[i]; break; } }
        for (i = 0; i < d.options.length; i++) { if (d.options[i].ok && chosen.indexOf(d.options[i]) < 0) { manque++; } }
        if (!chosen.length) { feedback('Sélectionne au moins une proposition.', 'info'); return; }
        if (wrong) { fail('« ' + wrong.t + ' » : ' + wrong.fb); return; }
        if (manque) { fail('Tout ce que tu as choisi est juste, mais il manque encore ' + manque + ' bonne' + (manque > 1 ? 's réponses' : ' réponse') + '. Relis chaque proposition.'); return; }
        win();
      }
    }));
  };

  /* Séquence à construire : on touche une étiquette pour l’ajouter, on touche la séquence pour retirer. */
  function sequenceBuilder(box, items, max, render) {
    var seq = [];
    var palette = el('div', { className: 'palette' });
    var zone = el('ol', { className: 'sequence', 'aria-live': 'polite' });
    function draw() {
      clear(zone);
      if (!seq.length) { zone.appendChild(el('li', { className: 'empty', text: 'Touche les étiquettes dans l’ordre pour construire la séquence.' })); }
      for (var i = 0; i < seq.length; i++) {
        var li = el('li');
        var b = el('button', { type: 'button', className: 'seq-item', 'aria-label': 'Retirer ' + items[seq[i]].t });
        if (render) { render(b, items[seq[i]]); } else { b.textContent = items[seq[i]].t; }
        b.appendChild(el('span', { className: 'x', 'aria-hidden': 'true', text: '×' }));
        b.addEventListener('click', (function (k) { return function () { if (!solved && !busy) { seq.splice(k, 1); draw(); } }; })(i));
        li.appendChild(b);
        zone.appendChild(li);
      }
    }
    var order = TN.shuffle(items.map(function (it, i) { return i; }));
    for (var i = 0; i < order.length; i++) {
      var b = el('button', { type: 'button', className: 'chip' });
      if (render) { render(b, items[order[i]]); } else { b.textContent = items[order[i]].t; }
      b.addEventListener('click', (function (k) {
        return function () {
          if (solved || busy) { return; }
          if (seq.length >= max) { feedback('La séquence est pleine (' + max + ' étapes). Retire une étape pour en ajouter une autre.', 'info'); return; }
          seq.push(k); draw();
        };
      })(order[i]));
      palette.appendChild(b);
    }
    box.appendChild(palette);
    box.appendChild(zone);
    draw();
    return { get: function () { return seq.slice(); }, clear: function () { seq = []; draw(); } };
  }

  R.order = function (d, box) {
    box.appendChild(el('p', { className: 'question', text: d.question }));
    var sb = sequenceBuilder(box, d.items, d.items.length);
    box.appendChild(el('div', { className: 'row' }, [
      el('button', { type: 'button', className: 'ghost', text: 'Vider', onclick: function () { if (!solved) { sb.clear(); } } }),
      el('button', {
        type: 'button', className: 'primary', text: 'Vérifier l’ordre', onclick: function () {
          var s = sb.get(), i;
          if (!s.length) { feedback('Construis d’abord ta séquence.', 'info'); return; }
          for (i = 0; i < s.length; i++) { if (d.answer.indexOf(s[i]) < 0) { fail('« ' + d.items[s[i]].t + ' » : ' + d.items[s[i]].fb); return; } }
          for (i = 0; i < s.length; i++) {
            if (s[i] !== d.answer[i]) { fail('« ' + d.items[s[i]].t + ' » n’est pas à sa place. ' + d.items[s[i]].why); return; }
          }
          if (s.length < d.answer.length) { fail('Le début est juste, mais il manque ' + (d.answer.length - s.length) + ' étape(s).'); return; }
          win();
        }
      })
    ]));
  };

  R.select = function (d, box) {
    box.appendChild(el('p', { className: 'question', text: d.question }));
    var selects = [];
    var table = el('div', { className: 'select-rows' });
    for (var i = 0; i < d.rows.length; i++) {
      var s = el('select', { 'aria-label': d.rows[i].t });
      s.appendChild(el('option', { value: '', text: 'Choisir…' }));
      for (var j = 0; j < d.choices.length; j++) { s.appendChild(el('option', { value: d.choices[j], text: d.choices[j] })); }
      s.addEventListener('change', function () { this.parentNode.className = 'select-row'; });
      selects.push(s);
      table.appendChild(el('label', { className: 'select-row' }, [el('span', { text: d.rows[i].t }), s]));
    }
    box.appendChild(table);
    box.appendChild(el('button', {
      type: 'button', className: 'primary', text: 'Vérifier', onclick: function () {
        var i, first = null, nWrong = 0, empty = 0;
        for (i = 0; i < selects.length; i++) {
          if (!selects[i].value) { empty++; continue; }
          var ok = d.rows[i].ok.indexOf(selects[i].value) >= 0;
          selects[i].parentNode.className = 'select-row ' + (ok ? 'is-ok' : 'is-bad');
          if (!ok) { nWrong++; if (!first) { first = d.rows[i]; } }
        }
        if (empty) { feedback('Complète toutes les lignes avant de vérifier (' + empty + ' vide' + (empty > 1 ? 's' : '') + ').', 'info'); return; }
        if (nWrong) { fail(nWrong + ' ligne' + (nWrong > 1 ? 's' : '') + ' à revoir. « ' + first.t + ' » : ' + first.fb); return; }
        win();
      }
    }));
  };

  function numericCheck(d, raw) {
    var v = TN.parseNumber(raw), i;
    if (isNaN(v)) { return { info: 'Écris un nombre (tu peux utiliser une virgule).' }; }
    if (Math.abs(v - d.answer) <= (d.tol || 0)) { return { ok: true }; }
    if (d.errors) {
      for (i = 0; i < d.errors.length; i++) {
        if (Math.abs(v - d.errors[i].v) <= (d.errors[i].tol || Math.max(0.01, Math.abs(d.errors[i].v) * 0.01))) { return { fb: d.errors[i].fb }; }
      }
    }
    return { fb: d.fb || 'Ce n’est pas le bon résultat. Reprends le calcul étape par étape.' };
  }

  R.numeric = function (d, box, done) {
    box.appendChild(el('p', { className: 'question', text: d.question }));
    var inp = el('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', className: 'num-input', 'aria-label': 'Ta réponse en ' + d.unit });
    var row = el('div', { className: 'num-row' }, [inp, el('span', { className: 'unit', text: d.unit })]);
    box.appendChild(row);
    function check() {
      var r = numericCheck(d, inp.value);
      if (r.info) { feedback(r.info, 'info'); return; }
      if (r.ok) { inp.classList.add('right'); if (done) { done(); } else { win(d.ok); } return; }
      fail(r.fb);
    }
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { check(); } });
    box.appendChild(el('button', { type: 'button', className: 'primary', text: 'Vérifier', onclick: check }));
  };

  /* Défis finaux : plusieurs étapes enchaînées. */
  R.steps = function (d, box) {
    var k = 0;
    var progress = el('div', { className: 'steps-progress' });
    var holder = el('div');
    box.appendChild(progress);
    box.appendChild(holder);
    function drawProgress() {
      clear(progress);
      for (var i = 0; i < d.steps.length; i++) {
        progress.appendChild(el('span', { className: 'step-dot' + (i < k ? ' done' : '') + (i === k ? ' current' : ''), text: 'Étape ' + (i + 1) }));
      }
    }
    function next() {
      k++;
      if (k >= d.steps.length) { drawProgress(); win(); return; }
      feedback('Étape ' + k + ' validée. Passe à la suivante.', 'info');
      TN.sfx('ok');
      show();
    }
    function show() {
      drawProgress();
      clear(holder);
      var s = d.steps[k];
      if (s.doc) { holder.appendChild(renderDoc(s.doc)); }
      if (s.type === 'numeric') { R.numeric(s, holder, next); return; }
      holder.appendChild(el('p', { className: 'question', text: s.question }));
      var list = el('div', { className: 'choices' });
      var opts = TN.shuffle(s.options);
      for (var i = 0; i < opts.length; i++) {
        var b = el('button', { type: 'button', className: 'choice', text: opts[i].t });
        b.addEventListener('click', (function (o, btn) {
          return function () {
            if (o.ok) { btn.classList.add('right'); TN.sfx('ok'); feedback(o.fb, 'ok'); later(next, 900); var all = list.querySelectorAll('button'); for (var j = 0; j < all.length; j++) { all[j].disabled = true; } }
            else { btn.classList.add('wrong'); btn.disabled = true; fail(o.fb); }
          };
        })(opts[i], b));
        list.appendChild(b);
      }
      holder.appendChild(list);
    }
    show();
  };

  /* Robot : réglage du seuil avec vraie simulation de l’arrêt. */
  R.robotSim = function (d, box) {
    box.appendChild(el('p', { className: 'question', text: d.question }));
    var out = el('strong', { className: 'readout', text: d.start + ' cm' });
    var range = el('input', { type: 'range', min: d.min, max: d.max, step: 1, value: d.start, 'aria-label': 'Seuil de détection en centimètres' });
    range.addEventListener('input', function () { out.textContent = range.value + ' cm'; });
    box.appendChild(el('div', { className: 'range-block' }, [el('div', { className: 'range-head' }, [el('span', { text: 'SI distance < seuil ALORS arrêter les moteurs' }), out]), range]));
    var log = el('ul', { className: 'test-log', 'aria-live': 'polite' });
    function note(txt, ok) { log.insertBefore(el('li', { className: ok ? 'ok' : 'bad', text: txt }), log.firstChild); }
    box.appendChild(el('button', {
      type: 'button', className: 'primary', text: '▶ Lancer l’essai', onclick: function () {
        if (busy || solved) { return; }
        busy = true;
        robotReset();
        showScene();
        var seuil = parseInt(range.value, 10);
        var arret = seuil - d.freinage;
        later(function () {
          robotMove(seuil, (START_CM - seuil) * 25, 'lin', function (cm) { hud(cm, 'marche'); }, function () {
            robotMove(Math.max(arret, 0), arret > 0 ? 800 : seuil * 30, arret > 0 ? 'out' : 'lin', function (cm) { hud(cm, 'arrêt'); }, function () {
              busy = false;
              var res;
              if (arret <= 0) {
                robotEl.classList.add('crash'); TN.sfx('crash'); bubble('💥', 'bad');
                res = 'Seuil ' + seuil + ' cm : collision avec le colis.';
                note(res, false);
                fail(res + ' L’ordre d’arrêt arrive à ' + seuil + ' cm, mais le robot a besoin de ' + d.freinage + ' cm pour s’immobiliser.');
                return;
              }
              res = 'Seuil ' + seuil + ' cm : arrêt à ' + arret + ' cm du colis.';
              if (arret < d.cible[0]) { bubble('⚠️', 'bad'); note(res, false); fail(res + ' Trop près : le cahier des charges impose au moins ' + d.cible[0] + ' cm.'); return; }
              if (arret > d.cible[1]) { bubble('🤏', 'bad'); note(res, false); fail(res + ' Trop loin : la pince n’atteint pas le colis (' + d.cible[1] + ' cm au maximum).'); return; }
              bubble('✅', 'ok');
              note(res, true);
              win('Arrêt à ' + arret + ' cm : le seuil (' + seuil + ' cm) = distance d’arrêt voulue + ' + d.freinage + ' cm de freinage.');
            });
          });
        }, 250);
      }
    }));
    box.appendChild(el('p', { className: 'small', text: 'Journal des essais :' }));
    box.appendChild(log);
    later(robotReset, 30);
  };

  /* Robot : algorithme à compléter (boucle + condition), exécuté sur la scène. */
  R.robotAlgo = function (d, box) {
    box.appendChild(el('p', { className: 'question', text: d.question }));
    var blocks = d.blocks;
    var slots = {};
    function slot(name) {
      var s = el('select', { className: 'slot', 'aria-label': 'Case ' + name });
      s.appendChild(el('option', { value: '', text: '[ ' + name + ' ]' }));
      for (var i = 0; i < blocks.length; i++) { s.appendChild(el('option', { value: blocks[i].id, text: blocks[i].t })); }
      slots[name] = s;
      return s;
    }
    box.appendChild(el('div', { className: 'code' }, [
      el('div', { className: 'code-line kw', text: 'RÉPÉTER INDÉFINIMENT' }),
      el('div', { className: 'code-line in1' }, [slot('A')]),
      el('div', { className: 'code-line in1' }, [el('span', { className: 'kw', text: 'SI ' }), slot('B'), el('span', { className: 'kw', text: ' ALORS' })]),
      el('div', { className: 'code-line in2' }, [slot('C')]),
      el('div', { className: 'code-line in1 kw', text: 'SINON' }),
      el('div', { className: 'code-line in2' }, [slot('D')])
    ]));
    function kind(id) { for (var i = 0; i < blocks.length; i++) { if (blocks[i].id === id) { return blocks[i].k; } } return ''; }
    function end(fn) { return function () { busy = false; fn(); }; }
    box.appendChild(el('button', {
      type: 'button', className: 'primary', text: '▶ Exécuter le programme', onclick: function () {
        if (busy || solved) { return; }
        var A = slots.A.value, B = slots.B.value, C = slots.C.value, D = slots.D.value;
        if (!A || !B || !C || !D) { feedback('Remplis les quatre cases avant d’exécuter.', 'info'); return; }
        if (kind(B) !== 'cond') { fail('Après SI, il faut une condition, c’est-à-dire une comparaison vraie ou fausse, pas une action.'); return; }
        if (kind(A) === 'cond' || kind(C) === 'cond' || kind(D) === 'cond') { fail('Une condition seule ne fait rien : elle se place uniquement après SI.'); return; }
        var close = B === 'lt' ? C : D;   // action quand le colis est à moins de 20 cm
        var far = B === 'lt' ? D : C;     // action quand la voie est libre
        var stale = A !== 'mesurer';
        if (stale) { close = far; }
        busy = true;
        robotReset();
        showScene();
        later(function () {
          if (far === 'stop' || far === 'mesurer') {
            robotEl.classList.add('idle'); bubble('…', 'bad');
            later(end(function () { fail(stale ? 'Sans « Mesurer la distance » au début de la boucle, la distance n’est jamais mise à jour.' : 'Le robot ne démarre jamais : quand la voie est libre, ton programme lui dit de s’arrêter. Les actions sont inversées par rapport à la condition.'); }), 1300);
            return;
          }
          if (far === 'reculer') {
            robotMove(START_CM + 25, 1300, 'lin', function (cm) { hud(cm, 'marche'); }, end(function () { bubble('↩️', 'bad'); fail('Le robot s’éloigne du colis : quand la voie est libre, il doit avancer.'); }));
            return;
          }
          if (close === 'avancer') {
            robotMove(0, 2000, 'lin', function (cm) { hud(stale ? START_CM : cm, 'marche'); }, end(function () {
              robotEl.classList.add('crash'); TN.sfx('crash'); bubble('💥', 'bad');
              fail(stale ? 'Collision : regarde l’écran, la distance mesurée est restée bloquée à 80 cm. Sans nouvelle mesure à chaque tour de boucle, le robot ne voit pas le colis approcher.' : 'Collision : quand le colis est proche, ton programme continue d’avancer.');
            }));
            return;
          }
          if (close === 'reculer') {
            robotMove(19, 1500, 'lin', function (cm) { hud(cm, 'marche'); }, function () {
              robotMove(26, 350, 'lin', function (cm) { hud(cm, 'marche'); }, function () {
                robotMove(19, 350, 'lin', function (cm) { hud(cm, 'marche'); }, function () {
                  robotMove(26, 350, 'lin', function (cm) { hud(cm, 'marche'); }, end(function () { bubble('🔁', 'bad'); fail('Le robot oscille devant le colis : il recule dès qu’il est proche, puis repart. Le cahier des charges demande qu’il s’arrête.'); }));
                });
              });
            });
            return;
          }
          robotMove(20, 1500, 'lin', function (cm) { hud(cm, 'marche'); }, function () {
            robotMove(14, 600, 'out', function (cm) { hud(cm, 'arrêt'); }, end(function () { bubble('✅', 'ok'); win('Le robot mesure à chaque tour de boucle, avance tant que la voie est libre et s’arrête dès que le colis est à moins de 20 cm.'); }));
          });
        }, 250);
      }
    }));
    later(robotReset, 30);
  };

  /* Smart City : lampadaire piloté par un capteur de luminosité, simulé sur 24 h. */
  R.lampSim = function (d, box) {
    box.appendChild(el('p', { className: 'question', text: d.question }));
    var op = el('select', { 'aria-label': 'Comparaison' }, [el('option', { value: '<', text: 'inférieure à' }), el('option', { value: '>', text: 'supérieure à' })]);
    var seuil = el('select', { 'aria-label': 'Seuil en lux' });
    for (var i = 0; i < d.seuils.length; i++) { seuil.appendChild(el('option', { value: d.seuils[i], text: d.seuils[i] + ' lux' })); }
    seuil.value = String(d.seuils[0]);
    box.appendChild(el('div', { className: 'code' }, [
      el('div', { className: 'code-line' }, [el('span', { className: 'kw', text: 'SI ' }), 'luminosité ', op, ' ', seuil]),
      el('div', { className: 'code-line in1', text: 'ALORS allumer la lampe' }),
      el('div', { className: 'code-line kw', text: 'SINON' }),
      el('div', { className: 'code-line in1', text: 'éteindre la lampe' })
    ]));
    var strip = el('div', { className: 'day-strip', 'aria-label': 'Résultat heure par heure' });
    var cells = [];
    for (i = 0; i < 24; i++) {
      var c = el('div', { className: 'hour' }, [el('span', { className: 'h', text: i + 'h' }), el('span', { className: 'lamp', 'aria-hidden': 'true', text: '·' })]);
      c.title = i + ' h : ' + d.lux[i] + ' lux';
      cells.push(c); strip.appendChild(c);
    }
    box.appendChild(el('div', { className: 'strip-wrap' }, [strip]));
    box.appendChild(el('p', { className: 'small', text: 'Touche une heure pour voir la luminosité mesurée. Les heures sombres sont en bleu foncé.' }));
    for (i = 0; i < 24; i++) {
      cells[i].classList.add(d.lux[i] >= 800 ? 'is-day' : (d.lux[i] >= 20 ? 'is-dusk' : 'is-night'));
      cells[i].addEventListener('click', (function (h) { return function () { feedback(h + ' h : ' + d.lux[h] + ' lux mesurés par le capteur.', 'info'); }; })(i));
    }
    box.appendChild(el('button', {
      type: 'button', className: 'primary', text: '▶ Simuler la journée', onclick: function () {
        if (busy || solved) { return; }
        busy = true;
        var s = parseFloat(seuil.value), o = op.value, h = 0, onDay = [], offDark = [];
        var img = $('sceneImg');
        for (var k = 0; k < 24; k++) { cells[k].classList.remove('on', 'off'); cells[k].lastChild.textContent = '·'; }
        function step() {
          var lux = d.lux[h];
          var on = o === '<' ? lux < s : lux > s;
          cells[h].classList.add(on ? 'on' : 'off');
          if (on) { TN.sfx('tick'); }
          cells[h].lastChild.textContent = on ? '💡' : '–';
          if (img) { img.src = lux >= 800 ? './assets/eclairage-jour.webp' : './assets/eclairage-nuit.webp'; }
          if (on && lux >= 800) { onDay.push(h); }
          if (!on && lux <= 60) { offDark.push(h); }
          h++;
          if (h < 24) { later(step, 110); return; }
          busy = false;
          if (o === '>') { fail('La lampe s’allume quand il fait clair et s’éteint dans le noir : la comparaison est inversée.'); return; }
          if (onDay.length) { fail('Lampe allumée en pleine journée à ' + onDay.join(' h, ') + ' h (ciel couvert, 800 lux) : ton seuil est trop haut.'); return; }
          if (offDark.length) { fail('Lampe éteinte à ' + offDark.join(' h, ') + ' h alors qu’il fait sombre (60 lux au crépuscule, moins la nuit) : ton seuil est trop bas.'); return; }
          win('Avec un seuil de ' + s + ' lux, la lampe éclaire au crépuscule et la nuit, et reste éteinte même sous un ciel couvert.');
        }
        step();
      }
    }));
  };

  /* Smart City : cycle d’un carrefour à feux. */
  R.traffic = function (d, box) {
    box.appendChild(el('p', { className: 'question', text: d.question }));
    var ov = $('sceneOverlay');
    var lights = el('div', { className: 'lights', 'aria-hidden': 'true' }, [
      el('div', { className: 'light car' }, [el('i', { className: 'r' }), el('i', { className: 'o' }), el('i', { className: 'v' }), el('small', { text: 'Voitures' })]),
      el('div', { className: 'light ped' }, [el('i', { className: 'r' }), el('i', { className: 'v' }), el('small', { text: 'Piétons' })])
    ]);
    if (ov) { clear(ov); ov.appendChild(lights); }
    function setLights(st) {
      var car = lights.firstChild, ped = lights.lastChild;
      TN.sfx('beep');
      car.className = 'light car ' + st.car;
      ped.className = 'light ped ' + st.ped;
    }
    function render(b, it) {
      b.appendChild(el('span', { className: 'mini ' + it.car, 'aria-hidden': 'true' }));
      b.appendChild(el('span', { className: 'mini ' + it.ped, 'aria-hidden': 'true' }));
      b.appendChild(document.createTextNode(it.t));
    }
    var sb = sequenceBuilder(box, d.states, 8, render);
    setLights({ car: 'r', ped: 'r' });
    function diag(s) {
      var i, a, b, n = s.length;
      for (i = 0; i < n; i++) { if (d.states[s[i]].danger) { return d.states[s[i]].fb; } }
      if (s[0] !== 0) { return 'Le cycle doit démarrer avec les voitures au vert, comme demandé.'; }
      var hasPed = false;
      for (i = 0; i < n; i++) { if (d.states[s[i]].ped === 'v') { hasPed = true; } }
      if (!hasPed) { return 'Les piétons n’ont jamais le vert : ils ne peuvent pas traverser.'; }
      for (i = 0; i < n; i++) {
        a = d.states[s[i]]; b = d.states[s[(i + 1) % n]];
        var key = a.id + b.id;
        if (a.id === b.id) { return 'Le même état apparaît deux fois de suite : c’est inutile, une seule phase suffit.'; }
        if (d.transitions[key]) { if (d.transitions[key] !== 'ok') { return i === n - 1 ? 'En revenant au début du cycle, ' + d.transitions[key].charAt(0).toLowerCase() + d.transitions[key].substring(1) : d.transitions[key]; } }
        else { return 'Le passage « ' + a.t + ' » → « ' + b.t + ' » n’existe pas sur un vrai carrefour.'; }
      }
      if (n !== 5) { return 'Ton cycle est sûr, mais il n’est pas complet.'; }
      return '';
    }
    box.appendChild(el('div', { className: 'row' }, [
      el('button', { type: 'button', className: 'ghost', text: 'Vider', onclick: function () { if (!solved && !busy) { sb.clear(); } } }),
      el('button', {
        type: 'button', className: 'primary', text: '▶ Tester le cycle', onclick: function () {
          if (busy || solved) { return; }
          var s = sb.get();
          if (s.length < 2) { feedback('Construis un cycle d’au moins deux états.', 'info'); return; }
          busy = true;
          showScene();
          var k = 0, total = s.length * 2;
          function step() {
            setLights(d.states[s[k % s.length]]);
            k++;
            if (k < total) { later(step, 700); return; }
            busy = false;
            var err = diag(s);
            if (err) { fail(err); } else { win('Chaque autorisation est précédée d’une phase tout au rouge, et l’orange prévient les conducteurs.'); }
          }
          step();
        }
      })
    ]));
  };

  /* Energy Lab : dimensionner un micro-réseau. */
  R.microgrid = function (d, box) {
    box.appendChild(el('p', { className: 'question', text: d.question }));
    var lampe = el('select', { 'aria-label': 'Type d’éclairage' }, [el('option', { value: 'halo', text: 'Halogène : 12 × 50 W' }), el('option', { value: 'led', text: 'LED : 12 × 10 W' })]);
    var pan = el('input', { type: 'range', min: 0, max: 8, step: 1, value: 1, 'aria-label': 'Nombre de panneaux' });
    var bat = el('input', { type: 'range', min: 0, max: 6, step: 1, value: 1, 'aria-label': 'Nombre de batteries' });
    var pOut = el('strong', { className: 'readout' }), bOut = el('strong', { className: 'readout' });
    function upd() { pOut.textContent = pan.value + ' panneau' + (pan.value > 1 ? 'x' : ''); bOut.textContent = bat.value + ' batterie' + (bat.value > 1 ? 's' : ''); }
    pan.addEventListener('input', upd); bat.addEventListener('input', upd); upd();
    box.appendChild(el('label', { className: 'select-row' }, [el('span', { text: 'Luminaires de la cour' }), lampe]));
    box.appendChild(el('div', { className: 'range-block' }, [el('div', { className: 'range-head' }, [el('span', { text: 'Panneaux solaires (400 Wh/jour, 200 € l’un)' }), pOut]), pan]));
    box.appendChild(el('div', { className: 'range-block' }, [el('div', { className: 'range-head' }, [el('span', { text: 'Batteries (400 Wh, 250 € l’une)' }), bOut]), bat]));
    var res = el('div', { className: 'gauges', 'aria-live': 'polite' });
    box.appendChild(res);
    function gauge(label, val, need, unit, okIfLess) {
      var ok = okIfLess ? val <= need : val >= need;
      var pct = Math.min(100, need ? (val / need) * 100 : 0);
      return el('div', { className: 'gauge ' + (ok ? 'ok' : 'bad') }, [
        el('div', { className: 'g-head' }, [el('span', { text: label }), el('strong', { text: val + ' ' + unit + (okIfLess ? ' / max ' : ' / besoin ') + need + ' ' + unit + (ok ? ' ✓' : ' ✕') })]),
        el('div', { className: 'g-bar' }, [el('i', { style: 'width:' + pct + '%' })])
      ]);
    }
    box.appendChild(el('button', {
      type: 'button', className: 'primary', text: '▶ Simuler une journée', onclick: function () {
        if (solved) { return; }
        var P = lampe.value === 'led' ? 120 : 600;
        var besoin = P * d.heures;
        var aProduire = Math.ceil(besoin / d.rendement);
        var prod = pan.value * 400, stock = bat.value * 400, cout = pan.value * 200 + bat.value * 250;
        clear(res);
        res.appendChild(el('p', { className: 'small', text: 'Besoin du soir : ' + P + ' W × ' + d.heures + ' h = ' + besoin + ' Wh. À produire le jour (pertes de charge comprises) : ' + aProduire + ' Wh.' }));
        res.appendChild(gauge('Production du jour', prod, aProduire, 'Wh'));
        res.appendChild(gauge('Stockage', stock, besoin, 'Wh'));
        res.appendChild(gauge('Coût', cout, d.budget, '€', true));
        if (prod < aProduire) { fail('Production insuffisante : la batterie ne sera pas rechargée pour le soir.' + (lampe.value === 'halo' ? ' Avec des halogènes, le besoin du soir est très élevé : regarde aussi du côté de la consommation.' : '')); return; }
        if (stock < besoin) { fail('La batterie se vide avant la fin de la soirée : capacité de stockage trop faible.'); return; }
        if (cout > d.budget) { fail(lampe.value === 'halo' ? 'Hors budget. Avec des halogènes, le besoin est énorme : agis d’abord sur la consommation.' : 'Hors budget : tu as surdimensionné l’installation. Garde juste ce qu’il faut.'); return; }
        win('Installation équilibrée pour ' + cout + ' € : réduire le besoin (LED) permet de produire et de stocker beaucoup moins.');
      }
    }));
  };

  /* Maker Studio : essais d’un crochet, recherche du réglage le plus léger qui respecte la flèche maximale. */
  R.protoTest = function (d, box) {
    box.appendChild(el('p', { className: 'question', text: d.question }));
    var out = el('strong', { className: 'readout' });
    var range = el('input', { type: 'range', min: d.min, max: d.max, step: d.step, value: d.start, 'aria-label': 'Épaisseur en millimètres' });
    function fmt(v) { return String(v).replace('.', ',') + ' mm'; }
    function upd() { out.textContent = fmt(parseFloat(range.value)); }
    range.addEventListener('input', upd); upd();
    box.appendChild(el('div', { className: 'range-block' }, [el('div', { className: 'range-head' }, [el('span', { text: 'Épaisseur du crochet' }), out]), range]));
    var table = el('table', { className: 'log-table' });
    table.appendChild(el('thead', null, el('tr', null, [el('th', { text: 'Essai' }), el('th', { text: 'Épaisseur' }), el('th', { text: 'Flèche' }), el('th', { text: 'Masse' })])));
    var tbody = el('tbody');
    table.appendChild(tbody);
    var tests = {};
    var n = 0;
    function measure(t) { return { f: Math.round(d.k / (t * t * t) * 100) / 100, m: Math.round(d.rho * t * 10) / 10 }; }
    function drawHook(t, f) {
      var v = $('protoView');
      if (!v) { return; }
      var bend = Math.min(60, f * 8);
      var w = 6 + t * 3;
      v.innerHTML = '<svg viewBox="0 0 450 260" role="img" aria-label="Crochet sous charge">' +
        '<rect x="20" y="20" width="26" height="220" rx="4" fill="#3a5878"/>' +
        '<path d="M46 70 Q 200 ' + (70 + bend * 0.5) + ' 300 ' + (70 + bend) + '" stroke="#ffd36b" stroke-width="' + w + '" fill="none" stroke-linecap="round"/>' +
        '<path d="M300 ' + (70 + bend) + ' q 18 0 18 18 q 0 14 -14 14" stroke="#ffd36b" stroke-width="' + w + '" fill="none" stroke-linecap="round"/>' +
        '<rect x="276" y="' + (120 + bend) + '" width="50" height="62" rx="8" fill="#9b6a3f"/>' +
        '<text x="301" y="' + (157 + bend) + '" text-anchor="middle" font-size="14" fill="#fff" font-family="system-ui">2 kg</text>' +
        '<line x1="300" y1="70" x2="370" y2="70" stroke="#7fe6ff" stroke-dasharray="4 4"/>' +
        '<line x1="300" y1="' + (70 + bend) + '" x2="370" y2="' + (70 + bend) + '" stroke="#7fe6ff" stroke-dasharray="4 4"/>' +
        '<text x="372" y="' + (74 + bend / 2) + '" font-size="13" fill="#bdf3ff" font-family="system-ui">' + String(f).replace('.', ',') + ' mm</text></svg>';
    }
    drawHook(parseFloat(range.value), 0);
    box.appendChild(el('div', { className: 'row' }, [
      el('button', {
        type: 'button', className: 'ghost keep', text: '🧪 Faire un essai', onclick: function () {
          if (solved) { return; }
          var t = parseFloat(range.value), r = measure(t);
          n++;
          tests[t] = r;
          tbody.insertBefore(el('tr', { className: r.f <= d.fmax ? 'ok' : 'bad' }, [el('td', { text: '#' + n }), el('td', { text: fmt(t) }), el('td', { text: String(r.f).replace('.', ',') + ' mm' }), el('td', { text: String(r.m).replace('.', ',') + ' g' })]), tbody.firstChild);
          drawHook(t, r.f);
          feedback('Essai noté dans le journal. Compare les résultats avec le cahier des charges.', 'info');
        }
      }),
      el('button', {
        type: 'button', className: 'primary', text: 'Valider ce réglage', onclick: function () {
          if (solved) { return; }
          var t = parseFloat(range.value);
          if (!tests[t]) { feedback('Teste d’abord ce réglage : on ne valide pas un prototype sans essai.', 'info'); return; }
          var r = tests[t];
          if (r.f > d.fmax) { fail('Refusé : avec ' + fmt(t) + ', le crochet fléchit de ' + String(r.f).replace('.', ',') + ' mm (maximum ' + d.fmax + ' mm).'); return; }
          if (t > d.best) { fail('Le crochet tient, mais il existe un réglage plus fin qui respecte aussi la flèche maximale : il utiliserait moins de matière.'); return; }
          win('Tu as trouvé le réglage le plus léger qui respecte le cahier des charges, grâce à une série d’essais.');
        }
      })
    ]));
    box.appendChild(el('div', { className: 'table-wrap' }, [table]));
  };

  /* Cyber Zone : repérer les indices d’hameçonnage. */
  R.spot = function (d, box) {
    box.appendChild(el('p', { className: 'question', text: d.question }));
    var total = 0, found = 0, i, j;
    for (i = 0; i < d.lignes.length; i++) { for (j = 0; j < d.lignes[i].segs.length; j++) { if (d.lignes[i].segs[j].sus) { total++; } } }
    var counter = el('p', { className: 'counter', 'aria-live': 'polite', text: 'Indices trouvés : 0 / ' + total });
    var mail = el('div', { className: 'mail' });
    var notes = el('ul', { className: 'found-list' });
    for (i = 0; i < d.lignes.length; i++) {
      var L = d.lignes[i];
      var line = el('div', { className: 'mail-line' + (L.cls ? ' ' + L.cls : '') });
      if (L.label) { line.appendChild(el('span', { className: 'mail-label', text: L.label })); }
      for (j = 0; j < L.segs.length; j++) {
        var sg = L.segs[j];
        var b = el('button', { type: 'button', className: 'seg' + (sg.lien ? ' link' : '') }, [sg.t]);
        if (sg.sous) { b.appendChild(el('small', { text: sg.sous })); }
        b.addEventListener('click', (function (s, btn) {
          return function () {
            if (solved || btn.classList.contains('found')) { return; }
            if (s.sus) {
              btn.classList.add('found');
              found++;
              counter.textContent = 'Indices trouvés : ' + found + ' / ' + total;
              notes.appendChild(el('li', { text: s.fb }));
              if (found === total) { win(); } else { TN.sfx('ok'); feedback('Bien vu. ' + s.fb, 'ok'); }
            } else { btn.classList.add('neutral'); btn.disabled = true; fail(s.fb); }
          };
        })(sg, b));
        line.appendChild(b);
      }
      mail.appendChild(line);
    }
    box.appendChild(counter);
    box.appendChild(mail);
    box.appendChild(notes);
  };

  /* ---------- Sélection d’une mission ---------- */
  function select(i) {
    stopTimers();
    cur = i; errors = 0; hintUsed = false; solved = false;
    var m = LISTE[i], d = DATA[m.id];
    $('missionNum').textContent = 'Mission ' + (i + 1) + ' sur ' + LISTE.length + ' · ' + TN.FAMILLES[m.famille];
    $('missionTitle').textContent = m.titre;
    $('objective').textContent = d.consigne;
    renderScene(d.scene || { type: zoneId === 'robot' ? 'robot' : 'icon' });
    var act = clear($('activity'));
    if (d.doc) { act.appendChild(renderDoc(d.doc)); }
    R[d.type](d, act);
    $('feedback').className = 'feedback';
    $('feedback').textContent = '';
    $('hintBox').hidden = true;
    $('nextBtn').hidden = true;
    updateHint();
    renderCards();
    if (window.history && window.history.replaceState) { window.history.replaceState(null, '', '?q=' + zoneId + '&m=' + (i + 1)); }
  }

  $('hintBtn').addEventListener('click', showHint);
  $('retryBtn').addEventListener('click', function () { select(cur); });
  $('nextBtn').addEventListener('click', function () {
    if (cur < LISTE.length - 1) { select(cur + 1); window.scrollTo(0, $('workbench').offsetTop - 10); }
    else { window.location.href = './index.html'; }
  });

  renderHeader();
  var start = parseInt(TN.param('m'), 10) - 1;
  if (!(start >= 0 && start < LISTE.length)) {
    start = 0;
    for (var k = 0; k < LISTE.length; k++) { if (!TN.missionStars(LISTE[k].id)) { start = k; break; } }
  }
  select(start);
  if (!TN.get().niveau) { TN.choisirNiveau(function () { updateHint(); }); }
})();
