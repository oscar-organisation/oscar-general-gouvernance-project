# Les vérifications automatiques

Les vérifications automatiques de GitHub sont les contrôles et les tests que
GitHub lance seul, dans GitHub Actions, à chaque PR et à chaque fusion. **Ce
sont elles qui mettent en ligne, et elles seules.** Personne ne met en ligne à
la main.

Depuis le 4 octobre 2026 (plan 17), elles construisent l'image de chaque
application **une seule fois**, la rangent dans **Harbor**, l'entrepôt des
images (`registry-container.oscar-bot.com`), puis la font mettre en ligne par
Coolify, en test, puis **la même** en production. Coolify ne construit plus
rien.

![Les vérifications automatiques: vérifications rapides, tests du code, puis, à la fusion dans test, une construction rangée dans Harbor, Trivy et la mise en ligne en test; pour main, l'image testée retrouvée et mise en ligne en production](schemas/04-les-verifications-automatiques.svg)

Source du schéma: [`schemas/04-les-verifications-automatiques.mmd`](schemas/04-les-verifications-automatiques.mmd).

## Les mots de cette page

| Mot | Sens |
|---|---|
| **Image** | le paquet prêt à lancer d'une application: son code, ce dont il a besoin, la commande qui la démarre |
| **Harbor** | l'entrepôt où sont rangées les images, projet privé `oscar` |
| **Étiquette** | un nom posé sur une image; une image en porte plusieurs (voir [les environnements](04-les-environnements.md)) |
| **Empreinte du contenu** | l'identifiant que Git calcule pour le contenu exact des fichiers du dossier de l'application, sans la documentation. Deux commits de même contenu ont la même empreinte; la fusion de `test` dans `main` ne la change pas |

## Leurs tâches

Le même patron dans les trois dépôts, dans le fichier
`.github/workflows/verifications-automatiques.yml`. Les noms sont ceux que
l'onglet Actions affiche:

| Tâche | Ce qu'elle fait | Durée mesurée le 04/10/2026 |
|---|---|---|
| Vérifications rapides | refuse un commit qui porte une ligne d'attribution (décision A18), cherche des secrets, vérifie la typographie (ni tiret long, ni caractère points de suspension), valide les fichiers des vérifications automatiques et la composition telle que Coolify la lit; selon le dépôt, construit la documentation (le guide du portail, décision 98; celle du déploiement) | moins d'une minute |
| Tests du code | les tests unitaires et d'intégration de l'application. Pour le portail, « Tests du code dans l'image »: l'étape `verifications` de son Dockerfile, avec le même cache que l'image | 1 à 5 min selon l'application et le cache |
| Construire, ranger et mettre en ligne | le déploiement automatique commun, en cinq tâches (ci-dessous) | de quelques secondes à quelques minutes |
| Résumé | toujours, même après un échec: un tableau sur la page de l'exécution, et un seul commentaire dans la PR | quelques secondes |

Le déploiement automatique commun, appelé par la troisième tâche:

| Tâche | Ce qu'elle fait |
|---|---|
| Décider (parcours, empreinte du contenu, images déjà rangées) | choisit le parcours selon l'évènement et la branche, calcule l'empreinte, regarde dans Harbor l'image `contenu-<empreinte>` de chaque service |
| Construire l'image et la ranger dans Harbor (une seule fois) | seulement à l'envoi sur `test`, et seulement si l'image manque: construire, contrôler l'image exacte (commande de l'application), ranger |
| Sécurité: lecture des failles par Trivy (informe, ne bloque pas) | seulement quand une image est construite pour `test`: le nombre de failles par niveau va dans le résumé (A42) |
| Mettre en ligne et vérifier la santé | à l'envoi sur `test` ou sur `main`: poser l'étiquette de l'image sur l'application Coolify `<application>-<environnement>`, attendre que la machine soit libre, mettre en ligne, suivre, vérifier que l'adresse de santé répond 200, puis noter dans Harbor `en-test-depuis-le-<date>` ou `en-production-depuis-le-<date>` |

**Une tâche en échec arrête tout, et rien n'est mis en ligne.** Prouvé le
04/10/2026: un test volontairement en échec sur une branche d'essai
d'`oscar-test` a sauté toute la construction et la mise en ligne.

## Ce qui se passe à chaque évènement

| Évènement | Vérifications rapides | Tests du code | Construction | Mise en ligne |
|---|---|---|---|---|
| PR vers `test`, ouverte ou mise à jour | oui | oui | non | non |
| Fusion dans `test` | oui | oui | seulement si l'image de ce contenu manque dans Harbor | en test, sauf si cette image y est déjà en ligne et saine |
| PR de `test` vers `main` | oui | **non** | non: « Décider » vérifie que l'image existe et a été mise en ligne en test | non |
| Fusion dans `main` | oui | **non** | non: l'image testée est retrouvée | en production, **la même image**, sauf si elle y est déjà en ligne |

Une PR ne met jamais rien en ligne: elle montre seulement, sur sa page, si les
vérifications réussissent, et son résumé.

**Le contenu de l'application**, c'est son dossier dans le dépôt (décision 62),
sans les fichiers qui n'entrent pas dans l'image: la documentation (`*.md`) et
`catalog-info.yaml` par défaut, et ce que chaque dépôt y ajoute (le portail:
ses outils du développeur `marque/` et `verifications-ecran/`). Une fusion qui
ne touche que la documentation ne reconstruit rien et ne remet rien en ligne:
l'exécution dit « déjà en ligne ».

**La recette du laboratoire** n'est plus jouée après chaque mise en ligne
(décisions 91 et 98): elle se lance à la main, onglet Actions du dépôt
`oscar-test`, « Recette (laboratoire) », « Run workflow ». Contre la
production, elle ne joue que des scénarios **non destructifs**: ils lisent et
vérifient, sans créer, modifier ni supprimer de données réelles.

## Le résumé

Chaque exécution le pose sur sa page (onglet Actions, l'exécution) et, pour
une PR, dans **un seul commentaire** mis à jour à chaque exécution:
« Vérifications automatiques: le résumé ». Il dit chaque tâche (réussie, en
échec, sautée), l'image (`contenu-...`), si elle a été construite cette fois
ou était déjà rangée, les failles lues par Trivy, la mise en ligne et la santé
vérifiée, ou pourquoi rien n'a été mis en ligne, et la durée.

## Le contrôle de passage par test

L'organisation GitHub est au plan gratuit. Sur un dépôt privé, ce plan ne
permet pas de protéger `main`: n'importe qui ayant le droit d'écrire peut y
envoyer un commit. Joel a choisi de ne pas prendre de compte payant pour
l'instant: passer par `test` avant `main` est **une règle de conduite de
l'équipe** (décision 63).

Depuis le 4 octobre 2026, ce contrôle tient à l'image elle-même. La
production ne lance que l'image `contenu-<empreinte>` du contenu de `main`; or
cette image n'existe que si ce contenu a été construit à l'envoi sur `test`.
**Si elle manque, « Décider » refuse net et rien n'est mis en ligne en
production**: `main` porterait autre chose que ce qui a été testé. La PR de
`test` vers `main` le vérifie déjà, et exige en plus que l'image ait été mise
en ligne en test (une étiquette `en-test-depuis-le-...`). Un tel refus veut
dire qu'une règle a été enfreinte: on prévient Joel et on rédige l'incident.

## La mise en ligne, écrite une seule fois

La tâche « Construire, ranger et mettre en ligne » n'est pas écrite trois
fois. C'est **le déploiement automatique commun**: un seul workflow
réutilisable (un fichier de GitHub Actions qu'un autre dépôt appelle),
`.github/workflows/deploiement-par-image-harbor.yml`, rangé dans le dépôt
`oscar-infrastructure`, avec son action. Les noms des images et des étiquettes
y sont calculés et testés une fois.

- **Un seul déploiement à la fois** sur la machine: la mise en ligne attend
  que Coolify n'ait aucun autre déploiement en cours (une heure au plus).
- **La santé réelle**: après la fin de la mise en ligne, l'adresse de santé
  doit répondre 200 (cinq minutes au plus par défaut; dix pour le portail,
  plus lent à démarrer). Coolify arrête l'ancienne version avant de démarrer
  la nouvelle: une réponse 200 vient donc de la nouvelle.
- **Une image illisible** (étiquette absente, Harbor injoignable) fait échouer
  la mise en ligne au téléchargement, **avant** l'arrêt de l'ancienne version,
  qui reste en service.

La mise en ligne est déclarée à GitHub dans l'environnement
`<application>-<environnement>` du dépôt (`outil-dns-test`,
`portail-production`...), avec l'adresse du site: on la voit dans la page
Deployments du dépôt. Chaque environnement porte la variable
`COOLIFY_APPLICATION`, l'identifiant de l'application Coolify du même nom
(décision A21): aucun identifiant n'est écrit dans les fichiers des
vérifications automatiques. Les images se rangent avec un compte de Harbor
réservé à GitHub, par deux secrets de chaque dépôt, `HARBOR_COMPTE_ENVOI_NOM`
et `HARBOR_COMPTE_ENVOI_SECRET`.

**Relancer une exécution**: l'exécution lancée à la main (« Run workflow ») a
disparu le 04/10/2026. Pour relancer après un échec extérieur au code
(réseau, GitHub, Harbor), on rejoue l'exécution: onglet Actions, l'exécution,
« Re-run failed jobs ». Une image déjà rangée n'est pas reconstruite.

Le déclenchement automatique de Coolify, qui mettrait en ligne à chaque envoi
sur une branche, est **coupé** pour chaque application: c'est la règle.
Coolify ne met en ligne que quand les vérifications automatiques le lui
demandent, par son API.

**Pourquoi.** Quand Coolify déployait tout seul à chaque envoi, trois envois
dont les tests étaient en échec sont partis en production: les vérifications
automatiques et Coolify ne se parlaient pas (incident `INC-2026-09-25-02`).

## Ce qui est sorti du parcours automatique

Le 4 octobre 2026 (décision 91), ces vérifications sont devenues des outils du
développeur, à lancer à la main avant de toucher à ce qu'elles gardent: la
recette du laboratoire après chaque mise en ligne, la vérification des
schémas, la fabrication des images de marque, le contrôle à l'écran du
portail, les tests de l'accueil et de la charte du portail. Les pages des
applications disent comment les lancer.

## Comment on sait que les vérifications automatiques marchent

On le prouve en leur envoyant **exprès** un changement qui doit échouer, et en
constatant qu'il n'est pas mis en ligne. Voir un changement correct aller
jusqu'à la production ne prouve rien: il y serait allé aussi sans elles. Et
deux morceaux prouvés séparément ne font pas un ensemble prouvé (leçon 5.2 de
`LECONS-A-RESPECTER.md`).

Après tout déplacement de dossier ou de dépôt, on vérifie dans l'onglet Actions
que les vérifications automatiques **tournent** réellement, pas seulement que
leur fichier existe. GitHub ne lit ce fichier qu'à la racine du dépôt, dans
`.github/workflows/` (leçon 4.3).

## Où en sont les vérifications de chaque dépôt

Dans le tableau d'[où en est le cycle](02-le-cycle-pas-a-pas.md#ou-en-est-le-cycle-aujourdhui), tenu à un seul endroit pour ne
jamais se contredire d'une page à l'autre.
