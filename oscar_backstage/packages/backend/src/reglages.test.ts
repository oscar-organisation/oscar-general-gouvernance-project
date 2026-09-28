/*
 * Les reglages du portail tiennent leurs promesses.
 *
 * Ces tests ne lancent rien: ils lisent la composition, les fichiers
 * d environnement, les reglages de Backstage, le Dockerfile et le catalogue,
 * et verifient ce que le portail promet ailleurs, dans les commentaires et
 * dans le guide. Chaque promesse a son test, et chaque test dit d ou vient la
 * regle.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parse, parseAllDocuments } from 'yaml';

// Le dossier du portail, deux niveaux au-dessus de packages/backend.
const PORTAIL = path.resolve(__dirname, '..', '..', '..');

const lire = (fichier: string) =>
  fs.readFileSync(path.join(PORTAIL, fichier), 'utf8');
const yaml = (fichier: string) => parse(lire(fichier));

describe('la composition lue par Coolify, compose.yaml', () => {
  const composition = yaml('compose.yaml');
  const services = Object.entries<any>(composition.services);

  it('ne publie aucun port, ne nomme aucun conteneur, ne pose aucune regle de proxy', () => {
    // Lecon 5.4: un port publie ou un nom de conteneur est unique sur une
    // machine; le test et la production ne pourraient plus cohabiter. Les
    // regles de proxy, c est Coolify qui les pose, depuis le domaine.
    for (const [nom, service] of services) {
      expect([nom, service.ports]).toEqual([nom, undefined]);
      expect([nom, service.container_name]).toEqual([nom, undefined]);
      expect([nom, service.labels]).toEqual([nom, undefined]);
    }
  });

  it('ne rejoint aucun reseau exterieur', () => {
    for (const reseau of Object.values<any>(composition.networks ?? {})) {
      expect(reseau?.external).toBeFalsy();
    }
  });

  it('expose le portail sur le port de Backstage, 7007', () => {
    expect(composition.services.portail.expose).toEqual(['7007']);
  });

  it('controle la sante du portail sur la route de disponibilite, qui peut echouer', () => {
    // Lecon 3.7: /healthcheck n existait pas et repondait toujours.
    const test = composition.services.portail.healthcheck.test.join(' ');
    expect(test).toContain('/.backstage/health/v1/readiness');
    expect(test).not.toContain('/healthcheck');
  });

  it('donne a la base un volume nomme et son propre controle de sante', () => {
    const base = composition.services.base;
    expect(base.volumes).toEqual(['base-du-portail:/var/lib/postgresql/data']);
    expect(Object.keys(composition.volumes)).toContain('base-du-portail');
    expect(base.healthcheck.test.join(' ')).toContain('pg_isready');
    expect(composition.services.portail.depends_on.base.condition).toBe(
      'service_healthy',
    );
  });

  it('construit l image d execution, et aucune autre', () => {
    expect(composition.services.portail.build.target).toBe('execution');
  });
});

describe('le complement du poste, compose.override.yaml', () => {
  const complement = yaml('compose.override.yaml');

  it('publie seulement dans le bloc 185xx, et seulement sur 127.0.0.1', () => {
    // _pilotage/09-CONVENTION-des-ports.md: le bloc du portail.
    const ports = Object.values<any>(complement.services).flatMap(
      s => s.ports ?? [],
    );
    expect(ports.length).toBe(3);
    for (const port of ports) {
      expect(port).toMatch(/^127\.0\.0\.1:\$\{[A-Z_]+:-185\d\d\}:\d+$/);
    }
  });

  it('ouvre l acces invite par les reglages du poste, montes et jamais copies', () => {
    const commande = complement.services.portail.command.join(' ');
    expect(commande).toContain('app-config.poste.yaml');
    expect(commande).not.toContain('app-config.production.yaml');
    expect(complement.services.portail.volumes).toContain(
      './app-config.poste.yaml:/app/app-config.poste.yaml:ro',
    );
  });

  it('ne lance le mode developpement qu a la demande', () => {
    expect(complement.services.developpement.profiles).toEqual([
      'developpement',
    ]);
  });
});

describe('les variables, .env.exemple', () => {
  const noms = (texte: string) =>
    new Set(
      texte
        .split('\n')
        .filter(ligne => /^[A-Z_][A-Z0-9_]*=/.test(ligne))
        .map(ligne => ligne.split('=')[0]),
    );
  const employees = (texte: string) =>
    new Set(
      [...texte.matchAll(/\$\{([A-Z_][A-Z0-9_]*)/g)].map(trouve => trouve[1]),
    );

  it('chaque variable des compositions est decrite, et chaque variable decrite sert', () => {
    const decrites = noms(lire('.env.exemple'));
    const utilisees = new Set([
      ...employees(lire('compose.yaml')),
      ...employees(lire('compose.override.yaml')),
    ]);
    expect([...utilisees].filter(n => !decrites.has(n))).toEqual([]);
    expect([...decrites].filter(n => !utilisees.has(n))).toEqual([]);
  });

  it('ne porte aucune valeur pour les identifiants de l application GitHub', () => {
    for (const ligne of lire('.env.exemple').split('\n')) {
      if (/^GITHUB_/.test(ligne)) {
        expect(ligne).toMatch(/^GITHUB_[A-Z_]+=$/);
      }
    }
  });
});

describe('les reglages de Backstage', () => {
  const production = yaml('app-config.production.yaml');
  const poste = yaml('app-config.poste.yaml');

  it('en test et en production: GitHub seulement, jamais l invite', () => {
    expect(production.auth.environment).toBe('production');
    expect(Object.keys(production.auth.providers)).toEqual(['github']);
    expect(production.auth.providers.github.production.signIn.resolvers).toEqual(
      [{ resolver: 'usernameMatchingUserEntityName' }],
    );
  });

  it('sur le poste: l invite seulement, jamais GitHub', () => {
    expect(poste.auth.environment).toBe('development');
    expect(Object.keys(poste.auth.providers)).toEqual(['guest']);
  });

  it('les reglages communs et ceux du service n ouvrent aucune connexion', () => {
    for (const fichier of [
      'app-config.yaml',
      'app-config.service.yaml',
      'app-config.developpement.yaml',
    ]) {
      expect([fichier, yaml(fichier).auth]).toEqual([fichier, undefined]);
    }
  });

  it('le poste lit les memes fiches que la production, plus son propre depot', () => {
    // Une liste se remplace d un fichier a l autre au lieu de se completer:
    // les deux listes doivent donc rester alignees.
    const enProduction = production.catalog.locations;
    const surLePoste = poste.catalog.locations;
    expect(surLePoste.slice(0, enProduction.length)).toEqual(enProduction);
    expect(surLePoste.slice(enProduction.length)).toEqual([
      {
        type: 'file',
        target: '/depot/catalog-info.yaml',
        rules: [{ allow: ['Component', 'API', 'Location'] }],
      },
    ]);
  });
});

describe('le Dockerfile', () => {
  const dockerfile = lire('Dockerfile');
  const execution = dockerfile.slice(dockerfile.indexOf('AS execution'));

  it('ne copie jamais les reglages du poste dans l image', () => {
    expect(execution).not.toContain('app-config.poste.yaml\n');
    const copies = execution
      .split('\n')
      .filter(ligne => ligne.startsWith('COPY'))
      .join('\n');
    expect(copies).not.toMatch(/app-config\.poste|app-config\*|COPY[^\n]* \. \./);
  });

  it('lance le portail avec les reglages de production', () => {
    expect(execution).toContain(
      'CMD ["node", "packages/backend", "--config", "app-config.yaml", "--config", "app-config.service.yaml", "--config", "app-config.production.yaml"]',
    );
  });
});

describe('le catalogue', () => {
  const documents = (fichier: string) =>
    parseAllDocuments(lire(fichier)).map(d => d.toJS());
  const organisation = documents('catalogue/organisation.yaml');
  const systemes = new Set(
    organisation.filter(e => e.kind === 'System').map(e => e.metadata.name),
  );
  const ressources = new Set(
    organisation
      .filter(e => e.kind === 'Resource')
      .map(e => `resource:default/${e.metadata.name}`),
  );

  const enAttente = path.join(PORTAIL, 'catalogue', 'en-attente');
  const fichiersEnAttente = (dossier: string): string[] =>
    fs.readdirSync(dossier, { withFileTypes: true }).flatMap(entree =>
      entree.isDirectory()
        ? fichiersEnAttente(path.join(dossier, entree.name))
        : entree.name === 'catalog-info.yaml'
        ? [path.relative(PORTAIL, path.join(dossier, entree.name))]
        : [],
    );

  it('chaque racine en attente est une Location dont chaque cible existe', () => {
    const racines = fs
      .readdirSync(enAttente, { withFileTypes: true })
      .filter(e => e.isDirectory());
    expect(racines.length).toBeGreaterThan(0);
    for (const depot of racines) {
      const fichier = path.join('catalogue', 'en-attente', depot.name, 'catalog-info.yaml');
      const [location] = documents(fichier);
      expect([fichier, location.kind]).toEqual([fichier, 'Location']);
      for (const cible of location.spec.targets) {
        const chemin = path.join(PORTAIL, path.dirname(fichier), cible);
        expect([cible, fs.existsSync(chemin)]).toEqual([cible, true]);
      }
    }
  });

  describe('la page d accueil, dans app-config.yaml', () => {
    const extensions: Record<string, any>[] = yaml('app-config.yaml').app
      .extensions;
    const accueil = extensions.find(
      e => 'home-page-layout:home/commencer-ici' in e,
    )!['home-page-layout:home/commencer-ici'].config;
    const references: string[] = [
      ...accueil.applications,
      ...accueil.outils,
      ...accueil.deploiement.fiches,
    ];
    const structure = new Set(
      organisation.map(
        e => `${e.kind.toLocaleLowerCase('en-US')}:default/${e.metadata.name}`,
      ),
    );

    it('le deploiement ne repete aucune fiche des autres parties, et aucune partie ne se repete', () => {
      // Le laboratoire est a la fois une application du cycle et un outil
      // (ses rapports): ces deux parties le montrent chacune, depuis le
      // lot 4. Le deploiement, lui, est une autre question: ses fiches n ont
      // rien a faire ailleurs sur la page.
      const ailleurs = new Set([...accueil.applications, ...accueil.outils]);
      expect(accueil.deploiement.fiches.filter((r: string) => ailleurs.has(r))).toEqual([]);
      for (const partie of [accueil.applications, accueil.outils, accueil.deploiement.fiches]) {
        expect(partie.filter((r: string, i: number) => partie.indexOf(r) !== i)).toEqual([]);
      }
    });

    it('ne nomme que des ressources et des domaines qui existent', () => {
      // Les composants viennent des depots, sur GitHub: seule la structure
      // du catalogue, ecrite ici, peut etre verifiee sans eux.
      for (const reference of references.filter(r => /^(resource|domain):/.test(r))) {
        expect([reference, structure.has(reference)]).toEqual([reference, true]);
      }
    });

    it('le tableau de bord de Traefik: une adresse en https, et le chemin de ses identifiants, jamais une valeur', () => {
      const { adresse, identifiants, documentation } = accueil.deploiement.traefik;
      expect(adresse).toMatch(/^https:\/\/[^/]+\/.*$/);
      // R-17: un secret ne s ecrit jamais; on donne le fichier qui le porte.
      expect(identifiants).toMatch(/^secret_root\/[A-Za-z0-9_./-]+\.md$/);
      expect(documentation.fiche).toBe(accueil.deploiement.fiches[0]);
    });
  });

  it('chaque fiche renvoie a une famille, un proprietaire et des ressources qui existent', () => {
    const fiches = fichiersEnAttente(enAttente)
      .concat(['catalog-info.yaml'])
      .flatMap(documents)
      .filter(e => e.kind !== 'Location');
    expect(fiches.length).toBeGreaterThan(0);
    for (const fiche of fiches) {
      const nom = `${fiche.kind}:${fiche.metadata.name}`;
      expect([nom, systemes.has(fiche.spec.system)]).toEqual([nom, true]);
      expect([nom, fiche.spec.owner]).toEqual([nom, 'group:default/equipe-oscar']);
      for (const ressource of fiche.spec.dependsOn ?? []) {
        expect([nom, ressources.has(ressource)]).toEqual([nom, true]);
      }
    }
  });
});
