# Lot 4. Le portail Backstage dans le cycle

28 septembre 2026. Plan: `_pilotage/11-PLAN-cycle-de-developpement-des-trois-applications.md`,
lot 4; puis le plan des suites de la revue du 27/09
(`_pilotage/16-PLAN-suites-de-la-revue.md`, chantiers 4 à 6).
Le test que Joel peut rejouer lui-même est dans [`test-manuel-lot4.md`](test-manuel-lot4.md).
La preuve de bout en bout avec une vraie connexion suit au lot 5b.

Dans ce rapport, « les vérifications automatiques » désigne le fichier
`.github/workflows/chaine.yml` du dépôt et ce que GitHub en exécute à chaque
PR et à chaque fusion; « le déploiement automatique commun », le workflow du
dépôt `oscar-infrastructure` qu'elles appellent pour déployer.

---

## 1. Ce que Joel a demandé

Que le portail technique suive le même cycle que l'outil DNS et le
laboratoire (décision 57): travail en local sans aucun secret, PR vers `test`,
déploiement automatique en test, PR vers `main`, déploiement automatique en
production. Et, sur le portail lui-même: la connexion par GitHub, la charte
OSCAR, une page « Commencer ici » pour les nouveaux venus, un catalogue rangé,
la documentation lisible (TechDocs), les applications Coolify de test et de
production. Le 28/09, la présentation du déploiement dans le portail s'y
ajoute (décisions 83 et 84, A37).

## 2. Comment

Le lot s'est fait en plusieurs sessions d'agents, du 25/09 à 16h15 UTC au
28/09, chacune par le cycle (une branche `travail/`, une PR vers `test`, puis
une PR de `test` vers `main`, toujours un commit de fusion), et relue par la
session qui l'avait lancée. 28 PR en tout dans le dépôt, toutes fusionnées:

| PR | Ce qu'elles apportent | Fusion |
|---|---|---|
| 2, 4, 6 | le portail dans le cycle: composition pour Coolify, applications Coolify, premier déploiement en test (première construction: 41 min), puis en production | 26/09, 01h16 à 03h00 UTC |
| 5, 10, 11, 12, 13 | le guide: le tableau d'état du cycle, les écarts relevés au lot 5a | 26/09 |
| 8, 9 | une image d'environ 1,253 Go au lieu d'environ 2,5 Go | 26/09, 04h16 et 04h52 UTC |
| 14, 15, 16 | le retour arrière éprouvé en test; les écrans vérifiés dans un navigateur | 26/09 |
| 17, 18 | le graphe du catalogue depuis le menu; les icônes versionnées | 27/09 |
| 19 à 22 | les corrections de la revue du 27/09 (guide, marque) | 27/09 |
| 23, 24 | la charte close; le logo sur la page de connexion; le contrôle à l'écran éprouvé et lancé à chaque exécution des vérifications automatiques | 28/09, 09h18 et 10h14 UTC |
| 25, 26 | la partie « Le déploiement » de l'accueil et le tableau de bord de Traefik; les ordinateurs de GitHub fixés sur `ubuntu-24.04`; le guide suit les décisions 83 et 84 | 28/09, 16h00 et 16h23 UTC |
| 27, 28 | les fiches du dépôt `oscar-infrastructure` lues dans leur dépôt; l'attente retirée du portail | 28/09, 16h48 et 17h20 UTC |

Les PR 1, 3 et 7 portent les rapports des lots 2, 3b et 5a.

## 3. Ce qui est livré, point par point

