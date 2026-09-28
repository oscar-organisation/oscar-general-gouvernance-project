# Vérifier le lot 4 soi-même

**But.** S'assurer que le portail technique suit le cycle, qu'il marche en
local sans aucun secret, qu'il est en service en test et en production avec la
bonne version, et que sa page d'accueil présente le déploiement. Aucun de ces
points ne change quoi que ce soit.

Chaque résultat « obtenu » a été relevé le 28/09/2026, à l'heure dite, par la
commande donnée. **Les points marqués J3 demandent une connexion par GitHub**,
que seul Joel peut faire: ils n'ont pas encore été faits.

Les commandes se tapent dans un terminal, avec Docker, git et `curl`.

---

## Point 1. Les deux portails répondent

```bash
for u in test-tech tech; do printf '%s: ' $u; curl -s https://$u.oscar-bot.com/.backstage/health/v1/readiness; printf ', accueil %s\n' $(curl -s -o /dev/null -w '%{http_code}' https://$u.oscar-bot.com/); done
```

**Attendu:** `test-tech: {"status":"ok"}, accueil 200` puis
`tech: {"status":"ok"}, accueil 200`.

**Obtenu** à 17h32 UTC: exactement cela.

- [ ] Fait

## Point 2. La connexion part vers GitHub, l'invité est refusé

```bash
for u in test-tech tech; do curl -s -o /dev/null -w "$u: %{http_code} " https://$u.oscar-bot.com/api/auth/github/start?env=production; curl -s -o /dev/null -w 'invité %{http_code}\n' -X POST https://$u.oscar-bot.com/api/auth/guest/refresh; done
```

**Attendu:** `302` pour chacun, puis `invité 404`. Avec `-w '%{redirect_url}'`
à la place, l'adresse commence par `https://github.com/login/oauth/authorize`
et contient `redirect_uri=https%3A%2F%2F<le site>%2Fapi%2Fauth%2Fgithub%2Fhandler%2Fframe`.

**Obtenu** à 17h07 UTC (test) et 17h30 UTC (production): `302`, la bonne
adresse de retour, `invité 404`.

- [ ] Fait

## Point 3. La page d'accueil présente le déploiement

Ce que la page publique envoie au navigateur, sans connexion:

```bash
for u in test-tech tech; do echo "== $u"; curl -s https://$u.oscar-bot.com/ | grep -o -E 'https://traefik\.oscar-bot\.com/dashboard/|secret_root/acess-admin-app/traefik-tableau-de-bord/identifiants\.md|component:default/deploiement' | sort | uniq -c; done
```

**Attendu**, pour chacun: la fiche du déploiement (deux fois: une carte, et
la page de documentation du bloc), l'adresse du tableau de bord de Traefik et
le chemin du fichier de ses identifiants, une fois chacun. Jamais un mot de
passe.

**Obtenu** à 17h34 UTC: `2 component:default/deploiement`,
`1 https://traefik.oscar-bot.com/dashboard/`,
`1 secret_root/acess-admin-app/traefik-tableau-de-bord/identifiants.md`, sur
les deux portails.

- [ ] Fait

## Point 4. Le tableau de bord de Traefik est protégé

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://traefik.oscar-bot.com/dashboard/
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://traefik.oscar-bot.com/dashboard/
```

**Attendu:** `401` (identifiant demandé), puis
`301 https://traefik.oscar-bot.com/dashboard/`.

**Obtenu** à 17h34 UTC: exactement cela.

Pour aller plus loin, dans un navigateur: ouvrir
`https://traefik.oscar-bot.com/dashboard/`, et donner l'identifiant et le mot
de passe du fichier `secret_root/acess-admin-app/traefik-tableau-de-bord/identifiants.md`,
sur le serveur du projet. Le tableau de bord s'ouvre. Ce pas n'a pas été
rejoué pour ce lot (il lit un secret); la session pilote l'a mesuré le 28/09 à
10h53 UTC.

- [ ] Fait

## Point 5. Le portail en local, sans aucun secret

Dans un dossier quelconque:

```bash
git clone https://github.com/oscar-organisation/oscar-general-gouvernance-project.git
cd oscar-general-gouvernance-project/oscar_backstage
docker compose up --build -d
docker compose ps
```

