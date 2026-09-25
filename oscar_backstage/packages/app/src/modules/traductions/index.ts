/*
 * Les textes de Backstage, en francais, par son point d extension prevu
 * (TranslationBlueprint).
 *
 * Le portail ne propose qu une langue: ces messages remplacent donc les
 * textes anglais d origine. On traduit ce qu un nouveau venu voit en premier:
 * la connexion, les pages d erreur, les tableaux. Le reste des modules de
 * Backstage reste en anglais tant qu il n est pas traduit ici: une cle
 * absente garde son texte d origine, rien ne casse.
 */

import { coreComponentsTranslationRef } from '@backstage/core-components';
import { catalogGraphTranslationRef } from '@backstage/plugin-catalog-graph';
import { searchTranslationRef } from '@backstage/plugin-search';
import {
  createFrontendModule,
  createTranslationMessages,
} from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';

const composantsDeBase = TranslationBlueprint.make({
  name: 'composants-de-base',
  params: {
    resource: createTranslationMessages({
      ref: coreComponentsTranslationRef,
      messages: {
        'table.filter.title': 'Filtres',
        'table.filter.placeholder': 'Tous les résultats',
        'table.filter.clearAll': 'Tout effacer',
        'table.body.emptyDataSourceMessage': 'Aucune ligne à afficher',
        'table.header.actions': 'Actions',
        'table.toolbar.search': 'Filtrer',
        'table.pagination.labelDisplayedRows': '{from} à {to} sur {count}',
        'table.pagination.firstTooltip': 'Première page',
        'table.pagination.labelRowsSelect': 'lignes',
        'table.pagination.lastTooltip': 'Dernière page',
        'table.pagination.nextTooltip': 'Page suivante',
        'table.pagination.previousTooltip': 'Page précédente',
        'emptyState.missingAnnotation.title': 'Annotation manquante',
        'emptyState.missingAnnotation.actionTitle':
          "Ajoutez l'annotation à la fiche catalog-info.yaml, comme dans l'exemple ci-dessous:",
        'emptyState.missingAnnotation.readMore': 'En savoir plus',
        'signIn.title': 'Se connecter',
        'signIn.loginFailed': 'La connexion a échoué',
        'signIn.guestProvider.title': 'Invité',
        'signIn.guestProvider.enter': 'Entrer',
        'signIn.guestProvider.subtitle':
          "Entrer sans compte, sur le poste du développeur.\n Aucune identité vérifiée: ce mode n'existe pas en test ni en production.",
        skipToContent: 'Aller au contenu',
        'copyTextButton.tooltipText': 'Texte copié',
        'errorPage.title': 'Cette page est introuvable.',
        'errorPage.subtitle': 'ERREUR {{status}}: {{statusMessage}}',
        'errorPage.goBack': 'Revenir en arrière',
        'errorPage.showMoreDetails': 'Voir le détail',
        'errorPage.showLessDetails': 'Masquer le détail',
        'errorBoundary.title': 'Une erreur est survenue dans cette partie de la page.',
        'oauthRequestDialog.message':
          "Connectez-vous pour que {{appTitle}} accède aux API de {{provider}}.",
        'oauthRequestDialog.title': 'Connexion nécessaire',
        'oauthRequestDialog.authRedirectTitle':
          'La page va vous envoyer vers la connexion.',
        'oauthRequestDialog.login': 'Se connecter',
        'oauthRequestDialog.rejectAll': 'Tout refuser',
        'supportButton.title': 'Aide',
        'supportButton.close': 'Fermer',
        'alertDisplay.message_one': '({{ count }} message plus récent)',
        'alertDisplay.message_other': '({{ count }} messages plus récents)',
        'autoLogout.stillTherePrompt.title': "Déconnexion pour cause d'inactivité",
        'autoLogout.stillTherePrompt.buttonText': 'Rester connecté',
        'dependencyGraph.fullscreenTooltip': 'Plein écran',
        'proxiedSignInPage.title':
          "Vous ne semblez pas connecté. Rechargez la page.",
        'logViewer.searchField.placeholder': 'Rechercher',
        'logViewer.downloadBtn.tooltip': 'Télécharger le journal',
        'logViewer.copyBtn.tooltip': 'Copier le journal',
      },
    }),
  },
});

// La recherche, ouverte depuis le menu.
const recherche = TranslationBlueprint.make({
  name: 'recherche',
  params: {
    resource: createTranslationMessages({
      ref: searchTranslationRef,
      messages: {
        'sidebarSearchModal.title': 'Rechercher',
        'searchModal.viewFullResults': 'Voir tous les résultats',
        'searchType.tabs.allTitle': 'Tout',
        'searchType.allResults': 'Tous les résultats',
        'searchType.accordion.collapse': 'Replier',
        'searchType.accordion.numberOfResults': '{{number}} résultats',
        'searchType.accordion.allTitle': 'Tout',
      },
    }),
  },
});

// Le graphe des relations entre les fiches: sa page, et sa carte sur chaque
// fiche.
const grapheDuCatalogue = TranslationBlueprint.make({
  name: 'graphe-du-catalogue',
  params: {
    resource: createTranslationMessages({
      ref: catalogGraphTranslationRef,
      messages: {
        'catalogGraphCard.title': 'Relations',
        'catalogGraphCard.deepLinkTitle': 'Voir le graphe',
        'catalogGraphPage.title': 'Graphe du catalogue',
        'catalogGraphPage.filterToggleButtonTitle': 'Filtres',
        'catalogGraphPage.simplifiedSwitchLabel': 'Simplifié',
        'catalogGraphPage.mergeRelationsSwitchLabel': 'Fusionner les relations',
        'catalogGraphPage.directionFilter.title': 'Sens',
        'catalogGraphPage.directionFilter.leftToRight': 'De gauche à droite',
        'catalogGraphPage.directionFilter.rightToLeft': 'De droite à gauche',
        'catalogGraphPage.directionFilter.topToBottom': 'De haut en bas',
        'catalogGraphPage.directionFilter.bottomToTop': 'De bas en haut',
        'catalogGraphPage.maxDepthFilter.title': 'Profondeur maximale',
        'catalogGraphPage.selectedKindsFilter.title': 'Sortes',
        'catalogGraphPage.selectedRelationsFilter.title': 'Relations',
      },
    }),
  },
});

export const traductionsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [composantsDeBase, recherche, grapheDuCatalogue],
});
