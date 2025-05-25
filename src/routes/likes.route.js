import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/likes.controller.js";

const likeRouter = Router()
likeRouter.use(verifyJWT)

likeRouter.route("/c/:videoId").post(toggleVideoLike)
likeRouter.route("/c/:commentId").post(toggleCommentLike)
likeRouter.route("/c/:tweetId").post(toggleTweetLike)
likeRouter.route("/likedVideos").get(getLikedVideos)
export {likeRouter}