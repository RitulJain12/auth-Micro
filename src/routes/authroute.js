const express=require('express');
const Router=express.Router();
const {registerUSerValidations,loginValidations}=require('../middlewares/validator.middleware')
const {registerUSer, loguser,getCurrentUser,logoutCurrentUser,getuserAddresses,adduserAddresses,deleteuserAddresses}=require('../controllers/auth-controller')
const {authMiddleware}=require('../middlewares/auth.middleware')
//POST  /auth/register
Router.post('/register',registerUSerValidations, registerUSer);

//POST  /auth/login
Router.post('/login',loginValidations,loguser)

//get  /auth/me
Router.get('/me',authMiddleware,getCurrentUser)

//get  /auth/logout
Router.get('/logout',logoutCurrentUser)

// also accept POST for logout (tests may POST)
Router.post('/logout',logoutCurrentUser)

//get  /auth/users/me/addresses
Router.get('/users/me/addresses',authMiddleware,getuserAddresses)

//post  /auth/users/me/addresses
Router.post('/users/me/addresses',authMiddleware,adduserAddresses)

//delete /auth/users/me/addresses/:addressId
Router.delete('/users/me/addresses/:addressId',authMiddleware,deleteuserAddresses)

module.exports=Router;
