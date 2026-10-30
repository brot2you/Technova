/* TECHNOVA — module commun (ES5) : sauvegarde unique, catalogue des missions, navigation, utilitaires. */
(function () {
  'use strict';

  var KEY = 'technova-save';
  var VERSION = 6;
  var NIVEAUX = ['5e', '4e', '3e'];

  /* ---------- Catalogue : source unique des titres et des familles de compétences ---------- */
  var ZONES = [
    { id: 'robot', nom: 'Robot Factory', icone: '🤖', couleur: '#ff8a1c', desc: 'Diagnostiquer, régler et programmer un robot de livraison.' },
    { id: 'smart', nom: 'Smart City', icone: '🏙️', couleur: '#19b877', desc: 'Capteurs, automatismes et programmation dans la ville.' },
    { id: 'energy', nom: 'Energy Lab', icone: '⚡', couleur: '#1f9cf7', desc: 'Conversions, consommation et stockage de l’énergie.' },
    { id: 'cyber', nom: 'Cyber Zone', icone: '🔐', couleur: '#a446f1', desc: 'Réseaux, données et bons réflexes de sécurité.' },
    { id: 'maker', nom: 'Maker Studio', icone: '🛠️', couleur: '#f04453', desc: 'Cahier des charges, matériaux et essais de prototypes.' },
    { id: 'eco', nom: 'Eco Challenge', icone: '🌿', couleur: '#3fb35b', desc: 'Mobilité, cycle de vie et impact des objets.' },
    { id: 'defis', nom: 'Défis finaux', icone: '🚀', couleur: '#ffd166', desc: 'Trois défis qui croisent plusieurs quartiers.' }
  ];

  var FAMILLES = {
    info: 'Chaîne d’information et programmation',
    energie: 'Énergie et conversions',
    reseau: 'Réseaux et sécurité numérique',
    conception: 'Conception, matériaux et essais',
    durable: 'Développement durable'
  };

  var MISSIONS = [
    { id: 'r1', zone: 'robot', titre: 'La panne mystère', court: 'Diagnostiquer', famille: 'info' },
    { id: 'r2', zone: 'robot', titre: 'Les deux chaînes du robot', court: 'Analyser', famille: 'info' },
    { id: 'r3', zone: 'robot', titre: 'Régler le capteur', court: 'Régler', famille: 'info' },
    { id: 'r4', zone: 'robot', titre: 'Programmer l’arrêt', court: 'Programmer', famille: 'info' },
    { id: 'r5', zone: 'robot', titre: 'Économiser la batterie', court: 'Calculer', famille: 'energie' },
    { id: 's1', zone: 'smart', titre: 'Éclairage intelligent', court: 'Capteur', famille: 'info' },
    { id: 's2', zone: 'smart', titre: 'Carrefour sécurisé', court: 'Séquence', famille: 'info' },
    { id: 's3', zone: 'smart', titre: 'Thermostat programmable', court: 'Programmation horaire', famille: 'energie' },
    { id: 'e1', zone: 'energy', titre: 'La chaîne d’un lampadaire solaire', court: 'Conversions', famille: 'energie' },
    { id: 'e2', zone: 'energy', titre: 'LED contre halogène', court: 'Calcul', famille: 'energie' },
    { id: 'e3', zone: 'energy', titre: 'Le micro-réseau de l’école', court: 'Dimensionner', famille: 'energie' },
    { id: 'c1', zone: 'cyber', titre: 'Un message suspect', court: 'Hameçonnage', famille: 'reseau' },
    { id: 'c2', zone: 'cyber', titre: 'Le trajet d’une requête', court: 'Réseau', famille: 'reseau' },
    { id: 'c3', zone: 'cyber', titre: 'Protéger son compte ENT', court: 'Sécurité', famille: 'reseau' },
    { id: 'm1', zone: 'maker', titre: 'Le cahier des charges', court: 'Fonctions et contraintes', famille: 'conception' },
    { id: 'm2', zone: 'maker', titre: 'Choisir le matériau', court: 'Matériaux', famille: 'conception' },
    { id: 'm3', zone: 'maker', titre: 'Essais du crochet', court: 'Tester et optimiser', famille: 'conception' },
    { id: 'o1', zone: 'eco', titre: 'Le trajet vers le collège', court: 'Mobilité', famille: 'durable' },
    { id: 'o2', zone: 'eco', titre: 'Le cycle de vie', court: 'Cycle de vie', famille: 'durable' },
    { id: 'o3', zone: 'eco', titre: 'L’impact d’un smartphone', court: 'Impact', famille: 'durable' },
    { id: 'f1', zone: 'defis', titre: 'Une ville plus sobre', court: 'Ville + énergie + cyber', famille: 'energie' },
    { id: 'f2', zone: 'defis', titre: 'Le robot écoresponsable', court: 'Robot + maker + éco', famille: 'conception' },
    { id: 'f3', zone: 'defis', titre: 'Le campus du futur', court: 'Tous les quartiers', famille: 'durable' }
  ];

  function zone(id) {
    for (var i = 0; i < ZONES.length; i++) { if (ZONES[i].id === id) { return ZONES[i]; } }
    return null;
  }
  function missionsDe(zoneId) {
    var out = [];
    for (var i = 0; i < MISSIONS.length; i++) { if (MISSIONS[i].zone === zoneId) { out.push(MISSIONS[i]); } }
    return out;
  }
  function mission(id) {
    for (var i = 0; i < MISSIONS.length; i++) { if (MISSIONS[i].id === id) { return MISSIONS[i]; } }
    return null;
  }

  /* ---------- Sauvegarde ---------- */
  function blank() { return { v: VERSION, niveau: '', missions: {}, lecons: {}, brevet: {}, atelier: {} }; }
  function isInt(n, min, max) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n && n >= min && n <= max; }

  function sanitize(d) {
    var b = blank(), k;
    if (!d || typeof d !== 'object') { return b; }
    if (NIVEAUX.indexOf(d.niveau) >= 0) { b.niveau = d.niveau; }
    if (d.missions && typeof d.missions === 'object') {
      for (k in d.missions) {
        if (d.missions.hasOwnProperty(k) && mission(k) && d.missions[k] && isInt(d.missions[k].s, 1, 3)) {
          b.missions[k] = { s: d.missions[k].s };
        }
      }
    }
    if (d.lecons && typeof d.lecons === 'object') {
      for (k in d.lecons) { if (d.lecons.hasOwnProperty(k) && /^[a-z0-9-]{1,30}$/.test(k) && d.lecons[k] === 1) { b.lecons[k] = 1; } }
    }
    if (d.brevet && typeof d.brevet === 'object') {
      for (k in d.brevet) { if (d.brevet.hasOwnProperty(k) && /^[0-9]$/.test(k) && isInt(d.brevet[k], 0, 3)) { b.brevet[k] = d.brevet[k]; } }
    }
    if (d.atelier && typeof d.atelier === 'object') {
      for (k in d.atelier) {
        if (d.atelier.hasOwnProperty(k) && /^[0-9]$/.test(k) && d.atelier[k] && typeof d.atelier[k].best === 'number' && isFinite(d.atelier[k].best)) {
          b.atelier[k] = { best: Math.round(d.atelier[k].best * 100) / 100 };
        }
      }
    }
    return b;
  }

  function load() {
    var d = null;
    try { d = JSON.parse(window.localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    return sanitize(d);
  }

  var state = load();

  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* stockage plein ou désactivé */ }
    refreshStars();
  }

  function setMission(id, stars) {
    var old = state.missions[id] ? state.missions[id].s : 0;
    if (stars > old) { state.missions[id] = { s: stars }; save(); }
    return Math.max(old, stars);
  }
  function missionStars(id) { return state.missions[id] ? state.missions[id].s : 0; }
  function totalStars() {
    var t = 0;
    for (var i = 0; i < MISSIONS.length; i++) { t += missionStars(MISSIONS[i].id); }
    return t;
  }
  function maxStars() { return MISSIONS.length * 3; }

  /* Différenciation : à partir de combien d’erreurs le coup de pouce devient disponible. */
  function seuilAide() {
    if (state.niveau === '5e') { return 0; }
    if (state.niveau === '3e') { return 2; }
    return 1;
  }

  function exportText() {
    var copie = sanitize(state);
    copie.exporte = new Date().toISOString();
    return JSON.stringify(copie, null, 2);
  }
  function importText(text) {
    var d;
    try { d = JSON.parse(text); } catch (e) { return 'Ce fichier n’est pas une sauvegarde TECHNOVA lisible.'; }
    if (!d || typeof d !== 'object' || d.v !== VERSION) { return 'Ce fichier ne vient pas de cette version de TECHNOVA.'; }
    state = sanitize(d);
    save();
    return '';
  }
  function reset() { state = blank(); save(); }

  /* ---------- Utilitaires DOM ---------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, children) {
    var n = document.createElement(tag), k, i;
    if (attrs) {
      for (k in attrs) {
        if (!attrs.hasOwnProperty(k) || attrs[k] === null || attrs[k] === undefined) { continue; }
        if (k === 'text') { n.textContent = attrs[k]; }
        else if (k === 'html') { n.innerHTML = attrs[k]; }
        else if (k === 'className') { n.className = attrs[k]; }
        else if (k.indexOf('on') === 0) { n.addEventListener(k.substring(2), attrs[k]); }
        else { n.setAttribute(k, attrs[k]); }
      }
    }
    if (children) {
      if (!(children instanceof Array)) { children = [children]; }
      for (i = 0; i < children.length; i++) {
        if (children[i] === null || children[i] === undefined) { continue; }
        n.appendChild(typeof children[i] === 'string' ? document.createTextNode(children[i]) : children[i]);
      }
    }
    return n;
  }
  function clear(n) { while (n.firstChild) { n.removeChild(n.firstChild); } return n; }
  function shuffle(a) {
    var b = a.slice(), i, j, t;
    for (i = b.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = b[i]; b[i] = b[j]; b[j] = t; }
    return b;
  }
  function param(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }
  function parseNumber(s) {
    if (typeof s !== 'string') { return NaN; }
    s = s.replace(/\s/g, '').replace(',', '.');
    if (!/^-?[0-9]*\.?[0-9]+$/.test(s)) { return NaN; }
    return parseFloat(s);
  }
  function starsText(n) { var s = ''; for (var i = 0; i < 3; i++) { s += i < n ? '★' : '☆'; } return s; }

  function download(name, text) {
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); if (a.parentNode) { a.parentNode.removeChild(a); } }, 1500);
  }

  /* Boîte de dialogue maison (pas de confirm()/alert(), capricieux sur iOS). */
  function dialog(opts) {
    var overlay = el('div', { className: 'tn-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tn-dialog-title' });
    var box = el('div', { className: 'tn-dialog-box' });
    box.appendChild(el('h2', { id: 'tn-dialog-title', text: opts.titre }));
    if (opts.texte) { box.appendChild(el('p', { text: opts.texte })); }
    if (opts.contenu) { box.appendChild(opts.contenu); }
    var actions = el('div', { className: 'tn-dialog-actions' });
    function close() { if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); } document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape' && opts.annuler) { close(); } }
    var i, b;
    var boutons = opts.boutons || [];
    for (i = 0; i < boutons.length; i++) {
      b = el('button', { type: 'button', className: boutons[i].classe || '', text: boutons[i].label });
      b.addEventListener('click', (function (cb) { return function () { close(); if (cb) { cb(); } }; })(boutons[i].action));
      actions.appendChild(b);
    }
    if (opts.annuler) { actions.insertBefore(el('button', { type: 'button', className: 'ghost', text: opts.annuler, onclick: close }), actions.firstChild); }
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey);
    var focusable = box.querySelector('button');
    if (focusable) { focusable.focus(); }
    return close;
  }

  function choisirNiveau(cb) {
    var wrap = el('div', { className: 'tn-level-choice' });
    var close;
    for (var i = 0; i < NIVEAUX.length; i++) {
      wrap.appendChild(el('button', {
        type: 'button', className: 'level-btn', text: NIVEAUX[i],
        onclick: (function (n) { return function () { state.niveau = n; save(); close(); if (cb) { cb(n); } }; })(NIVEAUX[i])
      }));
    }
    close = dialog({
      titre: 'Tu es en quelle classe ?',
      texte: 'Le niveau règle le moment où le coup de pouce devient disponible. Tu pourras le changer dans l’Académie.',
      contenu: wrap
    });
  }


  /* ---------- Sons (synthétisés avec la Web Audio API : aucun fichier audio) ---------- */
  var SON_KEY = 'technova-son';
  var sonOn = true;
  try { sonOn = window.localStorage.getItem(SON_KEY) !== '0'; } catch (e) { sonOn = true; }
  var AC = null, master = null, motorNodes = null, lastTick = 0;

  function audio() {
    if (!sonOn) { return null; }
    if (!AC) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) { return null; }
      try { AC = new C(); } catch (e) { return null; }
      master = AC.createGain();
      master.gain.value = 0.35;
      master.connect(AC.destination);
    }
    if (AC.state === 'suspended' && AC.resume) { AC.resume(); }
    return AC;
  }
  /* iOS et Chrome n’autorisent le son qu’après un premier geste de l’utilisateur. */
  function unlock() {
    var a = audio();
    if (a) {
      var b = a.createBuffer(1, 1, 22050), src = a.createBufferSource();
      src.buffer = b; src.connect(master); src.start(0);
    }
    document.removeEventListener('touchstart', unlock, true);
    document.removeEventListener('pointerdown', unlock, true);
    document.removeEventListener('keydown', unlock, true);
  }
  document.addEventListener('touchstart', unlock, true);
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);

  function tone(f, t, dur, type, vol, fEnd) {
    var a = audio(); if (!a) { return; }
    var o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + (t || 0);
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t0);
    if (fEnd) { o.frequency.exponentialRampToValueAtTime(fEnd, t0 + dur); }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t, dur, vol, freq) {
    var a = audio(); if (!a) { return; }
    var len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) { d[i] = (Math.random() * 2 - 1) * (1 - i / len); }
    var src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t0 = a.currentTime + (t || 0);
    src.buffer = buf; f.type = 'lowpass'; f.frequency.value = freq || 1200;
    g.gain.value = vol || 0.4;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
  }
  function arpeggio(notes, step, type, vol, dur) {
    for (var i = 0; i < notes.length; i++) { tone(notes[i], i * step, dur || 0.22, type || 'triangle', vol || 0.25); }
  }

  var SFX = {
    tap: function () { tone(1100, 0, 0.05, 'sine', 0.08); },
    tick: function () { var n = Date.now(); if (n - lastTick < 55) { return; } lastTick = n; tone(1700, 0, 0.025, 'square', 0.035); },
    ok: function () { tone(660, 0, 0.12, 'triangle', 0.22); tone(990, 0.09, 0.18, 'triangle', 0.22); },
    fail: function () { tone(240, 0, 0.16, 'square', 0.09, 200); tone(180, 0.14, 0.24, 'square', 0.09, 140); },
    hint: function () { tone(1320, 0, 0.5, 'sine', 0.16); tone(1980, 0.06, 0.4, 'sine', 0.07); },
    win: function () { arpeggio([523, 659, 784, 1047], 0.09, 'triangle', 0.22, 0.28); },
    win3: function () { arpeggio([523, 659, 784, 1047, 1319], 0.08, 'triangle', 0.22, 0.3); tone(1568, 0.45, 0.6, 'sine', 0.12); tone(2093, 0.52, 0.55, 'sine', 0.07); },
    record: function () { arpeggio([1047, 1319, 1568, 2093, 2637], 0.06, 'sine', 0.13, 0.3); },
    beep: function () { tone(880, 0, 0.09, 'square', 0.06); },
    crash: function () { noise(0, 0.45, 0.55, 900); tone(120, 0, 0.35, 'sine', 0.4, 45); },
    brake: function () { noise(0, 0.35, 0.12, 2500); }
  };

  function sfx(name) { if (sonOn && SFX[name]) { try { SFX[name](); } catch (e) { /* audio indisponible */ } } }

  /* Ronronnement du moteur du robot. */
  function motor(on) {
    if (!on) {
      if (motorNodes && AC) {
        var t = AC.currentTime;
        motorNodes.g.gain.cancelScheduledValues(t);
        motorNodes.g.gain.setValueAtTime(motorNodes.g.gain.value, t);
        motorNodes.g.gain.linearRampToValueAtTime(0.0001, t + 0.15);
        motorNodes.o.stop(t + 0.2);
        motorNodes = null;
      }
      return;
    }
    if (motorNodes) { return; }
    var a = audio(); if (!a) { return; }
    var o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
    o.type = 'sawtooth'; o.frequency.value = 72;
    f.type = 'lowpass'; f.frequency.value = 420;
    g.gain.setValueAtTime(0.0001, a.currentTime);
    g.gain.linearRampToValueAtTime(0.09, a.currentTime + 0.12);
    o.connect(f); f.connect(g); g.connect(master);
    o.start();
    motorNodes = { o: o, g: g };
  }

  function setSon(on) {
    sonOn = on;
    try { window.localStorage.setItem(SON_KEY, on ? '1' : '0'); } catch (e) { /* ignoré */ }
    if (!on) { motor(false); }
    var btns = document.querySelectorAll('.sound-btn');
    for (var i = 0; i < btns.length; i++) { drawSonBtn(btns[i]); }
    if (on) { sfx('ok'); }
  }
  function drawSonBtn(b) {
    b.textContent = sonOn ? '🔊' : '🔇';
    b.setAttribute('aria-pressed', sonOn ? 'true' : 'false');
    b.setAttribute('aria-label', sonOn ? 'Couper le son' : 'Activer le son');
    b.title = sonOn ? 'Couper le son' : 'Activer le son';
  }
  function buildSonButtons() {
    var stars = document.querySelectorAll('[data-tn-stars]');
    for (var i = 0; i < stars.length; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sound-btn';
      b.addEventListener('click', function (e) { e.stopPropagation(); setSon(!sonOn); });
      drawSonBtn(b);
      var wrap = document.createElement('div');
      wrap.className = 'top-right';
      stars[i].parentNode.insertBefore(wrap, stars[i]);
      wrap.appendChild(b);
      wrap.appendChild(stars[i]);
    }
  }
  /* Petit clic discret sur les boutons, et cliquetis sur les curseurs. */
  document.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== document && !(t.tagName === 'BUTTON' || t.tagName === 'A')) { t = t.parentNode; }
    if (t && t !== document && !t.disabled && !(t.classList && t.classList.contains('sound-btn'))) { sfx('tap'); }
  }, true);
  document.addEventListener('input', function (e) { if (e.target && e.target.type === 'range') { sfx('tick'); } }, true);

  /* ---------- Navigation commune ---------- */
  var DOCK = [
    ['index.html', '🏙️', 'Cité'],
    ['lecons.html', '📘', 'Leçons'],
    ['atelier.html', '🛠️', 'Atelier'],
    ['brevet.html', '🎓', 'Brevet'],
    ['academy.html', '🏆', 'Académie']
  ];
  function buildDock() {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    if (page === 'quartier.html') { page = 'index.html'; }
    var nav = el('nav', { className: 'tn-dock', 'aria-label': 'Navigation TECHNOVA' });
    for (var i = 0; i < DOCK.length; i++) {
      var a = el('a', { href: './' + DOCK[i][0] }, [el('span', { className: 'tn-dock-icon', 'aria-hidden': 'true', text: DOCK[i][1] }), el('span', { text: DOCK[i][2] })]);
      if (DOCK[i][0] === page) { a.setAttribute('aria-current', 'page'); }
      nav.appendChild(a);
    }
    document.body.appendChild(nav);
  }

  function refreshStars() {
    var nodes = document.querySelectorAll('[data-tn-stars]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = '★ ' + totalStars() + ' / ' + maxStars();
      nodes[i].setAttribute('title', 'Étoiles gagnées dans les missions');
    }
  }

  window.TN = {
    ZONES: ZONES, MISSIONS: MISSIONS, FAMILLES: FAMILLES, NIVEAUX: NIVEAUX,
    zone: zone, mission: mission, missionsDe: missionsDe,
    get: function () { return state; },
    save: save, setMission: setMission, missionStars: missionStars,
    totalStars: totalStars, maxStars: maxStars, seuilAide: seuilAide,
    exportText: exportText, importText: importText, reset: reset,
    $: $, el: el, clear: clear, shuffle: shuffle, param: param, parseNumber: parseNumber,
    starsText: starsText, download: download, dialog: dialog, choisirNiveau: choisirNiveau,
    refreshStars: refreshStars,
    sfx: sfx, motor: motor, setSon: setSon, sonActif: function () { return sonOn; }
  };

  function init() { buildDock(); buildSonButtons(); refreshStars(); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
