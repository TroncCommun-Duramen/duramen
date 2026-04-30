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
  if (on) { el.classList.remove('hidden'); } else { el.classList.add('hidden'); }
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
  el.classList.remove('hidden');
  setTimeout(function () { el.classList.add('hidden'); }, 6000);
}

// ─── Swipe down pour fermer les bottom sheets ─────────────────────────────
function ajouterSwipeDown(el, fn) {
  var startY = 0;
  el.addEventListener('touchstart', function (e) {
    startY = e.touches[0].clientY;
  }, { passive: true });
  el.addEventListener('touchend', function (e) {
    if (e.changedTouches[0].clientY - startY > 80) fn();
  }, { passive: true });
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
  el.classList.toggle('hidden', !visible);
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
    afficherExtraction();
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
  if (hint) hint.classList.remove('hidden');
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
  if (hint) hint.classList.add('hidden');
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
  document.getElementById('etape1').classList.remove('hidden');
  document.getElementById('etape2').classList.add('hidden');
  document.getElementById('etape3').classList.add('hidden');
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
    document.getElementById('lot-nom-required').classList.remove('hidden');
    document.getElementById('lot-nom').focus();
    return;
  }
  document.getElementById('lot-nom-required').classList.add('hidden');
  if (!ess || !cau || !pro || !ann || !usa) {
    alert('Merci de renseigner tous les champs obligatoires.');
    return;
  }
  if (com && !localStorage.getItem('duramen_commune')) {
    localStorage.setItem('duramen_commune', com);
    appliquerCommuneLocked();
  }
  document.getElementById('etape1').classList.add('hidden');
  document.getElementById('etape2').classList.remove('hidden');
  document.getElementById('etape3').classList.add('hidden');
  setStep(2);
}
function goToEtape3() {
  if (grumes.length === 0) { alert('Veuillez saisir au moins une grume.'); return; }
  document.getElementById('etape2').classList.add('hidden');
  document.getElementById('etape3').classList.remove('hidden');
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
  if (!epaisseur || grumes.length === 0) { container.classList.add('hidden'); return; }
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
  container.classList.remove('hidden');
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
    vol_utile:    tVB,
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
    document.getElementById('resultats-container').classList.add('hidden');
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
// ─── État de l'écran Extraction ───────────────────────────────────────────
var extDraft     = { destination: '', communeInstall: '', usage: '', lieu: '' };
var extGrumesSel = [];
var extCommunes  = [];
var extEssFiltre = null;
var extDebitActif = false;

function showToastSucces(msg) {
  var el = document.getElementById('toast-ok');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-ok';
    el.className = 'toast-succes hidden';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(function () { el.classList.add('hidden'); }, 3000);
}

// ─── Écran Extraction ─────────────────────────────────────────────────────
function afficherExtraction() {
  var panel = document.getElementById('ext-content');
  if (!panel) return;
  while (panel.firstChild) panel.removeChild(panel.firstChild);
  extGrumesSel = [];
  extEssFiltre = null;

  // Section grumes à extraire
  var secGrumes = cel('div', 'ext-section');
  secGrumes.appendChild(cel('div', 'ext-section-title', 'Grumes à extraire'));

  var stock    = DuramenCore.getStock();
  var essences = Object.keys(stock).filter(function (e) { return stock[e].dispo > 0; });
  if (essences.length > 0) {
    var chipsWrap = cel('div', 'ext-essence-chips');
    essences.forEach(function (ess) {
      var chip = cel('button', 'ext-chip', ess);
      chip.type = 'button';
      chip.dataset.ess = ess;
      chip.onclick = function () {
        extEssFiltre = (extEssFiltre === ess) ? null : ess;
        panel.querySelectorAll('.ext-chip').forEach(function (c) {
          c.classList.toggle('active', c.dataset.ess === extEssFiltre);
        });
      };
      chipsWrap.appendChild(chip);
    });
    secGrumes.appendChild(chipsWrap);
  }

  var btnSel = cel('button', 'ext-sel-btn', 'Sélectionner les grumes');
  btnSel.type = 'button';
  btnSel.onclick = ouvrirGrumeSelSheet;
  secGrumes.appendChild(btnSel);

  var selSummary = cel('div', 'ext-sel-summary hidden');
  selSummary.id = 'ext-sel-summary';
  secGrumes.appendChild(selSummary);
  panel.appendChild(secGrumes);

  // Section débit en planches
  extDebitActif = false;
  var secDebit = cel('div', 'ext-section');

  var toggleGrid = cel('div', 'ext-debit-grid');

  var btnBrute = cel('button', 'ext-debit-toggle active', 'Grume brute');
  btnBrute.type    = 'button';
  btnBrute.id      = 'ext-btn-brute';
  btnBrute.onclick = function () { basculerDebitExtraction(false); };

  var btnDebit = cel('button', 'ext-debit-toggle', 'Débit en planches');
  btnDebit.type    = 'button';
  btnDebit.id      = 'ext-btn-debit';
  btnDebit.onclick = function () { basculerDebitExtraction(true); };

  toggleGrid.appendChild(btnBrute);
  toggleGrid.appendChild(btnDebit);
  secDebit.appendChild(toggleGrid);

  var slidersWrap = cel('div', 'ext-debit-sliders hidden');
  slidersWrap.id = 'ext-debit-sliders';

  var slidersDef = [
    { id: 'ext-epaisseur', label: 'Épaisseur planche',  min: 20, max: 50, step: 1, def: 27, unit: 'mm' },
    { id: 'ext-scie',      label: 'Trait de scie',       min: 2,  max: 4,  step: 1, def: 3,  unit: 'mm' },
    { id: 'ext-rendement', label: 'Rendement géom.',     min: 30, max: 70, step: 5, def: 50, unit: '%'  }
  ];
  slidersDef.forEach(function (s) {
    var row = cel('div', 'ext-slider-row');
    var top = cel('div', 'ext-slider-top');
    top.appendChild(cel('span', 'ext-label', s.label));
    var valEl = cel('span', 'ext-slider-val', s.def + ' ' + s.unit);
    valEl.id = s.id + '-val';
    top.appendChild(valEl);
    row.appendChild(top);
    var inp = cel('input', 'ext-slider');
    inp.type  = 'range';
    inp.min   = String(s.min);
    inp.max   = String(s.max);
    inp.step  = String(s.step);
    inp.value = String(s.def);
    inp.id    = s.id;
    inp.addEventListener('input', function () {
      valEl.textContent = inp.value + ' ' + s.unit;
      majDebitExtraction();
    });
    row.appendChild(inp);
    slidersWrap.appendChild(row);
  });

  var formulaRow  = cel('div', 'ext-formula-row');
  var formuleLien = cel('button', 'ext-formula-link', 'Voir la formule');
  formuleLien.type = 'button';
  var formuleZone  = cel('div', 'ext-formula-zone hidden');
  var ftxt = cel('p', 'ext-formula-text', 'V_utile = V × R × (e ÷ (e + t))   —   V_déchet = V − V_utile');
  var fdet = cel('p', 'ext-formula-detail', 'V = volume brut · R = rendement géom. · e = épaisseur planche · t = trait de scie');
  formuleZone.appendChild(ftxt);
  formuleZone.appendChild(fdet);
  formuleLien.onclick = function () {
    formuleZone.classList.toggle('hidden');
    formuleLien.textContent = formuleZone.classList.contains('hidden') ? 'Voir la formule' : 'Masquer la formule';
  };
  var lineaireBox = cel('div', 'ext-lineaire-box');
  var linLbl = cel('div', 'ext-lineaire-lbl', 'Linéaire indicatif');
  var linVal = cel('div', 'ext-lineaire-val', '—');
  linVal.id = 'ext-lineaire-val';
  lineaireBox.appendChild(linLbl);
  lineaireBox.appendChild(linVal);
  formulaRow.appendChild(formuleLien);
  formulaRow.appendChild(lineaireBox);
  slidersWrap.appendChild(formulaRow);
  slidersWrap.appendChild(formuleZone);
  secDebit.appendChild(slidersWrap);
  panel.appendChild(secDebit);

  // Barre de synthèse
  var synthese = cel('div', 'ext-synthese hidden');
  synthese.id  = 'ext-synthese';
  [
    { id: 'ext-syn-brut',  lbl: 'm³ extrait' },
    { id: 'ext-syn-utile', lbl: 'm³ utile'   },
    { id: 'ext-syn-dech',  lbl: 'm³ déchet'  }
  ].forEach(function (s) {
    var item = cel('div', 'ext-syn-item');
    var val  = cel('div', 'ext-syn-val', '—');
    val.id   = s.id;
    item.appendChild(val);
    item.appendChild(cel('div', 'ext-syn-lbl', s.lbl));
    synthese.appendChild(item);
  });
  panel.appendChild(synthese);

  // Bouton valider
  var btnVal = cel('button', 'ext-valider-btn', 'Valider l\'extraction →');
  btnVal.type    = 'button';
  btnVal.onclick = ouvrirModalExtractionDest;
  panel.appendChild(btnVal);

  assureModalExtractionDest();
}

function basculerDebitExtraction(activer) {
  extDebitActif = activer;
  var btnBrute = document.getElementById('ext-btn-brute');
  var btnDebit = document.getElementById('ext-btn-debit');
  var sliders  = document.getElementById('ext-debit-sliders');
  if (btnBrute) btnBrute.classList.toggle('active', !extDebitActif);
  if (btnDebit) btnDebit.classList.toggle('active', extDebitActif);
  if (sliders)  sliders.classList.toggle('hidden', !extDebitActif);
  majSyntheseExtraction();
}

async function chargerCommunesExtraction() {
  if (extCommunes.length > 0) { remplirCommunesSel(); return; }
  try {
    var rows = await sbSelect('codes_acces', 'actif=eq.true&select=code,commune&order=commune.asc');
    extCommunes = rows || [];
    remplirCommunesSel();
  } catch (e) { /* silent — le champ reste utilisable */ }
}

function remplirCommunesSel() {
  var sel = document.getElementById('modal-ext-commune');
  if (!sel) return;
  while (sel.firstChild) sel.removeChild(sel.firstChild);
  var optD = cel('option', '', '— Choisir —');
  optD.value = '';
  sel.appendChild(optD);
  extCommunes.forEach(function (c) {
    var o = cel('option', '', c.commune);
    o.value = c.commune;
    sel.appendChild(o);
  });
  sel.value = extDraft.communeInstall;
}

// ─── Modale Destination (extraction) ─────────────────────────────────────
function assureModalExtractionDest() {
  if (document.getElementById('modal-ext-bg')) return;

  var bg    = cel('div', 'extract-modal-bg');
  bg.id     = 'modal-ext-bg';
  var modal = cel('div', 'extract-modal modal-extraction-dest');

  var closeBtn = cel('button', 'modal-close', '✕');
  closeBtn.onclick = fermerModalExtractionDest;
  modal.appendChild(closeBtn);

  modal.appendChild(cel('h2', '', 'Destination'));
  modal.appendChild(cel('p', 'modal-sub', 'À qui vont ces grumes ?'));

  var fNom = cel('div', 'field');
  var lNom = cel('label', '', 'Nom du projet');
  lNom.htmlFor = 'modal-ext-nom';
  var iNom = document.createElement('input');
  iNom.type        = 'text';
  iNom.id          = 'modal-ext-nom';
  iNom.autocomplete = 'off';
  iNom.placeholder = 'Ex. : Mairie de Rezé, bancs publics…';
  fNom.appendChild(lNom);
  fNom.appendChild(iNom);
  modal.appendChild(fNom);

  var fCom = cel('div', 'field');
  var lCom = cel('label', '', 'Commune d\'installation');
  lCom.htmlFor = 'modal-ext-commune';
  var sCom = cel('select', '');
  sCom.id = 'modal-ext-commune';
  var optDef = cel('option', '', '— Choisir —');
  optDef.value = '';
  sCom.appendChild(optDef);
  fCom.appendChild(lCom);
  fCom.appendChild(sCom);
  modal.appendChild(fCom);

  var fUsa = cel('div', 'field');
  var lUsa = cel('label', '', 'Usage');
  lUsa.htmlFor = 'modal-ext-usage';
  var sUsa = cel('select', '');
  sUsa.id = 'modal-ext-usage';
  ['', 'Intérieur', 'Extérieur'].forEach(function (u) {
    var o = cel('option', '', u || '— Choisir —');
    o.value = u;
    sUsa.appendChild(o);
  });
  fUsa.appendChild(lUsa);
  fUsa.appendChild(sUsa);
  modal.appendChild(fUsa);

  var fLieu = cel('div', 'field');
  var lLieu = cel('label', '', 'Lieu (optionnel)');
  lLieu.htmlFor = 'modal-ext-lieu';
  var iLieu = document.createElement('input');
  iLieu.type        = 'text';
  iLieu.id          = 'modal-ext-lieu';
  iLieu.autocomplete = 'off';
  iLieu.placeholder = 'Ex. : salle des fêtes, école…';
  fLieu.appendChild(lLieu);
  fLieu.appendChild(iLieu);
  modal.appendChild(fLieu);

  var acts   = cel('div', 'flex-end');
  var btnRet = cel('button', 'btn btn-outline', '← Retour');
  btnRet.type    = 'button';
  btnRet.onclick = fermerModalExtractionDest;
  var btnOk  = cel('button', 'btn btn-primary', 'Confirmer');
  btnOk.type    = 'button';
  btnOk.onclick = confirmerExtractionDest;
  acts.appendChild(btnRet);
  acts.appendChild(btnOk);
  modal.appendChild(acts);

  ajouterSwipeDown(modal, fermerModalExtractionDest);
  bg.appendChild(modal);
  document.body.appendChild(bg);
}

function ouvrirModalExtractionDest() {
  if (extGrumesSel.length === 0) { showError('Sélectionnez au moins une grume.'); return; }
  assureModalExtractionDest();
  var nomEl  = document.getElementById('modal-ext-nom');
  var usaEl  = document.getElementById('modal-ext-usage');
  var lieuEl = document.getElementById('modal-ext-lieu');
  if (nomEl)  nomEl.value  = extDraft.destination;
  if (usaEl)  usaEl.value  = extDraft.usage;
  if (lieuEl) lieuEl.value = extDraft.lieu;
  document.getElementById('modal-ext-bg').classList.add('open');
  chargerCommunesExtraction();
  if (nomEl) nomEl.focus();
}

function fermerModalExtractionDest() {
  var bg = document.getElementById('modal-ext-bg');
  if (bg) bg.classList.remove('open');
}

function ouvrirGrumeSelSheet() {
  construireContenuGrumeSelSheet();
  var wrap = document.getElementById('grume-sel-sheet-wrap');
  if (wrap) wrap.classList.add('open');
}

function fermerGrumeSelSheet() {
  var wrap = document.getElementById('grume-sel-sheet-wrap');
  if (wrap) wrap.classList.remove('open');
}

function construireContenuGrumeSelSheet() {
  var content = document.getElementById('grume-sel-content');
  if (!content) return;
  while (content.firstChild) content.removeChild(content.firstChild);

  var lotsFiltrés = lots.filter(function (l) {
    if (!l.grumes || l.grumes.length === 0) return false;
    return !extEssFiltre || l.essence === extEssFiltre;
  });

  var selState = {};
  var allVolMap = {};
  extGrumesSel.forEach(function (g) { selState[g.key] = true; });

  if (lotsFiltrés.length === 0) {
    content.appendChild(cel('div', 'ext-empty', 'Aucun lot disponible' + (extEssFiltre ? ' pour ' + extEssFiltre : '') + '.'));
  } else {
    lotsFiltrés.forEach(function (lot) {
      var hdr = cel('div', 'grume-sel-lot-header');
      hdr.appendChild(cel('span', 'grume-sel-lot-nom', lot.nom || 'Lot sans nom'));
      hdr.appendChild(cel('span', 'grume-sel-lot-ess', lot.essence));
      content.appendChild(hdr);

      var volMap = {};
      lot.grumes.forEach(function (g, gi) {
        var key = lot.id + '_' + gi;
        var d   = parseFloat(g.diametre) || 0;
        var l   = parseFloat(g.longueur) || 0;
        var qty = g.quantite || 1;
        var v   = calcVol(d, l) * qty;
        volMap[key] = v;

        var item  = cel('div', 'grume-sel-item');
        if (selState[key]) item.classList.add('selected');
        item.dataset.key = key;

        var chk = cel('div', 'grume-sel-check', selState[key] ? '✓' : '');
        item.appendChild(chk);

        var info = cel('div', 'grume-sel-info');
        info.appendChild(cel('div', 'grume-sel-dims',
          'L ' + l.toFixed(2) + ' m  ·  Ø ' + d + ' cm  ·  n°' + (gi + 1)));
        item.appendChild(info);

        item.appendChild(cel('div', 'grume-sel-vol', v.toFixed(3) + ' m³'));

        item.onclick = function () {
          selState[key] = !selState[key];
          item.classList.toggle('selected', selState[key]);
          chk.textContent = selState[key] ? '✓' : '';
          majVolTotalSel(selState, allVolMap, volTotalEl);
        };
        content.appendChild(item);
      });
      Object.assign(allVolMap, volMap);
    });
  }

  var volTotalEl = cel('div', 'grume-sel-vol-total hidden');
  volTotalEl.id  = 'grume-sel-vol-total';
  majVolTotalSel(selState, allVolMap, volTotalEl);
  content.appendChild(volTotalEl);

  var btnConf = cel('button', 'ext-conf-btn', 'Confirmer la sélection');
  btnConf.type    = 'button';
  btnConf.onclick = function () { confirmerSelectionGrumes(lotsFiltrés, selState); };
  content.appendChild(btnConf);
}

function majVolTotalSel(selState, volMap, el) {
  var total = Object.keys(selState).reduce(function (s, k) {
    return s + (selState[k] && volMap[k] ? volMap[k] : 0);
  }, 0);
  el.textContent = 'Volume sélectionné : ' + total.toFixed(3) + ' m³';
  el.classList.toggle('hidden', total === 0);
}

function confirmerSelectionGrumes(lotsFiltrés, selState) {
  extGrumesSel = [];
  lotsFiltrés.forEach(function (lot) {
    if (!lot.grumes) return;
    lot.grumes.forEach(function (g, gi) {
      var key = lot.id + '_' + gi;
      if (!selState[key]) return;
      var d   = parseFloat(g.diametre) || 0;
      var l   = parseFloat(g.longueur) || 0;
      var qty = g.quantite || 1;
      extGrumesSel.push({
        key:      key,
        lotId:    lot.id,
        lotNom:   lot.nom || 'Lot sans nom',
        essence:  lot.essence,
        longueur: l,
        diametre: d,
        quantite: qty,
        vol:      calcVol(d, l) * qty
      });
    });
  });
  majSyntheseExtraction();
  afficherResumeSel();
  fermerGrumeSelSheet();
}

function afficherResumeSel() {
  var el = document.getElementById('ext-sel-summary');
  if (!el) return;
  if (extGrumesSel.length === 0) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  while (el.firstChild) el.removeChild(el.firstChild);
  var total = extGrumesSel.reduce(function (s, g) { return s + g.vol; }, 0);
  var n     = extGrumesSel.length;
  el.appendChild(cel('div', 'ext-sel-info',
    n + ' ligne' + (n > 1 ? 's' : '') + ' — ' + total.toFixed(3) + ' m³'));
  var btnMod = cel('button', 'ext-sel-modif', 'Modifier');
  btnMod.type    = 'button';
  btnMod.onclick = ouvrirGrumeSelSheet;
  el.appendChild(btnMod);
}

function majSyntheseExtraction() {
  var volBrut = extGrumesSel.reduce(function (s, g) { return s + g.vol; }, 0);
  var syn = document.getElementById('ext-synthese');
  if (syn) syn.classList.toggle('hidden', volBrut === 0);
  var elUtile = document.getElementById('ext-syn-utile');
  var elDech  = document.getElementById('ext-syn-dech');
  if (elUtile) elUtile.parentNode.classList.toggle('hidden', !extDebitActif);
  if (elDech)  elDech.parentNode.classList.toggle('hidden', !extDebitActif);
  majDebitExtraction();
}

function majDebitExtraction() {
  var volBrut = extGrumesSel.reduce(function (s, g) { return s + g.vol; }, 0);
  var elBrut  = document.getElementById('ext-syn-brut');
  if (elBrut) elBrut.textContent = volBrut.toFixed(3);

  var eEl = document.getElementById('ext-epaisseur');
  var tEl = document.getElementById('ext-scie');
  var rEl = document.getElementById('ext-rendement');
  if (!eEl || !tEl || !rEl) return;

  var e      = parseInt(eEl.value, 10);
  var t      = parseInt(tEl.value, 10);
  var r      = parseInt(rEl.value, 10) / 100;
  var vUtile = volBrut * r * (e / (e + t));
  var vDech  = volBrut - vUtile;

  var elUtile = document.getElementById('ext-syn-utile');
  var elDech  = document.getElementById('ext-syn-dech');
  if (elUtile) elUtile.textContent = vUtile.toFixed(3);
  if (elDech)  elDech.textContent  = vDech.toFixed(3);

  var linEl = document.getElementById('ext-lineaire-val');
  if (linEl) {
    if (extDebitActif && e > 0) {
      var lin = vUtile / (e / 1000 * 0.20);
      linEl.textContent = lin.toFixed(1) + ' m';
    } else {
      linEl.textContent = '—';
    }
  }
}

async function confirmerExtractionDest() {
  var nomEl  = document.getElementById('modal-ext-nom');
  var comEl  = document.getElementById('modal-ext-commune');
  var usaEl  = document.getElementById('modal-ext-usage');
  var lieuEl = document.getElementById('modal-ext-lieu');

  var destination    = nomEl  ? nomEl.value.trim()  : '';
  var usage          = usaEl  ? usaEl.value          : '';
  var communeInstall = comEl  ? comEl.value          : '';
  var lieu           = lieuEl ? lieuEl.value.trim()  : '';

  if (!usage) { showError('Choisissez un usage.'); return; }

  extDraft.destination    = destination;
  extDraft.communeInstall = communeInstall;
  extDraft.usage          = usage;
  extDraft.lieu           = lieu;

  var parEssence = {};
  extGrumesSel.forEach(function (g) {
    parEssence[g.essence] = (parEssence[g.essence] || 0) + g.vol;
  });
  var essences = Object.keys(parEssence);

  for (var i = 0; i < essences.length; i++) {
    var valid = DuramenCore.validerSortie({
      essence: essences[i], volume: Math.round(parEssence[essences[i]] * 10000) / 10000,
      usage: extDraft.usage, destination: extDraft.destination
    });
    if (!valid.ok) { showError(valid.erreur); return; }
  }

  try {
    showLoading(true);
    var now = new Date();
    for (var j = 0; j < essences.length; j++) {
      var ess = essences[j];
      var ext = {
        id:           crypto.randomUUID(),
        commune_code: communeConnectee.code,
        essence:      ess,
        volume:       Math.round(parEssence[ess] * 10000) / 10000,
        usage:        extDraft.usage,
        destination:  extDraft.destination,
        commune:      extDraft.communeInstall || '',
        contact:      '',
        notes:        extDraft.lieu ? 'Lieu : ' + extDraft.lieu : '',
        date:         now.toLocaleDateString('fr-FR'),
        date_iso:     now.toISOString()
      };
      DuramenCore.sortie(ext);
      await sbInsert('extractions', ext);
    }
    await chargerDonnees();
    extDraft     = { destination: '', communeInstall: '', usage: '', lieu: '' };
    extGrumesSel = [];
    fermerModalExtractionDest();
    afficherExtraction();
    showToastSucces('Extraction enregistrée.');
    var btnAcc = document.querySelector('.bnav-btn[data-panel="accueil"]');
    if (btnAcc) switchTab('accueil', btnAcc);
  } catch (err) {
    showError('Erreur : ' + err.message);
  } finally {
    showLoading(false);
  }
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
  document.getElementById('ext-disponible').classList.add('hidden');
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
  if (!essence) { box.classList.add('hidden'); return; }
  var stock = DuramenCore.getStock();
  if (stock[essence]) {
    box.innerHTML = 'Disponible <strong>' + essence + '</strong> : <strong>'
      + stock[essence].dispo.toFixed(3) + ' m3 utiles</strong>';
    box.classList.remove('hidden');
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
    if (document.getElementById('panel-stock').classList.contains('active')) afficherExtraction();
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

// ═══════════════════════════════════════════════════════════════════════════
// HISTORIQUE — Toggle Ma commune / Communauté
// ═══════════════════════════════════════════════════════════════════════════

var histoVue = 'commune';

function switchHistoVue(vue) {
  histoVue = vue;
  var btnC  = document.getElementById('histo-btn-commune');
  var btnCo = document.getElementById('histo-btn-communaute');
  if (btnC)  btnC.classList.toggle('active',  vue === 'commune');
  if (btnCo) btnCo.classList.toggle('active', vue === 'communaute');
  afficherHistorique();
}

function afficherHistorique() {
  var content = document.getElementById('histo-content');
  if (!content) return;
  while (content.firstChild) content.removeChild(content.firstChild);
  if (histoVue === 'commune') {
    rendreHistoriqueContenu(content, lots);
  } else {
    afficherHistoriqueCommunaute(content);
  }
}

async function afficherHistoriqueCommunaute(content) {
  var loading = cel('div', 'empty-state');
  loading.appendChild(cel('p', '', 'Chargement des données du réseau…'));
  content.appendChild(loading);
  try {
    var tousLots = await sbSelect('lots', 'order=created_at.desc');
    while (content.firstChild) content.removeChild(content.firstChild);
    rendreHistoriqueContenu(content, tousLots);
  } catch (err) {
    while (content.firstChild) content.removeChild(content.firstChild);
    var errEl = cel('div', 'empty-state');
    errEl.appendChild(cel('p', '', 'Erreur chargement réseau : ' + err.message));
    content.appendChild(errEl);
  }
}

function rendreHistoriqueContenu(container, lotsData) {
  if (!lotsData || lotsData.length === 0) {
    var es = cel('div', 'empty-state');
    es.appendChild(cel('p', '', 'Aucun lot enregistré.'));
    container.appendChild(es);
    container.appendChild(creerBoutonsExportHisto(lotsData || []));
    return;
  }

  // ── Bloc total ──────────────────────────────────────────────────────
  var stock     = DuramenCore.getStock();
  var totalVol  = Object.keys(stock).reduce(function (s, e) { return s + (stock[e].dispo || 0); }, 0);
  var totalLots = lotsData.length;

  var bloc = cel('div', 'histo-total-block');

  var itemVol = cel('div', '');
  itemVol.appendChild(cel('div', 'histo-total-vol', totalVol.toFixed(2)));
  itemVol.appendChild(cel('div', 'histo-total-unit', 'm³ utiles'));
  bloc.appendChild(itemVol);

  bloc.appendChild(cel('div', 'histo-total-divider'));

  var itemLots = cel('div', '');
  itemLots.appendChild(cel('div', 'histo-total-lots', String(totalLots)));
  itemLots.appendChild(cel('div', 'histo-total-unit', totalLots > 1 ? 'lots' : 'lot'));
  bloc.appendChild(itemLots);

  container.appendChild(bloc);

  // ── Par essence ─────────────────────────────────────────────────────
  container.appendChild(cel('div', 'histo-section-title', 'Par essence'));

  var parEss = {};
  lotsData.forEach(function (l) {
    var e = l.essence || 'Autre';
    if (!parEss[e]) parEss[e] = { vol: 0, lots: 0, causes: [] };
    parEss[e].vol   = stock[e] ? (stock[e].dispo || 0) : 0;
    parEss[e].lots += 1;
    if (l.cause && parEss[e].causes.indexOf(l.cause) === -1) parEss[e].causes.push(l.cause);
  });

  var essList = cel('div', '');
  Object.keys(parEss)
    .sort(function (a, b) { return parEss[b].vol - parEss[a].vol; })
    .forEach(function (ess) {
      var d    = parEss[ess];
      var pct  = totalVol > 0 ? (d.vol / totalVol * 100) : 0;
      var item = cel('div', 'histo-essence-item');

      var top = cel('div', 'histo-essence-top');
      top.appendChild(cel('span', 'histo-essence-name', ess));
      top.appendChild(cel('span', 'histo-essence-vol', d.vol.toFixed(3) + ' m³'));
      item.appendChild(top);

      item.appendChild(cel('div', 'histo-essence-meta',
        d.lots + (d.lots > 1 ? ' lots' : ' lot') +
        (d.causes.length ? ' — ' + d.causes.join(', ') : '')
      ));

      var track = cel('div', 'histo-bar-track');
      var fill  = cel('div', 'histo-bar-fill');
      fill.style.width = pct.toFixed(1) + '%';
      track.appendChild(fill);
      item.appendChild(track);
      essList.appendChild(item);
    });
  container.appendChild(essList);

  // ── Lots récents ────────────────────────────────────────────────────
  container.appendChild(cel('div', 'histo-section-title mt-16', 'Lots récents'));

  var lotsList = cel('div', '');
  lotsData.slice(0, 5).forEach(function (lot) {
    var card   = cel('div', 'histo-lot-card');
    var header = cel('div', 'histo-lot-header');
    header.appendChild(cel('div', 'histo-lot-nom', lot.nom || '—'));
    header.appendChild(cel('div', 'histo-lot-vol', (lot.vol_utile || 0).toFixed(3) + ' m³'));
    card.appendChild(header);

    var badges = cel('div', 'histo-badges');
    if (lot.commune) badges.appendChild(cel('span', 'histo-badge histo-badge-commune', lot.commune));
    if (lot.essence) badges.appendChild(cel('span', 'histo-badge histo-badge-essence', lot.essence));
    if (lot.cause)   badges.appendChild(cel('span', 'histo-badge histo-badge-cause',   lot.cause));
    card.appendChild(badges);
    lotsList.appendChild(card);
  });
  container.appendChild(lotsList);

  container.appendChild(creerBoutonsExportHisto(lotsData));
}

function creerBoutonsExportHisto(lotsData) {
  var row    = cel('div', 'histo-export-row');
  var btnXls = cel('button', 'histo-export-btn', 'Exporter Excel');
  btnXls.type    = 'button';
  btnXls.onclick = function () { exporterHistoriqueCSV(lotsData); };
  var btnPdf = cel('button', 'histo-export-btn', 'Exporter PDF');
  btnPdf.type    = 'button';
  btnPdf.onclick = exporterHistoriquePDF;
  row.appendChild(btnXls);
  row.appendChild(btnPdf);
  return row;
}

function exporterHistoriqueCSV(lotsData) {
  if (!lotsData || lotsData.length === 0) { showError('Aucun lot à exporter.'); return; }
  var h = ['Nom','Essence','Commune','Cause','Provenance','Annee','Usage',
           'Nb grumes','Vol. brut','Vol. utile','Vol. dechets','Nb planches','Lineaire','Date'];
  var r = lotsData.map(function (l) {
    return [l.nom, l.essence, l.commune, l.cause, l.provenance, l.annee, l.usage,
            l.nb_grumes || 0, (l.vol_brut || 0).toFixed(3), (l.vol_utile || 0).toFixed(3),
            (l.vol_dechets || 0).toFixed(3), l.nb_planches || 0, (l.lineaire || 0).toFixed(2), l.date];
  });
  var csv = [h].concat(r).map(function (row) {
    return row.map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(';');
  }).join('\n');
  var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  var a    = document.createElement('a');
  a.href   = URL.createObjectURL(blob);
  a.download = 'duramen_historique_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
}

function exporterHistoriquePDF() {
  window.print();
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
  var btnCommune = document.getElementById('histo-btn-commune');
  if (btnCommune) btnCommune.textContent = communeConnectee.nom;
  var btnCommunaute = document.getElementById('histo-btn-communaute');
  if (btnCommunaute) btnCommunaute.textContent = 'Nantes Métropole';
  initialiserPanelSaisie();
  captureGPS();
  chargerCommune();
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
  ['header', 'main', 'footer'].forEach(function (t) { document.querySelector(t).classList.add('hidden'); });
  document.querySelector('.tabs-wrap').classList.add('hidden');
  document.querySelector('.bottom-nav').classList.add('hidden');
  document.getElementById('panel-mentions').classList.remove('hidden');
}
function fermerMentions() {
  document.getElementById('panel-mentions').classList.add('hidden');
  ['header', 'main', 'footer'].forEach(function (t) { document.querySelector(t).classList.remove('hidden'); });
  document.querySelector('.tabs-wrap').classList.remove('hidden');
  document.querySelector('.bottom-nav').classList.remove('hidden');
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
  if (saisieEnCours) return;
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

// ═══════════════════════════════════════════════════════════════════════════
// SAISIE "AJOUTER AU STOCK" — Formulaire unique mobile
// ═══════════════════════════════════════════════════════════════════════════

var nouvGrumes    = [];
var nouvGPS       = { lat: null, lon: null };
var nouvDate      = new Date();
var nouvAnnee     = String(new Date().getFullYear());
var saisieEnCours = false;

// Hauteur d'un item de drum en px — doit correspondre à .drum-item dans ui.css
var DRUM_H = 40;

// ─── Valeurs des molettes ─────────────────────────────────────────────────
function genLongueurs() {
  var v = [];
  for (var i = 0; i <= 106; i++) v.push(+(1.70 + i * 0.05).toFixed(2));
  return v;
}
function genDiametres() {
  var v = [];
  for (var i = 20; i <= 70; i++) v.push(i);
  return v;
}
var LON_VALS = genLongueurs(); // 1.70 → 7.00, pas 0.05 m
var DIA_VALS = genDiametres(); // 20 → 70, pas 1 cm
function genCirconferences() {
  var v = [];
  for (var i = 63; i <= 220; i++) v.push(i);
  return v;
}
var CIRC_VALS = genCirconferences(); // 63 → 220 cm, équivalent 20→70 cm de diamètre

// ─── Volume d'une grume ── V = π × (d/200)² × L ──────────────────────────
function calcVol(d, l) { return Math.PI * Math.pow(d / 200, 2) * l; }

// ─── GPS silencieux ───────────────────────────────────────────────────────
function captureGPS() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(function (pos) {
    nouvGPS.lat = +pos.coords.latitude.toFixed(6);
    nouvGPS.lon = +pos.coords.longitude.toFixed(6);
    var chip = document.getElementById('saisie-gps-chip');
    if (chip) chip.textContent = nouvGPS.lat + '° / ' + nouvGPS.lon + '°';
  }, function () {
    var chip = document.getElementById('saisie-gps-chip');
    if (chip) chip.textContent = 'GPS indisponible';
  }, { timeout: 15000, enableHighAccuracy: false });
}

// ─── Helper createElement ─────────────────────────────────────────────────
function cel(tag, cls, txt) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
}

// ─── Drum picker (molette de défilement) ──────────────────────────────────
function creerDrum(valeurs, defaut, afficher, onChange) {
  var wrap   = cel('div', 'drum-wrap');
  var center = cel('div', 'drum-center');
  var track  = cel('div', 'drum-track');
  var defIdx = 0;

  track.appendChild(cel('div', 'drum-pad'));
  valeurs.forEach(function (v, i) {
    track.appendChild(cel('div', 'drum-item', afficher(v)));
    if (Math.abs(v - defaut) < 0.001) defIdx = i;
  });
  track.appendChild(cel('div', 'drum-pad'));

  wrap.appendChild(center);
  wrap.appendChild(track);

  var timer = null;
  track.addEventListener('scroll', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var idx = Math.max(0, Math.min(Math.round(track.scrollTop / DRUM_H), valeurs.length - 1));
      track.scrollTop = idx * DRUM_H;
      onChange(valeurs[idx]);
    }, 80);
  });

  // Appelé après insertion dans le DOM pour positionner la molette
  wrap._init = function () { track.scrollTop = defIdx * DRUM_H; };
  return wrap;
}

