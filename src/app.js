const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/authroute')
const refreshcontroller=require('./controllers/refresh-controller')
const recommendRouter=require('./routes/recoomend.route');

app.use(express.json());
app.use(cookieParser());


console.log("Auth service loaded");


app.use('/auth', authRouter);
app.use('/refresh',refreshcontroller);

module.exports = app;  