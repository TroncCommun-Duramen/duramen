# TASKS.md — Suivi des tâches DURAMEN

> **Règle d'or :** Une seule tâche à la fois. On ne passe à la suivante
> que quand la précédente est marquée ✅ et commitée.

---

## État actuel du projet

- **Fichier de départ :** `duramen.html` (fichier unique, 2300 lignes)
- **Objectif des phases 0a/0b/0c :** Réorganiser sans rien casser,
  pour pouvoir ensuite évoluer sereinement

---

## ═══ PHASE 0a — Isoler le design ═══
*Objectif : permettre au graphiste de travailler sans risque*
*Fichiers concernés : `theme.css`, `ui.css`, `duramen.html`*

---

### Tâche 0a-1 — Créer `theme.css` (les couleurs et la typographie)
- [x] **Statut :** À faire
- **Ce que c'est :** Un fichier qui contient uniquement les "réglages globaux" du design — les couleurs, les polices, les tailles de base. C'est comme une palette de peintre : si on change une couleur ici, elle change partout dans l'app automatiquement.
- **Ce que Claude Code va faire :** Copier le bloc `:root { ... }` du `<style>` de `duramen.html` dans un nouveau fichier `theme.css`, puis remplacer ce bloc dans `duramen.html` par `<link rel="stylesheet" href="theme.css">`.
- **Comment vérifier que c'est bon :** Ouvrir `duramen.html` dans le navigateur. L'app doit être visuellement identique à avant. Si quelque chose a changé, la tâche a échoué.
- **Commit :** `refactor(design): extraire les tokens de design dans theme.css`

---

### Tâche 0a-2 — Créer `ui.css` (les composants visuels)
- [x] **Statut :** À faire
- **Ce que c'est :** Un fichier qui contient les "briques visuelles" de l'app — comment ressemble un bouton, une carte, un onglet, un formulaire. C'est le terrain de jeu du graphiste.
- **Ce que Claude Code va faire :** Déplacer tout le CSS restant du `<style>` de `duramen.html` vers `ui.css`, puis ajouter `<link rel="stylesheet" href="ui.css">` dans `duramen.html`.
- **Comment vérifier que c'est bon :** Même vérification — l'app doit être visuellement identique. Ouvrir sur mobile et sur desktop.
- **Commit :** `refactor(design): extraire les composants UI dans ui.css`

---

### Tâche 0a-3 — Supprimer les styles inline du JS
- [x] **Statut :** À faire
- **Ce que c'est :** Dans le code actuel, certains styles sont écrits directement dans le JavaScript (ex: `style="font-size:1.6rem"`). C'est un problème car le graphiste ne peut pas les modifier. Cette tâche les remplace par des classes CSS.
- **Ce que Claude Code va faire :** Identifier tous les `style="..."` dans le JS, créer les classes CSS correspondantes dans `ui.css`, remplacer les styles inline par ces classes.
- **Comment vérifier que c'est bon :** Rechercher `style="` dans `app.js` et `duramen.html` — le résultat doit être zéro occurrence dans le JS.
- **Commit :** `refactor(design): supprimer tous les styles inline du JS`

---

### ✅ Validation Phase 0a
- [ ] `duramen.html` ne contient plus aucune ligne de CSS
- [ ] `duramen.html` ne contient plus aucun `style="..."` dans le JS
- [ ] L'app est visuellement identique sur desktop et mobile
- [ ] Le graphiste peut recevoir `theme.css` et `ui.css`

---

## ═══ PHASE 0b — Isoler le noyau métier ═══
*Objectif : protéger la logique "entrée → stock → sortie" dans un fichier sanctuarisé*
*Fichiers concernés : `core.js`, `app.js`, `duramen.html`*

---

### Tâche 0b-1 — Créer `core.js` avec les fonctions de base
- [x] **Statut :** ✅ Fait (core.js complet, lié dans duramen.html avant le script principal)
- **Ce que c'est :** Extraire dans un fichier séparé les calculs de stock — ce qui entre, ce qui sort, ce qui reste. Ces calculs ne changeront jamais, quelle que soit l'évolution de l'app.
- **Ce que Claude Code va faire :** Créer `core.js` avec l'objet `DuramenCore` et y déplacer les fonctions `getStockParEssence()`, les calculs de volume, et les validations métier. Ajouter `<script src="core.js"></script>` dans `duramen.html` **avant** le script principal.
- **Comment vérifier que c'est bon :** Ouvrir l'app. Saisir un lot de test. Vérifier que le stock se met à jour correctement. Faire une extraction. Vérifier que le stock diminue.
- **Commit :** `refactor(core): isoler DuramenCore dans core.js`

---

