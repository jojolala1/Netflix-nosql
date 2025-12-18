const express = require('express')
const mongoClient = require('mongodb').MongoClient

const url  = 'mongodb://root:example@127.0.0.1:27017/?authSource=admin'

const dbName = 'netflix-db';

const app = express();

let myNetflixDb = null;

async function startServer() {
    const clientMongo = new mongoClient(url);
    await clientMongo.connect();
    myNetflixDb = clientMongo.db(dbName);
    app.listen(3000, ()=> {
        console.log('Server is running on port 3000');
    })
}

app.get('/movies', async (requestAnimationFrame, res) => {
    try {
        const filmsArray = await myNetflixDb.collection('movies').find({}).toArray();
        res.json(filmsArray);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})