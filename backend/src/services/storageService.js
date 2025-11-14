import AWS from 'aws-sdk';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger.js';
import path from 'path';
import fs from 'fs/promises';
import { v2 as cloudinary } from 'cloudinary';

// Detect Cloudinary configuration (takes precedence over S3/local if present)
const HAS_CLOUDINARY = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (HAS_CLOUDINARY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  logger.info('[storageService] Using Cloudinary as image storage provider');
}

// Configure AWS S3 (used only if Cloudinary not configured)
const s3 = !HAS_CLOUDINARY
  ? new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.S3_REGION || 'us-east-1',
    })
  : null;

const BUCKET_NAME = HAS_CLOUDINARY ? undefined : process.env.S3_BUCKET;
const USE_LOCAL = !HAS_CLOUDINARY && !BUCKET_NAME;
const LOCAL_UPLOAD_ROOT = process.env.LOCAL_UPLOAD_ROOT || path.resolve('uploads');
// Prefer explicitly provided public URL; if not set, we will emit relative URLs
const RAW_PUBLIC_BASE =
  process.env.PUBLIC_BASE_URL || process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || '';
const BASE_URL = RAW_PUBLIC_BASE ? RAW_PUBLIC_BASE.replace(/\/$/, '') : undefined;

/**
 * Upload image to S3 with optimization
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} folder - Folder path (e.g., 'pending', 'shops/{shopId}')
 * @param {object} options - Upload options
 * @returns {Promise<object>} Upload result with URL and key
 */
