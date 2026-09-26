# Le cycle pas à pas

Le chemin d'une modification, du poste du développeur jusqu'à la production. Il
est le même pour toutes les applications, et **il n'a pas de raccourci**: une
correction urgente le suit aussi.

![Le trajet d'une modification, du poste jusqu'à la production, en diagramme de séquence](schemas/02-trajet-d-une-modification.svg)

En mots: on travaille sur une branche `travail/<sujet>`, partie de `test`. On
ouvre une PR vers `test`; la chaîne vérifie. À la fusion, la chaîne déploie en
test et y joue les scénarios du laboratoire. On ouvre ensuite une PR de `test`
vers `main`; à sa fusion, la chaîne déploie en production, en signalant tout
contenu qui ne serait pas passé par le test.

Source du schéma: [`schemas/02-trajet-d-une-modification.mmd`](schemas/02-trajet-d-une-modification.mmd).

## Comment lire les commandes

Ce qui est entre `<` et `>` est à remplacer, sans les chevrons:

| Dans la commande | À remplacer par | Exemple |
|---|---|---|
| `<dépôt>` | le nom du dépôt | `oscar-infrastructure` |
| `<sujet>` | un nom court pour son travail, en minuscules, avec des tirets, sans accent | `ajouter-champ-ttl` |
| `<nom>` | le nom de l'application dans son adresse | `dns` |
| `<application>` | le nom de l'application dans Coolify | `outil-dns` |

Les noms de chaque application sont sur [sa page](08-les-applications/README.md).
Les commandes sont des commandes git ou Docker, écrites pour être les mêmes sur
tous les systèmes. Elles ont été éprouvées **sous Linux seulement** (Ubuntu
26.04, Docker Engine 29.8 et son module compose 5.5, git 2.53), le 25 septembre
2026. Sous macOS et Windows, avec Docker Desktop: **non vérifié**. Qui les
essaie sous l'un d'eux et trouve un écart le signale, pour que ce guide le
dise.

## Où en est le cycle aujourd'hui

**État au 26 septembre 2026, 02h38 UTC**, relevé à cette heure-là par l'API de
Coolify, l'API de GitHub et une requête à chaque site. C'est **le seul tableau
d'état du guide**: les autres pages y renvoient au lieu de le recopier, pour
qu'il ne se contredise jamais. Il se met à jour à chaque livraison, relevé et
non de mémoire.

| Pièce | Outil DNS | Laboratoire | Portail |
|---|---|---|---|
| La branche `test` | en place | en place | en place |
| La chaîne, `.github/workflows/chaine.yml` | sur `test` et `main` | sur `test` et `main` | sur `test`; sur `main` à la promotion de `test` (lot 4) |
| Les applications Coolify | `outil-dns-test`, `outil-dns-production`, en service | `labo-test`, `labo-production`, en service | `portail-test` en service; `portail-production` créée, pas encore déployée |
| Le déploiement par la chaîne en test | en place (dernier déclaré: `f2ddfcd`) | en place (dernier déclaré: `6e59377`, un déploiement en cours au relevé) | en place (dernier déclaré: `f7271e3`) |
| Le déploiement par la chaîne en production, avec le contrôle de passage par `test` | en place (dernier déclaré: `fc9f669`) | en place (dernier déclaré: `c0f21cd`) | à la promotion de `test` vers `main` (lot 4) |
| La recette par le laboratoire, après chaque déploiement | en place, verte à la dernière passe de production | en place, verte à la dernière passe de production | pas branchée: le laboratoire n'a pas encore de scénario du portail |
| Les sites | `test-dns`, `dns` répondent | `labo` répond `401` sans identifiants; `test-labo` se déployait | `test-tech` répond, connexion par GitHub; `tech` répond `503` |

