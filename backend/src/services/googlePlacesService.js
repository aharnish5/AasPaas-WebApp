import logger from '../config/logger.js';
import crypto from 'crypto';

// Simple in-memory cache (replace with Redis for production)
const cache = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
const AUTOCOMPLETE_ENDPOINT = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const DETAILS_ENDPOINT = 'https://maps.googleapis.com/maps/api/place/details/json';

// Generate a cache key
function makeKey(prefix, params) {
  return prefix + ':' + crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
}

function setCache(key, value, ttl = DEFAULT_TTL_MS) {
  cache.set(key, { value, expires: Date.now() + ttl });
}

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export const hasGooglePlaces = !!GOOGLE_API_KEY;

/**
 * Fetch autocomplete predictions from Google Places API
 * @param {string} input
 * @param {object} options { sessionToken, language, country }
 */
export async function autocompletePlaces(input, { sessionToken, language = 'en-IN', country = 'IN', limit = 5 } = {}) {
  if (!hasGooglePlaces) {
    return { success: false, error: 'Google Places API key not configured' };
  }
  try {
    const params = {
      input,
      key: GOOGLE_API_KEY,
      language,
      components: country ? `country:${country}` : undefined,
      sessiontoken: sessionToken,
    };
    const cacheKey = makeKey('ac', params);
    const cached = getCache(cacheKey);
    if (cached) return { success: true, predictions: cached };

    const url = AUTOCOMPLETE_ENDPOINT + '?' + new URLSearchParams(params).toString();
    const resp = await fetch(url);
    const data = await resp.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      logger.warn('Google Places autocomplete status:', data.status, data.error_message || '');
      return { success: false, error: data.error_message || data.status };
    }

    const predictions = (data.predictions || []).slice(0, limit).map(p => ({
      placeId: p.place_id,
      description: p.description,
      // attempt to extract locality and city from structured formatting
      mainText: p.structured_formatting?.main_text,
      secondaryText: p.structured_formatting?.secondary_text,
      types: p.types,
    }));
    setCache(cacheKey, predictions);
    return { success: true, predictions };
  } catch (error) {
    logger.error('Google Places autocomplete error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch place details by placeId
 * @param {string} placeId
 * @param {object} options { language, sessionToken }
 */
export async function getPlaceDetails(placeId, { language = 'en-IN', sessionToken } = {}) {
  if (!hasGooglePlaces) {
    return { success: false, error: 'Google Places API key not configured' };
  }
  try {
    const params = {
      place_id: placeId,
      key: GOOGLE_API_KEY,
      language,
      fields: 'address_component,geometry,formatted_address,name',
      sessiontoken: sessionToken,
    };
    const cacheKey = makeKey('details', params);
    const cached = getCache(cacheKey);
    if (cached) return { success: true, details: cached };

    const url = DETAILS_ENDPOINT + '?' + new URLSearchParams(params).toString();
    const resp = await fetch(url);
    const data = await resp.json();

    if (data.status !== 'OK') {
      logger.warn('Google Place details status:', data.status, data.error_message || '');
      return { success: false, error: data.error_message || data.status };
    }

    const result = data.result;
    const location = result.geometry?.location || {};

    // Normalize address components
    const components = result.address_components || [];
    const getComp = (types) => components.find(c => types.every(t => c.types.includes(t)))?.long_name || '';

    const locality = getComp(['sublocality_level_1']) || getComp(['sublocality']) || getComp(['neighborhood']) || getComp(['locality']);
    const city = getComp(['locality']) || getComp(['administrative_area_level_2']);
    const district = getComp(['administrative_area_level_2']);
    const state = getComp(['administrative_area_level_1']);
    const postalCode = getComp(['postal_code']);
    const country = getComp(['country']) || 'India';

    const normalized = {
      placeId,
      name: result.name,
      formattedAddress: result.formatted_address,
      latitude: location.lat,
      longitude: location.lng,
      locality,
      city,
      district,
      state,
      postalCode,
      country,
    };
    setCache(cacheKey, normalized);
    return { success: true, details: normalized };
  } catch (error) {
    logger.error('Google Place details error:', error);
    return { success: false, error: error.message };
  }
}