**Attendu:** `base` et `portail` `(healthy)` après une à deux minutes (la
première construction est longue). Ouvrir `http://127.0.0.1:18500`, cliquer
« Entrer »: la page « Commencer ici » a quatre parties, la dernière étant
« Le déploiement », avec le bloc « Le tableau de bord de Traefik ». En local,
le portail ne lit pas GitHub: les cartes de l'outil DNS et de « Le
déploiement » disent « Cette fiche n'est pas encore dans le catalogue. »,
comme le guide l'annonce.

**Obtenu** à 16h36 UTC, avec la version de la PR 27: le portail sain en
local, et la page telle que décrite (capture et relevé gardés par la session).

Pour arrêter: `docker compose down`.

- [ ] Fait

## Point 6. Les tests du portail

Depuis `oscar_backstage/`:

```bash
docker build --progress plain --target verifications --output type=cacheonly .
docker compose -f verifications-ecran/compose.yaml run --rm tester
```

**Attendu:** la construction va au bout, avec `Tests: 54 passed, 54 total`
dans sa sortie; puis `ℹ pass 34` et `ℹ fail 0`.

**Obtenu** à 16h35 UTC (54 sur 54) et dans chaque exécution des vérifications
automatiques du 28/09 (34 sur 34).

- [ ] Fait

## Point 7. La charte et l'accueil à l'écran, en local

Le portail du point 5 lancé, depuis `oscar_backstage/`:

```bash
ADRESSE=http://127.0.0.1:18500 MODE=invite docker compose -f verifications-ecran/compose.yaml run --rm verifier
```

**Attendu**, en fin de sortie: `BILAN  pages: 32  couleurs hors charte: 0
textes sous le seuil AA: 0  pages non affichees: aucune`, `LIGHTBOX  echecs:
aucun`, `FOCUS ... aucun`, `DEPLOIEMENT  partie, tableau de bord de Traefik ou
fiches en defaut: aucune`, `DEPLOIEMENT  fiches dites absentes du catalogue:
component:default/deploiement`, et le code de sortie 0.

**Obtenu** à 16h36 UTC: exactement cela.

- [ ] Fait

## Point 8. Le guide se construit

Depuis la racine du dépôt:

```bash
docker compose -f docs/outils/compose.yaml run --rm construire
```

**Attendu:** une dernière ligne `Documentation built in` suivie d'une durée,
et aucune ligne `WARNING`.

**Obtenu** dans chaque exécution des vérifications automatiques du 28/09.

- [ ] Fait

## Point 9. Les ordinateurs de GitHub sont fixés sur une version

Dans `https://github.com/oscar-organisation/oscar-general-gouvernance-project/actions`,
ouvrir l'exécution `36457491000` (la fusion de la PR 28 dans `main`), tâche
« Contrôles ».

**Attendu:** l'étape « Les ordinateurs de GitHub qui font les vérifications
sont fixés sur une version » réussie, avec la ligne « Toutes les tâches
tournent sur ubuntu-24.04. »; puis le déploiement de la production réussi.

**Obtenu:** exactement cela, lu le 28/09 à 17h30 UTC.

- [ ] Fait

## Point 10. J3: connecté par GitHub, en test puis en production

**Pas encore fait: demande Joel.** Se connecter par GitHub à
`https://test-tech.oscar-bot.com`, puis à `https://tech.oscar-bot.com`, et
vérifier:

1. la page « Commencer ici », partie « Le déploiement »: la carte « Le
   déploiement » est présente (elle ne dit pas « pas encore dans le
   catalogue ») et porte le lien « La documentation »;
2. ce lien ouvre « Le déploiement d'OSCAR »; un clic sur le schéma l'ouvre
   en grand;
3. le lien « Comment y accéder, et ce qu'on y lit » du bloc Traefik ouvre la
   page « Traefik, le proxy »;
4. le catalogue liste l'outil DNS, son API, le serveur temps réel et « Le
   déploiement »;
5. la fiche d'une application montre l'état de ses vérifications
   automatiques (onglet de GitHub Actions).

**Attendu:** les cinq. **Obtenu:** non fait (J3).

- [ ] Fait en test
- [ ] Fait en production
