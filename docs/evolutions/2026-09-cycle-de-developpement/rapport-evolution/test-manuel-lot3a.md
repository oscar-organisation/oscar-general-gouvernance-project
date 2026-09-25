# Vérifier le lot 3a soi-même

**But.** S'assurer, commande par commande, que le laboratoire de tests se lance
entièrement en conteneur, vise le niveau demandé, refuse clairement ce qu'il ne
peut pas faire, et range ses rapports par niveau. Chaque point dit la commande
et ce qu'on doit voir.

Tout se tape depuis le dossier du laboratoire :

```
cd ~/OSCAR-PROJECT/code/oscar-test/oscar_labo_test_application
```

(Sur un autre poste : `git clone https://github.com/oscar-organisation/oscar-test.git`
puis `cd oscar-test/oscar_labo_test_application`.)

Les nombres attendus sont ceux du 25/09/2026 : 15 scénarios, dont 10 pour
l'outil DNS, chacun joué sur trois écrans.

---

## Point 1. L'image se construit, et contient ce qu'il faut

```
docker compose build labo
docker run --rm --entrypoint sh oscar-labo-test:local -c \
  'python3 --version; grep "\"version\"" /labo/node_modules/@playwright/test/package.json /labo/node_modules/typescript/package.json; ls /ms-playwright'
```

**Attendu :** `Python 3.12.3` ; `@playwright/test` en `1.49.1`, `typescript` en
`5.7.3` ; `chromium-1148` parmi les navigateurs. La première construction prend
environ trois minutes.

## Point 2. Rien du laboratoire n'est installé sur le poste

```
ls -d node_modules ~/.cache/ms-playwright 2>&1 | grep -c 'No such'
```

**Attendu :** `2`. Les dépendances et les navigateurs sont dans l'image, et
nulle part ailleurs.

## Point 3. La suite de la console est verte

```
docker compose run --rm labo verifier --console
```

**Attendu :** en dernière ligne de la suite, `== Bilan : 116 réussis, 0 échoués ==`,
puis `Suite de la console : réussie`. Environ deux minutes et demie.

## Point 4. Les types sont vérifiés

```
docker compose run --rm labo verifier --types
```

**Attendu :** `Vérification des types : réussie`, sans aucune ligne `error TS`.

## Point 5. Les trois niveaux

```
docker compose run --rm labo niveaux
```

**Attendu :** trois tableaux, `local`, `test`, `production`. Au niveau `local`,
l'outil DNS vise `http://host.docker.internal:18101` et `:18100`. Au niveau
`test`, `admin-console` et `keycloak` sont marqués « pas d'environnement », avec
la raison.

## Point 6. Voir ce qui serait lancé, sans lancer

| Commande | Attendu |
|---|---|
| `docker compose run --rm labo lister` | `Scénarios (15)` et `Tests : 45` |
| `docker compose run --rm labo lister --app outil-dns` | `Scénarios (10)` et `Tests : 30` |
| `docker compose run --rm labo lister --fonctionnalite declarer-un-fournisseur` | `Scénarios (9)` et `Tests : 27` |
| `docker compose run --rm labo lister --scenario accueil-affiche` | `Scénarios (1)` et `Tests : 3` |
| `docker compose run --rm labo lister --type nominal` | `Scénarios (5)` et `Tests : 15` |
| `docker compose run --rm labo lister --ecran desktop` | `Scénarios (15)` et `Tests : 15`, tous `desktop` |

Et `ls rapports` ne montre rien de nouveau : lister n'écrit aucun rapport.

## Point 7. Les arguments arrivent intacts

```
./labo lister --app outil-dns --grep "@nominal|@etat"
docker compose run --rm labo lister --grep @nominal
```

**Attendu :** `Tests : 15 dans 5 fichier(s)` les deux fois. Le tube `|` reste
dans un seul argument ; une option placée en premier est acceptée.

## Point 8. Les refus

| Commande | Attendu |
|---|---|
| `docker compose run --rm labo lancer --niveau test --app admin-console` | `L'application « admin-console » n'a pas d'environnement au niveau « test ».` suivi de la raison, puis `Rien n'a été lancé.` ; code de sortie `2` (`echo $?`) |
| `docker compose run --rm labo lancer --niveau recette --app outil-dns` | `Le niveau « recette » n'existe pas. Niveaux disponibles : local, test, production.` puis `Rien n'a été lancé.` |
| `docker compose run --rm labo lancer --app outil-dsn` | `Aucun dossier « outil-dsn » au niveau « application »`, avec les applications existantes |

Pour une adresse manquante, créer un niveau personnel incomplet, le tester, puis
l'effacer :

```
printf 'niveaux:\n  serveur-dev:\n    urls:\n      interface: http://serveur-dev.exemple.invalid:18101\n' > config/niveaux-personnels.yaml
docker compose run --rm labo lancer --niveau serveur-dev --app outil-dns
rm config/niveaux-personnels.yaml
```

**Attendu :** `Le niveau « serveur-dev » (...) ne donne pas l'adresse « api »
(API de l'outil DNS), dont l'application « outil-dns » a besoin.`, avec les deux
façons de réparer, puis `Rien n'a été lancé.`

## Point 9. Le niveau local vise le poste

```
docker compose run --rm labo lancer --niveau local --app outil-dns
```

**Attendu**, si l'outil DNS ne tourne pas en local : l'en-tête montre
`interface  http://host.docker.internal:18101` et `api  http://host.docker.internal:18100`,
puis `Rien ne répond sur ...`, le renvoi vers « Le niveau local sous Linux », et
`Rien n'a été lancé.`

