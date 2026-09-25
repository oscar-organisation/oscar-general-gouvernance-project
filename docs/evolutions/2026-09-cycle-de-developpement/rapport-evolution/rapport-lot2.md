# Lot 2. La chaîne commune, et l'outil DNS

25 septembre 2026. Plan: `_pilotage/11-PLAN-cycle-de-developpement-des-trois-applications.md`.
Le test que Joel peut rejouer lui-même est dans [`test-manuel-lot2.md`](test-manuel-lot2.md).

---

## 1. Ce que Joel a demandé

Que le cycle complet marche, et soit prouvé, d'abord sur l'outil DNS: travail
en local, envoi, déploiement automatique en test sur `test-<nom>.oscar-bot.com`,
PR, fusion vers `main`, déploiement automatique en production, site vivant
(décisions 56 et 57). Que tout se surveille sur GitHub et sur Coolify. Que le
passage par `test` soit une règle de conduite, pas un blocage (décision 63).

La chaîne commune, qui servira aussi au laboratoire et au portail, naît ici,
sur l'outil DNS (A13).

## 2. Comment

Un agent, lancé le 25/09 à 15h10 UTC, sur le dépôt `oscar-infrastructure` et
l'exploitation de l'outil DNS. Sauvegarde:
`backup/20260925-152641-lot2-chaine-commune-et-outil-dns-test/`, avec toutes
les valeurs d'avant et la façon de revenir en arrière. L'orchestrateur a
revérifié le résultat en relisant l'état: passes GitHub, déploiements,
réglages des dépôts, Coolify, les quatre adresses, et les tests relancés sur une
copie propre de `main`.

Deux gestes n'étaient pas permis au jeton de l'organisation: ouvrir une PR, et
écrire une variable d'environnement GitHub. Joel a élargi le jeton pour les PR
(J2); les variables sont posées par l'orchestrateur avec un autre jeton (A21).

## 3. Ce que permet le plan gratuit de GitHub, mesuré

| Question | Réponse mesurée |
|---|---|
| Un dépôt privé peut-il partager ses workflows avec les autres dépôts de l'organisation? | oui, par le réglage « organization », posé sur `oscar-infrastructure` et relu |
| Les environnements GitHub? | oui; seule la minuterie est refusée (« billing plan ») |
| L'API Deployments? | oui |
| Les secrets et variables d'organisation pour des dépôts privés? | non: chaque dépôt porte les siens |
| La protection de `main`? | non (« Upgrade to GitHub Pro »): d'où la porte non bloquante |

## 4. La chaîne commune

Dans `oscar-infrastructure/.github/`:

```
workflows/deployer.yml                  le déploiement commun, appelé par chaque dépôt
actions/deployer-sur-coolify/           son script, testé
actions/controler-les-commits/          le refus des lignes d'attribution (A18)
LISEZ-MOI.md                            la notice, et « Préparer une nouvelle application »
```

Un dépôt l'appelle avec une ligne,
`uses: oscar-organisation/oscar-infrastructure/.github/workflows/deployer.yml@main`,
et lui donne le nom de l'application, **le dossier de l'unité déployable**, les
adresses des sites et de leur santé. Rien de propre à l'outil DNS n'y est écrit.

Ce qu'elle fait, en deux tâches:

| Tâche | Ce qu'elle fait |
|---|---|
| `preparer` | choisit l'environnement selon la branche (`test` vers test, `main` vers production); calcule l'empreinte du contenu du dossier, hors `*.md`; s'il est déjà en service, s'arrête sur « rien à déployer »; en production, applique la porte |
| `deployer` | s'attache à l'environnement GitHub `<application>-<environnement>`, qui déclare le déploiement avec l'adresse du site; lit l'identifiant de l'application Coolify dans sa variable `COOLIFY_APPLICATION`; attend que la file de déploiement de la machine soit vide; suit **le** déploiement qu'il a demandé; annule et échoue si Coolify construit un autre commit que celui vérifié; vérifie la santé du site; écrit le résumé de la passe |

