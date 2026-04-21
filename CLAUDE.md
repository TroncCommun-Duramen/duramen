# CLAUDE.md — Cerveau du projet DURAMEN

> Tronc Commun — Gestion du bois d'œuvre à l'échelle des communes de la métropole nantaise

---

## 1. Contexte du projet

DURAMEN est une PWA multi-commune permettant aux agents des communes de la métropole nantaise de saisir, gérer et partager leurs stocks de bois d'œuvre issu d'abattages urbains (alignements, parcs, haies bocagères).

**Le cœur immuable de l'application :**

```
ENTRÉE  →  [STOCK]  →  SORTIE
```

Toute feature, tout module, toute évolution est une couche au-dessus de ce principe. Le noyau ne change jamais de comportement — il peut seulement recevoir de nouveaux types d'entrées ou de sorties.

**Note importante :** Le porteur de projet n'est pas programmateur. Chaque intervention de Claude Code doit être accompagnée d'explications pas à pas en français simple, sans jargon, avec le _pourquoi_ de chaque action.

---

## 2. Stack technique

|Composant|Choix|
|---|---|
|Frontend|HTML5 + CSS3 + JavaScript vanilla (ES6+, pas de framework)|
|Backend/BDD|Supabase (PostgreSQL + API REST)|
|PWA|manifest.json + Service Worker (`/sw.js`)|
|Fonts|Google Fonts : Outfit (poids 200/300/400/500/600 uniquement)|
|Build|Aucun — fichiers statiques séparés|

**Tables Supabase existantes :**

- `lots` — lots de bois (grumes, volumes, commune_code, partage)
- `extractions` — sorties de stock par essence
- `codes_acces` — authentification par code commune

---

## 3. Structure des fichiers — ARCHITECTURE CIBLE

```
/
├── index.html            ← structure HTML + appels JS uniquement
├── theme.css             ← tokens de design (couleurs, typo, espacements)
├── ui.css                ← composants visuels (.card, .btn, .tab…)
├── core.js               ← noyau métier : entrée / stock / sortie
├── app.js                ← logique UI, navigation, appels Supabase
├── manifest.json         ← config PWA
├── sw.js                 ← Service Worker (offline + cache)
├── icon-192.png
├── icon-512.png
└── Docs/
    ├── MEMORY.md
    ├── TASKS.md
    ├── LESSONS.md
    ├── DESIGN_SYSTEM.md
    └── PROMPT_LOG.md
```

**Qui touche à quoi :**

- Graphiste → `theme.css` et `ui.css` uniquement
- Développeur features → `core.js` et `app.js`
- Claude Code → jamais les deux zones en même temps dans la même session

---

## 4. Profil utilisateur cible

- **Agents techniques communaux** : jardiniers, responsables espaces verts
- Aisance numérique : modérée — smartphone mais pas d'apps complexes
- Contexte d'usage : terrain, réseau instable ou absent
- Comportement clé : saisie rapide entre deux interventions
- Contraintes UX :
    - Boutons minimum 44×44px
    - Texte lisible en plein soleil (contrastes élevés)
    - Formulaires courts, labels clairs
    - Confirmations explicites avant toute suppression
    - Tolérance aux interruptions → auto-sauvegarde du brouillon

---

## 5. Design System

> Valeurs complètes dans `Docs/DESIGN_SYSTEM.md`. Le graphiste travaille dans `theme.css` et `ui.css`.

**Palette (définie dans `theme.css`) :**

```css
--washi:        #FAFAF9   /* fond principal */
--neige:        #F2F2EE   /* fond secondaire, stats */
--brume:        #EEEEE9   /* séparateurs, bordures légères */
--sumi:         #0F0F0E   /* texte principal, header, CTA */
--cendre:       #B0B0AA   /* labels, textes secondaires */
--pierre:       #CECEC8   /* éléments inactifs, nav off */
--indigo:       #2B3F8C   /* accent unique — remplace --signal */
--indigo-clair: #EEF0FA   /* fond badge indigo — remplace --signal-clair */
--rouge:        #c0392b   /* erreur, danger — inchangé */
--orange:       #d35400   /* alerte — inchangé */
```

