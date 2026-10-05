# Un workflow par sous-projet

Un dépôt peut porter plusieurs sous-projets: `oscar-general-gouvernance-project`
porte le portail et ce guide, `oscar-console-admin` l'API et l'interface de la
console. Depuis le 5 octobre 2026 (décisions 124 et 125), **chaque sous-projet
a son propre workflow**, et un envoi ne lance que les workflows des
sous-projets qu'il modifie.

Deux mots, pour cette page:

- un **workflow** est un fichier du dossier `.github/workflows/` du dépôt: il
  dit quand GitHub lance des vérifications automatiques, et lesquelles;
- un **sous-projet** est une partie du dépôt rangée dans son dossier, avec son
  workflow: une application (le portail), un outil (l'outil de déploiement) ou
  ce guide.

Pourquoi:

- un envoi qui ne touche que le guide ne vérifie ni ne remet en ligne le
  portail: chaque sous-projet n'est vérifié que quand il change;
- le workflow d'un sous-projet se modifie seul, sans toucher aux autres;
- un sous-projet pourra un jour partir dans son propre dépôt sans rien
  réécrire ([plus bas](#detacher-un-jour-un-sous-projet-dans-son-propre-depot)).

Ce que fait chaque workflow, tâche par tâche (vérifications rapides, tests,
construction, mise en ligne, résumé), est dans
[les vérifications automatiques](05-les-verifications-automatiques.md). Cette
page dit lequel se lance, et quand.

## Ce qui lance un workflow

| Fichier de `.github/workflows/` | Ce qui le lance | Ce qu'il fait |
|---|---|---|
| le workflow d'un sous-projet, au nom de l'application (par exemple `portail.yml`) | une PR vers `test` ou `main`, ou un envoi sur `test` ou `main`, **qui modifie le dossier du sous-projet ou ce fichier-ci**; et la relance à la main | les vérifications et les tests du sous-projet, sa mise en ligne s'il est déployé, son résumé |
| `verifications-communes.yml`, « Vérifications communes » | **chaque** PR vers `test` ou `main` et **chaque** envoi sur `test` ou `main`, quel que soit le fichier modifié | ce qui vaut pour tout le dépôt: aucune ligne d'attribution dans les commits (décision A18), aucun secret, chaque `.env` avec son modèle `.env.exemple`, la typographie, les fichiers des workflows valides, une seule machine de GitHub, nommée par sa version (décision A38). Il ne met rien en ligne |
| `deploiement-par-image-harbor.yml`, le déploiement automatique commun, dans le dépôt `oscar-infrastructure` | jamais seul: le workflow d'un sous-projet déployé l'appelle | construire l'image, la ranger dans Harbor, la mettre en ligne |

**Tout le dossier du sous-projet compte**, sa documentation comprise: une
correction d'un `.md` du dossier lance son workflow, parce que sa
documentation y est vérifiée. Rien n'est reconstruit pour autant: l'empreinte
du contenu ignore la documentation, et à la fusion le déploiement dit « déjà
en ligne ». Dans `oscar-general-gouvernance-project`, les pages `.md` de
`docs/` sont le guide lui-même: elles lancent le workflow « Guide ».

**Un fichier qui n'appartient à aucun sous-projet** (le `LISEZ-MOI.md` de la
racine, `catalog-info.yaml`, `.gitignore`) ne lance que les vérifications
communes.

**Dans la PR**, chaque workflow lancé apparaît dans la liste des vérifications
et écrit **son propre commentaire de résumé**, titré par son nom
(« Vérifications communes: le résumé », « Portail: le résumé »...), qu'il met
à jour à chaque nouvel envoi. Un workflow que la PR ne lance pas n'y apparaît
pas du tout: ce n'est ni un échec ni un oubli.

**Pour une PR, GitHub regarde tout ce qu'elle change**, pas seulement le
dernier envoi: une fois qu'une PR touche le portail, chaque nouvel envoi sur
elle relance le workflow du portail. Pour la PR de `test` vers `main`, ce sont
donc les sous-projets modifiés sur `test` depuis la dernière fusion dans
`main`. Pour un envoi, et donc pour une fusion, ce sont les fichiers que cet
envoi change.

## Les workflows des trois dépôts

| Dépôt | Fichier | Nom affiché par GitHub | Ce qui le lance, en plus de son propre fichier |
|---|---|---|---|
| `oscar-general-gouvernance-project` | `verifications-communes.yml` | Vérifications communes | tout envoi, toute PR |
| | `portail.yml` | Portail | `oscar_backstage/` |
| | `guide.yml` | Guide | `docs/` et `mkdocs.yml`, ce que la construction du guide lit |
| `oscar-console-admin` | `verifications-communes.yml` | Vérifications communes | tout envoi, toute PR |
| | `console-admin-api.yml` | API de la console | `oscar_console_admin_api_backend/` |
| | `console-admin-interface.yml` | Interface de la console | `oscar_console_admin_frontend/` |
| `oscar-infrastructure` | `verifications-communes.yml` | Vérifications communes | tout envoi, toute PR |
| | `outil-dns.yml` | Outil DNS | `oscar_infra_dns/`, et le déploiement automatique commun: l'outil DNS est le seul à le faire tourner en vrai sur `test` avant `main` |
| | `outil-de-deploiement.yml` | Outil de déploiement | `oscar_infra_deploiement/` |
| | `actions-communes.yml` | Actions communes | `.github/actions/`, le déploiement automatique commun, et `outil-dns.yml`, que ses tests lisent |
| | `deploiement-par-image-harbor.yml` | Déploiement par image de Harbor (commun) | jamais seul: le déploiement automatique commun, appelé par les autres workflows |

Les dépôts `oscar-test` (le laboratoire) et
`oscar-gestion-incidents-and-reports` n'ont qu'un sous-projet: ils gardent leur
seul fichier, `verifications-automatiques.yml`, lancé à chaque fois, avec un
seul résumé.

**Un dossier sans workflow propre** n'est vérifié que par les vérifications
communes. Dans `oscar-infrastructure`, Harbor, le serveur temps réel et le
réseau privé n'ont pas encore de tests dans GitHub: ceux des deux derniers
exigent la machine (un serveur STUN, le module WireGuard du noyau) et se
lancent à la main, depuis leur dossier; les ajouter est une suite à part. Dans
`oscar-console-admin`, la configuration Keycloak, les anciens scripts et les
exemples vides n'ont rien à vérifier aujourd'hui.

## Quand un envoi modifie plusieurs sous-projets

Un envoi, une PR ou une fusion qui modifie deux, trois ou cinq sous-projets du
même dépôt:

- **un workflow par sous-projet modifié, tous en même temps**, plus les
  vérifications communes. Deux sous-projets modifiés: trois exécutions côte à
  côte; cinq: six;
- **chacun réussit ou échoue pour lui-même**. Un test en échec dans l'API de la
  console arrête l'API, pas l'interface, qui est vérifiée, construite et mise
  en ligne si tout va bien chez elle. La PR, elle, s'affiche en échec dès
  qu'un seul workflow l'est, et on ne la fusionne pas. Les vérifications
  communes non plus n'arrêtent pas un sous-projet: en échec après une
  fusion, elles ne retiennent pas sa mise en ligne (décision A49); c'est à la
  PR qu'elles se lisent;
- **une mise en ligne par sous-projet**, chacune sur sa propre application
  Coolify. La règle d'un seul déploiement à la fois sur la machine reste:
  chaque mise en ligne attend que Coolify n'ait plus de déploiement en cours
  avant de demander la sienne. Si deux d'entre elles regardent au même
  instant, Coolify reçoit les deux demandes, et chacune est suivie jusqu'au
  bout (lu dans le code du déploiement commun, pas encore observé au
  05/10/2026). Coolify ne construit plus rien, il télécharge l'image et la
  lance: deux mises en ligne ensemble ne chargent pas la machine;
- **un sous-projet non modifié n'est ni vérifié ni remis en ligne**: son
  workflow ne se lance pas du tout;
- au plan gratuit, GitHub fait tourner au plus 20 tâches en même temps pour
  toute l'organisation: au-delà, les tâches attendent leur tour, et rien
  n'échoue pour autant.

Quelques cas, pour fixer les idées:

| Dépôt | Ce que l'envoi modifie | Ce qui se lance |
|---|---|---|
| `oscar-console-admin` | l'interface seule | Vérifications communes, Interface de la console |
| `oscar-console-admin` | l'API et l'interface | Vérifications communes, API de la console et Interface de la console, en même temps |
| `oscar-console-admin` | la documentation de l'API seule | Vérifications communes, API de la console; à la fusion, la mise en ligne dit « déjà en ligne » |
| `oscar-console-admin` | le `LISEZ-MOI.md` de la racine | Vérifications communes seulement |
| `oscar-general-gouvernance-project` | une page du guide | Vérifications communes, Guide |
| `oscar-infrastructure` | l'outil DNS seul | Vérifications communes, Outil DNS |

Le tableau de [ce qui se passe à chaque évènement](05-les-verifications-automatiques.md#ce-qui-se-passe-a-chaque-evenement)
vaut pour chaque sous-projet, séparément.

## Les sous-projets liés restent indépendants

Deux sous-projets qui se parlent, comme l'interface de la console qui appelle
son API, ont chacun leur workflow, **sans ordre entre eux** (décision 125):
modifiés ensemble, ils partent ensemble, et l'un peut être en ligne quelques
minutes avant l'autre. Avant le découpage, l'interface attendait la mise en
ligne de l'API; ce lien a disparu.

D'où une règle de développement: **une API reste compatible avec l'interface
déjà en ligne**. On ajoute d'abord, on retire plus tard:

1. l'API ajoute la nouvelle route ou le nouveau champ, et garde l'ancien;
2. l'interface passe au nouveau, dans le même envoi ou dans un suivant;
3. une fois l'interface en production, une modification suivante retire
   l'ancien de l'API.

Dans n'importe quel ordre de mise en ligne, l'interface en service trouve
ainsi toujours ce qu'elle appelle. Le `LISEZ-MOI.md` de la console le rappelle.

## Modifier le workflow d'un seul sous-projet

On modifie **son fichier, et lui seul**: `.github/workflows/<son nom>.yml`. Le
dossier du sous-projet n'y est écrit qu'en tête: la variable `DOSSIER`, que
toutes les étapes lisent, et, répétés parce que GitHub n'accepte pas de
variable à ces endroits, le filtre de chemins (`paths`) et l'entrée `dossier`
du déploiement. Le commentaire en tête du fichier dit ce qu'il vérifie, quand
il se lance et pourquoi.

La PR qui le modifie lance ce workflow (son propre fichier est dans son
filtre) et les vérifications communes, qui relisent tous les fichiers des
workflows. Les autres sous-projets ne se lancent pas: rien d'eux n'a changé.

Ce qui touche plusieurs fichiers à la fois:

- **changer la machine de GitHub** (`runs-on: ubuntu-24.04`): toutes les tâches
  de tous les workflows du dépôt nomment la même; on la change partout, dans
  une PR à part (décision A38);
- **une règle qui vaut pour tout le dépôt** se change dans
  `verifications-communes.yml`, pas dans le workflow d'un sous-projet;
- **le déploiement automatique commun**, partagé par tous les dépôts, se change
  dans le dépôt `oscar-infrastructure`, selon son `.github/LISEZ-MOI.md`.

## Relancer un sous-projet à la main

Le workflow d'un sous-projet se relance sans rien envoyer:

1. ouvrir la page Actions du dépôt,
   `https://github.com/oscar-organisation/<dépôt>/actions`;
2. choisir le workflow dans la liste de gauche, par exemple « Portail »;
3. cliquer sur « Run workflow », choisir la branche `test` ou `main`, puis
   « Run workflow ».

En ligne de commande, la même chose: `gh workflow run portail.yml --ref test`.

La relance vaut un envoi sur cette branche, à son dernier commit: mêmes
vérifications, mêmes refus. Sur `test`, l'image qui manque est construite et
mise en ligne en test; sur `main`, l'image testée est retrouvée et mise en
ligne en production, ou refusée si elle n'est pas passée par le test. Si
l'application est déjà en ligne avec cette image, et saine, rien n'est remis
en ligne. Sur une autre branche, la relance ne met rien en ligne.

**Quand s'en servir**: une mise en ligne a échoué pour une raison extérieure
au code (réseau, Harbor, Coolify), et aucun envoi suivant ne touche ce
sous-projet, donc aucun ne la refera. Sans relance, `test` garderait
l'ancienne version, et la PR de `test` vers `main` serait refusée, faute
d'image mise en ligne en test.

« Re-run failed jobs », sur la page d'une exécution, rejoue cette exécution-là,
à son commit: c'est le plus simple tant que la branche n'a reçu aucun autre
envoi depuis; sinon, on relance par « Run workflow ».

Le bouton « Run workflow » n'apparaît que pour un workflow présent sur `main`,
la branche par défaut du dépôt: c'est une règle de GitHub.

## Détacher un jour un sous-projet dans son propre dépôt

Tout est rangé pour que ce soit un déménagement, sans rien réécrire. Pour un
sous-projet déployé, par exemple le portail:

1. **Son dossier**, `oscar_backstage/`, devient la racine du nouveau dépôt: son
   contenu y est déplacé tel quel.
2. **Son workflow**, `.github/workflows/portail.yml`, part dans le
   `.github/workflows/` du nouveau dépôt. Son dossier y devient `.`: la
   variable `DOSSIER` et l'entrée `dossier` du déploiement valent `.`, et le
   filtre de chemins disparaît, puisque tout le dépôt est le sous-projet. Le
   déploiement automatique commun accepte une application à la racine de son
   dépôt; l'empreinte prend alors tous les fichiers du dépôt: on ajoute
   `.github/` à l'entrée `ignorer`, pour qu'une modification d'un workflow ne
   reconstruise rien.
3. **Les vérifications communes**: on recopie `verifications-communes.yml` dans
   le nouveau dépôt.
4. **Les environnements et les secrets de GitHub** sont propres à chaque dépôt:
   on les recrée dans le nouveau, sous les mêmes noms (pour le portail,
   `portail-test` et `portail-production` avec leur variable
   `COOLIFY_APPLICATION`; les secrets `COOLIFY_JETON`,
   `HARBOR_COMPTE_ENVOI_NOM` et `HARBOR_COMPTE_ENVOI_SECRET`).
5. **Ses descriptions Coolify** nomment le dépôt et le dossier: on les change
   dans le dépôt `oscar-infrastructure`, dossier
   `oscar_infra_deploiement/descriptions/`, puis on les repose dans Coolify par
   l'assistant de déploiement (`--appliquer`), depuis la copie de service.
6. **Ses fiches**: le nom du dépôt est écrit dans son `catalog-info.yaml` et
   son `mkdocs.yml`; on le change, et on retire le renvoi vers sa fiche du
   `catalog-info.yaml` de la racine de l'ancien dépôt. Le portail trouve seul
   la fiche à la racine du nouveau dépôt.

**L'image déjà rangée dans Harbor est retrouvée.** L'empreinte du contenu se
calcule sur les fichiers du dossier, sans le nom du dossier: le même contenu, à
la racine du nouveau dépôt, donne la même étiquette `contenu-...` (mesuré le
05/10/2026 avec l'outil DNS: `contenu-9438e947dc23` dans les deux cas). Rien
n'est reconstruit, et si Coolify sert déjà cette image, rien n'est remis en
ligne. Le nom des images ne change pas.

Le contrat du déploiement commun (ses entrées, `dossier: .`, la relance à la
main, le résumé par workflow, les environnements et les secrets à poser) est
écrit une seule fois, dans le dépôt `oscar-infrastructure`, fichier
`.github/LISEZ-MOI.md`. Cette page n'en recopie rien.
