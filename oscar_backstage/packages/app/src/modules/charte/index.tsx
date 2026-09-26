/*
 * La charte OSCAR dans le portail: les deux themes, clair et sombre, qui
 * remplacent ceux de Backstage par leur point d extension prevu
 * (ThemeBlueprint), et les couleurs de Backstage UI qui vont avec.
 */

import { ReactNode } from 'react';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { ThemeBlueprint } from '@backstage/plugin-app-react';
import { UnifiedTheme, UnifiedThemeProvider } from '@backstage/theme';
import { makeStyles } from '@material-ui/core/styles';
import LightIcon from '@material-ui/icons/WbSunny';
import DarkIcon from '@material-ui/icons/Brightness2';
import { variablesClaires, variablesSombres } from './backstageUi';
import { themeClair, themeSombre } from './themes';

// Le nom que le fournisseur de theme pose sur la page (data-theme-name): c est
// par lui que les variables de Backstage UI de chaque theme s appliquent.
export const NOM_CLAIR = 'oscar-clair';
export const NOM_SOMBRE = 'oscar-sombre';

const useVariablesClaires = makeStyles({
  '@global': { [`body[data-theme-name='${NOM_CLAIR}']`]: variablesClaires },
});
const useVariablesSombres = makeStyles({
  '@global': { [`body[data-theme-name='${NOM_SOMBRE}']`]: variablesSombres },
});

const VariablesClaires = () => {
  useVariablesClaires();
  return null;
};
const VariablesSombres = () => {
  useVariablesSombres();
  return null;
};

function fournisseur(
  theme: UnifiedTheme,
  nom: string,
  Variables: () => null,
) {
  return ({ children }: { children: ReactNode }) => (
    <UnifiedThemeProvider theme={theme} themeName={nom}>
      <Variables />
      {children}
    </UnifiedThemeProvider>
  );
}

// Les noms « light » et « dark » sont ceux des themes de Backstage: les
// reprendre les remplace, au lieu d en ajouter deux de plus.
const clair = ThemeBlueprint.make({
  name: 'light',
  params: {
    theme: {
      id: 'light',
      title: 'Clair',
      variant: 'light',
      icon: <LightIcon />,
      Provider: fournisseur(themeClair, NOM_CLAIR, VariablesClaires),
    },
  },
});

const sombre = ThemeBlueprint.make({
  name: 'dark',
  params: {
    theme: {
      id: 'dark',
      title: 'Sombre',
      variant: 'dark',
      icon: <DarkIcon />,
      Provider: fournisseur(themeSombre, NOM_SOMBRE, VariablesSombres),
    },
  },
});

export const charteModule = createFrontendModule({
  pluginId: 'app',
  extensions: [clair, sombre],
});
