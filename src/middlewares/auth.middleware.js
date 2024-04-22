import ApiError from "../utils/ApiError"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model"

const verifyJWT = async (req, res, next) => {
    
    const token = req.cookies?.accessToken ||  res.header("Authorization")?.replace("Bearer ", "")
    //res.header("Authorization") --> // "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

    if(!token) {
        throw new ApiError(401, "Unauthorized request")
    }

    const decodedToken = jwt.verify(token, process.env.CLOUDINARY_API_SECRET);

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(401, "Invalid Access Token")
    }

    req.user = user;
    next()
}

export default verifyJWT;