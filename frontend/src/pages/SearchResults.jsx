import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchShops, clearError } from '../store/slices/shopsSlice'
import ShopCard from '../components/shop/ShopCard'
import { Search, MapPin, Navigation, Filter } from 'lucide-react'
import CityAreaSelector from '../components/search/CityAreaSelector'
import { useGeolocation } from '../hooks/useGeolocation'
import { shopAPI } from '../services/api'
import { checkGeolocationPermission } from '../utils/permissions'
import Button from '../components/ui/Button'

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
  // Map view is deprecated; always show list

  useEffect(() => {
    checkGeolocationPermission().then((status) => {
      setPermissionStatus(status)
    })
  }, [])

  const [filters, setFilters] = useState({
    category: '',
    minRating: '',
    radius: 3000,
    priceRange: '',
    maxAveragePrice: '',
  })
  const [maxAvgInput, setMaxAvgInput] = useState('')
  const [cityMeta, setCityMeta] = useState(null)
  const [advancedResults, setAdvancedResults] = useState(null)
  const [advLoading, setAdvLoading] = useState(false)
  const [advError, setAdvError] = useState(null)

  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const query = searchParams.get('q')
  const hasSearchParams = Boolean((lat && lon) || (query && query.trim()))

  useEffect(() => {
    dispatch(clearError())
    setHasRequestedLocation(false)
    setIsGettingLocation(false)
    setLocationName(null)
  }, [dispatch, lat, lon, query])

  useEffect(() => {
    if (geolocation.coordinates && isGettingLocation) {
      const { latitude, longitude } = geolocation.coordinates
      const newParams = {}
      if (query && query.trim()) newParams.q = query.trim()
      newParams.lat = latitude.toString()
      newParams.lon = longitude.toString()
      setSearchParams(newParams)
      shopAPI
        .reverseGeocode(latitude, longitude)
        .then((response) => {
          const loc = response.data.location
          let name = loc.locality || loc.city || loc.displayName || ''
          if (!name && loc.formattedAddress) {
            const parts = loc.formattedAddress.split(',')
            for (let i = parts.length - 1; i >= 0; i--) {
              const part = parts[i].trim()
              if (part.length > 2 && !/^[0-9]+$/.test(part) && part !== 'India') {
                name = part
                break
              }
            }
          }
          if (!name) name = 'Your location'
          setLocationName(name)
        })
        .catch(() => setLocationName('Your location'))
      setIsGettingLocation(false)
    } else if (geolocation.error && isGettingLocation) {
      setIsGettingLocation(false)
    }
  }, [geolocation.coordinates, geolocation.error, isGettingLocation, query, setSearchParams])

  useEffect(() => {
    if (cityMeta?.city_slug) return
    if (lat && lon) {
      shopAPI
        .reverseGeocode(parseFloat(lat), parseFloat(lon))
        .then((response) => {
          const loc = response.data.location
          let name = loc.locality || loc.city || loc.displayName || ''
          if (!name && loc.formattedAddress) {
            const parts = loc.formattedAddress.split(',')
            for (let i = parts.length - 1; i >= 0; i--) {
              const part = parts[i].trim()
              if (part.length > 2 && !/^[0-9]+$/.test(part) && part !== 'India') {
                name = part
                break
              }
            }
          }
          if (!name) name = 'Your location'
          setLocationName(name)
        })
        .catch(() => setLocationName('Your location'))
    }
  }, [lat, lon, cityMeta?.city_slug])

  useEffect(() => {
    if (cityMeta?.city_slug && cityMeta?.areaPoint) return
    const params = {}
    if (lat && lon) {
      params.lat = lat
      params.lon = lon
    }
    if (query && query.trim()) {
      params.q = query.trim()
    }
    if (filters.category) params.category = filters.category
    if (filters.minRating) params.minRating = filters.minRating
    if (filters.priceRange) params.priceRange = filters.priceRange
    if (filters.maxAveragePrice) params.maxAveragePrice = filters.maxAveragePrice
    if (lat && lon) {
      params.radius = filters.radius / 1000 || 3
      params.sort = 'proximity'
    }
    dispatch(fetchShops(params))
  }, [dispatch, lat, lon, query, filters, cityMeta?.city_slug, cityMeta?.areaPoint])

  useEffect(() => {
    async function run() {
      if (!cityMeta?.city_slug || !cityMeta?.areaPoint) {
        setAdvancedResults(null)
        return
      }
      setAdvLoading(true)
      setAdvError(null)
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
  }, [cityMeta?.city_slug, cityMeta?.areaPoint?.lat, cityMeta?.areaPoint?.lon, filters.radius, filters.category, filters.minRating, filters.priceRange, filters.maxAveragePrice, query])

  const handleLocationClick = () => {
    setIsGettingLocation(true)
    setHasRequestedLocation(true)
    setLocationName(null)
    getLocation()
  }

  const activeShops = useMemo(
    () => (cityMeta?.city_slug ? advancedResults?.shops || [] : shops),
    [advancedResults?.shops, cityMeta?.city_slug, shops]
  )

  const totalResults = useMemo(() => {
    if (cityMeta?.city_slug) {
      return advancedResults?.shops?.length || 0
    }
    return shops.length
  }, [advancedResults?.shops?.length, cityMeta?.city_slug, shops.length])

  const mapCenter = useMemo(() => {
    if (cityMeta?.areaPoint) {
      return { lat: cityMeta.areaPoint.lat, lon: cityMeta.areaPoint.lon }
    }
    if (cityMeta?.cityCenter) {
      return cityMeta.cityCenter
    }
    if (lat && lon) {
      return { lat: parseFloat(lat), lon: parseFloat(lon) }
    }
    return null
  }, [cityMeta?.areaPoint, cityMeta?.cityCenter, lat, lon])

  // Map preview removed

  if (loading) {
    return (
      <div className="container-custom py-12">
        <div className="space-y-6">
          <div className="h-40 rounded-[32px] glass-card animate-pulse" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-72 rounded-3xl glass-card animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && error !== 'Failed to fetch shops') {
    return (
      <div className="container-custom py-12">
        <div className="mx-auto max-w-md rounded-3xl border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 p-6 text-center shadow-[var(--shadow-md)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-danger)]">Error</p>
          <p className="mt-2 text-sm text-text">{error}</p>
          <Button
            variant="outline"
            className="mt-4 justify-center text-[color:var(--color-danger)]"
            onClick={() => {
              dispatch(clearError())
              window.location.href = '/search'
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-[-20%] z-0 h-[280px] bg-[radial-gradient(circle_at_top,rgba(123,93,255,0.16),transparent_65%)]" />
      <div className="container-custom relative space-y-10 py-10">
        <div className="glass-card rounded-[32px] p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-3 rounded-full bg-[color:var(--color-surface-muted)]/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
                <Filter className="h-3.5 w-3.5" />
                Search results
              </div>
              <div>
                <h1 className="text-3xl font-semibold leading-tight text-text sm:text-4xl">
                  {cityMeta?.city && cityMeta?.area
                    ? `Shops near ${cityMeta.area}, ${cityMeta.city}`
                    : locationName
                    ? `Shops near ${locationName}`
                    : hasSearchParams
                    ? 'Personalised results'
                    : 'All neighbourhood shops'}
                </h1>
                <p className="mt-2 text-sm text-text-muted">
                  {totalResults} {totalResults === 1 ? 'listing' : 'listings'}
                  {filters.radius && ` · within ${(filters.radius / 1000).toFixed(0)} km`}
                  {query && ` · matching “${query}”`}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="justify-center"
                onClick={handleLocationClick}
                disabled={geolocation.loading || isGettingLocation}
                icon={<Navigation className="h-4 w-4" />}
              >
                {geolocation.loading || isGettingLocation ? 'Locating…' : 'Use my location'}
              </Button>
              {/* List/Map toggle removed */}
            </div>
          </div>

          {geolocation.loading && (
            <p className="mt-4 flex items-center gap-2 text-sm text-text-muted">
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--color-primary)] border-t-transparent" />
              Detecting your location…
            </p>
          )}

          {geolocation.error && hasRequestedLocation && !geolocation.loading && (
            <div className="mt-4 rounded-2xl border border-[color:var(--color-warning)]/40 bg-[color:var(--color-warning)]/10 p-4 text-sm text-text">
              <p className="font-semibold text-[color:var(--color-warning)]">Location access blocked</p>
              <p className="mt-1 text-text-muted">
                {permissionStatus === 'denied'
                  ? 'Enable location access from your browser settings and refresh this page.'
                  : geolocation.error}
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <div className="glass-card rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-text-muted">Filters</h2>
              </div>
              <div className="mt-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">Category</label>
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
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">Minimum rating</label>
                  <select
                    className="input-field"
                    value={filters.minRating}
                    onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                  >
                    <option value="">Any</option>
                    <option value="4">4+ stars</option>
                    <option value="3">3+ stars</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">Price</label>
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
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">Max average price (₹)</label>
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
                  />
                </div>
                {(lat && lon && !cityMeta?.city_slug) || cityMeta?.city_slug ? (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">Radius (km)</label>
                    <select
                      className="input-field"
                      value={Math.round(filters.radius / 1000)}
                      onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) * 1000 })}
                    >
                      {cityMeta?.city_slug ? (
                        <>
                          <option value="1">1 km</option>
                          <option value="2">2 km</option>
                          <option value="3">3 km</option>
                          <option value="5">5 km</option>
                          <option value="10">10 km</option>
                        </>
                      ) : (
                        <>
                          <option value="2">2 km</option>
                          <option value="3">3 km</option>
                          <option value="5">5 km</option>
                          <option value="10">10 km</option>
                          <option value="25">25 km</option>
                          <option value="50">50 km</option>
                        </>
                      )}
                    </select>
                  </div>
                ) : null}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">City & area</label>
                  <CityAreaSelector onChange={setCityMeta} />
                  {cityMeta?.city && cityMeta?.area && (
                    <p className="text-xs text-text-muted">Selected: {cityMeta.area}, {cityMeta.city}</p>
                  )}
                </div>
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            {advError && (
              <div className="rounded-3xl border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 p-4 text-sm text-text">
                {advError}
              </div>
            )}
            {/* Map preview removed per requirements */}

            {advLoading && (
              <p className="text-sm text-text-muted">Loading nearby shops…</p>
            )}

            {!advLoading && activeShops.length === 0 && (
              <div className="glass-card rounded-[28px] p-10 text-center">
                <MapPin className="mx-auto h-12 w-12 text-[color:var(--color-primary)]" />
                <p className="mt-4 text-lg font-semibold text-text">No shops found in this radius.</p>
                <p className="mt-2 text-sm text-text-muted">
                  Try widening your radius, adjusting filters, or searching a nearby locality.
                </p>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {activeShops.map((shop) => {
                const rawDistance = shop.dist?.calculated ? shop.dist.calculated / 1000 : shop.distance
                const distanceKm = typeof rawDistance === 'number' ? rawDistance : rawDistance ? parseFloat(rawDistance) : undefined
                return <ShopCard key={shop._id} shop={shop} distanceKm={distanceKm} />
              })}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default SearchResults

