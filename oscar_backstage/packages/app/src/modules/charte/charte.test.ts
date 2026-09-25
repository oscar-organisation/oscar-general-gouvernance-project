/*
 * Les deux themes et les variables de Backstage UI respectent la charte:
 * aucune couleur hors de la palette et de ses nuances de travail, et des
 * contrastes lisibles (niveau AA des regles d accessibilite du web).
 */

import { Theme } from '@material-ui/core/styles';
import { derives, nuances, palette } from './jetons';
import { themeClair, themeSombre } from './themes';
import { variablesClaires, variablesSombres } from './backstageUi';

const PERMISES = new Set(
  [...Object.values(palette), ...Object.values(nuances)].map(c =>
    c.toUpperCase(),
  ),
);

/** Toutes les couleurs ecrites dans une valeur: #RRGGBB et rgba(r, g, b, a). */
function couleurs(valeur: string): string[] {
  const hexa = valeur.match(/#[0-9a-fA-F]{6}\b/g) ?? [];
  const rgba = [...valeur.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)].map(
    m =>
      `#${[m[1], m[2], m[3]]
        .map(n => Number(n).toString(16).padStart(2, '0'))
        .join('')}`,
  );
  return [...hexa, ...rgba].map(c => c.toUpperCase());
}

/** Toutes les chaines d un objet, a toute profondeur. */
function chaines(objet: unknown): string[] {
  if (typeof objet === 'string') return [objet];
  if (objet && typeof objet === 'object') {
    return Object.values(objet as Record<string, unknown>).flatMap(chaines);
  }
  return [];
}

function luminance(hexa: string): number {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hexa.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Le rapport de contraste entre deux couleurs opaques. */
function contraste(a: string, b: string): number {
  const [claire, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (claire + 0.05) / (sombre + 0.05);
}

/** Une couleur transparente, posee sur un fond: la couleur que l on voit. */
function surFond(couleur: string, fond: string): string {
  const m = couleur.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (!m) return couleur;
  const alpha = Number(m[4]);
  const f = [1, 3, 5].map(i => parseInt(fond.slice(i, i + 2), 16));
  return `#${[m[1], m[2], m[3]]
    .map((c, i) =>
      Math.round(alpha * Number(c) + (1 - alpha) * f[i])
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

const v4 = (theme: typeof themeClair) => theme.getTheme('v4') as Theme;

describe.each([
  ['clair', themeClair, variablesClaires],
  ['sombre', themeSombre, variablesSombres],
])('le theme %s', (_nom, theme, variables) => {
  it('n emploie aucune couleur hors de la charte', () => {
    const employees = [
      ...chaines(v4(theme).palette),
      ...chaines((v4(theme) as any).page),
      // Les reglages de composants: une couleur ecrite dans une surcharge
      // (alertes, boutons, filet du menu) doit aussi venir des jetons.
      ...chaines((v4(theme) as any).overrides),
      ...Object.values(variables),
    ].flatMap(couleurs);
    expect(employees.length).toBeGreaterThan(50);
    expect([...new Set(employees.filter(c => !PERMISES.has(c)))]).toEqual([]);
  });

  it('se lit: texte principal et secondaire a 4,5 pour 1 au moins', () => {
    const p = v4(theme).palette;
    for (const fond of [p.background.default, p.background.paper]) {
      expect(contraste(p.text.primary, fond)).toBeGreaterThanOrEqual(4.5);
      expect(
        contraste(surFond(p.text.secondary, fond), fond),
      ).toBeGreaterThanOrEqual(4.5);
    }
    expect(
      contraste(p.primary.main, p.primary.contrastText),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('garde l orange pour l accent, et seulement lui', () => {
    const p = v4(theme).palette as any;
    expect(p.secondary.main).toBe(palette.orange);
    expect(p.navigation.indicator).toBe(palette.orange);
    expect(p.tabbar.indicator).toBe(palette.orange);
    expect(p.text.primary).not.toBe(palette.orange);
    expect(p.primary.main).not.toBe(palette.orange);
  });
});

describe('le menu', () => {
  it('se lit sur son fond Noir OSCAR', () => {
    const nav = (v4(themeClair).palette as any).navigation;
    expect(contraste(nav.selectedColor, nav.background)).toBeGreaterThanOrEqual(4.5);
    expect(
      contraste(surFond(derives.texteSecondaireSombre, nav.background), nav.background),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
