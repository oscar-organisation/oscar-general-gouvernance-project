/*
 * Les deux themes du portail, clair et sombre, tires des memes jetons.
 *
 * Chaque couleur vient de jetons.ts: aucune n est ecrite ici. Le theme clair
 * suit la charte telle quelle: le papier en fond, l encre pour le texte, le
 * gris pour le secondaire. Le theme sombre suit sa version renversee: le fond
 * sombre de la charte, le papier pour le texte.
 *
 * L orange reste un accent: indicateurs, filets actifs, focus. Il ne sert pas
 * au texte courant, parce qu il n atteint pas le contraste de 4,5 pour 1 sur le
 * papier (3,5 mesure). Les boutons principaux sont donc a l encre sur le
 * papier, et au papier sur le fond sombre.
 *
 * La charte ne definit pas de couleur d etat, rouge ou vert. Les etats
 * prennent donc l orange (erreur, avertissement) ou l encre (reussite,
 * information): leur sens est porte par le texte et l icone, jamais par la
 * seule couleur.
 */

import {
  createUnifiedTheme,
  PageTheme,
  palettes,
  UnifiedTheme,
} from '@backstage/theme';
import { derives, nuances, palette, transparence } from './jetons';

/** Les deux polices de la charte, servies par le portail lui-meme. */
export const polices = {
  /** Manrope: les titres et le texte courant. */
  texte: "'Manrope Variable', system-ui, sans-serif",
  /** Space Grotesk: les etiquettes, en majuscules espacees. */
  technique: "'Space Grotesk Variable', system-ui, sans-serif",
} as const;

/**
 * L en-tete des pages: un aplat Noir OSCAR, texte papier, sans les vagues
 * decoratives de Backstage. Un seul modele pour toutes les sortes de page.
 * Backstage peint cet en-tete par une image de fond: un aplat s y ecrit comme
 * un degrade d une seule couleur.
 */
const enTete: PageTheme = {
  colors: [palette.noir],
  shape: 'none',
  backgroundImage: `linear-gradient(${palette.noir}, ${palette.noir})`,
  fontColor: palette.papier,
};
const SORTES_DE_PAGE = [
  'home',
  'documentation',
  'tool',
  'service',
  'website',
  'library',
  'other',
  'app',
  'apis',
  'card',
];
const pageTheme = Object.fromEntries(SORTES_DE_PAGE.map(id => [id, enTete]));

/** L echelle de gris que certains composants de Material UI emploient. */
const gris = {
  50: nuances.carte,
  100: palette.papier,
  200: nuances.papierSoutenu,
  300: nuances.papierSoutenu,
  400: palette.gris,
  500: palette.gris,
  600: palette.gris,
  700: nuances.encreDouce,
  800: nuances.encreDouce,
  900: palette.noir,
  A100: nuances.carte,
  A200: nuances.papierSoutenu,
  A400: palette.gris,
  A700: nuances.encreDouce,
};

/** Le menu de gauche: Noir OSCAR dans les deux themes, l orange pour l actif. */
const navigation = {
  background: palette.noir,
  indicator: palette.orange,
  color: derives.texteSecondaireSombre,
  selectedColor: palette.papier,
  navItem: { hoverBackground: nuances.sombreSurface },
  submenu: { background: nuances.sombreSurface },
};

/**
 * Une couleur de la palette de Material UI, avec ses trois nuances donnees en
 * clair. Sans elles, Material UI fabrique une nuance plus claire et une plus
 * foncee de chaque couleur (le survol d un bouton, par exemple), et ces
 * nuances-la ne sont pas dans la charte: le test de la charte les a vues.
 */
const teinte = (
  main: string,
  contrastText: string,
  nuancesDeLaTeinte: { light?: string; dark?: string } = {},
) => ({
  main,
  light: nuancesDeLaTeinte.light ?? main,
  dark: nuancesDeLaTeinte.dark ?? main,
  contrastText,
});

const titres = (couleur: string) => ({
  htmlFontSize: 16,
  fontFamily: polices.texte,
  h1: { fontSize: 44, fontWeight: 500, marginBottom: 12, color: couleur },
  h2: { fontSize: 32, fontWeight: 500, marginBottom: 8 },
  h3: { fontSize: 24, fontWeight: 500, marginBottom: 8 },
  h4: { fontSize: 20, fontWeight: 600, marginBottom: 6 },
  h5: { fontSize: 18, fontWeight: 600, marginBottom: 4 },
  h6: { fontSize: 16, fontWeight: 600, marginBottom: 2 },
});

/**
 * Les reglages de composants communs aux deux themes: les formes de la
 * charte (cartes arrondies a filet fin, pastilles) et ses polices.
 */
const composants = (filet: string) => ({
  MuiButton: {
    styleOverrides: {
      root: { textTransform: 'none' as const, borderRadius: 8, fontWeight: 600 },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 999, fontFamily: polices.technique },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: { borderRadius: 18, border: `1px solid ${filet}` },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        fontFamily: polices.technique,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.12em',
      },
    },
  },
});

