import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchShops, clearError } from '../store/slices/shopsSlice'
import ShopCard from '../components/shop/ShopCard'
import { Search, MapPin, Navigation } from 'lucide-react'
import CityAreaSelector from '../components/search/CityAreaSelector'
import ShopMap from '../components/map/ShopMap'
import { useGeolocation } from '../hooks/useGeolocation'
import { shopAPI } from '../services/api'
import { checkGeolocationPermission } from '../utils/permissions'

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { shops, loading, error } = useSelector((state) => state.shops)
  const { location: geolocation, getLocation } = useGeolocation()
  const [locationName, setLocationName] = useState(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState(null)

  // Check permission status on mount
  useEffect(() => {
    checkGeolocationPermission().then((status) => {
      setPermissionStatus(status)
      console.log('Geolocation permission status:', status)
    })
  }, [])
  
  const [filters, setFilters] = useState({
    category: '',
    minRating: '',
    radius: 3000, // meters for new POST /shops/search endpoint
    priceRange: '',
    maxAveragePrice: '',
  })
  // Local input state to avoid firing searches on every keystroke
  const [maxAvgInput, setMaxAvgInput] = useState('')
  const [cityMeta, setCityMeta] = useState(null) // { city, city_slug, cityCenter, area, area_slug, areaPoint }
  const [advancedResults, setAdvancedResults] = useState(null) // response from POST /shops/search
  const [advLoading, setAdvLoading] = useState(false)
  const [advError, setAdvError] = useState(null)

  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const query = searchParams.get('q')
  const hasSearchParams = Boolean((lat && lon) || (query && query.trim()))

  // Clear error when component mounts or search params change
  useEffect(() => {
    dispatch(clearError())
    // Reset location request state when params change
    setHasRequestedLocation(false)
    setIsGettingLocation(false)
    // Force header to refresh when search params change
    setLocationName(null)
  }, [dispatch, lat, lon, query])

  // When geolocation is obtained (from button click), update URL with coords and reverse geocode
  useEffect(() => {
    if (geolocation.coordinates && isGettingLocation) {
      const { latitude, longitude } = geolocation.coordinates
      
      // Update URL with coordinates (preserve existing text query if any)
      const newParams = {}
      if (query && query.trim()) newParams.q = query.trim()
      newParams.lat = latitude.toString()
      newParams.lon = longitude.toString()
      setSearchParams(newParams)
      
      // Reverse geocode to get location name
      shopAPI.reverseGeocode(latitude, longitude)
        .then((response) => {
          const loc = response.data.location
          console.log('Reverse geocode response:', loc)
          
          // Prioritize locality (area), then city
          let name = loc.locality || loc.city || loc.displayName || ''
          
          // If still empty, try to extract from formatted address
          if (!name && loc.formattedAddress) {
            const parts = loc.formattedAddress.split(',')
            // Find a city-like name (not a number, not too short, not "India")
            for (let i = parts.length - 1; i >= 0; i--) {
              const part = parts[i].trim()
              if (part.length > 2 && !/^\d+$/.test(part) && part !== 'India' && !part.includes('Location at')) {
                name = part
                break
              }
            }
          }
          
          // Final fallback
          if (!name || name.includes('Location (')) {
            name = 'Your location'
          }
          
          setLocationName(name)
          console.log('Location name set:', name, 'Full location data:', loc)
        })
        .catch((err) => {
          console.error('Reverse geocode error:', err)
          // Don't show coordinates - just show "Your location"
          setLocationName('Your location')
        })
      
      setIsGettingLocation(false)
    } else if (geolocation.error && isGettingLocation) {
      // Reset getting location state if there was an error
      setIsGettingLocation(false)
    }
  }, [geolocation.coordinates, geolocation.error, isGettingLocation, lat, lon, query, setSearchParams])

  // Reverse geocode when coordinates are in URL (disabled when advanced city/area is active)
  useEffect(() => {
    if (cityMeta?.city_slug) return; // advanced flow sets its own header
    if (lat && lon) {
      shopAPI.reverseGeocode(parseFloat(lat), parseFloat(lon))
        .then((response) => {
          const loc = response.data.location
          console.log('Reverse geocode response:', loc)
          
          // Prioritize locality (area), then city
          let name = loc.locality || loc.city || loc.displayName || ''
          
          // If still empty, try to extract from formatted address
          if (!name && loc.formattedAddress) {
            const parts = loc.formattedAddress.split(',')
            // Find a city-like name (not a number, not too short, not "India")
            for (let i = parts.length - 1; i >= 0; i--) {
              const part = parts[i].trim()
              if (part.length > 2 && !/^\d+$/.test(part) && part !== 'India' && !part.includes('Location at')) {
                name = part
                break
              }
            }
          }
          
          // Final fallback
          if (!name || name.includes('Location (')) {
            name = 'Your location'
          }
          
          setLocationName(name)
          console.log('Location name set:', name, 'Full location:', loc)
        })
        .catch((err) => {
          console.error('Reverse geocode error:', err)
          // Don't show coordinates - just show "Your location"
          setLocationName('Your location')
        })
    }
  }, [lat, lon, cityMeta?.city_slug])

  // Legacy GET /shops fallback still supported for non-city-based browsing
  useEffect(() => {
    if (cityMeta?.city_slug && cityMeta?.areaPoint) return; // advanced search will handle
    const params = {}
    if (lat && lon) { params.lat = lat; params.lon = lon }
    if (query && query.trim()) { params.q = query.trim() }
    if (filters.category) params.category = filters.category
    if (filters.minRating) params.minRating = filters.minRating
  if (filters.priceRange) params.priceRange = filters.priceRange
  if (filters.maxAveragePrice) params.maxAveragePrice = filters.maxAveragePrice
    if (lat && lon) { params.radius = (filters.radius/1000) || 3; params.sort = 'proximity' }
    dispatch(fetchShops(params))
  }, [dispatch, lat, lon, query, filters, cityMeta?.city_slug, cityMeta?.areaPoint])

  // Advanced authoritative radius search using POST /shops/search
  useEffect(() => {
    async function run() {
      if (!cityMeta?.city_slug || !cityMeta?.areaPoint) { setAdvancedResults(null); return }
      setAdvLoading(true); setAdvError(null)
      try {
        const body = {
          city_slug: cityMeta.city_slug,
          center: { lat: cityMeta.areaPoint.lat, lon: cityMeta.areaPoint.lon },
          radiusMeters: filters.radius,
          query: query || undefined,
          category: filters.category || undefined,
          priceRange: filters.priceRange || undefined,
          maxAveragePrice: filters.maxAveragePrice ? Number(filters.maxAveragePrice) : undefined,
          minRating: filters.minRating || undefined,
          page: 1,
          limit: 60,
        }
        const res = await shopAPI.searchAdvanced(body)
        setAdvancedResults(res.data)
      } catch (e) {
        setAdvError(e?.response?.data?.error || e.message)
      } finally {
        setAdvLoading(false)
      }
    }
    run()
  }, [cityMeta?.city_slug, cityMeta?.areaPoint?.lat, cityMeta?.areaPoint?.lon, filters.radius, filters.category, filters.minRating, query])

  if (loading) {
    return (
      <div className="container-custom py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-xl h-48 mb-4"></div>
              <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
              <div className="bg-gray-200 rounded h-4 w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show error only if it's a real error (not just no results)
  if (error && error !== 'Failed to fetch shops') {
    return (
      <div className="container-custom py-12">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
            <p className="text-red-600 font-medium mb-2">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => {
                dispatch(clearError())
                window.location.href = '/search'
              }}
              className="mt-4 text-sm text-red-600 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <aside className="lg:w-64">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            <div className="space-y-4">
              <div>
                <label className="input-label">Category</label>
                <select
                  className="input-field"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="food">Food</option>
                  <option value="clothing">Clothing</option>
                  <option value="electronics">Electronics</option>
                  <option value="services">Services</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="input-label">Minimum Rating</label>
                <select
                  className="input-field"
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                >
                  <option value="">Any</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                </select>
              </div>
              <div>
                <label className="input-label">Price Category</label>
                <select
                  className="input-field"
                  value={filters.priceRange}
                  onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                >
                  <option value="">Any</option>
                  <option value="low">Budget</option>
                  <option value="medium">Moderate</option>
                  <option value="high">Premium</option>
                </select>
              </div>
              <div>
                <label className="input-label">Max Average Price (₹)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="input-field"
                  value={maxAvgInput}
                  onChange={(e) => {
                    const onlyDigits = (e.target.value || '').replace(/\D+/g, '')
                    setMaxAvgInput(onlyDigits)
                  }}
                  onBlur={() => {
                    if (maxAvgInput !== (filters.maxAveragePrice || '')) {
                      setFilters({ ...filters, maxAveragePrice: maxAvgInput })
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      e.currentTarget.blur()
                    }
                  }}
                  placeholder="e.g., 500"
                  aria-label="Set maximum average price"
                />
              </div>
              {(lat && lon) && !cityMeta?.city_slug && (
                <div>
                  <label className="input-label">Search Radius (km)</label>
                  <select
                    className="input-field"
                    value={Math.round(filters.radius/1000)}
                    onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value)*1000 })}
                  >
                    <option value="2">2 km</option>
                    <option value="3">3 km</option>
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="25">25 km</option>
                    <option value="50">50 km (City-wide)</option>
                  </select>
                </div>
              )}
              {cityMeta?.city_slug && (
                <div>
                  <label className="input-label">Radius (km)</label>
                  <select
                    className="input-field"
                    value={Math.round(filters.radius/1000)}
                    onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value)*1000 })}
                  >
                    <option value="1">1 km</option>
                    <option value="2">2 km</option>
                    <option value="3">3 km</option>
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                  </select>
                </div>
              )}
              <div>
                <label className="input-label">City & Area</label>
                <CityAreaSelector onChange={(meta) => setCityMeta(meta)} />
                {cityMeta?.city && cityMeta?.area && (
                  <p className="text-xs text-gray-500 mt-1">Selected: {cityMeta.area}, {cityMeta.city}</p>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1">
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">
                  {cityMeta?.city && cityMeta?.area ? (
                    <span className="flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-accent-500" />
                      Shops near {cityMeta.area}
                    </span>
                  ) : locationName ? (
                    <span className="flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-accent-500" />
                      Shops near {locationName}
                    </span>
                  ) : hasSearchParams ? (
                    'Search Results'
                  ) : (
                    'All Shops'
                  )}
                </h1>
                {(cityMeta?.city && cityMeta?.area) ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{cityMeta.area}, {cityMeta.city}</span>
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">
                      {(advancedResults?.shops?.length || 0) > 0
                        ? (() => {
                            const r = Number(filters.radius);
                            const km = r/1000; const display = km >= 1 ? `${km%1===0?km.toFixed(0):km.toFixed(1)} km` : `${r.toFixed(0)} m`;
                            return `${advancedResults.shops.length} ${advancedResults.shops.length === 1 ? 'shop' : 'shops'} found within ${display}`;
                          })()
                        : 'No shops found nearby'}
                    </span>
                  </div>
                ) : (locationName && lat && lon) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{locationName}</span>
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">
                      {shops.length > 0 
                        ? (() => {
                            const r = Number(filters.radius);
                            if (!Number.isFinite(r) || r <= 0) return `${shops.length} ${shops.length === 1 ? 'shop' : 'shops'}`;
                            // radius stored in meters; display intelligently
                            const km = r / 1000;
                            const display = km >= 1 ? `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km` : `${r.toFixed(0)} m`;
                            return `${shops.length} ${shops.length === 1 ? 'shop' : 'shops'} found within ${display}`;
                          })()
                        : 'No shops found nearby'}
                    </span>
                  </div>
                )}
              </div>
              {/* Always show location button to allow overriding/adding coordinates */}
              {true && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Use My Location button clicked')
                    setIsGettingLocation(true)
                    setHasRequestedLocation(true)
                    setLocationName(null)
                    // Call getLocation directly from button click (required by browsers)
                    getLocation()
                  }}
                  disabled={geolocation.loading || isGettingLocation}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  title="Click to allow location access and find nearby shops"
                  type="button"
                >
                  {geolocation.loading || isGettingLocation ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Getting location...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      Use My Location
                    </>
                  )}
                </button>
              )}
            </div>
            
            {geolocation.loading && (
              <p className="text-gray-600 mb-2 flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Detecting your location...
              </p>
            )}
            
            {geolocation.error && hasRequestedLocation && !geolocation.loading && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  ⚠️ {geolocation.error}
                </p>
                <div className="text-xs text-yellow-700 space-y-1">
                  {permissionStatus === 'denied' ? (
                    <>
                      <p><strong>Location access is currently blocked.</strong></p>
                      <p className="mt-2"><strong>To enable location access:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-2 mt-1">
                        <li><strong>Chrome/Edge:</strong> Click the lock icon (🔒) → Site settings → Location → Allow</li>
                        <li><strong>Firefox:</strong> Click the lock icon → More Information → Permissions → Location → Allow</li>
                        <li><strong>Safari:</strong> Safari → Settings → Websites → Location → Allow</li>
                      </ul>
                      <p className="mt-2">After allowing, refresh this page and try again.</p>
                    </>
                  ) : (
                    <>
                      <p><strong>To enable location access:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Look for a permission prompt in your browser</li>
                        <li>Click "Allow" when asked for location access</li>
                        <li>If no prompt appears, check your browser's address bar for a location icon</li>
                      </ul>
                      <p className="mt-2">Or search manually using the search bar above.</p>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {permissionStatus === 'denied' && !hasRequestedLocation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Location access is currently blocked. Enable it in your browser settings to use the location feature.
                </p>
              </div>
            )}
            
            {/* Guidance message only when nothing provided at all */}
            {!hasSearchParams && !geolocation.loading && !hasRequestedLocation && !locationName && (
              <p className="text-gray-600 mb-4">
                Browse all available shops. Click "Use My Location" to find shops nearby, or use the search bar above.
              </p>
            )}
            
            {!locationName && (
              <p className="text-gray-600">{shops.length} {shops.length === 1 ? 'shop' : 'shops'} found</p>
            )}
          </div>

          {!loading && !advLoading && (cityMeta?.city_slug ? (advancedResults?.shops||[]).length === 0 : shops.length === 0) ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-xl p-8 max-w-md mx-auto">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2 font-medium">
                  {cityMeta?.city_slug ? `No shops found in radius near ${cityMeta.area}, ${cityMeta.city}` : (locationName ? `No shops found near ${locationName}` : 'No shops found')}
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  {cityMeta?.city_slug ? `Try increasing radius (currently ${Math.round(filters.radius/1000)}km) or choose another area.` : (locationName 
                    ? `Try widening your search radius (currently ${Math.round(filters.radius/1000)}km) or check back later for new shops in your area.`
                    : hasSearchParams 
                      ? 'Try widening your search radius or changing location.'
                      : 'Start by selecting a city & area above or browse all shops.')}
                </p>
                {(locationName || cityMeta?.city_slug) && (
                  <p className="text-xs text-gray-400 mt-2">
                    {cityMeta?.city_slug ? `Selection: ${cityMeta.area}, ${cityMeta.city}` : `Your location: ${locationName}`}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              {advLoading && (
                <div className="mb-4 text-sm text-gray-500">Loading shops…</div>
              )}
              {cityMeta?.city_slug && (
                <div className="mb-6">
                  <ShopMap
                    center={cityMeta?.areaPoint || cityMeta?.cityCenter}
                    radiusMeters={filters.radius}
                    shops={advancedResults?.shops || []}
                    height={380}
                  />
                </div>
              )}
                {cityMeta?.city_slug && advancedResults?.shops?.length > 0 && (
                  <div className="mb-4 p-3 bg-accent-50 border border-accent-200 rounded-lg">
                    <p className="text-sm text-accent-800">
                      <strong>📍 Showing {advancedResults.shops.length} shops in {cityMeta.city} near {cityMeta.area}</strong>
                      <span className="text-accent-600 ml-2">(within {Math.round(filters.radius/1000)}km radius)</span>
                    </p>
                  </div>
                )}
                {!cityMeta?.city_slug && locationName && shops.length > 0 && (
                <div className="mb-4 p-3 bg-accent-50 border border-accent-200 rounded-lg">
                  <p className="text-sm text-accent-800">
                    <strong>📍 Showing {shops.length} {shops.length === 1 ? 'shop' : 'shops'} near {locationName}</strong>
                      <span className="text-accent-600 ml-2">(within {Math.round(filters.radius/1000)}km radius)</span>
                  </p>
                </div>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(cityMeta?.city_slug ? (advancedResults?.shops||[]) : shops).map((shop) => {
                  const distanceKm = shop.dist?.calculated ? (shop.dist.calculated/1000).toFixed(2) : shop.distance;
                  return <ShopCard key={shop._id} shop={shop} distanceKm={distanceKm} />
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default SearchResults

