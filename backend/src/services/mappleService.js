import logger from '../config/logger.js';

// Minimal Mappls/MapmyIndia ("Mapple") geocoding wrapper.
// This prefers environment-driven configuration and gracefully disables itself
// when not configured so callers can fall back to other providers.

const MAPPLE_API_KEY = process.env.MAPPLE_API_KEY;
// Prefer explicit geocode URL if provided to avoid guessing the vendor endpoint.
// Example (for reference, not enforced):
//   MAPPLE_GEOCODE_URL=https://atlas.mappls.com/api/places/geocode
const MAPPLE_GEOCODE_URL = process.env.MAPPLE_GEOCODE_URL || process.env.MAPPLE_BASE_URL;

function isConfigured() {
  return Boolean(MAPPLE_API_KEY && MAPPLE_GEOCODE_URL);
}

// Normalize provider-specific response into our canonical shape
function normalizeGeocodeResponse(item, fallbackAddress) {
  // The exact response shape depends on Mappls endpoint used; try to be defensive.
  // Accept common field names and map them.
  const lat = item?.latitude ?? item?.lat ?? item?.geom?.lat;
  const lon = item?.longitude ?? item?.lon ?? item?.geom?.lon;
  const formattedAddress = item?.formattedAddress || item?.formatted_address || item?.address || fallbackAddress || '';
  const components = item?.addressComponents || item?.address_components || item?.components || {};

  const city = item?.city || components.city || components.district || components.town || '';
  const locality = item?.locality || components.locality || components.subLocality || components.suburb || '';
  const state = item?.state || components.state || components.region || '';
  const postalCode = item?.postalCode || components.pincode || components.postal_code || '';
  const country = item?.country || components.country || 'India';

  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return { success: false, error: 'Invalid geocode response' };
  }

  return {
    success: true,
    latitude: lat,
    longitude: lon,
    formattedAddress,
    street: components.street || components.road || '',
    city,
    state,
    postalCode,
    country,
    locality,
    raw: item,
  };
}

/**
 * Geocode an address string using Mappls (MapmyIndia) if configured.
 * Returns { success, latitude, longitude, formattedAddress, city, state, postalCode, country, locality }
 */
export async function geocodeAddress(address) {
  if (!isConfigured()) {
    return { success: false, error: 'Mapple API not configured' };
  }

  try {
    // Most Mappls endpoints expect a Bearer token header; some accept an apiKey param.
    // We support both by using header primarily, falling back to query param if needed.
    const url = new URL(MAPPLE_GEOCODE_URL);
    // Ensure the address is sent as a query param commonly named 'address' or 'q'.
    if (!url.searchParams.has('address') && !url.searchParams.has('q')) {
      url.searchParams.set('address', address);
    }
    // Country bias to India when supported
    if (!url.searchParams.has('country') && !url.searchParams.has('region')) {
      url.searchParams.set('country', 'IN');
    }

    const headers = {
      'Accept': 'application/json',
    };
    // Prefer Authorization header
    headers['Authorization'] = `Bearer ${MAPPLE_API_KEY}`;

    const resp = await fetch(url.toString(), { headers });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Mapple geocode HTTP ${resp.status} ${text}`);
    }
    const data = await resp.json();

    // Try common shapes: {results:[...]}, {suggestedLocations:[...]}, or a single object
    const first = Array.isArray(data?.results) && data.results[0]
      || Array.isArray(data?.suggestedLocations) && data.suggestedLocations[0]
      || data?.result || data;

    const normalized = normalizeGeocodeResponse(first, address);
    if (!normalized.success) return normalized;

    return normalized;
  } catch (err) {
    logger.warn('[mappleService] geocodeAddress failed:', err?.message || err);
    return { success: false, error: err?.message || 'Mapple geocode failed' };
  }
}

export default {
  geocodeAddress,
};
