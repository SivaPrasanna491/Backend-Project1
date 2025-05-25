import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, getAllUserTweets, updateTweet } from "../controllers/tweets.controller.js";


const tweetRouter = Router();

tweetRouter.use(verifyJWT)

tweetRouter.route("/createTweet").post(createTweet)
tweetRouter.route("/c/:tweetId").delete(deleteTweet)
tweetRouter.route("/c/:tweetId").patch(updateTweet)
tweetRouter.route("/user/:userId").get(getAllUserTweets)


export {tweetRouter}