## Point 10. Remplacer une adresse le temps d'un lancement

```
docker compose run --rm -e URL_API=https://api-dns.oscar-bot.com labo lister --niveau test --app outil-dns
```

**Attendu :** la ligne `api` montre `https://api-dns.oscar-bot.com  (variable URL_API)`,
la ligne `interface` reste celle du niveau test.

## Point 11. Une passe réelle en production

À faire quand la machine n'est pas surchargée : `uptime` sous 4, idéalement.

```
docker compose run --rm labo lancer --niveau production --app outil-dns
```

**Attendu :** `Running 30 tests using 1 worker`, puis `Niveau production : 30
réussis sur 30.` Compter une dizaine de minutes. Puis :

```
ls rapports/production
cat rapports/production/passe.json
```

**Attendu :** `index.html`, `index.json`, `junit.xml`, `passe.json`, `scenarios` ;
dans `passe.json`, `"niveau": "production"`, `"code_retour": 0`, et le bilan
`"total": 30`.

Et aucun lien du rapport ne sort du dossier du niveau :

```
grep -o '"path":"[^"]*"' rapports/production/index.json | grep -c '"\.\./'
```

**Attendu :** `0`. Toutes les captures, y compris celles des étapes, sont dans
`rapports/production/scenarios/`.

## Point 12. Le visualiseur

```
docker compose up -d visualiseur
docker port oscar-labo-test-visualiseur-1
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:18400/production/index.html
docker compose -f compose.yaml config | grep -c published
```

**Attendu :** `80/tcp -> 127.0.0.1:18400` ; `200` ; `0` (sans le complément
local, aucun port n'est publié). Ouvrir `http://127.0.0.1:18400` dans un
navigateur : une ligne `production`, son bilan, et le lien vers le rapport, où
les captures et les vidéos s'affichent. `docker compose stop visualiseur` pour
l'arrêter.

## Point 13. Un scénario créé ouvre l'adresse de son application

```
docker compose run --rm labo creer-scenario --groupe groupe-oscar --projet oscar --app admin-console \
  --role admin --fonctionnalite essai-manuel --type nominal --scenario essai --titre "essai manuel"
grep -n "page.goto" projets/groupe-oscar/oscar/admin-console/tests-fonctionnels-ui/role-admin/fonctionnalite-essai-manuel/type-nominal/scenario-essai/script_spec_test/essai.spec.ts
rm -r projets/groupe-oscar/oscar/admin-console/tests-fonctionnels-ui/role-admin/fonctionnalite-essai-manuel
```

**Attendu :** `await page.goto(ENV.consoleAdmin + '/');`, et non `page.goto('/')`.
La dernière commande efface l'essai.

## Point 14. Les fichiers d'exemple sont ceux du générateur

```
docker compose run --rm labo regenerer-exemples
git status --short config
```

**Attendu :** `Les fichiers d'exemple sont déjà à jour.`, et `git status` n'affiche rien.

## Point 15. Plus d'héritage BOAZ

```
cd ~/OSCAR-PROJECT/code/oscar-test
grep -rn -i -E "gateway|dashboard|vitrine|verification|qr|role-client|role-agent|inscription|validation-transaction|5173|5174|5175|8080|8090|boaz|laboratoire-tests-e2e" \
  --exclude-dir=.git --exclude-dir=rapports --exclude-dir=backup . | grep -v ECARTS-AVEC-LA-SOURCE.md | grep -v '"integrity"'
```

**Attendu :** deux lignes seulement : `catalog-info.yaml` (`system: verification`,
le système du catalogue Backstage) et `compose.yaml` (`host-gateway`, un mot-clé
de Docker).

## Point 16. L'incident INC-2026-09-25-08 est clos

```
grep -n "Statut" ~/OSCAR-PROJECT/code/oscar-gestion-incidents-and-reports/incidents_oscar-skill-gouvernance-dev-agents/9-incident-25-09-2026-11h52/Rapport-incident/rapport-incident.md
```

**Attendu :** `| Statut | RÉSOLU |`.

---

## Tableau à cocher

| # | Vérification | Fait |
|---|---|---|
| 1 | L'image se construit et contient Python, Playwright 1.49.1, TypeScript, Chromium | [ ] |
| 2 | Ni `node_modules` ni navigateurs Playwright sur le poste | [ ] |
| 3 | Suite de la console : 116 sur 116 | [ ] |
| 4 | Types vérifiés, aucune erreur | [ ] |
| 5 | Trois niveaux ; au niveau test, console et Keycloak absents avec leur raison | [ ] |
| 6 | Les six listages donnent 45, 30, 27, 3, 15, 15 tests | [ ] |
| 7 | `--grep "@nominal|@etat"` et `--grep @nominal` : 15 tests chacun | [ ] |
| 8 | Trois refus clairs, code 2, rien de lancé | [ ] |
| 9 | Le niveau local vise `host.docker.internal:18101` et `:18100` | [ ] |
| 10 | `-e URL_API=...` remplace l'adresse, et c'est dit | [ ] |
| 11 | Passe en production : 30 sur 30, rapport dans `rapports/production/`, aucun lien vers l'extérieur | [ ] |
| 12 | Visualiseur sur `127.0.0.1:18400`, aucun port sans le complément | [ ] |
| 13 | Un scénario créé ouvre l'adresse de son application | [ ] |
| 14 | Fichiers d'exemple identiques à la sortie du générateur | [ ] |
| 15 | Plus d'héritage BOAZ | [ ] |
| 16 | INC-2026-09-25-08 marqué RÉSOLU | [ ] |
