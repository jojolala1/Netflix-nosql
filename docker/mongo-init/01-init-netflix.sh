#!/bin/bash
set -e

echo "=== Import des données dans la base netflix à partir de /dump ==="

# Import des réalisateurs
mongoimport \
  --username "$MONGO_INITDB_ROOT_USERNAME" \
  --password "$MONGO_INITDB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --db netflix \
  --collection directors \
  --file /dump/directors.bson \
  --type json

# Import des films
mongoimport \
  --username "$MONGO_INITDB_ROOT_USERNAME" \
  --password "$MONGO_INITDB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --db netflix \
  --collection movies \
  --file /dump/movies.bson \
  --type json

# Import des critiques
mongoimport \
  --username "$MONGO_INITDB_ROOT_USERNAME" \
  --password "$MONGO_INITDB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --db netflix \
  --collection reviews \
  --file /dump/reviews.bson \
  --type json

echo "=== Import terminé ==="

echo "=== Initialisation Mongo terminée ==="