### Tâche 0b-2 — Créer `app.js` (tout le reste du JS)
- [x] **Statut :** ✅ Fait (775 lignes extraites dans app.js, duramen.html réduit à 546 lignes, zéro JS inline)
- **Ce que c'est :** Déplacer tout le JavaScript restant de `duramen.html` vers `app.js`. Ce fichier gère l'affichage, la navigation, les appels à Supabase — tout ce qui "fait tourner" l'interface.
- **Ce que Claude Code va faire :** Couper le bloc `<script>` de `duramen.html` et le coller dans `app.js`, puis ajouter `<script src="app.js"></script>` dans `duramen.html`.
- **Comment vérifier que c'est bon :** Tester toutes les fonctions de l'app : connexion, saisie d'un lot, consultation du stock, extraction, historique, territoire.
- **Commit :** `refactor(app): extraire la logique UI dans app.js`

---

### ✅ Validation Phase 0b
- [ ] `duramen.html` ne contient plus aucune ligne de JavaScript
- [ ] `core.js` contient uniquement les calculs métier (stock, volumes, validations)
- [ ] `app.js` contient uniquement l'affichage et la logique Supabase
- [ ] Toutes les fonctionnalités existantes marchent exactement comme avant

---

## ═══ PHASE 0c — Corriger les bugs existants ═══
*Objectif : assainir la base avant d'ajouter quoi que ce soit*
*Fichiers concernés : `core.js`, `app.js`*

---

### Tâche 0c-1 — Corriger les accents dans ESSENCES_INFO
- [x] **Statut :** ✅ Fait (accents déjà corrects dans core.js — toutes les clés correspondent aux valeurs du formulaire)
- **Ce que c'est :** Bug actuel — les noms d'essences dans le dictionnaire `ESSENCES_INFO` sont écrits sans accents (`'Chene'`) alors que les menus déroulants utilisent les accents (`'Chêne'`). Résultat : le delta de débit recommandé n'est jamais affiché.
- **Ce que Claude Code va faire :** Corriger les 8 clés concernées dans `ESSENCES_INFO`.
- **Comment vérifier :** Dans le formulaire de saisie, choisir "Chêne" comme essence et avancer jusqu'à l'étape 3. La ligne "Delta recommandé : 20%" doit apparaître.
- **Commit :** `fix(essences): corriger les accents dans ESSENCES_INFO`

---

### Tâche 0c-2 — Remplacer les IDs temporels par des UUIDs
- [x] **Statut :** ✅ Fait (crypto.randomUUID() aux lignes 254 et 401 de app.js)
- **Ce que c'est :** Actuellement, chaque lot et extraction reçoit un identifiant basé sur l'heure (`Date.getTime()`). Problème : si deux personnes saisissent au même moment, les identifiants peuvent entrer en conflit dans la base de données.
- **Ce que Claude Code va faire :** Remplacer `id: now.getTime()` par `id: crypto.randomUUID()` dans les deux endroits concernés.
- **Comment vérifier :** Saisir deux lots rapidement l'un après l'autre. Vérifier dans Supabase que les IDs sont bien différents et au format UUID (ex: `a3f2c1d0-...`).
- **Commit :** `fix(data): remplacer Date.getTime() par crypto.randomUUID()`

---

### Tâche 0c-3 — Implémenter l'auto-sauvegarde du brouillon
- [x] **Statut :** ✅ Fait (sauverBrouillon / effacerBrouillon / restaurerBrouillon dans app.js, clé duramen_draft)
- **Ce que c'est :** Actuellement, si on est en train de saisir un lot et que le téléphone se met en veille ou qu'on reçoit un appel, toute la saisie est perdue. Cette tâche sauvegarde automatiquement ce qu'on est en train de taper.
- **Ce que Claude Code va faire :** Ajouter un écouteur sur chaque champ du formulaire qui sauvegarde l'état dans `localStorage` sous la clé `duramen_draft`. Au chargement, si un brouillon existe, proposer de le récupérer.
- **Comment vérifier :** Commencer à remplir le formulaire, fermer l'onglet, rouvrir l'app. Un message doit proposer "Reprendre la saisie en cours ?".
- **Commit :** `feat(saisie): auto-sauvegarder le brouillon de formulaire`

---

### Tâche 0c-4 — Ajouter le cache offline
- [x] **Statut :** ✅ Fait (cache dans duramen_lots_cache / duramen_extractions_cache, bandeau offline via info-box)
- **Ce que c'est :** Actuellement, si le réseau est coupé, l'app affiche une erreur et ne montre rien. Cette tâche fait en sorte que les dernières données chargées restent visibles même sans réseau.
- **Ce que Claude Code va faire :** Après chaque chargement Supabase réussi, copier les données dans `localStorage`. Au démarrage, afficher d'abord les données du cache pendant que le réseau répond.
- **Comment vérifier :** Charger l'app normalement, puis couper le wifi et recharger. Le stock et l'historique doivent s'afficher (avec une mention "données hors ligne").
- **Commit :** `feat(offline): afficher le cache localStorage si réseau absent`

