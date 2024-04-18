import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true, 
            lowercase: true,
            index: true 
        },
        fullName: {
            type: String, 
            required: true, 
            trim: true
        },
        email: {
            type: String, 
            required: true, 
            trim: true, 
            lowercase: true,
            unique: true
        },
        avatar: {
            type: String, 
            required: true
        },
        coverImage: {
            type: String, 
        }, 
        password: {
            type: String, 
            required: true
        },
        refreshToken: {
            type: String
        }, 
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ]
    },
    {
        timeStamp: true
    }
);

//PASSWORD ENCRYPTION
userSchema.pre("save", async function(req, res, next) {

    if(!this.isModified("password")) next();

    this.password = bcrypt.hash(this.password, 10);
    next();
})

//COMPARING PASSWORD
userSchema.methods.isPasswordCorrect = async function(password) {
    return bcrypt.compare(password, this.password)
}

//GENERATE ACCESS TOKEN
userSchema.methods.generateAccessToken = function() {

    return jwt.sign(
        {
            _id : this._id,
            username : this.username,
            fullName : this.fullName,
            email : this.email
        }, 
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

//GENERATE REFERSH TOKEN
userSchema.methods.generateRefreshToken = function() {

    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
} 

export const User = mongoose.model("User", userSchema);