/*
 * Les tests du controle a l ecran: ce que releve.mjs mesure, et son verdict,
 * eprouves dans un vrai navigateur sur des pages d essai dont on connait la
 * reponse. Chaque critere annonce doit compter dans le verdict (lecon 10.3),
 * et une mesure doit porter sur ce qui est reellement affiche (lecon 10.9).
 *
 * A lancer depuis le dossier oscar_backstage/, avec Docker et rien d autre:
 *   docker compose -f verifications-ecran/compose.yaml run --rm tester
 * La chaine du depot les lance a chaque passe. Ils n ecrivent rien.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { after, before, describe, it } from 'node:test';
import {
  anneauDuFocus,
  ECARTS_CONNUS,
  lireOrange,
  lirePermises,
  releverDansLaPage,
  verdict,
} from '../releve.mjs';

const { chromium } = createRequire('/tmp/outil/package.json')('playwright');

const JETONS = readFileSync('/portail/packages/app/src/modules/charte/jetons.ts', 'utf8');
const PERMISES = lirePermises(JETONS);
const ORANGE = lireOrange(JETONS);

let navigateur;
let page;
before(async () => {
  navigateur = await chromium.launch();
  page = await navigateur.newPage({ viewport: { width: 800, height: 600 } });
});
after(async () => {
  await navigateur?.close();
});

/**
 * Une page d essai, sur le papier de la charte, a l encre. Le bouton natif du
 * navigateur a son propre fond gris et sa bordure noire: on les retire, pour
 * que chaque essai ne mesure que ce qu il pose.
 */
async function ouvrir(corps) {
  await page.setContent(`<!doctype html><html><head><style>
    body { margin: 0; background: #F3F1EC; color: #1B1D1E; font: 16px sans-serif; }
    button { background: none; border: none; color: inherit; font: inherit; }
  </style></head><body>${corps}</body></html>`);
}

async function relever(corps, ecartsConnus = ECARTS_CONNUS) {
  await ouvrir(corps);
  return page.evaluate(releverDansLaPage, { permises: PERMISES, ecartsConnus });
}

const couleursHors = releve => releve.horsCharte.map(h => `${h.couleur} ${h.propriete}`).sort();

describe('les couleurs de la charte', () => {
  it('sont lues dans jetons.ts: les quatre de la palette et les cinq nuances', () => {
    assert.deepEqual(
      [...PERMISES].sort(),
      ['161513', '1B1D1E', '1F1D1A', '33383A', '6B6B6B', 'D85810', 'EAE7DF', 'F3F1EC', 'FFFFFF'],
    );
    assert.equal(ORANGE, 'D85810');
  });
});

describe('le releve d une page', () => {
  it('ne trouve rien sur une page aux couleurs de la charte', async () => {
    const releve = await relever(`
      <p>Un texte a l encre sur le papier.</p>
      <div style="border: 1px solid rgba(27, 29, 30, 0.12); background: #FFFFFF">Une carte</div>
      <p style="color: #6B6B6B">Un texte secondaire</p>`);
    assert.deepEqual(releve.horsCharte, []);
    assert.equal(releve.contrastesSousAA.nombre, 0);
  });

  it('compte une couleur hors charte, avec la propriete ou elle est peinte', async () => {
    const releve = await relever(`
      <p style="color: #FF0000">Un texte rouge</p>
      <div style="background: #00FF00; width: 10px; height: 10px"></div>
      <div style="border: 2px solid #0000FF">Un cadre bleu</div>
      <button style="outline: 2px solid #FF00FF">Un contour</button>
      <svg width="20" height="20"><rect width="20" height="20" fill="#00FFFF"/></svg>`);
    assert.deepEqual(couleursHors(releve), [
      '#0000FF border-color',
      '#00FF00 background-color',
      '#00FFFF fill',
      '#FF0000 color',
      '#FF00FF outline-color',
    ]);
  });

  it('compte le noir pur, meme transparent, comme le texte par defaut de Material UI', async () => {
    const releve = await relever('<button style="color: rgba(0, 0, 0, 0.87); background: #EAE7DF">Aller au contenu</button>');
    assert.deepEqual(couleursHors(releve), ['#000000 color']);
  });

  it('compte le filet #383838 de la barre du telephone: ce n est plus un ecart connu', async () => {
    assert.deepEqual(ECARTS_CONNUS, []);
    const releve = await relever(`
      <nav class="MuiBottomNavigation-root" style="border-top: 1px solid #383838; background: #1B1D1E; height: 56px"></nav>`);
    assert.deepEqual(couleursHors(releve), ['#383838 border-color']);
  });

  it('range un ecart connu a part, sans le cacher, et seulement la ou il est nomme', async () => {
    const connu = { couleur: '#383838', propriete: 'border-color', selecteur: 'nav.barre', raison: 'un ecart nomme pour l essai' };
    const releve = await relever(`
      <nav class="barre" style="border-top: 1px solid #383838; height: 10px"></nav>
      <div style="border-top: 1px solid #383838; height: 10px"></div>`, [connu]);
    assert.deepEqual(releve.ecartsConnus, { 'un ecart nomme pour l essai': 1 });
    assert.deepEqual(couleursHors(releve), ['#383838 border-color']);
  });

  it('compte un texte sous le seuil AA de sa taille, et seulement lui', async () => {
    // Le gris sur le Noir OSCAR: 3,4 pour 1. Assez pour un grand texte (3),
    // pas pour un texte courant (4,5).
    const releve = await relever(`
      <div style="background: #1B1D1E">
        <p style="color: #6B6B6B; font-size: 16px">Petit texte gris</p>
        <p style="color: #6B6B6B; font-size: 24px">Grand texte gris</p>
      </div>`);
    assert.equal(releve.contrastesSousAA.nombre, 1);
    assert.equal(releve.contrastesSousAA.exemples[0].texte, 'Petit texte gris');
  });

  it('mesure le contraste sur un fond peint par un degrade d une seule couleur', async () => {
    const releve = await relever(`
      <header style="background-image: linear-gradient(#1B1D1E, #1B1D1E)">
        <h1 style="color: #F3F1EC">OSCAR</h1>
      </header>`);
    assert.deepEqual(releve.horsCharte, []);
    assert.equal(releve.contrastesSousAA.nombre, 0);
    assert.equal(releve.plusFaible.fond, '#1B1D1E');
  });

  it('ignore un lien place au-dessus de la page, et le compte quand il revient a l ecran', async () => {
    const lien = transformation => `
      <button style="position: absolute; top: 0; transform: ${transformation}; color: #000000">Aller au contenu</button>`;
    assert.deepEqual((await relever(lien('translateY(-200%)'))).horsCharte, []);
    assert.deepEqual(couleursHors(await relever(lien('translateY(5px)'))), ['#000000 color']);
  });

  it('ignore un element rogne, comme un champ cache par une bibliotheque', async () => {
    const releve = await relever(`
      <div style="position: absolute; clip: rect(0, 0, 0, 0)"><span style="color: #FF0000">cache</span></div>`);
    assert.deepEqual(releve.horsCharte, []);
  });
});

