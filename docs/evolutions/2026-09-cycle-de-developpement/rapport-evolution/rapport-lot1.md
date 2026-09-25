# Lot 1. Le modèle commun, et la séparation du code et de l'exploitation

25 septembre 2026. Plan: `_pilotage/11-PLAN-cycle-de-developpement-des-trois-applications.md`.
Le test que Joel peut rejouer lui-même est dans [`test-manuel-lot1.md`](test-manuel-lot1.md).

---

## 1. Ce que Joel a demandé

- **`code/` sert uniquement au développement local**: coder, tester, pousser.
  Rien n'y est déployé, et rien sur le serveur n'en dépend. Si `code/`
  disparaissait, le cycle continuerait (décisions 59 et 60).
- **Tout ce qui déploie va dans `exploitation/`**, organisé comme `code/`:
  `exploitation/ops-<dépôt>/<sous-dossier>/`. Non versionné pour l'instant
  (décision 61).
- **Une unité déployable, un dossier, qui la contient entièrement.** L'outil
  DNS dans `code/oscar-infrastructure/oscar_infra_dns/`, à plat; la plateforme
  de déploiement dans `exploitation/ops-oscar-infrastructure/coolify/`
  (décision 62, après que Joel a relevé un mélange: INC-2026-09-25-09).
- **Un guide du cycle, avec des schémas de flux clairs**: Joel clone et suit.

## 2. Comment

Trois parties, chacune confiée à un agent, puis revérifiée par l'orchestrateur
en relisant l'état:

| Partie | Ce qu'elle a fait | Dépôt touché |
|---|---|---|
| 1a | créer `exploitation/` et y sortir tout ce qui déploie | `oscar-infrastructure`, `exploitation/` |
| 1c | rassembler l'outil DNS dans un seul dossier, à plat, et le redéployer | `oscar-infrastructure`, `exploitation/` |
| 1b | écrire le guide commun du cycle et ses schémas | `oscar-general-gouvernance-project` |

Chaque partie a commencé par une sauvegarde horodatée dans `backup/`, avec son
`NOTE.md`: `20260925-131500-lot1a-separer-code-et-exploitation`,
`20260925-140552-lot1c-rassembler-l-outil-dns`,
`20260925-140719-lot1c-anciennes-sauvegardes-de-l-outil-dns`.

## 3. Le code et l'exploitation séparés (1a)

`exploitation/` a été créé, avec la même forme pour chaque application:

```
exploitation/
  ops-oscar-infrastructure/
    coolify/                         la plateforme qui déploie toutes les applications
    ovhcloud/                        l'outil de la zone DNS, commun à toutes
    oscar_infra_dns/                 l'exploitation de l'outil DNS, et elle seule
  ops-oscar-test/
    oscar_labo_test_application/     l'exploitation du laboratoire
  ops-oscar-general-gouvernance-project/
    oscar_backstage/                 l'exploitation du portail

chaque dossier d'application:  LISEZ-MOI.md, environnements/test/, environnements/production/, procedures/
```

- **Ce qui est sorti de `code/`**: les 59 fichiers de l'ancien dossier
  `deploiement/` (installation et configuration de Coolify, l'assistant de
  déploiement `oscar-coolify`, les descriptions, les plans) et `ovh_api.py`.
- **L'assistant a été adapté** à son nouvel emplacement: 419 tests verts, en
  conteneur. Ses tests ne peuvent plus tourner dans la chaîne GitHub, puisque
  `exploitation/` n'est pas versionné: ils se lancent par son `tester.sh` (A8).
- **Rien sur le serveur ne dépend plus de `code/`**. Vérifié: les fichiers
  d'`exploitation/`, la crontab, les services systemd, les montages des
  conteneurs, le proxy, les fichiers et la base de Coolify (en lecture).
- **Coolify**: l'application `outil-dns` renommée `outil-dns-production` (seul
  le nom a changé, vérifié); un environnement `test` dans le projet
  `outil-dns`; les projets `labo` et `portail`, chacun avec `test` et
  `production` (A2).
