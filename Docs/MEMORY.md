# MEMORY.md — Base de connaissance du projet DURAMEN

> Ce fichier est lu au démarrage de chaque session Claude Code.
> Il résume l'état du projet : décisions prises, architecture, points d'attention.
> Le mettre à jour à chaque fin de session importante.

---

## Sauvegarde interne — coffre Obsidian

La sauvegarde interne du porteur est le coffre Obsidian, sur son Mac : `Documents/Coffre Obsidian/Tronc Commun` (l'application est dans `01-Projet/Appli Duramen`).
En fin de session, on met à jour GitHub **et** ce coffre. Le coffre est une copie du dépôt : un `git pull` dans le dossier suffit à le mettre à jour.

Règles du porteur (25 nov. 2026) :
- Claude écrit d'office sur GitHub et dans le coffre, sauf demande contraire explicite du porteur.
- Tout ce qui entoure l'app (synthèse, carte…) suit les mêmes mises à jour que l'app. Exemple : un changement de couleurs se reporte le même jour dans le dépôt `synthese`.

---

## Session 25 novembre 2026 (14 h 30 – 14 h 50) — Design de l'accueil et des cadres

Mis en ligne le 25 nov. 2026 vers 14 h 50 : `main` de `duramen` (cache **v90**). Session Design : `theme.css`, `ui.css` (et `sw.js`).

- **Accueil en liste reliée**, à la manière de l'app Apnée du porteur : les 5 entrées n'ont plus de cadres ni de flèches ; un fil d'encre fin relie les carrés des pictogrammes ; Ticket retour à part sous le séparateur. Le total du stock garde son cadre indigo hachuré. Carrés des pictogrammes gardés.
- « Ajouter au stock » n'a plus d'aplat noir : comme les autres entrées.
- **Trait fin** partout (option B) : `--trait-main` 1 px (au lieu de 1,4), hachures indigo, or et ardoise plus fines (`--hachures-ardoise` ajoutée). Vaut aussi pour le bureau (même `theme.css`).
- **Couleurs des pictogrammes** : harmonie « Terre et sépia », variables `--picto-…` de `theme.css` : Ajouter sépia noir `#2E2B26`, Voir indigo `#34458A`, Sortir ocre brun `#8A6F4E`, Carte mousse `#5F7A5B`, Ticket rouille `#A8573A`.
- La flèche ↗ de « Voir la carte » venait d'une autre police (absente d'Outfit) : les flèches sont retirées de l'accueil.
- Synthèse : rien à reporter (elle n'utilise ni ces cadres ni ces pictogrammes).

---

## Session 25 novembre 2026 (10 h 45 – 13 h 45) — Carte des grumes, nom du parc, pictogrammes, graphisme, nettoyage

Mis en ligne le 25 nov. 2026 vers 13 h 40 : `main` de `duramen` (cache **v86**) et `main` du dépôt **`cartographie`** (publié par GitHub Pages depuis `main`).

**Carte des grumes** — dépôt public `TroncCommun-Duramen/cartographie` (le porteur l'a nommé ainsi au lieu de `carte`), adresse https://tronccommun-duramen.github.io/cartographie/
- Application à part, en lecture seule. Elle lit `grumes` + `extractions` avec `x-commune-code`, ou `tc_grumes()` + `tc_sorties()` avec `x-code-lecture` (Tronc Commun). Premier essai réel par Internet : réussi.
- Couleurs et liste des essences lues directement dans l'app (`../duramen/theme.css`, `../duramen/core.js`, même site) : un changement de couleur dans l'app se reporte seul sur la carte.
- Point = rond à la couleur de l'essence ; cercles autour : or = exceptionnelle, ardoise = mauvais état, blanc = débitée ; taille fixe. Vue aérienne IGN par défaut, plan épuré au choix. Filtres : essence, cause (+ tempête), état, dates, commune (Tronc Commun). Grumes sans GPS comptées sous la carte.
- Recherche : numéro, essence, rue, quartier, parc. Un nom absent des données → bouton « Chercher sur la carte » : contour du lieu demandé à OpenStreetMap (une demande au clic), grumes à l'intérieur (150 m autour d'un simple point).
- **Code** : repris de l'app ouverte sur le même appareil (`duramen_session`, `duramen_bureau_session`), ou transmis par le bouton « Voir la carte » derrière un `#` (iPhone, iPad : l'app installée a sa mémoire à part de Safari), effacé aussitôt de l'adresse. Toujours revérifié par la base. « Se déconnecter » coupe la reprise jusqu'à la prochaine connexion à la main.
- **Démonstration** sans code : `…/cartographie/?demo`, 51 grumes fictives dans de vrais parcs de Nantes (`demo.js`), rien n'est lu dans la base.
- © Tronc Commun en pied de page. Numéro de version `?v=` sur les fichiers (à augmenter à chaque mise à jour, sinon cache de 10 min).