**La porte de la production** compare le contenu du dossier à celui qui est en
service en test, pas les commits: une fusion par commit de fusion (A19) crée un
commit neuf avec les mêmes fichiers. Si le contenu n'est pas passé par test,
elle le signale par un avertissement et dans le résumé, et déploie quand même
(A11). La rendre bloquante tient en une ligne.

**Pourquoi des actions composites.** C'est le seul moyen prévu par GitHub pour
qu'un workflow appelé depuis un autre dépôt privé emporte son script, sans poser
de clé de lecture partout. Leur logique, environ 250 lignes, est testée: dans
un bloc de YAML, elle ne le serait pas.

**48 tests**, vus échouer avant d'écrire le code; des mutations de la porte, du
contrôle du commit, de « rien à déployer » et du refus des attributions ont
toutes été prises. Les workflows passent actionlint sans remarque.

## 5. La chaîne de l'outil DNS

`.github/workflows/chaine.yml` remplace `verifications.yml`:

| Tâche | Contenu |
|---|---|
| `controles` | refus des lignes d'attribution; secrets et fichiers d'exemple; versions de la documentation; typographie des fichiers suivis; workflows (actionlint); composition, lue avec et sans `compose.override.yaml` |
| `verifs` | les tests de l'outil DNS, ceux de la chaîne commune, la charte de l'interface, la construction des deux images |
| `deploiement` | par la chaîne commune, sur les envois vers `test` et `main`; jamais sur une PR |
| `recette` | sa place est écrite; elle se branche au lot 3b (A17) |

Réglages posés sur les trois dépôts: seul le commit de fusion est permis (A19).

## 6. L'outil DNS en test

| | Test | Production |
|---|---|---|
| Application Coolify | `outil-dns-test` | `outil-dns-production` |
| Branche | `test` | `main` |
| Adresses | `test-dns`, `test-api-dns` | `dns`, `api-dns` |
| Environnement GitHub | `outil-dns-test` | `outil-dns-production` |
| `OSCAR_ENVIRONNEMENT` | `test` | `production` |
| Variables OVH | **aucune** | celles du fournisseur |

L'application de test a été créée par l'assistant de déploiement, pas à la
main. L'assistant a été complété (419 tests, puis 464): un champ `VARIABLES`;
deux règles posées sur toute application, déclenchement automatique coupé et
variables non recopiées dans les Dockerfile; le refus d'une variable OVH sur
une application de test. `configurer-coolify.sh` ne fait plus que vérifier: un
seul outil écrit dans Coolify.

## 7. Le contrôle OVH

En test, l'outil DNS **refuse de démarrer** s'il reçoit une variable dont le nom
contient `OVH`: message clair, qui nomme les variables sans jamais afficher leur
valeur, et code de sortie 1. 21 tests. Revérifié par l'orchestrateur dans un
vrai conteneur.

Sans identifiants OVH, l'outil de test marche normalement et n'écrit dans aucune
zone: aucune de ses routes n'instancie un vrai fournisseur. Son interface est
utilisable pour la recette.

## 8. Le temps de déploiement

Mesuré sur le déploiement de production du lot 1 (13 min 23 s): `npm ci`
226 s, `next build` 82 s, et surtout 347 s pour mettre en image l'interface,
une image de 1,33 Go.

| Correction | Effet |
|---|---|
| Image de l'interface en trois étapes, avec le serveur autonome de Next | 1,33 Go vers **384 Mo**; mise en image 384 s vers 48 s |
| Variables de l'application plus recopiées dans les Dockerfile | test et production partagent leur cache de construction |

| Mesure | Avant | Après |
|---|---|---|
| Déploiement de production | 13 min 23 s | **3 min 47 s** (juste après le test, cache repris) |
| Premier déploiement de test, à froid | | 10 min 41 s, sous forte charge |

Coolify vide tout son cache de construction chaque nuit: le premier
déploiement du jour reste à froid, et `npm ci` (250 à 280 s) y pèse le plus.

