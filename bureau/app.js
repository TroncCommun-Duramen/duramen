// bureau/app.js — Interface bureau DURAMEN
// Pour les ateliers de menuiserie et les responsables.
// Parcours : grumes en stock → campagne de sciage → produits bois → projet
// (sortie, réalisation, pose) → export tableur.
// La saisie des grumes reste sur le terrain, dans la version mobile.
//
// Mêmes règles et mêmes données que la version mobile (app.js à la racine) :
// le calcul passe par DuramenCore (core.js), les lignes envoyées à la base
// ont exactement la même forme. `lots` et `extractions` sont lus par DuramenCore.

// ═══════════ SUPABASE ═══════════
const SUPABASE_URL = 'https://zeadibimbdztpmsesaiw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYWRpYmltYmR6dHBtc2VzYWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTI2MTcsImV4cCI6MjA5MDQ2ODYxN30.xEHLNTROTu9QJ7c_vV3S54P76EXfpnx2VbhxznbQmmU';
const bH = {
  'Content-Type':   'application/json',
  'apikey':         SUPABASE_KEY,
  'Authorization':  'Bearer ' + SUPABASE_KEY,
  'Prefer':         'return=minimal',
  'x-commune-code': ''
};

var DELAI_LECTURE_MS = 15000;
var DELAI_ENVOI_MS   = 20000;

// Erreur « pas de réseau » : la requête n'a pas abouti. À distinguer d'un
// refus de la base (stock changé, grume déjà réservée…), qui a un message.
function bErreurReseau(quoi) {
  var err = new Error('Pas de réseau (' + quoi + ')');
  err.reseau = true;
  return err;
}

async function bRequete(chemin, options, ms, quoi) {
  var ctrl  = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, ms);
  var res, texte;
  try {
    res   = await fetch(SUPABASE_URL + '/rest/v1/' + chemin, Object.assign({ headers: bH }, options, { signal: ctrl.signal }));
    texte = await res.text();
  } catch (e) {
    throw bErreurReseau(quoi);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    // Le message de refus de la base (« GRUME DÉJÀ RÉSERVÉE… ») est lu tel quel
    var detail = texte;
    try { detail = JSON.parse(texte).message || texte; } catch (e) {}
    var err = new Error(quoi + ' : ' + res.status + ' ' + detail + (/"code"\s*:\s*"23503"/.test(texte) ? ' (23503)' : ''));
    err.statut = res.status;
    throw err;
  }
  return texte ? JSON.parse(texte) : null;
}

function bSbSelect(table, filter) {
  return bRequete(table + '?' + (filter || ''), {}, DELAI_LECTURE_MS, table);
}
function bSbInsert(table, data) {
  return bRequete(table, { method: 'POST', body: JSON.stringify(data) }, DELAI_ENVOI_MS, table);
}
function bSbDelete(table, id) {
  return bRequete(table + '?id=eq.' + encodeURIComponent(id), { method: 'DELETE' }, DELAI_ENVOI_MS, table);
}
function bSbRpc(fonction, params) {
  return bRequete('rpc/' + fonction, { method: 'POST', body: JSON.stringify(params || {}) }, DELAI_ENVOI_MS, fonction);
}

// ═══════════ ÉTAT ═══════════
// `lots` et `extractions` : noms imposés par DuramenCore.
var lots           = [];
var extractions    = [];
var campagnes      = [];
var bCommune       = null;
var bMetroGrumes   = [];
var bMetroProduits = [];
var bOnglet        = 'grumes';
var bFeedbackType  = null;
var bDernierChargement = 0;

var ONGLETS = ['grumes', 'campagnes', 'produits', 'projets', 'metropole', 'export', 'feedback'];
var RAFRAICHISSEMENT_MS = 120000;   // comme la version mobile : toutes les 2 minutes

// ═══════════ OUTILS ═══════════
function el(tag, cls, txt) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined && txt !== null) e.textContent = txt;
  return e;
}
function vider(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
function bouton(cls, txt, action) {
  var b = el('button', cls, txt);
  b.type = 'button';
  b.onclick = action;
  return b;
}

// Le millième de m³ (1 dm³) : usage de la filière bois, comme sur le mobile.
function arrondiM3(v) { return Math.round((v || 0) * 1000) / 1000; }
function m3(v) { return (parseFloat(v) || 0).toFixed(3) + ' m³'; }
function fmtNb(v, dec) { return (parseFloat(v) || 0).toFixed(dec).replace('.', ','); }
function fmtDate(d) {
  if (!d) return '—';
  var x = new Date(String(d).length === 10 ? d + 'T12:00:00' : d);
  return isNaN(x) ? '—' : x.toLocaleDateString('fr-FR');
}
function jourISO(d) {
  var x = d || new Date();
  return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2);
}
function pl(n, singulier, pluriel) { return n + ' ' + (n > 1 ? (pluriel || singulier + 's') : singulier); }
function calcVol(d, l) { return Math.PI * Math.pow(d / 200, 2) * l; }
function lireLocal(cle) {
  try { return JSON.parse(localStorage.getItem(cle) || 'null'); } catch (e) { return null; }
}
function ecrireLocal(cle, v) { try { localStorage.setItem(cle, JSON.stringify(v)); } catch (e) {} }
function effacerLocal(cle) { try { localStorage.removeItem(cle); } catch (e) {} }

// Même règle que la version mobile :
// - la sortie emporte les dernières grumes de l'essence : elle vaut
//   exactement le stock restant ;
// - sinon, un dépassement de 1 dm³ par grume au plus est ramené au stock.
function volumeSortie(essence, volume, videEssence) {
  var v = arrondiM3(volume);
  var s = DuramenCore.getStock()[essence];
  if (!s) return v;
  if (videEssence) return s.dispo;
  var tolerance = 0.001 * Math.max(1, s.nbGrumes);
  if (v > s.dispo && v - s.dispo <= tolerance) v = s.dispo;
  return v;
}

// ═══════════ UI ═══════════
function bShowLoading(on) {
  document.getElementById('b-loading').classList.toggle('hidden', !on);
}
var bToastTimer = null;
function bShowToast(msg, isErr) {
  var t = document.getElementById('b-toast');
  t.textContent = msg;
  t.classList.toggle('b-toast-erreur', !!isErr);
  t.classList.remove('hidden');
  clearTimeout(bToastTimer);
  bToastTimer = setTimeout(function () { t.classList.add('hidden'); }, isErr ? 7000 : 3500);
}
function bBandeauReseau(visible) {
  document.getElementById('b-bandeau-reseau').classList.toggle('hidden', !visible);
}

// ─── Fenêtres ─────────────────────────────────────────────────────────────
// Une seule fenêtre à la fois. Elle ne se ferme que par ses boutons : un clic
// à côté ne fait pas perdre la saisie.
function bModaleOuverte() {
  return !!document.getElementById('b-modales').firstChild;
}
function bFermerModale() {
  vider(document.getElementById('b-modales'));
  bRendre();   // rattrape un rafraîchissement arrivé pendant la saisie
}
function bOuvrirModale(titre, sousTitre, large) {
  var racine = document.getElementById('b-modales');
  vider(racine);
  var fond  = el('div', 'b-modale-fond');
  var carte = el('div', 'b-modale' + (large ? ' b-modale-large' : ''));
  var tete  = el('div', 'b-modale-tete');
  var haut  = el('div', 'b-modale-tete-haut');
  haut.appendChild(el('div', 'b-modale-titre', titre));
  var x = bouton('b-modal-fermer', '✕', bFermerModale);
  x.setAttribute('aria-label', 'Fermer');
  haut.appendChild(x);
  tete.appendChild(haut);
  if (sousTitre) tete.appendChild(el('div', 'b-modale-sous', sousTitre));
  var corps = el('div', 'b-modale-corps');
  var pied  = el('div', 'b-modale-pied');
  carte.appendChild(tete);
  carte.appendChild(corps);
  carte.appendChild(pied);
  fond.appendChild(carte);
  racine.appendChild(fond);
  return { corps: corps, pied: pied };
}

function bChamp(labelTxt, input, cls) {
  var f = el('label', 'b-champ' + (cls ? ' ' + cls : ''));
  f.appendChild(el('span', 'b-champ-lbl', labelTxt));
  f.appendChild(input);
  return f;
}
function bInput(type, valeur, attrs) {
  var i = document.createElement('input');
  i.type = type;
  i.className = 'b-input';
  if (valeur !== undefined && valeur !== null) i.value = valeur;
  Object.keys(attrs || {}).forEach(function (k) { i.setAttribute(k, attrs[k]); });
  return i;
}

// ─── Tableaux ─────────────────────────────────────────────────────────────
// cellules : texte, nœud, ou { t: texte, cls: classe }
function bTr(cellules, cls) {
  var tr = el('tr', cls || '');
  cellules.forEach(function (c) {
    var td = el('td');
    if (c instanceof Node) td.appendChild(c);
    else if (c && typeof c === 'object') { td.textContent = c.t; if (c.cls) td.className = c.cls; if (c.span) td.colSpan = c.span; }
    else td.textContent = (c === null || c === undefined) ? '' : c;
    tr.appendChild(td);
  });
  return tr;
}
function bTrVide(nbCol, texte) {
  return bTr([{ t: texte, cls: 'b-td-vide', span: nbCol }]);
}

// ═══════════ AUTH ═══════════
async function bTentativeConnexion() {
  var input  = document.getElementById('b-login-code');
  var erreur = document.getElementById('b-login-erreur');
  var code   = (input.value || '').trim().toUpperCase();
  erreur.textContent = '';
  if (!code) { erreur.textContent = 'Entrez votre code d\'accès.'; return; }

  bShowLoading(true);
  try {
    var data = await bRequete('rpc/verifier_code', {
      method: 'POST', headers: Object.assign({}, bH, { 'Prefer': 'return=representation' }),
      body: JSON.stringify({ code_saisi: code })
    }, DELAI_LECTURE_MS, 'Vérification du code');
    bShowLoading(false);
    if (!data || !data.length) { erreur.textContent = 'Code invalide ou inactif.'; return; }
    bCommune = { code: data[0].code, nom: data[0].commune };
    localStorage.setItem('duramen_bureau_session', JSON.stringify(bCommune));
    bLancerApp();
  } catch (e) {
    bShowLoading(false);
    erreur.textContent = e.reseau ? 'Pas de réseau : la connexion se fait avec réseau.' : 'Erreur : ' + e.message;
  }
}

function bDeconnecter() {
  localStorage.removeItem('duramen_bureau_session');
  bCommune = null; lots = []; extractions = []; campagnes = [];
  bMetroGrumes = []; bMetroProduits = [];
  vider(document.getElementById('b-modales'));
  document.getElementById('b-connexion').classList.remove('hidden');
  document.getElementById('b-app').classList.add('hidden');
  document.getElementById('b-login-code').value = '';
}

function bLancerApp() {
  // L'en-tête x-commune-code est exigé par les règles de la base : sans lui,
  // elle renvoie du vide sans erreur. Posé ici pour couvrir aussi la session
  // restaurée au rechargement de la page.
  bH['x-commune-code'] = bCommune.code;
  document.getElementById('b-connexion').classList.add('hidden');
  document.getElementById('b-app').classList.remove('hidden');
  document.getElementById('b-commune-badge').textContent = bCommune.nom;
  bChargerDonnees();
}

// ═══════════ DONNÉES ═══════════
// `options.silencieux` : rafraîchissement automatique. Pas de voile
// « Chargement », pas de message répété, et l'écran n'est pas reconstruit
// si une fenêtre de saisie est ouverte (la saisie en cours est gardée).
// Retourne true si les données sont fraîches.
async function bChargerDonnees(options) {
  if (!bCommune) return false;
  var silencieux = !!(options && options.silencieux);
  // `options.interne` : appelé au milieu d'un enregistrement, qui gère
  // lui-même le voile « Chargement » et ses messages.
  var discret = silencieux || !!(options && options.interne);
  var pour = bCommune.code;
  if (!discret) bShowLoading(true);
  try {
    var code = encodeURIComponent(pour);
    var r = await Promise.all([
      bSbSelect('grumes',      'commune_code=eq.' + code + '&order=created_at.desc'),
      bSbSelect('extractions', 'commune_code=eq.' + code + '&order=created_at.desc'),
      bSbSelect('campagnes',   'commune_code=eq.' + code + '&order=created_at.desc')
    ]);
    if (!bCommune || bCommune.code !== pour) return false;   // déconnexion entre-temps
    lots = (r[0] || []).map(function (l) { return Object.assign({}, l, { grumes: l.grumes || [] }); });
    extractions = r[1] || [];
    campagnes   = r[2] || [];
    bDernierChargement = Date.now();
    bBandeauReseau(false);
    // Métropole : lecture seule, ne bloque jamais le travail de la commune
    try {
      var m = await Promise.all([
        bSbSelect('rpc/grumes_en_stock_partagees', ''),
        bSbSelect('rpc/produits_partages', '')
      ]);
      bMetroGrumes   = m[0] || [];
      bMetroProduits = bNormaliserProduitsPartages(m[1]);
    } catch (e2) { /* la vue métropole garde ses dernières données */ }
    if (!(silencieux && bModaleOuverte())) bRendre();
    return true;
  } catch (e) {
    if (e.reseau) bBandeauReseau(true);
    else if (!discret) bShowToast('Erreur de chargement : ' + e.message, true);
    return false;
  } finally {
    if (!discret) bShowLoading(false);
  }
}