// ─── Carte sommaire d'une grume (lecture seule) ───────────────────────────
function creerCarteGrume(idx) {
  var g    = nouvGrumes[idx];
  var card = cel('div', 'grume-summary-card');
  card.dataset.grumeIdx = String(idx);

  var dims = cel('div', 'grume-summary-dims');
  dims.textContent = 'L ' + g.longueur.toFixed(2) + ' m  ·  Ø ' + g.diametre + ' cm  ·  ×' + g.quantite;
  card.appendChild(dims);

  var right = cel('div', 'grume-summary-right');
  var v = calcVol(g.diametre, g.longueur) * g.quantite;
  right.appendChild(cel('div', 'grume-summary-vol', v.toFixed(3) + ' m³'));
  right.appendChild(cel('span', 'grume-summary-check', '✓'));

  var del = cel('button', 'grume-summary-del', '×');
  del.type    = 'button';
  del.title   = 'Supprimer cette ligne';
  del.onclick = function () { nouvSupprimerLigne(idx); };
  right.appendChild(del);

  card.appendChild(right);
  return card;
}

// ─── Mise à jour du volume affiché (volume total de la ligne) ─────────────
function nouvMajVol(idx) {
  var g  = nouvGrumes[idx];
  if (!g) return;
  var v  = calcVol(g.diametre, g.longueur) * g.quantite;
  var el = document.getElementById('saisie-vol-' + idx);
  if (el) el.textContent = v.toFixed(3) + ' m³';
}

