# PROMPT_LOG.md — Journal des instructions

> Ce fichier enregistre toutes les instructions données à Claude Code,
> session par session, avec l'heure et le résultat.
> Objectif : pouvoir retracer l'historique, comprendre pourquoi une décision
> a été prise, et reprendre exactement là où on s'est arrêté.

---

## Comment l'utiliser

À la fin de chaque session Claude Code, demander :
> "Résume les instructions que je t'ai données aujourd'hui pour le PROMPT_LOG.md."

Puis coller le résumé dans ce fichier avec la date et l'heure.

---

## Format d'une entrée

```
## Session AAAA-MM-JJ

HH:MM — [description de l'instruction]
HH:MM — [description de l'instruction]
HH:MM — [commit: abc1234] résultat final
```

---

## Journal

## Session de préparation — 2026

— Analyse du fichier `duramen.html` (2300 lignes)
— Identification des fragilités : accents ESSENCES_INFO, IDs temporels,
  styles inline, DOM par concaténation, absence de cache offline
— Définition de l'architecture cible en 5 fichiers séparés
— Rédaction de `CLAUDE.md`, `TASKS.md`, `MEMORY.md`,
  `LESSONS.md`, `DESIGN_SYSTEM.md`, `PROMPT_LOG.md`
— Méthodologie : Phase 0a (design) → 0b (noyau) → 0c (bugs) → 1 (features)


## Session 2026-10-31

10:48 — Mail Supabase : projet en pause → restauration du projet
11:02 — Vérification du compte test « Tronc Commun » (TC-D7WA) : actif, exclu de la vue Communauté par la RLS
11:08 — Audit complet avant le lancement de mardi (mobile, bureau, Supabase)
11:28 — Recherche des usages de la filière : volumes au millième de m³ (règles ATIBT)
11:31 — Alignement des volumes au millième de m³, mise en ligne, mise à jour du coffre Obsidian
11:39 — A12 : vérifié non fait (ni sur GitHub ni dans la base) → code secret masqué au partage

## Session 2026-11-02

19:21 — Scan profond avant déploiement aux communes : affichage smartphone et mode hors ligne
20:58 — Question : pourquoi la mémoire tampon hors ligne ne fonctionne plus → constat : elle n'a jamais été codée
21:01 — Décision : extraction faite à l'atelier, avec réseau → file d'envoi limitée aux lots (et tickets)
21:06 — Corriger tout ce qui a été vu, sans toucher au design et sans créer de bug
21:52 — Compte GitHub relié à Claude remplacé par TroncCommun-Duramen, application installée sur `duramen`
22:07 — [commits: c21c8e9, 790d959] branche `fix/envoi-hors-ligne` poussée, en attente de validation
22:10 — Mise à jour du coffre Obsidian

## Session 2026-11-04

17:46 — Questions : saisie après coup (provenance, date, « inconnu »), zéros automatiques, marquage différé, blocage du débit sans numéro
17:51 — Recherche des épaisseurs de sciage : 4 principales + champ libre, plusieurs épaisseurs par grume
17:56 — Décision : 27 / 34 / 41 / 54 mm gardées (débits surtout pour l'aménagement urbain), à affiner plus tard
18:03 — Décision : règle de séchage unique pour toutes les essences, 1 cm par an
18:05 — Précision : 1 cm par an sur les 4 faces
18:07 — Codage : branches `feat/saisie-grume` et `feat/debit-epaisseurs`, base Supabase, tests navigateur
18:27 — Validation du porteur → fusion des deux branches dans `main`, mise en ligne (cache v56)

## Session 2026-11-11

07:39 — Question : les retours "ticket" apparaissent-ils dans Supabase ? → oui, table `feedbacks`
07:44 — Demande : alerte email au compte "Tronc Commun" à chaque ticket créé
07:52–08:01 — Essais Brevo (vérification jamais reçue) puis Brevo payant → bascule sur Resend (gratuit)
08:16 — Secret `RESEND_API_KEY` ajouté dans Supabase par l'utilisateur
08:17 — [Edge Function `ticket-alert` déployée] + trigger `trg_notify_ticket_alert` sur `feedbacks` (extension `pg_net` activée)
08:18 — Test : échec, Resend bloque l'envoi hors domaine vérifié (sandbox limité à l'adresse du compte)
08:20 — Décision : envoi simplifié vers `contact@paquito.fr` (déjà reçu sur g.photopaq@gmail.com)
08:21 — Test réussi (200 OK), ligne de test supprimée de `feedbacks`
08:22 — Mise à jour CHANGELOG.md et PROMPT_LOG.md, sauvegarde dans le coffre Obsidian

---

## Session 2026-11-13

