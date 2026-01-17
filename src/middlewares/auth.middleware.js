const userModel=require('../models/user.model');
const jwt=require('jsonwebtoken');
require('dotenv').config();

async function authMiddleware(req,res,next) {
    try{
      const token=req.cookies.token;
      if(!token){
        return res.status(401).json({message:"Unauthorized"});
      }
      const decode=jwt.verify(token,process.env.JWT)
      req.user=decode;

       next();
    }
    catch(err){
        return res.status(401).json({message:"Unauthorized"});
    }
}

module.exports={authMiddleware};