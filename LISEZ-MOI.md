# oscar-general-gouvernance-project

**Le point d'entrée unique du projet OSCAR.** Un endroit où quelqu'un qui
arrive, développeur junior ou non technicien, comprend ce qui existe, à quoi ça
sert, comment c'est relié, et où aller.

## Ce que ça contient

```
oscar_backstage/    le portail, et TOUT ce qui le concerne
```

**Tout est dans ce sous-dossier**, y compris son `compose.yaml` et ses réglages.
Rien à la racine. C'est ce qui permet à Coolify de déployer depuis ce dépôt en
ne visant que ce dossier, sans rien savoir du reste.

## L'adresse

```
tech.oscar-bot.com
```

## Comment il est déployé

**Par Coolify, depuis ce dépôt GitHub.** Pas à la main sur le serveur : une
poussée sur `main` déclenche le déploiement.

## Qui y a accès

Tout le monde dans l'organisation GitHub `oscar-organisation`. **Mais chacun ne
voit que ce à quoi il a droit** : quelqu'un qui n'a pas accès à un dépôt ne voit
pas son contenu dans le portail.
