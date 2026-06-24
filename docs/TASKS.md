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
| Fix volumes 0.000 m³ en vue Nantes Métropole — `parEss[e].vol` sommé depuis `vol_utile` plutôt que `getStock()` ✅ | `app.js` | 24 juin 2026 |

---

## Tâches en cours

_(aucune)_

---

## Prochaines tâches

| # | Tâche | Session | Priorité |
|---|-------|---------|----------|
| 1 | Responsive desktop : layout bureau distinct du layout mobile | Design | ✅ Fait |
| 2 | Icône PWA : fond `--indigo` + icône blanche (coordonner avec graphiste) | Design | Basse |

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