describe('l anneau du focus', () => {
  const boutons = `
    <style>
      button { outline: none; }
      #charte:focus-visible { outline: 2px solid #D85810; outline-offset: 2px; }
      #fin:focus-visible { outline: 1px solid #D85810; }
      #autre:focus-visible { outline: 2px solid #FF0000; }
    </style>
    <button id="sans">Sans anneau</button>
    <button id="charte">Anneau de la charte</button>
    <button id="fin">Anneau trop fin</button>
    <button id="autre">Anneau d une autre couleur</button>`;

  async function focaliser(id) {
    for (let pas = 0; pas < 6; pas += 1) {
      await page.keyboard.press('Tab');
      if (await page.evaluate(i => document.activeElement?.id === i, id)) return;
    }
    throw new Error(`${id} jamais atteint au clavier`);
  }

  it('reconnait l anneau orange de 2 px, et lui seul', async () => {
    await ouvrir(boutons);
    const attendus = { sans: 'non', charte: 'oui', fin: 'non', autre: 'non' };
    for (const [id, anneau] of Object.entries(attendus)) {
      await focaliser(id);
      const mesure = await page.evaluate(anneauDuFocus, { orange: ORANGE });
      assert.equal(mesure.anneau, anneau, id);
      assert.equal(mesure.visible, 'oui', id);
    }
  });

  it('dit qu un element qui a le focus hors de l ecran n est pas visible', async () => {
    await ouvrir('<style>#cache { position: absolute; top: 0; transform: translateY(-200%); outline: 2px solid #D85810; }</style><button id="cache">Aller au contenu</button>');
    await focaliser('cache');
    const mesure = await page.evaluate(anneauDuFocus, { orange: ORANGE });
    assert.equal(mesure.visible, 'non');
  });

  it('ne trouve aucun anneau quand rien n a le focus', async () => {
    await ouvrir('<p>Rien a focaliser</p>');
    const mesure = await page.evaluate(anneauDuFocus, { orange: ORANGE });
    assert.equal(mesure.element, null);
    assert.equal(mesure.anneau, 'non');
  });
});

describe('le verdict', () => {
  /** Une vue conforme; chaque essai n y change qu un critere. */
  const vue = (changement = {}) => ({
    nom: 'vue',
    horsCharteTotal: 0,
    contrastesSousAA: { nombre: 0, exemples: [] },
    ecartsConnus: {},
    affichee: 'oui',
    ...changement,
  });
  const focusConforme = { atteint: 'oui', visible: 'oui', anneau: 'oui' };

  it('est vert quand tout est conforme', () => {
    const { code, lignes } = verdict([vue(), vue({ lightbox: 'oui' }), vue({ focus: focusConforme })]);
    assert.equal(code, 0);
    assert.ok(lignes.some(l => l.startsWith('FOCUS') && l.endsWith('aucun')));
  });

  const defauts = {
    'une couleur hors charte': { horsCharteTotal: 1 },
    'un texte sous le seuil AA': { contrastesSousAA: { nombre: 1, exemples: [] } },
    'une page non affichee': { affichee: 'non' },
    'une LightBox qui ne s ouvre pas': { lightbox: 'non' },
    'un schema absent du guide': { lightbox: 'aucune image' },
    'un focus jamais atteint': { focus: { ...focusConforme, atteint: 'non' } },
    'un focus hors de l ecran': { focus: { ...focusConforme, visible: 'non' } },
    'un focus sans l anneau de la charte': { focus: { ...focusConforme, anneau: 'non' } },
  };
  for (const [defaut, changement] of Object.entries(defauts)) {
    it(`est rouge pour ${defaut}`, () => {
      const { code } = verdict([vue(), vue({ nom: 'fautive', ...changement })]);
      assert.equal(code, 1);
    });
  }

  it('affiche chaque ecart connu, avec son nombre, sans le cacher', () => {
    const { code, lignes } = verdict([vue({ ecartsConnus: { 'un ecart nomme': 3 } })]);
    assert.equal(code, 0);
    assert.ok(lignes.includes('ECART CONNU  3 element(s): un ecart nomme'));
  });
});
