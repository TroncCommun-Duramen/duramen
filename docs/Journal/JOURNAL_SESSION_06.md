# Journal de développement — DURAMEN
## Session 6 — Design system : nouvelle identité visuelle + résolution Git

---

## Rappel de l'état au démarrage

- Phase 0 entièrement terminée (sessions 01–05)
- Architecture 5 fichiers en place : `duramen.html`, `theme.css`, `ui.css`, `core.js`, `app.js`
- Supabase opérationnel avec IDs UUID
- Objectif de cette session : définir l'identité visuelle finale et l'implémenter

**Note :** Cette session s'est déroulée en deux temps — exploration et décisions dans Claude.ai (20–22 avril 2026), puis implémentation par Claude Code. Aucun code métier n'a été touché.

---

## 1. Exploration des directions visuelles

Trois directions testées et évaluées avant de choisir :

| Direction | Description | Verdict |
|-----------|-------------|---------|
| Bleu pétrole | Fond sombre, teintes océan | Écarté — trop lourd pour un usage terrain |
| Noir/blanc + couleur unique | Minimalisme strict, un seul accent | Base retenue, à affiner |
| Minimaliste japonaise | Fond washi chaud, noir doux, un seul bleu | **Direction finale choisie** |

**Raison du choix :** Lisible en plein soleil, contrastes élevés sans agressivité, identité distinctive mais sobre — cohérent avec l'usage terrain des agents communaux.

---

## 2. Palette finale — design system validé

Intégrée dans `theme.css` :

| Variable | Valeur | Usage |
|----------|--------|-------|
| `--washi` | `#FAFAF9` | Fond principal |
| `--neige` | `#F2F2EE` | Fond secondaire, stats |
| `--brume` | `#EEEEE9` | Séparateurs, bordures légères |
| `--sumi` | `#0F0F0E` | Texte principal, header, CTA |
| `--cendre` | `#B0B0AA` | Labels, textes secondaires |
| `--pierre` | `#CECEC8` | Éléments inactifs, nav off |
| `--indigo` | `#2B3F8C` | Accent unique — onglet actif, champ en saisie, valeur calculée |
| `--indigo-clair` | `#EEF0FA` | Fond badge indigo |
| `--rouge` | `#c0392b` | Erreur, danger |
| `--orange` | `#d35400` | Alerte |

**Décision clé : pas de dark mode.** Usage principalement en extérieur (plein soleil) — le dark mode n'apporte pas de valeur et complexifie la maintenance.

---

## 3. Typographie — Outfit

Remplacement de Unbounded / DM Sans par **Outfit** (Google Fonts).

| Usage | Graisse | Style |
|-------|---------|-------|
| Logo / nom app | 200 | letterspacing 0.2em, uppercase |
| Titres d'écran | 300 | letterspacing 0.04em |
| Corps / valeurs | 300–400 | — |
| Labels UI | 500 | 7–8px, uppercase, letterspacing 0.12em |
| Boutons | 500 | uppercase, letterspacing 0.14em |
| Chiffres stats | 300 | 16px |

Poids chargés depuis Google Fonts : 200, 300, 400, 500, 600 uniquement.

**Raison du choix :** Outfit combine la lisibilité d'une sans-serif moderne avec une légèreté qui s'accorde au caractère washi/sumi de la palette. Les poids extrêmes (200, 300) fonctionnent comme contrepoint aux labels uppercase 500.

---

## 4. Règle d'usage de l'indigo

L'indigo `#2B3F8C` est l'unique couleur fonctionnelle. Il est réservé à :
- Onglet actif dans la navigation
- Champ de formulaire en cours de saisie (focus)
- Valeur calculée par l'application (delta de débit, volumes)
- Badge commune connectée
- Barre de stock dans la vue Stock
- Chip essence disponible

**Nulle part ailleurs.** Toute utilisation décorative de l'indigo est interdite.

---

## 5. Maquettes validées — 5 écrans

Exploration et validation visuelle réalisées dans Claude.ai avant implémentation :

| Écran | Points clés validés |
|-------|---------------------|
| **Stock** | Cartes par essence, barre de stock indigo, chiffres Outfit 300 |
| **Saisie étape 1** | Labels uppercase 500, champs fond --neige, focus indigo |
| **Saisie étape 2** | Grumes en liste, calculs en indigo |
| **Historique** | Lignes aérées, dates en --cendre, essences en gras |
| **Territoire** | Vue commune, badges indigo sur partages actifs |

---

## 6. Implémentation dans theme.css et ui.css

Toutes les modifications ont porté exclusivement sur les fichiers design. `core.js` et `app.js` n'ont pas été touchés.

