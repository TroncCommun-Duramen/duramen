# DESIGN_SYSTEM.md — Système de design DURAMEN

> Référence visuelle du projet. Mise à jour au 25 avril 2026.
> Le graphiste travaille dans `theme.css` et `ui.css` uniquement.
> Ce fichier documente les décisions de design pour que Claude Code et le graphiste parlent le même langage.

---

## Fichiers de design

| Fichier | Contenu | Qui y touche |
|---------|---------|--------------|
| `theme.css` | Variables CSS : couleurs, typo, espacements | Graphiste |
| `ui.css` | Composants : .card, .btn, formulaires, navigation… | Graphiste |
| `index.html` | Structure HTML uniquement | Développeur structure |

**Règle absolue :** Aucun style dans le JS. Aucune couleur en dur dans le HTML ou le JS.

---

## Palette de couleurs

Toutes les valeurs sont dans `theme.css` — seule source de vérité.

### Fonds
| Variable CSS | Valeur | Usage |
|---|---|---|
| `--washi` | `#FAFAF9` | Fond principal de l'app |
| `--neige` | `#F2F2EE` | Fond secondaire, stats, cards légères |
| `--brume` | `#EEEEE9` | Séparateurs, fond cards très légères |

### Textes
| Variable CSS | Valeur | Usage |
|---|---|---|
| `--sumi` | `#0F0F0E` | Texte principal, header, CTA noir |
| `--cendre` | `#6b6b63` | Labels, textes secondaires, placeholders |
| `--pierre` | `#CECEC8` | Éléments inactifs, nav off, bordures légères |

### Accent
| Variable CSS | Valeur | Usage |
|---|---|---|
| `--indigo` | `#2B3F8C` | Accent unique — onglet actif, champ focus, valeur calculée, badge commune, barre stock, chip essence disponible |
| `--indigo-clair` | `#EEF0FA` | Fond badge indigo |

**Règle indigo :** uniquement pour les 6 usages listés. Nulle part ailleurs.

### Statuts
| Variable CSS | Valeur | Usage |
|---|---|---|
| `--rouge` | `#c0392b` | Erreur, danger, suppression |
| `--orange` | `#d35400` | Alerte, volume déchet |
| `--vert` | `#788d5d` | Validation, enregistrement, succès *(ajouté 25 avril 2026)* |

---

## Typographie

**Famille unique : Outfit** (Google Fonts, poids 300/400/500/600)

| Variable CSS | Valeur | Usage |
|---|---|---|
| `--font-weight-thin` | `300` | Logo DURAMEN (à éviter en corps de texte) |
| `--font-weight-light` | `400` | Corps de texte, valeurs |
| `--font-weight-regular` | `500` | Texte courant |
| `--font-weight-medium` | `500` | Identique à regular |
| `--font-weight-semibold` | `600` | Titres, labels, boutons |

**Usages typographiques :**
| Élément | Poids | Taille | Remarque |
|---|---|---|---|
| Logo / nom app | 300 | — | letter-spacing 0.2em, uppercase |
| Titres d'écran | 300 | — | letter-spacing 0.04em |
| Corps / valeurs | 400 | min. 16px mobile | jamais 300 en corps sur mobile |
| Labels UI | 600 | 7–8px | uppercase, letter-spacing 0.12em |
| Boutons | 600 | — | uppercase, letter-spacing 0.14em |
| Chiffres stats | 300 | 16px | — |

---

## Bordures

| Variable CSS | Valeur | Usage |
|---|---|---|
| `--border-thin` | `1px solid var(--brume)` | Séparateurs légers, cards |
| `--border-field` | `1px solid var(--pierre)` | Champs de formulaire au repos |
| `--border-active` | `1px solid var(--indigo)` | Champ en cours de saisie (focus) |
| `--border-filled` | `1px solid var(--sumi)` | Champ rempli |

---

## Rayons de bordure

| Variable CSS | Valeur | Usage |
|---|---|---|
| `--border-radius-sm` | `2px` | Petits éléments, badges texte |
| `--border-radius-md` | `4px` | Champs de formulaire, tags |
| `--border-radius-bar` | `3px` | Barres de progression *(ajouté 25 avril 2026)* |
| `--border-radius-card` | `12px` | Cartes, boutons mobiles *(ajouté 25 avril 2026)* |
| `--border-radius-lg` | `18px` | Cadre téléphone uniquement |

---

## Couleurs composées

| Variable CSS | Valeur | Usage |
|---|---|---|
| `--indigo-border` | `rgba(43, 63, 140, 0.2)` | Séparateur indigo léger, ligne synthèse *(ajouté 25 avril 2026)* |

---

## Composants

### Boutons

| Classe | Fond | Texte | Usage |
|---|---|---|---|
| `.btn` | transparent | `--sumi` | Base — bordure `--border-filled` |
| `.btn-primary` | `--sumi` | `--washi` | Action principale |
| `.btn-outline` | transparent | `--sumi` | Action secondaire |

**Règles mobiles :** hauteur minimum 56px, border-radius `--border-radius-card` (12px).

### Formulaires (`.field`)

- Label : Outfit 0.62rem, uppercase, `--cendre`, letter-spacing 0.12em
- Input / Select : fond transparent, bordure basse `--border-field`
- Focus : bordure basse passe à `--border-active` (`--indigo`)
- Rempli : bordure basse passe à `--border-filled` (`--sumi`)

