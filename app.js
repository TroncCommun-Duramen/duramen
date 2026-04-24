// app.js — Logique UI, navigation, appels Supabase
// Dépend de core.js (DuramenCore) chargé avant ce fichier.

// ═══════════ SUPABASE ═══════════
const SUPABASE_URL = 'https://zeadibimbdztpmsesaiw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYWRpYmltYmR6dHBtc2VzYWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTI2MTcsImV4cCI6MjA5MDQ2ODYxN30.xEHLNTROTu9QJ7c_vV3S54P76EXfpnx2VbhxznbQmmU';
const sbH = {
  'Content-Type':  'application/json',
  'apikey':        SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Prefer':        'return=representation'
};

async function sbSelect(table, filter) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + (filter || ''), { headers: sbH });
  if (!res.ok) throw new Error('Lecture ' + table + ': ' + res.status);
  return res.json();
}
async function sbInsert(table, data) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
    method: 'POST', headers: sbH, body: JSON.stringify(data)
  });
  if (!res.ok) { var e = await res.text(); throw new Error('Insertion ' + table + ': ' + res.status + ' ' + e); }
  return res.json();
}
async function sbDelete(table, id) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
    method: 'DELETE', headers: sbH
  });
  if (!res.ok) throw new Error('Suppression ' + table + ': ' + res.status);
}

// ═══════════ DONNEES ═══════════
var grumes = [], lots = [], extractions = [];

// ESSENCES_INFO est dans core.js → DuramenCore.ESSENCES_INFO

// ─── UI helpers ───────────────────────────────────────────────────────────
function showLoading(on) {
  var el = document.getElementById('loading-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loading-overlay';
    el.className = 'loading-overlay';
    el.innerHTML = '<div class="loading-box">Chargement...</div>';
    document.body.appendChild(el);
  }
  el.style.display = on ? 'flex' : 'none';
}

function showError(msg) {
  var el = document.getElementById('toast-err');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-err';
    el.className = 'toast-erreur';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(function () { el.style.display = 'none'; }, 6000);
}

// ─── Bandeau hors ligne ───────────────────────────────────────────────────
function showOfflineBanner(visible) {
  var el = document.getElementById('offline-banner');
  if (!el) {
    el = document.createElement('div');
    el.id        = 'offline-banner';
    el.className = 'info-box';
    el.textContent = '⚡ Données hors ligne — affichage du dernier cache';
    var main = document.querySelector('main');
    if (main) main.insertBefore(el, main.firstChild);
  }
  el.style.display = visible ? '' : 'none';
}

// ─── Chargement Supabase ──────────────────────────────────────────────────
async function chargerDonnees() {
  if (!communeConnectee) return;
  var code = encodeURIComponent(communeConnectee.code);
  showLoading(true);
  try {
    var rawLots = await sbSelect('lots', 'commune_code=eq.' + code + '&order=created_at.desc');
    var rawExt  = await sbSelect('extractions', 'commune_code=eq.' + code + '&order=created_at.desc');
    lots = rawLots.map(function (l) {
      return Object.assign({}, l, {
        volBrut:    l.vol_brut    || 0,
        volUtile:   l.vol_utile   || 0,
        volDechets: l.vol_dechets || 0,
        nbGrumes:   l.nb_grumes   || 0,
        nbPlanches: l.nb_planches || 0,
        grumes:     l.grumes      || [],
        usages:     l.usages      || []
      });
    });
    extractions = rawExt;
    localStorage.setItem('duramen_lots_cache',        JSON.stringify(lots));
    localStorage.setItem('duramen_extractions_cache', JSON.stringify(extractions));
    mettreAJourHeaderStats();
    mettreAJourAccueil();
    afficherHistorique();
    showOfflineBanner(false);
  } catch (err) {
    var cachedLots = localStorage.getItem('duramen_lots_cache');
    var cachedExt  = localStorage.getItem('duramen_extractions_cache');
    if (cachedLots) {
      lots        = JSON.parse(cachedLots);
      extractions = cachedExt ? JSON.parse(cachedExt) : [];
      mettreAJourHeaderStats();
      mettreAJourAccueil();
      afficherHistorique();
      showOfflineBanner(true);
    } else {
      showError('Erreur chargement : ' + err.message);
    }
  } finally {
    showLoading(false);
  }
}

function sauver() { mettreAJourHeaderStats(); }

// ─── Commune persistante ──────────────────────────────────────────────────
function appliquerCommuneLocked() {
  var inp  = document.getElementById('commune');
  var hint = document.getElementById('commune-hint');
  if (!inp) return;
  inp.readOnly = true;
  inp.classList.add('commune-locked');
  if (hint) hint.style.display = '';
}
function chargerCommune() {
  var saved = localStorage.getItem('duramen_commune');
  var inp   = document.getElementById('commune');
  if (saved && inp) { inp.value = saved; appliquerCommuneLocked(); }
}
function reinitialiserCommune() {
  if (!confirm('Modifier la commune enregistree ?')) return;
  localStorage.removeItem('duramen_commune');
  var inp  = document.getElementById('commune');
  var hint = document.getElementById('commune-hint');
  inp.value = ''; inp.readOnly = false;
  inp.classList.remove('commune-locked');
  if (hint) hint.style.display = 'none';
  inp.focus();
}

