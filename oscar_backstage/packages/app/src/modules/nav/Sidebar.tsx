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
  SidebarDivider,
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
import { SidebarLogo } from './SidebarLogo';

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
          <SidebarDivider />
          <SidebarGroup label="Menu" icon={<MenuIcon />}>
            {nav.take('page:home')}
            {nav.take('page:catalog')}
            {nav.take('page:techdocs')}
            {nav.take('page:api-docs')}
            <SidebarDivider />
            <SidebarScrollWrapper>
              {nav.rest({ sortBy: 'title' })}
            </SidebarScrollWrapper>
          </SidebarGroup>
          <SidebarSpace />
          <SidebarDivider />
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
