# Les fiches en attente

Ce dossier porte les fiches du catalogue qui **ne sont pas encore dans le dépôt
de leur composant**. Le portail les lit ici en attendant, dans son image, par le
réglage `catalog.locations` (`app-config.production.yaml` et
`app-config.poste.yaml`), qui lit chaque `en-attente/<dépôt>/catalog-info.yaml`.

Une fiche vit dans le dépôt de son composant: c'est là qu'elle change avec le
code qu'elle décrit. Ce dossier n'est qu'un passage.

## La forme

Chaque sous-dossier porte le nom d'un dépôt, et reproduit exactement ce qui
ira dans ce dépôt, aux mêmes chemins:

```
en-attente/
  oscar-infrastructure/
    catalog-info.yaml                           la racine du dépôt: une Location
    oscar_infra_dns/catalog-info.yaml           l'outil DNS, et son API
    oscar_infra_realtime_server/catalog-info.yaml  le serveur temps réel
  oscar-test/
    catalog-info.yaml                           la racine du dépôt: une Location
    oscar_labo_test_application/catalog-info.yaml  le laboratoire
```

La fiche de la racine est une `Location`: elle nomme les fiches des unités,
par des chemins relatifs. Ces chemins valent ici comme dans le dépôt, puisque
l'arborescence est la même.

## Poser une fiche dans son dépôt

Dans cet ordre, pour ne jamais avoir deux fiches du même nom:

1. Recopier le sous-dossier `en-attente/<dépôt>/` à la racine du dépôt, tel
   quel, sur une branche `travail/`, et le faire passer par le cycle jusqu'à
   `main`.
2. Dans le même temps, retirer `en-attente/<dépôt>/` d'ici, par le cycle
   aussi.

Le portail lit les fiches des dépôts sur `main`, toutes les trente minutes.
Entre les deux fusions, il voit deux fiches du même nom: il garde la première
et signale l'autre dans son journal, sans rien casser. Quand la copie d'ici
disparaît, sa fiche disparaît avec elle (`orphanStrategy: delete`), et la
fiche du dépôt prend sa place au passage suivant.

## Ce qui n'est pas ici

Les fiches des autres dépôts de l'organisation sont déjà dans leur dépôt, et le
portail les y lit. Elles ne sont pas recopiées ici: deux fiches du même nom se
gêneraient.
