const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/authroute')
const refreshcontroller=require('./controllers/refresh-controller')

// MiddleWares
app.use(express.json());
app.use(cookieParser());

//Routes
app.use('/auth', authRouter);
app.use('/refresh',refreshcontroller);

module.exports = app;  