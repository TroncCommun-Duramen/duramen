# MEMORY.md — Base de connaissance du projet DURAMEN

> Ce fichier est lu au démarrage de chaque session Claude Code.
> Il résume l'état du projet : décisions prises, architecture, points d'attention.
> Le mettre à jour à chaque fin de session importante.

---

## Session 2 juillet 2026 (soir) — A6, A10 et brouillon fusionnés dans main ✅

Trois branches testées en local, validées par le porteur sur téléphone, puis fusionnées le soir même (branches supprimées) :

1. **A10 — nettoyage du code mort** (merge a34ab42) : ancien formulaire 3 étapes, panneau Territoire, 16 fonctions orphelines d'`app.js` et blocs `ui.css` associés supprimés (~1 440 lignes). ⚠️ `supprimerLot` faisait partie du code mort : l'interface n'offre plus aucune suppression de lot (A8 à repenser).
2. **Brouillon de saisie** (merge a01778b) : restauration silencieuse du brouillon — plus de boîte « Reprendre ? » qui effaçait le brouillon sur Annuler.
3. **A6 — grumes extraites** (merge 398c29a) : colonne `extractions.grumes_keys` créée dans Supabase (clé = `lotId_positionGrume`), grumes déjà extraites masquées de la sélection (mobile + bureau), bloc « Bilan du stock » à une date choisie dans l'onglet Stock.

- Cache SW : `duramen-v35` → `duramen-v38` (une version par branche).
- Mise en ligne : le déploiement GitHub Pages du commit de fusion a échoué (incident passager côté GitHub). Relancé par un commit vide (a3d392c) — site vérifié en v38 le 2 juillet au soir.

---

## Session 2 juillet 2026 (après-midi) — Audit A2 : RLS Supabase — TERMINÉ ✅ (constat)

### Périmètre
Vérification de l'état réel du Row Level Security sur les tables `lots`, `extractions`, `codes_acces` (+ `feedbacks` découverte). Session de **constat uniquement** — aucune modification de la base ni du code. Test effectué avec la clé anon publique contre l'API REST.

### Ce qui a été vérifié
RLS **activé sur les 4 tables** (bouton « Disable RLS » affiché = actif). Texte des règles lu via `select … from pg_policies`. Résultats confirmés par requêtes réelles avec la clé anon :

| Table | Règle lecture (`qual`) | Verdict |
|-------|------------------------|---------|
| `codes_acces` | `SELECT` : `actif = true` | 🔴 **FUITE** — la clé anon lit TOUS les codes de TOUTES les communes (testé : NANTES-A8CD, BOUAYE-K3FP, CARQUEFOU-L9DW… renvoyés en une requête). Le code EST le mot de passe. |
| `extractions` | `SELECT` : `commune_code = get_commune_code()` ; INSERT/DELETE idem + `<> ''` | 🟢 OK — test sans code → `[]`. Isolation réelle côté serveur. |
| `lots` | `SELECT` : `commune_code = get_commune_code() OR partage = true` ; INSERT/DELETE : commune propre | 🟢 OK — seuls les lots `partage = true` remontent (feature « vue communauté » voulue). |
| `feedbacks` | INSERT seul (`with_check` sur commune) | ⚪ Hors périmètre projet — pas de lecture publique, sans risque. Table non documentée à l'origine. |

### Conclusion
Le RLS est **globalement sain** : l'isolation `lots`/`extractions` repose bien sur la fonction serveur `get_commune_code()` (lit l'en-tête `x-commune-code`), pas seulement sur le filtre client. **Le seul trou réel est `codes_acces`** — mais c'est le plus sensible.

### Correctif à prévoir (SESSION DÉDIÉE, pas encore fait) 🔴
Ne PAS fermer la lecture de `codes_acces` sans adaptation : la connexion (`app.js` ~L1263) lit cette table pour vérifier le code saisi. Solution propre : créer une **fonction RPC sécurisée** (SECURITY DEFINER) qui prend un code et renvoie seulement `{valide, commune}`, puis passer la policy `codes_acces_select` à `false` (lecture directe interdite). Modification coordonnée **Supabase + `app.js`** → session Feature dédiée.

