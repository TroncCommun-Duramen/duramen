# TASKS.md — Suivi des tâches DURAMEN

> Source de vérité pour l'avancement du projet.
> Mettre à jour à chaque fin de session Claude Code.

---

## Tâches terminées

| Tâche | Session | Date |
|-------|---------|------|
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

---

## Tâches en cours

Branche `feat/grumes` (3 nov. 2026) — demandes du porteur, points 1 à 8 + partage automatique :

| Étape | État |
|-------|------|
| Supabase : `lots` → `grumes`, `grumes_partagees()`, nom unique par commune, partage par défaut, commune « Nantes Métropole » (NM) | ✅ Fait |
| Session Feature : `core.js`, `app.js`, `bureau/app.js`, cache v43 | ✅ Fait (commit 7315960) |
| Session Structure : `index.html` + `bureau/index.html` — « lot » → « grume » dans les textes fixes, mentions légales §5 (partage automatique), retrait des boutons « Grume brute » et des curseurs trait de scie / rendement du bureau, onglet bureau « métropole » | ✅ Fait (commit 60a80f7) |
| Session Design : couleurs propres pour Chêne rouge, Chêne des marais, Cèdre — `core.js` pointe déjà vers `ec-chene-rouge`, `ec-chene-marais`, `ec-cedre` (classes à créer dans `ui.css`) | À faire |
| Après fusion dans `main` : supprimer la passerelle (vue `lots`, fonction `lots_partages()`) et la colonne `extractions.cause_abattage` | À faire |
| Point 9 — séparer le stock grumes brutes / session de coupe | Branche `feat/campagne-sciage` (voir ci-dessous) |

Branche `feat/campagne-sciage` (partie de `feat/grumes`, 3 nov. 2026) :

| Étape | État |
|-------|------|
| 1. Supabase : table `campagnes`, colonnes `extractions.produits` / `vol_produits` / `campagne_id`, verrous serveur (grume sortie une seule fois, stock produits), fonctions métropole `grumes_en_stock_partagees()` et `produits_partages()` | ✅ Fait, testé en SQL puis annulé |
| 2. Feature : badge d'urgence de débit, campagne, feuille de débit, clôture, stock produits | ✅ Fait (cache v47), testé navigateur (Supabase simulé) + envois rejoués en SQL |
| 3. Feature : écran Extraction → produits sciés (grume brute en exception, hors campagne en cours) | ✅ Fait (cache v49), testé navigateur (Supabase simulé) |
| 4a. Structure : accueil « m³ en grumes brutes », bouton « Sortir des produits bois » | ✅ Fait (cache v50) |
| 4b. Design | À faire |

Classes CSS créées par l'étape 2, à styler en session Design (aujourd'hui sans style propre) :
- badges : `badge-urgence-ok` (indigo : valeur calculée), `badge-urgence-alerte` (orange), `badge-urgence-depasse` (rouge), `badge-a-debiter`, `badge-sechage-en-cours`, `badge-sechage-sec`
- campagne : `stock-etat-bar`, `sciage-section`, `sciage-campagne-card`, `sciage-campagne-actions`, `sciage-btn-nouvelle`, `sciage-btn-supprimer`, `sciage-modal`, `sciage-grume-row`, `sciage-grume-check`, `sciage-choix`, `sciage-type-bar`, `sciage-estimation` (indigo : valeur calculée), `sciage-resume`
- clôture : `sciage-cloture-grume`, `sciage-realise`, `sciage-produits`, `sciage-produit-ligne`, `sciage-btn-ajouter`, `sciage-btn-retirer`
- stock produits : `produit-card`
- extraction : `ext-mode-bar`, `ext-produits-liste`, `ext-produit-card` (+ `.selected`), `ext-qte`, `ext-qte-btn`, `ext-qte-input`, `ext-qte-tout`
- feuille de débit : `feuille-debit`, `feuille-table`, `feuille-pied`, `feuille-impression` (version imprimée)

Hors périmètre pour l'instant : la version bureau (`bureau/app.js`) ne connaît pas encore les campagnes ni le stock produits.

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
| 8 | A9 — Mode circonférence : volume affiché ≠ volume enregistré (arrondi du diamètre) | Feature | Basse |
| 9 | ~~A10 — Supprimer l'ancien formulaire mort~~ ✅ fait et fusionné le 2 juil. : étapes 1-3 d'index.html, panneau Territoire, 16 fonctions orphelines d'app.js et blocs ui.css associés retirés (~1 440 lignes), theme-color aligné, `icon-512 copie.png` supprimée. Note : `supprimerLot` faisait partie du code mort retiré — l'UI n'offre plus aucune suppression de lot (A8 à repenser). | Structure + Feature | ✅ Fait |
| 10 | A11 — GPS sans timeout · overlay « Chargement » clignote à chaque rafraîchissement auto | Feature | Basse |
| 11 | **Points d'entrée par profession** — Aiguillage à l'entrée selon le métier : bûcheron/élagueur → ajout de bois, scieur mobile → débit, menuisier → prélèvement. Une fois le rôle choisi, seuls les écrans de ce parcours restent visibles (les autres onglets disparaissent de la navigation). Bouton discret « Changer de rôle ». Choix mémorisé en localStorage. Stock présenté en 2 états : grume brute / grume débitée. | À définir | À définir |
| 12 | **Géolocalisation manuelle des grumes** — Possibilité de renseigner manuellement la position d'une grume à la saisie. | À définir | À définir |
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