// ─── Rendu de toute la liste (utilisé après suppression) ──────────────────
function nouvRendreGrumes() {
  var liste = document.getElementById('saisie-grumes-liste');
  if (!liste) return;
  while (liste.firstChild) liste.removeChild(liste.firstChild);
  nouvGrumes.forEach(function (g, idx) { liste.appendChild(creerCarteGrume(idx)); });
  var syn = document.getElementById('saisie-synthese');
  if (syn) syn.classList.toggle('hidden', nouvGrumes.length === 0);
  nouvRendreSynthese();
}

// ─── Ajouter une ligne de grume ───────────────────────────────────────────
function nouvAjouterLigne() {
  nouvGrumes.push({ longueur: 3.00, diametre: 30, quantite: 1 });
  var idx   = nouvGrumes.length - 1;
  var liste = document.getElementById('saisie-grumes-liste');
  if (!liste) return;
  var card  = creerCarteGrume(idx);
  liste.appendChild(card);
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  var syn = document.getElementById('saisie-synthese');
  if (syn) syn.classList.remove('hidden');
  nouvRendreSynthese();
  nouvSauverBrouillon();
}

// ─── Supprimer une ligne de grume ─────────────────────────────────────────
function nouvSupprimerLigne(idx) {
  nouvGrumes.splice(idx, 1);
  nouvRendreGrumes();
  nouvSauverBrouillon();
}

