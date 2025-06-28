import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image to Cloudinary
export const uploadToCloudinary = async (filePath, folder = 'farm-marketplace') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto' },
        { format: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };

  } catch (error) {
    console.error('Ошибка загрузки в Cloudinary:', error);
    throw error;
  }
};

// Delete image from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;

  } catch (error) {
    console.error('Ошибка удаления из Cloudinary:', error);
    throw error;
  }
};

// Generate optimized image URL
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const {
    width = 400,
    height = 300,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    format
  });
};

export default cloudinary;