**Lieu de chaque grume (base)** — colonne `grumes.lieu` = « rue · quartier », retrouvée par OpenStreetMap (Nominatim) à partir du point GPS, une fois, environ une minute après l'arrivée. Réveil `pg_cron` `completer-lieux` toutes les 20 s, une demande à la fois (règle d'OpenStreetMap), suivi dans `lieux_suivi` (invisible de l'extérieur), 3 essais au plus espacés d'une heure. Position replacée au bureau → lieu recherché à nouveau (déclencheur `grumes_lieu_a_retrouver`). Le nom d'un parc n'est jamais retrouvé par ce service (ni par l'IGN) : d'où le nommage par l'agent.

**Nom du parc** — provenance « Parc » → champ facultatif « Nom du parc » (mobile, correction mobile et bureau). Table `parcs` (par commune, une commune ne voit que ses parcs, unicité sans tenir compte des majuscules), colonne `grumes.nom_parc`, `corriger_grume` à 13 paramètres (les versions 8, 10, 11, 12 restent). Parcs proposés : celui de la grume nommée la plus proche en premier (GPS). Nom tapé en minuscules rattaché au parc connu. Provenance changée → nom retiré.

**Pictogrammes « cernes »** — famille A retenue, point indigo (exception à la règle de l'indigo : signature du logo). Accueil, barre du bas, onglets ordinateur, menu du bureau. Carrés de l'accueil : aplat de couleur, forme un peu irrégulière, symbole blanc ; Ajouter noir, Voir indigo, Sortir gris (`--cendre`), Carte **vert mousse `#56705A`** (`--mousse`), Ticket orange. Bouton « Voir la carte » (lien, ↗) entre Sortir et Ticket retour ; au bureau, dans Export tableur.

**Graphisme « trait à main levée »** (mobile, tablette, bureau) — compromis entre « léger » et « affirmé » : cadres au trait d'encre (`--trait-main`, 1,4 px `--encre`), coins un peu inégaux (`--rayon-main`, `--rayon-main-doux`, `--rayon-picto`), total du stock de l'accueil en cadre indigo avec hachures légères, bande « exceptionnelle » or hachée. Tout est regroupé en fin de `ui.css` et de `bureau/ui.css` : pour revenir en arrière, retirer ce bloc. Écarté : hachures dans les carrés des pictogrammes, pictogrammes au trait noir.

**Bureau** — camembert des grumes aux couleurs des essences (le camembert des communes garde le dégradé d'indigo) ; export : colonnes Parc et Lieu ajoutées à la fin.

**Nettoyage** — 208 lignes en moins (11 020 → 10 812) : 144 déclarations CSS écrasées plus loin, 3 classes jamais utilisées, `calculerVolumes` (jamais appelée), un repli pour la colonne `grumes_keys`, l'ancien nom du réglage `diametre_gros_bout_max_cm`. Styles calculés identiques sur 20 091 éléments (45 écrans). Gardé : fonctions figées de `core.js`, passerelle Supabase, anciennes versions de `corriger_grume`, effacement des anciens brouillons.

Essais : carte 101 vérifications, pictogrammes 14, parc 11, bureau 8 (Playwright, base imitée ; outils dans `cartographie/tests`).

Hors code : mail aux communes (évolutions + carte), document « Références des calculs » mis à jour (5 lignes : GPS, lieu, parc, recherche de parc, fonds de carte).

---

## Session 25 novembre 2026 (8 h) — Accès Tronc Commun à toutes les communes

Aucun fichier de l'app n'a changé : tout se passe dans la base Supabase (migration `acces_lecture_tronc_commun`). Rien ne bouge sur les téléphones.

Décision du porteur : **un code de lecture réservé à Tronc Commun**, à part des codes des communes (option A). Le porteur gère Tronc Commun et distribue lui-même les codes. Le code n'est écrit dans aucun document du dépôt (dépôt public).

Ce qui a été créé :
- **Table `acces_lecture`** (code, nom, actif) : les codes de lecture. Elle n'est lisible par personne depuis l'extérieur. Pour couper un accès : passer `actif` à faux.
- **En-tête `x-code-lecture`** : le code de lecture voyage dans son propre en-tête, jamais dans `x-commune-code`. Les règles d'écriture des communes ne le reconnaissent donc pas : il ne peut rien écrire.
- **`verifier_code()` ne lit que `codes_acces`** : l'app mobile et le bureau refusent ce code. Personne ne peut s'en servir dans l'app (il y afficherait le stock de toute la métropole comme le sien).
- **Fonctions de lecture** (pour la carte et la synthèse) : `tc_verifier()` (renvoie « Tronc Commun » si le code est bon), `tc_grumes()`, `tc_sorties()`, `tc_campagnes()`. Chaque ligne est un objet complet : les colonnes ajoutées plus tard (ex. « lieu ») y apparaîtront d'elles-mêmes. Le code de la commune est retiré, remplacé par son nom officiel (`commune`, tiré de `codes_acces`). Communes de test exclues. Sans code valide : aucune ligne.
- Appel depuis une page web : `POST /rest/v1/rpc/tc_grumes` avec les en-têtes habituels (`apikey`, `Authorization`) plus `x-code-lecture: <code>`.

Essais faits dans la base, à la place de l'app (rôle `anon`) : sans code ou avec un faux code → 0 grume ; avec le code → 7 grumes (Saint-Sébastien-sur-Loire), sans `commune_code`, colonnes récentes présentes ; le code tapé dans l'app → refusé ; écriture avec le code → refusée ; table des codes de lecture → illisible ; une commune lit toujours ses grumes et le stock métropole est inchangé. Essai par Internet impossible depuis l'espace de travail de Claude (réseau filtré) : il se fera avec la carte.

Lien avec A12 (séparer identifiant public et code secret) : indépendant. L'accès de lecture continuera de fonctionner quand A12 sera faite.

---

## Session 25 novembre 2026 (matin) — Couleurs de l'app mobile

Constat : sur mobile, les couleurs d'essence (tons de bois : miel, blond, brun) se confondaient avec les couleurs d'état de la grume (or, ardoise).

Décisions du porteur :
- **Essences en palette « Atelier »**, la même que la carte. Les 9 essences qui n'avaient pas de couleur en ont reçu une : Aulne saumon `#DF9081`, Châtaignier brun noisette `#86623C`, Chêne des marais vert de gris `#56827C`, Cyprès vert sapin `#045F3B`, Douglas vieux rose `#A9605E`, Épicéa vert d'eau `#A8CFC0`, Mélèze cuivre `#B97942`, Merisier framboise `#A03454`, Noyer brun chocolat `#462C1F`. Aucun jaune ni or. Les 21 valeurs sont dans `theme.css`.
- **État de la grume** : chaque information a sa forme. L'essence = pastille ronde et barre. L'état = bande à gauche de la fiche et un mot écrit. Standard : bande presque invisible (`--brume`). Exceptionnelle : or. Mauvais état : ardoise hachurée (pour la séparer du Noyer et du Cyprès).
- **L'or reste** pour les exceptionnelles. Piste étudiée : les codes de martelage (ONF : chamois pour l'arbre d'avenir ; Ontario : jaune ou orange à abattre, bleu à conserver). Le chamois foncé a été montré, l'or a été gardé.
- Le dégradé d'indigo pour les essences a été écarté : on ne distingue pas 20 essences en nuances d'un seul bleu, et l'indigo reste l'accent unique.
- Le bureau prend aussi ces couleurs (il lit le même `theme.css`). La synthèse les a reçues le même jour.

Livré : `feat/couleurs-atelier` (v79) et `feat/badge-etat-fiche` (v80), fusionnées dans `main`. Synthèse : maquette fusionnée dans `main` du dépôt `synthese`, palette Atelier, logo Duramen Cartographie (E2b) en pied de chaque carte.

---

## Session 24-25 novembre 2026 (nuit) — Cartographie des grumes (simulations, aucun code de Duramen)

Aucun fichier de Duramen n'a changé. Travail fait à part, sur des grumes fictives.
Sources des simulations : `01-Projet/Claude outputs/carte-simulation.zip` dans le coffre Obsidian (le dépôt `synthese` n'était pas accessible en écriture).

Décisions du porteur :
- **La carte est une application à part**, comme la synthèse, pour ne pas alourdir Duramen. Elle lit la base sans y écrire. Plus tard, un lien « Voir la carte » dans la partie export du bureau.
- **Deux publics** : chaque commune voit sa propre carte (version simple). Tronc Commun voit toutes les communes et garde l'exclusivité du graphisme soigné, réservé aux rendus de la synthèse (cartes fournies à la demande). L'accord pour l'accès de Tronc Commun à toutes les communes est donné (projet expérimental, données non sensibles).
- **Noms de lieux sans les agents** : le parc, la rue ou le quartier se retrouvent à partir du point GPS (service gratuit de l'IGN, et OpenStreetMap pour les parcs). Le nom est **enregistré dans la base** une fois, à l'arrivée de la grume (nouvelle colonne « lieu »), pas recherché à chaque affichage.
- **Carte écran** : fonds IGN gratuits. Vue aérienne adoucie avec les noms de rues (style « toponymes »), ou plan « épuré ». Un plan IGN dessiné sur mesure (tuiles vectorielles) viendra ensuite.
- **Critères sobres** : une ligne de boutons (Essence, Cause avec tempête, État, Dates), une recherche de lieu, la liste repliée sous la carte.
- **Code des points** : un rond plein à la couleur de l'essence, sans contour. Chaque critère ajoute un cercle autour sans changer la taille du rond : or = exceptionnelle, ardoise = mauvais état, blanc = débitée.
- **Palette D « Atelier »** pour la cartographie (tons doux de textile) : Platane #C3432A, Chêne #6E3A69, Chêne rouge #EA753E, Frêne #709567, Tilleul #506715, Peuplier #8A78A5, Hêtre #E2B19C, Robinier #D67EA8, Cèdre #147590, Pin #88AAE6, Séquoia #771F04. À décliner pour les autres essences ; essences rares et noms « Autre » en gris neutre ; une essence garde toujours la même couleur. Pas de jaune ni d'or pour une essence (l'or marque les exceptionnelles).
- **Carte papier** (Tronc Commun) : gabarit de la synthèse, grumes groupées en grappe autour de leur lieu, logo cartographie E2b dans le bandeau. Deux fonds testés : au trait (hachures, Loire) et plan IGN grisé.

Constats :
- Le cercle ardoise se perd sur la photo aérienne sombre.
- Les grumes d'un même arbre ont la même position GPS : à l'écran, leurs ronds se superposent (la grappe du papier règle ce point).
- Un point peut tomber dans l'eau (Erdre, Loire) : marge d'erreur, ou saisie faite depuis l'autre rive ou au dépôt. Idée : signaler au bureau les points tombés dans l'eau.
- Sur mobile, la couleur des essences et les couleurs d'état de la grume se confondent : session couleur à prévoir.

---

## Session 24 novembre 2026 (21 h) — Diamètre au plus large

- Le porteur revient sur la règle des 80 cm : la limite de la scierie porte sur le diamètre au plus large, pas sur le Ø médian. Choix de l'option 2 : mesurer le diamètre au plus large dès 60 cm de Ø médian (plutôt qu'une question oui/non).
- Raison : la cote de 80 cm n'est pas définitive. La base calcule « débit externalisé » elle-même (déclencheur `grumes_debit_externe`, plus grand des deux diamètres ≥ réglage `diametre_max_scierie_cm`) et recalcule toutes les grumes si le réglage change (déclencheur `reglages_recalcul_debit`). Le `debit_externe` envoyé par l'app est remplacé par ce calcul.
- Base : colonne `grumes.diametre_max_cm`, `corriger_grume` à 12 paramètres (+ `p_diametre_max`).
- Branche `feat/diametre-plus-large` (v77), en attente de validation. La branche `feat/tablette` (v76) attend aussi.

---

## Session 24 novembre 2026 (soir) — Couleurs d'état, stock allégé, tempêtes

Décisions du porteur :
- État de la grume en trois couleurs : standard gris clair (`--pierre`/`--neige`), exceptionnelle or (`--or` #E8B93A), mauvais état ardoise (`--ardoise` #4A4A44). Trois clartés différentes : lisibles au soleil et pour les personnes qui voient mal les couleurs.
- Stock mobile : plus de bilan à une date, plus d'export (restent au bureau). Fiche d'une grume : numéro, essence, cubage, date de débit, et l'état en bande de couleur. Le reste se lit dans « Corriger » (toucher la fiche).
- Titre : « Grumes en stock — date de débit du + au − urgent ».
- 80 cm : la règle seule, sur le Ø médian mesuré, sans question. On dit « débit externalisé », jamais « débit externe » ni « gros bout ». Réglage `diametre_max_scierie_cm` (l'ancien `diametre_gros_bout_max_cm` reste pour les téléphones pas à jour). La fonction `questionGrosBout` de core.js n'est plus utilisée.
- Intempérie : nom de la tempête facultatif, valable pour toutes les communes (table `tempetes`, lisible par toute commune connectée ; colonne `grumes.nom_intemperie` ; `corriger_grume` à 11 paramètres).
- Tablettes : le mode portrait est déjà demandé (`portrait-primary` dans manifest.json) mais ne règle pas tout : au-dessus de 600 px l'app passe en « grand écran » (pas d'accueil, pas de ticket retour, onglets petits). Solution retenue : déplacer ce seuil, contenu centré. À faire à part, avec captures téléphone identiques avant/après.

---

## Session 24 novembre 2026 — Retours terrain : causes, « Autre », grumes à part, GPS

Validées par le porteur et fusionnées dans `main` le 24 nov. 2026 (branches `feat/grumes-a-part` et `feat/gps-precis`). Mobile en cache `duramen-v68`. Tests rejoués sur la version fusionnée : 53/53.

Décisions du porteur :
- Causes d'abattage : « Intempérie (tempête, neige…) » remplace « chablis ». « Coupe sécuritaire » disparaît : ses grumes passent en « Coupe sanitaire » (fait dans la base le 24 nov.).
- « Autre » pour la cause et l'essence : on écrit le nom, il est proposé ensuite à toute la commune.
- Grume à stocker à part : état *Standard*, *Exceptionnelle* ou *Mauvais état*. Elle reste dans le stock et peut entrer en campagne comme les autres.
- Gros bout au-delà de la limite de la scierie mobile (80 cm, cote exacte à confirmer avec le scieur) : un simple marquage « Débit externe » sur la grume, sans blocage.
- On mesure le Ø médian. À partir de 60 cm (limite − 20), l'app demande « Gros bout de plus de 80 cm ? » (oui/non). À 80 cm de Ø médian ou plus : débit externe d'office.
- Mesure au diamètre seul : le calcul par la circonférence est retiré (règle aussi A9).
- GPS : position prise pendant la saisie, la plus précise gardée, marge d'erreur affichée. Sans position : placement à la main au bureau. Rien à faire pour l'agent.

`feat/grumes-a-part` :
- `core.js` (ajouts) : `ETATS_GRUME`, `libelleEtatGrume`, `grumeAPart`, `questionGrosBout`, `cleNom`, `DIAMETRE_GROS_BOUT_MAX_DEFAUT`.
- Mobile : listes avec « Autre… (écrire le nom) ». Le nom est comparé aux choix existants sans accents ni majuscules : « erable » reprend « Érable ». Sans réseau, le nom attend dans la file d'envoi sans s'afficher dans le bandeau. Copie gardée sur le téléphone (`duramen_noms_cache`, `duramen_reglages_cache`).
- Mobile : choix de l'état à la saisie et à la correction, question du gros bout sous la molette du diamètre, badges dans le stock et dans la préparation de campagne, ligne « À stocker à part » au-dessus du stock, colonnes d'export.
- Bureau : mêmes listes, état et gros bout dans la correction, badges, colonnes « Rangement » et « Débit externe » à l'export.

`feat/gps-precis` :
- Mobile : GPS démarré à l'ouverture de l'onglet Nouveau, arrêté ailleurs et téléphone en veille. Puce GPS du téléphone (`enableHighAccuracy`) : marche sans réseau. Position la plus précise gardée, figée à l'enregistrement. Puce « GPS · ±8 m », orange au-delà de 50 m.
- Bureau : badge « Sans position » et bouton « Placer sur la carte ». Fond IGN (plan ou photo aérienne, Géoplateforme), Leaflet 1.9.4 chargé à l'ouverture de la carte avec contrôle d'intégrité.

Base Supabase (ajouts, déjà en place) :
- Table `noms_personnalises` (commune_code, type `cause`/`essence`, nom) : lecture et ajout par sa commune, un nom une seule fois par commune (majuscules ignorées).
- Table `reglages` : lisible par tous. `diametre_gros_bout_max_cm` = 80.
- `grumes` : colonnes `etat` (`standard`, `exceptionnelle`, `mauvais_etat`), `debit_externe`, `gps_precision` (m), `position_manuelle`.
- `corriger_grume` à 10 paramètres (+ `p_etat`, `p_debit_externe`). L'ancienne à 8 paramètres reste pour les téléphones pas encore à jour.
- Fonction `placer_position_grume(p_id, p_latitude, p_longitude)` : sa commune, point en France métropolitaine.

Tests : règles de la base rejouées en SQL puis annulées. Navigateur, base imitée : 39 vérifications sur la première branche (mobile et bureau, hors ligne compris), 14 sur la seconde (GPS simulé, carte).

---

## Session 20 novembre 2026 — Supprimer une grume saisie par erreur

Validée par le porteur et fusionnée dans `main` le 20 nov. 2026 (branche `feat/supprimer-grume`). Mobile en cache `duramen-v65`.

Décisions du porteur : on peut supprimer une grume, sur le mobile et le bureau, en gardant une trace.

Comment ça marche :
- Bouton rouge « Supprimer cette grume » dans la fenêtre « Corriger », à part des autres boutons.
- Mêmes conditions que la correction : grume de sa commune, dans aucune campagne de sciage, pas sortie du stock.
- Confirmation explicite qui rappelle la grume (numéro, essence, mesures, volume). Elle rappelle aussi qu'une grume sciée ou donnée passe par une sortie.
- Le numéro redevient libre.
- Bureau : relit la base juste avant. Si la grume a été corrigée depuis un autre poste, la fenêtre se rouvre : rien n'est supprimé.

Base Supabase :
- Table `grumes_supprimees` : la grume entière telle qu'elle était (`donnees`), son numéro, son essence, son volume, la source (`mobile` ou `bureau`), la date. Lecture par sa commune, aucune écriture directe.
- Fonction `supprimer_grume(p_id, p_source)` : mêmes vérifications que `corriger_grume`, même verrou, écrit la trace puis supprime.
- **Règle `grumes_delete` supprimée** : elle laissait supprimer une grume sans aucune vérification, même en campagne ou sortie. Seule la fonction supprime désormais. Conséquence : l'ancienne version (passerelle `lots`) ne peut plus supprimer de lot.

---

## Session 19 novembre 2026 — Corriger une grume (premier ticket retour)

Validée par le porteur et fusionnée dans `main` le 19 nov. 2026 (branche `feat/corriger-grume`). Mobile en cache `duramen-v64`.

Le ticket : une grume enregistrée ne pouvait plus changer (ex. diamètre mal saisi).

Décisions du porteur :
- **Tout se corrige sauf le numéro** : essence, provenance, cause, date d'abattage, longueur, diamètre, repère.
- **Jusqu'à l'entrée dans une campagne de sciage.** Ensuite la grume ne se corrige plus. Une grume sortie du stock non plus.
- **Molettes de mesure élargies** : diamètre 20 → 150 cm, circonférence 63 → 471 cm, longueur 1,70 → 12 m. Saisie et correction.

Le numéro s'attribuait déjà après coup : bouton « Attribuer un numéro » sur une grume « En attente de marquage ».

Comment ça marche :
- Bouton « Corriger » sur chaque grume du stock de sa commune. Absent sur une grume en campagne (badge « À débiter »).
- La fenêtre reprend les valeurs enregistrées et les molettes de la saisie. Le volume se recalcule en direct.
- Avant d'enregistrer, l'agent lit la liste des changements et confirme.
- Il faut du réseau, comme pour attribuer un numéro.
- `core.js` : ajout de `validerCorrectionGrume(grume)`. Aucune fonction existante modifiée.
- `app.js` : listes provenance et cause mises en commun (`OPTIONS_PROVENANCE`, `OPTIONS_CAUSE`) pour la saisie et la correction.

Base Supabase (ajout uniquement) :
- Fonction `corriger_grume(p_id, p_essence, p_provenance, p_cause, p_date_abattage, p_repere, p_longueur, p_diametre)`. Elle vérifie la commune, refuse une grume en campagne (`GRUME DANS UNE CAMPAGNE`) ou sortie (`GRUME DÉJÀ SORTIE`), une date future, un champ vide. Elle recalcule le volume.
- Même verrou que la création d'une campagne (`cles|commune`) : les deux passent l'un après l'autre.
- La table `grumes` reste fermée aux modifications directes.

Tests : règles de la base rejouées en SQL puis annulées, base inchangée. Navigateur avec base imitée : bons boutons, volume juste, carte mise à jour, molettes jusqu'au bout.

Version bureau (branche `feat/bureau-corriger-grume`, validée et fusionnée le 19 nov. 2026) :
- Bouton « Corriger » dans la colonne État de l'onglet Grumes. Absent sur une grume en campagne.
- Champs de saisie au clavier. Mêmes bornes que les molettes du mobile. Longueur arrondie à 5 cm.
- Juste avant l'envoi, le bureau relit la base. Si la grume a été corrigée depuis un autre poste, la fenêtre se rouvre sur les nouvelles valeurs : rien n'est écrasé.
- Même fonction `corriger_grume` dans la base. `core.js` inchangé.

---

## Session 13 novembre 2026 (soir) — Version bureau refaite

Validée par le porteur et fusionnée dans `main` le 13 nov. 2026 (branche `feat/bureau-campagnes`, supprimée). En ligne : bureau refait, mobile en cache `duramen-v57`.

Décisions du porteur :
- **Le bureau sert les ateliers de menuiserie et les responsables.** Il commence à la campagne de sciage et va jusqu'à la pose de l'objet. La saisie et la numérotation des grumes restent sur le mobile.
- **Suivi par étapes** : chaque sortie de stock devient un projet. Bois sorti → objet réalisé → objet posé, avec date et lieu de pose.
- **Grume entière** : gardée au bureau en exception, même règle que le mobile.
- **Verrou dans la base** contre deux campagnes sur la même grume.

Onglets du bureau : 1 · Grumes, 2 · Campagnes de sciage (préparer, feuille de débit, clôturer, supprimer), 3 · Produits bois (sortie pour un projet), 4 · Projets (suivi), Métropole, Export tableur, Ticket retour.

Le bureau envoie à la base des lignes de même forme que le mobile. Les calculs passent par `DuramenCore`. `core.js` est inchangé.

Export tableur (CSV, décimales à la virgule, ligne de total) : grumes en stock, toutes les grumes avec leur état, campagnes (demandé et réalisé), produits en stock, projets. Métropole possible pour les grumes en stock et les produits.

Base Supabase (ajouts uniquement, déjà en place) :
- `trg_verifier_reservation_campagne` (table `campagnes`) : refuse une campagne dont une grume est déjà dans une campagne ouverte (`GRUME DÉJÀ RÉSERVÉE`) ou déjà sortie (`GRUME DÉJÀ SORTIE`).
- `trg_verifier_reservation` (table `extractions`) : refuse la sortie entière d'une grume prévue dans une campagne ouverte (`GRUME RÉSERVÉE PAR UNE CAMPAGNE`). Le sciage passe.
- Ces deux verrous prennent le même verrou que les sorties de grumes (`cles|commune`) : deux enregistrements au même moment passent l'un après l'autre.
- `extractions` : colonnes `objet`, `date_realisation`, `date_pose`, `lieu_pose`. Écrites seulement par la fonction `enregistrer_suivi_sortie(p_ids, p_objet, p_date_realisation, p_date_pose, p_lieu_pose)` : sa commune, jamais un sciage, pose après réalisation.
- Étape d'un projet : calculée (posé si `date_pose`, réalisé si `date_realisation`, sinon à réaliser). Un projet regroupe les lignes d'une même sortie (même `date_iso`, même `destination`).

Deux agents en même temps (mobile et bureau) :
- Le bureau relit la base toutes les 2 minutes, au retour sur la fenêtre et au retour du réseau. Une fenêtre de saisie ouverte reste en place.
- Avant chaque enregistrement, le bureau relit la base et vérifie de nouveau. Si un autre poste est passé avant, la base refuse, le bureau l'explique et reconstruit la fenêtre sur le stock réel.
- Brouillons du bureau sous des clés à part (`duramen_bureau_draft_campagne_<commune>`, `duramen_bureau_draft_cloture_<commune>`) : aucun mélange avec le mobile ouvert sur le même poste.
- Mobile : messages clairs pour les deux nouveaux refus et pour une campagne supprimée pendant la clôture. Cache `duramen-v57`.

Points clos par cette session : grume sans numéro affichée « null », grume sciée comptée en stock, A17 (vérification sur données fraîches et refus de la base expliqués ; la session restaurée au rechargement reste à revérifier, comme A7), A18 (total sur toutes les grumes), A19 ④ pour l'export du bureau (texte commençant par `=` neutralisé). **A15 disparaît** : le bureau n'enregistre plus de « débit en planches ». Le stock de grumes est en volume brut, le stock de produits en volume réel scié.

Tests : 87 vérifications dans un navigateur, base imitée, version mobile réelle à côté (parcours complet, export, 9 cas de conflit entre deux postes, sans réseau). Règles de la base rejouées en SQL puis annulées : base inchangée.

---

## Session 13 novembre 2026 — Cadrage de l'application de synthèse (aucun code)

Session de cadrage. Aucun fichier de l'application n'a changé.

Trois outils, trois publics (décision du porteur) :

| Outil | Pour qui | Rôle |
|-------|----------|------|
| Duramen mobile | Agents de terrain | Saisie, urgence de débit, séchage |
| Duramen bureau | Gestionnaires, menuisiers | Données, graphiques, export Excel |
| Synthèse | Tronc Commun seul | Chiffrage, analyse, cartes, dossier PDF |

Application de synthèse — décisions :
- **Application web séparée** de Duramen. Elle lit la base en lecture seule.
- **Tronc Commun garde la main** : la synthèse est un service en plus. Les communes reçoivent le PDF. La grille de prix, le chiffrage et l'analyse restent chez Tronc Commun.
- **Chiffrage** : bois en grume brute et en produits bois, au prix courant (valeur d'achat pour les communes) à une date donnée. Grille de prix datée.
- **Destinataires du dossier** : services nature et jardins, gestion forestière, élus.
- **Carte à calques** : abattage (point GPS de la saisie) → stockage → réalisation (lieu noté dans Duramen à l'utilisation ou au réemploi, avec photos). Une carte métropole et une carte détaillée par commune.
- **Style de carte retenu** : trait d'encre, un seul trait fin, 24 communes (limites officielles), Loire en courbe, prolongée un peu au-delà de la métropole.
- **PDF** : calques interactifs pour Acrobat Reader, plus une page par calque pour les autres lecteurs.
- **Mise en page** : couverture (Tronc Commun, date, titre « Document de synthèse — Application Duramen », carte) et pages intérieures (bandeau, 3 chiffres clés, graphique, carte, note, pagination). Pied de couverture : « Document établi par Tronc Commun. »
- **Graphiques retenus** : barres au trait, courbe avec hachures, cernes. Encre et indigo.
- **Note de bas de page** : « Les données présentées dans ce document proviennent exclusivement des saisies effectuées par les agents des communes dans l'application Duramen. Elles sont restituées en l'état, sans vérification ni correction. Tronc Commun ne saurait être tenu responsable des erreurs, omissions ou inexactitudes résultant de ces saisies. »

Traçabilité au sciage — principe retenu :
- Chaque grume reçoit une étiquette. Son numéro est saisi à chaque étape.
- Sciage « en plot » : les planches d'une grume restent dans la même pile. La pile garde le numéro de la grume. Le numéro est aussi écrit en bout de planche.
- À voir avec le scieur avant la première campagne : une pile = une grume.

Pour les agents (page courte par commune) : où se trouve le bois, photos des réalisations, saisies à compléter. Les urgences de débit et le séchage sont déjà dans le mobile. Les montants en euros restent pour les services et les élus.

Ordre de travail décidé :
1. **Session bureau d'abord** : aligner le bureau sur le mobile et trancher A15 (volume brut ou volume utile). Le chiffrage de la synthèse dépend de ce choix.
2. **Synthèse ensuite.**

Il manque encore pour coder la synthèse :
- La grille de prix (source, niveau de détail).
- Les données réelles, après le point du porteur avec les agents.
- Les lieux de stockage, le lieu d'utilisation et les photos dans Duramen.
- Un accès Tronc Commun en lecture sur toutes les communes, avec l'accord des communes.
- Le périmètre du PDF : par commune, métropole ou les deux, et la période.

---

## Session 3 novembre 2026 (soir) — Campagne de sciage (branche `feat/campagne-sciage`)

Décisions du porteur :
- **Stock en deux états** : grumes brutes, puis produits bois. La feuille de débit (campagne de sciage) fait le passage de l'un à l'autre.
- **Campagne** : seulement une **date prévue** (le nom « Campagne du JJ/MM/AAAA » en découle) et des grumes cochées, chacune en **plot** (épaisseur standard 27/41/54/65/80 mm, nombre de planches estimé) ou en **avivé** (section en saisie libre). Feuille imprimable « Demandé / Réalisé ». À la clôture, la colonne « Réalisé » est pré-remplie avec le demandé : on ne corrige que les écarts. QR code optionnel, plus tard.
- **Clôture uniquement avec réseau** (un seul envoi : tout passe ou rien).
- **Badge d'urgence de débit** : date de saisie + durée max en grume (tableau FIBOIS : 1 mois / 6 mois / 1 an). Orange à 75 % du délai, rouge au-delà. Essences absentes du tableau : 1 mois.
- **Séchage** : règle unique **1 an par cm** de la plus petite cote, depuis la date de clôture de la campagne. Libellé « Sec à l'air ». Calculé, jamais enregistré (règle ajustable plus tard). **Information seulement, jamais un blocage** : un produit en séchage peut être sorti.
- **Extraction** : on sort des **produits sciés** (nombre de pièces par produit) ; la grume brute reste possible en exception (rondins, pas japonais), **sauf si elle est dans une campagne en cours**. Le débit en planches de l'ancien écran Extraction est retiré : il passe par la campagne.
- Statuts grume (brute / à débiter / débitée) **calculés**, jamais enregistrés.

Modèle de données (Supabase, ajouts uniquement) :
- `campagnes` : `lignes` (jsonb) = choix de débit par grume. Ajout/suppression seulement ; une campagne clôturée ne peut plus être supprimée.
- `extractions.type_sortie` : `sciage` (grume → produits réels dans `produits`), `produit` (sortie de produits : `produits` = [{cle, quantite, volume}], **volume = 0** imposé pour ne pas retirer deux fois le bois du stock de grumes ; volume réel dans `vol_produits`), `grume brute`, `debit` (ancien).
- Clé d'un produit : `<id extraction sciage>_<position>`.
- Verrou `trg_verifier_cles` : une grume ne sort qu'une fois ; on ne sort pas plus de produits qu'il n'en reste.
- Métropole : `grumes_en_stock_partagees()` (grumes non sorties) et `produits_partages()` (produits restants). `grumes_partagees()` inchangée.

Point repéré : le document `SECHAGE_essences.md` confond semaines et mois dans ses tableaux de durée (ex. 27 mm feuillus durs : « 13–14 mois » = 5 sem/cm × 2,7 cm en semaines).

## Session 3 novembre 2026 — Le lot devient la grume (branche `feat/grumes`)

Décisions du porteur :
- **Une saisie = une grume.** Plus de quantité ni de lignes multiples. Le modèle garde le tableau `grumes` (1 élément) : l'extraction par clé `id_0` reste valable.
- **Nom de grume** : préfixe commune + tiret + 4 chiffres tapés par l'agent (`VER-0001`). Préfixes dans `core.js` (`PREFIXES_COMMUNES`). Fixés par le porteur : VER, BOU (Bouguenais), NAN, ORV, SEB, NM. Les autres : 3 lettres sans article ni « Saint » (BOA = Bouaye, HER = Saint-Herblain…). Nom unique par commune (index `grumes_nom_unique`).
- **Partage automatique** : toutes les grumes sont visibles des autres communes (`grumes_partagees()`, communes de test exclues). Bouton « Partager » supprimé.
- **Nouvelle commune « Nantes Métropole »** (code NM-…). Le stock partagé s'appelle désormais « métropole ».
- **Extraction = débit en planches uniquement**, trait de scie 3 mm et rendement 50 % fixes (`DuramenCore.TRAIT_SCIE_MM`, `RENDEMENT_GEOM`).
- Essences : Chêne, Chêne rouge, Frêne, Platane, Pin, Chêne des marais, Cèdre, puis ordre alphabétique (`DuramenCore.ESSENCES_ORDRE`).

Supabase : table renommée `grumes`. Une **passerelle temporaire** (vue `lots` + fonction `lots_partages()`) garde la version en ligne fonctionnelle jusqu'à la fusion. Colonne `extractions.cause_abattage` gardée jusqu'à la fusion (la version en ligne l'envoie encore).

Tests : saisie, doublon, extraction, vue métropole testés dans un navigateur (Supabase simulé, colonnes vérifiées), puis envois rejoués en SQL avec le rôle public et l'en-tête commune (RLS, verrou de stock, index unique : OK), annulés ensuite. Base toujours vide.

 — A6, A10 et brouillon fusionnés dans main ✅

Trois branches testées en local, validées par le porteur sur téléphone, puis fusionnées le soir même (branches supprimées) :

1. **A10 — nettoyage du code mort** (merge a34ab42) : ancien formulaire 3 étapes, panneau Territoire, 16 fonctions orphelines d'`app.js` et blocs `ui.css` associés supprimés (~1 440 lignes). ⚠️ `supprimerLot` faisait partie du code mort : l'interface n'offre plus aucune suppression de lot (A8 à repenser).
2. **Brouillon de saisie** (merge a01778b) : restauration silencieuse du brouillon — plus de boîte « Reprendre ? » qui effaçait le brouillon sur Annuler.
3. **A6 — grumes extraites** (merge 398c29a) : colonne `extractions.grumes_keys` créée dans Supabase (clé = `lotId_positionGrume`), grumes déjà extraites masquées de la sélection (mobile + bureau), bloc « Bilan du stock » à une date choisie dans l'onglet Stock.

- Cache SW : `duramen-v35` → `duramen-v38` (une version par branche).
- Mise en ligne : le déploiement GitHub Pages du commit de fusion a échoué (incident passager côté GitHub). Relancé par un commit vide (a3d392c) — site vérifié en v38 le 2 juillet au soir.

---

## Session 2 novembre 2026 — Scan smartphone + hors ligne, veille du lancement

Test réel de l'app sur smartphone simulé (360 px et 320 px), réseau coupé puis réseau faible. Aucun débordement d'écran. Consultation hors ligne et brouillon fonctionnent.

**Corrigé sur la branche `fix/envoi-hors-ligne`**, fusionnée depuis :
- **File d'envoi hors ligne** (clé localStorage `duramen_file_envoi`) : lots et tickets validés sans réseau partent seuls au retour du réseau. Les extractions n'y passent pas : elles se font à l'atelier, avec réseau (décision du porteur).
- **Anti-doublon** : chaque élément garde son identifiant ; un refus 23505 au renvoi signifie « déjà en base ».
- **Réseau faible** : requêtes limitées à 15 s / 20 s ; rafraîchissement auto silencieux (`chargerDonnees({ silencieux: true })`).
- **Tickets retour** : envoyés avec `return=minimal`. La table `feedbacks` n'a qu'une policy INSERT : demander la ligne en retour était refusé (vérifié par un essai annulé dans la base). Les tickets restent lisibles par le porteur seul, dans Supabase.
- **Service Worker** : installation avec `cache: 'reload'`, POST hors SW, cache `duramen-v43`.

**Relevé, non traité (session Design)** : A20 zoom iPhone (bloc mobile écrasé dans `ui.css`), A21 contrastes et petits textes, A22 zones tactiles, A23 déconnexion inaccessible sur mobile. Voir [[TASKS]].

**Constat** : la « mémoire tampon » hors ligne n'avait jamais été codée. Elle figurait seulement dans les évolutions prévues.

**Accès GitHub** : Claude est relié au compte **TroncCommun-Duramen** (le compte Paquito-app sert à l'app apnée). L'application Claude GitHub est installée sur le seul dépôt `duramen`, avec droit d'écriture. Accès permanent.

---

## Session 2 juillet 2026 (après-midi) — Audit A2 : RLS Supabase — TERMINÉ ✅ (constat)

### Périmètre
Vérification de l'état réel du Row Level Security sur les tables `lots`, `extractions`, `codes_acces` (+ `feedbacks` découverte). Session de **constat uniquement** — aucune modification de la base ni du code. Test effectué avec la clé anon publique contre l'API REST.

### Ce qui a été vérifié
RLS **activé sur les 4 tables** (bouton « Disable RLS » affiché = actif). Texte des règles lu via `select … from pg_policies`. Résultats confirmés par requêtes réelles avec la clé anon :

| Table | Règle lecture (`qual`) | Verdict |
|-------|------------------------|---------|
| `codes_acces` | `SELECT` : `actif = true` | 🔴 **FUITE** — la clé anon lit TOUS les codes de TOUTES les communes (testé : les codes de plusieurs communes renvoyés en une requête). Le code EST le mot de passe. |
| `extractions` | `SELECT` : `commune_code = get_commune_code()` ; INSERT/DELETE idem + `<> ''` | 🟢 OK — test sans code → `[]`. Isolation réelle côté serveur. |
| `lots` | `SELECT` : `commune_code = get_commune_code() OR partage = true` ; INSERT/DELETE : commune propre | 🟢 OK — seuls les lots `partage = true` remontent (feature « vue communauté » voulue). |
| `feedbacks` | INSERT seul (`with_check` sur commune) | ⚪ Hors périmètre projet — pas de lecture publique, sans risque. Table non documentée à l'origine. |

### Conclusion
Le RLS est **globalement sain** : l'isolation `lots`/`extractions` repose bien sur la fonction serveur `get_commune_code()` (lit l'en-tête `x-commune-code`), pas seulement sur le filtre client. **Le seul trou réel est `codes_acces`** — mais c'est le plus sensible.

### Correctif à prévoir (SESSION DÉDIÉE, pas encore fait) 🔴
Ne PAS fermer la lecture de `codes_acces` sans adaptation : la connexion (`app.js` ~L1263) lit cette table pour vérifier le code saisi. Solution propre : créer une **fonction RPC sécurisée** (SECURITY DEFINER) qui prend un code et renvoie seulement `{valide, commune}`, puis passer la policy `codes_acces_select` à `false` (lecture directe interdite). Modification coordonnée **Supabase + `app.js`** → session Feature dédiée.

### Security Advisor — état au 2 juil. 2026
- **0 erreur, 0 info.** ⚠️ Rappel : « 0 erreur » ne détecte PAS la fuite `codes_acces` — le linter vérifie que RLS est actif + qu'une policy existe, pas si son contenu est sûr. Toujours tester une policy avec la clé anon.
- **1 warning** 🟠 : `Function Search Path Mutable` sur `public.get_commune_code` — c'est LA fonction qui porte l'isolation `lots`/`extractions`. `search_path` non figé = durcissement recommandé (risque réel faible ici, la fonction ne lit qu'un en-tête). Correctif 1 ligne côté Supabase : `ALTER FUNCTION public.get_commune_code() SET search_path = '';` (à valider/adapter selon corps de la fonction).

---

## Session 11 mai 2026 — Audit de sécurité et de précision — TERMINÉ ✅

### Périmètre
Audit complet des deux interfaces (mobile `app.js` + bureau `bureau/app.js`) et du noyau `core.js`. Backlog entièrement vidé. Application propre à l'issue de la session.

### Corrections appliquées

| Ref | Fichier | Correction |
|-----|---------|-----------|
| R1 | `app.js`, `index.html` | `vol_utile = vol_brut` décision métier assumée — labels corrigés en `m³ bruts` |
| R2 | `bureau/app.js` | Formule volume corrigée : `V × rendement × (e / (e + t))` |
| R3 | `bureau/index.html` | Overlays morts supprimés (`b-grumes-overlay`, `b-dest-overlay`) |
| R4 | `app.js` | `afficherTerritoire()` réécrite avec `textContent` / `createTextNode` |
| R5 / S1 | `core.js` | `getStock()` : guard `typeof` + `extsData.forEach` (plus `extractions.forEach`) |
| R7 | `app.js` | `DuramenCore.sortie()` fantôme supprimé de `soumettreSortie()` |
| R9 | `bureau/app.js` | Linéaire corrigé : `util × 5000 / ep` (formule dimensionnellement correcte) |
| R10 | `bureau/app.js` | Précision volumes harmonisée à `.toFixed(3)` partout |
| R11 | `app.js` + `ui.css` | Barres de stock : `--barre-pct` via `setProperty()` + `var()` en CSS |
| S2 | `sw.js` | Cache incrémenté `duramen-v29` → `duramen-v30` |
| S3 | `app.js` | 4 volumes restants harmonisés à `.toFixed(3)` |
| S4 | `bureau/app.js` | Tableau métropole, chips essence, entêtes lot — données Supabase via DOM pur |
| S5 | `bureau/app.js` + `bureau/ui.css` | Styles inline supprimés → classes `.b-donut-vide` (12px) et `.b-chips-vide` (13px) |
| S6 | `bureau/app.js` | Légende donut commune (`ess`) via `textContent` |
| S7 | `bureau/app.js` | Légende donut métropole (`seg.nom`) via `textContent` |
| S8 | `bureau/app.js` | Lignes grume (`bLabelGrume`, `bMetriquesGrume`) via DOM pur |
| D1 | `bureau/app.js` | `bAfficherEssences()` supprimée — code mort jamais appelé |
| D2 | `bureau/ui.css` | Règles CSS orphelines `.b-grumes-overlay` et `.b-dest-overlay` supprimées |

### État post-audit
- **Zéro vecteur XSS distant** : toutes les données Supabase passent par `textContent` ou `createTextNode`
- **Zéro style inline** dans `bureau/app.js`
- **Zéro code mort** dans `bureau/app.js`
- **Zéro règle CSS orpheline** dans `bureau/ui.css`
- **Formules métier correctes** : volume, linéaire, rendement
- **Cache SW à jour** : `duramen-v30`

### `innerHTML` restants — tous inoffensifs
Seuls subsistent des vidages (`= ''`), des chaînes statiques, et des nombres calculés. Aucune donnée Supabase.

---

## Session 10 mai 2026 — Audit Phase 1 + Phase 2

### Phase 1 — Corrections critiques ✅
- `var(--lin)` inexistante en CSS → remplacée par `.footer-link { color: var(--cendre) }` dans `ui.css`
- RLS Supabase inactif → SQL complet généré + 3 itérations (FORCE ROW LEVEL SECURITY, plpgsql VOLATILE, DROP ALL existantes)
- `afficherHistoriqueCommunaute()` retournait tous les lots sans filtre → `partage=eq.true&order=created_at.desc` ajouté
- Header RLS → `sbH['x-commune-code']` alimenté au login dans `app.js` et `bureau/app.js`
- Cache passé de **duramen-v27** à **duramen-v28**

### Phase 2 — Nettoyage code mort ✅
- Système d'extraction mort supprimé : `panel-extraction`, `modal-extraction` (index.html) + 8 fonctions JS dans app.js (`ouvrirModalExtraction`, `ouvrirModalExtractionEssence`, `fermerModalExtraction`, `majDisponible`, event listener `ext-essence`, `enregistrerExtraction`, `afficherExtractions`, `supprimerExtraction`) + branche morte dans `switchTab`
- Double-appel corrigé dans `demarrerRafraichissement()` : le `setInterval` ne fait plus qu'appeler `chargerDonnees()` — les appels redondants `afficherExtraction`/`afficherExtractions` supprimés (déjà couverts par `chargerDonnees`)
- `#hs-essences` reconstruit dans `ouvrirApp()` : le strong element est maintenant créé dynamiquement comme `hs-vol` et `hs-lots` → `mettreAJourHeaderStats()` peut le mettre à jour correctement
- Fonctions mortes supprimées : `nouvMajVol`, `badgeClass`, `exporterCSV`, `exporterStockCSV`
- `vol_brut` → `vol_utile` dans `bureau/app.js` lignes 148, 159, 379, 427 (totaux métropole et donut)
- Cache incrémenté `duramen-v28` → `duramen-v29`

---

## Session 10 mai 2026 — Refonte onglet Export (bureau)

### Onglet Export bureau — `bureau/app.js` + `bureau/index.html` + `bureau/ui.css` ✅
- Bouton "Tout exporter" supprimé — un seul bouton "Exporter la sélection"
- Colonnes CSV réordonnées : Commune · Nom du lot · Essence · Date · Provenance · Cause · Nb grumes · Vol. brut m³ · Partage avec NM
- Nb grumes et Vol. brut m³ exportés comme **nombres** (sans guillemets, virgule décimale pour Excel FR)
- Ligne TOTAL ajoutée en bas du CSV avec somme du volume brut
- Colonnes PÉRIMÈTRE et FILTRES BOIS centrées (`max-width: 720px; margin: 0 auto`)
- Bouton export : largeur automatique sur le texte (plus de `1fr 1fr` pleine largeur)
- Commit : `feat(bureau): refonte onglet export — colonnes CSV, total, mise en page`

### Point d'attention — Harmonisation mobile / bureau 🔴 Session dédiée requise
- Les deux versions ne partagent pas le même format de données à l'affichage et à l'export :
  - Mobile : `toFixed(3)`, colonnes vol_brut **et** vol_utile, valeurs entre guillemets (texte)
  - Bureau : `toFixed(2)`, colonne vol_brut uniquement, valeurs numériques
  - Le TOTAL CSV bureau additionne les floats bruts → décalage avec SUM Excel (accumulation d'arrondis)
- **Ne pas traiter dans une session export ou feature.** Ouvrir une session dédiée : "Harmonisation données mobile/bureau".

---

## Sessions mai 2026 — Version bureau (desktop)

### Architecture bureau — dossier `bureau/` ✅
- Fichiers dédiés : `bureau/index.html` · `bureau/app.js` · `bureau/ui.css`
- Partage `core.js` et `theme.css` de la racine (pas de copie)
- Layout 2 colonnes : colonne principale (onglets) + colonne extraction latérale fixe
- Responsive : colonne extraction masquée sous 900 px

### Onglets bureau ✅
- **Commune** : camembert essences (SVG), table des lots avec dimensions grumes, total m³, barres par essence
- **Nantes Métropole** : table lots partagés par commune, donut par commune, métriques globales
- **Export** : filtres source/essence/année + export CSV (voir session 10 mai)
- **Ticket retour** : identique au mobile

### Hero stats (4 tuiles) ✅
- Stock commune · Lots actifs · Extractions mois · Stock métropole
- **Attention** : Stock commune = `DuramenCore.getStock()` → `dispo` (vol_utile - extractions). Stock métropole = somme `vol_utile` (harmonisé le 10 mai 2026).

### Colonne extraction latérale ✅
- Popup 3 étapes : essence + type → sélection grumes cochables → destination
- Affichage des grumes disponibles avec dimensions (L, Ø)
- Pills de stock par essence

### Design bureau ✅
- Logo PNG `icon-512.png` en en-tête
- Bandeau onglets fond `var(--indigo)`, onglet actif souligné blanc
- Toggle Commune/Métropole en indigo, lignes alternées dans les tables
- Boutons filtres inactifs supprimés

---

## Session 2 mai 2026 — Correction mode hors ligne (zone blanche)

### Bug corrigé — Application inouvrable sans réseau (sw.js) ✅
- `theme.css`, `core.js` et `app.js` étaient absents de la liste `FICHIERS` dans `sw.js`. L'app chargeait `index.html` depuis le cache mais pas ses dépendances → page blanche ou erreur JS.
- Stratégie de fetch corrigée : passage de "réseau d'abord" à **"cache d'abord"** (`caches.match` avant `fetch`). Avant : l'app attendait une connexion inexistante avant de regarder le cache.
- Cache passé de **duramen-v19** à **duramen-v20**.
- Commit : `fix(sw): corriger le mode hors ligne en zone blanche`
- **Condition de déclenchement du fix** : chaque appareil doit ouvrir l'app une fois avec du réseau pour télécharger le cache v20.

---

## État du projet

- **Phase 0 ✅ entièrement terminée** — architecture 5 fichiers en place :
  `index.html` (HTML pur) · `theme.css` · `ui.css` · `core.js` · `app.js`
- Phase 0a ✅ : theme.css, ui.css extraits, styles inline supprimés
- Phase 0b ✅ : core.js (DuramenCore), app.js créés — index.html = HTML pur 555 lignes
- Phase 0c ✅ : accents ESSENCES_INFO, UUIDs, brouillon auto-sauvegardé, cache offline
- **Phase 1 — En cours** : interfaces mobiles finalisées, prêt pour premier test terrain

---

## Session 28 avril 2026 — Corrections et nouvelle feature saisie

### Bug corrigé — Linéaire indicatif (app.js) ✅
- Le linéaire indicatif ne se réinitialisait pas à `'—'` quand on repassait en mode "Grume brute" après avoir utilisé "Débit en planches".
- Corrigé dans `majDebitExtraction()` : ajout d'un `else` qui remet `linEl.textContent = '—'` quand `extDebitActif === false`.
- Commit : `fix(extraction): réinitialiser le linéaire indicatif en mode Grume brute`

### Nouvelle feature — Choix de méthode de mesure dans le panneau "Nouvelle grume" (app.js + ui.css) ✅
- Toggle 2 boutons côte à côte : **Ø Diamètre médian** (défaut) / **C Circonférence médiane**
- Méthode mémorisée dans localStorage, clé `duramen_mesure_methode`
- Formules : `V = π × (d/2)² × L` (diamètre) — `V = (C² × L) / (4π)` (circonférence, C en mètres)
- Plage circonférence : 63→220 cm (équivalent 20→70 cm de diamètre), pas 1 cm — via `CIRC_VALS`
- Stockage interne toujours en diamètre cm : conversion `d = Math.round(C / π)` à l'enregistrement
- Styles ajoutés dans `ui.css` : `.grume-methode-toggle`, `.grume-methode-btn`, `.grume-methode-btn.active`
- Commit : `feat(saisie): ajouter le choix de méthode diamètre / circonférence dans le panneau Nouvelle grume`

---

## Session 26 avril 2026 — Audit de conformité

### Audit complet des 3 fichiers principaux (index.html, app.js, core.js)

Objectif : vérifier la conformité au cahier des charges avant première présentation terrain.

### Résultats par fichier

**index.html — 555 lignes ✅ globalement sain**

- Architecture respectée : HTML pur, zéro logique JS, zéro règle CSS inline
- Fichiers appelés dans le bon ordre : `core.js` → `app.js`
- Service Worker enregistré au bon endroit (avant `</script>`)
- Authentification : aucun code d'accès dans le HTML ✅

Problèmes identifiés :
- **Bug ✅ corrigé** : double `id="lot-nom"` — résolu (vérifié le 26 avril 2026 : une seule occurrence en ligne 178).
- **Entorse mineure** : un `style="color:var(--lin);text-decoration:none;letter-spacing:0.08em"` subsiste dans le footer (ligne 543). À déplacer en classe `.footer-link` dans `ui.css` lors d'une prochaine session Design.

**app.js — 2164 lignes ✅ robuste sur le noyau**

- `crypto.randomUUID()` utilisé partout ✅
- Cache offline écrit après chaque succès Supabase ✅
- `DuramenCore.validerSortie()` appelé avant chaque extraction ✅
- Éléments DOM construits avec `cel()` dans les fonctions récentes ✅

Problèmes identifiés :
- **Coexistence de deux formulaires de saisie** : ancien (étapes 1→2→3, `sauvegarderLot`) et nouveau (mobile, `nouvConfirmer`). Les deux écrivent dans `lots[]` et Supabase. Fonctionnel — mais toute modification d'un formulaire doit vérifier l'autre. Ne jamais corriger l'un sans lire l'autre.
- **Deux systèmes de brouillon** : `duramen_draft` (ancien) et `duramen_draft_v2` (nouveau). `effacerBrouillonSaisie()` nettoie les deux correctement. Risque faible de confusion si un agent alterne les deux formulaires.
- **Concaténation HTML résiduelle** : les fonctions de l'ancien formulaire (`afficherGrumes`, `afficherExtractions`, `afficherTerritoire`, `calculerDebit`) construisent encore du HTML par concaténation de chaînes. Contraire aux règles du CDC. Fonctionnel aujourd'hui — à migrer vers `cel()` en Phase 2.

**core.js — 161 lignes ✅ propre et conforme**

- Signatures figées intactes ✅
- Module IIFE : aucune fuite dans l'espace global ✅
- Clés ESSENCES_INFO avec accents ✅
- `TRAIT_SCIE_MM` constante nommée ✅
- `validerSortie` bloque toute extraction supérieure au disponible ✅

---

## Choix assumés — à ne pas confondre avec des bugs

| Choix | Description | Impact |
|-------|-------------|--------|
| `vol_utile = vol_brut` dans le nouveau formulaire mobile | Quand un lot est saisi sans calcul de débit (formulaire mobile), `vol_utile` est égal à `vol_brut`. `getStock()` utilise `vol_utile` → le stock affiché est le volume brut, pas le volume débité. | Les chiffres de stock sont légèrement surestimés pour les lots sans débit. Acceptable en phase de test. À afficher clairement dans l'interface en Phase 2 (ex: "volume brut — débit non calculé"). |
| Double formulaire de saisie | L'ancien formulaire (3 étapes, desktop) et le nouveau (mobile, drums) coexistent. | ~~Intentionnel — transition progressive.~~ **Clos le 2 juillet 2026** : l'ancien formulaire a été supprimé (A10). Seul le formulaire mobile subsiste. |

---

## Points d'attention pour les prochaines sessions

| Priorité | Action | Fichier | Complexité |
|----------|--------|---------|------------|
| ✅ Résolu | ~~Corriger le double `id="lot-nom"`~~ — corrigé 26 avril 2026 | `index.html` | — |
| ✅ Résolu | ~~Linéaire indicatif non réinitialisé~~ — corrigé 28 avril 2026 | `app.js` | — |
| ✅ Résolu | ~~Audit sécurité/précision R1-R11, S1-S5, D1-D2~~ — terminé 11 mai 2026 | tous | — |
| 🟡 Phase 2 | Migrer concaténations HTML → `cel()` dans l'ancien formulaire mobile | `app.js` | Session dédiée |
| 🟡 Phase 2 | Afficher "volume brut — débit non calculé" pour les lots sans épaisseur | `app.js` + `ui.css` | Session dédiée |
| ✅ Résolu | ~~Vérifier RLS Supabase sur toutes les tables~~ — audité et corrigé le 2 juillet 2026 (fuite `codes_acces` bouchée, reste A12) | Supabase dashboard | — |

---

## Session 25 avril 2026 — Interfaces écrans métier

### Navigation — 4 onglets (app.js + index.html) ✅
- Onglets bottom nav : **Accueil · Nouveau · Stock · Extraction**
- Panel IDs stables : `panel-accueil`, `panel-saisie` (Nouveau), `panel-historique` (Stock), `panel-stock` (Extraction)
- `switchTab(panel, btn)` gère le routing et déclenche `afficherExtraction()`, `afficherExtractions()`, `afficherHistorique()`, `afficherTerritoire()` selon l'onglet

### Écran Nouveau — panel-saisie (app.js + ui.css) ✅
- Formulaire saisie grumes : essence (select), provenance, cause d'abattage
- `+ Ajouter une grume` ouvre un bottom sheet (drums longueur/diamètre + quantité)
- Chaque grume enregistrée apparaît en carte résumé avec badge ✓ vert (`--vert: #788d5d`)
- Modale "Nommer le lot" à la validation : nom libre + toggle partage communes
- Sauvegarde via `DuramenCore.entree()` + `sbInsert('lots', ...)`
- État : `nouvGrumes[]`, brouillon auto-sauvegardé clé `duramen_draft_v2`

### Écran Stock — panel-historique (app.js + ui.css) ✅
- Anciennement "Historique" — toggle **Ma commune / Nantes Métropole**
- Bloc total : fond `var(--sumi)`, volume m³ + nombre de lots
- Liste par essence : barres proportionnelles `var(--indigo)` sur piste `var(--brume)`
- 5 lots récents max, cartes `var(--neige)`, badges commune/essence/cause
- Export Excel (CSV UTF-8 BOM) et PDF (`window.print()`)

### Écran Extraction — panel-stock (app.js + ui.css) ✅
- Sélection grumes par essence via chips filtres + bottom sheet (grumes cochables par lot)
- Bascule **Grume brute / Débit en planches** (2 boutons côte à côte, grid 2 colonnes)
  - Grume brute (défaut) : barre synthèse 1 bloc — m³ brut fond `var(--sumi)`
  - Débit en planches : sliders épaisseur 20–50 mm (défaut 27), trait de scie 2–4 mm (défaut 3), rendement 30–70 % (défaut 50 %)
  - Barre synthèse 3 blocs : m³ extrait (sumi) · m³ utile (vert) · m³ déchet (orange)
  - Linéaire indicatif : `V_utile ÷ (e/1000 × 0.20)` en mètres, aligné droite, fond indigo
- Modale destination à la validation : nom projet (optionnel), commune d'installation, usage Intérieur/Extérieur, lieu (optionnel)
- Confirmation : `DuramenCore.sortie()` + `sbInsert('extractions', ...)` + toast + retour accueil
- État : `extGrumesSel[]`, `extDraft{}`, `extDebitActif` (bool), `extCommunes[]`

---

## Session 24 avril 2026 — Interfaces mobiles

### Fichier principal
- Renommé `duramen.html` → `index.html` (obligatoire pour PWA + GitHub Pages)

### Écran connexion (index.html + ui.css) ✅
- Logo `icon-512.png` centré, classe `.login-logo-img`
- Titre DURAMEN — Outfit 200, letterspacing 0.2em, uppercase
- Sous-titre "Gestion du bois d'œuvre"
- Champ CODE : fond `var(--indigo)`, texte blanc, `autocapitalize="characters"`
- Bouton ACCÉDER : 56px minimum, fond `var(--sumi)`, texte blanc

### Écran accueil mobile (index.html + ui.css) ✅
- Panel `#panel-accueil`, affiché sur mobile uniquement (`@media (min-width: 601px) { display: none !important }`)
- Badge commune : classe `.home-commune-badge`, fond indigo, texte blanc
- Stock total : `#accueil-stock-val` en gros chiffre + `.home-stock-unit` "m³ disponibles"
- 3 boutons `.btn-home` : `width: calc(100% - 32px)`, `border-radius: 12px`, hauteur min 56px

### Service Worker
- Cache actuel : **duramen-v38** (2 juillet 2026)

---

## Supabase — Tables et structure

**Table `lots`**
- `id` — UUID (migré depuis bigint le 19 avril 2026)
- `commune_code` — code d'accès de la commune
- `nom` — nom du lot
- `essence` — essence de l'arbre
- `commune` — nom de la commune
- `cause` — cause d'abattage
- `provenance` — origine (alignement, bosquet…)
- `annee` — année de coupe
- `usage` — usage prévu
- `vol_brut`, `vol_utile`, `vol_dechets` — volumes en m³
- `nb_grumes`, `nb_planches` — comptages
- `lineaire` — linéaire en mètres
- `epaisseur`, `delta` — paramètres de débit
- `grumes` — tableau JSON des grumes individuelles
- `partage` — booléen (visible aux autres communes ?)
- `created_at` — date de création
- `date_abattage` — date d'abattage (vide si inconnue : `annee` vaut alors « Inconnue »), ajoutée le 4 nov. 2026
- `repere` — repère pour retrouver une grume sans étiquette, ajouté le 4 nov. 2026
- `nom` vide = grume « En attente de marquage » ; numéro attribué par la fonction `attribuer_numero_grume`

> Table renommée `grumes` le 3 nov. 2026.

**Table `extractions`**
- `id` — UUID (migré depuis bigint le 19 avril 2026)
- `commune_code` — code d'accès de la commune
- `essence` — essence extraite
- `volume` — volume en m³
- `usage` — usage de destination
- `destination` — destinataire
- `commune`, `contact`, `notes` — infos complémentaires
- `cause_abattage` — cause d'abattage (écrit par `confirmerExtractionDest()`)
- `type_sortie`, `vol_brut_extrait`, `type_valorisation`, `lineaire`, `projet`, `commune_installation` — colonnes créées le 2 juillet 2026 (le code les envoyait déjà, l'enregistrement échouait en HTTP 400)
- `grumes_keys` — JSON des clés de grumes extraites (`lotId_positionGrume`), créée le 2 juillet 2026 (A6)
- `objet`, `date_realisation`, `date_pose`, `lieu_pose` — suivi d'une sortie (projet), créées le 13 nov. 2026, écrites par `enregistrer_suivi_sortie`
- `date`, `date_iso` — date de l'extraction

**Table `feedbacks`**
- `id` — UUID
- `commune_code` — code de la commune émettrice
- `commune` — nom de la commune
- `type` — type de retour (`usage-design`, `amelioration`, `bug`, `message-libre`)
- `message` — texte libre du retour

**Table `codes_acces`**
- `code` — code d'accès commune
- `commune` — nom de la commune
- `actif` — booléen

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

## Architecture en place

```
index.html     ← HTML pur, zéro JS inline — ✅
theme.css      ← variables de design (couleurs, typo) — ✅
ui.css         ← composants visuels (.card, .btn…) — ✅
core.js        ← noyau métier : DuramenCore (signatures figées) — ✅
app.js         ← logique UI, navigation, Supabase — ✅
sw.js          ← Service Worker (offline, cache duramen-v38) — ✅
```

---

## Décisions d'architecture

| Décision | Raison | Date |
|----------|--------|------|
| HTML/CSS/JS vanilla, pas de framework | Transmissible à n'importe quel informaticien | Démarrage |
| Noyau `core.js` avec signatures figées | Protéger la logique entrée→stock→sortie | Démarrage |
| Séparation `theme.css` / `ui.css` | Permettre au graphiste de travailler sans risque | Démarrage |
| Supabase comme backend | Déjà en place et fonctionnel | Démarrage |
| `vol_utile = vol_brut` pour les lots sans débit | Nouveau formulaire mobile : pas de calcul de débit | Avril 2026 |
| Tous les champs de la grume sont remplis ; « Inconnue » est une réponse valide (date d'abattage, provenance, cause) | Un « Inconnue » assumé est une information ; un champ vide est un trou dans le suivi | 4 nov. 2026 |
| Date d'abattage inconnue = débit urgent | Sans date, le délai avant débit ne se calcule pas : prudence | 4 nov. 2026 |
| Numéro de grume sur 5 chiffres, zéros ajoutés par l'app | Correspond au marquage physique ; évite les doublons 42 / 00042 | 4 nov. 2026 |
| Marquage différé : grume « En attente de marquage » (`nom` vide), numéro attribué plus tard ; pas de débit sans numéro (app + base) | Les agents n'ont pas toujours les étiquettes à la récolte ; le numéro relie les planches à leur grume | 4 nov. 2026 |
| Épaisseurs proposées 27 / 34 / 41 / 54 mm + « Autre » (10–150 mm) ; plusieurs épaisseurs par grume | Usages courants de la filière feuillus (menuiserie, aménagement urbain) ; à affiner par le porteur | 4 nov. 2026 |
| Séchage : 1 cm par an et par face, sur les 4 faces → 0,5 an par cm de la plus petite cote, toutes essences | Dicton de la filière en France ; une seule règle, pas de précision par essence | 4 nov. 2026 |

---

## Sécurité — Points d'attention avant mise en production

- Clé `SUPABASE_ANON_KEY` visible dans `app.js` (ligne 6). Clé anon publique par conception — normal pour une PWA. Vérifier que les règles **RLS (Row Level Security)** sont activées sur toutes les tables pour limiter la lecture aux seules communes authentifiées.

---

## Évolutions prévues (non planifiées)

- États du bois : brut / débité avec temps de séchage
- Vue cartographique des lots
- Notifications bois arrivant à maturité
- Queue de retry pour les opérations hors ligne
- Affichage "volume brut — débit non calculé" pour les lots sans épaisseur

---

## Session Avril 2026 — Dossier financeur

### Documents produits

| Fichier | Description | Statut |
|---|---|---|
| `DURAMEN_presentation_v3.docx` | Note de présentation ADEME — version finale retravaillée | ✅ |
| `budget_duramen.xlsx` | Budget prévisionnel modulable (jours + taux) | ✅ à compléter |
| `DURAMEN_budget.md` | Version lisible du budget pour Obsidian | ✅ |
| `DURAMEN_taches.md` | Suivi global du projet avec cases à cocher | ✅ |
| `DURAMEN_postes.md` | Détail des tâches par poste de réalisation | ✅ |
| [[REDACTION]] | Règles rédactionnelles avec exemples | ✅ → `Docs/` |

### Budget — état au 22 avril 2026

| | Jours | Montant |
|---|---|---|
| Travail TC (500 €/j) | 47 j | 23 500 € |
| Illustrateur (400 €/j) | 10 j | 4 000 € |
| Frais annexes (2 ans) | — | 3 600 € |
| **Total** | | **31 100 €** |

### Règles rédactionnelles — section 14 de CLAUDE.md

1. Phrases courtes, sans surcharge
2. Ton simple et agréable
3. Construire par le positif — négatif après le positif si nécessaire
4. Pas de jugement direct

**Rappel** : tout changement dans `CLAUDE.md` section 14 doit être répercuté dans [[REDACTION]], et inversement.

---

## Session 2 juillet 2026 — Audit profond de l'application

### Diagnostic complet (core.js, app.js, index.html, sw.js)

11 points relevés, classés par gravité. Corrigés dans cette session (commit `203ba35`, cache SW `v33`) :

- **A1 (critique)** — Le rafraîchissement auto (2 min) reconstruisait l'écran Extraction et effaçait la sélection de grumes en cours. Ajout de `extractionEnCours()` dans `app.js` : la reconstruction est sautée si une sélection, un filtre essence ou une modale est active.
- **A3 (critique)** — Fonctions mortes `chargerCommunesExtraction` / `remplirCommunesSel` supprimées : elles téléchargeaient `code + commune` de toute la table `codes_acces` (le code EST le mot de passe). Jamais appelées, mais dangereuses si rebranchées un jour.

Constaté lors du push : le coffre Obsidian local était **en retard de 5 commits** sur GitHub (session du 24 juin faite ailleurs, qui avait déjà corrigé les totaux de la vue Communauté — point A4). Rebase + résolution du conflit `sw.js` (v32 distant, v31 local → v33).

### Points restants (détail dans [[TASKS]] — Prochaines tâches)

Le plus urgent est **A2 — RLS Supabase** : l'isolation des données entre communes repose uniquement sur le filtre `commune_code=eq.X` ajouté côté client. Si Row Level Security n'est pas activé sur les tables `lots`, `extractions` et `codes_acces`, toute commune connectée peut lire les lots privés des autres. Se corrige dans le tableau de bord Supabase, pas dans le code.

### Décisions de session

- Les corrections d'audit se font **point par point, une session par sujet** (règle « un bug = une session »).
- **Toujours `git pull` en début de session** — le coffre local peut être en retard sur GitHub.

---

## Voir aussi

- [[TASKS]] — suivi séquentiel des tâches, source de vérité
- [[LESSONS]] — règles permanentes issues des bugs
- [[CHANGELOG]] — historique détaillé des modifications
- [[EVOLUTIONS]] — idées et pistes pour les prochaines versions
- [[CLAUDE_QUICK]] — sections essentielles de CLAUDE.md à lire au démarrage
- [[DESIGN_SYSTEM]] — référence visuelle complète
- [[Journal/JOURNAL_SESSION_06]] — dernière session documentée

---

## Décision — Feuille de débit menuisier (juillet 2026)

**Question posée :** intégrer à DURAMEN une feuille de débit / optimiseur de découpe pour les menuisiers destinataires des extractions ?

**Recherche marché :** deux familles d'outils existent déjà — générateurs de fiches de débit
liés à la conception 3D (OpenCutList, extension SketchUp gratuite et open-source, référence
francophone) et optimiseurs de calepinage (OptiCoupe, CutList Optimizer, CutOptima, DebitPro,
MaxCut). Tous sont orientés panneaux et barres de section standard.

**Décision : NE PAS intégrer d'optimiseur de débit.**
Raisons :
1. Le stock DURAMEN est du bois massif brut de sciage (plateaux irréguliers, aubier, défauts).
   Même OpenCutList ne fait pas de calepinage sur le massif : le choix des pièces dans un
   plateau est un savoir-faire d'atelier, pas un calcul.
2. Hors du noyau ENTRÉE → STOCK → SORTIE. Gros chantier algorithmique pour un résultat inadapté.
3. Redondant avec des outils gratuits déjà utilisés par les menuisiers.

**Pistes retenues (légères, dans l'esprit du noyau — la sortie reste une sortie, on enrichit son format) :**
1. **Bordereau de sortie imprimable** (priorité) : à l'extraction, générer un document listant
   les pièces sorties — essence, dimensions, épaisseur, date d'abattage, humidité estimée,
   date de disponibilité intérieur (données déjà calculées d'après SECHAGE_essences.md).
   Coût : une fonction dans app.js + une vue imprimable. Zéro nouvelle table, core.js intact.
2. **Export CSV compatible OpenCutList** (bonus) : bouton « Exporter la sortie en CSV » avec
   les colonnes attendues par l'onglet Importer d'OCL (désignation, longueur, largeur,
   épaisseur, quantité, matière). Quelques dizaines de lignes de JS, aucune dépendance.

**Ligne rouge :** tout ce qui touche au calepinage, à la saisie de pièces projet ou aux plans
de coupe appartient aux outils métier des menuisiers, pas à DURAMEN.
