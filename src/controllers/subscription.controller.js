import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.models.js";


const getUserChannelSubscribers = asyncHandler( async (req, res) => {
    const {channel} = req.params;
    if(!channel){
        throw new ApiError(400, "The channel does not exist");
    }
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channel)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscriberDetails"
                }
            }
        },
        {
            $project: {
                fullname: "$subscriberDetails.fullname",
                username: "$subscriberDetails.username",
                avatar: "$subscriberDetails.avatar",
                coverImage: "$subscriberDetails.coverImage",
                subscribersCount: 1
            }
        }
    ]);
    if(!subscribers || subscribers.length === 0){
        throw new ApiError(400, "Channel not found or has no subscribers");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, {
            subscribers,
            subscriberCount: subscribers.length
        }, "Subscribers fetched successfully")
    );
})

const getSubscribedChannels = asyncHandler( async (req, res) => {
    const {subscriberId} = req.params;
    if(!subscriberId){
        throw new ApiError(400, "The channel does not exist");
    }
    const channelsSubscribed = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribedToCount: {
                    $size: "$subscribedTo"
                }
            }
        },
        {
            $project: {
                username: "$subscribedTo.username",
                fullname: "$subscribedTo.fullname",
                avatar: "$subscribedTo.avatar",
                coverImage: "$subscribedTo.coverImage",
                subscribedToCount: 1
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(200, channelsSubscribed, "User's subscribed channels fecthed successfully")
    )
})

const toggleSubscription = asyncHandler( async (req, res) => {
    const {channel} = req.params;
    if(!channel){
        throw new ApiError(400, "Channel is not present");
    }
    const isSubscribed = await Subscription.findOne({
        channel: new mongoose.Types.ObjectId(channel),
        subscriber: req.user?._id
    })
    if(isSubscribed){
       await Subscription.findByIdAndDelete({
        channel: new mongoose.Types.ObjectId(channel),
        subscriber: req.user?._id
       });
        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "The channel unsubscribed successfully")
        )
    }
    const subscribed = await Subscription.create({
        channel: new mongoose.Types.ObjectId(channel),
        subscriber: req.user?._id,
    })
    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribed, "The channel subscribed successfully")
    )
})

export {
    getUserChannelSubscribers,
    getSubscribedChannels,
    toggleSubscription
}