// ─── Navigation ──────────────────────────────────────────────────────────
function setStep(n) {
  [1, 2, 3].forEach(function (i) {
    var el = document.getElementById('step' + i);
    el.classList.remove('active', 'done');
    if (i < n)  el.classList.add('done');
    if (i === n) el.classList.add('active');
  });
}
function goToEtape1() {
  document.getElementById('etape1').style.display = '';
  document.getElementById('etape2').style.display = 'none';
  document.getElementById('etape3').style.display = 'none';
  setStep(1);
}
function goToEtape2() {
  var nom = document.getElementById('lot-nom').value.trim();
  var ess = document.getElementById('essence').value;
  var com = document.getElementById('commune').value.trim();
  var cau = document.getElementById('cause').value;
  var pro = document.getElementById('provenance').value;
  var ann = document.getElementById('annee').value;
  var usa = document.getElementById('usage').value;
  if (!nom) {
    document.getElementById('lot-nom-required').style.display = '';
    document.getElementById('lot-nom').focus();
    return;
  }
  document.getElementById('lot-nom-required').style.display = 'none';
  if (!ess || !cau || !pro || !ann || !usa) {
    alert('Merci de renseigner tous les champs obligatoires.');
    return;
  }
  if (com && !localStorage.getItem('duramen_commune')) {
    localStorage.setItem('duramen_commune', com);
    appliquerCommuneLocked();
  }
  document.getElementById('etape1').style.display = 'none';
  document.getElementById('etape2').style.display = '';
  document.getElementById('etape3').style.display = 'none';
  setStep(2);
}
function goToEtape3() {
  if (grumes.length === 0) { alert('Veuillez saisir au moins une grume.'); return; }
  document.getElementById('etape2').style.display = 'none';
  document.getElementById('etape3').style.display = '';
  setStep(3);
  var ess  = document.getElementById('essence').value;
  var info = DuramenCore.ESSENCES_INFO[ess];
  document.getElementById('info-essence-debit').textContent = info
    ? ess + ' — Delta recommande : ' + info.delta + '%'
    : '';
  calculerDebit();
}

// ─── Grumes ──────────────────────────────────────────────────────────────
function ajouterGrume() {
  var l = parseFloat(document.getElementById('g-longueur').value);
  var d = parseFloat(document.getElementById('g-diametre').value);
  if (!l || !d || l <= 0 || d <= 0) { alert('Longueur et diametre sont obligatoires.'); return; }
  grumes.push({ longueur: l, diametre: d });
  document.getElementById('g-longueur').value = '';
  document.getElementById('g-diametre').value = '';
  document.getElementById('g-longueur').focus();
  afficherGrumes();
  sauverBrouillon();
}
function supprimerGrume(i) { grumes.splice(i, 1); afficherGrumes(); sauverBrouillon(); }
function afficherGrumes() {
  var c = document.getElementById('grumes-container');
  document.getElementById('nb-grumes-badge').textContent =
    grumes.length + ' grume' + (grumes.length > 1 ? 's' : '');
  if (grumes.length === 0) {
    c.innerHTML = '<div class="empty-state"><div class="icon">&#x1FAB5;</div><p>Aucune grume saisie.<br>Ajoutez votre premiere grume ci-dessus.</p></div>';
    return;
  }
  c.innerHTML = grumes.map(function (g, i) {
    var vol = (Math.PI * Math.pow(g.diametre / 200, 2) * g.longueur).toFixed(3);
    return '<div class="grume-item">'
      + '<div class="grume-num">' + (i + 1) + '</div>'
      + '<div class="grume-info">'
      + '<div class="grume-field"><span>Longueur</span><span>' + g.longueur + ' m</span></div>'
      + '<div class="grume-field"><span>Diam.</span><span>' + g.diametre + ' cm</span></div>'
      + '<div class="grume-field"><span>Vol.</span><span>' + vol + ' m3</span></div>'
      + '</div>'
      + '<button class="btn btn-danger btn-sm" onclick="supprimerGrume(' + i + ')">x</button>'
      + '</div>';
  }).join('');
}