| Demande du plan | État au 28/09/2026 | Comment on le sait |
|---|---|---|
| **La connexion par GitHub** | réglée: une seule application GitHub pour le test et la production (décision 64), personnes et équipes importées de l'organisation; **la vraie connexion d'une personne n'est pas faite** | la connexion part vers GitHub (`302`) avec la bonne adresse de retour, en test et en production; l'invité est refusé (`404`); mesuré le 28/09 à 17h07 en test et 17h30 en production. Une vraie connexion demande Joel (J3) |
| **La composition adaptée à Coolify** | faite: aucun port publié, aucun nom fixe, aucune règle de proxy écrite à la main, `expose` du port 7007, la clé privée par variable, aucune variable exigée (INC-2026-09-26-01) | tests des réglages du portail; contrôle des compositions à chaque exécution des vérifications automatiques |
| **Le contrôle de santé** | sur la vraie route de disponibilité, `/.backstage/health/v1/readiness`, qui répond `503` pendant le démarrage (leçon 3.7) | test des réglages; `{"status":"ok"}` en test et en production |
| **Deux façons de travailler en local, sans secret** | le mode service (`127.0.0.1:18500`, la même image qu'en production) et le mode développement (`18501` et `18502`, rechargement à chaud) | mode développement éprouvé le 28/09: interface et serveur répondent, une modification se voit en 2 secondes |
| **La charte OSCAR** | close le 28/09 (PR 23 et 24): couleurs, polices, logo, nom, page de connexion, anneau orange au focus | contrôle à l'écran: 32 vues en local, 8 en test et 8 en production sans couleur hors charte ni texte sous le seuil AA; ses 34 tests tournent à chaque exécution des vérifications automatiques |
| **L'accueil des nouveaux venus** | « Commencer ici »: quatre lectures dans l'ordre, les applications, les outils, et, depuis le 28/09, **« Le déploiement »**: la fiche du déploiement, Coolify, le proxy, OVHcloud, et le bloc du tableau de bord de Traefik (adresse, ce qu'on y lit, chemin du fichier de ses identifiants, jamais leur valeur) | 11 tests de l'accueil, 3 des réglages, et le contrôle à l'écran qui lit la partie; la page publique sert ces réglages en test et en production |
| **Le catalogue rangé** | le domaine OSCAR, un système par famille de dépôts, l'équipe, trois ressources; les fiches que les dépôts portent eux-mêmes; l'API de l'outil DNS avec sa description; les fiches d'`oscar-infrastructure` dans leur dépôt depuis le 28/09 (l'outil DNS, son API, le serveur temps réel, « Le déploiement »); celles d'`oscar-test` encore en attente dans le portail | tests des réglages; journal du portail (section 5) |
| **TechDocs** | MkDocs et `mkdocs-techdocs-core` à versions figées dans l'image, les mêmes que l'image de vérification du guide (37 paquets); l'extension LightBox pour les grands schémas | le guide et la documentation du déploiement construits sans avertissement par le MkDocs de l'image de production; en local, affichés par le portail, un schéma s'ouvre en grand |
| **Les vérifications automatiques, au modèle commun** | contrôles, vérifications, puis le déploiement automatique commun, seulement après une fusion dans `test` ou `main`; les ordinateurs de GitHub fixés sur `ubuntu-24.04` (A38), et un contrôle qui le vérifie | exécutions du 28/09, toutes réussies (section 4) |
| **Les applications Coolify** | `portail-test` (`test-tech.oscar-bot.com`) et `portail-production` (`tech.oscar-bot.com`), leurs secrets posés depuis `secret_root/` par l'assistant de déploiement | API de Coolify: `running:healthy` |
| En plus | le retour arrière éprouvé en test (26/09); une image allégée; le guide suit le code et l'exploitation séparés, puis le déploiement versionné | rapports des sessions du 26/09; PR 14 à 16 |

## 4. Les livraisons du 28/09, mesurées

| Livraison | Exécution des vérifications automatiques | Déploiement dans Coolify | Durée |
|---|---|---|---|
| PR 25 vers `test` (`99447ab`) | `36447827116`, réussie | `portail-test`, 16h07:45 à 16h09:04 UTC | 1 min 19 s |
| PR 26 vers `main` (`aa6f132`) | `36450731514`, réussie | `portail-production`, 16h31:57 à 16h32:46 UTC | 49 s |
| PR 27 vers `test` (`923890d`) | `36453728347`, réussie | `portail-test`, 16h56:09 à 16h57:27 UTC | 1 min 18 s |
| PR 28 vers `main` (`91a8d3f`) | `36457491000`, réussie | `portail-production`, 17h28:24 à 17h29:11 UTC | 47 s |

Les deux déploiements de `portail-test` d'avant avaient pris 35 et 38
minutes. Depuis le 28/09, Coolify ne vide plus la mémoire de construction de
Docker chaque nuit, mais seulement au-delà de 70 % de disque (décision 86):
dans le journal de ces quatre déploiements, l'installation des dépendances,
l'étape TechDocs et les couches de base sont reprises de cette mémoire, et
seule la compilation tourne (environ 20 secondes). Un changement des
dépendances referait leur installation. Que la mémoire survive à une nuit
n'est pas encore mesuré.

À chaque livraison, le portail a été vérifié par la procédure de
`oscar-infrastructure`, `oscar_infra_deploiement/docs/applications/portail/verifier-v1.2.md`:
application saine, commit servi égal à la tête de la branche, disponibilité
`200`, connexion vers GitHub, invité refusé, base sur son volume d'avant.
Le point 6 de la procédure (l'assistant compare la description et Coolify)
lit les secrets du portail: il n'a pas été rejoué par ces sessions.

## 5. Les fiches du dépôt `oscar-infrastructure`, passées dans leur dépôt

Le 28/09, la fiche de la racine d'`oscar-infrastructure` est devenue la
Location de ses unités, sur `main` à 16h16:56 UTC, et la copie qui attendait
dans le portail a été retirée ensuite, dans cet ordre, pour ne jamais perdre
l'outil DNS du catalogue. Ce que dit le journal du portail de test:

| Heure (UTC) | Journal de `portail-test` |
|---|---|
| 16h18:41 | conflit de nom: la Location du dépôt est écartée, celle de l'attente gardée |
| 16h57:32 | après le retrait de l'attente: les anciennes fiches d'attente ne sont plus dans l'image; dernier conflit |
| 16h57:36 | quatre fiches orphelines retirées (le nombre de l'attente) |
| 17h04:04 et 17h34:04 | deux relectures de GitHub; plus aucun conflit, aucune erreur |

En production, livrée à 17h29: les anciennes fiches d'attente absentes de
l'image à 17h29:23, quatre fiches orphelines retirées à 17h30:36, une
relecture de GitHub à 17h57:58, aucun conflit ni aucune erreur (lu jusqu'à
18h01).

**Le journal ne dit pas en toutes lettres que la fiche « Le déploiement » est
au catalogue**, ni en test ni en production. On le verra à l'écran avec la
première connexion par GitHub (J3).

## 6. Les incidents du lot

| Incident | Ce qui s'est passé | Statut |
|---|---|---|
| `INC-2026-09-24-02` | l'image du portail ne se construisait pas: trois causes | résolu |
| `INC-2026-09-25-15` | les images des schémas du guide n'étaient pas reproductibles | résolu |
| `INC-2026-09-25-19` | le `LISEZ-MOI.md` du dépôt annonçait un contrôle d'accès et un déploiement qui n'existaient pas | résolu |
| `INC-2026-09-25-20` | des identifiants recopiés dans `code/` | résolu avec réserve |
| `INC-2026-09-26-01` | le premier déploiement de test échouait avant la construction (une variable exigée) | résolu |
| `INC-2026-09-26-02` | une fusion du déploiement automatique commun arrêtait une exécution du portail en route | résolu |
| `INC-2026-09-26-06` | deux échecs du contrôle au navigateur ne changeaient pas son verdict | résolu |
| `INC-2026-09-26-08` | pages de connexion parfois vides après des réponses `502` | **ouvert** |
| `INC-2026-09-26-09` | exercice planifié de retour d'urgence du portail de test | résolu |
| `INC-2026-09-27-01` | le graphe du catalogue vide depuis le menu | résolu |
| `INC-2026-09-27-02` | une ancienne icône signalée en production | résolu avec réserve |
| `INC-2026-09-27-03` | une couleur hors écran faisait échouer le contrôle du graphe | résolu |

Les rapports sont dans le dépôt `oscar-gestion-incidents-and-reports`.

## 7. Les décisions

Décisions de Joel: 57 (le cycle pour les trois applications), 62 (une unité,
un dossier), 64 (une application GitHub pour le test et la production), 83
et 84 (le déploiement versionné dans `oscar_infra_deploiement/`), 85 (qui
fusionne les PR des chantiers du 28/09), 86 (le nettoyage de Docker).
Décisions prises en mode autonome, dans `_pilotage/14-DECISIONS-AUTONOMES.md`:
A4 (Coolify construit depuis GitHub), A21 (un environnement GitHub par
application et par environnement), A32 (un seul tableau d'état dans le
guide), A37 (la forme du dossier du déploiement, dont la partie de
l'accueil), A38 (les ordinateurs de GitHub fixés sur `ubuntu-24.04`).

## 8. Ce qui reste

| Reste | Où |
|---|---|
| Une vraie connexion par GitHub, en test puis en production, et ce qu'elle permet de voir: l'accueil, la fiche « Le déploiement » et sa documentation, l'état des vérifications automatiques sur chaque fiche | Joel (J3), puis lot 5b |
| La preuve de bout en bout sur le portail | lot 5b |
| La recette par le laboratoire: il n'a aucun scénario du portail | plus tard |
| Les fiches du dépôt `oscar-test`, encore en attente dans le portail | plus tard, par le même chemin que celles d'`oscar-infrastructure` |
| L'incident `INC-2026-09-26-08` (pages de connexion parfois vides) | ouvert |
| Le renommage du mot « chaîne » dans le texte d'avant le 28/09, pour un nouveau venu | proposé à Joel |
