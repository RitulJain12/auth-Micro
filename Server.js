const app=require('./src/app');
const ConnectDb=require('./src/db/db');
const RabitMq=require('./src/service/broker');
require('dotenv').config();
RabitMq.connect();
ConnectDb();
const client=require('./src/db/redis');
client.connect().then(()=>console.log("Reddis is Connected"))
.catch((err)=>{
  console.error(`Reddis Error ${err}`);
})
app.listen(process.env.PORT,async ()=>{
 
    console.log("Server Is Running on Port 3000");
})  