Le déploiement et le contrôle de passage par `test` sont écrits **une fois**,
dans le workflow commun du dépôt `oscar-infrastructure`
(`.github/workflows/deployer.yml`), que chaque chaîne appelle (lot 2). Les
commandes git des étapes 1, 2, 5 et 6 marchent dans les trois dépôts.

## Les branches

![Les branches travail/*, test et main, et les fusions de l'une à l'autre](schemas/03-les-branches.svg)

- **`main`** porte la production. On n'y envoie jamais rien directement.
- **`test`** porte l'environnement de test. On n'y envoie jamais rien
  directement non plus: tout y arrive par une PR.
- **`travail/<sujet>`** est la branche de travail d'une personne, pour un
  sujet. Elle part de `test` et y revient par une PR.

Sur le schéma, `travail/ajouter-champ` a été fusionnée dans `test`, déployée
en test, puis passée en production par la PR de `test` vers `main`.
`travail/corriger-lien`, partie du `test` à jour, est encore en cours.

Un sujet, une branche. Deux sujets sans rapport font deux branches et deux PR:
elles se vérifient, se fusionnent et s'annulent séparément.

Source du schéma: [`schemas/03-les-branches.mmd`](schemas/03-les-branches.mmd).

## Étape 1. Cloner le dépôt

```
git clone https://github.com/oscar-organisation/<dépôt>.git
cd <dépôt>
```

**Ce qu'on doit voir**: un dossier `<dépôt>`, avec un `LISEZ-MOI.md` à sa
racine.

**Si ça ne va pas**:

- `Repository not found`: le compte GitHub n'a pas accès à l'organisation, ou
  le nom du dépôt est mal écrit. Les noms sont dans [Commencer ici](README.md), partie « Les dépôts ».
- GitHub demande un mot de passe: il attend un jeton personnel, pas le mot de
  passe du compte. On le crée sur GitHub, dans Settings, Developer settings,
  Personal access tokens.

On ne clone qu'une fois. Pour un nouveau sujet, on reprend à l'étape 2.

## Étape 2. Créer sa branche depuis `test`

```
git fetch origin
git switch --no-track -c travail/<sujet> origin/test
```

`git fetch` ramène l'état de GitHub. La branche part donc du `test` du moment,
pas d'une copie ancienne. `--no-track` évite qu'un `git push` sans argument
parte un jour vers `test`.

**Ce qu'on doit voir**: `Switched to a new branch 'travail/<sujet>'`.

**Si ça ne va pas**: `invalid reference: origin/test` veut dire que la branche
`test` n'existe pas dans ce dépôt. Elle existe dans les trois dépôts du cycle
depuis le 25 septembre 2026; ailleurs, le dépôt ne suit pas encore le cycle.

## Étape 3. Lancer l'application en local

Dans le dossier de l'application, donné par [sa page](08-les-applications/README.md):

```
docker compose up --build -d
docker compose ps
```

`--build` reconstruit les images avec le code du moment. `-d` rend la main au
terminal pendant que l'application tourne.

**Ce qu'on doit voir**: après quelques dizaines de secondes, chaque service est
`Up` et `(healthy)` dans la colonne `STATUS` de `docker compose ps`. La colonne
`PORTS` montre des ports publiés sur `127.0.0.1`, dans le bloc de l'application
(voir [les ports locaux](04-les-environnements.md#les-ports-locaux)).
L'application s'ouvre à l'adresse donnée sur sa page.

Pour la vérifier sans navigateur, depuis un conteneur jetable, par sa route
de santé si elle en a une (sa page la donne):

```
docker run --rm --network host curlimages/curl:8.22.0 -fsS http://127.0.0.1:<port>/<route de santé>
```

**Sous Linux, `--network host` est nécessaire**: sans lui, le conteneur a sa
propre adresse `127.0.0.1`, et répond `Could not connect to server` (mesuré le
26 septembre 2026). Sous macOS et Windows: non vérifié.

**Si ça ne va pas**:

- `docker compose logs <service>` montre ce que le service a écrit. Le nom des
  services est dans la colonne `SERVICE` de `docker compose ps`.
- `port is already allocated`: un autre programme tient déjà ce port. `docker
  compose ls` liste les applications lancées par Docker; on arrête celle qui
  gêne, dans son dossier, par `docker compose down`.

Pour arrêter l'application: `docker compose down`. **Jamais `docker compose
down -v`** sans savoir ce qu'on fait: `-v` efface les volumes, donc les
données.

## Étape 4. Tester en local

Deux sortes de tests, dans cet ordre:

1. **Les tests de l'application**, propres à elle. La commande est sur sa page.
   Ils tournent en conteneur, comme tout le reste.
2. **Le laboratoire**, qui rejoue les parcours dans un vrai navigateur, contre
   l'application lancée à l'étape 3. Le laboratoire tourne lui aussi en
   conteneur, depuis le dépôt `oscar-test`.

**Ce qu'on doit voir**: tout vert. On n'envoie rien de rouge.

Les commandes de test de chaque application sont sur sa page. Pour le
laboratoire contre l'application lancée sur le poste:

```
docker compose run --rm labo lancer --niveau local --app <application>
```

depuis le dossier `oscar_labo_test_application/` du dépôt `oscar-test`. **Sous
Linux**, `host.docker.internal` seul ne joint pas un port publié sur
`127.0.0.1`: on ajoute, dans le terminal, `export LABO_MODE_RESEAU=host
LABO_HOTE_LOCAL=127.0.0.1` avant la commande (incident `INC-2026-09-25-13`).
Sous macOS et Windows: non vérifié. Le détail est dans le guide du laboratoire,
[`oscar_labo_test_application/README.md`](https://github.com/oscar-organisation/oscar-test/blob/main/oscar_labo_test_application/README.md),
partie « Le niveau local sous Linux », et sur [sa page](08-les-applications/laboratoire.md).

## Étape 5. Enregistrer et pousser

```
git status
git add <fichiers>
git commit -m "<message>"
git push -u origin travail/<sujet>
```

`git status` montre ce qui a changé: on vérifie qu'aucun fichier ne part par
erreur. Le message dit ce que fait le changement, en français, en commençant
par un verbe: « Ajouter le champ TTL au formulaire ». Voir
[les messages de commit](03-comment-se-comporter.md#6-des-messages-de-commit-clairs).

`-u` n'est utile qu'au premier envoi: il relie la branche locale à celle de
GitHub. Les fois suivantes, `git push` suffit.

**Ce qu'on doit voir**: GitHub répond par une ligne
`remote: Create a pull request for 'travail/<sujet>' on GitHub by visiting:`,
suivie d'une adresse.

**Si ça ne va pas**: `Updates were rejected` veut dire que la branche a reçu
sur GitHub des commits qu'on n'a pas en local. `git pull`, puis `git push`.

## Étape 6. Ouvrir la PR vers `test`

Une PR (pull request, demande de fusion) propose de fusionner sa branche dans
une autre. On l'ouvre sur GitHub, à cette adresse:

```
https://github.com/oscar-organisation/<dépôt>/compare/test...travail/<sujet>?expand=1
```

On y écrit un titre, qui dit ce que fait le changement, et une description:
pourquoi ce changement, et comment on l'a testé.

**Ce qu'on doit voir**: en haut de la page, `base: test` et
`compare: travail/<sujet>`. Après création, la PR montre la liste des
vérifications de la chaîne, qui tournent.

**Si ça ne va pas**:

- `base: main`: c'est la branche que GitHub propose par défaut. On choisit
  `test`. Une PR de travail vers `main` ne se fusionne jamais.
- `There isn't anything to compare`: la branche n'a pas été poussée, ou elle
  n'a aucun commit de plus que `test`.

## Étape 7. La chaîne vérifie la PR

La chaîne lance ses tâches `controles`, puis `verifs`. Rien n'est déployé à ce
stade. Le détail des tâches: [la chaîne](05-la-chaine.md).

**Ce qu'on doit voir**: sur la PR, chaque vérification passe au vert. Le détail
est dans l'onglet Actions du dépôt:
`https://github.com/oscar-organisation/<dépôt>/actions`.

**Si ça ne va pas**: une vérification rouge. On clique sur « Details » à côté
d'elle, on lit le premier message d'erreur, on corrige sur la même branche et
on pousse: la chaîne repart seule. Voir
[comment se comporter](03-comment-se-comporter.md), règle 7, « Quand la chaîne est rouge ».

## Étape 8. Fusionner dans `test`

Quand la chaîne est verte, on fusionne la PR par le bouton « Merge pull
request », en choisissant **« Create a merge commit »**. Puis on supprime la
branche sur GitHub par le bouton « Delete branch ».

Pourquoi « Create a merge commit », et jamais « Squash » ni « Rebase »: ces
deux-là fabriquent sur la branche d'arrivée des commits qui n'existent pas sur
la branche de départ. Les PR suivantes affichent alors des changements déjà
fusionnés, et deviennent confuses.

**Ce qu'on doit voir**: la PR passe à l'état `Merged`, et une nouvelle passe de
la chaîne démarre sur la branche `test`, dans l'onglet Actions.

## Étape 9. Le déploiement automatique en test

Sur la branche `test`, la chaîne refait `controles` et `verifs`, puis lance
`deploiement`. Cette tâche demande à Coolify de déployer l'application
`<application>-test`, suit ce déploiement jusqu'au bout, et vérifie que le
commit déployé est bien celui qui a été vérifié. Personne ne déploie à la main.

**Ce qu'on doit voir**:

- dans l'onglet Actions, la passe de `test` verte, tâche `deploiement` comprise;
- dans la page Deployments du dépôt,
  `https://github.com/oscar-organisation/<dépôt>/deployments`, l'environnement
  `test` au dernier commit de `test`;
- dans Coolify, projet `<application>`, environnement `test`, un déploiement
  terminé;
- le site `https://test-<nom>.oscar-bot.com` qui répond.

**Si ça ne va pas**: le journal de la tâche `deploiement` dans l'onglet Actions
donne la réponse de Coolify. Le journal de construction est dans Coolify, sur
le déploiement concerné.

Où c'est en place: le tableau d'[où en est le cycle](#ou-en-est-le-cycle-aujourdhui), au début de cette page.

## Étape 10. La recette par le laboratoire

Après le déploiement en test, la tâche `recette` joue **tous** les scénarios du
laboratoire qui concernent l'application, contre `https://test-<nom>.oscar-bot.com`.

**Ce qu'on doit voir**: la tâche `recette` verte, et le rapport de la passe dans
le visualiseur du laboratoire, `https://test-labo.oscar-bot.com`.

**Si ça ne va pas**: le changement est en test, mais il n'est pas validé. On ne
va pas plus loin: on corrige par une nouvelle branche `travail/<sujet>`, qui
refait les étapes 2 à 10.

Où la recette est branchée: le tableau d'[où en est le cycle](#ou-en-est-le-cycle-aujourdhui).

## Étape 11. La PR de `test` vers `main`

Quand le déploiement en test et sa recette sont verts, on propose de passer ce
contenu en production:

```
https://github.com/oscar-organisation/<dépôt>/compare/main...test?expand=1
```

**Ce qu'on doit voir**: `base: main` et `compare: test`. La chaîne vérifie la PR,
comme à l'étape 7. On fusionne ensuite par **« Create a merge commit »**. On ne
supprime jamais la branche `test`.

## Étape 12. Le déploiement automatique en production

Sur `main`, la chaîne refait `controles` et `verifs`, puis contrôle le passage
par `test`: le contenu à déployer de ce commit doit être exactement celui que
Coolify sert en test, c'est-à-dire celui de son dernier déploiement terminé en
test. Elle déploie ensuite
`<application>-production`, et joue les scénarios non destructifs du
laboratoire contre `https://<nom>.oscar-bot.com`.

**Ce qu'on doit voir**: la passe de `main` verte dans l'onglet Actions,
**aucun avertissement** du contrôle de passage par `test` dans le résumé de la
passe, l'environnement `production` au nouveau commit dans la page Deployments,
et le déploiement terminé dans Coolify, environnement `production`.

**Si ça ne va pas**: le résumé signale que le contenu n'est pas passé par
`test`. Quelqu'un a envoyé directement sur `main`, ou le déploiement en test
avait échoué. Ce contrôle ne bloque pas: la production a quand même été
déployée. On prévient Joel, et on rédige l'incident. Voir
[comment se comporter](03-comment-se-comporter.md), règles 1 et 7.

Le contrôle est écrit une fois, dans le workflow commun (lot 2), pour toute
application dont la chaîne l'appelle. Où il a déjà servi: le tableau
d'[où en est le cycle](#ou-en-est-le-cycle-aujourdhui).

## Étape 13. Vérifier que le site est vivant

```
docker run --rm curlimages/curl:8.22.0 -fsSL -o /dev/null -w "%{http_code}\n" https://<nom>.oscar-bot.com
```

Cette commande appelle le site depuis un conteneur jetable et affiche le code
de la réponse. Pour une application lancée sur le poste, voir l'étape 3: sous
Linux, le conteneur a besoin de `--network host` pour joindre `127.0.0.1`. Une application qui a une route de santé se vérifie aussi par
elle; sa page donne la commande.

**Ce qu'on doit voir**: `200`.

Puis on vérifie que c'est la bonne version. Le commit de production affiché
dans la page Deployments du dépôt doit être celui de `main`:

```
git fetch origin
git rev-parse --short origin/main
```

**Si ça ne va pas**:

- `TLS connect error` et `unrecognized name`: le proxy du serveur ne connaît
  pas ce nom, rien n'y est déployé. Mesuré le 25 septembre 2026 sur
  `test-dns.oscar-bot.com`, qui n'a pas encore d'application.
- `503`: le proxy connaît le nom, mais l'application ne répond pas. Regarder
  son état dans Coolify.

## Tenir sa branche à jour

Si `test` a avancé pendant qu'on travaillait:

```
git fetch origin
git merge origin/test
```

En cas de conflit, git nomme les fichiers en cause. On les corrige, puis
`git add <fichiers>` et `git commit`. Jamais de `git push --force` sur `test`
ou sur `main`.

## Annuler une modification déjà fusionnée

On ne réécrit pas l'histoire de `test` ni de `main`. On ajoute un commit qui
défait le changement, par le même cycle:

```
git fetch origin
git switch --no-track -c travail/annuler-<sujet> origin/test
git revert -m 1 <commit de fusion>
git commit --amend -m "Annuler <ce que faisait la fusion>, parce que <pourquoi>"
git push -u origin travail/annuler-<sujet>
```

`<commit de fusion>` est le commit créé par la fusion de la PR, visible sur la
PR elle-même. `git revert` propose un message en anglais, « Revert "..." »:
`git commit --amend` le remplace par un message en français, qui dit ce qu'on
annule et pourquoi (règle des [messages de commit](03-comment-se-comporter.md#6-des-messages-de-commit-clairs)).
On ouvre ensuite une PR vers `test`, comme à l'étape 6.

Remettre en service une version précédente sans passer par le cycle est une
procédure d'exploitation, écrite pour chaque application dans `exploitation/`
(voir [le code et l'exploitation](06-le-code-et-l-exploitation.md)), dans le
fichier `procedures/revenir-en-arriere.md` du dossier de l'application. Elle
n'est pas entre les mains du développeur.
