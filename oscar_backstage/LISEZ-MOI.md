# oscar_backstage, le portail technique

Le portail technique d'OSCAR, construit avec Backstage 1.55. Tout ce qui le
concerne vit dans ce dossier (décision 62): le code, la composition, les
réglages, les images de marque, le catalogue.

**Le mode d'emploi complet est dans le guide:**
[`docs/08-les-applications/portail-backstage.md`](../docs/08-les-applications/portail-backstage.md):
lancer en local, tester, les vérifications automatiques de GitHub, le
déploiement, surveiller.

## En deux commandes

```
docker compose up --build -d              # le mode service, sur http://127.0.0.1:18500
docker compose up --build developpement   # le mode développement, sur http://127.0.0.1:18501
```

Aucun secret n'est nécessaire: en local, on entre en invité. Le poste construit
l'image lui-même (`compose.override.yaml`); en test et en production, Coolify
ne construit rien: il met en ligne l'image que les vérifications automatiques
de GitHub ont construite une seule fois et rangée dans l'entrepôt d'images
d'OSCAR, Harbor (`oscar/portail-backstage`).

## Les outils du développeur, lancés à la main

Les vérifications automatiques de GitHub ne les lancent plus (décision 91):
ils restent ici, pour qu'on les lance soi-même, avec Docker et rien d'autre.

| Quand | Depuis | La commande |
|---|---|---|
| Avant de toucher à l'accueil ou à la charte | `oscar_backstage/` | `docker build --target verifications-du-developpeur .` |
| Après avoir changé une image de marque ou `marque/fabriquer.py` | `oscar_backstage/` | `docker compose -f marque/compose.yaml run --rm verifier`, puis `tester` (voir [`marque/LISEZ-MOI.md`](marque/LISEZ-MOI.md)) |
| Avant de changer le contrôle à l'écran | `oscar_backstage/` | `docker compose -f verifications-ecran/compose.yaml run --rm tester` |
| Pour regarder le portail à l'écran, en local ou en test | `oscar_backstage/` | `ADRESSE=<adresse> docker compose -f verifications-ecran/compose.yaml run --rm verifier` |
| Après avoir changé un schéma du guide | la racine du dépôt | `docker compose -f docs/outils/compose.yaml run --rm verifier-schemas` (voir [`docs/schemas/README.md`](../docs/schemas/README.md)) |

**Les tests de l'accueil et de la charte ne sont lancés par rien**: les lancer
avant de toucher à l'accueil ou à la charte. Ils sont exclus des tests du
parcours automatique par le réglage `jest` de `packages/app/package.json`;
un test des réglages vérifie que l'exclusion et la commande à la main
nomment les mêmes dossiers.

## Ce qu'il y a ici

```
compose.yaml                  le portail (l image rangee dans Harbor) et sa base, tels que Coolify les deploie
compose.override.yaml         ce que le poste ajoute: la construction de l image, les ports, l invite, le mode developpement
Dockerfile                    la construction, entierement dans Docker
.env.exemple, .env            chaque variable, son role et son niveau
app-config*.yaml              les reglages de Backstage, un fichier par role (voir app-config.yaml)
catalogue/                    la structure du catalogue, et les fiches en attente
marque/                       les images de la charte, leur fabrication et ses tests (a la main)
verifications-ecran/          le controle de la charte a l ecran, dans un navigateur, et ses tests (a la main)
techdocs/requirements.txt     les versions figees de MkDocs, pour la documentation
packages/app/                 l interface: charte, menu, connexion, accueil
packages/backend/             le serveur, et les tests des reglages
```
