
const express = require('express'); // Express framework
const cors = require('cors'); // CORS middleware
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); // MongoDB client

// ===================
// App initialization
// ===================
const app = express();
const port = 3000;

// ===================
// Middleware
// ===================
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON body

// ===================
// MongoDB Connection URI
// ===================
const uri = "mongodb+srv://rent-wheelsdb:1985!@nodecluster.sjoeqfc.mongodb.net/?appName=NodeCluster";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// ===================
// Global variables for collections
// ===================
let FeaturedCollection; // For cars
let bookingsCollection; // For bookings

// ===================
// Connect to MongoDB
// ===================
async function run() {
    try {
        await client.connect(); // Connect to MongoDB
        console.log("MongoDB Connected Successfully!");

        // Assign collections
        const db = client.db('Featured');
        FeaturedCollection = db.collection('Featured-Cars'); // Existing cars collection
        bookingsCollection = db.collection('bookings'); // Booking collection (new)

        console.log("Collections are ready!");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}
run();

// ===================
// Routes
// ===================

// Get all cars
app.get('/Featured-Cars', async (req, res) => {
    try {
        const result = await FeaturedCollection.find().toArray();
        res.send(result);
    } catch (err) {
        console.error("Get cars error:", err);
        res.status(500).send({ error: 'Something went wrong' });
    }
});

//  Get single car by id
app.get('/Featured-Cars/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const car = await FeaturedCollection.findOne({ _id: new ObjectId(id) });

        if (!car) return res.status(404).send({ message: "Car not found" });

        res.send(car);
    } catch (err) {
        console.error("Get single car error:", err);
        res.status(500).send({ error: 'Something went wrong' });
    }
});

// Book a car


app.post("/book-car", async (req, res) => {
    try {
        const { carId, userName, userEmail, carName, rentPerDay } = req.body;

        if (!carId || !userName || !userEmail) {
            return res.status(400).send({ success: false, message: "Missing required fields" });
        }

        const car = await FeaturedCollection.findOne({ _id: new ObjectId(carId) });
        if (!car) return res.status(404).send({ success: false, message: "Car not found" });
        if (car.status === "Unavailable") {
            return res.status(400).send({ success: false, message: "Car already booked" });
        }

        const bookingResult = await bookingsCollection.insertOne({
            carId,
            carName,
            rentPerDay,
            userName,
            userEmail,
            bookedAt: new Date()
        });

        await FeaturedCollection.updateOne(
            { _id: new ObjectId(carId) },
            { $set: { status: "Unavailable" } }
        );

        res.send({ success: true, message: "Car booked successfully", booking: bookingResult });
    } catch (err) {
        console.error("Booking error:", err);
        res.status(500).send({ success: false, message: "Booking failed" });
    }
});



// add car 
app.post("/add-car", async (req, res) => {
    try {
        const car = req.body;

        // Default status
        car.status = "Available";
        car.createdAt = new Date();

        // INSERT into Featured-Cars collection
        const result = await FeaturedCollection.insertOne(car);

        res.send({ success: true, message: "Car added successfully", data: result });
    } catch (error) {
        console.error("Add Car Error:", error);
        res.status(500).send({ success: false, message: "Failed to add car" });
    }
});




// =====================
// Get cars added by logged-in provider
// =====================
app.get("/my-listings", async (req, res) => {
    try {
        const email = req.query.email;

        if (!email) {
            return res.status(400).send({ success: false, message: "Email is required" });
        }

        const cars = await FeaturedCollection.find({ providerEmail: email }).toArray();
        res.send({ success: true, data: cars });

    } catch (err) {
        console.error("My Listings Error:", err);
        res.status(500).send({ success: false, message: "Failed to load listings" });
    }
});






//  Home route
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// ===================
// Start server
// ===================
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
