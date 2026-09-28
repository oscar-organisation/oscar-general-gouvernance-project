"""Les tests du generateur des images de marque (fabriquer.py).

Ils se lancent dans le conteneur decrit par compose.yaml, a cote, depuis le
dossier oscar_backstage/:

    docker compose -f marque/compose.yaml run --rm tester

Ils n ecrivent rien: le portail est monte en lecture seule. La chaine du depot
les lance a chaque passe.

Ce qu ils verifient: chaque adresse d icone porte l empreinte du contenu de
l icone, dans la page comme dans le manifeste, et le generateur refuse une
reference absente, en double, ou qu il n a pas fabriquee. L empreinte est
recalculee ici, a part, et non reprise du generateur: une erreur dans sa
facon de la calculer se verrait.
"""

import hashlib
import io
import json
import re
import unittest

from PIL import Image

import fabriquer

# Les adresses que la page du portail (index.html) doit versionner.
REFERENCES_DE_LA_PAGE = (
    "favicon.ico",
    "favicon-32x32.png",
    "favicon-16x16.png",
    "apple-touch-icon.png",
    "manifest.json",
)
# Les icones que le manifeste doit citer, et versionner.
ICONES_DU_MANIFESTE = ("android-chrome-192x192.png", "android-chrome-512x512.png")


def empreinte(contenu):
    """La regle, ecrite une fois ici: les douze premiers caracteres du SHA-256."""
    return hashlib.sha256(contenu).hexdigest()[:12]


def sans_empreintes(texte):
    """Le texte sans aucune empreinte, comme avant la premiere fabrication.

    Les tests partent de la: la page et le manifeste du depot portent deja
    leurs empreintes, et un generateur qui en oublierait une la laisserait en
    place sans que rien ne le voie."""
    return re.sub(r"\?v=[0-9a-f]*", "", texte)


