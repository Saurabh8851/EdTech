const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
require("dotenv").config();

//create Subsection for given section
exports.createSubSection = async (req, res) => {
    try {
        //fetch data from req body
        const { sectionId, title, description } = req.body;
        //extract file/video
        const video = req.files.video;
        //validation
        if (!sectionId || !title || !description || !video) {
            return res.status(404).json({
                success: false,
                message: 'All fields are required',
            });
        }
        console.log(video);
        //upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
        //create sub section--> entry in db
        const subSectionDetails = await SubSection.create({
            title: title,
            timeDuration: `${uploadDetails.duration}`,
            description: description,
            videoUrl: uploadDetails.secure_url,

        })
        //update section with this sub section ObjectId
        const updatedSection = await Section.findByIdAndUpdate({ _id: sectionId },
            {
                $push: {
                    subSection: subSectionDetails._id,
                }
            },
            { new: true })
            .populate("subSection");
        //log updated section here, after adding populate query
        //return response
        return res.status(200).json({
            succcess: true,
            message: 'Sub Section Created Successfully',
            data: updatedSection,
        });
    }
    catch (error) {
        console.error("Error creating new sub-section:", error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        })
    }
};

//UPDATESUBSECTION
exports.updateSubSection = async (req, res) => {
    try {
        //data input
        const { sectionId, subSectionId, title, description } = req.body;
        const subSection = await SubSection.findById(subSectionId)

        //data validation
        if (!subSection) {
            return res.status(400).json({
                success: false,
                message: "SubSection not found",
            })
        }
        if (title !== undefined) {
            subSection.title = title
        }
        if (description !== undefined) {
            subSection.description = description
        }
        if (req.files && req.files.video !== undefined) {
            const video = req.files.video
            const uploadDetails = await uploadImageToCloudinary(
                video,
                process.env.FOLDER_NAME
            )
            subSection.videoUrl = uploadDetails.secure_url
            subSection.timeDuration = `${uploadDetails.duration}`
        }
        await subSection.save();

        const updatedSection = await Section.findById(sectionId).populate("subSection")


        return res.json({
            success: true,
            message: "Section updated successfully",
            data: updatedSection,

        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to update Sub-Section, please try again",
            error: error.message,
        });
    }
};


//deletion in subsection
exports.deleteSubSection = async (req, res) => {
    try {
        //get ID - assuming that we are sending ID in params
        const { subSectionId, sectionId } = req.body
        await Section.findByIdAndUpdate(
            { _id: sectionId },
            {
                $pull: {
                    subSection: subSectionId,
                },
            }
        )
        //use findByIdandDelete
        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId });
        
        if (!subSection) {
            return res
                .status(404)
                .json({ success: false, message: "SubSection not found" })
        }
        const updatedSection = await Section.findById(sectionId).populate("subSection")
        return res.status(200).json({
            success: true,
            message: "Sub Section Deleted Successfully",
            data:updatedSection,
        })

    }
    catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Unable to delete Sub-Section, please try again",
            error: error.message,
        });
    }
}