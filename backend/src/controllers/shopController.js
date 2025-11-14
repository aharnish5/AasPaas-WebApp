import Shop from '../models/Shop.js';
import { uploadImage, moveImage, deleteImage } from '../services/storageService.js';
import { processShopImage } from '../services/ocrService.js';
import { inferShopFromImage } from '../services/geminiService.js';
import { geocodeAddress as geocode, normalizeAddress, reverseGeocode } from '../services/geocodingService.js';
import { searchPlaces } from '../services/geocodingService.js';
import { hasGooglePlaces, autocompletePlaces, getPlaceDetails } from '../services/googlePlacesService.js';
// Photon deprecated
// import { searchPhoton } from '../services/photonService.js';
import { geocodeAddress as mappleGeocode } from '../services/mappleService.js';
import logger from '../config/logger.js';
import mongoose from 'mongoose';

// Store OCR results temporarily (in production, use Redis or DB)
const ocrResults = new Map();

// Upload shop image and trigger OCR
export const uploadShopImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file required' });
    }

    const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Upload to S3 in pending folder
    const uploadResult = await uploadImage(req.file.buffer, 'pending', {
      filename: `${uploadId}.jpg`,
    });

    // Process OCR (now guaranteed safe fallback from processShopImage)
    const ocrData = await processShopImage(req.file.buffer);
    ocrResults.set(uploadId, {
      ...ocrData,
      uploadId,
      imageUrl: uploadResult.url,
      imageKey: uploadResult.key,
      publicId: uploadResult.publicId || undefined,
      createdAt: new Date(),
    });
    logger.info(`OCR processed for uploadId: ${uploadId} method=${ocrData.ocrMethod} error=${ocrData.ocrError || 'none'}`);

    res.json({
      uploadId,
      tempUrl: uploadResult.url,
      imageKey: uploadResult.key,
      publicId: uploadResult.publicId || null,
    });
  } catch (error) {
    next(error);
  }
};

// AI infer business details from a single image (also uploads it and returns uploadId)
export const inferFromImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file required' });
    }

    // 1) Upload to temporary storage (pending) and create uploadId
    const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const uploadResult = await uploadImage(req.file.buffer, 'pending', {
      filename: `${uploadId}.jpg`,
    });

    // Store in OCR map so createShop can move it later
    ocrResults.set(uploadId, {
      uploadId,
      imageUrl: uploadResult.url,
      imageKey: uploadResult.key,
      publicId: uploadResult.publicId || undefined,
      createdAt: new Date(),
    });

    // 2) Extract OCR hints (best-effort)
    // Always safe now; processShopImage returns fallback instead of throwing
    const ocr = await processShopImage(req.file.buffer);
    const ocrHint = {
      signageText: ocr?.extractedName || '',
      addressText: ocr?.extractedAddress || '',
    };

    // 3) Call Gemini to infer details (with OCR hints)
    const ai = await inferShopFromImage(req.file.buffer, req.file.mimetype, ocrHint || undefined);

    // 4) Normalize AI result and map to our fields (best-effort)
    const aiResult = ai.success ? {
      name: ai.name || undefined,
      businessType: ai.businessType,
      tags: ai.tags,
      description: ai.description,
      suggestedCategory: ai.category,
      categoryRaw: ai.categoryRaw,
      address: ai.address,
      phoneNumber: ai.phoneNumber,
      confidence: ai.confidence,
      raw: ai.raw,
    } : null;

    return res.json({
      uploadId,
      tempUrl: uploadResult.url,
      imageKey: uploadResult.key,
      publicId: uploadResult.publicId || null,
      ai: aiResult,
      error: ai.success ? undefined : (ai.error || 'Inference unavailable'),
    });
  } catch (error) {
    next(error);
  }
};

