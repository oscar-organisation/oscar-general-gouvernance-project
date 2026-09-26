import { screen } from '@testing-library/react';
import { renderInTestApp, TestApiProvider } from '@backstage/frontend-test-utils';
import { catalogApiRef, entityRouteRef } from '@backstage/plugin-catalog-react';
import { catalogApiMock } from '@backstage/plugin-catalog-react/testUtils';
import { Entity } from '@backstage/catalog-model';
import { adresseDeLaDocumentation, CommencerIci } from './CommencerIci';

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

const reglages = {
  guide: 'component:default/oscar-general-gouvernance-project',
  applications: ['component:default/outil-dns', 'component:default/absente'],
  outils: [],
};

async function afficher() {
  await renderInTestApp(
    <TestApiProvider
      apis={[[catalogApiRef, catalogApiMock({ entities: [outilDns] })]]}
    >
      <CommencerIci reglages={reglages} />
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
    await afficher();
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

describe('l adresse de la documentation', () => {
  it('suit la forme du lecteur TechDocs', () => {
    expect(adresseDeLaDocumentation('component:default/guide', '09-glossaire/')).toBe(
      '/docs/default/component/guide/09-glossaire/',
    );
    expect(adresseDeLaDocumentation('guide')).toBe('/docs/default/component/guide/');
  });
});
