/**
 * Migration script: Move legacy local/S3-hosted shop images to Cloudinary and update DB references.
 * Idempotent: re-running will skip already migrated (Cloudinary) URLs.
 * Dry-run mode: set DRY_RUN=true to only log intended actions.
 *
 * Usage:
 *   node src/scripts/migrateShopImagesCloudinary.js            # full run
 *   DRY_RUN=true node src/scripts/migrateShopImagesCloudinary.js  # dry run
 *
 * Environment prerequisites:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   MONGODB_URI
 */
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import Shop from '../models/Shop.js';
import logger from '../config/logger.js';

const DRY_RUN = process.env.DRY_RUN === 'true';
const LOCAL_UPLOAD_ROOT = process.env.LOCAL_UPLOAD_ROOT || path.resolve('uploads');

const isCloudinaryUrl = (url) => /res\.cloudinary\.com\//.test(url);
const isLocalUrl = (url) => /(^\/uploads\/|\/uploads\/)/.test(url) || /\/uploads\//.test(url);
const isS3Url = (url) => /s3\.amazonaws\.com\//.test(url);

async function configure() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary env vars missing; cannot run migration');
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  await mongoose.connect(process.env.MONGODB_URI, {
    autoIndex: false,
  });
}

async function migrateShop(shop) {
  let modified = false;
  for (const img of shop.images) {
    if (!img?.url || isCloudinaryUrl(img.url)) continue; // already migrated or missing

    let sourceBuffer = null;
    let filenameBase = path.basename(img.url).replace(/\.(jpg|jpeg|png|webp)$/i, '') || `legacy-${Date.now()}`;

    if (isLocalUrl(img.url)) {
      // Local path like /uploads/shops/<id>/file.jpg
      const relative = img.url.replace(/^.*\/uploads\//, '');
      const diskPath = path.join(LOCAL_UPLOAD_ROOT, relative);
      try {
        sourceBuffer = await fs.readFile(diskPath);
      } catch (e) {
        logger.warn(`[migrate] Missing local file for shop ${shop._id}: ${diskPath}`);
        continue; // skip without marking modified
      }
    } else if (isS3Url(img.url)) {
      // For S3 we can't easily fetch without public access; attempt HTTPS fetch.
      try {
        const res = await fetch(img.url);
        if (!res.ok) {
          logger.warn(`[migrate] Failed HTTP fetch for S3 image ${img.url}`);
          continue;
        }
        sourceBuffer = Buffer.from(await res.arrayBuffer());
      } catch (e) {
        logger.warn(`[migrate] Fetch error for S3 image ${img.url}: ${e.message}`);
        continue;
      }
    } else {
      // Unknown pattern; skip
      continue;
    }

    if (!sourceBuffer) continue;

    if (DRY_RUN) {
      logger.info(`[dry-run] Would migrate image for shop ${shop._id} legacyUrl=${img.url}`);
      continue;
    }

    // Upload to Cloudinary under shops/<shopId>
    const folder = `shops/${shop._id}`;
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
          folder,
          public_id: filenameBase,
          resource_type: 'image',
        }, (error, res) => {
          if (error) return reject(error);
          resolve(res);
        });
        stream.end(sourceBuffer);
      });
      img.url = result.secure_url;
      img.publicId = result.public_id;
      modified = true;
      logger.info(`[migrate] Migrated image for shop ${shop._id} -> ${img.url}`);
    } catch (e) {
      logger.error(`[migrate] Cloudinary upload failed for shop ${shop._id}: ${e.message}`);
    }
  }
  if (modified && !DRY_RUN) {
    await shop.save();
  }
}

async function run() {
  await configure();
  const query = { 'images.0': { $exists: true } }; // shops with at least one image
  const cursor = Shop.find(query).cursor();
  let processed = 0;
  for await (const shop of cursor) {
    await migrateShop(shop);
    processed++;
    if (processed % 50 === 0) {
      logger.info(`[migrate] Processed ${processed} shops`);
    }
  }
  logger.info(`[migrate] Completed. Shops processed=${processed} dryRun=${DRY_RUN}`);
  await mongoose.disconnect();
}

run().catch((e) => {
  logger.error(`[migrate] Fatal error: ${e.message}`);
  process.exit(1);
});
