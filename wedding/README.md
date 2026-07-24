# دعوة زفاف — Faire-part de mariage (arabe)

Un site d'invitation de mariage **autonome**, au style d'un faire-part papier arabe :
fond ivoire, cadre doré ornementé, calligraphie arabe, enveloppe qui s'ouvre,
programme des événements et compte à rebours animé.

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
| `parents`        | Les deux pères (bas de la phrase d'invitation)                    |
| `introTop` / `introBottom` | Phrases d'invitation autour des noms des familles      |
| `dateRange`      | Plage de dates affichée en tête                                   |
| `events`         | **Programme** : tableau d'événements `{ icon, title, day, time, venue }`. `icon` ∈ `dinner` / `henna` / `rings` |
| `dateISO`        | Date + heure du mariage `AAAA-MM-JJTHH:MM:SS` (compte à rebours + calendrier) |
| `venueWedding`   | Nom de la salle du mariage (bouton « موقع »)                      |
| `mapUrl`         | Lien Google Maps du lieu du mariage                               |
| `closing`        | Phrase de clôture (bas du carton)                                 |

Le verset coranique (Ar-Rum 21) se modifie via la constante `VERSE`.

## Fonctionnalités

- 💌 Enveloppe animée qui s'ouvre au clic
- 🕌 Bismillah + verset coranique en calligraphie
- 💍 Noms des mariés et des deux familles
- 📜 **Programme** des événements (dîner, henné, mariage) avec jour, heure et salle
- ⏳ Compte à rebours en direct jusqu'au mariage (chiffres occidentaux)
- 📍 Bouton « localisation » (Google Maps) et 🗓️ « ajouter au calendrier »
- ✨ Animations : enveloppe flottante, sceau pulsé, révélation en cascade, cœurs
  battants, particules dorées et pétales (désactivées si `prefers-reduced-motion`)
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
