const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt =require('jsonwebtoken');
const  cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app=express()
const port =process.env.PORT || 5000
 app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
 }))
 app.use(express.json())
 app.use(cookieParser())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2z2tafq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();
    // jobs releted api
    const jobCollection=client.db('jobportal').collection('jobs')
    const jobApplicationCollection=client.db('jobportal').collection('job-applications')

    // auth related api
    app.post('/jwt', async(req, res)=>{
      const user=req.body;
      const token=jwt.sign(user, process.env.JWT_SECRET, {expiresIn:'1h'})
      res
      .cookie('token', token, {
        httpOnly:true,
        secure:false,
      })
      .send({success:true})

    })
    // job related api
    app.get('/jobs', async(req, res)=>{
      const email =req.query.email
      let query={}
      if(email){
        query={hr_email: email}
      }
      const cursor=jobCollection.find(query)
      const result= await cursor.toArray()
      res.send(result)
    })
    app.get('/jobs/:id', async(req,res)=>{
      const id=req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await jobCollection.findOne(query)
      res.send(result)
    })
    app.post('/jobs', async(req,res)=>{
      const newJob=req.body;
      const result = await jobCollection.insertOne(newJob)
      res.send(result)
    })


    // job application apis 

    app.get('/job-application', async(req, res )=>{
      const eamil=req.query.email
      const query={applicante_email: eamil}
      console.log('cookies', req.cookies)
      const result= await jobApplicationCollection.find(query).toArray()
       for(const application of result ){
        // console.log(application.job_id)
        const query1={_id: new ObjectId(application.job_id)}
        const job= await jobCollection.findOne(query1)
        if(job){
          application.title=job.title;
          application.company=job.company;
          application.company_logo=job.company_logo;
          application.location=job.location;
        }
      }
      res.send(result)
     
    })

    app.get('/job-applications/jobs/:job_id',async(req, res)=>{
      const jobId =req.params.job_id
      const query= {job_id: jobId}
      const result = await jobApplicationCollection.find(query).toArray()
      res.send(result)
    })
    app.post('/job-applications', async (req, res)=>{
      const application=req.body 
      const result = await jobApplicationCollection.insertOne(application)
      res.send(result)  
    })
      app.delete(('/job-applications/:id'), async(req, res)=>{
        const id=req.params.id
        const query ={_id: new ObjectId(id)}
        const result =await jobApplicationCollection.deleteOne(query)
        res.send(result)
      })

      app.patch('/job-applications/:id', async(req, res)=>{
        const id=req.params.id
        const data=req.body
        const filter={_id: new ObjectId(id)}
        const updatedDoc={
          $set:{
            status: data.status
          }
        }
        const result= await jobApplicationCollection.updateOne(filter, updatedDoc)
        res.send(result)
      })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', async(req, res)=>{
    res.send('job portal is runing')
})
app.listen(port ,()=>{
    console.log(`job is runing ${port}`)
})