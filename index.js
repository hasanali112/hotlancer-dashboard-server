const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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

    const domainCollection = client
      .db("hotlancer-dashboard")
      .collection("domains");

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
      const origin = req.headers.origin;

      const isExisted = await domainCollection.findOne({
        domainNameList: origin,
      });
      if (!isExisted) {
        return res.status(400).json({
          success: false,
          message: "you are not allowed to access ",
        });
      }

      const result = await componentCollection.find().toArray();
      res.status(200).json({
        success: true,
        message: "Components fetched successfully",
        result,
      });
    });

    app.delete("/delete-component/:id", async (req, res) => {
      const id = req.params.id;
      await componentCollection.deleteOne({ _id: new ObjectId(id) });
      res.status(200).json({
        success: true,
        message: "Component deleted successfully",
      });
    });

    app.post("/create-domain", async (req, res) => {
      try {
        const domain = req.body;
        const result = await domainCollection.insertOne(domain);
        res.status(200).json({
          success: true,
          message: "Domain created successfully",
          result,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Something went wrong!!",
          error,
        });
      }
    });

    app.get("/domains", async (req, res) => {
      const {
        domain,
        search,
        sortField,
        sortOrder = "asc",
        page = 1,
        limit = 10,
        filterField,
        filterValue,
      } = req.query;
      try {
        // Build the query object for filtering
        const query = {};
        if (domain) {
          query.domain = domain; // Exact match for 'domain'
        }
        if (search) {
          query.$text = { $search: search }; // Text search (requires text index in MongoDB)
        }
        if (filterField && filterValue) {
          query[filterField] = filterValue; // Generic field filtering
        }

        // Determine sorting order
        const sortOptions = {};
        if (sortField) {
          sortOptions[sortField] = sortOrder === "asc" ? 1 : -1;
        }

        // Calculate pagination values
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitValue = parseInt(limit);

        // Fetch the data with query, sorting, and pagination
        const result = await domainCollection
          .find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limitValue)
          .toArray();

        // Fetch total count for pagination metadata
        const totalItems = await domainCollection.countDocuments(query);
        const totalPages = Math.ceil(totalItems / limitValue);

        res.status(200).json({
          success: true,
          message: "Domains fetched successfully",
          data: {
            items: result,
            pagination: {
              totalItems,
              totalPages,
              currentPage: parseInt(page),
              itemsPerPage: limitValue,
            },
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Something went wrong!!",
          error,
        });
      }
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
