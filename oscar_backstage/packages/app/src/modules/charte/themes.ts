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
  defaultComponentThemes,
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

/** Les teintes d un theme dont les reglages de composants ont besoin. */
type Teintes = {
  /** Les filets et bordures. */
  filet: string;
  /** Le texte courant. */
  texte: string;
  /** Le texte secondaire, et le contour des boutons. */
  secondaire: string;
  /** Le fond d un encart pose sur la page. */
  encart: string;
  /** La poignee de la barre de defilement, au repos et sous la souris. */
  poignee: string;
  poigneeActive: string;
};

/**
 * La base de la page: celle de Backstage, qu il exporte pour qu on la
 * compose (defaultComponentThemes), avec les teintes de la poignee de la
 * barre de defilement. Backstage les calcule en foncant ou en eclaircissant
 * de 20 % une couleur du theme, ce qui sort de la charte (le test de la charte
 * les a vues); on les remplace, et on garde tout le reste.
 */
const baseDeLaPage = (t: Teintes) => ({
  // Le theme est passe tel quel a la base de Backstage, qui le lit.
  styleOverrides: (theme: unknown) => {
    const deBackstage = defaultComponentThemes?.MuiCssBaseline?.styleOverrides;
    const base: Record<string, any> =
      typeof deBackstage === 'function'
        ? (deBackstage as (theme: unknown) => Record<string, any>)(theme)
        : {};
    return {
      ...base,
      body: {
        ...base.body,
        '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
          ...base.body?.['&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb'],
          backgroundColor: t.poignee,
        },
        '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
          backgroundColor: t.poigneeActive,
        },
        '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
          backgroundColor: t.poigneeActive,
        },
      },
    };
  },
});

/**
 * Une alerte dans la charte: le texte a l encre, sur un encart, l icone et le
 * contour a l orange pour l erreur et l avertissement. Sans ce reglage,
 * Material UI fonce et eclaircit la couleur de l etat (un brun #562306 sur un
 * rose #FBEEE7 pour l orange), deux teintes hors de la charte que le releve a
 * l ecran a trouvees.
 */
const alerte = (t: Teintes) => {
  const standard = { color: t.texte, backgroundColor: t.encart };
  const contour = { color: t.texte };
  return {
    standardError: standard,
    standardWarning: standard,
    standardInfo: standard,
    standardSuccess: standard,
    outlinedError: contour,
    outlinedWarning: contour,
    outlinedInfo: contour,
    outlinedSuccess: contour,
  };
};

/**
 * Les reglages de composants communs aux deux themes: les formes de la
 * charte (cartes arrondies a filet fin, pastilles) et ses polices.
 */
/**
 * Les surcharges des composants de Backstage lui-meme, par leur nom de style.
 * Certains de ces noms ne sont pas declares aux types du theme: l objet est
 * donc range a part, et deploye dans les reglages de composants.
 */
const champsDeBackstage = (t: Teintes): Record<string, unknown> => ({
  BackstageSelectInputBase: {
    styleOverrides: { input: { border: `1px solid ${t.secondaire}` } },
  },
  BackstageClosedDropdown: { styleOverrides: { icon: { color: t.secondaire } } },
  BackstageOpenedDropdown: { styleOverrides: { icon: { color: t.secondaire } } },
  BackstageAutocompleteBase: {
    styleOverrides: {
      inputRoot: { '$root &:hover > fieldset': { borderColor: t.secondaire } },
      popupIndicator: { color: t.secondaire },
    },
  },
  // La carte des filtres personnels du catalogue: noir pur a 11 %.
  CatalogReactUserListPicker: {
    styleOverrides: { root: { backgroundColor: t.encart } },
  },
});

