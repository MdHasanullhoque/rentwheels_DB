
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ===================
// MongoDB URI & Client
// ===================
const uri = process.env.MONGO_URI || "mongodb+srv://rent-wheelsdb:1985!@nodecluster.sjoeqfc.mongodb.net/?appName=NodeCluster";

// Helper function: connect to DB per request
async function getCollections() {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    const db = client.db('Featured');
    return {
        client,
        FeaturedCollection: db.collection('Featured-Cars'),
        bookingsCollection: db.collection('bookings')
    };
}

// ===================
// Routes
// ===================

app.get('/Featured-Cars', async (req, res) => {
    const { client, FeaturedCollection } = await getCollections();
    try {
        const result = await FeaturedCollection.find().toArray();
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: 'Something went wrong' });
    } finally {
        await client.close();
    }
});

app.get('/Featured-Cars/:id', async (req, res) => {
    const { client, FeaturedCollection } = await getCollections();
    try {
        const car = await FeaturedCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!car) return res.status(404).send({ message: "Car not found" });
        res.send(car);
    } catch (err) {
        res.status(500).send({ error: 'Something went wrong' });
    } finally {
        await client.close();
    }
});

app.post("/book-car", async (req, res) => {
    const { client, FeaturedCollection, bookingsCollection } = await getCollections();
    try {
        const { carId, userName, userEmail, carName, rentPerDay } = req.body;
        if (!carId || !userName || !userEmail) return res.status(400).send({ success: false, message: "Missing required fields" });

        const car = await FeaturedCollection.findOne({ _id: new ObjectId(carId) });
        if (!car) return res.status(404).send({ success: false, message: "Car not found" });
        if (car.status === "Unavailable") return res.status(400).send({ success: false, message: "Car already booked" });

        const bookingResult = await bookingsCollection.insertOne({
            carId, carName, rentPerDay, userName, userEmail, bookedAt: new Date()
        });

        await FeaturedCollection.updateOne({ _id: new ObjectId(carId) }, { $set: { status: "Unavailable" } });

        res.send({ success: true, message: "Car booked successfully", booking: bookingResult });
    } catch (err) {
        res.status(500).send({ success: false, message: "Booking failed" });
    } finally {
        await client.close();
    }
});

// Search cars by title
app.get('/search-cars', async (req, res) => {
    const { client, FeaturedCollection } = await getCollections();
    try {
        const title = req.query.title || '';
        const cars = await FeaturedCollection.find({
            title: { $regex: title, $options: 'i' } // case-insensitive search
        }).toArray();

        res.send(cars);
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: 'Failed to search cars' });
    } finally {
        await client.close();
    }
});


// Get bookings by user email
app.get('/my-bookings/:email', async (req, res) => {
    const { client, bookingsCollection } = await getCollections();
    try {
        const email = req.params.email;
        const bookings = await bookingsCollection.find({ userEmail: email }).toArray();
        res.send(bookings);
    } catch (err) {
        res.status(500).send({ success: false, message: "Failed to fetch bookings" });
    } finally {
        await client.close();
    }
});

// Cancel booking
app.delete('/cancel-booking/:id', async (req, res) => {
    const { client, bookingsCollection, FeaturedCollection } = await getCollections();
    try {
        const bookingId = req.params.id;
        const booking = await bookingsCollection.findOne({ _id: new ObjectId(bookingId) });
        if (!booking) return res.status(404).send({ success: false, message: "Booking not found" });

        // Delete booking
        await bookingsCollection.deleteOne({ _id: new ObjectId(bookingId) });

        // Update car status to Available
        await FeaturedCollection.updateOne(
            { _id: new ObjectId(booking.carId) },
            { $set: { status: "Available" } }
        );

        res.send({ success: true, message: "Booking canceled successfully" });
    } catch (err) {
        res.status(500).send({ success: false, message: "Failed to cancel booking" });
    } finally {
        await client.close();
    }
});

// Update Car
app.put('/update-car/:id', async (req, res) => {
    const { client, FeaturedCollection } = await getCollections();
    try {
        const carId = req.params.id;
        const updatedData = req.body;

        const result = await FeaturedCollection.updateOne(
            { _id: new ObjectId(carId) },
            { $set: updatedData }
        );

        if (result.modifiedCount === 1) {
            res.send({ success: true, message: "Car updated successfully" });
        } else {
            res.status(404).send({ success: false, message: "Car not found or no change made" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: "Update failed" });
    } finally {
        await client.close();
    }
});


// My Listings: get cars added by current user
app.get('/my-listings', async (req, res) => {
    const { client, FeaturedCollection } = await getCollections();
    try {
        const email = req.query.email;
        if (!email) return res.status(400).send({ success: false, message: "Email query missing" });

        const cars = await FeaturedCollection.find({ providerEmail: email }).toArray();
        res.send({ success: true, data: cars });
    } catch (err) {
        res.status(500).send({ success: false, message: "Failed to fetch My Listings" });
    } finally {
        await client.close();
    }
});


// Delete car by id
app.delete('/delete-car/:id', async (req, res) => {
    const { client, FeaturedCollection } = await getCollections();
    try {
        const carId = req.params.id;
        const result = await FeaturedCollection.deleteOne({ _id: new ObjectId(carId) });
        if (result.deletedCount === 1) {
            res.send({ success: true, message: "Car deleted successfully" });
        } else {
            res.status(404).send({ success: false, message: "Car not found" });
        }
    } catch (err) {
        res.status(500).send({ success: false, message: "Failed to delete car" });
    } finally {
        await client.close();
    }
});


// Add new car
app.post('/add-car', async (req, res) => {
    const { client, FeaturedCollection } = await getCollections();
    try {
        const car = req.body; // frontend theke asha car object
        if (!car.title || !car.providerEmail) {
            return res.status(400).send({ success: false, message: "Missing required fields" });
        }

        const result = await FeaturedCollection.insertOne({
            ...car,
            status: "Available", // default status
            createdAt: new Date()
        });

        res.send({ success: true, message: "Car added successfully", data: result });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: "Failed to add car" });
    } finally {
        await client.close();
    }
});


// ===================
// Home Route
// ===================
app.get('/', (req, res) => {
    res.send('Hello Server World!');
});

// ===================
// Start Server
// ===================
app.listen(port, () => console.log(`Server running on port ${port}`));
