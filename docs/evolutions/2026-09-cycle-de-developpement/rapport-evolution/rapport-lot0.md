# Lot 0. Le ménage des brouillons

25 septembre 2026. Plan: `_pilotage/11-PLAN-cycle-de-developpement-des-trois-applications.md`.

---

## 1. Ce que Joel a demandé

Retirer ce qui avait servi d'essai ou de brouillon pendant le travail des 22 au
25 septembre, **sans toucher au laboratoire de tests**, qui est un outil du
projet, ni aux sauvegardes horodatées, qui sont sa règle.

## 2. Comment

Un inventaire en lecture seule d'abord, par un agent: Docker, Coolify, le proxy,
la zone DNS, les fichiers, git, les secrets GitHub (noms seulement). Chaque
élément y était classé « supprimer », « garder » ou « demander », avec sa preuve
et sa taille. Puis le retrait, élément par élément, après sauvegarde, et une
vérification en relisant l'état.

Sauvegarde du lot: `backup/20260925-121841-lot0-menage-des-brouillons/`.

## 3. Ce qui a été retiré

| Élément | Pourquoi c'était un reste | Taille |
|---|---|---|
| Conteneurs `outil-dns-interface-1` et `outil-dns-api-1`, leur réseau, leur volume vide | l'outil DNS lancé à la main le 24/09, avant Coolify, en doublon de la version déployée, sur les ports 3000 et 8000 hors convention | environ 740 Mo |
| Volume `oscar-general-gouvernance-project_portail-base` | la base de l'essai manuel de Backstage du 24/09; **archivé** avant retrait | 219 Mo, archive de 47 Mo |
| `.venv-python313-inutilisable` de l'outil DNS | l'ancien environnement Python, inutilisable depuis la migration | 68 Mo |
| `node_modules` de Backstage, `install-state.gz` | installés sur la machine le 24/09 (INC-2026-09-24-03) | 1,9 Go |
| `node_modules` et `.next` de l'interface DNS | installés et construits sur la machine | 644 Mo |
| yarn dans le cache de corepack | reste de l'installation du 24/09 | 3,7 Mo |
| Cache npm | rempli par les installations sur la machine | 700 Mo |
| Navigateur Playwright 1228 | aucun projet ne le demande | 641 Mo |
| Caches Python, fichiers de `/tmp` | laissés par les essais | quelques Mo |
| Certificats `essai-script` et `essai-copie` dans le proxy | ils laissaient passer la poignée TLS pour des noms qui ne servent plus | quelques Ko |
| Fichiers `.bak` et `.origine` suivis par git | anciennes versions, que git conserve déjà; recopiées dans la sauvegarde | quelques Ko |
| L'image `alpine`, tirée pour faire l'archive | un outil d'un instant: la laisser aurait été créer un nouveau reste | 8 Mo |

**Disque libre: 170 Go avant, 175 Go après.**

## 4. Ce qui a été gardé, et pourquoi

| Élément | Raison |
|---|---|
| `~/migration-backup/` | une sauvegarde |
| Le serveur VS Code, le cache Puppeteer | hérités, pas de ce travail |
| Le réseau `proxy-network` | attendu par la composition du serveur temps réel |
| `~/.ssh/authorized_keys` | le retirer risquerait de perdre l'accès à la machine |
| Le certificat de `tech.oscar-bot.com` | Backstage va s'en servir |
| Les anciennes images de l'outil DNS | elles servent au retour arrière dans Coolify |
| Les autres navigateurs Playwright | retirés au lot 3, une fois le laboratoire lancé en conteneur |

## 5. Ce qui a été remis en ordre

- **Les huit dépôts qui n'avaient pas de distant** sont rattachés à `origin`.
  Les onze sont alignés sur GitHub (vérifié un par un).
- **La carte des dépôts** gagne `oscar-general-gouvernance-project`, qui y
  manquait, et ne renvoie plus vers un dépôt disparu: les 34 commits de l'ancien
  dépôt de l'outil DNS sont dans `backup/` (vérifié). `outils/verifier-la-carte-des-depots.sh`
  confirme que la carte correspond au disque.
- **Le dépôt de pilotage** cessait de suivre 27 fichiers de `code/oscar-infrastructure`,
  qui a son propre dépôt: le même fichier apparaissait modifié dans les deux.

## 6. Anomalies rencontrées

**Le ménage BOAZ du matin n'était pas complet** (INC-2026-09-25-08). Il restait
la clé `gateway` dans un générateur et des exemples de BOAZ dans la
documentation du laboratoire, et un fichier généré réécrit à la main a rendu
rouge un test: 60 sur 60 avant, 59 sur 60 après, vérifié en conteneur. La
correction est au lot 3, qui refond le générateur.

**Des incidents de la veille disaient moins que la réalité.** Celui de
Backstage parlait d'une page de connexion « non vérifiée »: elle n'a jamais
existé. Celui des installations sur la machine disait « yarn retiré »: une
copie et 2,6 Go de dépendances étaient restés. Tous deux sont complétés par une
note datée.

**Pendant le lot, Joel a relevé un mélange de structure** (INC-2026-09-25-09):
les outils de toute la plateforme de déploiement rangés dans le dossier de
l'outil DNS. Traité au lot 1.

## 7. Ce qui est reporté

- Les navigateurs Playwright installés sur la machine: lot 3.
- Les bibliothèques système installées le 24/09 pour Playwright: gardées, leur
  retrait pourrait toucher autre chose; à revoir avec Joel.
