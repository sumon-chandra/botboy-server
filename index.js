const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();

// ? Middleware
app.use(express.json());
app.use(cors());
require("dotenv").config();

app.get("/", (req, res) => {
  res.send("Botboy is running");
});

// !! MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@sumon.oybrgyl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // ??? Database connection
    const toysCollection = client.db("toysDB").collection("toys");

    // GET /toys
    app.get("/toys", async (req, res) => {
      const toys = await toysCollection.find().toArray();
      res.send(toys);
    })

    // Get toys by category
    app.get("/toys-category", async (req, res) => {
      let query = {}
      req.query?.category && (query = { category: req.query.category })
      const result = await toysCollection.find(query).toArray()
      res.send(result)
    })

    // Get Toys by discount
    app.get('/toys/discount', async (req, res) => {
      const toys = await toysCollection.find({ "discount": { $exists: true } }).toArray()
      res.send(toys)
    })

    // Get Toys only for customers
    // Define the range of documents you want to retrieve
    const start_index = 8;
    const end_index = 15;
    app.get("/toys/only-for-you", async (req, res) => {
      const toys = await toysCollection.find().skip(start_index).limit(end_index - start_index + 1).toArray()
      res.send(toys)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port);
