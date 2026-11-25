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

### App installée sur iPhone et iPad *(25 nov. 2026)*
- **Règle** : une information gardée par l'app installée sur l'écran d'accueil (`localStorage`) n'est pas visible d'une autre page ouverte dans Safari, même sur le même site. Pour passer une information à la carte, la transmettre dans l'adresse, derrière un `#` (jamais envoyé sur Internet), et l'effacer aussitôt (`history.replaceState`).
- **Pourquoi** : sur iOS, chaque app installée a sa propre mémoire. Sur Android et sur ordinateur, la mémoire est partagée par le site.

### Essais avec une base imitée *(25 nov. 2026)*
- **Règle** : dans les essais Playwright de l'app, bloquer le Service Worker (`service_workers='block'`).
- **Pourquoi** : les requêtes faites par le Service Worker échappent à l'imitation de la base ; les essais lisent alors un vide ou la vraie base.

### Noms de lieux *(25 nov. 2026)*
- **Règle** : ne pas compter sur un service public (OpenStreetMap, IGN) pour retrouver le nom d'un parc à partir d'un point. Il donne la rue et le quartier ; le parc se nomme à la saisie, ou se cherche par son contour.
- **Pourquoi** : essais du 25 nov. 2026 au milieu du Jardin des Plantes : le service rend le nom d'une allée, jamais celui du parc.

## Règles à compléter au fil du projet