// ─── Calcul debit ────────────────────────────────────────────────────────
function calculerDebit() {
  var epaisseur = parseFloat(document.getElementById('epaisseur').value);
  var container = document.getElementById('resultats-container');
  var K = 3;
  if (!epaisseur || grumes.length === 0) { container.style.display = 'none'; return; }
  var res  = DuramenCore.calculerVolumes(grumes, epaisseur);
  var rows = res.details.map(function (d, i) {
    var lm = d.largeurMoy > 0 ? d.largeurMoy.toFixed(1) : '0';
    return '<tr><td>' + (i + 1) + '</td><td>' + d.longueur + ' m</td><td>' + d.diametre
      + ' cm</td><td>' + d.volBrut.toFixed(3) + ' m3</td><td>' + d.nbPlanches + '</td><td>'
      + d.lineaire.toFixed(1) + ' m</td><td>' + lm + ' cm</td></tr>';
  });
  var rendement = (res.rendement * 100).toFixed(1);
  document.getElementById('result-grid').innerHTML =
    '<div class="result-stat"><div class="val">' + res.volUtile.toFixed(3) + '</div><div class="unit">m3</div><div class="lbl">Volume debite</div></div>'
    + '<div class="result-stat"><div class="val">' + grumes.length + '</div><div class="unit">grumes</div><div class="lbl">Billes</div></div>'
    + '<div class="result-stat"><div class="val">' + res.nbPlanches + '</div><div class="unit">planches</div><div class="lbl">Debit theorique</div></div>'
    + '<div class="result-stat"><div class="val">' + res.lineaire.toFixed(1) + '</div><div class="unit">m lin.</div><div class="lbl">Lineaire</div></div>'
    + '<div class="result-stat"><div class="val">' + rendement + '</div><div class="unit">%</div><div class="lbl">Rendement</div></div>';
  document.getElementById('dechets-block').innerHTML =
    '<span>&#x267B;&#xFE0F;</span><span>Vol. brut : <strong>' + res.volBrut.toFixed(3)
    + ' m3</strong> &mdash; Pertes estimees : <strong>' + res.volDechets.toFixed(3) + ' m3</strong>'
    + ' (rendement 55% x ' + (epaisseur / (epaisseur + K) * 100).toFixed(1) + '%)</span>';
  document.getElementById('result-tbody').innerHTML = rows.join('');
  container.style.display = '';
}

// ─── Sauvegarde lot ───────────────────────────────────────────────────────
async function sauvegarderLot() {
  var epaisseur = parseFloat(document.getElementById('epaisseur').value);
  if (!epaisseur) {
    alert('Veuillez renseigner l epaisseur des planches.'); return;
  }
  var res = DuramenCore.calculerVolumes(grumes, epaisseur);
  var tVB = res.volBrut, tVD = res.volUtile, tP = res.nbPlanches, tL = res.lineaire;
  var essence = document.getElementById('essence').value;
  var usages  = [];
  lots.forEach(function (l) {
    if (l.essence === essence && l.usage && usages.indexOf(l.usage) === -1) usages.push(l.usage);
  });
  var now = new Date();
  var lot = {
    id:           crypto.randomUUID(),
    commune_code: communeConnectee.code,
    nom:          document.getElementById('lot-nom').value.trim()
                    || (essence + ' - ' + document.getElementById('commune').value.trim()),
    essence:      essence,
    commune:      document.getElementById('commune').value.trim(),
    cause:        document.getElementById('cause').value,
    provenance:   document.getElementById('provenance').value,
    annee:        document.getElementById('annee').value,
    usage:        document.getElementById('usage').value,
    partage:      document.getElementById('lot-partage').checked,
    epaisseur:    epaisseur,
    delta:        45, // fixe : rendement 55% = perte 45%
    nb_grumes:    grumes.length,
    vol_brut:     tVB,
    vol_utile:    tVD,
    vol_dechets:  tVB - tVD,
    nb_planches:  tP,
    lineaire:     tL,
    date:         now.toLocaleDateString('fr-FR'),
    date_iso:     now.toISOString(),
    grumes:       grumes.slice(),
    usages:       usages
  };
  try {
    showLoading(true);
    await sbInsert('lots', lot);
    await chargerDonnees();
    grumes = [];
    afficherGrumes();
    ['essence', 'cause', 'provenance', 'annee', 'usage', 'epaisseur', 'lot-nom']
      .forEach(function (id) { document.getElementById(id).value = ''; });
    document.getElementById('lot-partage').checked = false;
    document.getElementById('resultats-container').style.display = 'none';
    goToEtape1();
    effacerBrouillon();
    alert('Lot sauvegarde !\n' + lot.nom + '\n' + tVD.toFixed(3) + ' m3 debites - ' + tP + ' planches');
  } catch (err) {
    showError('Erreur sauvegarde : ' + err.message);
  } finally {
    showLoading(false);
  }
}

// ─── Stock ────────────────────────────────────────────────────────────────
// getStockParEssence() est dans core.js → DuramenCore.getStock()

