#!/usr/bin/env node
/**
 * Migration: Geocode existing shops missing normalized geo fields.
 * - Finds shops where location.coordinates missing OR city_slug/area_slug empty OR needs_geocoding=true
 * - Attempts Mapple geocode first, fallback to existing geocodingService
 * - Updates location, city_name/area_name + slugs
 * - Writes failures to migration_failures.csv in project root
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Shop from '../../models/Shop.js';
import { geocodeAddress as mappleGeocode } from '../../services/mappleService.js';
import { geocodeAddress as fallbackGeocode } from '../../services/geocodingService.js';
import logger from '../../config/logger.js';
import { connectDB } from '../../config/database.js';

dotenv.config();

const BATCH_SIZE = parseInt(process.env.MIGRATION_BATCH_SIZE || '50', 10);
const SLEEP_MS = parseInt(process.env.MIGRATION_SLEEP_MS || '500', 10);
const MAX_ATTEMPTS = 2;

const failureRows = [];

function slugify(str) {
  return (str || '')
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function processShop(shop) {
  const addressString = shop.address?.raw || [
    shop.address?.street,
    shop.address?.locality,
    shop.address?.city,
    shop.address?.state,
    shop.address?.postalCode,
    shop.address?.country || 'India',
  ].filter(Boolean).join(', ');

  let geo = await mappleGeocode(addressString);
  if (!geo?.success) {
    geo = await fallbackGeocode(addressString);
  }
  if (!geo?.success) {
    failureRows.push(`${shop._id},"${addressString.replace(/"/g,'"')}" ,${geo?.error || 'Unknown error'}`);
    shop.needs_geocoding = true;
    return shop.save();
  }

  shop.location = { type: 'Point', coordinates: [geo.longitude, geo.latitude] };
  const city = geo.city || shop.address.city || '';
  const locality = geo.locality || geo.street || shop.address.locality || '';
  shop.address.city = city;
  shop.address.locality = locality;
  shop.address.state = geo.state || shop.address.state;
  shop.address.postalCode = geo.postalCode || shop.address.postalCode;
  shop.address.country = geo.country || shop.address.country || 'India';
  shop.city_name = city || undefined;
  shop.area_name = locality || undefined;
  shop.city_slug = city ? slugify(city) : undefined;
  shop.area_slug = locality ? slugify(locality) : undefined;
  shop.needs_geocoding = false;
  return shop.save();
}

async function run() {
  await connectDB();
  logger.info('[migration] Starting geocode_shops');

  const criteria = {
    $or: [
      { 'location.coordinates': { $exists: false } },
      { city_slug: { $in: [null, ''] } },
      { area_slug: { $in: [null, ''] } },
      { needs_geocoding: true },
    ],
  };

  let processed = 0;
  while (true) {
    const shops = await Shop.find(criteria).limit(BATCH_SIZE).exec();
    if (!shops.length) break;
    for (const shop of shops) {
      try {
        await processShop(shop);
        processed += 1;
      } catch (e) {
        failureRows.push(`${shop._id},"${e.message.replace(/"/g,'"')}"`);
        logger.warn(`[migration] Failed shop ${shop._id}: ${e.message}`);
      }
      await sleep(SLEEP_MS);
    }
    logger.info(`[migration] Processed batch, total processed: ${processed}`);
  }

  if (failureRows.length) {
    const outPath = path.join(process.cwd(), 'migration_failures.csv');
    const header = 'shop_id,address,error';
    fs.writeFileSync(outPath, header + '\n' + failureRows.join('\n'));
    logger.warn(`[migration] Failures written to ${outPath} (${failureRows.length})`);
  } else {
    logger.info('[migration] No failures recorded');
  }

  logger.info(`[migration] Completed. Total shops updated: ${processed}`);
  await mongoose.disconnect();
}

run().catch(e => {
  logger.error('[migration] Fatal error', e);
  process.exit(1);
});
