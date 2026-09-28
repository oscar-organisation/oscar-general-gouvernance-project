/*
 * Ce que la verification a l ecran mesure, et son verdict.
 *
 * Ce module est separe du parcours du portail (verifier-l-ecran.mjs) pour
 * pouvoir etre eprouve seul, sur des pages d essai dont on connait la
 * reponse: tests/releve.test.mjs, que la chaine du depot lance a chaque passe.
 *
 * Deux fonctions tournent dans la page, envoyees au navigateur par
 * Playwright: releverDansLaPage et anneauDuFocus. Elles ne doivent donc rien
 * employer de ce module, seulement ce qu on leur passe.
 */

/** Les couleurs permises: toutes celles ecrites dans jetons.ts, et elles seules. */
export function lirePermises(texteDesJetons) {
  return [...new Set([...texteDesJetons.matchAll(/'#([0-9A-Fa-f]{6})'/g)].map(m => m[1].toUpperCase()))];
}

/** L orange de la charte, lu dans jetons.ts: la couleur de l anneau de focus. */
export function lireOrange(texteDesJetons) {
  const m = texteDesJetons.match(/orange:\s*'#([0-9A-Fa-f]{6})'/);
  if (!m) throw new Error('L orange de la charte est introuvable dans jetons.ts.');
  return m[1].toUpperCase();
}

/*
 * Les ecarts connus, et pourquoi on ne peut pas les corriger. Ils sont comptes
 * a part et affiches, jamais caches. Chacun: { couleur, propriete, selecteur,
 * raison }.
 *
 * Aucun aujourd hui. Le seul qu il y ait eu, le filet #383838 en haut de la
 * barre de menu du telephone, ecrit en dur par Backstage, est corrige par le
 * theme depuis le 28/09/2026 (charte/themes.ts, MuiBottomNavigation): s il
 * revient, il compte comme toute couleur hors charte.
 */
export const ECARTS_CONNUS = [];

/**
 * Le releve des couleurs et des contrastes de la page ouverte. Il traverse
 * aussi les racines fantomes, ou TechDocs range la documentation.
 *
 * La couleur du texte ne compte que la ou un texte est peint: la propriete
 * color d un element sans texte (html, un filet hr) ne se voit pas. Un fond
 * peint par un degrade d une seule couleur (l en-tete des pages) compte pour
 * cette couleur. Une couleur transparente compte pour sa teinte: la charte
 * trace elle-meme ses filets en noir transparent.
 */