function afficherStock() {
  var stock = DuramenCore.getStock();
  var keys  = Object.keys(stock);
  var tE = keys.reduce(function (s, k) { return s + stock[k].entree; }, 0);
  var tS = keys.reduce(function (s, k) { return s + stock[k].sorti;  }, 0);
  var tD = keys.reduce(function (s, k) { return s + stock[k].dispo;  }, 0);

  document.getElementById('stock-totals').innerHTML = keys.length === 0 ? '' :
    '<div class="stock-total-card">'
    + '<div class="stock-total-item"><div class="tv">' + tD.toFixed(2) + '</div><div class="tu">m3</div><div class="tl">Disponible</div></div>'
    + '<div class="stock-divider"></div>'
    + '<div class="stock-total-item"><div class="tv">' + tE.toFixed(2) + '</div><div class="tu">m3</div><div class="tl">Entres</div></div>'
    + '<div class="stock-divider"></div>'
    + '<div class="stock-total-item"><div class="tv">' + tS.toFixed(2) + '</div><div class="tu">m3</div><div class="tl">Sortis</div></div>'
    + '<div class="stock-divider"></div>'
    + '<div class="stock-total-item"><div class="tv">' + keys.length + '</div><div class="tu">essences</div><div class="tl">En stock</div></div>'
    + '</div>';

  var se = document.getElementById('stock-essences');
  if (keys.length === 0) {
    se.innerHTML = '<div class="empty-state"><div class="icon">&#x1F4E6;</div><p>Aucun stock. Creez votre premier lot.</p></div>';
    return;
  }
  se.innerHTML = keys.sort(function (a, b) { return stock[b].dispo - stock[a].dispo; })
    .map(function (ess) {
      var s    = stock[ess];
      var pct  = tD > 0 ? (s.dispo / tD * 100) : 0;
      var info = DuramenCore.ESSENCES_INFO[ess] || { usage: 'Usage a definir' };
      return '<div class="essence-row">'
        + '<div class="essence-row-top">'
        + '<div class="essence-name"><div class="essence-dot ' + s.color + '"></div>' + ess + '</div>'
        + '<div class="essence-stats">'
        + '<div class="essence-stat"><div class="es-val">' + s.dispo.toFixed(3) + '</div><div class="es-lbl">m3 dispo.</div></div>'
        + '<div class="essence-stat"><div class="es-val">' + s.entree.toFixed(3) + '</div><div class="es-lbl">m3 entres</div></div>'
        + '<div class="essence-stat"><div class="es-val">' + s.sorti.toFixed(3) + '</div><div class="es-lbl">m3 sortis</div></div>'
        + '<div class="essence-stat"><div class="es-val">' + s.nbLots + '</div><div class="es-lbl">lots</div></div>'
        + '<div class="essence-stat"><div class="es-val">' + s.nbGrumes + '</div><div class="es-lbl">grumes</div></div>'
        + '</div>'
        + '<button class="btn btn-primary btn-sm" data-ess="' + ess + '" onclick="ouvrirModalExtractionEssence(this.dataset.ess)">Extraire</button>'
        + '</div>'
        + '<div class="essence-bar-wrap"><div class="essence-bar" style="width:' + pct.toFixed(1) + '%"></div></div>'
        + '<div class="essence-usage-info">'
        + info.usage + (s.usages.length ? ' &mdash; Usages : ' + s.usages.join(', ') : '')
        + '</div></div>';
    }).join('');
}

// ─── Extractions ──────────────────────────────────────────────────────────
function ouvrirModalExtraction() {
  var stock = DuramenCore.getStock();
  var sel   = document.getElementById('ext-essence');
  sel.innerHTML = '<option value="">-- Choisir --</option>'
    + Object.keys(stock).filter(function (e) { return stock[e].dispo > 0; })
      .map(function (e) {
        return '<option value="' + e + '">' + e + ' (' + stock[e].dispo.toFixed(3) + ' m3)</option>';
      }).join('');
  ['ext-essence', 'ext-volume', 'ext-usage', 'ext-destination', 'ext-commune', 'ext-contact', 'ext-notes']
    .forEach(function (id) { document.getElementById(id).value = ''; });
  document.getElementById('ext-disponible').style.display = 'none';
  document.getElementById('modal-extraction').classList.add('open');
}
function ouvrirModalExtractionEssence(essence) {
  ouvrirModalExtraction();
  setTimeout(function () {
    document.getElementById('ext-essence').value = essence;
    majDisponible();
  }, 50);
}
function fermerModalExtraction() {
  document.getElementById('modal-extraction').classList.remove('open');
}
function majDisponible() {
  var essence = document.getElementById('ext-essence').value;
  var box     = document.getElementById('ext-disponible');
  if (!essence) { box.style.display = 'none'; return; }
  var stock = DuramenCore.getStock();
  if (stock[essence]) {
    box.innerHTML = 'Disponible <strong>' + essence + '</strong> : <strong>'
      + stock[essence].dispo.toFixed(3) + ' m3 utiles</strong>';
    box.style.display = '';
  }
}
document.getElementById('ext-essence').addEventListener('change', majDisponible);

