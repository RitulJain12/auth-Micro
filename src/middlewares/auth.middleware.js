const userModel=require('../models/user.model');
const jwt=require('jsonwebtoken');
require('dotenv').config();
const redis=require('../db/redis');
async function authMiddleware(req,res,next) {
    try{
    
      const token=req.cookies.token || req.header('authorization').split(" ")[1];
      console.log("Token in middleware:",token); 
    //  console.log(req.headers.authorization);
      if(!token){
        return res.status(401).json({message:"Unauthorized"});
      }
      const isBlocked = await redis.get(`blklist:${token}`);
    
      if (isBlocked) {
        return res.status(401).json({
          message: "Token is blacklisted, login again"
        });
      }
      const decode=jwt.verify(token,process.env.JWT)
      req.user=decode;
          console.log(`req in user ${req.user}`)
       next(); 
    }
    catch(err){
        return res.status(401).json({message:"Unauthorized"});
    }
}

module.exports={authMiddleware};

