// bureau/app.js — Interface desktop DURAMEN
// `lots` et `extractions` sont lus directement par DuramenCore.getStock()

// ═══════════ SUPABASE ═══════════
const SUPABASE_URL = 'https://zeadibimbdztpmsesaiw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYWRpYmltYmR6dHBtc2VzYWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTI2MTcsImV4cCI6MjA5MDQ2ODYxN30.xEHLNTROTu9QJ7c_vV3S54P76EXfpnx2VbhxznbQmmU';
const bH = {
  'Content-Type':  'application/json',
  'apikey':        SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Prefer':        'return=representation'
};

async function bSbSelect(table, filter) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + (filter || ''), { headers: bH });
  if (!res.ok) throw new Error('Lecture ' + table + ' : ' + res.status);
  return res.json();
}
async function bSbInsert(table, data) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
    method: 'POST', headers: bH, body: JSON.stringify(data)
  });
  if (!res.ok) { var e = await res.text(); throw new Error(res.status + ' ' + e); }
  return res.json();
}

// ═══════════ ÉTAT ═══════════
// `lots` et `extractions` : noms imposés par DuramenCore.getStock()
var lots          = [];
var extractions   = [];
var bCommune      = null;
var bLotsMetro    = [];
var bOnglet       = 'commune';
var bFeedbackType = null;
// Extraction complète
var bExtEssence   = null;
var bExtGrumes    = [];    // grumes disponibles pour l'essence choisie
var bExtGrumesSel = [];    // grumes sélectionnées (objets)
var bExtType      = 'planches'; // 'brute' | 'planches'
var bExtUsageDest = 'Intérieur';

// ═══════════ UI ═══════════
function bShowLoading(on) {
  document.getElementById('b-loading').classList.toggle('hidden', !on);
}
function bShowToast(msg, isErr) {
  var el = document.getElementById('b-toast');
  el.textContent = msg;
  el.style.background = isErr ? 'var(--rouge)' : 'var(--sumi)';
  el.classList.remove('hidden');
  setTimeout(function() { el.classList.add('hidden'); }, 3500);
}

// ═══════════ AUTH ═══════════
async function bTentativeConnexion() {
  var input  = document.getElementById('b-login-code');
  var erreur = document.getElementById('b-login-erreur');
  var code   = (input.value || '').trim().toUpperCase();
  erreur.textContent = '';
  if (!code) { erreur.textContent = 'Entrez votre code d\'accès.'; return; }

  var session = localStorage.getItem('duramen_bureau_session');
  if (session) {
    try { var s = JSON.parse(session); if (s.code === code) { bCommune = s; bLancerApp(); return; } } catch(e) {}
  }

  bShowLoading(true);
  try {
    var data = await bSbSelect('codes_acces', 'code=eq.' + encodeURIComponent(code) + '&actif=eq.true&select=code,commune');
    bShowLoading(false);
    if (!data || !data.length) { erreur.textContent = 'Code invalide ou inactif.'; return; }
    bCommune = { code: data[0].code, nom: data[0].commune };
    localStorage.setItem('duramen_bureau_session', JSON.stringify(bCommune));
    bLancerApp();
  } catch(e) { bShowLoading(false); erreur.textContent = 'Erreur : ' + e.message; }
}

function bDeconnecter() {
  localStorage.removeItem('duramen_bureau_session');
  bCommune = null; lots = []; extractions = []; bLotsMetro = [];
  document.getElementById('b-connexion').classList.remove('hidden');
  document.getElementById('b-app').classList.add('hidden');
  document.getElementById('b-login-code').value = '';
}

function bLancerApp() {
  document.getElementById('b-connexion').classList.add('hidden');
  document.getElementById('b-app').classList.remove('hidden');
  document.getElementById('b-tab-commune-nom').textContent = bCommune.nom;
  document.getElementById('b-stat-ext-lbl').textContent = 'EXTRACTIONS MOIS — ' + bCommune.nom.toUpperCase();
  var opt = document.getElementById('b-ext-commune-opt');
  if (opt) { opt.value = bCommune.nom; opt.textContent = bCommune.nom; }
  bChargerDonnees();
}

// ═══════════ DONNÉES ═══════════
async function bChargerDonnees() {
  bShowLoading(true);
  try {
    var code = encodeURIComponent(bCommune.code);
    var r = await Promise.all([
      bSbSelect('lots',        'commune_code=eq.' + code + '&order=created_at.desc'),
      bSbSelect('extractions', 'commune_code=eq.' + code + '&order=created_at.desc'),
      bSbSelect('lots',        'partage=eq.true&order=created_at.desc')
    ]);
    lots        = r[0] || [];
    extractions = r[1] || [];
    bLotsMetro  = r[2] || [];
    bMettreAJourHeader();
    bMettreAJourFooter();
    bAfficherOnglet();
  } catch(e) { bShowToast('Erreur chargement : ' + e.message, true); }
  bShowLoading(false);
}