async function enregistrerExtraction() {
  var essence     = document.getElementById('ext-essence').value;
  var volume      = parseFloat(document.getElementById('ext-volume').value);
  var usage       = document.getElementById('ext-usage').value;
  var destination = document.getElementById('ext-destination').value.trim();
  var commune     = document.getElementById('ext-commune').value.trim();
  var contact     = document.getElementById('ext-contact').value.trim();
  var notes       = document.getElementById('ext-notes').value.trim();
  if (!essence || !volume || !usage || !destination) {
    alert('Renseigner tous les champs obligatoires.'); return;
  }
  var stock = DuramenCore.getStock();
  if (volume > stock[essence].dispo) {
    alert('Volume superieur au stock disponible (' + stock[essence].dispo.toFixed(3) + ' m3).'); return;
  }
  var now = new Date();
  var ext = {
    id:           crypto.randomUUID(),
    commune_code: communeConnectee.code,
    essence:      essence,
    volume:       volume,
    usage:        usage,
    destination:  destination,
    commune:      commune,
    contact:      contact,
    notes:        notes,
    date:         now.toLocaleDateString('fr-FR'),
    date_iso:     now.toISOString()
  };
  try {
    showLoading(true);
    await sbInsert('extractions', ext);
    await chargerDonnees();
    fermerModalExtraction();
    alert('Extraction enregistree !\n' + volume + ' m3 de ' + essence + ' vers ' + destination);
    afficherExtractions();
    if (document.getElementById('panel-stock').classList.contains('active')) afficherStock();
  } catch (err) {
    showError('Erreur extraction : ' + err.message);
  } finally {
    showLoading(false);
  }
}

function afficherExtractions() {
  var container = document.getElementById('extraction-list');
  if (extractions.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">&#x2197;</div><p>Aucune extraction enregistree.</p></div>';
    return;
  }
  var tS  = extractions.reduce(function (s, e) { return s + e.volume; }, 0);
  var nbE = extractions.length;
  container.innerHTML =
    '<div class="stats-row">'
    + '<div class="card stat-card">'
    + '<div class="stat-val">' + tS.toFixed(2) + '</div>'
    + '<div class="stat-lbl">m3 extraits</div></div>'
    + '<div class="card stat-card">'
    + '<div class="stat-val">' + nbE + '</div>'
    + '<div class="stat-lbl">extraction' + (nbE > 1 ? 's' : '') + '</div></div>'
    + '</div>'
    + '<div class="extraction-list">'
    + extractions.map(function (ext, idx) {
        return '<div class="extraction-item">'
          + '<div class="ei-header"><div>'
          + '<div class="ei-title">' + ext.destination + (ext.commune ? ' &mdash; ' + ext.commune : '') + '</div>'
          + '<div class="ei-meta">' + ext.date + (ext.contact ? ' &mdash; ' + ext.contact : '') + '</div>'
          + '</div>'
          + '<button class="btn btn-danger btn-sm" onclick="supprimerExtraction(' + idx + ')">x</button>'
          + '</div>'
          + '<div class="ei-stats">'
          + '<div class="ei-stat">Essence : <strong>' + ext.essence + '</strong></div>'
          + '<div class="ei-stat">Volume : <strong>' + ext.volume + ' m3</strong></div>'
          + '<div class="ei-stat">Usage : <strong>' + ext.usage + '</strong></div>'
          + (ext.notes ? '<div class="ei-stat">' + ext.notes + '</div>' : '')
          + '</div></div>';
      }).join('')
    + '</div>';
}

async function supprimerExtraction(idx) {
  if (!confirm('Supprimer cette extraction ?')) return;
  try {
    showLoading(true);
    await sbDelete('extractions', extractions[idx].id);
    await chargerDonnees();
    afficherExtractions();
  } catch (err) {
    showError('Erreur : ' + err.message);
  } finally {
    showLoading(false);
  }
}

// ─── Historique ───────────────────────────────────────────────────────────
function afficherHistorique() {
  var container = document.getElementById('historique-container');
  if (!container) return;
  if (lots.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">&#x1F4C2;</div><p>Aucun lot enregistre.</p></div>';
    return;
  }
  container.innerHTML = lots.map(function (lot, idx) {
    var vU  = lot.vol_utile   || 0;
    var vD  = lot.vol_dechets || 0;
    var nbG = lot.nb_grumes   || 0;
    var nbP = lot.nb_planches || 0;
    var lin = lot.lineaire    || 0;
    return '<div class="lot-card">'
      + '<div class="lot-card-header"><div>'
      + '<div class="lot-card-title">' + lot.nom + '</div>'
      + '<div class="lot-card-meta">'
      + lot.commune + ' &mdash; ' + lot.annee + ' &mdash; ' + lot.date
      + ' &mdash; ' + lot.cause + ' &mdash; ' + lot.provenance
      + ' &mdash; <span class="badge ' + badgeClass(lot.usage) + '">' + lot.usage + '</span>'
      + '</div></div>'
      + '<button class="btn btn-danger btn-sm" onclick="supprimerLot(' + idx + ');event.stopPropagation()">x</button>'
      + '</div>'
      + '<div class="lot-card-stats">'
      + '<div class="lot-stat">Essence : <strong>' + lot.essence + '</strong></div>'
      + '<div class="lot-stat">' + nbG + ' grume' + (nbG > 1 ? 's' : '') + '</div>'
      + '<div class="lot-stat">Planches : <strong>' + nbP + '</strong></div>'
      + '<div class="lot-stat">Lineaire : <strong>' + lin.toFixed(1) + ' m</strong></div>'
      + '<div class="lot-stat">Vol. utile : <strong>' + vU.toFixed(3) + ' m3</strong></div>'
      + '<div class="lot-stat">Dechets : ' + vD.toFixed(3)
      + ' m3 &mdash; Ep.' + lot.epaisseur + 'mm &mdash; Delta ' + lot.delta + '%</div>'
      + '</div></div>';
  }).join('');
}

