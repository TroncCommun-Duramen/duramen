// bureau/app.js — Interface desktop DURAMEN
// `lots` et `extractions` sont lus directement par DuramenCore.getStock()

// ═══════════ SUPABASE ═══════════
const SUPABASE_URL = 'https://zeadibimbdztpmsesaiw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYWRpYmltYmR6dHBtc2VzYWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTI2MTcsImV4cCI6MjA5MDQ2ODYxN30.xEHLNTROTu9QJ7c_vV3S54P76EXfpnx2VbhxznbQmmU';
const bH = {
  'Content-Type':   'application/json',
  'apikey':         SUPABASE_KEY,
  'Authorization':  'Bearer ' + SUPABASE_KEY,
  'Prefer':         'return=representation',
  'x-commune-code': ''
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
    try { var s = JSON.parse(session); if (s.code === code) { bCommune = s; bH['x-commune-code'] = bCommune.code; bLancerApp(); return; } } catch(e) {}
  }

  bShowLoading(true);
  try {
    var data = await bSbSelect('codes_acces', 'code=eq.' + encodeURIComponent(code) + '&actif=eq.true&select=code,commune');
    bShowLoading(false);
    if (!data || !data.length) { erreur.textContent = 'Code invalide ou inactif.'; return; }
    bCommune = { code: data[0].code, nom: data[0].commune };
    localStorage.setItem('duramen_bureau_session', JSON.stringify(bCommune));
    bH['x-commune-code'] = bCommune.code;
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

  var volMetro = bLotsMetro.reduce(function(s, l) { return s + (l.vol_utile || 0); }, 0);
  var commUniq = bLotsMetro.map(function(l) { return l.commune_code; }).filter(function(v, i, a) { return a.indexOf(v) === i; }).length;
  document.getElementById('b-stat-metro').textContent        = volMetro.toFixed(1) + ' m³';
  document.getElementById('b-stat-metro-detail').textContent = commUniq + ' commune' + (commUniq > 1 ? 's' : '') + ' · ' + bLotsMetro.length + ' lots';
}

function bMettreAJourFooter() {
  var onglets = { commune: 1, metropole: 2, export: 3, feedback: 4 };
  var n = onglets[bOnglet] || 1;
  var stock = DuramenCore.getStock();
  var vol   = Object.values(stock).reduce(function(s, v) { return s + v.dispo; }, 0);
  var volM  = bLotsMetro.reduce(function(s, l) { return s + (l.vol_utile || 0); }, 0);
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
var ESSENCE_COULEURS = {
  'Chêne': '#8B6914', 'Châtaignier': '#9e5c2d', 'Frêne': '#5c7a3e',
  'Hêtre': '#b5763a', 'Douglas': '#4a7a5c', 'Épicéa': '#3d6b4f',
  'Séquoia': '#a0522d', 'Robinier (Acacia)': '#c4a24d', 'Peuplier': '#7ab359',
  'Noyer': '#5c3d1e', 'Merisier': '#d04060', 'Pin maritime': '#7c9c5a',
  'Aulne': '#6b8e6b', 'Platane': '#8fa87c', 'Tilleul': '#9ab86e'
};

var BLUES_DEGRADE = ['#1a2f6a', '#2B3F8C', '#3d55a8', '#5570c0', '#7088d4', '#8da0e0', '#aab8ec', '#c4d0f4'];

function bPiePath(cx, cy, r, startAngle, endAngle) {
  if (endAngle - startAngle >= 2 * Math.PI) endAngle = startAngle + 2 * Math.PI - 0.0001;
  var x1 = cx + r * Math.cos(startAngle);
  var y1 = cy + r * Math.sin(startAngle);
  var x2 = cx + r * Math.cos(endAngle);
  var y2 = cy + r * Math.sin(endAngle);
  var large = (endAngle - startAngle) > Math.PI ? 1 : 0;
  return 'M ' + cx + ' ' + cy + ' L ' + x1.toFixed(2) + ' ' + y1.toFixed(2) +
    ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2) + ' Z';
}

