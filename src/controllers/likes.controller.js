import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Likes } from "../models/likes.models.js"

const toggleVideoLike = asyncHandler( async (req, res) => {
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(400, "Video is missing");
    }
    // Check if like exists for this user and video
    const existedLike = await Likes.findOne(
        {video: videoId, likedBy: req.user._id}
    );
    if(existedLike){
        // If exists, remove (unlike)
        await Likes.findByIdAndDelete(existedLike._id);
        return res.status(200).json(
            new ApiResponse(200, {}, "Video unliked successfully")
        );
    }
    // If not exists, create like
    const isLiked = await Likes.create({
        video: new mongoose.Types.ObjectId(videoId),
        likedBy: req.user._id
    });
    const likedVideo = await Likes.findById(isLiked._id).select("-comment -tweet");
    if(!likedVideo){
        throw new ApiError(500, "Something went wrong while liking the video");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, likedVideo, "Video liked successfully")
    );
})

const toggleCommentLike = asyncHandler( async (req, res) => {
    const {commentId} = req.params;
    if(!commentId){
        throw new ApiError(400, "Comment is missing");
    }
    const existedLike = await Likes.findOne(
        {comment: commentId, likedBy: req.user._id}
    );
    if(existedLike){
        // If exists, remove (unlike)
        await Likes.findByIdAndDelete(existedLike._id);
        return res.status(200).json(
            new ApiResponse(200, {}, "Comment unliked successfully")
        );
    }
    const isLiked = await Likes.create({
        comment: new mongoose.Types.ObjectId(commentId), 
        likedBy: req.user._id
    })
    const likedComment = await Likes.findById(isLiked._id).select("-video -tweet");
    if(!likedComment){
        throw new ApiError(500, "Something went wrong while liking the comment");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, likedComment, "Comment liked successfully")
    )
})

const toggleTweetLike = asyncHandler( async (req, res) => {
    const {tweetId} = req.params;
    if(!tweetId){
        throw new ApiError(400, "Tweet is missing");
    }
    const existedLike = await Likes.findOne(
        {tweet: tweetId, likedBy: req.user._id}
    );
    if(existedLike){
        // If exists, remove (unlike)
        await Likes.findByIdAndDelete(existedLike._id);
        return res.status(200).json(
            new ApiResponse(200, {}, "Tweet unliked successfully")
        );
    }
    const isLiked = await Likes.create({
        tweet: new mongoose.Types.ObjectId(tweetId), 
        likedBy: req.user._id
    })
    const likedTweet = await Likes.findById(isLiked._id).select("-video -comment");
    if(!likedTweet){
        throw new ApiError(500, "Something went wrong while liking the tweet");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, likedTweet, "Tweet liked successfully")
    )
})

const getLikedVideos = asyncHandler( async (req, res) => {
    const likedVideos = await Likes.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo"
            }
        },
        { $unwind: "$likedVideo" },
        { $replaceRoot: { newRoot: "$likedVideo" } },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                title: 1,
                description: 1,
                createdAt: 1
            }
        }
    ]);
    return res
    .status(200)
    .json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}