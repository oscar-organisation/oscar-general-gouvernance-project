# Lot 3a. Le cœur du laboratoire de tests

25 septembre 2026. Plan : `_pilotage/11-PLAN-cycle-de-developpement-des-trois-applications.md`, lot 3.
Dépôt : `oscar-test`, dossier `oscar_labo_test_application/`.

---

## 1. Ce que Joel a demandé

Qu'un développeur clone `oscar-test` et trouve le laboratoire évident à utiliser
sur son poste : configurer les adresses et les variables des applications à
tester pour trois niveaux, local, test et production ; lancer tout, une
application, une fonctionnalité ou un scénario, contre le niveau de son choix,
**par une commande** ; ajouter des scénarios ; lire les rapports. Tout en
conteneur, rien à installer d'autre que git et Docker.

Hors de ce lot, et préparés pour lui : la chaîne GitHub du dépôt, le déploiement
du visualiseur de rapports par Coolify, la recette lancée depuis les autres
dépôts. C'est le lot 3b.

## 2. Ce qui a été trouvé en arrivant

L'analyse du 25/09 a été revérifiée, point par point, et tout était exact. Par
mesure, en conteneur, sur une copie de l'état de départ : la suite de la console
(59 sur 60), l'échec de `labo lancer --grep @nominal` (`labo: error:
unrecognized arguments: --grep`, code 2), les 45 tests. Par lecture du code : le
reste.

- des environnements découpés par application, un seul actif, et une adresse
  absente qui retombait **en silence** sur une adresse locale par défaut, fausse
  pour l'outil DNS (18300 et 18301 au lieu de 18101 et 18100) ;
- `run-tests.sh` qui ne transmettait ni les `URL_...` ni `LABO_WORKERS`,
  recollait les arguments pour bash, faisait `npm install` à chaque lancement
  dans le dossier monté, et utilisait `--network host` ;
- une console qui demandait Python, rich et PyYAML sur le poste ;
  `labo lancer --grep @nominal` qui échouait ;
- un modèle de scénario qui ouvrait `/`, donc l'interface DNS, quelle que soit
  l'application ;
- aucune vérification des types ;
- **la suite de la console rouge : 59 sur 60**, mesuré en conteneur sur l'état de
  départ (commit `10754d1`), le test `exemple versionné = exemple généré depuis
  adresses.json` (INC-2026-09-25-08) ;
- une documentation aux chemins inexistants, aux exemples de BOAZ, au ton
  publicitaire ;
- 15 scénarios (outil DNS 10, console 2, Keycloak 3), trois écrans : 45 tests.

**Et un point que l'analyse n'avait pas vu, mesuré avant de concevoir** : sous
Linux, `host.docker.internal:host-gateway` ne joint pas un port publié sur
`127.0.0.1`, or c'est ainsi que l'outil DNS publie les siens. La promesse du plan
(« marche sous Linux, macOS et Windows ») était fausse sous Linux
(INC-2026-09-25-13, partie 5, décision 6).

## 3. Ce qui a été fait

Sauvegarde du lot, avant toute modification :
`~/OSCAR-PROJECT/backup/20260925-144322-lot3a-laboratoire/`, avec son `NOTE.md`
(dépôt `oscar-test` entier, dossier d'exploitation, dépôt des incidents, et le
`node_modules` retiré du poste).

### 3.1 Trois niveaux, sans aucun repli silencieux

`adresses.json` reste la seule source, et dit maintenant trois choses :

- **les adresses** : `interface`, `api`, `console_admin`, `keycloak`, chacune
  avec sa variable (`URL_INTERFACE`...) ;
- **les applications** : `outil-dns` (interface, api), `admin-console`
  (console_admin), `keycloak` (keycloak), chacune avec les adresses et les
  identifiants dont ses scénarios ont besoin ;
- **les niveaux** : `local`, `test`, `production`. Chaque niveau donne une valeur
  à chaque adresse, ou dit dans `absentes` pourquoi il n'en a pas.

| Niveau | Outil DNS | Console, Keycloak |
|---|---|---|
| `local` | `http://host.docker.internal:18101`, `:18100` | `:18200`, `:18201` (réservés) |
| `test` | `https://test-dns.oscar-bot.com`, `https://test-api-dns.oscar-bot.com` | absents : la console n'est pas déployée en test (décision de Joel) |
| `production` | `https://dns.oscar-bot.com`, `https://api-dns.oscar-bot.com` | `https://admin-console.oscar-bot.com`, `https://auth.oscar-bot.com` |

