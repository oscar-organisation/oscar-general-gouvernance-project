# Surveiller

Chaque étape du cycle se voit à un endroit précis. Quatre endroits suffisent:
GitHub, Coolify, Backstage, et les rapports du laboratoire.

## Où regarder, selon la question

| La question | Où regarder |
|---|---|
| Ma PR passe-t-elle les vérifications ? | la page de la PR, puis l'onglet Actions |
| Pourquoi une tâche est-elle rouge ? | l'onglet Actions, le journal de la tâche |
| Qu'est-ce qui tourne en test, en production, à quel commit ? | la page Deployments du dépôt |
| Pourquoi la construction a-t-elle échoué sur le serveur ? | Coolify, le journal du déploiement |
| La recette est-elle passée ? | la tâche `recette` dans Actions, puis le rapport du laboratoire |
| Où en sont toutes les applications, d'un coup d'oeil ? | Backstage |
| Le site répond-il ? | la commande de l'[étape 13 du cycle](02-le-cycle-pas-a-pas.md) |

## GitHub, l'onglet Actions

```
https://github.com/oscar-organisation/<dépôt>/actions
```

Chaque passe de la chaîne, tâche par tâche, avec son journal. Une passe se
retrouve par sa branche et par le message du commit qui l'a lancée. En bas
d'une passe qui déploie, un résumé donne les liens utiles: application,
environnement, commit, site, déploiement dans Coolify. C'est le déploiement
commun qui l'écrit.

**État au 25 septembre 2026, 21h56 UTC**: chaque dépôt du cycle a sa chaîne,
nommée « Chaîne »: `oscar-infrastructure` sur `test` et `main`, `oscar-test`
sur `test` (lot 3b, en cours), `oscar-general-gouvernance-project` par la PR 2
vers `test` (lot 4, en cours).

## GitHub, les déploiements

```
https://github.com/oscar-organisation/<dépôt>/deployments
```

Ce qui est en test et ce qui est en production, à quel commit, depuis quand,
avec l'adresse du site. C'est la chaîne qui y déclare chacun de ses
déploiements.

**État au 25 septembre 2026, 21h56 UTC**: alimenté par le workflow commun
depuis le lot 2. `oscar-infrastructure` montre `outil-dns-test` et
`outil-dns-production`, `oscar-test` montre `labo-test`. Le portail y
apparaîtra à son premier déploiement (lot 4).

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

Relevé par l'API de Coolify le 25 septembre 2026 à 21h53 UTC. Les six
applications existent; `labo-production`, `portail-test` et
`portail-production` n'avaient pas encore été déployées par leur chaîne.

Sur une application: son état, la liste de ses déploiements, et pour chacun le
journal de construction. C'est là qu'on lit pourquoi une image ne s'est pas
construite.

Coolify demande un compte. **On y regarde, on n'y déploie pas**: pas de bouton
« Deploy », pas de réglage changé à la main (voir
[comment se comporter](03-comment-se-comporter.md), règle 2). Un développeur
sans compte suit ses déploiements sur GitHub, où la chaîne les déclare.

## Backstage, le portail technique

```
https://tech.oscar-bot.com          production
https://test-tech.oscar-bot.com     test
```

Le portail rassemble toutes les applications au même endroit. Pour chaque
composant: sa description, l'état de sa chaîne, et ses liens vers le test, la
production, Coolify, le dépôt et les rapports du laboratoire. On s'y connecte
par son compte GitHub. Ce guide y est lisible, dans l'onglet « Docs » du
composant `oscar-general-gouvernance-project`.

**État au 25 septembre 2026**: pas encore en service. `tech.oscar-bot.com`
répond `503` (mesuré): le nom est connu du proxy, mais aucune application ne
tourne derrière. Le portail, sa connexion par GitHub et son catalogue arrivent
au lot 4.

## Les rapports du laboratoire

```
https://labo.oscar-bot.com          rapports de la recette de production
https://test-labo.oscar-bot.com     rapports de la recette de test
http://127.0.0.1:18400              en local
```

Le visualiseur montre les rapports de la dernière passe de tests du niveau
correspondant: chaque scénario, son résultat, ses captures d'écran et ses
vidéos. L'accès est protégé.

**État au 25 septembre 2026, 21h56 UTC**: `https://test-labo.oscar-bot.com`
est en service, et répond `401` sans identifiants (mesuré).
`https://labo.oscar-bot.com` ne répond pas encore: lot 3b.

## Le site lui-même

Rien ne remplace le fait de regarder le site. La commande de vérification est à
l'[étape 13 du cycle](02-le-cycle-pas-a-pas.md). Une application qui a une
route de santé se vérifie aussi par elle: voir sa page dans
[les applications](08-les-applications/README.md).
