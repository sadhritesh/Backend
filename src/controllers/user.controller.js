import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadFileOnCloudinary, deletePhotoFromCloudinary } from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {

    const user = await User.findById(userId)

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false })

    return {
        accessToken,
        refreshToken
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //1. get user details from frontend
    //2. validation - not empty, email is right format
    //3. check if user already exits: email, username
    //4. check for images, check for avatar 
    //5. upload them to cloudinary, and again check for avatar(bcs it is a required field)
    //6. create user object- create entry in db 
    //7. check for user creation 
    //8. remove password and refresh token from response 
    //9. remove pass. and refresh token fields from response 
    //10. return response

    const { fullName, username, email, password } = req.body ;

    if (
        [ fullName, username, email, password ].some((field) => (
            field === undefined || field.trim() === ""
        ))
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [ { username }, { email } ]
    })

    if (existedUser) {
        throw new ApiError(409, "User with same username or email is already present")
    }

    const avatarLocalPath  = req.files?.avatar && req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage && req.files?.coverImage[0]?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadFileOnCloudinary(avatarLocalPath);
    const coverImage = await uploadFileOnCloudinary(coverImageLocalPath)
    
    if(!avatar) {
        throw new ApiError(400, "Avatar is required")
    }

    const user = await User.create({
        fullName,
        email,
        username,
        password,
        avatar : avatar.url,
        coverImage: coverImage?.url || ""
    })


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    console.log(createdUser);

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )

})

const loginUser = asyncHandler(async function(req, res) {
    //get username or email and password
    //search username or email in db
    //compare password with saved password
    //generate access and refresh token
    //send cookie

    const { email, username, password } = req.body;

    if (!email && !username) {
        throw new ApiError(400, "username or email is required")
    }

    if (!password) {
        throw new ApiError(400, "password is required")
    }
    
    const user = await User.findOne({
        $or: [ { email }, { username } ]
    })

    if (!user) {
        throw new ApiError(404, "user not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

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
        new ApiResponse(200, 
        {
            loggedInUser,
            accessToken,
            refreshToken
        },
        "user loggedIn successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    //delete refreshToken of the loggedIn user from the db
    //remove the cookies from the client side 

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken : 1
            }
        }
    )

    const options = {
        httpOnly : true,
        secure : true 
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "user logout successfully")
    )
}) 

const refreshAccessToken = asyncHandler (async (req, res) => {

    const refreshToken = req.cookie?.refreshToken || req.body.refreshToken

    if(!refreshToken) {
        throw new ApiError(400, "Refresh token is required")
    }

    const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)

    if(!decodedToken) {
        throw new ApiError(401, "Invalid refresh token")
    }

    const user = await User.findById(decodedToken._id)

    if(!user) {
        throw new ApiError(401, "Invalid refresh token")
    }

    const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

    const options = {
        httpOnly : true,
        secure : true 
    }

    return res 
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", newRefreshToken)
    .json(
        new ApiResponse(
            200,
            {
                accessToken,
                refreshToken: newRefreshToken
            },
            "access generated successfully"
        )
    )
})

const changeUserPassword = asyncHandler(async (req, res) => {
    //get the oldPassword, newPassword, confPassword
    //get the user id from the req.user 
    //search the user from the db with id 
    //check the saved password with the oldPassword 
    //if yes, update the password of the user and save it into db

    const { currentPassword, newPassword, confirmPassword } = req.body
    console.log(req.body)

    if(!currentPassword || !newPassword || !confirmPassword) {
        throw new ApiError(400, "all the fields are required")
    }

    if(newPassword !== confirmPassword) {
        throw new ApiError(400, "new password and confirm password are not same")
    }
 
    const userId = req.user._id 

    const user = await User.findById(userId)

    const isPasswordValid = user.isPasswordCorrect(currentPassword)

    if(!isPasswordValid) {
        throw new ApiError(401, "current password is incorrect")
    }

    user.password = newPassword
    user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "password changed successfully"
        )
    )    
})

const changeUserDetails = asyncHandler(async (req, res) => {
    //get the new details for update
    //get the userId from the req.user 
    //get the user from the db
    //update and save the details 

    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "all fields are required")
    }

    const userId = req.user._id 
    
    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new : true 
        }
    ).select("-password -refreshToken")

    return res 
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "details updated successfully"
        )
    )
})

const changeUserAvatar = asyncHandler( async (req, res) => {

    const newAvatarLocalPath = req.file?.path

    if (!newAvatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    
    
    const newAvatar = await uploadFileOnCloudinary(newAvatarLocalPath)
    
    //delete old photo from cloudinary 
    await deletePhotoFromCloudinary(req.user?.avatar)
    
    if (!newAvatar.url) {
        throw new ApiError(500, "error while uploading the file, please try again.")
    }
    
    const userId = req.user._id 

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                avatar : newAvatar.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "avatar updated successfully"
        )
    )
})

const changeUserCoverImage = asyncHandler ( async (req, res) => {

    const newCoverImageLocalPath = req.file?.path 

    if (!newCoverImageLocalPath) {
        throw new ApiError(400, "cover image is required")
    }

    
    const newCoverImage = await uploadFileOnCloudinary(newCoverImageLocalPath)
    
    //delete old cover photo from cloudinary 
    await deletePhotoFromCloudinary(req.user.coverImage)

    if (!newCoverImage) {
        throw new ApiError(500, "error occured while uploading cover image")
    }

    const userId = req.user._id
    
    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set : {
                coverImage : newCoverImage.url
            }
        },
        {
            new : true
        }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "cover image updated successfully"
        )
    )
} )

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeUserPassword,
    changeUserDetails,
    changeUserAvatar,
    changeUserCoverImage,
}