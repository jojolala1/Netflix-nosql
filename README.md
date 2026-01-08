# TP NoSQL – Plateforme de Streaming

Ce projet met en place une base de données NoSQL (MongoDB) pour analyser l'audience d'une plateforme de streaming vidéo.

## 📋 Objectif

Mettre en place from scratch :
- Une base de données NoSQL (MongoDB)
- Déployée avec Docker
- Contenant une grande quantité de données (≥ 50 000 documents)
- Permettant de réaliser des requêtes d'analyse

## 🗂️ Modèle de données

Le projet utilise 3 collections principales :

### 1. `users` - Utilisateurs
- `_id` : Identifiant unique
- `email` : Adresse email
- `age` : Âge de l'utilisateur
- `country` : Pays de l'utilisateur
- `created_at` : Date de création du compte

### 2. `contents` - Catalogue de films et séries
- `_id` : Identifiant unique
- `title` : Titre du contenu
- `type` : Type de contenu ("film" ou "série")
- `genres` : Tableau de genres (Action, Comédie, Drame, etc.)
- `duration_minutes` : Durée en minutes

### 3. `watch_history` - Historique de visionnage
- `_id` : Identifiant unique
- `user_id` : Référence à l'utilisateur
- `content_id` : Référence au contenu
- `watch_date` : Date et heure du visionnage
- `watch_time_minutes` : Durée de visionnage en minutes
- `device` : Type d'appareil ("tv", "mobile", "tablette", "pc")

## 🚀 Installation et démarrage

### Prérequis

- Docker et Docker Compose installés
- Node.js (version 14 ou supérieure) pour exécuter le script de génération

### Étape 1 : Lancer MongoDB avec Docker

1. **Démarrer les conteneurs** :
   ```bash
   docker compose up -d
   ```

2. **Vérifier que les conteneurs sont en cours d'exécution** :
   ```bash
   docker compose ps
   ```

   Vous devriez voir :
   - `mongo-netflix` : MongoDB sur le port 27017
   - `mongo-express-netflix` : Interface web sur le port 8081

3. **Accéder à MongoDB** :
   - **Via MongoDB Shell (mongosh)** :
     ```bash
     mongosh "mongodb://root:rootpass@localhost:27017/?authSource=admin"
     ```
   
   - **Via Mongo Express** (interface web) :
     - Ouvrir votre navigateur à l'adresse : http://localhost:8081
     - Identifiant : `admin`
     - Mot de passe : `admin`

4. **Vérifier la connexion** :
   ```javascript
   // Dans mongosh
   show dbs
   ```

### Étape 2 : Installer les dépendances

```bash
npm install
```

Les dépendances nécessaires sont :
- `mongodb` : Driver MongoDB pour Node.js
- `@faker-js/faker` : Génération de données aléatoires réalistes

### Étape 3 : Lancer le backend

Le backend Express est déjà configuré dans `docker-compose.yml` et démarre automatiquement. Si vous voulez le lancer manuellement :

```bash
npm install
npm start
```

Le serveur backend sera accessible sur http://localhost:3000

### Étape 4 : Générer les données

1. **Exécuter le script de génération** :
   ```bash
   npm run seed
   ```
   
   Ou directement :
   ```bash
   node seed.js
   ```

2. **Temps d'exécution** : 
   - Environ 2-5 minutes selon votre machine
   - Le script affiche la progression en temps réel

3. **Vérifier les volumes générés** :
   
   Connectez-vous à MongoDB et exécutez :
   ```javascript
   use streaming_db
   
   // Compter les documents
   db.users.countDocuments()
   db.contents.countDocuments()
   db.watch_history.countDocuments()
   ```
   
   Vous devriez voir :
   - **Utilisateurs** : ~1500 documents
   - **Contenus** : ~600 documents
   - **Historiques** : ~55000 documents

## 🖥️ Interface Web

Une interface web moderne est disponible pour visualiser les données :

