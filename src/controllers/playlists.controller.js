import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlists.models.js";
import mongoose from "mongoose";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
const createPlaylist = asyncHandler( async (req, res) => {
    const { name, description, videos = [] } = req.body;
    if ((!name && !description) || !(name || description)) {
        throw new ApiError(400, "The name or description field are required");
    }
    const existedPlaylist = await Playlist.findOne({
        $or: [{ name }, { description }]
    });
    if (existedPlaylist) {
        throw new ApiError(400, "The playlist already exists");
    }
    const { channel } = req.params;
    if (!channel) {
        throw new ApiError(400, "Channel does not exist");
    }
    const playlistData = await Playlist.create({
        name,
        description,
        videos,
        owner: new mongoose.Types.ObjectId(req.user._id)
    });
    if (!playlistData) {
        throw new ApiError(500, "Something went wrong while creating the playlist");
    }
    return res.status(200).json(
        new ApiResponse(200, playlistData, "Playlist created successfully")
    );
});


const deletePlaylist = asyncHandler( async (req, res) => {
    const { playlistId } = req.params;
    if (!playlistId) {
        throw new ApiError(400, "Playlist is missing");
    }
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
    if (!deletedPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    );
});

const updatePlaylist = asyncHandler( async (req, res) => {
    const {playlistId} = req.params;
    const {name, description, videos=[]} = req.body;
    if(!playlistId){
        throw new ApiError(400, "Plalist is missing");
    }
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description,
                videos,
            }
        }
    )
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist updated successfully")
    )
})

const addVideoToPlaylist = asyncHandler( async (req, res) => {
    const {playlistId, videoId} = req.params;
    if(!playlistId){
        throw new ApiError(400, "The playlist is missing");
    }
    if(!videoId){
        throw new ApiError(400, "Video is missing");
    }
    const video = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos: {videoId}
            }
        },
        {new: true}
    )
    if(!video){
        throw new ApiError(500, "Something went wrong while uploading the video");
    }
})

const removeVideoFromPlaylist = asyncHandler( async (req, res) => {
    const {playlistId, videoId} = req.params;
    if(!playlistId){
        throw new ApiError(400, "Playlist is missing");
    }
    if(!videoId){
        throw new ApiError(400, "Video is missing");
    }
    await Playlist.findByIdAndDelete(
        playlistId,
        {
           $pull:{videos: videoId}
        },
        {new: true}
    )
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
})

const getPlaylistById = asyncHandler( async (req, res) => {
    const {playlistId} = req.params;
    if(!playlistId){
        throw new ApiError(400, "Playlist is missing");
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const {userId} = req.params;

    // Get total count for pagination
    const totalCount = await Playlist.countDocuments({ owner: userId });

    // Fetch paginated playlists
    const playlists = await Playlist.find({ owner: userId })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);

    return res.status(200).json(
        new ApiResponse(200, {
            playlists,
            pagination: {
                total: totalCount,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalCount / limitNumber),
            },
        }, "User playlists fetched successfully")
    );
});

const getPlaylistVideos = asyncHandler( async (req, res) => {
    const {playlistId} = req.params;
    if(!playlistId){
        throw new ApiError(400, "Playlist is missing");
    }
    const videos = await Playlist.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "playlistVideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            $first: "$ownerDetails"
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(200, videos[0].videos, "Videos fetched successfully")
    )
})

export {
    createPlaylist,
    deletePlaylist,
    updatePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistById,
    getUserPlaylists,
    getPlaylistVideos
}