- **La convention des ports** complétée: un bloc de cent par application
  (`181xx` outil DNS, `182xx` console, `183xx` Coolify, `184xx` laboratoire,
  `185xx` portail), et la règle d'attribution (A3). Elle disait Coolify sur
  18300 à 18302: faux, il tourne sur 8300, 6001 et 6002 (INC-2026-09-25-10).

## 4. L'outil DNS rassemblé, à plat (1c)

```
code/oscar-infrastructure/oscar_infra_dns/
  .dockerignore  .env  .env.exemple  .gitignore  Dockerfile  README.md
  compose.yaml  compose.override.yaml  pyproject.toml  requirements.txt  requirements-dev.txt
  docs/  interface/  oscar_infra_dns/  tests/
```

- L'ancien dossier `oscar_infra_dns_et_deploiement/`, coupé entre `outil-dns/`
  et son parent, a disparu. Commit `dfcf94e`.
- Coolify lit désormais `/oscar_infra_dns`, et surveille
  `oscar_infra_dns/**`.
- **Redéployé par la chaîne, pas à la main**: passe GitHub `36148114201` verte,
  déploiement Coolify `u1ubd7nrmkhww5xwmqs1hpx2` terminé. La production tourne
  sur `dfcf94e`: `dns.oscar-bot.com` répond 200, `api-dns.oscar-bot.com/v1/health`
  rend `"etat":"pret"`. Même volume de données qu'avant.
- **494 tests verts**, en conteneur (revérifiés par l'orchestrateur sur une
  copie propre du commit). Charte de l'interface respectée. Les deux images se
  construisent.
- **En local**, la composition publie 18100 (API) et 18101 (interface), sur
  `127.0.0.1` seulement, par `compose.override.yaml`; lue par Coolify seule
  (`-f compose.yaml`), elle ne publie aucun port.
- **Un seul `.env.exemple`** (A15): il y en avait deux, l'un contraire au
  catalogue des variables (INC-2026-09-25-11).
- **Un `.dockerignore` en liste blanche** (A16): sans lui, le `.env` et tout le
  dossier seraient partis dans l'image de l'API.
- Les 66 anciennes sauvegardes rangées dans le dépôt ont rejoint `backup/`;
  l'environnement Python `.venv`, installé sur la machine le 24/09, archivé puis
  retiré.
- La notice d'installation sur un serveur neuf, qui faisait cloner un dépôt
  supprimé, est passée en v1.3.

## 5. Le guide commun du cycle (1b)

Dans `oscar-general-gouvernance-project/docs/`, lu par GitHub et par TechDocs
(commits `b57fc21` et `5a46fba`):

| Page | Contenu |
|---|---|
| `README.md` | Commencer ici: OSCAR, les dépôts, le poste (git et Docker), par où commencer |
| `02-le-cycle-pas-a-pas.md` | l'état du cycle au 25/09, les branches, les treize étapes: commande, ce qu'on doit voir, que faire si ça ne va pas |
| `03-comment-se-comporter.md` | onze règles, chacune avec son pourquoi et ses incidents |
| `04-les-environnements.md` | local, test, production; les noms; les variables; les ports |
| `05-la-chaine.md` | les tâches de la chaîne, le contrôle de passage par `test`, le workflow commun |
| `06-le-code-et-l-exploitation.md` | `code/`, `exploitation/`, `secret_root/` |
| `07-surveiller.md` | GitHub, Coolify, Backstage, les rapports du laboratoire |
| `08-les-applications/` | une page par application, même structure |
| `09-glossaire.md` | 31 mots |

**Six schémas**: la vue d'ensemble, le trajet d'une modification, les branches,
la chaîne, les environnements, que faire quand la chaîne est rouge. Leur source
est en Mermaid; une image SVG en est fabriquée dans un conteneur à version
figée. TechDocs ne dessine pas le Mermaid lui-même: l'image SVG s'affiche
partout, sur GitHub comme dans le portail, sans module de plus.

