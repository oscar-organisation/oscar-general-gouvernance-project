# Outil DNS

**État au 25 septembre 2026.** L'outil est rassemblé tout entier dans le
dossier `oscar_infra_dns/` depuis le 25 septembre 2026 (décision 62). Il est
déployé en production. Le reste du cycle, test compris, arrive au lot 2 du
plan.

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
| Test | interface `https://test-dns.oscar-bot.com`, API `https://test-api-dns.oscar-bot.com`: **lot 2** |
| Documentation de l'outil | `oscar_infra_dns/docs/README.md`, qui nomme la version en vigueur de chaque document |

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

Vérifié le 25 septembre 2026 par `docker compose config`, qui montre la
composition telle que Docker la lira: les ports 18100 et 18101 sont publiés sur
`127.0.0.1`, et `compose.yaml` seul n'en publie aucun. **À compléter au lot
2**: le lancement complet, éprouvé depuis un clone neuf au lot 2, puis au lot
5.

## Tester en local

**À compléter au lot 2.** La commande qui lance les tests de l'outil en
conteneur, et celle qui joue les scénarios du laboratoire contre l'outil lancé
en local, n'existent pas encore sous leur forme finale.

Aujourd'hui, les tests Python et la vérification de la charte graphique tournent
dans la chaîne, sur GitHub.

## La chaîne

Aujourd'hui: `.github/workflows/verifications.yml`, à la racine du dépôt. Sur
chaque PR vers `main` et chaque envoi sur `main`, elle vérifie:

| Tâche | Ce qu'elle vérifie |
|---|---|
| Aucun secret dans le dépôt | les motifs de jetons et de clés; un `.env.exemple` à côté de chaque `.env` |
| La documentation est cohérente | les documents annoncés par le README de la documentation existent; la typographie |
| Python | les tests de l'outil |
| La charte graphique de l'interface | les couleurs de l'interface respectent la charte OSCAR |
| Les deux images se construisent | l'API et l'interface |
| Déployer, si tout le reste est vert | après un envoi sur `main` seulement: demande le déploiement de `outil-dns-production` à Coolify, et attend qu'il aboutisse |

**Au lot 2**, elle passe au patron commun, `chaine.yml`: branches `test` et
`main`, déploiement par le workflow réutilisable, recette par le laboratoire.
Voir [la chaîne](../05-la-chaine.md).

## Le déploiement

| | Production | Test |
|---|---|---|
| Projet Coolify | `outil-dns` | `outil-dns` |
| Environnement Coolify | `production` | `test` |
| Application Coolify | `outil-dns-production` | `outil-dns-test`, **lot 2** |
| Branche | `main` | `test`, **lot 2** |

L'environnement de test ne recevra **jamais** d'identifiants OVH. Un garde-fou,
testé, refusera de démarrer un test qui en recevrait: **lot 2**.

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
| La chaîne | `https://github.com/oscar-organisation/oscar-infrastructure/actions` |
| Les déploiements déclarés | `https://github.com/oscar-organisation/oscar-infrastructure/deployments`, **lot 2** |
| Coolify | `https://deploy.oscar-bot.com`, projet `outil-dns` |
| Les rapports du laboratoire | `https://test-labo.oscar-bot.com` et `https://labo.oscar-bot.com`, **lot 3** |

## Ce qui reste à faire

Au lot 2 du plan:

- l'application `outil-dns-test`, sans aucune variable OVH, déclenchement
  automatique coupé;
- la chaîne au patron commun: test, production, recette par le laboratoire;
- le garde-fou qui refuse un test recevant des identifiants OVH, testé;
- le guide de développement local à jour: le dossier, les ports 18100 et 18101,
  les tests en conteneur, la charte;
- la preuve du cycle complet, d'une branche de travail jusqu'à la production.

Cette page sera complétée avec les commandes que le lot 2 aura éprouvées.
