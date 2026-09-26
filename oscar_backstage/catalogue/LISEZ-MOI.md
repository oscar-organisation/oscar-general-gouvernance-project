# Le catalogue du portail

Le portail lit les fiches `catalog-info.yaml` des dépôts. Ce dossier ne porte
que ce qui n'appartient à aucun dépôt, et ce qui attend d'y être posé.

| Fichier | Ce qu'il porte |
|---|---|
| `organisation.yaml` | la structure: le domaine OSCAR, un système par famille de dépôts, l'équipe `equipe-oscar`, et les ressources (Coolify, le proxy, OVHcloud) |
| `en-attente/` | les fiches qui iront dans leur dépôt, lues ici en attendant: voir `en-attente/LISEZ-MOI.md` |

## D'où vient chaque fiche

| Où tourne le portail | Ce qu'il lit |
|---|---|
| en test et en production | ce dossier, dans son image; la fiche `catalog-info.yaml` à la racine de chaque dépôt de l'organisation, sur `main`; les personnes et les équipes de l'organisation GitHub |
| sur le poste | ce dossier; le dépôt du portail, monté depuis le poste. Ni GitHub, ni les autres dépôts |

Les réglages qui le disent: `catalog.locations` et `catalog.providers` dans
`../app-config.production.yaml` et `../app-config.poste.yaml`.

## Pourquoi un système par famille

Le rangement suit la carte des dépôts du projet: plateforme, console,
infrastructure, outillage, vérification, gouvernance. Chaque fiche de
composant nomme sa famille (`spec.system`) et son propriétaire (`spec.owner`);
un test du portail vérifie que la famille et le propriétaire existent ici
(`packages/backend/src/reglages.test.ts`).
