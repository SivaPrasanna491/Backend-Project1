import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {deleteVideo, getAllVideos, getVideoById, togglePublishStatus, updateThumbnail, updateVideo, updateVideoDetails, uploadVideo } from "../controllers/videos.controller.js";


const videoRouter = Router();

videoRouter.use(verifyJWT);

videoRouter.route("/upload-video").post(
    upload.fields([
        {
            name: 'videoFile',
            maxCount: 1
        },
        {
            name: 'thumbnail',
            maxCount: 1
        }
    ]),
    uploadVideo
)

videoRouter.route("/c/:videoId").delete(deleteVideo)
videoRouter.route("/c/:videoId").patch(updateVideoDetails)
videoRouter.route("/c/:videoId").post(upload.single("videoFile"), updateVideo)
videoRouter.route("/c/:videoId").post(upload.single("thumbnail"), updateThumbnail)
videoRouter.route("/getAll-videos").get(getAllVideos)
videoRouter.route("/c/:videoId").post(togglePublishStatus)
videoRouter.route("/c/:videoId").get(getVideoById)

export {videoRouter}