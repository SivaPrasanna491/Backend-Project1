import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
const generateAccessandRefreshToken = async (userId) => {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false}); // mongoose defaultly validates the whole schema before saving so to see whether any requiredField is missing or not
    // and now we are saying it dont' do validation just skip it
    return {accessToken, refreshToken};
}

const registerUser = asyncHandler( async (req, res) => {
    /*
        1) Fetch the user details from the frontend app
        2) Now validate the user details whether they are not null
        3) Check if the user already exists, username, email
        4) Check if the avatar image localpath is returned
        5) Upload the avatar on cloudinary
        6) Check if the image is uploaded in cloudinary
        7) If image uploaded then pass the data into database
        8) Check if the entry is created or not
        9) If it is created then return json response while eliminating password & refreshtoken
    */
    const {fullname, username, email, password} = req.body
    if(
        [fullname,username, email, password].some((field) => (
            field?.trim() === ""
        ))
    ){
        throw new ApiError(400, "The fields are empty");
    }
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "This field already exists");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is compulsory");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(400, "Avatar is required");
    }
    const user = await User.create(
        {
            fullname,
            avatar: avatar.secure_url,
            coverImage: coverImage?.secure_url || "",
            username,
            email,
            password
        }
    )
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    ).lean();
    if(!createdUser){
        console.log(new ApiError(500, "Something went wrong while registering the user"));
    }
    return res.status(200).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
})

const loginUser = asyncHandler( async (req, res) => {
    /*
        1) Fetch the user details from front end
        2) Check any field whether user entered or not
        3) Check if the user exists, username, email    
        4) Check password
        5) Store refreshToken in database
        6) Send accessToken using cookie and send response as well
    */
   const {username, email, password} = req.body;
   console.log(req.body);
   if(!req.body){
    throw new ApiError(400, "The form is empty");
   }
   console.log("Printing: ");
   console.log("Username: ",username);
   if(!username && !email){
    throw new ApiError(400, "Email or password does not exist");
   }
   const user = await User.findOne({
    $or: [{username}, {email}]
   })
   if(!user){
    throw new ApiError(404, "User does not exist");
   }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401, "The password is invalid");
    }
   const {accessToken, refreshToken} = await generateAccessandRefreshToken(user._id);
   const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )

   const options = {
    httpOnly: true,
    secure: true
   }
   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(
    new ApiResponse(
        200,
        {
            loggedInUser, accessToken, refreshToken
        },
        "User logged in successfully"
    )
   )
})

const logout = asyncHandler( async (req, res) => {
    /*
        1) Remove all cookies
        2) Make refreshToken as undefined
    */
   await User.findByIdAndUpdate(
    req.user._id,
    {
        $unset: {
            refreshToken: 1
        }
    },
    {
        new: true
    }
   )
   const options = {
    httpOnly: true,
    secure: true
   }
   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(
    new ApiResponse(
        200,{}, "Logged out successfully"
    )
   )
})

const refreshAccessToken = asyncHandler( async (req, res) => {
    /*
        1) Find the refreshToken through cookies
        2) Now compare the found token with secret token i.e env file and decrypt the data which you got when comparing the tokens
        3) Now find the user in the database and compare his token with stored refresh token
        4) If they are equal generate new access token
        5) Send the response to the user
    */
   const token = req.cookies?.refreshToken || req.body.refreshToken;
   if(!token){
    throw new ApiError(400, "Invalid request");
   }
   const decodedData = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
   const user = await User.findById(decodedData?._id);
   if(!user){
    throw new ApiError(401, "Invalid access");
   }
   const {accessToken, refreshToken} = await generateAccessandRefreshToken(user._id);
   const options = {
    httpOnly: true,
    secure: true
   }
   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(
    new ApiResponse(200, {}, "Token generated successfully")
   )
})

const passwordRecovery = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword, confirmPassword} = req.body;
    const user = await User.findById(req.user._id);
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordValid){
        throw new ApiError(400, "Invalid request");
    }
    if(newPassword !== confirmPassword){
        throw new ApiError(401, "Invalid password");
    }
    user.password = newPassword;
    await user.save({validateBeforeSave: false});
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password updated successfully")
    )
})

const updateUserDetails = asyncHandler( async (req, res) => {
    const {fullname, email} = req.body;
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullname,
                email,
            }
        },
        {new: true}
    ).select("-password -refreshToken")
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Details updated successfully")
    )
})

const getCurrentUser = asyncHandler( async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "Fetched the current user")
    )
})

const updateUserAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar){
        throw new ApiError(401, "Something went wrong while uploading the image");
    }
    const user = await User.findById(req.user._id).select("-password -refreshToken");
    user.avatar = avatar.secure_url;
    await user.save({validateBeforeSave: false});
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar changed successfully")
    )
})
const updateUserCoverImage = asyncHandler( async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400, "CoverImage is required");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage){
        throw new ApiError(401, "Something went wrong while uploading the image");
    }
    const user = await User.findById(req.user._id).select("-password -refreshToken");
    user.coverImage = coverImage.secure_url;
    await user.save({validateBeforeSave: false});
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "CoverImage changed successfully")
    )
})

const getUserChannelProfile = asyncHandler( async (req, res) => {
    /*
        1) Find the username or url
        2) Create a pipeline that matches the above url or username
        3) Now for getting number of subscribers create a pipeline where it matches the channel
        4) Now for getting number of channels you have subscribed create a pipeline where it matches subscriber
        5) Now send the user the reponse if channel is present
    */
   const {username} = req.params
   if(!username){
    throw new ApiError(400, "The username is not present");
   }
   const channel = await User.aggregate([
    {
        $match: {
            username: username?.toLowerCase()
        }
    },
    {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        },
    },
    {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
        }
    },
    {
        $addFields: {
            subsriberCount: {
                $size: "$subscribers"
            },
            channelSubscribedTo: {
                $size: "$subscribedTo"
            },
            isSubscribed: {
                $cond: {$in:[req.user?._id, "$subscribers.subscriber"]},
                then: true,
                else: false
            }
        }
    },
    {
        $project: {
            fullname: 1,
            username: 1,
            subsriberCount: 1,
            channelSubscribedTo: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1
        }
    }
   ])
   if(!channel){
    throw new ApiError(401, "Channel not found");
   }
   return res
   .status(200)
   .json(
    new ApiResponse(200, channel, "User details fetched successfully")
   )
})


const getWatchHistory = asyncHandler( async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
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
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logout,
    refreshAccessToken,
    passwordRecovery,
    updateUserDetails,
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}