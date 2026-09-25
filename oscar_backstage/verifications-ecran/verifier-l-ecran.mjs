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
 *     faible.
 *
 * Les couleurs de la charte sont lues dans jetons.ts, jamais recopiees ici.
 * Une couleur transparente compte pour sa teinte: la charte trace elle-meme ses
 * filets en noir transparent.
 *
 * Usage, dans le conteneur de compose.yaml, a cote:
 *   node verifier-l-ecran.mjs <adresse du portail> <dossier des resultats> [invite]
 * Avec « invite », le script entre en invite (le poste); sans, il ne voit que
 * la page de connexion (le test et la production demandent GitHub).
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

// Playwright est installe a part, dans le conteneur (compose.yaml): on le
// charge depuis la ou il a ete pose.
const { chromium } = createRequire('/tmp/outil/package.json')('playwright');

const [adresse, sortie, mode] = process.argv.slice(2);
if (!adresse || !sortie) {
  console.error('Usage: node verifier-l-ecran.mjs <adresse> <dossier> [invite]');
  process.exit(2);
}
mkdirSync(sortie, { recursive: true });

// Les couleurs permises: toutes celles ecrites dans jetons.ts, et elles seules.
const jetons = readFileSync('/portail/packages/app/src/modules/charte/jetons.ts', 'utf8');
const PERMISES = [...new Set([...jetons.matchAll(/'#([0-9A-Fa-f]{6})'/g)].map(m => m[1].toUpperCase()))];

const ECRANS = {
  ordinateur: { width: 1366, height: 900 },
  telephone: { width: 390, height: 844 },
};
const THEMES = { clair: 'light', sombre: 'dark' };
const PAGES = mode === 'invite'
  ? {
      accueil: '/',
      catalogue: '/catalog',
      fiche: '/catalog/default/component/portail',
      guide: '/docs/default/component/oscar-general-gouvernance-project/',
      cycle: '/docs/default/component/oscar-general-gouvernance-project/02-le-cycle-pas-a-pas/',
    }
  : { connexion: '/' };

// Ce qui tourne dans la page: le releve des couleurs et des contrastes. Il
// traverse aussi les racines fantomes, ou TechDocs range la documentation.
function releverDansLaPage(permises) {
  const rgba = texte => {
    const m = texte.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])] : null;
  };
  const hexa = c => c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  const lum = c => {
    const [r, g, b] = c.slice(0, 3).map(v => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contraste = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const poser = (dessus, dessous) => {
    const a = dessus[3];
    return [0, 1, 2].map(i => a * dessus[i] + (1 - a) * dessous[i]).concat(1);
  };

  const elements = [];
  const parcourir = racine => {
    for (const e of racine.querySelectorAll('*')) {
      elements.push(e);
      if (e.shadowRoot) parcourir(e.shadowRoot);
    }
  };
  parcourir(document);

  const visible = e => {
    const r = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0;
  };
  const decrire = e => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;

  const hors = new Map();
  const noter = (e, propriete, valeur) => {
    const c = rgba(valeur);
    if (!c || c[3] === 0) return;
    const h = hexa(c);
    if (permises.includes(h)) return;
    const cle = `${h} ${propriete}`;
    if (!hors.has(cle)) hors.set(cle, { couleur: '#' + h, propriete, exemples: [], nombre: 0 });
    const n = hors.get(cle);
    n.nombre += 1;
    if (n.exemples.length < 3) n.exemples.push(decrire(e));
  };

  let plusFaible = null;
  for (const e of elements) {
    if (!visible(e)) continue;
    const s = getComputedStyle(e);
    noter(e, 'color', s.color);
    noter(e, 'background-color', s.backgroundColor);
    for (const cote of ['Top', 'Right', 'Bottom', 'Left']) {
      if (parseFloat(s[`border${cote}Width`]) > 0 && s[`border${cote}Style`] !== 'none') {
        noter(e, 'border-color', s[`border${cote}Color`]);
      }
    }
    if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) noter(e, 'outline-color', s.outlineColor);
    if (e instanceof SVGElement) {
      noter(e, 'fill', s.fill);
      noter(e, 'stroke', s.stroke);
    }
    // Le contraste: seulement les elements qui portent eux-memes du texte.
    const texte = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');
    if (!texte) continue;
    let fond = [255, 255, 255, 0];
    const couches = [];
    for (let a = e; a; a = a.parentElement || (a.getRootNode() && a.getRootNode().host)) {
      const b = rgba(getComputedStyle(a).backgroundColor);
      if (b && b[3] > 0) couches.push(b);
      if (b && b[3] === 1) break;
    }
    fond = couches.reverse().reduce((dessous, dessus) => poser(dessus, dessous), [255, 255, 255, 1]);
    const couleur = rgba(s.color);
    if (!couleur) continue;
    const r = contraste(poser(couleur, fond), fond);
    if (!plusFaible || r < plusFaible.rapport) {
      plusFaible = { rapport: Math.round(r * 100) / 100, texte: texte.slice(0, 60), element: decrire(e), couleur: '#' + hexa(poser(couleur, fond)), fond: '#' + hexa(fond), taille: s.fontSize, graisse: s.fontWeight };
    }
  }
  return { elements: elements.length, horsCharte: [...hors.values()].sort((a, b) => b.nombre - a.nombre), plusFaible };
}

const navigateur = await chromium.launch();
const bilan = [];
for (const [nomEcran, taille] of Object.entries(ECRANS)) {
  for (const [nomTheme, theme] of Object.entries(THEMES)) {
    const contexte = await navigateur.newContext({ viewport: taille, locale: 'fr-FR' });
    // Le theme choisi, tel que Backstage le garde dans le navigateur.
    await contexte.addInitScript(t => window.localStorage.setItem('theme', t), theme);
    const page = await contexte.newPage();
    for (const [nomPage, chemin] of Object.entries(PAGES)) {
      await page.goto(adresse + chemin, { waitUntil: 'networkidle' });
      if (mode === 'invite') {
        const entrer = page.getByRole('button', { name: 'Entrer' });
        if (await entrer.isVisible().catch(() => false)) {
          await entrer.click();
          await page.waitForLoadState('networkidle');
        }
      }
      // TechDocs construit la documentation a la premiere visite: on attend
      // que le contenu soit la avant de mesurer.
      await page.waitForTimeout(nomPage === 'guide' || nomPage === 'cycle' ? 8000 : 2000);
      const nom = `${nomPage}-${nomTheme}-${nomEcran}`;
      await page.screenshot({ path: join(sortie, `${nom}.png`), fullPage: true });
      const releve = await page.evaluate(releverDansLaPage, PERMISES);
      const titre = await page.title();
      bilan.push({ page: nomPage, theme: nomTheme, ecran: nomEcran, titre, ...releve });
      const hors = releve.horsCharte.reduce((n, h) => n + h.nombre, 0);
      console.log(`${nom.padEnd(34)} titre « ${titre} »  couleurs hors charte: ${hors}  contraste minimal: ${releve.plusFaible ? releve.plusFaible.rapport : '-'}`);
    }
    await contexte.close();
  }
}
await navigateur.close();
writeFileSync(join(sortie, 'releve.json'), JSON.stringify(bilan, null, 2));
console.log(`Releve complet: ${join(sortie, 'releve.json')}`);