13:17 — Demande : application de synthèse séparée de Duramen (chiffrage, graphiques, carte à calques, dossier PDF)
13:24 — Carte : suivre le bois de l'abattage au stockage puis à la réalisation, avec le GPS de la récolte
13:27 — Traçabilité au sciage : suivi par pile, numéro de la grume reporté
13:33 — Carte de la métropole : 5 styles proposés, « trait d'encre » retenu
13:40 — 24e commune retrouvée (La Montagne), tracé de la Loire, puis trait fin unique et Loire en courbe
13:49 — Carte par commune ; calques interactifs dans le PDF
13:58 — Mise en page du document de synthèse et note de bas de page
14:01 — 3 rendus de graphiques validés
14:05 — Ce qui est utile aux agents ; vérification sur GitHub : urgence de débit et séchage déjà en place
14:11 — Décision : bureau pour gestionnaires et menuisiers, synthèse gardée par Tronc Commun comme service
14:13 — Décision : session bureau d'abord, synthèse ensuite
14:17 — Mise à jour de la documentation sur GitHub et de la sauvegarde interne
20:05 — Demande : retravailler la version bureau (ateliers de menuiserie, responsables), de la campagne de sciage à la pose des objets, avec export tableur ; mise à niveau sur le mobile ; aucun conflit entre bureau et mobile
20:10 — Décisions : suivi par étapes (sorti, réalisé, posé), grume entière gardée en exception, verrou ajouté dans la base
20:40 — Codage sur `feat/bureau-campagnes`, verrous et suivi dans Supabase, tests navigateur bureau + mobile
23:16 — Validation du porteur : fusion de `feat/bureau-campagnes` dans `main`
23:24 — Demande : le compte Lockeln apparaît encore au bureau. Cause : connexion gardée dans le navigateur, jamais revérifiée. Correction sur `fix/session-bureau`
23:27 — Validation du porteur : fusion de `fix/session-bureau` dans `main`
23:43 — Demande : présentation du bureau moins austère, inspirée d'une fiche produit (Cinna) ; encadré d'infos avec Tronc Commun ; navigation plus moderne que les onglets. Réalisé sur `feat/bureau-presentation`
00:23 (14 nov.) — Validation du porteur : fusion de `feat/bureau-presentation` dans `main`
00:45 — Photo d'illustration fournie (crédit Paquito Couet), ajoutée sur `feat/bureau-illustration`
00:47 — Validation du porteur : fusion dans `main`

## Session 2026-11-19

17:56 — Premier ticket retour : on ne peut pas modifier une grume enregistrée (ex. diamètre mal saisi). Proposition demandée avant tout
18:07 — Validation : tout se corrige sauf le numéro, jusqu'à l'entrée dans une campagne de sciage. Attribuer un numéro après coup : déjà possible
18:15 — [commit: 7cc684d] Bouton « Corriger » sur `feat/corriger-grume`, fonction `corriger_grume` dans Supabase, tests base et navigateur
18:21 — Demande : élargir les molettes de mesure
18:22 — [commit: 5728d14] Diamètre 150 cm, circonférence 471 cm, longueur 12 m. Cache v64
18:22 — Validation du porteur : fusion de `feat/corriger-grume` dans `main`, branche supprimée par le porteur
23:18 — Mise à jour de la documentation sur GitHub et de la sauvegarde interne
23:21 — Texte de mail pour annoncer la correction aux communes
23:27 — Demande : la correction aussi sur la version bureau, et la sauvegarde sur l'ordinateur
23:40 — [commit: 2c68dfd] Bouton « Corriger » dans l'onglet Grumes du bureau, sur `feat/bureau-corriger-grume`. En attente de validation
23:35 — Validation du porteur : fusion de `feat/bureau-corriger-grume` dans `main`

## Session 2026-11-20

08:42 — Question : peut-on aller jusqu'à la suppression d'une grume ? Proposition faite avant tout
08:44 — Validation : garder une trace, faire sur le mobile et le bureau
09:00 — [commit: b53ee76] Bouton « Supprimer cette grume » dans la fenêtre « Corriger », sur `feat/supprimer-grume`. Base : table `grumes_supprimees`, fonction `supprimer_grume`, suppression directe fermée. En attente de validation
08:50 — Validation du porteur : fusion de `feat/supprimer-grume` dans `main`

## Session 2026-11-24

