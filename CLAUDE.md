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

| Composant    | Choix                                              |
| ------------ | -------------------------------------------------- |
| Frontend     | HTML5 + CSS3 + JavaScript vanilla (ES6+, pas de framework) |
| Backend/BDD  | Supabase (PostgreSQL + API REST)                   |
| PWA          | manifest.json + Service Worker (`/sw.js`)          |
| Fonts        | Google Fonts : Outfit (poids 200/300/400/500/600 uniquement) |
| Build        | Aucun — fichiers statiques séparés                 |

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

**Les 5 fichiers forment un ensemble indissociable.** Ne jamais modifier ou restaurer l'un sans vérifier que les autres sont de la même version.

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
--indigo:       #2B3F8C   /* accent unique */
--indigo-clair: #EEF0FA   /* fond badge indigo */
--rouge:        #c0392b   /* erreur, danger */
--orange:       #d35400   /* alerte */
```

**Règle d'utilisation de l'indigo :** uniquement pour — onglet actif, champ en cours de saisie, valeur calculée par l'app, badge commune, barre de stock, chip essence disponible. Nulle part ailleurs.

---

## 6. Règles absolues — NE JAMAIS VIOLER

### Noyau métier

- **JAMAIS** modifier les fonctions existantes de `core.js` pour une feature UI. On _ajoute_ — on ne modifie pas les fonctions déjà validées.

### Fichiers et nommage

- **Le fichier principal s'appelle `index.html`** — pas `duramen.html`. Toujours vérifier le nom exact avant toute modification.
- **Les 5 fichiers forment un ensemble** : index.html + app.js + core.js + theme.css + ui.css. Ne jamais restaurer l'un sans les autres.

### Authentification

- **JAMAIS** mettre les codes d'accès dans le HTML. Ils sont dans Supabase, table `codes_acces`, colonne `actif`. Toute modification de l'authentification passe par Supabase uniquement.

### Design / CSS

- **JAMAIS** écrire `style="..."` inline dans le HTML ou dans le JS. Tout style passe par une classe CSS dans `ui.css`.
- **JAMAIS** mettre des valeurs de couleur ou de taille en dur dans le JS. Utiliser les variables CSS (`var(--indigo)`) ou des classes.
- **TOUJOURS** ajouter les nouveaux composants visuels dans `ui.css`.

### Données & identifiants

- **JAMAIS** utiliser `Date.getTime()` comme identifiant unique. Utiliser `crypto.randomUUID()`.
- **TOUJOURS** utiliser les noms d'essences avec accents dans `ESSENCES_INFO`. Clés correctes : `'Châtaignier'`, `'Chêne'`, `'Cyprès'`, `'Épicéa'`, `'Frêne'`, `'Séquoia'`, `'Robinier (Acacia)'`.

### Service Worker & cache

- **TOUJOURS** maintenir le Service Worker actif (`/sw.js`).
- **TOUJOURS** vérifier que l'enregistrement du SW est présent dans index.html juste avant `</script>` :
  ```javascript
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }
  ```
- **TOUJOURS** incrémenter le numéro de cache dans `sw.js` après toute modification (duramen-v3 → duramen-v4…). Sans ça, les appareils ne chargent pas la nouvelle version.

### Offline & sauvegarde

- **TOUJOURS** sauvegarder localement après chaque écriture Supabase réussie. Clés localStorage : `duramen_lots_cache`, `duramen_extractions_cache`.
- **TOUJOURS** sauvegarder le brouillon du formulaire en cours. Clé localStorage : `duramen_draft`.

### Débogage

- **JAMAIS** empiler les corrections en cascade. Un bug = une session dédiée. Si une correction introduit un nouveau problème : stopper et faire le point.

---

## 7. Architecture du noyau `core.js`

Ces signatures sont **figées**. On peut ajouter des fonctions, jamais modifier celles-ci.

```javascript
DuramenCore.entree(lot)           // Ajouter du stock
DuramenCore.sortie(extraction)    // Retirer du stock
DuramenCore.getStock()            // Stock disponible par essence
DuramenCore.getHistorique()       // Log immuable de toutes les opérations
DuramenCore.validerEntree(lot)    // Retourne {ok: bool, erreur: string}
DuramenCore.validerSortie(extraction)
```

---

## 8. Règle de séparation des sessions Claude Code

**Une session = une zone de travail. Jamais les deux en même temps.**

| Session "Design" | Fichiers autorisés    | Fichiers interdits  |
| ---------------- | --------------------- | ------------------- |
|                  | `theme.css`, `ui.css` | `core.js`, `app.js` |

| Session "Feature"   | Fichiers autorisés       | Fichiers interdits     |
| ------------------- | ------------------------ | ---------------------- |
|                     | `core.js`, `app.js`      | `theme.css`, `ui.css`  |

| Session "Structure" | Fichiers autorisés       | Fichiers interdits     |
| ------------------- | ------------------------ | ---------------------- |
|                     | `index.html`             | tous les autres        |

---

## 9. Convention Git — branches et commits

### Branches

**`main` reste toujours propre : c'est la version de référence, installable à tout moment.**

- **TOUJOURS** créer une branche dédiée avant toute modification du code de l'application (index.html, app.js, core.js, theme.css, ui.css, sw.js, manifest.json). Jamais de travail directement sur `main`.
- **Nommage** : `feat/<nom-court>` pour une fonctionnalité (ex. `feat/transformation-grumes`), `fix/<nom-court>` pour une correction.
- **Une branche = une fonctionnalité.** Pas de fourre-tout : chaque évolution doit pouvoir être validée ou abandonnée indépendamment.
- **Fusion dans `main` uniquement après validation par le porteur de projet.** Après fusion, supprimer la branche.
- **Seule exception** : les modifications de documentation (`Docs/`, `CLAUDE.md`) peuvent aller directement sur `main`.

### Commits

```
Format : <type>(<périmètre>): <intention en français>

Types :
  feat     → nouvelle fonctionnalité
  fix      → correction de bug
  refactor → réorganisation sans changement de comportement
  style    → modification visuelle uniquement
  docs     → mise à jour documentation
  test     → ajout ou modification de tests
```

---

## 10. Références fichiers satellites

| Fichier                 | Rôle                                            |
| ----------------------- | ----------------------------------------------- |
| `Docs/MEMORY.md`        | Architecture, décisions, état du projet         |
| `Docs/TASKS.md`         | Suivi séquentiel des tâches (source de vérité)  |
| `Docs/LESSONS.md`       | Règles permanentes issues des bugs              |
| `Docs/DESIGN_SYSTEM.md` | Tokens complets : polices, couleurs, composants |
| `Docs/PROMPT_LOG.md`    | Piste d'audit horodatée des instructions        |

---

## 11. Règles rédactionnelles — TOUJOURS APPLIQUER

Voir Docs/REDACTION.md.
