const express =require('express')
const app=express() 
const port=process.env.PORT || 5020;
const cors=require('cors')
app.use(cors())
app.use(express()) 
require('dotenv').config()


// user name and password
// username-assignment-10
// password-CxJKNU7F4gvuN0Yt
// user name and password


const { MongoClient, ServerApiVersion } = require('mongodb');
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
    console.log("Pinged your deployment. You successfully connected to MongoDB!");


    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


 app.get('/',(req,res)=>{
    res.send('my assignment 10 has been started')
}) 

app.listen(port,(req,res)=>{
console.log(`my assignment running on this port${port}`)

})

