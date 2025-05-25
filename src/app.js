import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// routes import

import router from './routes/user.routes.js';
import { videoRouter } from './routes/video.router.js';
import { subscriptionRouter } from './routes/subscription.route.js';
import {tweetRouter} from './routes/tweets.route.js'
import { likeRouter } from './routes/likes.route.js';
import { commentRouter } from './routes/comments.route.js';
import { playlistRouter } from './routes/playlist.route.js';
// routes declaration

app.use("/api/v1/users", router)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/subscription", subscriptionRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/playlists", playlistRouter)
//http://localhost:8000/api/v1/users/router_component

export default app