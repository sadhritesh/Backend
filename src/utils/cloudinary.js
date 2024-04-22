import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({
    path: "./.env"
})

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });

const uploadFileOnCloudinary = async function(localFilePath) {

    try {
        if(!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
    
        fs.unlinkSync(localFilePath)
        // file has been uploaded successfull
        // console.log("file is uploaded on cloudinary ", response);
        return response
    } catch (error) {
        // remove the locally saved temporary file as the upload operation got failed
        console.log("File not uploaded not on Cloudinary :", error.message)
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export default uploadFileOnCloudinary;