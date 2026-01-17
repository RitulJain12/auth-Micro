const mongoose=require('mongoose');
require('dotenv').config();
async function ConnectDb() {
    try{
   await mongoose.connect(process.env.MONGO_URL);
   console.log("database IS connected");
    }
    catch(err){
        console.log(`DataBase error:${err}`);
    }
}

module.exports=ConnectDb