### Security Advisor — état au 2 juil. 2026
- **0 erreur, 0 info.** ⚠️ Rappel : « 0 erreur » ne détecte PAS la fuite `codes_acces` — le linter vérifie que RLS est actif + qu'une policy existe, pas si son contenu est sûr. Toujours tester une policy avec la clé anon.
- **1 warning** 🟠 : `Function Search Path Mutable` sur `public.get_commune_code` — c'est LA fonction qui porte l'isolation `lots`/`extractions`. `search_path` non figé = durcissement recommandé (risque réel faible ici, la fonction ne lit qu'un en-tête). Correctif 1 ligne côté Supabase : `ALTER FUNCTION public.get_commune_code() SET search_path = '';` (à valider/adapter selon corps de la fonction).

---

## Session 11 mai 2026 — Audit de sécurité et de précision — TERMINÉ ✅

### Périmètre
Audit complet des deux interfaces (mobile `app.js` + bureau `bureau/app.js`) et du noyau `core.js`. Backlog entièrement vidé. Application propre à l'issue de la session.

### Corrections appliquées

| Ref | Fichier | Correction |
|-----|---------|-----------|
| R1 | `app.js`, `index.html` | `vol_utile = vol_brut` décision métier assumée — labels corrigés en `m³ bruts` |
| R2 | `bureau/app.js` | Formule volume corrigée : `V × rendement × (e / (e + t))` |
| R3 | `bureau/index.html` | Overlays morts supprimés (`b-grumes-overlay`, `b-dest-overlay`) |
| R4 | `app.js` | `afficherTerritoire()` réécrite avec `textContent` / `createTextNode` |
| R5 / S1 | `core.js` | `getStock()` : guard `typeof` + `extsData.forEach` (plus `extractions.forEach`) |
| R7 | `app.js` | `DuramenCore.sortie()` fantôme supprimé de `soumettreSortie()` |
| R9 | `bureau/app.js` | Linéaire corrigé : `util × 5000 / ep` (formule dimensionnellement correcte) |
| R10 | `bureau/app.js` | Précision volumes harmonisée à `.toFixed(3)` partout |
| R11 | `app.js` + `ui.css` | Barres de stock : `--barre-pct` via `setProperty()` + `var()` en CSS |
| S2 | `sw.js` | Cache incrémenté `duramen-v29` → `duramen-v30` |
| S3 | `app.js` | 4 volumes restants harmonisés à `.toFixed(3)` |
| S4 | `bureau/app.js` | Tableau métropole, chips essence, entêtes lot — données Supabase via DOM pur |
| S5 | `bureau/app.js` + `bureau/ui.css` | Styles inline supprimés → classes `.b-donut-vide` (12px) et `.b-chips-vide` (13px) |
| S6 | `bureau/app.js` | Légende donut commune (`ess`) via `textContent` |
| S7 | `bureau/app.js` | Légende donut métropole (`seg.nom`) via `textContent` |
| S8 | `bureau/app.js` | Lignes grume (`bLabelGrume`, `bMetriquesGrume`) via DOM pur |
| D1 | `bureau/app.js` | `bAfficherEssences()` supprimée — code mort jamais appelé |
| D2 | `bureau/ui.css` | Règles CSS orphelines `.b-grumes-overlay` et `.b-dest-overlay` supprimées |

### État post-audit
- **Zéro vecteur XSS distant** : toutes les données Supabase passent par `textContent` ou `createTextNode`
- **Zéro style inline** dans `bureau/app.js`
- **Zéro code mort** dans `bureau/app.js`
- **Zéro règle CSS orpheline** dans `bureau/ui.css`
- **Formules métier correctes** : volume, linéaire, rendement
- **Cache SW à jour** : `duramen-v30`

### `innerHTML` restants — tous inoffensifs
Seuls subsistent des vidages (`= ''`), des chaînes statiques, et des nombres calculés. Aucune donnée Supabase.

---

## Session 10 mai 2026 — Audit Phase 1 + Phase 2

### Phase 1 — Corrections critiques ✅
- `var(--lin)` inexistante en CSS → remplacée par `.footer-link { color: var(--cendre) }` dans `ui.css`
- RLS Supabase inactif → SQL complet généré + 3 itérations (FORCE ROW LEVEL SECURITY, plpgsql VOLATILE, DROP ALL existantes)
- `afficherHistoriqueCommunaute()` retournait tous les lots sans filtre → `partage=eq.true&order=created_at.desc` ajouté
- Header RLS → `sbH['x-commune-code']` alimenté au login dans `app.js` et `bureau/app.js`
- Cache passé de **duramen-v27** à **duramen-v28**

### Phase 2 — Nettoyage code mort ✅
- Système d'extraction mort supprimé : `panel-extraction`, `modal-extraction` (index.html) + 8 fonctions JS dans app.js (`ouvrirModalExtraction`, `ouvrirModalExtractionEssence`, `fermerModalExtraction`, `majDisponible`, event listener `ext-essence`, `enregistrerExtraction`, `afficherExtractions`, `supprimerExtraction`) + branche morte dans `switchTab`
- Double-appel corrigé dans `demarrerRafraichissement()` : le `setInterval` ne fait plus qu'appeler `chargerDonnees()` — les appels redondants `afficherExtraction`/`afficherExtractions` supprimés (déjà couverts par `chargerDonnees`)
- `#hs-essences` reconstruit dans `ouvrirApp()` : le strong element est maintenant créé dynamiquement comme `hs-vol` et `hs-lots` → `mettreAJourHeaderStats()` peut le mettre à jour correctement
- Fonctions mortes supprimées : `nouvMajVol`, `badgeClass`, `exporterCSV`, `exporterStockCSV`
- `vol_brut` → `vol_utile` dans `bureau/app.js` lignes 148, 159, 379, 427 (totaux métropole et donut)
- Cache incrémenté `duramen-v28` → `duramen-v29`

---

## Session 10 mai 2026 — Refonte onglet Export (bureau)

### Onglet Export bureau — `bureau/app.js` + `bureau/index.html` + `bureau/ui.css` ✅
- Bouton "Tout exporter" supprimé — un seul bouton "Exporter la sélection"
- Colonnes CSV réordonnées : Commune · Nom du lot · Essence · Date · Provenance · Cause · Nb grumes · Vol. brut m³ · Partage avec NM
- Nb grumes et Vol. brut m³ exportés comme **nombres** (sans guillemets, virgule décimale pour Excel FR)
- Ligne TOTAL ajoutée en bas du CSV avec somme du volume brut
- Colonnes PÉRIMÈTRE et FILTRES BOIS centrées (`max-width: 720px; margin: 0 auto`)
- Bouton export : largeur automatique sur le texte (plus de `1fr 1fr` pleine largeur)
- Commit : `feat(bureau): refonte onglet export — colonnes CSV, total, mise en page`

### Point d'attention — Harmonisation mobile / bureau 🔴 Session dédiée requise
- Les deux versions ne partagent pas le même format de données à l'affichage et à l'export :
  - Mobile : `toFixed(3)`, colonnes vol_brut **et** vol_utile, valeurs entre guillemets (texte)
  - Bureau : `toFixed(2)`, colonne vol_brut uniquement, valeurs numériques
  - Le TOTAL CSV bureau additionne les floats bruts → décalage avec SUM Excel (accumulation d'arrondis)
- **Ne pas traiter dans une session export ou feature.** Ouvrir une session dédiée : "Harmonisation données mobile/bureau".

---

## Sessions mai 2026 — Version bureau (desktop)

### Architecture bureau — dossier `bureau/` ✅
- Fichiers dédiés : `bureau/index.html` · `bureau/app.js` · `bureau/ui.css`
- Partage `core.js` et `theme.css` de la racine (pas de copie)
- Layout 2 colonnes : colonne principale (onglets) + colonne extraction latérale fixe
- Responsive : colonne extraction masquée sous 900 px

### Onglets bureau ✅
- **Commune** : camembert essences (SVG), table des lots avec dimensions grumes, total m³, barres par essence
- **Nantes Métropole** : table lots partagés par commune, donut par commune, métriques globales
- **Export** : filtres source/essence/année + export CSV (voir session 10 mai)
- **Ticket retour** : identique au mobile

### Hero stats (4 tuiles) ✅
- Stock commune · Lots actifs · Extractions mois · Stock métropole
- **Attention** : Stock commune = `DuramenCore.getStock()` → `dispo` (vol_utile - extractions). Stock métropole = somme `vol_utile` (harmonisé le 10 mai 2026).

### Colonne extraction latérale ✅
- Popup 3 étapes : essence + type → sélection grumes cochables → destination
- Affichage des grumes disponibles avec dimensions (L, Ø)
- Pills de stock par essence

### Design bureau ✅
- Logo PNG `icon-512.png` en en-tête
- Bandeau onglets fond `var(--indigo)`, onglet actif souligné blanc
- Toggle Commune/Métropole en indigo, lignes alternées dans les tables
- Boutons filtres inactifs supprimés

---

## Session 2 mai 2026 — Correction mode hors ligne (zone blanche)

### Bug corrigé — Application inouvrable sans réseau (sw.js) ✅
- `theme.css`, `core.js` et `app.js` étaient absents de la liste `FICHIERS` dans `sw.js`. L'app chargeait `index.html` depuis le cache mais pas ses dépendances → page blanche ou erreur JS.
- Stratégie de fetch corrigée : passage de "réseau d'abord" à **"cache d'abord"** (`caches.match` avant `fetch`). Avant : l'app attendait une connexion inexistante avant de regarder le cache.
- Cache passé de **duramen-v19** à **duramen-v20**.
- Commit : `fix(sw): corriger le mode hors ligne en zone blanche`
- **Condition de déclenchement du fix** : chaque appareil doit ouvrir l'app une fois avec du réseau pour télécharger le cache v20.

---

## État du projet

- **Phase 0 ✅ entièrement terminée** — architecture 5 fichiers en place :
  `index.html` (HTML pur) · `theme.css` · `ui.css` · `core.js` · `app.js`
- Phase 0a ✅ : theme.css, ui.css extraits, styles inline supprimés
- Phase 0b ✅ : core.js (DuramenCore), app.js créés — index.html = HTML pur 555 lignes
- Phase 0c ✅ : accents ESSENCES_INFO, UUIDs, brouillon auto-sauvegardé, cache offline
- **Phase 1 — En cours** : interfaces mobiles finalisées, prêt pour premier test terrain

---

## Session 28 avril 2026 — Corrections et nouvelle feature saisie

### Bug corrigé — Linéaire indicatif (app.js) ✅
- Le linéaire indicatif ne se réinitialisait pas à `'—'` quand on repassait en mode "Grume brute" après avoir utilisé "Débit en planches".
- Corrigé dans `majDebitExtraction()` : ajout d'un `else` qui remet `linEl.textContent = '—'` quand `extDebitActif === false`.
- Commit : `fix(extraction): réinitialiser le linéaire indicatif en mode Grume brute`

### Nouvelle feature — Choix de méthode de mesure dans le panneau "Nouvelle grume" (app.js + ui.css) ✅
- Toggle 2 boutons côte à côte : **Ø Diamètre médian** (défaut) / **C Circonférence médiane**
- Méthode mémorisée dans localStorage, clé `duramen_mesure_methode`
- Formules : `V = π × (d/2)² × L` (diamètre) — `V = (C² × L) / (4π)` (circonférence, C en mètres)
- Plage circonférence : 63→220 cm (équivalent 20→70 cm de diamètre), pas 1 cm — via `CIRC_VALS`
- Stockage interne toujours en diamètre cm : conversion `d = Math.round(C / π)` à l'enregistrement
- Styles ajoutés dans `ui.css` : `.grume-methode-toggle`, `.grume-methode-btn`, `.grume-methode-btn.active`
- Commit : `feat(saisie): ajouter le choix de méthode diamètre / circonférence dans le panneau Nouvelle grume`

---

## Session 26 avril 2026 — Audit de conformité

### Audit complet des 3 fichiers principaux (index.html, app.js, core.js)

Objectif : vérifier la conformité au cahier des charges avant première présentation terrain.

### Résultats par fichier

**index.html — 555 lignes ✅ globalement sain**

- Architecture respectée : HTML pur, zéro logique JS, zéro règle CSS inline
- Fichiers appelés dans le bon ordre : `core.js` → `app.js`
- Service Worker enregistré au bon endroit (avant `</script>`)
- Authentification : aucun code d'accès dans le HTML ✅

Problèmes identifiés :
- **Bug ✅ corrigé** : double `id="lot-nom"` — résolu (vérifié le 26 avril 2026 : une seule occurrence en ligne 178).
- **Entorse mineure** : un `style="color:var(--lin);text-decoration:none;letter-spacing:0.08em"` subsiste dans le footer (ligne 543). À déplacer en classe `.footer-link` dans `ui.css` lors d'une prochaine session Design.

**app.js — 2164 lignes ✅ robuste sur le noyau**

- `crypto.randomUUID()` utilisé partout ✅
- Cache offline écrit après chaque succès Supabase ✅
- `DuramenCore.validerSortie()` appelé avant chaque extraction ✅
- Éléments DOM construits avec `cel()` dans les fonctions récentes ✅

Problèmes identifiés :
- **Coexistence de deux formulaires de saisie** : ancien (étapes 1→2→3, `sauvegarderLot`) et nouveau (mobile, `nouvConfirmer`). Les deux écrivent dans `lots[]` et Supabase. Fonctionnel — mais toute modification d'un formulaire doit vérifier l'autre. Ne jamais corriger l'un sans lire l'autre.
- **Deux systèmes de brouillon** : `duramen_draft` (ancien) et `duramen_draft_v2` (nouveau). `effacerBrouillonSaisie()` nettoie les deux correctement. Risque faible de confusion si un agent alterne les deux formulaires.
- **Concaténation HTML résiduelle** : les fonctions de l'ancien formulaire (`afficherGrumes`, `afficherExtractions`, `afficherTerritoire`, `calculerDebit`) construisent encore du HTML par concaténation de chaînes. Contraire aux règles du CDC. Fonctionnel aujourd'hui — à migrer vers `cel()` en Phase 2.

**core.js — 161 lignes ✅ propre et conforme**

- Signatures figées intactes ✅
- Module IIFE : aucune fuite dans l'espace global ✅
- Clés ESSENCES_INFO avec accents ✅
- `TRAIT_SCIE_MM` constante nommée ✅
- `validerSortie` bloque toute extraction supérieure au disponible ✅

---

## Choix assumés — à ne pas confondre avec des bugs

| Choix | Description | Impact |
|-------|-------------|--------|
| `vol_utile = vol_brut` dans le nouveau formulaire mobile | Quand un lot est saisi sans calcul de débit (formulaire mobile), `vol_utile` est égal à `vol_brut`. `getStock()` utilise `vol_utile` → le stock affiché est le volume brut, pas le volume débité. | Les chiffres de stock sont légèrement surestimés pour les lots sans débit. Acceptable en phase de test. À afficher clairement dans l'interface en Phase 2 (ex: "volume brut — débit non calculé"). |
| Double formulaire de saisie | L'ancien formulaire (3 étapes, desktop) et le nouveau (mobile, drums) coexistent. | ~~Intentionnel — transition progressive.~~ **Clos le 2 juillet 2026** : l'ancien formulaire a été supprimé (A10). Seul le formulaire mobile subsiste. |

---

## Points d'attention pour les prochaines sessions

| Priorité | Action | Fichier | Complexité |
|----------|--------|---------|------------|
| ✅ Résolu | ~~Corriger le double `id="lot-nom"`~~ — corrigé 26 avril 2026 | `index.html` | — |
| ✅ Résolu | ~~Linéaire indicatif non réinitialisé~~ — corrigé 28 avril 2026 | `app.js` | — |
| ✅ Résolu | ~~Audit sécurité/précision R1-R11, S1-S5, D1-D2~~ — terminé 11 mai 2026 | tous | — |
| 🟡 Phase 2 | Migrer concaténations HTML → `cel()` dans l'ancien formulaire mobile | `app.js` | Session dédiée |
| 🟡 Phase 2 | Afficher "volume brut — débit non calculé" pour les lots sans épaisseur | `app.js` + `ui.css` | Session dédiée |
| ✅ Résolu | ~~Vérifier RLS Supabase sur toutes les tables~~ — audité et corrigé le 2 juillet 2026 (fuite `codes_acces` bouchée, reste A12) | Supabase dashboard | — |

---

## Session 25 avril 2026 — Interfaces écrans métier

### Navigation — 4 onglets (app.js + index.html) ✅
- Onglets bottom nav : **Accueil · Nouveau · Stock · Extraction**
- Panel IDs stables : `panel-accueil`, `panel-saisie` (Nouveau), `panel-historique` (Stock), `panel-stock` (Extraction)
- `switchTab(panel, btn)` gère le routing et déclenche `afficherExtraction()`, `afficherExtractions()`, `afficherHistorique()`, `afficherTerritoire()` selon l'onglet

### Écran Nouveau — panel-saisie (app.js + ui.css) ✅
- Formulaire saisie grumes : essence (select), provenance, cause d'abattage
- `+ Ajouter une grume` ouvre un bottom sheet (drums longueur/diamètre + quantité)
- Chaque grume enregistrée apparaît en carte résumé avec badge ✓ vert (`--vert: #788d5d`)
- Modale "Nommer le lot" à la validation : nom libre + toggle partage communes
- Sauvegarde via `DuramenCore.entree()` + `sbInsert('lots', ...)`
- État : `nouvGrumes[]`, brouillon auto-sauvegardé clé `duramen_draft_v2`

### Écran Stock — panel-historique (app.js + ui.css) ✅
- Anciennement "Historique" — toggle **Ma commune / Nantes Métropole**
- Bloc total : fond `var(--sumi)`, volume m³ + nombre de lots
- Liste par essence : barres proportionnelles `var(--indigo)` sur piste `var(--brume)`
- 5 lots récents max, cartes `var(--neige)`, badges commune/essence/cause
- Export Excel (CSV UTF-8 BOM) et PDF (`window.print()`)

### Écran Extraction — panel-stock (app.js + ui.css) ✅
- Sélection grumes par essence via chips filtres + bottom sheet (grumes cochables par lot)
- Bascule **Grume brute / Débit en planches** (2 boutons côte à côte, grid 2 colonnes)
  - Grume brute (défaut) : barre synthèse 1 bloc — m³ brut fond `var(--sumi)`
  - Débit en planches : sliders épaisseur 20–50 mm (défaut 27), trait de scie 2–4 mm (défaut 3), rendement 30–70 % (défaut 50 %)
  - Barre synthèse 3 blocs : m³ extrait (sumi) · m³ utile (vert) · m³ déchet (orange)
  - Linéaire indicatif : `V_utile ÷ (e/1000 × 0.20)` en mètres, aligné droite, fond indigo
- Modale destination à la validation : nom projet (optionnel), commune d'installation, usage Intérieur/Extérieur, lieu (optionnel)
- Confirmation : `DuramenCore.sortie()` + `sbInsert('extractions', ...)` + toast + retour accueil
- État : `extGrumesSel[]`, `extDraft{}`, `extDebitActif` (bool), `extCommunes[]`

---

## Session 24 avril 2026 — Interfaces mobiles

### Fichier principal
- Renommé `duramen.html` → `index.html` (obligatoire pour PWA + GitHub Pages)

### Écran connexion (index.html + ui.css) ✅
- Logo `icon-512.png` centré, classe `.login-logo-img`
- Titre DURAMEN — Outfit 200, letterspacing 0.2em, uppercase
- Sous-titre "Gestion du bois d'œuvre"
- Champ CODE : fond `var(--indigo)`, texte blanc, `autocapitalize="characters"`
- Bouton ACCÉDER : 56px minimum, fond `var(--sumi)`, texte blanc

### Écran accueil mobile (index.html + ui.css) ✅
- Panel `#panel-accueil`, affiché sur mobile uniquement (`@media (min-width: 601px) { display: none !important }`)
- Badge commune : classe `.home-commune-badge`, fond indigo, texte blanc
- Stock total : `#accueil-stock-val` en gros chiffre + `.home-stock-unit` "m³ disponibles"
- 3 boutons `.btn-home` : `width: calc(100% - 32px)`, `border-radius: 12px`, hauteur min 56px

### Service Worker
- Cache actuel : **duramen-v38** (2 juillet 2026)

---

## Supabase — Tables et structure

**Table `lots`**
- `id` — UUID (migré depuis bigint le 19 avril 2026)
- `commune_code` — code d'accès de la commune
- `nom` — nom du lot
- `essence` — essence de l'arbre
- `commune` — nom de la commune
- `cause` — cause d'abattage
- `provenance` — origine (alignement, bosquet…)
- `annee` — année de coupe
- `usage` — usage prévu
- `vol_brut`, `vol_utile`, `vol_dechets` — volumes en m³
- `nb_grumes`, `nb_planches` — comptages
- `lineaire` — linéaire en mètres
- `epaisseur`, `delta` — paramètres de débit
- `grumes` — tableau JSON des grumes individuelles
- `partage` — booléen (visible aux autres communes ?)
- `created_at` — date de création

**Table `extractions`**
- `id` — UUID (migré depuis bigint le 19 avril 2026)
- `commune_code` — code d'accès de la commune
- `essence` — essence extraite
- `volume` — volume en m³
- `usage` — usage de destination
- `destination` — destinataire
- `commune`, `contact`, `notes` — infos complémentaires
- `cause_abattage` — cause d'abattage (écrit par `confirmerExtractionDest()`)
- `type_sortie`, `vol_brut_extrait`, `type_valorisation`, `lineaire`, `projet`, `commune_installation` — colonnes créées le 2 juillet 2026 (le code les envoyait déjà, l'enregistrement échouait en HTTP 400)
- `grumes_keys` — JSON des clés de grumes extraites (`lotId_positionGrume`), créée le 2 juillet 2026 (A6)
- `date`, `date_iso` — date de l'extraction

**Table `feedbacks`**
- `id` — UUID
- `commune_code` — code de la commune émettrice
- `commune` — nom de la commune
- `type` — type de retour (`usage-design`, `amelioration`, `bug`, `message-libre`)
- `message` — texte libre du retour

**Table `codes_acces`**
- `code` — code d'accès commune
- `commune` — nom de la commune
- `actif` — booléen

---

## Signatures figées de core.js

Ces fonctions ne changent jamais de nom ni de comportement :

```javascript
DuramenCore.entree(lot)           // Ajouter du stock
DuramenCore.sortie(extraction)    // Retirer du stock
DuramenCore.getStock()            // Stock disponible par essence
DuramenCore.getHistorique()       // Log immuable
DuramenCore.validerEntree(lot)    // Retourne {ok, erreur}
DuramenCore.validerSortie(ext)    // Retourne {ok, erreur}
```

---

## Architecture en place

```
index.html     ← HTML pur, zéro JS inline — ✅
theme.css      ← variables de design (couleurs, typo) — ✅
ui.css         ← composants visuels (.card, .btn…) — ✅
core.js        ← noyau métier : DuramenCore (signatures figées) — ✅
app.js         ← logique UI, navigation, Supabase — ✅
sw.js          ← Service Worker (offline, cache duramen-v38) — ✅
```

---

## Décisions d'architecture

| Décision | Raison | Date |
|----------|--------|------|
| HTML/CSS/JS vanilla, pas de framework | Transmissible à n'importe quel informaticien | Démarrage |
| Noyau `core.js` avec signatures figées | Protéger la logique entrée→stock→sortie | Démarrage |
| Séparation `theme.css` / `ui.css` | Permettre au graphiste de travailler sans risque | Démarrage |
| Supabase comme backend | Déjà en place et fonctionnel | Démarrage |
| `vol_utile = vol_brut` pour les lots sans débit | Nouveau formulaire mobile : pas de calcul de débit | Avril 2026 |

---

## Sécurité — Points d'attention avant mise en production

- Clé `SUPABASE_ANON_KEY` visible dans `app.js` (ligne 6). Clé anon publique par conception — normal pour une PWA. Vérifier que les règles **RLS (Row Level Security)** sont activées sur toutes les tables pour limiter la lecture aux seules communes authentifiées.

---

## Évolutions prévues (non planifiées)

- États du bois : brut / débité avec temps de séchage
- Vue cartographique des lots
- Notifications bois arrivant à maturité
- Queue de retry pour les opérations hors ligne
- Affichage "volume brut — débit non calculé" pour les lots sans épaisseur

---

## Session Avril 2026 — Dossier financeur

### Documents produits

| Fichier | Description | Statut |
|---|---|---|
| `DURAMEN_presentation_v3.docx` | Note de présentation ADEME — version finale retravaillée | ✅ |
| `budget_duramen.xlsx` | Budget prévisionnel modulable (jours + taux) | ✅ à compléter |
| `DURAMEN_budget.md` | Version lisible du budget pour Obsidian | ✅ |
| `DURAMEN_taches.md` | Suivi global du projet avec cases à cocher | ✅ |
| `DURAMEN_postes.md` | Détail des tâches par poste de réalisation | ✅ |
| [[REDACTION]] | Règles rédactionnelles avec exemples | ✅ → `Docs/` |

### Budget — état au 22 avril 2026

| | Jours | Montant |
|---|---|---|
| Travail TC (500 €/j) | 47 j | 23 500 € |
| Illustrateur (400 €/j) | 10 j | 4 000 € |
| Frais annexes (2 ans) | — | 3 600 € |
| **Total** | | **31 100 €** |

### Règles rédactionnelles — section 14 de CLAUDE.md

1. Phrases courtes, sans surcharge
2. Ton simple et agréable
3. Construire par le positif — négatif après le positif si nécessaire
4. Pas de jugement direct

**Rappel** : tout changement dans `CLAUDE.md` section 14 doit être répercuté dans [[REDACTION]], et inversement.

---

## Session 2 juillet 2026 — Audit profond de l'application

### Diagnostic complet (core.js, app.js, index.html, sw.js)

11 points relevés, classés par gravité. Corrigés dans cette session (commit `203ba35`, cache SW `v33`) :

- **A1 (critique)** — Le rafraîchissement auto (2 min) reconstruisait l'écran Extraction et effaçait la sélection de grumes en cours. Ajout de `extractionEnCours()` dans `app.js` : la reconstruction est sautée si une sélection, un filtre essence ou une modale est active.
- **A3 (critique)** — Fonctions mortes `chargerCommunesExtraction` / `remplirCommunesSel` supprimées : elles téléchargeaient `code + commune` de toute la table `codes_acces` (le code EST le mot de passe). Jamais appelées, mais dangereuses si rebranchées un jour.

Constaté lors du push : le coffre Obsidian local était **en retard de 5 commits** sur GitHub (session du 24 juin faite ailleurs, qui avait déjà corrigé les totaux de la vue Communauté — point A4). Rebase + résolution du conflit `sw.js` (v32 distant, v31 local → v33).

### Points restants (détail dans [[TASKS]] — Prochaines tâches)

Le plus urgent est **A2 — RLS Supabase** : l'isolation des données entre communes repose uniquement sur le filtre `commune_code=eq.X` ajouté côté client. Si Row Level Security n'est pas activé sur les tables `lots`, `extractions` et `codes_acces`, toute commune connectée peut lire les lots privés des autres. Se corrige dans le tableau de bord Supabase, pas dans le code.

### Décisions de session

- Les corrections d'audit se font **point par point, une session par sujet** (règle « un bug = une session »).
- **Toujours `git pull` en début de session** — le coffre local peut être en retard sur GitHub.

---

## Voir aussi

- [[TASKS]] — suivi séquentiel des tâches, source de vérité
- [[LESSONS]] — règles permanentes issues des bugs
- [[CHANGELOG]] — historique détaillé des modifications
- [[EVOLUTIONS]] — idées et pistes pour les prochaines versions
- [[CLAUDE_QUICK]] — sections essentielles de CLAUDE.md à lire au démarrage
- [[DESIGN_SYSTEM]] — référence visuelle complète
- [[Journal/JOURNAL_SESSION_06]] — dernière session documentée