export function releverDansLaPage({ permises, ecartsConnus }) {
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

  // Un element cache par un parent rogne (la facon dont les bibliotheques
  // d accessibilite cachent un champ natif) ne se voit pas.
  const rogne = e => {
    for (let a = e; a; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.clip === 'rect(0px, 0px, 0px, 0px)' || s.clipPath === 'inset(50%)') return true;
    }
    return false;
  };
  const visible = e => {
    const r = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    // Un lien d acces rapide translate au-dessus de la page n est pas peint.
    // Le defilement est compte pour garder le contenu d une capture entiere.
    return r.width > 0 && r.height > 0 && r.bottom + window.scrollY > 0 && r.right + window.scrollX > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0 && !rogne(e);
  };
  const decrire = e => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;

  const hors = new Map();
  const connus = new Map();
  const noter = (e, propriete, valeur) => {
    const c = rgba(valeur);
    if (!c || c[3] === 0) return;
    const h = hexa(c);
    if (permises.includes(h)) return;
    const connu = ecartsConnus.find(x => x.couleur === '#' + h && x.propriete === propriete && e.matches(x.selecteur));
    if (connu) {
      connus.set(connu.raison, (connus.get(connu.raison) ?? 0) + 1);
      return;
    }
    const cle = `${h} ${propriete}`;
    if (!hors.has(cle)) hors.set(cle, { couleur: '#' + h, propriete, exemples: [], nombre: 0 });
    const n = hors.get(cle);
    n.nombre += 1;
    if (n.exemples.length < 3) n.exemples.push(`${decrire(e)} « ${(e.textContent || '').trim().slice(0, 40)} »`);
  };

  // Un fond peint par un degrade d une seule couleur: cette couleur.
  const fondPeint = s => {
    const b = rgba(s.backgroundColor);
    if (b && b[3] > 0) return b;
    const d = s.backgroundImage.match(/^linear-gradient\((rgba?\([^)]*\)), (rgba?\([^)]*\))\)$/);
    if (d && d[1] === d[2]) return rgba(d[1]);
    return b;
  };
  const FORMES = new Set(['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan']);
  const texteDe = e => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');

  let plusFaible = null;
  const echecs = { nombre: 0, exemples: [] };
  for (const e of elements) {
    if (!visible(e)) continue;
    const s = getComputedStyle(e);
    const texte = texteDe(e);
    if (texte) noter(e, 'color', s.color);
    noter(e, 'background-color', s.backgroundColor);
    if (s.backgroundImage !== 'none') {
      for (const c of s.backgroundImage.match(/rgba?\([^)]*\)/g) ?? []) noter(e, 'background-image', c);
    }
    for (const cote of ['Top', 'Right', 'Bottom', 'Left']) {
      if (parseFloat(s[`border${cote}Width`]) > 0 && s[`border${cote}Style`] !== 'none') {
        noter(e, 'border-color', s[`border${cote}Color`]);
      }
    }
    if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) noter(e, 'outline-color', s.outlineColor);
    // Seules les formes se dessinent: un <svg> ou un <g> ne fait que
    // transmettre son remplissage, qu il soit employe ou non.
    if (e instanceof SVGElement && FORMES.has(e.tagName.toLowerCase())) {
      noter(e, 'fill', s.fill);
      noter(e, 'stroke', s.stroke);
    }
    // Le contraste: seulement les elements qui portent eux-memes du texte.
    if (!texte) continue;
    let fond = [255, 255, 255, 0];
    const couches = [];
    for (let a = e; a; a = a.parentElement || (a.getRootNode() && a.getRootNode().host)) {
      const b = fondPeint(getComputedStyle(a));
      if (b && b[3] > 0) couches.push(b);
      if (b && b[3] === 1) break;
    }
    fond = couches.reverse().reduce((dessous, dessus) => poser(dessus, dessous), [255, 255, 255, 1]);
    const couleur = rgba(s.color);
    if (!couleur) continue;
    const r = contraste(poser(couleur, fond), fond);
    // Le seuil AA depend de la taille: 3 pour 1 pour un grand texte (24 px,
    // ou 18,66 px en gras), 4,5 pour 1 sinon.
    const taille = parseFloat(s.fontSize);
    const seuil = taille >= 24 || (taille >= 18.66 && Number(s.fontWeight) >= 700) ? 3 : 4.5;
    const mesure = { rapport: Math.round(r * 100) / 100, seuil, texte: texte.slice(0, 60), element: decrire(e), couleur: '#' + hexa(poser(couleur, fond)), fond: '#' + hexa(fond), taille: s.fontSize, graisse: s.fontWeight };
    if (!plusFaible || r < plusFaible.rapport) plusFaible = mesure;
    if (r < seuil) {
      echecs.nombre += 1;
      if (echecs.exemples.length < 5) echecs.exemples.push(mesure);
    }
  }
  return { elements: elements.length, horsCharte: [...hors.values()].sort((a, b) => b.nombre - a.nombre), ecartsConnus: Object.fromEntries(connus), plusFaible, contrastesSousAA: echecs };
}

/**
 * L anneau de focus de l element actif, tel que le voit la personne qui
 * avance au clavier. La charte met le focus a l orange (charte/themes.ts):
 * un contour plein, de 2 px au moins, a l orange opaque. L element doit aussi
 * etre dans l ecran: un lien d acces rapide reste hors de la page tant qu il
 * n a pas le focus.
 */
export function anneauDuFocus({ orange }) {
  const e = document.activeElement;
  if (!e || e === document.body || e === document.documentElement) {
    return { element: null, couleur: null, epaisseur: null, style: null, visible: 'non', anneau: 'non' };
  }
  const s = getComputedStyle(e);
  const m = s.outlineColor.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
  const couleur = m ? [m[1], m[2], m[3]].map(v => Math.round(Number(v)).toString(16).padStart(2, '0')).join('').toUpperCase() : null;
  const opaque = !m || m[4] === undefined || Number(m[4]) === 1;
  const r = e.getBoundingClientRect();
  const dansLEcran = r.width > 0 && r.height > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth;
  const anneau = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 && couleur === orange && opaque;
  return {
    element: `${e.tagName.toLowerCase()} « ${(e.textContent || '').trim().slice(0, 40)} »`,
    couleur: couleur && '#' + couleur,
    epaisseur: s.outlineWidth,
    style: s.outlineStyle,
    visible: dansLEcran ? 'oui' : 'non',
    anneau: anneau ? 'oui' : 'non',
  };
}

/**
 * La partie « Le deploiement » de l accueil, telle qu elle est affichee
 * (accueil/CommencerIci.tsx). Elle doit etre la; son bloc du tableau de bord
 * de Traefik doit donner une adresse en https, le chemin des identifiants
 * sous secret_root/ (jamais une valeur), et un lien vers sa documentation
 * dans le portail; et la partie doit montrer des cartes de fiches.
 *
 * Une fiche absente du catalogue garde sa carte, qui le dit: elle est nommee,
 * pas comptee en defaut. C est le cas normal en local, ou le portail ne lit
 * pas GitHub, et donc pas la fiche du deploiement.
 *
 * Tourne dans la page: n emploie rien de ce module.
 */
