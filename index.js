const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();

// ? Middleware
app.use(express.json());
const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
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
    const myToysCollection = client.db("toysDB").collection("myToys");

    // GET /toys
    app.get("/total-toys", async (req, res) => {
      const result = await toysCollection.estimatedDocumentCount();
      res.send({ totalToys: result });
    });
    app.get("/toys", async (req, res) => {
      const sort = req.query.sorting === 'descending' ? -1 : 1;
      const toys = await toysCollection.find().sort({ quantity: sort }).limit(20).toArray();
      res.send(toys);
    })

    // Get single Toy 
    app.get("/toys/:id", async (req, res) => {
      const result = await toysCollection.findOne({ _id: new ObjectId(req.params.id) });
      res.send(result);
    })

    // Get toys by category
    app.get("/toys-category", async (req, res) => {
      let query = {}
      req.query?.category && (query = { category: req.query.category })
      const result = await toysCollection.find(query).toArray()
      res.send(result)
    })

    // Get Toys by discount
    app.get('/discount', async (req, res) => {
      const toys = await toysCollection.find({ "discount": { $exists: true } }).toArray()
      res.send(toys)
    })

    // Get Toys only for customers
    // Define the range of documents you want to retrieve
    const start_index = 8;
    const end_index = 15;
    app.get("/only-for-you", async (req, res) => {
      const toys = await toysCollection.find().skip(start_index).limit(end_index - start_index + 1).toArray()
      res.send(toys)
    })

    // Post request for new toy
    app.post("/my-toys", async (req, res) => {
      const result = await myToysCollection.insertOne(req.body);
      res.send(result);
    })

    app.get("/my-toys", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { seller_email: req.query.email }
      }
      console.log(query);
      const results = await myToysCollection.find(query).toArray()
      res.send(results);
    })
    app.get("/my-toys/:id", async (req, res) => {
      const result = await myToysCollection.findOne({ _id: new ObjectId(req.params.id) });
      res.send(result);
    })
    app.delete("/my-toys/:id", async (req, res) => {
      const result = await myToysCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      res.send(result);
    })
    app.patch("/my-toys/:id", async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) }
      const updatedToy = {
        $set: {
          price: req.body?.price,
          discount: req.body?.discount,
          category: req.body?.category,
          quantity: req.body?.quantity
        }
      }
      const options = { upsert: true };
      const result = await myToysCollection.updateOne(filter, updatedToy, options);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port);
