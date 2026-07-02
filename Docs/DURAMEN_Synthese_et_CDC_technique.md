# DURAMEN — Synthèse de la restructuration et cahier des charges technique
*Tronc Commun — Avril 2026*

---

# PARTIE 1 — SYNTHÈSE DE LA RESTRUCTURATION

## Pourquoi restructurer ?

L'application DURAMEN existait déjà sous forme d'un fichier unique `duramen.html` de 2300 lignes. Elle fonctionnait — mais tout était mélangé dans le même fichier : les couleurs, les boutons, la logique métier, la connexion à la base de données. C'est comme un atelier où les outils, les matériaux et les plans de travail seraient empilés dans le même coin.

Problèmes concrets que ça posait :
- Un graphiste ne pouvait pas retoucher le design sans risquer de casser le code
- Ajouter une nouvelle fonctionnalité nécessitait de fouiller 2300 lignes
- Un bug dans une partie pouvait en casser une autre sans qu'on comprenne pourquoi
- Impossible de transmettre le projet à un développeur sans tout réexpliquer

La restructuration n'a pas changé ce que fait l'application — elle a changé comment c'est organisé.

---

## La logique de la restructuration

### Le principe fondateur

Avant de commencer, on a défini le cœur immuable de l'application :

```
ENTRÉE  →  [STOCK]  →  SORTIE
```

Tout le reste — les couleurs, l'interface, les nouvelles fonctionnalités — est une couche par-dessus ce principe. Le noyau ne change pas, il s'enrichit seulement.

### La métaphore utilisée

Ajouter une pièce à une maison plutôt qu'agrandir une pièce existante. Les murs porteurs ne bougent pas. Chaque nouvelle fonctionnalité sera une pièce indépendante qui s'ajoute sans fragiliser l'existant.

---

## Les 3 phases de restructuration

### Phase 0a — Isoler le design (Sessions 1, 2, 3)

**Objectif :** permettre à un graphiste de travailler sans risque de casser le code.

**Ce qui a été fait :**
Le CSS (les règles visuelles) a été extrait du fichier unique vers deux fichiers séparés :
- `theme.css` — la palette : toutes les couleurs, les polices, les tailles de base. Changer une valeur ici la change partout dans l'app.
- `ui.css` — les composants : comment ressemble chaque bouton, chaque carte, chaque formulaire.

905 lignes de CSS ont été déplacées. `duramen.html` ne contient plus aucune règle visuelle.

**Subtilité résolue :** des styles étaient aussi cachés dans le JavaScript (`style="font-size:1.6rem"`). 8 nouvelles classes CSS ont été créées pour les remplacer.

**Résultat :** le graphiste peut intervenir sur `theme.css` et `ui.css` à tout moment, sans jamais toucher au code.

---

### Phase 0b — Isoler le noyau métier (Session 4)

**Objectif :** protéger la logique "entrée → stock → sortie" dans un fichier intouchable.

**Ce qui a été fait :**
Le JavaScript a été séparé en deux fichiers :
- `core.js` — le noyau : les calculs de stock, les formules de débit, les validations. Ces fonctions ont des signatures figées qui ne changeront jamais.
- `app.js` — l'interface : la navigation, l'affichage, la connexion à Supabase, l'authentification.

774 lignes de JavaScript déplacées. `duramen.html` est passé de 1320 à 546 lignes de HTML pur.

**Résultat :** on peut modifier l'interface sans toucher aux calculs, et vice versa.

---

### Phase 0c — Corriger les bugs existants (Session 5)

**Objectif :** assainir la base avant d'ajouter de nouvelles fonctionnalités.

4 bugs corrigés :

| Bug | Impact | Correction |
|-----|--------|------------|
| Noms d'essences sans accents dans le code | Le delta de débit ne s'affichait jamais | Clés corrigées dans `core.js` |
| IDs basés sur l'horloge | Risque de collision si 2 saisies simultanées | Remplacement par UUID |
| Formulaire non sauvegardé | Saisie perdue si interruption terrain | Auto-sauvegarde à chaque champ |
| Pas de données sans réseau | App inutilisable en zone blanche | Cache local affiché hors ligne |

**Bug supplémentaire découvert :** la base de données Supabase attendait des nombres comme identifiants, mais le nouveau système génère des UUIDs (chaînes de texte). Migration SQL effectuée directement dans Supabase.

---

## Résultat final de la restructuration

