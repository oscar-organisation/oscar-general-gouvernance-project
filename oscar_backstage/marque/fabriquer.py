"""Fabrique les images de marque du portail a partir du symbole officiel.

La source est source/oscar-symbole-blanc.png, recopie tel quel de la charte
graphique d OSCAR (dossier « Branding oscar », fichier
« PNG sans fond/oscar-symbole-blanc.png »). Ce script ne la modifie jamais: il
la reduit a chaque taille d affichage, double densite comprise, et la pose sur
le carre sombre de l icone d application, comme la charte le montre. Aucune
couleur du symbole n est retouchee.

Deux usages, dans le conteneur decrit par compose.yaml, a cote:

    fabriquer.py generer    refait chaque image a sa place dans le portail
    fabriquer.py verifier   refait les images a part, et echoue si une image
                            du portail ne correspond plus a ce que ce script
                            fabrique; n ecrit rien

Pourquoi un script plutot que des images faites a la main: une image faite a
la main ne se refait pas a l identique. Celles-ci se refont a l octet pres, et
la verification le prouve quand on la lance. C est un outil du developpeur,
lance a la main: les verifications automatiques de GitHub ne le lancent plus
(decision 91).

Le script tient aussi les adresses qui citent ces images: dans la page du
portail (public/index.html) et dans son manifeste (public/manifest.json),
chaque adresse porte l empreinte du contenu du fichier. Ses tests sont dans
test_fabriquer.py, a cote.
"""

import hashlib
import io
import json
import re
import os
import sys

from PIL import Image, ImageDraw

ICI = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.join(ICI, "source", "oscar-symbole-blanc.png")
APP = os.path.join(ICI, "..", "packages", "app")

# Le Noir OSCAR de la charte, fond de l icone d application.
NOIR_OSCAR = (0x1B, 0x1D, 0x1E, 255)

# Les proportions de l icone d application, relevees dans la charte
# (OSCAR_charte_graphique.html, classe .appicon): un carre de 110 px aux coins
# arrondis de 26 px, et le symbole a 62 % de sa largeur.
ARRONDI = 26 / 110
PART_DU_SYMBOLE = 0.62

# Le symbole seul, sur fond sombre, a la hauteur ou le portail l affiche, en
# double densite pour les ecrans fins. La charte demande 24 px au moins.
#   haut du menu                      28 px de haut
#   page d accueil « Commencer ici »  48 px de haut, dans son bandeau sombre
SYMBOLES = {
    "src/marque/oscar-symbole-blanc-56.png": 56,
    "src/marque/oscar-symbole-blanc-96.png": 96,
}

# L icone d application: onglet du navigateur, ecran d accueil d un telephone,
# manifeste. Le nom du fichier est celui que les navigateurs cherchent.
# La page de connexion la montre aussi, devant son titre: la charte la
# designe pour les interfaces numeriques, et elle se lit sur le fond clair
# comme sur le fond sombre (le symbole blanc seul ne va que sur fond sombre).
# Elle y est affichee a 48 px; l image fait 96 px, pour la double densite.
ICONES = {
    "public/favicon-16x16.png": 16,
    "public/favicon-32x32.png": 32,
    "public/apple-touch-icon.png": 180,
    "public/android-chrome-192x192.png": 192,
    "public/android-chrome-512x512.png": 512,
    "src/marque/oscar-icone-96.png": 96,
}
ICONE_ICO = ("public/favicon.ico", (16, 32, 48))

# Les fichiers que la page du portail cite par leur adresse, dans son en-tete.
# Le manifeste en fait partie: il cite lui-meme des icones, et son contenu
# change avec elles.
REFERENCES_DE_LA_PAGE = (
    "favicon.ico",
    "favicon-32x32.png",
    "favicon-16x16.png",
    "apple-touch-icon.png",
    "manifest.json",
)
# Les icones que le manifeste cite, pour l ecran d accueil d un telephone.
ICONES_DU_MANIFESTE = ("android-chrome-192x192.png", "android-chrome-512x512.png")


def symbole_a_la_hauteur(hauteur):
    """Le symbole officiel, reduit a la hauteur voulue, proportions gardees."""
    source = Image.open(SOURCE).convert("RGBA")
    largeur = round(source.width * hauteur / source.height)
    return source.resize((largeur, hauteur), Image.LANCZOS)


