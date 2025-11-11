import express from 'express';
import multer from 'multer';
import { body, query, param } from 'express-validator';
import {
  uploadShopImage,
  inferFromImage,
  getOcrResult,
  createShop,
  getShops,
  getShopById,
  updateShop,
  deleteShop,
  addShopImage,
  geocodeAddress,
  reverseGeocodeLocation,
  suggestPlaces,
  placeDetails,
  searchShops,
} from '../controllers/shopController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireVendor } from '../middleware/role.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { mappleRateLimiter } from '../middleware/mappleRateLimiter.js';

const router = express.Router();

// Middleware to sanitize query parameters - convert empty strings to undefined
const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (req.query[key] === '' || req.query[key] === null) {
        delete req.query[key];
      }
    });
  }
  next();
};

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Image upload route (vendor only)
router.post(
  '/upload-image',
  authenticate,
  requireVendor,
  upload.single('image'),
  uploadShopImage
);

// AI infer details from image (vendor only)
router.post(
  '/infer-image',
  authenticate,
  requireVendor,
  rateLimiter({ windowMs: 60_000, max: 12 }),
  upload.single('image'),
  inferFromImage
);

// Get OCR result
router.get('/ocr-result', getOcrResult);

// Geocode address to get coordinates (public)
router.get(
  '/geocode',
  sanitizeQuery,
  [
    query('address').notEmpty().trim().withMessage('Address is required'),
  ],
  validateRequest,
  mappleRateLimiter,
  geocodeAddress
);

// Reverse geocode location (public)
router.get(
  '/reverse-geocode',
  sanitizeQuery,
  [
    query('lat').notEmpty().isFloat().withMessage('Latitude is required and must be a number'),
    query('lon').notEmpty().isFloat().withMessage('Longitude is required and must be a number'),
  ],
  validateRequest,
  mappleRateLimiter,
  reverseGeocodeLocation
);

// Place suggestions (public)
router.get(
  '/places',
  rateLimiter({ windowMs: 60_000, max: 60 }),
  [
    query('q').notEmpty().trim().isLength({ min: 2 }).withMessage('Query must be at least 2 characters'),
    query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be between 1 and 10')
  ],
  validateRequest,
  suggestPlaces
);

// Place details (Google Places)
router.get(
  '/places/details',
  rateLimiter({ windowMs: 60_000, max: 30 }),
  [
    query('placeId').notEmpty().trim().withMessage('placeId is required'),
  ],
  validateRequest,
  placeDetails
);

// Create shop (vendor only)
router.post(
  '/',
  authenticate,
  requireVendor,
  [
    body('name').trim().notEmpty().withMessage('Shop name is required'),
    body('category').isIn([
      'food',
      'clothing',
      'electronics',
      'services',
      'automotive',
      'beauty',
      'healthcare',
      'education',
      'entertainment',
      'home',
      'other',
    ]).withMessage('Invalid category'),
    body('priceRange').optional().isIn(['low','medium','high']).withMessage('Invalid price range'),
    body('averagePrice').optional().isFloat({ min: 0 }).withMessage('Average price must be >= 0'),
    // Accept either a string address or an object with a non-empty raw field
    body('address').custom((val) => {
      if (typeof val === 'string' && val.trim().length > 0) return true;
      if (val && typeof val === 'object' && typeof val.raw === 'string' && val.raw.trim().length > 0) return true;
      throw new Error('Address is required');
    }),
    // Location is now optional; if provided, validate shape
    body('location').optional().custom((loc) => {
      if (!loc || typeof loc !== 'object' || !Array.isArray(loc.coordinates)) {
        throw new Error('If location is provided, it must include coordinates [lon, lat]');
      }
      if (loc.coordinates.length !== 2) throw new Error('Coordinates must be [lon, lat]');
      if (loc.coordinates.some((c) => typeof c !== 'number' || Number.isNaN(c))) {
        throw new Error('Coordinates must be numbers');
      }
      return true;
    }),
  ],
  validateRequest,
  createShop
);

// Get shops (public, optional auth for personalized results)
router.get(
  '/',
  sanitizeQuery, // Remove empty strings from query params first
  optionalAuth,
  [
    query('lat').optional().isFloat().withMessage('Latitude must be a number'),
    query('lon').optional().isFloat().withMessage('Longitude must be a number'),
    query('q').optional().trim().notEmpty().withMessage('Query must be a non-empty string'),
    query('locality').optional().trim().notEmpty().withMessage('Locality must be a non-empty string'),
    query('radius').optional().isFloat({ min: 0.1, max: 100 }).withMessage('Radius must be between 0.1 and 100 km'),
    query('category').optional().isIn([
      'food',
      'clothing',
      'electronics',
      'services',
      'automotive',
      'beauty',
      'healthcare',
      'education',
      'entertainment',
      'home',
      'other',
    ]).withMessage('Invalid category'),
    // New filters (optional) using new taxonomy
    query('categoryId').optional().isMongoId().withMessage('Invalid categoryId'),
    query('categorySlug').optional().isString().isLength({ min: 2 }).withMessage('Invalid categorySlug'),
    query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Minimum rating must be between 0 and 5'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sort').optional().isIn(['proximity', 'rating', 'newest']).withMessage('Sort must be proximity, rating, or newest'),
    query('ownerId').optional().isMongoId().withMessage('Invalid owner ID'),
    // Pricing filters
    query('priceRange').optional().isIn(['low','medium','high']).withMessage('Invalid priceRange'),
    query('maxAveragePrice').optional().isFloat({ min: 0 }).withMessage('maxAveragePrice must be >= 0'),
    query('minAveragePrice').optional().isFloat({ min: 0 }).withMessage('minAveragePrice must be >= 0'),
  ],
  validateRequest,
  getShops
);

// Advanced radius + city_slug search (POST authoritative)
router.post(
  '/search',
  [
    body('center.lat').isFloat().withMessage('center.lat required'),
    body('center.lon').isFloat().withMessage('center.lon required'),
    body('radiusMeters').optional().isInt({ min: 1, max: 200000 }).withMessage('radiusMeters must be 1-200000 (meters)'),
    body('city_slug').optional().isString().isLength({ min: 2 }).withMessage('city_slug must be a string'),
    body('page').optional().isInt({ min: 1 }).withMessage('page must be >=1'),
    body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
    body('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('minRating must be 0-5'),
    body('priceRange').optional().isIn(['low','medium','high']).withMessage('Invalid priceRange'),
    body('maxAveragePrice').optional().isFloat({ min: 0 }).withMessage('maxAveragePrice must be >= 0'),
    body('minAveragePrice').optional().isFloat({ min: 0 }).withMessage('minAveragePrice must be >= 0'),
  ],
  validateRequest,
  searchShops
);

// Get shop by ID (public)
router.get(
  '/:shopId',
  optionalAuth,
  [param('shopId').isMongoId().withMessage('Invalid shop ID')],
  validateRequest,
  getShopById
);

// Update shop (owner only)
router.patch(
  '/:shopId',
  authenticate,
  [param('shopId').isMongoId().withMessage('Invalid shop ID')],
  validateRequest,
  updateShop
);

// Delete shop (owner or admin)
router.delete(
  '/:shopId',
  authenticate,
  [param('shopId').isMongoId().withMessage('Invalid shop ID')],
  validateRequest,
  deleteShop
);

// Add image to shop (owner only)
router.post(
  '/:shopId/images',
  authenticate,
  upload.single('image'),
  [param('shopId').isMongoId().withMessage('Invalid shop ID')],
  validateRequest,
  addShopImage
);

export default router;

