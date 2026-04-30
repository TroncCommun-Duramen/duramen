# CLAUDE_QUICK.md — Sections essentielles au démarrage

> Extrait de CLAUDE.md — sections §1, §6, §7, §8 uniquement.
> À lire à chaque démarrage de session, quelle que soit la tâche.

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

## 2. Règles absolues — NE JAMAIS VIOLER

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

## 3. Architecture du noyau `core.js`

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

## 4. Règle de séparation des sessions Claude Code

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
