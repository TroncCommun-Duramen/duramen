# MEMORY.md — Base de connaissance du projet DURAMEN

> Ce fichier est lu au démarrage de chaque session Claude Code.
> Il résume l'état du projet : décisions prises, architecture, points d'attention.
> Le mettre à jour à chaque fin de session importante.

---

## État du projet

- **Phase 0 ✅ entièrement terminée** — architecture 5 fichiers en place :
  `duramen.html` (HTML pur) · `theme.css` · `ui.css` · `core.js` · `app.js`
- Phase 0a ✅ : theme.css, ui.css extraits, styles inline supprimés
- Phase 0b ✅ : core.js (DuramenCore), app.js créés — duramen.html = HTML pur 546 lignes
- Phase 0c ✅ : accents ESSENCES_INFO, UUIDs, brouillon auto-sauvegardé, cache offline

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
- Indicateur réseau : `#accueil-online-dot` — classes `.online` / `.offline` gérées par `app.js`
- Stock total : `#accueil-stock-val` en gros chiffre + `.home-stock-unit` "m³ disponibles"
- 3 boutons `.btn-home` : inset `width: calc(100% - 32px)`, `border-radius: 12px`, hauteur min 56px
  - `.btn-home-primary` (Ajouter au stock) : fond `var(--sumi)`
  - `.btn-home-secondary` (Voir le stock / Extraire du stock) : fond blanc, bordure

### Navigation mobile (app.js) ✅
- Après connexion : routing automatique vers `#panel-accueil` si `window.innerWidth <= 600`
- Les 3 boutons appellent `switchTab()` — met à jour la bottom nav simultanément
- `mettreAJourAccueil()` : remplit commune, stock total, statut réseau
- `mettreAJourStatutReseau()` : écoute `online` / `offline`

### Mobile — masquage (ui.css, max-width: 600px) ✅
- `header { display: none }` — header desktop masqué
- `footer { display: none }` — footer masqué
- `.header-stats-mobile { display: none !important }` — supprimé du HTML également
- `.tabs-wrap { display: none }` — onglets desktop masqués
- `.bottom-nav { display: block }` — navigation bas activée

### Refactor styles inline — app.js + ui.css ✅
- Groupes A+B+C traités : suppression de tous les `style.cssText` et propriétés visuelles inline
- 4 classes créées dans `ui.css` : `.toast-erreur`, `.btn-deconnexion`, `input.commune-locked`, `#header-stats .commune-chip`
- `#panel-mentions` : padding corrigé à `32px 20px` (bottom nav masquée lors des mentions, 80px inutile)
- Commit : `6f50dc3`
- Reste ouvert : **Groupe D** — 20 occurrences `style.display` (show/hide pur) — session dédiée app.js + ui.css

### Boutons accueil — refonte (index.html + ui.css) ✅
- Indicateur réseau `#accueil-online-dot` / `.accueil-network` supprimé du HTML et du CSS
- 3 boutons `.btn-home` restructurés : icône SVG carrée arrondie + bloc texte (label + sous-titre) + flèche `›`
  - Bouton 1 (primary) : icône `+` / "Ajouter au stock" / "Saisir un nouveau lot"
  - Bouton 2 (secondary) : icône barres / "Voir le stock" / "Par essence, en temps réel"
  - Bouton 3 (secondary) : icône flèche-sortie / "Extraire du stock" / "Sortie, usage, destination"
- Nouvelles classes CSS dans `ui.css` : `.btn-home-icon-box`, `.btn-home-icon-svg`, `.btn-home-text`, `.btn-home-label`, `.btn-home-sub`, `.btn-home-arrow`
- Zéro style inline — tout dans `ui.css`

### Service Worker
- Cache actuel : **duramen-v7**
- Dernier commit : à venir

**Migration Supabase — 19 avril 2026 :**
Colonnes `id` des tables `lots` et `extractions` migrées de `bigint` → `uuid`.
`app.js` utilise `crypto.randomUUID()` — les types sont désormais cohérents.

---

## Fichier de départ

- `duramen.html` — fichier unique de 2300 lignes contenant HTML + CSS + JS
- Connexion Supabase fonctionnelle
- Design system cohérent avec variables CSS bien nommées
- Workflow de saisie en 3 étapes opérationnel
- Authentification par code commune opérationnelle

---

## Architecture en place

```
duramen.html   ← HTML pur (546 lignes), zéro JS inline — ✅
theme.css      ← variables de design (couleurs, typo) — ✅
ui.css         ← composants visuels (.card, .btn…) — ✅
core.js        ← noyau métier : DuramenCore (signatures figées) — ✅
app.js         ← logique UI, navigation, Supabase (775 lignes) — ✅
sw.js          ← Service Worker (offline) — à créer
```

## Architecture cible (initialement présentée)

```
duramen.html   ← HTML pur, sans CSS ni JS inline
theme.css      ← variables de design (couleurs, typo)
ui.css         ← composants visuels (.card, .btn…)
core.js        ← noyau métier : entrée / stock / sortie
app.js         ← logique UI, navigation, Supabase
sw.js          ← Service Worker (offline)
```

---

## Décisions d'architecture

| Décision | Raison | Date |
|----------|--------|------|
| HTML/CSS/JS vanilla, pas de framework | Transmissible à n'importe quel informaticien | Démarrage |
| Noyau `core.js` avec signatures figées | Protéger la logique entrée→stock→sortie | Démarrage |
| Séparation `theme.css` / `ui.css` | Permettre au graphiste de travailler sans risque | Démarrage |
| Supabase comme backend | Déjà en place et fonctionnel | Démarrage |