class LesAdressesDesIcones(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.fichiers = fabriquer.attendus()
        cls.page = fabriquer.versionner_la_page(
            sans_empreintes(fabriquer.lire("public/index.html")),
            cls.fichiers).decode("utf-8")
        cls.manifeste = json.loads(fabriquer.versionner_le_manifeste(
            sans_empreintes(fabriquer.lire("public/manifest.json")), cls.fichiers))

    def test_le_depot_porte_ce_que_le_generateur_fabrique(self):
        # Depuis une page sans empreinte, ou depuis celle du depot: la meme.
        self.assertEqual(self.page.encode("utf-8"), self.fichiers["public/index.html"])
        self.assertEqual(self.manifeste, json.loads(self.fichiers["public/manifest.json"]))

    def test_chaque_reference_de_la_page_porte_l_empreinte_de_son_fichier(self):
        for nom in REFERENCES_DE_LA_PAGE:
            attendue = '<%= publicPath %>/{}?v={}"'.format(
                nom, empreinte(self.fichiers["public/" + nom]))
            with self.subTest(nom=nom):
                self.assertEqual(self.page.count(attendue), 1)

    def test_aucune_reference_de_la_page_sans_empreinte(self):
        # Toute adresse de fichier public, dans un lien de la page, porte ?v=.
        liens = re.findall(r'href="<%= publicPath %>/([^"]+)"', self.page)
        self.assertTrue(liens)
        for lien in liens:
            with self.subTest(lien=lien):
                self.assertRegex(lien, r"\?v=[0-9a-f]{12}$")

    def test_chaque_icone_du_manifeste_porte_l_empreinte_de_son_fichier(self):
        sources = [icone["src"] for icone in self.manifeste["icons"]]
        self.assertEqual(
            sorted(sources),
            sorted(nom + "?v=" + empreinte(self.fichiers["public/" + nom])
                   for nom in ICONES_DU_MANIFESTE))

    def test_le_manifeste_garde_ses_autres_reglages(self):
        self.assertEqual(self.manifeste["short_name"], "OSCAR")
        self.assertEqual(self.manifeste["theme_color"], "#1B1D1E")
        self.assertEqual(self.manifeste["background_color"], "#F3F1EC")
        self.assertEqual(self.manifeste["start_url"], "./index.html")

    def test_refaire_ne_change_rien(self):
        # Le generateur relit la page et le manifeste qu il a deja ecrits: une
        # seconde passe doit donner les memes octets.
        page = fabriquer.versionner_la_page(self.page, self.fichiers)
        manifeste = fabriquer.versionner_le_manifeste(
            self.fichiers["public/manifest.json"].decode("utf-8"), self.fichiers)
        self.assertEqual(page, self.fichiers["public/index.html"])
        self.assertEqual(manifeste, self.fichiers["public/manifest.json"])

    def test_une_icone_changee_change_son_adresse(self):
        fichiers = dict(self.fichiers)
        fichiers["public/apple-touch-icon.png"] = b"une autre image"
        fichiers["public/android-chrome-192x192.png"] = b"une autre image"
        fichiers["public/manifest.json"] = b"un autre manifeste"
        page = fabriquer.versionner_la_page(self.page, fichiers).decode("utf-8")
        manifeste = fabriquer.versionner_le_manifeste(
            self.fichiers["public/manifest.json"].decode("utf-8"), fichiers)
        self.assertIn("apple-touch-icon.png?v=" + empreinte(b"une autre image"), page)
        self.assertIn("manifest.json?v=" + empreinte(b"un autre manifeste"), page)
        self.assertIn(b"android-chrome-192x192.png?v=" + empreinte(b"une autre image").encode(),
                      manifeste)


class LesRefus(unittest.TestCase):

    # Le lien de l icone de l ecran d accueil, sur plusieurs lignes. Son adresse
    # contient « %> »: le motif va jusqu au guillemet qui ferme la balise.
    LIEN_APPLE = re.compile(r'<link\s+rel="apple-touch-icon".*?"\s*/>', re.S)

    @classmethod
    def setUpClass(cls):
        cls.fichiers = fabriquer.attendus()
        cls.page = cls.fichiers["public/index.html"].decode("utf-8")
        cls.manifeste = cls.fichiers["public/manifest.json"].decode("utf-8")

    def test_une_reference_absente_de_la_page_est_refusee(self):
        page = self.LIEN_APPLE.sub("", self.page)
        self.assertNotIn("apple-touch-icon.png", page)
        with self.assertRaises(ValueError):
            fabriquer.versionner_la_page(page, self.fichiers)

    def test_une_reference_en_double_dans_la_page_est_refusee(self):
        lien = self.LIEN_APPLE.search(self.page)[0]
        self.assertIn("apple-touch-icon.png", lien)
        with self.assertRaises(ValueError):
            fabriquer.versionner_la_page(self.page + lien, self.fichiers)

    def test_une_icone_du_manifeste_non_fabriquee_est_refusee(self):
        manifeste = json.loads(self.manifeste)
        manifeste["icons"].append({"src": "faite-a-la-main.png", "sizes": "64x64"})
        with self.assertRaises(ValueError):
            fabriquer.versionner_le_manifeste(json.dumps(manifeste), self.fichiers)

    def test_une_icone_absente_du_manifeste_est_refusee(self):
        manifeste = json.loads(self.manifeste)
        manifeste["icons"] = manifeste["icons"][:1]
        with self.assertRaises(ValueError):
            fabriquer.versionner_le_manifeste(json.dumps(manifeste), self.fichiers)

    def test_une_icone_en_double_dans_le_manifeste_est_refusee(self):
        manifeste = json.loads(self.manifeste)
        manifeste["icons"].append(dict(manifeste["icons"][0]))
        with self.assertRaises(ValueError):
            fabriquer.versionner_le_manifeste(json.dumps(manifeste), self.fichiers)


class LIconeDeLaPageDeConnexion(unittest.TestCase):

    def test_elle_est_fabriquee_a_96_px_pour_un_affichage_a_48(self):
        contenu = fabriquer.attendus()["src/marque/oscar-icone-96.png"]
        image = Image.open(io.BytesIO(contenu))
        self.assertEqual(image.size, (96, 96))

    def test_elle_est_l_icone_d_application_de_la_charte(self):
        # La meme image que l icone d application, a une autre taille: le
        # symbole blanc sur le carre Noir OSCAR, sans autre couleur de fond.
        image = Image.open(io.BytesIO(
            fabriquer.attendus()["src/marque/oscar-icone-96.png"])).convert("RGBA")
        self.assertEqual(image.getpixel((48, 4)), fabriquer.NOIR_OSCAR)
        self.assertEqual(image.getpixel((0, 0))[3], 0)


if __name__ == "__main__":
    unittest.main()