---

### ✅ Validation Phase 0c
- [ ] Le delta de débit s'affiche bien à l'étape 3 du formulaire
- [ ] Les IDs sont au format UUID dans Supabase
- [ ] Un brouillon interrompu est récupérable au rechargement
- [ ] L'app affiche le stock même sans connexion réseau

---

## ═══ PHASE 1 — Première évolution : états du bois ═══
*Commencer uniquement après validation complète des phases 0a, 0b, 0c*
*Fichiers concernés : `core.js` (ajout), `app.js` (ajout), `ui.css` (ajout)*

---

### Tâche 1-1 — Définir les états dans core.js
- [ ] **Statut :** En attente (Phase 0 non terminée)
- **Ce que c'est :** Ajouter la notion d'état du bois dans le noyau : "brut" (utilisable tel quel) ou "débité" (en cours de séchage, avec une date de disponibilité). Un stock débité n'est pas disponible immédiatement.
- **Note :** Ne pas commencer avant que les phases 0a, 0b et 0c soient toutes validées.

---

### Tâche 1-2 — Adapter le formulaire de saisie
- [ ] **Statut :** En attente
- **Ce que c'est :** Ajouter un champ "État du bois" dans le formulaire existant, avec les options "Brut" et "Débité". Si "Débité", afficher un champ "Date de disponibilité".

---

### Tâche 1-3 — Adapter l'affichage du stock
- [ ] **Statut :** En attente
- **Ce que c'est :** Dans la vue Stock, distinguer visuellement le bois disponible maintenant (brut) du bois en séchage (débité, avec sa date de dispo).

---

## ═══ BACKLOG — Idées futures ═══
*Non planifiées — à reprendre quand les phases précédentes sont stables*

- [ ] Bouton Retour intégré — permettre aux agents d'envoyer un feedback sans quitter l'app. Un bouton discret permanent sur toutes les pages ouvre un mini-formulaire : ce que je faisais / ce qui s'est passé. La page et l'heure sont capturées automatiquement. Les retours sont stockés dans une nouvelle table Supabase `feedbacks`. Consulter depuis le dashboard Supabase.
- [ ] Service Worker + installation PWA sur l'écran d'accueil
- [ ] Queue de retry pour les opérations faites hors ligne
- [ ] Refactoriser le rendu DOM (supprimer les dernières concaténations de chaînes)
- [ ] Remplacer `alert()` / `confirm()` par des modals accessibles
- [ ] Vue cartographique des lots par commune
- [ ] Notifications pour les bois arrivant à maturité de séchage

---

## Journal des tâches validées

| Date | Tâche | Commit |
|------|-------|--------|
| 2026-04-19 | 0b-1 | `refactor(core): isoler DuramenCore dans core.js` |
| 2026-04-19 | 0b-2 | `refactor(app): extraire la logique UI dans app.js` |
| 2026-04-19 | 0c-1 | `fix(essences): accents déjà corrects dans ESSENCES_INFO — validé` |
| 2026-04-19 | 0c-2 | `fix(data): remplacer Date.getTime() par crypto.randomUUID()` |
| 2026-04-19 | 0c-3 | `feat(saisie): auto-sauvegarder le brouillon de formulaire` |
| 2026-04-19 | 0c-4 | `feat(offline): afficher le cache localStorage si réseau absent` |
| 2026-04-28 | fix extraction | `fix(extraction): réinitialiser le linéaire indicatif en mode Grume brute` |
| 2026-04-28 | feat saisie | `feat(saisie): ajouter le choix de méthode diamètre / circonférence dans le panneau Nouvelle grume` |
---

## TÂCHE — Système de rôles utilisateurs

**Statut :** 🔜 En attente de définition métier  
**Priorité :** Moyenne  
**Fichiers concernés :** `app.js` + table Supabase `codes_acces`

### Objectif
Ouvrir des fonctionnalités différentes selon le profil de l'usager,
sans alourdir l'interface ni fragiliser le noyau.

### Principe retenu
Étendre la table `codes_acces` avec une colonne `role`
(valeurs : `agent` / `scieur` / `admin`).
Les codes existants héritent automatiquement du rôle `agent`.

### Bloquant avant développement
Répondre aux 3 questions suivantes :
1. Le scieur peut-il écrire (accusé réception) ou seulement consulter ?
2. L'admin est-il uniquement Tronc Commun ou aussi certains chefs de service ?
3. Y a-t-il d'autres rôles dans la filière (transformateur, menuisier, asso) ?

### Ne pas faire avant d'avoir répondu
Aucune ligne de code. La définition métier précède le développement.