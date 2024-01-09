const nodemailer = require("nodemailer");
require("dotenv").config();

const mailSender = async (email, title, body) => {
    try {

        //Step1-> Create a node mailer transporter
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
            secure: false,
        })

        //Step2--> Send Mail
        let info = await transporter.sendMail({
            from: 'LEARN4CODE || Education You Need',// sender address
            to: `${email}`, // list of receivers
            subject: `${title}`, // Subject line
            html: `${body}`, // html body
        })
        console.log(info.response)
        return info
    } catch (error) {
        console.log(error.message)
        return error.message
    }
}

module.exports = mailSender
