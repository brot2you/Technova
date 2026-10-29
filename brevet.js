/* TECHNOVA — Entraînement brevet (ES5). Contenu : bloc JSON #brevet-data. */
(function () {
  'use strict';
  var TN = window.TN, el = TN.el, $ = TN.$, clear = TN.clear;
  var B = JSON.parse($('brevet-data').textContent);
  var cur = 0, blocks = [];

  function tabs() {
    var box = clear($('caseTabs')), st = TN.get().brevet, tot = 0;
    for (var i = 0; i < B.length; i++) {
      var sc = st[i] !== undefined ? st[i] : null;
      if (sc !== null) { tot += sc; }
      var b = el('button', { type: 'button', className: 'case-tab', 'aria-current': i === cur ? 'true' : 'false' }, [
        (i + 1) + '. ' + B[i].titre, el('small', { text: sc === null ? 'Pas encore fait' : 'Meilleur score : ' + sc + ' / 3' })]);
      b.addEventListener('click', (function (k) { return function () { show(k); }; })(i));
      box.appendChild(b);
    }
    $('brevetTotal').textContent = 'Total de tes meilleurs scores : ' + tot + ' / ' + (B.length * 3);
  }

  function show(i) {
    cur = i;
    var d = B[i];
    var doc = clear($('caseDoc'));
    doc.appendChild(el('p', { className: 'kicker', text: 'Dossier ' + (i + 1) + ' sur ' + B.length }));
    doc.appendChild(el('h2', { text: d.titre }));
    doc.appendChild(el('a', { href: './assets/' + d.img, target: '_blank', rel: 'noopener', title: 'Agrandir le document' }, [el('img', { src: './assets/' + d.img, alt: d.alt })]));
    doc.appendChild(el('p', { text: d.contexte }));
    var box = el('div', { className: 'doc' }, [el('p', { className: 'doc-title', text: '📄 Données' })]);
    var ul = el('ul');
    for (var k = 0; k < d.donnees.length; k++) { ul.appendChild(el('li', { text: d.donnees[k] })); }
    box.appendChild(ul);
    doc.appendChild(box);

    var form = clear($('questions'));
    blocks = [];
    for (k = 0; k < d.q.length; k++) {
      var q = d.q[k];
      var fs = el('fieldset', { className: 'qblock' }, [el('legend', { text: (k + 1) + '. ' + q.q })]);
      var item = { q: q, fs: fs, fb: el('p', { className: 'qfb', role: 'status' }) };
      if (q.type === 'qcm') {
        var opts = TN.shuffle(q.options);
        item.radios = [];
        for (var j = 0; j < opts.length; j++) {
          var r = el('input', { type: 'radio', name: 'q' + k });
          r._opt = opts[j];
          item.radios.push(r);
          fs.appendChild(el('label', null, [r, el('span', { text: opts[j].t })]));
        }
      } else {
        item.input = el('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', className: 'num-input', 'aria-label': 'Réponse en ' + q.unit });
        fs.appendChild(el('div', { className: 'num-row' }, [item.input, el('span', { className: 'unit', text: q.unit })]));
      }
      fs.appendChild(item.fb);
      blocks.push(item);
      form.appendChild(fs);
    }
    clear($('result'));
    $('result').className = 'feedback';
    $('nextCase').hidden = i >= B.length - 1;
    tabs();
    if (window.history && window.history.replaceState) { window.history.replaceState(null, '', '?d=' + (i + 1)); }
  }

  function evalNum(q, raw) {
    var v = TN.parseNumber(raw), i;
    if (isNaN(v)) { return { ok: false, fb: 'Pas de réponse numérique.' }; }
    if (Math.abs(v - q.answer) <= q.tol) { return { ok: true, fb: q.explication }; }
    for (i = 0; i < (q.errors || []).length; i++) {
      var e = q.errors[i];
      if (Math.abs(v - e.v) <= (e.tol || Math.max(0.01, Math.abs(e.v) * 0.01))) { return { ok: false, fb: e.fb + ' Correction : ' + q.explication }; }
    }
    return { ok: false, fb: 'Correction : ' + q.explication };
  }

  function check() {
    var good = 0, empty = 0, i, j;
    for (i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (b.radios) { var chosen = null; for (j = 0; j < b.radios.length; j++) { if (b.radios[j].checked) { chosen = b.radios[j]._opt; } } if (!chosen) { empty++; } }
      else if (!b.input.value.replace(/\s/g, '')) { empty++; }
    }
    if (empty) {
      $('result').className = 'feedback info';
      $('result').textContent = 'Réponds aux trois questions avant de vérifier (' + empty + ' sans réponse).';
      return;
    }
    for (i = 0; i < blocks.length; i++) {
      var it = blocks[i], res;
      if (it.radios) {
        var opt = null;
        for (j = 0; j < it.radios.length; j++) { if (it.radios[j].checked) { opt = it.radios[j]._opt; } }
        res = { ok: opt.ok, fb: opt.fb };
        if (!opt.ok) { for (j = 0; j < it.q.options.length; j++) { if (it.q.options[j].ok) { res.fb += ' Bonne réponse : « ' + it.q.options[j].t + ' ».'; } } }
      } else { res = evalNum(it.q, it.input.value); }
      if (res.ok) { good++; }
      it.fs.className = 'qblock ' + (res.ok ? 'is-ok' : 'is-bad');
      it.fb.textContent = (res.ok ? '✓ ' : '✗ ') + res.fb;
      var inputs = it.fs.querySelectorAll('input');
      for (j = 0; j < inputs.length; j++) { inputs[j].disabled = true; }
    }
    var st = TN.get().brevet;
    var old = st[cur] !== undefined ? st[cur] : -1;
    if (good > old) { st[cur] = good; TN.save(); }
    var r = $('result');
    r.className = 'feedback ' + (good === 3 ? 'ok' : 'bad');
    r.textContent = 'Score : ' + good + ' / 3. ' + (good === 3 ? 'Dossier maîtrisé.' : 'Lis les corrections, puis recommence le dossier pour vérifier que tu as compris.');
    tabs();
    $('check').disabled = true;
  }

  $('check').addEventListener('click', function () { check(); });
  $('retryCase').addEventListener('click', function () { $('check').disabled = false; show(cur); });
  $('nextCase').addEventListener('click', function () { $('check').disabled = false; show(cur + 1); window.scrollTo(0, 0); });
  var start = parseInt(TN.param('d'), 10) - 1;
  show(start >= 0 && start < B.length ? start : 0);
})();
