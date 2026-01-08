# Requêtes NoSQL d'analyse - Plateforme de Streaming

Ce document contient les requêtes d'analyse pour la plateforme de streaming.

## Base de données
- **Nom de la base** : `streaming_db`
- **Collections** : `users`, `contents`, `watch_history`

---

## 1. Top 5 des contenus les plus regardés

**Objectif** : Identifier les 5 contenus les plus populaires en nombre de visionnages.

```javascript
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

**Résultat** : Retourne les 5 contenus avec le plus grand nombre de visionnages, incluant leur titre, type et nombre total de vues.

---

## 2. Temps total de visionnage par utilisateur

**Objectif** : Calculer le temps total passé à regarder des contenus pour chaque utilisateur.

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
      country: "$user.country",
      totalWatchTimeMinutes: "$totalWatchTime",
      totalWatchTimeHours: { $divide: ["$totalWatchTime", 60] }
    }
  },
  {
    $limit: 10
  }
])
```

**Résultat** : Liste les utilisateurs avec leur temps total de visionnage en minutes et heures, triés par ordre décroissant.

---

## 3. Moyenne d'âge des spectateurs

**Objectif** : Calculer l'âge moyen des utilisateurs qui regardent des contenus.

```javascript
db.watch_history.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "user_id",
      foreignField: "_id",
      as: "user"
    }
  },
  {
    $unwind: "$user"
  },
  {
    $group: {
      _id: null,
      averageAge: { $avg: "$user.age" },
      minAge: { $min: "$user.age" },
      maxAge: { $max: "$user.age" },
      totalUsers: { $addToSet: "$user_id" }
    }
  },
  {
    $project: {
      _id: 0,
      averageAge: { $round: ["$averageAge", 2] },
      minAge: 1,
      maxAge: 1,
      uniqueUsers: { $size: "$totalUsers" }
    }
  }
])
```

**Résultat** : Retourne l'âge moyen, l'âge minimum, l'âge maximum et le nombre d'utilisateurs uniques ayant regardé des contenus.

---

## 4. Répartition des vues par pays

**Objectif** : Analyser la distribution géographique des visionnages.

```javascript
db.watch_history.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "user_id",
      foreignField: "_id",
      as: "user"
    }
  },
  {
    $unwind: "$user"
  },
  {
    $group: {
      _id: "$user.country",
      totalViews: { $sum: 1 },
      uniqueUsers: { $addToSet: "$user_id" }
    }
  },
  {
    $project: {
      country: "$_id",
      totalViews: 1,
      uniqueUsers: { $size: "$uniqueUsers" },
      averageViewsPerUser: {
        $divide: ["$totalViews", { $size: "$uniqueUsers" }]
      }
    }
  },
  {
    $sort: { totalViews: -1 }
  }
])
```

**Résultat** : Affiche pour chaque pays le nombre total de visionnages, le nombre d'utilisateurs uniques et la moyenne de visionnages par utilisateur, triés par nombre de vues décroissant.

---

## 5. Répartition par type d'appareil

**Objectif** : Comprendre quels appareils sont les plus utilisés pour regarder des contenus.

```javascript
db.watch_history.aggregate([
  {
    $group: {
      _id: "$device",
      totalViews: { $sum: 1 },
      totalWatchTime: { $sum: "$watch_time_minutes" },
      uniqueUsers: { $addToSet: "$user_id" }
    }
  },
  {
    $project: {
      device: "$_id",
      totalViews: 1,
      totalWatchTimeMinutes: "$totalWatchTime",
      totalWatchTimeHours: { $divide: ["$totalWatchTime", 60] },
      uniqueUsers: { $size: "$uniqueUsers" },
      averageWatchTime: {
        $divide: ["$totalWatchTime", "$totalViews"]
      }
    }
  },
  {
    $sort: { totalViews: -1 }
  }
])
```

**Résultat** : Montre pour chaque type d'appareil (TV, mobile, tablette, PC) le nombre de visionnages, le temps total de visionnage, le nombre d'utilisateurs uniques et la durée moyenne par visionnage.

---

## 6. Genres les plus regardés

**Objectif** : Identifier les genres de contenus les plus populaires.

```javascript
db.watch_history.aggregate([
  {
    $lookup: {
      from: "contents",
      localField: "content_id",
      foreignField: "_id",
      as: "content"
    }
  },
  {
    $unwind: "$content"
  },
  {
    $unwind: "$content.genres"
  },
  {
    $group: {
      _id: "$content.genres",
      totalViews: { $sum: 1 },
      totalWatchTime: { $sum: "$watch_time_minutes" },
      uniqueContents: { $addToSet: "$content_id" }
    }
  },
  {
    $project: {
      genre: "$_id",
      totalViews: 1,
      totalWatchTimeHours: { $divide: ["$totalWatchTime", 60] },
      uniqueContents: { $size: "$uniqueContents" }
    }
  },
  {
    $sort: { totalViews: -1 }
  }
])
```

**Résultat** : Liste les genres par ordre de popularité avec le nombre total de visionnages, le temps total de visionnage et le nombre de contenus uniques par genre.

---

## 🎯 Requêtes Bonus

### 7. Visionnages par créneaux horaires

**Objectif** : Analyser à quels moments de la journée les utilisateurs regardent le plus.