const composants = (t: Teintes) => ({
  MuiCssBaseline: baseDeLaPage(t),
  // Le panneau qui annonce une erreur ou un avertissement: Backstage fonce et
  // eclaircit la couleur de l etat, hors charte. Meme regle que les alertes.
  BackstageWarningPanel: {
    styleOverrides: {
      panel: { color: t.texte, backgroundColor: t.encart },
      summaryText: { color: t.texte },
      message: { color: t.texte, backgroundColor: t.encart },
    },
  },
  MuiAlert: { styleOverrides: alerte(t) },
  // Le contour des champs: Material UI le trace en noir pur a 23 %.
  MuiOutlinedInput: { styleOverrides: { notchedOutline: { borderColor: t.secondaire } } },
  // Le fond de la barre de chargement: Material UI eclaircit ou fonce la
  // couleur principale, ce qui sort de la palette.
  MuiLinearProgress: { styleOverrides: { colorPrimary: { backgroundColor: t.encart } } },
  // Le voile derriere une fenetre: noir pur a 50 % chez Material UI, Noir
  // OSCAR ici. Les voiles invisibles des menus restent invisibles.
  MuiBackdrop: {
    styleOverrides: {
      root: ({ ownerState }: { ownerState?: { invisible?: boolean } }) =>
        ownerState?.invisible
          ? {}
          : { backgroundColor: transparence(palette.noir, 0.5) },
    },
  },
  // Les champs de Backstage: la liste deroulante (BackstageSelectInputBase),
  // ses fleches, et le champ de recherche du catalogue. Leur bordure
  // (#ced4da) et leurs fleches (#616161) sont ecrites en dur, hors charte;
  // leurs noms de style permettent de les surcharger.
  ...champsDeBackstage(t),
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none' as const,
        borderRadius: 8,
        fontWeight: 600,
        // Le focus au clavier: l anneau orange de la charte, comme dans
        // Backstage UI (--bui-ring). Material UI retire le contour du
        // navigateur et ne laisse qu une ombre ou une onde, peu visibles.
        // :focus-visible est la regle du navigateur: l anneau vient au
        // clavier, pas au clic de la souris.
        '&:focus-visible': {
          outline: `2px solid ${palette.orange}`,
          outlineOffset: 2,
        },
      },
      // Material UI trace ce contour en noir pur a 23 %, hors charte.
      outlined: { borderColor: t.secondaire },
      // Le bouton plein de couleur par defaut, dont le lien « Aller au
      // contenu » du menu: Material UI 4 le pose sur grey[300], le papier
      // soutenu dans les deux themes, et calcule son texte en noir pur a
      // 87 %, hors charte. L encre, sur ce fond. Material UI 4 range cette
      // couleur dans la regle contained, que containedPrimary et
      // containedSecondary surchargent ensuite. Material UI 5, lui, n a plus
      // de couleur par defaut et applique contained a tous les boutons
      // pleins: on n y touche pas. ownerState n existe qu en version 5.
      contained: ({ ownerState }: { ownerState?: object }) =>
        ownerState ? {} : { color: palette.noir },
    },
  },
  // Le filet en haut de la barre de menu du telephone. Backstage l ecrit en
  // dur, gris #383838, dans un style sans nom que le theme ne peut pas
  // surcharger (MobileSidebar, @backstage/core-components 0.18.14, encore
  // ainsi le 28/09/2026). Cette barre est un BottomNavigation de Material UI:
  // la propriete par defaut style, donnee par le theme, pose la couleur du
  // filet sur l element meme, ou elle l emporte sur la classe de Backstage.
  // Le filet des fonds sombres de la charte, comme les filets du menu
  // (nav/Sidebar.tsx): la barre est Noir OSCAR dans les deux themes.
  MuiBottomNavigation: {
    defaultProps: { style: { borderTopColor: derives.filetSombre } },
  },
  MuiChip: {
    styleOverrides: {
      // La couleur du texte: Material UI la calcule d apres le fond, et rend
      // un noir pur a 87 % fixe, hors charte.
      root: { borderRadius: 999, fontFamily: polices.technique, color: t.texte },
      // Le contour des pastilles a contour: noir pur a 23 % chez Material UI.
      outlined: { borderColor: t.filet },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: { borderRadius: 18, border: `1px solid ${t.filet}` },
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
  components: composants({
    filet: derives.filetClair,
    texte: palette.noir,
    secondaire: palette.gris,
    encart: nuances.papierSoutenu,
    poignee: nuances.papierSoutenu,
    poigneeActive: palette.gris,
  }),
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
    // Le fond des blocs de code du guide: la carte. Sur le papier soutenu, le
    // gris des numeros de ligne n atteignait que 4,31 pour 1 (mesure a
    // l ecran), sous le minimum de 4,5; sur la carte, 5,3.
    code: { background: nuances.carte },
  },
});

export const themeSombre: UnifiedTheme = createUnifiedTheme({
  fontFamily: polices.texte,
  typography: titres(palette.papier),
  defaultPageTheme: 'home',
  pageTheme,
  components: composants({
    filet: derives.filetSombre,
    texte: palette.papier,
    secondaire: derives.texteSecondaireSombre,
    encart: nuances.sombreSurface,
    poignee: palette.gris,
    poigneeActive: derives.texteSecondaireSombre,
  }),
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
