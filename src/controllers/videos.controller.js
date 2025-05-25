import { asyncHandler } from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiError } from "../utils/ApiError.js";
import {Videos} from "../models/video.models.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import mongoose from "mongoose";
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = -1, userId } = req.query;

    // Convert page and limit to integers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Build the match stage for filtering
    const matchStage = {};
    if (query) {
        matchStage.$text = { $search: query }; // Full-text search
    }
    if (userId) {
        matchStage.userId = userId; // Filter by userId if provided
    }

    // Build the aggregation pipeline
    const pipeline = [
        { $match: matchStage }, // Filter videos
        { $sort: { [sortBy]: parseInt(sortType, 10) } }, // Sort videos
        { $skip: (pageNumber - 1) * limitNumber }, // Skip documents for pagination
        { $limit: limitNumber }, // Limit the number of documents
        {
            $project: {
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                createdAt: 1,
                updatedAt: 1,
            }, // Select only required fields
        },
    ];

    // Execute the aggregation pipeline
    const videos = await Videos.aggregate(pipeline);

    // Get the total count for pagination metadata
    const totalCount = await Videos.countDocuments(matchStage);

    // Return the response
    return res.status(200).json(
        new ApiResponse(200, {
            videos,
            pagination: {
                total: totalCount,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalCount / limitNumber),
            },
        }, "Videos fetched successfully")
    );
});
const uploadVideo = asyncHandler( async (req, res) => {
    /*
        1) Check whether same video is present or not, title, description
        2) Check whether the videp's localPath has been returned or not
        3) If it's returned then upload on cloudinary
        4) Check if it's uploaded or not
        5) If uploaded then store data in db
        6) Check whether data is stored
        7) If stored then return the response
    */
   const {title, description} = req.body;
   if((!title && !description) || !(title || description)){
    throw new ApiError(400, "The field title or description are required");
   }
   const existedVideo = await Videos.findOne({
    $or: [{title}, {description}]
   })
   if(existedVideo){
    throw new ApiError(400, "Video already exists");
   }
   const videoLocalPath = req.files?.videoFile[0]?.path;
   const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
   if(!videoLocalPath){
    throw new ApiError(401, "Video is compulsory");
   } if(!thumbnailLocalPath){
    throw new ApiError(401, "Thumbnail is compulsory");
   }
   const video = await uploadOnCloudinary(videoLocalPath);
   const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
   if(!video){
    throw new ApiError(401, "Video is required");
   }
   if(!thumbnail){
    throw new ApiError(401, "Thumbnail is required");
   }
   const isVideoUploaded = await Videos.create(
    {
        videoFile: video.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: video.duration
    }
   )
   const videoUploaded = await Videos.findById(isVideoUploaded._id).select("-isPublished");
   if(!videoUploaded){
    throw new ApiError(500, "Something went wrong while uploading the video");
   }
   return res
   .status(200) 
   .json(
    new ApiResponse(200, videoUploaded, "Video uploaded successfully")
   )
})

const getVideoById = asyncHandler( async (req, res) => {
    /*
        1) First generate the video link from req.params
        2) Check whether it's a valid url or not
        3) Then find the url using findOne query
        4) If found then return the response
    */
   const {videoId} = req.params
   if(!videoId){
    throw new ApiError(400, "Video not found");
   }
   const video = await Videos.aggregate([
    {
        $match:{
            _id: new mongoose.Types.ObjectId(videoId)
        }
    },
    {
        $project:{
            videoFile: 1,
            thumbnail: 1,
            title: 1,
            description: 1,
            views: 1,
            duration: 1
        }
    }
   ])
   return res
   .status(200)
   .json(
    new ApiResponse(200, video[0], "Video fetched successfully")
   )
})

const updateVideoDetails = asyncHandler( async (req, res) => {
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(400, "Video not found");
    }
    const {title, description} = req.body;
    if((!title && !description) || !(title || description)){
        throw new ApiError(400, "The title or description field are missing");
    }
    const existedVideo = await Videos.findOne({
        $or: [{title}, {description}]
    })
    if(existedVideo){
        throw new ApiError(400, "Video already exists");
   }
    const video = await Videos.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title,
                description: description
            }
        }
    ).select("-isPublished");
    return res
    .status(200)
    .json(
        new ApiResponse(200,video, "Video details updated successfully")
    )
})

const updateVideo = asyncHandler( async (req, res) => {
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(400, "Video not found");
    }
    const newVideoLocalPath = req.file?.path;
    if(!newVideoLocalPath){
        throw new ApiError(400, "Video is compulsory");
    }
    const video = await uploadOnCloudinary(newVideoLocalPath);
    if(!video){
        throw new ApiError(400, "Video is required");
    }
    const updatedVideo = await Videos.findByIdAndUpdate(
        videoId,
        {
            $set: {
                videoFile: video.url // Use .url for consistency with uploadVideo
            }
        },
        { new: true }
    ).select("-isPublished");
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    )
})

const updateThumbnail = asyncHandler( async (req, res) => {
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(400, "Video not found");
    }
    const thumbnailLocalPath = req.file?.path;
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is compulsory");
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnail){
        throw new ApiError(400, "Thumbnail is required");
    }
    const updatedThumbnail = await Videos.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: thumbnail.secure_url
            }
        }
    ).select("-isPublished")
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedThumbnail, "Video updated successfully")
    )
})

const deleteVideo = asyncHandler( async (req, res) => {
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(400, "Video not found");
    }
    await Videos.findByIdAndDelete(videoId)
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler( async (req, res) => {
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(400, "Video is not missing");
    }
    const video = await Videos.findById(videoId)
    video.isPublished = !video.isPublished;
    video.save({validateBeforeSave: false})
    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video published successfully")
    )
})

export {
    getAllVideos,
    uploadVideo,
    getVideoById,
    updateVideoDetails,
    updateVideo,
    updateThumbnail,
    deleteVideo,
    togglePublishStatus
}