// ─── Grume sheet ──────────────────────────────────────────────────────────
var grumeDraft = { longueur: 3.00, diametre: 30, circonf: 94, quantite: 1, methode: 'diametre' };

function ouvrirGrumeSheet() {
  var methode = localStorage.getItem('duramen_mesure_methode') || 'diametre';
  grumeDraft = { longueur: 3.00, diametre: 30, circonf: 94, quantite: 1, methode: methode };
  construireContenuGrumeSheet();
  var wrap = document.getElementById('grume-sheet-wrap');
  if (wrap) wrap.classList.add('open');
}

function fermerGrumeSheet() {
  var wrap = document.getElementById('grume-sheet-wrap');
  if (wrap) wrap.classList.remove('open');
}

function majVolSheet() {
  var v;
  if (grumeDraft.methode === 'circonf') {
    var cM = grumeDraft.circonf / 100;
    v = (cM * cM * grumeDraft.longueur) / (4 * Math.PI) * grumeDraft.quantite;
  } else {
    v = calcVol(grumeDraft.diametre, grumeDraft.longueur) * grumeDraft.quantite;
  }
  var el = document.getElementById('grume-sheet-vol');
  if (el) el.textContent = v.toFixed(3) + ' m³';
}

function construireContenuGrumeSheet() {
  var content = document.getElementById('grume-sheet-content');
  if (!content) return;
  while (content.firstChild) content.removeChild(content.firstChild);

  // Toggle méthode de mesure
  var toggleWrap  = cel('div', 'grume-methode-toggle');
  var btnMethDiam = cel('button', 'grume-methode-btn', 'Calcul avec diamètre');
  btnMethDiam.type = 'button';
  var btnMethCirc = cel('button', 'grume-methode-btn', 'Calcul avec circonférence');
  btnMethCirc.type = 'button';
  if (grumeDraft.methode === 'diametre') {
    btnMethDiam.classList.add('active');
  } else {
    btnMethCirc.classList.add('active');
  }
  toggleWrap.appendChild(btnMethDiam);
  toggleWrap.appendChild(btnMethCirc);
  content.appendChild(toggleWrap);

  // Longueur
  var rowL = cel('div', 'grume-sheet-row');
  rowL.appendChild(cel('div', 'grume-sheet-label', 'Longueur'));
  var drumL = creerDrum(LON_VALS, grumeDraft.longueur,
    function (v) { return v.toFixed(2) + ' m'; },
    function (v) { grumeDraft.longueur = v; majVolSheet(); }
  );
  rowL.appendChild(drumL);
  content.appendChild(rowL);

  // Diamètre médian
  var rowD = cel('div', 'grume-sheet-row');
  if (grumeDraft.methode === 'circonf') rowD.classList.add('hidden');
  rowD.appendChild(cel('div', 'grume-sheet-label', 'Ø médian'));
  var drumD = creerDrum(DIA_VALS, grumeDraft.diametre,
    function (v) { return v + ' cm'; },
    function (v) { grumeDraft.diametre = v; majVolSheet(); }
  );
  rowD.appendChild(drumD);
  content.appendChild(rowD);

  // Circonférence médiane
  var rowC = cel('div', 'grume-sheet-row');
  if (grumeDraft.methode === 'diametre') rowC.classList.add('hidden');
  rowC.appendChild(cel('div', 'grume-sheet-label', 'C médiane'));
  var drumC = creerDrum(CIRC_VALS, grumeDraft.circonf,
    function (v) { return v + ' cm'; },
    function (v) { grumeDraft.circonf = v; majVolSheet(); }
  );
  rowC.appendChild(drumC);
  content.appendChild(rowC);

  // Handlers toggle
  btnMethDiam.onclick = function () {
    grumeDraft.methode = 'diametre';
    localStorage.setItem('duramen_mesure_methode', 'diametre');
    btnMethDiam.classList.add('active');
    btnMethCirc.classList.remove('active');
    rowD.classList.remove('hidden');
    rowC.classList.add('hidden');
    majVolSheet();
  };
  btnMethCirc.onclick = function () {
    grumeDraft.methode = 'circonf';
    localStorage.setItem('duramen_mesure_methode', 'circonf');
    btnMethCirc.classList.add('active');
    btnMethDiam.classList.remove('active');
    rowC.classList.remove('hidden');
    rowD.classList.add('hidden');
    majVolSheet();
  };

  // Quantité
  var rowQ = cel('div', 'grume-sheet-row');
  rowQ.appendChild(cel('div', 'grume-sheet-label', 'Quantité'));
  var qtyW = cel('div', 'qty-ctrl');
  var btnM = cel('button', 'qty-btn', '−');
  btnM.type = 'button';
  var qNum = cel('span', 'qty-num', String(grumeDraft.quantite));
  var btnP = cel('button', 'qty-btn', '+');
  btnP.type = 'button';
  btnM.onclick = function () {
    if (grumeDraft.quantite <= 1) return;
    grumeDraft.quantite--;
    qNum.textContent = String(grumeDraft.quantite);
    majVolSheet();
  };
  btnP.onclick = function () {
    grumeDraft.quantite++;
    qNum.textContent = String(grumeDraft.quantite);
    majVolSheet();
  };
  qtyW.appendChild(btnM);
  qtyW.appendChild(qNum);
  qtyW.appendChild(btnP);
  rowQ.appendChild(qtyW);
  content.appendChild(rowQ);

  // Volume calculé
  var volEl = cel('div', 'grume-sheet-vol', '— m³');
  volEl.id = 'grume-sheet-vol';
  content.appendChild(volEl);

  // Boutons
  var btns   = cel('div', 'grume-sheet-btns');
  var btnAnn = cel('button', 'grume-sheet-btn-ann', 'Annuler');
  btnAnn.type    = 'button';
  btnAnn.onclick = fermerGrumeSheet;
  var btnSave = cel('button', 'grume-sheet-btn-save', '✓ Enregistrer');
  btnSave.type    = 'button';
  btnSave.onclick = enregistrerGrumeDraft;
  btns.appendChild(btnAnn);
  btns.appendChild(btnSave);
  content.appendChild(btns);

  // Init molettes après insertion dans le DOM
  setTimeout(function () {
    if (drumL._init) drumL._init();
    if (drumD._init) drumD._init();
    if (drumC._init) drumC._init();
    majVolSheet();
  }, 30);
}