```javascript
db.watch_history.aggregate([
  {
    $project: {
      hour: { $hour: "$watch_date" },
      device: 1,
      watch_time_minutes: 1
    }
  },
  {
    $group: {
      _id: "$hour",
      totalViews: { $sum: 1 },
      totalWatchTime: { $sum: "$watch_time_minutes" },
      averageWatchTime: { $avg: "$watch_time_minutes" }
    }
  },
  {
    $project: {
      hour: "$_id",
      hourRange: {
        $concat: [
          { $toString: "$_id" },
          "h-",
          { $toString: { $add: ["$_id", 1] } },
          "h"
        ]
      },
      totalViews: 1,
      totalWatchTimeMinutes: "$totalWatchTime",
      averageWatchTimeMinutes: { $round: ["$averageWatchTime", 2] }
    }
  },
  {
    $sort: { hour: 1 }
  }
])
```

**Résultat** : Affiche la répartition des visionnages par heure de la journée (0h-23h) avec les statistiques de visionnage.

---

### 8. Top 10 utilisateurs les plus actifs par pays

**Objectif** : Identifier les utilisateurs les plus actifs dans chaque pays.

```javascript
db.watch_history.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "user_id",
      foreignField: "_id",
      as: "user"
    }
  },
  {
    $unwind: "$user"
  },
  {
    $group: {
      _id: {
        country: "$user.country",
        userId: "$user_id"
      },
      totalViews: { $sum: 1 },
      totalWatchTime: { $sum: "$watch_time_minutes" },
      email: { $first: "$user.email" },
      age: { $first: "$user.age" }
    }
  },
  {
    $sort: { "_id.country": 1, totalViews: -1 }
  },
  {
    $group: {
      _id: "$_id.country",
      topUsers: {
        $push: {
          email: "$email",
          age: "$age",
          totalViews: "$totalViews",
          totalWatchTimeHours: { $divide: ["$totalWatchTime", 60] }
        }
      }
    }
  },
  {
    $project: {
      country: "$_id",
      topUsers: { $slice: ["$topUsers", 10] }
    }
  }
])
```

**Résultat** : Pour chaque pays, affiche les 10 utilisateurs les plus actifs avec leurs statistiques.

---

### 9. Analyse des contenus par type (film vs série)

**Objectif** : Comparer les statistiques entre films et séries.

```javascript
db.watch_history.aggregate([
  {
    $lookup: {
      from: "contents",
      localField: "content_id",
      foreignField: "_id",
      as: "content"
    }
  },
  {
    $unwind: "$content"
  },
  {
    $group: {
      _id: "$content.type",
      totalViews: { $sum: 1 },
      totalWatchTime: { $sum: "$watch_time_minutes" },
      uniqueContents: { $addToSet: "$content_id" },
      uniqueUsers: { $addToSet: "$user_id" },
      averageWatchTime: { $avg: "$watch_time_minutes" }
    }
  },
  {
    $project: {
      type: "$_id",
      totalViews: 1,
      totalWatchTimeHours: { $divide: ["$totalWatchTime", 60] },
      uniqueContents: { $size: "$uniqueContents" },
      uniqueUsers: { $size: "$uniqueUsers" },
      averageWatchTimeMinutes: { $round: ["$averageWatchTime", 2] },
      averageViewsPerContent: {
        $divide: ["$totalViews", { $size: "$uniqueContents" }]
      }
    }
  }
])
```

**Résultat** : Compare les statistiques globales entre films et séries (nombre de vues, temps total, popularité moyenne).

---

### 10. Visionnages par mois (évolution temporelle)

**Objectif** : Analyser l'évolution des visionnages au fil du temps.

```javascript
db.watch_history.aggregate([
  {
    $project: {
      year: { $year: "$watch_date" },
      month: { $month: "$watch_date" },
      watch_time_minutes: 1
    }
  },
  {
    $group: {
      _id: {
        year: "$year",
        month: "$month"
      },
      totalViews: { $sum: 1 },
      totalWatchTime: { $sum: "$watch_time_minutes" },
      uniqueUsers: { $addToSet: "$user_id" }
    }
  },
  {
    $project: {
      period: {
        $concat: [
          { $toString: "$_id.year" },
          "-",
          { $toString: "$_id.month" }
        ]
      },
      totalViews: 1,
      totalWatchTimeHours: { $divide: ["$totalWatchTime", 60] },
      uniqueUsers: { $size: "$uniqueUsers" }
    }
  },
  {
    $sort: { "_id.year": 1, "_id.month": 1 }
  }
])
```

**Résultat** : Affiche l'évolution mensuelle des visionnages avec le nombre de vues, le temps total et le nombre d'utilisateurs uniques.

---

## 📊 Index recommandés

Pour optimiser les performances de ces requêtes, les index suivants sont créés automatiquement par le script `seed.js` :

```javascript
// Index sur watch_history
db.watch_history.createIndex({ user_id: 1, watch_date: -1 });
db.watch_history.createIndex({ content_id: 1 });
db.watch_history.createIndex({ device: 1 });
db.watch_history.createIndex({ watch_date: 1 });

// Index sur users
db.users.createIndex({ country: 1 });
db.users.createIndex({ email: 1 }, { unique: true });

// Index sur contents
db.contents.createIndex({ genres: 1 });
```

**Justification** :
- Les index sur `user_id` et `content_id` accélèrent les `$lookup` et les regroupements
- L'index sur `watch_date` optimise les requêtes temporelles
- L'index sur `device` améliore les regroupements par appareil
- L'index sur `country` accélère les analyses géographiques
- L'index sur `genres` optimise les requêtes sur les genres

---

## 💡 Notes d'utilisation

1. **Exécution dans MongoDB Shell** : Copiez-collez les requêtes dans `mongosh` ou MongoDB Compass
2. **Base de données** : Assurez-vous d'être connecté à la base `streaming_db`
   ```javascript
   use streaming_db
   ```
3. **Performance** : Les requêtes avec `$lookup` peuvent être lentes sur de grandes collections. Les index créés par `seed.js` améliorent significativement les performances.

