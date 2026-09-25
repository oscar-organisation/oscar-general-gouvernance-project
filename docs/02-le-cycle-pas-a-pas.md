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
Les commandes marchent telles quelles sous Linux, macOS et Windows: ce sont des
commandes git ou Docker.

## Où en est le cycle aujourd'hui

**État au 25 septembre 2026.** Le cycle décrit ici est celui du plan. Toutes
ses pièces ne sont pas encore posées:

| Pièce | État | Lot qui l'apporte |
|---|---|---|
| Les commandes git des étapes 1, 2, 5, 6 | marchent déjà | |
| La branche `test` | **pas encore créée**, dans aucun des trois dépôts | lot 2, puis lots 3 et 4 |
| La chaîne commune, `.github/workflows/chaine.yml` | **pas encore écrite** | lot 2 (outil DNS), puis lots 3 et 4 |
| Le déploiement automatique en test | **pas encore en place** | lots 2, 3, 4 |
| La recette par le laboratoire | **pas encore en place** | lot 3 |
| Le contrôle de passage par `test` | **pas encore en place** | lot 2 |
| Les environnements Coolify `test` et `production` | créés dans les projets `outil-dns`, `labo` et `portail`. Seule l'application `outil-dns-production` existe | lots 2, 3, 4 |

Aujourd'hui, seul l'outil DNS a une chaîne, `.github/workflows/verifications.yml`
dans `oscar-infrastructure`. Elle vérifie chaque PR vers `main` et chaque envoi
sur `main`, et déploie en production après un envoi sur `main`. Elle sera
remplacée par la chaîne commune au lot 2.

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
`test` n'existe pas encore dans ce dépôt. C'est le cas des trois dépôts au 25
septembre 2026: elle arrive au lot 2 pour l'outil DNS, puis aux lots 3 et 4.

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

**État au 25 septembre 2026**: le lancement du laboratoire en conteneur, par
`docker compose run`, et sa façon de viser une application locale arrivent au
lot 3. Les commandes de test en conteneur de chaque application arrivent avec
son lot (2, 3 ou 4). En attendant, voir la page de l'application.

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

**État au 25 septembre 2026**: pas encore en place. Il arrive pour l'outil DNS
au lot 2, le laboratoire au lot 3, le portail au lot 4.

## Étape 10. La recette par le laboratoire

Après le déploiement en test, la tâche `recette` joue **tous** les scénarios du
laboratoire qui concernent l'application, contre `https://test-<nom>.oscar-bot.com`.

**Ce qu'on doit voir**: la tâche `recette` verte, et le rapport de la passe dans
le visualiseur du laboratoire, `https://test-labo.oscar-bot.com`.

**Si ça ne va pas**: le changement est en test, mais il n'est pas validé. On ne
va pas plus loin: on corrige par une nouvelle branche `travail/<sujet>`, qui
refait les étapes 2 à 10.

**État au 25 septembre 2026**: pas encore en place, lot 3.

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
par `test`: le contenu de ce commit doit être exactement celui d'un commit de
`test` déployé avec succès en test. Elle déploie ensuite
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

**État au 25 septembre 2026**: le contrôle n'existe pas encore (lot 2). La
chaîne actuelle de l'outil DNS déploie en production après ses vérifications,
sans passer par un test.

## Étape 13. Vérifier que le site est vivant

```
docker run --rm curlimages/curl:8.22.0 -fsSL -o /dev/null -w "%{http_code}\n" https://<nom>.oscar-bot.com
```

Cette commande appelle le site depuis un conteneur jetable et affiche le code
de la réponse. Une application qui a une route de santé se vérifie aussi par
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
git push -u origin travail/annuler-<sujet>
```

`<commit de fusion>` est le commit créé par la fusion de la PR, visible sur la
PR elle-même. On ouvre ensuite une PR vers `test`, comme à l'étape 6.

Remettre en service une version précédente sans passer par le cycle est une
procédure d'exploitation, écrite pour chaque application dans `exploitation/`
(voir [le code et l'exploitation](06-le-code-et-l-exploitation.md)). Elle n'est
pas entre les mains du développeur.
