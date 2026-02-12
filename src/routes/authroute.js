const express = require('express');
const Router = express.Router();
const { registerUSerValidations, loginValidations } = require('../middlewares/validator.middleware')
const authController = require('../controllers/auth-controller')
const { authMiddleware } = require('../middlewares/auth.middleware')



//POST  /auth/register
Router.post('/register', registerUSerValidations, authController.registerUSer);

//POST  /auth/login
Router.post('/login', loginValidations,authController.loguser)

//get  /auth/me
Router.get('/me', authMiddleware, authController.getCurrentUser)

//get  /auth/logout
Router.get('/logout', authController.logoutCurrentUser)

// also accept POST for logout (tests may POST)
Router.post('/logout', authController.logoutCurrentUser)

//get  /auth/users/me/addresses
Router.get('/users/me/addresses', authMiddleware, authController.getuserAddresses)

//post  /auth/users/me/addresses
Router.post('/users/me/addresses', authMiddleware, authController.adduserAddresses)

//put /auth/users/me/addresses/:addressId
Router.put('/users/me/addresses/:addressId', authMiddleware, authController.updateuserAddress)

//delete /auth/users/me/addresses/:addressId
Router.delete('/users/me/addresses/:addressId', authMiddleware, authController.deleteuserAddresses)

//post /auth/users/me/premium
Router.post('/users/me/premium', authMiddleware, authController.upgradeToPremium)

// internal route for payment service
Router.post('/internal/upgrade', authController.upgradeToPremium)

//get /auth/users/me/premium
Router.get('/users/me/premium', authMiddleware, authController.checkPremium)






module.exports = Router;  
