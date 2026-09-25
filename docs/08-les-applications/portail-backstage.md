# Portail Backstage

**État au 25 septembre 2026, 21h56 UTC.** Le portail est mis en route par le
lot 4 du plan: connexion par GitHub, charte OSCAR, page « Commencer ici »,
catalogue rangé, ce guide lisible dans le portail, deux façons de travailler
en local, et sa chaîne. Ses deux applications Coolify existent; son premier
déploiement, en test, part à la fusion de la PR 2 vers `test`. Ce qui n'est
pas encore en place est dit comme tel, plus bas.

## En bref

Le portail technique d'OSCAR, construit avec Backstage, version 1.55. Il
rassemble au même endroit les applications et les dépôts: pour chacun, sa
description, l'état de sa chaîne, et ses liens vers le test, la production,
Coolify, le code et les rapports du laboratoire. Il affiche aussi la
documentation des dépôts, dont ce guide, et sa page d'accueil, « Commencer
ici », mène un nouveau venu où il doit aller.

On s'y connecte avec son compte GitHub, membre de l'organisation
`oscar-organisation`. Sur son poste, on entre en invité, sans compte.

| | |
|---|---|
| Dépôt | [`oscar-general-gouvernance-project`](https://github.com/oscar-organisation/oscar-general-gouvernance-project) |
| Dossier de l'application | `oscar_backstage/` |
| Services | `portail`, Backstage, port interne 7007; `base`, PostgreSQL 16 |
| Production | `https://tech.oscar-bot.com` |
| Test | `https://test-tech.oscar-bot.com` |
| En local | `http://127.0.0.1:18500` en mode service; `http://127.0.0.1:18501` en mode développement |

## Lancer en local

Deux façons de travailler, **sans aucun secret**, toutes deux depuis le dossier
du portail:

```
cd oscar_backstage
```

### Le mode service, proche de la production

La même image qu'en production, avec sa vraie base PostgreSQL. Pour vérifier
ce qui sera déployé.

```
docker compose up --build -d
docker compose ps
```

**Ce qu'on doit voir**: les services `base` et `portail` `Up`, puis
`(healthy)` après une à deux minutes: le portail se déclare prêt quand tous ses
modules ont démarré. Le portail s'ouvre sur `http://127.0.0.1:18500`, et
propose d'entrer en invité.

La première construction est longue: plusieurs dizaines de minutes, surtout
pour installer les dépendances. Les suivantes reprennent ce qui n'a pas changé.

Pour arrêter: `docker compose down`.

### Le mode développement, avec rechargement à chaud

Le code du poste est monté dans le conteneur: une modification de
l'interface se voit dans le navigateur sans rien relancer.

```
docker compose up --build developpement
```

**Ce qu'on doit voir**: après une à deux minutes, dans le journal, le serveur
de l'interface qui annonce qu'il a fini de compiler. L'interface s'ouvre sur
`http://127.0.0.1:18501`; le serveur du portail répond sur
`http://127.0.0.1:18502`. `Ctrl+C` arrête.

Une modification de `app-config.yaml` ou d'un autre fichier de réglages se
prend en relançant: `docker compose restart developpement`. Une modification
des dépendances (`package.json`) demande `docker compose build developpement`.

### Ce que le portail montre en local

Sans accès à GitHub, le portail lit le catalogue et la documentation **sur le
poste**: la structure du catalogue (`oscar_backstage/catalogue/`), les fiches en
attente, et la fiche du dépôt avec ce guide, tels qu'ils sont au lancement. Les
fiches des autres dépôts n'y sont pas: le portail ne les lit que sur GitHub, en
test et en production.

La fiche et le guide sont **copiés** à chaque lancement, par le service
`copie-du-depot`: TechDocs réécrit `mkdocs.yml` avant chaque construction, et ne
doit pas toucher au dépôt du poste. Après une modification du guide,
`docker compose up -d` refait la copie; pour relire le guide pendant qu'on
l'écrit, sa construction en conteneur est plus directe (partie « Construire ce
guide en local », plus bas).

Les réglages du poste sont dans `oscar_backstage/app-config.poste.yaml`. Ils
n'entrent jamais dans l'image, et Coolify ne les lit pas.

### Les réglages

Chaque variable est décrite dans `oscar_backstage/.env.exemple`: son rôle et
son niveau (local, test, production). Le fichier `.env` en est une copie, et
suffit pour travailler. Les ports suivent la convention: `18500`, `18501` et
`18502`, sur `127.0.0.1` seulement.

