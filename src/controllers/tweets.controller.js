import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Tweets} from "../models/tweets.models.js"


const createTweet = asyncHandler( async (req, res) => {
    const {content} = req.body;
    const existedTweet = await Tweets.findOne({
        content: content,
        owner: req.user._id
    })
    if(existedTweet){
        throw new ApiError(400, "The tweet already exists");
    }
    if(!content){
        throw new ApiError(400, "Tweet is required");
    }
    const tweet = await Tweets.create({
        content,
        owner: req.user._id
    })
    if(!tweet){
        throw new ApiError(500, "Something went wrong while creating the tweet");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet created successfully")
    )
})

const deleteTweet = asyncHandler( async (req, res) => {
    const {tweetId} = req.params;
    if(!tweetId){
        throw new ApiError(400, "Tweet is missing");
    }
    await Tweets.findByIdAndDelete(tweetId);
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Tweet deleted successfully")
    )
})

const updateTweet = asyncHandler( async (req, res) => {
    const {tweetId} = req.params;
    const {content} = req.body;
    if(!tweetId){
        throw new ApiError(400, "Tweet is missing");
    }
    if(!content){
        throw new ApiError(400, "Content is required");
    }
    const tweet = await Tweets.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: content
            }
        },
        {new: true}
    )
    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet updated successfully")
    )
})

const getAllUserTweets = asyncHandler( async (req, res) => {
    const {userId} = req.params;
    if(!userId){
        throw new ApiError(400, "User is missing");
    }
    const tweets = await Tweets.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                avatar: 1,
                content: 1,
                createdAt: 1
            }
        }
    ])
    if(!tweets){
        throw new ApiError(404, "Tweets are not found");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, tweets, "Tweets fetched successfully")
    )
})

export {
    createTweet,
    deleteTweet,
    updateTweet,
    getAllUserTweets
}