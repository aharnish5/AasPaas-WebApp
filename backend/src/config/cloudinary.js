import { v2 as cloudinary } from 'cloudinary';
import logger from './logger.js';

let initialized = false;

export function initCloudinary() {
  if (initialized) return;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
    logger.info('[cloudinary] initialized');
    initialized = true;
  }
}

export function buildTransformedUrl(publicId, transforms = {}) {
  // Basic transformation builder for future use (e.g., thumbnails)
  // transforms: { width, height, crop, quality, format, flags }
  if (!publicId) return null;
  const parts = [];
  if (transforms.width) parts.push(`w_${transforms.width}`);
  if (transforms.height) parts.push(`h_${transforms.height}`);
  if (transforms.crop) parts.push(`c_${transforms.crop}`);
  if (transforms.quality) parts.push(`q_${transforms.quality}`);
  if (transforms.format) parts.push(`f_${transforms.format}`);
  if (transforms.flags) parts.push(`fl_${transforms.flags}`);
  const transformStr = parts.join(',');
  const base = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
  return transformStr ? `${base}/${transformStr}/${publicId}` : `${base}/${publicId}`;
}

export { cloudinary };