Le niveau se choisit par `--niveau`, sinon `LABO_NIVEAU`, sinon `local`, et il
est toujours affiché avec l'origine du choix. Une variable `URL_...` passée au
conteneur remplace une adresse le temps d'un lancement, et la console le dit. Un
développeur ajoute ses propres niveaux dans `config/niveaux-personnels.yaml`, non
versionné, à partir d'un modèle généré.

Avant tout lancement, la console **refuse** si une adresse manque, si une
application n'a pas d'environnement au niveau choisi, si le niveau est inconnu,
ou si une adresse ne répond pas, avec ce qu'il faut faire. Côté tests, `ENV`
n'a plus de valeur par défaut : lire une adresse non fournie lève une erreur qui
le dit. Playwright ne reçoit que les adresses des applications choisies.

### 3.2 Tout en conteneur, console comprise

- `Dockerfile` : `mcr.microsoft.com/playwright:v1.49.1-noble` (la version de
  `package.json`), Python et `requirements.txt` (rich 13.9.4, PyYAML 6.0.2) dans
  un environnement à part, dépendances Node installées par `npm ci` dans
  `/labo/node_modules`. Le laboratoire est monté juste en dessous,
  `/labo/laboratoire` : Node et TypeScript trouvent leurs modules en remontant,
  sans aucun `node_modules` sur le poste. Image : 3,6 Go, 3 min 17 s de
  construction. Contenu vérifié après construction (Python 3.12.3, Playwright
  1.49.1, TypeScript 5.7.3, @types/node 22.10.10, Monocart 2.12.2, Chromium 1148).
- `compose.yaml` : le service `labo` (profil `outil`, lancé par
  `docker compose run --rm labo <commande>`, avec le compte du développeur,
  `init`, 1 Go de mémoire partagée, et la liste des variables à transmettre) ; le
  service `visualiseur` (nginx), sans port publié.
- `compose.override.yaml` : le visualiseur sur `127.0.0.1:18400`.
- `.env.exemple` : les réglages propres à un poste.
- `./labo` : le seul raccourci bash, qui fait `docker compose run --rm labo "$@"`
  et ajoute l'identifiant de l'utilisateur.
- La console refuse de lancer si l'image est plus ancienne que `package.json`,
  `package-lock.json` ou `requirements.txt` : l'image en garde une copie.