function enregistrerGrumeDraft() {
  var diam = grumeDraft.methode === 'circonf'
    ? Math.round(grumeDraft.circonf / Math.PI)
    : grumeDraft.diametre;
  nouvGrumes.push({ longueur: grumeDraft.longueur, diametre: diam, quantite: grumeDraft.quantite });
  var idx   = nouvGrumes.length - 1;
  var liste = document.getElementById('saisie-grumes-liste');
  if (liste) {
    var card = creerCarteGrume(idx);
    liste.appendChild(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  var syn = document.getElementById('saisie-synthese');
  if (syn) syn.classList.remove('hidden');
  nouvRendreSynthese();
  nouvSauverBrouillon();
  fermerGrumeSheet();
}

// ─── Barre de synthèse ────────────────────────────────────────────────────
function nouvRendreSynthese() {
  var pieces = nouvGrumes.reduce(function (s, g) { return s + g.quantite; }, 0);
  var volume = nouvGrumes.reduce(function (s, g) {
    return s + calcVol(g.diametre, g.longueur) * g.quantite;
  }, 0);
  var elP = document.getElementById('synth-pieces');
  var elV = document.getElementById('synth-vol');
  var elL = document.getElementById('synth-lignes');
  if (elP) elP.textContent = pieces;
  if (elV) elV.textContent = volume.toFixed(3);
  if (elL) elL.textContent = nouvGrumes.length;
}

// ─── Annuler avec confirmation ────────────────────────────────────────────
function nouvAnnuler() {
  var essEl = document.getElementById('saisie-essence');
  if (nouvGrumes.length === 0 && (!essEl || !essEl.value)) return;
  if (!confirm('Effacer toute la saisie en cours ?')) return;
  effacerBrouillonSaisie();
  nouvGrumes = [];
  nouvDate   = new Date();
  nouvGPS    = { lat: null, lon: null };
  initialiserPanelSaisie();
  captureGPS();
}

// ─── Modifier l'année de coupe ────────────────────────────────────────────
function nouvModifierAnnee() {
  var row = document.getElementById('saisie-annee-row');
  if (!row) return;
  row.querySelector('.saisie-annee-val').classList.add('hidden');
  row.querySelector('.saisie-annee-btn').classList.add('hidden');
  var inp = row.querySelector('.saisie-annee-input');
  inp.value = nouvAnnee;
  inp.classList.remove('hidden');
  inp.focus();
  inp.select();
}
function nouvValiderAnnee() {
  var row = document.getElementById('saisie-annee-row');
  if (!row) return;
  var inp = row.querySelector('.saisie-annee-input');
  var val = parseInt(inp.value, 10);
  if (!isNaN(val) && val >= 2015 && val <= 2035) nouvAnnee = String(val);
  row.querySelector('.saisie-annee-val').textContent = nouvAnnee;
  row.querySelector('.saisie-annee-val').classList.remove('hidden');
  row.querySelector('.saisie-annee-btn').classList.remove('hidden');
  inp.classList.add('hidden');
  nouvSauverBrouillon();
}

// ─── Modal "Nommer le lot" ────────────────────────────────────────────────
function assureModalNommer() {
  if (document.getElementById('modal-nommer-bg')) return;

  var bg    = cel('div', 'extract-modal-bg');
  bg.id     = 'modal-nommer-bg';
  var modal = cel('div', 'extract-modal modal-nommer');

  var closeBtn = cel('button', 'modal-close', '✕');
  closeBtn.onclick = nouvFermerModal;
  modal.appendChild(closeBtn);

  modal.appendChild(cel('h2', '', 'Nommer le lot'));
  modal.appendChild(cel('p', 'modal-sub', 'Donnez un nom pour retrouver ce lot facilement.'));

  var fNom  = cel('div', 'field');
  var lNom  = cel('label', '', 'Nom du lot');
  lNom.htmlFor = 'modal-nom-input';
  var iNom  = document.createElement('input');
  iNom.type = 'text';
  iNom.id   = 'modal-nom-input';
  iNom.autocomplete = 'off';
  iNom.placeholder  = 'Ex : Chênes bord du chemin de la Haie…';
  iNom.addEventListener('keydown', function (e) { if (e.key === 'Enter') nouvConfirmer(); });
  fNom.appendChild(lNom);
  fNom.appendChild(iNom);
  modal.appendChild(fNom);

  var pWrap = cel('div', 'partage-toggle-wrap');
  var pLbl  = cel('div', 'partage-toggle-label');
  var pTxt  = cel('strong', '', 'Partager avec toutes les communes');
  var pSub  = cel('small', '', 'Les autres communes pourront consulter ce lot.');
  pLbl.appendChild(pTxt);
  pLbl.appendChild(pSub);
  var tSwitch = cel('label', 'toggle-switch');
  var tInp    = document.createElement('input');
  tInp.type   = 'checkbox';
  tInp.id     = 'modal-partage';
  tSwitch.appendChild(tInp);
  tSwitch.appendChild(cel('span', 'toggle-slider'));
  pWrap.appendChild(pLbl);
  pWrap.appendChild(tSwitch);
  modal.appendChild(pWrap);

  var acts   = cel('div', 'flex-end');
  var btnRet = cel('button', 'btn btn-outline', '← Retour');
  btnRet.type    = 'button';
  btnRet.onclick = nouvFermerModal;
  var btnOk  = cel('button', 'btn btn-primary', 'Confirmer');
  btnOk.type    = 'button';
  btnOk.onclick = nouvConfirmer;
  acts.appendChild(btnRet);
  acts.appendChild(btnOk);
  modal.appendChild(acts);

  ajouterSwipeDown(modal, nouvFermerModal);
  bg.appendChild(modal);
  document.body.appendChild(bg);
}

function nouvOuvrirModal() {
  var essEl = document.getElementById('saisie-essence');
  if (!essEl || !essEl.value) { showError('Choisissez une essence avant de nommer le lot.'); return; }
  if (nouvGrumes.length === 0) { showError('Ajoutez au moins une grume avant de nommer le lot.'); return; }
  document.getElementById('modal-nommer-bg').classList.add('open');
  var inp = document.getElementById('modal-nom-input');
  if (inp) { inp.value = ''; inp.focus(); }
}
function nouvFermerModal() {
  var bg = document.getElementById('modal-nommer-bg');
  if (bg) bg.classList.remove('open');
}

// ─── Confirmer et sauvegarder le lot ─────────────────────────────────────
async function nouvConfirmer() {
  var essEl = document.getElementById('saisie-essence');
  var proEl = document.getElementById('saisie-provenance');
  var cauEl = document.getElementById('saisie-cause');
  var nomEl = document.getElementById('modal-nom-input');
  var ptgEl = document.getElementById('modal-partage');

  if (!essEl || !essEl.value) { showError('Essence manquante.'); return; }
  if (!proEl || !proEl.value) { showError('Provenance manquante.'); return; }
  if (!cauEl || !cauEl.value) { showError("Cause d'abattage manquante."); return; }

  var essence    = essEl.value;
  var provenance = proEl.value;
  var cause      = cauEl.value;
  var nom        = (nomEl && nomEl.value.trim()) ? nomEl.value.trim() : (essence + ' — ' + communeConnectee.nom);
  var partage    = ptgEl ? ptgEl.checked : false;

  // Expansion des lignes : quantité → grumes individuelles
  var grumesFlat = [];
  nouvGrumes.forEach(function (g) {
    for (var i = 0; i < g.quantite; i++) {
      grumesFlat.push({ longueur: g.longueur, diametre: g.diametre });
    }
  });

  var nbGrumes = grumesFlat.length;
  var volBrut  = grumesFlat.reduce(function (s, g) { return s + calcVol(g.diametre, g.longueur); }, 0);

  var lot = {
    id:           crypto.randomUUID(),
    commune_code: communeConnectee.code,
    nom:          nom,
    essence:      essence,
    commune:      communeConnectee.nom,
    cause:        cause,
    provenance:   provenance,
    annee:        nouvAnnee,
    usage:        'Non défini',
    partage:      partage,
    epaisseur:    0,
    delta:        0,
    nb_grumes:    nbGrumes,
    vol_brut:     +volBrut.toFixed(4),
    vol_utile:    +volBrut.toFixed(4),
    vol_dechets:  0,
    nb_planches:  0,
    lineaire:     0,
    date:         nouvDate.toLocaleDateString('fr-FR'),
    date_iso:     nouvDate.toISOString(),
    grumes:       grumesFlat
  };

  try {
    showLoading(true);
    await sbInsert('lots', lot);
    await chargerDonnees();
    nouvFermerModal();
    effacerBrouillonSaisie();
    // Toast de confirmation
    var toast = cel('div', 'toast-succes', '"' + nom + '" sauvegardé — ' + volBrut.toFixed(3) + ' m³');
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.classList.add('hidden');
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 400);
    }, 4000);
    // Réinitialiser le formulaire
    nouvGrumes = [];
    nouvDate   = new Date();
    nouvGPS    = { lat: null, lon: null };
    initialiserPanelSaisie();
    captureGPS();
  } catch (err) {
    showError('Erreur sauvegarde : ' + err.message);
  } finally {
    showLoading(false);
  }
}

