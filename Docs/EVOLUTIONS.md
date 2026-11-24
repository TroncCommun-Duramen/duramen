# EVOLUTIONS.md — Idées et évolutions envisagées pour DURAMEN

> Ce fichier documente les pistes d'évolution identifiées au fil du projet.
> Il n'engage pas une date ni un périmètre. C'est un réservoir d'idées à arbitrer.

---

## v2 — Pistes identifiées

| # | Idée | Contexte d'émergence |
|---|------|----------------------|
| 1 | Accès détaillé commune par commune dans la vue Communauté | Refonte page Historique — avril 2026 |
| 2 | Vue cartographique des lots par commune | Backlog (ancien TASKS racine) |
| 3 | Bouton « Retour » intégré : feedback agent sans quitter l'app, mini-formulaire « ce que je faisais / ce qui s'est passé », page + heure capturées automatiquement, stocké dans une table Supabase `feedbacks`, consultable depuis le dashboard | Backlog (ancien TASKS racine) |
| 4 | Installation PWA sur l'écran d'accueil (Add to Home Screen) | Backlog (ancien TASKS racine) |
| 5 | Queue de retry pour les opérations effectuées hors ligne | Backlog (ancien TASKS racine) |
| 6 | Notifications pour les bois arrivant à maturité de séchage | Backlog (ancien TASKS racine) |
| 7 | Remplacer `alert()` / `confirm()` par des modales accessibles | Backlog (ancien TASKS racine) |
| 8 | Refactoriser le rendu DOM (supprimer les dernières concaténations de chaînes) | Backlog (ancien TASKS racine) |

> Lignes 2 à 8 et section « Système de rôles » : notes du 24-25 juin 2026, restées dans le coffre Obsidian sans arriver sur GitHub. Reportées le 24 nov. 2026. Certaines sont faites depuis (ticket retour, file d'envoi hors ligne).

---

## Système de rôles utilisateurs

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

---

## Voir aussi

- [[TASKS]] — tâches planifiées et en cours
- [[MEMORY]] — évolutions déjà décidées et en cours de réalisation
