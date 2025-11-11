import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { MapPin, Camera, BarChart3, Search, ArrowRight, Navigation } from 'lucide-react'
import { shopAPI } from '../services/api'
import Button from '../components/ui/Button'
import { useGeolocation } from '../hooks/useGeolocation'
import AddressAutocomplete from '../components/search/AddressAutocomplete'

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sessionToken] = useState(() => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAuth()
  const { location: geolocation, getLocation } = useGeolocation()
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  // We now reuse AddressAutocomplete component for consistent UI/UX with navbar

  const handleSelectSuggestion = async (s) => {
    setSearchQuery(`${s.label || s.locality || s.city || s.displayName}`)
    // If Google prediction, fetch details for precise coordinates
    if (s.provider === 'google' && s.placeId) {
      try {
        const detailsRes = await shopAPI.placeDetails(s.placeId, sessionToken)
        const place = detailsRes.data.place
        if (place?.latitude && place?.longitude) {
          navigate(`/search?lat=${place.latitude}&lon=${place.longitude}`)
          return
        }
      } catch (e) {
        console.warn('Failed to fetch Google place details, falling back to query navigation', e)
      }
    }
    if (s.latitude && s.longitude) {
      navigate(`/search?lat=${s.latitude}&lon=${s.longitude}`)
    } else {
      navigate(`/search?q=${encodeURIComponent(s.displayName)}`)
    }
  }

  const handleUseLocation = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Use My Location button clicked from Home page')
    setIsGettingLocation(true)
    // Call getLocation directly from button click (required by browsers)
    getLocation()
  }

  // Navigate to search with coordinates when location is obtained
  useEffect(() => {
    if (geolocation.coordinates && isGettingLocation) {
      const { latitude, longitude } = geolocation.coordinates
      navigate(`/search?lat=${latitude}&lon=${longitude}`)
      setIsGettingLocation(false)
    }
  }, [geolocation.coordinates, isGettingLocation, navigate])

  const features = [
    {
      icon: MapPin,
      title: 'Nearby Shops',
      description: 'Discover vendors in your neighborhood',
    },
    {
      icon: Camera,
      title: 'Quick Onboarding',
      description: 'List your shop in minutes using a shop photo',
    },
    {
      icon: BarChart3,
      title: 'Simple Analytics',
      description: 'Track views and reviews',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0F766E] to-[#06B6D4] text-white py-20">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
                Find great local shops nearby
              </h1>
              <p className="text-xl mb-8 text-white/90">
                Search by neighborhood or allow location access to get started
              </p>

              {/* Search Bar - reuse shared AddressAutocomplete like navbar for identical look/feel */}
              <form onSubmit={handleSearch} className="mb-8 relative z-30">
                <div className="flex gap-2 max-w-md w-full">
                  <AddressAutocomplete
                    placeholder="Search by locality, area, street…"
                    onSelect={handleSelectSuggestion}
                    onQueryChange={setSearchQuery}
                    className="flex-1"
                    inputClassName="py-4 bg-white/95 text-gray-900 placeholder:text-gray-400 shadow-sm"
                    dropdownClassName="shadow-xl"
                  />
                  <Button type="submit" variant="secondary" className="px-6">Search</Button>
                </div>
              </form>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="secondary" 
                  onClick={handleUseLocation}
                  disabled={geolocation.loading || isGettingLocation}
                  className="flex items-center gap-2"
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
                </Button>
                <Button variant="secondary" onClick={() => navigate('/search')}>
                  Find Shops
                </Button>
                <Button
                  variant="ghost"
                  className="text-white border-white hover:bg-white/10"
                  onClick={() => {
                    if (isAuthenticated && role === 'vendor') {
                      navigate('/vendor/my-shop')
                    } else {
                      navigate('/signup/vendor')
                    }
                  }}
                >
                  List Your Shop
                  <ArrowRight className="w-4 h-4 ml-2 inline" />
                </Button>
              </div>
              
              {geolocation.error && (
                <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm font-medium text-white mb-2">
                    ⚠️ {geolocation.error}
                  </p>
                  <p className="text-xs text-white/80">
                    Click the lock icon in your browser's address bar and allow location access, then try again.
                  </p>
                </div>
              )}
            </div>

            {/* Right Visual */}
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 aspect-square flex items-center justify-center">
                <MapPin className="w-48 h-48 text-white/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-[#0F766E]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-[#0F766E]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom text-center">
          <p className="text-lg text-gray-600">
            <span className="font-bold text-[#0F766E]">1200+</span> shops listed •{' '}
            <span className="font-bold text-[#0F766E]">5000+</span> happy customers
          </p>
        </div>
      </section>
    </div>
  )
}

export default Home