```
AVANT                          APRÈS

duramen.html                   duramen.html    546 lignes  HTML pur
2300 lignes                    theme.css       ~50 lignes  couleurs, typo
tout mélangé                   ui.css          ~940 lignes composants visuels
                               core.js         ~200 lignes noyau métier
                               app.js          ~775 lignes interface + Supabase
```

L'application se comporte exactement comme avant — mais elle est maintenant transmissible, évolutive, et maintenable par n'importe quel développeur web.

---

---

# PARTIE 2 — CAHIER DES CHARGES TECHNIQUE

---

## Ce qu'est DURAMEN

DURAMEN est une application web progressive (PWA) de gestion du bois d'œuvre pour les communes de la Métropole Nantaise. Elle permet à chaque commune de saisir, suivre et partager ses stocks de bois issu d'abattages urbains — alignements, parcs, haies bocagères.

Son nom désigne le cœur du bois — la partie la plus dense et la plus durable. C'est l'ambition de l'outil : mettre au cœur de la gestion communale une information fiable, partagée, immédiatement utilisable.

---

## Utilisateurs cibles

- **Agents techniques communaux** : jardiniers, responsables espaces verts, agents voirie
- Aisance numérique modérée — utilisent un smartphone mais pas d'applications complexes
- Contexte d'usage : terrain, souvent entre deux interventions, réseau instable
- Besoin clé : saisie rapide, résultat immédiat, pas de formation préalable

---

## Technologies utilisées

| Composant | Choix | Pourquoi |
|-----------|-------|----------|
| Langage | HTML5 + CSS3 + JavaScript | Standard universel, lisible par tout développeur web |
| Base de données | Supabase (PostgreSQL) | Open source, données exportables, pas de dépendance éditeur |
| Type d'app | PWA (Progressive Web App) | Fonctionne sur tout mobile via navigateur, sans installation de store |
| Framework | Aucun | Code stable dans le temps, pas de migration forcée |

**Ce que ça signifie concrètement :** l'application fonctionne sur le téléphone déjà dans la poche de l'agent. Pas de téléchargement, pas d'abonnement, pas de formation. Elle fonctionnera encore dans 10 ans sans modification.

---

## Architecture des fichiers

```
duramen.html     Structure des pages (HTML pur — 546 lignes)
theme.css        Palette de couleurs et typographie
ui.css           Composants visuels (boutons, cartes, formulaires)
core.js          Noyau métier : calculs de stock et de débit
app.js           Interface utilisateur et connexion base de données
manifest.json    Configuration PWA
sw.js            Service Worker (mode hors ligne) — à créer
```

**Règle de séparation :** chaque fichier a un rôle unique. Un graphiste ne touche qu'à `theme.css` et `ui.css`. Un développeur de fonctionnalités ne touche qu'à `core.js` et `app.js`. Jamais les deux en même temps.

---

## Fonctionnalités visibles (ce que l'agent voit)

### 1. Authentification par code commune
Chaque commune dispose d'un code d'accès unique (ex: `BRAINS-H2NX`). Ce code est saisi une seule fois — l'application mémorise la commune pour les sessions suivantes. La déconnexion est possible à tout moment.

Les codes sont gérés dans Supabase (table `codes_acces`). Désactiver une commune = passer `actif = false` dans le dashboard, sans toucher au code.

### 2. Saisie d'un lot de bois — formulaire en 3 étapes

**Étape 1 — Informations du lot**

| Champ | Type | Obligatoire |
|-------|------|-------------|
| Nom du lot | Texte libre | ✅ |
| Essence de l'arbre | Menu déroulant (19 essences) | ✅ |
| Commune | Texte (mémorisé après 1ère saisie) | — |
| Cause d'abattage | Menu déroulant | ✅ |
| Provenance | Menu déroulant | ✅ |
| Année de coupe | Menu déroulant (2020–2030) | ✅ |
| Usage prévu | Menu déroulant | ✅ |
| Partage territorial | Interrupteur oui/non | — |

**Étape 2 — Saisie des grumes**

Pour chaque grume (tronçon de bois) :
- Longueur en mètres
- Diamètre au petit bout en centimètres
- Calcul automatique du volume (formule de Huber : π × r² × L)

**Étape 3 — Calcul de débit**

- Épaisseur de planche souhaitée (en mm)
- Calcul automatique des volumes utiles, déchets, nombre de planches, linéaire
- Formule : `V_débits = V_grume × 0.55 × (e / (e + 3))`
  - 0.55 = rendement matière fixe
  - e = épaisseur en mm
  - 3 mm = trait de scie fixe

