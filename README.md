# NoSQL-TPJ1

Maintenant qu'on connaît mieux MongoDB, on va pouvoir le mettre en application dans un environnement qu'on connaît bien, une app Express !
Le but de cet exercice est de gérer une collection de films. MongoDB sera utilisé pour stocker les données.

**Objectifs**

- Initialiser un projet Express avec MongoDB
- Configurer des routes et contrôleurs
- Gérer des opérations CRUD courantes
- Valider les données avant le stockage en BDD

## Tâches

test

### 1. Initialiser un projet Express + MongoDB

- Mets en place les fichiers de base d'un projet Express (`package.json`, `index.js`, dépendances...).
- Dans un fichier `config/db.js` (par exemple), écris le code permettant de se connecter à une instance MongoDB.
- Crée une base de données MongoDB qui va servir pour ce projet (ex: `mongoflix`)
- Importe les données fournies avec les commandes suivantes :

```sh
# Réalisateurs
mongoimport --db mongoflix --collection directors --file data/directors.bson

# Films
mongoimport --db mongoflix --collection movies --file data/movies.bson

# Critiques
mongoimport --db mongoflix --collection reviews --file data/reviews.bson
```

### 2. CRUD des réalisateurs (directors)

➡️ Mets en place les routes & contrôleurs permettant d'ajouter, récupérer, modifier et supprimer un réalisateur.

> ℹ️ Pense à interroger la base de données pour voir à quoi ressemblent les données des réalisateurs. Pour cela utilise `mongosh` dans le terminal, et fais une requête `find` sur la collection `directors`.

```
POST /directors
GET /directors
GET /directors/:id
PUT /directors/:id
DELETE /directors/:id
```

### 3. CRUD des films (movies)

➡️ Mets en place les routes & contrôleurs permettant d'ajouter, récupérer, modifier et supprimer un film.

> ⚠️ Un film doit être associé à un réalisateur via la propriété `director_id`

```
POST /movies
GET /movies
GET /movies/:id
PUT /movies/:id
DELETE /movies/:id
```

### 4. CRUD des critiques (reviews)

➡️ Mets en place les routes & contrôleurs permettant d'ajouter, récupérer, modifier et supprimer un film.

> ⚠️ Une critique doit être associée à un film via la propriété `movie_id`

```
POST /reviews
GET /reviews
GET /reviews/:id
PUT /reviews/:id
DELETE /reviews/:id
```

### (BONUS) Validation de données avant insertion

➡️ Mets en place une validation de données avant l'insertion des données (contrôleurs des routes `POST` et `PUT`)

> ℹ️ Utilise la librairie `Joi` pour valider les données. Pense à lire la documentation pour orienter tes schémas de validation correctement.