// ═══════════ HEADER ═══════════
function bMettreAJourHeader() {
  var stock = DuramenCore.getStock();
  var totalVol = Object.values(stock).reduce(function(s, v) { return s + v.dispo; }, 0);
  var nbEss    = Object.keys(stock).filter(function(k) { return stock[k].dispo > 0; }).length;

  // Delta mensuel : comparer mois en cours vs mois précédent
  var now = new Date();
  var mois = now.getMonth(), annee = now.getFullYear();
  var moisPrec = mois === 0 ? 11 : mois - 1;
  var anneePrec = mois === 0 ? annee - 1 : annee;
  var lotsM  = lots.filter(function(l) { var d = new Date(l.created_at); return d.getMonth() === mois    && d.getFullYear() === annee;     });
  var lotsMP = lots.filter(function(l) { var d = new Date(l.created_at); return d.getMonth() === moisPrec && d.getFullYear() === anneePrec; });
  var volM   = lotsM.reduce(function(s, l)  { return s + (l.vol_utile || 0); }, 0);
  var volMP  = lotsMP.reduce(function(s, l) { return s + (l.vol_utile || 0); }, 0);
  var delta  = volM - volMP;

  document.getElementById('b-stat-stock').textContent   = totalVol.toFixed(1) + ' m³';
  document.getElementById('b-stat-delta').textContent   = (delta >= 0 ? '+' : '') + delta.toFixed(1) + ' m³ ce mois';
  document.getElementById('b-stat-lots').textContent    = lots.length;
  document.getElementById('b-stat-essences').textContent = nbEss + ' essence' + (nbEss > 1 ? 's' : '');

  var extsMois = extractions.filter(function(e) {
    var d = new Date(e.created_at);
    return d.getMonth() === mois && d.getFullYear() === annee;
  });
  var volExt = extsMois.reduce(function(s, e) { return s + (e.volume || 0); }, 0);
  document.getElementById('b-stat-ext-vol').textContent = volExt.toFixed(1) + ' m³';
  document.getElementById('b-stat-ext-ops').textContent = extsMois.length + ' opération' + (extsMois.length > 1 ? 's' : '');

  var volMetro = bLotsMetro.reduce(function(s, l) { return s + (l.vol_brut || 0); }, 0);
  var commUniq = bLotsMetro.map(function(l) { return l.commune_code; }).filter(function(v, i, a) { return a.indexOf(v) === i; }).length;
  document.getElementById('b-stat-metro').textContent        = volMetro.toFixed(1) + ' m³';
  document.getElementById('b-stat-metro-detail').textContent = commUniq + ' commune' + (commUniq > 1 ? 's' : '') + ' · ' + bLotsMetro.length + ' lots';
}

function bMettreAJourFooter() {
  var onglets = { commune: 1, metropole: 2, export: 3, feedback: 4 };
  var n = onglets[bOnglet] || 1;
  var stock = DuramenCore.getStock();
  var vol   = Object.values(stock).reduce(function(s, v) { return s + v.dispo; }, 0);
  var volM  = bLotsMetro.reduce(function(s, l) { return s + (l.vol_brut || 0); }, 0);
  var labels = { commune: 'Commune — ' + (bCommune ? bCommune.nom : ''), metropole: 'Nantes Métropole', export: 'Export', feedback: 'Ticket retour' };
  document.getElementById('b-footer-gauche').textContent  = 'Feuille ' + n + ' sur 4 · ' + (labels[bOnglet] || '');
  document.getElementById('b-footer-droite').textContent  = 'Stock : ' + vol.toFixed(1) + ' m³ · Métropole : ' + volM.toFixed(1) + ' m³';
}

// ═══════════ NAVIGATION ═══════════
function bSwitchTab(onglet) {
  bOnglet = onglet;
  document.querySelectorAll('.b-tab').forEach(function(t)   { t.classList.remove('active'); });
  document.querySelectorAll('.b-panel').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById('b-tab-' + onglet).classList.add('active');
  document.getElementById('b-panel-' + onglet).classList.add('active');
  bMettreAJourFooter();
  bAfficherOnglet();
}

function bAfficherOnglet() {
  if (bOnglet === 'commune')   bAfficherCommune();
  if (bOnglet === 'metropole') bAfficherMetropole();
  if (bOnglet === 'export')    bInitExport();
}

