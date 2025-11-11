import NodeGeocoder from 'node-geocoder';
import logger from '../config/logger.js';
import { geocodeAddress as mappleGeocode } from './mappleService.js';

// simple in-memory TTL cache (can be swapped with Redis later)
const cache = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
function cacheKey(prefix, obj) {
  return prefix + ':' + JSON.stringify(obj);
}
function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { cache.delete(key); return null; }
  return entry.value;
}
function setCached(key, value, ttl = DEFAULT_TTL_MS) {
  cache.set(key, { value, expires: Date.now() + ttl });
}

let geocoder = null;

// Initialize geocoder only if API key is provided
const provider = process.env.GEOCODER_PROVIDER || 'mapbox';
const apiKey = provider === 'mapbox' 
  ? process.env.MAPBOX_TOKEN 
  : process.env.GOOGLE_MAPS_API_KEY;

if (apiKey) {
  try {
    const options = {
      provider: provider === 'mapbox' ? 'mapbox' : 'google',
      apiKey: apiKey,
      formatter: null, // Use default formatter
    };
    
    geocoder = NodeGeocoder(options);
    logger.info(`Geocoding service initialized with provider: ${provider}`);
  } catch (error) {
    logger.warn('Failed to initialize geocoding service (geocoding will be disabled):', error.message);
  }
} else {
  logger.warn('Geocoding service disabled: No API key provided. Set MAPBOX_TOKEN or GOOGLE_MAPS_API_KEY in .env to enable.');
}

/**
 * Geocode an address to get coordinates
 * @param {string} address - Address string
 * @returns {Promise<object>} Geocoded result with coordinates and formatted address
 */
