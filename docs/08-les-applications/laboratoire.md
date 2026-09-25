# Laboratoire de tests

**État au 25 septembre 2026.** Le laboratoire tourne entièrement en
conteneur, console comprise, et vise au choix le niveau local, test ou
production: c'est le lot 3a du plan (commit `18bb6d6` du dépôt `oscar-test`).
Sa chaîne et le déploiement de son visualiseur de rapports viennent au lot 3b.

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
| Ce qui se déploie | le visualiseur de rapports, **lot 3b** |
| Production | `https://labo.oscar-bot.com`, **lot 3b** |
| Test | `https://test-labo.oscar-bot.com`, **lot 3b** |
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

**Ce qu'on doit voir**: `lister --app outil-dns` annonce `Scénarios (10)` et
`Tests : 30`; la passe en production se termine par `Niveau production : 30
réussis sur 30.` (mesuré le 25 septembre 2026, en un peu plus de dix minutes);
le visualiseur montre une ligne par niveau, avec le bilan de sa dernière passe.

Sous Linux, le niveau local demande deux lignes dans le fichier `.env` du
laboratoire: `host.docker.internal` seul ne joint pas un port publié sur
`127.0.0.1` (incident `INC-2026-09-25-13`). Sous macOS et Windows: non vérifié.
Le guide du laboratoire donne ce réglage, les filtres, les identifiants et le
dépannage:
[`oscar_labo_test_application/README.md`](https://github.com/oscar-organisation/oscar-test/blob/main/oscar_labo_test_application/README.md).

## Tester en local

```
cd oscar_labo_test_application
docker compose run --rm labo verifier
```

**Ce qu'on doit voir**: `== Bilan : 116 réussis, 0 échoués ==`, puis `Suite de
la console : réussie` et `Vérification des types : réussie`. Le test cassé le 25
septembre 2026 par un ménage incomplet (incident `INC-2026-09-25-08`, 59 sur 60)
est de nouveau vert.

Pour jouer les scénarios contre une application lancée sur le poste:
`docker compose run --rm labo lancer --niveau local --app <application>`.

## La chaîne

**Aucune aujourd'hui.** Au lot 3b: `docker compose run --rm labo verifier` à
chaque envoi, et la recette complète contre le niveau de la branche, sur le
patron commun ([la chaîne](../05-la-chaine.md)). Les commandes existent déjà:
`lancer` sort avec le code `0` si tout est vert, `1` si des tests échouent, `2`
s'il refuse de lancer.

Les chaînes des autres dépôts liront le laboratoire pour leur recette, par une
clé en lecture seule: **lot 3b**.

## Le déploiement

| | Production | Test |
|---|---|---|
| Projet Coolify | `labo` | `labo` |
| Environnement Coolify | `production` | `test` |
| Application Coolify | `labo-production`, **lot 3b** | `labo-test`, **lot 3b** |
| Branche | `main` | `test`, **lot 3b** |

Les projets et les environnements Coolify existent (relevé par l'API le 25
septembre 2026); aucune application n'y est encore créée. Le visualiseur
montrera les rapports de la dernière passe du niveau correspondant, derrière un
accès protégé.

## Surveiller

| Où | Adresse |
|---|---|
| Le dépôt | `https://github.com/oscar-organisation/oscar-test` |
| La chaîne | `https://github.com/oscar-organisation/oscar-test/actions`, **lot 3b** |
| Coolify | `https://deploy.oscar-bot.com`, projet `labo` |
| Les rapports | `https://test-labo.oscar-bot.com` et `https://labo.oscar-bot.com`, **lot 3b**; en local, `http://127.0.0.1:18400` |

## Ce qui reste à faire

Au lot 3b du plan:

- la chaîne du dépôt `oscar-test`;
- le visualiseur de rapports déployé en test et en production, avec accès
  protégé;
- l'accès en lecture des autres dépôts au laboratoire, pour leur recette;
- la preuve: un développeur clone, configure son local, lance une application
  précise, vise le test par une commande, ajoute un scénario, pousse; la chaîne
  tourne et le rapport apparaît.

Cette page sera complétée avec les commandes que le lot 3b aura éprouvées.
