# GesTrack 🗂️

Application de gestion des dettes clients et de recensement des clients par profession.

---

## 🏗️ Structure du projet

```
gestrack/
├── frontend/          → React + Bootstrap + FontAwesome
└── backend/           → Node.js + Firebase + Cloudinary + Swagger
```

---

## ⚡ Démarrage rapide

### 1. Cloner et configurer

```bash
git clone <repo>
cd gestrack
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Remplir le fichier .env avec vos clés Firebase et Cloudinary
npm run dev
```

API disponible sur : `http://localhost:5000`  
Documentation Swagger : `http://localhost:5000/api/docs`

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Remplir le fichier .env avec vos clés Firebase
npm start
```

Application disponible sur : `http://localhost:3000`

---

## 🔐 Authentification

Un seul utilisateur autorisé :
- **Email** : `iyadaniel@gestrack.com`
- **Mot de passe** : `dollar0987`

> Créer cet utilisateur manuellement dans **Firebase Console → Authentication → Users**.

---

## ⚙️ Configuration Firebase

### Firebase Console
1. Créer un projet Firebase
2. Activer **Authentication** (méthode Email/Mot de passe)
3. Créer l'utilisateur `iyadaniel@gestrack.com` / `dollar0987`
4. Activer **Firestore Database** (mode production)
5. Télécharger la clé de service Admin SDK → `backend/.env`

### Collections Firestore créées automatiquement
| Collection | Description |
|---|---|
| `clients` | Données des clients |
| `historique_clients` | Historique des modifications clients |
| `dettes` | Dettes par client |
| `historique_dettes` | Toutes les transactions de dettes |
| `produits` | Catalogue produits avec stock |
| `historique_produits` | Mouvements de stock |
| `notifications` | Rappels automatiques (30 jours) |

---

## ☁️ Configuration Cloudinary

1. Créer un compte sur [cloudinary.com](https://cloudinary.com)
2. Copier `Cloud Name`, `API Key`, `API Secret`
3. Les coller dans `backend/.env`

---

## 🧩 Fonctionnalités

### Clients
- ✅ CRUD complet avec historique
- ✅ Photo de profil (upload Cloudinary)
- ✅ Recensement par profession (filtre)
- ✅ Numéro WhatsApp cliquable (ouvre WhatsApp)
- ✅ Types de produits (checkbox)

### Dettes
- ✅ Plusieurs dettes par client
- ✅ Ajout et réduction de montant avec historique
- ✅ Statuts : En cours / En retard / Soldée
- ✅ Rappel automatique tous les 30 jours (cron)
- ✅ Notifications dans l'application

### Produits
- ✅ CRUD avec image (Cloudinary)
- ✅ Deux prix : vente (visible) et achat (masqué 👁️)
- ✅ Le prix d'achat nécessite le mot de passe de connexion
- ✅ Gestion de stock : entrée / sortie automatique
- ✅ Alerte stock faible (≤ 5 unités)
- ✅ Historique des mouvements de stock

### Tableau de bord
- ✅ Vue globale : clients, dettes, produits, retards
- ✅ Montant total des dettes en cours

### Statistiques
- ✅ Top 5 débiteurs
- ✅ Clients par profession (graphique barres)
- ✅ Produits en stock faible

---

## 📚 API Documentation

Swagger disponible sur : `http://localhost:5000/api/docs`

### Endpoints principaux

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/clients` | Liste des clients |
| POST | `/api/clients` | Créer un client |
| PUT | `/api/clients/:id` | Modifier un client |
| DELETE | `/api/clients/:id` | Supprimer un client |
| GET | `/api/clients/:id/historique` | Historique client |
| GET | `/api/dettes/client/:clientId` | Dettes d'un client |
| POST | `/api/dettes/client/:clientId` | Créer une dette |
| PATCH | `/api/dettes/:id/ajouter` | Ajouter un montant |
| PATCH | `/api/dettes/:id/reduire` | Paiement partiel |
| GET | `/api/produits` | Liste produits |
| POST | `/api/produits/verifier-mdp` | Vérifier MDP prix achat |
| PATCH | `/api/produits/:id/stock/ajouter` | Entrée stock |
| PATCH | `/api/produits/:id/stock/reduire` | Sortie stock |

---

## 🔄 Système de rappel (30 jours)

Le service `rappelService.js` s'exécute automatiquement chaque nuit à **00h00 (heure de Douala)** via `node-cron`.

Il :
1. Vérifie toutes les dettes `EN_COURS` dont la date de relance est dépassée
2. Les passe en statut `EN_RETARD`
3. Programme la prochaine relance à +30 jours
4. Crée une notification visible dans l'application

---

## 🛠️ Technologies utilisées

| Partie | Technologies |
|---|---|
| Frontend | React 18, React Router 6, Bootstrap 5, FontAwesome 6, Axios, React-Toastify |
| Backend | Node.js, Express.js, Firebase Admin SDK, Cloudinary, Multer, node-cron, Swagger |
| Base de données | Firebase Firestore (NoSQL) |
| Stockage images | Cloudinary |
| Authentification | Firebase Authentication |

---

## 📁 Variables d'environnement

### Backend (`backend/.env`)
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
MOT_DE_PASSE_PRIX=dollar0987
```

### Frontend (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
```

---

## ⚠️ Sécurité

- Ne jamais committer les fichiers `.env`
- Ne jamais committer les clés Firebase Admin SDK (`serviceAccountKey.json`)
- Le prix d'achat des produits est protégé par le mot de passe de connexion côté backend
- Toutes les routes API nécessitent un token Firebase valide