export function lireLeDeploiement() {
  const partie = document.querySelector('section[aria-label="Le déploiement"]');
  if (!partie) return { partie: 'non' };
  const titre = a => (a.querySelector('h3')?.textContent || '').trim();
  const articles = [...partie.querySelectorAll('article')];
  const bloc = articles.find(a => titre(a) === 'Le tableau de bord de Traefik');
  const lien = debut => [...(bloc?.querySelectorAll('a') ?? [])]
    .find(a => a.textContent.trim().startsWith(debut))?.getAttribute('href') ?? '';
  const chemin = [...(bloc?.querySelectorAll('span') ?? [])]
    .map(s => s.textContent.trim())
    .find(t => /^secret_root\/\S+$/.test(t));
  const cartes = articles.filter(a => a !== bloc);
  return {
    partie: 'oui',
    tableauDeBord: lien('Ouvrir le tableau de bord').startsWith('https://') ? 'oui' : 'non',
    identifiants: chemin ? 'oui' : 'non',
    documentation: lien('Comment y accéder').startsWith('/docs/') ? 'oui' : 'non',
    fiches: cartes.length,
    absentes: cartes
      .filter(c => c.textContent.includes("n'est pas encore dans le catalogue"))
      .map(titre),
  };
}

/**
 * Le verdict d une passe, a partir du bilan de chaque vue. Chaque critere y
 * participe (lecon 10.3): une couleur hors charte, un texte sous le seuil AA,
 * une page non affichee, une LightBox qui ne s ouvre pas, un focus non
 * atteint, hors de l ecran ou sans l anneau de la charte, une partie « Le
 * deploiement » absente, sans fiche, ou dont le bloc du tableau de bord de
 * Traefik manque d une adresse en https, du chemin de ses identifiants ou de
 * sa documentation. Code 0 si aucun, 1 sinon.
 */
export function verdict(bilan) {
  const total = bilan.reduce((n, b) => n + b.horsCharteTotal, 0);
  const nonAffichees = bilan.filter(b => b.affichee === 'non').map(b => b.nom);
  const sousAA = bilan.reduce((n, b) => n + b.contrastesSousAA.nombre, 0);
  const lightboxNonOuvertes = bilan.filter(b => 'lightbox' in b && b.lightbox !== 'oui').map(b => b.nom);
  const focusEnDefaut = bilan
    .filter(b => 'focus' in b && (b.focus.atteint !== 'oui' || b.focus.visible !== 'oui' || b.focus.anneau !== 'oui'))
    .map(b => b.nom);
  const avecDeploiement = bilan.filter(b => 'deploiement' in b);
  const deploiementEnDefaut = avecDeploiement
    .filter(({ deploiement: d }) => d.partie !== 'oui' || d.tableauDeBord !== 'oui' || d.identifiants !== 'oui' || d.documentation !== 'oui' || !(d.fiches > 0))
    .map(b => b.nom);
  const absentes = [...new Set(avecDeploiement.flatMap(b => b.deploiement.absentes ?? []))];
  const connus = {};
  for (const b of bilan) for (const [raison, n] of Object.entries(b.ecartsConnus ?? {})) connus[raison] = (connus[raison] ?? 0) + n;
  const lignes = [
    ...Object.entries(connus).map(([raison, n]) => `ECART CONNU  ${n} element(s): ${raison}`),
    `BILAN  pages: ${bilan.length}  couleurs hors charte: ${total}  textes sous le seuil AA: ${sousAA}  pages non affichees: ${nonAffichees.length ? nonAffichees.join(', ') : 'aucune'}`,
    `LIGHTBOX  echecs: ${lightboxNonOuvertes.length ? lightboxNonOuvertes.join(', ') : 'aucun'}`,
    `FOCUS  sans l anneau de la charte, hors de l ecran ou non atteint: ${focusEnDefaut.length ? focusEnDefaut.join(', ') : 'aucun'}`,
    ...(avecDeploiement.length
      ? [`DEPLOIEMENT  partie, tableau de bord de Traefik ou fiches en defaut: ${deploiementEnDefaut.length ? deploiementEnDefaut.join(', ') : 'aucune'}`]
      : []),
    ...(absentes.length ? [`DEPLOIEMENT  fiches dites absentes du catalogue: ${absentes.join(', ')}`] : []),
  ];
  const conforme = total === 0 && sousAA === 0 && nonAffichees.length === 0 && lightboxNonOuvertes.length === 0 && focusEnDefaut.length === 0 && deploiementEnDefaut.length === 0;
  return { code: conforme ? 0 : 1, lignes };
}
