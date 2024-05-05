const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5020;
const cors = require("cors");
app.use(cors());
app.use(express.json());
require("dotenv").config();

// username-assignment-Craft-bd
// userpassword-XpkSadTAcG7n6p2i

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.pppehle.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(process.env.DB_USERNAME);
console.log(process.env.DB_PASSWORD);
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

    const adminSendData = client
      .db("craftDatabase")
      .collection("admincraftitem");
    app.get("/usersenddata", async (req, res) => {
      const allData = userSendData.find();
      const result = await allData.toArray();
      res.send(result)
    });
    app.get("/adminsenddata", async (req, res) => {
      const allData = adminSendData.find();
      const result = await allData.toArray();
      res.send(result)
    });

    app.get("/usersenddata/:id", async (req, res) => {
      const idd = req.params.id;
      const query = { _id: new ObjectId(idd) };
      const result = await userSendData.findOne(query);
      res.send(result);
    });
    app.get("/usersendcollection", async (req, res) => {
      
      let querys={}
      if(req.query?.email){
        querys={
          useremail:req.query.email}
      }
      
      const result = await userSendData.find(querys).toArray();
      res.send(result);
    });

    app.get("/adminsendcollection", async (req, res) => {
      console.log(req.query.category)
      let querys={}
      if(req.query?.category){
        querys={
          categories:req.query.category}
      }
      
      const result = await userSendData.find(querys).toArray();
      res.send(result);
    });


    app.put("/usersenddata/:id", async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id) };
       const option = { upsert: true };
      const updatedInfo = req.body;
      console.log(updatedInfo,id)
      const craftUpdate = { 
        $set: {
          name: updatedInfo.name,
          rating: updatedInfo.rating,
           price: updatedInfo.price,
          processingtime:updatedInfo.processingtime,
          stocks: updatedInfo. stocks,
          details: updatedInfo. details,
          photourl: updatedInfo.photourl,
           categories: updatedInfo. categories,
           customize: updatedInfo. customize,
        },
      };

     
      const result= await userSendData.updateOne(filter,craftUpdate,option)
      res.send(result)
    });


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

    app.delete("/usersenddata/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userSendData.deleteOne(query);
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
