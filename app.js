// app.js — Logique UI, navigation, appels Supabase
// Dépend de core.js (DuramenCore) chargé avant ce fichier.

// ═══════════ SUPABASE ═══════════
const SUPABASE_URL = 'https://zeadibimbdztpmsesaiw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYWRpYmltYmR6dHBtc2VzYWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTI2MTcsImV4cCI6MjA5MDQ2ODYxN30.xEHLNTROTu9QJ7c_vV3S54P76EXfpnx2VbhxznbQmmU';
const sbH = {
  'Content-Type':   'application/json',
  'apikey':         SUPABASE_KEY,
  'Authorization':  'Bearer ' + SUPABASE_KEY,
  'Prefer':         'return=representation',
  'x-commune-code': ''
};

// ─── Délai maximal d'une requête Supabase ─────────────────────────────────
// Sur le terrain, avec une seule barre de réseau, une requête peut rester
// sans réponse plusieurs minutes. Au-delà de ce délai, on abandonne et
// l'appli bascule sur le cache (lecture) ou la file d'envoi (écriture).
var DELAI_LECTURE_MS = 15000;
var DELAI_ENVOI_MS   = 20000;

// Erreur « pas de réseau » : la requête n'a pas pu aboutir (réseau coupé,
// délai dépassé, ou réponse « Hors ligne » d'un ancien Service Worker).
// À distinguer d'un refus du serveur, qui ne doit jamais être rejoué.
function erreurReseau(table) {
  var err = new Error('Pas de réseau (' + table + ')');
  err.reseau = true;
  return err;
}

// fetch + lecture complète de la réponse, le tout limité à `ms`.
async function requeteSupabase(url, options, ms, table) {
  var ctrl  = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, ms);
  try {
    var res   = await fetch(url, Object.assign({}, options, { signal: ctrl.signal }));
    var texte = await res.text();
    if (res.status === 503 && texte === 'Hors ligne') throw erreurReseau(table);
    return { res: res, texte: texte };
  } catch (e) {
    if (e && e.reseau) throw e;
    throw erreurReseau(table);
  } finally {
    clearTimeout(timer);
  }
}

async function sbSelect(table, filter) {
  var r = await requeteSupabase(SUPABASE_URL + '/rest/v1/' + table + '?' + (filter || ''),
    { headers: sbH }, DELAI_LECTURE_MS, table);
  if (!r.res.ok) throw new Error('Lecture ' + table + ': ' + r.res.status);
  return JSON.parse(r.texte);
}
// `options.sansRetour` : n'attend pas la ligne créée en réponse. Obligatoire
// pour les tables sans droit de lecture (feedbacks) : demander la ligne en
// retour y provoque un refus du serveur.
async function sbInsert(table, data, options) {
  var entetes = Object.assign({}, sbH);
  if (options && options.sansRetour) entetes['Prefer'] = 'return=minimal';
  var r = await requeteSupabase(SUPABASE_URL + '/rest/v1/' + table, {
    method: 'POST', headers: entetes, body: JSON.stringify(data)
  }, DELAI_ENVOI_MS, table);
  if (!r.res.ok) {
    var err = new Error('Insertion ' + table + ': ' + r.res.status + ' ' + r.texte);
    err.statut = r.res.status;
    throw err;
  }
  return r.texte ? JSON.parse(r.texte) : [];
}
// ═══════════ DONNEES ═══════════
var lots = [], extractions = [], campagnes = [];

// ESSENCES_INFO est dans core.js → DuramenCore.ESSENCES_INFO

// ─── Précision des volumes : le millième de m³ (1 dm³) ────────────────────
// Usage de la filière bois (règles de mesurage ATIBT) : cubage des grumes
// et des sciages en m³ avec trois décimales. Tout volume enregistré passe ici.
function arrondiM3(v) { return Math.round((v || 0) * 1000) / 1000; }

// Volume d'une sortie, prêt à valider et à enregistrer.
// Chaque volume est arrondi au millième : la somme des grumes choisies peut
// différer du stock de quelques millièmes.
// - La sortie emporte les dernières grumes de l'essence : elle vaut
//   exactement le stock restant. Le stock tombe à zéro, sans reste.
// - Sinon, un dépassement de 1 dm³ par grume au plus est ramené au stock.
function volumeSortie(essence, volume, videEssence) {
  var v = arrondiM3(volume);
  var s = DuramenCore.getStock()[essence];
  if (!s) return v;
  if (videEssence) return s.dispo;
  var tolerance = 0.001 * Math.max(1, s.nbGrumes);
  if (v > s.dispo && v - s.dispo <= tolerance) v = s.dispo;
  return v;
}

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

// ─── File d'envoi hors ligne ──────────────────────────────────────────────
// Une grume (ou un ticket) validée sans réseau est gardé sur le téléphone, puis
// envoyé automatiquement : à l'ouverture de l'appli, au retour du réseau et
// à chaque rafraîchissement (2 min). Chaque élément garde son identifiant
// d'origine : s'il est déjà arrivé en base (réponse perdue en route), le
// serveur refuse le doublon et l'élément est simplement retiré de la file.
// Les extractions n'y passent pas : elles se font à l'atelier, avec réseau.
var CLE_FILE_ENVOI = 'duramen_file_envoi';
var envoiFileEnCours = false;

function lireFileEnvoi() {
  try {
    var f = JSON.parse(localStorage.getItem(CLE_FILE_ENVOI) || '[]');
    return Array.isArray(f) ? f : [];
  } catch (e) { return []; }
}
function ecrireFileEnvoi(f) {
  localStorage.setItem(CLE_FILE_ENVOI, JSON.stringify(f));
}
function ajouterFileEnvoi(table, data, options) {
  var f = lireFileEnvoi();
  f.push({ table: table, data: data, sansRetour: !!(options && options.sansRetour) });
  ecrireFileEnvoi(f);
  mettreAJourBandeauEnvoi();
}
function retirerFileEnvoi(id) {
  ecrireFileEnvoi(lireFileEnvoi().filter(function (it) { return !it.data || it.data.id !== id; }));
}
// Seuls les éléments de la commune connectée partent (le serveur refuserait
// les autres) ; ceux d'une autre commune attendent sa reconnexion.
function fileEnvoiCommune() {
  if (!communeConnectee) return [];
  return lireFileEnvoi().filter(function (it) {
    return it.data && it.data.commune_code === communeConnectee.code;
  });
}

function mettreAJourBandeauEnvoi() {
  var f    = fileEnvoiCommune();
  var el   = document.getElementById('envoi-attente-banner');
  if (!f.length) { if (el) el.classList.add('hidden'); return; }
  if (!el) {
    el = document.createElement('div');
    el.id        = 'envoi-attente-banner';
    el.className = 'info-box';
    var main = document.querySelector('main');
    if (main) main.insertBefore(el, main.firstChild);
  }
  var nbLots    = f.filter(function (it) { return it.table === 'grumes'; }).length;
  var nbTickets = f.length - nbLots;
  var parts = [];
  if (nbLots)    parts.push(nbLots + (nbLots > 1 ? ' grumes' : ' grume'));
  if (nbTickets) parts.push(nbTickets + (nbTickets > 1 ? ' tickets' : ' ticket'));
  // « grume » et « ticket » : accord au féminin seulement s'il n'y a que des grumes
  var accord = nbTickets ? 'gardé' : 'gardée';
  el.textContent = '📤 ' + parts.join(' et ') + ' ' + accord + (f.length > 1 ? 's' : '')
    + ' sur ce téléphone — envoi automatique dès le retour du réseau.';
  el.classList.remove('hidden');
}

// Envoie ce qui attend. Retourne le nombre d'éléments envoyés.
// Ne lève jamais d'erreur.
async function envoyerFileEnvoi() {
  if (envoiFileEnCours) return 0;
  var f = fileEnvoiCommune();
  if (!f.length) { mettreAJourBandeauEnvoi(); return 0; }
  envoiFileEnCours = true;
  var nbLotsEnvoyes = 0, nbTicketsEnvoyes = 0;
  try {
    for (var i = 0; i < f.length; i++) {
      var it = f[i];
      try {
        await sbInsert(it.table, it.data, { sansRetour: it.sansRetour });
      } catch (err) {
        if (err.reseau) break;                    // toujours pas de réseau : on réessaiera
        // Code 23505 = cet identifiant est déjà en base (envoi précédent arrivé,
        // réponse perdue en route) → considéré comme envoyé.
        // Tout autre refus du serveur : on garde l'élément, sans bloquer la suite.
        // Exception : ce numéro existe déjà en base (index grumes_nom_unique).
        // Le numéro correspond à l'étiquette physique : c'est une erreur de
        // saisie ou une grume déjà enregistrée. La grume n'est PAS en base :
        // on la retire de la file et on affiche ses mesures pour vérification.
        if (/grumes_nom_unique/.test(err.message)) {
          retirerFileEnvoi(it.data.id);
          var g0 = (it.data.grumes && it.data.grumes[0]) || {};
          showError('Le numéro ' + it.data.nom + ' existe déjà. Vérifiez l\'étiquette de la grume : '
            + 'erreur de saisie ou grume déjà enregistrée. Grume non envoyée : '
            + it.data.essence + ', ' + g0.longueur + ' m × ' + g0.diametre + ' cm.');
          continue;
        }
        if (!(err.statut === 409 && /23505/.test(err.message))) continue;
      }
      retirerFileEnvoi(it.data.id);
      if (it.table === 'grumes') nbLotsEnvoyes++; else nbTicketsEnvoyes++;
    }
  } catch (e) {
    // sécurité : la file reste en place pour le prochain essai
  } finally {
    envoiFileEnCours = false;
    mettreAJourBandeauEnvoi();
  }
  if (nbLotsEnvoyes || nbTicketsEnvoyes) {
    var msg = [];
    if (nbLotsEnvoyes)    msg.push(nbLotsEnvoyes + (nbLotsEnvoyes > 1 ? ' grumes envoyées' : ' grume envoyée'));
    if (nbTicketsEnvoyes) msg.push(nbTicketsEnvoyes + (nbTicketsEnvoyes > 1 ? ' tickets envoyés' : ' ticket envoyé'));
    showToastSucces('Réseau retrouvé : ' + msg.join(', ') + '.');
  }
  return nbLotsEnvoyes + nbTicketsEnvoyes;
}

// Retour du réseau : on vide la file puis on recharge le stock
window.addEventListener('online', function () {
  if (!communeConnectee) return;
  envoyerFileEnvoi().then(function () { chargerDonnees({ silencieux: true }); });
});

// ─── Chargement Supabase ──────────────────────────────────────────────────
// `options.silencieux` : rafraîchissement automatique en arrière-plan.
// Pas de voile « Chargement… » (il bloquerait l'écran en pleine saisie)
// et pas de message d'erreur répété toutes les 2 minutes.
async function chargerDonnees(options) {
  if (!communeConnectee) return;
  var silencieux = !!(options && options.silencieux);
  var code = encodeURIComponent(communeConnectee.code);
  if (!silencieux) showLoading(true);
  try {
    var rawLots = await sbSelect('grumes', 'commune_code=eq.' + code + '&order=created_at.desc');
    var rawExt  = await sbSelect('extractions', 'commune_code=eq.' + code + '&order=created_at.desc');
    var rawCamp = await sbSelect('campagnes', 'commune_code=eq.' + code + '&order=created_at.desc');
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
    campagnes   = rawCamp;
    localStorage.setItem('duramen_lots_cache',        JSON.stringify(lots));
    localStorage.setItem('duramen_extractions_cache', JSON.stringify(extractions));
    localStorage.setItem('duramen_campagnes_cache',   JSON.stringify(campagnes));
    mettreAJourHeaderStats();
    mettreAJourAccueil();
    afficherHistorique();
    // Ne pas reconstruire l'écran Extraction si une sélection est en cours :
    // le rafraîchissement auto (toutes les 2 min) effacerait le travail de l'agent.
    if (!extractionEnCours()) afficherExtraction();
    showOfflineBanner(false);
  } catch (err) {
    var cachedLots = localStorage.getItem('duramen_lots_cache');
    var cachedExt  = localStorage.getItem('duramen_extractions_cache');
    if (cachedLots) {
      lots        = JSON.parse(cachedLots);
      extractions = cachedExt ? JSON.parse(cachedExt) : [];
      campagnes   = lireJSONLocal('duramen_campagnes_cache') || [];
      mettreAJourHeaderStats();
      mettreAJourAccueil();
      afficherHistorique();
      showOfflineBanner(true);
    } else if (!silencieux) {
      showError('Erreur chargement : ' + err.message);
    }
  } finally {
    if (!silencieux) showLoading(false);
  }
}

// ─── État de l'écran Extraction ───────────────────────────────────────────
var extDraft     = { destination: '', communeInstall: '', lieu: '' };
var extGrumesSel = [];
var extEssFiltre = null;
// Mode de sortie : 'produits' (cas normal) ou 'grume' (exception : rondins,
// pas japonais…). Sélection de produits : clé du produit → nombre de pièces.
var extMode        = 'produits';
var extProduitsSel = {};

// Clés des grumes déjà sorties du stock, lues dans extractions.grumes_keys.
// Une clé = id du lot + '_' + position de la grume dans le lot (ex. "abc_0").
// Une grume extraite ne doit plus jamais être proposée à la sélection.
function clesGrumesExtraites() {
  var cles = {};
  extractions.forEach(function (ex) {
    (ex.grumes_keys || []).forEach(function (k) { cles[k] = true; });
  });
  return cles;
}

// Nombre de grumes d'une essence encore en stock (pas encore extraites).
function nbGrumesRestantes(essence) {
  var extraites = clesGrumesExtraites();
  var n = 0;
  lots.forEach(function (l) {
    if (l.essence !== essence || !l.grumes) return;
    l.grumes.forEach(function (g, gi) { if (!extraites[l.id + '_' + gi]) n++; });
  });
  return n;
}

