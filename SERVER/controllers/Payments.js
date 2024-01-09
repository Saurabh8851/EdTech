const mongoose = require("mongoose")
const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const crypto = require("crypto")
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");

const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail")
const CourseProgress = require("../models/CourseProgress")

//capture the payment and initiate the Razorpay order
exports.capturePayments = async (req, res) => {
    //get courseId and UserId
    const { courses } = req.body;
    const userId = req.user.id;
    //validation
    //valid courseId
    if (courses.length === 0) {
        return res.json({
            success: false,
            message: 'Please provide valid course ID',
        })
    };

    let total_amount = 0

    //valid courseDetails
    for (const course_id of courses) {
        let course
        try {
            //find the course by its id
            course = await Course.findById(course_id);

            //validattion 
            if (!course) {
                return res.json({
                    success: false,
                    message: ' Could not find the course',
                });
            }
            //user already pay for the same course
            const uid = new mongoose.Types.ObjectId(userId);//object id ko user id mei convert kiya hai
            if (course.studentEnrolled.includes(uid)) {
                return res.status(200).json({
                    success: false,
                    message: 'Student is already enrolled',
                });
            }

            // Add the price of the course to the total amount
            total_amount += course.price

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                sucess: false,
                message: error.message,
            });
        }
    }


    // const amount = course.price;
    // const currency = "INR";

    //order create
    const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: Math.random(Date.now()).toString(),
        //notes:{
        //     courseId: course_id,
        //     userId,
        // }

    };

    try {
        //initiate the payment using razorpay
        const paymentResponse = await instance.orders.create(options)
        console.log(paymentResponse);
        //return response
        return res.status(200).json({
            success: true,
            data: paymentResponse,
            // courseName: course.courseName,
            // courseDescription: course.courseDescription,
            // thumbnail: course.thumbnail,
            // orderId: paymentResponse.id,
            // currency: paymentResponse.currency,
            // amunt: paymentResponse.amount,
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Could not initiate order",
        });
    }


};

//verify Signature of Razorpay and Server
//using webhook
// exports.verifySignature = async (req, res) => {
//     const webhookSecret = "12345678";//server ka secret

//     const signature = req.headers["x-razorpay-signature"];//This signature is coming from razrorpay

//     const shasum = crypto.createHmac("sha256", webhookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest = shasum.digest("hex");

//     if (signature === digest) {
//         console.log("Payment is Authorised");

//         const { courseId, userId } = req.body.payload.payment.entity.notes;

//         try {
//             //fulfil the action

//             //find the course and enroll the student in it
//             const enrolledCourse = await Course.findOneAndUpdate(
//                 { _id: courseId },
//                 { $push: { studentsEnrolled: userId } },
//                 { new: true },
//             );

//             if (!enrolledCourse) {
//                 return res.status(500).json({
//                     success: false,
//                     message: 'Course not Found',
//                 });
//             }

//             console.log(enrolledCourse);

//             //find the student and add the course to their list enrolled courses me 
//             const enrolledStudent = await User.findOneAndUpdate(
//                 { _id: userId },
//                 { $push: { courses: courseId } },
//                 { new: true },
//             );

//             console.log(enrolledStudent);

//             //mail send krdo confirmation wala 
//             const emailResponse = await mailSender(
//                 enrolledStudent.email,
//                 "Congratulations from Learn4Code",
//                 "Congratulations, you are onboarded into new Learn4Code Course",
//             );

//             console.log(emailResponse);
//             return res.status(200).json({
//                 success: true,
//                 message: "Signature Verified and Course Added",
//             });


//         }
//         catch (error) {
//             console.log(error);
//             return res.status(500).json({
//                 success: false,
//                 message: error.message,
//             });
//         }
//     }
//     else {
//         return res.status(400).json({
//             success: false,
//             message: 'Invalid request',
//         });
//     }


// };


// verify the payment signature
exports.verifyPayment = async (req, res) => {
    const razorpay_order_id = req.body?.razorpay_order_id
    const razorpay_payment_id = req.body?.razorpay_payment_id
    const razorpay_signature = req.body?.razorpay_signature
    const courses = req.body?.courses

    const userId = req.user.id

    if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature ||
        !courses ||
        !userId
    ) {
        return res.status(200).json({ success: false, message: "Payment Failed" })
    }

    let body = razorpay_order_id + "|" + razorpay_payment_id

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex")

    if (expectedSignature === razorpay_signature) {
        await enrollStudents(courses, userId, res)
        return res.status(200).json({ success: true, message: "Payment Verified" })
    }

    return res.status(200).json({ success: false, message: "Payment Failed" })
}

// Send Payment Success Email
exports.sendPaymentSuccessEmail = async (req, res) => {
    const { orderId, paymentId, amount } = req.body

    const userId = req.user.id

    if (!orderId || !paymentId || !amount || !userId) {
        return res
            .status(400)
            .json({ success: false, message: "Please provide all the details" })
    }

    try {
        const enrolledStudent = await User.findById(userId)

        await mailSender(
            enrolledStudent.email,
            `Payment Received`,
            paymentSuccessEmail(
                `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
                amount / 100,
                orderId,
                paymentId
            )
        )
    } catch (error) {
        console.log("error in sending mail", error)
        return res
            .status(400)
            .json({ success: false, message: "Could not send email" })
    }
}

// enroll the student in the courses
const enrollStudents = async (courses, userId, res) => {
    if (!courses || !userId) {
        return res
            .status(400)
            .json({ success: false, message: "Please Provide Course ID and User ID" })
    }

    for (const courseId of courses) {
        try {
            // Find the course and enroll the student in it
            const enrolledCourse = await Course.findOneAndUpdate(
                { _id: courseId },
                { $push: { studentsEnroled: userId } },
                { new: true }
            )

            if (!enrolledCourse) {
                return res
                    .status(500)
                    .json({ success: false, error: "Course not found" })
            }
            console.log("Updated course: ", enrolledCourse)

            const courseProgress = await CourseProgress.create({
                courseID: courseId,
                userId: userId,
                completedVideos: [],
            })
            // Find the student and add the course to their list of enrolled courses
            const enrolledStudent = await User.findByIdAndUpdate(
                userId,
                {
                    $push: {
                        courses: courseId,
                        courseProgress: courseProgress._id,
                    },
                },
                { new: true }
            )

            console.log("Enrolled student: ", enrolledStudent)
            // Send an email notification to the enrolled student
            const emailResponse = await mailSender(
                enrolledStudent.email,
                `Successfully Enrolled into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(
                    enrolledCourse.courseName,
                    `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
                )
            )

            console.log("Email sent successfully: ", emailResponse.response)
        } catch (error) {
            console.log(error)
            return res.status(400).json({ success: false, error: error.message })
        }
    }
}