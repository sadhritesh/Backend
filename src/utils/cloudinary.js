import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";
          
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET 
});

const uploadFileOnCloudinary = async function(localFilePath) {

    try {
        if(!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
    
        fs.unlinkSync(localFilePath)
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        return response
    } catch (error) {
        // remove the locally saved temporary file as the upload operation got failed
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export default uploadFileOnCloudinary;