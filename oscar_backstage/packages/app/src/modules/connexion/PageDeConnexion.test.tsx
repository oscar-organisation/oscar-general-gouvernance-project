import { screen } from '@testing-library/react';
import { configApiRef } from '@backstage/core-plugin-api';
import {
  mockApis,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/frontend-test-utils';
import { PageDeConnexion } from './index';

/** La page de connexion, telle que le portail la montre sur le poste. */
async function afficher() {
  await renderInTestApp(
    <TestApiProvider
      apis={[
        [
          configApiRef,
          mockApis.config({
            data: { app: { title: 'OSCAR' }, auth: { environment: 'development' } },
          }),
        ],
      ]}
    >
      <PageDeConnexion onSignInSuccess={jest.fn()} />
    </TestApiProvider>,
  );
}

describe('la page de connexion', () => {
  it('montre l icone OSCAR devant son titre', async () => {
    await afficher();
    const titre = await screen.findByRole('heading', {
      level: 2,
      name: 'Se connecter au portail technique',
    });
    // L icone et le titre vont ensemble, dans le meme bloc.
    const icone = titre.parentElement?.querySelector('img');
    expect(icone).toBeTruthy();
    // L icone d application fabriquee par le generateur de marque
    // (marque/fabriquer.py), jamais une image faite a la main.
    expect(icone).toHaveAttribute('src', expect.stringContaining('oscar-icone-96'));
    // Decorative: le nom OSCAR est deja ecrit dans le bandeau de la page.
    expect(icone).toHaveAttribute('alt', '');
  });

  it('garde un seul titre, celui de la page', async () => {
    await afficher();
    await screen.findByRole('heading', {
      level: 2,
      name: 'Se connecter au portail technique',
    });
    expect(
      screen.getAllByText('Se connecter au portail technique'),
    ).toHaveLength(1);
  });
});