// ─── Brouillon v2 ─────────────────────────────────────────────────────────
function nouvSauverBrouillon() {
  saisieEnCours = true;
  var essEl = document.getElementById('saisie-essence');
  var proEl = document.getElementById('saisie-provenance');
  var cauEl = document.getElementById('saisie-cause');
  var draft = {
    essence:    essEl ? essEl.value : '',
    provenance: proEl ? proEl.value : '',
    cause:      cauEl ? cauEl.value : '',
    annee:      nouvAnnee,
    grumes:     nouvGrumes.slice()
  };
  localStorage.setItem('duramen_draft_v2', JSON.stringify(draft));
}
function effacerBrouillonSaisie() {
  saisieEnCours = false;
  localStorage.removeItem('duramen_draft_v2');
  localStorage.removeItem('duramen_draft'); // nettoyage de l'ancien format
}
function nouvRestaurerBrouillon() {
  if (saisieEnCours) return;
  var raw = localStorage.getItem('duramen_draft_v2');
  if (!raw) return;
  try {
    var d = JSON.parse(raw);
    if (!d || !Array.isArray(d.grumes) || d.grumes.length === 0) return;
    if (!confirm('Reprendre la saisie en cours ?')) { effacerBrouillonSaisie(); return; }
    var essEl = document.getElementById('saisie-essence');
    var proEl = document.getElementById('saisie-provenance');
    var cauEl = document.getElementById('saisie-cause');
    if (essEl) essEl.value = d.essence    || '';
    if (proEl) proEl.value = d.provenance || '';
    if (cauEl) cauEl.value = d.cause      || '';
    if (d.annee) {
      nouvAnnee = d.annee;
      var valEl = document.querySelector('.saisie-annee-val');
      if (valEl) valEl.textContent = nouvAnnee;
    }
    nouvGrumes = d.grumes;
    nouvRendreGrumes();
  } catch (e) {
    effacerBrouillonSaisie();
  }
}