// ═══════════ ONGLET COMMUNE ═══════════
function bAfficherCommune() {
  bAfficherEssences();
  bAfficherTableLots();
  bInitStockPills();
}

function bAfficherEssences() {
  var stock    = DuramenCore.getStock();
  var essences = Object.keys(stock).filter(function(k) { return stock[k].dispo > 0; });
  var grille   = document.getElementById('b-essences-grid');
  grille.innerHTML = '';
  if (!essences.length) {
    grille.innerHTML = '<div class="b-empty">Aucun stock disponible.</div>';
    return;
  }
  var maxVol = Math.max.apply(null, essences.map(function(k) { return stock[k].dispo; }));
  essences.forEach(function(essence) {
    var info = stock[essence];
    var pct  = maxVol > 0 ? Math.round((info.dispo / maxVol) * 100) : 0;
    var anneeMax = 0;
    lots.filter(function(l) { return l.essence === essence; }).forEach(function(l) {
      var a = parseInt(l.annee || 0); if (a > anneeMax) anneeMax = a;
    });
    var card = document.createElement('div');
    card.className = 'b-essence-card';
    card.innerHTML =
      '<div class="b-essence-card-header">' +
        '<span class="b-essence-card-nom">' + essence + '</span>' +
        '<span class="b-essence-card-vol">' + info.dispo.toFixed(1) + ' <span>m³</span></span>' +
      '</div>' +
      '<div class="b-barre-piste"><div class="b-barre-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="b-essence-card-footer">' +
        '<span class="b-essence-card-meta">' + info.nbLots + ' lot' + (info.nbLots > 1 ? 's' : '') + (anneeMax ? ' · ' + anneeMax : '') + '</span>' +
        '<span class="b-badge b-badge-dispo">Disponible</span>' +
      '</div>';
    grille.appendChild(card);
  });
}