1. **Démarrer tous les services** :
   ```bash
   docker compose up -d
   ```

2. **Accéder au frontend** :
   - Ouvrir http://localhost:3001 dans votre navigateur

3. **Fonctionnalités** :
   - 📊 Statistiques générales (utilisateurs, contenus, visionnages)
   - 🏆 Top 5 des contenus les plus regardés
   - ⭐ Top 10 utilisateurs les plus actifs
   - 📱 Répartition par type d'appareil
   - 🌍 Répartition des vues par pays
   - 🎭 Genres les plus regardés
   - 📈 Statistiques des spectateurs (âge moyen, min, max)

## 📊 Requêtes d'analyse

Le fichier `queries.md` contient toutes les requêtes d'analyse avec des explications détaillées.

### Exemples de requêtes rapides

#### 1. Top 5 des contenus les plus regardés

```javascript
use streaming_db

db.watch_history.aggregate([
  {
    $group: {
      _id: "$content_id",
      totalViews: { $sum: 1 }
    }
  },
  {
    $sort: { totalViews: -1 }
  },
  {
    $limit: 5
  },
  {
    $lookup: {
      from: "contents",
      localField: "_id",
      foreignField: "_id",
      as: "content"
    }
  },
  {
    $unwind: "$content"
  },
  {
    $project: {
      title: "$content.title",
      type: "$content.type",
      totalViews: 1
    }
  }
])
```

#### 2. Temps total de visionnage par utilisateur

```javascript
db.watch_history.aggregate([
  {
    $group: {
      _id: "$user_id",
      totalWatchTime: { $sum: "$watch_time_minutes" }
    }
  },
  {
    $sort: { totalWatchTime: -1 }
  },
  {
    $limit: 10
  },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "user"
    }
  },
  {
    $unwind: "$user"
  },
  {
    $project: {
      email: "$user.email",
      totalWatchTimeHours: { $divide: ["$totalWatchTime", 60] }
    }
  }
])
```

#### 3. Répartition par type d'appareil

```javascript
db.watch_history.aggregate([
  {
    $group: {
      _id: "$device",
      totalViews: { $sum: 1 },
      totalWatchTime: { $sum: "$watch_time_minutes" }
    }
  },
  {
    $project: {
      device: "$_id",
      totalViews: 1,
      totalWatchTimeHours: { $divide: ["$totalWatchTime", 60] }
    }
  },
  {
    $sort: { totalViews: -1 }
  }
])
```

Pour plus de requêtes, consultez le fichier **`queries.md`**.

## 🔧 Configuration

### MongoDB

- **Port** : 27017
- **Utilisateur** : `root`
- **Mot de passe** : `rootpass`
- **Base de données** : `streaming_db` (créée automatiquement)

### Mongo Express

- **URL** : http://localhost:8081
- **Utilisateur** : `admin`
- **Mot de passe** : `admin`

### Backend API

- **Port** : 3000
- **URL** : http://localhost:3000
- **Endpoints disponibles** :
  - `GET /api/stats` - Statistiques générales
  - `GET /api/top-contents` - Top 5 contenus
  - `GET /api/top-users` - Top 10 utilisateurs
  - `GET /api/average-age` - Moyenne d'âge
  - `GET /api/views-by-country` - Vues par pays
  - `GET /api/views-by-device` - Vues par appareil
  - `GET /api/top-genres` - Top genres

### Frontend

- **URL** : http://localhost:3001
- **Framework** : Next.js avec TypeScript
- **Interface** : Tableau de bord d'analyse avec visualisations

### Volumes Docker

Les données MongoDB sont persistantes grâce au volume Docker `mongo-data`. Les données sont conservées même après l'arrêt des conteneurs.

## 📁 Structure du projet

