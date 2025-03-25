const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.4gey7ap.mongodb.net/?appName=Cluster1`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const componentCollection = client
      .db("hotlancer-dashboard")
      .collection("components");

    // Create a new component
    app.post("/create-component", async (req, res) => {
      const component = req.body;
      const result = await componentCollection.insertOne(component);
      res.status(200).json({
        success: true,
        message: "Component created successfully",
        result,
      });
    });

    app.get("/components", async (req, res) => {
      const result = await componentCollection.find().toArray();
      res.status(200).json({
        success: true,
        message: "Components fetched successfully",
        result,
      });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Hotlancer Dashboard Server is up and running",
  });
});

app.listen(process.env.PORT, () => {
  console.log(
    `Hotlancer Dashboard Server app listening on port ${process.env.PORT}`
  );
});