// Get OCR result by uploadId
export const getOcrResult = async (req, res, next) => {
  try {
    const { uploadId } = req.query;

    if (!uploadId) {
      return res.status(400).json({ error: 'uploadId required' });
    }

    const result = ocrResults.get(uploadId);

    if (!result) {
      return res.status(404).json({ error: 'OCR result not found' });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Create shop
// Simple slugify for Indian city/area names (ASCII-only, lowercase, hyphens)
const slugify = (str) =>
  (str || '')
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const createShop = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      address,
      location,
      hours,
      phone,
      uploadIds = [], // Array of uploadIds from image uploads
      phoneNumber, // allow alternative field name from AI merge
      priceRange,
      averagePrice,
    } = req.body;

    // DEBUG LOGGING (temporary) - capture incoming payload shape
    logger.info('[createShop] Incoming payload', {
      name,
      hasCategory: !!category,
      addressType: typeof address,
      addressRaw: address?.raw || (typeof address === 'string' ? address : undefined),
      hasLocation: !!location,
      coords: location?.coordinates,
      uploadIdsLength: Array.isArray(uploadIds) ? uploadIds.length : 'not-array',
    });

    // Validate required top-level fields
    if (!name || !category || !address) {
      return res.status(400).json({
        error: 'Name, category, and address are required',
        details: [
          !name && 'Missing name',
          !category && 'Missing category',
          !address && 'Missing address',
        ].filter(Boolean),
      });
    }

    // Determine coordinates: prefer provided location; else geocode address (Mapple first, fallback to configured geocoder)
    let finalCoords = null; // [lon, lat]
    let normCity = address?.city || '';
    let normLocality = address?.locality || '';
    let normState = address?.state || '';
    let normPostal = address?.postalCode || '';
    let normCountry = address?.country || 'India';
    let formattedAddress = address?.raw || (typeof address === 'string' ? address : '');

    const coordsValid = (coords) => Array.isArray(coords) && coords.length === 2 && coords.every((c) => typeof c === 'number' && !Number.isNaN(c));

    if (location && coordsValid(location.coordinates)) {
      finalCoords = location.coordinates;
    } else {
      const addressString = address?.raw ||
        [address?.street, address?.locality, address?.city, address?.state, address?.postalCode, address?.country || 'India']
          .filter(Boolean)
          .join(', ');

      // Try Mapple first
      let g = await mappleGeocode(addressString);
      if (!g?.success) {
        g = await geocode(addressString);
      }
      if (!g?.success) {
        return res.status(400).json({
          error: 'Could not geocode address to coordinates',
          details: g?.error || 'Geocoding failed',
        });
      }
      finalCoords = [g.longitude, g.latitude];
      formattedAddress = g.formattedAddress || formattedAddress;
      normCity = g.city || normCity;
      normLocality = g.locality || normLocality || g.street || '';
      normState = g.state || normState;
      normPostal = g.postalCode || normPostal;
      normCountry = g.country || normCountry || 'India';
    }

    // IMPORTANT: Do NOT move images yet. We first create the shop to obtain its _id, then move
    // pending images directly from their original pending location to shops/{shop._id}. This avoids
    // double moves and ensures consistent storage path. We'll collect OCR data before deletion.

    // Get OCR data from first upload if available
    let ocrData = null;
    if (uploadIds.length > 0) {
      const firstOcr = ocrResults.get(uploadIds[0]);
      if (firstOcr) {
        ocrData = {
          extractedName: firstOcr.extractedName || '',
          extractedAddress: firstOcr.extractedAddress || '',
          confidence: firstOcr.confidence || 0,
          processedAt: firstOcr.createdAt || new Date(),
        };
      }
    }

    // Create shop
    const shop = await Shop.create({
      ownerId: req.userId,
      name,
      description,
      category,
      images: [], // will be populated after we have shop._id
      address: {
        raw: formattedAddress || address?.raw || address,
        street: address?.street || '',
        locality: normLocality || '',
        city: normCity || '',
        state: normState || '',
        postalCode: normPostal || '',
        country: normCountry || 'India',
      },
      location: {
        type: 'Point',
        coordinates: finalCoords, // [longitude, latitude]
      },
      hours: hours || [],
      phone: phone || phoneNumber || undefined,
      status: 'live', // Auto-approve for MVP
      ocrData,
      priceRange: priceRange || undefined,
      averagePrice: averagePrice !== undefined ? averagePrice : undefined,
      // set normalized slugs for city & area
      city_name: normCity || undefined,
      area_name: normLocality || undefined,
      city_slug: normCity ? slugify(normCity) : undefined,
      area_slug: normLocality ? slugify(normLocality) : undefined,
    });

    // Move each pending image directly to shop-specific folder now that we have shop._id
    const finalImages = [];
    for (const uploadId of uploadIds) {
      const ocrResult = ocrResults.get(uploadId);
      if (ocrResult && ocrResult.imageKey) {
        try {
          logger.info(`[createShop] Moving pending image uploadId=${uploadId} to shop folder shopId=${shop._id}`);
          const movedImage = await moveImage(ocrResult.imageKey, `shops/${shop._id}`);
          finalImages.push({
            url: movedImage.url,
            caption: '',
            uploadedBy: req.userId,
            publicId: movedImage.publicId || ocrResult.publicId || undefined,
          });
        } catch (e) {
          logger.error(`[createShop] Failed to move pending image ${uploadId}:`, e);
        }
      } else {
        logger.warn(`[createShop] uploadId ${uploadId} missing or imageKey not found for shopId=${shop._id}`);
      }
      // Clean up regardless to avoid leak
      ocrResults.delete(uploadId);
    }
    if (finalImages.length) {
      shop.images = finalImages;
      await shop.save();
      logger.info(`[createShop] Attached ${finalImages.length} images to shop ${shop._id}`);
    } else {
      logger.info('[createShop] No images attached (finalImages length 0)');
    }

    // Clean up remaining OCR results
    uploadIds.forEach((id) => ocrResults.delete(id));

    res.status(201).json({
      message: 'Shop created successfully',
      shop,
    });
  } catch (error) {
    // Provide more granular Mongoose validation feedback
    if (error?.name === 'ValidationError') {
      const details = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        error: 'Validation failed',
        details,
      });
    }
    logger.error('[createShop] Unexpected error', { message: error.message, stack: error.stack });
    next(error);
  }
};

