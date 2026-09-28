/*
 * La verification a l ecran du portail: des captures, et un releve de la
 * charte sur chaque page.
 *
 * Pour chaque page, chaque theme (clair, sombre) et chaque taille d ecran
 * (ordinateur, telephone), le script:
 *   - prend une capture de la page entiere;
 *   - releve chaque couleur calculee par le navigateur (texte, fond, bordure,
 *     contour, remplissage et trait des dessins), et compte celles qui ne sont
 *     pas de la charte;
 *   - mesure le contraste de chaque texte sur son fond reel, et garde le plus
 *     faible;
 *   - sur une page du guide, clique sur un schema et verifie qu il s ouvre en
 *     grand (l extension LightBox de TechDocs);
 *   - sur l accueil, lit la partie « Le deploiement »: elle est la, elle
 *     montre des cartes de fiches, et le bloc du tableau de bord de Traefik donne
 *     son adresse, le chemin de ses identifiants et sa documentation. Une
 *     fiche absente du catalogue est nommee (en local, le portail ne lit pas
 *     GitHub, et donc pas la fiche du deploiement).
 *
 * Il avance aussi au clavier, sur la page de connexion, jusqu au bouton qui
 * connecte, et verifie l etat au focus: le bouton doit etre atteint, dans
 * l ecran, et porter l anneau orange de la charte; la page est relevee avec
 * lui, comme les autres. Ce bouton est la sur chaque passe, en invite comme
 * en test et en production.
 *
 * Le lien « Aller au contenu » du menu n est pas verifie ici: Backstage ne le
 * rend que si le titre d un en-tete de page existe deja quand le menu se
 * redessine, ce qui depend de l ordre des rendus (mesure le 28/09/2026: absent
 * de sept pages, au clavier comme a la souris). Sa couleur au focus est
 * verifiee par le test du theme (charte/charte.test.ts).
 *
 * Ce qui est mesure, et le verdict, sont dans releve.mjs, a cote, eprouve par
 * tests/releve.test.mjs. Les couleurs de la charte sont lues dans jetons.ts,
 * jamais recopiees ici.
 *
 * Code de sortie: 0 si aucune couleur hors charte n a ete vue, si chaque
 * texte atteint le contraste AA de sa taille, si chaque page s est affichee,
 * si LightBox s ouvre sur chaque page du cycle, si chaque focus porte
 * l anneau de la charte, et si la partie « Le deploiement » de l accueil est
 * complete; 1 sinon.
 *
 * Usage, dans le conteneur de compose.yaml, a cote:
 *   node verifier-l-ecran.mjs <adresse du portail> <dossier des resultats> [invite]
 * Avec « invite », le script entre en invite (le poste); sans, il ne voit que
 * la page de connexion (le test et la production demandent GitHub).
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import {
  anneauDuFocus,
  ECARTS_CONNUS,
  lireLeDeploiement,
  lireOrange,
  lirePermises,
  releverDansLaPage,
  verdict,
} from './releve.mjs';

// Playwright est installe a part, dans le conteneur (compose.yaml): on le
// charge depuis la ou il a ete pose.
const { chromium } = createRequire('/tmp/outil/package.json')('playwright');

const [adresse, sortie, mode] = process.argv.slice(2);
if (!adresse || !sortie) {
  console.error('Usage: node verifier-l-ecran.mjs <adresse> <dossier> [invite]');
  process.exit(2);
}
mkdirSync(sortie, { recursive: true });

// Les couleurs permises, et l orange du focus: celles ecrites dans jetons.ts.
const jetons = readFileSync('/portail/packages/app/src/modules/charte/jetons.ts', 'utf8');
const PERMISES = lirePermises(jetons);
const ORANGE = lireOrange(jetons);

const ECRANS = {
  ordinateur: { width: 1366, height: 900 },
  telephone: { width: 390, height: 844 },
};
const THEMES = { clair: 'light', sombre: 'dark' };
// Chaque page, et ce qui dit qu elle a fini de s afficher. Le guide se
// construit a la premiere visite: il a droit a plus de temps.
const PAGES = mode === 'invite'
  ? {
      // L accueil est pret quand les fiches du deploiement sont lues: une
      // carte de fiche, presente ou dite absente, parle du catalogue; le bloc
      // du tableau de bord, affiche tout de suite, n en parle pas.
      accueil: { chemin: '/', pret: 'section[aria-label="Le déploiement"] article:has-text("catalogue")' },
      catalogue: { chemin: '/catalog', pret: 'table tbody tr' },
      // La page peut etre chargee mais vide si aucune entite de depart n est configuree.
      graphe: { chemin: '/catalog-graph', pret: 'svg text' },
      fiche: { chemin: '/catalog/default/component/portail', pret: 'text=Portail technique' },
      guide: { chemin: '/docs/default/component/oscar-general-gouvernance-project/', pret: '.md-content h1', attente: 120000 },
      cycle: { chemin: '/docs/default/component/oscar-general-gouvernance-project/02-le-cycle-pas-a-pas/', pret: '.md-content h1', attente: 120000 },
    }
  : {};

// Les traces permettent de distinguer une erreur d application d une ressource indisponible.
const tracesPages = new WeakMap();

/** Mesure la page ouverte, garde sa capture, et l ajoute au bilan. */
async function mesurer(page, nom, extra = {}) {
  await page.screenshot({ path: join(sortie, `${nom}.png`), fullPage: true });
  const releve = await page.evaluate(releverDansLaPage, { permises: PERMISES, ecartsConnus: ECARTS_CONNUS });
  const titre = await page.title();
  const hors = releve.horsCharte.reduce((n, h) => n + h.nombre, 0);
  bilan.push({ nom, titre, horsCharteTotal: hors, ...extra, traces: [...(tracesPages.get(page) ?? [])], ...releve });
  const suite = Object.entries(extra).map(([k, v]) => `  ${k}: ${v}`).join('');
  const faible = releve.plusFaible ? `${releve.plusFaible.rapport} (seuil ${releve.plusFaible.seuil})` : '-';
  console.log(`${nom.padEnd(34)} titre « ${titre} »  couleurs hors charte: ${hors}  contraste minimal: ${faible}  sous le seuil AA: ${releve.contrastesSousAA.nombre}${suite}`);
}

