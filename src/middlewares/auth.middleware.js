import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler( async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if(!token){
            throw new ApiError(400, "Token is not present");
        }
        const decodedData =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedData?._id);
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error.message || "Unauthorized access");
    }
})