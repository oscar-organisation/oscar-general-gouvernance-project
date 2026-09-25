# Vérifier le lot 2 soi-même

**But.** S'assurer que la chaîne commune déploie l'outil DNS en test puis en
production, que la production n'accepte que ce qui est passé par test (en le
signalant sinon), que l'outil de test ne peut pas toucher la vraie zone DNS, et
que tout se voit sur GitHub et sur Coolify.

Les points 1 à 7 se vérifient sans rien changer. Le point 8 rejoue un vrai
cycle: il déploie en test puis en production. Chaque résultat attendu a été
obtenu le 25/09/2026, par la commande donnée ou par la passe citée.

---

## Point 1. Les sites répondent, en test et en production

```bash
curl -s https://test-api-dns.oscar-bot.com/v1/health; echo
curl -s https://api-dns.oscar-bot.com/v1/health; echo
curl -s -o /dev/null -w '%{http_code}\n' --http1.1 https://test-dns.oscar-bot.com/configuration
curl -s -o /dev/null -w '%{http_code}\n' --http1.1 https://dns.oscar-bot.com/configuration
```

**Attendu:** deux réponses qui contiennent `"etat":"pret"`, puis `200` deux fois.

## Point 2. Les déploiements se voient sur GitHub

Dans `https://github.com/oscar-organisation/oscar-infrastructure`:

- **Actions**: la passe `36166961529` (branche `test`) et la passe
  `36168799255` (branche `main`), vertes. Dans chacune, le résumé des tâches
  « Préparer » et « Déployer » dit quelle application, quel environnement, quel
  commit, avec les liens vers le site et vers Coolify.
- **Settings > Environments**: `outil-dns-test` et `outil-dns-production`,
  chacun avec une variable `COOLIFY_APPLICATION`.
- Sur la page d'accueil du dépôt, à droite, **Deployments**: le dernier
  déploiement de chaque environnement, réussi, avec l'adresse du site.

## Point 3. Les deux applications se voient sur Coolify

Ouvrir `https://deploy.oscar-bot.com`, projet `outil-dns`.

**Attendu:** `outil-dns-test` (environnement `test`, branche `test`) et
`outil-dns-production` (environnement `production`, branche `main`), toutes deux
en vert. Dans les variables de `outil-dns-test`, `OSCAR_ENVIRONNEMENT` vaut
`test` et **aucune variable ne contient OVH**.

La même vérification, par l'assistant, sans rien écrire:

```bash
~/OSCAR-PROJECT/exploitation/ops-oscar-infrastructure/coolify/assistant/oscar-coolify \
  --verifier ~/OSCAR-PROJECT/exploitation/ops-oscar-infrastructure/oscar_infra_dns/environnements/test/application.env
```

**Attendu**, entre autres lignes: `Déclenchement automatique par Coolify non
non bon`, `Variables recopiées dans le Dockerfile non non bon`,
`OSCAR_ENVIRONNEMENT test test bon`, les deux domaines `test-dns` et
`test-api-dns` à l'état `bon`, et en conclusion `Tout existe déjà`.

## Point 4. Le contrôle OVH refuse un test qui recevrait des identifiants

```bash
cd ~/OSCAR-PROJECT/code/oscar-infrastructure && git switch main && git pull
cd oscar_infra_dns
docker compose -f compose.yaml run --rm --no-deps -e OSCAR_ENVIRONNEMENT=test -e OVH_CONSUMER_KEY=x api; echo "code de sortie : $?"
docker compose -f compose.yaml down --rmi local
```

**Attendu:** la première fois, l'image se construit (quelques minutes). Puis un
message de refus qui nomme la variable sans afficher sa valeur, et qui se
termine par « Pourquoi il refuse : un environnement de test ne doit jamais
pouvoir toucher la vraie zone DNS... » et « Quoi faire : Retirez ces variables
de l'environnement du service... ». Puis `code de sortie : 1`. La dernière
commande retire ce que l'essai a construit.

## Point 5. Les tests passent

```bash
cd ~/OSCAR-PROJECT/code/oscar-infrastructure/oscar_infra_dns
docker run --rm -v "$PWD":/app -w /app -e PYTHONDONTWRITEBYTECODE=1 python:3.12-slim \
  sh -c "pip install -q --root-user-action=ignore -r requirements.txt -r requirements-dev.txt && pytest -q -p no:cacheprovider"

cd ~/OSCAR-PROJECT/code/oscar-infrastructure
docker run --rm -v "$PWD":/app -w /app -e PYTHONDONTWRITEBYTECODE=1 python:3.12-slim \
  sh -c "apt-get update -qq && apt-get install -y -qq git >/dev/null && pip install -q --root-user-action=ignore pytest && pytest -q -p no:cacheprovider .github/actions"
```

**Attendu:** `515 passed` pour l'outil DNS, puis `48 passed` pour la chaîne
commune (ses tests ont besoin de `git`, installé dans le conteneur jetable).

## Point 6. La porte de la production a déjà averti

Ouvrir la passe `36169751593` dans l'onglet Actions (branche d'essai
`essai/porte`, lancée à la main, à blanc, vers la production).

**Attendu:** un avertissement jaune « ... n'est pas passé par test (le contenu
en service en test, déployé au commit 284a1cbdb735, est un autre) », et la
tâche de déploiement sautée. La production n'a pas bougé.

Pour la rejouer: **Actions > Chaîne > Run workflow**, sur une branche d'essai
dont un fichier de `oscar_infra_dns/` diffère de `test`, « à blanc » coché,
environnement `production`. Supprimer la branche ensuite.

## Point 7. Une ligne d'attribution est refusée

Ouvrir la passe `36163480721`.

**Attendu:** rouge, avec le message « Le commit 368695788db9 porte, à la ligne 6
de son message, une ligne « Co-Authored-By: ». Réécrire le message... ». La PR
d'essai a été fermée sans fusion.

## Point 8. Un vrai cycle, de bout en bout

Ce point déploie réellement, en test puis en production. C'est le trajet qu'ont
suivi les PR 4 et 5 du 25/09.

```bash
cd ~/OSCAR-PROJECT/code/oscar-infrastructure
git switch test && git pull
git switch -c travail/essai-joel
# changer une ligne de commentaire dans oscar_infra_dns/compose.yaml
git commit -am "Essai du cycle : un commentaire"
git push -u origin travail/essai-joel
```

Puis sur GitHub:

1. Ouvrir une PR de `travail/essai-joel` vers `test`. **Attendu:** la chaîne
   vérifie (`controles`, `verifs`), vert; `deploiement` est sauté sur une PR.
2. La fusionner par **Create a merge commit** (le seul bouton permis).
   **Attendu:** une passe sur `test` qui redéploie `outil-dns-test`; dans
   Deployments, `outil-dns-test` au nouveau commit; `test-dns.oscar-bot.com`
   répond.
3. Ouvrir une PR de `test` vers `main`, puis la fusionner. **Attendu:** la
   production est redéployée, et le résumé de la passe dit « passé par test »,
   sans avertissement.
4. Supprimer la branche `travail/essai-joel`.

**Contre-épreuve:** refaire le trajet en ne changeant qu'un fichier `.md`.
**Attendu:** « rien à déployer », en test comme en production.
