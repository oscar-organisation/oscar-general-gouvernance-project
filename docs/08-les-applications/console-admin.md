# Console d'administration

La console est rassemblée dans le dépôt `oscar-console-admin`, une application
par dossier (décision 62). Où elle en est dans le cycle: le tableau
d'[où en est le cycle](../02-le-cycle-pas-a-pas.md#ou-en-est-le-cycle-aujourdhui),
tenu à un seul endroit.

## En bref

La console d'administration est l'outil de travail quotidien du client, qu'il
peut aussi installer chez lui. Il y gère ses organisations, ses sites, ses
utilisateurs et leurs droits, ses robots, ses modèles d'IA et le journal
d'audit; il y pilote un robot depuis un écran ou en casque (le cockpit XR); il
y compose des déploiements dans le Studio.

Elle est faite de **deux applications**, chacune dans son dossier, qui se
construisent, se testent et se mettent en ligne chacune de son côté:
l'interface ne se remet pas en ligne quand seule l'API change, et l'inverse.
Le navigateur charge l'interface, puis appelle l'API par son adresse publique.
L'API garde tout dans sa base PostgreSQL, et fabrique les jetons des sessions
temps réel des robots, que transporte LiveKit (plus bas).

| | |
|---|---|
| Dépôt | [`oscar-console-admin`](https://github.com/oscar-organisation/oscar-console-admin) |
| Dossiers des applications | [`oscar_console_admin_frontend/`](https://github.com/oscar-organisation/oscar-console-admin/tree/main/oscar_console_admin_frontend), l'interface; [`oscar_console_admin_api_backend/`](https://github.com/oscar-organisation/oscar-console-admin/tree/main/oscar_console_admin_api_backend), l'API et sa base |
| Services | `interface`, en React et Vite, servie par nginx, port interne 3000, avec le cockpit XR sous `/xr/`; `api`, en Python (FastAPI), port interne 8000; `base-de-donnees`, PostgreSQL 16 |
| Production | interface `https://console.oscar-bot.com`, API `https://api-console.oscar-bot.com` |
| Test | interface `https://test-console.oscar-bot.com`, API `https://test-api-console.oscar-bot.com` |
| Serveur temps réel | LiveKit, `https://test-stream.oscar-bot.com` pour le test, `https://stream.oscar-bot.com` pour la production |
| Documentation de chaque application | `docs/` de son dossier, affichée dans le portail sur les fiches `console-admin-interface` et `console-admin-api` |
| Guide de développement local | le `LISEZ-MOI.md` à la racine du dépôt, partie « Comment on travaille » |

## Lancer en local

Depuis la racine du dépôt cloné, l'API d'abord, puis l'interface:

```
cd oscar_console_admin_api_backend
cp .env.exemple .env
docker compose up --build -d
docker compose ps
cd ../oscar_console_admin_frontend
cp .env.exemple .env
docker compose up --build -d
docker compose ps
```

| Service | Adresse locale |
|---|---|
| interface | `http://127.0.0.1:18200`, le cockpit XR sur `http://127.0.0.1:18200/xr/` |
| API | `http://127.0.0.1:18202`, route de santé `http://127.0.0.1:18202/health` |
| base de l'API | `127.0.0.1:18203` |

Les ports sont publiés par le `compose.override.yaml` de chaque dossier, sur
`127.0.0.1` seulement. Les réglages viennent du fichier `.env` placé à côté de
`compose.yaml`; chacun est expliqué dans `.env.exemple`. Ceux du poste ne
contiennent aucun secret réel. Au premier démarrage, l'API crée sa base,
l'administrateur du `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) et, avec
`SEED_DEMO=true`, des données de démonstration. Sur le poste, aucun LiveKit ne
tourne.

**Ce qu'on doit voir**: `api` et `base-de-donnees` puis `interface` `Up` et
`(healthy)` dans `docker compose ps`, la route de santé qui répond
`"status":"ok"` et `"database":"ok"`, et la console qui s'ouvre sur
`http://127.0.0.1:18200`.

Le détail, du clone jusqu'à la production, est dans le `LISEZ-MOI.md` à la
racine du dépôt, partie « Comment on travaille »: cloner et partir de `test`,
lancer, tester, proposer une PR vers `test`, la voir en test, la mettre en
production, revenir en arrière.

## Tester en local

Les tests de chaque application tournent en conteneur, depuis la racine du
dépôt:

```
oscar_console_admin_api_backend/tester.sh
oscar_console_admin_frontend/tester.sh
```

Le premier lance toute la suite de l'API (pytest, sur une base SQLite); le
second relit le code de l'interface, vérifie ses types, lance ses tests
unitaires et la construit. Ce sont les commandes des vérifications
automatiques: si elles réussissent sur le poste, elles réussissent sur GitHub.
Les tests d'écran (`oscar_console_admin_frontend/tester-les-ecrans.sh`) et la
connexion de bout en bout contre la console lancée en local
(`oscar_console_admin_frontend/tester-la-connexion-sur-le-poste.sh`) se lancent
à la main.

Le laboratoire n'est pas encore branché sur cette console: ses scénarios de
console visent encore l'ancienne adresse. Voir [sa page](laboratoire.md).

## Les vérifications automatiques

Chaque application a son propre workflow, à la racine du dépôt, au patron
commun ([les vérifications automatiques](../05-les-verifications-automatiques.md)),
plus les vérifications communes à tout le dépôt
([un workflow par sous-projet](../05-un-workflow-par-sous-projet.md)):

| Fichier de `.github/workflows/` | Ce qui le lance, en plus de son propre fichier | Ce qu'il fait |
|---|---|---|
| `verifications-communes.yml`, « Vérifications communes » | chaque PR et chaque envoi | aucune ligne d'attribution dans les commits, aucun secret, chaque fichier d'environnement avec son modèle, la typographie, les fichiers des workflows, la machine de GitHub; puis son résumé |
| `console-admin-api.yml`, « API de la console » | `oscar_console_admin_api_backend/` | chaque variable des compositions expliquée, les compositions dans leurs trois lectures, la documentation construite sans avertissement; les tests de l'API par son `tester.sh` (pas pour la PR de `test` vers `main` ni pour `main`); le déploiement automatique commun: à la fusion dans `test`, l'image `oscar/console-admin-api` construite une seule fois si celle de ce contenu manque dans Harbor, la mise en ligne sur `console-admin-api-test`; à la fusion dans `main`, la même image sur `console-admin-api-production`; son résumé |
| `console-admin-interface.yml`, « Interface de la console » | `oscar_console_admin_frontend/` | les mêmes contrôles pour son dossier, plus les deux règles de sécurité nginx et le cockpit XR complet; les vérifications de l'interface par son `tester.sh`, puis le contrôle de son image; le déploiement de même, avec l'image `oscar/console-admin-interface`, sur `console-admin-interface-test` puis `console-admin-interface-production`; son résumé |

**L'API et l'interface ne s'attendent pas** (décision 125): modifiées ensemble,
elles sont vérifiées et mises en ligne en même temps, chacune de son côté. Une
modification de l'API doit donc continuer à marcher avec l'interface déjà en
ligne: on ajoute d'abord, on retire plus tard, une fois l'interface passée
([les sous-projets liés restent indépendants](../05-un-workflow-par-sous-projet.md#les-sous-projets-lies-restent-independants)).

L'empreinte de chaque image est celle du dossier de son application, sans les
`*.md`, `catalog-info.yaml`, `mkdocs.yml` ni `docs/`: une modification de la
seule documentation ne reconstruit et ne remet rien en ligne.

## Le déploiement

| | Production | Test |
|---|---|---|
| Projet Coolify | `console-admin` | `console-admin` |
| Environnement Coolify | `production` | `test` |
| Applications Coolify | `console-admin-interface-production`, `console-admin-api-production` | `console-admin-interface-test`, `console-admin-api-test` |
| Images dans Harbor | `oscar/console-admin-interface`, `oscar/console-admin-api` | les mêmes: la production reçoit l'image testée |
| Branche | `main` | `test` |

Les quatre applications sont créées par l'assistant de déploiement, depuis
leurs descriptions (`oscar-infrastructure`, dossier
`oscar_infra_deploiement/descriptions/console-admin/`). Leurs secrets viennent
de `secret_root/`, sur le serveur, jamais d'un dépôt.

Vérifier la production:

```
docker run --rm curlimages/curl:8.22.0 -fsS https://api-console.oscar-bot.com/health
docker run --rm curlimages/curl:8.22.0 -fsS -o /dev/null -w '%{http_code}\n' https://console.oscar-bot.com/index.html
```

**Ce qu'on doit voir**: une réponse qui contient `"status":"ok"` et
`"database":"ok"`, puis `200`. La santé de l'API répond `503` si sa base ne
répond pas. Mesuré le 5 octobre 2026 à 06h21 UTC, en test comme en
production, avec le cockpit XR (`/xr/`) en `200`.

### Le serveur temps réel

LiveKit transporte la vidéo, le son et les commandes entre un robot et la
personne qui le pilote. Il y a un serveur par environnement:
`test-stream.oscar-bot.com` pour la console de test, `stream.oscar-bot.com`
pour la console de production (décisions 114 et 117). L'API de chaque
environnement en fabrique les jetons de session et l'interroge; les adresses
sont posées par les descriptions de déploiement de Coolify.

LiveKit n'est pas une application Coolify: il est lancé sur le serveur par la
commande `livekit.sh` du dossier `oscar_infra_realtime_server/` du dépôt
`oscar-infrastructure`, qui porte tout son cycle (prérequis, installation,
vérification, retrait) et sa documentation (`docs/`, fiche
`serveur-temps-reel` du portail). Image publique `livekit/livekit-server`,
version 1.9.9 figée.

### Les données

La base et les fichiers de l'API (modèles d'IA, paquets embarqués des robots)
vivent dans des volumes, un jeu par environnement:
`console-admin-base-de-donnees`, `console-admin-modeles-ia` et
`console-admin-paquets-embarques`.

Les données de la console en service sur l'ancien serveur ont été **restaurées
le 5 octobre 2026**, en production puis en test, depuis un instantané pris en
lecture seule: les 42 tables ont les mêmes nombres de lignes que la source. La
procédure, la même sur le poste et sur le serveur, est
`oscar_console_admin_api_backend/docs/restaurer-un-instantane.md`, avec le
script `sauvegarder-et-restaurer.sh` du même dossier. Elle sauvegarde d'abord
l'état présent, qui est le chemin du retour.

### Revenir en arrière

- **Tout de suite, sans rien reconstruire**: dans l'application Coolify de
  l'environnement, on donne à `ETIQUETTE_IMAGE_A_METTRE_EN_LIGNE` l'étiquette
  d'une image précédente (`en-production-depuis-le-<date>`), puis
  « Redeploy » ([les environnements](../04-les-environnements.md)). Le bouton
  « Rollback » de Coolify n'est pas à utiliser.
- **La base ne revient pas en arrière** avec l'image: avant de remettre une
  API plus ancienne, vérifier qu'elle sait lire la base d'aujourd'hui. Pour
  rendre aussi les données d'avant, restaurer la sauvegarde prise avant le
  changement, par la procédure ci-dessus.
- **Pour de bon**: `git revert` de la fusion fautive, sur une branche
  `travail/<sujet>`, puis le même trajet, PR vers `test`, puis vers `main`.

## Surveiller

| Où | Adresse |
|---|---|
| Les vérifications automatiques | `https://github.com/oscar-organisation/oscar-console-admin/actions` |
| Les déploiements déclarés | `https://github.com/oscar-organisation/oscar-console-admin/deployments`, environnements `console-admin-interface-test`, `console-admin-interface-production`, `console-admin-api-test` et `console-admin-api-production` |
| Coolify | `https://deploy.oscar-bot.com`, projet `console-admin` |
| Le portail | `https://tech.oscar-bot.com`, fiches `console-admin-interface` et `console-admin-api`, la description de l'API `console-admin-api`, la base `console-admin-base-de-donnees` |
| Le serveur temps réel | `https://test-stream.oscar-bot.com` et `https://stream.oscar-bot.com`, qui répondent `OK` |

## Ce qui reste à faire

Ce qui reste à faire pour la console se lit dans le tableau
d'[où en est le cycle](../02-le-cycle-pas-a-pas.md#ou-en-est-le-cycle-aujourdhui).