// Get shops with geospatial search
export const getShops = async (req, res, next) => {
  try {
    const {
      lat,
      lon,
      q, // Text query for location search
      radius = 3, // Reduced default radius (km) for tighter locality
      category,
      categoryId,
      categorySlug,
      minRating,
      page = 1,
      limit = 20,
      sort = 'proximity', // proximity, rating, newest
      ownerId, // Filter by owner (for vendor's own shops)
      locality, // New locality (area/neighborhood) filter
      priceRange,
      maxAveragePrice,
      minAveragePrice,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};
    
    // If ownerId is provided and user is authenticated, allow filtering by owner
    // Otherwise, only show live shops
    if (ownerId && req.userId && (req.userId.toString() === ownerId || req.user?.role === 'admin')) {
      query.ownerId = new mongoose.Types.ObjectId(ownerId);
      // Don't filter by status for owner's own shops - show all statuses
    } else {
      query.status = 'live';
    }

    // Category filter
    if (category) {
      query.category = category;
    }
    if (categoryId) {
      query.primaryCategory = categoryId; // direct ObjectId match
    }
    if (categorySlug) {
      // Resolve slug to Category _id (cache in memory for future optimization)
      const catModel = mongoose.models.Category || (await import('../models/Category.js')).default;
      const catDoc = await catModel.findOne({ slug: categorySlug }).select('_id');
      if (catDoc) {
        query.primaryCategory = catDoc._id;
      }
    }

    // Rating filter
    if (minRating) {
      query['ratings.avg'] = { $gte: parseFloat(minRating) };
    }
    // Price range filter
    if (priceRange) {
      query.priceRange = priceRange;
    }
    // Average price filters
    const avgFilters = {};
    if (minAveragePrice) avgFilters.$gte = parseFloat(minAveragePrice);
    if (maxAveragePrice) avgFilters.$lte = parseFloat(maxAveragePrice);
    if (Object.keys(avgFilters).length > 0) {
      query.averagePrice = avgFilters;
    }

    // Locality filter (exact match, case-insensitive)
    if (locality) {
      query['address.locality'] = { $regex: new RegExp(`^${locality}$`, 'i') };
    }

    // Handle text-based search (q parameter)
    let searchLat = lat ? parseFloat(lat) : null;
    let searchLon = lon ? parseFloat(lon) : null;

    // If q (query) is provided but no coordinates, try to geocode it
    if (q && !searchLat && !searchLon) {
      // IMPORTANT: use the geocoding service alias `geocode` (imported from geocodingService)
      // NOT the Express route handler `geocodeAddress` exported below. Previously this
      // mistakenly invoked the controller function with a string, causing `next is not a function`.
      const geocodeResult = await geocode(q);
      if (geocodeResult.success) {
        searchLat = geocodeResult.latitude;
        searchLon = geocodeResult.longitude;
        logger.info(`Geocoded "${q}" to coordinates: ${searchLat}, ${searchLon}`);
      } else {
        // Geocoding failed or unavailable - do granular tokenized text search on name and address fields
        logger.info(`Geocoding unavailable for "${q}", falling back to tokenized text search`);
        const parts = q.split(/\s+/).filter(Boolean);
        const safe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regexes = parts.map(p => new RegExp(safe(p), 'i'));
        const andClauses = regexes.map(r => ({
          $or: [
            { name: { $regex: r } },
            { 'address.raw': { $regex: r } },
            { 'address.city': { $regex: r } },
            { 'address.locality': { $regex: r } },
            { 'address.street': { $regex: r } },
          ],
        }));
        query.$and = andClauses;
        query.$or = [
          { name: { $regex: q, $options: 'i' } },
          { 'address.raw': { $regex: q, $options: 'i' } },
          { 'address.city': { $regex: q, $options: 'i' } },
          { 'address.locality': { $regex: q, $options: 'i' } },
          { 'address.street': { $regex: q, $options: 'i' } },
        ];
      }
    }

    // Geospatial query (skip if filtering by ownerId)
    let shops;
    if (ownerId && req.userId) {
      // For owner's own shops, skip geospatial query
      shops = await Shop.find(query)
        .limit(limitNum)
        .skip(skip)
        .select('-ocrData')
        .sort({ createdAt: -1 }); // Sort by newest first for owner's shops
    } else if (searchLat && searchLon) {
      const longitude = parseFloat(searchLon);
      const latitude = parseFloat(searchLat);
      const radiusInMeters = parseFloat(radius) * 1000; // Convert km to meters

      // Use MongoDB geospatial query
      shops = await Shop.find({
        ...query,
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: radiusInMeters,
          },
        },
      })
        .limit(limitNum)
        .skip(skip)
        .select('-ocrData');

      // Calculate distance for each shop
      shops = shops.map((shop) => {
        const distance = shop.calculateDistance(longitude, latitude);
        return {
          ...shop.toObject(),
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        };
      });

      // Sort by distance
      if (sort === 'proximity') {
        shops.sort((a, b) => a.distance - b.distance);
      }
    } else {
      // No location provided, get shops with text search if applicable
      shops = await Shop.find(query)
        .limit(limitNum)
        .skip(skip)
        .select('-ocrData');
    }

    // Additional sorting
    if (sort === 'rating') {
      shops.sort((a, b) => b.ratings.avg - a.ratings.avg);
    } else if (sort === 'newest') {
      shops.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Get total count for pagination
    const total = await Shop.countDocuments(query);

    res.json({
      shops,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get shop by ID
export const getShopById = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    const shop = await Shop.findById(shopId)
      .populate('ownerId', 'name email')
      .populate('images.uploadedBy', 'name');

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Calculate distance if user location provided
    if (req.query.lat && req.query.lon && shop.location.coordinates) {
      const distance = shop.calculateDistance(
        parseFloat(req.query.lon),
        parseFloat(req.query.lat)
      );
      shop.distance = Math.round(distance * 10) / 10;
    }

    res.json({ shop });
  } catch (error) {
    next(error);
  }
};

// Update shop (owner only)
export const updateShop = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Check ownership
    if (shop.ownerId.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this shop' });
    }

    // Update fields
    const {
      name,
      description,
      category,
      address,
      location,
      hours,
      phone,
      status,
      uploadIds = [], // NEW: pending image upload IDs from edit form
      phoneNumber, // fallback if AI inference used in edit mode
      priceRange,
      averagePrice,
    } = req.body;

    logger.info('[updateShop] Incoming payload', {
      shopId,
      hasName: !!name,
      hasCategory: !!category,
      addressType: typeof address,
      addressRaw: address?.raw || (typeof address === 'string' ? address : undefined),
      hasLocation: !!location,
      coords: location?.coordinates,
      uploadIdsLength: Array.isArray(uploadIds) ? uploadIds.length : 'not-array',
    });

    if (name) shop.name = name;
    if (description !== undefined) shop.description = description;
    if (category) shop.category = category;
    if (address || location) {
      // Re-geocode if address changed OR no location provided but address present
      const addressString = address?.raw ||
        [address?.street, address?.locality, address?.city, address?.state, address?.postalCode, address?.country]
          .filter(Boolean)
          .join(', ');
      let updatedGeo = null;
      if (addressString) {
        updatedGeo = await mappleGeocode(addressString);
        if (!updatedGeo?.success) {
          updatedGeo = await geocode(addressString);
        }
      }

      // Update address fields
      const newAddress = {
        ...shop.address,
        ...(address || {}),
      };
      if (updatedGeo?.success) {
        newAddress.raw = updatedGeo.formattedAddress || newAddress.raw;
        newAddress.city = updatedGeo.city || newAddress.city;
        newAddress.locality = updatedGeo.locality || newAddress.locality;
        newAddress.state = updatedGeo.state || newAddress.state;
        newAddress.postalCode = updatedGeo.postalCode || newAddress.postalCode;
        newAddress.country = updatedGeo.country || newAddress.country || 'India';
        shop.location = {
          type: 'Point',
          coordinates: [updatedGeo.longitude, updatedGeo.latitude],
        };
        // Update slugs
        shop.city_name = newAddress.city || shop.city_name;
        shop.area_name = newAddress.locality || shop.area_name;
        shop.city_slug = newAddress.city ? slugify(newAddress.city) : shop.city_slug;
        shop.area_slug = newAddress.locality ? slugify(newAddress.locality) : shop.area_slug;
        shop.needs_geocoding = false;
      } else if (location && Array.isArray(location.coordinates)) {
        // Direct location update if provided explicitly
        shop.location = { type: 'Point', coordinates: location.coordinates };
      } else if (!shop.location?.coordinates) {
        shop.needs_geocoding = true; // mark for migration
      }
      shop.address = newAddress;
    }
    if (hours) shop.hours = hours;
    if (phone !== undefined || phoneNumber !== undefined) shop.phone = phone || phoneNumber;
    // Allow owner to toggle between 'live' and 'suspended'; admin can set any valid status
    if (status) {
      const allowedStatuses = ['pending','live','suspended'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      const isOwner = shop.ownerId.toString() === req.userId.toString();
      if (req.user.role === 'admin') {
        shop.status = status;
      } else if (isOwner) {
        // Owner can only toggle live/suspended
        if (['live','suspended'].includes(status)) {
          shop.status = status;
        } else {
          return res.status(403).json({ error: 'Owners can only change status to live or suspended' });
        }
      }
    }
  if (priceRange) shop.priceRange = priceRange;
  if (averagePrice !== undefined) shop.averagePrice = averagePrice;

    // Handle new pending images (similar logic to createShop final pass)
    const newImages = [];
    if (Array.isArray(uploadIds) && uploadIds.length) {
      for (const uploadId of uploadIds) {
        const ocrResult = ocrResults.get(uploadId);
        if (ocrResult && ocrResult.imageKey) {
          try {
            logger.info(`[updateShop] Moving pending image uploadId=${uploadId} to shop folder shopId=${shop._id}`);
            const movedImage = await moveImage(ocrResult.imageKey, `shops/${shop._id}`);
            newImages.push({
              url: movedImage.url,
              caption: '',
              uploadedBy: req.userId,
            });
          } catch (e) {
            logger.error(`[updateShop] Failed to move pending image ${uploadId}:`, e);
          }
        } else {
          logger.warn(`[updateShop] uploadId ${uploadId} missing or imageKey not found`);
        }
        ocrResults.delete(uploadId);
      }
    }
    if (newImages.length) {
      // Prepend new images so most recent shows first
      shop.images = [...newImages, ...shop.images];
    }

    await shop.save();
    if (newImages.length) {
      logger.info(`[updateShop] Attached ${newImages.length} new images to shop ${shop._id}`);
    }

    res.json({
      message: 'Shop updated successfully',
      shop,
      newImagesCount: newImages.length,
    });
  } catch (error) {
    next(error);
  }
};

