# Vérifier le lot 1 soi-même

**But.** S'assurer que ce qui déploie a quitté `code/`, que rien sur le serveur
ne dépend plus de `code/`, que l'outil DNS vit dans un seul dossier et tourne
toujours, et que le guide du cycle se lit. Tout se vérifie sur la machine, dans
un terminal, sauf les points 8 et 9, qui se regardent dans un navigateur.

Chaque résultat attendu ci-dessous a été obtenu en lançant la commande le
25/09/2026.

---

## Point 1. `exploitation/` a la forme prévue

```bash
cd ~/OSCAR-PROJECT
find exploitation -mindepth 1 -maxdepth 2 -type d | sort
```

**Attendu:** huit lignes.

```
exploitation/ops-oscar-general-gouvernance-project
exploitation/ops-oscar-general-gouvernance-project/oscar_backstage
exploitation/ops-oscar-infrastructure
exploitation/ops-oscar-infrastructure/coolify
exploitation/ops-oscar-infrastructure/oscar_infra_dns
exploitation/ops-oscar-infrastructure/ovhcloud
exploitation/ops-oscar-test
exploitation/ops-oscar-test/oscar_labo_test_application
```

```bash
ls exploitation/ops-oscar-infrastructure/oscar_infra_dns
```

**Attendu:** `LISEZ-MOI.md  environnements  procedures`, et rien d'autre:
aucun outil de Coolify dans le dossier de l'outil DNS.

## Point 2. Rien sur le serveur ne dépend de `code/`

```bash
docker ps --filter label=coolify.managed=true --format '{{.Names}}' | while read n; do docker inspect "$n" --format '{{range .Mounts}}{{.Source}}{{"\n"}}{{end}}'; done | grep -c OSCAR-PROJECT/code
crontab -l 2>/dev/null | grep -c OSCAR-PROJECT/code
grep -rl OSCAR-PROJECT/code /etc/systemd/system 2>/dev/null | wc -l
grep -rln OSCAR-PROJECT/code ~/OSCAR-PROJECT/exploitation --include=*.sh --include=*.env --include=*.yaml --include=*.yml --include=*.py | wc -l
```

**Attendu:** `0` quatre fois: aucun conteneur déployé, aucune tâche planifiée,
aucun service, aucun script ni aucune configuration d'`exploitation/` ne pointe
vers `code/`.

Un conteneur lancé à la main par un développeur, pour tester depuis `code/`, peut
monter `code/`: c'est normal, c'est du développement local. C'est pourquoi la
première commande ne regarde que les conteneurs que Coolify a déployés.

## Point 3. L'outil DNS vit dans un seul dossier, à plat

```bash
ls -A ~/OSCAR-PROJECT/code/oscar-infrastructure/oscar_infra_dns
ls -d ~/OSCAR-PROJECT/code/oscar-infrastructure/oscar_infra_dns_et_deploiement
```

**Attendu:** la première commande montre `.dockerignore .env .env.exemple
.gitignore Dockerfile README.md compose.override.yaml compose.yaml docs
interface oscar_infra_dns pyproject.toml requirements-dev.txt requirements.txt
tests`, sans dossier `outil-dns` ni `deploiement`. La seconde répond `No such
file or directory`: l'ancien dossier n'existe plus.

## Point 4. L'outil DNS répond en production

```bash
curl -s https://api-dns.oscar-bot.com/v1/health; echo
curl -s -o /dev/null -w '%{http_code}\n' -L --http1.1 https://dns.oscar-bot.com/
```

**Attendu:** une réponse qui contient `"etat":"pret"`, puis `200`.

## Point 5. Les tests de l'outil DNS passent, en conteneur

```bash
cd ~/OSCAR-PROJECT/code/oscar-infrastructure/oscar_infra_dns
docker run --rm -v "$PWD":/app -w /app -e PYTHONDONTWRITEBYTECODE=1 python:3.12-slim \
  sh -c "pip install -q --root-user-action=ignore -r requirements.txt -r requirements-dev.txt && pytest -q -p no:cacheprovider"
```

**Attendu:** environ une minute et demie, puis une dernière ligne `N passed`,
sans `failed` ni `error`. N valait **494** à la fin du lot 1; il grandit à
chaque lot qui ajoute des tests. Rien n'est installé sur la machine.

## Point 6. En local, les ports suivent la convention; sur le serveur, aucun

```bash
cd ~/OSCAR-PROJECT/code/oscar-infrastructure/oscar_infra_dns
docker compose config | grep -E "published:|host_ip"
docker compose -f compose.yaml config | grep -c published
```

**Attendu:** la première commande montre `host_ip: 127.0.0.1` avec `published:
"18100"`, puis avec `published: "18101"`. La seconde répond `0`: sans
`compose.override.yaml`, comme la lit Coolify, la composition ne publie aucun
port.

## Point 7. L'assistant de déploiement marche depuis `exploitation/`

```bash
~/OSCAR-PROJECT/exploitation/ops-oscar-infrastructure/coolify/assistant/tester.sh 2>&1 | tail -1
```

**Attendu:** une ligne `N passed`, sans `failed`, en moins d'une minute. N valait
419 à la fin du lot 1, et 464 le soir même, après les tests ajoutés au lot 2.

## Point 8. Coolify est rangé comme prévu

Ouvrir `https://deploy.oscar-bot.com`, menu **Projects**.

**Attendu:**
- trois projets, `outil-dns`, `labo` et `portail`, chacun avec deux
  environnements, `production` et `test`;
- dans `outil-dns` > `production`, l'application `outil-dns-production`, en
  vert; dans sa configuration, **Base Directory** vaut `/oscar_infra_dns`.

## Point 9. Le guide du cycle se lit sur GitHub

Ouvrir
`https://github.com/oscar-organisation/oscar-general-gouvernance-project/blob/main/docs/README.md`.

**Attendu:** la page « Commencer ici ». En suivant le lien du cycle pas à pas,
la page `02-le-cycle-pas-a-pas.md` s'ouvre, avec deux schémas dessinés (le trajet
d'une modification, puis les branches), et un tableau « Où en est le cycle
aujourd'hui ».

## Point 10. Les schémas et le site du guide sont à jour

```bash
cd ~/OSCAR-PROJECT/code/oscar-general-gouvernance-project
docker compose -f docs/outils/compose.yaml run --rm verifier-schemas
docker compose -f docs/outils/compose.yaml run --rm construire
git status --short docs
```

**Attendu:**
- la première commande, en deux minutes environ, écrit `A JOUR` devant chacune
  des six images, puis `6 schema(s), chaque image correspond a sa source.`;
- la seconde se termine par `Documentation built in ...`, sans ligne `WARNING`:
  la construction est en mode strict, un seul avertissement la ferait échouer;
- la troisième n'affiche rien: aucune des deux n'a écrit dans le dépôt.
