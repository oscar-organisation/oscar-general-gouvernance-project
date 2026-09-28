# Surveiller

Chaque étape du cycle se voit à un endroit précis. Quatre endroits suffisent:
GitHub, Coolify, Backstage, et les rapports du laboratoire.

## Où regarder, selon la question

| La question | Où regarder |
|---|---|
| Les vérifications de ma PR réussissent-elles ? | la page de la PR, puis l'onglet Actions |
| Pourquoi une tâche est-elle en échec ? | l'onglet Actions, le journal de la tâche |
| Qu'est-ce qui tourne en test, en production, à quel commit ? | la page Deployments du dépôt |
| Pourquoi la construction a-t-elle échoué sur le serveur ? | Coolify, le journal du déploiement |
| La recette a-t-elle réussi ? | la tâche `recette` dans Actions, puis le rapport du laboratoire |
| Où en sont toutes les applications, d'un coup d'oeil ? | Backstage |
| Le site répond-il ? | la commande de l'[étape 13 du cycle](02-le-cycle-pas-a-pas.md) |

## GitHub, l'onglet Actions

```
https://github.com/oscar-organisation/<dépôt>/actions
```

Chaque exécution des vérifications automatiques, tâche par tâche, avec son
journal. Une exécution se retrouve par sa branche et par le message du commit
qui l'a lancée. En bas d'une exécution qui déploie, un résumé donne les liens
utiles: application, environnement, commit, site, déploiement dans Coolify.
C'est le déploiement automatique commun qui l'écrit.

Chaque dépôt du cycle a ses vérifications automatiques, nommées
« Vérifications automatiques » dans l'onglet Actions. Où en est chaque dépôt:
le tableau d'[où en est le cycle](02-le-cycle-pas-a-pas.md#ou-en-est-le-cycle-aujourdhui).

## GitHub, les déploiements

```
https://github.com/oscar-organisation/<dépôt>/deployments
```

Ce qui est en test et ce qui est en production, à quel commit, depuis quand,
avec l'adresse du site. Ce sont les vérifications automatiques qui y
déclarent chacun de leurs déploiements.

Chaque dépôt y montre ses deux environnements, `<application>-test` et
`<application>-production` (`outil-dns-test`, `labo-production`...), déclarés
par le déploiement automatique commun.

## Coolify

```
https://deploy.oscar-bot.com
```

Coolify est l'outil qui construit et lance les applications sur le serveur. On
y trouve **un projet par application**, chacun avec **deux environnements**,
`test` et `production`:

| Projet | Environnements | Applications |
|---|---|---|
| `outil-dns` | `production`, `test` | `outil-dns-production`, `outil-dns-test` |
| `labo` | `production`, `test` | `labo-production`, `labo-test` |
| `portail` | `production`, `test` | `portail-production`, `portail-test` |

Lesquelles sont déployées, et à quel commit: le tableau d'[où en est le cycle](02-le-cycle-pas-a-pas.md#ou-en-est-le-cycle-aujourdhui).

Sur une application: son état, la liste de ses déploiements, et pour chacun le
journal de construction. C'est là qu'on lit pourquoi une image ne s'est pas
construite.

Coolify demande un compte. **On y regarde, on n'y déploie pas**: pas de bouton
« Deploy », pas de réglage changé à la main (voir
[comment se comporter](03-comment-se-comporter.md), règle 2). Un développeur
sans compte suit ses déploiements sur GitHub, où les vérifications
automatiques les déclarent.

## Backstage, le portail technique

```
https://tech.oscar-bot.com          production
https://test-tech.oscar-bot.com     test
```

Le portail rassemble toutes les applications au même endroit. Pour chaque
composant: sa description, l'état de ses vérifications automatiques, et ses
liens vers le test, la production, Coolify, le dépôt et les rapports du
laboratoire. On s'y connecte par son compte GitHub. Ce guide y est lisible,
dans l'onglet « Docs » du composant `oscar-general-gouvernance-project`.

Où en est le portail: le tableau d'[où en est le cycle](02-le-cycle-pas-a-pas.md#ou-en-est-le-cycle-aujourdhui).

## Les rapports du laboratoire

```
https://labo.oscar-bot.com          rapports de la recette de production
https://test-labo.oscar-bot.com     rapports de la recette de test
http://127.0.0.1:18400              en local
```

Le visualiseur montre les rapports de la dernière exécution des tests du
niveau correspondant: chaque scénario, son résultat, ses captures d'écran et ses
vidéos. L'accès est protégé.

L'accès se fait par un identifiant et un mot de passe: sans eux, le
visualiseur répond `401`.

## Le site lui-même

Rien ne remplace le fait de regarder le site. La commande de vérification est à
l'[étape 13 du cycle](02-le-cycle-pas-a-pas.md). Une application qui a une
route de santé se vérifie aussi par elle: voir sa page dans
[les applications](08-les-applications/README.md).
