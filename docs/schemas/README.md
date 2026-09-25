# Les schémas du guide

Les schémas de flux du guide, leur source, et la façon de les refaire.

## Ce qu'il y a ici

Chaque schéma a deux fichiers, côte à côte: sa **source**, écrite en Mermaid
(`.mmd`), et son **image**, fabriquée à partir de la source (`.svg`).

| Schéma | Source | Image | Page qui l'affiche |
|---|---|---|---|
| La vue d'ensemble | [`01-vue-d-ensemble.mmd`](01-vue-d-ensemble.mmd) | [`01-vue-d-ensemble.svg`](01-vue-d-ensemble.svg) | [Commencer ici](../README.md) |
| Le trajet d'une modification | [`02-trajet-d-une-modification.mmd`](02-trajet-d-une-modification.mmd) | [`02-trajet-d-une-modification.svg`](02-trajet-d-une-modification.svg) | [Le cycle pas à pas](../02-le-cycle-pas-a-pas.md) |
| Les branches | [`03-les-branches.mmd`](03-les-branches.mmd) | [`03-les-branches.svg`](03-les-branches.svg) | [Le cycle pas à pas](../02-le-cycle-pas-a-pas.md) |
| La chaîne | [`04-la-chaine.mmd`](04-la-chaine.mmd) | [`04-la-chaine.svg`](04-la-chaine.svg) | [La chaîne](../05-la-chaine.md) |
| Les environnements | [`05-les-environnements.mmd`](05-les-environnements.mmd) | [`05-les-environnements.svg`](05-les-environnements.svg) | [Les environnements](../04-les-environnements.md) |
| Quand la chaîne est rouge | [`06-quand-la-chaine-est-rouge.mmd`](06-quand-la-chaine-est-rouge.mmd) | [`06-quand-la-chaine-est-rouge.svg`](06-quand-la-chaine-est-rouge.svg) | [Comment se comporter](../03-comment-se-comporter.md) |

**La source fait foi. L'image ne se retouche jamais à la main**: on corrige la
source, puis on refait l'image par la commande ci-dessous.

## Pourquoi des images, et pas du Mermaid seul

Les schémas doivent s'afficher à deux endroits: **sur GitHub**, et **dans le
portail Backstage**, par TechDocs, son lecteur de documentation (Backstage 1.55,
qui construit la documentation lui-même, réglage `runIn: local`).

Quatre façons de faire ont été étudiées le 25 septembre 2026, en lisant le code
des paquets de TechDocs employés par le portail
(`@backstage/plugin-techdocs` 1.18.2, `@backstage/plugin-techdocs-node` 2.0.0)
et en les essayant en conteneur:

| Façon de faire | Sur GitHub | Dans TechDocs | Verdict |
|---|---|---|---|
| Le Mermaid écrit dans la page | dessiné | **non**: le lecteur de TechDocs ne connaît pas Mermaid, il affiche le texte de la source | écartée |
| Le Mermaid, et un module complémentaire du portail qui le dessine (`backstage-plugin-techdocs-addon-mermaid`, tiers) | dessiné | dessiné, une fois le module ajouté au portail | écartée: un module tiers de plus dans le portail, à suivre à chaque montée de version de Backstage; le dessin se fait dans le navigateur de chaque lecteur; tout autre outil de lecture, comme un éditeur, montre le texte |
| Une extension de MkDocs qui dessine à la construction (Kroki, mermaid2) | selon l'écriture du bloc | **retirée**: TechDocs efface de `mkdocs.yml` toute extension hors d'une courte liste, sauf réglage `dangerouslyAllowAdditionalPlugins`. Kroki demande en plus un service à héberger, ou un service extérieur appelé à chaque construction; mermaid2 dessine par un script, que TechDocs retire de la page | écartée |
| **Une image SVG, fabriquée depuis la source Mermaid, dans un conteneur** | affichée | affichée: le lecteur de TechDocs va chercher les images SVG et les insère dans la page | **retenue** |

**Pourquoi c'est la façon propre et durable.**

- Elle marche partout de la même façon, sans module, sans réglage, sans
  script: GitHub, TechDocs, un éditeur, une page imprimée.
- Le portail n'a rien de plus à installer que ce que TechDocs demande déjà.
- La source reste du texte, lisible et comparable d'une version à l'autre, à
  côté de son image.
- L'outil de dessin est l'image Docker officielle de Mermaid,
  `minlag/mermaid-cli`, à une **version figée**: même dessin sur toutes les
  machines. Rien ne s'installe sur le poste.
- Le dessin est **reproductible à l'octet près**, grâce à un tirage fixé
  (voir « Les réglages communs »): deux fabrications de la même source donnent
  le même fichier. C'est ce qui permet la vérification automatique décrite plus
  bas.

