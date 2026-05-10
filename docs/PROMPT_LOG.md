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

---

## Voir aussi

- [[MEMORY]] — synthèse des décisions issues des sessions
- [[TASKS]] — avancement des tâches générées par les sessions
- [[Journal/JOURNAL_SESSION_06]] — journal narrative de la dernière session
