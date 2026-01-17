const {body,validationResult} =require('express-validator');


const respondWithValidation=(req,res,next)=>{
const errors=validationResult(req);
if(!errors.isEmpty()){
    return res.status(400).json({errors:errors.array()});
}
next();
}

 

const registerUSerValidations=[
    body("username").isString()
    .withMessage("USername Must be String")
    .isLength({min:3})
    .withMessage("Username must be at least 3 characters long"),
    body("email").isEmail()
    .withMessage("Invalid Email"),
    body("password").isLength({min:6})
    .withMessage("password must be at least 6 characters long"),
    body("fullName.firstName").isString()
    .notEmpty()
    .withMessage("Name must be String"),
    body("fullName.lastName").isString()
    .notEmpty()
    .withMessage("last name is required"),
    body("role").isString()
    .withMessage("Please use proper role")
    .isIn(["user", "seller"])
    .withMessage("role can be user or seller"),
    respondWithValidation
]

const loginValidations=[
    // Accept either email or username for login
    body().custom((_, { req }) => {
        const { email, username } = req.body || {};
        if (!email && !username) {
            throw new Error('Either email or username is required');
        }
        if (email) {
            const validator = require('validator');
            if (!validator.isEmail(String(email))) {
                throw new Error('Invalid Email');
            }
        }
        if (username) {
            if (typeof username !== 'string' || username.trim().length < 3) {
                throw new Error('Username must be at least 3 characters long');
            }
        }
        return true;
    }),
    body("password").exists().withMessage("Password is required")
    .isLength({min:6})
    .withMessage("password must be at least 6 characters long"),
    respondWithValidation
]

module.exports={
    registerUSerValidations ,
    loginValidations
}