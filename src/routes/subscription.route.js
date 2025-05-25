import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";
const subscriptionRouter = Router();

subscriptionRouter.use(verifyJWT)

subscriptionRouter.route("/c/:channel").get(getUserChannelSubscribers)
subscriptionRouter.route("/c/:subscriber").get(getSubscribedChannels)
subscriptionRouter.route("/c/:channel").get(toggleSubscription)

export {subscriptionRouter}