# TASKS.md — Suivi des tâches DURAMEN

> Source de vérité pour l'avancement du projet.
> Mettre à jour à chaque fin de session Claude Code.

---

## Tâches terminées

| Tâche | Session | Date |
|-------|---------|------|
| Mobile : icônes au trait, marge unique 24 px, chiffres en colonne, plus d'aplat noir, arrondi des fiches (cache v93) | Design | 25 nov. 2026 |
| Pages Nouveau, Stock, Extraction épurées, bande de qualité 14 px, hachures denses (cache v91) | Design | 25 nov. 2026 |
| Accueil en liste reliée, trait fin, couleurs « Terre et sépia » (cache v90) | Design | 25 nov. 2026 |
| Architecture 5 fichiers (index.html, theme.css, ui.css, core.js, app.js) | Structure | Avant avril 2026 |
| Migration UUID (lots + extractions) | Feature | 19 avril 2026 |
| Service Worker sw.js (offline + cache) | Feature | Avant 24 avril 2026 |
| Écran connexion — mockup mobile intégré ✅ | Design | 24 avril 2026 |
| Écran accueil mobile — mockup intégré ✅ | Design | 24 avril 2026 |
| Routing post-connexion vers accueil sur mobile ✅ | Feature | 24 avril 2026 |
| Données live accueil (commune, stock, réseau) ✅ | Feature | 24 avril 2026 |
| Header et footer masqués sur mobile ✅ | Design | 24 avril 2026 |
| Suppression div .header-stats-mobile du HTML ✅ | Design | 24 avril 2026 |
| Styles inline groupes A+B+C supprimés — `.toast-erreur`, `.btn-deconnexion`, `.commune-locked`, `#header-stats .commune-chip` ✅ | app.js + ui.css | 24 avril 2026 |
| Boutons accueil — icône SVG + sous-titre + flèche ›, suppression indicateur réseau ✅ | Design | 24 avril 2026 |
| Badge commune border-radius 20px + icône "Voir le stock" fond indigo ✅ | Design | 24 avril 2026 |
| Groupe D : 30 occurrences style.display → classList + .hidden ✅ | app.js + ui.css + index.html | 24 avril 2026 |
| Formulaire "Ajouter au stock" — conformité charte design ✅ | theme.css + ui.css | 25 avril 2026 |
| Refonte page Historique — toggle Ma commune / Communauté, blocs, barres, export ✅ | app.js + ui.css + index.html | 25 avril 2026 |
| Navigation 4 onglets — Accueil · Nouveau · Stock · Extraction ✅ | app.js + index.html | 25 avril 2026 |
| Écran Nouveau — bottom sheet grumes + cartes résumé + modale nommer le lot ✅ | app.js + ui.css | 25 avril 2026 |
| Écran Extraction — sélection grumes, bascule brute/débit, sliders, linéaire, modale destination ✅ | app.js + ui.css + index.html | 25 avril 2026 |
| Bug double `id="lot-nom"` ✅ corrigé (vérifié : une seule occurrence ligne 178) | index.html | 26 avril 2026 |
| Fix hors ligne : theme.css + core.js + app.js ajoutés au cache SW, stratégie cache-first, cache v20 ✅ | sw.js | 2 mai 2026 |
| Interface bureau /bureau/ — header stats, 4 onglets, commune, métropole, export, ticket retour ✅ | bureau/* | 2 mai 2026 |
| 9 améliorations bureau : tabs, donut bois, modale extraction, suppression colonne droite, zebra ✅ | bureau/* | 2 mai 2026 |
| **Audit sécurité et précision — session 11 mai 2026** | | |
| R1 — Labels `m³ bruts` (décision `vol_utile = vol_brut` assumée) ✅ | `app.js`, `index.html` | 11 mai 2026 |
| R2 — Formule volume bureau : `V × rg × (e/(e+t))` ✅ | `bureau/app.js` | 11 mai 2026 |
| R3 — Overlays morts supprimés (`b-grumes-overlay`, `b-dest-overlay`) ✅ | `bureau/index.html` | 11 mai 2026 |
| R4 — `afficherTerritoire()` réécrite avec DOM pur ✅ | `app.js` | 11 mai 2026 |
| R5 / S1 — `getStock()` : guard `typeof` + `extsData.forEach` ✅ | `core.js` | 11 mai 2026 |
| R7 — `DuramenCore.sortie()` fantôme supprimé de `soumettreSortie()` ✅ | `app.js` | 11 mai 2026 |
| R9 — Linéaire bureau : `util × 5000 / ep` ✅ | `bureau/app.js` | 11 mai 2026 |
| R10 — Précision volumes bureau harmonisée `.toFixed(3)` ✅ | `bureau/app.js` | 11 mai 2026 |
| R11 — Barres de stock via `--barre-pct` (CSS custom property) ✅ | `app.js`, `ui.css` | 11 mai 2026 |
| S2 — Cache SW incrémenté `duramen-v29` → `duramen-v30` ✅ | `sw.js` | 11 mai 2026 |
| S3 — 4 volumes mobile harmonisés `.toFixed(3)` ✅ | `app.js` | 11 mai 2026 |
| S4 — Tableau métropole, chips, entêtes lot : données Supabase via DOM pur ✅ | `bureau/app.js` | 11 mai 2026 |
| S5 — Styles inline déplacés vers `bureau/ui.css` (`.b-donut-vide`, `.b-chips-vide`) ✅ | `bureau/app.js`, `bureau/ui.css` | 11 mai 2026 |
| S6 — Légende donut commune (`ess`) via `textContent` ✅ | `bureau/app.js` | 11 mai 2026 |
| S7 — Légende donut métropole (`seg.nom`) via `textContent` ✅ | `bureau/app.js` | 11 mai 2026 |
| S8 — Lignes grume via DOM pur ✅ | `bureau/app.js` | 11 mai 2026 |
| D1 — `bAfficherEssences()` supprimée (code mort) ✅ | `bureau/app.js` | 11 mai 2026 |
| D2 — Règles CSS orphelines `.b-grumes-overlay` / `.b-dest-overlay` supprimées ✅ | `bureau/ui.css` | 11 mai 2026 |
| **Audit profond — session 2 juillet 2026** (commit 203ba35) | | |
| A1 — Sélection extraction protégée du rafraîchissement auto : `extractionEnCours()` saute la reconstruction de l'écran si sélection / filtre / modale en cours ✅ | `app.js` | 2 juillet 2026 |
| A3 — Code mort supprimé : `chargerCommunesExtraction` + `remplirCommunesSel` téléchargeaient les codes d'accès de toutes les communes (risque de fuite) ✅ | `app.js` | 2 juillet 2026 |
| A4 — Totaux vue Communauté : déjà corrigé le 24 juin (be1cc64 + 1b0c70c), constaté lors du rebase ✅ | `app.js` | 24 juin 2026 |
| Cache SW incrémenté `duramen-v32` → `duramen-v33` ✅ | `sw.js` | 2 juillet 2026 |
| A2 — Audit RLS Supabase : RLS actif sur les 4 tables ; `lots`/`extractions` bien isolées via `get_commune_code()` ; 🔴 fuite confirmée sur `codes_acces` (policy `actif = true` = lecture de tous les codes). Constat sans modification. ✅ | Supabase (hors code) | 2 juillet 2026 |
| A2-fix — Fuite `codes_acces` bouchée : RPC `verifier_code(code_saisi)` (security definer, search_path figé), connexion mobile + bureau adaptées (commit 4a56b15), policies SELECT supprimées + `revoke select`. Vérifié : lecture directe → `permission denied`, connexion OK ✅ | Supabase + `app.js` + `bureau/app.js` | 2 juillet 2026 |
| A5 — Verrou anti sur-extraction : trigger `trg_verifier_stock` (verrou d'exclusion par commune+essence, tolérance 0,0001) + côté client re-validation sur données fraîches, envoi groupé tout-ou-rien, message « STOCK INSUFFISANT » (commit 3b0d41d). Testé : refus stock vide, acceptation normale, refus au seuil exact ✅ | Supabase + `app.js` | 2 juillet 2026 |
| Bug bloquant découvert et réparé : l'enregistrement d'extraction échouait (HTTP 400) depuis les refontes d'avril — le code envoyait 7 colonnes inexistantes. Colonnes créées dans `extractions` : `cause_abattage`, `type_sortie`, `vol_brut_extrait`, `type_valorisation`, `lineaire`, `projet`, `commune_installation` ✅ | Supabase (hors code) | 2 juillet 2026 |
| Cache SW incrémenté `duramen-v33` → `duramen-v35` ✅ | `sw.js` | 2 juillet 2026 |
| Fusion des 3 branches du soir (A10, brouillon, A6) — cache SW `duramen-v35` → `duramen-v38` ✅ | `sw.js` | 2 juillet 2026 |
| Mise en ligne : déploiement GitHub Pages échoué (incident passager GitHub), relancé par commit vide — site vérifié en v38 ✅ | GitHub Pages (hors code) | 2 juillet 2026 |
| **Scan profond — session 7 juillet 2026** (A14 à A19 relevés, voir Prochaines tâches) | | |
| A14 — Bureau : en-tête `x-commune-code` posé dans `bLancerApp()` — la session restaurée au rechargement ne le renvoyait plus (extractions et lots privés invisibles, stock surestimé, risque de double extraction) ✅ | `bureau/app.js` | 7 juillet 2026 |
| A16 — Case « Partager avec toutes les communes » décochée à chaque ouverture de la modale « Nommer le lot » (elle gardait l'état du lot précédent) ✅ | `app.js` | 7 juillet 2026 |
| Cache SW incrémenté `duramen-v38` → `duramen-v39` ✅ | `sw.js` | 7 juillet 2026 |
| Fiche Destination (extraction mobile) allégée : champs « Usage » et « Cause de l'abattage » retirés ; `usage` enregistré « Non défini » en base (exigé par `validerSortie`, noyau figé), `cause_abattage` vide. Restent : nom du projet, commune (lecture seule), lieu optionnel ✅ | `app.js` | 7 juillet 2026 |
| Cache SW incrémenté `duramen-v39` → `duramen-v40` ✅ | `sw.js` | 7 juillet 2026 |
| Modale extraction bureau alignée : choix « Usage » (Intérieur/Extérieur) retiré de l'étape Destination, `usage` enregistré « Non défini » comme sur mobile. Pas d'incrément SW (fichiers bureau hors cache) ✅ | `bureau/app.js`, `bureau/index.html` | 7 juillet 2026 |
| **Préparation du lancement — session 31 octobre 2026** | | |
| Volumes alignés au millième de m³ (1 dm³), usage de la filière (règles de mesurage ATIBT). Fonctions `arrondiM3()` et `volumeSortie()` dans les 2 apps. Une sortie qui emporte les dernières grumes d'une essence vaut exactement le stock restant : le stock tombe à zéro. Testé sur 20 000 scénarios : aucun refus, aucun reste. Corrige A19 ② et ③ ✅ | `app.js`, `bureau/app.js` | 31 octobre 2026 |
| Cache SW incrémenté `duramen-v40` → `duramen-v41` ✅ | `sw.js` | 31 octobre 2026 |
| A12 (partie 1) — Code secret masqué au partage : les lots partagés sont lus par la fonction `lots_partages()` (security definer), qui ne renvoie jamais `commune_code` et exclut les communes de test. Mobile et bureau l'utilisent. La policy `lots_select` ne laisse plus lire que ses propres lots. Testé : une commune lit les lots partagés des autres sans leur code ✅ | Supabase + `app.js` + `bureau/app.js` | 31 octobre 2026 |
| Cache SW incrémenté `duramen-v41` → `duramen-v42` ✅ | `sw.js` | 31 octobre 2026 |
| **Grumes, campagne de sciage, envoi hors ligne — fusion du 3 novembre 2026** | | |
| Branches `fix/envoi-hors-ligne`, `feat/grumes` et `feat/campagne-sciage` fusionnées dans `main`. Une saisie = une grume (VER-0000), partage automatique, campagne de sciage, feuille de débit, stock produits, sortie de produits sciés, file d'envoi hors ligne ✅ | toute l'application + Supabase | 3 novembre 2026 |
| Scan avant fusion : syntaxe, liens HTML/JS/CSS, noyau figé intact, champs envoyés = colonnes Supabase, sécurité par commune active sur toutes les tables ✅ | toute l'application + Supabase | 3 novembre 2026 |
| Nettoyage : restes de l'ancien débit en planches (mobile), fonction et couleurs inutilisées (bureau), 31 classes inutilisées (`ui.css`), 75 classes inutilisées (`bureau/ui.css`). Testé dans un navigateur avant/après : 20 écrans identiques au pixel près, aucune erreur ✅ | `app.js`, `bureau/app.js`, `ui.css`, `bureau/ui.css` | 3 novembre 2026 |
| Cache SW incrémenté `duramen-v52` → `duramen-v53` ✅ | `sw.js` | 3 novembre 2026 |
| Point de retour : branche de sauvegarde `sauvegarde/avant-fusion-2026-11-03` sur l'ancienne version de `main` (procédure dans GIT_WORKFLOW.md) ✅ | GitHub | 3 novembre 2026 |
| Mise à jour en une seule ouverture : rechargement automatique quand la nouvelle version est prête (`controllerchange`), recherche de mise à jour au retour de l'arrière-plan. Testé navigateur : pas de rechargement à la 1re installation, nouvelle version dès la 1re ouverture ✅ | `index.html` | 3 novembre 2026 |
| Cache SW incrémenté `duramen-v53` → `duramen-v54` ✅ | `sw.js` | 3 novembre 2026 |
| **Saisie de grume et débit — fusion du 4 novembre 2026** | | |
| `feat/saisie-grume` fusionnée : date d'abattage (ou « Inconnue »), provenance et cause « Inconnue », numéro 5 chiffres avec zéros automatiques, « Numéroter plus tard » + attribution depuis le stock, pas de débit sans numéro (app + base) ✅ | `core.js`, `app.js` + Supabase | 4 novembre 2026 |
| `feat/debit-epaisseurs` fusionnée : épaisseurs 27/34/41/54 + « Autre » (10–150 mm), plusieurs épaisseurs par grume, séchage 1 cm/an par face ✅ | `core.js`, `app.js` | 4 novembre 2026 |
| Tests navigateur sur la version fusionnée (base imitée) + règles de la base testées dans Supabase ✅ | — | 4 novembre 2026 |
| Cache SW incrémenté `duramen-v54` → `duramen-v56` ✅ | `sw.js` | 4 novembre 2026 |
| Premier ticket retour : corriger une grume après une erreur de saisie. Bouton « Corriger » sur chaque grume du stock de sa commune. Tout se corrige sauf le numéro, tant que la grume n'est dans aucune campagne de sciage. Le volume se recalcule. Fusionné ✅ | `core.js`, `app.js` + Supabase | 19 novembre 2026 |
| Molettes de mesure élargies : diamètre jusqu'à 150 cm, circonférence jusqu'à 471 cm, longueur jusqu'à 12 m. Saisie et correction. Fusionné, cache `duramen-v64` ✅ | `app.js`, `sw.js` | 19 novembre 2026 |

---

## Prochaines sessions (décidé le 25 nov. 2026)

Chaque session se lance dans une nouvelle conversation, dans cet ordre.

| # | Session | À faire | Déjà décidé | À trancher en début de session |
|---|---------|---------|-------------|--------------------------------|
| 1 | ✅ **Couleurs de l'app mobile** (Design : `theme.css`, `ui.css`) — fait le 25 nov. 2026, cache v80 (voir MEMORY.md) | Sur mobile, la couleur des essences (pastille, barre) et la couleur d'état de la grume (bande gris clair, or, ardoise) se confondent. Les penser ensemble. | Palette D retenue pour la cartographie. États : standard gris clair, exceptionnelle or, mauvais état ardoise. | Garder les couleurs du bois sur mobile ou passer à la palette D ; comment séparer visuellement essence et état. Faire une proposition avant tout changement (tablettes de Nantes). |
| 2 | ✅ **Accès Tronc Commun** à toutes les communes (Supabase) — fait le 25 nov. 2026 : code de lecture à part (table `acces_lecture`, en-tête `x-code-lecture`, fonctions `tc_grumes`, `tc_sorties`, `tc_campagnes`, `tc_verifier`), voir MEMORY.md | Créer un accès propre à Tronc Commun, en lecture seule sur toutes les communes, distinct des codes des communes. Tester les règles de la base. | Accord donné (projet expérimental, données non sensibles). Session à part, pour réfléchir sereinement. | Forme de l'accès (code dédié, rôle) ; lien avec la tâche 3d (A12 : séparer identifiant public et code secret). |
| 3 | ✅ **Construction de la carte** — faite le 25 nov. 2026 (dépôt `cartographie`, voir MEMORY.md) | Partir de la simulation (`carte-simulation.zip` du coffre), brancher les vraies données et la connexion par code commune. Ajouter la colonne « lieu » et son remplissage à l'arrivée de la grume. Lien « Voir la carte » dans l'export du bureau. | Application à part, en lecture seule. Nom du lieu enregistré dans la base. Fonds : vue aérienne adoucie + noms de rues, plan épuré. Palette D. Critères en boutons. Cercles par critère. | Dépôt `carte` public publié par GitHub Pages (à créer par le porteur dans l'organisation) ; palette D déclinée pour les 21 essences le 25 nov. 2026 : reprendre les valeurs de `theme.css`. |

| 4 | ✅ **Nettoyage** — fait le 25 nov. 2026 (208 lignes en moins). Reste : bilan de santé (hors ligne, lenteurs) et retrait de la passerelle après validation terrain | Relire tout le code (mobile, bureau, carte) et retirer les fonctions qui ne servent plus (ex. `questionGrosBout` dans `core.js`, `ESSENCE_COULEURS` au bureau, ancienne passerelle Supabase une fois validée sur le terrain). Vérifier la bonne santé de l'app : erreurs, hors ligne, cache, règles de la base, lenteurs. | Demande du porteur du 25 nov. 2026. Les fonctions figées de `core.js` ne sont jamais retirées. | Ce qui peut être retiré sans risque pour les téléphones pas encore à jour. |

Faits aussi le 25 nov. 2026 : nom du parc (mobile, bureau, carte), pictogrammes cernes, bouton « Voir la carte » (mobile et bureau) avec transmission du code, graphisme « trait à main levée » (mobile, tablette, bureau), camembert du bureau aux couleurs des essences, colonnes Parc et Lieu à l'export.

À suivre : essai sur une vraie tablette de Nantes ; essai réel de la reprise du code sur iPhone (app installée) ; cote exacte de la scierie ; décision sur le bouton iPhone « Préremplir le contact ».

Plus tard : plan IGN dessiné sur mesure (tuiles vectorielles) ; signaler les points tombés dans l'eau ; calques suivants de la synthèse (stockage, produits, ouvrage).

---

## Tâches en cours

Suites de la fusion du 3 nov. 2026 :

| Étape | État |
|-------|------|
| Retours terrain du 24 nov. : causes revues, « Autre » mémorisé (cause, essence), état de la grume (à part), marque « Débit externe », circonférence retirée. Branche `feat/grumes-a-part` | ✅ Validée et fusionnée dans `main` le 24 nov. 2026 (cache v68) |
| GPS précis pendant la saisie, marge d'erreur affichée, placement à la main au bureau. Branche `feat/gps-precis` | ✅ Validée et fusionnée dans `main` le 24 nov. 2026 (cache v68) |
| Trois couleurs d'état de grume : standard gris clair, exceptionnelle or (`--or`), mauvais état ardoise (`--ardoise`). Mobile et bureau | ✅ Fusionné le 24 nov. 2026 (cache v71) |
| Stock mobile allégé : bilan à une date et boutons d'export retirés (ils restent au bureau) | ✅ Fusionné le 24 nov. 2026 (cache v71) |
| Fiche de grume allégée (numéro, essence, cubage, date de débit ; bande de couleur d'état ; toucher = Corriger), titre « date de débit du + au − urgent », règle des 80 cm sans question, « débit externalisé ». Branche `feat/fiche-grume-allegee` | ✅ Fusionnée le 24 nov. 2026 (cache v74) |
| Nom de la tempête (cause Intempérie), noms partagés entre toutes les communes. Branche `feat/nom-tempete` | ✅ Fusionnée le 24 nov. 2026 (cache v74), 73 vérifications |
| Boutons de choix de l'état aux couleurs de l'état (gris clair, or, ardoise) | ✅ Fusionné le 24 nov. 2026 (cache v75) |
| Couleurs d'essence en palette « Atelier » (21 essences) ; bande d'état : standard presque invisible, or, ardoise hachurée. Branche `feat/couleurs-atelier` | ✅ Fusionnée le 25 nov. 2026 (cache v79) |
| Mot écrit sur la fiche du stock : « Exceptionnelle » ou « Mauvais état ». Branche `feat/badge-etat-fiche` | ✅ Fusionnée le 25 nov. 2026 (cache v80) |
| Synthèse : maquette fusionnée dans `main` du dépôt `synthese`, mêmes couleurs que l'app, logo Duramen Cartographie sur chaque carte | ✅ Fait le 25 nov. 2026 |
| iPhone : bouton « Préremplir le contact » au-dessus du clavier en nommant une grume (remplissage automatique de Safari). Proposé : renommer le champ et retirer « Numéro » du titre | En attente de décision |
| Diamètre au plus large : dès 60 cm de Ø médian, deuxième mesure ; débit externalisé si le plus grand des deux atteint 80 cm ; calcul fait par la base et recalculé si la limite change. Branche `feat/diametre-plus-large` | ✅ Fusionnée le 24 nov. 2026 (cache v78) |
| Tablettes (service de Nantes) : version téléphone jusqu'à 1199 px (barre du bas, accueil, ticket retour), contenu centré sur 680 px. Captures téléphone et ordinateur identiques au pixel près avant/après, tests à 390, 768 et 1180 px. Branche `feat/tablette` | ✅ Fusionnée le 24 nov. 2026 (cache v78). À essayer sur une vraie tablette du service de Nantes |
| Cote exacte du gros bout accepté par la scierie mobile : 80 cm provisoire, à confirmer avec le scieur (réglage `diametre_gros_bout_max_cm` dans la table `reglages`, sans toucher au code) | À faire (porteur) |
| Garder la passerelle Supabase (vue `lots`, fonction `lots_partages()`, colonne `extractions.cause_abattage`) tant que la nouvelle version n'est pas validée sur le terrain : c'est elle qui permet de revenir à l'ancienne version. Ensuite, la supprimer | En attente de validation terrain |
| Version bureau : illustration de la page d'accueil (`bureau/illustration-accueil.jpg`, © Paquito Couet pour Tronc Commun) | ✅ Fait le 14 nov. 2026 |
| Version mobile : la connexion gardée sur le téléphone n'est jamais revérifiée. Un téléphone encore connecté avec l'ancien code `LOCKELN-D7WA` affiche toujours « Lockeln ». Le bureau est corrigé (13 nov. 2026) | À faire |
| Supprimer une grume saisie par erreur, mobile et bureau, avec trace dans la base (`grumes_supprimees`). Branche `feat/supprimer-grume`, testée dans un navigateur | ✅ Validée et fusionnée dans `main` le 20 nov. 2026 |
| Version bureau : corriger une grume depuis l'onglet Grumes, mêmes règles que le mobile. Branche `feat/bureau-corriger-grume`, testée dans un navigateur | ✅ Validée et fusionnée dans `main` le 19 nov. 2026 |
| Version bureau refaite sur la branche `feat/bureau-campagnes` : grumes, campagnes de sciage, produits bois, projets (réalisation et pose), métropole, export tableur. Verrous ajoutés dans la base. Testée dans un navigateur (87 vérifications) | ✅ Validée par le porteur et fusionnée dans `main` le 13 nov. 2026 |

---

## Prochaines tâches

| # | Tâche | Session | Priorité |
|---|-------|---------|----------|
| 1 | Responsive desktop : layout bureau distinct du layout mobile | Design | ✅ Fait |
| 2 | Icône PWA : fond `--indigo` + icône blanche (coordonner avec graphiste) | Design | Basse |
| 3 | ~~A2 — Vérifier RLS Supabase~~ ✅ audité le 2 juil. : RLS actif, `lots`/`extractions` isolées serveur, fuite trouvée sur `codes_acces` | Supabase (hors code) | ✅ Fait |
| 3b | ~~🔴 A2-fix — Boucher la fuite `codes_acces`~~ ✅ fait le 2 juil. (RPC `verifier_code` + policies fermées) | Supabase + Feature | ✅ Fait |
| 3c | ~~🟠 A2-dur — Figer le `search_path` de `get_commune_code`~~ ✅ fait le 2 juil. (`alter function … set search_path = public`), lecture par commune revérifiée | Supabase (hors code) | ✅ Fait |
| 3d | 🟠 A12 — ✅ partie 1 faite le 31 oct. : le code n'est plus visible au partage. Reste : séparer identifiant public / code secret, puis régénérer les codes (des lots ont été partagés avant le 31 oct.). Constat d'origine : les codes d'accès servent d'identifiant de commune : `lots.commune_code` expose les codes secrets via les lots partagés (`partage=eq.true`, lisibles **sans authentification**). Séparer identifiant public / code secret (touche tables, RLS, `get_commune_code`, les 2 apps), puis **régénérer tous les codes**. À coupler avec la remise à zéro des données. | Supabase + Feature | **Haute** |
| 3e | Atelier modèle de données avec le commanditaire (avant la remise à zéro) : cheminement complet de la grume — identifiant par grume (fusion avec A6), géolocalisation à chaque étape (abattage → stockage → destination), liste définitive des champs d'extraction | Décision projet | **Haute** |
| 3f | 🔴 A13 — Commune fictive « Lockeln » (code `LOCKELN-D7WA`) : nom halluciné lors du remplissage initial de `codes_acces` (avril 2026), à la place de **Basse-Goulaine** — identifiée le 7 juil. 2026 en comparant la table à la liste officielle des 24 communes de Nantes Métropole. Bug isolé, sans incidence (Basse-Goulaine n'a jamais eu de code ni de données ; a servi de commune de test). **À faire avec la remise à zéro (A12)** : ① supprimer la ligne Lockeln de `codes_acces` + ses lots/extractions de test ; ② créer Basse-Goulaine avec un code neuf ; ③ corriger la coquille « Saint-Aignan-de-Grandlieu » → « Saint-Aignan-Grandlieu » (nom officiel INSEE). | Supabase (hors code) | **Haute** (couplée A12) |
| 4 | ~~A5 — Verrou anti sur-extraction~~ ✅ fait le 2 juil. (trigger + re-validation client) | Supabase + Feature | ✅ Fait |
| 5 | A7 — Session jamais revérifiée : un code désactivé dans Supabase reste connecté | Feature | Moyenne |
| 6 | A8 — `supprimerLot` n'efface pas les extractions liées (volumes sortis orphelins) | Feature | Moyenne |
| 7 | ~~A6 — Grumes déjà extraites re-sélectionnables~~ ✅ fait et fusionné le 2 juil. : chaque extraction enregistre les clés de ses grumes (`extractions.grumes_keys`, colonne créée dans Supabase le 2 juil.), la sélection ne les propose plus, et un bloc « Bilan du stock » (entrées / sorties / solde à une date choisie) garde la trace même stock vide. Mobile + bureau. | Feature | ✅ Fait |
| 7b | ~~Brouillon de saisie perdu au rechargement de la page~~ ✅ fait et fusionné le 2 juil. : restauration silencieuse (plus de boîte « Reprendre ? » qui effaçait le brouillon sur Annuler, restauration même sans grume). | Feature | ✅ Fait |
| 8 | ~~A9 — Mode circonférence : volume affiché ≠ volume enregistré~~ disparu avec le retrait de la circonférence (24 nov. 2026) | Feature | ✅ Fait |
| 9 | ~~A10 — Supprimer l'ancien formulaire mort~~ ✅ fait et fusionné le 2 juil. : étapes 1-3 d'index.html, panneau Territoire, 16 fonctions orphelines d'app.js et blocs ui.css associés retirés (~1 440 lignes), theme-color aligné, `icon-512 copie.png` supprimée. Note : `supprimerLot` faisait partie du code mort retiré — l'UI n'offre plus aucune suppression de lot (A8 à repenser). | Structure + Feature | ✅ Fait |
| 10 | A11 — ~~GPS sans timeout~~ GPS refait (`feat/gps-precis`, 24 nov. 2026) · overlay « Chargement » clignote à chaque rafraîchissement auto | Feature | Basse |
| 11 | **Points d'entrée par profession** — Aiguillage à l'entrée selon le métier : bûcheron/élagueur → ajout de bois, scieur mobile → débit, menuisier → prélèvement. Une fois le rôle choisi, seuls les écrans de ce parcours restent visibles (les autres onglets disparaissent de la navigation). Bouton discret « Changer de rôle ». Choix mémorisé en localStorage. Stock présenté en 2 états : grume brute / grume débitée. | À définir | À définir |
| 12 | **Géolocalisation manuelle des grumes** — Placement à la main sur une carte, au bureau, pour une grume sans position (24 nov. 2026) | Feature (bureau) | ✅ Fait |
| 13 | **Lieu de stockage** — Sélection du lieu de stockage par liste déroulante. Plus tard (non prioritaire) : capacité maximale d'accueil par lieu, avec signal d'alerte si le lot enregistré dépasse la capacité restante. | À définir | À définir |
| 14 | **Identification unique de chaque grume** — Saisie de l'identifiant par photo smartphone de la plaque d'identification apposée sur la grume, avec saisie manuelle du numéro en alternative. L'identifiant suit la grume sur tout son parcours : stockage → débit scieur → transformation menuisier. | À définir | À définir |
| 15 | **Transformation par le scieur mobile dans le stock** — Point majeur, à traiter dans une session dédiée. Opération de débit : grume brute → bois débité, avec traçabilité (filiation grume → lots débités). | À définir | À définir |
| 16 | **Signal visuel « appeler le scieur mobile »** — Indicateur affiché lorsque le volume cumulé de grumes brutes atteint un seuil suffisant pour justifier le déplacement du scieur mobile. Seuil à définir : valeur fixe ou paramétrable par commune. | À définir | À définir |
| 17 | ~~🔴 A14 — Bureau : session restaurée sans en-tête `x-commune-code`~~ ✅ corrigé le 7 juil. : en-tête posé dans `bLancerApp()`, qui couvre connexion ET session restaurée au rechargement | Feature (bureau) | ✅ Fait |
| 18 | 🔴 A15 — **Modèle de données incohérent entre mobile et bureau pour l'extraction « débit »** : le mobile enregistre `extractions.volume` = m³ **bruts** sortis, le bureau enregistre `volume` = m³ **utiles** (≈ moitié du brut, brut stocké à part dans `vol_brut_extrait`). Le stock étant calculé sur `volume`, une extraction débit faite au bureau ne déduit que le volume utile alors que toutes les grumes sont marquées sorties → « stock fantôme » : essence affichée disponible sans grume sélectionnable. À trancher à l'atelier modèle de données (tâche 3e) puis harmoniser les 2 apps. | Décision projet + Feature | **Haute** (couplée 3e) |
| 19 | ~~🟠 A16 — Case « Partager avec toutes les communes » jamais réinitialisée~~ ✅ corrigé le 7 juil. : décochée à chaque ouverture de la modale dans `nouvOuvrirModal()` | Feature | ✅ Fait |
| 20 | 🟠 A17 — **Bureau moins protégé que le mobile à l'enregistrement d'une extraction** : pas de re-validation sur données fraîches avant insertion, message « STOCK INSUFFISANT » du verrou non extrait de l'erreur brute, et `bTentativeConnexion` réutilise la session locale sans re-vérifier le code côté serveur (variante bureau de A7). | Feature (bureau) | Moyenne |
| 21 | 🟡 A18 — **Bureau : la ligne « Total » du tableau des lots n'additionne que les 10 lots affichés**, pas l'ensemble — trompeur dès que la commune dépasse 10 lots. | Feature (bureau) | Basse |
| 22 | 🟡 A19 — Divers basse priorité relevés au scan du 7 juil. : ① rafraîchissement auto (2 min) réinitialise la date du « Bilan du stock » et les réglages débit de l'écran Extraction si aucune grume n'est encore sélectionnée (angle mort de A1) ; ~~② volumes bureau insérés sans arrondi~~ ✅ 31 oct. ; ~~③ refus de l'extraction de la totalité d'un stock~~ ✅ 31 oct. ; ④ export CSV sans neutralisation des formules Excel (nom de lot commençant par `=`) ; ⑤ `date_iso` en UTC : saisie vers minuit comptée sur le mauvais jour dans le bilan ; ⑥ code mort bureau (`ESSENCE_COULEURS`, `b-exp-commune`). | Feature | Basse |
| 23 | **Session bureau** — ✅ codée le 13 nov. 2026 sur `feat/bureau-campagnes`. A15 disparaît (plus de débit en planches au bureau). Validée et fusionnée dans `main` le 13 nov. 2026. | Feature (bureau) | ✅ Fait |
| 24 | **Application de synthèse** (Tronc Commun seul) — Application web séparée, en lecture seule : chiffrage au prix courant, graphiques, cartes à calques, dossier PDF. Cadrage du 13 nov. 2026 dans MEMORY. À coder après la tâche 23. | Nouvelle application | Après la tâche 23 |
| 25 | **Synthèse — éléments à réunir** : grille de prix, données réelles (point avec les agents), accès Tronc Commun en lecture sur toutes les communes, périmètre du PDF. | Porteur + Supabase | Avant la tâche 24 |
| 26 | **Lieu d'utilisation et photos** — À chaque utilisation ou réemploi, noter le lieu et ajouter une photo de la réalisation. Alimente la carte de la synthèse. Lié aux tâches 13 et 14. | À définir | À définir |
| 28 | **Couleurs d'essence au bureau** — Le mobile montre la couleur du bois dans la liste du stock : une pastille devant le nom, la barre au même ton (14 nov. 2026). Le bureau en est resté au dégradé d'indigo à huit tons, pour ses deux camemberts et leurs légendes. Les deux versions donnent donc une information différente sur la même donnée. Les 21 tons sont déjà dans `theme.css` : il reste à les poser dans `bureau/app.js` — camembert des grumes par essence, camembert de la métropole, et pastille devant le nom dans le tableau des grumes. Retirer au passage `ESSENCE_COULEURS`, code mort (A19 ⑥). | Feature (bureau) | Moyenne |
| 29 | ~~🔴 A20 — **Zoom automatique sur iPhone**~~ ✅ corrigé et fusionné le 14 nov. 2026 (`fix/zoom-iphone`) : les champs passent à `max(16px, 1rem)` sous 600 px. Le rattrapage est en fin de `ui.css`, après les règles de base — le bloc mobile d'origine est écrit avant elles et se faisait écraser ; un repère l'indique sur place. Onze champs étaient concernés, revérifiés à zéro. Cache v61. | Design | ✅ Fait |
| 30 | 🟠 A21 — **Lisibilité en plein soleil** : contrastes et tailles de texte sous le minimum recommandé de 4,5:1. Partiellement traité le 14 nov. 2026 — libellés passés de 7-10 px à 11-13 px en demi-gras, barre du bas passée de `--pierre` à `--cendre`. Reste à reprendre : les textes encore sous 12 px et les contrastes non vérifiés un par un. | Design | Moyenne |
| 31 | 🟠 A22 — **Zones tactiles sous 44 px**. Partiellement traité le 14 nov. 2026 — barre du bas à 60 px, boutons à 48 px. Reste : lien « modifier » de l'année (19 px, mesuré le 14 nov.), « Mentions légales », « ← Accueil » du ticket, boutons − / + de quantité. | Design | Moyenne |
| 32 | 🟡 A23 — Bouton **Déconnexion** inaccessible sur smartphone : il est dans l'en-tête, masquée sous 600 px. Confirmé le 14 nov. 2026. Un agent ne peut pas changer de commune sans vider les données du navigateur. | Design + Feature | Basse |
| 33 | 🟡 A24 — Police Outfit non gardée pour le hors ligne : elle vient de Google Fonts et n'est pas dans la liste de `sw.js`. Sans réseau, le téléphone affiche sa police par défaut. | `sw.js` | Basse |
| 27 | **Traçabilité au sciage** — Une pile = une grume (sciage en plot), numéro reporté sur la pile et en bout de planche. À valider avec le scieur avant la première campagne. | Porteur | À définir |

---

## Rappel — Règle de session

- Session **Design** → `theme.css`, `ui.css`, `index.html` uniquement
- Session **Feature** → `core.js`, `app.js` uniquement
- Jamais les deux zones dans la même session

---

## Voir aussi

- [[MEMORY]] — contexte et décisions d'architecture
- [[LESSONS]] — contraintes à respecter lors de l'exécution
- [[CHANGELOG]] — journal détaillé des tâches accomplies
- [[EVOLUTIONS]] — idées non planifiées à arbitrer