function bNormaliserProduitsPartages(rows) {
  return (rows || []).map(function (r) {
    return {
      cle: r.cle, commune: r.commune, essence: r.essence, type: r.type,
      epaisseur_mm: r.epaisseur_mm, largeur_mm: r.largeur_mm, longueur_m: r.longueur_m,
      quantite: parseFloat(r.quantite) || 0, restant: parseFloat(r.quantite_restante) || 0,
      volumeRestant: parseFloat(r.volume_restant) || 0, grume_nom: '',
      dateSciage: r.date_sciage,
      dateSecAir: DuramenCore.dateSecAir(r.date_sciage, { type: r.type, epaisseur_mm: r.epaisseur_mm, largeur_mm: r.largeur_mm })
    };
  });
}

// ─── États calculés (jamais enregistrés), comme sur le mobile ─────────────
// Une campagne est clôturée dès qu'un sciage y est rattaché.
function campagneCloturee(c) {
  return extractions.some(function (e) { return e.campagne_id === c.id; });
}
function campagnesOuvertes() {
  return campagnes.filter(function (c) { return !campagneCloturee(c); });
}
// Grumes réservées par une campagne ouverte : id de grume → campagne
function grumesADebiter() {
  var map = {};
  campagnesOuvertes().forEach(function (c) {
    (c.lignes || []).forEach(function (l) { map[l.grume_id] = c; });
  });
  return map;
}
function clesGrumesSorties() {
  var cles = {};
  extractions.forEach(function (ex) {
    (ex.grumes_keys || []).forEach(function (k) { cles[k] = ex; });
  });
  return cles;
}
function grumesParUrgence(liste) {
  var now = new Date();
  return liste.slice().sort(function (a, b) {
    return DuramenCore.urgenceDebitGrume(b, now).ratio - DuramenCore.urgenceDebitGrume(a, now).ratio;
  });
}
// Grumes libres : en stock brut et dans aucune campagne en préparation
function grumesLibres() {
  var reservees = grumesADebiter();
  return DuramenCore.getGrumesEnStock().filter(function (g) { return !reservees[g.id]; });
}
function nbGrumesRestantes(essence) {
  return DuramenCore.getGrumesEnStock().filter(function (g) { return g.essence === essence; }).length;
}

function nomGrume(g) {
  return DuramenCore.estNumerotee(g) ? g.nom : 'En attente de marquage';
}
function texteDimensions(g) {
  var m = DuramenCore.mesuresGrume(g);
  return fmtNb(m.longueur, 2) + ' m × ' + m.diametre + ' cm';
}
function texteAbattage(g) {
  if (DuramenCore.abattageInconnu(g)) return 'Date inconnue';
  return fmtDate(g.date_abattage || g.date_iso || g.created_at);
}
function texteDemande(l) {
  if (Array.isArray(l.debits) && l.debits.length) {
    return l.debits.map(function (d) {
      var q = ' · ' + d.quantite + (d.type === 'avive' ? ' pièce' : ' planche') + (d.quantite > 1 ? 's' : '');
      return d.type === 'avive'
        ? 'Avivé ' + d.epaisseur_mm + ' × ' + d.largeur_mm + ' mm' + q
        : 'Plot ' + d.epaisseur_mm + ' mm' + q;
    }).join(' + ');
  }
  var est = l.estimation_quantite ? ' · ~' + l.estimation_quantite + (l.type === 'avive' ? ' pièces' : ' planches') : '';
  if (l.type === 'avive') return 'Avivé · ' + l.epaisseur_mm + ' × ' + l.largeur_mm + ' mm' + est;
  return 'Plot · ' + l.epaisseur_mm + ' mm' + est;
}
function texteProduit(p) {
  var lon = fmtNb(p.longueur_m, 2) + ' m';
  if (p.type === 'avive') return 'Avivé ' + p.epaisseur_mm + ' × ' + p.largeur_mm + ' mm · ' + lon;
  return 'Plot ' + p.epaisseur_mm + ' mm · ' + lon;
}
function unitePieces(type, n) {
  return type === 'avive' ? (n > 1 ? 'pièces' : 'pièce') : (n > 1 ? 'planches' : 'planche');
}

// ─── Badges ───────────────────────────────────────────────────────────────
function bBadgeUrgence(g) {
  var u = DuramenCore.urgenceDebitGrume(g);
  var txt;
  if (u.inconnue)                  txt = 'Date inconnue — à débiter vite';
  else if (u.niveau === 'depasse') txt = 'Délai dépassé (' + fmtDate(u.dateLimite) + ')';
  else if (u.niveau === 'alerte')  txt = 'Urgent — avant le ' + fmtDate(u.dateLimite);
  else                             txt = 'Avant le ' + fmtDate(u.dateLimite);
  return el('span', 'b-badge b-badge-' + u.niveau, txt);
}
function bBadgeSechage(dateSec) {
  var sec = new Date(dateSec) <= new Date();
  return el('span', 'b-badge ' + (sec ? 'b-badge-sec' : 'b-badge-sechage'),
    sec ? 'Sec à l\'air' : 'En séchage — sec le ' + fmtDate(dateSec));
}

// ═══════════ RENDU GÉNÉRAL ═══════════
function bRendre() {
  if (!bCommune) return;
  bMettreAJourHeader();
  bMettreAJourFooter();
  bAfficherOnglet();
}

function bMettreAJourHeader() {
  var grumes   = DuramenCore.getGrumesEnStock();
  var volG     = grumes.reduce(function (s, g) { return s + (g.vol_utile || 0); }, 0);
  var urgentes = grumes.filter(function (g) { return DuramenCore.urgenceDebitGrume(g).niveau !== 'ok'; }).length;
  document.getElementById('b-stat-grumes').textContent     = volG.toFixed(1) + ' m³';
  document.getElementById('b-stat-grumes-sub').textContent = pl(grumes.length, 'grume')
    + (urgentes ? ' · ' + urgentes + ' à débiter vite' : '');

  var ouvertes = campagnesOuvertes();
  var nbRes    = ouvertes.reduce(function (s, c) { return s + (c.lignes || []).length; }, 0);
  document.getElementById('b-stat-camp').textContent     = String(ouvertes.length);
  document.getElementById('b-stat-camp-sub').textContent = ouvertes.length
    ? 'en préparation · ' + pl(nbRes, 'grume') + ' à débiter' : 'aucune en préparation';

  var produits = DuramenCore.getStockProduits();
  var volP     = produits.reduce(function (s, l) { return s + (l.volumeRestant || 0); }, 0);
  var pieces   = produits.reduce(function (s, l) { return s + (l.restant || 0); }, 0);
  var now      = new Date();
  var secs     = produits.filter(function (l) { return new Date(l.dateSecAir) <= now; })
                         .reduce(function (s, l) { return s + (l.restant || 0); }, 0);
  document.getElementById('b-stat-produits').textContent     = volP.toFixed(1) + ' m³';
  document.getElementById('b-stat-produits-sub').textContent = pl(pieces, 'pièce')
    + (pieces ? ' · ' + secs + ' sèche' + (secs > 1 ? 's' : '') + ' à l\'air' : '');

  var projets = bProjets();
  var poses   = projets.filter(function (p) { return p.etape === 'pose'; }).length;
  document.getElementById('b-stat-projets').textContent     = String(projets.length - poses);
  document.getElementById('b-stat-projets-sub').textContent = 'en cours · ' + pl(poses, 'posé');
}

function bMettreAJourFooter() {
  var labels = { grumes: 'Grumes', campagnes: 'Campagnes de sciage', produits: 'Produits bois',
                 projets: 'Projets', metropole: 'Métropole', export: 'Export tableur', feedback: 'Ticket retour' };
  var volMG = bMetroGrumes.reduce(function (s, l) { return s + (parseFloat(l.vol_utile) || 0); }, 0);
  var volMP = bMetroProduits.reduce(function (s, l) { return s + (l.volumeRestant || 0); }, 0);
  document.getElementById('b-footer-gauche').textContent = (bCommune ? bCommune.nom : '') + ' · ' + (labels[bOnglet] || '')
    + (bDernierChargement ? ' · données de ' + new Date(bDernierChargement).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '');
  document.getElementById('b-footer-droite').textContent = 'Métropole : ' + volMG.toFixed(1) + ' m³ de grumes · '
    + volMP.toFixed(1) + ' m³ de produits';
}

// ═══════════ NAVIGATION ═══════════
function bSwitchTab(onglet) {
  bOnglet = onglet;
  ONGLETS.forEach(function (o) {
    document.getElementById('b-tab-' + o).classList.toggle('active', o === onglet);
    document.getElementById('b-panel-' + o).classList.toggle('active', o === onglet);
  });
  bMettreAJourFooter();
  bAfficherOnglet();
}

function bAfficherOnglet() {
  if (bOnglet === 'grumes')    bAfficherGrumes();
  if (bOnglet === 'campagnes') bAfficherCampagnes();
  if (bOnglet === 'produits')  bAfficherProduits();
  if (bOnglet === 'projets')   bAfficherProjets();
  if (bOnglet === 'metropole') bAfficherMetropole();
  if (bOnglet === 'export')    bMajExport();
}

// ═══════════ 1 · GRUMES ═══════════
var NB_TEINTES = 8;   // dégradé d'indigo défini dans ui.css (.b-teinte-0 … 7)
var SVG_NS = 'http://www.w3.org/2000/svg';

function bPiePath(cx, cy, r, a0, a1) {
  if (a1 - a0 >= 2 * Math.PI) a1 = a0 + 2 * Math.PI - 0.0001;
  var x1 = cx + r * Math.cos(a0), y1 = cy + r * Math.sin(a0);
  var x2 = cx + r * Math.cos(a1), y2 = cy + r * Math.sin(a1);
  var large = (a1 - a0) > Math.PI ? 1 : 0;
  return 'M ' + cx + ' ' + cy + ' L ' + x1.toFixed(2) + ' ' + y1.toFixed(2) +
    ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2) + ' Z';
}

function bDessinerEssences(grumes) {
  var svg     = document.getElementById('b-grumes-donut-svg');
  var legende = document.getElementById('b-grumes-donut-legende');
  vider(svg); vider(legende);
  var parEss = {};
  grumes.forEach(function (g) { parEss[g.essence || 'Autre'] = (parEss[g.essence || 'Autre'] || 0) + (g.vol_utile || 0); });
  var essences = Object.keys(parEss).sort(function (a, b) { return parEss[b] - parEss[a]; });
  var total = essences.reduce(function (s, k) { return s + parEss[k]; }, 0);
  if (total === 0) { legende.appendChild(el('span', 'b-donut-vide', 'Aucune grume en stock.')); return; }

  var cx = 100, cy = 100, r = 92, a0 = -Math.PI / 2;
  essences.forEach(function (ess, i) {
    var pct = parEss[ess] / total;
    var a1  = a0 + pct * 2 * Math.PI;
    var path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', bPiePath(cx, cy, r, a0, a1));
    path.setAttribute('class', 'b-teinte-' + (i % NB_TEINTES));
    svg.appendChild(path);
    if (pct > 0.05) {
      var mid = a0 + (a1 - a0) / 2;
      var txt = document.createElementNS(SVG_NS, 'text');
      txt.setAttribute('x', (cx + r * 0.63 * Math.cos(mid)).toFixed(1));
      txt.setAttribute('y', (cy + r * 0.63 * Math.sin(mid)).toFixed(1));
      txt.setAttribute('class', 'b-donut-txt');
      txt.textContent = Math.round(pct * 100) + '%';
      svg.appendChild(txt);
    }
    a0 = a1;
    var item = el('div', 'b-commune-donut-item');
    item.appendChild(el('div', 'b-commune-donut-dot b-teinte-' + (i % NB_TEINTES)));
    item.appendChild(el('strong', '', ess));
    item.appendChild(el('span', 'b-donut-pct', m3(parEss[ess]) + ' · ' + Math.round(pct * 100) + '%'));
    legende.appendChild(item);
  });
}

