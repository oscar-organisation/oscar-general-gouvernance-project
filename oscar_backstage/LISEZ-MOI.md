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

Aucun secret n'est nécessaire: en local, on entre en invité.

## Ce qu'il y a ici

```
compose.yaml                  le portail et sa base, tels que Coolify les deploie
compose.override.yaml         ce que le poste ajoute: les ports, l invite, le mode developpement
Dockerfile                    la construction, entierement dans Docker
.env.exemple, .env            chaque variable, son role et son niveau
app-config*.yaml              les reglages de Backstage, un fichier par role (voir app-config.yaml)
catalogue/                    la structure du catalogue, et les fiches en attente
marque/                       les images de la charte, leur fabrication et ses tests
verifications-ecran/          le controle de la charte a l ecran, dans un navigateur, et ses tests
techdocs/requirements.txt     les versions figees de MkDocs, pour la documentation
packages/app/                 l interface: charte, menu, connexion, accueil
packages/backend/             le serveur, et les tests des reglages
```