// Vrai si l'agent est en train de préparer une extraction :
// grumes sélectionnées, filtre essence actif, sheet ou modale ouverte.
function extractionEnCours() {
  var sheet = document.getElementById('grume-sel-sheet-wrap');
  var modal = document.getElementById('modal-ext-bg');
  return !!(extGrumesSel.length > 0
    || Object.keys(extProduitsSel).some(function (k) { return extProduitsSel[k] > 0; })
    || extEssFiltre !== null
    || (sheet && sheet.classList.contains('open'))
    || (modal && modal.classList.contains('open')));
}

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
  extGrumesSel   = [];
  extProduitsSel = {};
  extEssFiltre   = null;

  // Bascule : produits bois (cas normal) / grume brute (exception)
  var bar = cel('div', 'histo-toggle-bar ext-mode-bar');
  [['produits', 'Produits bois'], ['grume', 'Grume brute']].forEach(function (o) {
    var b = cel('button', 'histo-toggle-btn' + (extMode === o[0] ? ' active' : ''), o[1]);
    b.type    = 'button';
    b.onclick = function () { extMode = o[0]; afficherExtraction(); };
    bar.appendChild(b);
  });
  panel.appendChild(bar);

  if (extMode === 'produits') {
    afficherExtractionProduits(panel);
    assureModalExtractionDest();
    return;
  }

  panel.appendChild(cel('div', 'info-box',
    'Exception : la grume sort entière, sans sciage (rondins, pas japonais…). '
    + 'Les grumes d\'une campagne de sciage en cours ne sont pas proposées.'));

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

  // Barre de synthèse (le débit en planches passe par la campagne de sciage)
  var synthese = cel('div', 'ext-synthese hidden');
  synthese.id  = 'ext-synthese';
  [
    { id: 'ext-syn-brut',  lbl: 'm³ extrait' }
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
  var sousTitre = cel('p', 'modal-sub', 'À qui vont ces grumes ?');
  sousTitre.id = 'modal-ext-sub';
  modal.appendChild(sousTitre);

  // Nom du projet
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

  // Commune d'installation — propre commune, lecture seule
  var fCom = cel('div', 'field');
  fCom.appendChild(cel('label', '', 'Commune d\'installation'));
  var vCom = cel('div', 'commune-readonly-val',
    communeConnectee ? communeConnectee.nom : '—');
  vCom.id = 'modal-ext-commune-val';
  fCom.appendChild(vCom);
  modal.appendChild(fCom);

  // Lieu (optionnel)
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
  if (extMode === 'produits') {
    if (selectionProduits().length === 0) { showError('Choisissez au moins un produit.'); return; }
  } else if (extGrumesSel.length === 0) { showError('Sélectionnez au moins une grume.'); return; }
  assureModalExtractionDest();
  var sub = document.getElementById('modal-ext-sub');
  if (sub) sub.textContent = extMode === 'produits' ? 'À qui vont ces produits ?' : 'À qui vont ces grumes ?';
  var nomEl  = document.getElementById('modal-ext-nom');
  var lieuEl = document.getElementById('modal-ext-lieu');
  if (nomEl)  nomEl.value  = extDraft.destination;
  if (lieuEl) lieuEl.value = extDraft.lieu;
  document.getElementById('modal-ext-bg').classList.add('open');
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

  // Les grumes déjà extraites sortent de la liste ; un lot entièrement
  // extrait disparaît. Le lot reste en base pour le bilan et l'historique.
  var extraites = clesGrumesExtraites();
  var reservees = grumesADebiter();
  var lotsFiltrés = lots.filter(function (l) {
    if (!l.grumes || l.grumes.length === 0) return false;
    if (reservees[l.id]) return false;
    if (extEssFiltre && l.essence !== extEssFiltre) return false;
    return l.grumes.some(function (g, gi) { return !extraites[l.id + '_' + gi]; });
  });

  var selState = {};
  var allVolMap = {};
  extGrumesSel.forEach(function (g) { selState[g.key] = true; });

  if (lotsFiltrés.length === 0) {
    content.appendChild(cel('div', 'ext-empty', 'Aucune grume disponible' + (extEssFiltre ? ' pour ' + extEssFiltre : '') + '.'));
  } else {
    lotsFiltrés.forEach(function (lot) {
      var hdr = cel('div', 'grume-sel-lot-header');
      hdr.appendChild(cel('span', 'grume-sel-lot-nom', lot.nom || 'Grume sans nom'));
      hdr.appendChild(cel('span', 'grume-sel-lot-ess', lot.essence));
      content.appendChild(hdr);

      var volMap = {};
      lot.grumes.forEach(function (g, gi) {
        var key = lot.id + '_' + gi;
        if (extraites[key]) return;
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
          'L ' + l.toFixed(2) + ' m  ·  Ø ' + d + ' cm'
          + (lot.grumes.length > 1 ? '  ·  n°' + (gi + 1) : '')));
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
  var extraites = clesGrumesExtraites();
  extGrumesSel = [];
  lotsFiltrés.forEach(function (lot) {
    if (!lot.grumes) return;
    lot.grumes.forEach(function (g, gi) {
      var key = lot.id + '_' + gi;
      if (!selState[key] || extraites[key]) return;
      var d   = parseFloat(g.diametre) || 0;
      var l   = parseFloat(g.longueur) || 0;
      var qty = g.quantite || 1;
      extGrumesSel.push({
        key:      key,
        lotId:    lot.id,
        lotNom:   lot.nom || 'Grume sans nom',
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
  var elBrut = document.getElementById('ext-syn-brut');
  if (elBrut) elBrut.textContent = volBrut.toFixed(3);
}

async function confirmerExtractionDest() {
  var nomEl   = document.getElementById('modal-ext-nom');
  var lieuEl  = document.getElementById('modal-ext-lieu');

  var destination    = nomEl   ? nomEl.value.trim()  : '';
  var lieu           = lieuEl  ? lieuEl.value.trim()  : '';
  var communeInstall = communeConnectee ? communeConnectee.nom : '';
  // Usage retiré de la fiche (7 juil. 2026) mais toujours exigé par
  // DuramenCore.validerSortie (noyau figé) et présent en base.
  var usage = 'Non défini';

  extDraft.destination    = destination;
  extDraft.communeInstall = communeInstall;
  extDraft.lieu           = lieu;

  if (extMode === 'produits') { await confirmerExtractionProduits(); return; }

  var parEssence     = {};
  var clesParEssence = {};
  extGrumesSel.forEach(function (g) {
    parEssence[g.essence] = (parEssence[g.essence] || 0) + g.vol;
    (clesParEssence[g.essence] = clesParEssence[g.essence] || []).push(g.key);
  });
  var essences = Object.keys(parEssence);

  for (var i = 0; i < essences.length; i++) {
    var valid = DuramenCore.validerSortie({
      essence: essences[i], volume: volumeSortie(essences[i], parEssence[essences[i]],
        clesParEssence[essences[i]].length === nbGrumesRestantes(essences[i])),
      usage: usage, destination: extDraft.destination
    });
    if (!valid.ok) { showError(valid.erreur); return; }
  }

  try {
    showLoading(true);

    // Re-vérification sur données fraîches : un autre agent a pu extraire
    // pendant la saisie (verrou anti sur-extraction, côté client)
    await chargerDonnees();
    for (var k = 0; k < essences.length; k++) {
      var valid2 = DuramenCore.validerSortie({
        essence: essences[k], volume: volumeSortie(essences[k], parEssence[essences[k]],
          clesParEssence[essences[k]].length === nbGrumesRestantes(essences[k])),
        usage: usage, destination: extDraft.destination
      });
      if (!valid2.ok) {
        showError('Le stock a changé entre-temps. ' + valid2.erreur);
        return;
      }
    }

    var now = new Date();
    var nouvelles = essences.map(function (ess) {
      return {
        id:              crypto.randomUUID(),
        commune_code:    communeConnectee.code,
        essence:         ess,
        volume:          arrondiM3(volumeSortie(ess, parEssence[ess],
                           clesParEssence[ess].length === nbGrumesRestantes(ess))),
        usage:           usage,
        destination:     extDraft.destination,
        commune:         communeInstall,
        contact:         '',
        notes:           extDraft.lieu ? 'Lieu : ' + extDraft.lieu : '',
        type_sortie:     'grume brute',
        grumes_keys:     clesParEssence[ess],
        date:            now.toLocaleDateString('fr-FR'),
        date_iso:        now.toISOString()
      };
    });
    // Envoi groupé : soit toutes les essences passent, soit aucune
    try {
      await sbInsert('extractions', nouvelles);
    } catch (e1) {
      // Colonne grumes_keys pas encore créée dans Supabase :
      // on enregistre quand même l'extraction, sans le marquage des grumes.
      if (/grumes_keys/.test(e1.message)) {
        nouvelles.forEach(function (n) { delete n.grumes_keys; });
        await sbInsert('extractions', nouvelles);
      } else {
        throw e1;
      }
    }
    await chargerDonnees();
    extDraft     = { destination: '', communeInstall: '', lieu: '' };
    extGrumesSel = [];
    fermerModalExtractionDest();
    afficherExtraction();
    showToastSucces('Extraction enregistrée.');
    var btnHisto = document.querySelector('.tab[onclick*="historique"]');
    if (btnHisto) switchTab('historique', btnHisto);
  } catch (err) {
    // Refus du verrou anti sur-extraction côté base : message clair + stock à jour
    var refus = err.message.match(/STOCK INSUFFISANT[^"]*/);
    if (refus) {
      showError(refus[0]);
      await chargerDonnees();
      afficherExtraction();
    } else if (/GRUME RÉSERVÉE|GRUME DÉJÀ SORTIE/.test(err.message)) {
      // Un autre poste a sorti cette grume, ou l'a mise dans une campagne
      showError('Une grume choisie vient d\'être sortie ou mise dans une campagne de sciage depuis un autre poste. Rien n\'a été enregistré.');
      extGrumesSel = [];
      await chargerDonnees();
      afficherExtraction();
    } else {
      showError('Erreur : ' + err.message);
    }
  } finally {
    showLoading(false);
  }
}

// ─── Extraction de produits sciés (cas normal) ───────────────────────────
// L'agent choisit les produits et le nombre de pièces, puis la destination.
// La sortie ne touche pas au stock de grumes (volume 0, verrou serveur) :
// le volume réel des pièces est rangé dans vol_produits.

// Volume d'une pièce d'une ligne du stock produits
function volumePiece(l) {
  return l.restant > 0 ? (l.volumeRestant || 0) / l.restant : 0;
}

// Sélection en cours : [{ ligne, quantite }]
function selectionProduits() {
  var stock = {};
  DuramenCore.getStockProduits().forEach(function (l) { stock[l.cle] = l; });
  return Object.keys(extProduitsSel)
    .filter(function (k) { return extProduitsSel[k] > 0 && stock[k]; })
    .map(function (k) { return { ligne: stock[k], quantite: extProduitsSel[k] }; });
}

function afficherExtractionProduits(panel) {
  var lignes = DuramenCore.getStockProduits();
  var sec = cel('div', 'ext-section');
  sec.appendChild(cel('div', 'ext-section-title', 'Produits à sortir'));

  if (lignes.length === 0) {
    sec.appendChild(cel('div', 'ext-empty',
      'Aucun produit bois en stock. Les produits arrivent à la clôture d\'une campagne de sciage.'));
    panel.appendChild(sec);
    return;
  }

  var essences = [];
  lignes.forEach(function (l) { if (essences.indexOf(l.essence) === -1) essences.push(l.essence); });
  var liste = cel('div', 'ext-produits-liste');
  if (essences.length > 1) {
    var chips = cel('div', 'ext-essence-chips');
    essences.sort().forEach(function (ess) {
      var chip = cel('button', 'ext-chip', ess);
      chip.type = 'button';
      chip.dataset.ess = ess;
      chip.onclick = function () {
        extEssFiltre = (extEssFiltre === ess) ? null : ess;
        chips.querySelectorAll('.ext-chip').forEach(function (c) {
          c.classList.toggle('active', c.dataset.ess === extEssFiltre);
        });
        rendreListeProduitsExt(liste, lignes);
      };
      chips.appendChild(chip);
    });
    sec.appendChild(chips);
  }
  sec.appendChild(liste);
  panel.appendChild(sec);
  rendreListeProduitsExt(liste, lignes);

  var synthese = cel('div', 'ext-synthese hidden');
  synthese.id  = 'ext-synthese-produits';
  [['ext-syn-pieces', 'pièces'], ['ext-syn-vol-prod', 'm³ de produits']].forEach(function (d) {
    var item = cel('div', 'ext-syn-item');
    var val  = cel('div', 'ext-syn-val', '—');
    val.id   = d[0];
    item.appendChild(val);
    item.appendChild(cel('div', 'ext-syn-lbl', d[1]));
    synthese.appendChild(item);
  });
  panel.appendChild(synthese);

  var btnVal = cel('button', 'ext-valider-btn', 'Valider l\'extraction →');
  btnVal.type    = 'button';
  btnVal.onclick = ouvrirModalExtractionDest;
  panel.appendChild(btnVal);
}

function rendreListeProduitsExt(liste, lignes) {
  while (liste.firstChild) liste.removeChild(liste.firstChild);
  lignes
    .filter(function (l) { return !extEssFiltre || l.essence === extEssFiltre; })
    .forEach(function (l) {
      var card   = cel('div', 'histo-lot-card ext-produit-card');
      var header = cel('div', 'histo-lot-header');
      header.appendChild(cel('div', 'histo-lot-nom', l.essence + ' · ' + texteProduit(l)));
      header.appendChild(cel('div', 'histo-lot-vol', (l.volumeRestant || 0).toFixed(3) + ' m³'));
      card.appendChild(header);
      card.appendChild(cel('div', 'histo-essence-meta', 'En stock : ' + l.restant
        + (l.type === 'avive' ? ' pièce(s)' : ' planche(s)') + (l.grume_nom ? ' · grume ' + l.grume_nom : '')));
      var badges = cel('div', 'histo-badges');
      badges.appendChild(creerBadgeSechage(l.dateSecAir));
      card.appendChild(badges);

      // Nombre de pièces à sortir : − / saisie / + / tout
      var qte = cel('div', 'ext-qte');
      var bMoins = cel('button', 'btn btn-outline ext-qte-btn', '−');
      var inp    = document.createElement('input');
      var bPlus  = cel('button', 'btn btn-outline ext-qte-btn', '+');
      var bTout  = cel('button', 'btn btn-outline ext-qte-tout', 'Tout');
      [bMoins, bPlus, bTout].forEach(function (b) { b.type = 'button'; });
      inp.type = 'number'; inp.min = '0'; inp.max = String(l.restant); inp.step = '1';
      inp.inputMode = 'numeric';
      inp.className = 'ext-qte-input';
      inp.setAttribute('aria-label', 'Nombre de pièces à sortir');
      inp.value = String(extProduitsSel[l.cle] || 0);
      function fixer(v) {
        v = Math.max(0, Math.min(l.restant, Math.floor(parseFloat(v) || 0)));
        extProduitsSel[l.cle] = v;
        inp.value = String(v);
        card.classList.toggle('selected', v > 0);
        majSyntheseProduits();
      }
      bMoins.onclick = function () { fixer((extProduitsSel[l.cle] || 0) - 1); };
      bPlus.onclick  = function () { fixer((extProduitsSel[l.cle] || 0) + 1); };
      bTout.onclick  = function () { fixer(l.restant); };
      inp.onchange   = function () { fixer(inp.value); };
      qte.appendChild(bMoins); qte.appendChild(inp); qte.appendChild(bPlus); qte.appendChild(bTout);
      card.appendChild(qte);
      card.classList.toggle('selected', (extProduitsSel[l.cle] || 0) > 0);
      liste.appendChild(card);
    });
  majSyntheseProduits();
}

function majSyntheseProduits() {
  var sel = selectionProduits();
  var nb  = sel.reduce(function (s, x) { return s + x.quantite; }, 0);
  var vol = sel.reduce(function (s, x) { return s + volumePiece(x.ligne) * x.quantite; }, 0);
  var syn = document.getElementById('ext-synthese-produits');
  if (syn) syn.classList.toggle('hidden', nb === 0);
  var eN = document.getElementById('ext-syn-pieces');
  var eV = document.getElementById('ext-syn-vol-prod');
  if (eN) eN.textContent = String(nb);
  if (eV) eV.textContent = vol.toFixed(3);
}

async function confirmerExtractionProduits() {
  function verifier() {
    return DuramenCore.validerSortieProduits(selectionProduits().map(function (x) {
      return { cle: x.ligne.cle, quantite: x.quantite };
    }));
  }
  var v = verifier();
  if (!v.ok) { showError(v.erreur); return; }
  try {
    showLoading(true);
    // Données fraîches : un autre agent a pu sortir ces produits entre-temps
    await chargerDonnees();
    v = verifier();
    if (!v.ok) { showError('Le stock a changé entre-temps. ' + v.erreur); return; }

    // Une ligne de sortie par essence (comme les sorties de grumes)
    var parEss = {};
    selectionProduits().forEach(function (x) {
      (parEss[x.ligne.essence] = parEss[x.ligne.essence] || []).push({
        cle: x.ligne.cle, quantite: x.quantite,
        volume: arrondiM3(volumePiece(x.ligne) * x.quantite)
      });
    });
    var now = new Date();
    var nouvelles = Object.keys(parEss).map(function (ess) {
      return {
        id:           crypto.randomUUID(),
        commune_code: communeConnectee.code,
        essence:      ess,
        volume:       0,
        usage:        'Non défini',
        destination:  extDraft.destination,
        commune:      extDraft.communeInstall,
        contact:      '',
        notes:        extDraft.lieu ? 'Lieu : ' + extDraft.lieu : '',
        type_sortie:  'produit',
        produits:     parEss[ess],
        vol_produits: arrondiM3(parEss[ess].reduce(function (s, p) { return s + p.volume; }, 0)),
        date:         now.toLocaleDateString('fr-FR'),
        date_iso:     now.toISOString()
      };
    });
    // Envoi groupé : soit tout passe, soit rien
    await sbInsert('extractions', nouvelles, { sansRetour: true });
    extDraft       = { destination: '', communeInstall: '', lieu: '' };
    extProduitsSel = {};
    fermerModalExtractionDest();
    stockEtat = 'produits';
    await chargerDonnees();
    afficherExtraction();
    showToastSucces('Sortie de produits enregistrée.');
  } catch (err) {
    if (err.reseau) showError('Pas de réseau : la sortie se fait avec réseau.');
    else if (/STOCK PRODUIT INSUFFISANT|PRODUIT INTROUVABLE/.test(err.message)) {
      showError('Le stock de produits a changé entre-temps. Rien n\'a été enregistré.');
      await chargerDonnees();
      afficherExtraction();
    } else showError('Erreur : ' + err.message);
  } finally {
    showLoading(false);
  }
}

// Dernières sorties de produits (onglet Stock, produits bois, ma commune)
function creerListeSortiesProduits() {
  var bloc = cel('div', '');
  bloc.appendChild(cel('div', 'histo-section-title mt-16', 'Dernières sorties de produits'));
  var liste = cel('div', 'histo-ext-list');
  var sorties = extractions
    .filter(function (e) { return e.type_sortie === 'produit'; })
    .sort(function (a, b) { return (b.date_iso || '').localeCompare(a.date_iso || ''); })
    .slice(0, 5);
  if (sorties.length === 0) liste.appendChild(cel('div', 'ext-empty', 'Aucune sortie de produits.'));
  sorties.forEach(function (ex) {
    var nb = (ex.produits || []).reduce(function (s, p) { return s + (parseFloat(p.quantite) || 0); }, 0);
    var item = cel('div', 'histo-ext-item');
    item.appendChild(cel('span', 'histo-ext-essence', ex.essence || '—'));
    item.appendChild(cel('span', 'histo-ext-vol', (parseFloat(ex.vol_produits) || 0).toFixed(3) + ' m³'));
    item.appendChild(cel('span', 'histo-ext-type', nb + (nb > 1 ? ' pièces' : ' pièce')));
    item.appendChild(cel('span', 'histo-ext-date', ex.date || ''));
    if (ex.destination) item.appendChild(cel('div', 'histo-ext-dest', '→ ' + ex.destination));
    liste.appendChild(item);
  });
  bloc.appendChild(liste);
  return bloc;
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
    // Deux états du stock : grumes brutes, puis produits bois
    content.appendChild(creerBasculeStock());
    if (stockEtat === 'produits') {
      rendreStockProduits(content, DuramenCore.getStockProduits(), false);
      content.appendChild(creerListeSortiesProduits());
      return;
    }
    var zone = cel('div', '');
    content.appendChild(zone);
    // Grumes encore en stock brut ; l'export garde toutes les grumes saisies
    rendreHistoriqueContenu(zone, DuramenCore.getGrumesEnStock(),
      { urgence: true, aDebiter: grumesADebiter(), exportData: lots, marquage: true });
    // Campagnes de sciage : juste après le total du stock brut
    var total = zone.querySelector('.histo-total-block');
    var sectionCamp = creerSectionCampagnes();
    if (total && total.nextSibling) zone.insertBefore(sectionCamp, total.nextSibling);
    else zone.insertBefore(sectionCamp, zone.firstChild);
    // Bilan entrées / sorties à une date choisie — juste avant les boutons export
    var exportRow = zone.querySelector('.histo-export-row');
    var bilan     = creerBilanBloc();
    if (exportRow) { zone.insertBefore(bilan, exportRow); } else { zone.appendChild(bilan); }
  } else {
    afficherStockCommunaute(content);
  }
}

// ─── Bilan du stock à une date ────────────────────────────────────────────
// À une date T : tout ce qui est entré, tout ce qui est sorti, le solde.
// Même stock vide, les entrées et les sorties restent visibles.
function creerBilanBloc() {
  var bloc = cel('div', '');
  bloc.appendChild(cel('div', 'histo-section-title mt-16', 'Bilan du stock'));

  var dateRow = cel('div', 'bilan-date-row');
  dateRow.appendChild(cel('span', 'bilan-date-lbl', 'État au'));
  var dateInp = document.createElement('input');
  dateInp.type      = 'date';
  dateInp.className = 'bilan-date-input';
  dateInp.value     = new Date().toISOString().slice(0, 10);
  dateRow.appendChild(dateInp);
  bloc.appendChild(dateRow);

  var stats = cel('div', 'bilan-stats');
  var defs  = [
    { lbl: 'm³ entrés',   cls: '' },
    { lbl: 'm³ sortis',   cls: '' },
    { lbl: 'm³ en stock', cls: 'bilan-stat-stock' }
  ];
  var vals = defs.map(function (d) {
    var item = cel('div', 'bilan-stat ' + d.cls);
    var val  = cel('div', 'bilan-stat-val', '—');
    item.appendChild(val);
    item.appendChild(cel('div', 'bilan-stat-lbl', d.lbl));
    stats.appendChild(item);
    return val;
  });
  bloc.appendChild(stats);

  var sortiesTitre = cel('div', 'histo-section-title mt-16', 'Sorties');
  var sortiesList  = cel('div', 'histo-ext-list');
  bloc.appendChild(sortiesTitre);
  bloc.appendChild(sortiesList);

  function majBilan() {
    var limite = dateInp.value || new Date().toISOString().slice(0, 10);
    function avantLimite(x) {
      var jour = (x.date_iso || '').slice(0, 10);
      return !jour || jour <= limite;
    }
    var lotsT = lots.filter(avantLimite);
    var extsT = extractions.filter(function (e) {
      return avantLimite(e) && e.type_sortie !== 'produit';
    });
    var entres = lotsT.reduce(function (s, l) { return s + (l.vol_utile || 0); }, 0);
    var sortis = extsT.reduce(function (s, e) { return s + (e.volume || 0); }, 0);
    vals[0].textContent = entres.toFixed(3);
    vals[1].textContent = sortis.toFixed(3);
    vals[2].textContent = Math.max(0, entres - sortis).toFixed(3);

    while (sortiesList.firstChild) sortiesList.removeChild(sortiesList.firstChild);
    if (extsT.length === 0) {
      sortiesList.appendChild(cel('div', 'ext-empty', 'Aucune sortie à cette date.'));
      return;
    }
    extsT
      .slice()
      .sort(function (a, b) { return (b.date_iso || '').localeCompare(a.date_iso || ''); })
      .slice(0, 5)
      .forEach(function (ex) {
        var item = cel('div', 'histo-ext-item');
        item.appendChild(cel('span', 'histo-ext-essence', ex.essence || '—'));
        item.appendChild(cel('span', 'histo-ext-vol', (ex.volume || 0).toFixed(3) + ' m³'));
        item.appendChild(cel('span', 'histo-ext-type',
          ex.type_sortie === 'debit' ? 'Débit' : (ex.type_sortie === 'sciage' ? 'Sciage' : 'Grume brute')));
        item.appendChild(cel('span', 'histo-ext-date', ex.date || ''));
        if (ex.destination) item.appendChild(cel('div', 'histo-ext-dest', '→ ' + ex.destination));
        sortiesList.appendChild(item);
      });
  }

  dateInp.addEventListener('change', majBilan);
  majBilan();
  return bloc;
}

// options.urgence    : liste complète triée par urgence de débit, avec badge
// options.aDebiter   : id de grume → campagne ouverte (badge « À débiter »)
// options.exportData : grumes à exporter (par défaut : celles affichées)
function rendreHistoriqueContenu(container, lotsData, options) {
  options = options || {};
  var exportData = options.exportData || lotsData || [];
  if (!lotsData || lotsData.length === 0) {
    var es = cel('div', 'empty-state');
    es.appendChild(cel('p', '', options.urgence ? 'Aucune grume en stock brut.' : 'Aucune grume enregistrée.'));
    container.appendChild(es);
    container.appendChild(creerBoutonsExportHisto(exportData));
    return;
  }

  // ── Bloc total ──────────────────────────────────────────────────────
  var totalVol  = lotsData.reduce(function (s, l) { return s + (l.vol_utile || 0); }, 0);
  var totalLots = lotsData.length;

  var bloc = cel('div', 'histo-total-block');

  var itemVol = cel('div', '');
  itemVol.appendChild(cel('div', 'histo-total-vol', totalVol.toFixed(3)));
  itemVol.appendChild(cel('div', 'histo-total-unit', 'm³ bruts'));
  bloc.appendChild(itemVol);

  bloc.appendChild(cel('div', 'histo-total-divider'));

  var itemLots = cel('div', '');
  itemLots.appendChild(cel('div', 'histo-total-lots', String(totalLots)));
  itemLots.appendChild(cel('div', 'histo-total-unit', totalLots > 1 ? 'grumes' : 'grume'));
  bloc.appendChild(itemLots);

  container.appendChild(bloc);

  // ── Par essence ─────────────────────────────────────────────────────
  container.appendChild(cel('div', 'histo-section-title', 'Par essence'));

  var parEss = {};
  lotsData.forEach(function (l) {
    var e = l.essence || 'Autre';
    if (!parEss[e]) parEss[e] = { vol: 0, lots: 0, causes: [] };
    parEss[e].vol  += l.vol_utile || 0;
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
      // Ton du bois : classe d'essence definie dans core.js, couleur dans theme.css
      var ton  = (DuramenCore.ESSENCES_INFO[ess] || { color: 'ec-autre' }).color;

      var top = cel('div', 'histo-essence-top');
      var nom = cel('span', 'histo-essence-name', ess);
      nom.insertBefore(cel('span', 'pastille-essence ' + ton), nom.firstChild);
      top.appendChild(nom);
      top.appendChild(cel('span', 'histo-essence-vol', d.vol.toFixed(3) + ' m³'));
      item.appendChild(top);

      item.appendChild(cel('div', 'histo-essence-meta',
        d.lots + (d.lots > 1 ? ' grumes' : ' grume') +
        (d.causes.length ? ' — ' + d.causes.join(', ') : '')
      ));

      var track = cel('div', 'histo-bar-track');
      var fill  = cel('div', 'histo-bar-fill ' + ton);
      fill.style.setProperty('--barre-pct', pct.toFixed(1) + '%');
      track.appendChild(fill);
      item.appendChild(track);
      essList.appendChild(item);
    });
  container.appendChild(essList);

  // ── Lots récents ────────────────────────────────────────────────────
  container.appendChild(cel('div', 'histo-section-title mt-16',
    options.urgence ? 'Grumes en stock — les plus urgentes d\'abord' : 'Grumes récentes'));

  var lotsList = cel('div', '');
  var aAfficher = options.urgence ? grumesParUrgence(lotsData) : lotsData.slice(0, 5);
  aAfficher.forEach(function (lot) {
    var card   = cel('div', 'histo-lot-card');
    var header = cel('div', 'histo-lot-header');
    header.appendChild(cel('div', 'histo-lot-nom', nomAfficheGrume(lot)));
    header.appendChild(cel('div', 'histo-lot-vol', (lot.vol_utile || 0).toFixed(3) + ' m³'));
    card.appendChild(header);
    if (!DuramenCore.estNumerotee(lot)) {
      var m = DuramenCore.mesuresGrume(lot);
      card.appendChild(cel('div', 'histo-essence-meta',
        formatNb(m.longueur, 2) + ' m × ' + m.diametre + ' cm · ' + texteAbattageGrume(lot)
        + (lot.provenance ? ' · ' + lot.provenance : '') + (lot.repere ? ' · ' + lot.repere : '')));
    }

    var badges = cel('div', 'histo-badges');
    if (lot.commune) badges.appendChild(cel('span', 'histo-badge histo-badge-commune', lot.commune));
    if (lot.essence) badges.appendChild(cel('span', 'histo-badge histo-badge-essence', lot.essence));
    if (lot.cause)   badges.appendChild(cel('span', 'histo-badge histo-badge-cause',   lot.cause));
    if (!DuramenCore.estNumerotee(lot)) {
      badges.appendChild(cel('span', 'histo-badge badge-urgence badge-urgence-alerte', 'En attente de marquage'));
    }
    if (options.urgence) badges.appendChild(creerBadgeUrgence(lot));
    if (options.aDebiter && options.aDebiter[lot.id]) {
      badges.appendChild(cel('span', 'histo-badge badge-a-debiter',
        'À débiter — ' + (options.aDebiter[lot.id].nom || 'campagne')));
    }
    card.appendChild(badges);
    if (options.marquage && !DuramenCore.estNumerotee(lot)) {
      var actsM = cel('div', 'sciage-campagne-actions');
      var bNum  = cel('button', 'btn btn-primary', 'Attribuer un numéro');
      bNum.type = 'button';
      bNum.onclick = (function (g) { return function () { ouvrirAttributionNumero(g); }; })(lot);
      actsM.appendChild(bNum);
      card.appendChild(actsM);
    }
    lotsList.appendChild(card);
  });
  container.appendChild(lotsList);

  container.appendChild(creerBoutonsExportHisto(exportData));
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
  if (!lotsData || lotsData.length === 0) { showError('Aucune grume à exporter.'); return; }
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

// ═══════════════════════════════════════════════════════════════════════════
// STOCK EN DEUX ÉTATS ET CAMPAGNE DE SCIAGE (feat/campagne-sciage)
// Grumes brutes → [campagne de sciage] → produits bois.
// La feuille de débit prépare le sciage ; la clôture enregistre les produits
// réels. Statuts et dates de séchage sont calculés, jamais enregistrés.
// ═══════════════════════════════════════════════════════════════════════════

var stockEtat = 'brut';               // 'brut' (grumes) ou 'produits'
var CLE_BROUILLON_CAMPAGNE = 'duramen_draft_campagne';
var CLE_BROUILLON_CLOTURE  = 'duramen_draft_cloture';

function formatDateFr(d) {
  if (!d) return '—';
  var x = new Date(d);
  return isNaN(x) ? '—' : x.toLocaleDateString('fr-FR');
}
function formatNb(v, dec) {
  return (parseFloat(v) || 0).toFixed(dec).replace('.', ',');
}
function lireJSONLocal(cle) {
  try { return JSON.parse(localStorage.getItem(cle) || 'null'); } catch (e) { return null; }
}

// Suppression d'une ligne (campagne non clôturée)
async function sbDelete(table, id) {
  var entetes = Object.assign({}, sbH, { 'Prefer': 'return=minimal' });
  var r = await requeteSupabase(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(id),
    { method: 'DELETE', headers: entetes }, DELAI_ENVOI_MS, table);
  if (!r.res.ok) {
    var err = new Error('Suppression ' + table + ': ' + r.res.status + ' ' + r.texte);
    err.statut = r.res.status;
    throw err;
  }
}

// ─── Campagnes : état calculé ────────────────────────────────────────────
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
// Grumes en stock, de la plus urgente à la moins urgente
function grumesParUrgence(liste) {
  var now = new Date();
  return liste.slice().sort(function (a, b) {
    return DuramenCore.urgenceDebitGrume(b, now).ratio - DuramenCore.urgenceDebitGrume(a, now).ratio;
  });
}

// ─── Badges ──────────────────────────────────────────────────────────────
function creerBadgeUrgence(grume) {
  var u = DuramenCore.urgenceDebitGrume(grume);
  var txt;
  if (u.inconnue)                 txt = 'Date d\'abattage inconnue — à débiter vite';
  else if (u.niveau === 'depasse')     txt = 'Délai de débit dépassé (' + formatDateFr(u.dateLimite) + ')';
  else if (u.niveau === 'alerte') txt = 'Débit urgent — avant le ' + formatDateFr(u.dateLimite);
  else                            txt = 'Débit avant le ' + formatDateFr(u.dateLimite);
  return cel('span', 'histo-badge badge-urgence badge-urgence-' + u.niveau, txt);
}
function creerBadgeSechage(dateSec) {
  var sec = new Date(dateSec) <= new Date();
  return cel('span', 'histo-badge badge-sechage ' + (sec ? 'badge-sechage-sec' : 'badge-sechage-en-cours'),
    sec ? 'Sec à l\'air' : 'En séchage — sec à l\'air le ' + formatDateFr(dateSec));
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
  var est = l.estimation_quantite ? ' · ~' + l.estimation_quantite
    + (l.type === 'avive' ? ' pièces' : ' planches') : '';
  if (l.type === 'avive') return 'Avivé · ' + l.epaisseur_mm + ' × ' + l.largeur_mm + ' mm' + est;
  return 'Plot · ' + l.epaisseur_mm + ' mm' + est;
}
function texteProduit(p) {
  var lon = formatNb(p.longueur_m, 2) + ' m';
  if (p.type === 'avive') return 'Avivé ' + p.epaisseur_mm + ' × ' + p.largeur_mm + ' mm · ' + lon;
  return 'Plot ' + p.epaisseur_mm + ' mm · ' + lon;
}

// Date d'abattage d'une grume, pour l'affichage
function texteAbattageGrume(g) {
  if (DuramenCore.abattageInconnu(g)) return 'abattue : date inconnue';
  return 'abattue le ' + formatDateFr(g.date_abattage ? g.date_abattage + 'T12:00:00' : g.date_iso);
}

// ─── Attribuer un numéro à une grume en attente de marquage ──────────────
// Sur le lieu de stockage, une fois l'étiquette posée sur la grume.
async function sbRpc(fonction, params) {
  var r = await requeteSupabase(SUPABASE_URL + '/rest/v1/rpc/' + fonction, {
    method: 'POST', headers: sbH, body: JSON.stringify(params || {})
  }, DELAI_ENVOI_MS, fonction);
  if (!r.res.ok) {
    var err = new Error(fonction + ': ' + r.res.status + ' ' + r.texte);
    err.statut = r.res.status;
    throw err;
  }
  return r.texte ? JSON.parse(r.texte) : null;
}

function ouvrirAttributionNumero(g) {
  var bg = document.getElementById('modal-numero-bg');
  if (bg) bg.parentNode.removeChild(bg);
  bg = cel('div', 'extract-modal-bg open');
  bg.id = 'modal-numero-bg';
  var modal = cel('div', 'extract-modal modal-nommer');
  function fermer() { if (bg.parentNode) bg.parentNode.removeChild(bg); }
  var closeBtn = cel('button', 'modal-close', '✕');
  closeBtn.type = 'button';
  closeBtn.onclick = fermer;
  modal.appendChild(closeBtn);
  modal.appendChild(cel('h2', '', 'Attribuer un numéro'));

  // De quoi reconnaître la bonne grume sur le site
  var m = DuramenCore.mesuresGrume(g);
  modal.appendChild(cel('p', 'modal-sub', (g.essence || '') + ' · ' + formatNb(m.longueur, 2) + ' m × '
    + m.diametre + ' cm · ' + texteAbattageGrume(g) + (g.provenance ? ' · ' + g.provenance : '')));
  if (g.repere) modal.appendChild(cel('div', 'info-box', 'Repère : ' + g.repere));

  var apercu = cel('p', 'modal-sub', '');
  var fNom = cel('div', 'field');
  var lNom = cel('label', '', 'Numéro de l\'étiquette (5 chiffres)');
  lNom.htmlFor = 'numero-attrib-input';
  var iNom = document.createElement('input');
  iNom.type = 'text';
  iNom.id   = 'numero-attrib-input';
  iNom.inputMode = 'numeric';
  iNom.maxLength = DuramenCore.NUMERO_GRUME_CHIFFRES;
  iNom.autocomplete = 'off';
  iNom.placeholder  = '00000';
  function majApercu() {
    var num = DuramenCore.formaterNumeroGrume(iNom.value);
    apercu.textContent = 'Nom : ' + prefixeNomGrume() + (num || '_____');
  }
  iNom.addEventListener('input', function () {
    iNom.value = iNom.value.replace(/\D/g, '').slice(0, DuramenCore.NUMERO_GRUME_CHIFFRES);
    majApercu();
  });
  iNom.addEventListener('keydown', function (e) { if (e.key === 'Enter') valider(); });
  fNom.appendChild(lNom);
  fNom.appendChild(iNom);
  modal.appendChild(fNom);
  modal.appendChild(apercu);
  majApercu();

  async function valider() {
    var num = DuramenCore.formaterNumeroGrume(iNom.value);
    if (!num) { showError('Tapez le numéro de l\'étiquette (1 à 5 chiffres).'); return; }
    var nom = prefixeNomGrume() + num;
    if (nomGrumeDejaPris(nom)) {
      showError('Le numéro ' + nom + ' existe déjà. Vérifiez l\'étiquette de la grume.'); return;
    }
    try {
      showLoading(true);
      await sbRpc('attribuer_numero_grume', { p_id: g.id, p_nom: nom });
      fermer();
      await chargerDonnees();
      showToastSucces('Numéro ' + nom + ' attribué : la grume peut être débitée.');
    } catch (err) {
      if (err.reseau) showError('Pas de réseau : le numéro s\'attribue avec réseau.');
      else if (/23505|duplicate key/.test(err.message)) showError('Le numéro ' + nom + ' existe déjà. Vérifiez l\'étiquette de la grume.');
      else if (/DÉJÀ NUMÉROTÉE|INTROUVABLE/.test(err.message)) showError('Cette grume a déjà un numéro : rechargez la page.');
      else showError('Erreur : ' + err.message);
    } finally {
      showLoading(false);
    }
  }

  var acts = cel('div', 'flex-end');
  var bRet = cel('button', 'btn btn-outline', '← Retour');
  bRet.type = 'button';
  bRet.onclick = fermer;
  var bOk = cel('button', 'btn btn-primary', 'Enregistrer');
  bOk.type = 'button';
  bOk.onclick = valider;
  acts.appendChild(bRet);
  acts.appendChild(bOk);
  modal.appendChild(acts);
  bg.appendChild(modal);
  document.body.appendChild(bg);
  iNom.focus();
}

// ─── Bascule Grumes brutes / Produits bois ───────────────────────────────
function creerBasculeStock() {
  var bar = cel('div', 'histo-toggle-bar stock-etat-bar');
  [['brut', 'Grumes brutes'], ['produits', 'Produits bois']].forEach(function (o) {
    var b = cel('button', 'histo-toggle-btn' + (stockEtat === o[0] ? ' active' : ''), o[1]);
    b.type    = 'button';
    b.onclick = function () { stockEtat = o[0]; afficherHistorique(); };
    bar.appendChild(b);
  });
  return bar;
}

// ─── Section « Campagnes de sciage » (stock brut, ma commune) ────────────
function creerSectionCampagnes() {
  var bloc = cel('div', 'sciage-section');
  bloc.appendChild(cel('div', 'histo-section-title', 'Campagnes de sciage'));
  var ouvertes = campagnesOuvertes();
  if (ouvertes.length === 0) {
    bloc.appendChild(cel('p', 'histo-essence-meta', 'Aucune campagne en préparation.'));
  }
  ouvertes.forEach(function (c) {
    var card   = cel('div', 'histo-lot-card sciage-campagne-card');
    var header = cel('div', 'histo-lot-header');
    header.appendChild(cel('div', 'histo-lot-nom', c.nom || 'Campagne'));
    var nb = (c.lignes || []).length;
    header.appendChild(cel('div', 'histo-lot-vol', nb + (nb > 1 ? ' grumes' : ' grume')));
    card.appendChild(header);
    var acts = cel('div', 'sciage-campagne-actions');
    var bFeuille = cel('button', 'btn btn-outline', 'Feuille de débit');
    bFeuille.type = 'button';
    bFeuille.onclick = function () { ouvrirFeuilleDebit(c); };
    var bClot = cel('button', 'btn btn-primary', 'Clôturer');
    bClot.type = 'button';
    bClot.onclick = function () { ouvrirCloture(c); };
    var bSup = cel('button', 'btn btn-outline sciage-btn-supprimer', 'Supprimer');
    bSup.type = 'button';
    bSup.onclick = function () { supprimerCampagne(c); };
    acts.appendChild(bFeuille);
    acts.appendChild(bClot);
    acts.appendChild(bSup);
    card.appendChild(acts);
    bloc.appendChild(card);
  });
  var bNew = cel('button', 'btn btn-primary sciage-btn-nouvelle', '+ Préparer une campagne de sciage');
  bNew.type    = 'button';
  bNew.onclick = ouvrirPreparationCampagne;
  bloc.appendChild(bNew);
  return bloc;
}

async function supprimerCampagne(c) {
  if (!confirm('Supprimer la campagne « ' + (c.nom || '') + ' » ?\nLes grumes restent en stock brut.')) return;
  try {
    showLoading(true);
    await sbDelete('campagnes', c.id);
    await chargerDonnees();
    showToastSucces('Campagne supprimée.');
  } catch (err) {
    if (err.reseau) showError('Pas de réseau : la suppression se fait avec réseau.');
    else if (/23503/.test(err.message)) showError('Cette campagne est déjà clôturée : elle ne peut plus être supprimée.');
    else showError('Erreur suppression : ' + err.message);
  } finally {
    showLoading(false);
  }
}

// ─── Stock produits (ma commune ou métropole) ────────────────────────────
// lignes : format de DuramenCore.getStockProduits(), ou de produits_partages()
// ramené au même format par normaliserProduitsPartages().
function rendreStockProduits(container, lignes, partage) {
  var total = lignes.reduce(function (s, l) { return s + (l.volumeRestant || 0); }, 0);
  var nbPieces = lignes.reduce(function (s, l) { return s + (l.restant || 0); }, 0);

  var bloc = cel('div', 'histo-total-block');
  var iVol = cel('div', '');
  iVol.appendChild(cel('div', 'histo-total-vol', total.toFixed(3)));
  iVol.appendChild(cel('div', 'histo-total-unit', 'm³ de produits'));
  bloc.appendChild(iVol);
  bloc.appendChild(cel('div', 'histo-total-divider'));
  var iNb = cel('div', '');
  iNb.appendChild(cel('div', 'histo-total-lots', String(nbPieces)));
  iNb.appendChild(cel('div', 'histo-total-unit', nbPieces > 1 ? 'pièces' : 'pièce'));
  bloc.appendChild(iNb);
  container.appendChild(bloc);

  if (lignes.length === 0) {
    var es = cel('div', 'empty-state');
    es.appendChild(cel('p', '', 'Aucun produit bois en stock. Les produits arrivent à la clôture d\'une campagne de sciage.'));
    container.appendChild(es);
    return;
  }

  var parEss = {};
  lignes.forEach(function (l) {
    var e = l.essence || 'Autre';
    (parEss[e] = parEss[e] || []).push(l);
  });
  Object.keys(parEss).sort().forEach(function (ess) {
    var vol = parEss[ess].reduce(function (s, l) { return s + (l.volumeRestant || 0); }, 0);
    container.appendChild(cel('div', 'histo-section-title mt-16', ess + ' — ' + vol.toFixed(3) + ' m³'));
    parEss[ess]
      .sort(function (a, b) { return new Date(a.dateSecAir) - new Date(b.dateSecAir); })
      .forEach(function (l) {
        var card   = cel('div', 'histo-lot-card produit-card');
        var header = cel('div', 'histo-lot-header');
        header.appendChild(cel('div', 'histo-lot-nom', texteProduit(l)));
        header.appendChild(cel('div', 'histo-lot-vol', (l.volumeRestant || 0).toFixed(3) + ' m³'));
        card.appendChild(header);
        var unite = l.type === 'avive' ? ' pièces' : ' planches';
        card.appendChild(cel('div', 'histo-essence-meta',
          l.restant + ' sur ' + l.quantite + unite + ' · scié le ' + formatDateFr(l.dateSciage)
          + (l.grume_nom ? ' · grume ' + l.grume_nom : '')));
        var badges = cel('div', 'histo-badges');
        if (partage && l.commune) badges.appendChild(cel('span', 'histo-badge histo-badge-commune', l.commune));
        badges.appendChild(creerBadgeSechage(l.dateSecAir));
        card.appendChild(badges);
        container.appendChild(card);
      });
  });
}

function normaliserProduitsPartages(rows) {
  return (rows || []).map(function (r) {
    var p = { type: r.type, epaisseur_mm: r.epaisseur_mm, largeur_mm: r.largeur_mm };
    return {
      cle: r.cle, commune: r.commune, essence: r.essence, type: r.type,
      epaisseur_mm: r.epaisseur_mm, largeur_mm: r.largeur_mm, longueur_m: r.longueur_m,
      quantite: parseFloat(r.quantite) || 0, restant: parseFloat(r.quantite_restante) || 0,
      volumeRestant: parseFloat(r.volume_restant) || 0,
      dateSciage: r.date_sciage, dateSecAir: DuramenCore.dateSecAir(r.date_sciage, p)
    };
  });
}

async function afficherStockCommunaute(content) {
  content.appendChild(creerBasculeStock());
  var zone = cel('div', '');
  var loading = cel('div', 'empty-state');
  loading.appendChild(cel('p', '', 'Chargement des données de la métropole…'));
  zone.appendChild(loading);
  content.appendChild(zone);
  try {
    var rows = await sbSelect(stockEtat === 'produits' ? 'rpc/produits_partages' : 'rpc/grumes_en_stock_partagees', '');
    while (zone.firstChild) zone.removeChild(zone.firstChild);
    if (stockEtat === 'produits') rendreStockProduits(zone, normaliserProduitsPartages(rows), true);
    else rendreHistoriqueContenu(zone, rows, { urgence: true });
  } catch (err) {
    while (zone.firstChild) zone.removeChild(zone.firstChild);
    var errEl = cel('div', 'empty-state');
    errEl.appendChild(cel('p', '', 'Erreur chargement métropole : ' + err.message));
    zone.appendChild(errEl);
  }
}

// ═══ Préparation d'une campagne (feuille de débit) ════════════════════════
var campDraft = null;

function nouveauCampDraft() {
  var d = new Date();
  return { date_prevue: d.toISOString().slice(0, 10), choix: {} };
}
function sauverCampDraft() {
  try { localStorage.setItem(CLE_BROUILLON_CAMPAGNE, JSON.stringify(campDraft)); } catch (e) {}
}

function ouvrirPreparationCampagne() {
  campDraft = lireJSONLocal(CLE_BROUILLON_CAMPAGNE) || nouveauCampDraft();
  var bg = document.getElementById('modal-campagne-bg');
  if (bg) bg.parentNode.removeChild(bg);
  bg = cel('div', 'extract-modal-bg open');
  bg.id = 'modal-campagne-bg';
  var modal = cel('div', 'extract-modal sciage-modal');
  var closeBtn = cel('button', 'modal-close', '✕');
  closeBtn.type = 'button';
  closeBtn.onclick = fermerPreparationCampagne;
  modal.appendChild(closeBtn);
  modal.appendChild(cel('h2', '', 'Préparer une campagne de sciage'));
  modal.appendChild(cel('p', 'modal-sub', 'Choisissez les grumes et le débit demandé. Les plus urgentes sont en haut.'));

  // Seule la date est demandée : le nom de la campagne en découle
  [['date_prevue', 'Date prévue du sciage', 'date']].forEach(function (f) {
    var fld = cel('div', 'field');
    var lab = cel('label', '', f[1]);
    lab.htmlFor = 'camp-' + f[0];
    var inp = document.createElement('input');
    inp.type = f[2];
    inp.id   = 'camp-' + f[0];
    inp.autocomplete = 'off';
    inp.value = campDraft[f[0]] || '';
    inp.oninput = function () { campDraft[f[0]] = inp.value; sauverCampDraft(); };
    fld.appendChild(lab);
    fld.appendChild(inp);
    modal.appendChild(fld);
  });

  modal.appendChild(cel('div', 'histo-section-title mt-16', 'Grumes en stock'));
  var reservees = grumesADebiter();
  var dispo = grumesParUrgence(DuramenCore.getGrumesEnStock()).filter(function (g) { return !reservees[g.id]; });
  // Le brouillon ne garde que les grumes encore disponibles
  Object.keys(campDraft.choix).forEach(function (id) {
    if (!dispo.some(function (g) { return g.id === id; })) delete campDraft.choix[id];
  });
  if (dispo.length === 0) {
    modal.appendChild(cel('p', 'histo-essence-meta', 'Aucune grume disponible : elles sont toutes déjà dans une campagne.'));
  }
  dispo.forEach(function (g) { modal.appendChild(creerLigneChoixDebit(g)); });

  var resume = cel('div', 'sciage-resume');
  resume.id = 'camp-resume';
  modal.appendChild(resume);

  var acts = cel('div', 'flex-end');
  var bAnn = cel('button', 'btn btn-outline', 'Effacer');
  bAnn.type = 'button';
  bAnn.onclick = function () {
    if (!confirm('Effacer la préparation en cours ?')) return;
    try { localStorage.removeItem(CLE_BROUILLON_CAMPAGNE); } catch (e) {}
    ouvrirPreparationCampagne();
  };
  var bOk = cel('button', 'btn btn-primary', 'Enregistrer la campagne');
  bOk.type = 'button';
  bOk.onclick = enregistrerCampagne;
  acts.appendChild(bAnn);
  acts.appendChild(bOk);
  modal.appendChild(acts);

  bg.appendChild(modal);
  document.body.appendChild(bg);
  majResumeCampagne();
}

function fermerPreparationCampagne() {
  var bg = document.getElementById('modal-campagne-bg');
  if (bg) bg.parentNode.removeChild(bg);
}

// Débits demandés pour une grume. Ancien brouillon (un seul débit par
// grume) : converti en liste d'un débit.
function debitsDuChoix(ch) {
  if (!Array.isArray(ch.debits)) {
    ch.debits = [{ type: ch.type || 'plot', epaisseur_mm: ch.epaisseur_mm || 27,
                   largeur_mm: ch.largeur_mm || 0, quantite: 0, auto: true }];
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

// Une grume : case à cocher, puis un ou plusieurs débits (plusieurs
// épaisseurs possibles dans la même grume)
function creerLigneChoixDebit(g) {
  var m   = DuramenCore.mesuresGrume(g);
  var row = cel('div', 'histo-lot-card sciage-grume-row');

  var lab = cel('label', 'sciage-grume-check');
  var cb  = document.createElement('input');
  cb.type    = 'checkbox';
  cb.checked = !!campDraft.choix[g.id];
  lab.appendChild(cb);
  lab.appendChild(cel('span', 'histo-lot-nom', nomAfficheGrume(g) + ' · ' + (g.essence || '')));
  row.appendChild(lab);
  var debitOk = DuramenCore.validerDebitGrume(g);
  if (!debitOk.ok) {
    cb.checked  = false;
    cb.disabled = true;
    delete campDraft.choix[g.id];
  }
  row.appendChild(cel('div', 'histo-essence-meta',
    formatNb(m.longueur, 2) + ' m × ' + m.diametre + ' cm · ' + (g.vol_utile || 0).toFixed(3) + ' m³'));
  var badges = cel('div', 'histo-badges');
  badges.appendChild(creerBadgeUrgence(g));
  row.appendChild(badges);
  if (!debitOk.ok) {
    row.appendChild(cel('div', 'info-box', debitOk.erreur + ' (Stock › Grumes brutes)'));
    return row;
  }

  var zone = cel('div', 'sciage-choix' + (cb.checked ? '' : ' hidden'));
  row.appendChild(zone);

  function changer() { sauverCampDraft(); rendreChoix(); majResumeCampagne(); }

  // Retirer un champ encore actif déclenche sa validation (« change ») :
  // ce second rendu, imbriqué dans le premier, est ignoré. La valeur
  // tapée est déjà gardée et sera affichée par le rendu en cours.
  var enRendu = false;
  function rendreChoix() {
    if (enRendu) return;
    enRendu = true;
    try { construireChoix(); } finally { enRendu = false; }
  }
  function construireChoix() {
    while (zone.firstChild) zone.removeChild(zone.firstChild);
    var ch = campDraft.choix[g.id];
    if (!ch) return;
    var debits = debitsDuChoix(ch);
    recalculerDebitsAuto(g, debits);

    debits.forEach(function (d, i) {
      var ligne = cel('div', 'sciage-produit-ligne');

      var types = cel('div', 'histo-toggle-bar sciage-type-bar');
      [['plot', 'Plot'], ['avive', 'Avivé']].forEach(function (t) {
        var b = cel('button', 'histo-toggle-btn' + (d.type === t[0] ? ' active' : ''), t[1]);
        b.type = 'button';
        b.onclick = function () { d.type = t[0]; d.auto = true; changer(); };
        types.appendChild(b);
      });
      ligne.appendChild(types);

      // Épaisseur : 4 épaisseurs standard, ou « Autre » (champ libre)
      var standard = DuramenCore.EPAISSEURS_PLOT.indexOf(parseInt(d.epaisseur_mm, 10)) !== -1;
      var fE = cel('div', 'field');
      fE.appendChild(cel('label', '', 'Épaisseur'));
      var sel = document.createElement('select');
      DuramenCore.EPAISSEURS_PLOT.forEach(function (e) {
        var o = document.createElement('option');
        o.value = e; o.textContent = e + ' mm';
        if (standard && e === parseInt(d.epaisseur_mm, 10)) o.selected = true;
        sel.appendChild(o);
      });
      var oAutre = document.createElement('option');
      oAutre.value = 'autre'; oAutre.textContent = 'Autre épaisseur…';
      if (!standard) oAutre.selected = true;
      sel.appendChild(oAutre);
      sel.onchange = function () {
        d.epaisseur_mm = sel.value === 'autre' ? 0 : parseInt(sel.value, 10);
        d.auto = true; changer();
      };
      fE.appendChild(sel);
      ligne.appendChild(fE);

      if (!standard) {
        var fA = cel('div', 'field');
        fA.appendChild(cel('label', '', 'Autre épaisseur (mm, de ' + DuramenCore.EPAISSEUR_AUTRE_MIN
          + ' à ' + DuramenCore.EPAISSEUR_AUTRE_MAX + ')'));
        var iA = document.createElement('input');
        iA.type = 'number'; iA.inputMode = 'numeric';
        iA.min = String(DuramenCore.EPAISSEUR_AUTRE_MIN); iA.max = String(DuramenCore.EPAISSEUR_AUTRE_MAX);
        iA.value = d.epaisseur_mm || '';
        iA.onchange = function () { d.epaisseur_mm = parseInt(iA.value, 10) || 0; d.auto = true; changer(); };
        fA.appendChild(iA);
        ligne.appendChild(fA);
      }

      if (d.type === 'avive') {
        var fL = cel('div', 'field');
        fL.appendChild(cel('label', '', 'Largeur (mm)'));
        var iL = document.createElement('input');
        iL.type = 'number'; iL.min = '5'; iL.max = '500'; iL.inputMode = 'numeric';
        iL.value = d.largeur_mm || '';
        iL.onchange = function () { d.largeur_mm = parseInt(iL.value, 10) || 0; d.auto = true; changer(); };
        fL.appendChild(iL);
        ligne.appendChild(fL);
      }

      var fQ = cel('div', 'field');
      fQ.appendChild(cel('label', '', d.type === 'avive' ? 'Nombre de pièces' : 'Nombre de planches'));
      var iQ = document.createElement('input');
      iQ.type = 'number'; iQ.min = '0'; iQ.step = '1'; iQ.inputMode = 'numeric';
      iQ.value = d.quantite || 0;
      iQ.onchange = function () {
        d.quantite = Math.max(0, parseInt(iQ.value, 10) || 0);
        d.auto = false; changer();
      };
      fQ.appendChild(iQ);
      ligne.appendChild(fQ);

      var vol = DuramenCore.volumeDebitDemande(g, d);
      ligne.appendChild(cel('div', 'sciage-estimation', vol > 0
        ? '≈ ' + vol.toFixed(3) + ' m³ (estimation)'
        : 'Indiquez les cotes et la quantité pour obtenir une estimation.'));

      if (debits.length > 1) {
        var bSup = cel('button', 'btn btn-outline sciage-btn-retirer', '✕ Retirer');
        bSup.type = 'button';
        bSup.onclick = function () { debits.splice(i, 1); changer(); };
        ligne.appendChild(bSup);
      }
      zone.appendChild(ligne);
    });

    // Les planches en plot tiennent-elles dans la grume ?
    if (debits.some(function (d) { return d.type === 'plot'; })) {
      var util = DuramenCore.diametreUtilisePlots(debits);
      zone.appendChild(cel('div', 'sciage-estimation',
        (util > m.diametre ? '⚠ Dépasse le diamètre — ' : '')
        + 'Diamètre pris par les plots : ' + formatNb(util, 1) + ' / ' + m.diametre + ' cm'));
    }

    var bAdd = cel('button', 'btn btn-outline sciage-btn-ajouter', '+ Ajouter une épaisseur');
    bAdd.type = 'button';
    bAdd.onclick = function () {
      // Les quantités déjà en place sont gardées ; la nouvelle épaisseur
      // prend ce qui reste du diamètre
      debits.forEach(function (d) { d.auto = false; });
      debits.push({ type: 'plot', epaisseur_mm: 54, largeur_mm: 0, quantite: 0, auto: true });
      changer();
    };
    zone.appendChild(bAdd);
  }

  cb.onchange = function () {
    if (cb.checked) campDraft.choix[g.id] = campDraft.choix[g.id]
      || { debits: [{ type: 'plot', epaisseur_mm: 27, largeur_mm: 0, quantite: 0, auto: true }] };
    else delete campDraft.choix[g.id];
    zone.classList.toggle('hidden', !cb.checked);
    sauverCampDraft(); rendreChoix(); majResumeCampagne();
  };
  rendreChoix();
  return row;
}

function majResumeCampagne() {
  var el = document.getElementById('camp-resume');
  if (!el || !campDraft) return;
  var n = Object.keys(campDraft.choix).length;
  el.textContent = n === 0 ? 'Aucune grume choisie.' : n + (n > 1 ? ' grumes choisies' : ' grume choisie');
}

async function enregistrerCampagne() {
  var ids = Object.keys(campDraft.choix);
  if (ids.length === 0) { showError('Choisissez au moins une grume.'); return; }
  var lignes = [];
  for (var i = 0; i < ids.length; i++) {
    var g  = lots.find(function (l) { return l.id === ids[i]; });
    var ch = campDraft.choix[ids[i]];
    if (!g) continue;
    var okDebit = DuramenCore.validerDebitGrume(g);
    if (!okDebit.ok) { showError(okDebit.erreur); return; }
    var debits = debitsDuChoix(ch);
    for (var j = 0; j < debits.length; j++) {
      var d = debits[j];
      if (!DuramenCore.epaisseurValide(d.epaisseur_mm)) {
        showError('Grume ' + g.nom + ' : épaisseur à indiquer (de ' + DuramenCore.EPAISSEUR_AUTRE_MIN
          + ' à ' + DuramenCore.EPAISSEUR_AUTRE_MAX + ' mm).'); return;
      }
      if (d.type === 'avive' && !(d.largeur_mm > 0)) { showError('Grume ' + g.nom + ' : largeur de l\'avivé à indiquer.'); return; }
      if (!(d.quantite > 0)) { showError('Grume ' + g.nom + ' : nombre de planches ou de pièces à indiquer.'); return; }
    }
    var m = DuramenCore.mesuresGrume(g);
    if (DuramenCore.diametreUtilisePlots(debits) > m.diametre
        && !confirm('Grume ' + g.nom + ' : les plots demandés dépassent le diamètre de la grume.\nEnregistrer quand même ?')) return;
    var debitsLigne = debits.map(function (d) {
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
      // Champs du premier débit : lus par les versions précédentes de l'app
      type: premier.type, epaisseur_mm: premier.epaisseur_mm, largeur_mm: premier.largeur_mm,
      estimation_quantite: debitsLigne.reduce(function (s, d) { return s + d.quantite; }, 0),
      estimation_volume: arrondiM3(debitsLigne.reduce(function (s, d) { return s + d.volume; }, 0))
    });
  }
  // Ordre de la feuille de débit : les plus urgentes d'abord
  var ordre = grumesParUrgence(lots).map(function (g) { return g.id; });
  lignes.sort(function (a, b) { return ordre.indexOf(a.grume_id) - ordre.indexOf(b.grume_id); });

  var campagne = {
    id:           crypto.randomUUID(),
    commune_code: communeConnectee.code,
    nom:          'Campagne du ' + formatDateFr(campDraft.date_prevue || new Date()),
    date_prevue:  campDraft.date_prevue || null,
    scieur:       '',
    lignes:       lignes,
    date_iso:     new Date().toISOString()
  };
  try {
    showLoading(true);
    await sbInsert('campagnes', campagne, { sansRetour: true });
    try { localStorage.removeItem(CLE_BROUILLON_CAMPAGNE); } catch (e) {}
    fermerPreparationCampagne();
    stockEtat = 'brut';
    await chargerDonnees();
    showToastSucces('Campagne enregistrée : ' + lignes.length + (lignes.length > 1 ? ' grumes à débiter.' : ' grume à débiter.'));
  } catch (err) {
    if (err.reseau) showError('Pas de réseau : la campagne s\'enregistre avec réseau. Votre préparation est gardée.');
    else if (/GRUME SANS NUMÉRO/.test(err.message)) showError('Une grume n\'a pas encore de numéro : attribuez-le avant de la débiter.');
    else if (/GRUME DÉJÀ RÉSERVÉE|GRUME DÉJÀ SORTIE/.test(err.message)) {
      // Un autre poste (mobile ou bureau) a pris cette grume juste avant :
      // la base garde le premier. La préparation est reconstruite sur le stock réel.
      showError('Une grume choisie vient d\'être réservée ou sortie depuis un autre poste. Rien n\'a été enregistré : vérifiez votre préparation.');
      await chargerDonnees();
      ouvrirPreparationCampagne();
    }
    else showError('Erreur enregistrement : ' + err.message);
  } finally {
    showLoading(false);
  }
}

// ═══ Feuille de débit imprimable ═══════════════════════════════════════════
// Colonne « Demandé » remplie, colonne « Réalisé » vide pour le scieur.
function construireFeuilleDebit(c) {
  var f = cel('div', 'feuille-debit');
  f.appendChild(cel('h2', '', 'Feuille de débit — ' + (c.nom || 'Campagne')));
  f.appendChild(cel('p', '', (communeConnectee ? communeConnectee.nom : '') + ' · Date prévue : '
    + formatDateFr(c.date_prevue) + ' · Scieur : ' + (c.scieur || '________________')));
  var table = document.createElement('table');
  table.className = 'feuille-table';
  var thead = document.createElement('thead');
  var trh   = document.createElement('tr');
  ['N°', 'Essence', 'Long.', 'Diam.', 'Demandé', 'Réalisé'].forEach(function (h) {
    trh.appendChild(cel('th', '', h));
  });
  thead.appendChild(trh);
  table.appendChild(thead);
  var tbody = document.createElement('tbody');
  (c.lignes || []).forEach(function (l) {
    var tr = document.createElement('tr');
    [l.nom, l.essence, formatNb(l.longueur, 2) + ' m', l.diametre + ' cm', texteDemande(l),
     '☐ Conforme   ☐ Écart : ____________'].forEach(function (v) { tr.appendChild(cel('td', '', v)); });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  f.appendChild(table);
  f.appendChild(cel('p', 'feuille-pied', 'Date du sciage : ____________     Signature du scieur : ____________'));
  return f;
}

function ouvrirFeuilleDebit(c) {
  var bg = document.getElementById('modal-feuille-bg');
  if (bg) bg.parentNode.removeChild(bg);
  bg = cel('div', 'extract-modal-bg open');
  bg.id = 'modal-feuille-bg';
  var modal = cel('div', 'extract-modal sciage-modal');
  var closeBtn = cel('button', 'modal-close', '✕');
  closeBtn.type = 'button';
  closeBtn.onclick = function () { bg.parentNode.removeChild(bg); };
  modal.appendChild(closeBtn);
  modal.appendChild(construireFeuilleDebit(c));
  var acts = cel('div', 'flex-end');
  var bFerm = cel('button', 'btn btn-outline', 'Fermer');
  bFerm.type = 'button';
  bFerm.onclick = closeBtn.onclick;
  var bImp = cel('button', 'btn btn-primary', 'Imprimer');
  bImp.type = 'button';
  bImp.onclick = function () { imprimerFeuilleDebit(c); };
  acts.appendChild(bFerm);
  acts.appendChild(bImp);
  modal.appendChild(acts);
  bg.appendChild(modal);
  document.body.appendChild(bg);
}

// Impression : seule la feuille reste visible le temps de l'impression
// (classe « hidden » existante), puis la page revient à l'identique.
function imprimerFeuilleDebit(c) {
  var feuille = construireFeuilleDebit(c);
  feuille.classList.add('feuille-impression');
  var masques = [];
  Array.prototype.forEach.call(document.body.children, function (el) {
    if (!el.classList.contains('hidden')) { el.classList.add('hidden'); masques.push(el); }
  });
  document.body.appendChild(feuille);
  var fini = false;
  function restaurer() {
    if (fini) return;
    fini = true;
    if (feuille.parentNode) feuille.parentNode.removeChild(feuille);
    masques.forEach(function (el) { el.classList.remove('hidden'); });
  }
  window.addEventListener('afterprint', restaurer, { once: true });
  window.print();
  setTimeout(restaurer, 1000);
}

// ═══ Clôture d'une campagne : saisie du réalisé ═══════════════════════════
// La colonne « Réalisé » est pré-remplie avec le demandé : on ne corrige
// que les écarts. Un seul envoi : tout passe ou rien.
var clotDraft = null;

// Produits pré-remplis à la clôture : un par débit demandé
function produitsDepuisDemande(l) {
  if (Array.isArray(l.debits) && l.debits.length) {
    return l.debits.map(function (d) {
      return { type: d.type, epaisseur_mm: d.epaisseur_mm,
               largeur_mm: d.type === 'avive' ? d.largeur_mm : null,
               longueur_m: l.longueur, quantite: d.quantite || 0 };
    });
  }
  return [produitDepuisDemande(l)];
}
function produitDepuisDemande(l) {
  return {
    type: l.type, epaisseur_mm: l.epaisseur_mm,
    largeur_mm: l.type === 'avive' ? l.largeur_mm : null,
    longueur_m: l.longueur, quantite: l.estimation_quantite || 0
  };
}
function sauverClotDraft() {
  try { localStorage.setItem(CLE_BROUILLON_CLOTURE, JSON.stringify(clotDraft)); } catch (e) {}
}

function ouvrirCloture(c) {
  var d = lireJSONLocal(CLE_BROUILLON_CLOTURE);
  if (!d || d.campagne_id !== c.id) {
    d = { campagne_id: c.id, grumes: {} };
    (c.lignes || []).forEach(function (l) {
      d.grumes[l.grume_id] = { sciee: true, produits: produitsDepuisDemande(l) };
    });
  }
  clotDraft = d;

  var bg = document.getElementById('modal-cloture-bg');
  if (bg) bg.parentNode.removeChild(bg);
  bg = cel('div', 'extract-modal-bg open');
  bg.id = 'modal-cloture-bg';
  var modal = cel('div', 'extract-modal sciage-modal');
  var closeBtn = cel('button', 'modal-close', '✕');
  closeBtn.type = 'button';
  closeBtn.onclick = fermerCloture;
  modal.appendChild(closeBtn);
  modal.appendChild(cel('h2', '', 'Clôturer — ' + (c.nom || 'Campagne')));
  modal.appendChild(cel('p', 'modal-sub',
    'Le réalisé est pré-rempli avec le demandé. Corrigez seulement les écarts, puis validez.'));

  var sorties = {};
  extractions.forEach(function (e) { (e.grumes_keys || []).forEach(function (k) { sorties[k] = true; }); });

  (c.lignes || []).forEach(function (l) {
    var g = lots.find(function (x) { return x.id === l.grume_id; });
    var card = cel('div', 'histo-lot-card sciage-cloture-grume');
    card.appendChild(cel('div', 'histo-lot-nom', (l.nom || '—') + ' · ' + (l.essence || '')
      + ' · ' + formatNb(l.longueur, 2) + ' m × ' + l.diametre + ' cm'));
    card.appendChild(cel('div', 'histo-essence-meta', 'Demandé : ' + texteDemande(l)));
    if (!g || sorties[l.grume_id + '_0']) {
      delete clotDraft.grumes[l.grume_id];
      card.appendChild(cel('div', 'info-box', 'Grume déjà sortie du stock : elle est ignorée.'));
      modal.appendChild(card);
      return;
    }
    if (!clotDraft.grumes[l.grume_id]) clotDraft.grumes[l.grume_id] = { sciee: true, produits: produitsDepuisDemande(l) };
    card.appendChild(creerSaisieRealise(g, clotDraft.grumes[l.grume_id]));
    modal.appendChild(card);
  });
  sauverClotDraft();

  var acts = cel('div', 'flex-end');
  var bRet = cel('button', 'btn btn-outline', '← Retour');
  bRet.type = 'button';
  bRet.onclick = fermerCloture;
  var bOk = cel('button', 'btn btn-primary', 'Valider la clôture');
  bOk.type = 'button';
  bOk.onclick = function () { validerCloture(c); };
  acts.appendChild(bRet);
  acts.appendChild(bOk);
  modal.appendChild(acts);
  bg.appendChild(modal);
  document.body.appendChild(bg);
}

function fermerCloture() {
  var bg = document.getElementById('modal-cloture-bg');
  if (bg) bg.parentNode.removeChild(bg);
}

// Saisie du réalisé d'une grume : sciée ou non, puis ses produits
function creerSaisieRealise(g, etat) {
  var zone = cel('div', 'sciage-realise');

  var lab = cel('label', 'sciage-grume-check');
  var cb  = document.createElement('input');
  cb.type    = 'checkbox';
  cb.checked = etat.sciee;
  lab.appendChild(cb);
  lab.appendChild(cel('span', '', 'Grume sciée'));
  zone.appendChild(lab);

  var liste = cel('div', 'sciage-produits' + (etat.sciee ? '' : ' hidden'));
  zone.appendChild(liste);
  var note = cel('div', 'histo-essence-meta' + (etat.sciee ? ' hidden' : ''),
    'Non sciée : la grume reste en stock brut.');
  zone.appendChild(note);

  cb.onchange = function () {
    etat.sciee = cb.checked;
    liste.classList.toggle('hidden', !cb.checked);
    note.classList.toggle('hidden', cb.checked);
    sauverClotDraft();
  };

  function rendre() {
    while (liste.firstChild) liste.removeChild(liste.firstChild);
    etat.produits.forEach(function (p, i) {
      var ligne = cel('div', 'sciage-produit-ligne');
      var sel = document.createElement('select');
      [['plot', 'Plot'], ['avive', 'Avivé']].forEach(function (t) {
        var o = document.createElement('option');
        o.value = t[0]; o.textContent = t[1];
        if (p.type === t[0]) o.selected = true;
        sel.appendChild(o);
      });
      var fT = cel('div', 'field');
      fT.appendChild(cel('label', '', 'Type'));
      fT.appendChild(sel);
      ligne.appendChild(fT);

      var vol = cel('div', 'sciage-estimation');
      function majVol() {
        vol.textContent = DuramenCore.volumeProduit(p, g).toFixed(3) + ' m³';
      }
      var champs = [['epaisseur_mm', 'Épaisseur (mm)'], ['largeur_mm', 'Largeur (mm)'],
                    ['longueur_m', 'Longueur (m)'], ['quantite', 'Quantité']];
      champs.forEach(function (f) {
        var fld = cel('div', 'field' + (f[0] === 'largeur_mm' && p.type !== 'avive' ? ' hidden' : ''));
        fld.appendChild(cel('label', '', f[1]));
        var inp = document.createElement('input');
        inp.type = 'number';
        inp.min  = '0';
        inp.step = f[0] === 'longueur_m' ? '0.05' : '1';
        inp.inputMode = f[0] === 'longueur_m' ? 'decimal' : 'numeric';
        inp.value = (p[f[0]] === null || p[f[0]] === undefined) ? '' : p[f[0]];
        inp.oninput = function () {
          p[f[0]] = parseFloat(String(inp.value).replace(',', '.')) || 0;
          sauverClotDraft(); majVol();
        };
        fld.appendChild(inp);
        ligne.appendChild(fld);
      });
      sel.onchange = function () { p.type = sel.value; sauverClotDraft(); rendre(); };

      ligne.appendChild(vol);
      var bSup = cel('button', 'btn btn-outline sciage-btn-retirer', '✕ Retirer');
      bSup.type = 'button';
      bSup.onclick = function () { etat.produits.splice(i, 1); sauverClotDraft(); rendre(); };
      ligne.appendChild(bSup);
      liste.appendChild(ligne);
      majVol();
    });
    var bAdd = cel('button', 'btn btn-outline sciage-btn-ajouter', '+ Ajouter un produit');
    bAdd.type = 'button';
    bAdd.onclick = function () {
      var m = DuramenCore.mesuresGrume(g);
      etat.produits.push({ type: 'avive', epaisseur_mm: 27, largeur_mm: 150, longueur_m: m.longueur, quantite: 0 });
      sauverClotDraft(); rendre();
    };
    liste.appendChild(bAdd);
  }
  rendre();
  return zone;
}

function produitValide(p) {
  return p.quantite > 0 && p.epaisseur_mm > 0 && p.longueur_m > 0 && (p.type !== 'avive' || p.largeur_mm > 0);
}

async function validerCloture(c) {
  if (!navigator.onLine) { showError('Pas de réseau : la clôture se fait avec réseau. Votre saisie est gardée.'); return; }
  try {
    showLoading(true);
    // Données fraîches : une grume a pu sortir entre-temps
    await chargerDonnees();
    if (campagneCloturee(c)) { showError('Cette campagne a déjà été clôturée.'); fermerCloture(); return; }
    var sorties = {};
    extractions.forEach(function (e) { (e.grumes_keys || []).forEach(function (k) { sorties[k] = true; }); });

    var now = new Date();
    var lignesEnvoi = [];
    var nbProduits = 0, nbNonSciees = 0;
    var ids = Object.keys(clotDraft.grumes);
    for (var i = 0; i < ids.length; i++) {
      var etat = clotDraft.grumes[ids[i]];
      var g    = lots.find(function (x) { return x.id === ids[i]; });
      if (!g || sorties[ids[i] + '_0']) {
        showError('Une grume de la campagne vient de sortir du stock. Rouvrez la clôture pour vérifier.');
        return;
      }
      if (!etat.sciee) { nbNonSciees++; continue; }
      var invalide = etat.produits.find(function (p) { return p.quantite > 0 && !produitValide(p); });
      if (invalide) { showError('Grume ' + g.nom + ' : un produit a des cotes incomplètes.'); return; }
      var produits = etat.produits.filter(produitValide).map(function (p) {
        return {
          type: p.type, epaisseur_mm: p.epaisseur_mm,
          largeur_mm: p.type === 'avive' ? p.largeur_mm : null,
          longueur_m: p.longueur_m, quantite: p.quantite,
          volume: arrondiM3(DuramenCore.volumeProduit(p, g)),
          grume_nom: g.nom
        };
      });
      nbProduits += produits.reduce(function (s, p) { return s + p.quantite; }, 0);
      lignesEnvoi.push({
        id:           crypto.randomUUID(),
        commune_code: communeConnectee.code,
        essence:      g.essence,
        volume:       arrondiM3(g.vol_utile || 0),
        usage:        'Sciage',
        destination:  c.nom || 'Campagne de sciage',
        commune:      communeConnectee.nom,
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
    if (lignesEnvoi.length === 0) {
      showError('Aucune grume sciée. Si le sciage n\'a pas eu lieu, supprimez la campagne.');
      return;
    }
    showLoading(false);
    if (!confirm('Clôturer la campagne ?\n' + lignesEnvoi.length + ' grume(s) sciée(s) → ' + nbProduits
      + ' pièce(s) en stock produits.' + (nbNonSciees ? '\n' + nbNonSciees + ' grume(s) non sciée(s) restent en stock brut.' : '')
      + '\nLa clôture est définitive.')) return;
    showLoading(true);
    // Envoi groupé : soit toutes les grumes passent, soit aucune
    await sbInsert('extractions', lignesEnvoi, { sansRetour: true });
    try { localStorage.removeItem(CLE_BROUILLON_CLOTURE); } catch (e) {}
    fermerCloture();
    stockEtat = 'produits';
    await chargerDonnees();
    showToastSucces('Campagne clôturée : ' + nbProduits + ' pièce(s) en stock produits.');
  } catch (err) {
    if (err.reseau) showError('Pas de réseau : la clôture n\'a pas été envoyée. Votre saisie est gardée.');
    else if (/GRUME DÉJÀ SORTIE/.test(err.message)) showError('Une grume de la campagne est déjà sortie du stock. Rien n\'a été enregistré.');
    else if (/STOCK INSUFFISANT/.test(err.message)) showError('Le stock a changé entre-temps. Rien n\'a été enregistré.');
    else if (/23503/.test(err.message)) {
      showError('Cette campagne vient d\'être supprimée depuis un autre poste. Rien n\'a été enregistré.');
      fermerCloture();
      await chargerDonnees();
    }
    else showError('Erreur clôture : ' + err.message);
  } finally {
    showLoading(false);
  }
}

// ─── Header stats ─────────────────────────────────────────────────────────
function mettreAJourHeaderStats() {
  var stock = DuramenCore.getStock();
  var tD  = Object.values(stock).reduce(function (s, e) { return s + e.dispo; }, 0);
  var nbE = Object.keys(stock).length;
  var elVol = document.getElementById('hs-vol');
  var elLot = document.getElementById('hs-lots');
  var elEss = document.getElementById('hs-essences');
  if (elVol) elVol.textContent = tD.toFixed(3);
  if (elLot) elLot.textContent = lots.length;
  if (elEss) elEss.textContent = nbE;
}

// ─── Accueil mobile ───────────────────────────────────────────────────────
function mettreAJourAccueil() {
  var communeEl = document.getElementById('accueil-commune');
  if (communeEl && communeConnectee) communeEl.textContent = communeConnectee.nom;
  var stock = DuramenCore.getStock();
  var tD = Object.values(stock).reduce(function (s, e) { return s + e.dispo; }, 0);
  var stockEl = document.getElementById('accueil-stock-val');
  if (stockEl) stockEl.textContent = tD.toFixed(3);
}

// ─── Authentification via Supabase ────────────────────────────────────────
var communeConnectee = null;

function verifierAcces() {
  var session = localStorage.getItem('duramen_session');
  if (session) {
    try {
      communeConnectee = JSON.parse(session);
      sbH['x-commune-code'] = communeConnectee.code;
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
      SUPABASE_URL + '/rest/v1/rpc/verifier_code',
      { method: 'POST', headers: sbH, body: JSON.stringify({ code_saisi: code }) }
    );
    if (!res.ok) throw new Error('Erreur reseau ' + res.status);
    var data = await res.json();
    if (data && data.length > 0) {
      communeConnectee = { code: data[0].code, nom: data[0].commune };
      localStorage.setItem('duramen_session', JSON.stringify(communeConnectee));
      sbH['x-commune-code'] = communeConnectee.code;
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
  hr.appendChild(document.createTextNode(' grumes · '));
  var se = document.createElement('strong'); se.id = 'hs-essences'; se.textContent = '--'; hr.appendChild(se);
  hr.appendChild(document.createTextNode(' essences'));
  hr.appendChild(document.createElement('br'));
  hr.appendChild(btnD);
  var btnCommune = document.getElementById('histo-btn-commune');
  if (btnCommune) btnCommune.textContent = communeConnectee.nom;
  var btnCommunaute = document.getElementById('histo-btn-communaute');
  if (btnCommunaute) btnCommunaute.textContent = 'métropole';
  initialiserPanelSaisie();
  captureGPS();
  chargerDonnees();
  // Envoi de ce qui attend sur le téléphone ; si quelque chose est parti,
  // on recharge le stock pour l'y faire apparaître.
  envoyerFileEnvoi().then(function (nb) { if (nb) chargerDonnees({ silencieux: true }); });
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

// ═══════════════════════════════════════════════════════════════════════════
// SAISIE "AJOUTER AU STOCK" — Formulaire unique mobile
// ═══════════════════════════════════════════════════════════════════════════

var nouvGrumes    = [];
var nouvGPS       = { lat: null, lon: null };
var nouvDate      = new Date();
var nouvAnnee     = String(new Date().getFullYear());
// Date d'abattage : 'AAAA-MM-JJ' ou 'inconnue' (grume saisie après coup)
var nouvAbattage  = jourLocalISO(new Date());
var saisieEnCours = false;

// Date du jour au format AAAA-MM-JJ, à l'heure du téléphone
function jourLocalISO(d) {
  var x = new Date(d);
  return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2);
}
// Année de coupe déduite de la date d'abattage
function anneeDepuisAbattage(abattage) {
  return abattage === 'inconnue' ? DuramenCore.VALEUR_INCONNUE : String(abattage).slice(0, 4);
}
// Texte affiché pour la date d'abattage
function texteAbattage(abattage) {
  if (abattage === 'inconnue') return 'Inconnue';
  if (abattage === jourLocalISO(new Date())) return 'Aujourd\'hui';
  return formatDateFr(abattage + 'T12:00:00');
}

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
  var chip = document.getElementById('saisie-gps-chip');
  if (chip) chip.textContent = 'GPS · en cours…';
  if (!navigator.geolocation) {
    if (chip) chip.textContent = 'GPS non supporté';
    return;
  }
  var wid = navigator.geolocation.watchPosition(function (pos) {
    navigator.geolocation.clearWatch(wid);
    nouvGPS.lat = +pos.coords.latitude.toFixed(6);
    nouvGPS.lon = +pos.coords.longitude.toFixed(6);
    var c = document.getElementById('saisie-gps-chip');
    if (c) c.textContent = 'GPS · actif';
  }, function (err) {
    navigator.geolocation.clearWatch(wid);
    var c = document.getElementById('saisie-gps-chip');
    if (!c) return;
    if (err.code === 1) {
      c.textContent = 'GPS · refusé';
    } else {
      c.textContent = 'GPS · inactif';
    }
  }, { enableHighAccuracy: false, maximumAge: 60000 });
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
  dims.textContent = 'L ' + g.longueur.toFixed(2) + ' m  ·  Ø ' + g.diametre + ' cm';
  card.appendChild(dims);

  var right = cel('div', 'grume-summary-right');
  var v = calcVol(g.diametre, g.longueur) * g.quantite;
  right.appendChild(cel('div', 'grume-summary-vol', v.toFixed(3) + ' m³'));
  right.appendChild(cel('span', 'grume-summary-check', '✓'));

  var del = cel('button', 'grume-summary-del', '×');
  del.type    = 'button';
  del.title   = 'Supprimer ces mesures';
  del.onclick = function () { nouvSupprimerLigne(idx); };
  right.appendChild(del);

  card.appendChild(right);
  return card;
}

// ─── Rendu de toute la liste (utilisé après suppression) ──────────────────
function nouvRendreGrumes() {
  var liste = document.getElementById('saisie-grumes-liste');
  if (!liste) return;
  while (liste.firstChild) liste.removeChild(liste.firstChild);
  nouvGrumes.forEach(function (g, idx) { liste.appendChild(creerCarteGrume(idx)); });
  var syn = document.getElementById('saisie-synthese');
  if (syn) syn.classList.toggle('hidden', nouvGrumes.length === 0);
  var add = document.getElementById('saisie-add-btn');
  if (add) add.classList.toggle('hidden', nouvGrumes.length > 0);
  nouvRendreSynthese();
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
  // Une saisie = une grume : les nouvelles mesures remplacent les précédentes
  nouvGrumes = [{ longueur: grumeDraft.longueur, diametre: diam, quantite: 1 }];
  nouvRendreGrumes();
  nouvSauverBrouillon();
  fermerGrumeSheet();
}

// ─── Barre de synthèse ────────────────────────────────────────────────────
function nouvRendreSynthese() {
  var volume = nouvGrumes.reduce(function (s, g) {
    return s + calcVol(g.diametre, g.longueur) * g.quantite;
  }, 0);
  var elV = document.getElementById('synth-vol');
  if (elV) elV.textContent = volume.toFixed(3);
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

// ─── Modifier la date d'abattage ──────────────────────────────────────────
// Grume saisie après coup : on indique sa vraie date d'abattage, ou
// « Inconnue ». Le délai avant débit part de cette date.
function nouvModifierAbattage() {
  var row = document.getElementById('saisie-annee-row');
  if (!row) return;
  row.querySelector('.saisie-annee-val').classList.add('hidden');
  row.querySelector('.saisie-annee-btn').classList.add('hidden');
  var inp = row.querySelector('.saisie-annee-input');
  inp.value = nouvAbattage === 'inconnue' ? '' : nouvAbattage;
  inp.classList.remove('hidden');
  row.querySelector('.saisie-abattage-inconnue').classList.remove('hidden');
  inp.focus();
}
function nouvValiderAbattage(valeur) {
  var row = document.getElementById('saisie-annee-row');
  if (!row) return;
  var aujourdhui = jourLocalISO(new Date());
  if (valeur === 'inconnue') nouvAbattage = 'inconnue';
  else if (/^\d{4}-\d{2}-\d{2}$/.test(valeur) && valeur <= aujourdhui && valeur >= '2000-01-01') nouvAbattage = valeur;
  else if (valeur) showError('Date d\'abattage invalide : elle ne peut pas être dans le futur.');
  nouvAnnee = anneeDepuisAbattage(nouvAbattage);
  row.querySelector('.saisie-annee-val').textContent = texteAbattage(nouvAbattage);
  row.querySelector('.saisie-annee-val').classList.remove('hidden');
  row.querySelector('.saisie-annee-btn').classList.remove('hidden');
  row.querySelector('.saisie-annee-input').classList.add('hidden');
  row.querySelector('.saisie-abattage-inconnue').classList.add('hidden');
  nouvSauverBrouillon();
}

// ─── Modal "Nommer la grume" ──────────────────────────────────────────────
// Nom = préfixe de la commune + tiret + numéro à 5 chiffres, comme sur
// l'étiquette (ex. VER-00042). L'agent peut taper « 42 » : les zéros sont
// ajoutés. Sans étiquette sur soi : « Numéroter plus tard » enregistre la
// grume en attente de marquage. Toutes les grumes sont visibles des autres communes.
function assureModalNommer() {
  if (document.getElementById('modal-nommer-bg')) return;

  var bg    = cel('div', 'extract-modal-bg');
  bg.id     = 'modal-nommer-bg';
  var modal = cel('div', 'extract-modal modal-nommer');

  var closeBtn = cel('button', 'modal-close', '✕');
  closeBtn.onclick = nouvFermerModal;
  modal.appendChild(closeBtn);

  modal.appendChild(cel('h2', '', 'Nommer la grume'));
  var apercu = cel('p', 'modal-sub', '');
  apercu.id  = 'modal-nom-apercu';
  modal.appendChild(apercu);

  var fNom  = cel('div', 'field');
  var lNom  = cel('label', '', 'Numéro de l\'étiquette (5 chiffres)');
  lNom.htmlFor = 'modal-nom-input';
  var iNom  = document.createElement('input');
  iNom.type      = 'text';
  iNom.id        = 'modal-nom-input';
  iNom.inputMode = 'numeric';
  iNom.maxLength = DuramenCore.NUMERO_GRUME_CHIFFRES;
  iNom.autocomplete = 'off';
  iNom.placeholder  = '00000';
  iNom.addEventListener('input', function () {
    iNom.value = iNom.value.replace(/\D/g, '').slice(0, DuramenCore.NUMERO_GRUME_CHIFFRES);
    majApercuNomGrume();
  });
  iNom.addEventListener('keydown', function (e) { if (e.key === 'Enter') nouvConfirmer(); });
  fNom.appendChild(lNom);
  fNom.appendChild(iNom);
  modal.appendChild(fNom);

  // Pas d'étiquette sur soi : un repère pour reconnaître la grume au marquage
  var fRep  = cel('div', 'field');
  var lRep  = cel('label', '', 'Pas d\'étiquette ? Repère pour la retrouver (facultatif)');
  lRep.htmlFor = 'modal-repere-input';
  var iRep  = document.createElement('input');
  iRep.type = 'text';
  iRep.id   = 'modal-repere-input';
  iRep.maxLength    = 80;
  iRep.autocomplete = 'off';
  iRep.placeholder  = 'ex. 3e grume de la pile, côté portail';
  fRep.appendChild(lRep);
  fRep.appendChild(iRep);
  modal.appendChild(fRep);

  // Trois boutons : ils passent à la ligne sur petit écran
  var acts   = cel('div', 'flex-end sciage-campagne-actions');
  var btnRet = cel('button', 'btn btn-outline', '← Retour');
  btnRet.type    = 'button';
  btnRet.onclick = nouvFermerModal;
  var btnPlusTard = cel('button', 'btn btn-outline', 'Numéroter plus tard');
  btnPlusTard.type    = 'button';
  btnPlusTard.onclick = function () { nouvConfirmer({ sansNumero: true }); };
  var btnOk  = cel('button', 'btn btn-primary', 'Confirmer');
  btnOk.type    = 'button';
  btnOk.onclick = function () { nouvConfirmer(); };
  acts.appendChild(btnRet);
  acts.appendChild(btnPlusTard);
  acts.appendChild(btnOk);
  modal.appendChild(acts);

  ajouterSwipeDown(modal, nouvFermerModal);
  bg.appendChild(modal);
  document.body.appendChild(bg);
}

// Préfixe de la commune connectée, suivi du tiret : « VER- »
function prefixeNomGrume() {
  return DuramenCore.prefixeCommune(communeConnectee ? communeConnectee.nom : '') + '-';
}

function majApercuNomGrume() {
  var inp = document.getElementById('modal-nom-input');
  var el  = document.getElementById('modal-nom-apercu');
  if (!el) return;
  var num = DuramenCore.formaterNumeroGrume(inp ? inp.value : '');
  el.textContent = 'Nom : ' + prefixeNomGrume() + (num || '_____');
}

// Le nom existe-t-il déjà (grumes enregistrées ou en attente d'envoi) ?
// Compare les numéros : VER-0042 (ancien format) et VER-00042 sont la même grume.
function nomGrumeDejaPris(nom) {
  var n = DuramenCore.numeroDeNom(nom);
  var pref = nom.slice(0, nom.lastIndexOf('-') + 1);
  function meme(autre) {
    return !!autre && autre.slice(0, autre.lastIndexOf('-') + 1) === pref
      && DuramenCore.numeroDeNom(autre) === n;
  }
  return lots.some(function (l) { return meme(l.nom); })
    || fileEnvoiCommune().some(function (it) { return it.table === 'grumes' && meme(it.data.nom); });
}

// Nom affiché d'une grume : son numéro, ou « Sans numéro » si en attente
function nomAfficheGrume(g) {
  return DuramenCore.estNumerotee(g) ? g.nom : 'Sans numéro';
}

function nouvOuvrirModal() {
  var essEl = document.getElementById('saisie-essence');
  if (!essEl || !essEl.value) { showError('Choisissez une essence avant de nommer la grume.'); return; }
  if (nouvGrumes.length === 0) { showError('Saisissez les mesures avant de nommer la grume.'); return; }
  document.getElementById('modal-nommer-bg').classList.add('open');
  var inp = document.getElementById('modal-nom-input');
  var rep = document.getElementById('modal-repere-input');
  if (rep) rep.value = '';
  if (inp) { inp.value = ''; inp.focus(); }
  majApercuNomGrume();
}
function nouvFermerModal() {
  var bg = document.getElementById('modal-nommer-bg');
  if (bg) bg.classList.remove('open');
}

// ─── Confirmer et sauvegarder le lot ─────────────────────────────────────
async function nouvConfirmer(options) {
  var sansNumero = !!(options && options.sansNumero);
  var essEl = document.getElementById('saisie-essence');
  var proEl = document.getElementById('saisie-provenance');
  var cauEl = document.getElementById('saisie-cause');
  var nomEl = document.getElementById('modal-nom-input');

  if (!essEl || !essEl.value) { showError('Essence manquante.'); return; }
  if (!proEl || !proEl.value) { showError('Provenance manquante.'); return; }
  if (!cauEl || !cauEl.value) { showError("Cause d'abattage manquante."); return; }

  var essence    = essEl.value;
  var provenance = proEl.value;
  var cause      = cauEl.value;
  var repEl      = document.getElementById('modal-repere-input');
  var repere     = repEl ? repEl.value.trim() : '';
  var nom        = null;
  if (!sansNumero) {
    var numero = DuramenCore.formaterNumeroGrume(nomEl ? nomEl.value : '');
    if (!numero) {
      showError('Tapez le numéro de l\'étiquette (1 à 5 chiffres), ou choisissez « Numéroter plus tard ».'); return;
    }
    nom = prefixeNomGrume() + numero;
    if (nomGrumeDejaPris(nom)) {
      showError('Le numéro ' + nom + ' existe déjà. Vérifiez l\'étiquette de la grume : erreur de saisie ou grume déjà enregistrée.'); return;
    }
  }
  // Toutes les grumes sont visibles des autres communes
  var partage    = true;

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
    annee:        anneeDepuisAbattage(nouvAbattage),
    date_abattage: nouvAbattage === 'inconnue' ? null : nouvAbattage,
    repere:       repere || null,
    usage:        'Non défini',
    partage:      partage,
    epaisseur:    0,
    delta:        0,
    nb_grumes:    nbGrumes,
    vol_brut:     arrondiM3(volBrut),
    vol_utile:    arrondiM3(volBrut),
    vol_dechets:  0,
    nb_planches:  0,
    lineaire:     0,
    date:         nouvDate.toLocaleDateString('fr-FR'),
    date_iso:     nouvDate.toISOString(),
    grumes:       grumesFlat,
    latitude:     nouvGPS.lat,
    longitude:    nouvGPS.lon
  };

  try {
    showLoading(true);
    // Pas de réseau (ou réseau trop faible) : la grume est gardée sur le
    // téléphone et partira toute seule au retour du réseau.
    var envoye = true;
    try {
      await sbInsert('grumes', lot);
    } catch (errEnvoi) {
      if (!errEnvoi.reseau) throw errEnvoi;
      ajouterFileEnvoi('grumes', lot);
      envoye = false;
    }
    if (envoye) await chargerDonnees();
    nouvFermerModal();
    effacerBrouillonSaisie();
    // Toast de confirmation
    var libelle = nom ? '"' + nom + '"' : 'Grume sans numéro';
    var toast = cel('div', 'toast-succes', envoye
      ? libelle + ' sauvegardée — ' + volBrut.toFixed(3) + ' m³' + (nom ? '' : ' · en attente de marquage')
      : libelle + ' gardée sur le téléphone — envoi automatique au retour du réseau');
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
    // Numéro déjà en base : erreur de saisie ou grume déjà enregistrée
    if (/grumes_nom_unique|duplicate key/.test(err.message)) {
      showError('Le numéro ' + nom + ' existe déjà. Vérifiez l\'étiquette de la grume : erreur de saisie ou grume déjà enregistrée.');
    } else {
      showError('Erreur sauvegarde : ' + err.message);
    }
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
    abattage:   nouvAbattage,
    grumes:     nouvGrumes.slice()
  };
  localStorage.setItem('duramen_draft_v2', JSON.stringify(draft));
}
function effacerBrouillonSaisie() {
  saisieEnCours = false;
  localStorage.removeItem('duramen_draft_v2');
  localStorage.removeItem('duramen_draft'); // nettoyage de l'ancien format
}
// Restauration silencieuse : sur le terrain, un onglet rechargé par le
// téléphone ne doit jamais faire perdre la saisie. On restaure sans question —
// le bouton « Annuler » reste le seul moyen volontaire d'effacer le brouillon.
function nouvRestaurerBrouillon() {
  if (saisieEnCours) return;
  var raw = localStorage.getItem('duramen_draft_v2');
  if (!raw) return;
  try {
    var d = JSON.parse(raw);
    if (!d) return;
    var aGrumes = Array.isArray(d.grumes) && d.grumes.length > 0;
    var aChamps = !!(d.essence || d.provenance || d.cause);
    if (!aGrumes && !aChamps) return;
    var essEl = document.getElementById('saisie-essence');
    var proEl = document.getElementById('saisie-provenance');
    var cauEl = document.getElementById('saisie-cause');
    if (essEl) essEl.value = d.essence    || '';
    if (proEl) proEl.value = d.provenance || '';
    if (cauEl) cauEl.value = d.cause      || '';
    if (d.abattage) {
      nouvAbattage = d.abattage;
      nouvAnnee    = anneeDepuisAbattage(nouvAbattage);
      var valEl = document.querySelector('.saisie-annee-val');
      if (valEl) valEl.textContent = texteAbattage(nouvAbattage);
    }
    nouvGrumes = aGrumes ? [Object.assign({}, d.grumes[0], { quantite: 1 })] : [];
    nouvRendreGrumes();
    saisieEnCours = true;
    showToastSucces('Saisie précédente restaurée.');
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
  nouvAbattage = jourLocalISO(nouvDate);
  nouvAnnee  = anneeDepuisAbattage(nouvAbattage);

  // Vider le panel
  while (panel.firstChild) panel.removeChild(panel.firstChild);

  // ── Chips méta : date + GPS ──────────────────────────────────────────
  var meta     = cel('div', 'saisie-meta');
  var dateStr  = nouvDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  meta.appendChild(cel('div', 'saisie-chip', dateStr));
  var gpsChip  = cel('div', 'saisie-chip', 'GPS · en cours…');
  gpsChip.id      = 'saisie-gps-chip';
  gpsChip.onclick = captureGPS;
  meta.appendChild(gpsChip);
  panel.appendChild(meta);

  // ── Date d'abattage (aujourd'hui par défaut, ou date passée, ou inconnue)
  var anneeRow = cel('div', 'saisie-annee-row');
  anneeRow.id  = 'saisie-annee-row';
  anneeRow.appendChild(cel('span', 'saisie-annee-lbl', 'Abattue le'));
  anneeRow.appendChild(cel('span', 'saisie-annee-val', texteAbattage(nouvAbattage)));
  var anneeBtn = cel('button', 'saisie-annee-btn', 'modifier');
  anneeBtn.type    = 'button';
  anneeBtn.onclick = nouvModifierAbattage;
  anneeRow.appendChild(anneeBtn);
  var anneeInp = document.createElement('input');
  anneeInp.className = 'saisie-annee-input hidden';
  anneeInp.type  = 'date';
  anneeInp.max   = jourLocalISO(new Date());
  anneeInp.addEventListener('change', function () { if (anneeInp.value) nouvValiderAbattage(anneeInp.value); });
  anneeInp.addEventListener('keydown', function (e) { if (e.key === 'Enter') nouvValiderAbattage(anneeInp.value); });
  anneeRow.appendChild(anneeInp);
  var inconnueBtn = cel('button', 'saisie-annee-btn saisie-abattage-inconnue hidden', 'Inconnue');
  inconnueBtn.type    = 'button';
  inconnueBtn.onclick = function () { nouvValiderAbattage('inconnue'); };
  anneeRow.appendChild(inconnueBtn);
  panel.appendChild(anneeRow);

  // ── Sélects : essence / provenance / cause ──────────────────────────
  var selGrid = cel('div', 'saisie-selects');
  // Essences : ordre de présence sur le territoire (défini dans core.js)
  selGrid.appendChild(creerSelectSaisie('saisie-essence', 'Essence *',
    [['', '— Choisir —']].concat(DuramenCore.ESSENCES_ORDRE.map(function (e) { return [e, e]; }))
  ));
  selGrid.appendChild(creerSelectSaisie('saisie-provenance', 'Provenance *', [
    ['', '— Choisir —'],
    ['Alignement', 'Alignement urbain'], ['Bosquet', 'Bosquet'],
    ['Forêt', 'Forêt'], ['Haie bocagère', 'Haie bocagère'], ['Parc', 'Parc municipal'],
    ['Autre', 'Autre'], ['Inconnue', 'Inconnue']
  ]));
  selGrid.appendChild(creerSelectSaisie('saisie-cause', "Cause d'abattage *", [
    ['', '— Choisir —'],
    ['Coupe sanitaire', 'Coupe sanitaire'],
    ['Intempérie', 'Intempérie (chablis, neige…)'],
    ['Aménagement', 'Aménagement urbain'],
    ['Coupe sécuritaire', 'Coupe sécuritaire'],
    ['Gestion durable', 'Gestion durable'],
    ['Autre', 'Autre'], ['Inconnue', 'Inconnue']
  ]));
  panel.appendChild(selGrid);

  // ── Section grumes ──────────────────────────────────────────────────
  var section = cel('div', 'saisie-grumes-section');

  var gHead  = cel('div', 'saisie-grumes-header');
  gHead.appendChild(cel('div', 'saisie-grumes-title', 'Mesures de la grume'));
  var gAddBt = cel('button', 'saisie-add-btn', '+ Saisir les mesures');
  gAddBt.type    = 'button';
  gAddBt.id      = 'saisie-add-btn';
  gAddBt.onclick = ouvrirGrumeSheet;
  gHead.appendChild(gAddBt);
  section.appendChild(gHead);

  var liste = cel('div', '');
  liste.id  = 'saisie-grumes-liste';
  section.appendChild(liste);

  // Barre de synthèse — masquée jusqu'à la saisie des mesures
  var synthese = cel('div', 'saisie-synthese hidden');
  synthese.id  = 'saisie-synthese';
  [
    { id: 'synth-vol',    lbl: 'm³ bruts' }
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
  var btnNom  = cel('button', 'saisie-btn saisie-btn-nommer', 'Nommer la grume →');
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

// ═══════════ TICKET RETOUR ═══════════
var feedbackTypeSelectionne = null;

function selFeedbackType(btn, type) {
  document.querySelectorAll('.feedback-type-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  feedbackTypeSelectionne = type;
}

function effacerTicket() {
  document.querySelectorAll('.feedback-type-btn').forEach(function(b) { b.classList.remove('active'); });
  feedbackTypeSelectionne = null;
  var msg = document.getElementById('feedback-message');
  if (msg) msg.value = '';
}

async function envoyerTicket() {
  var msg = document.getElementById('feedback-message');
  if (!feedbackTypeSelectionne) { showError('Choisissez un type de retour.'); return; }
  if (!msg || !msg.value.trim()) { showError('Le message ne peut pas être vide.'); return; }
  var ticket = {
    id: crypto.randomUUID(),
    commune_code: communeConnectee.code,
    commune: communeConnectee.nom,
    type: feedbackTypeSelectionne,
    message: msg.value.trim()
  };
  try {
    showLoading(true);
    // sansRetour : la table feedbacks n'autorise pas la relecture
    var envoye = true;
    try {
      await sbInsert('feedbacks', ticket, { sansRetour: true });
    } catch (errEnvoi) {
      if (!errEnvoi.reseau) throw errEnvoi;
      ajouterFileEnvoi('feedbacks', ticket, { sansRetour: true });
      envoye = false;
    }
    showLoading(false);
    effacerTicket();
    showToastSucces(envoye
      ? 'Ticket envoyé. Merci pour votre retour !'
      : 'Ticket gardé sur le téléphone — envoi automatique au retour du réseau.');
    retourAccueil();
  } catch(e) {
    showLoading(false);
    showError('Erreur lors de l\'envoi : ' + e.message);
  }
}

function retourAccueil() {
  var btn = document.querySelector('[data-panel="accueil"]');
  if (btn) switchTab('accueil', btn);
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
  if (panel === 'historique') afficherHistorique();
}


// ─── Rafraîchissement automatique toutes les 2 minutes ───────────────────
var refreshTimer = null;

function demarrerRafraichissement() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(function() {
    if (!communeConnectee) return;
    envoyerFileEnvoi().then(function () { chargerDonnees({ silencieux: true }); });
  }, 120000); // 120 000 ms = 2 minutes
}

// ─── Swipe down sur les sheets statiques ─────────────────────────────────
(function () {
  var grumeSelSheet = document.getElementById('grume-sel-sheet');
  if (grumeSelSheet) ajouterSwipeDown(grumeSelSheet, fermerGrumeSelSheet);

  var grumeSheet = document.getElementById('grume-sheet');
  if (grumeSheet) ajouterSwipeDown(grumeSheet, fermerGrumeSheet);

}());

verifierAcces();