Retirés : `run-tests.sh`, `voir-rapport.sh`, `tester-cli.sh`,
`nouveau-scenario.sh`, `Agent-ai-pilote-labo-test/sandbox.sh`,
`docker-compose.report.yml` et `report-nginx.conf` (l'ancien rapport derrière le
nginx central de l'ancienne machine), `cli/env.py`, `config/environnements.exemple.yaml`.

### 3.3 Une commande pour viser précisément

```
docker compose run --rm labo lister [filtres]
docker compose run --rm labo lancer [filtres]
```

Les filtres sont construits depuis `taxonomie.json` : `--groupe`, `--projet`,
`--app`, `--role`, `--fonctionnalite`, `--type`, `--scenario`, plus `--ecran`
et `--niveau`. Répétés, ils élargissent ; différents, ils se cumulent ; une
valeur inconnue est refusée avec les valeurs existantes. `lister` montre le
niveau, les adresses, les scénarios, et **le nombre de tests compté par
Playwright** (`--list`, sans rien écrire). Tout ce que la console ne connaît
pas, et tout ce qui suit `--`, va à Playwright tel quel, en liste, sans
interpréteur de commandes. Les écrans sont passés dans `taxonomie.json`, pour
que `--ecran` se vérifie et que la configuration de Playwright ne les écrive
plus.

Codes de sortie : `0` vert, `1` des tests échouent, `2` refus de la console.

### 3.4 Les identifiants par niveau

Déclarés application par application dans `adresses.json`
(`OSCAR_ADMIN_EMAIL`, `OSCAR_ADMIN_PASSWORD`, `KC_ADMIN_USER`,
`KC_ADMIN_PASSWORD`). Un modèle versionné par niveau,
`config/identifiants/<niveau>.exemple.env`, généré ; les vraies valeurs dans
`config/identifiants/<niveau>.env`, non versionné ; une variable passée au
conteneur l'emporte. La console affiche les noms fournis, jamais les valeurs, et
signale ceux qui manquent. Plus aucune valeur par défaut dans le code, même pour
un nom d'utilisateur.

**Où sont les valeurs.** Pas dans `~/OSCAR-PROJECT/secret_root/` au 25/09/2026
(vérifié par une recherche de noms de fichiers et de variables, sans afficher de
valeur) : la console et Keycloak de production sont servis par l'ancienne
machine. À demander à Joel. L'outil DNS n'en a besoin d'aucun.

### 3.5 L'héritage BOAZ, et la suite de la console

- Le générateur est refait (`cli/niveaux.py`) : il construit les fichiers
  d'exemple uniquement depuis `adresses.json`, sans y écrire un seul nom
  d'adresse. Les fichiers d'exemple ont été produits par
  `labo regenerer-exemples`, jamais à la main.
- La suite de la console est réécrite pour le nouveau modèle, avec des exemples
  OSCAR : **116 réussis, 0 échoué**, en conteneur (partie 5).
- Recherche du mot nu et de ses variantes sur tout le dépôt : il ne reste que des
  faux positifs vérifiés (partie 5).

### 3.6 Le modèle de scénario

Un seul modèle, `modeles/scenario.modele.ts`, vrai fichier TypeScript lu par
`creer-scenario` et vérifié par `tsc`. Le script créé ouvre
`ENV.<première adresse de l'application>` (`ENV.interface` pour l'outil DNS,
`ENV.consoleAdmin` pour la console). Une application non déclarée est refusée,
avec ce qu'il faut faire. Les deux anciens modèles et la troisième copie cachée
dans `cli/arbo.py` sont retirés. `baseURL` disparaît de la configuration de
Playwright : chaque scénario dit quelle application il ouvre.

### 3.7 La vérification des types

`typescript` 5.7.3 et `@types/node` 22.10.10 dans `package.json`. `tsconfig.json`
couvre les scénarios, les objets de page, les rapporteurs, les deux
configurations de Playwright, le modèle et l'essai du bac à sable.
`docker compose run --rm labo verifier --types`. **Elle a trouvé une vraie
erreur**, dormante depuis la copie du laboratoire : la surcharge de la fixture
`page` dans `shared/fixtures/base.ts` ne se typait pas (TS2322) ; corrigée par un
type explicite, `base.extend<{}>`.

### 3.8 Les rapports par niveau

Chaque passe écrit dans `rapports/<niveau>/` : `index.html` (Monocart, en
arbre), `junit.xml`, `passe.json` (niveau, sélection, adresses, bilan), et
`scenarios/...` pour les captures, vidéos et traces, rangées comme les
scénarios. La console **vide le dossier du niveau** avant chaque passe, après
avoir vérifié que le chemin est bien celui d'un niveau sous `rapports/`. Le
dossier d'une passe n'est calculé qu'à un endroit (`cli/rapports.py`) et transmis
aux rapporteurs. `rapports/index.html` liste les niveaux et le bilan de leur
dernière passe, aux couleurs de la charte OSCAR. Le visualiseur les sert en
local sur `127.0.0.1:18400`.

Les anciens `projets/.../rapports-test/`, qui mêlaient les passes de tous les
environnements et n'étaient jamais vidés, n'existent plus.

### 3.9 La documentation

- `README.md` du laboratoire, réécrit : installer, les niveaux, les identifiants,
  lancer, ajouter un scénario, lire un rapport, vérifier le laboratoire,
  dépanner, comment c'est rangé ; un mode d'emploi en dix lignes en tête. Même
  manière que le guide commun (tableaux, commandes, « ce qu'on doit voir ») ; il
  renvoie au guide commun pour le cycle, sans le recopier.
- `docs/ecrire-un-scenario.md` remplace `docs/README.md`, `docs/cli.md` et
  `docs/convention-ajout-scenario.md`.
- `dev-outils-labo/` : `ARCHITECTURE.md`, `REGLES-DEV.md`, `README.md` réécrits.
- `Agent-ai-pilote-labo-test/` : guide de l'agent et modèle d'essai réécrits
  (chemins et commandes réels).
- `../LISEZ-MOI.md` du dépôt : il disait le laboratoire sans dépôt distant, avec
  61 fichiers ; il dit maintenant ce qui est vrai.
- `ECARTS-AVEC-LA-SOURCE.md` : l'écart 9 ajouté, rien d'autre touché.
- `exploitation/ops-oscar-test/oscar_labo_test_application/LISEZ-MOI.md` :
  complété de ce que le lot 3a prépare pour le déploiement du visualiseur, et de
  ce que le lot 3b devra trancher.

Ni émoji, ni tiret long, ni caractère « points de suspension » dans les fichiers
écrits ; tous les liens relatifs vérifiés (19 fichiers, 0 lien cassé).

## 4. Les décisions prises seul

| # | Décision | Pourquoi | Écarté |
|---|---|---|---|
| 1 | Les niveaux vivent dans `adresses.json`, avec les applications et leurs identifiants | un seul fichier dit tout ce que les tests visent ; la console et les tests le lisaient déjà | un `niveaux.json` voisin : deux fichiers à tenir alignés ; des valeurs rangées adresse par adresse : moins lisible qu'un bloc par niveau, et différent des niveaux personnels |
| 2 | Une absence se déclare, avec sa raison, dans le niveau (`absentes`) | le refus peut dire pourquoi, et un test vérifie que chaque niveau dit quelque chose de chaque adresse | une valeur vide, muette |
| 3 | Niveau par défaut : `local`, toujours affiché | c'est le seul choix sans conséquence si on l'oublie | `--niveau` obligatoire : plus lourd au quotidien |
| 4 | Les adresses voyagent jusqu'aux tests par les variables `URL_...`, et seulement celles des applications choisies | plus de fichier pont à régénérer ; un scénario qui lit l'adresse d'une autre application échoue en le disant | le pont `.env-actif.json` |
| 5 | Vérifier que les adresses répondent avant de lancer | un refus en une ligne plutôt que quarante-cinq échecs après cinq minutes | laisser échouer les tests |
| 6 | Sous Linux, le niveau local se règle dans `.env` : réseau du poste partagé et `host.docker.internal` sur `127.0.0.1` ; par défaut, pont et `host-gateway` (Docker Desktop) | mesuré : le défaut ne joint pas `127.0.0.1` sous Linux, le réglage si, et internet reste joignable | publier les applications sur toutes les interfaces (contraire à la convention) ; un réseau Docker commun aux dépôts (couple les dépôts, change les adresses) ; le réseau du poste pour tous (non vérifiable sous Docker Desktop) |
| 7 | Dépendances dans l'image, un dossier au-dessus du laboratoire monté | Node et TypeScript les trouvent par leur résolution normale | `NODE_PATH` (TypeScript l'ignore) ; un volume anonyme sur `node_modules` (recopié à chaque lancement) ; copier le laboratoire dans l'image (reconstruire à chaque scénario) |
| 8 | L'image ne se reconstruit pas toute seule ; la console refuse une image périmée | une reconstruction en cache coûte 12 s, mesuré, à chaque commande | `pull_policy: build` |
| 9 | Un seul raccourci bash, `./labo` | un chemin documenté, `docker compose`, et un raccourci qui le recopie | garder cinq scripts |
| 10 | Rapports autonomes par niveau, captures comprises, dans `rapports/<niveau>/` | se servent, s'archivent ou se publient seuls (le visualiseur déployé, au lot 3b) ; `projets/` ne porte plus que des sources | des `rapports-test/<niveau>` dans chaque scénario |
| 11 | Identifiants non versionnés, par niveau ; aucune valeur par défaut dans le code | la mission le demande ; ce sont les comptes de chacun, pas la configuration du projet ; les modèles, eux, sont versionnés | les versionner, comme le permet la décision 46 : **à confirmer par Joel** |
| 12 | Les écrans passent dans `taxonomie.json` | `--ecran` se vérifie, et la liste n'est plus écrite en dur dans deux fichiers | les laisser dans `playwright.config.ts` |
| 13 | `verifier` : une commande de la console lance la suite et `tsc` | une seule commande pour le développeur et pour la chaîne | deux services de composition de plus |
| 14 | Le rapporteur en arbre, inactif, est adapté et gardé | il vient du laboratoire d'origine et s'active d'une ligne | le supprimer |
| 15 | `_pilotage/09-CONVENTION-des-ports.md` n'est pas modifié ; la page `08-les-applications/laboratoire.md` du guide commun ne l'est qu'une fois validée par son auteur, et seulement dans ce que livre le lot 3a | le premier appartient à l'orchestrateur ; la seconde s'écrivait en même temps (lot 1b), et annonçait qu'elle serait complétée par le lot 3 | la modifier pendant qu'un autre agent l'écrivait |

## 5. Les preuves

Toutes exécutées en conteneur, sur la machine du projet, le 25/09/2026.

**La suite de la console** (`docker compose run --rm labo verifier --console`) :

```
avant (état de départ, copie isolée)   59 réussis, 1 échoué
après                                  116 réussis, 0 échoué   (environ 2 min 30)
```

**Vus échouer**, sur des copies jetables, en deux séries.

- Première série, quand la suite comptait 113 tests : une variable retirée de
  `compose.yaml`, une ligne `gateway` ajoutée à la main au fichier d'exemple, une
  absence retirée du niveau test, `page.goto('/')` remis dans le modèle, la
  version de Playwright changée dans le `Dockerfile`, `LABO_WORKERS` retiré de
  `.env.exemple`, une erreur de type ajoutée. Résultat : `106 réussis, 7
  échoués`, chaque faute prise par le test qui la vise, et `error TS2322` pour la
  dernière.
- Seconde série, sur les 116 tests : les arguments pour Playwright recollés en
  une chaîne (comme l'ancien `run-tests.sh`), la purge privée de sa vérification
  (et, pour rester sans danger, de son effacement), l'image jamais dite périmée,
  le repli silencieux d'une adresse absente sur l'adresse locale, toutes les
  adresses du poste transmises à Playwright. Résultat : `103 réussis, 13
  échoués` ; chaque faute prise, par 3, 5, 1, 3 et 1 tests.

**Les types** (`verifier --types`) : réussie, après la correction de
`shared/fixtures/base.ts`, qui échouait avant (`error TS2322`).

**`lister`** :

| Commande | Scénarios | Tests |
|---|---|---|
| `lister` | 15 | 45 (desktop 15, tablette 15, mobile 15) |
| `lister --app outil-dns` | 10 | 30 |
| `lister --fonctionnalite declarer-un-fournisseur` | 9 | 27 |
| `lister --scenario accueil-affiche` | 1 | 3 |
| `lister --type nominal` | 5 | 15 |
| `lister --ecran desktop` | 15 | 15 |
| `lister --app outil-dns --type nominal --ecran mobile` | 2 | 2 |
| `./labo lister --app outil-dns --grep "@nominal\|@etat"` | 10 filtrés par Playwright | 15 |
| `docker compose run --rm labo lister --grep @nominal` | 15 filtrés par Playwright | 15 |

**Les refus**, chacun avec le code de sortie `2` et « Rien n'a été lancé » :

```
lancer --niveau test --app admin-console
  L'application « admin-console » n'a pas d'environnement au niveau « test ». La console d'administration
  n'a pas d'environnement de test : elle n'est pas déployée (décision de Joel du 25/09/2026). Lancez ses
  scénarios au niveau production, ou au niveau local.
lancer --niveau serveur-dev --app outil-dns        (niveau personnel sans l'adresse api)
  Le niveau « serveur-dev » (personnel, config/niveaux-personnels.yaml) ne donne pas l'adresse « api »
  (API de l'outil DNS), dont l'application « outil-dns » a besoin. Ajoutez-la à ce niveau, ou
  fournissez-la pour ce lancement : docker compose run --rm -e URL_API=... labo <commande>
lancer --niveau recette --app outil-dns
  Le niveau « recette » n'existe pas. Niveaux disponibles : local, test, production. Pour ajouter un
  niveau à vous seul, copiez config/niveaux-personnels.exemple.yaml en config/niveaux-personnels.yaml
  et suivez ce qu'il dit.
```

**Le niveau local vise le poste** (l'outil DNS ne tournait pas en local ; rien
n'écoutait sur 18100 ni 18101, mesuré par `ss -ltn`) :

```
interface     http://host.docker.internal:18101  (niveau local)
api           http://host.docker.internal:18100  (niveau local)
Erreur : Rien ne répond sur http://host.docker.internal:18101 (...) : [Errno 111] Connection refused.
```

**Le réseau du niveau local sous Linux**, contre un faux service publié sur
`127.0.0.1:18199` : réglage par défaut, `Connection refused` ; réglage Linux,
`200`, et `https://api-dns.oscar-bot.com/v1/health` toujours joignable (`200`).

**Les variables arrivent dans le conteneur** : depuis le terminal
(`URL_API=... docker compose run ...`) et depuis `.env` (`LABO_NIVEAU`,
`LABO_WORKERS`), mesuré par l'environnement vu dans le conteneur ; non définies,
elles y restent non définies.

**Le visualiseur** : `docker port` donne `80/tcp -> 127.0.0.1:18400`, `ss -ltn`
une écoute sur `127.0.0.1:18400` seulement ; sans le complément local
(`docker compose -f compose.yaml config`), aucun port publié. Avant toute passe,
il répond `200` avec « Aucune passe pour l'instant ».

**La passe en production** : voir la partie 6.

## 6. La passe en production

Deux passes réelles, en une tâche, contre `https://dns.oscar-bot.com` et
`https://api-dns.oscar-bot.com` :

```
docker compose run --rm labo lancer --niveau production --app outil-dns
```

**Les conditions, mesurées avant et pendant** (leçon 8.1) : la machine était
partagée avec deux autres agents ; charge de 10 à 21 pour 8 cœurs ; **45 à 65 %
du temps de calcul pris par l'hyperviseur** (`st` dans `top`), c'est-à-dire par
l'hébergeur et non par la machine. Attendre qu'elle se calme aurait pu durer
indéfiniment. La production répondait en 0,29 à 0,49 s au repos.

| Passe | Heures (UTC) | Durée | Résultat |
|---|---|---|---|
| 1 | 15h39 à 15h53 | 13 min 58 s | 29 réussis sur 30, code 1 |
| 2 | 15h58 à 16h09 | 10 min 42 s | **30 réussis sur 30, code 0** |

**L'échec de la première passe, analysé avant de relancer** (leçon 8.3) :
`saisie-au-clavier-seul`, écran `desktop`. Dans sa trace, l'envoi du formulaire,
`POST https://dns.oscar-bot.com/configuration?type=lexicon%3Aovh`, a été coupé
(`net::ERR_CONNECTION_CLOSED`), la page a levé `TypeError: Failed to fetch`, et
le récapitulatif attendu n'est jamais venu (`Timed out 10000ms waiting for
expect(locator).toBeVisible()`). Aucun déploiement Coolify à ce moment, rien
dans les journaux du proxy ni de l'interface. Le même scénario est passé sur
tablette et sur mobile dans la même passe, et sur les trois écrans à la
seconde. Conclusion : une connexion coupée pendant que l'hyperviseur prenait
plus de la moitié du calcul, et non un défaut du scénario ou de l'outil. Le
scénario n'a pas été modifié. **Non expliqué** : ce qui a fermé la connexion.

**Un défaut trouvé par la première passe, corrigé avant la seconde.** Dans son
rapport, 110 des 213 pièces jointes, les captures d'étape, pointaient hors du
dossier du niveau, vers le dossier brut de Playwright. Cause : elles sont jointes
par leur contenu, et Monocart ne les écrit qu'à la fin, après que le rapporteur
a rangé les autres. L'ancien visualiseur servait toute la racine du laboratoire,
et cela ne se voyait pas. Le visiteur de `reporters/fusion-monocart.ts` les
range désormais avec les autres ; vérifié d'abord sur un test (6 pièces jointes,
aucune dehors), puis sur la seconde passe.

**Le rapport de la seconde passe** : `rapports/production/` contient
`index.html`, `index.json`, `junit.xml`, `passe.json` (`"niveau": "production"`,
`"code_retour": 0`, bilan 30 sur 30) et `scenarios/` (210 fichiers, 26 Mo).
213 pièces jointes référencées, **aucune hors du dossier du niveau**. Le
visualiseur sert `/`, `/production/index.html` et une capture d'étape (`200`,
`image/png`) ; la page d'accueil affiche « production, réussie, 30 réussis sur
30 ».

## 7. Anomalies rencontrées

- **`host.docker.internal` sous Linux** : INC-2026-09-25-13, décision 6.
- **Une mesure de départ faussée par moi-même** : j'ai commencé à réécrire
  `adresses.json` pendant que la suite de départ lisait le même dossier. Mesure
  arrêtée et refaite sur une copie isolée (59 sur 60). INC-2026-09-25-14.
- **Une erreur de types dormante** dans `shared/fixtures/base.ts`, trouvée par la
  nouvelle vérification.
- **Les captures d'étape hors du rapport**, défaut plus ancien que ce lot, trouvé
  par la première passe et corrigé (partie 6).
- **Une connexion coupée en production** pendant la première passe, sous une
  très forte charge de l'hébergeur : analysée, non reproduite (partie 6).
- **`shared/pages/LoginPage.ts`** ne sert qu'à la console : d'après la règle du
  laboratoire, sa place est dans les `pages/` de la console. Pas déplacé dans ce
  lot ; écrit dans `docs/ecrire-un-scenario.md`.
- **`projets/.../outil-dns/pages/README.md`** disait qu'aucun écran n'existait :
  corrigé.
- **Sur la machine** : `nodejs` et des bibliothèques pour Playwright ont été
  installés comme paquets système le 24/09 (journal de `dpkg`). Hors de ce lot,
  et déjà signalés au lot 0 : à revoir avec Joel.

## 8. Les fichiers touchés

Dépôt `oscar-test` :

- racine : `LISEZ-MOI.md`, `.gitignore` ;
- `oscar_labo_test_application/` : `adresses.json`, `taxonomie.json`,
  `package.json`, `package-lock.json`, `requirements.txt` (nouveau),
  `Dockerfile` (nouveau), `.dockerignore` (nouveau), `compose.yaml` (nouveau),
  `compose.override.yaml` (nouveau), `.env.exemple` (nouveau),
  `visualiseur/nginx.conf` (nouveau), `labo`, `.gitignore`, `tsconfig.json`,
  `playwright.config.ts`, `playwright.sandbox.config.ts`, `rapports/.gitkeep`
  (nouveau) ;
- `cli/` : `adresses.py`, `arbo.py`, `creer.py`, `lancer.py`, `main.py`,
  `taxonomie.py`, `ui.py`, `voir.py` ; nouveaux `niveaux.py`, `rapports.py`,
  `selection.py`, `verifier.py` ; retiré `env.py` ;
- `config/` : nouveaux `niveaux-personnels.exemple.yaml`,
  `identifiants/local.exemple.env`, `identifiants/test.exemple.env`,
  `identifiants/production.exemple.env` ; retiré `environnements.exemple.yaml` ;
- `shared/` : `config/environnements.ts`, `config/comptes.ts`,
  `config/taxonomie.ts`, `config/passe.ts` (nouveau), `fixtures/base.ts`,
  `helpers/captures.ts` ;
- `reporters/` : `fusion-monocart.ts`, `rapport-par-scenario.ts`,
  `rapport-arbre.ts`, `pieces-jointes.ts` (nouveau) ;
- `modeles/scenario.modele.ts` (nouveau), les deux anciens retirés ;
- `tests-cli/test_cli.py` ;
- documentation : `README.md`, `docs/ecrire-un-scenario.md` (renommé et
  réécrit ; `docs/README.md` et `docs/cli.md` retirés), `dev-outils-labo/*`,
  `Agent-ai-pilote-labo-test/README.md`, `SKILL.md`, `sandbox/_modele.spec.ts`,
  `projets/groupe-oscar/oscar/outil-dns/pages/README.md`,
  `ECARTS-AVEC-LA-SOURCE.md` (ajout) ;
- retirés : `run-tests.sh`, `voir-rapport.sh`, `tester-cli.sh`,
  `nouveau-scenario.sh`, `docker-compose.report.yml`, `report-nginx.conf`,
  `Agent-ai-pilote-labo-test/sandbox.sh`.

Dépôt `oscar-general-gouvernance-project` : ces deux rapports, et la page
`docs/08-les-applications/laboratoire.md` du guide commun, complétée après sa
validation par le lot 1b (commit `5a46fba`) : parties « Lancer en local » et
« Tester en local » avec les commandes éprouvées, et « lot 3 » devenu « lot 3b »
pour ce qui reste. La construction stricte du site (`docker compose -f
docs/outils/compose.yaml run --rm construire`) réussit.

Hors dépôt : `exploitation/ops-oscar-test/oscar_labo_test_application/LISEZ-MOI.md`.

Dépôt `oscar-gestion-incidents-and-reports` : INC-2026-09-25-08 clos (rapport,
point de résolution) ; INC-2026-09-24-03 complété (le Playwright de la machine
est retiré) ; INC-2026-09-25-13 et -14 rédigés ; `INDEX.md`,
`LECONS-A-RESPECTER.md` (règles 2.7 et 2.8), table du dossier
`incidents_oscar-skill-gouvernance-dev-agents`.

Sur la machine, après la preuve en conteneur (partie 6) : retirés
`~/.cache/ms-playwright` (1,5 Go ; ses quatre liens désignaient trois dossiers
disparus et le `node_modules` du laboratoire ; aucun processus ne s'en servait,
et les deux autres projets qui déclarent Playwright, `oscar_console_admin_frontend`
et `oscar_backstage`, n'ont rien installé sur la machine) et le `node_modules`
du laboratoire (19 Mo, gardé dans la sauvegarde le temps de la preuve, puis
supprimé). Vérifié en relisant le disque : les trois chemins n'existent plus.
Complément daté ajouté à INC-2026-09-24-03, qui reste « résolu avec réserve »
pour les paquets système installés le 24/09.

## 9. Ce qui est reporté

**Au lot 3b** :

- la chaîne `.github/workflows/chaine.yml` du dépôt `oscar-test` :
  `docker compose run --rm labo verifier` à chaque envoi, la recette
  `lancer --niveau <niveau de la branche>` ;
- le visualiseur déployé par Coolify, en test et en production : comment les
  rapports lui arrivent, l'accès protégé, le contrôle de santé, et vérifier que
  Coolify respecte le profil `outil` (détail dans le `LISEZ-MOI.md`
  d'exploitation) ;
- l'accès en lecture des autres dépôts au laboratoire, pour leur recette ;
- les identifiants de production dans les secrets de la chaîne ;
- un moyen d'écarter de la production un futur scénario destructif (aucun
  aujourd'hui).

**À l'orchestrateur** :

- `_pilotage/09-CONVENTION-des-ports.md` : le bloc `184xx`, « à poser au lot 3 »,
  est en place (`compose.override.yaml`, 18400 sur `127.0.0.1`, mesuré) ;
- le plan 11 et la décision A5 : corriger la phrase sur `host.docker.internal`
  sous Linux (INC-2026-09-25-13) ;
- la décision 11 ci-dessus, à faire confirmer par Joel.

**Au lot 5** : mesurer le niveau local sous macOS et Windows, sur un poste réel.

**Plus tard** : déplacer `shared/pages/LoginPage.ts` dans les `pages/` de la
console ; une passe au niveau test, quand l'outil DNS y sera déployé (lot 2).

## 10. Références

- `oscar-test` : commit `18bb6d6`, « Laboratoire : trois niveaux, tout en
  conteneur, lancement cible (lot 3a) ».
- `oscar-gestion-incidents-and-reports` : commit `da3c6b6` ; INC-2026-09-25-08,
  -13, -14, et le complément de INC-2026-09-24-03.
- Sauvegarde : `~/OSCAR-PROJECT/backup/20260925-144322-lot3a-laboratoire/`.
- Procédure de vérification pas à pas : [`test-manuel-lot3a.md`](test-manuel-lot3a.md).
