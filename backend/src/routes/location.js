import express from 'express';
import { autocomplete, placeDetails } from '../controllers/locationController.js';
import { mappleRateLimiter } from '../middleware/mappleRateLimiter.js';

const router = express.Router();

// Autocomplete suggestions (Mapple + Nominatim fallback, India-only) with rate limiting
router.get('/autocomplete', mappleRateLimiter, autocomplete);

// Place details (Nominatim lookup by osmId/osmType)
router.get('/details', placeDetails);

export default router;