**Règle d'utilisation de l'indigo :** uniquement pour — onglet actif, champ en cours de saisie, valeur calculée par l'app, badge commune, barre de stock, chip essence disponible. Nulle part ailleurs.

**Typographie :**

Famille unique : `Outfit` (Google Fonts)

- Logo / nom app       : Outfit 200, letterspacing 0.2em, uppercase
- Titres d'écran       : Outfit 300, letterspacing 0.04em
- Corps / valeurs      : Outfit 300–400
- Labels UI            : Outfit 500, 7–8px, uppercase, letterspacing 0.12em
- Boutons              : Outfit 500, uppercase, letterspacing 0.14em
- Chiffres stats       : Outfit 300, 16px

---

## 6. Règles absolues — NE JAMAIS VIOLER

### Règle fondamentale du noyau

- **JAMAIS** modifier les fonctions existantes de `core.js` pour faire plaisir à une feature UI. Si une feature a besoin de quelque chose de nouveau, on _ajoute_ une fonction — on ne modifie pas les fonctions déjà validées.

### Règles design / CSS

- **JAMAIS** écrire `style="..."` inline dans le HTML ou dans le JS. → Tout style passe par une classe CSS définie dans `ui.css`. → Raison : le graphiste doit pouvoir tout retravailler sans toucher au JS.
- **JAMAIS** mettre des valeurs de couleur ou de taille en dur dans le JS. → Utiliser les variables CSS (`var(--signal)`) ou des classes.
- **TOUJOURS** ajouter les nouveaux composants visuels dans `ui.css`, pas dans `duramen.html`.

### Règles données & identifiants

- **JAMAIS** utiliser `Date.getTime()` comme identifiant unique. → Utiliser `crypto.randomUUID()`. → Raison : risque de collision, problèmes de synchronisation Supabase.
- **TOUJOURS** utiliser les noms d'essences avec accents dans `ESSENCES_INFO`. → Clés correctes : `'Châtaignier'`, `'Chêne'`, `'Cyprès'`, `'Épicéa'`, `'Frêne'`, `'Séquoia'`, `'Robinier (Acacia)'` → Raison : bug existant — sans accents, le delta de débit n'est jamais affiché.

### Règles DOM & rendu

- **JAMAIS** construire du HTML par concaténation de chaînes de caractères dans le JS. → Utiliser `document.createElement` + `textContent`. → Raison : risque de sécurité et code impossible à maintenir.

### Règles offline & sauvegarde

- **TOUJOURS** maintenir un Service Worker actif (`/sw.js`).
- **TOUJOURS** sauvegarder localement après chaque écriture Supabase réussie. → Clés localStorage : `duramen_lots_cache`, `duramen_extractions_cache`.
- **TOUJOURS** sauvegarder le brouillon du formulaire en cours de saisie. → Clé localStorage : `duramen_draft`.

---

## 7. Architecture du noyau `core.js`

Ces signatures sont **figées**. On peut ajouter des fonctions, jamais modifier celles-ci.

```javascript
// Les deux opérations fondamentales
DuramenCore.entree(lot)           // Ajouter du stock
DuramenCore.sortie(extraction)    // Retirer du stock

// Lecture de l'état
DuramenCore.getStock()            // Stock disponible par essence
DuramenCore.getHistorique()       // Log immuable de toutes les opérations

// Validation (retourne {ok: bool, erreur: string})
DuramenCore.validerEntree(lot)
DuramenCore.validerSortie(extraction)
```

---

## 8. Règle de séparation des sessions Claude Code

**Une session = une zone de travail. Jamais les deux en même temps.**

|Session "Design"|Fichiers autorisés|Fichiers interdits|
|---|---|---|
||`theme.css`, `ui.css`|`core.js`, `app.js`|

|Session "Feature"|Fichiers autorisés|Fichiers interdits|
|---|---|---|
||`core.js`, `app.js`|`theme.css`, `ui.css`|

