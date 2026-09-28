/*
 * La page d accueil du portail, « Commencer ici ».
 *
 * Elle s adresse a quelqu un qui arrive sur OSCAR: par ou commencer, ou est le
 * guide, quelles applications existent et ou les voir, quels outils servent.
 * Son style suit la page de la charte: etiquettes en Space Grotesk, filets
 * fins, beaucoup d air, cartes arrondies.
 *
 * Aucune adresse d application n est ecrite ici. Les applications, les
 * outils et le deploiement sont des fiches du catalogue, nommees dans la
 * configuration de la page (app-config.yaml): leur titre, leur description et
 * leurs liens viennent de ces fiches, qui vivent dans le depot de chacun. Une
 * application de plus demande une ligne de configuration, pas une ligne de
 * code. Il en va de meme du tableau de bord du proxy: son adresse et le
 * chemin de ses identifiants sont dans la configuration, pas ici.
 */

import { useEffect, useId, useState } from 'react';
import { Link } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  Entity,
  parseEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { catalogApiRef, EntityRefLink } from '@backstage/plugin-catalog-react';
import { makeStyles } from '@material-ui/core/styles';
import symbole from '../../marque/oscar-symbole-blanc-96.png';
import { Etiquette } from '../charte/composants';
import { polices } from '../charte/themes';

/**
 * Le tableau de bord de Traefik, le proxy du serveur. Il est protege par un
 * identifiant et un mot de passe: la page ne donne que le chemin du fichier
 * qui les porte, sur le serveur, jamais leur valeur.
 */
export type ReglagesDeTraefik = {
  /** L adresse du tableau de bord. */
  adresse: string;
  /** Le chemin du fichier des identifiants, sous secret_root/. */
  identifiants: string;
  /** La page de documentation qui explique comment y acceder. */
  documentation?: { fiche: string; page: string };
};

/** Ce que la configuration de la page donne. */
export type ReglagesDeLAccueil = {
  /** La fiche qui porte le guide du cycle, dont la documentation s ouvre. */
  guide: string;
  /** Les applications qui suivent le cycle, par leur reference de fiche. */
  applications: string[];
  /** Les outils de l equipe, par leur reference de fiche. */
  outils: string[];
  /**
   * La partie « Le deploiement »: comment les applications tournent sur le
   * serveur, et comment refaire le tout. Sans ce reglage, elle ne s affiche
   * pas.
   */
  deploiement?: { fiches: string[]; traefik?: ReglagesDeTraefik };
};

