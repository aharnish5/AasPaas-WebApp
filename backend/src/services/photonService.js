import logger from '../config/logger.js';
import crypto from 'crypto';

// Simple in-memory cache for Photon queries
const cache = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

/**
 * Query Komoot Photon API for place suggestions
 * Docs: https://photon.readthedocs.io/en/latest/api.html
 * @param {string} query
 * @param {number} limit
 * @param {object} options { lang, lat, lon, countryBias }
 * @returns {Promise<Array>} unified suggestion objects
 */
export async function searchPhoton(query, limit = 5, { lang = 'en', lat, lon, countryBias = 'IN' } = {}) {
  try {
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('lang', lang);
    params.set('limit', String(limit));
    if (lat && lon) {
      params.set('lat', String(lat));
      params.set('lon', String(lon));
    }
    // Removed automatic country append to avoid diluting locality specificity; we'll filter after fetch.

    const cacheKey = makeKey('photon', Object.fromEntries(params));
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const url = `https://photon.komoot.io/api/?${params.toString()}`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'AasPaas-App/1.0', 'Accept': 'application/json' },
    });
    if (!resp.ok) {
      throw new Error(`Photon HTTP ${resp.status}`);
    }
    const data = await resp.json();
    const features = data.features || [];

    let suggestions = features.map((f) => {
      const [lonV, latV] = f.geometry?.coordinates || [];
      const p = f.properties || {};
      
      // Photon returns type as the main place type, osm_value as granular subtype
      const placeType = p.osm_value || p.type || p.osm_key || '';
  const name = p.name || p.city || p.suburb || '';
      const city = p.city || p.town || p.county || '';
      const state = p.state || '';
      const country = p.country || 'India';
      
      // locality might be in name, suburb, district, or neighbourhood
      let locality = p.suburb || p.neighbourhood || p.district || '';
      // If no explicit locality and this is a hamlet/village/residential, the name is the locality
      if (!locality && (placeType === 'village' || placeType === 'hamlet' || placeType === 'residential' || placeType === 'suburb')) {
        locality = name;
      }
      
      // Build primary label
      const labelParts = [];
      if (name) labelParts.push(name);
      if (city && name.toLowerCase() !== city.toLowerCase()) labelParts.push(city);
      if (state && state.toLowerCase() !== city.toLowerCase()) labelParts.push(state);
      const label = labelParts.join(', ') || name || '';
      
      // Build subtitle with type for context
      const subtitleParts = [];
      if (placeType) subtitleParts.push(placeType);
      if (city) subtitleParts.push(city);
      if (state) subtitleParts.push(state);
      const subtitle = subtitleParts.join(', ');

      return {
        provider: 'photon',
        displayName: name,
        label,
        latitude: latV,
        longitude: lonV,
        street: p.street || '',
        locality: locality || name,
        city,
        state,
        postalCode: p.postcode || '',
        country,
        type: placeType,
        subtitle,
        // identifiers for optional detail lookups
        osmId: p.osm_id,
        osmType: p.osm_type, // N, W, R
      };
    });

    // Country filter (post-fetch) if bias requested
    if (countryBias) {
      suggestions = suggestions.filter(s => s.country.toLowerCase() === (countryBias === 'IN' ? 'india' : countryBias.toLowerCase()));
    }

    // Ranking: prioritize locality/administrative over POI types when user wants area names
  const localityTypes = ['village', 'hamlet', 'suburb', 'neighbourhood', 'residential', 'district', 'locality','quarter'];
    suggestions.sort((a,b) => {
      const aScore = localityTypes.some(t => (a.type||'').includes(t)) ? 0 : 1;
      const bScore = localityTypes.some(t => (b.type||'').includes(t)) ? 0 : 1;
      if (aScore !== bScore) return aScore - bScore;
      // shorter label first (likely more specific)
      return a.label.length - b.label.length;
    });

    setCache(cacheKey, suggestions);
    return suggestions;
  } catch (error) {
    logger.warn('Photon search error:', error.message);
    return [];
  }
}