function bAfficherGrumes() {
  var grumes    = grumesParUrgence(DuramenCore.getGrumesEnStock());
  var reservees = grumesADebiter();
  bDessinerEssences(grumes);

  var tbody = document.getElementById('b-grumes-tbody');
  vider(tbody);
  if (grumes.length === 0) { tbody.appendChild(bTrVide(8, 'Aucune grume en stock brut.')); return; }
  var total = 0;
  grumes.forEach(function (g) {
    total += g.vol_utile || 0;
    var etat;
    if (reservees[g.id])                      etat = el('span', 'b-badge b-badge-campagne', 'À débiter — ' + (reservees[g.id].nom || 'campagne'));
    else if (!DuramenCore.estNumerotee(g))    etat = el('span', 'b-badge b-badge-alerte', 'En attente de marquage');
    else                                      etat = el('span', 'b-badge b-badge-neutre', 'En stock');
    var nom = DuramenCore.estNumerotee(g) ? g.nom : (g.repere ? '— (repère : ' + g.repere + ')' : '—');
    tbody.appendChild(bTr([
      { t: nom, cls: 'b-essence-nom' }, g.essence || '—', texteDimensions(g),
      { t: m3(g.vol_utile), cls: 'b-vol' }, texteAbattage(g),
      { t: g.provenance || '—', cls: 'b-provenance' }, bBadgeUrgence(g), etat
    ]));
  });
  tbody.appendChild(bTr([pl(grumes.length, 'grume'), '', '', { t: m3(total), cls: 'b-vol' }, '', '', '', ''], 'b-tr-total'));
}

// ─── Sortie d'une grume entière (exception : rondins, pas japonais…) ──────
function bOuvrirSortieGrume() {
  var libres = grumesLibres().sort(function (a, b) {
    return (a.essence || '').localeCompare(b.essence || '') || nomGrume(a).localeCompare(nomGrume(b));
  });
  var sel = {};
  var md  = bOuvrirModale('Sortir une grume entière',
    'Exception : la grume sort sans sciage (rondins, pas japonais…). Les grumes prévues dans une campagne de sciage ne sont pas proposées.');

  md.corps.appendChild(el('div', 'b-section-lbl', 'GRUMES DISPONIBLES'));
  var liste = el('div', 'b-liste-cochable');
  var synth = el('div', 'b-synthese', 'Aucune grume choisie.');
  function majSynth() {
    var ch  = libres.filter(function (g) { return sel[g.id]; });
    var vol = ch.reduce(function (s, g) { var m = DuramenCore.mesuresGrume(g); return s + calcVol(m.diametre, m.longueur); }, 0);
    synth.textContent = ch.length ? pl(ch.length, 'grume') + ' — ' + m3(vol) : 'Aucune grume choisie.';
  }
  if (libres.length === 0) liste.appendChild(el('div', 'b-td-vide', 'Aucune grume disponible.'));
  libres.forEach(function (g) {
    var m   = DuramenCore.mesuresGrume(g);
    var row = el('div', 'b-grume-row');
    row.appendChild(el('div', 'b-grume-check'));
    var info = el('div', 'b-grume-info', nomGrume(g) + ' · ' + (g.essence || ''));
    info.appendChild(el('span', 'b-grume-metrics', texteDimensions(g) + (g.repere ? ' · ' + g.repere : '')));
    row.appendChild(info);
    row.appendChild(el('div', 'b-grume-vol', m3(calcVol(m.diametre, m.longueur))));
    row.onclick = function () {
      sel[g.id] = !sel[g.id];
      row.classList.toggle('checked', !!sel[g.id]);
      majSynth();
    };
    liste.appendChild(row);
  });
  md.corps.appendChild(liste);

  var iProjet = bInput('text', '', { placeholder: 'Ex. : pas japonais du parc, bordures…', maxlength: '120' });
  var iLieu   = bInput('text', '', { placeholder: 'Ex. : parc de la mairie, école…', maxlength: '120' });
  md.corps.appendChild(bChamp('Nom du projet', iProjet));
  md.corps.appendChild(bChamp('Lieu prévu (optionnel)', iLieu));

  md.pied.appendChild(synth);
  md.pied.appendChild(bouton('b-btn b-btn-ghost', 'Annuler', bFermerModale));
  md.pied.appendChild(bouton('b-btn b-btn-primary', 'Enregistrer la sortie', function () {
    bConfirmerSortieGrume(Object.keys(sel).filter(function (k) { return sel[k]; }), iProjet.value.trim(), iLieu.value.trim());
  }));
}

async function bConfirmerSortieGrume(ids, projet, lieu) {
  if (ids.length === 0) { bShowToast('Choisissez au moins une grume.', true); return; }
  if (!projet) { bShowToast('Indiquez le nom du projet.', true); return; }
  bShowLoading(true);
  try {
    // Données fraîches : un agent sur le terrain a pu sortir ou réserver une
    // de ces grumes pendant la saisie.
    if (!await bChargerDonnees({ interne: true })) { bShowToast('Pas de réseau : la sortie se fait avec réseau.', true); return; }
    var libres = {};
    grumesLibres().forEach(function (g) { libres[g.id] = g; });
    var perdue = ids.find(function (id) { return !libres[id]; });
    if (perdue) {
      bShowToast('Le stock a changé entre-temps : une grume choisie vient d\'être sortie ou réservée. Refaites votre choix.', true);
      bOuvrirSortieGrume();
      return;
    }
    var parEss = {};
    ids.forEach(function (id) {
      var g = libres[id], m = DuramenCore.mesuresGrume(g);
      var e = parEss[g.essence] = parEss[g.essence] || { vol: 0, cles: [] };
      e.vol += calcVol(m.diametre, m.longueur);
      e.cles.push(g.id + '_0');
    });
    var essences = Object.keys(parEss);
    var usage = 'Non défini';   // exigé par DuramenCore.validerSortie (noyau figé)
    for (var i = 0; i < essences.length; i++) {
      var e = parEss[essences[i]];
      e.volume = volumeSortie(essences[i], e.vol, e.cles.length === nbGrumesRestantes(essences[i]));
      var valid = DuramenCore.validerSortie({ essence: essences[i], volume: e.volume, usage: usage, destination: projet });
      if (!valid.ok) { bShowToast(valid.erreur, true); return; }
    }
    var now = new Date();
    // Même forme que la version mobile. Envoi groupé : tout passe ou rien.
    await bSbInsert('extractions', essences.map(function (ess) {
      return {
        id:           crypto.randomUUID(),
        commune_code: bCommune.code,
        essence:      ess,
        volume:       arrondiM3(parEss[ess].volume),
        usage:        usage,
        destination:  projet,
        commune:      bCommune.nom,
        contact:      '',
        notes:        lieu ? 'Lieu : ' + lieu : '',
        type_sortie:  'grume brute',
        grumes_keys:  parEss[ess].cles,
        date:         now.toLocaleDateString('fr-FR'),
        date_iso:     now.toISOString()
      };
    }));
    vider(document.getElementById('b-modales'));
    await bChargerDonnees({ interne: true });
    bShowToast('Sortie enregistrée. Le projet « ' + projet + ' » est à suivre dans l\'onglet Projets.');
  } catch (err) {
    await bRefusSortie(err, bOuvrirSortieGrume);
  } finally {
    bShowLoading(false);
  }
}

// Refus d'une sortie par la base : un autre poste est passé juste avant.
// Message clair, données rechargées, fenêtre reconstruite sur le stock réel.
async function bRefusSortie(err, rouvrir) {
  if (err.reseau) { bShowToast('Pas de réseau : rien n\'a été enregistré. Réessayez avec réseau.', true); return; }
  var m = err.message || '';
  var msg = null;
  if (/GRUME DÉJÀ SORTIE/.test(m))            msg = 'Une grume choisie vient d\'être sortie depuis un autre poste. Rien n\'a été enregistré.';
  else if (/GRUME RÉSERVÉE/.test(m))          msg = 'Une grume choisie vient d\'être mise dans une campagne de sciage. Rien n\'a été enregistré.';
  else if (/STOCK PRODUIT INSUFFISANT|PRODUIT INTROUVABLE/.test(m))
                                              msg = 'Le stock de produits a changé entre-temps. Rien n\'a été enregistré.';
  else if (/STOCK INSUFFISANT/.test(m))       msg = 'Le stock a changé entre-temps. Rien n\'a été enregistré.';
  if (!msg) { bShowToast('Erreur : ' + m, true); return; }
  bShowToast(msg, true);
  await bChargerDonnees({ interne: true });
  if (rouvrir) rouvrir();
}

// ═══════════ 2 · CAMPAGNES DE SCIAGE ═══════════
function bAfficherCampagnes() {
  var zone = document.getElementById('b-camp-ouvertes');
  vider(zone);
  var ouvertes = campagnesOuvertes();
  if (ouvertes.length === 0) zone.appendChild(el('div', 'b-vide', 'Aucune campagne en préparation.'));
  ouvertes.forEach(function (c) {
    var lignes = c.lignes || [];
    var volEst = lignes.reduce(function (s, l) { return s + (parseFloat(l.estimation_volume) || 0); }, 0);
    var carte  = el('div', 'b-carte');
    var tete   = el('div', 'b-carte-tete');
    var titre  = el('div', '');
    titre.appendChild(el('div', 'b-carte-titre', c.nom || 'Campagne'));
    titre.appendChild(el('div', 'b-carte-meta', 'Sciage prévu le ' + fmtDate(c.date_prevue) + ' · ' + pl(lignes.length, 'grume')
      + ' · ≈ ' + m3(volEst) + ' de produits demandés'));
    tete.appendChild(titre);
    var acts = el('div', 'b-carte-actions');
    acts.appendChild(bouton('b-btn b-btn-ghost', 'Feuille de débit', function () { bOuvrirFeuilleDebit(c); }));
    acts.appendChild(bouton('b-btn b-btn-primary', 'Clôturer', function () { bOuvrirCloture(c); }));
    acts.appendChild(bouton('b-btn b-btn-danger', 'Supprimer', function () { bSupprimerCampagne(c); }));
    tete.appendChild(acts);
    carte.appendChild(tete);
    carte.appendChild(bTableLignesCampagne(c));
    zone.appendChild(carte);
  });

  var tbody = document.getElementById('b-camp-closes-tbody');
  vider(tbody);
  var closes = campagnes.filter(campagneCloturee).map(function (c) {
    var sc = extractions.filter(function (e) { return e.campagne_id === c.id; });
    return {
      nom: c.nom || 'Campagne', date: sc[0].date_iso, grumes: sc.length,
      pieces: sc.reduce(function (s, e) { return s + (e.produits || []).reduce(function (t, p) { return t + (parseFloat(p.quantite) || 0); }, 0); }, 0),
      volGrumes: sc.reduce(function (s, e) { return s + (parseFloat(e.volume) || 0); }, 0),
      volProduits: sc.reduce(function (s, e) { return s + (parseFloat(e.vol_produits) || 0); }, 0)
    };
  }).sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
  if (closes.length === 0) { tbody.appendChild(bTrVide(6, 'Aucune campagne clôturée.')); return; }
  closes.forEach(function (c) {
    tbody.appendChild(bTr([{ t: c.nom, cls: 'b-essence-nom' }, fmtDate(c.date), c.grumes, c.pieces,
      { t: m3(c.volGrumes), cls: 'b-vol' }, { t: m3(c.volProduits), cls: 'b-vol' }]));
  });
}

