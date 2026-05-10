# CHANGELOG — DURAMEN

> Historique des modifications par date.
> Format : `type(périmètre) — description`

---

## 26 avril 2026

### Audit et conformité design system
- `fix(index)` — Suppression doublon `id="lot-nom"` (étape 3 était ignoré par `getElementById`).
- `style(ui)` — Audit complet ui.css : zéro valeur en dur. 21 couleurs hex/rgba, 9 `font-weight` numériques, 13 `border-radius` sans token, 4 boutons principaux sous 56px → tous remplacés par des tokens.
- `style(theme)` — Ajout de 8 nouveaux tokens : `--overlay-light/dark`, `--overlay`, `--blanc-semi`, `--blanc-alpha`, `--indigo-sombre`, `--rouge-rgb` + 4 nouveaux rayons (`--border-radius-btn/inner/pill/sheet`).
- `fix(sw)` — Cache incrémenté duramen-v13 → duramen-v14.

---

## 25 avril 2026

### Navigation
- `feat(nav)` — Réorganisation en 4 onglets : Accueil · Nouveau · Stock · Extraction. Panel IDs stables, routing via `switchTab()`.

### Écran Nouveau (saisie de lot)
- `feat(saisie)` — Bottom sheet sur "+ Ajouter une grume" : molettes longueur/diamètre, compteur quantité, volume calculé en temps réel.
- `feat(saisie)` — Cartes sommaires pour chaque grume enregistrée, badge ✓ vert, suppression par ×.
- `style(saisie)` — Refonte visuelle : chips essence en indigo, bouton "+ Ajouter" en indigo, bouton Enregistrer en indigo, badge ✓ en cercle vert.

### Écran Stock (historique)
- `feat(historique)` — Refonte toggle Ma commune / Nantes Métropole, bloc total fond sumi, barres proportionnelles par essence, export Excel et PDF.
- `style(historique)` — Lisibilité textes, labels toggle, réduction à 5 lots récents affichés.
- `style(saisie)` — Conformité charte design : tokens border-radius et font-weight dans le formulaire Ajouter au stock.

### Écran Extraction
- `feat(extraction)` — Implémentation complète : chips filtrantes par essence, bottom sheet de sélection des grumes (cochables par lot), sliders débit, barre de synthèse, bouton valider.
- `fix(grume-sel)` — Correction NaN m³ (parseFloat + quantite||1), suppression "Quantité : undefined", volume total sélection en temps réel.
- `feat(extraction)` — Modale destination à la validation : nom projet (optionnel), commune d'installation, usage Intérieur/Extérieur, lieu optionnel.
- `fix(extraction)` — Nom projet optionnel (validation supprimée). Suppression toggle partage inutile.
- `style(extraction)` — Barre de synthèse 3 blocs colorés : m³ extrait (sumi) · m³ utile (vert) · m³ déchet (orange). Suppression des doublons texte.
- `feat(extraction)` — Bascule Grume brute / Débit en planches. Mode débit : sliders épaisseur/scie/rendement. Linéaire indicatif (V_utile ÷ (e/1000 × 0.20)).
- `style(extraction)` — Boutons bascule côte à côte (grid 2 colonnes). Linéaire aligné à droite (margin-left: auto).

---

## 24 avril 2026

### Écrans mobiles connexion et accueil
- `style(mobile)` — Écran connexion : logo centré, DURAMEN Outfit 200, champ CODE fond indigo, bouton ACCÉDER noir 56px.
- `feat(mobile)` — Écran accueil : routing post-connexion sur mobile, badge commune, stock total live, statut réseau.
- `style(mobile)` — Masquage header/footer sur mobile, bottom nav activée.
- `style(accueil)` — Boutons home avec icône SVG, sous-titre, flèche ›. Suppression indicateur réseau.
- `style(accueil)` — Badge commune border-radius 20px. Icône "Voir le stock" fond indigo.
- `fix(accueil)` — Correction spécificité CSS : icône "Voir le stock" restait grise (sélecteur `.btn-home-icon-box.btn-home-icon-voir`).

### Qualité code
- `refactor(css)` — Suppression styles inline groupes A+B+C : `.toast-erreur`, `.btn-deconnexion`, `.commune-locked`, `#header-stats .commune-chip`.
- `refactor(js)` — 30 occurrences `style.display` remplacées par `classList + .hidden`. Ajout `.hidden { display: none !important }` dans ui.css.

### Formulaire Ajouter au stock
- `feat(saisie)` — Formulaire complet : molettes longueur/diamètre, sélecteur GPS (commune/provenance), synthèse volumes, modal nommer le lot.

---

## 23 avril 2026

- `feat(mobile)` — Écran accueil mobile avec sous-onglets stock par lot (version initiale, refontée le 24 avril).

---

## 21–22 avril 2026

- `docs(claude)` — Mise à jour CLAUDE.md : palette actuelle, typographie Outfit, renommage index.html, tâches en attente.
- `docs(journal)` — Journal session 6 : design system et résolution conflit Git.

---

## Avant le 21 avril 2026

- Architecture 5 fichiers en place : `index.html`, `theme.css`, `ui.css`, `core.js`, `app.js`.
- Migration UUID : colonnes `id` des tables `lots` et `extractions` passées de bigint → uuid.
- Service Worker `sw.js` — offline + cache (duramen-v12).
- Authentification par code commune via table `codes_acces` Supabase.
- `DuramenCore` : signatures figées entree / sortie / getStock / getHistorique / validerEntree / validerSortie.

---

## Voir aussi

- [[LESSONS]] — les bugs de ce journal ont généré des règles permanentes
- [[TASKS]] — avancement par tâche (vue synthétique)
- [[GIT_WORKFLOW]] — format des commits et commandes Git du quotidien
