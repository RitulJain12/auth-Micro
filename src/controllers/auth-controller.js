const userModel=require('../models/user.model');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
//const redis = require('../db/redis');
require('dotenv').config();
const RabitMq=require('../service/broker');
async function registerUSer(req,res) {
    const {username,email,password,fullName:{firstName,lastName},role}=req.body;
    const IsuserAlreadyExits=await userModel.findOne({
        $or:[
            {username},
            {email}
        ]
    })
    if(IsuserAlreadyExits) return res.status(409).json({message:"Username or email already exists"});
    const hash =await bcrypt.hash(password,10);
    const user=await userModel.create({
        username,
        email,
        password:hash,
        fullName:{firstName,lastName},
        role:role||'user'
    })
    const token=jwt.sign({
        id:user._id,
        username:user.username,
        email:user.email,
        role:user.role
    },process.env.JWT,{expiresIn:'1d'});
    res.cookie("token",token,{
        httpOnly:true,
        secure:true,
        maxAge:24*60*60*1000,
    })
    await Promise.all([
        RabitMq.publishToQueue('User_Created_Queue',{
            id:user._id,
            username:user.username,
            email:user.email,
            fullName:user.fullName
        }),
        RabitMq.publishToQueue('AUTH_SELLER_DASHBOARD.USER_CREATED',{
            id:user._id,
            username:user.username,
            email:user.email,
            fullName:user.fullName
        })
    ])
    res.status(201).json({message:"User Registered",user:{
        id:user._id,
        username:user.username,
        email:user.email,
        fullName:user.fullName,
        role:user.role,
        addresses:user.addresses
    }})
}

async function loguser(req, res) {
    try {
        const { username, email, password } = req.body || {};
        if ((!username && !email) || !password) {
            return res.status(400).json({ message: 'Email or username and password are required' });
        }

        // build search criteria based on provided identifier(s)
        const search = [];
        if (email) search.push({ email });
        if (username) search.push({ username });

        // password has select:false in schema so explicitly include it
        const user = await userModel.findOne({ $or: search }).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }, process.env.JWT, { expiresIn: '1d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({ user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            addresses: user.addresses
        }});
    } catch (err) {
        // avoid leaking internals in tests; respond with 500
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}
  
async function getCurrentUser(req,res) {
    
return res.status(200).json({
    message:"Current User fetched successfully",
    user:req.user
});

}

async function logoutCurrentUser(req,res) {
    const token=req.cookies.token;
    if(token){
      //  await redis.set(`blklist:${token}`,'true','EX',24*60*60);
    }
    res.clearCookie('token',{

        httpOnly : true,
        secure : true,
    }
        
    )
    return res.status(200).json({message:"Logged out Successfully"});
}

async function getuserAddresses(req,res) {

    const id=req.user.id;
    const user=await userModel.findById(id).select('addresses');
    if(!user) return res.status(404).json({message:"User not found"});
    return res.status(200).json({
        message:"User addresses fetched Successfully",
        addresses:user.addresses
    })
    
}

async function adduserAddresses(req,res) {

    const id=req.user.id;
   
    const { street, city, state, zip, country } = req.body || {};

   
    if (!street || !city || !country) {
        return res.status(400).json({ message: 'Invalid address data' });
    }

   
    const user = await userModel.findById(id);
    if(!user) return res.status(404).json({message:"User not found"});

    
    user.addresses.push({ street, city, state, zip, country });
    await user.save();

    return res.status(201).json({
        message: "Address added successfully",
        addresses: user.addresses
    })
    
}


async function deleteuserAddresses(req, res) {
    try {
        const id = req.user.id;
        const { addressId } = req.params || {};
        if (!addressId) return res.status(400).json({ message: 'Address id is required' });

        const user = await userModel.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const address = user.addresses.id(addressId);
        if (!address) return res.status(404).json({ message: 'Address not found' });

        address.remove();
        await user.save();

        return res.status(200).json({ message: 'Address deleted successfully', addresses: user.addresses });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports={
    registerUSer,
    loguser,
    getCurrentUser,
    logoutCurrentUser,
    getuserAddresses,
    adduserAddresses,
    deleteuserAddresses
}