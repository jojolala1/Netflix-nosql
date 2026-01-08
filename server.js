const express = require('express')
const mongoClient = require('mongodb').MongoClient
const cors = require('cors')

const url = 'mongodb://root:rootpass@mongo:27017/?authSource=admin'
const dbName = 'streaming_db';

const app = express();
app.use(cors());
app.use(express.json());

let myNetflixDb = null;

async function startServer() {
    try {
        const clientMongo = new mongoClient(url);
        await clientMongo.connect();
        myNetflixDb = clientMongo.db(dbName);
        console.log('✅ Connecté à MongoDB');
        
        app.listen(3000, () => {
            console.log(' Server is running on port 3000');
        });
    } catch (error) {
        console.error(' Erreur de connexion MongoDB:', error);
        // En cas d'erreur, réessayer avec localhost (pour développement local)
        try {
            const localUrl = 'mongodb://root:rootpass@localhost:27017/?authSource=admin';
            const localClient = new mongoClient(localUrl);
            await localClient.connect();
            myNetflixDb = localClient.db(dbName);
            console.log(' Connecté à MongoDB (localhost)');
            
            app.listen(3000, () => {
                console.log(' Server is running on port 3000');
            });
        } catch (localError) {
            console.error(' Erreur de connexion:', localError);
        }
    }
}

// Route de santé
app.get('/health', (req, res) => {
    res.json({ status: 'ok', database: dbName });
});

// Statistiques générales
app.get('/api/stats', async (req, res) => {
    try {
        const usersCount = await myNetflixDb.collection('users').countDocuments();
        const contentsCount = await myNetflixDb.collection('contents').countDocuments();
        const watchHistoryCount = await myNetflixDb.collection('watch_history').countDocuments();
        
        res.json({
            users: usersCount,
            contents: contentsCount,
            watchHistory: watchHistoryCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Top 5 des contenus les plus regardés
app.get('/api/top-contents', async (req, res) => {
    try {
        const result = await myNetflixDb.collection('watch_history').aggregate([
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
                    genres: "$content.genres",
                    totalViews: 1
                }
            }
        ]).toArray();
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Temps total de visionnage par utilisateur (top 10)
app.get('/api/top-users', async (req, res) => {
    try {
        const result = await myNetflixDb.collection('watch_history').aggregate([
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
                    country: "$user.country",
                    age: "$user.age",
                    totalWatchTimeMinutes: "$totalWatchTime",
                    totalWatchTimeHours: { $divide: ["$totalWatchTime", 60] }
                }
            }
        ]).toArray();
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Moyenne d'âge des spectateurs
app.get('/api/average-age', async (req, res) => {
    try {
        const result = await myNetflixDb.collection('watch_history').aggregate([
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
        ]).toArray();
        
        res.json(result[0] || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Répartition des vues par pays
app.get('/api/views-by-country', async (req, res) => {
    try {
        const result = await myNetflixDb.collection('watch_history').aggregate([
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
        ]).toArray();
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Répartition par type d'appareil
app.get('/api/views-by-device', async (req, res) => {
    try {
        const result = await myNetflixDb.collection('watch_history').aggregate([
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
        ]).toArray();
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Genres les plus regardés
app.get('/api/top-genres', async (req, res) => {
    try {
        const result = await myNetflixDb.collection('watch_history').aggregate([
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
        ]).toArray();
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Visionnages par créneaux horaires
app.get('/api/views-by-hour', async (req, res) => {
    try {
        const result = await myNetflixDb.collection('watch_history').aggregate([
            {
                $project: {
                    hour: { $hour: "$watch_date" },
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
        ]).toArray();
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

startServer().catch(err => console.error('startServer error:', err));