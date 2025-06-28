import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

class ImageService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  async processAndUpload(filePath, options = {}) {
    try {
      const {
        width = 800,
        height = 600,
        quality = 80,
        format = 'webp',
        folder = 'farm-marketplace',
        generateThumbnail = true
      } = options;

      // Process main image
      const processedImagePath = await this.processImage(filePath, {
        width,
        height,
        quality,
        format
      });

      // Upload main image
      const mainImageResult = await this.uploadToCloudinary(processedImagePath, {
        folder,
        transformation: [
          { width, height, crop: 'limit' },
          { quality: 'auto' },
          { format: 'auto' }
        ]
      });

      let thumbnailResult = null;
      if (generateThumbnail) {
        // Process thumbnail
        const thumbnailPath = await this.processImage(filePath, {
          width: 200,
          height: 200,
          quality: 70,
          format
        });

        // Upload thumbnail
        thumbnailResult = await this.uploadToCloudinary(thumbnailPath, {
          folder: `${folder}/thumbnails`,
          transformation: [
            { width: 200, height: 200, crop: 'fill' },
            { quality: 'auto' }
          ]
        });

        // Clean up thumbnail file
        fs.unlinkSync(thumbnailPath);
      }

      // Clean up processed files
      fs.unlinkSync(processedImagePath);
      if (filePath !== processedImagePath) {
        fs.unlinkSync(filePath);
      }

      return {
        main: {
          url: mainImageResult.secure_url,
          publicId: mainImageResult.public_id,
          width: mainImageResult.width,
          height: mainImageResult.height
        },
        thumbnail: thumbnailResult ? {
          url: thumbnailResult.secure_url,
          publicId: thumbnailResult.public_id
        } : null
      };

    } catch (error) {
      console.error('Image processing and upload error:', error);
      throw error;
    }
  }

  async processImage(inputPath, options = {}) {
    try {
      const {
        width = 800,
        height = 600,
        quality = 80,
        format = 'webp'
      } = options;

      const outputPath = inputPath.replace(
        path.extname(inputPath),
        `_processed.${format}`
      );

      await sharp(inputPath)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFormat(format, { quality })
        .toFile(outputPath);

      return outputPath;

    } catch (error) {
      console.error('Image processing error:', error);
      throw error;
    }
  }

  async uploadToCloudinary(filePath, options = {}) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'auto',
        ...options
      });

      return result;

    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  async deleteFromCloudinary(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;

    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  }

  async generateImageVariants(publicId, variants = []) {
    try {
      const results = [];

      for (const variant of variants) {
        const url = cloudinary.url(publicId, {
          transformation: variant.transformation,
          format: variant.format || 'auto',
          quality: variant.quality || 'auto'
        });

        results.push({
          name: variant.name,
          url,
          transformation: variant.transformation
        });
      }

      return results;

    } catch (error) {
      console.error('Generate image variants error:', error);
      throw error;
    }
  }

  async optimizeExistingImages(publicIds) {
    try {
      const results = [];

      for (const publicId of publicIds) {
        try {
          // Get image info
          const resource = await cloudinary.api.resource(publicId);
          
          // Generate optimized version
          const optimizedUrl = cloudinary.url(publicId, {
            transformation: [
              { quality: 'auto' },
              { format: 'auto' },
              { fetch_format: 'auto' }
            ]
          });

          results.push({
            publicId,
            originalSize: resource.bytes,
            optimizedUrl,
            status: 'success'
          });

        } catch (error) {
          results.push({
            publicId,
            status: 'error',
            error: error.message
          });
        }
      }

      return results;

    } catch (error) {
      console.error('Optimize existing images error:', error);
      throw error;
    }
  }

  async createImageCollage(images, options = {}) {
    try {
      const {
        width = 800,
        height = 600,
        layout = 'grid',
        spacing = 10
      } = options;

      // Download images
      const imageBuffers = await Promise.all(
        images.map(async (imageUrl) => {
          const response = await fetch(imageUrl);
          return await response.buffer();
        })
      );

      // Create collage based on layout
      let collage;
      if (layout === 'grid') {
        collage = await this.createGridCollage(imageBuffers, { width, height, spacing });
      } else if (layout === 'horizontal') {
        collage = await this.createHorizontalCollage(imageBuffers, { width, height, spacing });
      }

      // Save collage
      const collagePath = path.join(process.cwd(), 'temp', `collage_${Date.now()}.webp`);
      await collage.webp({ quality: 80 }).toFile(collagePath);

      // Upload to Cloudinary
      const result = await this.uploadToCloudinary(collagePath, {
        folder: 'farm-marketplace/collages'
      });

      // Clean up
      fs.unlinkSync(collagePath);

      return result;

    } catch (error) {
      console.error('Create image collage error:', error);
      throw error;
    }
  }

  async createGridCollage(imageBuffers, options) {
    const { width, height, spacing } = options;
    const cols = Math.ceil(Math.sqrt(imageBuffers.length));
    const rows = Math.ceil(imageBuffers.length / cols);
    
    const cellWidth = Math.floor((width - spacing * (cols + 1)) / cols);
    const cellHeight = Math.floor((height - spacing * (rows + 1)) / rows);

    const collage = sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    });

    const composite = [];

    for (let i = 0; i < imageBuffers.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      const left = spacing + col * (cellWidth + spacing);
      const top = spacing + row * (cellHeight + spacing);

      const resizedImage = await sharp(imageBuffers[i])
        .resize(cellWidth, cellHeight, { fit: 'cover' })
        .toBuffer();

      composite.push({
        input: resizedImage,
        left,
        top
      });
    }

    return collage.composite(composite);
  }

  async createHorizontalCollage(imageBuffers, options) {
    const { width, height, spacing } = options;
    const cellWidth = Math.floor((width - spacing * (imageBuffers.length + 1)) / imageBuffers.length);

    const collage = sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    });

    const composite = [];

    for (let i = 0; i < imageBuffers.length; i++) {
      const left = spacing + i * (cellWidth + spacing);
      const top = spacing;

      const resizedImage = await sharp(imageBuffers[i])
        .resize(cellWidth, height - 2 * spacing, { fit: 'cover' })
        .toBuffer();

      composite.push({
        input: resizedImage,
        left,
        top
      });
    }

    return collage.composite(composite);
  }
}

export default new ImageService();