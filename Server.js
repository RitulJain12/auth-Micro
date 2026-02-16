require('dotenv').config();
const app=require('./src/app');
const ConnectDb=require('./src/db/db');
const RabitMq=require('./src/service/broker');
const client=require('./src/db/redis');



RabitMq.connect();

ConnectDb();

client.connect().then(()=>console.log("Reddis is Connected"))
.catch((err)=>{
  console.error(`Reddis Error ${err}`);
})



//Service Up Checking Point
app.get('/health', (req,res) =>{ return res.status(200).json({message:"AuthService is Up"})})


app.listen(process.env.PORT,async ()=>{
    console.log(`AuthServer Is Running on Port ${process.env.PORT}`);
})  