// core.js — Noyau métier DURAMEN
// Signatures figées : ne jamais modifier ces fonctions, seulement en ajouter.

var DuramenCore = (function () {

  // Dictionnaire des essences : delta de débit recommandé, usage, couleur CSS
  // Clés avec accents — obligatoire pour correspondre aux valeurs du formulaire
  var ESSENCES_INFO = {
    'Aulne':             { delta: 20, usage: 'Ébénisterie, tournage',               color: 'ec-aulne' },
    'Châtaignier':       { delta: 18, usage: 'Piquets, charpente, lambris',         color: 'ec-chataignier' },
    'Chêne':             { delta: 20, usage: 'Mobilier, parquet, charpente',        color: 'ec-chene' },
    'Cyprès':            { delta: 17, usage: 'Menuiserie ext., bardage',            color: 'ec-cypres' },
    'Douglas':           { delta: 16, usage: 'Charpente, bardage, terrasse',        color: 'ec-douglas' },
    'Épicéa':            { delta: 17, usage: 'Charpente légère, coffrage',          color: 'ec-epicea' },
    'Frêne':             { delta: 20, usage: 'Manches outils, parquet',             color: 'ec-frene' },
    'Hêtre':             { delta: 22, usage: 'Ameublement, jouets, parquet',        color: 'ec-hetre' },
    'Mélèze':            { delta: 16, usage: 'Bardage, terrasse, ext. résistant',   color: 'ec-meleze' },
    'Merisier':          { delta: 25, usage: 'Ébénisterie fine, veneer',            color: 'ec-merisier' },
    'Noyer':             { delta: 25, usage: 'Ébénisterie, mobilier luxe',          color: 'ec-noyer' },
    'Peuplier':          { delta: 22, usage: 'Caisserie, contrepl.',                color: 'ec-peuplier' },
    'Pin maritime':      { delta: 18, usage: 'Charpente, emballage',                color: 'ec-pin-m' },
    'Pin sylvestre':     { delta: 18, usage: 'Charpente, menuiserie int.',          color: 'ec-pin-s' },
    'Platane':           { delta: 20, usage: 'Ébénisterie, parquet, lambris',       color: 'ec-platane' },
    'Robinier (Acacia)': { delta: 15, usage: 'Poteaux, terrasse, ext.',             color: 'ec-robinier' },
    'Séquoia':           { delta: 15, usage: 'Bardage, mobilier jardin',            color: 'ec-sequoia' },
    'Tilleul':           { delta: 22, usage: 'Sculpture, lutherie, jouets',         color: 'ec-tilleul' },
    'Autre':             { delta: 20, usage: 'Usage à définir',                     color: 'ec-autre' }
  };

  // Épaisseur du trait de scie, en mm (constante métier)
  var TRAIT_SCIE_MM = 3;

  // ─── Calcul des volumes ──────────────────────────────────────────────────
  // Formule DURAMEN : V_débité = V_brut × 0.55 × (e / (e + trait_scie))
  // Retourne { volBrut, volUtile, volDechets, nbPlanches, lineaire, rendement, details }
  function calculerVolumes(grumes, epaisseur) {
    var K    = TRAIT_SCIE_MM;
    var tVB  = 0, tVD = 0, tP = 0, tL = 0;
    var details = grumes.map(function (g) {
      var r   = g.diametre / 200;
      var vb  = Math.PI * r * r * g.longueur;
      var vd  = vb * 0.55 * (epaisseur / (epaisseur + K));
      var nb  = Math.floor(g.diametre / ((epaisseur + K) / 10));
      var li  = nb * g.longueur;
      var lm  = nb > 0 ? g.diametre / nb : 0;
      tVB += vb; tVD += vd; tP += nb; tL += li;
      return {
        longueur:   g.longueur,
        diametre:   g.diametre,
        volBrut:    vb,
        nbPlanches: nb,
        lineaire:   li,
        largeurMoy: lm
      };
    });
    return {
      volBrut:    tVB,
      volUtile:   tVD,
      volDechets: tVB - tVD,
      nbPlanches: tP,
      lineaire:   tL,
      rendement:  tVB > 0 ? tVD / tVB : 0,
      details:    details
    };
  }

  // ─── Stock disponible par essence ────────────────────────────────────────
  // Lit les tableaux globaux `lots` et `extractions` (gérés par app.js)
  // Signature figée — ne jamais modifier
  function getStock() {
    var lotsData = (typeof lots !== 'undefined') ? lots : [];
    var extsData = (typeof extractions !== 'undefined') ? extractions : [];
    var stock = {};
    lotsData.forEach(function (l) {
      if (!stock[l.essence]) stock[l.essence] = {
        entree: 0, sorti: 0, dispo: 0, nbLots: 0, nbGrumes: 0,
        color: (ESSENCES_INFO[l.essence] || { color: 'ec-autre' }).color,
        usages: []
      };
      stock[l.essence].entree   += l.vol_utile || 0;
      stock[l.essence].nbLots   += 1;
      stock[l.essence].nbGrumes += l.nb_grumes || 0;
      if (l.usage && stock[l.essence].usages.indexOf(l.usage) === -1)
        stock[l.essence].usages.push(l.usage);
    });
    extsData.forEach(function (e) {
      if (stock[e.essence]) stock[e.essence].sorti += e.volume;
    });
    Object.keys(stock).forEach(function (k) {
      stock[k].dispo = Math.max(0, stock[k].entree - stock[k].sorti);
    });
    return stock;
  }

  // ─── Historique immuable ─────────────────────────────────────────────────
  // Signature figée — ne jamais modifier
  function getHistorique() {
    return lots.slice();
  }

  // ─── Entrée en stock ─────────────────────────────────────────────────────
  // Signature figée — ne jamais modifier
  function entree(lot) {
    lots.push(lot);
  }

  // ─── Sortie de stock ─────────────────────────────────────────────────────
  // Signature figée — ne jamais modifier
  function sortie(extraction) {
    extractions.push(extraction);
  }

  // ─── Validation d'une entrée ─────────────────────────────────────────────
  // Retourne { ok: boolean, erreur: string }
  // Signature figée — ne jamais modifier
  function validerEntree(lot) {
    if (!lot.nom || !lot.nom.trim())
      return { ok: false, erreur: 'Le nom du lot est obligatoire.' };
    if (!lot.essence)
      return { ok: false, erreur: "L'essence est obligatoire." };
    if (!lot.cause)
      return { ok: false, erreur: "La cause d'abattage est obligatoire." };
    if (!lot.provenance)
      return { ok: false, erreur: 'La provenance est obligatoire.' };
    if (!lot.annee)
      return { ok: false, erreur: "L'année de coupe est obligatoire." };
    if (!lot.usage)
      return { ok: false, erreur: "L'usage prévu est obligatoire." };
    if (!lot.epaisseur || lot.epaisseur <= 0)
      return { ok: false, erreur: "L'épaisseur des planches est obligatoire." };
    if (!lot.nb_grumes || lot.nb_grumes < 1)
      return { ok: false, erreur: 'Au moins une grume est requise.' };
    return { ok: true, erreur: '' };
  }

  // ─── Validation d'une sortie ─────────────────────────────────────────────
  // Retourne { ok: boolean, erreur: string }
  // Signature figée — ne jamais modifier
  function validerSortie(extraction) {
    if (!extraction.essence)
      return { ok: false, erreur: "L'essence est obligatoire." };
    if (!extraction.volume || extraction.volume <= 0)
      return { ok: false, erreur: 'Le volume doit être supérieur à 0.' };
    if (!extraction.usage)
      return { ok: false, erreur: "L'usage est obligatoire." };
    if (!extraction.destination || !extraction.destination.trim())
      return { ok: false, erreur: 'La destination est obligatoire.' };
    var stock = getStock();
    if (!stock[extraction.essence])
      return { ok: false, erreur: 'Essence absente du stock.' };
    if (extraction.volume > stock[extraction.essence].dispo)
      return { ok: false, erreur: 'Volume supérieur au stock disponible ('
        + stock[extraction.essence].dispo.toFixed(3) + ' m³).' };
    return { ok: true, erreur: '' };
  }

  // ─── API publique ─────────────────────────────────────────────────────────
  return {
    ESSENCES_INFO:   ESSENCES_INFO,
    calculerVolumes: calculerVolumes,
    getStock:        getStock,
    getHistorique:   getHistorique,
    entree:          entree,
    sortie:          sortie,
    validerEntree:   validerEntree,
    validerSortie:   validerSortie
  };

}());
