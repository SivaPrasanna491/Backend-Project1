import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Comments } from "../models/comments.models.js"
import mongoose from "mongoose"
const addComment = asyncHandler( async (req, res) => {
    const {videoId} = req.params;
    const {content} = req.body;
    if(!videoId){
        throw new ApiError(400, "Video is missing");
    }
    if(!content){
        throw new ApiError(400, "Content is required");
    }
    const comment = await Comments.create({
        video: new mongoose.Types.ObjectId(videoId),
        content,
        owner: req.user._id // Store the owner (user ID) of the comment
    })
    return res
    .status(201)
    .json(
        new ApiResponse(201, comment, "Comment added successfully")
    );
})

const deleteComment = asyncHandler( async (req, res) => {
    const {commentId} = req.params;
    if(!commentId){
        throw new ApiError(400, "Comment is missing");
    }
    await Comments.findByIdAndDelete(commentId);
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    )
})

const updateComment = asyncHandler( async (req, res) => {
    const {commentId} = req.params;
    const {content} = req.body;
    if(!commentId){
        throw new ApiError(400, "Comment is missing");
    }
    if(!content){
        throw new ApiError(400, "Content is required");
    }
    const comment = await Comments.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {new: true}
    )
    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment updated successfully")
    )
})

const getVideoComments = asyncHandler( async (req, res) => {
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(400, "Video is missing");
    }
    const comments = await Comments.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
            }
        },
        { $unwind: "$ownerDetails" },
        {
            $project: {
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                "ownerDetails.username": 1,
                "ownerDetails.avatar": 1
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(200, comments, "Video comments fetched successfully")
    )
})

export {
    addComment,
    deleteComment,
    updateComment,
    getVideoComments,
}