# Les images de marque du portail

Le symbole d'OSCAR, tel que le portail l'affiche, et l'icône d'application.
Tout vient de la charte graphique officielle d'OSCAR, donnée par Joel
(`~/OSCAR-PROJECT/Branding oscar/` sur la machine du projet).

## La source

`source/oscar-symbole-blanc.png` est recopié **tel quel** de la charte, fichier
`PNG sans fond/oscar-symbole-blanc.png` (empreinte SHA-256 commençant par
`89f38f219076`). Il ne se retouche jamais: la charte interdit de recolorer, de
déformer ou d'ombrer le logo.

Seul le symbole est employé. Les couleurs de chaque logo de la charte ont été
mesurées le 25/09/2026, sur les pixels du cœur du carré d'accent, en écart de
couleur Delta E 2000 (moins de 2: invisible à l'œil):

| Fichier de la charte | Orange du carré | Écart | Retenu |
|---|---|---|---|
| `oscar-symbole-blanc.png` | `#DB5A15` | 0,9 | oui |
| `oscar-symbole-noir.png` | `#DB5A15` | 0,9 | non: son noir mesure `#171717`, écart 2,3 avec `#1B1D1E` |
| `oscar-logo-horizontal-blanc.png` | `#C86A34` | 5,4 | non |
| `oscar-logo-horizontal-noir.png` | `#CE753D` | 7,7 | non |
| `oscar-logo-vertical-blanc.png` | `#CC713B` | 6,7 | non |
| `oscar-logo-vertical-noir.png` | `#C7723E` | 7,5 | non |

Les logos complets (horizontal et vertical) portent un orange visiblement plus
pâle que l'Orange Signal `#D85810`: ils ne sont pas employés tant que la charte
n'en fournit pas une version juste. Le menu du portail montre donc le symbole
et le nom « OSCAR » écrit en Space Grotesk, en majuscules espacées, comme
l'en-tête de la charte elle-même.

## Ce qui est fabriqué

| Fichier | Taille | Où il sert | Qui l'emploie |
|---|---|---|---|
| `packages/app/src/marque/oscar-symbole-blanc-56.png` | 56 px de haut | le haut du menu, affiché à 28 px (double densité) | `packages/app/src/modules/nav/SidebarLogo.tsx` |
| `packages/app/src/marque/oscar-symbole-blanc-96.png` | 96 px de haut | la page d'accueil « Commencer ici », dans son bandeau sombre, affiché à 48 px (double densité) | `packages/app/src/modules/accueil/CommencerIci.tsx` |
| `packages/app/src/marque/oscar-icone-96.png` | 96 px | la page de connexion, devant son titre, affichée à 48 px (double densité) | `packages/app/src/modules/connexion/index.tsx` |
| `packages/app/public/favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png` | 16, 32, 48 px | l'onglet du navigateur | les trois références `rel="icon"` de `packages/app/public/index.html` |
| `packages/app/public/apple-touch-icon.png` | 180 px | l'écran d'accueil d'un iPhone | la référence `rel="apple-touch-icon"` de `packages/app/public/index.html` |
| `packages/app/public/android-chrome-192x192.png`, `-512x512.png` | 192, 512 px | l'écran d'accueil Android | le manifeste, `packages/app/public/manifest.json` |

Aucun autre fichier du portail n'emploie ces images.

**La page de connexion montre l'icône d'application**, devant son titre « Se
connecter au portail technique », par le réglage que la page de connexion de
Backstage prévoit pour remplacer son titre (`titleComponent`). C'est la forme
du logo que la charte donne pour les interfaces numériques; le symbole blanc
seul ne va que sur fond sombre, et cette page est sur le papier en thème
clair. L'icône y est décorative: le nom « OSCAR » est déjà écrit dans le
bandeau de la page.

L'icône d'application est celle que montre la charte: le symbole blanc, à 62 %
de la largeur, sur un carré Noir OSCAR `#1B1D1E` aux coins arrondis (26 px pour
110 px). La charte dessine ce carré avec un léger dégradé; il est ici plein, en
Noir OSCAR, pour n'employer que les couleurs de la palette.

## Refaire les images

Depuis le dossier `oscar_backstage/`, avec Docker et rien d'autre:

```
docker compose -f marque/compose.yaml run --rm fabriquer
```

**Ce qu'on doit voir**: une ligne `FABRIQUE` par fichier de marque. Une image fabriquée ne
se retouche jamais à la main: on change `fabriquer.py`, puis on relance.

## Vérifier que les images correspondent

```
docker compose -f marque/compose.yaml run --rm verifier
```

**Ce qu'on doit voir**: une ligne `A JOUR` par fichier de marque, et le code de sortie 0.
Sinon, une ligne `PERIME` ou `MANQUE` nomme le fichier en cause, et le code de
sortie est 1. Cette commande n'écrit rien; la chaîne du dépôt la lance à
chaque passe.

## Les adresses des icônes

Le générateur tient aussi les adresses qui citent les icônes, et leur ajoute
un paramètre `v`: les douze premiers caractères du SHA-256 du fichier cité.

| Où | Ce qui porte l'empreinte |
|---|---|
| `packages/app/public/index.html` | les trois références `rel="icon"`, la référence `rel="apple-touch-icon"`, et le lien du manifeste |
| `packages/app/public/manifest.json` | les deux icônes, `android-chrome-192x192.png` et `-512x512.png` |

Une modification d'image change ainsi son adresse, pour que le navigateur
récupère la nouvelle icône. Le manifeste change avec ses icônes: son adresse
change donc aussi. C'est nécessaire, pas une précaution: le portail laisse le
navigateur revalider ces fichiers, mais l'étiquette qu'il renvoie pour cela
ne dépend que de la taille du fichier (relevé le 28/09/2026 en test et en
production: `ETag: W/"<taille>-0"`). Une image changée de même taille
passerait pour inchangée. Les fichiers PNG et ICO gardent leur nom habituel
et restent fabriqués depuis le symbole officiel.

Ces paramètres ne se corrigent pas à la main: lancer `fabriquer`, puis
`verifier`. Une référence absente, dupliquée ou portant une ancienne empreinte
fait échouer le contrôle; une icône du manifeste que le générateur ne fabrique
pas, ou qu'il ne trouve pas, arrête la fabrication. Le reste de la page et du
manifeste reste écrit à la main.

## Tester le générateur

```
docker compose -f marque/compose.yaml run --rm tester
```

**Ce qu'on doit voir**: `OK` après la liste des tests, et le code de sortie 0.
Les tests (`test_fabriquer.py`) partent d'une page et d'un manifeste sans
empreinte, et vérifient que chaque adresse reçoit la bonne, recalculée à
part; ils vérifient aussi chaque refus, et l'icône de la page de connexion.
Ils n'écrivent rien; la chaîne du dépôt les lance à chaque passe.
