import { screen, within } from '@testing-library/react';
import { renderInTestApp, TestApiProvider } from '@backstage/frontend-test-utils';
import { catalogApiRef, entityRouteRef } from '@backstage/plugin-catalog-react';
import { catalogApiMock } from '@backstage/plugin-catalog-react/testUtils';
import { Entity } from '@backstage/catalog-model';
import {
  adresseDeLaDocumentation,
  CommencerIci,
  ReglagesDeLAccueil,
} from './CommencerIci';

const outilDns: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'outil-dns',
    title: 'Outil DNS',
    description: 'Gère les noms de domaine.',
    links: [
      { url: 'https://dns.oscar-bot.com', title: "Production, l'interface" },
      { url: 'https://test-dns.oscar-bot.com', title: "Test, l'interface" },
    ],
  },
  spec: { type: 'service', lifecycle: 'production', owner: 'equipe-oscar' },
};

// La fiche du deploiement: elle a une documentation (TechDocs).
const deploiement: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'deploiement',
    title: 'Le déploiement',
    description: 'Comment les applications sont déployées.',
    annotations: { 'backstage.io/techdocs-ref': 'dir:.' },
  },
  spec: { type: 'documentation', lifecycle: 'production', owner: 'equipe-oscar' },
};

const coolify: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Resource',
  metadata: {
    name: 'coolify',
    title: 'Coolify',
    links: [{ url: 'https://coolify.exemple.test', title: 'Coolify' }],
  },
  spec: { type: 'plateforme-de-deploiement', owner: 'equipe-oscar' },
};

// Des adresses d essai: le test ne doit dependre d aucune adresse reelle.
const traefik = {
  adresse: 'https://traefik.exemple.test/dashboard/',
  identifiants: 'secret_root/essai/tableau-de-bord/identifiants.md',
  documentation: { fiche: 'component:default/deploiement', page: 'traefik/' },
};

const reglages = {
  guide: 'component:default/oscar-general-gouvernance-project',
  applications: ['component:default/outil-dns', 'component:default/absente'],
  outils: [],
  deploiement: {
    fiches: [
      'component:default/deploiement',
      'resource:default/coolify',
      'resource:default/absente-du-deploiement',
    ],
    traefik,
  },
};

async function afficher(autres: Partial<ReglagesDeLAccueil> = {}) {
  await renderInTestApp(
    <TestApiProvider
      apis={[
        [
          catalogApiRef,
          catalogApiMock({ entities: [outilDns, deploiement, coolify] }),
        ],
      ]}
    >
      <CommencerIci reglages={{ ...reglages, ...autres }} />
    </TestApiProvider>,
    { mountedRoutes: { '/catalog/:namespace/:kind/:name': entityRouteRef } },
  );
}

