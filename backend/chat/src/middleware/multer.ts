import multer from "multer";
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from "../config/cloudinary.js";


const storage = new CloudinaryStorage({
    cloudinary : cloudinary,
    params : {
        folder : 'chat-images',
        allowed_formats:['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation : [{width : 800, height : 600, crop : 'limit'},{quality : 'auto'}],
        
    } as any
})

export const upload = multer({
    storage,
    limits: {
        fileSize : 5 * 1024 * 1024
    },
    fileFilter : (req, file, cb)=>{
        console.log("File mimeType =>", file.mimetype);
    console.log("startsWith =>", file.mimetype.startsWith("image/"));
        if(file.mimetype.startsWith('image/')){
            console.log("Accepted");
            return cb(null, true)
        }else{
            console.log("Rejected");
            cb(new Error('only image allowed'))
        }
    }
})