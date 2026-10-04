# syntax=docker/dockerfile:1
#
# Le portail technique OSCAR, construit entierement dans Docker.
#
# Une machine avec Docker et rien d autre suffit: Node, Yarn, Python et MkDocs
# vivent dans les images. C est ce qui permet aux verifications automatiques
# de GitHub de construire l image une seule fois, avant de la ranger dans
# l entrepot d images d OSCAR (Harbor, decisions 89 et 90), et a un
# developpeur de travailler sans rien installer.
#
# LES ETAPES, ET QUI S EN SERT
#
#   dependances            toutes les dependances, outils de construction compris
#   construction           le code compile, et le paquet du portail
#   dependances-execution  seulement ce qui sert a faire tourner le serveur
#   verifications          les tests; les verifications automatiques de GitHub
#                          la visent
#   verifications-du-developpeur
#                          les tests de l accueil et de la charte, a la main
#                          seulement (decision 91)
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
# Le code: verification des types, puis le paquet du portail (le serveur, et
# l interface qu il sert).
# ---------------------------------------------------------------------------
FROM dependances AS construction
COPY . .
# yarn build:backend fabrique le paquet du serveur (bundle.tar.gz) et, a cote,
# son « squelette » (skeleton.tar.gz): les package.json du serveur et des
# paquets locaux dont il depend. Celui de l interface y figure sans ses
# dependances: elle porte « bundled »: true, puisqu elle est deja compilee
# dans le paquet. Le squelette est decompresse ici pour que l etape suivante
# le copie fichier par fichier: Docker compare leur contenu, pas leur date,
# et reprend l installation tant qu aucun package.json ne change.
RUN yarn tsc \
 && yarn build:backend \
 && mkdir /squelette \
 && tar xzf packages/backend/dist/skeleton.tar.gz -C /squelette


# ---------------------------------------------------------------------------
# Seulement les dependances d execution du serveur.
#
# L installation se fait sur le squelette, et seulement pour la production:
# ni outils de construction et de test, ni bibliotheques de l interface. Le
# 26/09/2026, l ancienne installation, faite sur tout l espace de travail,
# pesait 1,5 Go dans l image, dont l interface et ses outils (Material UI,
# Swagger UI, rspack, swc, TypeScript...), inutiles pour faire tourner le
# portail. C est la methode de l image de production decrite par Backstage.
#
# L image « outils » porte le compilateur: un module natif s y construit, et
# le resultat est recopie dans l image legere, a la meme version de Node.
# ---------------------------------------------------------------------------
FROM ${IMAGE_OUTILS} AS dependances-execution
WORKDIR /app
ENV CI=true
COPY .yarnrc.yml package.json yarn.lock backstage.json ./
COPY .yarn/releases ./.yarn/releases
COPY --from=construction /squelette/ ./
RUN --mount=type=cache,id=oscar-portail-yarn,target=/root/.yarn/berry/cache,sharing=locked \
    yarn workspaces focus --all --production


# ---------------------------------------------------------------------------
# Les tests du portail. Les verifications automatiques de GitHub construisent
# cette etape avant l image d execution: un test en echec arrete tout.
# ---------------------------------------------------------------------------
FROM construction AS verifications
RUN yarn test:all


# ---------------------------------------------------------------------------
# Les tests de la page d accueil et de la charte, lances a la main seulement.
#
# Ils ne sont plus lances par les verifications automatiques (decision 91):
# l etape « verifications » ci-dessus les exclut (reglage « jest » de
# packages/app/package.json). Rien d autre ne les lance: on les lance avant
# de toucher a l accueil ou a la charte, depuis ce dossier:
#
#   docker build --target verifications-du-developpeur .
# ---------------------------------------------------------------------------
FROM construction AS verifications-du-developpeur
RUN yarn workspace app test:verifications-du-developpeur


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
# L image qui tourne en test et en production, la derniere etape du fichier.
# Les verifications automatiques de GitHub la construisent une seule fois et
# la rangent dans l entrepot d images (Harbor); Coolify met en ligne cette
# image, sans rien construire. Le poste la construit par compose.override.yaml.
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
