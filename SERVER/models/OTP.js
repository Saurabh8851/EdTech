const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 60 * 5,//// The document will be automatically deleted after 5 minutes of its creation time
    },


});
//Schema k baad and model se pehle yeh code likhna hai
//we write this code in otp model section because it is a pre middleware and pre middleware code is written in model section with given model
//function --> to send otp email
async function sendVerificationEmail(email, otp) {
    // Create a transporter to send emails

    // Define the email options

    // Send the email
    try {
        const mailResponse = await mailSender(
            email,
            "Verification mail for login by LEARN4CODE-> ",
            emailTemplate(otp)
        );
        console.log("Email Send successfully ", mailResponse.response);
    }
    catch (error) {
        console.log("Error occured while sending mails in models folder in otp.js -> :", error)
        throw error;
    }
}

// Define a post-save hook to send email after the document has been saved
//Document save hone se just pehaleyeh wala code run hona chaiye
OTPSchema.pre("save", async function (next) {
    console.log("New document saved to database");

    // Only send an email when a new document is created
    if (this.isNew) {
        await sendVerificationEmail(this.email, this.otp);
    }
    next();
})

const OTP = mongoose.model("OTP", OTPSchema);
module.exports = OTP;