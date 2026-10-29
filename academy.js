/* TECHNOVA — Académie (ES5) : tableau de bord calculé à partir de la sauvegarde unique. */
(function () {
  'use strict';
  var TN = window.TN, el = TN.el, $ = TN.$, clear = TN.clear;
  var NB_LECONS = 9, NB_DOSSIERS = 6;

  function count(obj) { var n = 0; for (var k in obj) { if (obj.hasOwnProperty(k)) { n++; } } return n; }

  function render() {
    var st = TN.get(), i, j;
    var stars = TN.totalStars(), max = TN.maxStars();
    var reussies = 0, parfaites = 0;
    for (i = 0; i < TN.MISSIONS.length; i++) { var s = TN.missionStars(TN.MISSIONS[i].id); if (s) { reussies++; } if (s === 3) { parfaites++; } }
    var brevetTot = 0, brevetFull = 0;
    for (i = 0; i < NB_DOSSIERS; i++) { if (st.brevet[i] !== undefined) { brevetTot += st.brevet[i]; if (st.brevet[i] === 3) { brevetFull++; } } }
    var lecons = count(st.lecons), protos = count(st.atelier);

    var rang = stars >= 60 ? '🏆 Inventeur·rice de génie' : stars >= 40 ? '🌟 Ingénieur·e' : stars >= 15 ? '⚙️ Technicien·ne' : '🔧 Stagiaire du labo';
    $('rank').textContent = rang;

    var dash = clear($('dash'));
    function stat(label, val, tot, extra) {
      return el('article', { className: 'panel stat' }, [el('small', { text: label }), el('strong', { text: val + ' / ' + tot }),
        el('div', { className: 'bar' }, [el('i', { style: 'width:' + Math.round(100 * val / tot) + '%' })]), extra ? el('p', { className: 'small', style: 'margin:6px 0 0', text: extra }) : null]);
    }
    dash.appendChild(stat('Étoiles', stars, max, parfaites + ' mission' + (parfaites > 1 ? 's' : '') + ' réussie' + (parfaites > 1 ? 's' : '') + ' du premier coup'));
    dash.appendChild(stat('Missions réussies', reussies, TN.MISSIONS.length));
    dash.appendChild(stat('Leçons comprises', lecons, NB_LECONS));
    dash.appendChild(stat('Points au brevet', brevetTot, NB_DOSSIERS * 3, 'Meilleurs scores cumulés'));

    var lv = clear($('levelRow'));
    for (i = 0; i < TN.NIVEAUX.length; i++) {
      lv.appendChild(el('button', { type: 'button', 'aria-pressed': st.niveau === TN.NIVEAUX[i] ? 'true' : 'false', text: TN.NIVEAUX[i],
        onclick: (function (n) { return function () { st.niveau = n; TN.save(); render(); }; })(TN.NIVEAUX[i]) }));
    }
    var aide = TN.seuilAide();
    $('levelHelp').textContent = st.niveau ? 'Le coup de pouce est disponible ' + (aide === 0 ? 'dès le début de chaque mission.' : 'après ' + aide + ' essai' + (aide > 1 ? 's' : '') + ' manqué' + (aide > 1 ? 's' : '') + '.') : 'Choisis ta classe : elle règle le moment où le coup de pouce devient disponible.';

    var zg = clear($('zoneGrid'));
    var zonesFinies = 0;
    for (i = 0; i < TN.ZONES.length; i++) {
      var z = TN.ZONES[i], liste = TN.missionsDe(z.id), zs = 0, zr = 0;
      for (j = 0; j < liste.length; j++) { var ms = TN.missionStars(liste[j].id); zs += ms; if (ms) { zr++; } }
      if (zr === liste.length) { zonesFinies++; }
      zg.appendChild(el('article', { className: 'panel zone-card', style: '--c:' + z.couleur }, [
        el('h3', { text: z.icone + ' ' + z.nom }),
        el('p', { className: 'small', text: zr + ' / ' + liste.length + ' missions · ★ ' + zs + ' / ' + liste.length * 3 }),
        el('div', { className: 'bar' }, [el('i', { style: 'width:' + Math.round(100 * zs / (liste.length * 3)) + '%' })]),
        el('p', { style: 'margin:10px 0 0' }, [el('a', { href: './quartier.html?q=' + z.id, text: zr === liste.length ? 'Améliorer mes étoiles' : (zr ? 'Continuer' : 'Commencer') })])
      ]));
    }

    var sk = clear($('skills'));
    for (var f in TN.FAMILLES) {
      if (!TN.FAMILLES.hasOwnProperty(f)) { continue; }
      var got = 0, tot = 0;
      for (j = 0; j < TN.MISSIONS.length; j++) { if (TN.MISSIONS[j].famille === f) { tot += 3; got += TN.missionStars(TN.MISSIONS[j].id); } }
      var pct = tot ? Math.round(100 * got / tot) : 0;
      sk.appendChild(el('div', { className: 'skill-row' }, [el('strong', { text: TN.FAMILLES[f] }), el('div', { className: 'bar' }, [el('i', { style: 'width:' + pct + '%' })]), el('span', { text: pct + ' %' })]));
    }

    var badges = [];
    for (i = 0; i < TN.ZONES.length; i++) {
      var zz = TN.ZONES[i], l2 = TN.missionsDe(zz.id), done = true;
      for (j = 0; j < l2.length; j++) { if (!TN.missionStars(l2[j].id)) { done = false; } }
      badges.push({ i: zz.icone, n: zz.nom, d: 'Toutes les missions du quartier', on: done });
    }
    badges.push({ i: '🎯', n: 'Sans filet', d: '10 missions réussies du premier coup', on: parfaites >= 10 });
    badges.push({ i: '📘', n: 'Tête bien faite', d: 'Les 9 leçons comprises', on: lecons >= NB_LECONS });
    badges.push({ i: '🎓', n: 'Prêt pour le brevet', d: 'Les 6 dossiers à 3 / 3', on: brevetFull >= NB_DOSSIERS });
    badges.push({ i: '🏅', n: 'Concepteur', d: 'Les 3 prototypes de l’atelier validés', on: protos >= 3 });
    badges.push({ i: '🏆', n: 'Grand inventeur', d: 'Les 69 étoiles', on: stars >= max });
    var bg = clear($('badges')), nb = 0;
    for (i = 0; i < badges.length; i++) {
      if (badges[i].on) { nb++; }
      bg.appendChild(el('div', { className: 'badge' + (badges[i].on ? ' on' : ''), title: badges[i].on ? 'Badge obtenu' : 'Pas encore obtenu' }, [
        el('span', { className: 'b-icon', 'aria-hidden': 'true', text: badges[i].i }), el('strong', { text: badges[i].n }), el('small', { text: badges[i].d })]));
    }
    $('badgeCount').textContent = nb + ' / ' + badges.length + ' badges';
  }

  $('exportBtn').addEventListener('click', function () {
    var d = new Date();
    var stamp = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    TN.download('technova-sauvegarde-' + stamp + '.json', TN.exportText());
    $('saveStatus').textContent = 'Fichier de sauvegarde téléchargé. Garde-le pour retrouver ta progression sur un autre appareil.';
  });
  $('importInput').addEventListener('change', function () {
    var file = this.files && this.files[0], input = this;
    if (!file) { return; }
    var reader = new FileReader();
    reader.onload = function () {
      var err = TN.importText(String(reader.result));
      $('saveStatus').textContent = err || 'Sauvegarde importée : ta progression est à jour.';
      input.value = '';
      render();
    };
    reader.onerror = function () { $('saveStatus').textContent = 'Impossible de lire ce fichier.'; };
    reader.readAsText(file);
  });
  $('resetBtn').addEventListener('click', function () {
    TN.dialog({
      titre: 'Effacer toute la progression ?',
      texte: 'Étoiles, leçons, dossiers brevet et prototypes seront effacés sur cet appareil. Exporte d’abord une sauvegarde si tu veux les garder.',
      annuler: 'Annuler',
      boutons: [{ label: 'Oui, tout effacer', classe: 'danger', action: function () { TN.reset(); render(); $('saveStatus').textContent = 'Progression effacée.'; } }]
    });
  });

  render();
})();