function bDrawDonutCommune() {
  var stock    = DuramenCore.getStock();
  var essences = Object.keys(stock).filter(function(k) { return stock[k].dispo > 0; });
  var total    = essences.reduce(function(s, k) { return s + stock[k].dispo; }, 0);
  var svg      = document.getElementById('b-commune-donut-svg');
  var center   = document.getElementById('b-commune-donut-center');
  var legende  = document.getElementById('b-commune-donut-legende');
  if (!svg) return;
  svg.innerHTML = ''; legende.innerHTML = '';
  if (center) center.innerHTML = '';
  if (total === 0) { legende.innerHTML = '<span class="b-donut-vide">Aucun stock</span>'; return; }

  essences.sort(function(a, b) { return stock[b].dispo - stock[a].dispo; });

  var cx = 100, cy = 100, r = 92;
  var startAngle = -Math.PI / 2;

  essences.forEach(function(ess, i) {
    var pct      = stock[ess].dispo / total;
    var pctRound = Math.round(pct * 100);
    var endAngle = startAngle + pct * 2 * Math.PI;
    var couleur  = BLUES_DEGRADE[i % BLUES_DEGRADE.length];

    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', bPiePath(cx, cy, r, startAngle, endAngle));
    path.setAttribute('fill', couleur);
    svg.appendChild(path);

    if (pct > 0.05) {
      var midAngle = startAngle + (endAngle - startAngle) / 2;
      var tr = r * 0.63;
      var tx = cx + tr * Math.cos(midAngle);
      var ty = cy + tr * Math.sin(midAngle);
      var txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', tx.toFixed(1));
      txt.setAttribute('y', ty.toFixed(1));
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('dominant-baseline', 'middle');
      txt.setAttribute('fill', 'white');
      txt.setAttribute('font-size', '11');
      txt.setAttribute('font-weight', '600');
      txt.setAttribute('font-family', 'Outfit, sans-serif');
      txt.textContent = pctRound + '%';
      svg.appendChild(txt);
    }

    startAngle = endAngle;

    var item = document.createElement('div');
    item.className = 'b-commune-donut-item';
    var dot = document.createElement('div');
    dot.className = 'b-commune-donut-dot';
    dot.style.background = couleur;
    item.appendChild(dot);
    var spanEss = document.createElement('span');
    var strongEss = document.createElement('strong');
    strongEss.textContent = ess;
    spanEss.appendChild(strongEss);
    spanEss.appendChild(document.createTextNode(' '));
    var pctSpanEss = document.createElement('span');
    pctSpanEss.className = 'b-donut-pct';
    pctSpanEss.textContent = pctRound + '%';
    spanEss.appendChild(pctSpanEss);
    item.appendChild(spanEss);
    legende.appendChild(item);
  });
}