// Delete shop (owner or admin)
export const deleteShop = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Check ownership or admin
    if (shop.ownerId.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this shop' });
    }

    // Delete images from S3
    for (const image of shop.images) {
      try {
        // Extract key from URL
        const urlParts = image.url.split('/');
        const key = urlParts.slice(-2).join('/'); // shops/{ownerId}/{filename}
        await deleteImage(key);
      } catch (error) {
        logger.error(`Failed to delete image ${image.url}:`, error);
      }
    }

    await Shop.findByIdAndDelete(shopId);

    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Add image to existing shop
export const addShopImage = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Image file required' });
    }

    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Check ownership
    if (shop.ownerId.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Upload image
    const uploadResult = await uploadImage(req.file.buffer, `shops/${shopId}`, {
      filename: `${Date.now()}.jpg`,
    });

    // Add to shop images
    shop.images.push({
      url: uploadResult.url,
      caption: req.body.caption || '',
      uploadedBy: req.userId,
      publicId: uploadResult.publicId || undefined,
    });

    await shop.save();

    res.json({
      message: 'Image added successfully',
      image: shop.images[shop.images.length - 1],
    });
  } catch (error) {
    next(error);
  }
};

// Geocode address to get coordinates
export const geocodeAddress = async (req, res, next) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const result = await geocode(address);

    if (!result.success) {
      return res.status(400).json({ 
        error: result.error || 'Failed to geocode address',
        location: null,
      });
    }

    res.json({
      location: {
        latitude: result.latitude,
        longitude: result.longitude,
        formattedAddress: result.formattedAddress || address,
        street: result.street || '',
        city: result.city || '',
        state: result.state || '',
        postalCode: result.postalCode || '',
        country: result.country || 'India',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Reverse geocode coordinates to get address
export const reverseGeocodeLocation = async (req, res, next) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const result = await reverseGeocode(latitude, longitude);

    if (!result.success) {
      // Even if reverse geocoding fails, try to extract city from formatted address
      logger.warn('Reverse geocoding failed, attempting to extract city from coordinates');
      
      // Return a basic response with coordinates as fallback
      return res.json({
        location: {
          formattedAddress: `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          city: '',
          state: '',
          country: 'India',
          street: '',
          postalCode: '',
          locality: '',
          displayName: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        },
      });
    }

    // Extract city name - prioritize city, then town, then village, then extract from formatted address
    let cityName = result.city || '';
    
    // If city is empty, try to extract from formatted address
    if (!cityName && result.formattedAddress) {
      const parts = result.formattedAddress.split(',');
      // Usually city is in the middle or near the end of the address
      // Try to find a city-like name (not a number, not too short)
      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i].trim();
        if (part.length > 2 && !/^\d+$/.test(part) && part !== 'India') {
          cityName = part;
          break;
        }
      }
    }
    
    const localityName = result.locality || '';
    
    // Build display name - prioritize city
    const displayName = cityName || localityName || result.formattedAddress?.split(',')[0]?.trim() || 'Your location';
    
    res.json({
      location: {
        formattedAddress: result.formattedAddress || '',
        city: cityName,
        state: result.state || '',
        country: result.country || 'India',
        street: result.street || '',
        postalCode: result.postalCode || '',
        locality: localityName || cityName || '',
        // Display name prioritizing city
        displayName: displayName,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Place suggestions (areas / cities / localities)
export const suggestPlaces = async (req, res, next) => {
  try {
    const { q, limit = 5, sessionToken, lat, lon } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }
    let suggestions = [];
    // 1) Mapple direct geocode attempt treated as suggestion (if high-confidence)
    try {
      const geocode = await mappleGeocode(q.trim());
      if (geocode?.success) {
        suggestions.push({
          provider: 'mapple',
          label: geocode.formattedAddress || q.trim(),
          displayName: geocode.formattedAddress || q.trim(),
          locality: geocode.locality || '',
          city: geocode.city || '',
          state: geocode.state || '',
          country: geocode.country || 'India',
          latitude: geocode.latitude,
          longitude: geocode.longitude,
          postalCode: geocode.postalCode || '',
          type: 'geocode',
        });
      }
    } catch (e) {
      logger.warn('Mapple geocode in suggestPlaces failed:', e?.message || e);
    }
    // 2) Google Places (optional) if configured
    if (hasGooglePlaces) {
      const ac = await autocompletePlaces(q.trim(), { sessionToken, limit: parseInt(limit) });
      if (ac.success) {
        const googleSuggestions = ac.predictions.map(p => ({
          provider: 'google',
          placeId: p.placeId,
          label: p.mainText || p.description.split(',')[0],
          displayName: p.description,
          locality: p.mainText || '',
          city: p.secondaryText?.split(',')[0]?.trim() || '',
          state: p.secondaryText?.split(',').slice(1).map(s=>s.trim()).find(s=>s && s.length>1) || '',
        }));
        suggestions.push(...googleSuggestions);
      }
    }
    // 3) Nominatim fallback (area/locality bias within India)
    if (suggestions.length < parseInt(limit)) {
      const remaining = parseInt(limit) - suggestions.length;
      try {
        const nominatim = await searchPlaces(q.trim(), remaining, { lat, lon, country: 'IN' });
        suggestions.push(...nominatim.map(s => ({ ...s, provider: 'nominatim' })));
      } catch (err) {
        logger.warn('Nominatim fallback failed:', err.message);
      }
    }
    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
};

// Place details endpoint (Google preferred)
export const placeDetails = async (req, res, next) => {
  try {
    const { placeId, sessionToken } = req.query;
    if (!placeId) {
      return res.status(400).json({ error: 'placeId required' });
    }
    if (!hasGooglePlaces) {
      return res.status(400).json({ error: 'Google Places not configured' });
    }
    const details = await getPlaceDetails(placeId, { sessionToken });
    if (!details.success) {
      return res.status(400).json({ error: details.error || 'Failed to fetch place details' });
    }
    res.json({ place: details.details });
  } catch (error) {
    next(error);
  }
};

// POST /api/shops/search
// Body: { city_slug, center: { lat, lon }, radiusMeters, query, category, page, limit }
export const searchShops = async (req, res, next) => {
  try {
    const {
      city_slug,
      center,
      radiusMeters = 3000,
      query: textQuery,
      category,
      categoryId,
      page = 1,
      limit = 20,
      minRating,
      priceRange,
      maxAveragePrice,
      minAveragePrice,
    } = req.body || {};

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    if (!center || typeof center.lat !== 'number' || typeof center.lon !== 'number') {
      return res.status(400).json({ error: 'center.lat and center.lon are required numbers' });
    }
    const lat = center.lat;
    const lon = center.lon;
    const maxDistance = Math.max(1, parseInt(radiusMeters)); // meters

    // Base match: live shops only
    const match = { status: 'live' };
    if (city_slug) {
      match.city_slug = city_slug.toString().trim().toLowerCase();
    }
    if (category) {
      match.category = category;
    }
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      match.primaryCategory = new mongoose.Types.ObjectId(categoryId);
    }
    if (minRating) {
      match['ratings.avg'] = { $gte: parseFloat(minRating) };
    }
    if (priceRange) {
      match.priceRange = priceRange;
    }
    if (maxAveragePrice || minAveragePrice) {
      match.averagePrice = {};
      if (minAveragePrice) match.averagePrice.$gte = parseFloat(minAveragePrice);
      if (maxAveragePrice) match.averagePrice.$lte = parseFloat(maxAveragePrice);
    }
    if (textQuery) {
      const q = textQuery.toString().trim();
      // Split query into distinct words for granular matching
      const parts = q.split(/\s+/).filter(Boolean);
      const regexes = parts.map(p => new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
      // Build AND conditions requiring each term appear somewhere (name, raw address, city, locality, street, tags)
      const andClauses = regexes.map(r => ({
        $or: [
          { name: { $regex: r } },
          { 'address.raw': { $regex: r } },
          { 'address.city': { $regex: r } },
          { 'address.locality': { $regex: r } },
          { 'address.street': { $regex: r } },
          { tags: { $regex: r } },
        ],
      }));
      // Preserve original broad OR for phrase match to still allow simple queries
      match.$and = andClauses;
      match.$or = [
        { name: { $regex: q, $options: 'i' } },
        { 'address.raw': { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ];
    }

    const pipeline = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lon, lat] },
          distanceField: 'dist.calculated',
          maxDistance: maxDistance,
          spherical: true,
          query: match,
        },
      },
      { $sort: { 'dist.calculated': 1 } },
      {
        $facet: {
          meta: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limitNum }],
        },
      },
    ];

    const agg = await Shop.aggregate(pipeline);
    const meta = agg[0]?.meta?.[0] || { total: 0 };
    const data = agg[0]?.data || [];

    return res.json({
      meta: { total: meta.total || 0, page: pageNum, limit: limitNum },
      shops: data,
    });
  } catch (error) {
    next(error);
  }
};

