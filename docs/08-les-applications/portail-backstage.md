# Portail Backstage

Où en est le portail dans le cycle: le tableau
d'[où en est le cycle](../02-le-cycle-pas-a-pas.md#ou-en-est-le-cycle-aujourdhui),
tenu à un seul endroit. Cette page ne dit que ce qui ne change pas d'une
livraison à l'autre: les noms, les adresses, les commandes.

## En bref

Le portail technique d'OSCAR, construit avec Backstage, version 1.55. Il
rassemble au même endroit les applications et les dépôts: pour chacun, sa
description, l'état de ses vérifications automatiques, et ses liens vers le
test, la production, Coolify, le code et les rapports du laboratoire. Il affiche aussi la
documentation des dépôts, dont ce guide, et sa page d'accueil, « Commencer
ici », mène un nouveau venu où il doit aller.

La page d'accueil a quatre parties: les lectures à faire dans l'ordre, les
applications, les outils, et **le déploiement**: la fiche « Le déploiement »
(sa documentation vit dans le dépôt `oscar-infrastructure`, dossier
`oscar_infra_deploiement/`), Coolify, le proxy Traefik, Harbor (l'entrepôt des
images), le réseau privé WireGuard et OVHcloud, avec le
tableau de bord de Traefik: son adresse, ce qu'on y lit, et le chemin du
fichier de ses identifiants sur le serveur, jamais leur valeur. Chaque partie
se règle par une liste de fiches, dans `oscar_backstage/app-config.yaml`
(`home-page-layout:home/commencer-ici`): une fiche de plus est une ligne de
réglage, pas une ligne de code.

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

La même image d'exécution qu'en production, construite sur le poste
(`compose.override.yaml`: la construction, `pull_policy: never`, jamais
Harbor), avec sa vraie base PostgreSQL. Pour vérifier ce qui sera mis en
ligne.

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
test et en production. C'est le cas des fiches du dépôt
`oscar-infrastructure`, posées dans leur dépôt le 28 septembre 2026: l'outil
DNS et son API, le serveur temps réel, et « Le déploiement ». Sur l'accueil,
en local, leurs cartes disent qu'elles ne sont pas encore dans le catalogue.

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
25 septembre 2026 (mesuré sur le serveur du projet). Une seconde construction
sans changement prend une dizaine de secondes: tout est repris du cache.

**Ce qu'on doit voir**: la construction va au bout, sans erreur. Elle compile le
code, construit le portail, puis lance ses tests: la page de connexion
(l'invité sur le poste, GitHub ailleurs, l'icône OSCAR devant son titre), et
les réglages (aucun port publié par `compose.yaml`, la composition qui désigne
l'image de Harbor sans construire, le contrôle de santé sur la bonne route,
les variables toutes décrites, les réglages du poste jamais dans l'image).
C'est l'étape que jouent les vérifications automatiques.

**Les tests de l'accueil et de la charte** (aucune couleur hors de la
palette, contrastes lisibles, l'anneau orange au focus, le filet de la barre
de menu du téléphone, la page d'accueil) ne sont lancés par rien depuis le
4 octobre 2026 (décision 91): les lancer **avant de toucher à l'accueil ou à
la charte**, depuis `oscar_backstage/`:

```
docker build --target verifications-du-developpeur --output type=cacheonly .
```

Les images de marque (le symbole, les icônes) se vérifient à part, à la main
depuis le 4 octobre 2026, et leur générateur a ses propres tests:

```
docker compose -f marque/compose.yaml run --rm verifier
docker compose -f marque/compose.yaml run --rm tester
```

### Vérifier la charte à l'écran

À la main depuis le 4 octobre 2026 (décision 91). Un vrai navigateur, en conteneur, ouvre le portail lancé en mode service, entre
en invité, et parcourt la connexion, l'accueil, le catalogue, le graphe, une
fiche et deux pages du guide, sur ordinateur et sur téléphone, en clair et en
sombre (28 pages). Sur chacune, il relève chaque couleur affichée et la compare
à la charte (les couleurs de `packages/app/src/modules/charte/jetons.ts`),
mesure le contraste de chaque texte au seuil AA de sa taille, et prend une
capture. Sur le guide, il clique sur un schéma et vérifie qu'il s'ouvre en
grand. Sur la page de connexion, il avance au clavier jusqu'au bouton qui
connecte, et vérifie qu'il porte l'anneau orange de la charte (4 vues de plus).
Sur l'accueil, il lit la partie « Le déploiement »: elle doit être là, avec
des cartes de fiches, et le bloc du tableau de bord de Traefik doit
donner une adresse en `https`, le chemin de ses identifiants sous
`secret_root/` et un lien vers sa documentation dans le portail. Une fiche
absente du catalogue est nommée, sans compter comme un défaut: c'est le cas
normal en local pour les fiches qui vivent dans le dépôt `oscar-infrastructure`
(« Le déploiement », Harbor, le réseau privé).

```
docker compose up --build -d
ADRESSE=http://127.0.0.1:18500 MODE=invite docker compose -f verifications-ecran/compose.yaml run --rm verifier
```

**Ce qu'on doit voir**: une ligne par page, puis `BILAN  pages: 32  couleurs
hors charte: 0  textes sous le seuil AA: 0  pages non affichees: aucune`,
`LIGHTBOX  echecs: aucun`, `FOCUS  sans l anneau de la charte, hors de
l ecran ou non atteint: aucun`, `DEPLOIEMENT  partie, tableau de bord de
Traefik ou fiches en defaut: aucune`, en local
`DEPLOIEMENT  fiches dites absentes du catalogue: component:default/deploiement, resource:default/entrepot-images, component:default/reseau-prive`
(non rejoué depuis l'ajout des deux dernières, le 04/10/2026),
et le code de sortie 0. Les captures et le
relevé complet (`releve.json`) sont dans `verifications-ecran/resultats/`, que
git ne suit pas.

Il n'y a plus d'écart connu. Le filet d'un pixel en haut de la barre de menu
du téléphone, gris `#383838`, est écrit en dur par Backstage, sans nom de
style; le thème le peint depuis le 28/09/2026 par la propriété par défaut de
cette barre (`MuiBottomNavigation`). S'il revenait, le contrôle le compterait
comme toute couleur hors charte.

Ce que le contrôle mesure, et son verdict, ont leurs tests, sur des pages
d'essai dont on connaît la réponse (`verifications-ecran/tests/`):

```
docker compose -f verifications-ecran/compose.yaml run --rm tester
```

**Ce qu'on doit voir**: `ℹ fail 0` en fin de sortie, et le code de sortie 0.

Sous Linux seulement: le conteneur rejoint le portail par le réseau de la
machine (`network_mode: host`). Sous macOS et Windows: non vérifié.

## Les vérifications automatiques

`.github/workflows/verifications-automatiques.yml`, sur le patron commun
([les vérifications automatiques](../05-les-verifications-automatiques.md)),
en trois tâches depuis le 4 octobre 2026:

| Tâche | Ce qu'elle fait |
|---|---|
| Vérifications rapides | aucun secret, aucune ligne d'attribution, `.env` copie de `.env.exemple`, typographie, fichiers des vérifications automatiques, compositions valides, aucun port publié par `compose.yaml`, la construction stricte du guide (décision 98) |
| Tests du code, puis construire, ranger et mettre en ligne | le déploiement automatique commun du dépôt `oscar-infrastructure`: « Tests du code dans l'image » (l'étape `verifications` du Dockerfile, pour une PR vers `test` et à l'envoi sur `test`); à l'envoi sur `test`, la construction de l'image si elle manque dans Harbor, son contrôle par `controler-l-image.sh` (le contenu de l'image exacte qui sera rangée: les réglages du poste n'y sont pas, MkDocs y est), son rangement dans `oscar/portail-portail`, Trivy, la mise en ligne en test; pour `main`, la même image retrouvée et mise en ligne en production, sans tests ni construction |
| Résumé | un tableau sur la page de l'exécution, et un seul commentaire dans la PR |

L'empreinte du contenu est celle de `oscar_backstage/`, sans la documentation
(`*.md`), `catalog-info.yaml`, la fabrication des images de marque (`marque/`)
ni la vérification à l'écran (`verifications-ecran/`), qui n'entrent pas dans
l'image. Les schémas, les images de marque, le contrôle à l'écran et les tests
de l'accueil et de la charte se lancent à la main (décision 91;
`oscar_backstage/LISEZ-MOI.md`, « Les outils du développeur »).