12:56 — Retours terrain : causes d'abattage, « Autre » à mémoriser (cause, essence), grumes à part, grumes de plus de 80 cm à débiter en externe. Proposition demandée avant tout
13:03 — Décisions : anciens « Coupe sécuritaire » en « Coupe sanitaire », limite au gros bout, simple avertissement, grume en mauvais état sciable
13:11 — GPS : rester simple pour les agents, précision suffisante pour une carte ? 4 propositions, toutes retenues
13:17 — Demande : faire les mises à jour sur GitHub et en local
13:22 — Décision : question oui/non sur le gros bout à partir de 60 cm de Ø médian
13:24 — Décisions : le débit externe est un simple marquage sur la grume ; la circonférence est retirée
— Base : tables `noms_personnalises` et `reglages`, colonnes `etat`, `debit_externe`, `gps_precision`, `position_manuelle`, fonctions `corriger_grume` (10 paramètres) et `placer_position_grume`, causes « Coupe sécuritaire » passées en « Coupe sanitaire »
— Branche `feat/grumes-a-part` (cache v66) et branche `feat/gps-precis` (cache v67), testées dans un navigateur. En attente de validation
13:40 — Coffre Obsidian trouvé au 11 mai (verrou git du 7 oct.). Notes de juin sauvées dans `_notes-juin-2026/` et reportées sur GitHub, coffre remis à jour et vérifié
13:49 — Questions : marque après 60 cm, calcul au diamètre médian gardé
13:50 — Validation du porteur : fusion des deux branches dans `main`, cache v68, tests rejoués 53/53
19:08 — Demande : 3 couleurs pour l'état des grumes, proposition d'abord. Proposition : gris clair, or, ardoise
19:19 — Validation des couleurs. Demandes : « débit externalisé » au lieu de « débit externe », plus de « gros bout » ; retirer bilan et exports du stock mobile ; proposition pour le diamètre 80
— Branches `feat/couleurs-etat-grume` (v70) et `feat/stock-mobile-allege` (v69), testées. En attente de validation
19:32 — Décisions : 80 cm règle seule ; fiche de stock réduite à numéro, essence, cubage, date de débit ; nommer la tempête ; tablettes. « Avant tout changement, propose »
19:59 — Débit externalisé collé à la date ; titre « du + au − urgent » ; tempête valable pour toutes les communes ; question du mode portrait (déjà demandé, ne règle pas tout)
20:01 — Validation des propositions. Fusion des deux branches précédentes (cache v71). Branches `feat/fiche-grume-allegee` (v72) et `feat/nom-tempete` (v73) testées, essai de fusion des deux : 73/73. En attente de validation
20:13 — Validation du porteur : fusion des deux branches dans `main`, cache v74, tests 73/73
20:27 — Question : bouton bleu « Préremplir le contact » en nommant une grume. Remplissage automatique de l'iPhone (mot « Numéro », id `modal-nom-input`). Correction proposée, en attente
20:29 — Demande : boutons de choix de l'état aux couleurs de l'état (gris clair, or, ardoise) au lieu de l'indigo
20:31 — Validation : fusion de `feat/couleur-choix-etat` dans `main`, cache v75
20:33 — Validation de l'approche tablette. Branche `feat/tablette` (cache v76) : 60 captures téléphone/ordinateur identiques avant/après, tests 34/34 à 390, 768 et 1180 px. En attente de validation
20:59 — Mail aux services de Nantes demandé (améliorations suite au rendez-vous, points de Karl Hervouet). Remarque : la règle des 80 cm portait sur le Ø médian, pas sur le plus large
21:03 — Décision : revenir à une mesure dès 60 cm. Deux options proposées
21:04 — Option 2 retenue : diamètre au plus large. Branche `feat/diametre-plus-large` (v77), tests 87/87. En attente de validation
21:14 — Validation : fusion de `feat/tablette` et `feat/diametre-plus-large` dans `main`, cache v78. Tests rejoués sur téléphone, tablette portrait et paysage, bureau : 163/163

## Session 2026-11-24/25 — Cartographie des grumes (simulations)

21:35 — Demande : travailler la cartographie des données GPS. Option retenue : noms de lieux retrouvés sans les agents (service IGN)
21:40 — Décision : traiter la carte à part de Duramen, comme la synthèse
21:47 — Décision : chaque commune voit sa carte (version simple) ; Tronc Commun voit tout, graphisme soigné réservé à la synthèse. Fonds GPS gratuits, légendes, filtres multicritères
22:02 — Accord pour l'accès Tronc Commun à toutes les communes. Simulation écran demandée (grumes fictives)
22:22 — Retours : page plus sobre, vue satellite par défaut, couleurs trop proches, exceptionnelles bien repérées
22:34 — Code couleur : rond plein sans contour, un cercle par critère, taille constante
22:40 — Simulation papier au graphisme de la synthèse (Tronc Commun)
23:22 — Test du plan IGN grisé et intégration du logo cartographie E2b
00:15 — Quatre palettes proposées ; 00:22 — palette D « Atelier » retenue pour la cartographie
00:31 — Test écran : vue aérienne adoucie et plan IGN épuré
00:36 — Question : grumes dans l'Erdre (simulation) ; constat : possible avec de vraies données
01:02 — Décision : accès Tronc Commun dans une session à part
01:04 — Décision : nom du lieu enregistré dans la base
01:06 — Préparation des prochaines sessions (TASKS.md, MEMORY.md, sauvegarde)

