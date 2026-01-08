const { MongoClient } = require('mongodb');
const { faker } = require('@faker-js/faker');

// Configuration de connexion MongoDB
const MONGO_URL = 'mongodb://root:rootpass@localhost:27017/?authSource=admin';
const DB_NAME = 'streaming_db';

// Configuration des volumes
const NUM_USERS = 1500; // Entre 500 et 2000
const NUM_CONTENTS = 600; // Entre 200 et 1000
const NUM_WATCH_HISTORY = 55000; // Au moins 50000

// Données de référence
const COUNTRIES = ['France', 'Belgique', 'Suisse', 'Canada', 'Espagne', 'Italie', 'Allemagne', 'Royaume-Uni', 'États-Unis', 'Brésil', 'Japon', 'Corée du Sud'];
const DEVICES = ['tv', 'mobile', 'tablette', 'pc'];
const GENRES = ['Action', 'Comédie', 'Drame', 'Thriller', 'Horreur', 'Science-Fiction', 'Fantasy', 'Romance', 'Documentaire', 'Animation', 'Aventure', 'Crime'];
const CONTENT_TYPES = ['film', 'série'];

async function generateUsers(db) {
    console.log('Génération des utilisateurs..');
    const usersCollection = db.collection('users');
    const users = [];
    
    for (let i = 0; i < NUM_USERS; i++) {
        const createdAt = faker.date.past({ years: 3 });
        users.push({
            email: faker.internet.email(),
            age: faker.number.int({ min: 18, max: 80 }),
            country: faker.helpers.arrayElement(COUNTRIES),
            created_at: createdAt
        });
    }
    
    // Insertion par lots pour de meilleures performances
    const batchSize = 500;
    for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const result = await usersCollection.insertMany(batch);
    }
    
    console.log(` ${NUM_USERS} utilisateurs créés`);
    // Retourner les IDs depuis la base de données
    const insertedUsers = await usersCollection.find({}).toArray();
    return insertedUsers.map(u => u._id);
}

async function generateContents(db) {
    console.log(' Génération des contenus..');
    const contentsCollection = db.collection('contents');
    const contents = [];
    
    for (let i = 0; i < NUM_CONTENTS; i++) {
        const type = faker.helpers.arrayElement(CONTENT_TYPES);
        const numGenres = faker.number.int({ min: 1, max: 3 });
        const genres = faker.helpers.arrayElements(GENRES, numGenres);
        
        // Durée différente selon le type
        const duration = type === 'film' 
            ? faker.number.int({ min: 60, max: 180 }) 
            : faker.number.int({ min: 20, max: 60 });
        
        contents.push({
            title: type === 'film' 
                ? faker.lorem.words({ min: 2, max: 4 }) + ' - Le Film'
                : faker.lorem.words({ min: 2, max: 4 }) + ' - La Série',
            type: type,
            genres: genres,
            duration_minutes: duration
        });
    }
    
    // Insertion par lots
    const batchSize = 500;
    for (let i = 0; i < contents.length; i += batchSize) {
        const batch = contents.slice(i, i + batchSize);
        await contentsCollection.insertMany(batch);
    }
    
    console.log(`${NUM_CONTENTS} contenus créés`);
    // Retourner les IDs depuis la base de données
    const insertedContents = await contentsCollection.find({}).toArray();
    return insertedContents.map(c => c._id);
}

async function generateWatchHistory(db, userIds, contentIds) {
    console.log('Génération de l\'historique de visionnage...');
    const watchHistoryCollection = db.collection('watch_history');
    
    // Créer une distribution réaliste : certains contenus plus populaires
    const popularContentIds = contentIds.slice(0, Math.floor(contentIds.length * 0.2)); // Top 20% des contenus
    
    const watchHistory = [];
    const batchSize = 1000;
    
    for (let i = 0; i < NUM_WATCH_HISTORY; i++) {
        // 70% de chance de regarder un contenu populaire
        const isPopular = Math.random() < 0.7;
        const contentId = isPopular 
            ? faker.helpers.arrayElement(popularContentIds)
            : faker.helpers.arrayElement(contentIds);
        
        const userId = faker.helpers.arrayElement(userIds);
        const watchDate = faker.date.between({ 
            from: new Date('2023-01-01'), 
            to: new Date() 
        });
        
        // Durée de visionnage réaliste (entre 10% et 100% du contenu)
        const watchTimeMinutes = faker.number.int({ min: 5, max: 120 });
        
        watchHistory.push({
            user_id: userId,
            content_id: contentId,
            watch_date: watchDate,
            watch_time_minutes: watchTimeMinutes,
            device: faker.helpers.arrayElement(DEVICES)
        });
        
        // Insertion par lots pour optimiser les performances
        if (watchHistory.length >= batchSize) {
            await watchHistoryCollection.insertMany(watchHistory);
            watchHistory.length = 0; // Vider le tableau
            process.stdout.write(`\r ${i + 1}/${NUM_WATCH_HISTORY} historiques créés...`);
        }
    }
    
    // Insérer les derniers éléments
    if (watchHistory.length > 0) {
        await watchHistoryCollection.insertMany(watchHistory);
    }
    
    console.log(`\n${NUM_WATCH_HISTORY} historiques de visionnage créés`);
}

async function createIndexes(db) {
    console.log('Création des index...');
    const watchHistoryCollection = db.collection('watch_history');
    
    // Index pour améliorer les performances des requêtes
    await watchHistoryCollection.createIndex({ user_id: 1, watch_date: -1 });
    await watchHistoryCollection.createIndex({ content_id: 1 });
    await watchHistoryCollection.createIndex({ device: 1 });
    await watchHistoryCollection.createIndex({ watch_date: 1 });
    
    const usersCollection = db.collection('users');
    await usersCollection.createIndex({ country: 1 });
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    
    const contentsCollection = db.collection('contents');
    await contentsCollection.createIndex({ genres: 1 });
    
    console.log('Index créés');
}

async function main() {
    const client = new MongoClient(MONGO_URL);
    
    try {
        console.log('🔌 Connexion à MongoDB...');
        await client.connect();
        console.log('Connecté à MongoDB');
        
        const db = client.db(DB_NAME);
        
        // Nettoyer les collections existantes (optionnel)
        console.log('Nettoyage des collections existantes...');
        await db.collection('users').deleteMany({});
        await db.collection('contents').deleteMany({});
        await db.collection('watch_history').deleteMany({});
        console.log('Collections nettoyées');
        
        // Générer les données
        const userIds = await generateUsers(db);
        const contentIds = await generateContents(db);
        
        await generateWatchHistory(db, userIds, contentIds);
        
        // Créer les index
        await createIndexes(db);
        
        // Afficher les statistiques finales
        console.log('\n Statistiques finales:');
        const userCount = await db.collection('users').countDocuments();
        const contentCount = await db.collection('contents').countDocuments();
        const watchHistoryCount = await db.collection('watch_history').countDocuments();
        
        console.log(`    Utilisateurs: ${userCount}`);
        console.log(`    Contenus: ${contentCount}`);
        console.log(`    Historiques de visionnage: ${watchHistoryCount}`);
        console.log('\n Génération terminée avec succès!');
        
    } catch (error) {
        console.error(' Erreur:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log(' Connexion fermée');
    }
}

main();

