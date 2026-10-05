# Les applications

Quatre applications suivent aujourd'hui le cycle de ce guide. Chacune a sa page,
avec **la même structure**, pour qu'on trouve la même information au même
endroit, quelle que soit l'application.

| Application | Page | Dépôt |
|---|---|---|
| Outil DNS | [outil-dns.md](outil-dns.md) | `oscar-infrastructure` |
| Laboratoire de tests | [laboratoire.md](laboratoire.md) | `oscar-test` |
| Portail Backstage | [portail-backstage.md](portail-backstage.md) | `oscar-general-gouvernance-project` |
| Console d'administration | [console-admin.md](console-admin.md) | `oscar-console-admin` |

Les noms, les adresses et les projets Coolify des quatre sont réunis dans
[les environnements](../04-les-environnements.md).

## La structure d'une page d'application

| Partie | Ce qu'elle dit |
|---|---|
| En bref | ce que fait l'application, son dépôt, son dossier, ses adresses |
| Lancer en local | le dossier, la commande, les ports, ce qu'on doit voir |
| Tester en local | les tests de l'application, et le laboratoire contre elle |
| Les vérifications automatiques | leur fichier, et ce qu'elles contrôlent de propre à l'application |
| Le déploiement | le projet et les applications Coolify, la route de santé |
| Surveiller | les liens directs |
| Ce qui reste à faire | ce que le plan apporte encore, et à quel lot |

Chaque page ne dit que ce qui est vrai à sa date, ou prévu par le plan. Ce qui
n'existe pas encore est marqué « à compléter », avec le lot qui l'apporte. Une
commande qui n'existe pas encore n'est pas écrite.

## Ajouter une application

Une nouvelle application reçoit une page de plus ici, avec les mêmes parties,
dans le même ordre. Elle prend aussi un bloc de ports
([les environnements](../04-les-environnements.md)), un projet Coolify avec ses
deux environnements, et des vérifications automatiques au patron commun, qui
appellent le déploiement automatique commun.
