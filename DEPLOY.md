# Guide de déploiement PhotoShare

## Stack
- **Frontend + API** : Next.js 14 → Vercel (gratuit)
- **Base de données** : MongoDB Atlas (gratuit tier)
- **Images** : Cloudinary (gratuit 25GB)
- **Reconnaissance faciale** : face-api.js (côté client, gratuit)

---

## 1. MongoDB Atlas

1. Allez sur https://mongodb.com/atlas
2. Créez un compte gratuit (tier M0)
3. Créez un cluster, puis "Database Access" → ajoutez un utilisateur
4. "Network Access" → ajoutez `0.0.0.0/0` (autoriser toutes les IPs pour Vercel)
5. "Connect" → "Connect your application" → copiez l'URI
6. Remplacez dans `.env.local` : `MONGODB_URI=mongodb+srv://...`

---

## 2. Cloudinary

1. Allez sur https://cloudinary.com
2. Créez un compte gratuit
3. Copiez dans le Dashboard :
   - Cloud name → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - API Key → `CLOUDINARY_API_KEY`
   - API Secret → `CLOUDINARY_API_SECRET`

---

## 3. GitHub

```bash
cd photoshare
git init
git add .
git commit -m "Initial commit"
# Créez un repo sur github.com puis :
git remote add origin https://github.com/VOTRE_USER/photoshare.git
git push -u origin main
```

---

## 4. Vercel

1. Allez sur https://vercel.com
2. "New Project" → importez votre repo GitHub
3. Ajoutez les variables d'environnement :

```
MONGODB_URI=...
NEXTAUTH_SECRET=une-chaine-aleatoire-longue
NEXTAUTH_URL=https://votre-domaine.vercel.app
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

4. Deployez !

---

## 5. Créer le compte admin

Après déploiement, visitez :
```
https://votre-domaine.vercel.app/api/seed
```
Ceci crée : **admin@photoshare.com** / **Admin@123**
⚠️ Changez le mot de passe immédiatement après !

---

## Comptes & accès

| Rôle | Accès |
|------|-------|
| Admin | `/admin` — gère les photographes |
| Photographe | `/photographer` — crée des événements, uploade des photos |
| Client | `/event` — entre le code, reconnaissance faciale |

---

## Flux client

1. Photographe crée un événement → obtient un code 6 chiffres + QR code
2. Affiche le QR/code dans la salle de fête
3. Client scanne QR ou entre le code → va sur `/event/[code]`
4. Caméra s'active → face-api.js compare le visage avec les descripteurs stockés
5. Affiche uniquement les photos correspondantes

## Important : Reconnaissance faciale

Pour que la reconnaissance fonctionne, les descripteurs de visage doivent être calculés
et stockés pour chaque photo. Cette étape se fait dans le navigateur.

**Option A (actuelle)** : Les descripteurs sont calculés lors de la consultation client.
**Option B (recommandée pour production)** : Calculer les descripteurs à l'upload.
Pour cela, utiliser un Worker côté serveur ou AWS Rekognition.