## Le déploiement

| | Production | Test |
|---|---|---|
| Projet Coolify | `portail` | `portail` |
| Environnement Coolify | `production` | `test` |
| Application Coolify | `portail-production` | `portail-test` |
| Branche | `main` | `test` |
| Image | `oscar/portail-portail` dans Harbor, la même | `oscar/portail-portail`, construite une fois à la fusion dans `test` |

Coolify ne construit plus le portail (plan 17): il lance l'image que désigne
la variable `ETIQUETTE_IMAGE_A_METTRE_EN_LIGNE` de l'application (une
étiquette `contenu-<empreinte>`), posée par les vérifications automatiques.
La base garde l'image publique `postgres:16.15-alpine`. Le retour en arrière
se fait par l'étiquette d'une image précédente, jamais par le bouton
« Rollback » de Coolify ([les environnements](../04-les-environnements.md)).

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
| Les vérifications automatiques | `https://github.com/oscar-organisation/oscar-general-gouvernance-project/actions` |
| Coolify | `https://deploy.oscar-bot.com`, projet `portail` |
| Le portail | `https://tech.oscar-bot.com` et `https://test-tech.oscar-bot.com` |

## Limites connues

- La recette par le laboratoire n'est pas branchée dans les vérifications
  automatiques du portail:
  le laboratoire n'a encore aucun scénario du portail.
- Les écrans internes de Backstage ne sont traduits qu'en partie: la
  connexion, le menu, l'accueil, la recherche, le graphe et les messages
  d'erreur le sont; les pages du catalogue et de la documentation gardent en
  partie leurs textes anglais d'origine.
- Les logos complets d'OSCAR ne sont pas employés tant que la charte n'en
  fournit pas une version dont l'orange est juste (voir
  `oscar_backstage/marque/LISEZ-MOI.md`).
- Le lien « Aller au contenu » que Backstage place en tête du menu, pour le
  clavier, n'apparaît qu'après un nouveau rendu du menu survenu une fois le
  titre de la page affiché: sa présence dépend de l'ordre des rendus (mesuré
  le 28/09/2026: absent de sept pages, au clavier comme à la souris). Ses
  couleurs viennent du thème (texte à l'encre, anneau orange au focus), ce que
  vérifie le test de la charte; elles n'ont pas pu être vues à l'écran ce
  jour-là, faute de lien affiché.

Le reste se lit dans le tableau
d'[où en est le cycle](../02-le-cycle-pas-a-pas.md#ou-en-est-le-cycle-aujourdhui).
