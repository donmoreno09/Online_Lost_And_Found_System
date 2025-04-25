import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configura Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Crea lo storage Cloudinary
const storageCloudinary = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'lost-and-found',
  },
});

// Crea e esporta l'oggetto multer con lo storage configurato
const uploadCloudinary = multer({ storage: storageCloudinary });

export default uploadCloudinary;