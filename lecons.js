/* TECHNOVA — Mode Leçons (ES5). Contenu : bloc JSON #lecons-data. */
(function () {
  'use strict';
  var TN = window.TN, el = TN.el, $ = TN.$, clear = TN.clear;
  var L = JSON.parse($('lecons-data').textContent);
  var cur = 0;

  function cards() {
    var box = clear($('lessonCards'));
    var st = TN.get().lecons, n = 0;
    for (var i = 0; i < L.length; i++) {
      var ok = st[L[i].id] === 1;
      if (ok) { n++; }
      var b = el('button', { type: 'button', className: 'lesson-card' + (i === cur ? ' active' : '') + (ok ? ' done' : '') }, [
        el('span', { className: 'lc-icon', 'aria-hidden': 'true', text: L[i].icone }),
        el('strong', { text: L[i].titre }),
        el('small', { text: ok ? '✓ Comprise' : 'À lire' })
      ]);
      b.addEventListener('click', (function (k) { return function () { show(k); $('lesson').scrollIntoView({ behavior: 'smooth', block: 'start' }); }; })(i));
      box.appendChild(b);
    }
    $('lessonCount').textContent = n + ' leçon' + (n > 1 ? 's' : '') + ' comprise' + (n > 1 ? 's' : '') + ' sur ' + L.length;
  }

  function show(i) {
    cur = i;
    var d = L[i], z = TN.zone(d.zone);
    var box = clear($('lesson'));
    box.appendChild(el('h2', null, [el('span', { 'aria-hidden': 'true', text: d.icone + ' ' }), d.titre]));
    for (var p = 0; p < d.paras.length; p++) { box.appendChild(el('p', { text: d.paras[p] })); }
    var ret = el('div', { className: 'retenir-box' }, [el('p', { className: 'doc-title', text: 'À retenir' })]);
    var ul = el('ul');
    for (p = 0; p < d.retenir.length; p++) { ul.appendChild(el('li', { text: d.retenir[p] })); }
    ret.appendChild(ul);
    box.appendChild(ret);
    var dl = el('dl', { className: 'vocab' });
    for (p = 0; p < d.vocab.length; p++) { dl.appendChild(el('dt', { text: d.vocab[p][0] })); dl.appendChild(el('dd', { text: d.vocab[p][1] })); }
    box.appendChild(el('h3', { text: 'Vocabulaire' }));
    box.appendChild(dl);

    var quiz = el('div', { className: 'quiz' });
    quiz.appendChild(el('p', { className: 'question', text: '🔎 Vérifie que tu as compris : ' + d.question.q }));
    var list = el('div', { className: 'choices' });
    var fb = el('div', { className: 'feedback', role: 'status', 'aria-live': 'polite' });
    var opts = TN.shuffle(d.question.options);
    for (var k = 0; k < opts.length; k++) {
      var b = el('button', { type: 'button', className: 'choice', text: opts[k].t });
      b.addEventListener('click', (function (o, btn) {
        return function () {
          fb.textContent = o.fb;
          if (o.ok) {
            btn.classList.add('right');
            fb.className = 'feedback ok';
            var all = list.querySelectorAll('button');
            for (var j = 0; j < all.length; j++) { all[j].disabled = true; }
            TN.get().lecons[d.id] = 1; TN.save(); cards();
          } else { btn.classList.add('wrong'); btn.disabled = true; fb.className = 'feedback bad'; }
        };
      })(opts[k], b));
      list.appendChild(b);
    }
    quiz.appendChild(list);
    quiz.appendChild(fb);
    box.appendChild(quiz);
    box.appendChild(el('p', { className: 'lesson-next' }, [el('a', { className: 'primary-link', href: './quartier.html?q=' + z.id, text: 'S’entraîner dans ' + z.nom + ' ' + z.icone })]));
    cards();
    if (window.history && window.history.replaceState) { window.history.replaceState(null, '', '?l=' + d.id); }
  }

  var start = 0, want = TN.param('l');
  for (var i = 0; i < L.length; i++) { if (L[i].id === want) { start = i; } }
  show(start);
})();
