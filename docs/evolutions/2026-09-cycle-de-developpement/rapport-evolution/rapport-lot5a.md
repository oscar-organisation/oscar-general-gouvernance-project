# Lot 5a. La preuve de bout en bout: l'outil DNS et le laboratoire

26 septembre 2026. Plan: `_pilotage/11-PLAN-cycle-de-developpement-des-trois-applications.md`.
Le test que Joel peut rejouer lui-même est dans [`test-manuel-lot5a.md`](test-manuel-lot5a.md).
Le portail suivra au lot 5b, une fois le lot 4 terminé.

---

## 1. Ce que Joel a demandé

Pouvoir « juste cloner et suivre le cycle » avec la documentation; que le
cycle marche sans le dossier `code/` (décision 60); que tout soit reproductible
sur un autre serveur.

## 2. Comment

Un agent, lancé le 26/09 vers minuit UTC, a joué le rôle d'un nouveau venu: il
a cloné les dépôts **hors de `code/`**, n'a suivi que la documentation, et a
noté chaque écart avec la réalité au moment où il le rencontrait. `code/` n'a
été ni lu pour travailler, ni modifié. L'orchestrateur a revérifié chaque
livraison: passes GitHub, versions en service, adresses, tests relancés sur une
copie propre de `main`.

## 3. Le cycle suivi par un nouveau venu

| | Outil DNS | Laboratoire |
|---|---|---|
| En local, en suivant le guide | démarrage sain, 515 tests, charte respectée, le laboratoire contre l'outil local: 33 sur 33 | image construite en 11 min 30 s, les nombres du guide exacts, 33 sur 33 |
| La vraie correction trouvée | l'en-tête de `compose.yaml` disait les ports publiés; ils ne le sont qu'en local | une consigne de `compose.yaml` sur `LABO_UID` rendait la suite rouge si on la suivait |
| Et la documentation | guide local v1.1, `LISEZ-MOI.md` du dépôt « Cloner, lancer, tester » | durée réelle de construction (le guide disait 3 minutes) |
| Vers `test` | PR 12, passe `36206269653`, recette verte | PR 9, passe `36208720004`, recette verte |
| Vers `main` | PR 15, passe `36208857345`, aucun avertissement, recette verte | PR 12, passe `36213154622`, recette verte |
| En production | commit `fc9f669` | commit `dfe4244` |

## 4. Le cycle tourne sans `code/`

- **Le développement n'en a pas besoin**: les deux cycles, et les PR de la
  chaîne commune du lot, ont été menés depuis des clones neufs hors de `code/`,
  jusqu'en production.
- **Le serveur n'en dépend pas** (mesuré à 00h18 et 03h36, revérifié par
  l'orchestrateur): aucun des 15 conteneurs déployés par Coolify ne monte
  `code/`; aucune tâche planifiée, aucun service, aucun fichier
  d'`exploitation/`, aucun réglage de Coolify (lu par son API) n'y renvoie.
  Seul le portail lancé en local par l'agent du lot 4 monte `code/`: c'est du
  développement, rien de déployé n'en dépend.

## 5. Le retour arrière, éprouvé en test

| Voie | Outil DNS | Laboratoire |
|---|---|---|
| **Normale**: `git revert` dans une branche de travail, par le cycle | PR 13: **6 min 37 s** de la fusion à la fin de la recette; rétabli par PR 14 | PR 10, rétablie par PR 11 |
| **Urgence**: la route de retour arrière de Coolify, sans passer par GitHub | **103 s**, site sain à 110 s; retour en 105 s | **83 s**, sain à 102 s; retour en 83 s |

Les procédures `revenir-en-arriere.md` de chaque application sont réécrites
d'après ces mesures, dans `exploitation/`.

## 6. La chaîne commune rendue plus sûre

Le lot a trouvé trois faiblesses de la chaîne commune, et les a corrigées à la
source, par le cycle, tests d'abord:

- **Elle ne voyait pas un retour d'urgence.** Elle croyait en service le
  dernier déploiement déclaré à GitHub, et aurait répondu « rien à déployer »
  alors que Coolify servait une version plus ancienne. Désormais elle compare à
  **ce que Coolify fait réellement tourner**; un écart donne un avertissement,
  et elle redéploie. Démontré: un retour d'urgence exprès sur `outil-dns-test`,
  puis la passe `36213976649` avertit « Coolify sert en test le commit
  8029a0172de0, alors que GitHub déclare f2ddfcd7e7ad » et redéploie.
- **L'attente de la file était trop courte**: 30 min, quand la construction à
  froid du portail en a pris 41. Désormais 60 min par défaut, réglable.
- **Un changement de la chaîne pendant une passe la cassait**: GitHub lit le
  workflow commun à la création de la passe, et son action au démarrage de la
  tâche. Une passe du portail a échoué ainsi (INC-2026-09-26-02). L'action
  accepte désormais aussi l'ancien contrat, et la règle des « deux temps » est
  écrite dans `.github/LISEZ-MOI.md`.

67 tests pour la chaîne commune (48 au lot 2), revérifiés sur `main`.

## 7. La reproduction sur un serveur neuf

- `_pilotage/06-REPRODUIRE-SUR-UN-SERVEUR-NEUF-v1.2.md`: la réalité
  d'aujourd'hui, dans l'ordre (arborescence, `secret_root/` fichier par fichier,
  `exploitation/`, DNS générique, Coolify, GitHub, les six applications par
  l'assistant, leurs variables, les premiers déploiements, les vérifications),
  et vingt pièges connus.
- La notice d'installation de l'outil DNS passe en v1.4, rejouée depuis un
  clone neuf (étapes 2 à 6).
- **Les certificats**: trois documents de la plateforme disaient un
  certificat générique obtenu par DNS-01. Mesuré: Traefik obtient un
  certificat par nom, par HTTP-01. Versions nouvelles écrites.
- **Non éprouvé sur une machine neuve**: faute de serveur libre, chaque étape
  le dit.

## 8. Les écarts entre la documentation et la réalité

- **Dans le guide commun**, douze écarts (G1 à G12), transmis au lot 4, qui
  tient le guide. Presque tous venaient de tableaux « État au 25 septembre »
  recopiés sur plusieurs pages: le guide n'a plus qu'un tableau d'état (A32).
- **Corrigés dans les dépôts**: l'outil DNS, le laboratoire, la chaîne commune.
- **Corrigés dans `exploitation/`**: les procédures de retour arrière, de mise
  à jour et de vérification, la notice de l'outil DNS, trois pages de Coolify.
- **Restent**: `verifier.md` de l'outil DNS lance l'assistant avec le Python de
  la machine, contraire à « Docker seulement »; `LISEZ-MOI-DABORD.md` place les
  sauvegardes dans un ancien dossier.

## 9. Les décisions et les incidents

Décision A33 (les choix du lot), dans `_pilotage/14-DECISIONS-AUTONOMES.md`.
Incident INC-2026-09-26-02 (une fusion de la chaîne commune arrête une passe
déjà en route), résolu.

## 10. Ce qui reste

| Reste | Où |
|---|---|
| La même preuve sur le portail | lot 5b |
| Rejouer la reproduction sur une vraie machine neuve | à décider avec Joel |
| Retirer le repli de l'action (troisième des « deux temps ») | plus tard |
| Le délai d'un déploiement Coolify (45 min), à peine au-dessus des 41 min mesurées | à surveiller |
| Les deux écarts restants du point 8 | prochain lot |
