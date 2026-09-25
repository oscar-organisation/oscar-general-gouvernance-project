# La chaîne

La chaîne est l'ensemble des vérifications automatiques qui tournent sur GitHub,
dans GitHub Actions, à chaque PR et à chaque fusion. **C'est elle qui déploie,
et elle seule.** Personne ne déploie à la main.

![La chaîne: ses tâches controles, verifs, deploiement et recette, et le contrôle de passage par test avant la production](schemas/04-la-chaine.svg)

Source du schéma: [`schemas/04-la-chaine.mmd`](schemas/04-la-chaine.mmd).

## Ses quatre tâches

Le même patron dans les trois dépôts, dans le fichier
`.github/workflows/chaine.yml`:

| Tâche | Ce qu'elle fait | Durée |
|---|---|---|
| `controles` | cherche des secrets, vérifie la typographie (ni tiret long, ni caractère points de suspension), relit chaque fichier YAML et valide le fichier de composition | moins d'une minute |
| `verifs` | lance les tests propres à l'application, par exemple les tests du code, la construction des images, la charte graphique | selon l'application |
| `deploiement` | seulement après une fusion dans `test` ou dans `main`, et après toutes les autres: demande le déploiement à Coolify et le suit jusqu'au bout | quelques minutes |
| `recette` | joue les scénarios du laboratoire contre ce qui vient d'être déployé | selon l'application |

Chaque tâche attend la précédente. **Une tâche rouge arrête la chaîne**: les
suivantes ne partent pas, et rien n'est déployé.

## Ce qui se passe à chaque événement

| Événement | `controles` | `verifs` | `deploiement` | `recette` |
|---|---|---|---|---|
| PR vers `test`, ouverte ou mise à jour | oui | oui | non | non |
| Fusion dans `test` | oui | oui | en test | tous les scénarios, contre `test-<nom>` |
| PR de `test` vers `main` | oui | oui | non | non |
| Fusion dans `main` | oui | oui | contrôle de passage par `test`, puis en production | scénarios non destructifs, contre `<nom>` |

Une PR ne déploie jamais rien: elle montre seulement, sur sa page, si le
changement passe les vérifications.

Contre la production, la recette ne joue que des scénarios **non destructifs**:
des scénarios qui lisent et vérifient, sans créer, modifier ni supprimer de
données réelles.

## Le contrôle de passage par test

L'organisation GitHub est au plan gratuit. Sur un dépôt privé, ce plan ne
permet pas de protéger `main`: n'importe qui ayant le droit d'écrire peut y
envoyer un commit. Joel a choisi de ne pas prendre de compte payant pour
l'instant: passer par `test` avant `main` est **une règle de conduite de
l'équipe** (décision 63).

La chaîne vérifie que cette règle a été suivie. Avant de déployer en
production, elle regarde si le contenu du commit de `main` est exactement celui
d'un commit de `test` déployé avec succès en test. Le contenu, ce sont les
fichiers, pas l'identifiant du commit: la fusion d'une PR de `test` vers `main`
crée un commit nouveau, avec les mêmes fichiers.

Si ce n'est pas le cas, **la chaîne ne bloque pas le déploiement: elle le
signale, en clair, dans le résumé de la passe**, pour que l'écart se voie. Un
tel avertissement veut dire qu'une règle a été enfreinte: on prévient Joel et on
rédige l'incident.

Le plan prévoyait d'abord une porte bloquante, « la porte de la production ».
Elle a été rendue non bloquante à la suite de la décision 63. La rendre de
nouveau bloquante ne demande qu'une ligne dans le workflow réutilisable, si
l'équipe le décide.

## Le déploiement, écrit une seule fois

La tâche `deploiement` n'est pas écrite trois fois. C'est **un seul workflow
réutilisable** (un morceau de chaîne qu'un autre dépôt appelle), rangé dans le
dépôt `oscar-infrastructure` et appelé par les trois dépôts. Il:

- choisit l'application Coolify selon la branche: `<application>-test` pour
  `test`, `<application>-production` pour `main`;
- ne lance jamais deux déploiements en même temps sur un même environnement;
- suit **le** déploiement qu'il a demandé, et vérifie que le commit déployé est
  bien celui qui a été vérifié;
- déclare le déploiement à GitHub, avec l'adresse du site, pour qu'on le voie
  dans la page Deployments du dépôt;
- fait le contrôle de passage par `test` avant tout déploiement en production.

Le déclenchement automatique de Coolify, qui déploierait à chaque envoi sur une
branche, est **coupé** pour chaque application: c'est la règle. Coolify ne
déploie que quand la chaîne le lui demande, par son API.

**Pourquoi.** Quand Coolify déployait tout seul à chaque envoi, trois envois
aux tests rouges sont partis en production: la chaîne et Coolify ne se
parlaient pas (incident `INC-2026-09-25-02`).

## Comment on sait qu'une chaîne marche

Une chaîne se prouve en lui envoyant **exprès** un changement rouge, et en
constatant qu'il n'est pas déployé. Voir un changement vert passer ne prouve
rien: il serait passé aussi sans la chaîne. Et deux morceaux prouvés séparément
ne font pas une chaîne prouvée (leçon 5.2 de `LECONS-A-RESPECTER.md`).

Après tout déplacement de dossier ou de dépôt, on vérifie dans l'onglet Actions
que la chaîne **tourne** réellement, pas seulement que son fichier existe. Un
fichier de chaîne n'est lu qu'à la racine du dépôt, dans `.github/workflows/`
(leçon 4.3).

## État au 25 septembre 2026

| Dépôt | Chaîne | Ce qu'elle fait |
|---|---|---|
| `oscar-infrastructure` (outil DNS) | `.github/workflows/verifications.yml` | sur chaque PR vers `main` et chaque envoi sur `main`: secrets, documentation, tests Python, charte graphique, construction des images. Après un envoi sur `main`, et seulement si tout est vert, déploie `outil-dns-production`. Prouvée par un envoi rouge retenu |
| `oscar-test` (laboratoire) | aucune | |
| `oscar-general-gouvernance-project` (portail) | aucune | |

Le workflow réutilisable de déploiement, la branche `test` et le contrôle de
passage par `test` naissent au lot 2, avec l'outil DNS, première application à
s'en servir. Le laboratoire et le portail les reprennent tels quels, aux lots 3
et 4.