function bAfficherCommune() {
  bDrawDonutCommune();
  bAfficherTableLots();
  bInitStockPills();
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
      { text: vol.toFixed(3) + ' m³', cls: 'b-vol' },
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
    if (i === 3) { td.textContent = total.toFixed(3) + ' m³'; td.className = 'b-vol'; }
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

  // Camembert : filtre par essence uniquement (montre la part de chaque commune)
  var donutData = bLotsMetro.filter(function(l) {
    return !filtreEssence || l.essence === filtreEssence;
  });
  bDrawDonut(donutData);

  // Table : filtre par commune ET essence, une ligne par commune+essence
  var tableData = bLotsMetro.filter(function(l) {
    var c = l.commune || l.commune_code;
    if (filtreCommune && c !== filtreCommune) return false;
    if (filtreEssence && l.essence !== filtreEssence) return false;
    return true;
  });

  var parCE = {};
  tableData.forEach(function(l) {
    var comm = l.commune || l.commune_code;
    var key  = comm + '::' + (l.essence || '—');
    if (!parCE[key]) parCE[key] = { commune: comm, essence: l.essence || '—', vol: 0, lots: 0 };
    parCE[key].vol  += (l.vol_utile || 0);
    parCE[key].lots += 1;
  });

  var rows     = Object.values(parCE).sort(function(a, b) { return b.vol - a.vol; });
  var totalVol = rows.reduce(function(s, r) { return s + r.vol; }, 0);
  var nbComm   = rows.map(function(r) { return r.commune; }).filter(function(v, i, a) { return a.indexOf(v) === i; }).length;

  var tbody = document.getElementById('b-metro-tbody');
  tbody.innerHTML = '';

  // Ligne header
  var trH = document.createElement('tr');
  trH.className = 'b-tr-header';
  var tdH = document.createElement('td'); tdH.colSpan = 4;
  tdH.textContent = 'Nantes Métropole — ' + nbComm + ' commune' + (nbComm > 1 ? 's' : '') + ' · ' + rows.length + ' ligne' + (rows.length > 1 ? 's' : '');
  trH.appendChild(tdH);
  tbody.appendChild(trH);

  rows.forEach(function(row) {
    var estMoi = bCommune && (row.commune === bCommune.nom || row.commune === bCommune.code);
    var tr = document.createElement('tr');
    if (estMoi) tr.className = 'b-tr-moi';
    // td1 — commune
    var tdC = document.createElement('td');
    if (estMoi) { var strong = document.createElement('strong'); strong.textContent = row.commune; tdC.appendChild(strong); }
    else { tdC.textContent = row.commune; }
    tr.appendChild(tdC);
    // td2 — essence
    var tdE = document.createElement('td');
    var essSpan = document.createElement('span'); essSpan.style.color = 'var(--cendre)'; essSpan.textContent = row.essence; tdE.appendChild(essSpan);
    tr.appendChild(tdE);
    // td3 — volume
    var tdV = document.createElement('td');
    var volSpan = document.createElement('span'); volSpan.className = 'b-vol'; volSpan.textContent = row.vol.toFixed(3) + ' m³'; tdV.appendChild(volSpan);
    tr.appendChild(tdV);
    // td4 — lots
    var tdL = document.createElement('td');
    var lotsSpan = document.createElement('span'); lotsSpan.style.color = 'var(--cendre)'; lotsSpan.textContent = row.lots + ' lot' + (row.lots > 1 ? 's' : ''); tdL.appendChild(lotsSpan);
    tr.appendChild(tdL);
    tbody.appendChild(tr);
  });

  // Ligne total
  var trT = document.createElement('tr');
  trT.className = 'b-tr-total';
  ['Total métropole', '', '<span class="b-vol">' + totalVol.toFixed(3) + ' m³</span>', ''].forEach(function(h) {
    var td = document.createElement('td'); td.innerHTML = h; trT.appendChild(td);
  });
  tbody.appendChild(trT);
}

function bDrawDonut(data) {
  var parCommune = {};
  data.forEach(function(l) {
    var c = l.commune || l.commune_code;
    if (!c) return;
    parCommune[c] = (parCommune[c] || 0) + (l.vol_utile || 0);
  });
  var total = Object.values(parCommune).reduce(function(s, v) { return s + v; }, 0);

  var svg    = document.getElementById('b-donut-svg');
  var center = document.getElementById('b-donut-center');
  var legende = document.getElementById('b-donut-legende');
  if (!svg) return;
  svg.innerHTML = '';
  if (legende) legende.innerHTML = '';

  if (total === 0) {
    if (center) center.innerHTML = '<div class="b-donut-center-lbl">Aucune donnée</div>';
    return;
  }

  var sorted   = Object.keys(parCommune).sort(function(a, b) { return parCommune[b] - parCommune[a]; });
  var top6     = sorted.slice(0, 6);
  var autresVol = sorted.slice(6).reduce(function(s, k) { return s + parCommune[k]; }, 0);
  var segments = top6.map(function(k) { return { nom: k, vol: parCommune[k] }; });
  if (autresVol > 0) segments.push({ nom: 'Autres', vol: autresVol });

  var r = 80, cx = 100, cy = 100, stroke = 24;
  var circonf = 2 * Math.PI * r;

  var fond = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  fond.setAttribute('cx', cx); fond.setAttribute('cy', cy); fond.setAttribute('r', r);
  fond.setAttribute('fill', 'none'); fond.setAttribute('stroke', 'var(--brume)'); fond.setAttribute('stroke-width', stroke);
  svg.appendChild(fond);

  var offset = 0;
  segments.forEach(function(seg, i) {
    var pct    = seg.vol / total;
    var dash   = pct * circonf;
    var couleur = BLUES_DEGRADE[i % BLUES_DEGRADE.length];
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx); circle.setAttribute('cy', cy); circle.setAttribute('r', r);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', couleur);
    circle.setAttribute('stroke-width', stroke);
    circle.setAttribute('stroke-dasharray', dash + ' ' + (circonf - dash));
    circle.setAttribute('stroke-dashoffset', -offset);
    svg.appendChild(circle);
    offset += dash;
  });

  if (center) center.innerHTML =
    '<div class="b-donut-center-val">' + total.toFixed(1) + '</div><div class="b-donut-center-lbl">m³ total</div>';

  if (legende) {
    segments.forEach(function(seg, i) {
      var pct  = Math.round((seg.vol / total) * 100);
      var item = document.createElement('div');
      item.className = 'b-donut-legende-item';
      var dotSeg = document.createElement('div');
      dotSeg.className = 'b-donut-legende-dot';
      dotSeg.style.background = BLUES_DEGRADE[i % BLUES_DEGRADE.length];
      item.appendChild(dotSeg);
      var nomSpan = document.createElement('span');
      nomSpan.className = 'b-donut-legende-nom';
      nomSpan.textContent = seg.nom;
      item.appendChild(nomSpan);
      var pctSpanSeg = document.createElement('span');
      pctSpanSeg.className = 'b-donut-legende-pct';
      pctSpanSeg.textContent = pct + '%';
      item.appendChild(pctSpanSeg);
      legende.appendChild(item);
    });
  }
}