const useStyles = makeStyles(theme => ({
  page: {
    background: theme.palette.background.default,
    color: theme.palette.text.primary,
    minHeight: '100%',
  },
  enveloppe: {
    maxWidth: 1120,
    margin: '0 auto',
    padding: '0 24px 64px',
  },
  bandeau: {
    // Le seul fond sombre de la page: le symbole blanc n y va que la.
    background: theme.palette.navigation.background,
    color: theme.palette.navigation.selectedColor,
  },
  bandeauInterieur: {
    maxWidth: 1120,
    margin: '0 auto',
    padding: '48px 24px',
    display: 'flex',
    gap: 32,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  symbole: { height: 48, width: 'auto', display: 'block' },
  essence: {
    fontFamily: polices.technique,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    marginTop: 16,
    color: theme.palette.navigation.color,
  },
  grandTitre: {
    fontFamily: polices.texte,
    fontWeight: 300,
    fontSize: 'clamp(44px, 7vw, 88px)',
    letterSpacing: '-0.045em',
    lineHeight: 0.95,
    margin: 0,
  },
  point: { color: theme.palette.secondary.main },
  developpe: {
    fontFamily: polices.technique,
    fontSize: 13,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    marginTop: 16,
  },
  accroche: {
    fontSize: 17,
    lineHeight: 1.6,
    marginTop: 12,
    maxWidth: 620,
    color: theme.palette.navigation.color,
  },
  section: {
    paddingTop: 48,
    marginTop: 48,
    borderTop: `1px solid ${theme.palette.divider}`,
    '&:first-of-type': { borderTop: 'none', marginTop: 0 },
  },
  titreDeSection: {
    fontSize: 'clamp(24px, 3vw, 32px)',
    fontWeight: 500,
    letterSpacing: '-0.02em',
    margin: '16px 0 8px',
  },
  chapeau: {
    color: theme.palette.text.secondary,
    fontSize: 16,
    maxWidth: 640,
    margin: 0,
  },
  etapes: {
    listStyle: 'none',
    padding: 0,
    margin: '24px 0 0',
    display: 'grid',
    gap: 16,
  },
  etape: { display: 'flex', gap: 16, alignItems: 'baseline' },
  numero: {
    fontFamily: polices.technique,
    fontWeight: 600,
    fontSize: 12,
    minWidth: 28,
    paddingBottom: 2,
    // L orange souligne le numero sans le porter: en texte de cette taille,
    // il ne se lirait pas assez (3,5 pour 1 sur le papier).
    borderBottom: `2px solid ${theme.palette.secondary.main}`,
  },
  texteEtape: { fontSize: 16, lineHeight: 1.6, margin: 0 },
  grille: {
    display: 'grid',
    gap: 20,
    marginTop: 24,
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  },
  carte: {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 18,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  titreDeCarte: { fontSize: 20, fontWeight: 600, margin: 0 },
  description: {
    color: theme.palette.text.secondary,
    fontSize: 14,
    lineHeight: 1.6,
    margin: 0,
  },
  liens: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'grid',
    gap: 6,
    fontSize: 14,
  },
  absente: { color: theme.palette.text.secondary, fontSize: 14, margin: 0 },
  // Le bloc du tableau de bord: une carte comme les autres, pleine largeur,
  // au-dessus des fiches.
  bloc: { marginTop: 24 },
  // Un chemin de fichier: la police technique de la charte, et le droit de
  // passer a la ligne n importe ou, pour tenir sur un telephone.
  chemin: {
    fontFamily: polices.technique,
    color: theme.palette.text.primary,
    overflowWrap: 'anywhere',
  },
}));

/** L adresse de la documentation d une fiche, dans le lecteur TechDocs. */
export function adresseDeLaDocumentation(reference: string, page = ''): string {
  const { kind, namespace, name } = parseEntityRef(reference, {
    defaultKind: 'component',
    defaultNamespace: 'default',
  });
  return `/docs/${namespace}/${kind.toLocaleLowerCase('en-US')}/${name}/${page}`;
}

/** Lit les fiches nommees, dans l ordre; une fiche absente rend undefined. */
function useFiches(references: string[]) {
  const catalogue = useApi(catalogApiRef);
  const [fiches, setFiches] = useState<(Entity | undefined)[] | undefined>();
  const [erreur, setErreur] = useState<Error | undefined>();
  const cle = references.join(',');
  useEffect(() => {
    let annule = false;
    catalogue
      .getEntitiesByRefs({ entityRefs: references })
      .then(reponse => !annule && setFiches(reponse.items))
      .catch(e => !annule && setErreur(e));
    return () => {
      annule = true;
    };
    // La liste ne change qu avec la configuration: cle suffit a la suivre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogue, cle]);
  return { fiches, erreur };
}

const CarteDeFiche = (props: { reference: string; fiche?: Entity }) => {
  const classes = useStyles();
  const { reference, fiche } = props;
  if (!fiche) {
    return (
      <article className={classes.carte}>
        <h3 className={classes.titreDeCarte}>{reference}</h3>
        <p className={classes.absente}>
          Cette fiche n'est pas encore dans le catalogue.
        </p>
      </article>
    );
  }
  const titre = fiche.metadata.title ?? fiche.metadata.name;
  // Une fiche qui porte une documentation (l annotation que lit TechDocs) y
  // mene directement: c est souvent la premiere chose qu on y cherche.
  const documentee = Boolean(
    fiche.metadata.annotations?.['backstage.io/techdocs-ref'],
  );
  return (
    <article className={classes.carte}>
      <h3 className={classes.titreDeCarte}>{titre}</h3>
      {fiche.metadata.description && (
        <p className={classes.description}>{fiche.metadata.description}</p>
      )}
      <ul className={classes.liens}>
        {(fiche.metadata.links ?? []).map(lien => (
          <li key={lien.url}>
            <Link to={lien.url}>{lien.title ?? lien.url}</Link>
          </li>
        ))}
        {documentee && (
          <li>
            <Link to={adresseDeLaDocumentation(stringifyEntityRef(fiche))}>
              La documentation
            </Link>
          </li>
        )}
        <li>
          <EntityRefLink entityRef={fiche}>La fiche dans le catalogue</EntityRefLink>
        </li>
      </ul>
    </article>
  );
};

/**
 * Le tableau de bord de Traefik: ce qu on y lit, ou sont ses identifiants, et
 * comment y acceder. Le mot de passe n apparait jamais: seulement le chemin du
 * fichier qui le porte, sur le serveur du projet.
 */
const BlocTraefik = (props: { reglages: ReglagesDeTraefik }) => {
  const classes = useStyles();
  const { adresse, identifiants, documentation } = props.reglages;
  const idDuTitre = useId();
  return (
    <article
      className={`${classes.carte} ${classes.bloc}`}
      aria-labelledby={idDuTitre}
    >
      <h3 id={idDuTitre} className={classes.titreDeCarte}>
        Le tableau de bord de Traefik
      </h3>
      <p className={classes.description}>
        Il montre, en lecture seule, ce que le proxy sait: chaque adresse
        servie, l'application vers laquelle il l'envoie, les règles appliquées
        au passage et les erreurs de configuration. Il ne permet de rien
        changer: il sert à comprendre pourquoi une adresse ne mène pas où on
        l'attend.
      </p>
      <p className={classes.description}>
        Le navigateur demande un identifiant et un mot de passe. Ils sont sur
        le serveur du projet, dans le fichier{' '}
        <span className={classes.chemin}>{identifiants}</span>. On donne ce
        chemin, jamais le mot de passe.
      </p>
      <ul className={classes.liens}>
        <li>
          <Link to={adresse}>Ouvrir le tableau de bord</Link>
        </li>
        {documentation && (
          <li>
            <Link
              to={adresseDeLaDocumentation(documentation.fiche, documentation.page)}
            >
              Comment y accéder, et ce qu'on y lit
            </Link>
          </li>
        )}
      </ul>
    </article>
  );
};

const Fiches = (props: { references: string[] }) => {
  const classes = useStyles();
  const { fiches, erreur } = useFiches(props.references);
  if (erreur) {
    return (
      <p className={classes.absente}>
        Le catalogue ne répond pas: {erreur.message}
      </p>
    );
  }
  if (!fiches) {
    return <p className={classes.absente}>Lecture du catalogue...</p>;
  }
  return (
    <div className={classes.grille}>
      {props.references.map((reference, i) => (
        <CarteDeFiche key={reference} reference={reference} fiche={fiches[i]} />
      ))}
    </div>
  );
};

export const CommencerIci = (props: { reglages: ReglagesDeLAccueil }) => {
  const classes = useStyles();
  const { guide, applications, outils, deploiement } = props.reglages;

  return (
    <div className={classes.page}>
      <header className={classes.bandeau}>
        <div className={classes.bandeauInterieur}>
          <img src={symbole} alt="" className={classes.symbole} />
          <div>
            <h1 className={classes.grandTitre}>
              OSCAR<span className={classes.point}>.</span>
            </h1>
            <p className={classes.developpe}>
              Operating System &amp; Control Architecture for Robotics
            </p>
            <p className={classes.accroche}>
              Le portail technique: les applications d'OSCAR, leur code, leurs
              vérifications automatiques, et le guide pour les faire évoluer.
            </p>
            <p className={classes.essence}>Sense · Plan · Execute</p>
          </div>
        </div>
      </header>

      <main className={classes.enveloppe}>
        <section className={classes.section}>
          <Etiquette as="h2">Commencer ici</Etiquette>
          <p className={classes.titreDeSection}>Quatre lectures, dans l'ordre.</p>
          <ol className={classes.etapes}>
            <li className={classes.etape}>
              <span className={classes.numero}>01</span>
              <p className={classes.texteEtape}>
                Lire{' '}
                <Link to="https://github.com/oscar-organisation/oscar-gestion-incidents-and-reports/blob/main/LECONS-A-RESPECTER.md">
                  les leçons à respecter
                </Link>
                , en entier: chaque règle vient d'un incident réel.
              </p>
            </li>
            <li className={classes.etape}>
              <span className={classes.numero}>02</span>
              <p className={classes.texteEtape}>
                Lire{' '}
                <Link to={adresseDeLaDocumentation(guide, '03-comment-se-comporter/')}>
                  comment se comporter
                </Link>
                : les règles de l'équipe, en une page.
              </p>
            </li>
            <li className={classes.etape}>
              <span className={classes.numero}>03</span>
              <p className={classes.texteEtape}>
                Suivre{' '}
                <Link to={adresseDeLaDocumentation(guide, '02-le-cycle-pas-a-pas/')}>
                  le cycle pas à pas
                </Link>
                , du clonage du dépôt jusqu'à la production.
              </p>
            </li>
            <li className={classes.etape}>
              <span className={classes.numero}>04</span>
              <p className={classes.texteEtape}>
                Garder{' '}
                <Link to={adresseDeLaDocumentation(guide, '09-glossaire/')}>
                  le glossaire
                </Link>{' '}
                sous la main. Le guide entier:{' '}
                <Link to={adresseDeLaDocumentation(guide)}>le guide du cycle</Link>.
              </p>
            </li>
          </ol>
        </section>

        <section className={classes.section}>
          <Etiquette as="h2">Les applications</Etiquette>
          <p className={classes.titreDeSection}>
            Celles qui suivent le cycle aujourd'hui.
          </p>
          <p className={classes.chapeau}>
            Chacune a un environnement de test et un de production. Leur fiche
            donne l'état de leurs vérifications automatiques et tous leurs
            liens.
          </p>
          <Fiches references={applications} />
        </section>

        <section className={classes.section}>
          <Etiquette as="h2">Les outils</Etiquette>
          <p className={classes.titreDeSection}>Où le travail se voit.</p>
          <Fiches references={outils} />
        </section>

        {deploiement && (
          <section className={classes.section} aria-label="Le déploiement">
            <Etiquette as="h2">Le déploiement</Etiquette>
            <p className={classes.titreDeSection}>
              Comment les applications tournent, et comment tout refaire.
            </p>
            <p className={classes.chapeau}>
              Coolify construit et lance chaque application; Traefik, le
              proxy, reçoit les visiteurs et les envoie à la bonne; OVHcloud
              tient le nom de domaine. La documentation du déploiement dit
              comment tout installer, mettre à jour, vérifier, remettre en
              arrière, et refaire sur un serveur neuf.
            </p>
            {deploiement.traefik && <BlocTraefik reglages={deploiement.traefik} />}
            <Fiches references={deploiement.fiches} />
          </section>
        )}
      </main>
    </div>
  );
};
