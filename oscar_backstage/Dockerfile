# syntax=docker/dockerfile:1
#
# Le portail technique OSCAR, construit entierement dans Docker.
#
# Une machine avec Docker et rien d autre suffit: Node, Yarn, Python et MkDocs
# vivent dans les images. C est ce qui permet a Coolify de construire depuis
# GitHub (decision A4), et a un developpeur de travailler sans rien installer.
#
# LES ETAPES, ET QUI S EN SERT
#
#   dependances            toutes les dependances, outils de construction compris
#   dependances-execution  seulement ce qui sert a faire tourner le portail
#   construction           le code compile, et le paquet du portail
#   verifications          les tests; la chaine du depot la vise, Coolify jamais
#   developpement          le mode developpement local, avec rechargement a chaud
#   execution              l image qui tourne en test et en production (la derniere)
#
# L ORDRE DES ETAPES FAIT LA VITESSE
#
# Ce qui change rarement passe d abord: la liste des dependances, puis leur
# installation, puis le code. Tant que yarn.lock ne bouge pas, Docker reprend
# l installation deja faite, qui est de loin l etape la plus longue. Et le
# dossier ou Yarn garde les paquets telecharges est un cache de construction:
# il survit d une construction a l autre, meme quand la liste change.
#
# POURQUOI PAS LE DOCKERFILE FOURNI PAR BACKSTAGE
#
# Celui que Backstage genere attend qu on ait deja lance « yarn install » et
# « yarn build:backend » sur la machine, et ne fait que ramasser le resultat.
# Il faudrait donc Node et Yarn sur chaque machine qui construit. Il a ete
# retire du depot; il reste lisible dans l historique git.

# Les deux images de base, a une version figee: la meme partout, et une mise a
# jour se decide. La meme version de Node dans les deux: un module natif
# compile dans l une doit tourner dans l autre.
ARG IMAGE_OUTILS=node:22.23.3-bookworm
ARG IMAGE_LEGERE=node:22.23.3-bookworm-slim


# ---------------------------------------------------------------------------
# Les outils de TechDocs, communs au mode developpement et a l execution.
#
# Le portail construit lui-meme la documentation des depots (runIn: local): il
# lui faut MkDocs et son module techdocs-core, aux versions de
# techdocs/requirements.txt. Ils vont dans un environnement Python a part, pour
# ne jamais se meler aux paquets du systeme.
# ---------------------------------------------------------------------------
FROM ${IMAGE_LEGERE} AS techdocs
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY techdocs/requirements.txt /opt/techdocs/requirements.txt
RUN python3 -m venv /opt/techdocs/venv \
 && /opt/techdocs/venv/bin/pip install --no-cache-dir --requirement /opt/techdocs/requirements.txt
ENV PATH=/opt/techdocs/venv/bin:$PATH


# ---------------------------------------------------------------------------
# Toutes les dependances, pour construire et tester.
#
# L image « outils » porte deja le compilateur et Python: certains modules de
# Backstage se compilent a l installation.
# ---------------------------------------------------------------------------
FROM ${IMAGE_OUTILS} AS dependances
WORKDIR /app
ENV CI=true

# Seulement ce qui decrit les dependances. Un nouveau paquet dans packages/ ou
# plugins/ demande sa ligne ici; s il manque, « yarn install --immutable »
# echoue en disant que le fichier yarn.lock ne correspond plus, et la
# construction s arrete: l oubli ne passe pas en silence.
COPY .yarnrc.yml package.json yarn.lock backstage.json ./
COPY .yarn/releases ./.yarn/releases
COPY packages/app/package.json packages/app/
COPY packages/backend/package.json packages/backend/

# Yarn garde les paquets telecharges dans son cache global. Monte comme cache
# de construction, il survit d une construction a l autre sur la meme machine.
RUN --mount=type=cache,id=oscar-portail-yarn,target=/root/.yarn/berry/cache,sharing=locked \
    yarn install --immutable


# ---------------------------------------------------------------------------
# Seulement les dependances d execution, sans outils de test ni de construction.
#
# Tirees de l installation complete, dont on retire ce qui ne sert qu a
# construire et a tester: pas de seconde installation depuis zero. Le resultat
# est ensuite recopie dans l image legere, qui n a donc ni compilateur ni
# Python de construction. Cette etape ne depend que des dependances: Docker la
# reprend telle quelle tant que yarn.lock ne change pas.
# ---------------------------------------------------------------------------
FROM dependances AS dependances-execution
RUN --mount=type=cache,id=oscar-portail-yarn,target=/root/.yarn/berry/cache,sharing=locked \
    yarn workspaces focus --all --production


# ---------------------------------------------------------------------------
# Le code: verification des types, puis le paquet du portail (le serveur, et
# l interface qu il sert).
# ---------------------------------------------------------------------------
FROM dependances AS construction
COPY . .
RUN yarn tsc \
 && yarn build:backend


# ---------------------------------------------------------------------------
# Les tests du portail. La chaine du depot construit cette etape; Coolify ne
# la construit jamais, puisqu il vise l image d execution.
# ---------------------------------------------------------------------------
FROM construction AS verifications
RUN yarn test:all


# ---------------------------------------------------------------------------
# Le mode developpement local, avec rechargement a chaud.
#
# Les dependances sont dans l image; le code, lui, est monte depuis le poste par
# compose.override.yaml, en lecture seule. Une modification du code se voit
# tout de suite, sans reconstruire. Une modification des dependances demande de
# reconstruire cette image.
# ---------------------------------------------------------------------------
FROM dependances AS developpement
COPY --from=techdocs /opt/techdocs /opt/techdocs
# L environnement Python de TechDocs pointe vers le Python du systeme, qui a
# le meme chemin dans les deux images.
ENV PATH=/opt/techdocs/venv/bin:$PATH
EXPOSE 3000 7007
CMD ["yarn", "start", "--config", "../../app-config.yaml", "--config", "../../app-config.developpement.yaml", "--config", "../../app-config.poste.yaml"]


# ---------------------------------------------------------------------------
# L image qui tourne en test et en production. Coolify construit la derniere
# etape du fichier, celle-ci.
# ---------------------------------------------------------------------------
FROM techdocs AS execution

# Le dossier appartient a l utilisateur sans privilege qui fera tourner le
# portail. Ce qui demande root se fait avant USER (lecon 3.4).
RUN mkdir /app && chown node:node /app
USER node
WORKDIR /app
ENV NODE_ENV=production

COPY --from=dependances-execution --chown=node:node /app ./
COPY --from=construction --chown=node:node /app/packages/backend/dist/bundle.tar.gz ./
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

# Les reglages lus en test et en production, et eux seuls. Celui du poste du
# developpeur, qui ouvre l acces invite, n entre jamais dans l image.
COPY --chown=node:node app-config.yaml app-config.service.yaml app-config.production.yaml ./
# La structure du catalogue: le domaine, les familles, les ressources, et les
# fiches des depots qui ne portent pas encore la leur.
COPY --chown=node:node catalogue ./catalogue

EXPOSE 7007

# Le controle de sante est decrit dans compose.yaml, a cote du service, comme
# pour l outil DNS: une seule definition, la ou on la cherche.

CMD ["node", "packages/backend", "--config", "app-config.yaml", "--config", "app-config.service.yaml", "--config", "app-config.production.yaml"]
