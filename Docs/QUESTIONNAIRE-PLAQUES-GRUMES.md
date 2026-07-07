# Questionnaire : identification des grumes par plaques

**Projet :** Duramen, gestion du stock de bois d'œuvre
**Objet :** préparer l'atelier « modèle de données » et décider du système d'identification individuelle des grumes
**Date :** juillet 2026
**À destination de :** communes commanditaires

---

## Rappel du principe proposé

Chaque grume recevrait une **plaque portant un QR code et un numéro lisible à l'œil nu**. Sur le terrain, on identifie une grume en la visant avec l'appareil photo du téléphone : l'application reconnaît le code instantanément, même hors réseau, même si la plaque est partiellement salie. En cas de plaque illisible, le numéro imprimé en clair permet une saisie manuelle.

Ce système suppose des décisions d'organisation qui ne relèvent pas de l'application mais des communes : c'est l'objet de ce questionnaire. Les réponses conditionnent directement la conception de la base de données : il est donc important d'y répondre **avant** tout développement.

---

## 1. Le flux de travail sur le terrain

> *Enjeu : savoir à quel moment la grume entre dans le système, et qui en est responsable.*

1.1. **Qui pose la plaque sur la grume ?** (agent communal, bûcheron, prestataire d'abattage, autre ?)

1.2. **À quel moment la plaque est-elle posée ?**
   - au moment de l'abattage, en forêt ;
   - à l'arrivée sur le lieu de stockage ;
   - au moment de l'enregistrement du lot dans l'application ;
   - autre.

1.3. **Combien de grumes environ par an et par commune ?** (dimensionne la commande de plaques et le format de numérotation)

1.4. **Y a-t-il du réseau mobile sur les lieux d'abattage et de stockage ?** (l'application est prévue pour fonctionner hors connexion, mais cela confirme le besoin)

1.5. **Dans quelles conditions la plaque est-elle posée ?** (outil disponible : marteau, agrafeuse, visseuse ? grume au sol, empilée ?)

---

## 2. La plaque elle-même

> *Enjeu : choisir un support qui survive au stockage extérieur et ne pose pas de problème au sciage.*

2.1. **Existe-t-il déjà un marquage des grumes aujourd'hui ?** (plaques, peinture, martelage forestier, craie…) Si oui, le nouveau système doit-il le remplacer ou coexister avec lui ?

2.2. **Combien de temps s'écoule entre la pose de la plaque et le sciage ?** (des mois ? des années de séchage ? cela détermine la résistance nécessaire aux intempéries et aux UV)

2.3. **La plaque doit-elle être retirée avant sciage ?** Une plaque métallique oubliée peut endommager une lame de scierie. Options : plaque plastique agrafée, plaque posée en bout de grume (zone purgée), procédure de retrait systématique.

2.4. **Quel budget par plaque est acceptable ?** (ordre de grandeur : de quelques centimes pour une étiquette agrafée à 1–2 € pour une plaque rigide pré-imprimée)

2.5. **Qui commande les plaques, et sur quel budget ?** (chaque commune ? un achat groupé métropole ?)

---

## 3. Le format du numéro d'identification

> *Enjeu : c'est la décision la plus structurante pour la base de données. Difficile à changer après coup.*

3.1. **La numérotation est-elle propre à chaque commune, ou commune à toute la métropole ?**
   - *Recommandation : numérotation unique à l'échelle du dispositif, ce qui évite toute ambiguïté si une grume change de site ou si des lots sont partagés.*

3.2. **Le numéro doit-il « raconter » quelque chose** (ex. code commune + année + n° d'ordre : `ORV-2026-0042`) **ou être un simple numéro séquentiel ?**
   - *Recommandation : numéro simple. Les informations (commune, année, essence…) vivent dans l'application, pas dans le numéro ; sinon, toute erreur ou changement rend la plaque fausse.*

3.3. **Un numéro peut-il être réutilisé** après extraction ou destruction de la grume ?
   - *Recommandation : jamais. Un numéro = une grume, pour toujours.*

3.4. **Qui attribue les numéros ?**
   - plaques pré-numérotées commandées en série (le poseur prend la suivante du rouleau) ; *option recommandée, la plus simple sur le terrain* ;
   - numéro attribué par l'application au moment de l'enregistrement, plaque imprimée ensuite.

---

## 4. L'usage attendu dans l'application

> *Enjeu : définir ce que le scan doit déclencher, pour ne développer que l'utile.*

4.1. **Que veut-on faire en scannant une plaque ?** (plusieurs réponses possibles)
   - consulter la fiche de la grume (essence, dimensions, lot, historique) ;
   - enregistrer une sortie / extraction ;
   - faire un inventaire sur site ;
   - autre.

4.2. **Qui scanne ?** Les mêmes utilisateurs que l'application actuelle, ou de nouveaux profils (scieurs, transporteurs) ?

4.3. **La traçabilité doit-elle continuer après l'extraction ?** (suivre la grume jusqu'à la scierie, voire jusqu'au produit fini ?) Ou l'histoire s'arrête-t-elle à la sortie du stock ?

4.4. **Faut-il pouvoir attacher des photos à une grume** (état, singularités, preuve) en plus de l'identification ?

4.5. **Que fait-on des grumes déjà en stock, sans plaque ?** (campagne de rétro-étiquetage ? on ne plaque que les nouvelles entrées ?)

---

## 5. Organisation et cas particuliers

> *Enjeu : les procédures hors application, à écrire noir sur blanc.*

5.1. **Plaque perdue, arrachée ou illisible :** quelle procédure de remplacement ? (nouvelle plaque = nouveau numéro relié à l'ancien dans l'application, *solution recommandée*, ou re-fabrication du même numéro ?)

5.2. **Erreur de pose** (plaque posée sur la mauvaise grume) : qui a le droit de corriger dans l'application ?

5.3. **Calendrier souhaité :** à partir de quand les communes veulent-elles plaquer les grumes ?

5.4. **Y a-t-il des obligations réglementaires ou de certification** (PEFC, traçabilité bois, exigences de la métropole) auxquelles le système de marquage doit répondre ?

---

## Décisions attendues à l'issue de l'atelier

| # | Décision | Questions liées |
|---|----------|-----------------|
| 1 | Moment et responsable de la pose des plaques | 1.1, 1.2 |
| 2 | Type de plaque et procédure vis-à-vis du sciage | 2.2, 2.3 |
| 3 | Format et portée de la numérotation | 3.1 à 3.4 |
| 4 | Fonctions attendues du scan dans l'application | 4.1 à 4.4 |
| 5 | Sort des grumes déjà en stock | 4.5 |
| 6 | Procédures plaque perdue / erreur de pose | 5.1, 5.2 |
| 7 | Budget et circuit de commande des plaques | 2.4, 2.5 |