Revérifié par l'orchestrateur: les six images correspondent à leurs sources
(`verifier-schemas`, qui n'écrit rien); la construction TechDocs en mode strict
réussit sans un avertissement; aucun tiret long ni mention d'outil d'IA; le
dépôt est identique à GitHub.

Le guide est honnête sur l'état du cycle: un tableau dit ce qui marche déjà et
ce que les lots suivants apportent.

## 6. Les décisions

**De Joel**: 59 (`code/` pour le développement seulement), 60 (le cycle tourne
sans `code/`), 61 (`exploitation/` non versionné pour l'instant), 62 (une unité,
un dossier; `oscar_infra_dns`, à plat).

**Prises en autonomie**, dans `_pilotage/14-DECISIONS-AUTONOMES.md`, pour que
Joel les relise:

| # | En bref |
|---|---|
| A2 | les applications Coolify s'appellent `<application>-production` et `<application>-test` |
| A3 | un bloc de cent ports par application |
| A7 | `ovhcloud/` est un dossier commun, il n'appartient à aucune application |
| A8 | les tests de l'assistant de déploiement sortent de la chaîne GitHub |
| A9 | le dépôt de pilotage ne suit pas `exploitation/` |
| A13 | la chaîne commune naît au lot 2, avec l'outil DNS |
| A15 | un seul `.env.exemple` pour l'outil DNS |
| A16 | un `.dockerignore` en liste blanche |
| A19 | les PR se fusionnent toujours par un commit de fusion |
| A20 | les pages publiées du guide n'ont pas de version dans leur nom: **écart à la décision 22**, limité à ces pages, pour que les liens ne cassent pas |

## 7. Les incidents du lot

Tous rédigés le jour même dans `oscar-gestion-incidents-and-reports`:

| Incident | Ce qui s'est passé | Statut |
|---|---|---|
| INC-2026-09-25-09 | les outils de toute la plateforme rangés dans le dossier de l'outil DNS, relevé par Joel | résolu à la fin de ce lot |
| INC-2026-09-25-10 | la convention des ports donnait à Coolify des ports qu'il n'utilise pas | résolu avec réserve |
| INC-2026-09-25-11 | un second `.env.exemple` contraire au catalogue, une notice qui clonait un dépôt supprimé | résolu avec réserve |
| INC-2026-09-25-12 | deux fichiers annotés avant d'être sauvegardés; aucune perte, originaux reconstitués | résolu |
| INC-2026-09-25-13 | le plan disait `host.docker.internal` portable sous Linux, sans l'avoir mesuré | résolu avec réserve (macOS et Windows non mesurés) |
| INC-2026-09-25-15 | les images des schémas n'étaient pas reproductibles au début, et le guide disait le contraire | résolu |

## 8. Ce qui est reporté

| Reste | Lot |
|---|---|
| `_pilotage/06-REPRODUIRE-SUR-UN-SERVEUR-NEUF-v1.1.md` montre l'ancienne arborescence: une v1.2 | 5 |
| La notice d'installation de l'outil DNS v1.3, à rejouer sur une machine neuve | 5 |
| La consigne de l'agent de l'outil DNS (`PROMPT-agent-outil-dns`), une v1.2 | 2 |
| `interface/README.md` et un commentaire du `Dockerfile` de l'interface, faux depuis le 24/09 | 2 |
| Un déploiement de l'outil DNS dure environ 13 minutes | 2 |
| Le guide dit ses commandes valables sous macOS et Windows: seul Linux est mesuré | 4 |
| Le tableau « Où en est le cycle » du guide, à tenir à jour | après les lots 2 et 3 |
| MkDocs figé dans l'image du portail, l'extension `LightBox` pour les grands schémas | 4 |
| Versionner `exploitation/` | décision de Joel, plus tard (61) |
