import mongoose from "mongoose";

const videoSchema = mongoose.Schema(
    {
        videoFile: {
            String: true, 
            required: true 
        }, 
        thumbnail: {
            String: true, 
            required: true
        },
        owner: {
            type: mongoose.Schema.Type.ObjectId,
            ref: "User"
        },
        title: {
            type: String, 
            required: true, 
            trim: true
        }, 
        description: {
            type: String,
            required: true,
            trim: true
        },
        duration: {
            type: Number,
            required: true
        },
        views: {
            type: Number, 
            default: 0
        },
        isPublished: {
            type: Boolean, 
            default: true,
        }
    },
    {
        timestamps: true 
    }
);

export const Video = mongoose.model("Video", videoSchema);