### 3. Vue Stock
Volumes disponibles par essence, en temps réel. Mise à jour automatique toutes les 2 minutes. Bouton d'extraction directement depuis cette vue.

### 4. Vue Extractions
Saisie d'une sortie de stock :
- Essence et volume prélevé
- Usage de destination
- Destinataire, commune, contact
- Notes libres

Vérification automatique que le volume extrait ne dépasse pas le stock disponible.

### 5. Vue Historique
Liste de tous les lots enregistrés par la commune, avec leurs caractéristiques complètes et les données de débit. Suppression possible avec confirmation.

### 6. Vue Territoire
Consultation en lecture seule des lots partagés par les autres communes. Synthèse par commune : volume total, nombre de lots, essences disponibles. Un lot n'apparaît dans cette vue que si l'agent a activé le partage lors de la saisie.

### 7. Export CSV
Deux exports disponibles :
- Export des lots (avec toutes les données de débit)
- Export du stock par essence

Format compatible Excel, encodage UTF-8 avec BOM pour les caractères français.

---

## Fonctionnalités invisibles (ce que l'agent ne voit pas)

### Identifiants UUID
Chaque lot et chaque extraction reçoit un identifiant unique généré par le navigateur (`crypto.randomUUID()`). Format : `a3f2c1d0-7b4e-4c8a-9d1f-2e5b8c3a7f9e`. Zéro risque de collision même si plusieurs agents saisissent simultanément.

### Auto-sauvegarde du brouillon
Dès qu'un agent commence à remplir le formulaire, chaque champ saisi est automatiquement sauvegardé sur l'appareil (clé `duramen_draft`). Si l'agent reçoit un appel, ferme l'onglet par erreur, ou si le téléphone se met en veille — la saisie est intacte. Au prochain chargement, l'app propose : "Reprendre la saisie en cours ?"

### Cache hors ligne
À chaque chargement réussi depuis Supabase, les données sont copiées sur l'appareil (clés `duramen_lots_cache` et `duramen_extractions_cache`). Si le réseau est absent au prochain chargement, l'app affiche les dernières données connues avec un bandeau "⚡ Données hors ligne — affichage du dernier cache".

### Session persistante
Le code d'accès est mémorisé dans le navigateur. L'agent n'a pas à se reconnecter à chaque utilisation. La commune est également mémorisée et pré-remplie dans le formulaire.

### Rafraîchissement automatique
Les données sont rechargées depuis Supabase toutes les 2 minutes si l'app est ouverte, pour maintenir les données à jour sans intervention de l'agent.

### Calcul de débit automatique
La formule de Huber calcule le volume de chaque grume dès que longueur et diamètre sont saisis. Le rendement de débit est calculé instantanément selon l'épaisseur choisie. L'agent voit le résultat sans faire aucun calcul.

---

## Base de données Supabase

### Tables

**`lots`** — chaque lot de bois enregistré

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique généré par le navigateur |
| commune_code | text | Code d'accès de la commune |
| nom | text | Nom du lot donné par l'agent |
| essence | text | Essence de l'arbre |
| commune | text | Nom de la commune |
| cause | text | Cause d'abattage |
| provenance | text | Origine du bois |
| annee | integer | Année de coupe |
| usage | text | Usage prévu |
| vol_brut | float | Volume brut total en m³ |
| vol_utile | float | Volume débitable en m³ |
| vol_dechets | float | Volume de déchets en m³ |
| nb_grumes | integer | Nombre de grumes |
| nb_planches | integer | Nombre de planches estimé |
| lineaire | float | Linéaire total en mètres |
| epaisseur | integer | Épaisseur de planche en mm |
| delta | float | Rendement de débit en % |
| grumes | json | Tableau des grumes individuelles (longueur, diamètre, volume) |
| partage | boolean | Visible dans la vue Territoire ? |
| date | text | Date de saisie (format français) |
| created_at | timestamp | Date de création (automatique Supabase) |

**`extractions`** — chaque sortie de stock

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| commune_code | text | Code d'accès de la commune |
| essence | text | Essence extraite |
| volume | float | Volume en m³ |
| usage | text | Usage de destination |
| destination | text | Nom du destinataire ou projet |
| commune | text | Commune destinataire |
| contact | text | Contact |
| notes | text | Notes libres |
| date | text | Date (format français) |
| date_iso | text | Date ISO 8601 |

**`codes_acces`** — gestion des accès communes

| Colonne | Type | Description |
|---------|------|-------------|
| code | text | Code d'accès (ex: BRAINS-H2NX) |
| commune | text | Nom de la commune |
| actif | boolean | Accès actif ou désactivé |

