# Outil DNS

L'outil est rassemblé tout entier dans le dossier `oscar_infra_dns/`
(décision 62). Où il en est dans le cycle: le tableau
d'[où en est le cycle](../02-le-cycle-pas-a-pas.md#ou-en-est-le-cycle-aujourdhui),
tenu à un seul endroit.

## En bref

L'outil DNS gère les noms de domaine et leurs enregistrements, chez plusieurs
fournisseurs, par une API et par une interface web. Il garde une trace de tout,
et vérifie qu'un changement est bien visible.

Aujourd'hui, il n'écrit rien à l'extérieur: sa seule route d'écriture valide la
demande à blanc, ou répond qu'elle n'est pas encore faite.

| | |
|---|---|
| Dépôt | [`oscar-infrastructure`](https://github.com/oscar-organisation/oscar-infrastructure) |
| Dossier de l'application | [`oscar_infra_dns/`](https://github.com/oscar-organisation/oscar-infrastructure/tree/main/oscar_infra_dns), à la racine du dépôt |
| Services | `api`, en Python, port interne 8000; `interface`, en Next.js, port interne 3000 |
| Production | interface `https://dns.oscar-bot.com`, API `https://api-dns.oscar-bot.com` |
| Test | interface `https://test-dns.oscar-bot.com`, API `https://test-api-dns.oscar-bot.com` |
| Documentation de l'outil | `oscar_infra_dns/docs/README.md`, qui nomme la version en vigueur de chaque document |
| Guide de développement local | `oscar_infra_dns/docs/GUIDE-developpement-local-v1.2.md` |

## Lancer en local

Depuis la racine du dépôt cloné:

```
cd oscar_infra_dns
docker compose up --build -d
docker compose ps
```

| Service | Adresse locale |
|---|---|
| interface | `http://127.0.0.1:18101` |
| API | `http://127.0.0.1:18100`, route de santé `http://127.0.0.1:18100/v1/health` |

Les deux ports sont publiés par `compose.override.yaml`, sur `127.0.0.1`
seulement. Les réglages viennent du fichier `.env` placé à côté de
`compose.yaml`; chacun est expliqué dans `.env.exemple`. Aucun n'est un secret,
et aucun n'est obligatoire.

**Ce qu'on doit voir**: les services `api` et `interface` `Up` et `(healthy)`
dans `docker compose ps`, et la route de santé qui répond `"etat":"pret"`.

Le détail, de la récupération du dépôt jusqu'à la production, est dans le
guide de développement local de l'outil:
`oscar_infra_dns/docs/GUIDE-developpement-local-v1.2.md`.

## Tester en local

Les tests de l'outil tournent en conteneur. Les commandes exactes, et celle
qui vérifie la charte graphique de l'interface, sont dans le guide de
développement local de l'outil, parties « Tester » et « La charte graphique ».

Le laboratoire se lance contre l'outil lancé en local: voir
[sa page](laboratoire.md).

## Les vérifications automatiques

`.github/workflows/verifications-automatiques.yml`, à la racine du dépôt, au
patron commun
([les vérifications automatiques](../05-les-verifications-automatiques.md)):

| Tâche | Ce qu'elle vérifie |
|---|---|
| `controles` | aucune ligne d'attribution dans les commits, aucun secret, la documentation cohérente, la typographie, les fichiers des vérifications automatiques, la composition dans ses deux lectures |
| `verifs` | les tests de l'outil DNS et ceux du déploiement automatique commun, la charte graphique de l'interface, la construction des deux images |
| `deploiement` | par le déploiement automatique commun, après une fusion dans `test` ou `main`, si le contenu de `oscar_infra_dns/` a changé (hors `*.md`) |
| `recette` | si le déploiement a eu lieu: les scénarios de l'outil DNS au laboratoire, contre ce qui vient d'être déployé, par le workflow de recette du dépôt `oscar-test` |

## Le déploiement

| | Production | Test |
|---|---|---|
| Projet Coolify | `outil-dns` | `outil-dns` |
| Environnement Coolify | `production` | `test` |
| Application Coolify | `outil-dns-production` | `outil-dns-test` |
| Branche | `main` | `test` |

L'environnement de test ne reçoit **jamais** d'identifiants OVH. Un garde-fou,
testé (`oscar_infra_dns/tests/test_garde_fou_ovh.py`), refuse de démarrer un
test qui en recevrait (lot 2).

Vérifier la production:

```
docker run --rm curlimages/curl:8.22.0 -fsS https://api-dns.oscar-bot.com/v1/health
```

**Ce qu'on doit voir**: une réponse qui contient `"etat":"pret"`. Mesuré le 25
septembre 2026. L'interface, `https://dns.oscar-bot.com`, répond `200` à la
commande de l'[étape 13 du cycle](../02-le-cycle-pas-a-pas.md).

## Surveiller

| Où | Adresse |
|---|---|
| Les vérifications automatiques | `https://github.com/oscar-organisation/oscar-infrastructure/actions` |
| Les déploiements déclarés | `https://github.com/oscar-organisation/oscar-infrastructure/deployments`, environnements `outil-dns-test` et `outil-dns-production` |
| Coolify | `https://deploy.oscar-bot.com`, projet `outil-dns` |
| Les rapports du laboratoire | `https://test-labo.oscar-bot.com` et `https://labo.oscar-bot.com`, accès protégé |

## Ce qui reste à faire

Ce qui reste à faire pour l'outil DNS se lit dans le tableau
d'[où en est le cycle](../02-le-cycle-pas-a-pas.md#ou-en-est-le-cycle-aujourdhui).
