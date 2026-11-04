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

## Session 2026-11-04

17:46 — Questions : saisie après coup (provenance, date, « inconnu »), zéros automatiques, marquage différé, blocage du débit sans numéro
17:51 — Recherche des épaisseurs de sciage : 4 principales + champ libre, plusieurs épaisseurs par grume
17:56 — Décision : 27 / 34 / 41 / 54 mm gardées (débits surtout pour l'aménagement urbain), à affiner plus tard
18:03 — Décision : règle de séchage unique pour toutes les essences, 1 cm par an
18:05 — Précision : 1 cm par an sur les 4 faces
18:07 — Codage : branches `feat/saisie-grume` et `feat/debit-epaisseurs`, base Supabase, tests navigateur
18:27 — Validation du porteur → fusion des deux branches dans `main`, mise en ligne (cache v56)

---

## Voir aussi

- [[MEMORY]] — synthèse des décisions issues des sessions
- [[TASKS]] — avancement des tâches générées par les sessions
- [[Journal/JOURNAL_SESSION_06]] — journal narrative de la dernière session
