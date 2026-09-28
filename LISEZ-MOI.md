# oscar-general-gouvernance-project

**Le point d'entrée du projet OSCAR.** Un endroit où quelqu'un qui arrive,
développeur ou non, comprend ce qui existe, à quoi ça sert, comment c'est
relié, et où aller.

**Pour commencer: [le guide du cycle de développement](docs/README.md).** Il
est écrit une fois pour toutes les applications, et chaque dépôt y renvoie.

## Ce que contient ce dépôt

```
docs/               le guide commun du cycle de développement, et ses schémas
mkdocs.yml          la description du guide, pour son affichage dans le portail
catalog-info.yaml   la fiche du dépôt, lue par le portail
oscar_backstage/    le portail technique Backstage, et tout ce qui le concerne
```

Le portail vit **entièrement** dans `oscar_backstage/`: son code, sa
composition, ses réglages, sa documentation (décision 62). C'est ce dossier que
Coolify construit et déploie.

## Les adresses

| | Adresse |
|---|---|
| Le portail, production | `https://tech.oscar-bot.com` |
| Le portail, test | `https://test-tech.oscar-bot.com` |
| Le portail, sur son poste | `http://127.0.0.1:18500`, et `18501` en mode développement |

On s'y connecte avec son compte GitHub, membre de l'organisation
`oscar-organisation`. En local, on entre en invité, sans compte.

## Cloner, lancer, tester

```
git clone https://github.com/oscar-organisation/oscar-general-gouvernance-project.git
cd oscar-general-gouvernance-project/oscar_backstage
docker compose up --build -d
```

Le détail, les deux façons de travailler en local et les tests: la page du
portail dans le guide, [`docs/08-les-applications/portail-backstage.md`](docs/08-les-applications/portail-backstage.md).

Le guide lui-même se vérifie en conteneur, depuis la racine du dépôt:

```
docker compose -f docs/outils/compose.yaml run --rm construire
docker compose -f docs/outils/compose.yaml run --rm verifier-schemas
```

## Comment une modification arrive en production

Par le cycle du guide, comme pour toute application: une branche
`travail/<sujet>` partie de `test`, une PR vers `test`, puis une PR de `test`
vers `main`. Les vérifications automatiques de GitHub, écrites dans
`.github/workflows/verifications-automatiques.yml`, contrôlent chaque PR et
déploient après chaque fusion. Personne ne déploie à la main. Voir
[le cycle pas à pas](docs/02-le-cycle-pas-a-pas.md).