// ═══════════ ONGLET EXPORT ═══════════
function bInitExport() {
  var selC = document.getElementById('b-exp-commune');
  var selE = document.getElementById('b-exp-essence');
  var selA = document.getElementById('b-exp-annee');

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
  var essence = document.getElementById('b-exp-essence').value;
  var annee   = document.getElementById('b-exp-annee').value;
  var base    = source === 'metropole' ? bLotsMetro : lots;
  return base.filter(function(l) {
    if (essence && l.essence !== essence) return false;
    if (annee   && String(l.annee) !== annee) return false;
    return true;
  });
}

function bExportSelection() {
  var data = bGetDonneesFiltrees();
  bCsvTelecharger('duramen_selection.csv', data);
}

function bCsvTelecharger(nom, data) {
  var entetes = ['Commune', 'Nom du lot', 'Essence', 'Date', 'Provenance', 'Cause', 'Nb grumes', 'Vol. brut m3', 'Partage avec NM'];
  var lignes = data.map(function(l) {
    var date = l.date || (l.created_at ? new Date(l.created_at).toLocaleDateString('fr-FR') : '');
    return [
      '"' + String(l.commune || l.commune_code || '').replace(/"/g, '""') + '"',
      '"' + String(l.nom || '').replace(/"/g, '""') + '"',
      '"' + String(l.essence || '').replace(/"/g, '""') + '"',
      '"' + String(date).replace(/"/g, '""') + '"',
      '"' + String(l.provenance || '').replace(/"/g, '""') + '"',
      '"' + String(l.cause || '').replace(/"/g, '""') + '"',
      l.nb_grumes || 0,
      (l.vol_brut || 0).toFixed(3).replace('.', ','),
      '"' + (l.partage ? 'Oui' : 'Non') + '"'
    ];
  });
  var totalVolBrut = data.reduce(function(s, l) { return s + (l.vol_brut || 0); }, 0);
  var ligneTotal = ['"TOTAL"', '""', '""', '""', '""', '""', '', totalVolBrut.toFixed(3).replace('.', ','), '""'];
  var bom = '﻿';
  var csv = bom + entetes.join(';') + '\n'
    + lignes.map(function(l) { return l.join(';'); }).join('\n')
    + '\n' + ligneTotal.join(';');
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

/* Helpers grumes (réutilisés dans la modale) */
function bLabelGrume(g) { return 'Grume n°' + g.index; }
function bMetriquesGrume(g) {
  var parts = [];
  if (g.longueur) parts.push('L ' + parseFloat(g.longueur).toFixed(2) + ' m');
  if (g.diametre) parts.push('Diamètre : ' + g.diametre + ' cm');
  else if (g.circonference) parts.push('Circonférence : ' + g.circonference + ' cm');
  return parts.length ? parts.join(' · ') : 'dimensions non renseignées';
}

/* ── Modale extraction 3 étapes ── */
function bOuvrirModalExt() {
  bExtEssence   = null;
  bExtGrumes    = [];
  bExtGrumesSel = [];
  bExtType      = 'planches';
  bExtUsageDest = 'Intérieur';
  bMextGoStep(1);
  bMextInitChips();
  document.getElementById('b-mext-overlay').classList.remove('hidden');
}

function bFermerModalExt() {
  document.getElementById('b-mext-overlay').classList.add('hidden');
}

function bMextGoStep(n) {
  [1, 2, 3].forEach(function(i) {
    var body = document.getElementById('b-mext-step' + i);
    if (body) body.classList.toggle('hidden', i !== n);
    var dot = document.getElementById('b-mext-dot-' + i);
    if (dot) {
      dot.classList.remove('active', 'done');
      if (i < n) dot.classList.add('done');
      else if (i === n) dot.classList.add('active');
    }
  });
  [1, 2].forEach(function(i) {
    var line = document.getElementById('b-mext-line-' + i);
    if (line) line.classList.toggle('done', i < n);
  });
}

function bMextInitChips() {
  var stock    = DuramenCore.getStock();
  var essences = Object.keys(stock).filter(function(k) { return stock[k].dispo > 0; });
  var container = document.getElementById('b-mext-chips');
  container.innerHTML = '';
  var next = document.getElementById('b-mext-s1-next');
  if (!essences.length) {
    container.innerHTML = '<span class="b-chips-vide">Aucun stock disponible</span>';
    if (next) next.disabled = true;
    return;
  }
  if (next) next.disabled = true;
  essences.forEach(function(ess) {
    var vol  = stock[ess].dispo;
    var chip = document.createElement('button');
    chip.className = 'b-chip-essence';
    chip.appendChild(document.createTextNode(ess));
    var volSpan = document.createElement('span'); volSpan.className = 'b-chip-essence-vol'; volSpan.textContent = vol.toFixed(1) + ' m³';
    chip.appendChild(volSpan);
    chip.onclick = function() {
      document.querySelectorAll('#b-mext-chips .b-chip-essence').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      bExtEssence = ess;
      bExtGrumesSel = [];
      if (next) next.disabled = false;
      bExtGrumes = [];
      lots.filter(function(l) { return l.essence === ess; }).forEach(function(lot) {
        var grumesArr = Array.isArray(lot.grumes) ? lot.grumes : [];
        if (grumesArr.length > 0) {
          grumesArr.forEach(function(g, i) {
            var d   = parseFloat(g.diametre) || 0;
            var lon = parseFloat(g.longueur)  || 0;
            var vol = d > 0 && lon > 0 ? Math.PI * Math.pow(d / 200, 2) * lon : (lot.vol_brut || 0) / grumesArr.length;
            bExtGrumes.push({ lotId: lot.id, lotNom: lot.nom || '—', essence: lot.essence,
              index: i + 1, longueur: lon > 0 ? lon : null,
              diametre: d > 0 ? d : null,
              circonference: g.circonference || null, volume: vol });
          });
        } else {
          var nb  = Math.max(1, parseInt(lot.nb_grumes) || 1);
          var vol = (lot.vol_brut || 0) / nb;
          for (var i = 0; i < nb; i++) {
            bExtGrumes.push({ lotId: lot.id, lotNom: lot.nom || '—', essence: lot.essence,
              index: i + 1, longueur: null, diametre: null, circonference: null, volume: vol });
          }
        }
      });
    };
    container.appendChild(chip);
  });
}

function bMextSetType(type) {
  bExtType = type;
  document.getElementById('b-mext-type-brute').classList.toggle('active',   type === 'brute');
  document.getElementById('b-mext-type-planches').classList.toggle('active', type === 'planches');
  var titre = document.getElementById('b-mext-type-desc-titre');
  var body  = document.getElementById('b-mext-type-desc-body');
  var icon  = document.querySelector('#b-mext-type-desc .b-type-desc-icon');
  if (type === 'brute') {
    if (titre) titre.textContent = 'Grume brute';
    if (body)  body.textContent  = 'Volume brut sans transformation. Le m³ enregistré correspond au volume mesuré des grumes sélectionnées.';
    if (icon)  icon.textContent  = '🌳';
  } else {
    if (titre) titre.textContent = 'Débit en planches';
    if (body)  body.textContent  = 'Calcul du volume utile et du déchet selon l\'épaisseur de planche, le trait de scie et le rendement géométrique.';
    if (icon)  icon.textContent  = '🪚';
  }
}

function bMextStep1Suivant() {
  if (!bExtEssence) return;
  bMextInitGrumes();
  bMextGoStep(2);
}

function bMextInitGrumes() {
  var list = document.getElementById('b-mext-grumes-list');
  list.innerHTML = '';
  var selIds = bExtGrumesSel.map(function(g) { return g.lotId + '-' + g.index; });
  var parLot = {};
  bExtGrumes.forEach(function(g) {
    if (!parLot[g.lotId]) parLot[g.lotId] = { nom: g.lotNom, essence: g.essence, grumes: [] };
    parLot[g.lotId].grumes.push(g);
  });
  Object.keys(parLot).forEach(function(lotId) {
    var lot = parLot[lotId];
    var head = document.createElement('div');
    head.className = 'b-grumes-lot-head';
    head.appendChild(document.createTextNode(lot.nom));
    var badge = document.createElement('span'); badge.className = 'b-grumes-lot-badge'; badge.textContent = lot.essence;
    head.appendChild(badge);
    list.appendChild(head);
    lot.grumes.forEach(function(g) {
      var key = g.lotId + '-' + g.index;
      var row = document.createElement('div');
      row.className = 'b-grume-row' + (selIds.indexOf(key) !== -1 ? ' checked' : '');
      var chk = document.createElement('div'); chk.className = 'b-grume-check';
      row.appendChild(chk);
      var info = document.createElement('div'); info.className = 'b-grume-info';
      info.appendChild(document.createTextNode(bLabelGrume(g)));
      var metrics = document.createElement('span'); metrics.className = 'b-grume-metrics';
      metrics.textContent = bMetriquesGrume(g);
      info.appendChild(metrics);
      row.appendChild(info);
      var volDiv = document.createElement('div'); volDiv.className = 'b-grume-vol';
      volDiv.textContent = g.volume.toFixed(3) + ' m³';
      row.appendChild(volDiv);
      row.onclick = function() {
        row.classList.toggle('checked');
        if (row.classList.contains('checked')) {
          bExtGrumesSel.push(g);
        } else {
          bExtGrumesSel = bExtGrumesSel.filter(function(x) {
            return !(x.lotId === g.lotId && x.index === g.index);
          });
        }
        bMextMajVol();
        document.getElementById('b-mext-s2-next').disabled = bExtGrumesSel.length === 0;
      };
      list.appendChild(row);
    });
  });
  var sliders   = document.getElementById('b-mext-sliders');
  var blocUtile = document.getElementById('b-mext-bloc-utile');
  var blocDec   = document.getElementById('b-mext-bloc-dechet');
  sliders.style.display  = bExtType === 'planches' ? '' : 'none';
  if (blocUtile) blocUtile.style.display = bExtType === 'planches' ? '' : 'none';
  if (blocDec)   blocDec.style.display   = bExtType === 'planches' ? '' : 'none';
  document.getElementById('b-mext-sl-ep').value = 27;
  document.getElementById('b-mext-sl-ts').value = 3;
  document.getElementById('b-mext-sl-rg').value = 50;
  document.getElementById('b-mext-val-ep').textContent = '27 mm';
  document.getElementById('b-mext-val-ts').textContent = '3 mm';
  document.getElementById('b-mext-val-rg').textContent = '50 %';
  document.getElementById('b-mext-val-lin').textContent = '—';
  document.getElementById('b-mext-v-ext').textContent  = '—';
  document.getElementById('b-mext-v-util').textContent = '—';
  document.getElementById('b-mext-v-dec').textContent  = '—';
  document.getElementById('b-mext-s2-next').disabled = true;
}

function bMextMajSlider(id, val, unit) {
  document.getElementById(id).textContent = val + unit;
}

function bMextMajVol() {
  var volBrut = bExtGrumesSel.reduce(function(s, g) { return s + g.volume; }, 0);
  document.getElementById('b-mext-v-ext').textContent = volBrut > 0 ? volBrut.toFixed(3) : '—';
  if (bExtType === 'brute' || volBrut === 0) {
    document.getElementById('b-mext-v-util').textContent = '—';
    document.getElementById('b-mext-v-dec').textContent  = '—';
    document.getElementById('b-mext-val-lin').textContent = '—';
    return;
  }
  var ep   = parseInt(document.getElementById('b-mext-sl-ep').value);
  var ts   = parseInt(document.getElementById('b-mext-sl-ts').value);
  var rg   = parseInt(document.getElementById('b-mext-sl-rg').value) / 100;
  var util = volBrut * rg * (ep / (ep + ts));
  document.getElementById('b-mext-v-util').textContent = util.toFixed(3);
  document.getElementById('b-mext-v-dec').textContent  = (volBrut - util).toFixed(3);
  document.getElementById('b-mext-val-lin').textContent = (util * 5000 / ep).toFixed(1) + ' m';
}

function bMextStep2Suivant() {
  if (!bExtGrumesSel.length) return;
  var commEl = document.getElementById('b-mext-commune');
  if (commEl) commEl.textContent = bCommune ? bCommune.nom : '—';
  document.getElementById('b-mext-projet').value = '';
  document.getElementById('b-mext-lieu').value   = '';
  bExtUsageDest = 'Intérieur';
  document.getElementById('b-mext-usage-int').classList.add('active');
  document.getElementById('b-mext-usage-ext').classList.remove('active');
  bMextGoStep(3);
}

function bMextSetUsage(usage) {
  bExtUsageDest = usage;
  document.getElementById('b-mext-usage-int').classList.toggle('active', usage === 'Intérieur');
  document.getElementById('b-mext-usage-ext').classList.toggle('active', usage === 'Extérieur');
}

async function bMextConfirmer() {
  var volBrut = bExtGrumesSel.reduce(function(s, g) { return s + g.volume; }, 0);
  var projet  = document.getElementById('b-mext-projet').value.trim();
  var lieu    = document.getElementById('b-mext-lieu').value.trim();
  var comm    = bCommune ? bCommune.nom : '';
  var ep      = parseInt(document.getElementById('b-mext-sl-ep').value);
  var ts      = parseInt(document.getElementById('b-mext-sl-ts').value);
  var rg      = parseInt(document.getElementById('b-mext-sl-rg').value) / 100;
  var volUtil  = bExtType === 'planches' ? volBrut * rg * (ep / (ep + ts)) : volBrut;
  var lineaire = bExtType === 'planches' ? volUtil * 5000 / ep : 0;
  var dest = [projet, comm, lieu].filter(Boolean).join(' · ') || '—';
  var valid = DuramenCore.validerSortie({ essence: bExtEssence, volume: volUtil, usage: bExtUsageDest, destination: dest });
  if (!valid.ok) { bShowToast(valid.erreur, true); return; }
  bShowLoading(true);
  try {
    var ext = {
      id:                 crypto.randomUUID(),
      commune_code:       bCommune.code,
      commune:            bCommune.nom,
      essence:            bExtEssence,
      volume:             volUtil,
      vol_brut_extrait:   volBrut,
      type_valorisation:  bExtType,
      lineaire:           lineaire > 0 ? Math.round(lineaire * 10) / 10 : null,
      usage:              bExtUsageDest,
      destination:        dest,
      projet:             projet || null,
      commune_installation: comm || null,
      date:               new Date().toLocaleDateString('fr-FR'),
      date_iso:           new Date().toISOString()
    };
    await bSbInsert('extractions', ext);
    bShowLoading(false);
    bFermerModalExt();
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