// ─── Helper : créer un champ select dans la grille ────────────────────────
function creerSelectSaisie(id, labelTxt, options) {
  var f   = cel('div', 'field');
  var l   = cel('label', '', labelTxt);
  l.htmlFor = id;
  var sel = document.createElement('select');
  sel.id  = id;
  options.forEach(function (opt) {
    var o         = document.createElement('option');
    o.value       = opt[0];
    o.textContent = opt[1];
    sel.appendChild(o);
  });
  sel.addEventListener('change', nouvSauverBrouillon);
  f.appendChild(l);
  f.appendChild(sel);
  return f;
}

// ─── Construction du panel saisie ─────────────────────────────────────────
function initialiserPanelSaisie() {
  var panel = document.getElementById('panel-saisie');
  if (!panel) return;

  // Réinitialiser l'état
  nouvGrumes = [];
  nouvDate   = new Date();
  nouvAnnee  = String(nouvDate.getFullYear());

  // Vider le panel
  while (panel.firstChild) panel.removeChild(panel.firstChild);

  // ── Chips méta : date + GPS ──────────────────────────────────────────
  var meta     = cel('div', 'saisie-meta');
  var dateStr  = nouvDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  meta.appendChild(cel('div', 'saisie-chip', dateStr));
  var gpsChip  = cel('div', 'saisie-chip', 'GPS · en cours…');
  gpsChip.id   = 'saisie-gps-chip';
  meta.appendChild(gpsChip);
  panel.appendChild(meta);

  // ── Année de coupe ──────────────────────────────────────────────────
  var anneeRow = cel('div', 'saisie-annee-row');
  anneeRow.id  = 'saisie-annee-row';
  anneeRow.appendChild(cel('span', 'saisie-annee-lbl', 'Année de coupe'));
  anneeRow.appendChild(cel('span', 'saisie-annee-val', nouvAnnee));
  var anneeBtn = cel('button', 'saisie-annee-btn', 'modifier');
  anneeBtn.type    = 'button';
  anneeBtn.onclick = nouvModifierAnnee;
  anneeRow.appendChild(anneeBtn);
  var anneeInp = document.createElement('input');
  anneeInp.className = 'saisie-annee-input hidden';
  anneeInp.type  = 'number';
  anneeInp.min   = '2015';
  anneeInp.max   = '2035';
  anneeInp.onblur = nouvValiderAnnee;
  anneeInp.addEventListener('keydown', function (e) { if (e.key === 'Enter') nouvValiderAnnee(); });
  anneeRow.appendChild(anneeInp);
  panel.appendChild(anneeRow);

  // ── Sélects : essence / provenance / cause ──────────────────────────
  var selGrid = cel('div', 'saisie-selects');
  selGrid.appendChild(creerSelectSaisie('saisie-essence', 'Essence *', [
    ['', '— Choisir —'],
    ['Aulne', 'Aulne'], ['Châtaignier', 'Châtaignier'], ['Chêne', 'Chêne'],
    ['Cyprès', 'Cyprès'], ['Douglas', 'Douglas'], ['Épicéa', 'Épicéa'],
    ['Frêne', 'Frêne'], ['Hêtre', 'Hêtre'], ['Mélèze', 'Mélèze'],
    ['Merisier', 'Merisier'], ['Noyer', 'Noyer'], ['Peuplier', 'Peuplier'],
    ['Pin maritime', 'Pin maritime'], ['Pin sylvestre', 'Pin sylvestre'],
    ['Platane', 'Platane'], ['Robinier (Acacia)', 'Robinier (Acacia)'],
    ['Séquoia', 'Séquoia'], ['Tilleul', 'Tilleul'], ['Autre', 'Autre']
  ]));
  selGrid.appendChild(creerSelectSaisie('saisie-provenance', 'Provenance *', [
    ['', '— Choisir —'],
    ['Alignement', 'Alignement urbain'], ['Bosquet', 'Bosquet'],
    ['Forêt', 'Forêt'], ['Haie bocagère', 'Haie bocagère'], ['Parc', 'Parc municipal']
  ]));
  selGrid.appendChild(creerSelectSaisie('saisie-cause', "Cause d'abattage *", [
    ['', '— Choisir —'],
    ['Coupe sanitaire', 'Coupe sanitaire'],
    ['Intempérie', 'Intempérie (chablis, neige…)'],
    ['Entretien', 'Entretien courant'],
    ['Aménagement', 'Aménagement urbain'],
    ['Plantation', 'Renouvellement plantation']
  ]));
  panel.appendChild(selGrid);

  // ── Section grumes ──────────────────────────────────────────────────
  var section = cel('div', 'saisie-grumes-section');

  var gHead  = cel('div', 'saisie-grumes-header');
  gHead.appendChild(cel('div', 'saisie-grumes-title', 'Grumes'));
  var gAddBt = cel('button', 'saisie-add-btn', '+ Ajouter une grume');
  gAddBt.type    = 'button';
  gAddBt.onclick = ouvrirGrumeSheet;
  gHead.appendChild(gAddBt);
  section.appendChild(gHead);

  var liste = cel('div', '');
  liste.id  = 'saisie-grumes-liste';
  section.appendChild(liste);

  // Barre de synthèse — masquée jusqu'à la première grume
  var synthese = cel('div', 'saisie-synthese hidden');
  synthese.id  = 'saisie-synthese';
  [
    { id: 'synth-pieces', lbl: 'pièces' },
    { id: 'synth-vol',    lbl: 'm³ bruts' },
    { id: 'synth-lignes', lbl: 'lignes' }
  ].forEach(function (s) {
    var item = cel('div', 'saisie-synth-item');
    var val  = cel('div', 'saisie-synth-val', '—');
    val.id   = s.id;
    item.appendChild(val);
    item.appendChild(cel('div', 'saisie-synth-lbl', s.lbl));
    synthese.appendChild(item);
  });
  section.appendChild(synthese);
  panel.appendChild(section);

  // ── Actions ─────────────────────────────────────────────────────────
  var actions = cel('div', 'saisie-actions');
  var btnAnn  = cel('button', 'saisie-btn saisie-btn-annuler', 'Annuler');
  btnAnn.type    = 'button';
  btnAnn.onclick = nouvAnnuler;
  var btnNom  = cel('button', 'saisie-btn saisie-btn-nommer', 'Nommer le lot →');
  btnNom.type    = 'button';
  btnNom.onclick = nouvOuvrirModal;
  actions.appendChild(btnAnn);
  actions.appendChild(btnNom);
  panel.appendChild(actions);

  // Créer la modal une seule fois dans le DOM body
  assureModalNommer();

  // Restaurer le brouillon s'il existe
  nouvRestaurerBrouillon();
}

