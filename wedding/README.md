# دعوة زفاف — Faire-part de mariage (arabe)

Un site d'invitation de mariage **autonome**, au style d'un faire-part papier arabe :
fond ivoire, cadre doré ornementé, calligraphie arabe, enveloppe qui s'ouvre,
compte à rebours et confirmation de présence (RSVP) via WhatsApp.

> Projet **indépendant** — il n'a aucun lien avec l'application PhotoShare du dépôt.
> Un seul fichier, sans build, sans dépendances.

## Aperçu / Utilisation

Ouvrez simplement `index.html` dans un navigateur (double-clic), ou lancez un petit serveur :

```bash
cd wedding
python3 -m http.server 8080
# puis ouvrez http://localhost:8080
```

## Personnalisation ✏️

Tout se modifie dans **un seul endroit** : l'objet `WEDDING` en bas de `index.html`
(dans la balise `<script>`).

| Champ            | Description                                                       |
| ---------------- | ----------------------------------------------------------------- |
| `groom` / `bride`| Prénoms des mariés (arabe)                                         |
| `intro`          | Phrase d'invitation au-dessus des prénoms                         |
| `dateISO`        | Date + heure au format `AAAA-MM-JJTHH:MM:SS` (compte à rebours + calendrier) |
| `dateGregorian`  | Date affichée (grégorienne, en arabe)                             |
| `dateHijri`      | Date hégirienne affichée                                          |
| `time`           | Heure affichée                                                    |
| `venueName`      | Nom de la salle                                                   |
| `venueAddress`   | Adresse / ville                                                   |
| `mapUrl`         | Lien Google Maps du lieu                                          |
| `rsvpPhone`      | Numéro WhatsApp **international sans `+` ni espaces**. Format français : `33` + numéro sans le 0 (ex. `06 12 34 56 78` → `33612345678`) |
| `families`       | Noms des familles en bas du carton                               |

Le verset coranique (Ar-Rum 21) se modifie via la constante `VERSE`.

## Fonctionnalités

- 💌 Enveloppe animée qui s'ouvre au clic
- 🕌 Bismillah + verset coranique en calligraphie
- 💍 Noms des mariés, date (grégorienne + hégirienne), lieu
- ⏳ Compte à rebours en direct (chiffres arabes ٠١٢٣…)
- 📍 Bouton « localisation » (Google Maps) et 🗓️ « ajouter au calendrier »
- ✅ RSVP : le formulaire ouvre WhatsApp avec un message pré-rempli vers `rsvpPhone`
- 🖨️ Imprimable (mise en page propre en `@media print`)
- 📱 Responsive (mobile / tablette / bureau), RTL

## Mise en ligne

Comme c'est un site statique, hébergez-le gratuitement sur **Netlify**, **Vercel**,
**GitHub Pages** ou **Cloudflare Pages** : glissez-déposez le dossier `wedding/`
ou pointez l'hébergeur vers ce dossier.

## Polices

Chargées depuis Google Fonts : **Aref Ruqaa** (titres calligraphiques),
**Amiri** (texte), **Reem Kufi** (libellés). Une connexion internet est requise
pour l'affichage exact des polices ; sinon une police système de secours est utilisée.
