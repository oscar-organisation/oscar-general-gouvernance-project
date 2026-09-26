/*
 * Le menu de gauche du portail.
 *
 * Les entrees viennent des pages installees; leurs titres en francais sont
 * dans app-config.yaml (config.title de chaque page). On les place ici dans
 * l ordre ou un nouveau venu en a besoin: l accueil, le catalogue, la
 * documentation, les API.
 */

import {
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import { SidebarSearchModal } from '@backstage/plugin-search';
import { UserSettingsSignInAvatar } from '@backstage/plugin-user-settings';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import { styled } from '@material-ui/core/styles';
import { derives } from '../charte/jetons';
import { SidebarLogo } from './SidebarLogo';

/**
 * Le filet entre les groupes du menu. Backstage fournit le sien
 * (SidebarDivider), peint en gris fixe #383838, hors charte, et son style ne
 * se surcharge pas par le theme sans etre efface. Le menu dessine donc le
 * sien, aux memes dimensions, avec le filet des fonds sombres de la charte.
 */
const Filet = styled('hr')({
  height: 1,
  width: '100%',
  background: derives.filetSombre,
  border: 'none',
  margin: '9.6px 0',
});

export const SidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ navItems }) => {
      const nav = navItems.withComponent(item => (
        <SidebarItem icon={() => item.icon} to={item.href} text={item.title} />
      ));

      // La recherche s ouvre en fenetre, depuis le menu: sa page n y figure
      // pas en plus.
      nav.take('page:search');

      return (
        <Sidebar>
          <SidebarLogo />
          <SidebarGroup label="Rechercher" icon={<SearchIcon />} to="/search">
            <SidebarSearchModal />
          </SidebarGroup>
          <Filet />
          <SidebarGroup label="Menu" icon={<MenuIcon />}>
            {nav.take('page:home')}
            {nav.take('page:catalog')}
            {nav.take('page:techdocs')}
            {nav.take('page:api-docs')}
            <Filet />
            <SidebarScrollWrapper>
              {nav.rest({ sortBy: 'title' })}
            </SidebarScrollWrapper>
          </SidebarGroup>
          <SidebarSpace />
          <Filet />
          <SidebarGroup
            label="Réglages"
            icon={<UserSettingsSignInAvatar />}
            to="/settings"
          >
            {nav.take('page:user-settings')}
          </SidebarGroup>
        </Sidebar>
      );
    },
  },
});