function bTableLignesCampagne(c) {
  var wrap  = el('div', 'b-table-wrap');
  var table = el('table', 'b-table');
  var thead = el('thead');
  var trh   = el('tr');
  ['N° grume', 'Essence', 'Dimensions', 'Volume', 'Débit demandé'].forEach(function (h) { trh.appendChild(el('th', '', h)); });
  thead.appendChild(trh);
  table.appendChild(thead);
  var tbody = el('tbody');
  (c.lignes || []).forEach(function (l) {
    tbody.appendChild(bTr([{ t: l.nom || '—', cls: 'b-essence-nom' }, l.essence || '—',
      fmtNb(l.longueur, 2) + ' m × ' + l.diametre + ' cm', { t: m3(l.vol), cls: 'b-vol' }, texteDemande(l)]));
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

async function bSupprimerCampagne(c) {
  if (!confirm('Supprimer la campagne « ' + (c.nom || '') + ' » ?\nLes grumes restent en stock brut.')) return;
  bShowLoading(true);
  try {
    await bSbDelete('campagnes', c.id);
    await bChargerDonnees({ interne: true });
    bShowToast('Campagne supprimée.');
  } catch (err) {
    if (err.reseau) bShowToast('Pas de réseau : la suppression se fait avec réseau.', true);
    else if (/23503/.test(err.message)) {
      bShowToast('Cette campagne vient d\'être clôturée : elle ne peut plus être supprimée.', true);
      await bChargerDonnees({ interne: true });
    } else bShowToast('Erreur : ' + err.message, true);
  } finally {
    bShowLoading(false);
  }
}

// ─── Préparation d'une campagne (feuille de débit) ────────────────────────
// Le brouillon est gardé sur ce poste, sous une clé propre au bureau : il ne
// se mélange jamais avec celui de la version mobile ouverte sur le même poste.
var campDraft = null;
function cleBrouillonCampagne() { return 'duramen_bureau_draft_campagne_' + bCommune.nom; }
function sauverCampDraft() { ecrireLocal(cleBrouillonCampagne(), campDraft); }

// Débits demandés pour une grume
function debitsDuChoix(ch) {
  if (!Array.isArray(ch.debits)) {
    ch.debits = [{ type: 'plot', epaisseur_mm: 27, largeur_mm: 0, quantite: 0, auto: true }];
  }
  return ch.debits;
}
// Quantité calculée par l'app pour les débits non retouchés à la main :
// en plot, ce qui tient dans le diamètre restant ; en avivé, l'estimation.
function recalculerDebitsAuto(g, debits) {
  debits.forEach(function (d, i) {
    if (!d.auto) return;
    d.quantite = d.type === 'plot'
      ? DuramenCore.planchesPossibles(g, debits, i)
      : DuramenCore.estimerDebit(g, d).quantite;
  });
}

function bOuvrirPreparation() {
  campDraft = lireLocal(cleBrouillonCampagne()) || { date_prevue: jourISO(), choix: {} };
  if (!campDraft.choix) campDraft.choix = {};
  var md = bOuvrirModale('Préparer une campagne de sciage',
    'Choisissez les grumes et le débit demandé. Les plus urgentes sont en haut.', true);

  var iDate = bInput('date', campDraft.date_prevue || '');
  iDate.oninput = function () { campDraft.date_prevue = iDate.value; sauverCampDraft(); };
  md.corps.appendChild(bChamp('Date prévue du sciage', iDate, 'b-champ-court'));

  md.corps.appendChild(el('div', 'b-section-lbl b-mt', 'GRUMES EN STOCK'));
  var dispo = grumesParUrgence(grumesLibres());
  // Le brouillon ne garde que les grumes encore disponibles
  Object.keys(campDraft.choix).forEach(function (id) {
    if (!dispo.some(function (g) { return g.id === id; })) delete campDraft.choix[id];
  });
  sauverCampDraft();
  if (dispo.length === 0) {
    md.corps.appendChild(el('div', 'b-vide', 'Aucune grume disponible : elles sont toutes déjà dans une campagne.'));
  }
  var resume = el('div', 'b-synthese');
  function majResume() {
    var n = Object.keys(campDraft.choix).length;
    resume.textContent = n === 0 ? 'Aucune grume choisie.' : pl(n, 'grume choisie', 'grumes choisies');
  }
  dispo.forEach(function (g) { md.corps.appendChild(bLigneChoixDebit(g, majResume)); });
  majResume();

  md.pied.appendChild(resume);
  md.pied.appendChild(bouton('b-btn b-btn-ghost', 'Effacer', function () {
    if (!confirm('Effacer la préparation en cours ?')) return;
    effacerLocal(cleBrouillonCampagne());
    bOuvrirPreparation();
  }));
  md.pied.appendChild(bouton('b-btn b-btn-primary', 'Enregistrer la campagne', bEnregistrerCampagne));
}

// Une grume : case à cocher, puis un ou plusieurs débits (plusieurs
// épaisseurs possibles dans la même grume)
function bLigneChoixDebit(g, majResume) {
  var m    = DuramenCore.mesuresGrume(g);
  var bloc = el('div', 'b-prep-grume');
  var tete = el('label', 'b-prep-tete');
  var cb   = document.createElement('input');
  cb.type    = 'checkbox';
  cb.checked = !!campDraft.choix[g.id];
  tete.appendChild(cb);
  tete.appendChild(el('span', 'b-prep-nom', nomGrume(g) + ' · ' + (g.essence || '')));
  tete.appendChild(el('span', 'b-prep-meta', texteDimensions(g) + ' · ' + m3(g.vol_utile)));
  tete.appendChild(bBadgeUrgence(g));
  bloc.appendChild(tete);

  var debitOk = DuramenCore.validerDebitGrume(g);
  if (!debitOk.ok) {
    cb.checked  = false;
    cb.disabled = true;
    delete campDraft.choix[g.id];
    bloc.appendChild(el('div', 'b-note', 'Cette grume attend son numéro. Il s\'attribue dans la version mobile, une fois l\'étiquette posée.'));
    return bloc;
  }

  var zone = el('div', 'b-prep-choix' + (cb.checked ? '' : ' hidden'));
  bloc.appendChild(zone);
  function changer() { sauverCampDraft(); rendre(); majResume(); }

  // Retirer un champ encore actif déclenche sa validation (« change ») :
  // ce second rendu, imbriqué dans le premier, est ignoré.
  var enRendu = false;
  function rendre() {
    if (enRendu) return;
    enRendu = true;
    try { construire(); } finally { enRendu = false; }
  }
  function construire() {
    vider(zone);
    var ch = campDraft.choix[g.id];
    if (!ch) return;
    var debits = debitsDuChoix(ch);
    recalculerDebitsAuto(g, debits);

    debits.forEach(function (d, i) {
      var ligne = el('div', 'b-debit-ligne');

      var sType = document.createElement('select');
      sType.className = 'b-input';
      [['plot', 'Plot'], ['avive', 'Avivé']].forEach(function (t) {
        var o = el('option', '', t[1]); o.value = t[0]; if (d.type === t[0]) o.selected = true; sType.appendChild(o);
      });
      sType.onchange = function () { d.type = sType.value; d.auto = true; changer(); };
      ligne.appendChild(bChamp('Type', sType));

      // Épaisseur : 4 épaisseurs standard, ou « Autre » (champ libre)
      var standard = DuramenCore.EPAISSEURS_PLOT.indexOf(parseInt(d.epaisseur_mm, 10)) !== -1;
      var sEp = document.createElement('select');
      sEp.className = 'b-input';
      DuramenCore.EPAISSEURS_PLOT.forEach(function (e) {
        var o = el('option', '', e + ' mm'); o.value = e;
        if (standard && e === parseInt(d.epaisseur_mm, 10)) o.selected = true;
        sEp.appendChild(o);
      });
      var oAutre = el('option', '', 'Autre…'); oAutre.value = 'autre';
      if (!standard) oAutre.selected = true;
      sEp.appendChild(oAutre);
      sEp.onchange = function () {
        d.epaisseur_mm = sEp.value === 'autre' ? 0 : parseInt(sEp.value, 10);
        d.auto = true; changer();
      };
      ligne.appendChild(bChamp('Épaisseur', sEp));

      if (!standard) {
        var iA = bInput('number', d.epaisseur_mm || '', { min: DuramenCore.EPAISSEUR_AUTRE_MIN, max: DuramenCore.EPAISSEUR_AUTRE_MAX });
        iA.onchange = function () { d.epaisseur_mm = parseInt(iA.value, 10) || 0; d.auto = true; changer(); };
        ligne.appendChild(bChamp('Autre (mm, ' + DuramenCore.EPAISSEUR_AUTRE_MIN + ' à ' + DuramenCore.EPAISSEUR_AUTRE_MAX + ')', iA));
      }
      if (d.type === 'avive') {
        var iL = bInput('number', d.largeur_mm || '', { min: 5, max: 500 });
        iL.onchange = function () { d.largeur_mm = parseInt(iL.value, 10) || 0; d.auto = true; changer(); };
        ligne.appendChild(bChamp('Largeur (mm)', iL));
      }
      var iQ = bInput('number', d.quantite || 0, { min: 0, step: 1 });
      iQ.onchange = function () { d.quantite = Math.max(0, parseInt(iQ.value, 10) || 0); d.auto = false; changer(); };
      ligne.appendChild(bChamp(d.type === 'avive' ? 'Pièces' : 'Planches', iQ));

      var vol = DuramenCore.volumeDebitDemande(g, d);
      ligne.appendChild(el('div', 'b-debit-estimation', vol > 0 ? '≈ ' + m3(vol) : 'Cotes à compléter'));
      if (debits.length > 1) {
        ligne.appendChild(bouton('b-btn b-btn-ghost b-btn-petit', '✕ Retirer', function () { debits.splice(i, 1); changer(); }));
      }
      zone.appendChild(ligne);
    });

    var bas = el('div', 'b-debit-bas');
    bas.appendChild(bouton('b-btn b-btn-ghost b-btn-petit', '+ Ajouter une épaisseur', function () {
      // Les quantités déjà en place sont gardées ; la nouvelle épaisseur
      // prend ce qui reste du diamètre
      debits.forEach(function (d) { d.auto = false; });
      debits.push({ type: 'plot', epaisseur_mm: 54, largeur_mm: 0, quantite: 0, auto: true });
      changer();
    }));
    // Les planches en plot tiennent-elles dans la grume ?
    if (debits.some(function (d) { return d.type === 'plot'; })) {
      var util = DuramenCore.diametreUtilisePlots(debits);
      bas.appendChild(el('span', 'b-debit-diametre' + (util > m.diametre ? ' b-debit-depasse' : ''),
        (util > m.diametre ? 'Dépasse le diamètre — ' : '') + 'Diamètre pris par les plots : ' + fmtNb(util, 1) + ' / ' + m.diametre + ' cm'));
    }
    zone.appendChild(bas);
  }

  cb.onchange = function () {
    if (cb.checked) campDraft.choix[g.id] = campDraft.choix[g.id]
      || { debits: [{ type: 'plot', epaisseur_mm: 27, largeur_mm: 0, quantite: 0, auto: true }] };
    else delete campDraft.choix[g.id];
    zone.classList.toggle('hidden', !cb.checked);
    changer();
  };
  rendre();
  return bloc;
}

async function bEnregistrerCampagne() {
  var ids = Object.keys(campDraft.choix);
  if (ids.length === 0) { bShowToast('Choisissez au moins une grume.', true); return; }

  // 1. Vérification de la saisie
  for (var i = 0; i < ids.length; i++) {
    var g0 = lots.find(function (l) { return l.id === ids[i]; });
    if (!g0) continue;
    var debits0 = debitsDuChoix(campDraft.choix[ids[i]]);
    for (var j = 0; j < debits0.length; j++) {
      var d0 = debits0[j];
      if (!DuramenCore.epaisseurValide(d0.epaisseur_mm)) {
        bShowToast('Grume ' + g0.nom + ' : épaisseur à indiquer (de ' + DuramenCore.EPAISSEUR_AUTRE_MIN
          + ' à ' + DuramenCore.EPAISSEUR_AUTRE_MAX + ' mm).', true); return;
      }
      if (d0.type === 'avive' && !(d0.largeur_mm > 0)) { bShowToast('Grume ' + g0.nom + ' : largeur de l\'avivé à indiquer.', true); return; }
      if (!(d0.quantite > 0)) { bShowToast('Grume ' + g0.nom + ' : nombre de planches ou de pièces à indiquer.', true); return; }
    }
    if (DuramenCore.diametreUtilisePlots(debits0) > DuramenCore.mesuresGrume(g0).diametre
        && !confirm('Grume ' + g0.nom + ' : les plots demandés dépassent le diamètre de la grume.\nEnregistrer quand même ?')) return;
  }

  bShowLoading(true);
  try {
    // 2. Données fraîches : une grume a pu être réservée ou sortie depuis
    //    un autre poste pendant la préparation.
    if (!await bChargerDonnees({ interne: true })) {
      bShowToast('Pas de réseau : la campagne s\'enregistre avec réseau. Votre préparation est gardée.', true); return;
    }
    var libres = {};
    grumesLibres().forEach(function (g) { libres[g.id] = g; });
    var perdues = ids.filter(function (id) { return !libres[id]; });
    if (perdues.length) {
      perdues.forEach(function (id) { delete campDraft.choix[id]; });
      sauverCampDraft();
      bShowToast(pl(perdues.length, 'grume vient', 'grumes viennent') + ' d\'être réservée' + (perdues.length > 1 ? 's' : '')
        + ' ou sortie' + (perdues.length > 1 ? 's' : '') + ' depuis un autre poste. Vérifiez votre préparation, puis enregistrez.', true);
      bOuvrirPreparation();
      return;
    }

    // 3. Lignes de la campagne — même forme que la version mobile
    var lignes = [];
    for (var k = 0; k < ids.length; k++) {
      var g = libres[ids[k]];
      var okDebit = DuramenCore.validerDebitGrume(g);
      if (!okDebit.ok) { bShowToast(okDebit.erreur, true); return; }
      var m = DuramenCore.mesuresGrume(g);
      var debitsLigne = debitsDuChoix(campDraft.choix[ids[k]]).map(function (d) {
        return {
          type: d.type, epaisseur_mm: d.epaisseur_mm, largeur_mm: d.type === 'avive' ? d.largeur_mm : null,
          quantite: d.quantite, volume: arrondiM3(DuramenCore.volumeDebitDemande(g, d))
        };
      });
      var premier = debitsLigne[0];
      lignes.push({
        grume_id: g.id, cle: g.id + '_0', nom: g.nom, essence: g.essence,
        longueur: m.longueur, diametre: m.diametre, vol: g.vol_utile || 0,
        debits: debitsLigne,
        type: premier.type, epaisseur_mm: premier.epaisseur_mm, largeur_mm: premier.largeur_mm,
        estimation_quantite: debitsLigne.reduce(function (s, d) { return s + d.quantite; }, 0),
        estimation_volume: arrondiM3(debitsLigne.reduce(function (s, d) { return s + d.volume; }, 0))
      });
    }
    // Ordre de la feuille de débit : les plus urgentes d'abord
    var ordre = grumesParUrgence(lots).map(function (x) { return x.id; });
    lignes.sort(function (a, b) { return ordre.indexOf(a.grume_id) - ordre.indexOf(b.grume_id); });

    await bSbInsert('campagnes', {
      id:           crypto.randomUUID(),
      commune_code: bCommune.code,
      nom:          'Campagne du ' + fmtDate(campDraft.date_prevue || jourISO()),
      date_prevue:  campDraft.date_prevue || null,
      scieur:       '',
      lignes:       lignes,
      date_iso:     new Date().toISOString()
    });
    effacerLocal(cleBrouillonCampagne());
    vider(document.getElementById('b-modales'));
    await bChargerDonnees({ interne: true });
    bShowToast('Campagne enregistrée : ' + pl(lignes.length, 'grume') + ' à débiter.');
  } catch (err) {
    if (err.reseau) bShowToast('Pas de réseau : la campagne s\'enregistre avec réseau. Votre préparation est gardée.', true);
    else if (/GRUME SANS NUMÉRO/.test(err.message)) bShowToast('Une grume n\'a pas encore de numéro : il s\'attribue dans la version mobile.', true);
    else if (/GRUME DÉJÀ RÉSERVÉE|GRUME DÉJÀ SORTIE/.test(err.message)) {
      // Deux postes ont enregistré au même moment : la base a gardé le premier.
      bShowToast('Une grume choisie vient d\'être réservée ou sortie depuis un autre poste. Rien n\'a été enregistré : vérifiez votre préparation.', true);
      await bChargerDonnees({ interne: true });
      bOuvrirPreparation();
    } else bShowToast('Erreur : ' + err.message, true);
  } finally {
    bShowLoading(false);
  }
}

// ─── Feuille de débit imprimable ──────────────────────────────────────────
// Colonne « Demandé » remplie, colonne « Réalisé » vide pour le scieur.
function bConstruireFeuille(c) {
  var f = el('div', 'b-feuille');
  f.appendChild(el('h2', '', 'Feuille de débit — ' + (c.nom || 'Campagne')));
  f.appendChild(el('p', '', bCommune.nom + ' · Date prévue : ' + fmtDate(c.date_prevue) + ' · Scieur : ' + (c.scieur || '________________')));
  var table = el('table', 'b-feuille-table');
  var thead = el('thead'), trh = el('tr');
  ['N°', 'Essence', 'Long.', 'Diam.', 'Demandé', 'Réalisé'].forEach(function (h) { trh.appendChild(el('th', '', h)); });
  thead.appendChild(trh);
  table.appendChild(thead);
  var tbody = el('tbody');
  (c.lignes || []).forEach(function (l) {
    tbody.appendChild(bTr([l.nom, l.essence, fmtNb(l.longueur, 2) + ' m', l.diametre + ' cm', texteDemande(l),
      '☐ Conforme   ☐ Écart : ____________']));
  });
  table.appendChild(tbody);
  f.appendChild(table);
  f.appendChild(el('p', 'b-feuille-pied', 'Date du sciage : ____________     Signature du scieur : ____________'));
  return f;
}

function bOuvrirFeuilleDebit(c) {
  var md = bOuvrirModale('Feuille de débit', 'À imprimer pour le scieur. Chaque pile garde le numéro de sa grume.', true);
  md.corps.appendChild(bConstruireFeuille(c));
  md.pied.appendChild(bouton('b-btn b-btn-ghost', 'Fermer', bFermerModale));
  md.pied.appendChild(bouton('b-btn b-btn-primary', 'Imprimer', function () { bImprimerFeuille(c); }));
}

// Impression : seule la feuille est imprimée (règle @media print de ui.css).
function bImprimerFeuille(c) {
  var feuille = bConstruireFeuille(c);
  feuille.classList.add('b-impression');
  document.body.appendChild(feuille);
  document.body.classList.add('b-mode-impression');
  var fini = false;
  function restaurer() {
    if (fini) return;
    fini = true;
    document.body.classList.remove('b-mode-impression');
    if (feuille.parentNode) feuille.parentNode.removeChild(feuille);
  }
  window.addEventListener('afterprint', restaurer, { once: true });
  window.print();
  setTimeout(restaurer, 1000);
}

// ─── Clôture d'une campagne : saisie du réalisé ───────────────────────────
// Le réalisé est pré-rempli avec le demandé : on ne corrige que les écarts.
// Un seul envoi : tout passe ou rien.
var clotDraft = null;
function cleBrouillonCloture() { return 'duramen_bureau_draft_cloture_' + bCommune.nom; }
function sauverClotDraft() { ecrireLocal(cleBrouillonCloture(), clotDraft); }

function produitsDepuisDemande(l) {
  if (Array.isArray(l.debits) && l.debits.length) {
    return l.debits.map(function (d) {
      return { type: d.type, epaisseur_mm: d.epaisseur_mm, largeur_mm: d.type === 'avive' ? d.largeur_mm : null,
               longueur_m: l.longueur, quantite: d.quantite || 0 };
    });
  }
  return [{ type: l.type, epaisseur_mm: l.epaisseur_mm, largeur_mm: l.type === 'avive' ? l.largeur_mm : null,
            longueur_m: l.longueur, quantite: l.estimation_quantite || 0 }];
}
function produitValide(p) {
  return p.quantite > 0 && p.epaisseur_mm > 0 && p.longueur_m > 0 && (p.type !== 'avive' || p.largeur_mm > 0);
}

function bOuvrirCloture(c) {
  var d = lireLocal(cleBrouillonCloture());
  if (!d || d.campagne_id !== c.id || !d.grumes) {
    d = { campagne_id: c.id, grumes: {} };
    (c.lignes || []).forEach(function (l) { d.grumes[l.grume_id] = { sciee: true, produits: produitsDepuisDemande(l) }; });
  }
  clotDraft = d;
  var md = bOuvrirModale('Clôturer — ' + (c.nom || 'Campagne'),
    'Le réalisé est pré-rempli avec le demandé. Corrigez seulement les écarts, puis validez.', true);
  var sorties = clesGrumesSorties();

  (c.lignes || []).forEach(function (l) {
    var g    = lots.find(function (x) { return x.id === l.grume_id; });
    var bloc = el('div', 'b-prep-grume');
    var tete = el('div', 'b-prep-tete');
    tete.appendChild(el('span', 'b-prep-nom', (l.nom || '—') + ' · ' + (l.essence || '')));
    tete.appendChild(el('span', 'b-prep-meta', fmtNb(l.longueur, 2) + ' m × ' + l.diametre + ' cm · Demandé : ' + texteDemande(l)));
    bloc.appendChild(tete);
    if (!g || sorties[l.grume_id + '_0']) {
      delete clotDraft.grumes[l.grume_id];
      bloc.appendChild(el('div', 'b-note', 'Grume déjà sortie du stock : elle est ignorée.'));
    } else {
      if (!clotDraft.grumes[l.grume_id]) clotDraft.grumes[l.grume_id] = { sciee: true, produits: produitsDepuisDemande(l) };
      bloc.appendChild(bSaisieRealise(g, clotDraft.grumes[l.grume_id]));
    }
    md.corps.appendChild(bloc);
  });
  sauverClotDraft();

  md.pied.appendChild(bouton('b-btn b-btn-ghost', 'Fermer', bFermerModale));
  md.pied.appendChild(bouton('b-btn b-btn-primary', 'Valider la clôture', function () { bValiderCloture(c); }));
}

// Réalisé d'une grume : sciée ou non, puis ses produits
function bSaisieRealise(g, etat) {
  var zone = el('div', 'b-prep-choix');
  var lab  = el('label', 'b-coche');
  var cb   = document.createElement('input');
  cb.type    = 'checkbox';
  cb.checked = etat.sciee;
  lab.appendChild(cb);
  lab.appendChild(el('span', '', 'Grume sciée'));
  zone.appendChild(lab);
  var liste = el('div', 'b-debit-liste' + (etat.sciee ? '' : ' hidden'));
  var note  = el('div', 'b-note' + (etat.sciee ? ' hidden' : ''), 'Non sciée : la grume reste en stock brut.');
  zone.appendChild(liste);
  zone.appendChild(note);
  cb.onchange = function () {
    etat.sciee = cb.checked;
    liste.classList.toggle('hidden', !cb.checked);
    note.classList.toggle('hidden', cb.checked);
    sauverClotDraft();
  };

  function rendre() {
    vider(liste);
    etat.produits.forEach(function (p, i) {
      var ligne = el('div', 'b-debit-ligne');
      var sType = document.createElement('select');
      sType.className = 'b-input';
      [['plot', 'Plot'], ['avive', 'Avivé']].forEach(function (t) {
        var o = el('option', '', t[1]); o.value = t[0]; if (p.type === t[0]) o.selected = true; sType.appendChild(o);
      });
      sType.onchange = function () { p.type = sType.value; sauverClotDraft(); rendre(); };
      ligne.appendChild(bChamp('Type', sType));

      var vol = el('div', 'b-debit-estimation');
      function majVol() { vol.textContent = m3(DuramenCore.volumeProduit(p, g)); }
      [['epaisseur_mm', 'Épaisseur (mm)'], ['largeur_mm', 'Largeur (mm)'], ['longueur_m', 'Longueur (m)'], ['quantite', 'Quantité']]
        .forEach(function (f) {
          if (f[0] === 'largeur_mm' && p.type !== 'avive') return;
          var inp = bInput('number', (p[f[0]] === null || p[f[0]] === undefined) ? '' : p[f[0]],
            { min: 0, step: f[0] === 'longueur_m' ? '0.05' : '1' });
          inp.oninput = function () {
            p[f[0]] = parseFloat(String(inp.value).replace(',', '.')) || 0;
            sauverClotDraft(); majVol();
          };
          ligne.appendChild(bChamp(f[1], inp));
        });
      ligne.appendChild(vol);
      ligne.appendChild(bouton('b-btn b-btn-ghost b-btn-petit', '✕ Retirer', function () {
        etat.produits.splice(i, 1); sauverClotDraft(); rendre();
      }));
      liste.appendChild(ligne);
      majVol();
    });
    var bas = el('div', 'b-debit-bas');
    bas.appendChild(bouton('b-btn b-btn-ghost b-btn-petit', '+ Ajouter un produit', function () {
      etat.produits.push({ type: 'avive', epaisseur_mm: 27, largeur_mm: 150, longueur_m: DuramenCore.mesuresGrume(g).longueur, quantite: 0 });
      sauverClotDraft(); rendre();
    }));
    liste.appendChild(bas);
  }
  rendre();
  return zone;
}

async function bValiderCloture(c) {
  bShowLoading(true);
  try {
    // Données fraîches : la campagne a pu être clôturée ou supprimée, une
    // grume a pu sortir, depuis un autre poste.
    if (!await bChargerDonnees({ interne: true })) {
      bShowToast('Pas de réseau : la clôture se fait avec réseau. Votre saisie est gardée.', true); return;
    }
    if (!campagnes.some(function (x) { return x.id === c.id; })) {
      bShowToast('Cette campagne a été supprimée depuis un autre poste.', true);
      effacerLocal(cleBrouillonCloture());
      vider(document.getElementById('b-modales')); bRendre(); return;
    }
    if (campagneCloturee(c)) {
      bShowToast('Cette campagne a déjà été clôturée depuis un autre poste.', true);
      effacerLocal(cleBrouillonCloture());
      vider(document.getElementById('b-modales')); bRendre(); return;
    }
    var sorties = clesGrumesSorties();
    var now = new Date();
    var envoi = [];
    var nbProduits = 0, nbNonSciees = 0;
    var ids = Object.keys(clotDraft.grumes);
    for (var i = 0; i < ids.length; i++) {
      var etat = clotDraft.grumes[ids[i]];
      var g    = lots.find(function (x) { return x.id === ids[i]; });
      if (!g || sorties[ids[i] + '_0']) {
        bShowToast('Une grume de la campagne vient de sortir du stock. Vérifiez la clôture, puis validez.', true);
        bOuvrirCloture(c);
        return;
      }
      if (!etat.sciee) { nbNonSciees++; continue; }
      if (etat.produits.some(function (p) { return p.quantite > 0 && !produitValide(p); })) {
        bShowToast('Grume ' + g.nom + ' : un produit a des cotes incomplètes.', true); return;
      }
      var produits = etat.produits.filter(produitValide).map(function (p) {
        return {
          type: p.type, epaisseur_mm: p.epaisseur_mm, largeur_mm: p.type === 'avive' ? p.largeur_mm : null,
          longueur_m: p.longueur_m, quantite: p.quantite,
          volume: arrondiM3(DuramenCore.volumeProduit(p, g)), grume_nom: g.nom
        };
      });
      nbProduits += produits.reduce(function (s, p) { return s + p.quantite; }, 0);
      // Même forme que la version mobile
      envoi.push({
        id:           crypto.randomUUID(),
        commune_code: bCommune.code,
        essence:      g.essence,
        volume:       arrondiM3(g.vol_utile || 0),
        usage:        'Sciage',
        destination:  c.nom || 'Campagne de sciage',
        commune:      bCommune.nom,
        contact:      '',
        notes:        produits.length ? '' : 'Aucun produit récupéré',
        type_sortie:  'sciage',
        grumes_keys:  [g.id + '_0'],
        produits:     produits,
        vol_produits: arrondiM3(produits.reduce(function (s, p) { return s + p.volume; }, 0)),
        campagne_id:  c.id,
        date:         now.toLocaleDateString('fr-FR'),
        date_iso:     now.toISOString()
      });
    }
    if (envoi.length === 0) {
      bShowToast('Aucune grume sciée. Si le sciage n\'a pas eu lieu, supprimez la campagne.', true); return;
    }
    bShowLoading(false);
    if (!confirm('Clôturer la campagne ?\n' + envoi.length + ' grume(s) sciée(s) → ' + nbProduits + ' pièce(s) en stock produits.'
      + (nbNonSciees ? '\n' + nbNonSciees + ' grume(s) non sciée(s) restent en stock brut.' : '')
      + '\nLa clôture est définitive.')) return;
    bShowLoading(true);
    await bSbInsert('extractions', envoi);
    effacerLocal(cleBrouillonCloture());
    vider(document.getElementById('b-modales'));
    await bChargerDonnees({ interne: true });
    bSwitchTab('produits');
    bShowToast('Campagne clôturée : ' + nbProduits + ' pièce(s) en stock produits.');
  } catch (err) {
    if (err.reseau) bShowToast('Pas de réseau : la clôture n\'a pas été envoyée. Votre saisie est gardée.', true);
    else if (/GRUME DÉJÀ SORTIE|STOCK INSUFFISANT/.test(err.message)) {
      bShowToast('Une grume de la campagne vient de sortir du stock depuis un autre poste. Rien n\'a été enregistré.', true);
      await bChargerDonnees({ interne: true });
      if (campagnes.some(function (x) { return x.id === c.id; }) && !campagneCloturee(c)) bOuvrirCloture(c);
      else { vider(document.getElementById('b-modales')); bRendre(); }
    } else if (/23503/.test(err.message)) {
      bShowToast('Cette campagne vient d\'être supprimée depuis un autre poste. Rien n\'a été enregistré.', true);
      effacerLocal(cleBrouillonCloture());
      vider(document.getElementById('b-modales'));
      await bChargerDonnees({ interne: true });
    } else bShowToast('Erreur : ' + err.message, true);
  } finally {
    bShowLoading(false);
  }
}

// ═══════════ 3 · PRODUITS BOIS ═══════════
function bTrierProduits(lignes) {
  return lignes.slice().sort(function (a, b) {
    return (a.essence || '').localeCompare(b.essence || '') || (new Date(a.dateSecAir) - new Date(b.dateSecAir));
  });
}

function bAfficherProduits() {
  var lignes = bTrierProduits(DuramenCore.getStockProduits());
  var tbody  = document.getElementById('b-produits-tbody');
  vider(tbody);
  if (lignes.length === 0) {
    tbody.appendChild(bTrVide(7, 'Aucun produit bois en stock. Les produits arrivent à la clôture d\'une campagne de sciage.'));
    return;
  }
  var vol = 0, pieces = 0;
  lignes.forEach(function (l) {
    vol += l.volumeRestant || 0; pieces += l.restant || 0;
    tbody.appendChild(bTr([
      { t: l.essence || '—', cls: 'b-essence-nom' }, texteProduit(l), l.grume_nom || '—',
      l.restant + ' sur ' + l.quantite + ' ' + unitePieces(l.type, l.quantite),
      { t: m3(l.volumeRestant), cls: 'b-vol' }, fmtDate(l.dateSciage), bBadgeSechage(l.dateSecAir)
    ]));
  });
  tbody.appendChild(bTr(['Total', '', '', pl(pieces, 'pièce'), { t: m3(vol), cls: 'b-vol' }, '', ''], 'b-tr-total'));
}

// Volume d'une pièce d'une ligne du stock produits
function volumePiece(l) { return l.restant > 0 ? (l.volumeRestant || 0) / l.restant : 0; }

// ─── Sortie de produits pour un projet ────────────────────────────────────
function bOuvrirSortieProduits() {
  var lignes = bTrierProduits(DuramenCore.getStockProduits());
  var sel = {};   // clé du produit → nombre de pièces
  var md  = bOuvrirModale('Sortir des produits pour un projet',
    'Indiquez le nombre de pièces à sortir, puis le projet. Le suivi (réalisation, pose) se fait ensuite dans l\'onglet Projets.', true);

  var synth = el('div', 'b-synthese', 'Aucune pièce choisie.');
  function majSynth() {
    var nb = 0, vol = 0;
    lignes.forEach(function (l) { var q = sel[l.cle] || 0; nb += q; vol += volumePiece(l) * q; });
    synth.textContent = nb ? pl(nb, 'pièce') + ' — ' + m3(vol) : 'Aucune pièce choisie.';
  }

  var wrap  = el('div', 'b-table-wrap');
  var table = el('table', 'b-table');
  var thead = el('thead'), trh = el('tr');
  ['Essence', 'Produit', 'Grume', 'En stock', 'Séchage', 'À sortir'].forEach(function (h) { trh.appendChild(el('th', '', h)); });
  thead.appendChild(trh); table.appendChild(thead);
  var tbody = el('tbody');
  if (lignes.length === 0) tbody.appendChild(bTrVide(6, 'Aucun produit bois en stock.'));
  lignes.forEach(function (l) {
    var zone = el('div', 'b-qte');
    var inp  = bInput('number', 0, { min: 0, max: l.restant, step: 1, 'aria-label': 'Nombre de pièces à sortir' });
    function fixer(v) {
      v = Math.max(0, Math.min(l.restant, Math.floor(parseFloat(v) || 0)));
      sel[l.cle] = v;
      inp.value = String(v);
      majSynth();
    }
    inp.onchange = function () { fixer(inp.value); };
    zone.appendChild(inp);
    zone.appendChild(bouton('b-btn b-btn-ghost b-btn-petit', 'Tout', function () { fixer(l.restant); }));
    tbody.appendChild(bTr([{ t: l.essence || '—', cls: 'b-essence-nom' }, texteProduit(l), l.grume_nom || '—',
      l.restant + ' ' + unitePieces(l.type, l.restant), bBadgeSechage(l.dateSecAir), zone]));
  });
  table.appendChild(tbody); wrap.appendChild(table);
  md.corps.appendChild(wrap);

  var iProjet = bInput('text', '', { placeholder: 'Ex. : bancs de l\'école, bardage du préau…', maxlength: '120' });
  var iLieu   = bInput('text', '', { placeholder: 'Ex. : école Jules-Verne, salle des fêtes…', maxlength: '120' });
  md.corps.appendChild(bChamp('Nom du projet', iProjet));
  md.corps.appendChild(bChamp('Lieu prévu (optionnel)', iLieu));

  md.pied.appendChild(synth);
  md.pied.appendChild(bouton('b-btn b-btn-ghost', 'Annuler', bFermerModale));
  md.pied.appendChild(bouton('b-btn b-btn-primary', 'Enregistrer la sortie', function () {
    bConfirmerSortieProduits(sel, iProjet.value.trim(), iLieu.value.trim());
  }));
}

async function bConfirmerSortieProduits(sel, projet, lieu) {
  var selection = Object.keys(sel).filter(function (k) { return sel[k] > 0; })
    .map(function (k) { return { cle: k, quantite: sel[k] }; });
  var v = DuramenCore.validerSortieProduits(selection);
  if (!v.ok) { bShowToast(v.erreur, true); return; }
  if (!projet) { bShowToast('Indiquez le nom du projet.', true); return; }
  bShowLoading(true);
  try {
    // Données fraîches : un autre poste a pu sortir ces produits entre-temps
    if (!await bChargerDonnees({ interne: true })) { bShowToast('Pas de réseau : la sortie se fait avec réseau.', true); return; }
    v = DuramenCore.validerSortieProduits(selection);
    if (!v.ok) {
      bShowToast('Le stock a changé entre-temps. ' + v.erreur + ' Refaites votre choix.', true);
      bOuvrirSortieProduits();
      return;
    }
    var stock = {};
    DuramenCore.getStockProduits().forEach(function (l) { stock[l.cle] = l; });
    // Une ligne de sortie par essence, comme sur le mobile
    var parEss = {};
    selection.forEach(function (s) {
      var l = stock[s.cle];
      (parEss[l.essence] = parEss[l.essence] || []).push({
        cle: s.cle, quantite: s.quantite, volume: arrondiM3(volumePiece(l) * s.quantite)
      });
    });
    var now = new Date();
    // Volume 0 : la sortie de produits ne retire rien au stock de grumes
    // (déjà retiré au sciage). Le volume réel est dans vol_produits.
    await bSbInsert('extractions', Object.keys(parEss).map(function (ess) {
      return {
        id:           crypto.randomUUID(),
        commune_code: bCommune.code,
        essence:      ess,
        volume:       0,
        usage:        'Non défini',
        destination:  projet,
        commune:      bCommune.nom,
        contact:      '',
        notes:        lieu ? 'Lieu : ' + lieu : '',
        type_sortie:  'produit',
        produits:     parEss[ess],
        vol_produits: arrondiM3(parEss[ess].reduce(function (s, p) { return s + p.volume; }, 0)),
        date:         now.toLocaleDateString('fr-FR'),
        date_iso:     now.toISOString()
      };
    }));
    vider(document.getElementById('b-modales'));
    await bChargerDonnees({ interne: true });
    bSwitchTab('projets');
    bShowToast('Sortie enregistrée pour le projet « ' + projet + ' ».');
  } catch (err) {
    await bRefusSortie(err, bOuvrirSortieProduits);
  } finally {
    bShowLoading(false);
  }
}

// ═══════════ 4 · PROJETS : sortie → réalisation → pose ═══════════
// Un projet = une sortie de stock (produits ou grume entière). Une sortie
// crée une ligne par essence, toutes à la même date et pour la même
// destination : elles sont regroupées ici.
var ETAPES = { sorti: 'À réaliser', realise: 'Réalisé, à poser', pose: 'Posé' };

function bProjets() {
  var groupes = {}, ordre = [];
  extractions.forEach(function (e) {
    if (e.type_sortie === 'sciage') return;
    var cle = (e.date_iso || e.created_at || '') + '|' + (e.destination || '');
    if (!groupes[cle]) {
      var lieu = /^Lieu : /.test(e.notes || '') ? e.notes.replace(/^Lieu : /, '') : '';
      groupes[cle] = {
        cle: cle, ids: [], lignes: [], nom: e.destination || 'Projet sans nom',
        date: e.date_iso || e.created_at, commune: e.commune || '', lieu: lieu,
        objet: e.objet || '', date_realisation: e.date_realisation || '',
        date_pose: e.date_pose || '', lieu_pose: e.lieu_pose || ''
      };
      ordre.push(cle);
    }
    groupes[cle].ids.push(e.id);
    groupes[cle].lignes.push(e);
  });
  return ordre.map(function (k) {
    var p = groupes[k];
    p.etape = p.date_pose ? 'pose' : (p.date_realisation ? 'realise' : 'sorti');
    p.volume = p.lignes.reduce(function (s, e) {
      return s + (e.type_sortie === 'produit' ? (parseFloat(e.vol_produits) || 0) : (parseFloat(e.volume) || 0));
    }, 0);
    return p;
  }).sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
}

// Détail d'une ligne de sortie : pièces et grumes d'origine (traçabilité)
function bDetailSortie(e) {
  var details = [];
  if (e.type_sortie === 'produit') {
    (e.produits || []).forEach(function (s) {
      var parts = String(s.cle || '').split('_');
      var src   = extractions.find(function (x) { return x.id === parts[0]; });
      var p     = src && Array.isArray(src.produits) ? src.produits[parseInt(parts[1], 10)] : null;
      details.push({
        texte: s.quantite + ' × ' + (p ? texteProduit(p) : 'produit'),
        pieces: parseFloat(s.quantite) || 0, grume: p ? (p.grume_nom || '') : '', volume: parseFloat(s.volume) || 0
      });
    });
  } else {
    var cles = e.grumes_keys || [];
    cles.forEach(function (k) {
      var g = lots.find(function (l) { return l.id === String(k).split('_')[0]; });
      details.push({
        texte: 'Grume entière' + (g ? ' · ' + texteDimensions(g) : ''),
        pieces: 1, grume: g ? (g.nom || '') : '', volume: cles.length ? (parseFloat(e.volume) || 0) / cles.length : 0
      });
    });
    if (cles.length === 0) details.push({ texte: e.type_valorisation === 'planches' ? 'Débit en planches' : 'Bois sorti',
      pieces: 0, grume: '', volume: parseFloat(e.volume) || 0 });
  }
  return details;
}

function bAfficherProjets() {
  var zone   = document.getElementById('b-projets-liste');
  var filtre = document.getElementById('b-projets-filtre').value;
  vider(zone);
  var projets = bProjets().filter(function (p) { return !filtre || p.etape === filtre; });
  if (projets.length === 0) {
    zone.appendChild(el('div', 'b-vide', filtre ? 'Aucun projet à cette étape.'
      : 'Aucun projet. Un projet commence quand des produits bois sortent du stock (onglet Produits bois).'));
    return;
  }
  projets.forEach(function (p) {
    var carte = el('div', 'b-carte');
    var tete  = el('div', 'b-carte-tete');
    var titre = el('div', '');
    titre.appendChild(el('div', 'b-carte-titre', p.nom));
    titre.appendChild(el('div', 'b-carte-meta', 'Bois sorti le ' + fmtDate(p.date) + ' · ' + m3(p.volume)
      + (p.lieu ? ' · Lieu prévu : ' + p.lieu : '')));
    tete.appendChild(titre);
    var acts = el('div', 'b-carte-actions');
    acts.appendChild(bouton('b-btn ' + (p.etape === 'pose' ? 'b-btn-ghost' : 'b-btn-primary'),
      p.etape === 'pose' ? 'Corriger le suivi' : 'Mettre à jour le suivi', function () { bOuvrirSuivi(p.cle); }));
    tete.appendChild(acts);
    carte.appendChild(tete);

    // Les 3 étapes : bois sorti → objet réalisé → objet posé
    var etapes = el('div', 'b-etapes');
    [['Bois sorti', fmtDate(p.date), true],
     ['Objet réalisé', p.date_realisation ? fmtDate(p.date_realisation) + (p.objet ? ' · ' + p.objet : '') : (p.objet || 'à venir'), !!p.date_realisation],
     ['Objet posé', p.date_pose ? fmtDate(p.date_pose) + (p.lieu_pose ? ' · ' + p.lieu_pose : '') : 'à venir', !!p.date_pose]
    ].forEach(function (s) {
      var et = el('div', 'b-etape' + (s[2] ? ' b-etape-faite' : ''));
      et.appendChild(el('div', 'b-etape-point'));
      var tx = el('div', '');
      tx.appendChild(el('div', 'b-etape-nom', s[0]));
      tx.appendChild(el('div', 'b-etape-detail', s[1]));
      et.appendChild(tx);
      etapes.appendChild(et);
    });
    carte.appendChild(etapes);

    var liste = el('ul', 'b-projet-contenu');
    p.lignes.forEach(function (e) {
      bDetailSortie(e).forEach(function (d) {
        liste.appendChild(el('li', '', (e.essence || '—') + ' — ' + d.texte + (d.grume ? ' · grume ' + d.grume : '')));
      });
    });
    carte.appendChild(liste);
    zone.appendChild(carte);
  });
}

function bSuiviDe(p) {
  return [p.objet || '', p.date_realisation || '', p.date_pose || '', p.lieu_pose || ''].join('|');
}

function bOuvrirSuivi(cle) {
  var p = bProjets().find(function (x) { return x.cle === cle; });
  if (!p) { bShowToast('Ce projet n\'est plus dans la liste.', true); return; }
  var vu = bSuiviDe(p);   // ce qui est affiché à l'ouverture
  var md = bOuvrirModale('Suivi du projet — ' + p.nom,
    'Notez ce qui a été réalisé avec ce bois, puis où et quand l\'objet a été posé.');

  var iObjet = bInput('text', p.objet, { placeholder: 'Ex. : 3 bancs, bardage du préau…', maxlength: '160' });
  var iReal  = bInput('date', p.date_realisation);
  var iPose  = bInput('date', p.date_pose);
  var iLieu  = bInput('text', p.lieu_pose, { placeholder: p.lieu ? 'Lieu prévu : ' + p.lieu : 'Ex. : parc de la mairie…', maxlength: '160' });
  md.corps.appendChild(bChamp('Objet réalisé', iObjet));
  md.corps.appendChild(bChamp('Réalisé le', iReal, 'b-champ-court'));
  md.corps.appendChild(bChamp('Posé le', iPose, 'b-champ-court'));
  md.corps.appendChild(bChamp('Lieu de pose', iLieu));
  md.corps.appendChild(el('div', 'b-note', 'Laissez une date vide tant que l\'étape n\'est pas faite.'));

  md.pied.appendChild(bouton('b-btn b-btn-ghost', 'Annuler', bFermerModale));
  md.pied.appendChild(bouton('b-btn b-btn-primary', 'Enregistrer le suivi', function () {
    bEnregistrerSuivi(cle, vu, {
      objet: iObjet.value.trim(), date_realisation: iReal.value || null,
      date_pose: iPose.value || null, lieu_pose: iLieu.value.trim()
    });
  }));
}

async function bEnregistrerSuivi(cle, vu, s) {
  if (s.date_pose && !s.date_realisation) { bShowToast('Indiquez la date de réalisation avant la date de pose.', true); return; }
  if (s.date_pose && s.date_pose < s.date_realisation) { bShowToast('La pose vient après la réalisation : vérifiez les dates.', true); return; }
  bShowLoading(true);
  try {
    // Données fraîches : le suivi a pu être mis à jour depuis un autre poste.
    if (!await bChargerDonnees({ interne: true })) { bShowToast('Pas de réseau : le suivi s\'enregistre avec réseau.', true); return; }
    var p = bProjets().find(function (x) { return x.cle === cle; });
    if (!p) { bShowToast('Ce projet n\'est plus dans la liste.', true); vider(document.getElementById('b-modales')); return; }
    if (bSuiviDe(p) !== vu) {
      bShowToast('Ce suivi vient d\'être mis à jour depuis un autre poste. Vérifiez, puis enregistrez de nouveau.', true);
      bOuvrirSuivi(cle);
      return;
    }
    await bSbRpc('enregistrer_suivi_sortie', {
      p_ids: p.ids, p_objet: s.objet, p_date_realisation: s.date_realisation,
      p_date_pose: s.date_pose, p_lieu_pose: s.lieu_pose
    });
    vider(document.getElementById('b-modales'));
    await bChargerDonnees({ interne: true });
    bShowToast('Suivi enregistré.');
  } catch (err) {
    if (err.reseau) bShowToast('Pas de réseau : le suivi s\'enregistre avec réseau.', true);
    else if (/DATE DE RÉALISATION MANQUANTE|DATES INCOHÉRENTES/.test(err.message)) bShowToast('Vérifiez les dates de réalisation et de pose.', true);
    else if (/SORTIE INTROUVABLE/.test(err.message)) bShowToast('Ce projet n\'est plus dans la base. Rechargez la page.', true);
    else bShowToast('Erreur : ' + err.message, true);
  } finally {
    bShowLoading(false);
  }
}

// ═══════════ MÉTROPOLE (lecture seule) ═══════════
function bRemplirSelect(sel, valeurs, premier) {
  var courant = sel.value;
  vider(sel);
  var o0 = el('option', '', premier); o0.value = ''; sel.appendChild(o0);
  valeurs.forEach(function (v) { var o = el('option', '', v); o.value = v; sel.appendChild(o); });
  sel.value = valeurs.indexOf(courant) !== -1 ? courant : '';
}
function uniques(liste) {
  return liste.filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort(function (a, b) { return String(a).localeCompare(String(b)); });
}

function bAfficherMetropole() {
  var selC = document.getElementById('b-metro-filtre-commune');
  var selE = document.getElementById('b-metro-filtre-essence');
  var tout = bMetroGrumes.concat(bMetroProduits);
  bRemplirSelect(selC, uniques(tout.map(function (l) { return l.commune; })), 'Toutes communes');
  bRemplirSelect(selE, uniques(tout.map(function (l) { return l.essence; })), 'Toutes essences');
  var fC = selC.value, fE = selE.value;

  bDessinerCommunes(bMetroGrumes.filter(function (l) { return !fE || l.essence === fE; }));

  var par = {};
  function ligne(l) {
    var k = (l.commune || '—') + '::' + (l.essence || '—');
    return par[k] = par[k] || { commune: l.commune || '—', essence: l.essence || '—', grumes: 0, volG: 0, pieces: 0, volP: 0 };
  }
  function garde(l) { return (!fC || l.commune === fC) && (!fE || l.essence === fE); }
  bMetroGrumes.filter(garde).forEach(function (l) { var x = ligne(l); x.grumes += 1; x.volG += parseFloat(l.vol_utile) || 0; });
  bMetroProduits.filter(garde).forEach(function (l) { var x = ligne(l); x.pieces += l.restant || 0; x.volP += l.volumeRestant || 0; });

  var rows  = Object.keys(par).map(function (k) { return par[k]; })
    .sort(function (a, b) { return (b.volG + b.volP) - (a.volG + a.volP); });
  var tbody = document.getElementById('b-metro-tbody');
  vider(tbody);
  if (rows.length === 0) { tbody.appendChild(bTrVide(6, 'Aucun bois disponible pour ces filtres.')); return; }
  var t = { grumes: 0, volG: 0, pieces: 0, volP: 0 };
  rows.forEach(function (r) {
    t.grumes += r.grumes; t.volG += r.volG; t.pieces += r.pieces; t.volP += r.volP;
    var moi = bCommune && r.commune === bCommune.nom;
    tbody.appendChild(bTr([{ t: r.commune, cls: moi ? 'b-essence-nom' : '' }, { t: r.essence, cls: 'b-provenance' },
      r.grumes || '—', { t: r.grumes ? m3(r.volG) : '—', cls: 'b-vol' },
      r.pieces || '—', { t: r.pieces ? m3(r.volP) : '—', cls: 'b-vol' }], moi ? 'b-tr-moi' : ''));
  });
  tbody.appendChild(bTr(['Total métropole', '', t.grumes, { t: m3(t.volG), cls: 'b-vol' }, t.pieces, { t: m3(t.volP), cls: 'b-vol' }], 'b-tr-total'));
}

function bDessinerCommunes(data) {
  var svg     = document.getElementById('b-donut-svg');
  var center  = document.getElementById('b-donut-center');
  var legende = document.getElementById('b-donut-legende');
  vider(svg); vider(center); vider(legende);
  var par = {};
  data.forEach(function (l) { if (l.commune) par[l.commune] = (par[l.commune] || 0) + (parseFloat(l.vol_utile) || 0); });
  var total = Object.keys(par).reduce(function (s, k) { return s + par[k]; }, 0);
  if (total === 0) { center.appendChild(el('div', 'b-donut-center-lbl', 'Aucune grume')); return; }

  var tri = Object.keys(par).sort(function (a, b) { return par[b] - par[a]; });
  var segments = tri.slice(0, 6).map(function (k) { return { nom: k, vol: par[k] }; });
  var autres   = tri.slice(6).reduce(function (s, k) { return s + par[k]; }, 0);
  if (autres > 0) segments.push({ nom: 'Autres', vol: autres });

  var r = 80, circonf = 2 * Math.PI * r, offset = 0;
  function cercle(cls, dash) {
    var c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', 100); c.setAttribute('cy', 100); c.setAttribute('r', r);
    c.setAttribute('class', 'b-anneau ' + cls);
    if (dash !== undefined) {
      c.setAttribute('stroke-dasharray', dash + ' ' + (circonf - dash));
      c.setAttribute('stroke-dashoffset', -offset);
    }
    svg.appendChild(c);
  }
  cercle('b-anneau-fond');
  segments.forEach(function (seg, i) {
    var dash = seg.vol / total * circonf;
    cercle('b-trait-' + (i % NB_TEINTES), dash);
    offset += dash;
    var item = el('div', 'b-donut-legende-item');
    item.appendChild(el('div', 'b-donut-legende-dot b-teinte-' + (i % NB_TEINTES)));
    item.appendChild(el('span', 'b-donut-legende-nom', seg.nom));
    item.appendChild(el('span', 'b-donut-legende-pct', Math.round(seg.vol / total * 100) + '%'));
    legende.appendChild(item);
  });
  center.appendChild(el('div', 'b-donut-center-val', total.toFixed(1)));
  center.appendChild(el('div', 'b-donut-center-lbl', 'm³ de grumes'));
}

// ═══════════ EXPORT TABLEUR ═══════════
// Fichier CSV lu par Excel et LibreOffice : séparateur point-virgule,
// décimales à la virgule, nombres exportés comme des nombres.
function csvTexte(v) {
  var s = (v === null || v === undefined) ? '' : String(v);
  // Un texte qui commence par = + - @ serait lu comme une formule
  if (/^[=+\-@\t\r]/.test(s)) s = '\'' + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
function csvNb(v, dec) {
  if (v === null || v === undefined || v === '') return '';
  var n = parseFloat(v);
  return isNaN(n) ? '' : n.toFixed(dec || 0).replace('.', ',');
}
function csvDate(d) { return d ? csvTexte(fmtDate(d)) : '""'; }
function anneeDe(d) { var x = new Date(d); return isNaN(x) ? '' : String(x.getFullYear()); }

// Chaque tableau : en-têtes, lignes { essence, annee, vol, c: [cellules] },
// et la colonne du volume à totaliser.
function bTableauExport(type, source) {
  var metro = source === 'metropole';
  var rows = [], entetes, colVol = -1;

  if (type === 'grumes_stock' || type === 'grumes_toutes') {
    entetes = ['Commune', 'N° grume', 'Essence', 'Longueur m', 'Diamètre cm', 'Volume m3', 'Date d\'abattage',
               'Année de coupe', 'Provenance', 'Cause', 'Repère', 'Date de saisie', 'État', 'À débiter avant le', 'Campagne'];
    colVol = 5;
    var reservees = grumesADebiter(), sorties = clesGrumesSorties();
    var base = type === 'grumes_toutes' ? lots : (metro ? bMetroGrumes : DuramenCore.getGrumesEnStock());
    base.forEach(function (g) {
      var m = DuramenCore.mesuresGrume(g), u = DuramenCore.urgenceDebitGrume(g);
      var etat = 'En stock', camp = '', enStock = true;
      if (!metro || type === 'grumes_toutes') {
        var ex = sorties[g.id + '_0'];
        if (ex) {
          enStock = false;
          etat = ex.type_sortie === 'sciage' ? 'Sciée' : 'Sortie entière';
          camp = ex.type_sortie === 'sciage' ? (ex.destination || '') : '';
        } else if (reservees[g.id]) { etat = 'À débiter'; camp = reservees[g.id].nom || ''; }
        else if (!DuramenCore.estNumerotee(g)) etat = 'En attente de marquage';
      }
      rows.push({ essence: g.essence, annee: String(g.annee || ''), vol: parseFloat(g.vol_utile) || 0, c: [
        csvTexte(g.commune || (metro ? '' : bCommune.nom)), csvTexte(g.nom || ''), csvTexte(g.essence),
        csvNb(m.longueur, 2), csvNb(m.diametre, 0), csvNb(g.vol_utile, 3),
        DuramenCore.abattageInconnu(g) ? csvTexte('Inconnue') : csvDate(g.date_abattage),
        csvTexte(g.annee || ''), csvTexte(g.provenance || ''), csvTexte(g.cause || ''), csvTexte(g.repere || ''),
        csvDate(g.date_iso || g.created_at), csvTexte(etat),
        enStock && u.dateLimite ? csvDate(u.dateLimite) : '""', csvTexte(camp)
      ] });
    });
  }

  if (type === 'produits') {
    entetes = ['Commune', 'Essence', 'Type', 'Épaisseur mm', 'Largeur mm', 'Longueur m', 'Pièces en stock',
               'Pièces sciées', 'Volume en stock m3', 'Grume d\'origine', 'Scié le', 'Sec à l\'air le'];
    colVol = 8;
    (metro ? bMetroProduits : DuramenCore.getStockProduits()).forEach(function (l) {
      rows.push({ essence: l.essence, annee: anneeDe(l.dateSciage), vol: l.volumeRestant || 0, c: [
        csvTexte(l.commune || bCommune.nom), csvTexte(l.essence), csvTexte(l.type === 'avive' ? 'Avivé' : 'Plot'),
        csvNb(l.epaisseur_mm, 0), l.type === 'avive' ? csvNb(l.largeur_mm, 0) : '', csvNb(l.longueur_m, 2),
        csvNb(l.restant, 0), csvNb(l.quantite, 0), csvNb(l.volumeRestant, 3), csvTexte(l.grume_nom || ''),
        csvDate(l.dateSciage), csvDate(l.dateSecAir)
      ] });
    });
  }

  if (type === 'campagnes') {
    entetes = ['Campagne', 'Date prévue', 'État', 'N° grume', 'Essence', 'Longueur m', 'Diamètre cm', 'Volume grume m3',
               'Débit demandé', 'Pièces demandées', 'Volume demandé m3', 'Réalisé', 'Pièces obtenues', 'Volume obtenu m3', 'Sciée le'];
    colVol = 13;
    campagnes.forEach(function (c) {
      var close = campagneCloturee(c);
      (c.lignes || []).forEach(function (l) {
        var sc = extractions.find(function (e) { return e.campagne_id === c.id && (e.grumes_keys || []).indexOf(l.grume_id + '_0') !== -1; });
        var prods = sc ? (sc.produits || []) : [];
        rows.push({ essence: l.essence, annee: anneeDe(c.date_prevue || c.date_iso), vol: sc ? (parseFloat(sc.vol_produits) || 0) : 0, c: [
          csvTexte(c.nom || ''), csvDate(c.date_prevue), csvTexte(close ? 'Clôturée' : 'En préparation'),
          csvTexte(l.nom || ''), csvTexte(l.essence), csvNb(l.longueur, 2), csvNb(l.diametre, 0), csvNb(l.vol, 3),
          csvTexte(texteDemande(l)), csvNb(l.estimation_quantite, 0), csvNb(l.estimation_volume, 3),
          csvTexte(sc ? (prods.length ? prods.map(function (p) { return p.quantite + ' × ' + texteProduit(p); }).join(' + ') : 'Aucun produit')
                      : (close ? 'Non sciée' : '')),
          sc ? csvNb(prods.reduce(function (s, p) { return s + (parseFloat(p.quantite) || 0); }, 0), 0) : '',
          sc ? csvNb(sc.vol_produits, 3) : '', sc ? csvDate(sc.date_iso) : '""'
        ] });
      });
    });
  }

  if (type === 'projets') {
    entetes = ['Projet', 'Bois sorti le', 'Nature', 'Essence', 'Détail', 'Pièces', 'Volume m3', 'Grume d\'origine',
               'Commune', 'Lieu prévu', 'Objet réalisé', 'Réalisé le', 'Posé le', 'Lieu de pose', 'Étape'];
    colVol = 6;
    bProjets().forEach(function (p) {
      p.lignes.forEach(function (e) {
        bDetailSortie(e).forEach(function (d) {
          rows.push({ essence: e.essence, annee: anneeDe(p.date), vol: d.volume, c: [
            csvTexte(p.nom), csvDate(p.date), csvTexte(e.type_sortie === 'produit' ? 'Produits bois' : 'Grume entière'),
            csvTexte(e.essence), csvTexte(d.texte), csvNb(d.pieces, 0), csvNb(d.volume, 3), csvTexte(d.grume),
            csvTexte(p.commune), csvTexte(p.lieu), csvTexte(p.objet), csvDate(p.date_realisation),
            csvDate(p.date_pose), csvTexte(p.lieu_pose), csvTexte(ETAPES[p.etape])
          ] });
        });
      });
    });
  }
  return { entetes: entetes, rows: rows, colVol: colVol };
}

function bExportCourant() {
  var type   = document.getElementById('b-exp-donnees').value;
  var selS   = document.getElementById('b-exp-source');
  // La métropole ne partage que le bois disponible : grumes en stock et produits
  var metroPossible = type === 'grumes_stock' || type === 'produits';
  selS.disabled = !metroPossible;
  if (!metroPossible) selS.value = 'commune';
  return { type: type, source: selS.value, tableau: bTableauExport(type, selS.value) };
}

function bMajExport() {
  var x    = bExportCourant();
  var selE = document.getElementById('b-exp-essence');
  var selA = document.getElementById('b-exp-annee');
  document.getElementById('b-exp-annee-lbl').textContent = x.type.indexOf('grumes') === 0 ? 'ANNÉE DE COUPE' : 'ANNÉE';
  bRemplirSelect(selE, uniques(x.tableau.rows.map(function (r) { return r.essence; })), 'Toutes essences');
  bRemplirSelect(selA, uniques(x.tableau.rows.map(function (r) { return r.annee; })).reverse(), 'Toutes années');
  var n = bLignesFiltrees(x.tableau).length;
  document.getElementById('b-exp-compte').textContent = pl(n, 'ligne') + ' à exporter';
}

function bLignesFiltrees(tableau) {
  var essence = document.getElementById('b-exp-essence').value;
  var annee   = document.getElementById('b-exp-annee').value;
  return tableau.rows.filter(function (r) {
    return (!essence || r.essence === essence) && (!annee || r.annee === annee);
  });
}

function bExporter() {
  var x = bExportCourant();
  var rows = bLignesFiltrees(x.tableau);
  if (rows.length === 0) { bShowToast('Aucune ligne à exporter avec ces filtres.', true); return; }
  // Total : somme des volumes déjà arrondis au millième, comme le ferait le tableur
  var total = rows.reduce(function (s, r) { return s + arrondiM3(r.vol); }, 0);
  var ligneTotal = x.tableau.entetes.map(function (h, i) {
    return i === 0 ? csvTexte('TOTAL') : (i === x.tableau.colVol ? csvNb(total, 3) : '');
  });
  var csv = '﻿' + x.tableau.entetes.map(csvTexte).join(';') + '\n'
    + rows.map(function (r) { return r.c.join(';'); }).join('\n')
    + '\n' + ligneTotal.join(';');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url;
  a.download = 'duramen_' + x.type + '_' + (x.source === 'metropole' ? 'metropole' : 'commune') + '_' + jourISO() + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═══════════ TICKET RETOUR ═══════════
function bSelFeedbackType(btn, type) {
  document.querySelectorAll('.b-feedback-type-btn').forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');
  bFeedbackType = type;
}
function bEffacerTicket() {
  document.querySelectorAll('.b-feedback-type-btn').forEach(function (b) { b.classList.remove('active'); });
  bFeedbackType = null;
  var msg = document.getElementById('b-feedback-message');
  if (msg) msg.value = '';
}
async function bEnvoyerTicket() {
  var msg = document.getElementById('b-feedback-message');
  if (!bFeedbackType)            { bShowToast('Choisissez un type de retour.', true); return; }
  if (!msg || !msg.value.trim()) { bShowToast('Le message ne peut pas être vide.', true); return; }
  bShowLoading(true);
  try {
    await bSbInsert('feedbacks', {
      id: crypto.randomUUID(), commune_code: bCommune.code,
      commune: bCommune.nom, type: bFeedbackType, message: msg.value.trim()
    });
    bEffacerTicket();
    bShowToast('Ticket envoyé. Merci pour votre retour !');
    bSwitchTab('grumes');
  } catch (e) {
    bShowToast(e.reseau ? 'Pas de réseau : le ticket s\'envoie avec réseau.' : 'Erreur : ' + e.message, true);
  } finally {
    bShowLoading(false);
  }
}

// ═══════════ RAFRAÎCHISSEMENT ═══════════
// Le bureau et le mobile travaillent sur la même base, au même moment.
// Les données sont relues toutes les 2 minutes, au retour sur la fenêtre et
// au retour du réseau. Une fenêtre de saisie ouverte n'est jamais reconstruite.
setInterval(function () {
  if (bCommune && !document.hidden) bChargerDonnees({ silencieux: true });
}, RAFRAICHISSEMENT_MS);
document.addEventListener('visibilitychange', function () {
  if (bCommune && !document.hidden && Date.now() - bDernierChargement > 15000) bChargerDonnees({ silencieux: true });
});
window.addEventListener('online', function () {
  if (bCommune) bChargerDonnees({ silencieux: true });
});

// ═══════════ INIT ═══════════
(function () {
  var session = lireLocal('duramen_bureau_session');
  if (session && session.code && session.nom) { bCommune = session; bLancerApp(); }
})();