/**
 * Avance au clavier (touche Tab) jusqu a la cible, puis releve la page avec
 * le focus pose, et l anneau de la cible. Douze pas au plus: au-dela, la
 * cible n est pas atteinte, et le verdict le compte.
 */
async function mesurerLeFocus(page, nom, cible) {
  let atteint = 'non';
  // Une cible absente de la page ne peut pas etre atteinte.
  if (await cible.count()) {
    for (let pas = 0; pas < 12 && atteint === 'non'; pas += 1) {
      await page.keyboard.press('Tab');
      if (await cible.evaluate(e => e === document.activeElement)) atteint = 'oui';
    }
  }
  const anneau = await page.evaluate(anneauDuFocus, { orange: ORANGE });
  await mesurer(page, nom);
  bilan[bilan.length - 1].focus = { atteint, ...anneau };
  console.log(`${''.padEnd(34)} focus sur ${anneau.element ?? 'rien'}: atteint ${atteint}, dans l ecran ${anneau.visible}, anneau de la charte ${anneau.anneau} (${anneau.style} ${anneau.epaisseur} ${anneau.couleur})`);
}

/** Clique sur le premier schema du guide et dit s il s ouvre en grand. */
async function essayerLightBox(page) {
  const image = page.locator('.md-content img').first();
  if (!(await image.count())) return 'aucune image';
  await image.click();
  const ouverte = await page.locator('.pswp').first().waitFor({ state: 'visible', timeout: 10000 }).then(() => true, () => false);
  if (ouverte) await page.keyboard.press('Escape');
  return ouverte ? 'oui' : 'non';
}

