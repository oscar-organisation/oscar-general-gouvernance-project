# Construction complete de Backstage dans le conteneur.
#
# POURQUOI PAS LE DOCKERFILE FOURNI PAR BACKSTAGE
#
# Celui de packages/backend/Dockerfile attend que quelqu un ait deja lance
# "yarn install" et "yarn build:backend" SUR LA MACHINE, et il se contente de
# ramasser le resultat. Ca oblige a installer Node et Yarn sur chaque serveur
# qui construit, ce qu on ne veut pas ici : rien ne doit etre installe en
# dehors de Docker.
#
# Ce fichier fait donc les deux etapes lui-meme. Une machine avec Docker et
# rien d autre suffit.

# ---------- Etape 1 : construction ----------
FROM node:22-bookworm AS construction

# Backstage compile des modules natifs a l installation : sans ces paquets,
# l installation echoue au milieu avec une erreur de compilateur.
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential python3 libsqlite3-dev ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV CI=true

# Le manifeste d abord, le code ensuite : tant que les dependances ne changent
# pas, Docker reutilise l installation et la reconstruction prend des secondes
# au lieu de plusieurs minutes.
COPY .yarn ./.yarn
COPY .yarnrc.yml yarn.lock package.json backstage.json ./
COPY packages/app/package.json    packages/app/
COPY packages/backend/package.json packages/backend/
RUN corepack enable && yarn install --immutable

COPY . .
RUN yarn tsc && yarn build:backend

# ---------- Etape 2 : execution ----------
FROM node:22-bookworm-slim AS execution

RUN apt-get update && apt-get install -y --no-install-recommends \
      libsqlite3-dev ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

# Corepack pose des liens dans un dossier systeme : il lui faut root. Fait
# apres le passage en utilisateur node, il echoue sur un refus d ecriture, et
# le message ne dit pas que c est une question de droits.
RUN corepack enable

USER node
WORKDIR /app
ENV NODE_ENV=production

COPY --from=construction --chown=node:node /app/.yarn ./.yarn
COPY --from=construction --chown=node:node /app/.yarnrc.yml /app/backstage.json ./
COPY --from=construction --chown=node:node \
     /app/yarn.lock /app/package.json /app/packages/backend/dist/skeleton.tar.gz ./
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

# "focus --production" n installe que ce qui sert a l execution. L image finale
# ne porte donc ni compilateur, ni outils de construction, ni tests.
RUN yarn workspaces focus --all --production && yarn cache clean

COPY --from=construction --chown=node:node /app/examples ./examples
# La structure d accueil du catalogue : le domaine, les familles et le
# proprietaire par defaut. Oubliee ici, le portail demarre sans erreur mais
# les composants renvoient a des systemes qui n existent pas.
COPY --from=construction --chown=node:node /app/catalogue ./catalogue
COPY --from=construction --chown=node:node \
     /app/packages/backend/dist/bundle.tar.gz /app/app-config*.yaml ./
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

EXPOSE 7007

# Le controle de sante sert au demarrage ordonne : la composition attend que
# Backstage reponde vraiment avant de le declarer pret.
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 \
  CMD curl -fsS http://localhost:7007/healthcheck || exit 1

CMD ["node", "packages/backend", "--config", "app-config.yaml", "--config", "app-config.production.yaml"]
