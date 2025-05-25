import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comments.controller.js";

const commentRouter = Router()

commentRouter.use(verifyJWT)

commentRouter.route("/c/:videoId").post(addComment)
commentRouter.route("/c/:commentId").post(deleteComment)
commentRouter.route("/c/:commentId").patch(updateComment)
commentRouter.route("/c/:videoId").get(getVideoComments)

export {commentRouter}