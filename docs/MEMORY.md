# MEMORY.md — Base de connaissance du projet DURAMEN

> Ce fichier est lu au démarrage de chaque session Claude Code.
> Il résume l'état du projet : décisions prises, architecture, points d'attention.
> Le mettre à jour à chaque fin de session importante.

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
| Double formulaire de saisie | L'ancien formulaire (3 étapes, desktop) et le nouveau (mobile, drums) coexistent. | Intentionnel — transition progressive. Les deux écrivent dans la même table Supabase. |

---

## Points d'attention pour les prochaines sessions

| Priorité | Action | Fichier | Complexité |
|----------|--------|---------|------------|
| ✅ Résolu | ~~Corriger le double `id="lot-nom"`~~ — déjà corrigé | `index.html` | — |
| ✅ Résolu | ~~Linéaire indicatif non réinitialisé en mode Grume brute~~ — corrigé le 28 avril 2026 | `app.js` | — |
| 🟡 Phase 2 | Migrer concaténations HTML → `cel()` | `app.js` | Session dédiée |
| 🟡 Phase 2 | Afficher "volume brut" quand pas de débit | `app.js` + `ui.css` | Session dédiée |
| 🟡 Phase 2 | Déplacer style inline footer en classe CSS | `index.html` + `ui.css` | 5 min |
| 🟠 Avant production | Vérifier RLS Supabase sur toutes les tables | Supabase dashboard | Hors code |

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
- Cache actuel : **duramen-v12**

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
- `date`, `date_iso` — date de l'extraction

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
index.html     ← HTML pur (555 lignes), zéro JS inline — ✅
theme.css      ← variables de design (couleurs, typo) — ✅
ui.css         ← composants visuels (.card, .btn…) — ✅
core.js        ← noyau métier : DuramenCore (161 lignes, signatures figées) — ✅
app.js         ← logique UI, navigation, Supabase (2164 lignes) — ✅
sw.js          ← Service Worker (offline, cache duramen-v12) — ✅
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
| `REDACTION.md` | Règles rédactionnelles avec exemples | ✅ → `Docs/` |

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

**Rappel** : tout changement dans `CLAUDE.md` section 14 doit être répercuté dans `Docs/REDACTION.md`, et inversement.