function badgeClass(usage) {
  if (!usage) return 'badge-autre';
  var u = usage.toLowerCase();
  if (u.indexOf('int') !== -1) return 'badge-int';
  if (u.indexOf('ext') !== -1) return 'badge-ext';
  if (u.indexOf('mob') !== -1) return 'badge-mob';
  return 'badge-autre';
}

async function supprimerLot(idx) {
  if (!confirm('Supprimer ce lot ? Action irreversible.')) return;
  try {
    showLoading(true);
    await sbDelete('lots', lots[idx].id);
    await chargerDonnees();
  } catch (err) {
    showError('Erreur : ' + err.message);
  } finally {
    showLoading(false);
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────
function exporterCSV() {
  if (lots.length === 0) { alert('Aucun lot.'); return; }
  var h = ['Nom','Essence','Commune','Cause','Provenance','Annee','Usage',
            'Nb grumes','Vol. brut','Vol. utile','Vol. dechets','Nb planches','Lineaire','Epaisseur','Delta','Date'];
  var r = lots.map(function (l) {
    return [l.nom, l.essence, l.commune, l.cause, l.provenance, l.annee, l.usage,
            l.nb_grumes || 0, (l.vol_brut || 0).toFixed(3), (l.vol_utile || 0).toFixed(3),
            (l.vol_dechets || 0).toFixed(3), l.nb_planches || 0, (l.lineaire || 0).toFixed(2),
            l.epaisseur, l.delta, l.date];
  });
  var csv = [h].concat(r).map(function (row) {
    return row.map(function (v) { return '"' + v + '"'; }).join(';');
  }).join('\n');
  var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'duramen_lots_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
}
function exporterStockCSV() {
  var stock = DuramenCore.getStock();
  if (!Object.keys(stock).length) { alert('Aucun stock.'); return; }
  var h = ['Essence','m3 entres','m3 sortis','m3 disponibles','Nb lots','Nb grumes'];
  var r = Object.keys(stock).map(function (e) {
    return [e, stock[e].entree.toFixed(3), stock[e].sorti.toFixed(3),
            stock[e].dispo.toFixed(3), stock[e].nbLots, stock[e].nbGrumes];
  });
  var csv = [h].concat(r).map(function (row) {
    return row.map(function (v) { return '"' + v + '"'; }).join(';');
  }).join('\n');
  var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'duramen_stock_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
}

// ─── Header stats ─────────────────────────────────────────────────────────
function mettreAJourHeaderStats() {
  var stock = DuramenCore.getStock();
  var tD  = Object.values(stock).reduce(function (s, e) { return s + e.dispo; }, 0);
  var nbE = Object.keys(stock).length;
  ['hs-vol',  'hs-vol-m' ].forEach(function (id) { var el = document.getElementById(id); if (el) el.textContent = tD.toFixed(2); });
  ['hs-lots', 'hs-lots-m'].forEach(function (id) { var el = document.getElementById(id); if (el) el.textContent = lots.length; });
  ['hs-essences', 'hs-essences-m'].forEach(function (id) { var el = document.getElementById(id); if (el) el.textContent = nbE; });
}

// ─── Accueil mobile ───────────────────────────────────────────────────────
function mettreAJourStatutReseau() {
  var el = document.getElementById('accueil-online-dot');
  if (!el) return;
  var label = el.querySelector('.accueil-network-label');
  if (navigator.onLine) {
    el.classList.add('online');
    el.classList.remove('offline');
    if (label) label.textContent = 'En ligne';
  } else {
    el.classList.remove('online');
    el.classList.add('offline');
    if (label) label.textContent = 'Hors ligne';
  }
}

function mettreAJourAccueil() {
  var communeEl = document.getElementById('accueil-commune');
  if (communeEl && communeConnectee) communeEl.textContent = communeConnectee.nom;
  var stock = DuramenCore.getStock();
  var tD = Object.values(stock).reduce(function (s, e) { return s + e.dispo; }, 0);
  var stockEl = document.getElementById('accueil-stock-val');
  if (stockEl) stockEl.textContent = tD.toFixed(2);
  mettreAJourStatutReseau();
}

// ─── Territoire ───────────────────────────────────────────────────────────
async function afficherTerritoire() {
  var container = document.getElementById('territoire-container');
  container.innerHTML = '<div class="empty-state"><div class="icon">&#x23F3;</div><p>Chargement...</p></div>';
  var lP = [];
  try {
    lP = await sbSelect('lots', 'partage=eq.true&order=created_at.desc');
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><p>Erreur : ' + err.message + '</p></div>';
    return;
  }
  if (lP.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">&#x1F310;</div><p>Aucun lot partage pour l instant.</p></div>';
    return;
  }
  var pC = {};
  lP.forEach(function (l) {
    if (!pC[l.commune]) pC[l.commune] = [];
    pC[l.commune].push(l);
  });
  var tV = lP.reduce(function (s, l) { return s + (l.vol_utile || 0); }, 0);
  var nC = Object.keys(pC).length;
  container.innerHTML =
    '<div class="stats-row">'
    + '<div class="card stat-card">'
    + '<div class="stat-val">' + tV.toFixed(2) + '</div>'
    + '<div class="stat-lbl">m3 partages</div></div>'
    + '<div class="card stat-card">'
    + '<div class="stat-val">' + nC + '</div>'
    + '<div class="stat-lbl">commune' + (nC > 1 ? 's' : '') + '</div></div>'
    + '<div class="card stat-card">'
    + '<div class="stat-val">' + lP.length + '</div>'
    + '<div class="stat-lbl">lots</div></div>'
    + '</div>'
    + Object.keys(pC).sort().map(function (commune) {
        var lC  = pC[commune];
        var vC  = lC.reduce(function (s, l) { return s + (l.vol_utile || 0); }, 0);
        var ess = lC.map(function (l) { return l.essence; })
                    .filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ');
        return '<div class="territoire-card">'
          + '<div class="territoire-commune-name">' + commune
          + '<span class="chip-partage">Partage actif</span></div>'
          + '<div class="territoire-stats">'
          + '<div class="territoire-stat">Volume : <strong>' + vC.toFixed(3) + ' m3</strong></div>'
          + '<div class="territoire-stat">Lots : <strong>' + lC.length + '</strong></div>'
          + '<div class="territoire-stat">Essences : <strong>' + ess + '</strong></div>'
          + '</div>'
          + '<div class="mt-10">'
          + lC.map(function (l) {
              return '<div class="territoire-lot-row">'
                + '<span class="territoire-lot-nom">' + l.nom + '</span>'
                + '<span class="territoire-lot-meta">' + l.essence + ' &mdash; ' + (l.vol_utile || 0).toFixed(3) + ' m3 &mdash; ' + l.annee + '</span>'
                + '</div>';
            }).join('')
          + '</div></div>';
      }).join('');
}

// ─── Authentification via Supabase ────────────────────────────────────────
var communeConnectee = null;

function verifierAcces() {
  var session = localStorage.getItem('duramen_session') || sessionStorage.getItem('duramen_session');
  if (session) {
    try {
      communeConnectee = JSON.parse(session);
      localStorage.setItem('duramen_session', JSON.stringify(communeConnectee));
      ouvrirApp();
      return;
    } catch (e) {}
  }
  document.getElementById('ecran-connexion').classList.add('visible');
}

async function tentativeConnexion() {
  var code   = document.getElementById('login-code').value.trim().toUpperCase();
  var erreur = document.getElementById('login-erreur');
  var btn    = document.getElementById('btn-login');
  erreur.textContent = '';
  if (!code) { erreur.textContent = 'Veuillez saisir votre code.'; return; }
  btn.disabled = true;
  btn.textContent = 'VÉRIFICATION…';
  try {
    var res = await fetch(
      SUPABASE_URL + '/rest/v1/codes_acces?code=eq.' + encodeURIComponent(code) + '&actif=eq.true&select=code,commune',
      { headers: sbH }
    );
    if (!res.ok) throw new Error('Erreur reseau ' + res.status);
    var data = await res.json();
    if (data && data.length > 0) {
      communeConnectee = { code: data[0].code, nom: data[0].commune };
      localStorage.setItem('duramen_session', JSON.stringify(communeConnectee));
      if (!localStorage.getItem('duramen_commune'))
        localStorage.setItem('duramen_commune', communeConnectee.nom);
      ouvrirApp();
    } else {
      erreur.textContent = 'Code invalide ou inactif. Contactez votre referent DURAMEN.';
      document.getElementById('login-code').value = '';
      document.getElementById('login-code').focus();
    }
  } catch (err) {
    erreur.textContent = 'Erreur de connexion : ' + err.message;
  } finally {
    btn.disabled    = false;
    btn.textContent = 'ACCÉDER';
  }
}

function ouvrirApp() {
  document.getElementById('ecran-connexion').classList.remove('visible');
  var chip = document.createElement('div');
  chip.className    = 'commune-chip';
  chip.textContent  = '📍 ' + communeConnectee.nom;
  var btnD = document.createElement('button');
  btnD.className    = 'btn btn-sm btn-deconnexion';
  btnD.textContent  = 'Deconnexion';
  btnD.onclick = function () {
    if (confirm('Se deconnecter ?')) {
      localStorage.removeItem('duramen_session');
      localStorage.removeItem('duramen_commune');
      sessionStorage.clear();
      location.reload();
    }
  };
  var hr = document.getElementById('header-stats');
  hr.innerHTML = '';
  hr.appendChild(chip);
  hr.appendChild(document.createElement('br'));
  hr.appendChild(document.createTextNode('Stock : '));
  var sv = document.createElement('strong'); sv.id = 'hs-vol'; sv.textContent = '--'; hr.appendChild(sv);
  hr.appendChild(document.createTextNode(' m3 - '));
  var sl = document.createElement('strong'); sl.id = 'hs-lots'; sl.textContent = '--'; hr.appendChild(sl);
  hr.appendChild(document.createTextNode(' lots'));
  hr.appendChild(document.createElement('br'));
  hr.appendChild(btnD);
  chargerCommune();
  restaurerBrouillon();
  chargerDonnees();
  demarrerRafraichissement();
  mettreAJourAccueil();
  if (window.innerWidth <= 600) {
    var btnAccueil = document.querySelector('[data-panel="accueil"]');
    if (btnAccueil) switchTab('accueil', btnAccueil);
  }
}

// ─── Mentions legales ────────────────────────────────────────────────────
function afficherMentions() {
  document.getElementById('ecran-connexion').classList.remove('visible');
  ['header', 'main', 'footer'].forEach(function (t) { document.querySelector(t).style.display = 'none'; });
  document.querySelector('.tabs-wrap').style.display  = 'none';
  document.querySelector('.bottom-nav').style.display = 'none';
  document.getElementById('panel-mentions').style.display = 'block';
}
function fermerMentions() {
  document.getElementById('panel-mentions').style.display = 'none';
  ['header', 'main', 'footer'].forEach(function (t) { document.querySelector(t).style.display = ''; });
  document.querySelector('.tabs-wrap').style.display  = '';
  document.querySelector('.bottom-nav').style.display = '';
  if (!localStorage.getItem('duramen_session'))
    document.getElementById('ecran-connexion').classList.add('visible');
}

// ─── Brouillon (auto-sauvegarde) ──────────────────────────────────────────
function sauverBrouillon() {
  var draft = {
    nom:        document.getElementById('lot-nom').value,
    essence:    document.getElementById('essence').value,
    commune:    document.getElementById('commune').value,
    cause:      document.getElementById('cause').value,
    provenance: document.getElementById('provenance').value,
    annee:      document.getElementById('annee').value,
    usage:      document.getElementById('usage').value,
    partage:    document.getElementById('lot-partage').checked,
    epaisseur:  document.getElementById('epaisseur').value,
    grumes:     grumes.slice()
  };
  localStorage.setItem('duramen_draft', JSON.stringify(draft));
}

function effacerBrouillon() {
  localStorage.removeItem('duramen_draft');
}

function restaurerBrouillon() {
  var raw = localStorage.getItem('duramen_draft');
  if (!raw) return;
  try {
    var draft = JSON.parse(raw);
    if (!confirm('Reprendre la saisie en cours ?')) { effacerBrouillon(); return; }
    document.getElementById('lot-nom').value    = draft.nom        || '';
    document.getElementById('essence').value    = draft.essence    || '';
    document.getElementById('commune').value    = draft.commune    || '';
    document.getElementById('cause').value      = draft.cause      || '';
    document.getElementById('provenance').value = draft.provenance || '';
    document.getElementById('annee').value      = draft.annee      || '';
    document.getElementById('usage').value      = draft.usage      || '';
    document.getElementById('lot-partage').checked = draft.partage || false;
    document.getElementById('epaisseur').value  = draft.epaisseur  || '';
    grumes = Array.isArray(draft.grumes) ? draft.grumes : [];
    afficherGrumes();
  } catch (e) {
    effacerBrouillon();
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────
function switchTab(panel, btn) {
  document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
  document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
  document.querySelectorAll('.bnav-btn').forEach(function (t) { t.classList.remove('active'); });
  document.getElementById('panel-' + panel).classList.add('active');
  document.querySelectorAll('[data-panel="' + panel + '"]').forEach(function (el) { el.classList.add('active'); });
  btn.classList.add('active');
  if (panel === 'stock')      afficherStock();
  if (panel === 'extraction') afficherExtractions();
  if (panel === 'historique') afficherHistorique();
  if (panel === 'territoire') afficherTerritoire();
}


// ─── Rafraîchissement automatique toutes les 2 minutes ───────────────────
var refreshTimer = null;

function demarrerRafraichissement() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(function() {
    if (communeConnectee) {
      chargerDonnees();
      // Rafraîchir aussi les onglets actifs
      var panelStock = document.getElementById('panel-stock');
      var panelExt   = document.getElementById('panel-extraction');
      if (panelStock && panelStock.classList.contains('active')) afficherStock();
      if (panelExt  && panelExt.classList.contains('active'))   afficherExtractions();
    }
  }, 120000); // 120 000 ms = 2 minutes
}

// ─── Écouteurs auto-sauvegarde brouillon ─────────────────────────────────
['lot-nom', 'commune', 'epaisseur'].forEach(function (id) {
  document.getElementById(id).addEventListener('input', sauverBrouillon);
});
['essence', 'cause', 'provenance', 'annee', 'usage'].forEach(function (id) {
  document.getElementById(id).addEventListener('change', sauverBrouillon);
});
document.getElementById('lot-partage').addEventListener('change', sauverBrouillon);

window.addEventListener('online',  mettreAJourStatutReseau);
window.addEventListener('offline', mettreAJourStatutReseau);

verifierAcces();
