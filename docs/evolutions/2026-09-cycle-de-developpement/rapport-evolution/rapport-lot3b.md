# Lot 3b. La chaîne du laboratoire, son visualiseur, et la recette des applications

25 et 26 septembre 2026. Plan: `_pilotage/11-PLAN-cycle-de-developpement-des-trois-applications.md`.
Le test que Joel peut rejouer lui-même est dans [`test-manuel-lot3b.md`](test-manuel-lot3b.md).
Le cœur du laboratoire (trois niveaux, tout en conteneur, lancement ciblé) est
dans le [rapport du lot 3a](rapport-lot3a.md).

---

## 1. Ce que Joel a demandé

Que le laboratoire suive le même cycle que les autres applications (test puis
production), que sa chaîne tourne à chaque envoi, que ses rapports se lisent en
ligne, et qu'il valide chaque application après son déploiement (décision 57:
« validation avec le laboratoire »).

## 2. Comment

Deux agents à la suite: le premier a construit la chaîne, le visualiseur et la
recette, puis s'est arrêté le 25/09 vers 19h sur la limite de session de
l'outil; le second a repris à 21h36 et terminé. L'orchestrateur a revérifié
chaque livraison en relisant l'état: passes GitHub, déploiements Coolify,
adresses, et la suite du laboratoire relancée sur une copie propre de `main`.

## 3. La chaîne du laboratoire

Le dépôt `oscar-test` suit le patron commun, `.github/workflows/chaine.yml`:

| Tâche | Contenu |
|---|---|
| `controles` | refus des lignes d'attribution (action commune), et les contrôles du dépôt |
| `verifs` | `labo verifier`: la suite de la console, celle du collecteur, les types; la construction de l'image |
| `deploiement` | par la chaîne commune, vers `labo-test` ou `labo-production` |
| `recette` | le laboratoire joue ses propres scénarios contre l'outil DNS du même environnement |

## 4. Le visualiseur en ligne

| | Test | Production |
|---|---|---|
| Application Coolify | `labo-test` | `labo-production` |
| Adresse | `https://test-labo.oscar-bot.com` | `https://labo.oscar-bot.com` |
| Branche | `test` | `main` |

- **Accès protégé** par identifiant et mot de passe, rangés dans
  `secret_root/acess-admin-app/labo/`; seule `/sante` reste ouverte, pour le
  contrôle de santé de la chaîne.
- **Le visualiseur va chercher lui-même les rapports** dans les artefacts des
  passes GitHub, par un petit service à côté de lui, le collecteur. Il lit avec
  le jeton de l'organisation, en attendant un jeton en lecture seule (A25).
- **Seuls le visualiseur et le collecteur tournent sur le serveur**: le service
  qui lance les tests n'a rien à y faire, et Coolify respecte ce réglage de la
  composition (vérifié).

## 5. L'assistant de déploiement sait poser les secrets

Le visualiseur a besoin de deux secrets, le portail de cinq. L'assistant
`oscar-coolify` a gagné un champ `SECRETS=NOM=chemin`: la description donne le
nom de la variable et le chemin d'un fichier de `secret_root/`, jamais la
valeur; l'assistant la pose dans Coolify, puis dit si elle est posée, absente
ou différente, sans jamais l'afficher. Un chemin hors de `secret_root/` est
refusé. 509 tests (464 avant) (A24).

Les secrets ne sont pas « verrouillés » dans Coolify: mesuré, une valeur
verrouillée ne se relit plus, donc ne se vérifie plus, et Coolify en garde de
toute façon une autre copie lisible.

## 6. La recette des applications

- **Elle appartient au laboratoire**: un workflow réutilisable et une action
  d'`oscar-test` (`recette.yml@main`), que la chaîne de chaque application
  appelle après son déploiement. Les autres dépôts y accèdent par le partage
  « organisation » d'`oscar-test`, sans clé à poser (A31).
- **Elle est branchée dans la chaîne de l'outil DNS**: après chaque
  déploiement réel, en test puis en production.
- **Elle ne reçoit aucun secret** quand l'application n'en a pas besoin, comme
  l'outil DNS.

