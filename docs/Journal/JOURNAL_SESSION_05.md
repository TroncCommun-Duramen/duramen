# Journal de développement — DURAMEN
## Session 5 — Phase 0c : correction des bugs + migration Supabase — PHASE 0 ENTIÈREMENT TERMINÉE

---

## Rappel de l'état au démarrage

- Phases 0a et 0b terminées — architecture en 5 fichiers en place
- Objectif : corriger les 4 bugs identifiés depuis le début du projet
- Bug supplémentaire découvert en cours de session : incompatibilité UUID / Supabase

---

## Actions réalisées

### ✅ Tâche 0c-1 — Accents ESSENCES_INFO — DÉJÀ CORRIGÉE

Bug déjà résolu lors de la création de `core.js` en Phase 0b. Les clés correctes étaient déjà en place : `'Châtaignier'`, `'Chêne'`, `'Cyprès'`, `'Épicéa'`, `'Frêne'`, `'Séquoia'`, `'Robinier (Acacia)'`. Tâche marquée `[x]` sans modification.

---

### ✅ Tâche 0c-2 — Remplacer les IDs temporels par des UUIDs — TERMINÉE

**Ce qui a été fait dans `app.js` :**
- Ligne 254 (`sauvegarderLot`) : `id: now.getTime()` → `id: crypto.randomUUID()`
- Ligne 401 (`enregistrerExtraction`) : `id: now.getTime()` → `id: crypto.randomUUID()`
- Zéro occurrence de `getTime()` restante

**Commit :**
```
fix(data): remplacer Date.getTime() par crypto.randomUUID()
```

---

### ✅ Tâche 0c-3 — Auto-sauvegarde du brouillon — TERMINÉE

**3 nouvelles fonctions ajoutées dans `app.js` :**

| Fonction | Rôle |
|----------|------|
| `sauverBrouillon()` | Sauvegarde tous les champs + grumes dans `localStorage` clé `duramen_draft` |
| `restaurerBrouillon()` | Au chargement, propose de reprendre une saisie interrompue |
| `effacerBrouillon()` | Supprime le brouillon après sauvegarde réussie ou refus de reprise |

Écouteurs ajoutés sur tous les champs du formulaire : `lot-nom`, `commune`, `epaisseur`, `essence`, `cause`, `provenance`, `annee`, `usage`, `lot-partage`. Les fonctions `ajouterGrume()` et `supprimerGrume()` appellent aussi `sauverBrouillon()`.

**Commit :**
```
feat(saisie): auto-sauvegarder le brouillon de formulaire
```

---

### ✅ Tâche 0c-4 — Cache offline — TERMINÉE

**2 éléments ajoutés dans `app.js` :**

`showOfflineBanner(visible)` — crée un bandeau `⚡ Données hors ligne — affichage du dernier cache` avec la classe `info-box`, inséré en tête du `<main>`.

`chargerDonnees()` modifiée en deux points :
- **Après succès réseau :** sauvegarde `lots` et `extractions` dans `localStorage` sous les clés `duramen_lots_cache` et `duramen_extractions_cache`
- **En cas d'erreur réseau :** si un cache existe → charge les données en mémoire et affiche le bandeau offline. Si aucun cache → affiche l'erreur habituelle.

**Commit :**
```
feat(offline): afficher le cache localStorage si réseau absent
```

---

### 🔴 Bug découvert — Incompatibilité UUID / Supabase

**Erreur rencontrée lors du test :**
```
Erreur sauvegarde : Insertion lots: 400
{"code":"22P02","message":"invalid input syntax for type bigint: 'fe6c2cc9-...'"}
```

**Cause :** Les colonnes `id` des tables `lots` et `extractions` dans Supabase étaient de type `bigint` (nombre entier). Après la migration vers `crypto.randomUUID()`, Supabase recevait des chaînes de texte UUID qu'il refusait.

**Solution — Migration SQL exécutée dans Supabase SQL Editor :**

```sql
BEGIN;

-- TABLE lots
ALTER TABLE lots DROP CONSTRAINT lots_pkey;
ALTER TABLE lots ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE lots ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE lots ADD PRIMARY KEY (id);

-- TABLE extractions
ALTER TABLE extractions DROP CONSTRAINT extractions_pkey;
ALTER TABLE extractions ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE extractions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE extractions ADD PRIMARY KEY (id);

COMMIT;
```

**Vérification :**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('lots', 'extractions')
AND column_name = 'id'
ORDER BY table_name;
```
Résultat : `uuid` pour les deux tables ✅

**Test final :** sauvegarde d'un lot réussie, plus aucune erreur. ✅

---

## État des fichiers après la session

```
01-Projet/Appli Duramen/
├── CLAUDE.md
├── TASKS.md              ← Phase 0 entièrement cochée ✅
├── duramen.html          ← HTML pur, 546 lignes
├── theme.css             ← variables de design
├── ui.css                ← composants visuels
├── core.js               ← noyau métier (DuramenCore)
├── app.js                ← logique UI + Supabase (enrichi)
└── docs/
    ├── MEMORY.md         ← Phase 0c ✅ terminée
    ├── LESSONS.md
    ├── DESIGN_SYSTEM.md
    ├── PROMPT_LOG.md
    └── Journal/
        ├── JOURNAL_SESSION_01.md
        ├── JOURNAL_SESSION_02.md
        ├── JOURNAL_SESSION_03.md
        ├── JOURNAL_SESSION_04.md
        └── JOURNAL_SESSION_05.md
```

**Supabase :**
- Table `lots` : colonne `id` migrée de `bigint` vers `uuid`
- Table `extractions` : colonne `id` migrée de `bigint` vers `uuid`

---

## Bilan global — PHASE 0 ENTIÈREMENT TERMINÉE ✅

| Phase | Contenu | Statut |
|-------|---------|--------|
| 0a | Isolation du design (theme.css, ui.css, styles inline) | ✅ |
| 0b | Isolation du JS (core.js, app.js) | ✅ |
| 0c | Correction des bugs (accents, UUID, brouillon, offline) | ✅ |
| Migration | Supabase : colonnes id bigint → uuid | ✅ |

L'application est stable, propre, et prête pour les évolutions.

---

## Prochaine étape — Phase 1

Objectif : ajouter les états du bois (brut / débité avec temps de séchage).

**Avant de commencer la Phase 1 :**
- Modifier les variables du formulaire selon les retours terrain
- Rédiger le cahier des charges technique complet de l'application

---

## Pour un développeur qui reprendrait le projet

- Architecture complète en place — voir `CLAUDE.md` pour les règles
- `core.js` : noyau métier avec signatures figées
- `app.js` : logique UI, Supabase, brouillon, cache offline
- Supabase : tables `lots` et `extractions` avec IDs en UUID
- La clé anon Supabase est dans `app.js` — vérifier les règles RLS avant mise en production (voir `MEMORY.md` section Sécurité)
- Prochaine évolution planifiée : états du bois brut/débité (Phase 1 dans `TASKS.md`)
