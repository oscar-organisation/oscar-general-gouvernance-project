# Vérifier le lot 3b soi-même

**But.** S'assurer que le laboratoire est en ligne en test et en production,
protégé, qu'il valide l'outil DNS après chaque déploiement, et que l'écran de
saisie de l'outil DNS ne perd plus ce qu'on y tape. Rien de ce qui suit ne
change quoi que ce soit.

Chaque résultat attendu a été obtenu le 26/09/2026 vers minuit UTC, par la
commande donnée ou par la passe citée.

---

## Point 1. Le visualiseur est en ligne et protégé

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://test-labo.oscar-bot.com/
curl -s -o /dev/null -w '%{http_code}\n' https://labo.oscar-bot.com/
curl -s -o /dev/null -w '%{http_code}\n' https://labo.oscar-bot.com/sante
P=$(tr -d '\n' < ~/OSCAR-PROJECT/secret_root/acess-admin-app/labo/mot-de-passe-acces-production.txt)
curl -s -o /dev/null -w '%{http_code}\n' -u "oscar:$P" https://labo.oscar-bot.com/
```

**Attendu:** `401` deux fois (sans identifiants, l'accès est refusé), puis
`200` pour la santé, puis `200` avec les identifiants. Le mot de passe n'est
jamais affiché.

Dans un navigateur, ouvrir `https://labo.oscar-bot.com`, se connecter avec
l'identifiant `oscar` et ce mot de passe. **Attendu:** la liste des recettes,
dont « laboratoire » et « outil-dns », avec leurs rapports, captures et vidéos.

## Point 2. La recette valide chaque déploiement

Dans l'onglet Actions:

- `oscar-infrastructure`, passe `36201137755` (branche `main`): les tâches
  Contrôles, Vérifications, Préparer, Déployer, puis **« Recette outil-dns en
  prod »**, toutes vertes.
- `oscar-test`, passe `36201708558` (branche `main`): les mêmes tâches, puis
  **« Recette du laboratoire »**, verte: les 33 tests de l'outil DNS contre la
  production.

## Point 3. L'écran de saisie de l'outil DNS ne perd plus rien

```bash
curl -s --http1.1 'https://dns.oscar-bot.com/configuration?type=manuel' | grep -c 'se prépare'
curl -s --http1.1 'https://dns.oscar-bot.com/configuration?type=manuel' | grep -o 'disabled' | wc -l
```

**Attendu:** `1`, puis un nombre supérieur à zéro. Tant que la page n'est pas
prête, l'écran affiche « L'écran se prépare » et ses champs sont fermés; ils
s'ouvrent dès qu'elle l'est. Dans un navigateur, en simulant une connexion lente
(outils du navigateur, réseau « Slow 3G »), on voit ce message un instant avant
que la saisie s'ouvre.

## Point 4. Le laboratoire marche en local

```bash
cd ~/OSCAR-PROJECT/code/oscar-test && git switch main && git pull
cd oscar_labo_test_application
docker compose build labo
docker compose run --rm labo verifier
docker compose run --rm labo lister --app outil-dns
```

**Attendu:** la construction prend quelques minutes la première fois. Puis
`Suite de la console : réussie`, `Suite du collecteur : réussie`,
`Vérification des types : réussie`, et enfin
`Tests : 33 dans 11 fichier(s)  (desktop 11, tablette 11, mobile 11)`.

La suite de la console contient les dix tests du garde-fou: un scénario marqué
`@ecrit` n'est jamais joué en production.

## Point 5. Les secrets du visualiseur sont posés, sans être affichés

```bash
~/OSCAR-PROJECT/exploitation/ops-oscar-infrastructure/coolify/assistant/oscar-coolify \
  --verifier ~/OSCAR-PROJECT/exploitation/ops-oscar-test/oscar_labo_test_application/environnements/production/application.env
```

**Attendu**, dans la section « Secrets de l'application »:
`LABO_ACCES_MOT_DE_PASSE ... posé bon` et `LABO_JETON_GITHUB ... posé bon`,
avec la phrase « Les valeurs ne s'affichent jamais: elles se lisent dans leur
fichier. », le domaine `labo.oscar-bot.com` à l'état `bon`, et en conclusion
`Tout existe déjà`. Rien n'est écrit.
