# Laboratoire de tests

Où en est le laboratoire dans le cycle: le tableau
d'[où en est le cycle](../02-le-cycle-pas-a-pas.md#ou-en-est-le-cycle-aujourdhui),
tenu à un seul endroit. Cette page ne dit que ce qui ne change pas d'une
livraison à l'autre: les noms, les adresses, les commandes.

## En bref

Le laboratoire rejoue les parcours d'utilisation des interfaces OSCAR dans un
vrai navigateur, avec Playwright, sur trois tailles d'écran: bureau (1366
pixels de large), tablette (820) et mobile (390). Pour chaque scénario, il
garde un résultat, des captures d'écran et une vidéo, et produit un rapport.

Ses scénarios sont rangés en arbre: groupe, projet, application, rôle,
fonctionnalité, type de scénario. Ils vivent dans `projets/`.

C'est lui qui fait la **recette** de chaque application dans la chaîne: tous
ses scénarios contre le test, les scénarios non destructifs contre la
production ([la chaîne](../05-la-chaine.md)).

| | |
|---|---|
| Dépôt | [`oscar-test`](https://github.com/oscar-organisation/oscar-test) |
| Dossier de l'application | `oscar_labo_test_application/` |
| Ce qui se déploie | le visualiseur de rapports, derrière un accès protégé |
| Production | `https://labo.oscar-bot.com` |
| Test | `https://test-labo.oscar-bot.com` |
| En local | le visualiseur sur `http://127.0.0.1:18400` |

Les scénarios eux-mêmes ne se déploient pas: ils se lancent, en conteneur,
contre une application déployée ou lancée en local.

## Lancer en local

Depuis la racine du dépôt cloné:

```
cd oscar_labo_test_application
docker compose build labo
docker compose run --rm labo lister --app outil-dns
docker compose run --rm labo lancer --niveau production --app outil-dns
docker compose up -d visualiseur
```

| Ce qu'on lance | Où |
|---|---|
| la console et les scénarios | `docker compose run --rm labo <commande>`, dans le terminal |
| le visualiseur de rapports | `http://127.0.0.1:18400` |

Trois niveaux: `local` (les applications lancées sur le poste, jointes par
`host.docker.internal`), `test` et `production`, choisis par `--niveau`. Une
adresse manquante, ou une application sans environnement au niveau choisi, est
refusée avant le lancement, avec ce qu'il faut faire.

**Ce qu'on doit voir**: `lister --app outil-dns` annonce le nombre de
scénarios et de tests de l'outil DNS; la passe se termine par
`Niveau production : <n> réussis sur <n>.`, tous réussis; le visualiseur montre
une ligne par niveau, avec le bilan de sa dernière passe.

Sous Linux, le niveau local demande deux variables du terminal,
`LABO_MODE_RESEAU=host` et `LABO_HOTE_LOCAL=127.0.0.1`:
`host.docker.internal` seul ne joint pas un port publié sur `127.0.0.1`
(incident `INC-2026-09-25-13`). Sous macOS et Windows: non vérifié. Le guide du
laboratoire donne ce réglage (partie « Le niveau local sous Linux »), les
filtres, les identifiants et le dépannage:
[`oscar_labo_test_application/README.md`](https://github.com/oscar-organisation/oscar-test/blob/main/oscar_labo_test_application/README.md).

## Tester en local

```
cd oscar_labo_test_application
docker compose run --rm labo verifier
```

**Ce qu'on doit voir**: `== Bilan : <n> réussis, 0 échoués ==`, puis `Suite de
la console : réussie` et `Vérification des types : réussie`.

Pour jouer les scénarios contre une application lancée sur le poste:
`docker compose run --rm labo lancer --niveau local --app <application>`.

## La chaîne

`.github/workflows/chaine.yml`, à la racine du dépôt `oscar-test`, au patron
commun ([la chaîne](../05-la-chaine.md)):

| Tâche | Ce qu'elle fait |
|---|---|
| `controles` | lignes d'attribution, secrets, un modèle à côté de chaque fichier d'environnement, typographie, fichiers de chaîne, composition |
| `verifs` | l'image du laboratoire, `docker compose run --rm -T labo verifier`, les tests de l'action de recette, les images du serveur, l'épreuve du visualiseur |
| `deploiement` | après une fusion dans `test` ou `main`: le visualiseur, par le déploiement commun (`labo-test`, `labo-production`) |
| `recette` | si le déploiement a eu lieu: les scénarios du laboratoire contre le niveau de la branche |

**La recette des autres applications.** Le laboratoire porte aussi le workflow
réutilisable `.github/workflows/recette.yml`, que la chaîne de chaque
application appelle après son déploiement, avec le niveau et le nom de
l'application. Il joue ses scénarios, publie le rapport, que le visualiseur va
chercher, et échoue si des tests échouent. En production, les scénarios qui
écrivent sont écartés. Le détail: partie 7 du guide du laboratoire.

## Le déploiement

| | Production | Test |
|---|---|---|
| Projet Coolify | `labo` | `labo` |
| Environnement Coolify | `production` | `test` |
| Application Coolify | `labo-production` | `labo-test` |
| Branche | `main` | `test` |
| Environnement GitHub | `labo-production` | `labo-test` |

Le visualiseur montre les rapports de la dernière recette de chaque
application au niveau correspondant. Son accès est protégé par un identifiant
et un mot de passe, un par environnement.

## Surveiller

| Où | Adresse |
|---|---|
| Le dépôt | `https://github.com/oscar-organisation/oscar-test` |
| La chaîne | `https://github.com/oscar-organisation/oscar-test/actions` |
| Coolify | `https://deploy.oscar-bot.com`, projet `labo` |
| Les rapports | `https://test-labo.oscar-bot.com` et `https://labo.oscar-bot.com`; en local, `http://127.0.0.1:18400` |

## Ce qui reste à faire

Ce qui reste à faire pour le laboratoire se lit dans le tableau
d'[où en est le cycle](../02-le-cycle-pas-a-pas.md#ou-en-est-le-cycle-aujourdhui).
