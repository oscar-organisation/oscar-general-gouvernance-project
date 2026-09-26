import { connexionGitHub, fournisseursDeConnexion } from './fournisseurs';

describe('les moyens de connexion proposes', () => {
  it('sur le poste du developpeur: l invite, et lui seul', () => {
    expect(fournisseursDeConnexion('development')).toEqual(['guest']);
  });

  it('en test et en production: GitHub, et lui seul', () => {
    expect(fournisseursDeConnexion('production')).toEqual([connexionGitHub]);
  });

  it('sans reglage: GitHub, jamais l invite', () => {
    // Un oubli de configuration ne doit jamais ouvrir l acces invite.
    expect(fournisseursDeConnexion(undefined)).toEqual([connexionGitHub]);
    expect(fournisseursDeConnexion('')).toEqual([connexionGitHub]);
  });
});
