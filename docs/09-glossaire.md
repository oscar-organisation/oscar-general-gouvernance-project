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
| **Contrôle de passage par test** | Le contrôle que font les vérifications automatiques avant un déploiement en production: le contenu de `main` doit être celui d'un commit de `test` déployé avec succès. Il signale un écart, sans bloquer. |
| **Coolify** | L'outil qui construit et lance les applications sur le serveur, à la demande des vérifications automatiques. Un projet par application, deux environnements. |
| **Déploiement** | La mise en service d'une version sur le serveur, en test ou en production. |
| **Dépôt** | Le dossier d'un projet suivi par git, et sa copie sur GitHub. |
| **Docker** | Le logiciel qui fait tourner les conteneurs. Avec git, c'est le seul outil à installer sur son poste. |
| **`.env` et `.env.exemple`** | Le fichier des réglages d'une application en local, et son modèle commenté, qui explique chaque réglage. |
| **Environnement** | Un endroit où tourne une application: local, test ou production. |
| **Fusion** | L'intégration d'une branche dans une autre, à la fin d'une PR. |
| **GitHub Actions** | Le service de GitHub qui fait tourner les vérifications automatiques. Son onglet Actions montre chaque exécution. |
| **Image** | Le modèle à partir duquel Docker lance un conteneur. Elle se construit à partir d'un `Dockerfile`. |
| **Incident** | Tout ce qui s'est mal passé: une panne, une règle enfreinte, une affirmation fausse. Il se rédige le jour même. |
| **Laboratoire** | L'outil de tests du dépôt `oscar-test`, qui rejoue les parcours dans un vrai navigateur et fait la recette. |
| **Mermaid** | Un langage pour écrire des schémas en texte. Les schémas de ce guide sont écrits en Mermaid, puis transformés en images. |
| **Port interne, port publié** | Le port interne est celui sur lequel un service écoute dans son conteneur. Le port publié est celui qu'on ouvre sur le poste pour l'atteindre; lui seul peut entrer en conflit avec un autre. |
| **PR (pull request)** | Une demande de fusion d'une branche dans une autre, sur GitHub. Les vérifications automatiques la contrôlent avant qu'on la fusionne. |
| **Production** | L'environnement que les utilisateurs voient: `<nom>.oscar-bot.com`, branche `main`. |
| **Proxy** | Le programme du serveur qui reçoit les visiteurs sur les ports 80 et 443, et les envoie vers la bonne application selon l'adresse demandée. |
| **Recette** | La vérification, par le laboratoire, de ce qui vient d'être déployé. |
| **Route de santé** | Une adresse d'une application qui dit si elle est prête à répondre. Par exemple `/v1/health` pour l'API de l'outil DNS. |
| **Secret** | Un mot de passe, un jeton, une clé. Il ne va jamais dans un envoi, sauf les `.env` de développement versionnés par décision. |
| **SVG** | Un format d'image fait de traits et de textes, net à toutes les tailles. |
| **TechDocs** | La partie de Backstage qui affiche la documentation des dépôts, dont ce guide. |
| **Test** | L'environnement où chaque changement est déployé et vérifié avant la production: `test-<nom>.oscar-bot.com`, branche `test`. |
| **Vérifications automatiques** | Les contrôles et les tests que GitHub lance seul, à chaque PR et à chaque fusion, et qui déploient quand ils réussissent. Leur fichier est `.github/workflows/verifications-automatiques.yml`. Chaque lancement s'appelle une exécution. |
| **Workflow réutilisable** | Un fichier de GitHub Actions écrit une fois et appelé par plusieurs dépôts. Le déploiement automatique commun en est un, rangé dans `oscar-infrastructure`. |