const navigateur = await chromium.launch();
const bilan = [];
for (const [nomEcran, taille] of Object.entries(ECRANS)) {
  for (const [nomTheme, theme] of Object.entries(THEMES)) {
    const contexte = await navigateur.newContext({ viewport: taille, locale: 'fr-FR' });
    // Le theme choisi, tel que Backstage le garde dans le navigateur.
    await contexte.addInitScript(t => window.localStorage.setItem('theme', t), theme);
    const page = await contexte.newPage();
    const traces = [];
    tracesPages.set(page, traces);
    page.on('pageerror', erreur => traces.push({ type: 'javascript', message: erreur.message }));
    page.on('requestfailed', requete => {
      const url = new URL(requete.url());
      // Ne pas garder les paramètres d une adresse de connexion dans les preuves.
      traces.push({ type: 'reseau', adresse: url.origin + url.pathname, erreur: requete.failure()?.errorText });
    });
    page.on('response', reponse => {
      if (reponse.status() < 400) return;
      const url = new URL(reponse.url());
      traces.push({ type: 'http', adresse: url.origin + url.pathname, statut: reponse.status() });
    });

    // La page de connexion, toujours: c est la seule qu on voit sans compte.
    await page.goto(adresse + '/', { waitUntil: 'networkidle' });
    // Ce qui dit que la page de connexion est la: le bouton de l invite sur
    // le poste, le nom de GitHub en test et en production.
    const repere = mode === 'invite' ? page.getByRole('button', { name: 'Entrer' }) : page.getByText('GitHub');
    const connexionAffichee = await repere.first()
      .waitFor({ state: 'visible', timeout: 60000 })
      .then(() => 'oui', () => 'non');
    await mesurer(page, `connexion-${nomTheme}-${nomEcran}`, { affichee: connexionAffichee });
    // Une page vide ne prouve ni la charte ni une connexion utilisable.
    if (connexionAffichee !== 'oui') {
      await contexte.close();
      continue;
    }
    // Le bouton qui connecte, atteint au clavier: celui de l invite sur le
    // poste, celui de GitHub en test et en production.
    const boutonDeConnexion = mode === 'invite'
      ? page.getByRole('button', { name: 'Entrer', exact: true })
      : page.getByRole('button', { name: 'Se connecter', exact: true });
    await mesurerLeFocus(page, `connexion-focus-${nomTheme}-${nomEcran}`, boutonDeConnexion.first());

    if (mode === 'invite') {
      // Entrer en invite une fois: la session vaut pour tout le contexte.
      await page.getByRole('button', { name: 'Entrer' }).click();
      await page.getByText('Commencer ici').first().waitFor({ timeout: 60000 });
    }

    for (const [nomPage, { chemin, pret, attente }] of Object.entries(PAGES)) {
      await page.goto(adresse + chemin, { waitUntil: 'networkidle' });
      const affichee = await page.locator(pret).first()
        .waitFor({ state: 'visible', timeout: attente ?? 60000 })
        .then(() => 'oui', () => 'non');
      // Le temps que les polices et les images finissent de s afficher.
      await page.waitForTimeout(1500);
      const extra = { affichee };
      await mesurer(page, `${nomPage}-${nomTheme}-${nomEcran}`, extra);
      if (nomPage === 'accueil') {
        const deploiement = await page.evaluate(lireLeDeploiement);
        bilan[bilan.length - 1].deploiement = deploiement;
        const absentes = deploiement.absentes?.length ? deploiement.absentes.join(', ') : 'aucune';
        console.log(`${''.padEnd(34)} le deploiement: partie ${deploiement.partie}, tableau de bord ${deploiement.tableauDeBord ?? '-'}, identifiants ${deploiement.identifiants ?? '-'}, documentation ${deploiement.documentation ?? '-'}, fiches ${deploiement.fiches ?? 0}, absentes du catalogue: ${absentes}`);
      }
      if (nomPage === 'cycle') {
        const lightbox = await essayerLightBox(page);
        bilan[bilan.length - 1].lightbox = lightbox;
        console.log(`${''.padEnd(34)} un clic sur le schema l ouvre en grand (LightBox): ${lightbox}`);
      }
    }
    await contexte.close();
  }
}
await navigateur.close();
writeFileSync(join(sortie, 'releve.json'), JSON.stringify(bilan, null, 2));
console.log(`Releve complet: ${join(sortie, 'releve.json')}`);
const { code, lignes } = verdict(bilan);
for (const ligne of lignes) console.log(ligne);
process.exit(code);
