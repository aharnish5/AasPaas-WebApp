import AWS from 'aws-sdk';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger.js';
import path from 'path';
import fs from 'fs/promises';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION || 'us-east-1',
});

const BUCKET_NAME = process.env.S3_BUCKET;
const USE_LOCAL = !BUCKET_NAME;
const LOCAL_UPLOAD_ROOT = process.env.LOCAL_UPLOAD_ROOT || path.resolve('uploads');
// Prefer explicit PUBLIC/BASE URL, else Render-provided external URL, else localhost
const RAW_BASE_URL =
  process.env.PUBLIC_BASE_URL ||
  process.env.BASE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${process.env.PORT || 5000}`;
// Normalize: drop trailing slash to avoid double // in generated URLs
const BASE_URL = typeof RAW_BASE_URL === 'string' ? RAW_BASE_URL.replace(/\/$/, '') : RAW_BASE_URL;

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

    if (USE_LOCAL) {
      // Local disk fallback for development when S3 is not configured
      const destDir = path.join(LOCAL_UPLOAD_ROOT, folder);
      await fs.mkdir(destDir, { recursive: true });
  const destPath = path.join(LOCAL_UPLOAD_ROOT, key);
      await fs.writeFile(destPath, optimizedBuffer);
      const urlPath = key.replace(/\\/g, '/');
  // Prefer /media path to avoid aggressive ad blockers matching '.../uploads'
  const url = `${BASE_URL}/media/${urlPath}`;
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
    if (USE_LOCAL) {
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

    if (USE_LOCAL) {
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
      const url = `${BASE_URL}/uploads/${newKey.replace(/\\/g, '/')}`;
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

    if (USE_LOCAL) {
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

