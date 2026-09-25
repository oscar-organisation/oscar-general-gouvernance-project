/*
 * Les couleurs de Backstage UI, la seconde bibliotheque d interface du
 * portail, tirees des memes jetons que les themes.
 *
 * Backstage UI ne lit pas le theme de Material UI: elle lit des variables CSS,
 * --bui-..., que sa documentation invite a redefinir pour changer son
 * apparence. On les redefinit ici, sous l attribut data-theme-name que le
 * fournisseur de theme de Backstage pose sur la page. Aucune couleur n est
 * ecrite en clair: tout vient de jetons.ts.
 *
 * Comme pour les themes, la charte n a pas de couleur d etat: l orange porte
 * l erreur et l avertissement, l encre ou le papier la reussite et
 * l information.
 */

import { derives, nuances, palette, transparence } from './jetons';
import { polices } from './themes';

type Variables = Record<`--bui-${string}`, string>;

/** Les teintes d une famille d etat de Backstage UI. */
type Famille = {
  bg: string;
  fg: string;
  subdued: string;
  fgSubdued: string;
  border: string;
};

/** Ce qui ne change pas d un theme a l autre. */
const communes: Variables = {
  '--bui-font-regular': polices.texte,
  '--bui-black': palette.noir,
  '--bui-white': nuances.carte,
  '--bui-ring': palette.orange,
};

/**
 * Les roles de couleur d un theme, et les teintes qui les remplissent. Chaque
 * variable de Backstage UI reprend l un de ces roles.
 */
type Roles = {
  fond: string;
  surface: string;
  surfaceBis: string;
  texte: string;
  texteSecondaire: string;
  texteEteint: string;
  filet: string;
  filetFort: string;
  plein: string;
  surPlein: string;
  survol: string;
  appui: string;
  eteint: string;
  barre: string;
};

function variables(r: Roles): Variables {
  // Les quatre familles d etat de Backstage UI, ramenees aux couleurs de la
  // charte: l orange signale, l encre (ou le papier) informe.
  const signal: Famille = {
    bg: palette.orange,
    fg: palette.noir,
    subdued: r.surfaceBis,
    fgSubdued: r.texte,
    border: palette.orange,
  };
  const neutre: Famille = {
    bg: r.plein,
    fg: r.surPlein,
    subdued: r.surfaceBis,
    fgSubdued: r.texte,
    border: r.filetFort,
  };
  const famille = (nom: string, f: Famille): Variables => ({
    [`--bui-${nom}-bg`]: f.bg,
    [`--bui-${nom}-bg-hover`]: f.bg,
    [`--bui-${nom}-bg-disabled`]: r.eteint,
    [`--bui-${nom}-bg-subdued`]: f.subdued,
    [`--bui-${nom}-bg-subdued-hover`]: f.subdued,
    [`--bui-${nom}-bg-subdued-disabled`]: f.subdued,
    [`--bui-${nom}-border`]: f.border,
    [`--bui-${nom}-fg`]: f.fg,
    [`--bui-${nom}-fg-disabled`]: r.texteEteint,
    [`--bui-${nom}-fg-subdued`]: f.fgSubdued,
    [`--bui-${nom}-fg-subdued-disabled`]: r.texteEteint,
  });
  return {
    ...communes,
    '--bui-scrollbar': r.barre,
    '--bui-scrollbar-thumb': r.texteSecondaire,
    '--bui-bg-app': r.fond,
    '--bui-bg-neutral-1': r.surface,
    '--bui-bg-neutral-2': r.surfaceBis,
    '--bui-bg-neutral-3': r.surface,
    '--bui-bg-neutral-4': r.surfaceBis,
    '--bui-bg-neutral-1-hover': r.survol,
    '--bui-bg-neutral-1-pressed': r.appui,
    '--bui-bg-neutral-1-disabled': r.eteint,
    '--bui-bg-neutral-2-hover': r.survol,
    '--bui-bg-neutral-2-pressed': r.appui,
    '--bui-bg-neutral-2-disabled': r.eteint,
    '--bui-bg-neutral-3-hover': r.survol,
    '--bui-bg-neutral-3-pressed': r.appui,
    '--bui-bg-neutral-3-disabled': r.eteint,
    '--bui-bg-neutral-4-hover': r.survol,
    '--bui-bg-neutral-4-pressed': r.appui,
    '--bui-bg-neutral-4-disabled': r.eteint,
    '--bui-fg-primary': r.texte,
    '--bui-fg-secondary': r.texteSecondaire,
    '--bui-fg-disabled': r.texteEteint,
    '--bui-fg-positive': r.texte,
    '--bui-fg-negative': palette.orange,
    '--bui-fg-warning': palette.orange,
    '--bui-fg-announcement': r.texte,
    '--bui-border-1': r.filet,
    '--bui-border-2': r.filetFort,
    '--bui-accent-bg': r.plein,
    '--bui-accent-bg-hover': r.plein,
    '--bui-accent-bg-disabled': r.eteint,
    '--bui-accent-fg': r.surPlein,
    '--bui-accent-fg-disabled': r.texteEteint,
    ...famille('announcement', neutre),
    ...famille('warning', signal),
    ...famille('negative', signal),
    ...famille('positive', neutre),
    '--bui-bg-solid': r.plein,
    '--bui-bg-solid-hover': r.plein,
    '--bui-bg-solid-pressed': r.plein,
    '--bui-bg-solid-disabled': r.eteint,
    '--bui-fg-solid': r.surPlein,
    '--bui-fg-solid-disabled': r.texteEteint,
    '--bui-bg-danger': r.surfaceBis,
    '--bui-bg-warning': r.surfaceBis,
    '--bui-bg-success': r.surfaceBis,
    '--bui-bg-info': r.surfaceBis,
    '--bui-fg-danger-on-bg': r.texte,
    '--bui-fg-warning-on-bg': r.texte,
    '--bui-fg-success-on-bg': r.texte,
    '--bui-fg-info-on-bg': r.texte,
    '--bui-fg-danger': palette.orange,
    '--bui-fg-success': r.texte,
    '--bui-fg-info': r.texte,
    '--bui-border-info': r.filetFort,
    '--bui-border-danger': palette.orange,
    '--bui-border-warning': palette.orange,
    '--bui-border-success': r.filetFort,
  };
}

export const variablesClaires: Variables = variables({
  fond: palette.papier,
  surface: nuances.carte,
  surfaceBis: nuances.papierSoutenu,
  texte: palette.noir,
  texteSecondaire: palette.gris,
  texteEteint: transparence(palette.noir, 0.38),
  filet: derives.filetClair,
  filetFort: palette.gris,
  plein: palette.noir,
  surPlein: palette.papier,
  survol: transparence(palette.noir, 0.06),
  appui: transparence(palette.noir, 0.12),
  eteint: transparence(palette.noir, 0.06),
  barre: transparence(palette.noir, 0.12),
});

export const variablesSombres: Variables = variables({
  fond: nuances.sombre,
  surface: nuances.sombreSurface,
  surfaceBis: palette.noir,
  texte: palette.papier,
  texteSecondaire: derives.texteSecondaireSombre,
  texteEteint: transparence(palette.papier, 0.38),
  filet: derives.filetSombre,
  filetFort: derives.texteSecondaireSombre,
  plein: palette.papier,
  surPlein: palette.noir,
  survol: transparence(palette.papier, 0.08),
  appui: transparence(palette.papier, 0.14),
  eteint: transparence(palette.papier, 0.08),
  barre: transparence(palette.papier, 0.12),
});
