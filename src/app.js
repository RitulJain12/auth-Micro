const express=require('express');
const app=express();
const cookieParser=require('cookie-parser');
const authRouter=require('./routes/authroute')
app.use(express.json());
app.use(cookieParser());

// simple register endpoint for tests


app.use('/auth',authRouter);


module.exports=app;