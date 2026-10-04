#!/usr/bin/env bash
# Le controle de l image d execution du portail, avant de la ranger dans
# l entrepot d images d OSCAR (Harbor).
#
# Le deploiement automatique commun le lance depuis ce dossier, contre l image
# exacte qui sera rangee puis mise en ligne (entree controles_des_images des
# verifications automatiques). On peut le lancer soi-meme sur une image
# construite en local:
#
#   ./controler-l-image.sh <image>
#   ./controler-l-image.sh registry-container.oscar-bot.com/oscar/portail-portail:construite-sur-le-poste-du-developpeur
#
# CE QU IL VERIFIE (lecon 3.4: verifier le contenu de l image, pas seulement
# qu elle demarre)
#
#   - les reglages du poste (app-config.poste.yaml), qui ouvrent l acces
#     invite, ne sont pas dans l image;
#   - les reglages lus en test et en production et la structure du catalogue
#     y sont;
#   - MkDocs y repond: le portail construit lui-meme la documentation.
#
# Il ne lance pas le portail, n a besoin d aucun reseau et n ecrit rien. Une
# ligne OK ou ECHEC par point; le code de sortie est 1 au premier ECHEC trouve
# ou plus.
set -euo pipefail

image="${1:-}"
if [ -z "$image" ]; then
  echo "Donner l image a controler: ./controler-l-image.sh <image>" >&2
  exit 2
fi

# Un seul conteneur, sans reseau, qui lit l image de l interieur. Le point
# d entree de l image est remplace par sh: on ne lance pas le portail.
docker run --rm --network none --entrypoint sh "$image" -c '
  echec=0
  if [ -e app-config.poste.yaml ]; then
    echo "ECHEC  app-config.poste.yaml est dans l image: il ouvre l acces invite et ne doit jamais y entrer (Dockerfile, etape execution)."
    echec=1
  else
    echo "OK     app-config.poste.yaml absent"
  fi
  for fichier in app-config.yaml app-config.service.yaml app-config.production.yaml catalogue/organisation.yaml; do
    if [ -f "$fichier" ]; then
      echo "OK     $fichier present"
    else
      echo "ECHEC  $fichier manque: l etape execution du Dockerfile doit le copier."
      echec=1
    fi
  done
  if version=$(mkdocs --version 2>&1); then
    echo "OK     $version"
  else
    echo "ECHEC  mkdocs ne repond pas: le portail ne pourrait pas construire la documentation (Dockerfile, etape techdocs)."
    echec=1
  fi
  exit $echec
'
echo "Contenu de l image conforme: $image"
