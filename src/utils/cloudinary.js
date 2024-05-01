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

const deletePhotoFromCloudinary = async function(url) {
    //url = 'http://res.cloudinary.com/sadhcloud/image/upload/v1713862006/ogazqih9chvlgwtea3ee.png'
    if (!url) {
        return null
    }
    try {
        const tempArray = url.split("/")
        const public_id = tempArray[tempArray.length-1].split(".")[0]
        await cloudinary.uploader.destroy(public_id, () => {
            console.log("Image deleted from cloudinary with public_id:", public_id)
        })
    } catch (error) {
        console.log("Error occured in deleteing img from cloudinary :", error.message)
    }
}

export  {
    uploadFileOnCloudinary,
    deletePhotoFromCloudinary
}