const app=require('./src/app');
const ConnectDb=require('./src/db/db');
const RabitMq=require('./src/service/broker');
require('dotenv').config();
RabitMq.connect();
ConnectDb();

app.listen(process.env.PORT,async ()=>{
    console.log("Server Is Running on Port 3000");
}) 