### Navigation bottom (`.bnav-btn`)

- Icône SVG 22×22px + label 0.58rem uppercase
- Inactif : icône et texte `--pierre`
- Actif : icône et texte `--indigo`
- Touch target minimum : 44×44px

### Cards (`.card`)

- Fond `--neige`, bordure `--border-thin`, border-radius `--border-radius-card`
- Padding 16px–20px

### Toast (`.toast-succes`, `.toast-erreur`)

- Succès : fond `--vert`, texte blanc
- Erreur : fond `--rouge`, texte blanc
- Position fixe en bas, centré, border-radius `--border-radius-card`

### Chips filtrantes (`.ext-chip`, `.saisie-chip`) *(ajouté 25 avril 2026)*

- Repos : fond `--neige`, bordure `--pierre`, texte `--cendre`
- Actif (`.active`) : fond `--indigo`, texte `--washi`, sans bordure
- Border-radius `--border-radius-lg` (pilule)
- Usage : filtrer par essence dans l'écran Extraction

### Bottom sheet *(ajouté 25 avril 2026)*

Structure HTML :
```
#wrap (position fixed, inset 0)
  #overlay (fond semi-transparent, onclick → fermer)
  #sheet (fond --washi, border-radius 14px 14px 0 0)
    .handle (28×3px, --pierre, border-radius 2px)
    #content
```
- `.open` → `display: flex` sur `#wrap`
- Max-height 85vh, overflow-y auto, padding-bottom 80px (bottom nav)
- Deux instances dans l'app : `#grume-sheet-wrap` (saisie grume) et `#grume-sel-sheet-wrap` (sélection extraction)

### Molette de défilement inline (`creerDrum()`) *(ajouté 25 avril 2026)*

- Composant JS pur — scroll wheel vertical pour sélectionner une valeur dans une liste
- Paramètres : `(valeurs[], defaut, afficher, onChange)`
- Valeurs longueur : 1.70–7.00 m (step 0.05) — `LON_VALS`
- Valeurs diamètre : 20–70 cm (step 1) — `DIA_VALS`
- Usage : formulaire saisie grume (bottom sheet Ajouter une grume)

### Barre de synthèse 3 couleurs (`#ext-synthese`) *(ajouté 25 avril 2026)*

- Conteneur flex `overflow: hidden` (pas de border-radius propre — les items font les coins)
- 3 blocs `.ext-syn-item` (flex: 1, padding 16px 8px, text-align center)
  - Bloc 1 — m³ extrait : fond `--sumi`
  - Bloc 2 — m³ utile : fond `--vert`
  - Bloc 3 — m³ déchet : fond `--orange`
- Valeur : Outfit 1.2rem, `--font-weight-medium`, `--washi`
- Label : 0.55rem, uppercase, `rgba(255,255,255,0.65)`
- Visible uniquement quand des grumes sont sélectionnées (`.hidden` sinon)
- En mode "Grume brute" : seul le bloc 1 est visible

### Bouton bascule actif/inactif (`.ext-debit-toggle`) *(ajouté 25 avril 2026)*

- Deux boutons côte à côte dans `.ext-debit-grid` (grid 2 colonnes égales, gap 8px)
- Repos : fond `--neige`, bordure `--pierre`, texte `--cendre`, font-weight 600
- Actif (`.active`) : fond `--vert`, sans bordure, texte blanc, font-weight 600
- Hauteur 44px, border-radius 10px
- Usage : bascule Grume brute / Débit en planches dans l'écran Extraction

### Cadre valeur calculée (`.ext-lineaire-box`) *(ajouté 25 avril 2026)*

- Fond `--indigo`, texte `--washi`, border-radius 8px, padding 10px 14px
- Label : 0.55rem, uppercase, letter-spacing 0.08em, opacity 0.75
- Valeur : Outfit 1rem, `--font-weight-semibold`
- `margin-left: auto` dans un conteneur flex → aligné à droite
- Usage : linéaire indicatif dans le mode Débit en planches

---

## Responsive

| Breakpoint | Changements |
|---|---|
| Desktop > 600px | Tabs horizontaux visibles, header complet, `bottom-nav` masquée |
| Mobile ≤ 600px | `bottom-nav` visible, header/footer masqués, formulaires colonne unique, police min. 16px |

**Safe area mobile :**
```css
padding-bottom: env(safe-area-inset-bottom);
```
À conserver sur `.bottom-nav` pour les appareils avec encoche.

---

## Notes pour le graphiste

- Toutes les variables modifiables sont dans `theme.css` (bloc `:root`)
- Les composants sont dans `ui.css`
- Ne pas toucher à `index.html`, `core.js`, `app.js`
- Tester sur iPhone SE (375px) et desktop 1280px minimum
- Le fond `--washi` (#FAFAF9) n'est pas blanc pur — intentionnel pour réduire la fatigue visuelle terrain
- L'indigo `--indigo` (#2B3F8C) est l'accent unique — ne pas multiplier les couleurs d'accentuation

---

## Voir aussi

- [[BENCHMARK]] — références UX mobiles qui ont informé ces décisions
- [[CHANGELOG]] — historique des modifications visuelles
- [[REDACTION]] — règles rédactionnelles cohérentes avec la charte
