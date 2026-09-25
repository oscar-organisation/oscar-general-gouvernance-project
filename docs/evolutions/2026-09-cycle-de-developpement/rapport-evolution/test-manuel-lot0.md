# Vérifier le lot 0 soi-même

**But.** S'assurer que les restes d'essais ont disparu, et que rien de ce qui
sert n'a été touché. Tout se vérifie sur la machine, dans un terminal.

---

## Point 1. Les conteneurs lancés à la main sont partis

```bash
docker ps -a --format '{{.Names}}' | grep -E '^outil-dns-' || echo "aucun"
docker volume ls --format '{{.Name}}' | grep -E 'outil-dns_|portail-base' || echo "aucun"
```

**Attendu:** `aucun` deux fois. Les conteneurs de l'outil DNS déployé par
Coolify s'appellent `api-7n8eyasdg2edoojhumbegtdx-...` et
`interface-7n8eyasdg2edoojhumbegtdx-...`: eux doivent toujours tourner.

```bash
docker ps --format '{{.Names}}  {{.Status}}' | grep 7n8eyasdg2edoojhumbegtdx
```

**Attendu:** deux conteneurs, `(healthy)`.

## Point 2. L'outil DNS répond toujours

```bash
curl -s -o /dev/null -w '%{http_code}\n' -L --http1.1 https://dns.oscar-bot.com/
```

**Attendu:** `200`.

## Point 3. Les noms d'essai sont refusés comme n'importe quel nom inconnu

```bash
echo | openssl s_client -connect 148.113.252.233:443 -servername essai-script.oscar-bot.com 2>&1 | grep -o 'unrecognized name'
echo | openssl s_client -connect 148.113.252.233:443 -servername essai-copie.oscar-bot.com  2>&1 | grep -o 'unrecognized name'
```

**Attendu:** `unrecognized name` deux fois. Avant le lot, ces noms obtenaient
encore un certificat.

## Point 4. Les fichiers laissés par les installations ont disparu

```bash
ls -d ~/.cache/node/corepack ~/.npm/_cacache ~/.cache/ms-playwright/chromium-1228 2>&1 | grep -c 'No such'
ls -d ~/OSCAR-PROJECT/code/oscar-general-gouvernance-project/oscar_backstage/node_modules 2>&1 | grep -c 'No such'
```

**Attendu:** `3`, puis `1`.

## Point 5. Tous les dépôts ont leur distant et sont à jour

```bash
cd ~/OSCAR-PROJECT/code
for R in */; do printf "%-38s %s\n" "${R%/}" "$(git -C "$R" remote | head -1) $(git -C "$R" status -sb | head -1)"; done
```

**Attendu:** onze lignes, chacune avec `origin` et `main...origin/main`, sans
`ahead` ni `behind`.

## Point 6. La carte des dépôts correspond au disque

```bash
bash ~/OSCAR-PROJECT/outils/verifier-la-carte-des-depots.sh
```

**Attendu:** dernière ligne `La carte correspond au disque.`

## Point 7. La sauvegarde du lot est là

```bash
ls ~/OSCAR-PROJECT/backup/20260925-121841-lot0-menage-des-brouillons/
```

**Attendu:** l'archive `volume-portail-base-essai-manuel-24-09.tar.gz` et le
dossier `fichiers-suivis/`.

---

## Tableau à cocher

| # | Point | Attendu | Vu |
|---|---|---|---|
| 1 | Conteneurs et volumes d'essai | absents; l'outil DNS déployé tourne | |
| 2 | Outil DNS | 200 | |
| 3 | Noms d'essai | refusés | |
| 4 | Fichiers d'installation | absents | |
| 5 | Dépôts | onze, tous rattachés et à jour | |
| 6 | Carte | correspond au disque | |
| 7 | Sauvegarde | présente | |