---

## Supabase — Tables et structure

**Table `lots`**
- `id` — identifiant unique (à migrer vers UUID)
- `commune_code` — code d'accès de la commune
- `nom` — nom du lot
- `essence` — essence de l'arbre
- `commune` — nom de la commune
- `cause` — cause d'abattage
- `provenance` — origine (alignement, bosquet…)
- `annee` — année de coupe
- `usage` — usage prévu
- `vol_brut`, `vol_utile`, `vol_dechets` — volumes en m3
- `nb_grumes`, `nb_planches` — comptages
- `lineaire` — linéaire en mètres
- `epaisseur`, `delta` — paramètres de débit
- `grumes` — tableau JSON des grumes individuelles
- `partage` — booléen (visible aux autres communes ?)
- `created_at` — date de création

**Table `extractions`**
- `id` — identifiant unique (à migrer vers UUID)
- `commune_code` — code d'accès de la commune
- `essence` — essence extraite
- `volume` — volume en m3
- `usage` — usage de destination
- `destination` — destinataire
- `commune`, `contact`, `notes` — infos complémentaires
- `date`, `date_iso` — date de l'extraction

**Table `codes_acces`**
- `code` — code d'accès commune
- `commune` — nom de la commune
- `actif` — booléen

---

## Bugs connus (à corriger en Phase 0c)

| Bug | Fichier | Impact |
|-----|---------|--------|
| Clés ESSENCES_INFO sans accents | `core.js` futur | Delta de débit jamais affiché |
| IDs basés sur `Date.getTime()` | `app.js` futur | Risque de collision en base |
| `sauver()` ne fait rien | `app.js` futur | Brouillons perdus en cas d'interruption |
| Pas de cache offline | `app.js` futur | App inutilisable sans réseau |
| Styles inline dans le JS | `app.js` futur | Graphiste ne peut pas tout modifier |

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

## Évolutions prévues (non planifiées)

- États du bois : brut / débité avec temps de séchage
- Vue cartographique des lots
- Notifications bois arrivant à maturité
- Queue de retry pour les opérations hors ligne

---

## Sécurité — Points d'attention avant mise en production

- Les clés de connexion Supabase (`SUPABASE_URL` et `SUPABASE_ANON_KEY`) sont actuellement en dur dans `duramen.html`. La clé anon est publique par conception mais avant mise en production, vérifier que les règles RLS (Row Level Security) de Supabase sont bien activées sur toutes les tables pour limiter l'accès aux seules communes authentifiées.

---


---

## Session Avril 2026 — Dossier financeur

### Documents produits

| Fichier | Description | Statut |
|---|---|---|
| `DURAMEN_presentation_v3.docx` | Note de présentation ADEME — version finale retravaillée | ✅ |
| `DURAMEN_presentation_financeurs_v2.docx` | Version intermédiaire avec section financement | archivée |
| `budget_duramen.xlsx` | Budget prévisionnel modulable (jours + taux) | ✅ à compléter |
| `DURAMEN_budget.md` | Version lisible du budget pour Obsidian | ✅ |
| `DURAMEN_taches.md` | Suivi global du projet avec cases à cocher | ✅ |
| `DURAMEN_postes.md` | Détail des tâches par poste de réalisation | ✅ |
| `DURAMEN_postes_financement.md` | Grandes lignes des postes pour le dossier financeur | ✅ |
| `REDACTION.md` | Règles rédactionnelles avec exemples | ✅ → `Docs/` |

---

### Structure du document de présentation v3

1. Un maillon manquant dans la filière
2. La philosophie Tronc Commun : catalyseur, pas éditeur
3. Une application qui se construit avec ceux qui l'utilisent
4. DURAMEN : un outil au service du stock
5. Propriété, gouvernance et diffusion
6. Feuille de route sur 2 ans

---

### Décisions rédactionnelles

- **Posture TC** : catalyseur de filière, pas éditeur de logiciel
- **Ton** : proposition, jamais contrat ni directive
- **Reprise de mission** : assumée et transparente, sans jugement sur l'ancien partenaire
- **Périmètre** : outil fiable et appropriable en 2 ans — pas exhaustif
- **Propriété** : TC éditeur + propriétaire du code / communes propriétaires de leurs données
- **Diffusion** : TC peut déployer ailleurs / communes sans droit de redistribution
- **Déploiement ADEME** : gratuit pour les communes Métropole Nantaise, usage conservé après le projet
- **Questions juridiques futures** (stockage mutualisé) : nommées mais non chiffrées

---

### Budget — état au 22 avril 2026

| | Jours | Montant |
|---|---|---|
| Travail TC (500 €/j) | 47 j | 23 500 € |
| Illustrateur (400 €/j) | 10 j | 4 000 € |
| Frais annexes (2 ans) | — | 3 600 € |
| **Total** | | **31 100 €** |

Taux illustrateur et nombre de jours à confirmer selon devis.

---

### Postes budget (grandes lignes pour financeur)

1. Conception et développement de l'application
2. Animation et co-construction avec les usagers
3. Déploiement et suivi
4. Recherche et documentation technique
5. Frais de fonctionnement

---

### Règles rédactionnelles — section 14 de CLAUDE.md

1. Phrases courtes, sans surcharge
2. Ton simple et agréable
3. Construire par le positif — négatif après le positif si nécessaire
4. Pas de jugement direct

**Rappel** : tout changement dans `CLAUDE.md` section 14 doit être répercuté dans `Docs/REDACTION.md`, et inversement.