def icone(cote):
    """Le symbole blanc sur le carre Noir OSCAR aux coins arrondis."""
    fond = Image.new("RGBA", (cote, cote), (0, 0, 0, 0))
    ImageDraw.Draw(fond).rounded_rectangle(
        (0, 0, cote - 1, cote - 1), radius=round(cote * ARRONDI), fill=NOIR_OSCAR)
    source = Image.open(SOURCE).convert("RGBA")
    largeur = round(cote * PART_DU_SYMBOLE)
    hauteur = round(source.height * largeur / source.width)
    symbole = source.resize((largeur, hauteur), Image.LANCZOS)
    fond.alpha_composite(symbole, ((cote - largeur) // 2, (cote - hauteur) // 2))
    return fond


def png(image):
    """Les octets d un PNG compresse, toujours les memes pour la meme image."""
    tampon = io.BytesIO()
    image.save(tampon, format="PNG", optimize=True)
    return tampon.getvalue()


def ico(tailles):
    tampon = io.BytesIO()
    icone(max(tailles)).save(tampon, format="ICO", sizes=[(t, t) for t in tailles])
    return tampon.getvalue()


# POURQUOI UNE EMPREINTE DANS CHAQUE ADRESSE
#
# Un navigateur garde une icone, ou le manifeste, pour une adresse donnee. Le
# portail le laisse revalider, mais l etiquette qu il renvoie pour cela ne
# depend que de la taille du fichier (mesure le 28/09/2026: « W/"<taille>-0" »,
# date au 1er janvier 1970): une image changee de meme taille passerait pour
# inchangee. L empreinte du contenu, dans l adresse, change l adresse des que
# les octets changent, et seulement alors.

def empreinte(contenu):
    """Les douze premiers caracteres du SHA-256 du contenu."""
    return hashlib.sha256(contenu).hexdigest()[:12]


def versionner_le_manifeste(texte, fichiers):
    """Le manifeste, chaque icone citee avec l empreinte de son contenu.

    Il ne doit citer que les icones fabriquees ici, chacune une fois: une icone
    faite a la main, absente ou citee deux fois arrete la fabrication. Le
    reste du manifeste est garde tel quel."""
    manifeste = json.loads(texte)
    citees = []
    for icone_citee in manifeste.get("icons", []):
        nom = icone_citee["src"].split("?", 1)[0]
        if nom not in ICONES_DU_MANIFESTE:
            raise ValueError("Icone du manifeste que ce script ne fabrique pas: " + nom)
        citees.append(nom)
        icone_citee["src"] = nom + "?v=" + empreinte(fichiers["public/" + nom])
    for nom in ICONES_DU_MANIFESTE:
        if citees.count(nom) != 1:
            raise ValueError("Une seule icone attendue dans le manifeste pour " + nom)
    return (json.dumps(manifeste, indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def versionner_la_page(page, fichiers):
    """La page du portail, chaque reference d icone et du manifeste avec
    l empreinte de son contenu. Une reference absente ou en double arrete la
    fabrication. Le reste de la page reste ecrit a la main."""
    for nom in REFERENCES_DE_LA_PAGE:
        adresse = nom + "?v=" + empreinte(fichiers["public/" + nom])
        motif = r'(<%= publicPath %>/)' + re.escape(nom) + r'(?:\?v=[^"\s]*)?(?=")'
        page, nombre = re.subn(motif, lambda m: m[1] + adresse, page)
        if nombre != 1:
            raise ValueError("Une seule reference attendue dans index.html pour " + nom)
    return page.encode("utf-8")


def lire(chemin):
    """Un fichier texte du portail, relu tel qu il est."""
    with open(os.path.join(APP, chemin), encoding="utf-8") as fichier:
        return fichier.read()


def attendus():
    """Chaque fichier a fabriquer, et son contenu."""
    fichiers = {}
    for chemin, hauteur in SYMBOLES.items():
        fichiers[chemin] = png(symbole_a_la_hauteur(hauteur))
    for chemin, cote in ICONES.items():
        fichiers[chemin] = png(icone(cote))
    fichiers[ICONE_ICO[0]] = ico(ICONE_ICO[1])
    # Le manifeste avant la page: la page cite le manifeste, dont le contenu
    # depend des icones qu il cite.
    fichiers["public/manifest.json"] = versionner_le_manifeste(
        lire("public/manifest.json"), fichiers)
    fichiers["public/index.html"] = versionner_la_page(
        lire("public/index.html"), fichiers)
    return fichiers


def main(mode):
    ecarts = 0
    for chemin, contenu in sorted(attendus().items()):
        complet = os.path.join(APP, chemin)
        if mode == "generer":
            os.makedirs(os.path.dirname(complet), exist_ok=True)
            with open(complet, "wb") as fichier:
                fichier.write(contenu)
            print("FABRIQUE  %s  (%d octets)" % (chemin, len(contenu)))
            continue
        if not os.path.exists(complet):
            print("MANQUE    %s" % chemin)
            ecarts += 1
        elif open(complet, "rb").read() != contenu:
            print("PERIME    %s" % chemin)
            ecarts += 1
        else:
            print("A JOUR    %s" % chemin)
    if ecarts:
        print("%d fichier(s) de marque perimes. Refaire: "
              "docker compose -f marque/compose.yaml run --rm fabriquer" % ecarts)
        return 1
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in ("generer", "verifier"):
        print("Usage: fabriquer.py generer | verifier", file=sys.stderr)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
