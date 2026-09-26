# Vérifier le lot 5a soi-même

**But.** S'assurer qu'un nouveau venu peut suivre le cycle de l'outil DNS et du
laboratoire sans le dossier `code/`, que rien sur le serveur n'en dépend, et que
la chaîne voit un retour d'urgence. Les points 1 à 5 ne changent rien.

Chaque résultat attendu a été obtenu le 26/09/2026, par la commande donnée ou
par la passe citée.

---

## Point 1. Les six sites répondent

```bash
for u in test-dns dns test-labo labo test-tech tech; do printf "%s:%s " $u $(curl -s -o /dev/null -w '%{http_code}' https://$u.oscar-bot.com/); done; echo
```

**Attendu:** `test-dns:307 dns:307 test-labo:401 labo:401 test-tech:200 tech:200`.
L'outil DNS renvoie vers son écran d'accueil (307); le laboratoire demande ses
identifiants (401); le portail répond.

## Point 2. Rien sur le serveur ne dépend de `code/`

```bash
docker ps --filter label=coolify.managed=true --format '{{.Names}}' | while read n; do docker inspect "$n" --format '{{range .Mounts}}{{.Source}}{{"\n"}}{{end}}'; done | grep -c OSCAR-PROJECT/code
crontab -l 2>/dev/null | grep -c OSCAR-PROJECT/code
grep -rl OSCAR-PROJECT/code /etc/systemd/system 2>/dev/null | wc -l
grep -rln OSCAR-PROJECT/code ~/OSCAR-PROJECT/exploitation --include=*.sh --include=*.env --include=*.yaml --include=*.yml --include=*.py | wc -l
```

**Attendu:** `0` quatre fois.

## Point 3. Un nouveau venu, hors de `code/`

Dans un dossier quelconque, hors de `~/OSCAR-PROJECT/code/`:

```bash
git clone https://github.com/oscar-organisation/oscar-infrastructure.git
cd oscar-infrastructure/oscar_infra_dns
docker run --rm -v "$PWD":/app -w /app -e PYTHONDONTWRITEBYTECODE=1 python:3.12-slim \
  sh -c "pip install -q --root-user-action=ignore -r requirements.txt -r requirements-dev.txt && pytest -q -p no:cacheprovider"
cd ..
docker run --rm -v "$PWD":/app -w /app -e PYTHONDONTWRITEBYTECODE=1 python:3.12-slim \
  sh -c "apt-get update -qq && apt-get install -y -qq git >/dev/null && pip install -q --root-user-action=ignore pytest==8.3.3 && pytest -q -p no:cacheprovider .github/actions"
```

**Attendu:** `515 passed` pour l'outil DNS, puis `67 passed` pour la chaîne
commune. Pour aller plus loin, suivre le guide local de l'outil,
`oscar_infra_dns/docs/GUIDE-developpement-local-v1.1.md`: l'outil démarre en
local, et le laboratoire le teste (33 sur 33, environ 12 minutes).

## Point 4. La chaîne voit un retour d'urgence

Dans `https://github.com/oscar-organisation/oscar-infrastructure/actions`:

- passe `36213976649` (branche `test`): un avertissement jaune « Coolify sert
  en test le commit 8029a0172de0, alors que GitHub déclare f2ddfcd7e7ad, d'un
  autre contenu: un déploiement a eu lieu hors de la chaîne, un retour
  d'urgence en général... », puis la tâche de déploiement, verte: la chaîne a
  remis la bonne version;
- passe `36215037317` (branche `main`), tâche « Préparer »: « Le contenu de
  oscar_infra_dns est déjà celui qui est en service en production, selon
  Coolify (commit fc9f6698ece0): rien à déployer. »

## Point 5. Les procédures sont à jour

```bash
ls ~/OSCAR-PROJECT/exploitation/ops-oscar-infrastructure/oscar_infra_dns/procedures/ ~/OSCAR-PROJECT/exploitation/ops-oscar-test/oscar_labo_test_application/procedures/
ls ~/OSCAR-PROJECT/exploitation/ops-oscar-infrastructure/coolify/ ~/OSCAR-PROJECT/exploitation/ops-oscar-infrastructure/coolify/configuration/ ~/OSCAR-PROJECT/exploitation/ops-oscar-infrastructure/coolify/installation/ | grep -E "REGLAGES|PASSATION|PROCEDURE-installer"
ls ~/OSCAR-PROJECT/_pilotage/06-REPRODUIRE*
```

**Attendu:** `revenir-en-arriere.md` dans les deux dossiers de procédures, et
`NOTICE-installation-sur-un-serveur-neuf-v1.4.md` pour l'outil DNS;
`PASSATION-vers-la-machine-neuve-v1.1.md`, `PROCEDURE-installer-coolify-v1.2.md`
et `REGLAGES-retenus-v1.2.md` (leurs versions précédentes sont dans
`versions-precedentes/`); `06-REPRODUIRE-SUR-UN-SERVEUR-NEUF-v1.1.md` et
`v1.2.md`.

## Point 6. Un retour d'urgence, pour voir (facultatif, en test seulement)

La procédure `exploitation/ops-oscar-infrastructure/oscar_infra_dns/procedures/revenir-en-arriere.md`
décrit les deux voies, avec leurs durées mesurées (voie d'urgence: environ
deux minutes jusqu'au site sain). À ne jouer que sur l'environnement de test, et
à suivre aussitôt d'une annulation par la voie normale, comme la procédure le
dit.
