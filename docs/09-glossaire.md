# Glossaire

Les mots du guide, dans l'ordre alphabétique.

| Mot | Ce qu'il veut dire |
|---|---|
| **127.0.0.1** | L'adresse du poste lui-même. Un port publié sur `127.0.0.1` n'est joignable que depuis ce poste, jamais depuis le réseau. |
| **Backstage** | Le logiciel du portail technique d'OSCAR. Il rassemble les applications, les dépôts, leur documentation et l'état de leurs vérifications automatiques. |
| **Branche** | Une ligne de travail dans un dépôt git. Ici: `main` pour la production, `test` pour le test, `travail/<sujet>` pour le travail d'une personne. |
| **Commit** | Un enregistrement de modifications dans git, avec un message qui dit ce qu'il fait. |
| **Composition** | Le fichier `compose.yaml` qui décrit les services d'une application, pour `docker compose`. `compose.override.yaml` le complète en local. |
| **Conteneur** | Un programme qui tourne isolé, avec tout ce dont il a besoin, lancé par Docker à partir d'une image. Il ne demande rien d'installé sur le poste. |
| **Contrôle de passage par test** | Le contrôle que font les vérifications automatiques avant une mise en ligne en production: l'image du contenu de `main` doit exister dans Harbor, construite et mise en ligne en test. Sinon, rien n'est mis en ligne en production (depuis le 04/10/2026). |
| **Coolify** | L'outil qui lance les applications sur le serveur, à la demande des vérifications automatiques. Depuis le 04/10/2026, il ne construit plus: il télécharge dans Harbor l'image désignée par une étiquette, et la lance. Un projet par application, deux environnements. |
| **Déploiement** | La mise en service d'une version sur le serveur, en test ou en production. |
| **Dépôt** | Le dossier d'un projet suivi par git, et sa copie sur GitHub. |
| **Dépôt d'images** | La place d'un service dans Harbor, où sont rangées ses images: `oscar/<application>-<service>`, par exemple `oscar/outil-dns-api`. |
| **Docker** | Le logiciel qui fait tourner les conteneurs. Avec git, c'est le seul outil à installer sur son poste. |
| **Empreinte du contenu** | L'identifiant calculé à partir du contenu exact des fichiers du dossier d'une application, sans la documentation. Deux commits de même contenu ont la même empreinte; la fusion de `test` dans `main` ne la change pas. Ses 12 premiers caractères forment l'étiquette `contenu-...` de l'image. |
| **`.env` et `.env.exemple`** | Le fichier des réglages d'une application en local, et son modèle commenté, qui explique chaque réglage. |
| **Environnement** | Un endroit où tourne une application: local, test ou production. |
| **Étiquette d'image** | Un nom posé sur une image dans Harbor. Une image en porte plusieurs: `contenu-<empreinte>` (son identité), `construite-le-...`, `en-test-depuis-le-...`, `en-production-depuis-le-...`. Dans Coolify, la variable `ETIQUETTE_IMAGE_A_METTRE_EN_LIGNE` désigne l'image à lancer. |
| **Fusion** | L'intégration d'une branche dans une autre, à la fin d'une PR. |
| **GitHub Actions** | Le service de GitHub qui fait tourner les vérifications automatiques. Son onglet Actions montre chaque exécution. |
| **Harbor** | L'entrepôt des images d'OSCAR, `registry-container.oscar-bot.com`, projet privé `oscar`. Les vérifications automatiques y rangent chaque image construite, une seule fois; Coolify l'y reprend pour la mettre en ligne. Il garde les 10 dernières images de chaque dépôt d'images. |
| **Image** | Le modèle à partir duquel Docker lance un conteneur: le code d'une application, ce dont il a besoin, la commande qui le démarre. Elle se construit à partir d'un `Dockerfile`. |
| **Incident** | Tout ce qui s'est mal passé: une panne, une règle enfreinte, une affirmation fausse. Il se rédige le jour même. |
| **Laboratoire** | L'outil de tests du dépôt `oscar-test`, qui rejoue les parcours dans un vrai navigateur et fait la recette. |
| **Mermaid** | Un langage pour écrire des schémas en texte. Les schémas de ce guide sont écrits en Mermaid, puis transformés en images. |
| **Port interne, port publié** | Le port interne est celui sur lequel un service écoute dans son conteneur. Le port publié est celui qu'on ouvre sur le poste pour l'atteindre; lui seul peut entrer en conflit avec un autre. |
| **PR (pull request)** | Une demande de fusion d'une branche dans une autre, sur GitHub. Les vérifications automatiques la contrôlent avant qu'on la fusionne. |
| **Production** | L'environnement que les utilisateurs voient: `<nom>.oscar-bot.com`, branche `main`. |
| **Proxy** | Le programme du serveur qui reçoit les visiteurs sur les ports 80 et 443, et les envoie vers la bonne application selon l'adresse demandée. |
| **Recette** | La vérification, par le laboratoire, de ce qui est mis en ligne. Depuis le 04/10/2026, elle se lance à la main. |
| **Réseau privé** | Le réseau WireGuard qui relie les robots et les personnes qui les administrent, `10.66.0.0/24`, par `vpn.oscar-bot.com`. |
| **Route de santé** | Une adresse d'une application qui dit si elle est prête à répondre. Par exemple `/v1/health` pour l'API de l'outil DNS. |
| **Secret** | Un mot de passe, un jeton, une clé. Il ne va jamais dans un envoi, sauf les `.env` de développement versionnés par décision. |
| **Sous-projet** | Une partie d'un dépôt rangée dans son dossier, avec son propre workflow: une application (le portail), un outil (l'outil de déploiement) ou le guide. Un envoi ne vérifie que les sous-projets qu'il modifie. Voir [un workflow par sous-projet](05-un-workflow-par-sous-projet.md). |
| **SVG** | Un format d'image fait de traits et de textes, net à toutes les tailles. |
| **TechDocs** | La partie de Backstage qui affiche la documentation des dépôts, dont ce guide. |
| **Test** | L'environnement où chaque changement est déployé et vérifié avant la production: `test-<nom>.oscar-bot.com`, branche `test`. |
| **Vérifications automatiques** | Les contrôles et les tests que GitHub lance seul, à chaque PR et à chaque fusion, et qui construisent l'image et la mettent en ligne quand ils réussissent. Elles sont écrites dans les fichiers de `.github/workflows/`: un par sous-projet, plus les vérifications communes à tout le dépôt. Chaque lancement s'appelle une exécution. |
| **Workflow** | Un fichier du dossier `.github/workflows/` d'un dépôt, qui dit quand GitHub lance des vérifications automatiques, et lesquelles. Chaque sous-projet a le sien. |
| **Workflow réutilisable** | Un fichier de GitHub Actions écrit une fois et appelé par plusieurs dépôts. Le déploiement automatique commun en est un, rangé dans `oscar-infrastructure`. |