export const uploadImage = async (imageBuffer, folder = 'uploads', options = {}) => {
  try {
    const {
      filename,
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 85,
      format = 'jpeg',
    } = options;

    // Generate unique filename
    const fileExtension = format === 'jpeg' ? 'jpg' : format;
    const uniqueFilename = filename || `${uuidv4()}.${fileExtension}`;
    const key = `${folder}/${uniqueFilename}`;

    // Optimize image
    let optimizedBuffer = imageBuffer;
    try {
      optimizedBuffer = await sharp(imageBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality })
        .toBuffer();
    } catch (error) {
      logger.warn('Image optimization failed, uploading original:', error.message);
      optimizedBuffer = imageBuffer;
    }

    if (HAS_CLOUDINARY) {
      // Cloudinary upload (stream to support large buffers efficiently)
      const publicIdBase = (filename || uuidv4()).replace(/\.(jpg|jpeg|png|webp)$/i, '');
      const folderPath = folder.replace(/\.$/, '');
      const uploadOptions = {
        folder: folderPath,
        public_id: publicIdBase,
        resource_type: 'image',
        overwrite: false,
        transformation: [], // Keep original; transformations added on delivery via URL params
      };

      // We do NOT pre-optimize with sharp when using Cloudinary; let Cloudinary handle formats.
      // However, if desired, we could still resize before upload to cap huge originals.
      const toUploadBuffer = optimizedBuffer; // after optional local sharp step
      const maxAttempts = 3;
      let attempt = 0;
      let lastErr;
      let result;
      while (attempt < maxAttempts) {
        try {
          result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, res) => {
              if (error) return reject(error);
              resolve(res);
            });
            uploadStream.end(toUploadBuffer);
          });
          break; // success
        } catch (e) {
          lastErr = e;
          attempt++;
          logger.warn(`Cloudinary upload attempt ${attempt} failed: ${e.message}`);
          if (attempt < maxAttempts) {
            const delay = 200 * Math.pow(2, attempt); // simple backoff
            await new Promise(r => setTimeout(r, delay));
          }
        }
      }
      if (!result) {
        throw new Error(`Cloudinary upload failed after ${maxAttempts} attempts: ${lastErr?.message}`);
      }

      const key = `${folderPath}/${publicIdBase}`; // Cloudinary public_id with folder
      const url = result.secure_url;
      logger.info(`Image uploaded to Cloudinary: ${key}`);
      return { url, key, bucket: 'cloudinary', publicId: result.public_id };    
    } else if (USE_LOCAL) {
      // Local disk fallback for development when S3 is not configured
      const destDir = path.join(LOCAL_UPLOAD_ROOT, folder);
      await fs.mkdir(destDir, { recursive: true });
      const destPath = path.join(LOCAL_UPLOAD_ROOT, key);
      await fs.writeFile(destPath, optimizedBuffer);
  const urlPath = key.replace(/\\/g, '/');
  const url = BASE_URL ? `${BASE_URL}/uploads/${urlPath}` : `/uploads/${urlPath}`;
      logger.info(`Image saved locally: ${destPath}`);
      return { url, key, bucket: 'local' };
    } else {
      // Upload to S3
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: optimizedBuffer,
        ContentType: `image/${fileExtension}`,
        ACL: 'public-read', // Make publicly accessible
      };

      const result = await s3.upload(uploadParams).promise();

      logger.info(`Image uploaded to S3: ${key}`);

      return {
        url: result.Location,
        key: result.Key,
        bucket: BUCKET_NAME,
      };
    }
  } catch (error) {
    logger.error('S3 upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Delete image from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
export const deleteImage = async (key) => {
  try {
    if (HAS_CLOUDINARY) {
      // key is folder/publicIdBase
      const publicId = key.replace(/\.(jpg|jpeg|png|webp)$/i, ''); // tolerate legacy keys with extension
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      } catch (e) {
        // If not found, swallow error to maintain idempotency
        if (e?.http_code !== 404) throw e;
      }
      logger.info(`Image deleted from Cloudinary: ${publicId}`);
    } else if (USE_LOCAL) {
      const filePath = path.join(LOCAL_UPLOAD_ROOT, key);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        if (err.code !== 'ENOENT') throw err; // ignore missing files
      }
      logger.info(`Image deleted from local: ${key}`);
    } else {
      await s3.deleteObject({
        Bucket: BUCKET_NAME,
        Key: key,
      }).promise();

      logger.info(`Image deleted from S3: ${key}`);
    }
  } catch (error) {
    logger.error('S3 delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Move image from one folder to another
 * @param {string} sourceKey - Source S3 key
 * @param {string} destinationFolder - Destination folder
 * @returns {Promise<object>} New URL and key
 */
export const moveImage = async (sourceKey, destinationFolder) => {
  try {
    const filename = path.basename(sourceKey);
    const newKey = `${destinationFolder}/${filename}`;

    if (HAS_CLOUDINARY) {
      // Rename asset inside Cloudinary (treat keys without extension for public_id consistency)
      const oldPublicIdBase = sourceKey.replace(/\.(jpg|jpeg|png|webp)$/i, '').replace(/\\/g, '/');
      const newPublicIdBase = newKey.replace(/\.(jpg|jpeg|png|webp)$/i, '').replace(/\\/g, '/');
      const renameResult = await cloudinary.uploader.rename(oldPublicIdBase, newPublicIdBase, {
        resource_type: 'image',
        overwrite: false,
      });
      const url = renameResult.secure_url;
      logger.info(`Image moved on Cloudinary from ${oldPublicIdBase} to ${newPublicIdBase}`);
      return { url, key: newKey, publicId: renameResult.public_id };
    } else if (USE_LOCAL) {
      const srcPath = path.join(LOCAL_UPLOAD_ROOT, sourceKey);
      const destPath = path.join(LOCAL_UPLOAD_ROOT, newKey);
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      try {
        await fs.rename(srcPath, destPath);
      } catch (err) {
        // Cross-device fallback: copy then unlink
        if (err.code === 'EXDEV') {
          const data = await fs.readFile(srcPath);
          await fs.writeFile(destPath, data);
          await fs.unlink(srcPath);
        } else {
          throw err;
        }
      }
      const url = BASE_URL
        ? `${BASE_URL}/uploads/${newKey.replace(/\\/g, '/')}`
        : `/uploads/${newKey.replace(/\\/g, '/')}`;
      logger.info(`Image moved locally from ${sourceKey} to ${newKey}`);
      return { url, key: newKey };
    } else {
      // S3 copy
      await s3.copyObject({
        Bucket: BUCKET_NAME,
        CopySource: `${BUCKET_NAME}/${sourceKey}`,
        Key: newKey,
        ACL: 'public-read',
      }).promise();

      // Delete original
      await deleteImage(sourceKey);

      // Public URL
      const url = `https://${BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${newKey}`;
      logger.info(`Image moved from ${sourceKey} to ${newKey}`);
      return { url, key: newKey };
    }
  } catch (error) {
    logger.error('S3 move error:', error);
    throw new Error(`Failed to move image: ${error.message}`);
  }
};

/**
 * Generate presigned URL for direct client upload (optional)
 * @param {string} folder - Folder path
 * @param {object} options - Upload options
 * @returns {Promise<object>} Presigned URL and key
 */
export const generatePresignedUrl = async (folder = 'uploads', options = {}) => {
  try {
    const {
      filename,
      contentType = 'image/jpeg',
      expiresIn = 3600, // 1 hour
    } = options;

    const fileExtension = contentType.split('/')[1];
    const uniqueFilename = filename || `${uuidv4()}.${fileExtension}`;
    const key = `${folder}/${uniqueFilename}`;

    if (HAS_CLOUDINARY) {
      // For Cloudinary we typically use unsigned upload presets or signed server-side upload.
      // Presigned PUT URLs are S3-specific; throw to indicate unsupported path here.
      throw new Error('Presigned URL generation not supported for Cloudinary via this endpoint');
    } else if (USE_LOCAL) {
      throw new Error('Presigned URLs are not supported in local storage mode');
    }

    const presignedUrl = s3.getSignedUrl('putObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Expires: expiresIn,
      ACL: 'public-read',
    });

    return {
      presignedUrl,
      key,
      url: `https://${BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`,
    };
  } catch (error) {
    logger.error('Presigned URL generation error:', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