// ─── Init ─────────────────────────────────────────────────────────────────
function switchTab(panel, btn) {
  document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
  document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
  document.querySelectorAll('.bnav-btn').forEach(function (t) { t.classList.remove('active'); });
  document.getElementById('panel-' + panel).classList.add('active');
  document.querySelectorAll('[data-panel="' + panel + '"]').forEach(function (el) { el.classList.add('active'); });
  btn.classList.add('active');
  if (panel === 'stock')      afficherExtraction();
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
      if (panelStock && panelStock.classList.contains('active')) afficherExtraction();
      if (panelExt  && panelExt.classList.contains('active'))   afficherExtractions();
    }
  }, 120000); // 120 000 ms = 2 minutes
}

// ─── Écouteurs auto-sauvegarde (ancien formulaire — gardés pour compatibilité) ──
['lot-nom', 'commune', 'epaisseur'].forEach(function (id) {
  var el = document.getElementById(id);
  if (el) el.addEventListener('input', sauverBrouillon);
});
['essence', 'cause', 'provenance', 'annee', 'usage'].forEach(function (id) {
  var el = document.getElementById(id);
  if (el) el.addEventListener('change', sauverBrouillon);
});
var lpEl = document.getElementById('lot-partage');
if (lpEl) lpEl.addEventListener('change', sauverBrouillon);

window.addEventListener('online',  mettreAJourStatutReseau);
window.addEventListener('offline', mettreAJourStatutReseau);

// ─── Swipe down sur les sheets statiques ─────────────────────────────────
(function () {
  var grumeSelSheet = document.getElementById('grume-sel-sheet');
  if (grumeSelSheet) ajouterSwipeDown(grumeSelSheet, fermerGrumeSelSheet);

  var grumeSheet = document.getElementById('grume-sheet');
  if (grumeSheet) ajouterSwipeDown(grumeSheet, fermerGrumeSheet);

  var modalExt = document.querySelector('#modal-extraction .extract-modal');
  if (modalExt) ajouterSwipeDown(modalExt, fermerModalExtraction);
}());

verifierAcces();
