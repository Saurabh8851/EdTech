const mongoose = require("mongoose");
// const { Schema } = mongoose;
// import { Document, Schema, model, Query, Model } from "mongoose";
// Define the Courses schema
const courseSchema = new mongoose.Schema({
    courseName: {
        type: String

    },
    courseDescription: {
        type: String
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"//or User
    },
    whatYouWillLearn: {
        type: String
    },
    courseContent: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Section"
        }
    ],
    ratingAndReviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RatingAndReview"
        }
    ],
    price: {
        type: Number
    },
    thumbnail: {
        type: String
    },
    tag:{
        type: [String],
        required:true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },
    studentEnrolled: [
        {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",//User
        }
    ],
    instructions:{
        type:[String],
    },
    status:{
        type:String,
        enum:["Draft","Published"],
    },
    createdAt: { 
        type: Date, 
        default: Date.now },

});
module.exports = mongoose.model("Course", courseSchema);