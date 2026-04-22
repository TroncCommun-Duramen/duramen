# GIT_WORKFLOW — DURAMEN
*Référence opérationnelle Git et déploiement*
*Dernière mise à jour : avril 2026*

---

## URL de l'application

```
https://tronccommun-duramen.github.io/duramen/
```

---

## Commandes du quotidien

**Après chaque session Claude Code — envoyer sur GitHub :**

```bash
git add .
git commit -m "type(périmètre): description en français"
git push
```

**Exemples de messages de commit :**
```
style(theme): ajuster les espacements mobile
feat(stock): ajouter filtre par essence
fix(auth): corriger la déconnexion
docs(claude): mettre à jour le design system
```

---

## Sur un nouvel ordinateur

**1. Récupérer tout le projet :**
```bash
git clone https://github.com/TroncCommun-Duramen/duramen.git
```

**2. Configurer l'identité Git :**
```bash
git config --global user.email "contact.tronccommun@gmail.com"
git config --global user.name "TroncCommun-Duramen"
```

**3. Créer un nouveau token GitHub :**
- GitHub → photo de profil → Settings
- Developer settings → Personal access tokens → Tokens (classic)
- Generate new token (classic) → cocher **repo** → Generate
- Copier le token (commence par `ghp_...`)
- Ne jamais le partager ni le coller ailleurs que dans le terminal

---

## Éditeur de fusion Git

Configuré sur **nano**. Si Git ouvre un éditeur lors d'un merge :
- **Ctrl+X** pour quitter
- **Y** pour confirmer
- **Entrée** pour valider

---

## Prochaines tâches design

- [ ] **Responsive** — session Design dans Claude.ai d'abord, puis session CSS dans Claude Code.
      Mobile : poids minimum 400, texte plus grand, boutons plus hauts (min 44px).

- [ ] **Icône PWA** — envisager fond `--indigo` (#2B3F8C) avec icône blanche pour meilleur
      contraste au lancement. Coordonner avec le graphiste avant de modifier `manifest.json`.

---

## Prochaine tâche technique

- [ ] **Service Worker** (`sw.js`) — pas encore créé. Nécessaire pour le mode offline
      et l'installation PWA sur mobile. Session Feature dédiée dans Claude Code.

---

## Rappel sessions Claude Code

**Prompt de démarrage à copier-coller :**
> "Lis CLAUDE.md, MEMORY.md, LESSONS.md et TASKS.md dans cet ordre.
> Nous travaillons uniquement sur [fichier(s)].
> Ne touche à aucun autre fichier. Confirme la tâche avant de commencer."

**Périmètres autorisés par type de session :**

| Session | Fichiers autorisés | Fichiers interdits |
|---------|-------------------|-------------------|
| Design | `theme.css`, `ui.css` | tous les autres |
| Feature | `core.js`, `app.js` | tous les autres |
| Structure | `index.html` | tous les autres |
| Docs | `CLAUDE.md`, fichiers `Docs/` | tous les autres |

---

## Structure du dépôt GitHub

```
/
├── index.html          ← structure HTML (anciennement duramen.html)
├── theme.css           ← palette, typographie, tokens
├── ui.css              ← composants visuels
├── core.js             ← noyau métier (entrée/stock/sortie)
├── app.js              ← interface + Supabase
├── manifest.json       ← config PWA
├── sw.js               ← Service Worker (à créer)
├── icon-192.png
├── icon-512.png
└── Docs/
    ├── CLAUDE.md
    ├── MEMORY.md
    ├── TASKS.md
    ├── LESSONS.md
    ├── DESIGN_SYSTEM.md
    ├── PROMPT_LOG.md
    └── GIT_WORKFLOW.md  ← ce fichier
```