## Construire ce guide en local

Ce guide est la documentation du composant `oscar-general-gouvernance-project`
dans le portail. Il se construit et se vérifie en conteneur, depuis la racine
du dépôt, sans le portail:

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
`docs/`. Le portail construit la documentation lui-même (réglage
`techdocs.generator.runIn: local`), avec MkDocs et son module
`mkdocs-techdocs-core` installés dans son image, **aux mêmes versions** que
l'image de la vérification ci-dessus (`oscar_backstage/techdocs/requirements.txt`):
une page qui passe la vérification s'affiche à l'identique dans le portail.

Dans le portail, un clic sur un schéma l'ouvre en grand: c'est l'extension
`LightBox` de TechDocs.

## Tester en local

Les tests du portail tournent dans l'image, depuis `oscar_backstage/`:

```
docker build --target verifications --output type=cacheonly .
```

`--output type=cacheonly` garde le verdict sans enregistrer d'image: seul
compte que la construction aille au bout. Sans lui, Docker enregistre une
image de tests de plusieurs gigaoctets, ce qui a pris 19 minutes de plus le
25 septembre 2026 (mesuré sur le serveur du projet). Une seconde passe sans
changement prend une dizaine de secondes: tout est repris du cache.

**Ce qu'on doit voir**: la construction va au bout, sans erreur. Elle compile le
code, construit le portail, puis lance tous ses tests: la page de connexion
(l'invité sur le poste, GitHub ailleurs), la charte (aucune couleur hors de la
palette, contrastes lisibles), la page d'accueil, et les réglages (aucun port
publié par `compose.yaml`, le contrôle de santé sur la bonne route, les
variables toutes décrites, les réglages du poste jamais dans l'image).

Les images de marque (le symbole, les icônes) se vérifient à part:

```
docker compose -f marque/compose.yaml run --rm verifier
```

## La chaîne

`.github/workflows/chaine.yml`, sur le patron commun ([la chaîne](../05-la-chaine.md)):

| Tâche | Ce qu'elle vérifie |
|---|---|
| `controles` | aucun secret, `.env` copie de `.env.exemple`, typographie, fichiers de chaîne, compositions valides, aucun port publié par `compose.yaml` |
| `verifs` | les tests du portail, l'image d'exécution et son contenu (les réglages du poste n'y sont pas, MkDocs y est), la construction stricte du guide, les schémas, les images de marque |
| `deploiement` | par le workflow commun du dépôt `oscar-infrastructure`, après une fusion dans `test` ou `main`, si le contenu de `oscar_backstage/` a changé, hors documentation (`*.md`), fabrication des images de marque (`marque/`) et vérification à l'écran (`verifications-ecran/`) |

## Le déploiement

| | Production | Test |
|---|---|---|
| Projet Coolify | `portail` | `portail` |
| Environnement Coolify | `production` | `test` |
| Application Coolify | `portail-production` | `portail-test` |
| Branche | `main` | `test` |

La même application GitHub, `oscar-portail-technique`, sert en test et en
production (décision 64). Ses identifiants, et le mot de passe de la base de
chaque environnement, sont posés sur l'application Coolify depuis
`secret_root/`, jamais écrits dans le dépôt.

Vérifier que le portail répond, par sa route de santé, qui ne répond `200` que
quand tous ses modules sont prêts:

```
docker run --rm curlimages/curl:8.22.0 -fsS https://tech.oscar-bot.com/.backstage/health/v1/readiness
```

**Ce qu'on doit voir**: `{"status":"ok"}`.

## Surveiller

| Où | Adresse |
|---|---|
| Le dépôt | `https://github.com/oscar-organisation/oscar-general-gouvernance-project` |
| La chaîne | `https://github.com/oscar-organisation/oscar-general-gouvernance-project/actions` |
| Coolify | `https://deploy.oscar-bot.com`, projet `portail` |
| Le portail | `https://tech.oscar-bot.com` et `https://test-tech.oscar-bot.com` |

## Ce qui reste à faire

- le premier déploiement par la chaîne, en test puis en production (lot 4,
  en cours);
- la recette par le laboratoire (lot 3b);
- la traduction en français des écrans internes de Backstage: la connexion,
  le menu, l'accueil et les messages d'erreur le sont; les pages du catalogue,
  de la documentation et de la recherche gardent en partie leurs textes
  anglais d'origine;
- les logos complets d'OSCAR, dès que la charte en fournit une version dont
  l'orange est juste (voir `oscar_backstage/marque/LISEZ-MOI.md`).
