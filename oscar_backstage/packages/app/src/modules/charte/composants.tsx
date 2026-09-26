/*
 * Les petits elements de la charte, employes par l accueil: l etiquette en
 * Space Grotesk, precedee d un filet orange.
 * Leurs couleurs viennent du theme, jamais d une valeur ecrite ici.
 */

import { ReactNode } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { polices } from './themes';

const useStyles = makeStyles(theme => ({
  etiquette: {
    fontFamily: polices.technique,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    // Le texte est a l encre, et l orange reste au filet qui le precede:
    // l orange n atteint que 3,5 pour 1 sur le papier, sous le minimum de
    // 4,5 pour un texte de cette taille. La charte met ce texte en orange;
    // on garde son dessin, pas ce defaut de lecture.
    color: theme.palette.text.primary,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 12,
    margin: 0,
    '&::before': {
      content: '""',
      width: 24,
      height: 1,
      background: theme.palette.secondary.main,
    },
  },
}));

/** Le petit titre de section, en majuscules espacees, precede d un filet. */
export const Etiquette = (props: { children: ReactNode; as?: 'p' | 'h2' }) => {
  const classes = useStyles();
  const Balise = props.as ?? 'p';
  return <Balise className={classes.etiquette}>{props.children}</Balise>;
};