function bAfficherTableLots() {
  var tbody = document.getElementById('b-lots-tbody');
  tbody.innerHTML = '';

  // Ligne header
  var trH = document.createElement('tr');
  trH.className = 'b-tr-header';
  ['', 'Lots actifs — ' + bCommune.nom, '', '', '', ''].forEach(function(t, i) {
    var td = document.createElement('td'); td.colSpan = i === 1 ? 5 : 1; td.textContent = t; trH.appendChild(td);
  });
  tbody.appendChild(trH);

  var total = 0;
  lots.slice(0, 10).forEach(function(lot, idx) {
    var tr   = document.createElement('tr');
    var date = lot.created_at ? new Date(lot.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—';
    var vol  = (lot.vol_utile || lot.vol_brut || 0);
    total += vol;
    [
      { text: idx + 2, cls: '' },
      { text: lot.nom || '—', cls: '' },
      { text: lot.essence || '—', cls: 'b-essence-nom' },
      { text: vol.toFixed(1) + ' m³', cls: 'b-vol' },
      { text: lot.provenance || '—', cls: 'b-provenance' },
      { text: date, cls: 'b-provenance' }
    ].forEach(function(c) {
      var td = document.createElement('td');
      td.textContent = c.text;
      if (c.cls) td.className = c.cls;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  // Ligne total
  var trT = document.createElement('tr');
  trT.className = 'b-tr-total';
  ['', 'Total', '', '', '', ''].forEach(function(t, i) {
    var td = document.createElement('td');
    if (i === 1) td.textContent = t;
    if (i === 3) { td.textContent = total.toFixed(1) + ' m³'; td.className = 'b-vol'; }
    trT.appendChild(td);
  });
  tbody.appendChild(trT);
}


// ═══════════ ONGLET MÉTROPOLE ═══════════
function bAfficherMetropole() {
  var filtreCommune = (document.getElementById('b-metro-filtre-commune') || {}).value || '';
  var filtreEssence = (document.getElementById('b-metro-filtre-essence') || {}).value || '';

  // Peupler les filtres
  var selC = document.getElementById('b-metro-filtre-commune');
  var selE = document.getElementById('b-metro-filtre-essence');
  var commAll = bLotsMetro.map(function(l) { return l.commune || l.commune_code; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
  var essAll  = bLotsMetro.map(function(l) { return l.essence; }).filter(function(v, i, a) { return v && a.indexOf(v) === i; });
  if (selC.options.length <= 1) commAll.forEach(function(c) { var o = document.createElement('option'); o.value = c; o.textContent = c; selC.appendChild(o); });
  if (selE.options.length <= 1) essAll.forEach(function(e)  { var o = document.createElement('option'); o.value = e; o.textContent = e; selE.appendChild(o); });

  // Filtrer
  var data = bLotsMetro.filter(function(l) {
    var c = l.commune || l.commune_code;
    if (filtreCommune && c !== filtreCommune) return false;
    if (filtreEssence && l.essence !== filtreEssence) return false;
    return true;
  });

  // Agréger par commune
  var parCommune = {};
  data.forEach(function(l) {
    var c = l.commune || l.commune_code;
    if (!parCommune[c]) parCommune[c] = { vol: 0, lots: 0, essences: [] };
    parCommune[c].vol  += (l.vol_brut || 0);
    parCommune[c].lots += 1;
    if (l.essence && parCommune[c].essences.indexOf(l.essence) === -1) parCommune[c].essences.push(l.essence);
  });

  var communes = Object.keys(parCommune);
  var totalVol = communes.reduce(function(s, c) { return s + parCommune[c].vol; }, 0);
  var totalLots = communes.reduce(function(s, c) { return s + parCommune[c].lots; }, 0);

  var tbody = document.getElementById('b-metro-tbody');
  tbody.innerHTML = '';

  // Ligne header
  var trH = document.createElement('tr');
  trH.className = 'b-tr-header';
  var tdH = document.createElement('td'); tdH.colSpan = 6;
  tdH.textContent = 'Nantes Métropole — ' + communes.length + ' commune' + (communes.length > 1 ? 's' : '') + ' · ' + totalLots + ' lots partagés';
  trH.appendChild(tdH);
  tbody.appendChild(trH);

  communes.sort(function(a, b) { return parCommune[b].vol - parCommune[a].vol; });
  communes.forEach(function(comm, idx) {
    var info = parCommune[comm];
    var pct  = totalVol > 0 ? Math.round((info.vol / totalVol) * 100) : 0;
    var estMoi = bCommune && (comm === bCommune.nom || comm === bCommune.code);
    var tr = document.createElement('tr');
    if (estMoi) tr.className = 'b-tr-moi';

    [
      { html: idx + 2, cls: '' },
      { html: estMoi ? '<strong>' + comm + '</strong>' : comm, cls: '' },
      { html: '<span style="color:var(--cendre)">' + info.essences.join(', ') + '</span>', cls: '' },
      { html: '<span class="b-vol">' + info.vol.toFixed(1) + ' m³</span>', cls: '' },
      { html: info.lots, cls: '' },
      {
        html: '<div style="display:flex;align-items:center;gap:6px">' +
              '<div class="b-barre-repartition"><div class="b-barre-repartition-fill" style="width:' + pct + '%"></div></div>' +
              '<span class="b-pct">' + pct + '%</span>' +
              (estMoi ? '<span class="b-badge b-badge-vous">vous</span>' : '') +
              '</div>',
        cls: ''
      }
    ].forEach(function(c) {
      var td = document.createElement('td');
      td.innerHTML = c.html;
      if (c.cls) td.className = c.cls;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  // Ligne total
  var trT = document.createElement('tr');
  trT.className = 'b-tr-total';
  [
    '', 'Total métropole', '', '<span class="b-vol">' + totalVol.toFixed(1) + ' m³</span>', totalLots, ''
  ].forEach(function(h) {
    var td = document.createElement('td'); td.innerHTML = h; trT.appendChild(td);
  });
  tbody.appendChild(trT);

  bDrawDonut(data);
}

function bDrawDonut(data) {
  var parEssence = {};
  data.forEach(function(l) {
    if (!l.essence) return;
    parEssence[l.essence] = (parEssence[l.essence] || 0) + (l.vol_brut || 0);
  });
  var total = Object.values(parEssence).reduce(function(s, v) { return s + v; }, 0);
  if (total === 0) return;

  var sorted = Object.keys(parEssence).sort(function(a, b) { return parEssence[b] - parEssence[a]; });
  var top4   = sorted.slice(0, 4);
  var autres = sorted.slice(4).reduce(function(s, k) { return s + parEssence[k]; }, 0);
  var segments = top4.map(function(k) { return { nom: k, vol: parEssence[k] }; });
  if (autres > 0) segments.push({ nom: 'Autres', vol: autres });

  // Palette bois : du plus sombre (noyer) au plus clair (frêne/épicéa)
  var couleurs = ['#3D2B1F', '#6B4226', '#9C6B3C', '#C4965A', '#DFC09A'];
  var r = 72, cx = 100, cy = 100, stroke = 22;
  var circonf = 2 * Math.PI * r;
  var svg = document.getElementById('b-donut-svg');
  svg.innerHTML = '';

  var offset = 0;
  segments.forEach(function(seg, i) {
    var pct  = seg.vol / total;
    var dash = pct * circonf;
    var gap  = circonf - dash;
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', couleurs[i] || '#ccc');
    circle.setAttribute('stroke-width', stroke);
    circle.setAttribute('stroke-dasharray', dash + ' ' + gap);
    circle.setAttribute('stroke-dashoffset', -offset);
    svg.appendChild(circle);
    offset += dash;
  });

  document.getElementById('b-donut-center').innerHTML =
    '<div class="b-donut-center-val">' + total.toFixed(1) + '</div><div class="b-donut-center-lbl">m³ total</div>';

  var legende = document.getElementById('b-donut-legende');
  legende.innerHTML = '';
  segments.forEach(function(seg, i) {
    var pct = Math.round((seg.vol / total) * 100);
    var item = document.createElement('div');
    item.className = 'b-donut-legende-item';
    item.innerHTML =
      '<div class="b-donut-legende-dot" style="background:' + (couleurs[i] || '#ccc') + '"></div>' +
      '<span class="b-donut-legende-nom">' + seg.nom + '</span>' +
      '<span class="b-donut-legende-pct">' + pct + '%</span>';
    legende.appendChild(item);
  });
}

// ═══════════ ONGLET EXPORT ═══════════
function bInitExport() {
  var selC = document.getElementById('b-exp-commune');
  var selE = document.getElementById('b-exp-essence');
  var selA = document.getElementById('b-exp-annee');

  if (selC.options.length <= 1) {
    var commAll = bLotsMetro.map(function(l) { return l.commune || l.commune_code; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
    commAll.forEach(function(c) { var o = document.createElement('option'); o.value = c; o.textContent = c; selC.appendChild(o); });
  }
  if (selE.options.length <= 1) {
    var essAll = lots.map(function(l) { return l.essence; }).filter(function(v, i, a) { return v && a.indexOf(v) === i; });
    essAll.forEach(function(e) { var o = document.createElement('option'); o.value = e; o.textContent = e; selE.appendChild(o); });
  }
  if (selA.options.length <= 1) {
    var annees = lots.map(function(l) { return l.annee; }).filter(function(v, i, a) { return v && a.indexOf(v) === i; }).sort().reverse();
    annees.forEach(function(a) { var o = document.createElement('option'); o.value = a; o.textContent = a; selA.appendChild(o); });
  }
}

function bGetDonneesFiltrees() {
  var source  = document.getElementById('b-exp-source').value;
  var commune = document.getElementById('b-exp-commune').value;
  var essence = document.getElementById('b-exp-essence').value;
  var annee   = document.getElementById('b-exp-annee').value;
  var base    = source === 'metropole' ? bLotsMetro : lots;
  return base.filter(function(l) {
    if (commune && (l.commune || l.commune_code) !== commune) return false;
    if (essence && l.essence !== essence) return false;
    if (annee   && String(l.annee) !== annee) return false;
    return true;
  });
}

function bExportSelection() {
  var data = bGetDonneesFiltrees();
  bCsvTelecharger('duramen_selection.csv', data);
}
function bExportTout() { bCsvTelecharger('duramen_complet.csv', lots); }
function bExportLotsCommune() { bCsvTelecharger('duramen_lots_' + bCommune.code + '.csv', lots); }

function bCsvTelecharger(nom, data) {
  var entetes = ['Commune', 'Nom', 'Essence', 'Provenance', 'Cause', 'Vol. brut m³', 'Vol. utile m³', 'Nb grumes', 'Année', 'Partage', 'Date'];
  var lignes  = data.map(function(l) {
    return [
      l.commune || l.commune_code, l.nom, l.essence, l.provenance, l.cause,
      (l.vol_brut||0).toFixed(2), (l.vol_utile||0).toFixed(2), l.nb_grumes,
      l.annee, l.partage ? 'Oui' : 'Non',
      l.created_at ? new Date(l.created_at).toLocaleDateString('fr-FR') : ''
    ];
  });
  var bom = '﻿';
  var csv = bom + entetes.join(';') + '\n' + lignes.map(function(l) {
    return l.map(function(c) { return '"' + String(c || '').replace(/"/g, '""') + '"'; }).join(';');
  }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url; a.download = nom; a.click();
  URL.revokeObjectURL(url);
}

// ═══════════ EXTRACTION — COLONNE DROITE ═══════════

/* Initialise les pills de stock dans l'état repos */
function bInitStockPills() {
  var stock  = DuramenCore.getStock();
  var pills  = document.getElementById('b-stock-pills');
  if (!pills) return;
  pills.innerHTML = '';
  Object.keys(stock).filter(function(k) { return stock[k].dispo > 0; }).forEach(function(ess) {
    var el = document.createElement('span');
    el.className = 'b-stock-pill';
    el.textContent = ess + ' · ' + stock[ess].dispo.toFixed(1) + ' m³';
    pills.appendChild(el);
  });
}

/* Ouvrir le panel extraction */
function bOuvrirExtraction() {
  bExtEssence   = null;
  bExtGrumes    = [];
  bExtGrumesSel = [];
  bExtType      = 'planches';
  bExtUsageDest = 'Intérieur';
  // Reset UI
  document.getElementById('b-ext-repos').classList.add('hidden');
  document.getElementById('b-ext-panel').classList.remove('hidden');
  document.getElementById('b-grumes-resume').classList.add('hidden');
  document.getElementById('b-btn-valider-ext').disabled = true;
  document.getElementById('b-type-brute').classList.remove('active');
  document.getElementById('b-type-planches').classList.add('active');
  document.getElementById('b-sliders-zone').style.display = '';
  document.getElementById('b-bloc-utile').style.display = '';
  document.getElementById('b-bloc-dechet').style.display = '';
  document.getElementById('b-v-ext').textContent  = '—';
  document.getElementById('b-v-util').textContent = '—';
  document.getElementById('b-v-dec').textContent  = '—';
  document.getElementById('b-val-lin').textContent = '—';
  // Reset sliders
  document.getElementById('b-sl-ep').value = 27;
  document.getElementById('b-sl-ts').value = 3;
  document.getElementById('b-sl-rg').value = 50;
  document.getElementById('b-val-ep').textContent = '27 mm';
  document.getElementById('b-val-ts').textContent = '3 mm';
  document.getElementById('b-val-rg').textContent = '50 %';
  bInitChipsExt();
}

/* Fermer le panel extraction */
function bFermerExtraction() {
  document.getElementById('b-ext-repos').classList.remove('hidden');
  document.getElementById('b-ext-panel').classList.add('hidden');
}

/* Initialise les chips essences disponibles */
function bInitChipsExt() {
  var stock    = DuramenCore.getStock();
  var essences = Object.keys(stock).filter(function(k) { return stock[k].dispo > 0; });
  var container = document.getElementById('b-chips-ess');
  container.innerHTML = '';
  var btnSel = document.getElementById('b-btn-sel-grumes');
  if (!essences.length) {
    container.innerHTML = '<span style="font-size:13px;color:var(--cendre)">Aucun stock disponible</span>';
    btnSel.disabled = true;
    return;
  }
  btnSel.disabled = true;
  essences.forEach(function(ess) {
    var vol  = stock[ess].dispo;
    var chip = document.createElement('button');
    chip.className = 'b-chip';
    chip.innerHTML = ess + '<span class="b-chip-vol">' + vol.toFixed(1) + ' m³</span>';
    chip.onclick   = function() { bSelChipExt(this, ess); };
    container.appendChild(chip);
  });
}

/* Sélectionner une essence dans le panel */
function bSelChipExt(btn, ess) {
  document.querySelectorAll('#b-chips-ess .b-chip').forEach(function(c) { c.classList.remove('active'); });
  btn.classList.add('active');
  bExtEssence = ess;
  bExtGrumesSel = [];
  document.getElementById('b-grumes-resume').classList.add('hidden');
  document.getElementById('b-btn-valider-ext').disabled = true;
  document.getElementById('b-btn-sel-grumes').disabled = false;
  document.getElementById('b-v-ext').textContent  = '—';
  document.getElementById('b-v-util').textContent = '—';
  document.getElementById('b-v-dec').textContent  = '—';
  document.getElementById('b-val-lin').textContent = '—';
  // Préparer la liste des grumes pour cette essence
  bExtGrumes = [];
  lots.filter(function(l) { return l.essence === bExtEssence; }).forEach(function(lot) {
    var nb  = Math.max(1, parseInt(lot.nb_grumes) || 1);
    var vol = (lot.vol_brut || 0) / nb;
    for (var i = 0; i < nb; i++) {
      bExtGrumes.push({
        lotId:   lot.id,
        lotNom:  lot.nom || '—',
        essence: lot.essence,
        index:   i + 1,
        longueur: lot.longueur_grume || null,
        diametre: lot.diametre_grume || null,
        volume:  vol
      });
    }
  });
}

/* Construire le label d'une grume */
function bLabelGrume(g) {
  var parts = [];
  if (g.longueur) parts.push('L ' + parseFloat(g.longueur).toFixed(2) + ' m');
  if (g.diametre) parts.push('Ø ' + g.diametre + ' cm');
  parts.push('n°' + g.index);
  return parts.join(' · ');
}

/* ── Sélection des grumes (feuille latérale) ── */
function bOuvrirGrumes() {
  if (!bExtEssence) { bShowToast('Choisissez une essence.', true); return; }
  var body = document.getElementById('b-grumes-sheet-body');
  body.innerHTML = '';

  // Grouper par lot
  var parLot = {};
  bExtGrumes.forEach(function(g) {
    if (!parLot[g.lotId]) parLot[g.lotId] = { nom: g.lotNom, essence: g.essence, grumes: [] };
    parLot[g.lotId].grumes.push(g);
  });

  var selIds = bExtGrumesSel.map(function(g) { return g.lotId + '-' + g.index; });

  Object.keys(parLot).forEach(function(lotId) {
    var lot = parLot[lotId];
    var head = document.createElement('div');
    head.className = 'b-grumes-lot-head';
    head.innerHTML = lot.nom + '<span class="b-grumes-lot-badge">' + lot.essence + '</span>';
    body.appendChild(head);

    lot.grumes.forEach(function(g) {
      var key = g.lotId + '-' + g.index;
      var row = document.createElement('div');
      row.className = 'b-grume-row' + (selIds.indexOf(key) !== -1 ? ' checked' : '');
      row.innerHTML =
        '<div class="b-grume-check"></div>' +
        '<div class="b-grume-info">' + bLabelGrume(g) + '</div>' +
        '<div class="b-grume-vol">' + g.volume.toFixed(3) + ' m³</div>';
      row.onclick = function() {
        row.classList.toggle('checked');
        var isChecked = row.classList.contains('checked');
        if (isChecked) {
          bExtGrumesSel.push(g);
        } else {
          bExtGrumesSel = bExtGrumesSel.filter(function(x) {
            return !(x.lotId === g.lotId && x.index === g.index);
          });
        }
      };
      body.appendChild(row);
    });
  });

  document.getElementById('b-grumes-overlay').classList.remove('hidden');
}

function bFermerGrumes() {
  document.getElementById('b-grumes-overlay').classList.add('hidden');
}

function bConfirmerGrumes() {
  bFermerGrumes();
  var nb  = bExtGrumesSel.length;
  var vol = bExtGrumesSel.reduce(function(s, g) { return s + g.volume; }, 0);
  if (nb > 0) {
    document.getElementById('b-grumes-resume').classList.remove('hidden');
    document.getElementById('b-grumes-resume-txt').textContent =
      nb + ' grume' + (nb > 1 ? 's' : '') + ' — ' + vol.toFixed(3) + ' m³';
    bMajVolumes();
    document.getElementById('b-btn-valider-ext').disabled = false;
  } else {
    document.getElementById('b-grumes-resume').classList.add('hidden');
    document.getElementById('b-btn-valider-ext').disabled = true;
  }
}

/* ── Type brute / planches ── */
function bSetTypeExt(type) {
  bExtType = type;
  document.getElementById('b-type-brute').classList.toggle('active',   type === 'brute');
  document.getElementById('b-type-planches').classList.toggle('active', type === 'planches');
  var sz = document.getElementById('b-sliders-zone');
  sz.style.display = type === 'planches' ? '' : 'none';
  document.getElementById('b-bloc-utile').style.display  = type === 'planches' ? '' : 'none';
  document.getElementById('b-bloc-dechet').style.display = type === 'planches' ? '' : 'none';
  bMajVolumes();
}

/* ── Sliders & volumes ── */
function bMajSlider(id, val, unit) {
  document.getElementById(id).textContent = val + unit;
}

function bMajVolumes() {
  var volBrut = bExtGrumesSel.reduce(function(s, g) { return s + g.volume; }, 0);
  if (volBrut === 0) return;

  document.getElementById('b-v-ext').textContent = volBrut.toFixed(3);

  if (bExtType === 'brute') {
    document.getElementById('b-v-util').textContent = '—';
    document.getElementById('b-v-dec').textContent  = '—';
    document.getElementById('b-val-lin').textContent = '—';
    return;
  }

  var ep  = parseInt(document.getElementById('b-sl-ep').value);
  var ts  = parseInt(document.getElementById('b-sl-ts').value);
  var rg  = parseInt(document.getElementById('b-sl-rg').value) / 100;
  var util = volBrut * rg;
  var dec  = volBrut - util;
  var lin  = util * 1000 / (ep + ts); // mètres

  document.getElementById('b-v-util').textContent = util.toFixed(3);
  document.getElementById('b-v-dec').textContent  = dec.toFixed(3);
  document.getElementById('b-val-lin').textContent = lin.toFixed(1) + ' m';
}

/* ── Destination ── */
function bOuvrirDestination() {
  document.getElementById('b-dest-projet').value       = '';
  document.getElementById('b-dest-commune-inst').value = '';
  document.getElementById('b-dest-lieu').value         = '';
  bExtUsageDest = 'Intérieur';
  document.getElementById('b-dest-usage-int').classList.add('active');
  document.getElementById('b-dest-usage-ext').classList.remove('active');
  document.getElementById('b-dest-overlay').classList.remove('hidden');
}

function bFermerDestination() {
  document.getElementById('b-dest-overlay').classList.add('hidden');
}

function bSetUsageDest(usage) {
  bExtUsageDest = usage;
  document.getElementById('b-dest-usage-int').classList.toggle('active', usage === 'Intérieur');
  document.getElementById('b-dest-usage-ext').classList.toggle('active', usage === 'Extérieur');
}

async function bConfirmerExtraction() {
  var volBrut = bExtGrumesSel.reduce(function(s, g) { return s + g.volume; }, 0);
  var projet  = document.getElementById('b-dest-projet').value.trim();
  var lieu    = document.getElementById('b-dest-lieu').value.trim();
  var comm    = document.getElementById('b-dest-commune-inst').value.trim();

  var ep  = parseInt(document.getElementById('b-sl-ep').value);
  var ts  = parseInt(document.getElementById('b-sl-ts').value);
  var rg  = parseInt(document.getElementById('b-sl-rg').value) / 100;
  var volUtil  = bExtType === 'planches' ? volBrut * rg : volBrut;
  var lineaire = bExtType === 'planches' ? volUtil * 1000 / (ep + ts) : 0;

  var dest = [projet, comm, lieu].filter(Boolean).join(' · ') || '—';
  var valid = DuramenCore.validerSortie({ essence: bExtEssence, volume: volUtil, usage: bExtUsageDest, destination: dest });
  if (!valid.ok) { bShowToast(valid.erreur, true); return; }

  bShowLoading(true);
  try {
    var ext = {
      id:              crypto.randomUUID(),
      commune_code:    bCommune.code,
      commune:         bCommune.nom,
      essence:         bExtEssence,
      volume:          volUtil,
      vol_brut_extrait: volBrut,
      type_valorisation: bExtType,
      lineaire:        lineaire > 0 ? Math.round(lineaire * 10) / 10 : null,
      usage:           bExtUsageDest,
      destination:     dest,
      projet:          projet || null,
      commune_installation: comm || null,
      date:            new Date().toLocaleDateString('fr-FR'),
      date_iso:        new Date().toISOString()
    };
    await bSbInsert('extractions', ext);
    bShowLoading(false);
    bFermerDestination();
    bFermerExtraction();
    bShowToast('Extraction enregistrée — ' + volUtil.toFixed(3) + ' m³ ' + bExtEssence);
    await bChargerDonnees();
  } catch(e) { bShowLoading(false); bShowToast('Erreur : ' + e.message, true); }
}

// ═══════════ TICKET RETOUR ═══════════
function bSelFeedbackType(btn, type) {
  document.querySelectorAll('.b-feedback-type-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  bFeedbackType = type;
}
function bEffacerTicket() {
  document.querySelectorAll('.b-feedback-type-btn').forEach(function(b) { b.classList.remove('active'); });
  bFeedbackType = null;
  var msg = document.getElementById('b-feedback-message');
  if (msg) msg.value = '';
}
async function bEnvoyerTicket() {
  var msg = document.getElementById('b-feedback-message');
  if (!bFeedbackType)          { bShowToast('Choisissez un type de retour.', true); return; }
  if (!msg || !msg.value.trim()) { bShowToast('Le message ne peut pas être vide.', true); return; }
  bShowLoading(true);
  try {
    await bSbInsert('feedbacks', {
      id: crypto.randomUUID(), commune_code: bCommune.code,
      commune: bCommune.nom, type: bFeedbackType, message: msg.value.trim()
    });
    bShowLoading(false);
    bEffacerTicket();
    bShowToast('Ticket envoyé. Merci pour votre retour !');
    bSwitchTab('commune');
  } catch(e) { bShowLoading(false); bShowToast('Erreur : ' + e.message, true); }
}

// ═══════════ INIT ═══════════
(function() {
  var session = localStorage.getItem('duramen_bureau_session');
  if (session) { try { bCommune = JSON.parse(session); bLancerApp(); return; } catch(e) {} }
})();