|Session "Structure"|Fichiers autorisés|Fichiers interdits|
|---|---|---|
||`duramen.html`|tous les autres|

**Prompt de démarrage à copier-coller à chaque session :**

> "Lis CLAUDE.md, MEMORY.md, LESSONS.md et TASKS.md dans cet ordre. Nous travaillons uniquement sur [fichier]. Ne touche à aucun autre fichier. Confirme la tâche en cours avant de commencer."

---

## 9. Séquence de démarrage de session Claude Code

Au démarrage de chaque session, Claude Code doit lire dans cet ordre :

1. `CLAUDE.md` (ce fichier)
2. `Docs/MEMORY.md` — état actuel du projet
3. `Docs/LESSONS.md` — règles issues des bugs passés
4. `Docs/TASKS.md` — tâche du jour

Répondre avec :

> "Contexte chargé. Projet : [résumé en une phrase]. Dernière tâche validée : [X]. Aujourd'hui : [tâche en cours]. Je ne toucherai qu'à [fichier(s)]."

---

## 10. Convention de commits Git

```
Format : <type>(<périmètre>): <intention en français>

Types :
  feat     → nouvelle fonctionnalité
  fix      → correction de bug
  refactor → réorganisation sans changement de comportement
  style    → modification visuelle uniquement
  docs     → mise à jour documentation
  test     → ajout ou modification de tests

Exemples :
  refactor(design): extraire theme.css et ui.css depuis duramen.html
  refactor(core): isoler DuramenCore dans core.js
  fix(essences): corriger les accents dans ESSENCES_INFO
  feat(etats): ajouter les états brut/débité au stock
  style(carte): retravailler les composants lot-card
```

---

## 11. Références fichiers satellites

| Fichier                 | Rôle                                            |
| ----------------------- | ----------------------------------------------- |
| `Docs/MEMORY.md`        | Architecture, décisions, état du projet         |
| `Docs/TASKS.md`         | Suivi séquentiel des tâches (source de vérité)  |
| `Docs/LESSONS.md`       | Règles permanentes issues des bugs              |
| `Docs/DESIGN_SYSTEM.md` | Tokens complets : polices, couleurs, composants |
| `Docs/PROMPT_LOG.md`    | Piste d'audit horodatée des instructions        |

---

## 12. Clôture de session Claude Code

À la fin de chaque session, Claude Code doit rappeler à l'utilisateur de synchroniser ses fichiers avec GitHub.

**Message de clôture à afficher systématiquement :**

> "Session terminée. Avant de fermer, synchronise avec GitHub en ouvrant un terminal dans le dossier 'Appli Duramen' et en tapant les 3 commandes suivantes :"

```bash
git add .
git commit -m "type(périmètre): description en français"
git push
```

**Rappel des types de commits** (voir section 10) :
- `feat` → nouvelle fonctionnalité
- `fix` → correction de bug
- `refactor` → réorganisation sans changement de comportement
- `style` → modification visuelle uniquement
- `docs` → mise à jour documentation

L'app est mise à jour en ligne automatiquement 1 à 2 minutes après le `git push`.

**Pourquoi c'est important :**
- Chaque session laisse une trace horodatée dans l'historique GitHub
- En cas de bug, on peut revenir à n'importe quelle version précédente
- Le dépôt GitHub est la seule sauvegarde externalisée du code

---

## 13. Tâches design en attente

- [ ] **Responsive** : définir deux layouts distincts — mobile (terrain)
      et desktop (bureau). Sur mobile : poids minimum 400, taille de texte
      augmentée, boutons plus hauts. À traiter dans une session Design
      dédiée avant toute session CSS.

- [ ] **Icône PWA** : les fichiers `icon-192.png` et `icon-512.png` sont
      noirs sur blanc (#0F0F0E sur #FAFAF9). Envisager une version avec
      fond --indigo (#2B3F8C) et icône blanche pour meilleur contraste
      sur le splash screen PWA au lancement. Coordonner avec le graphiste
      avant de modifier `manifest.json`.
