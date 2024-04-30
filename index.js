const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5020;
const cors = require("cors");
app.use(cors());
app.use(express.json());
require("dotenv").config();

// username-assignment-Craft-bd
// userpassword-XpkSadTAcG7n6p2i

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.pppehle.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(process.env.DB_USERNAME)
console.log(process.env.DB_PASSWORD)
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
    await client.connect();
    //  Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    const userSendData = client.db("craftDatabase").collection("craftitem");

    const adminSendData = client.db("admincraftDatabase").collection("admincraftitem");

    app.post("/usersenddata", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await userSendData.insertOne(data);
      res.send(result);
    });

    app.post("/adminsenddata", async (req, res) => {
      const data = req.body;
      console.log({ data });
      const result = await adminSendData.insertOne(data);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("my assignment 10 has been started");
});

app.listen(port, (req, res) => {
  console.log(`my assignment running on this port${port}`);
});
