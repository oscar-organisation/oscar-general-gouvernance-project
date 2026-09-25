# Portail Backstage

**État au 25 septembre 2026.** Le portail n'est pas en service. Son code existe,
mais personne ne peut s'y connecter, et il n'a ni chaîne ni déploiement. Sa mise
en route est le lot 4 du plan: cette page est un squelette, complété au lot 4.
Seule la construction de ce guide est déjà vraie, et décrite plus bas.

## En bref

Le portail technique d'OSCAR, construit avec Backstage, version 1.55. Il
rassemble au même endroit toutes les applications et tous les dépôts: pour
chacun, sa description, l'état de sa chaîne, et ses liens vers le test, la
production, Coolify, le dépôt et les rapports du laboratoire. Il affiche aussi
la documentation des dépôts, dont ce guide, qui y sera la page d'accueil des
nouveaux venus. On s'y connecte avec son compte GitHub.

| | |
|---|---|
| Dépôt | [`oscar-general-gouvernance-project`](https://github.com/oscar-organisation/oscar-general-gouvernance-project) |
| Dossier de l'application | `oscar_backstage/` |
| Production | `https://tech.oscar-bot.com`, **lot 4** |
| Test | `https://test-tech.oscar-bot.com`, **lot 4** |
| En local | `http://127.0.0.1:18500`, et `18501`, `18502` en mode développement, **lot 4** |

## Lancer en local

**À compléter au lot 4.** Le lot 4 apporte deux façons de travailler en local,
**sans aucun secret**: un mode développement, qui recharge le portail à chaque
modification, et un mode service, proche de la production.

Aujourd'hui, la composition `oscar_backstage/compose.yaml` demande les
identifiants de l'application GitHub du portail et un fichier de clé privée du
serveur: elle ne se lance pas sur le poste d'un développeur.

## Construire ce guide en local

Ce guide est la documentation du composant `oscar-general-gouvernance-project`
dans le portail. Il se construit et se vérifie en conteneur, depuis la racine du
dépôt, sans le portail:

```
docker compose -f docs/outils/compose.yaml run --rm construire
```

La commande construit le guide avec l'image officielle du générateur de
TechDocs, le lecteur de documentation de Backstage, et échoue au moindre
avertissement: lien cassé, page oubliée, ancre absente.

**Ce qu'on doit voir**: une dernière ligne `Documentation built in` suivie d'une
durée, et aucune ligne `WARNING`.

Les schémas du guide ont leurs propres commandes: voir
[les schémas](../schemas/README.md).

**Comment le portail trouve ce guide.** Le fichier `catalog-info.yaml`, à la
racine du dépôt, porte l'annotation `backstage.io/techdocs-ref: dir:.`: la
documentation est décrite par `mkdocs.yml`, à la racine, et ses pages sont dans
`docs/`. En production, le portail construit la documentation lui-même
(réglage `techdocs.generator.runIn: local`): son image devra donc contenir
MkDocs et son module `mkdocs-techdocs-core`. **Ce n'est pas le cas
aujourd'hui: lot 4.**

## Tester en local

**À compléter au lot 4.**

## La chaîne

**Aucune aujourd'hui.** Au lot 4: la chaîne sur le patron commun
([la chaîne](../05-la-chaine.md)).

## Le déploiement

| | Production | Test |
|---|---|---|
| Projet Coolify | `portail` | `portail` |
| Environnement Coolify | `production` | `test` |
| Application Coolify | `portail-production`, **lot 4** | `portail-test`, **lot 4** |
| Branche | `main` | `test`, **lot 4** |

Les projets et les environnements Coolify existent (relevé par l'API le 25
septembre 2026); aucune application n'y est encore créée.
`https://tech.oscar-bot.com` répond `503`: le nom est connu du proxy, mais rien
ne tourne derrière.

## Surveiller

| Où | Adresse |
|---|---|
| Le dépôt | `https://github.com/oscar-organisation/oscar-general-gouvernance-project` |
| La chaîne | `https://github.com/oscar-organisation/oscar-general-gouvernance-project/actions`, **lot 4** |
| Coolify | `https://deploy.oscar-bot.com`, projet `portail` |
| Le portail | `https://tech.oscar-bot.com` et `https://test-tech.oscar-bot.com`, **lot 4** |

## Ce qui reste à faire

Au lot 4 du plan:

- **la connexion par GitHub**, qui n'existe pas encore: aucune page de
  connexion n'est déclarée, et l'accès invité est refusé hors développement;
- la composition adaptée à Coolify: plus de noms de conteneur fixes, plus de
  règles de proxy écrites à la main, pour que le test et la production puissent
  tourner côte à côte;
- le contrôle de santé sur la vraie route de disponibilité: aujourd'hui, il vise
  une route qui n'existe pas, et répond donc toujours « sain »;
- les deux façons de travailler en local, sans secret;
- la charte OSCAR: couleurs, polices, logo, nom, page d'accueil;
- l'accueil des nouveaux venus: une page « Commencer ici », ce guide, les liens
  vers chaque application et chaque outil;
- le catalogue rangé, avec pour chaque composant ses liens et l'état de sa
  chaîne;
- TechDocs en état de marche, pour que ce guide soit lisible dans le portail;
- la chaîne, sur le patron commun;
- les applications Coolify de test et de production;
- la preuve du cycle complet, avec une vraie connexion.

Le portail utilise la même application GitHub en test et en production
(décision 64). Pour qu'on puisse se connecter au test, son adresse de retour
doit être ajoutée aux réglages de cette application, qui est sur le compte de
Joel: c'est à lui de le faire.

Cette page sera complétée avec les commandes que le lot 4 aura éprouvées.