| Date | Contexte | Règle apprise |
|------|----------|---------------|
| 24 juin 2026 | Vue communauté (Nantes Métropole) | **JAMAIS** utiliser `getStock()` pour calculer des volumes dans une vue qui dépasse la commune connectée. Raison : `getStock()` ne contient que les données locales. Toujours sommer `vol_utile` depuis `lotsData`. (Reportée du coffre Obsidian le 24 nov. 2026.) |
| 24 juin 2026 | Service Worker | **TOUJOURS** incrémenter le cache SW dans le même envoi que toute modification de `app.js`, `core.js`, `ui.css`, `theme.css` ou `index.html`. Raison : sinon les appareils gardent l'ancienne version. (Reportée du coffre Obsidian le 24 nov. 2026.) |
| 2 juillet 2026 | Push refusé : le coffre Obsidian était en retard de 5 commits sur GitHub (session du 24 juin faite ailleurs) | **TOUJOURS** faire `git pull` en début de session, avant tout audit ou modification. Raison : travailler sur du code périmé fait re-diagnostiquer des bugs déjà corrigés et provoque des conflits au push. |
| 2 juillet 2026 | Écran Extraction reconstruit par le rafraîchissement auto → sélection de grumes effacée | **JAMAIS** reconstruire un écran contenant une saisie en cours lors d'un rafraîchissement automatique. Raison : l'agent sur le terrain perd son travail sans prévenir. Vérifier l'état avec une garde (ex. `extractionEnCours()`) avant de re-rendre. |
| 2 juillet 2026 | Code mort qui téléchargeait toute la table `codes_acces` (code = mot de passe) | **JAMAIS** faire un `select` qui rapporte la colonne `code` de `codes_acces`, sauf pour vérifier LE code saisi à la connexion. Raison : exposer les codes de toutes les communes permet de se connecter à leur place. |
| 2 juillet 2026 (audit A2) | La policy RLS `codes_acces_select` vaut `actif = true` → la clé anon publique lit TOUS les codes en une requête (confirmé par test réel). Le filtre `code=eq.X` de la connexion ne protège rien : sans filtre, tout sort. | **La lecture directe de `codes_acces` doit être interdite en RLS** (policy `false`). La vérification du code de connexion doit passer par une **fonction RPC `SECURITY DEFINER`** qui ne renvoie que `{valide, commune}`. Raison : une policy « lecture si actif » sur une table de mots de passe équivaut à publier tous les mots de passe. Vérifier une policy en la LISANT (`pg_policies.qual`) ne suffit pas — la tester avec la clé anon sans filtre. |
| 2 juillet 2026 (A5) | L'enregistrement d'extraction échouait en HTTP 400 depuis les refontes d'avril : `app.js` envoyait 2 colonnes inexistantes (`cause_abattage`, `type_sortie`), `bureau/app.js` en envoyait 5 autres. Personne n'avait testé un enregistrement réel après la refonte des écrans. | **TOUJOURS** tester l'enregistrement de bout en bout (jusqu'à la ligne visible dans Supabase) après toute refonte d'un formulaire. Toute nouvelle donnée envoyée par le code doit avoir sa colonne créée dans la base **dans la même session**. Raison : PostgREST refuse la ligne entière si une seule colonne est inconnue — la feature semble finie à l'écran mais n'enregistre rien. |
| 2 juillet 2026 (A5) | Deux agents simultanés pouvaient sortir plus que le stock : la validation ne regardait que la copie locale des données, chargée au dernier rafraîchissement. | **JAMAIS** faire confiance au client seul pour une règle d'intégrité (stock, unicité…). La règle doit être appliquée **dans la base** (trigger `before insert` + verrou `pg_advisory_xact_lock` par commune+essence) ; le client ne fait que l'ergonomie (re-validation fraîche, message clair). Raison : entre la vérification côté téléphone et l'écriture, un autre agent peut toujours s'intercaler. |
| 2 juillet 2026 (A5) | En vérifiant le verrou, découverte que `lots.commune_code` contient le **code d'accès secret** de la commune, lisible sans authentification via les lots partagés (`partage=eq.true`). | **JAMAIS** utiliser un secret (code d'accès) comme identifiant métier stocké dans d'autres tables. Un identifiant se partage, un secret non. → tâche A12 : séparer les deux, puis régénérer tous les codes. |
| 7 juillet 2026 (A14) | Le bureau rechargé affichait un stock surestimé : la session était restaurée depuis localStorage mais l'en-tête `x-commune-code` (dont dépendent les policies RLS) n'était posé que dans les chemins de connexion, pas au rechargement. Sans lui, la base renvoie silencieusement `[]` — aucune erreur visible. | **TOUJOURS** poser les en-têtes d'authentification dans la fonction de lancement de l'app (appelée par tous les chemins : connexion ET session restaurée), jamais seulement dans le formulaire de connexion. Raison : une RLS qui filtre ne renvoie pas d'erreur, elle renvoie du vide — le bug passe inaperçu et fausse les données affichées. |
| 31 octobre 2026 | Vider le stock d'une essence était refusé une fois sur quatre : chaque lot était arrondi à 4 décimales, la somme des grumes choisies dépassait le stock de quelques dix-millièmes. | **TOUJOURS** arrondir les volumes au millième de m³ (1 dm³) avec `arrondiM3()`, dans les 2 apps. Une sortie qui emporte les dernières grumes d'une essence vaut exactement le stock restant. Raison : c'est la précision de la filière bois ; au-delà, l'arrondi crée des refus et des restes sans réalité physique. |
| 7 juillet 2026 (A16) | Une modale créée une seule fois dans le DOM (« Nommer le lot ») gardait l'état de la case « Partager » du lot précédent : un lot pouvait partir partagé à l'insu de l'agent. | **TOUJOURS** réinitialiser TOUS les champs d'une modale réutilisée à chaque ouverture, pas seulement le champ texte principal. Raison : une case à cocher oubliée porte une décision (ici, la confidentialité des données) que l'agent croit prendre à chaque fois. |
| 2 novembre 2026 | Le bloc `@media (max-width: 600px)` de `ui.css` est écrit avant les règles de base : à priorité égale, la règle écrite en dernier gagne. Les réglages mobiles (16 px anti-zoom iPhone) étaient donc sans effet. | **TOUJOURS** placer les règles `@media` mobiles **après** les règles de base qu'elles modifient. Raison : sinon le navigateur les ignore sans aucune erreur visible. Vérifier la taille réelle affichée, pas seulement le CSS écrit. |
| 2 novembre 2026 | Aucun ticket retour n'avait jamais été enregistré : l'envoi demandait la ligne en retour (`return=representation`) sur une table sans droit de lecture (`feedbacks`). | **TOUJOURS** envoyer avec `Prefer: return=minimal` sur une table sans policy SELECT. Raison : Postgres refuse un enregistrement qu'il ne peut pas relire. Tester l'envoi avec les droits de l'app (rôle `anon` + en-tête `x-commune-code`), dans une transaction annulée. |
| 2 novembre 2026 | Sur réseau faible, une requête sans délai maximal laissait le voile « Chargement… » bloquer l'écran plusieurs minutes, toutes les 2 min. | **TOUJOURS** limiter la durée d'une requête réseau (`AbortController`) et **JAMAIS** afficher de voile bloquant pour un rafraîchissement automatique. Raison : sur le terrain, le réseau répond souvent lentement plutôt que pas du tout. |
| 2 novembre 2026 | Le Service Worker téléchargeait ses fichiers à l'installation en passant par le cache de GitHub Pages (~10 min) : risque d'un nouveau `index.html` avec un ancien `app.js`. | **TOUJOURS** installer les fichiers du SW avec `new Request(f, { cache: 'reload' })`. Raison : un mélange de versions reste ensuite gravé dans le cache hors ligne du téléphone. |
| 13 novembre 2026 (bureau) | Deux postes pouvaient mettre la même grume dans deux campagnes : la réservation n'était vérifiée que sur l'écran. | **TOUJOURS** poser dans la base toute règle « une seule fois » (réservation, sortie), avec le même verrou que les règles voisines. Raison : le bureau et le mobile écrivent en même temps ; l'écran de l'un ne voit pas l'autre. |
| 13 novembre 2026 (bureau) | Le bureau et le mobile s'ouvrent sur la même adresse : ils partagent la mémoire du navigateur. | **TOUJOURS** donner aux brouillons du bureau des clés à part (`duramen_bureau_…`). Raison : une même clé ferait apparaître dans le bureau un brouillon commencé sur le mobile, et inversement. |
| 24 novembre 2026 | Le coffre Obsidian était resté au 11 mai : un verrou git (`.git/index.lock`, 7 oct.) bloquait tous les `git pull`, sans erreur visible pour le porteur. Des notes du 24 juin n'étaient jamais arrivées sur GitHub. | **TOUJOURS** vérifier après la mise à jour du coffre que son dernier commit est celui de GitHub (`git log -1` des deux côtés). Raison : un `git pull` bloqué ne se voit pas ; « à jour » ne s'écrit qu'après vérification. |
| 24 novembre 2026 | Accès en écriture à GitHub refusé en début de session, accordé une fois l'écriture demandée par le porteur. | **TOUJOURS** demander en début de session les trois accès (GitHub en écriture, Supabase, dossier du coffre) et dire tout de suite au porteur s'il en manque un. Raison : le porteur ne doit pas découvrir un accès manquant en fin de session. |

---

## Voir aussi

- [[MEMORY]] — état du projet, décisions récentes
- [[CHANGELOG]] — source des bugs qui ont généré ces règles
- [[CLAUDE_QUICK]] — règles absolues condensées pour le démarrage de session