export const geocodeAddress = async (address) => {
  try {
    // Try cache first
    const key = cacheKey('geocode', { address });
    const cached = getCached(key);
    if (cached) return cached;

    // Prefer Mapple first regardless of geocoder availability
    let first = await mappleGeocode(address);
    if (!first?.success) {
      // If Mapple failed and we have a configured geocoder, fall back
      if (geocoder) {
        const results = await geocoder.geocode(address);
        if (!results || results.length === 0) {
          return {
            success: false,
            error: 'Address not found',
          };
        }
        const result = results[0];
        first = {
          success: true,
          latitude: result.latitude,
          longitude: result.longitude,
          formattedAddress: result.formattedAddress || address,
          street: result.streetName || '',
          city: result.city || '',
          state: result.administrativeLevels?.level1long || result.state || '',
          postalCode: result.zipcode || '',
          country: result.country || 'India',
          raw: result,
        };
      } else {
        return {
          success: false,
          error: 'Geocoding service not configured and Mapple failed',
        };
      }
    }
    setCached(key, first);
    return first;
  } catch (error) {
    logger.error('Geocoding error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Reverse geocode using OpenStreetMap Nominatim (free, no API key required)
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<object>} Reverse geocoded result with address
 */
const reverseGeocodeOSM = async (latitude, longitude) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    
    // Use global fetch (available in Node.js 18+)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AasPaas-App/1.0', // Required by Nominatim
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.address) {
      return {
        success: false,
        error: 'Location not found',
      };
    }

    const address = data.address;
    
    // Extract city name - try multiple fields
    const city = address.city || 
                 address.town || 
                 address.village || 
                 address.municipality ||
                 address.county ||
                 address.state_district ||
                 '';

    // Extract state
    const state = address.state || 
                  address.region || 
                  '';

    // Build formatted address
    const parts = [];
    if (address.road) parts.push(address.road);
    if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (address.postcode) parts.push(address.postcode);
    
    const formattedAddress = parts.join(', ') || data.display_name || '';

    return {
      success: true,
      formattedAddress,
      street: address.road || address.pedestrian || '',
      city: city,
      state: state,
      postalCode: address.postcode || '',
      country: address.country || 'India',
      locality: address.suburb || address.neighbourhood || city || '',
      raw: data,
    };
  } catch (error) {
    logger.error('OSM reverse geocoding error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Reverse geocode coordinates to get address
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<object>} Reverse geocoded result with address
 */
export const reverseGeocode = async (latitude, longitude) => {
  // Try configured geocoding service first
  if (geocoder) {
    try {
      const results = await geocoder.reverse({ lat: latitude, lon: longitude });

      if (results && results.length > 0) {
        const result = results[0];

        return {
          success: true,
          formattedAddress: result.formattedAddress || '',
          street: result.streetName || '',
          city: result.city || '',
          state: result.administrativeLevels?.level1long || result.state || '',
          postalCode: result.zipcode || '',
          country: result.country || 'India',
          locality: result.locality || result.city || '',
          raw: result,
        };
      }
    } catch (error) {
      logger.warn('Configured geocoding service failed, trying OSM fallback:', error.message);
    }
  }

  // Fallback to OpenStreetMap Nominatim (free, no API key required)
  logger.info('Using OpenStreetMap Nominatim for reverse geocoding');
  return await reverseGeocodeOSM(latitude, longitude);
};

/**
 * Search places (localities/cities/addresses) using OpenStreetMap Nominatim
 * No API key required. For production, respect their usage policy and add rate limiting/caching.
 * @param {string} query - Free text search (e.g., "ashokapuram, mysuru")
 * @param {number} limit - Number of results to return
 * @param {object} options - Optional biasing options { lat, lon, country: 'IN' }
 * @returns {Promise<Array>} List of suggestions with {locality, city, state, country, latitude, longitude, displayName}
 */
export const searchPlaces = async (query, limit = 5, options = {}) => {
  try {
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('format', 'jsonv2');
    params.set('addressdetails', '1');
    params.set('limit', String(limit));
    params.set('dedupe', '1');
    params.set('accept-language', 'en');
    // Restrict to India by default
    params.set('countrycodes', (options.country || 'IN'));

    // If bias lat/lon provided, add a small viewbox around it and bound results
    if (options.lat && options.lon) {
      const lat = parseFloat(options.lat);
      const lon = parseFloat(options.lon);
      const dLat = 0.5; // ~55km
      const dLon = 0.5; // ~55km near equator (varies by latitude)
      const left = (lon - dLon).toFixed(4);
      const right = (lon + dLon).toFixed(4);
      const top = (lat + dLat).toFixed(4);
      const bottom = (lat - dLat).toFixed(4);
      // Nominatim expects viewbox as: left,top,right,bottom
      params.set('viewbox', `${left},${top},${right},${bottom}`);
      params.set('bounded', '1');
    }

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AasPaas-App/1.0',
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Map and gently prioritize area-like results
    const results = data.map((item) => {
      const addr = item.address || {};
      const city = addr.city || addr.town || addr.village || addr.municipality || '';
      let locality = addr.suburb || addr.neighbourhood || addr.quarter || addr.hamlet || '';
      // Fallback: sometimes locality not provided; try using the first segment of display_name
      if (!locality && item.display_name) {
        const first = item.display_name.split(',')[0].trim();
        if (first && first.toLowerCase() !== city.toLowerCase()) {
          locality = first;
        }
      }
      const state = addr.state || addr.region || '';
      const country = addr.country || 'India';
      const placeClass = item.class || '';
      const placeType = item.type || '';
      const labelParts = [];
      if (locality) labelParts.push(locality);
      if (city && city.toLowerCase() !== locality?.toLowerCase()) labelParts.push(city);
      if (state && state.toLowerCase() !== city.toLowerCase()) labelParts.push(state);
      const label = labelParts.join(', ') || item.display_name;
      return {
        displayName: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        street: addr.road || addr.pedestrian || '',
        locality,
        city,
        state,
        postalCode: addr.postcode || '',
        country,
        type: placeType,
        class: placeClass,
        label,
      };
    });

    const areaTypes = new Set(['suburb','neighbourhood','hamlet','village','residential','quarter','locality']);
    results.sort((a,b)=>{
      const aScore = areaTypes.has((a.type||'').toLowerCase()) ? 0 : 1;
      const bScore = areaTypes.has((b.type||'').toLowerCase()) ? 0 : 1;
      if (aScore !== bScore) return aScore - bScore;
      return a.label.length - b.label.length;
    });
    return results;
  } catch (error) {
    logger.error('Place search (OSM) error:', error);
    throw error;
  }
};

/**
 * Extract and normalize address components from OCR text
 * @param {string} ocrText - OCR extracted text
 * @returns {Promise<object>} Normalized address with coordinates
 */
export const normalizeAddress = async (ocrText) => {
  try {
    // Try to geocode the full text first
    let geocodeResult = await geocodeAddress(ocrText);

    // If that fails, try common address patterns
    if (!geocodeResult.success) {
      // Extract potential address lines
      const lines = ocrText.split('\n').filter((line) => line.trim().length > 0);
      
      // Try last few lines as address
      const addressCandidates = lines.slice(-3).join(', ');
      if (addressCandidates.length > 10) {
        geocodeResult = await geocodeAddress(addressCandidates);
      }
    }

    if (!geocodeResult.success) {
      return {
        success: false,
        rawAddress: ocrText,
        error: geocodeResult.error,
      };
    }

    return {
      success: true,
      rawAddress: ocrText,
      formattedAddress: geocodeResult.formattedAddress,
      street: geocodeResult.street,
      city: geocodeResult.city,
      state: geocodeResult.state,
      postalCode: geocodeResult.postalCode,
      country: geocodeResult.country,
      coordinates: [geocodeResult.longitude, geocodeResult.latitude],
    };
  } catch (error) {
    logger.error('Address normalization error:', error);
    return {
      success: false,
      rawAddress: ocrText,
      error: error.message,
    };
  }
};