**`theme.css`** — variables mises à jour :
- Renommage `--signal` → `--indigo`, `--signal-clair` → `--indigo-clair`
- Ajout des niveaux `--neige`, `--brume`, `--pierre`, `--cendre`
- Import Google Fonts Outfit (poids 200/300/400/500/600)

**`ui.css`** — composants refondus avec la nouvelle palette :
- Tous les `var(--signal)` remplacés par `var(--indigo)`
- Typographie Outfit appliquée sur tous les composants
- Labels uppercase 500 systématiques

---

## 7. Mise à jour de CLAUDE.md

Sections modifiées :

| Section | Modification |
|---------|-------------|
| § 2 Stack technique | Mention `index.html` (renommage depuis `duramen.html`) |
| § 3 Structure des fichiers | Renommage `duramen.html` → `index.html` dans l'arborescence cible |
| § 5 Design System | Palette complète mise à jour, Outfit documenté avec grilles de poids |
| § 6 Règles absolues | Règle d'usage de l'indigo précisée |
| § 13 (nouveau) | Tâches design en attente : responsive mobile/desktop, icône PWA |

---

## 8. Création de GIT_WORKFLOW.md

Nouveau fichier créé dans `docs/` pour documenter le workflow Git du projet :
- Commandes de base (add, commit, push)
- Convention de commits (types : feat, fix, refactor, style, docs, test)
- Procédure de résolution de conflits
- Accès au dépôt GitHub

---

## 9. Résolution des problèmes Git

Trois problèmes résolus en séquence lors de la connexion locale → GitHub :

### 9a. Configuration de l'identité Git
```bash
git config --global user.name "Prénom Nom"
git config --global user.email "contact@paquito.fr"
```
Nécessaire avant tout commit — Git refusait de committer sans identité déclarée.

### 9b. Authentification par token
Token GitHub généré (Settings → Developer settings → Personal access tokens) et utilisé comme mot de passe lors du `git push`. L'authentification par mot de passe simple est désactivée par GitHub depuis 2021.

### 9c. Merge des historiques divergents
```bash
git pull origin main --allow-unrelated-histories
```
Erreur rencontrée : `fatal: refusing to merge unrelated histories`. Cause : le dépôt local et le dépôt GitHub avaient chacun un premier commit différent (initialisation séparée). L'option `--allow-unrelated-histories` force le merge et résout le conflit.

---

## État des fichiers après la session

```
01-Projet/Appli Duramen/
├── CLAUDE.md             ← palette, typo, règle indigo, §13 mis à jour
├── TASKS.md
├── index.html            ← renommé depuis duramen.html (cible)
├── theme.css             ← palette washi/sumi/indigo + Outfit
├── ui.css                ← composants refondus
├── core.js               ← inchangé
├── app.js                ← inchangé
└── docs/
    ├── MEMORY.md         ← palette et typo mises à jour
    ├── LESSONS.md
    ├── DESIGN_SYSTEM.md
    ├── GIT_WORKFLOW.md   ← nouveau
    ├── PROMPT_LOG.md
    └── Journal/
        ├── JOURNAL_SESSION_01.md
        ├── JOURNAL_SESSION_02.md
        ├── JOURNAL_SESSION_03.md
        ├── JOURNAL_SESSION_04.md
        ├── JOURNAL_SESSION_05.md
        └── JOURNAL_SESSION_06.md  ← ce fichier
```

---

## Décisions clés de la session

| Décision | Raison |
|----------|--------|
| Direction minimaliste japonaise retenue | Lisibilité terrain, contrastes solaires, identité sobre |
| Pas de dark mode | Usage extérieur prédominant, complexité inutile |
| Outfit remplace Unbounded/DM Sans | Lisibilité + légèreté cohérente avec la palette |
| Indigo strictement fonctionnel | Éviter la dilution de l'accent — chaque occurrence a du sens |
| `duramen.html` → `index.html` | Convention PWA standard |

---

## Prochaine étape

Phase 1 — États du bois (brut / débité + temps de séchage), à démarrer après :
1. Retours terrain sur les variables du formulaire
2. Rédaction du cahier des charges technique complet

Avant tout développement, répondre aux 3 questions bloquantes sur les rôles utilisateurs (voir `TASKS.md` section "Système de rôles").

---

## Voir aussi

- [[JOURNAL_SESSION_05]] — session précédente
- [[MEMORY]] — état cumulé du projet
- [[DESIGN_SYSTEM]] — design system défini lors de cette session
- [[CHANGELOG]] — modifications enregistrées
