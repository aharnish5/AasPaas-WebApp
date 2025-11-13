import { useState, useEffect, useRef } from 'react';
import { MapPin, Search } from 'lucide-react';
import { shopAPI } from '../../services/api';

// Debounce hook
function useDebounce(value, delay = 300) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

// Basic slugify (mirror backend logic) for city/area
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

/**
 * CityAreaSelector
 * Two-step location selection:
 * 1. Choose/confirm city (restricted to India) via suggestions
 * 2. Choose area/locality biased by city (reuses suggestions API but filtered client-side)
 * Emits onChange({ city, city_slug, cityCenter, area, area_slug, areaPoint })
 */
export default function CityAreaSelector({ onChange, className = '' }) {
  const [cityQuery, setCityQuery] = useState('');
  const [areaQuery, setAreaQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [areaSuggestions, setAreaSuggestions] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null); // { name, slug, lat, lon }
  const [selectedArea, setSelectedArea] = useState(null); // { name, slug, lat, lon }
  const [loadingCity, setLoadingCity] = useState(false);
  const [loadingArea, setLoadingArea] = useState(false);
  const debouncedCity = useDebounce(cityQuery, 350);
  const debouncedArea = useDebounce(areaQuery, 350);
  const cityRef = useRef(null);
  const areaRef = useRef(null);

  // Fetch city suggestions (treat suggestions whose city field matches label)
  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!debouncedCity || debouncedCity.trim().length < 2) { setCitySuggestions([]); return; }
      setLoadingCity(true);
      try {
        const res = await shopAPI.suggestPlaces(debouncedCity.trim(), 8);
        const raw = res.data?.suggestions || [];
        // Filter to suggestions that represent cities (has city & label matches or provider geocode without locality)
        const cities = raw.filter(s => {
          const labelLc = (s.label||'').toLowerCase();
          const cityLc = (s.city||'').toLowerCase();
          if (!s.city) return false;
          // If locality equals city, treat as city-level
          const localityLc = (s.locality||'').toLowerCase();
          return cityLc && (labelLc.includes(cityLc) || localityLc === cityLc);
        });
        if (!ignore) setCitySuggestions(cities.slice(0,8));
      } catch { if (!ignore) setCitySuggestions([]); }
      finally { if (!ignore) setLoadingCity(false); }
    }
    run();
    return () => { ignore = true; };
  }, [debouncedCity]);

  // Fetch area suggestions biased by selected city
  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!selectedCity) { setAreaSuggestions([]); return; }
      if (!debouncedArea || debouncedArea.trim().length < 2) { setAreaSuggestions([]); return; }
      setLoadingArea(true);
      try {
        const res = await shopAPI.suggestPlaces(`${debouncedArea.trim()} ${selectedCity.name}`, 10, undefined, selectedCity.lat, selectedCity.lon);
        let raw = res.data?.suggestions || [];
        // Keep only suggestions whose city matches selected city
        raw = raw.filter(r => (r.city||'').toLowerCase() === selectedCity.name.toLowerCase());
        // Remove duplicates by locality label
        const seen = new Set();
        const areas = [];
        for (const r of raw) {
          const label = r.locality || r.label || r.displayName;
            if (!label) continue;
            const key = label.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            areas.push(r);
        }
        if (!ignore) setAreaSuggestions(areas.slice(0,10));
      } catch { if (!ignore) setAreaSuggestions([]); }
      finally { if (!ignore) setLoadingArea(false); }
    }
    run();
    return () => { ignore = true; };
  }, [debouncedArea, selectedCity]);

  const handleCitySelect = (s) => {
    const cityName = s.city || s.label || s.displayName;
    const city = { name: cityName, slug: slugify(cityName), lat: s.latitude, lon: s.longitude };
    setSelectedCity(city);
    setCityQuery(city.name);
    setSelectedArea(null);
    setAreaQuery('');
    onChange && onChange({ city: city.name, city_slug: city.slug, cityCenter: { lat: city.lat, lon: city.lon } });
  // Prefetch top areas immediately (without user typing) using a generic locality query like ' ' (space) to trigger provider
  void (async () => {
      try {
        setLoadingArea(true);
        const res = await shopAPI.suggestPlaces(city.name, 15, undefined, city.lat, city.lon);
        const raw = res.data?.suggestions || [];
        // Filter to those whose city matches selected city and have a locality distinct from city
        const filtered = raw.filter(r => (r.city||'').toLowerCase() === city.name.toLowerCase() && r.locality && r.locality.toLowerCase() !== city.name.toLowerCase());
        const seen = new Set();
        const areas = [];
        for (const r of filtered) {
          const label = r.locality || r.label || r.displayName;
          if (!label) continue;
            const key = label.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            areas.push(r);
        }
        setAreaSuggestions(areas.slice(0,10));
      } catch {
        /* ignore */
      } finally {
        setLoadingArea(false);
      }
  })();
  };

  const handleAreaSelect = (s) => {
    const areaName = s.locality || s.label || s.displayName;
    const area = { name: areaName, slug: slugify(areaName), lat: s.latitude, lon: s.longitude };
    setSelectedArea(area);
    setAreaQuery(area.name);
    onChange && onChange({
      city: selectedCity?.name,
      city_slug: selectedCity?.slug,
      cityCenter: selectedCity ? { lat: selectedCity.lat, lon: selectedCity.lon } : undefined,
      area: area.name,
      area_slug: area.slug,
      areaPoint: { lat: area.lat, lon: area.lon },
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>      
      <div className="relative">
        <label className="block text-sm font-medium mb-1">City (India)</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={cityQuery}
            onChange={(e) => { setCityQuery(e.target.value); setSelectedCity(null); }}
            placeholder="Start typing a city (e.g. Mysuru)"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        {loadingCity && <p className="text-xs text-gray-500 mt-1">Searching cities…</p>}
        {citySuggestions.length > 0 && !selectedCity && (
          <ul className="mt-1 border border-gray-200 rounded-lg bg-white shadow divide-y max-h-64 overflow-auto">
            {citySuggestions.map((c,i) => (
              <li key={i}>
                <button onClick={() => handleCitySelect(c)} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">{c.city || c.label}</span>
                  {c.state && <span className="text-xs text-gray-500 ml-1">{c.state}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative">
        <label className="block text-sm font-medium mb-1">Area / Locality</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={areaQuery}
            disabled={!selectedCity}
            onChange={(e) => setAreaQuery(e.target.value)}
            placeholder={selectedCity ? `Type an area in ${selectedCity.name}` : 'Select a city first'}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        {loadingArea && selectedCity && <p className="text-xs text-gray-500 mt-1">Searching areas…</p>}
        {areaSuggestions.length > 0 && selectedCity && !selectedArea && (
          <ul className="mt-1 border border-gray-200 rounded-lg bg-white shadow divide-y max-h-64 overflow-auto">
            {areaSuggestions.map((a,i) => (
              <li key={i}>
                <button onClick={() => handleAreaSelect(a)} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-accent mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{a.locality || a.label}</div>
                    <div className="text-xs text-gray-500 truncate">{selectedCity.name}, {a.state || ''}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedCity && selectedArea && (
          <p className="text-xs text-accent-700 mt-1">Selected: {selectedArea.name}, {selectedCity.name}</p>
        )}
      </div>
    </div>
  );
}
