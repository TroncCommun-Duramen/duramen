// core.js — Noyau métier DURAMEN
// Signatures figées : ne jamais modifier ces fonctions, seulement en ajouter.

var DuramenCore = (function () {

  // Dictionnaire des essences : delta de débit recommandé, usage, couleur CSS
  // Clés avec accents — obligatoire pour correspondre aux valeurs du formulaire
  var ESSENCES_INFO = {
    'Aulne':             { delta: 20, usage: 'Ébénisterie, tournage',               color: 'ec-aulne' },
    'Cèdre':             { delta: 17, usage: 'Bardage, menuiserie, coffres',        color: 'ec-autre' },
    'Châtaignier':       { delta: 18, usage: 'Piquets, charpente, lambris',         color: 'ec-chataignier' },
    'Chêne':             { delta: 20, usage: 'Mobilier, parquet, charpente',        color: 'ec-chene' },
    'Chêne des marais':  { delta: 20, usage: 'Mobilier, parquet',                   color: 'ec-autre' },
    'Chêne rouge':       { delta: 20, usage: 'Mobilier, parquet, menuiserie int.',  color: 'ec-autre' },
    'Cyprès':            { delta: 17, usage: 'Menuiserie ext., bardage',            color: 'ec-cypres' },
    'Douglas':           { delta: 16, usage: 'Charpente, bardage, terrasse',        color: 'ec-douglas' },
    'Épicéa':            { delta: 17, usage: 'Charpente légère, coffrage',          color: 'ec-epicea' },
    'Frêne':             { delta: 20, usage: 'Manches outils, parquet',             color: 'ec-frene' },
    'Hêtre':             { delta: 22, usage: 'Ameublement, jouets, parquet',        color: 'ec-hetre' },
    'Mélèze':            { delta: 16, usage: 'Bardage, terrasse, ext. résistant',   color: 'ec-meleze' },
    'Merisier':          { delta: 25, usage: 'Ébénisterie fine, veneer',            color: 'ec-merisier' },
    'Noyer':             { delta: 25, usage: 'Ébénisterie, mobilier luxe',          color: 'ec-noyer' },
    'Peuplier':          { delta: 22, usage: 'Caisserie, contrepl.',                color: 'ec-peuplier' },
    'Pin':               { delta: 18, usage: 'Charpente, menuiserie int.',          color: 'ec-pin-m' },
    'Platane':           { delta: 20, usage: 'Ébénisterie, parquet, lambris',       color: 'ec-platane' },
    'Robinier (Acacia)': { delta: 15, usage: 'Poteaux, terrasse, ext.',             color: 'ec-robinier' },
    'Séquoia':           { delta: 15, usage: 'Bardage, mobilier jardin',            color: 'ec-sequoia' },
    'Tilleul':           { delta: 22, usage: 'Sculpture, lutherie, jouets',         color: 'ec-tilleul' },
    'Autre':             { delta: 20, usage: 'Usage à définir',                     color: 'ec-autre' }
  };

  // Épaisseur du trait de scie, en mm (constante métier)
  var TRAIT_SCIE_MM = 3;

  // Rendement géométrique du débit en planches (constante métier, 50 %)
  var RENDEMENT_GEOM = 0.5;

  // Ordre d'affichage des essences : les plus présentes sur le territoire
  // d'abord, puis ordre alphabétique. « Autre » reste en dernier.
  var ESSENCES_ORDRE = [
    'Chêne', 'Chêne rouge', 'Frêne', 'Platane', 'Pin', 'Chêne des marais', 'Cèdre',
    'Aulne', 'Châtaignier', 'Cyprès', 'Douglas', 'Épicéa', 'Hêtre', 'Mélèze',
    'Merisier', 'Noyer', 'Peuplier', 'Robinier (Acacia)', 'Séquoia', 'Tilleul',
    'Autre'
  ];

  // Préfixe des noms de grume par commune (ex. VER-0001).
  // VER, BOU, NAN, ORV, SEB et NM fixés par le porteur de projet ;
  // les autres : 3 lettres, sans article ni « Saint », toutes différentes.
  var PREFIXES_COMMUNES = {
    'Basse-Goulaine': 'BAS', 'Bouaye': 'BOA', 'Bouguenais': 'BOU',
    'Brains': 'BRA', 'Carquefou': 'CAR', 'Couëron': 'COU', 'Indre': 'IND',
    'La Chapelle-sur-Erdre': 'CHA', 'La Montagne': 'MON', 'Le Pellerin': 'PEL',
    'Les Sorinières': 'SOR', 'Mauves-sur-Loire': 'MAU', 'Nantes': 'NAN',
    'Nantes Métropole': 'NM', 'Orvault': 'ORV', 'Rezé': 'REZ',
    'Saint-Aignan-Grandlieu': 'AIG', 'Saint-Herblain': 'HER',
    'Saint-Jean-de-Boiseau': 'JEA', 'Saint-Léger-les-Vignes': 'LEG',
    'Saint-Sébastien-sur-Loire': 'SEB', 'Sainte-Luce-sur-Loire': 'LUC',
    'Sautron': 'SAU', 'Thouaré-sur-Loire': 'THO', 'Tronc Commun': 'TC',
    'Vertou': 'VER'
  };

  // Préfixe d'une commune ; à défaut, ses 3 premières lettres en majuscules.
  function prefixeCommune(nomCommune) {
    if (PREFIXES_COMMUNES[nomCommune]) return PREFIXES_COMMUNES[nomCommune];
    return String(nomCommune || '').normalize('NFD').replace(/[^A-Za-z]/g, '')
      .slice(0, 3).toUpperCase();
  }

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


  // ═══ Campagne de sciage et stock produits (ajouts du 3 nov. 2026) ═══════
  // Ajouts uniquement : aucune fonction figée n'est modifiée.

  // Durée maximale de stockage en grume avant débit, en jours.
  // Source : tableau FIBOIS « De l'Arbre à la Planche » (< 1 mois, < 6 mois,
  // < 1 an). Essence absente du tableau ou non déterminée : 1 mois, par prudence.
  var DUREE_MAX_GRUME_JOURS = {
    'Aulne': 30, 'Cèdre': 182, 'Charme': 30, 'Châtaignier': 365, 'Chêne': 365,
    'Chêne des marais': 30, 'Chêne rouge': 182, 'Douglas': 182, 'Érable': 30,
    'Frêne': 30, 'Hêtre': 30, 'Marronnier': 30, 'Merisier': 182, 'Noyer': 182,
    'Peuplier': 30, 'Pin': 30, 'Platane': 30, 'Robinier (Acacia)': 365,
    'Tilleul': 30
  };
  var DUREE_MAX_GRUME_DEFAUT = 30;

  // Badge orange à partir de 75 % du délai écoulé, rouge au-delà du délai
  var SEUIL_ALERTE_DEBIT = 0.75;

  // Épaisseurs standard d'un débit en plot, en mm
  var EPAISSEURS_PLOT = [27, 41, 54, 65, 80];

  // Séchage à l'air : 1 an par cm de la plus petite cote (décision du porteur).
  // Information seulement : un produit en séchage peut être sorti.
  var SECHAGE_ANS_PAR_CM = 1;

  var JOUR_MS = 86400000;

  function dureeMaxGrume(essence) {
    return DUREE_MAX_GRUME_JOURS[essence] || DUREE_MAX_GRUME_DEFAUT;
  }

  // Longueur (m) et diamètre (cm) d'une grume enregistrée
  function mesuresGrume(grume) {
    var m = (grume && grume.grumes && grume.grumes[0]) || {};
    return { longueur: parseFloat(m.longueur) || 0, diametre: parseFloat(m.diametre) || 0 };
  }

  // Urgence de débit d'une grume, à partir de sa date de saisie.
  // Retourne { niveau: 'ok' | 'alerte' | 'depasse', dateLimite, joursRestants }
  function urgenceDebit(grume, maintenant) {
    var now    = maintenant ? new Date(maintenant) : new Date();
    var jours  = dureeMaxGrume(grume.essence);
    var debut  = new Date(grume.date_iso || grume.created_at || now);
    var limite = new Date(debut.getTime() + jours * JOUR_MS);
    var ratio  = (now - debut) / (jours * JOUR_MS);
    return {
      niveau:        ratio >= 1 ? 'depasse' : (ratio >= SEUIL_ALERTE_DEBIT ? 'alerte' : 'ok'),
      dateLimite:    limite,
      joursRestants: Math.ceil((limite - now) / JOUR_MS),
      ratio:         ratio
    };
  }

  // Estimation d'un débit demandé (approximation pour la feuille de débit).
  // choix = { type: 'plot' | 'avive', epaisseur_mm, largeur_mm (avivé) }
  // Plot   : nombre de planches = diamètre ÷ (épaisseur + trait de scie)
  // Avivé  : volume utile (rendement 50 %) ÷ volume d'une pièce
  // Retourne { quantite, volume } (volume en m³)
  function estimerDebit(grume, choix) {
    var m = mesuresGrume(grume);
    var e = parseFloat(choix && choix.epaisseur_mm) || 0;
    var t = TRAIT_SCIE_MM;
    if (e <= 0 || m.diametre <= 0 || m.longueur <= 0) return { quantite: 0, volume: 0 };
    var vBrut  = Math.PI * Math.pow(m.diametre / 200, 2) * m.longueur;
    var vUtile = vBrut * RENDEMENT_GEOM * (e / (e + t));
    if (choix.type === 'avive') {
      var l = parseFloat(choix.largeur_mm) || 0;
      if (l <= 0) return { quantite: 0, volume: 0 };
      var vPiece = (e / 1000) * (l / 1000) * m.longueur;
      var q = Math.floor(vUtile / vPiece);
      return { quantite: q, volume: q * vPiece };
    }
    return { quantite: Math.floor(m.diametre / ((e + t) / 10)), volume: vUtile };
  }

  // Volume (m³) d'un produit réellement obtenu.
  // produit = { type, epaisseur_mm, largeur_mm, longueur_m, quantite }
  // Avivé : épaisseur × largeur × longueur × quantité.
  // Plot  : largeur des planches variable → volume moyen d'une planche du
  //         plot estimé, × quantité réelle, ramené à la longueur réelle.
  function volumeProduit(produit, grume) {
    var q = parseFloat(produit.quantite) || 0;
    var e = parseFloat(produit.epaisseur_mm) || 0;
    var L = parseFloat(produit.longueur_m) || 0;
    if (q <= 0 || e <= 0 || L <= 0) return 0;
    if (produit.type === 'avive') {
      return q * (e / 1000) * ((parseFloat(produit.largeur_mm) || 0) / 1000) * L;
    }
    var m   = mesuresGrume(grume);
    var est = estimerDebit(grume, { type: 'plot', epaisseur_mm: e });
    if (!est.quantite || m.longueur <= 0) return 0;
    return est.volume / est.quantite * q * (L / m.longueur);
  }

  // Plus petite cote d'un produit, en mm (c'est elle qui fixe le séchage)
  function plusPetiteCote(produit) {
    var e = parseFloat(produit.epaisseur_mm) || 0;
    var l = parseFloat(produit.largeur_mm) || 0;
    return (produit.type === 'avive' && l > 0) ? Math.min(e, l) : e;
  }

  // Date à partir de laquelle un produit est « sec à l'air »
  function dateSecAir(dateSciage, produit) {
    var cm = plusPetiteCote(produit) / 10;
    return new Date(new Date(dateSciage).getTime() + cm * SECHAGE_ANS_PAR_CM * 365.25 * JOUR_MS);
  }

  // Clés des grumes déjà sorties du stock (sciage, grume brute, débit)
  function clesGrumesSorties() {
    var extsData = (typeof extractions !== 'undefined') ? extractions : [];
    var cles = {};
    extsData.forEach(function (ex) {
      (ex.grumes_keys || []).forEach(function (k) { cles[k] = true; });
    });
    return cles;
  }

  // Grumes encore en stock brut (au moins une grume du lot non sortie)
  function getGrumesEnStock() {
    var lotsData = (typeof lots !== 'undefined') ? lots : [];
    var sorties  = clesGrumesSorties();
    return lotsData.filter(function (l) {
      if (!l.grumes || l.grumes.length === 0) return false;
      return l.grumes.some(function (g, gi) { return !sorties[l.id + '_' + gi]; });
    });
  }

  // Stock produits : lignes issues des sciages, moins les sorties de produits.
  // Clé d'un produit = id de l'extraction « sciage » + '_' + position.
  function getStockProduits() {
    var extsData = (typeof extractions !== 'undefined') ? extractions : [];
    var sortis = {};
    extsData.forEach(function (ex) {
      if (ex.type_sortie !== 'produit' || !Array.isArray(ex.produits)) return;
      ex.produits.forEach(function (s) {
        sortis[s.cle] = (sortis[s.cle] || 0) + (parseFloat(s.quantite) || 0);
      });
    });
    var lignes = [];
    extsData.forEach(function (ex) {
      if (ex.type_sortie !== 'sciage' || !Array.isArray(ex.produits)) return;
      ex.produits.forEach(function (p, i) {
        var cle   = ex.id + '_' + i;
        var q     = parseFloat(p.quantite) || 0;
        var reste = q - (sortis[cle] || 0);
        if (reste <= 0) return;
        lignes.push({
          cle:           cle,
          essence:       ex.essence,
          grume_nom:     p.grume_nom || '',
          type:          p.type,
          epaisseur_mm:  p.epaisseur_mm,
          largeur_mm:    p.largeur_mm,
          longueur_m:    p.longueur_m,
          quantite:      q,
          restant:       reste,
          volumeRestant: q > 0 ? (parseFloat(p.volume) || 0) * reste / q : 0,
          dateSciage:    ex.date_iso,
          dateSecAir:    dateSecAir(ex.date_iso, p)
        });
      });
    });
    return lignes;
  }


  // Vérifie une sortie de produits sciés avant envoi.
  // selection = [{ cle, quantite }] ; retourne { ok, erreur }
  function validerSortieProduits(selection) {
    if (!selection || selection.length === 0)
      return { ok: false, erreur: 'Choisissez au moins un produit.' };
    var stock = {};
    getStockProduits().forEach(function (l) { stock[l.cle] = l; });
    var cumul = {};
    for (var i = 0; i < selection.length; i++) {
      var s = selection[i];
      var q = parseFloat(s.quantite);
      if (!(q > 0) || Math.floor(q) !== q)
        return { ok: false, erreur: 'Quantité invalide : nombre entier de pièces attendu.' };
      var l = stock[s.cle];
      if (!l) return { ok: false, erreur: 'Un produit choisi n\'est plus en stock.' };
      cumul[s.cle] = (cumul[s.cle] || 0) + q;
      if (cumul[s.cle] > l.restant)
        return { ok: false, erreur: 'Il ne reste que ' + l.restant + ' pièce(s) de ce produit ('
          + l.essence + ', ' + l.epaisseur_mm + ' mm).' };
    }
    return { ok: true, erreur: '' };
  }

  // ─── API publique ─────────────────────────────────────────────────────────
  return {
    ESSENCES_INFO:   ESSENCES_INFO,
    ESSENCES_ORDRE:  ESSENCES_ORDRE,
    TRAIT_SCIE_MM:   TRAIT_SCIE_MM,
    RENDEMENT_GEOM:  RENDEMENT_GEOM,
    prefixeCommune:  prefixeCommune,
    EPAISSEURS_PLOT:    EPAISSEURS_PLOT,
    SEUIL_ALERTE_DEBIT: SEUIL_ALERTE_DEBIT,
    SECHAGE_ANS_PAR_CM: SECHAGE_ANS_PAR_CM,
    dureeMaxGrume:      dureeMaxGrume,
    mesuresGrume:       mesuresGrume,
    urgenceDebit:       urgenceDebit,
    estimerDebit:       estimerDebit,
    volumeProduit:      volumeProduit,
    plusPetiteCote:     plusPetiteCote,
    dateSecAir:         dateSecAir,
    getGrumesEnStock:   getGrumesEnStock,
    getStockProduits:   getStockProduits,
    validerSortieProduits: validerSortieProduits,
    calculerVolumes: calculerVolumes,
    getStock:        getStock,
    getHistorique:   getHistorique,
    entree:          entree,
    sortie:          sortie,
    validerEntree:   validerEntree,
    validerSortie:   validerSortie
  };

}());
