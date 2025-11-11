import logger from '../config/logger.js';
// Photon deprecated: unified Mapple + Nominatim fallback
// import { searchPhoton } from '../services/photonService.js';
import { searchPlaces } from '../services/geocodingService.js';
import { geocodeAddress as mappleGeocode } from '../services/mappleService.js';
import LRUCache from '../utils/lruCache.js';

// Shared cache instances
const autocompleteCache = new LRUCache(300, 5 * 60 * 1000); // 5 min
const detailsCache = new LRUCache(300, 30 * 60 * 1000); // 30 min

// Normalize suggestion structure
function normalizeSuggestion(s) {
  return {
    label: s.label || s.displayName || '',
    displayName: s.displayName || s.label || '',
    locality: s.locality || '',
    city: s.city || '',
    state: s.state || '',
    country: s.country || 'India',
    latitude: s.latitude,
    longitude: s.longitude,
    type: s.type || '',
    street: s.street || '',
    postalCode: s.postalCode || '',
    provider: s.provider || 'unknown',
    subtitle: s.subtitle || '',
    osmId: s.osmId,
    osmType: s.osmType,
  };
}

// GET /api/location/autocomplete?q=ashok&lat=&lon=&limit=10
export const autocomplete = async (req, res, next) => {
  try {
    const { q, lat, lon, limit = 10 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }
    const query = q.trim();
    const cacheKey = `${query}|${lat||''}|${lon||''}|${limit}`;
    const cached = autocompleteCache.get(cacheKey);
    if (cached) {
      return res.json({ suggestions: cached, cached: true });
    }

    const finalResults = [];
    // Try Mapple direct geocode first (treat precise result as suggestion)
    try {
      const geo = await mappleGeocode(query);
      if (geo?.success) {
        finalResults.push({
          provider: 'mapple',
          label: geo.formattedAddress || query,
          displayName: geo.formattedAddress || query,
          locality: geo.locality || '',
          city: geo.city || '',
          state: geo.state || '',
          country: geo.country || 'India',
          latitude: geo.latitude,
          longitude: geo.longitude,
          postalCode: geo.postalCode || '',
          type: 'geocode',
        });
      }
    } catch (e) {
      logger.warn('Mapple geocode suggestion failed:', e?.message || e);
    }

    // Always fetch Nominatim area/locality results to populate list (biased to India)
    try {
      const nominatim = await searchPlaces(query, parseInt(limit), { lat, lon, country: 'IN' });
      nominatim.forEach(r => finalResults.push({ ...r, provider: 'nominatim' }));
    } catch (err) {
      logger.warn('Nominatim fallback failed:', err.message);
    }

    // Normalize & highlight matched substring
    const lowerQuery = query.toLowerCase();
    const suggestions = finalResults.map(r => {
      const n = normalizeSuggestion(r);
      // Build highlight label with <mark> around query substring if found
      const labelLower = n.label.toLowerCase();
      const idx = labelLower.indexOf(lowerQuery);
      if (idx !== -1) {
        n.highlightLabel = n.label.substring(0, idx) + '<mark>' + n.label.substring(idx, idx + query.length) + '</mark>' + n.label.substring(idx + query.length);
      } else {
        n.highlightLabel = n.label;
      }
      return n;
    });

    autocompleteCache.set(cacheKey, suggestions);
    res.json({ suggestions, cached: false });
  } catch (error) {
    next(error);
  }
};

// GET /api/location/details?osmId=123&osmType=W
// For now: if osmId/osmType provided, attempt simple Nominatim lookup
export const placeDetails = async (req, res, next) => {
  try {
    const { osmId, osmType } = req.query;
    if (!osmId || !osmType) {
      return res.status(400).json({ error: 'osmId and osmType are required' });
    }
    const key = `${osmType}:${osmId}`;
    const cached = detailsCache.get(key);
    if (cached) return res.json({ place: cached, cached: true });

    // Nominatim details endpoint
    const url = `https://nominatim.openstreetmap.org/lookup?format=json&osm_ids=${osmType}${osmId}&addressdetails=1`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'AasPaas-App/1.0', 'Accept': 'application/json' },
    });
    if (!resp.ok) {
      return res.status(400).json({ error: `Lookup failed (${resp.status})` });
    }
    const data = await resp.json();
    const item = data[0];
    if (!item) {
      return res.status(404).json({ error: 'Place not found' });
    }
    const addr = item.address || {};
    const place = {
      displayName: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      street: addr.road || '',
      locality: addr.suburb || addr.neighbourhood || '',
      city: addr.city || addr.town || addr.village || '',
      state: addr.state || '',
      postalCode: addr.postcode || '',
      country: addr.country || 'India',
      osmId,
      osmType,
    };
    detailsCache.set(key, place);
    res.json({ place, cached: false });
  } catch (error) {
    next(error);
  }
};