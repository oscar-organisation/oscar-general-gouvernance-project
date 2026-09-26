/*
 * Les couleurs de la charte graphique OSCAR, ecrites une seule fois.
 *
 * C est le seul fichier de l interface ou une couleur s ecrit en clair. Le
 * theme clair, le theme sombre et les variables de Backstage UI en sont tous
 * tires: une couleur changee ici change partout, et nulle part ailleurs.
 *
 * La source est la charte officielle, OSCAR_charte_graphique.html, donnee par
 * Joel: les quatre couleurs de la palette, et les nuances de travail que son
 * propre fichier de style definit. Aucune autre couleur n est permise. Un test
 * (charte.test.ts) le verifie sur les deux themes.
 */

/** Les quatre couleurs de la palette. */
export const palette = {
  /** Orange Signal: l accent unique. Elements actifs, donnees critiques. */
  orange: '#D85810',
  /** Noir OSCAR: l encre. Titres, texte, fonds sombres. */
  noir: '#1B1D1E',
  /** Papier: le fond clair par defaut, jamais du blanc pur. */
  papier: '#F3F1EC',
  /** Gris: texte secondaire, legendes, mentions techniques. */
  gris: '#6B6B6B',
} as const;

/** Les nuances de travail du fichier de style de la charte. */
export const nuances = {
  /** --bg-2: un papier un peu plus soutenu, pour separer deux zones. */
  papierSoutenu: '#EAE7DF',
  /** --card: les cartes posees sur le papier. */
  carte: '#FFFFFF',
  /** --ink-soft: le texte courant long, un peu moins dense que l encre. */
  encreDouce: '#33383A',
  /** --dark: le fond du theme sombre. */
  sombre: '#161513',
  /** --dark-2: les surfaces posees sur le fond sombre. */
  sombreSurface: '#1F1D1A',
} as const;

/** Une couleur de la charte, rendue transparente a une proportion donnee. */
export function transparence(couleur: string, opacite: number): string {
  const rouge = parseInt(couleur.slice(1, 3), 16);
  const vert = parseInt(couleur.slice(3, 5), 16);
  const bleu = parseInt(couleur.slice(5, 7), 16);
  return `rgba(${rouge}, ${vert}, ${bleu}, ${opacite})`;
}

/**
 * Les filets et les teintes de texte, tires des couleurs ci-dessus par
 * transparence, comme la charte le fait pour ses filets (--line: le noir a
 * 12 %). Aucune n est une couleur nouvelle.
 */
export const derives = {
  /** --line: les filets et bordures sur fond clair. */
  filetClair: transparence(palette.noir, 0.12),
  /** Les filets sur fond sombre: le papier a 12 %. */
  filetSombre: transparence(palette.papier, 0.12),
  /**
   * Le texte secondaire sur fond sombre. Le gris de la charte n y atteint que
   * 3,4 pour 1, sous le minimum de 4,5 pour du texte: on prend le papier a
   * 72 %, qui atteint 8,7 pour 1 sur le fond sombre.
   */
  texteSecondaireSombre: transparence(palette.papier, 0.72),
} as const;