describe('la page Commencer ici', () => {
  it('mene au guide du cycle, et a ses pages dans l ordre de lecture', async () => {
    await afficher();
    expect(
      screen.getByRole('link', { name: 'le cycle pas à pas' }),
    ).toHaveAttribute(
      'href',
      '/docs/default/component/oscar-general-gouvernance-project/02-le-cycle-pas-a-pas/',
    );
    expect(screen.getByRole('link', { name: 'le guide du cycle' })).toHaveAttribute(
      'href',
      '/docs/default/component/oscar-general-gouvernance-project/',
    );
  });

  it('montre chaque application avec les liens de sa fiche', async () => {
    await afficher();
    expect(await screen.findByText('Outil DNS')).toBeInTheDocument();
    expect(
      // Un lien vers l exterieur s annonce aussi comme s ouvrant dans une
      // nouvelle fenetre: le debut du nom suffit.
      screen.getByRole('link', { name: /^Production, l'interface/ }),
    ).toHaveAttribute('href', 'https://dns.oscar-bot.com');
    expect(
      screen.getByRole('link', { name: /^Test, l'interface/ }),
    ).toHaveAttribute('href', 'https://test-dns.oscar-bot.com');
  });

  it('dit clairement qu une fiche manque, sans casser la page', async () => {
    // Sans la partie du deploiement, qui a sa propre fiche absente: une
    // seule fiche manque ici, celle des applications.
    await afficher({ deploiement: undefined });
    expect(await screen.findByText('component:default/absente')).toBeInTheDocument();
    expect(
      screen.getByText("Cette fiche n'est pas encore dans le catalogue."),
    ).toBeInTheDocument();
  });

  it('parle francais et nomme OSCAR, jamais Backstage', async () => {
    await afficher();
    expect(screen.getByText('Commencer ici')).toBeInTheDocument();
    expect(screen.queryByText(/Backstage/)).toBeNull();
  });
});

describe('la mise en avant du parcours de mise en ligne', () => {
  const titre = 'Comment une modification arrive en production';

  it('vient en tete de la page, avant les quatre lectures', async () => {
    await afficher();
    const bloc = screen.getByRole('region', { name: titre });
    const commencer = screen.getByRole('heading', { level: 2, name: 'Commencer ici' });
    // Le bloc precede « Commencer ici » dans la page: c est la premiere chose lue.
    expect(
      bloc.compareDocumentPosition(commencer) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('nomme les cinq moments du parcours, dans l ordre', async () => {
    await afficher();
    const bloc = screen.getByRole('region', { name: titre });
    const moments = within(bloc)
      .getAllByRole('listitem')
      .map(moment => within(moment).getByRole('heading', { level: 3 }).textContent);
    expect(moments).toEqual([
      "L'envoi",
      'La PR vers test',
      'La fusion dans test',
      'La PR vers main',
      'La fusion dans main',
    ]);
  });

  it('mene a la page du parcours, dans le guide du cycle', async () => {
    await afficher();
    const bloc = screen.getByRole('region', { name: titre });
    expect(
      within(bloc).getByRole('link', { name: 'Lire le parcours, étape par étape' }),
    ).toHaveAttribute(
      'href',
      '/docs/default/component/oscar-general-gouvernance-project/01-comment-une-modification-arrive-en-production/',
    );
  });
});

describe('la partie Le deploiement', () => {
  it('montre ses fiches, dans l ordre des reglages', async () => {
    await afficher();
    const partie = screen.getByRole('region', { name: 'Le déploiement' });
    expect(
      await within(partie).findByRole('heading', { level: 3, name: 'Coolify' }),
    ).toBeInTheDocument();
    const titres = within(partie)
      .getAllByRole('heading', { level: 3 })
      .map(titre => titre.textContent);
    expect(titres).toEqual([
      'Le tableau de bord de Traefik',
      'Le déploiement',
      'Coolify',
      'resource:default/absente-du-deploiement',
    ]);
  });

  it('mene a la documentation d une fiche qui en a une, et seulement a elle', async () => {
    await afficher();
    const partie = screen.getByRole('region', { name: 'Le déploiement' });
    await within(partie).findByRole('heading', { level: 3, name: 'Coolify' });
    const liens = within(partie).getAllByRole('link', { name: 'La documentation' });
    expect(liens.map(lien => lien.getAttribute('href'))).toEqual([
      '/docs/default/component/deploiement/',
    ]);
  });

  it('donne le tableau de bord de Traefik: son adresse, le chemin des identifiants, sa documentation', async () => {
    await afficher();
    // Attendre la lecture du catalogue, pour que la page soit complete.
    await screen.findByRole('heading', { level: 3, name: 'Coolify' });
    const bloc = screen.getByRole('article', {
      name: 'Le tableau de bord de Traefik',
    });
    expect(
      within(bloc).getByRole('link', { name: /^Ouvrir le tableau de bord/ }),
    ).toHaveAttribute('href', traefik.adresse);
    expect(within(bloc).getByText(traefik.identifiants)).toBeInTheDocument();
    expect(
      within(bloc).getByRole('link', { name: "Comment y accéder, et ce qu'on y lit" }),
    ).toHaveAttribute('href', '/docs/default/component/deploiement/traefik/');
  });

  it('dit clairement qu une fiche du deploiement manque, sans cacher le reste', async () => {
    await afficher();
    const partie = screen.getByRole('region', { name: 'Le déploiement' });
    expect(
      await within(partie).findByText('resource:default/absente-du-deploiement'),
    ).toBeInTheDocument();
    expect(
      within(partie).getByText("Cette fiche n'est pas encore dans le catalogue."),
    ).toBeInTheDocument();
    expect(
      within(partie).getByRole('link', { name: /^Ouvrir le tableau de bord/ }),
    ).toBeInTheDocument();
  });

  it('sans tableau de bord regle, montre les fiches et rien d autre', async () => {
    await afficher({
      deploiement: { fiches: ['resource:default/coolify'] },
    });
    const partie = screen.getByRole('region', { name: 'Le déploiement' });
    expect(
      await within(partie).findByRole('heading', { level: 3, name: 'Coolify' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Le tableau de bord de Traefik')).toBeNull();
  });

  it('sans reglage du deploiement, ne s affiche pas', async () => {
    await afficher({ deploiement: undefined });
    await screen.findByText('Outil DNS');
    expect(screen.queryByRole('region', { name: 'Le déploiement' })).toBeNull();
    expect(screen.queryByText('Le tableau de bord de Traefik')).toBeNull();
  });
});

describe('l adresse de la documentation', () => {
  it('suit la forme du lecteur TechDocs', () => {
    expect(adresseDeLaDocumentation('component:default/guide', '09-glossaire/')).toBe(
      '/docs/default/component/guide/09-glossaire/',
    );
    expect(adresseDeLaDocumentation('guide')).toBe('/docs/default/component/guide/');
  });
});
