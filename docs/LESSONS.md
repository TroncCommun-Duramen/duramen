# LESSONS.md — Règles permanentes issues de l'expérience

> Ce fichier grandit avec le projet.
> Chaque bug rencontré devient une règle permanente pour ne plus jamais le revivre.
> À lire au démarrage de chaque session Claude Code.
> À compléter en fin de session si une leçon a été apprise.

---

## Prompt de fin de session

Envoyer ce message à Claude Code avant de terminer une session :
> "Y a-t-il des leçons apprises aujourd'hui à ajouter à LESSONS.md ?
> Si oui, formate-les comme des règles permanentes avec leur raison."

---

## Règles issues de l'analyse du code initial

### Essences
- **JAMAIS** écrire les clés de `ESSENCES_INFO` sans accents
  → Raison : `ESSENCES_INFO['Chene']` retourne `undefined` car le formulaire
    envoie `'Chêne'`. Le delta de débit n'est alors jamais affiché à l'étape 3.
  → Clés correctes : `'Châtaignier'`, `'Chêne'`, `'Cyprès'`, `'Épicéa'`,
    `'Frêne'`, `'Séquoia'`, `'Robinier (Acacia)'`

### Identifiants
- **JAMAIS** utiliser `Date.getTime()` comme identifiant unique
  → Raison : deux saisies simultanées produisent le même ID,
    ce qui crée des conflits silencieux dans Supabase.
  → Toujours utiliser `crypto.randomUUID()` à la place.

### CSS et styles
- **JAMAIS** écrire `style="..."` directement dans le HTML généré par JS
  → Raison : le graphiste ne peut pas modifier ces styles sans toucher au JS.
    Tout style doit être dans une classe CSS de `ui.css`.
- **JAMAIS** écrire des valeurs de couleur en dur dans le JS (`#1A1814`, `#4B6FBF`…)
  → Raison : si la palette change, il faut chercher dans tout le code.
    Toujours utiliser les variables CSS (`var(--encre)`, `var(--signal)`).

### Construction du DOM
- **JAMAIS** construire du HTML par concaténation de chaînes dans le JS
  → Exemple à éviter : `'<div class="card">' + titre + '</div>'`
  → Raison : si `titre` contient `<script>`, c'est une faille de sécurité.
    Utiliser `document.createElement('div')` + `element.textContent = titre`.

### Sauvegarde
- **TOUJOURS** sauvegarder le brouillon du formulaire à chaque champ rempli
  → Raison : les agents sont sur le terrain et reçoivent des appels.
    Une saisie interrompue ne doit jamais être perdue.
  → Clé localStorage : `duramen_draft`

### Suivi de session
- **TOUJOURS** mettre à jour `MEMORY.md` en fin de session avec l'état des phases
  (ex : Phase 0a ✅, Phase 0b ✅, En cours : Phase 0c)
  → Raison : Claude Code repart de zéro à chaque session et déduit l'état depuis les fichiers.
    Un [[MEMORY]] imprécis crée des confusions sur ce qui est déjà fait.

---

## Règles à compléter au fil du projet

| Date | Contexte | Règle apprise |
|------|----------|---------------|
| 2 juillet 2026 | Push refusé : le coffre Obsidian était en retard de 5 commits sur GitHub (session du 24 juin faite ailleurs) | **TOUJOURS** faire `git pull` en début de session, avant tout audit ou modification. Raison : travailler sur du code périmé fait re-diagnostiquer des bugs déjà corrigés et provoque des conflits au push. |
| 2 juillet 2026 | Écran Extraction reconstruit par le rafraîchissement auto → sélection de grumes effacée | **JAMAIS** reconstruire un écran contenant une saisie en cours lors d'un rafraîchissement automatique. Raison : l'agent sur le terrain perd son travail sans prévenir. Vérifier l'état avec une garde (ex. `extractionEnCours()`) avant de re-rendre. |
| 2 juillet 2026 | Code mort qui téléchargeait toute la table `codes_acces` (code = mot de passe) | **JAMAIS** faire un `select` qui rapporte la colonne `code` de `codes_acces`, sauf pour vérifier LE code saisi à la connexion. Raison : exposer les codes de toutes les communes permet de se connecter à leur place. |

---

## Voir aussi

- [[MEMORY]] — état du projet, décisions récentes
- [[CHANGELOG]] — source des bugs qui ont généré ces règles
- [[CLAUDE_QUICK]] — règles absolues condensées pour le démarrage de session