### Gestion des accès
Les codes sont stockés uniquement dans Supabase. Pour ajouter une commune : INSERT dans `codes_acces`. Pour désactiver : passer `actif = false`. Aucune modification du code de l'application nécessaire.

---

## Design System

**Palette de couleurs**

| Nom | Valeur | Usage |
|-----|--------|-------|
| Craie | `#F2EDE4` | Fond principal |
| Sable | `#E0D5C4` | Fond secondaire, hover |
| Lin | `#C9BAA3` | Bordures légères |
| Cendre | `#7A7469` | Textes secondaires |
| Encre | `#1A1814` | Texte principal, header |
| Signal | `#4B6FBF` | Accent, boutons, onglet actif |
| Rouge | `#c0392b` | Erreurs, suppression |
| Orange | `#d35400` | Alertes |

**Typographie**
- Titres : `Unbounded` (Google Fonts)
- Sous-titres éditoriaux : `Instrument Serif` italic
- Corps et interface : `DM Sans`

**Contraintes UX terrain**
- Boutons minimum 44×44px (cibles tactiles)
- Contrastes élevés pour lisibilité en plein soleil
- Formulaires courts, labels clairs
- Confirmations explicites avant toute suppression

---

## Essences gérées

Aulne, Châtaignier, Chêne, Cyprès, Douglas, Épicéa, Frêne, Hêtre, Mélèze, Merisier, Noyer, Peuplier, Pin maritime, Pin sylvestre, Platane, Robinier (Acacia), Séquoia, Tilleul, Autre.

Pour chaque essence : delta de débit recommandé (%) et usage typique documenté dans `core.js`.

---

## Causes d'abattage gérées

Coupe sanitaire, Intempérie (chablis, neige…), Entretien courant, Aménagement urbain, Renouvellement plantation.

---

## Provenances gérées

Alignement urbain, Bosquet, Forêt, Haie bocagère, Parc municipal.

---

## Points de vigilance avant mise en production

### Sécurité Supabase
Les clés de connexion Supabase (`SUPABASE_URL` et `SUPABASE_ANON_KEY`) sont actuellement dans `app.js`. La clé `anon` est publique par conception — Supabase sécurise l'accès via les règles RLS (Row Level Security). Avant déploiement public, vérifier que ces règles sont bien activées sur toutes les tables pour limiter l'accès aux seules communes authentifiées.

### Service Worker
Le fichier `sw.js` (mode hors ligne avancé + installation sur l'écran d'accueil) n'est pas encore créé. L'app fonctionne sans lui, mais l'installation en tant qu'app mobile et le cache complet des assets ne sont pas disponibles.

### Données existantes
Les données saisies lors des tests sont dans Supabase. Les IDs ont été migrés de `bigint` vers `uuid` — les anciennes données ont reçu de nouveaux UUIDs automatiquement lors de la migration.

---

## Évolutions planifiées

### Phase 1 — États du bois (priorité haute)
Ajouter la notion d'état : bois **brut** (utilisable immédiatement) ou bois **débité** (en séchage, avec date de disponibilité). Le stock afficherait les deux catégories séparément.

### Backlog — Évolutions futures
- Service Worker + installation PWA sur écran d'accueil
- Queue de retry pour saisies faites hors ligne (synchronisation au retour du réseau)
- Vue cartographique des lots par commune
- Notifications pour les bois arrivant à maturité de séchage
- Bouton "Retour" intégré — feedback terrain sans quitter l'app, stocké dans une table Supabase `feedbacks`
- Remplacement des boîtes de dialogue natives (`alert`, `confirm`) par des modals accessibles

---

## Gouvernance et propriété

**Tronc Commun** est l'éditeur et propriétaire de l'application DURAMEN.

**Les communes possèdent leurs données** — lots, stocks, extractions leur appartiennent, sont exportables à tout moment, et ne peuvent être utilisés sans leur consentement.

**Le code source** reste la propriété intellectuelle de Tronc Commun. Les communes utilisatrices n'ont pas de droit de redistribution ou de modification de l'application.

---

*Document généré le 19 avril 2026 — Tronc Commun*
*contact.tronccommun@gmail.com — SIRET 985 323 146 00011*

---

## Voir aussi

- [[MEMORY]] — état courant du projet (plus récent que ce document)
- [[DESIGN_SYSTEM]] — détail de la charte visuelle
- [[TASKS]] — avancement par rapport aux objectifs décrits ici