---

## Session 2026-11-25 (matin) — Couleurs de l'app mobile

07:14 — Demande : séparer les couleurs des grumes et celles de leur qualité sur mobile. Deux pistes proposées : essences en indigo (A), palette Atelier et état marqué autrement (B)
07:22 — Piste B validée
07:26 — Question : existe-t-il des codes couleur propres aux bûcherons (France, Canada) ? Codes de martelage présentés ; chamois proposé pour les exceptionnelles
07:36 — Or gardé pour les exceptionnelles ; changements demandés
07:45 — Validation et fusion (cache v80). Règle : écrire d'office sur GitHub et dans le coffre, sauf demande contraire
07:48 — Règle : tout ce qui entoure l'app suit les mêmes mises à jour. Couleurs reportées dans la synthèse
07:53 — Maquette de la synthèse fusionnée dans `main`, avec le logo Duramen Cartographie sur chaque carte
08:01 — Mise à jour de l'état de développement

## Session 2026-11-25 (8 h) — Accès Tronc Commun à toutes les communes

08:07 — Demande : créer l'accès de Tronc Commun à toutes les communes (session 2 du plan)
08:10 — Trois formes proposées : code de lecture à part (A), code « Tronc Commun » existant (B), terminer A12 d'abord (C)
08:11 — Forme A retenue. Le porteur gère Tronc Commun et distribue lui-même les codes
08:15 — Accès créé dans Supabase (table `acces_lecture`, fonctions `tc_…`), essais faits dans la base. Aucun fichier de l'app modifié

## Session 2026-11-25 (10 h 45) — Carte des grumes, parc, pictogrammes, graphisme

10:44 — Nouvelle session : construction de la carte. Accès vérifiés ; dépôt `cartographie` créé par le porteur, accès de l'app Claude ajouté dans les réglages du compte
11:05 — Test des services de noms de lieux : la rue et le quartier se retrouvent, jamais le parc. Proposition : « rue · quartier » dans la base, parc cherché par son contour sur la carte. Validée
11:07 — Idée du porteur : nommer le parc à la saisie (comme la tempête). Validée pour une session suivante
11:11 — Colonne `lieu` et réveil automatique créés dans la base
11:23 — Règle : l'accès à l'ordinateur du porteur est donné une fois pour toutes, s'en servir sans redemander
11:33 — Carte en ligne (branche d'essai). Demandes : © Tronc Commun, démonstration à grumes fictives
11:43 — Le code n'est pas redemandé : la carte reprend celui de l'app. Carte gardée à part, bouton « Voir la carte » sur l'accueil
11:59 — Pictogrammes : famille A « cernes », point indigo ; anciens fonds gardés, vert mousse pour la carte
12:16 — Transmission du code au clic (iPhone, iPad)
12:22 — Mail aux communes rédigé
12:27 — Nom du parc fait dans la même session (mobile, bureau, base, carte)
12:33 — Nettoyage : 208 lignes en moins, sans changement visible
12:48 — Graphisme « trait à main levée » : compromis léger / affirmé, carrés en aplat, symbole blanc ; bureau compris
13:09 — Camembert du bureau aux couleurs des essences, pictogrammes du menu du bureau, mail factuel, document « Références des calculs » mis à jour (PDF exporté)
13:36 — Fusion : `duramen` main (cache v86), `cartographie` main, publication de la carte basculée sur `main`


## Session 2026-11-25 (après-midi) — Design de l'accueil

14:28 — Session Design : cadre « Ajouter au stock » sans aplat noir ; proposition d'encadrés plus fins
14:37 — Retenu « fin » (1 px) pour l'accueil et le stock ; flèche de « Voir la carte » à harmoniser ; retravailler les couleurs des 5 entrées
14:41 — Retenu l'harmonie « Terre et sépia » ; demandé une présentation à la manière de l'app Apnée, carrés des icônes gardés
14:45 — Retenu l'option 1 (liste reliée, sans cadres, total du stock encadré) ; [commit: 09be697] fusion dans `main` (cache v90), sauvegarde dans le coffre

---

## Voir aussi

- [[MEMORY]] — synthèse des décisions issues des sessions
- [[TASKS]] — avancement des tâches générées par les sessions
- [[Journal/JOURNAL_SESSION_06]] — journal narrative de la dernière session
