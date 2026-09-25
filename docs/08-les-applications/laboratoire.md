# Laboratoire de tests

**État au 25 septembre 2026.** Le laboratoire existe et sert déjà: il a joué ses
scénarios contre l'outil DNS déployé. Mais, sur `main`, il n'a ni chaîne, ni
lancement en conteneur documenté, ni déploiement. Sa refonte est le lot 3 du
plan, en cours: cette page est un squelette, complété au lot 3.

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
| Ce qui se déploie | le visualiseur de rapports, **lot 3** |
| Production | `https://labo.oscar-bot.com`, **lot 3** |
| Test | `https://test-labo.oscar-bot.com`, **lot 3** |
| En local | le visualiseur sur `http://127.0.0.1:18400`, **lot 3** |

Les scénarios eux-mêmes ne se déploient pas: ils se lancent, en conteneur,
contre une application déployée ou lancée en local.

## Lancer en local

**À compléter au lot 3, en cours le 25 septembre 2026.** Le lot 3 apporte:

- une seule image, avec Playwright, Node et Python, et `docker compose run`
  comme chemin documenté, console comprise;
- une commande pour viser un niveau (local, test, production), une
  application, une fonctionnalité ou un scénario, sans toucher à la
  configuration enregistrée;
- trois niveaux d'adresses, local, test et production, pour toutes les
  applications; une adresse manquante devient une erreur franche;
- la façon de joindre, depuis le conteneur du laboratoire, les applications
  lancées sur le poste.

Sur ce dernier point, une précaution: sous Linux, le nom `host.docker.internal`
seul ne joint pas un port publié sur `127.0.0.1`, comme le sont tous ceux des
applications OSCAR. Un réglage propre à Linux est nécessaire; il a été mesuré
le 25 septembre 2026 (incident `INC-2026-09-25-13`). Sous macOS et Windows:
non vérifié. Le guide du laboratoire, réécrit au lot 3, donne le réglage.

Tant que le lot 3 n'est pas terminé, ce guide ne donne aucune commande de
lancement du laboratoire: celles de son dossier sont en cours de refonte.

## Tester en local

Le laboratoire a ses propres tests, qui vérifient sa console. **À compléter au
lot 3**: leur lancement en conteneur, et le retour au vert du test cassé par un
ménage incomplet du 25 septembre 2026 (incident `INC-2026-09-25-08`: 60 tests
verts sur 60 avant le ménage, 59 après).

## La chaîne

**Aucune aujourd'hui.** Au lot 3: des vérifications à chaque envoi, et la
recette complète contre le niveau de la branche, sur le patron commun
([la chaîne](../05-la-chaine.md)).

Les chaînes des autres dépôts liront le laboratoire pour leur recette, par une
clé en lecture seule: **lot 3**.

## Le déploiement

| | Production | Test |
|---|---|---|
| Projet Coolify | `labo` | `labo` |
| Environnement Coolify | `production` | `test` |
| Application Coolify | `labo-production`, **lot 3** | `labo-test`, **lot 3** |
| Branche | `main` | `test`, **lot 3** |

Les projets et les environnements Coolify existent (relevé par l'API le 25
septembre 2026); aucune application n'y est encore créée. Le visualiseur
montrera les rapports de la dernière passe du niveau correspondant, derrière un
accès protégé.

## Surveiller

| Où | Adresse |
|---|---|
| Le dépôt | `https://github.com/oscar-organisation/oscar-test` |
| La chaîne | `https://github.com/oscar-organisation/oscar-test/actions`, **lot 3** |
| Coolify | `https://deploy.oscar-bot.com`, projet `labo` |
| Les rapports | `https://test-labo.oscar-bot.com` et `https://labo.oscar-bot.com`, **lot 3** |

## Ce qui reste à faire

Au lot 3 du plan:

- les environnements refondus en trois niveaux, conformes à la convention des
  ports;
- tout en conteneur, console comprise, et le lancement ciblé;
- toutes les variables transmises au conteneur, les arguments passés sans
  déformation, des identifiants séparés par niveau;
- le reste de l'héritage d'un autre projet retiré, et le test de la console
  remis au vert;
- la chaîne du dépôt `oscar-test`;
- le visualiseur de rapports déployé en test et en production, avec accès
  protégé;
- le guide d'utilisation réécrit, avec les vraies commandes;
- l'accès en lecture des autres dépôts au laboratoire, pour leur recette;
- la preuve: un développeur clone, configure son local, lance une application
  précise, vise le test par une commande, ajoute un scénario, pousse; la chaîne
  tourne et le rapport apparaît.

Cette page sera complétée avec les commandes que le lot 3 aura éprouvées.
