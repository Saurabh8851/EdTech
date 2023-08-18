//Import the required modules
const express = require("express");
const router = express.Router()

//Importing controllers middleware
const {
    login,
    signup,
    sendOTP,
    changePassword,
} = require("../controllers/Auth")

const {
    resetPasswordToken,
    resetPassword,
} = require("../controllers/ResetPassword")


//Importing middleware
const {auth} = require ("../middlewares/auth")


//Authentication ROUTES

//User login
router.post("/login", login);

//User signUp
router.post("/signup", signup);

//sending otp to user mail
router.post("/sendotp", sendOTP);

//changing the password
router.post("/changePassword", auth, changePassword);


//Generating Reset Password token
router.post("/reset-password-token", resetPasswordToken);

//Resetting Users's password after verfication
router.post("/reset-password", resetPassword);

// Export the router for use in the main application
module.exports = router




