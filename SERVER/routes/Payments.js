// Import the required modules
const express = require("express")
const router = express.Router()

const { capturePayments, verifyPayment, sendPaymentSuccessEmail } = require("../controllers/Payments")
const { auth, isInstructor, isStudent, isAdmin } = require("../middlewares/auth")


router.post("/capturePayment", auth, isStudent, capturePayments)
router.post("/verifySignature",auth, isStudent, verifyPayment)
router.post(
    "/sendPaymentSuccessEmail",
    auth,
    isStudent,
    sendPaymentSuccessEmail
  )

module.exports = router