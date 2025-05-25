import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getPlaylistVideos, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlists.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const playlistRouter = Router()
playlistRouter.use(verifyJWT)
playlistRouter.route("/create-playlist").post(createPlaylist)
playlistRouter.route("/c/:playlistId").post(deletePlaylist)
playlistRouter.route("/c/:playlistId").post(updatePlaylist)
playlistRouter.route("/c/:playlistId").post(addVideoToPlaylist)
playlistRouter.route("/c/:playlistId/:videoId").get(removeVideoFromPlaylist)
playlistRouter.route("/c/:playlistId").get(getPlaylistById)
playlistRouter.route("/c/:userId").get(getUserPlaylists)
playlistRouter.route("/c/:playlistId").get(getPlaylistVideos)

export {playlistRouter}