## 7. Un vrai défaut trouvé par la recette, et corrigé

**Le constat.** La première recette contre l'outil DNS de test a donné 28 sur
30, deux fois, sur l'envoi du formulaire.

**La cause, prouvée.** L'écran de saisie de l'outil DNS acceptait la frappe et
l'envoi avant d'être prêt, et les perdait: soit la page repartait vide, soit
les champs partaient vides, sans un mot. La production avait le même défaut.
Preuves: les traces de deux passes (dans la seconde, l'envoi est parti à
18,136 s et le dernier script de la page est arrivé à 18,207 s), et deux essais
qui reproduisent le défaut à coup sûr. Un 502 vu une fois sur un script n'était
pas la cause (la passe suivante a échoué de la même façon sans lui); son origine
n'est pas établie.

**La correction**, dans un ordre qui ne livre jamais de rouge sur `main` (A30):

| Étape | Où | Preuve |
|---|---|---|
| Les tests attendent un signal réel que l'écran est prêt, jamais une durée | `oscar-test`, PR 5 puis PR 7 | recette 30 sur 30 en test, puis en production |
| L'écran reste fermé, avec le message « L'écran se prépare », tant qu'il n'est pas prêt | `oscar-infrastructure`, PR 10 puis PR 11 | passes `36199726614` (test) et `36201137755` (production): recette 30 sur 30 |
| Un nouveau scénario prouve la correction | `oscar-test`, PR 6 puis PR 8 | vu rouge d'abord (0 sur 3 contre l'ancienne interface), puis **33 sur 33** en test (passe `36200558935`) et en production (passe `36201708558`) |

## 8. Le laboratoire suit le cycle jusqu'en production

La PR 7 (`test` vers `main`) a déployé `labo-production` pour la première fois,
par la chaîne; la PR 8 l'a redéployée. `labo.oscar-bot.com` répond 401 sans
identifiants, 200 avec; `/sante` répond 200. Dans les deux dépôts, `test` et
`main` ont le même contenu, et les branches de travail sont supprimées.

## 9. Le reste

- **Un scénario qui écrit des données réelles** (marqueur `@ecrit`) n'est
  jamais joué en production: choisi seul, la console refuse (code 2); mêlé à
  d'autres, elle l'écarte et le nomme, pour que la recette de production reste
  possible. Dix tests; la suite de la console passe à 146.
- **Les identifiants du laboratoire suivent A26**: `.env` et
  `config/identifiants/local.env` sont versionnés; ceux des niveaux `test` et
  `production` restent hors du dépôt. Ils n'avaient que des valeurs vides:
  aucun secret n'est parti sur GitHub.
- **Les six questions** laissées par le lot 3a sont tranchées dans le
  `LISEZ-MOI.md` d'exploitation du laboratoire.

## 10. Les décisions

Dans `_pilotage/14-DECISIONS-AUTONOMES.md`: A22 et A26 (les identifiants), A24
(les secrets posés par l'assistant), A25 (le jeton du collecteur, une dette de
sécurité écrite), A27 (le dépôt des incidents), A30 (corriger sans livrer du
rouge sur `main`), A31 (les choix du lot).

## 11. Les incidents du lot

| Incident | Ce qui s'est passé | Statut |
|---|---|---|
| INC-2026-09-25-21 | le nom d'une sauvegarde écrit de tête dans un message | résolu |
| INC-2026-09-25-22 | la recette n'a pas démarré: GitHub résout l'action d'une étape même quand elle est sautée | résolu |
| INC-2026-09-25-26 | un fichier modifié avant sa sauvegarde, et un résultat écrit dans une PR avant d'être mesuré; rattrapés dans la minute | résolu |

## 12. Ce qui reste

| Reste | Où |
|---|---|
| Remplacer le jeton du collecteur par un jeton en lecture seule | quand on durcira la sécurité (A25) |
| L'origine du 502 isolé (délai de 5 s de la connexion entre Node et le proxy): non établie | à surveiller |
| Mesurer le niveau local du laboratoire sous macOS et Windows | lot 5 |
| Les identifiants de la console et de Keycloak pour ses scénarios | le jour où l'on testera la console, hors du plan 11 |
