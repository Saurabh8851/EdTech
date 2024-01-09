 const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate")
const Profile = require("../models/Profile");
require("dotenv").config();



//signUp controller for registering user

exports.signup = async (req, res) => {
    try {
        //data fetch from requiest ki body(Destructure Fields)
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp,
        } = req.body;
        //validate krlo
        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(403).json({
                success: false,
                message: "All fields are required",
            })
        }
        //dono password match krlo
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password and confirm Password Value does not match, please try again',
            });
        }

        //check user already exist or not
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User is already registred. Please sign in to continue',
            });
        }

        //find most recent OTP stored for the email
        //response == recentOtp
        const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
        console.log(recentOtp);
        // validate otp 
        if (recentOtp.length === 0) {
            //OTP not found
            return res.status(400).json({
                success: false,
                message: "OTP is not valid",
            });

        }
        else if (otp !== recentOtp[0].otp) {
            //Invalid OTP
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            })
        }

        //Hash password
        const hashedPassword = await bcrypt.hash(password, 10);


        //Create the user
        let approved = "";
        approved === "Instructor" ? (approved = false) : (approved = true);

        //Create the additional profile for user
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        });
        console.log("Additional Details", profileDetails._id)

        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType: accountType,
            approved: approved,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}${lastName}`,
        })
        //return response
        return res.status(200).json({
            success: true,
            message: "User is registered successfully",
            user,
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "User is not registered Successfully.Please try again"
        })
    }
}


//Login
exports.login = async (req, res) => {
    try {
        //get data from req body
        const { email, password } = req.body;
        //validation data
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: `All fields are required, please try again`,

            });
        }

        //user check exist or not
        const user = await User.findOne({ email }).populate("additionalDetails");
        // console.log("Printing whether user exist or not -> ",user);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User is not Registered, please signup first"
            });
        }
        //generate JWT, after password matching
        if (await bcrypt.compare(password, user.password)) {
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,

            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "24h",
            });

            //save token to user document in database
            user.token = token;
            user.password = undefined;

            //create cookie for token and send response
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: "Logged in successfully"
            })
        }
        else {
            return res.status(401).json({
                success: false,
                message: 'Password is incorrect',
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Login Failure, please try again',
        });
    }

}

//sendOTP for email verification
exports.sendOTP = async (req, res) => {
    try {

        //fetch email from request ki body
        const { email } = req.body;

        //check if user already exist
        const checkUserPresent = await User.findOne({ email });
        // console.log("checkUserPresent in db --> ", checkUserPresent)

        //if user already exist  return the response
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: 'User is Already Register',
            })
        }

        //generate otp
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log("OTP generated ", otp);

        //check unique otp or not -- find in db
        const result = await OTP.findOne({ otp: otp });
        console.log("Result is Generate OTP Function");
        console.log("OTP", otp);
        console.log("Result", result);

        //if otp is available in db then regenerate it
        while (result) {
            otp = otpGenerator(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,

            })
            result = await OTP.findOne({ otp: otp });
        }
        const otpPayload = { email, otp };

        //create an entry in db
        const otpBody = await OTP.create(otpPayload);
        console.log("OTP Body", otpBody);

        //return response successful
        res.status(200).json({
            success: true,
            message: 'OTP Sent successfully',
            otp,
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}


//change password
exports.changePassword = async (req, res) => {
    //get data from req body
    //get old password, new password, confirm password
    // validation

    // update password in db 
    // send mail - password updated
    //return response


    try {
        // Get user data from req.user
        const userDetails = await User.findById(req.user.id);
        // console.log("What is meaning of req --> ", req);
        // console.log("What is meaning of req.user --> ", req.user);
        // console.log("What is meaning of req.user.id --> ", req.user.id);
        // console.log("What is meaning of req.user.id.password --> ", req.user.id.password);

        // Get old password, new password, and confirm new password from req.body
        const { oldPassword, newPassword } = req.body;

        // Validate old password
        const isPasswordMatch = await bcrypt.compare(
            oldPassword,
            userDetails.password
        );
        // console.log("What is meaning of isPasswordMatch --> ", isPasswordMatch);
        if (!isPasswordMatch) {
            // If old password does not match, return a 401 (Unauthorized) error
            return res
                .status(401)
                .json({ success: false, message: "The password is incorrect" });
        }

        

        // Update password
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            { password: encryptedPassword },
            { new: true }
        );

        // Send notification email
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                "Password for your account has been been updated",
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            );
            console.log("Email sent successfully:", emailResponse.response);
        } catch (error) {
            // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
            console.error("Error occurred while sending email:", error);
            return res.status(500).json({
                success: false,
                message: "Error occurred while sending email",
                error: error.message,
            });
        }

        // Return success response
        return res
            .status(200)
            .json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while updating password:", error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while updating password",
            error: error.message,
        });
    }
};