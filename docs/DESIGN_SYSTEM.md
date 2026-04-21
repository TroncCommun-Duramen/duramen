# DESIGN_SYSTEM.md — Système de design DURAMEN

> Ce fichier est la référence visuelle du projet.
> Le graphiste travaille dans `theme.css` et `ui.css`.
> Ce fichier documente les décisions de design pour que
> Claude Code et le graphiste parlent le même langage.

---

## Fichiers de design

| Fichier | Contenu | Qui y touche |
|---------|---------|--------------|
| `theme.css` | Variables CSS : couleurs, typo, espacements | Graphiste |
| `ui.css` | Composants : .card, .btn, .tab, formulaires… | Graphiste |
| `duramen.html` | Structure HTML uniquement | Développeur |

**Règle absolue :** Aucun style dans le JS. Aucune couleur en dur dans le HTML.

---

## Palette de couleurs

| Variable CSS | Valeur | Usage |
|--------------|--------|-------|
| `--craie` | `#F2EDE4` | Fond principal de l'app |
| `--sable` | `#E0D5C4` | Fond secondaire, états hover |
| `--lin` | `#C9BAA3` | Bordures légères, séparateurs |
| `--cendre` | `#7A7469` | Textes secondaires, labels |
| `--encre` | `#1A1814` | Texte principal, header, boutons primaires |
| `--signal` | `#4B6FBF` | Accent, CTA, onglet actif, liens |
| `--signal-clair` | `#D4DCF2` | Fond badge signal, highlights |
| `--rouge` | `#c0392b` | Erreurs, boutons danger |
| `--orange` | `#d35400` | Alertes, avertissements |

---

## Typographie

| Variable CSS | Famille | Usages |
|--------------|---------|--------|
| `--font-display` | `Unbounded` | Titres UI, logo, valeurs numériques importantes |
| `--font-serif` | `Instrument Serif` italic | Sous-titres éditoriaux, accroche |
| `--font-sans` | `DM Sans` | Corps de texte, labels, boutons, formulaires |

**Poids utilisés :**
- Unbounded : 300 (light), 400 (regular), 700 (bold), 900 (black)
- DM Sans : 300 (light), 400 (regular), 500 (medium), 600 (semibold)

**Taille de base :** 13px sur le body

---

## Rayons de bordure

| Variable CSS | Valeur | Usage |
|--------------|--------|-------|
| `--r-sm` | `2px` | Boutons, badges, petits éléments |
| `--r-md` | `4px` | Champs de formulaire, tags |
| `--r-lg` | `8px` | Cartes, modals, conteneurs |

---

## Ombres

| Variable CSS | Usage |
|--------------|-------|
| `--shadow-sm` | Cartes au repos |
| `--shadow-md` | Cartes en hover, modals |
| `--shadow-lg` | Modals importantes, overlays |

---

## Bordures

| Variable CSS | Valeur | Usage |
|--------------|--------|-------|
| `--border` | `1.5px solid var(--encre)` | Boutons, éléments forts |
| `--border-light` | `1px solid var(--lin)` | Cartes, séparateurs discrets |
| `--border-signal` | `1.5px solid var(--signal)` | Éléments actifs, focus |

---

## Composants principaux

### `.card`
- Fond blanc
- Border `--border-light`
- Border-radius `--r-lg` (8px)
- Padding 24px 26px (desktop), 14px 13px (mobile)
- Shadow `--shadow-sm`

### `.btn` (bouton de base)
- Padding 10px 20px
- Border `--border`
- Border-radius `--r-sm` (2px)
- Font `DM Sans` 0.68rem, uppercase, letter-spacing 0.12em
- Fond transparent, texte `--encre`
- Hover : fond `--sable`

### Variantes de boutons
| Classe | Fond | Texte | Usage |
|--------|------|-------|-------|
| `.btn-primary` | `--encre` | `--craie` | Action principale |
| `.btn-signal` | `--signal` | blanc | CTA fort, validation |
| `.btn-danger` | transparent | `--rouge` | Suppression |
| `.btn-outline` | transparent | `--encre` | Action secondaire |
| `.btn-sm` | — | — | Modificateur taille réduite |

### Formulaires
- Labels : DM Sans 0.68rem, uppercase, `--cendre`, letter-spacing 0.13em
- Inputs : fond transparent, pas de border-box, seulement une bordure basse `--border`
- Focus : bordure basse passe à `--signal`
- Selects : chevron SVG custom, fond transparent

### Onglets desktop (`.tab`)
- Fond `--encre`, texte `--cendre`
- Actif : texte `--craie`, bordure basse `--signal` 2px
- Font DM Sans 0.72rem uppercase

### Navigation mobile (`.bnav-btn`)
- Icône SVG 22×22px
- Label 0.58rem uppercase
- Actif : texte `--craie`, icône `--signal`
- Hauteur minimale de touch target : 44px

---

## Responsive

| Breakpoint | Largeur | Changements |
|------------|---------|-------------|
| Desktop | > 600px | Tabs horizontaux, header complet, grilles multi-colonnes |
| Mobile | ≤ 600px | Bottom nav fixe, header réduit, formulaires en colonne unique |

**Padding mobile safe area :**
```css
padding-bottom: env(safe-area-inset-bottom);
```
À conserver sur `.bottom-nav` pour les iPhone avec encoche.

---

## Notes pour le graphiste

- Toutes les valeurs modifiables sont dans `theme.css` (variables `:root`)
- Les composants sont dans `ui.css`
- Ne pas toucher à `duramen.html`, `core.js`, `app.js`
- Tester sur iPhone SE (375px) et desktop 1160px minimum
- Le header `--encre` est intentionnellement sombre pour la lisibilité terrain
