// const express = require('express')
// const cors = require("cors");
// const { MongoClient, ServerApiVersion } = require('mongodb');
// const app = express()
// const port = 3000
// app.use(cors())
// app.use(express.json())

// // app.use(cors({
// //     origin: ['http://localhost:5173']
// // }))




// const uri = "mongodb+srv://rent-wheelsdb:1985!@nodecluster.sjoeqfc.mongodb.net/?appName=NodeCluster";

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//     serverApi: {
//         version: ServerApiVersion.v1,
//         strict: true,
//         deprecationErrors: true,
//     }
// });

// async function run() {
//     try {
//         // Connect the client to the server	(optional starting in v4.7)
//         await client.connect();


//         const db = client.db('Featured')
//         const FeaturedCollection = db.collection('Featured-Cars')

//         //find
//         app.get('/Featured-Cars', async (req, res) => {


//             const result = await FeaturedCollection.find().toArray()


//             console.log(result)

//             res.send('Featured')
//         })


















//         // Send a ping to confirm a successful connection
//         await client.db("admin").command({ ping: 1 });
//         console.log("Pinged your deployment. You successfully connected to MongoDB!");
//     } finally {
//         // Ensures that the client will close when you finish/error
//         await client.close();
//     }
// }
// run().catch(console.dir);





// app.get('/', (req, res) => {
//     res.send('Hello World im coming!')
// })

// app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`)
// })


const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://rent-wheelsdb:1985!@nodecluster.sjoeqfc.mongodb.net/?appName=NodeCluster";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Connect DB at server start
async function run() {
    try {
        await client.connect();
        console.log("MongoDB Connected Successfully!");
    } catch (err) {
        console.error(err);
    }
}
run();

const db = client.db('Featured');
const FeaturedCollection = db.collection('Featured-Cars');

app.get('/Featured-Cars', async (req, res) => {
    try {
        const result = await FeaturedCollection.find().toArray();
        res.send(result);

        
    } catch (err) {
        res.status(500).send({ error: 'Something went wrong' });
    }
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