**Ce que ça coûte**, et comment on le tient: deux fichiers par schéma, et le
risque d'oublier de refaire l'image après avoir changé la source. La commande
`verifier-schemas` le détecte: elle refait les images à part et échoue si l'une
d'elles ne correspond plus à sa source. Elle est faite pour tourner dans la
chaîne de ce dépôt, quand elle existera (lot 4).

## Refaire les images

Depuis la racine du dépôt, avec Docker et rien d'autre, sous Linux, macOS ou
Windows:

```
docker compose -f docs/outils/compose.yaml run --rm schemas
```

**Ce qu'on doit voir**: une ligne `FABRIQUE` par schéma, puis
`6 schema(s), chaque image correspond a sa source.` La commande prend environ
deux minutes: chaque schéma est dessiné par un navigateur, dans le conteneur.

Sous Linux, les images sont écrites avec l'identité `1000`, celle du premier
compte d'une machine. Pour une autre identité:
`OSCAR_UID=<uid> OSCAR_GID=<gid> docker compose -f docs/outils/compose.yaml run --rm schemas`.

## Vérifier que les images correspondent aux sources

```
docker compose -f docs/outils/compose.yaml run --rm verifier-schemas
```

**Ce qu'on doit voir**: une ligne `A JOUR` par schéma, et un code de sortie 0.
Sinon, une ligne `PERIME`, `MANQUE` ou `ORPHELINE` nomme le fichier en cause, et
le code de sortie est 1. Cette commande n'écrit rien: le dossier lui est prêté
en lecture seule.

## Ajouter ou modifier un schéma

1. Écrire ou modifier la source `NN-nom.mmd` dans ce dossier. Garder l'en-tête
   de commentaires des autres sources.
2. Refaire les images: commande ci-dessus.
3. **Regarder l'image**, dans un navigateur ou sur GitHub, et pas seulement le
   texte de la source: un schéma se lit en le regardant.
4. L'afficher dans la page par un lien d'image relatif,
   `![ce que montre le schéma](schemas/NN-nom.svg)`, et écrire sous l'image, en
   mots, ce qu'il montre, avec un lien vers sa source.
5. Envoyer la source et l'image dans le même commit.

Le texte sous chaque image n'est pas une redite: il sert à qui ne voit pas
l'image, et c'est lui que la recherche du portail trouve.

## Les réglages communs

Ils sont dans `docs/outils/mermaid-config.json`, écrits une seule fois pour
tous les schémas:

- **les couleurs de la charte OSCAR**: orange `#D85810` pour ce qui demande
  l'attention, encre `#1B1D1E` pour les traits et le texte, fond `#f3f1ec` et
  gris `#6b6b6b` pour les regroupements. Trois styles s'appliquent à un
  élément de schéma par `:::accent` (orange plein), `:::attention` (orange
  clair) et `:::discret` (gris, pointillé);
- **un fond blanc**: sans lui, l'image serait transparente, et ses traits
  sombres disparaîtraient dans le mode sombre de GitHub ou de Backstage;
- **du texte en SVG pur**, sans HTML dans l'image, pour qu'il s'affiche dans
  tous les lecteurs;
- **la police Arial ou Helvetica**, présente partout. Les polices de la charte,
  Manrope et Space Grotesk, ne peuvent pas être chargées par une image SVG.
  Dans le conteneur, le texte est mesuré avec une police plus large, DejaVu
  Sans: les cadres sont donc assez grands pour tous les lecteurs;
- **la taille réelle**: une image s'affiche à sa taille, et se réduit seulement
  si la page est plus étroite;
- **un tirage fixé**, `handDrawnSeed: 1`: Mermaid dessine certaines formes,
  comme les cadres arrondis, avec une part de hasard. Sans tirage fixé, deux
  fabrications de la même source diffèrent, et la vérification échoue à tort
  (constaté le 25 septembre 2026 sur `04-la-chaine` et
  `06-quand-la-chaine-est-rouge`).

**Les images larges dans le portail.** La colonne de texte de TechDocs est plus
étroite que celle de GitHub. Le schéma de séquence, le plus large (1042 pixels),
y est réduit d'environ moitié et son texte devient petit (mesuré le 25 septembre
2026 dans l'aperçu de TechDocs). Le module `LightBox` des extensions officielles
de TechDocs (`@backstage/plugin-techdocs-module-addons-contrib`, déjà dans les
dépendances du portail) permet d'ouvrir une image en grand d'un clic: à activer
au lot 4.

Les deux teintes de fond du schéma de séquence (`rect rgb(...)` dans sa source)
sont les deux fonds de la charte: Mermaid ne permet pas de les prendre dans la
configuration.