export const themeClair: UnifiedTheme = createUnifiedTheme({
  fontFamily: polices.texte,
  typography: titres(palette.noir),
  defaultPageTheme: 'home',
  pageTheme,
  components: composants(derives.filetClair),
  palette: {
    ...palettes.light,
    type: 'light',
    mode: 'light',
    background: { default: palette.papier, paper: nuances.carte },
    primary: teinte(palette.noir, palette.papier, { light: nuances.encreDouce }),
    secondary: teinte(palette.orange, palette.noir),
    error: teinte(palette.orange, palette.noir),
    warning: teinte(palette.orange, palette.noir),
    info: teinte(palette.noir, palette.papier, { light: nuances.encreDouce }),
    success: teinte(palette.noir, palette.papier, { light: nuances.encreDouce }),
    text: {
      primary: palette.noir,
      secondary: palette.gris,
      disabled: transparence(palette.noir, 0.38),
      hint: palette.gris,
    },
    divider: derives.filetClair,
    action: {
      active: palette.noir,
      hover: transparence(palette.noir, 0.04),
      selected: transparence(palette.noir, 0.08),
      disabled: transparence(palette.noir, 0.26),
      disabledBackground: transparence(palette.noir, 0.12),
      focus: transparence(palette.noir, 0.12),
    },
    grey: gris,
    common: { black: palette.noir, white: nuances.carte },
    status: {
      ok: palette.noir,
      warning: palette.orange,
      error: palette.orange,
      running: palette.gris,
      pending: palette.gris,
      aborted: palette.gris,
    },
    border: derives.filetClair,
    textContrast: palette.noir,
    textVerySubtle: nuances.papierSoutenu,
    textSubtle: palette.gris,
    highlight: nuances.papierSoutenu,
    errorBackground: nuances.papierSoutenu,
    warningBackground: nuances.papierSoutenu,
    infoBackground: nuances.papierSoutenu,
    errorText: palette.noir,
    infoText: palette.noir,
    warningText: palette.noir,
    linkHover: palette.noir,
    link: palette.noir,
    gold: palette.orange,
    navigation,
    tabbar: { indicator: palette.orange },
    bursts: {
      fontColor: palette.papier,
      slackChannelText: palette.gris,
      backgroundColor: { default: palette.noir },
      gradient: {
        linear: `linear-gradient(${palette.noir}, ${palette.noir})`,
      },
    },
    pinSidebarButton: { icon: palette.noir, background: nuances.papierSoutenu },
    banner: {
      info: palette.noir,
      error: palette.noir,
      text: palette.papier,
      link: palette.papier,
      warning: palette.noir,
      closeButtonColor: palette.papier,
    },
    code: { background: nuances.papierSoutenu },
  },
});

export const themeSombre: UnifiedTheme = createUnifiedTheme({
  fontFamily: polices.texte,
  typography: titres(palette.papier),
  defaultPageTheme: 'home',
  pageTheme,
  components: composants(derives.filetSombre),
  palette: {
    ...palettes.dark,
    type: 'dark',
    mode: 'dark',
    background: { default: nuances.sombre, paper: nuances.sombreSurface },
    primary: teinte(palette.papier, palette.noir, { dark: nuances.papierSoutenu }),
    secondary: teinte(palette.orange, palette.noir),
    error: teinte(palette.orange, palette.noir),
    warning: teinte(palette.orange, palette.noir),
    info: teinte(palette.papier, palette.noir, { dark: nuances.papierSoutenu }),
    success: teinte(palette.papier, palette.noir, { dark: nuances.papierSoutenu }),
    text: {
      primary: palette.papier,
      secondary: derives.texteSecondaireSombre,
      disabled: transparence(palette.papier, 0.38),
      hint: derives.texteSecondaireSombre,
    },
    divider: derives.filetSombre,
    action: {
      active: palette.papier,
      hover: transparence(palette.papier, 0.06),
      selected: transparence(palette.papier, 0.1),
      disabled: transparence(palette.papier, 0.3),
      disabledBackground: transparence(palette.papier, 0.12),
      focus: transparence(palette.papier, 0.12),
    },
    grey: gris,
    common: { black: palette.noir, white: nuances.carte },
    status: {
      ok: palette.papier,
      warning: palette.orange,
      error: palette.orange,
      running: derives.texteSecondaireSombre,
      pending: derives.texteSecondaireSombre,
      aborted: derives.texteSecondaireSombre,
    },
    border: derives.filetSombre,
    textContrast: palette.papier,
    textVerySubtle: nuances.sombreSurface,
    textSubtle: derives.texteSecondaireSombre,
    highlight: nuances.sombreSurface,
    errorBackground: nuances.sombreSurface,
    warningBackground: nuances.sombreSurface,
    infoBackground: nuances.sombreSurface,
    errorText: palette.papier,
    infoText: palette.papier,
    warningText: palette.papier,
    linkHover: palette.papier,
    link: palette.papier,
    gold: palette.orange,
    navigation,
    tabbar: { indicator: palette.orange },
    bursts: {
      fontColor: palette.papier,
      slackChannelText: derives.texteSecondaireSombre,
      backgroundColor: { default: palette.noir },
      gradient: {
        linear: `linear-gradient(${palette.noir}, ${palette.noir})`,
      },
    },
    pinSidebarButton: { icon: palette.papier, background: nuances.sombreSurface },
    banner: {
      info: palette.noir,
      error: palette.noir,
      text: palette.papier,
      link: palette.papier,
      warning: palette.noir,
      closeButtonColor: palette.papier,
    },
    code: { background: nuances.sombreSurface },
  },
});
