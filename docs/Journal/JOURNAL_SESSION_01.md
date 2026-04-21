# Journal de développement — DURAMEN
## Session 1 — Mise en place de la méthodologie et première tâche

---

## Contexte

DURAMEN est une application web (PWA) de gestion du bois d'œuvre pour les communes de la métropole nantaise. Elle permet à chaque commune de saisir ses stocks de bois issu d'abattages urbains, de suivre les entrées et sorties, et de partager des informations avec les autres communes.

Le projet est porté par un non-programmateur. La méthodologie choisie privilégie la stabilité, la lisibilité du code, et la capacité à transmettre le projet à des informaticiens à tout moment.

---

## Ce qu'on avait au départ

Un seul fichier `duramen.html` de 2300 lignes contenant en vrac :
- Le HTML (la structure des pages)
- Le CSS (les couleurs, polices, mise en page)
- Le JavaScript (la logique, les calculs, la connexion à la base de données)

Ce fichier fonctionnait, mais il était fragile : impossible de faire intervenir un graphiste sans risquer de casser le code, et impossible de faire évoluer une partie sans toucher aux autres.

---

## Décisions prises lors de cette session

### 1. Choix du langage : HTML / CSS / JavaScript vanilla

Pas de framework (React, Vue, etc.). Du code standard, lisible par n'importe quel développeur web sans formation spécifique. Priorité à la transmissibilité.

### 2. Architecture en fichiers séparés

Le fichier unique `duramen.html` sera progressivement découpé en 5 fichiers distincts :

| Fichier | Rôle | Qui y touche |
|---------|------|--------------|
| `duramen.html` | Structure HTML uniquement | Développeur |
| `theme.css` | Variables de design (couleurs, typo, espacements) | Graphiste |
| `ui.css` | Composants visuels (.card, .btn, .tab…) | Graphiste |
| `core.js` | Noyau métier : entrée / stock / sortie | Développeur |
| `app.js` | Logique UI, navigation, appels Supabase | Développeur |

### 3. Le noyau immuable

Le cœur de l'application repose sur deux opérations fondamentales qui ne changeront jamais :

```
ENTRÉE  →  [STOCK]  →  SORTIE
```

Toute évolution future (états du bois, cartographie, notifications…) sera construite par-dessus ce principe, sans jamais modifier les fonctions de base.

### 4. Règle de séparation des sessions Claude Code

Une session de travail = un seul fichier touché. Jamais le design et la logique en même temps.

---

## Outils mis en place

- **Coffre Obsidian** : `Documents/Coffre Obsidian/Tronc Commun/03_Appli Duramen`
- **Claude Code** : v2.1.113, installé et connecté au compte Anthropic Pro
- **Fichiers de pilotage** créés :
  - `CLAUDE.md` — cerveau du projet, lu automatiquement par Claude Code à chaque session
  - `TASKS.md` — suivi séquentiel des tâches
  - `Docs/MEMORY.md` — état de l'architecture et décisions
  - `Docs/LESSONS.md` — règles permanentes issues des bugs
  - `Docs/DESIGN_SYSTEM.md` — référence visuelle complète
  - `Docs/PROMPT_LOG.md` — journal des instructions

---

## Bugs identifiés dans le code existant

Ces bugs sont documentés dans `Docs/LESSONS.md` et seront corrigés en Phase 0c :

| Bug | Impact | Correction prévue |
|-----|--------|-------------------|
| Clés `ESSENCES_INFO` sans accents (`'Chene'` au lieu de `'Chêne'`) | Le delta de débit n'est jamais affiché à l'étape 3 | Corriger les 8 clés |
| IDs basés sur `Date.getTime()` | Risque de collision si deux saisies simultanées | Remplacer par `crypto.randomUUID()` |
| Styles `style="..."` inline dans le JS | Le graphiste ne peut pas modifier ces styles | Déplacer dans `ui.css` |
| Pas de cache offline | App inutilisable sans réseau terrain | Ajouter cache localStorage |
| Brouillon de formulaire non sauvegardé | Saisie perdue en cas d'interruption | Auto-sauvegarde dans localStorage |

---

## Phase 0a — Isoler le design (en cours)

Objectif : permettre au graphiste de travailler sur le design sans risque de casser le code.

### ✅ Tâche 0a-1 — Créer `theme.css` — TERMINÉE

**Ce qui a été fait :**
Le bloc `:root { ... }` du fichier `duramen.html` a été extrait et placé dans un nouveau fichier `theme.css`. Ce bloc contient toutes les variables CSS globales du projet.

**Techniquement :**
- Création de `theme.css` avec le contenu suivant :
```css
:root {
  --craie:        #F2EDE4;
  --sable:        #E0D5C4;
  --lin:          #C9BAA3;
  --cendre:       #7A7469;
  --encre:        #1A1814;
  --signal:       #4B6FBF;
  --signal-clair: #D4DCF2;
  --rouge:        #c0392b;
  --orange:       #d35400;

  --font-display: 'Unbounded', sans-serif;
  --font-serif:   'Instrument Serif', serif;
  --font-sans:    'DM Sans', sans-serif;

  --r-sm: 2px;
  --r-md: 4px;
  --r-lg: 8px;

  --border:        1.5px solid var(--encre);
  --border-light:  1px solid var(--lin);
  --border-signal: 1.5px solid var(--signal);

  --shadow-sm: 0 1px 4px rgba(26,24,20,0.08);
  --shadow-md: 0 4px 16px rgba(26,24,20,0.12);
  --shadow-lg: 0 12px 40px rgba(26,24,20,0.18);
}
```
- Dans `duramen.html`, le bloc `:root` et son commentaire ont été supprimés du `<style>` interne
- Remplacement par `<link rel="stylesheet" href="theme.css">` dans le `<head>`

**Commit :**
```
refactor(design): extraire les tokens de design dans theme.css
```

**Vérification effectuée :** `duramen.html` ouvert dans le navigateur — affichage visuel identique à avant. Données Supabase intactes.

---

### ⬜ Tâche 0a-2 — Créer `ui.css` — À FAIRE

Déplacer tout le CSS restant du `<style>` de `duramen.html` vers `ui.css`.

### ⬜ Tâche 0a-3 — Supprimer les styles inline du JS — À FAIRE

Remplacer tous les `style="..."` écrits dans le JavaScript par des classes CSS dans `ui.css`.

---

## Prochaine session

Démarrer avec ce prompt dans Claude Code :
> "Lis CLAUDE.md, puis Docs/MEMORY.md, puis Docs/LESSONS.md, puis Docs/TASKS.md dans cet ordre. Nous travaillons uniquement sur la tâche 0a-2. Ne touche à aucun autre fichier. Confirme ce que tu vas faire avant de commencer."

---

## Pour un développeur qui reprendrait le projet

- Le projet utilise **Supabase** comme backend. Les clés de connexion sont dans `duramen.html` en variables `SUPABASE_URL` et `SUPABASE_ANON_KEY`.
- La base de données contient 3 tables : `lots`, `extractions`, `codes_acces`.
- L'authentification est par code commune (pas de compte utilisateur classique).
- À ce stade, `duramen.html` contient encore tout le CSS et le JS — le découpage est en cours (Phase 0a).
- Lire `CLAUDE.md` en premier, il contient toute l'architecture cible et les règles du projet.
- Lire `Docs/TASKS.md` pour connaître l'état exact d'avancement.