## 9. La preuve du cycle complet

| Étape | Preuve |
|---|---|
| PR 4, d'une branche de travail vers `test` | passe `36166723645` verte, aucun déploiement |
| Fusion dans `test` | passe `36166961529`: `outil-dns-test` construit le commit `284a1cb`; déploiement GitHub `6666398080` « success », `https://test-dns.oscar-bot.com` |
| PR 5, de `test` vers `main` | passe `36168567434` verte |
| Fusion dans `main` | passe `36168799255`: `outil-dns-production` construit `7001d74`; déploiement GitHub `6666706525` « success », `https://dns.oscar-bot.com`; la porte dit « passé par test », aucun avertissement |
| La porte avertit | passe à la main, à blanc, `36169751593`, sur une branche d'essai: avertissement, déploiement sauté, production inchangée |
| « Rien à déployer » | PR 6 à 9: « déjà en service en test », puis « en production » |
| Refus d'une ligne d'attribution | passe `36163480721` rouge sur un commit d'essai, qui nomme le commit et la ligne |

Revérifié par l'orchestrateur: les passes, les deux déploiements GitHub, les
branches (`main` et `test` seules), les réglages de fusion des trois dépôts,
Coolify, et les quatre adresses (santé `"etat":"pret"` et écran 200, en test et
en production). **515 tests** de l'outil DNS (494 avant) et 48 de la chaîne
commune, relancés sur une copie propre de `main`.

## 10. Le reste corrigé

- Les fichiers de consignes que Next écrit à chaque `next dev`, dont l'un porte
  le nom d'un outil d'IA, étaient versionnés depuis le 23/09: retirés, et Next
  réglé pour ne plus les écrire (`agentRules: false`) (INC-2026-09-25-18).
- Le README et le Dockerfile de l'interface disent vrai: la construction ne
  vérifie plus la charte depuis le 24/09.
- Un guide de développement local pour l'outil DNS,
  `oscar_infra_dns/docs/GUIDE-developpement-local-v1.0.md`, qui renvoie au guide
  commun sans le recopier; la consigne de l'agent de l'outil en v1.2.

## 11. Les décisions

Dans `_pilotage/14-DECISIONS-AUTONOMES.md`: A18 (refus des lignes
d'attribution par la chaîne), A19 (commit de fusion), A21 (un environnement
GitHub par application et par environnement), A28 (les choix de la chaîne
commune), A29 (d'anciennes consignes qui nomment l'outil d'IA pour l'interdire
restent telles quelles).

## 12. Les incidents du lot

| Incident | Ce qui s'est passé | Statut |
|---|---|---|
| INC-2026-09-25-18 | les fichiers de consignes générés par Next entrés dans le dépôt | résolu |
| INC-2026-09-25-23 | un message de commit annonçait une correction pas encore éprouvée | résolu |
| INC-2026-09-25-24 | un conteneur d'essai resté en marche six minutes | résolu |
| INC-2026-09-25-25 | un `git add -A` dans la copie partagée des incidents a emporté les rapports d'autres agents; rendus sans les toucher | résolu |

## 13. Ce qui reste

| Reste | Où |
|---|---|
| Le guide commun à aligner sur la chaîne construite (`05-la-chaine.md`, « État au 25 septembre », page de l'outil DNS) | lot 4 |
| La recette par le laboratoire dans la chaîne de l'outil DNS | lot 3b |
| Deux scénarios de la recette ont échoué sur l'envoi du formulaire, contre l'interface de test fraîchement reconstruite: cause en cours d'analyse | lot 3b, puis l'outil DNS |
| Le retour arrière d'un déploiement | lot 5 |
| Un déploiement à froid, de nuit, jamais mesuré; le cache de `npm ci`, perdu chaque nuit | plus tard |
| Restreindre l'environnement `outil-dns-production` à la branche `main` (possible au plan gratuit) | plus tard |
| Écrire les variables d'environnement GitHub demande un autre jeton que celui de l'organisation | Joel, s'il le souhaite |
