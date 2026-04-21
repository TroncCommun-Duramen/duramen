# MEMORY.md — Base de connaissance du projet DURAMEN

> Ce fichier est lu au démarrage de chaque session Claude Code.
> Il résume l'état du projet : décisions prises, architecture, points d'attention.
> Le mettre à jour à chaque fin de session importante.

---

## État du projet

- **Phase 0 ✅ entièrement terminée** — architecture 5 fichiers en place :
  `duramen.html` (HTML pur) · `theme.css` · `ui.css` · `core.js` · `app.js`
- Phase 0a ✅ : theme.css, ui.css extraits, styles inline supprimés
- Phase 0b ✅ : core.js (DuramenCore), app.js créés — duramen.html = HTML pur 546 lignes
- Phase 0c ✅ : accents ESSENCES_INFO, UUIDs, brouillon auto-sauvegardé, cache offline

**Migration Supabase — 19 avril 2026 :**
Colonnes `id` des tables `lots` et `extractions` migrées de `bigint` → `uuid`.
`app.js` utilise `crypto.randomUUID()` — les types sont désormais cohérents.

---

## Fichier de départ

- `duramen.html` — fichier unique de 2300 lignes contenant HTML + CSS + JS
- Connexion Supabase fonctionnelle
- Design system cohérent avec variables CSS bien nommées
- Workflow de saisie en 3 étapes opérationnel
- Authentification par code commune opérationnelle

---

## Architecture en place

```
duramen.html   ← HTML pur (546 lignes), zéro JS inline — ✅
theme.css      ← variables de design (couleurs, typo) — ✅
ui.css         ← composants visuels (.card, .btn…) — ✅
core.js        ← noyau métier : DuramenCore (signatures figées) — ✅
app.js         ← logique UI, navigation, Supabase (775 lignes) — ✅
sw.js          ← Service Worker (offline) — à créer
```

## Architecture cible (initialement présentée)

```
duramen.html   ← HTML pur, sans CSS ni JS inline
theme.css      ← variables de design (couleurs, typo)
ui.css         ← composants visuels (.card, .btn…)
core.js        ← noyau métier : entrée / stock / sortie
app.js         ← logique UI, navigation, Supabase
sw.js          ← Service Worker (offline)
```

---

## Décisions d'architecture

| Décision | Raison | Date |
|----------|--------|------|
| HTML/CSS/JS vanilla, pas de framework | Transmissible à n'importe quel informaticien | Démarrage |
| Noyau `core.js` avec signatures figées | Protéger la logique entrée→stock→sortie | Démarrage |
| Séparation `theme.css` / `ui.css` | Permettre au graphiste de travailler sans risque | Démarrage |
| Supabase comme backend | Déjà en place et fonctionnel | Démarrage |

---

## Supabase — Tables et structure

**Table `lots`**
- `id` — identifiant unique (à migrer vers UUID)
- `commune_code` — code d'accès de la commune
- `nom` — nom du lot
- `essence` — essence de l'arbre
- `commune` — nom de la commune
- `cause` — cause d'abattage
- `provenance` — origine (alignement, bosquet…)
- `annee` — année de coupe
- `usage` — usage prévu
- `vol_brut`, `vol_utile`, `vol_dechets` — volumes en m3
- `nb_grumes`, `nb_planches` — comptages
- `lineaire` — linéaire en mètres
- `epaisseur`, `delta` — paramètres de débit
- `grumes` — tableau JSON des grumes individuelles
- `partage` — booléen (visible aux autres communes ?)
- `created_at` — date de création

**Table `extractions`**
- `id` — identifiant unique (à migrer vers UUID)
- `commune_code` — code d'accès de la commune
- `essence` — essence extraite
- `volume` — volume en m3
- `usage` — usage de destination
- `destination` — destinataire
- `commune`, `contact`, `notes` — infos complémentaires
- `date`, `date_iso` — date de l'extraction

**Table `codes_acces`**
- `code` — code d'accès commune
- `commune` — nom de la commune
- `actif` — booléen

---

## Bugs connus (à corriger en Phase 0c)

| Bug | Fichier | Impact |
|-----|---------|--------|
| Clés ESSENCES_INFO sans accents | `core.js` futur | Delta de débit jamais affiché |
| IDs basés sur `Date.getTime()` | `app.js` futur | Risque de collision en base |
| `sauver()` ne fait rien | `app.js` futur | Brouillons perdus en cas d'interruption |
| Pas de cache offline | `app.js` futur | App inutilisable sans réseau |
| Styles inline dans le JS | `app.js` futur | Graphiste ne peut pas tout modifier |

---

## Signatures figées de core.js

Ces fonctions ne changent jamais de nom ni de comportement :

```javascript
DuramenCore.entree(lot)           // Ajouter du stock
DuramenCore.sortie(extraction)    // Retirer du stock
DuramenCore.getStock()            // Stock disponible par essence
DuramenCore.getHistorique()       // Log immuable
DuramenCore.validerEntree(lot)    // Retourne {ok, erreur}
DuramenCore.validerSortie(ext)    // Retourne {ok, erreur}
```

---

## Évolutions prévues (non planifiées)

- États du bois : brut / débité avec temps de séchage
- Vue cartographique des lots
- Notifications bois arrivant à maturité
- Queue de retry pour les opérations hors ligne

---

## Sécurité — Points d'attention avant mise en production

- Les clés de connexion Supabase (`SUPABASE_URL` et `SUPABASE_ANON_KEY`) sont actuellement en dur dans `duramen.html`. La clé anon est publique par conception mais avant mise en production, vérifier que les règles RLS (Row Level Security) de Supabase sont bien activées sur toutes les tables pour limiter l'accès aux seules communes authentifiées.
