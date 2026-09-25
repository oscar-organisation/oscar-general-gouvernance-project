#!/bin/sh
# Fabrique les images SVG des schemas du guide a partir de leurs sources
# Mermaid, ou verifie que les images du depot correspondent a leurs sources.
#
# Ce script tourne DANS le conteneur de Mermaid, lance par compose.yaml, a
# cote de lui. On ne le lance pas sur son poste: il y faudrait Node et un
# navigateur, et on n installe rien en dehors de git et Docker.
#
# POURQUOI DES IMAGES
#
# GitHub sait dessiner un schema Mermaid ecrit dans une page, mais le lecteur
# de documentation de Backstage (TechDocs) ne le sait pas. Une image SVG
# s affiche partout de la meme facon. On ecrit donc le schema en Mermaid, la
# source fait foi, et l image est fabriquee ici. Elle ne se retouche jamais a
# la main: on corrige la source, puis on relance ce script.
#
# DEUX USAGES
#
#   schemas.sh generer    refait chaque image a cote de sa source
#   schemas.sh verifier   refait les images dans un dossier a part, et echoue
#                         si une image du depot ne correspond plus a sa source
#
# Les sources et les images sont montees sur /schemas, les outils sur /outils.

set -eu

DOSSIER=/schemas
# Les couleurs de la charte OSCAR et les reglages communs a tous les schemas,
# ecrits une seule fois.
CONFIG=/outils/mermaid-config.json
MODE="${1:-generer}"

# La commande de dessin, telle que l image la lance elle-meme (lue par docker
# image inspect). On la reprend a l identique, avec la configuration du
# navigateur que l image fournit, pour dessiner exactement comme elle le prevoit.
MMDC="/home/mermaidcli/node_modules/.bin/mmdc -p /puppeteer-config.json"

case "$MODE" in
  generer)  SORTIE="$DOSSIER" ;;
  verifier) SORTIE=$(mktemp -d) ;;
  *)
    echo "Usage: schemas.sh generer | verifier" >&2
    exit 2 ;;
esac

SOURCES=0
ECARTS=0

for source in "$DOSSIER"/*.mmd; do
  # Sans aucune source, le motif reste tel quel: rien a dessiner.
  [ -e "$source" ] || continue
  SOURCES=$((SOURCES + 1))
  nom=$(basename "$source" .mmd)

  # Fond blanc: sans lui, l image est transparente, et ses traits sombres
  # disparaissent sur le fond noir du mode sombre de GitHub ou de Backstage.
  $MMDC -q -i "$source" -o "$SORTIE/$nom.svg" -c "$CONFIG" -b white

  if [ "$MODE" = "verifier" ]; then
    if [ ! -f "$DOSSIER/$nom.svg" ]; then
      echo "MANQUE    $nom.svg n existe pas: lancer le service schemas."
      ECARTS=$((ECARTS + 1))
    elif ! cmp -s "$SORTIE/$nom.svg" "$DOSSIER/$nom.svg"; then
      echo "PERIME    $nom.svg ne correspond plus a $nom.mmd: lancer le service schemas."
      ECARTS=$((ECARTS + 1))
    else
      echo "A JOUR    $nom.svg"
    fi
  else
    echo "FABRIQUE  $nom.svg"
  fi
done

# Une image sans source ne peut plus etre refaite: c est qu on l a dessinee
# ou retouchee a la main, ou que sa source a ete supprimee.
for image in "$DOSSIER"/*.svg; do
  [ -e "$image" ] || continue
  nom=$(basename "$image" .svg)
  if [ ! -f "$DOSSIER/$nom.mmd" ]; then
    echo "ORPHELINE $nom.svg n a pas de source $nom.mmd."
    ECARTS=$((ECARTS + 1))
  fi
done

[ "$MODE" = "verifier" ] && rm -rf "$SORTIE"

if [ "$ECARTS" -ne 0 ]; then
  echo "$ECARTS ecart(s) entre les sources et les images." >&2
  exit 1
fi
echo "$SOURCES schema(s), chaque image correspond a sa source."