```
NoSQL-TPJ1/
├── docker-compose.yml      # Configuration Docker (MongoDB, Backend, Frontend)
├── server.js               # Backend Express avec routes API
├── seed.js                 # Script de génération de données
├── queries.md              # Requêtes d'analyse détaillées
├── README.md               # Ce fichier
├── PLAN_DE_TRAVAIL.md      # Plan de travail détaillé
├── package.json            # Dépendances Node.js (backend)
├── front/
│   └── frontend/           # Application Next.js
│       ├── app/
│       │   ├── page.tsx    # Page principale du dashboard
│       │   └── layout.tsx  # Layout de l'application
│       └── package.json    # Dépendances frontend
└── docker/
    └── mongo-init/         # Scripts d'initialisation (optionnel)
```

## 🛠️ Commandes utiles

### Docker

```bash
# Démarrer tous les conteneurs (MongoDB, Backend, Frontend)
docker compose up -d

# Voir les logs de tous les services
docker compose logs -f

# Voir les logs d'un service spécifique
docker compose logs -f mongo
docker compose logs -f backend
docker compose logs -f front

# Arrêter les conteneurs
docker compose down

# Redémarrer un conteneur
docker compose restart mongo
docker compose restart backend
docker compose restart front
```

### MongoDB

```bash
# Se connecter avec mongosh
mongosh "mongodb://root:rootpass@localhost:27017/?authSource=admin"

# Dans mongosh
use streaming_db
show collections
db.users.find().limit(5)
```

### Script de génération

```bash
# Générer les données
npm run seed

# Ou directement
node seed.js
```

## 📊 Statistiques attendues

Après l'exécution du script `seed.js`, vous devriez avoir :

- **Utilisateurs** : 1500 documents
- **Contenus** : 600 documents (films et séries)
- **Historiques de visionnage** : 55000 documents

## 🔍 Index créés automatiquement

Le script `seed.js` crée automatiquement des index pour optimiser les performances :

- `watch_history` : index sur `user_id`, `content_id`, `device`, `watch_date`
- `users` : index sur `country`, `email` (unique)
- `contents` : index sur `genres`

## 🐛 Dépannage

### MongoDB ne démarre pas

```bash
# Vérifier les logs
docker compose logs mongo

# Vérifier que le port 27017 n'est pas déjà utilisé
netstat -an | grep 27017
```

### Erreur de connexion

Vérifiez que :
1. Les conteneurs sont bien démarrés : `docker compose ps`
2. Les identifiants sont corrects (root/rootpass)
3. Le port 27017 est accessible

### Le script seed.js échoue

1. Vérifiez que MongoDB est bien démarré
2. Vérifiez que les dépendances sont installées : `npm install`
3. Vérifiez les logs d'erreur dans la console

### Réinitialiser les données

```bash
# Arrêter les conteneurs
docker compose down

# Supprimer le volume (⚠️ supprime toutes les données)
docker volume rm nosql-tpj1_mongo-data

# Redémarrer
docker compose up -d

# Régénérer les données
npm run seed
```

## 📚 Ressources

- [Documentation MongoDB](https://docs.mongodb.com/)
- [MongoDB Aggregation Pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/)
- [Mongo Express](https://github.com/mongo-express/mongo-express)

## 📝 Notes

- Les données générées sont aléatoires mais réalistes grâce à Faker.js
- Certains contenus sont volontairement plus populaires que d'autres pour simuler une distribution réaliste
- Les dates de visionnage s'étalent sur les 2 dernières années
- Les index sont créés automatiquement pour optimiser les requêtes

## ✅ Checklist de validation

- [x] Docker Compose configuré avec MongoDB et Mongo Express
- [x] Volume persistant pour les données MongoDB
- [x] Script de génération de données fonctionnel
- [x] ≥ 50 000 documents dans `watch_history`
- [x] 6 requêtes d'analyse obligatoires dans `queries.md`
- [x] Requêtes bonus (agrégations complexes, filtres temporels, index)
- [x] README.md complet et clair

---

**Auteur** : TP NoSQL - Dernière Demi-journée  
**Date** : 2024
