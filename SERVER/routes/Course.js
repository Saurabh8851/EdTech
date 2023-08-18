//Import the required modules
const express = require("express")
const router = express.Router()

//Importing all the controllers

//Course Controllers Import
const {
    createCourse,
    getAllCourses,
    getCourseDetails,
    getFullCourseDetails,
    editCourse,
    getInstructorCourses,
    deleteCourse,
} = require("../controllers/Course");

//Categories Controllers Import
const {
    showsAllCategories,
    createCategory,
    categoryPageDetails
} = require("../controllers/Category")

//Sections Controllers Import
const {
    createSection,
    updateSection,
    deleteSection,
} = require("../controllers/Section")

//Sub Sections Controllers Import
const {
    createSubSection,
    updateSubSection,
    deleteSubSection,
} = require("../controllers/Subsection")

//Rating&Review Controllers Import
const {
    createRating,
    getAverageRating,
    getAllRating,
} = require("../controllers/RatingAndReview")

const {
    updateCourseProgress,
    getProgressPercentage,
} = require("../controllers/courseProgress")

//Importing middlewares
const {
    auth,
    isAdmin,
    isInstructor,
    isStudent,
} = require("../middlewares/auth")



//Course Routes

//Courses can only be created by Instructors
router.post("/createCourse", auth, isInstructor, createCourse)
// Edit Course routes
router.post("/editCourse", auth, isInstructor, editCourse)
//Add a section to a course
router.post("/addSection", auth, isInstructor, createSection)
//Update a section to a course
router.post("/updateSection", auth, isInstructor, updateSection)
//Delete a section to a course
router.post("/deleteSection", auth, isInstructor, deleteSection)


//create a sub-section to a course
router.post("/addSubSection", auth, isInstructor, createSubSection)
//update a sub-section to a course
router.post("/updateSubSection", auth, isInstructor, updateSubSection)
//delete a sub-section to a course
router.post("/deleteSubSection", auth, isInstructor, deleteSubSection)
// Get all Courses Under a Specific Instructor
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses)
// Get all Registered Courses
router.get("/getAllCourses", getAllCourses)
// Get Details for a Specific Courses
router.post("/getCourseDetails", getCourseDetails)
// Get Details for a Specific Courses
router.post("/getFullCourseDetails", auth, getFullCourseDetails)
// To Update Course Progress
router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress)
// To get Course Progress
// router.post("/getProgressPercentage", auth, isStudent, getProgressPercentage)
// Delete a Course
router.delete("/deleteCourse", deleteCourse)



//Category Routes(Created by only admin)

// Category can Only be Created by Admin

router.post("/createCategory", auth, isAdmin, createCategory)
router.get("/showAllCategories", showsAllCategories)
router.post("/getCategoryPageDetails", categoryPageDetails)

//Rating and review
router.post("/createRating", auth, isStudent, createRating)
router.get("/getAverageRating", getAverageRating)
router.get("/getReviews", getAllRating)

module.exports = router