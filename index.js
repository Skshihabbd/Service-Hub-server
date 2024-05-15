const express = require("express");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5020;
const cors = require("cors");
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.pppehle.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    
    const userSendData = client.db("ServiceDatabase").collection("Serviceitem");

    const requestedServiceSendData = client
      .db("ServiceDatabase")
      .collection("Requestedtitem");
    app.get("/usersenddata", async (req, res) => {
      const allData = userSendData.find();
      const result = await allData.toArray();
      res.send(result)
    });
    app.get("/adminsenddata", async (req, res) => {
      const allData = userSendData.find();
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
    app.get("/requestsendcollection", async (req, res) => {
     
      let querys={}
      if(req.query?.Usersemail){
        querys={
          Usersemail:req.query.Usersemail}
      }
     
      
      const result = await requestedServiceSendData.find(querys).toArray();
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
          ServiceArea: updatedInfo.ServiceArea,
          
           price: updatedInfo.price,
          
          
          description: updatedInfo.description ,
          ServiceImage: updatedInfo.ServiceImage,
          ServiceName:updatedInfo.ServiceName,
          
           
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

    app.post('/requestsend',async(req,res)=>{
      const datas=req.body 
      console.log(datas) 
      const result = await requestedServiceSendData.insertOne(datas);
      res.send(result);
      
    })

    

    app.delete("/usersenddata/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userSendData.deleteOne(query);
      res.send(result);
    });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("my assignment 11 has been started");
});

app.listen(port, (req, res) => {
  console.log(`my assignment running on this port${port}`);
});
