import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { MapPin, Camera, BarChart3, Search, ArrowRight, Navigation, Star, Store, Users, ChevronRight, Sparkles, Coffee, Utensils, ShoppingBag } from 'lucide-react'
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
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const heroRef = useRef(null)

  const words = ['Coffee Shops', 'Local Stores', 'Restaurants', 'Services', 'Hidden Gems']

  useEffect(() => {
    const timer = setTimeout(() => {
      handleTyping()
    }, 100)

    return () => clearTimeout(timer)
  }, [currentCharIndex, isDeleting, currentWordIndex])

  const handleTyping = () => {
    const currentWord = words[currentWordIndex]
    
    if (isDeleting) {
      if (currentCharIndex > 0) {
        setCurrentCharIndex(currentCharIndex - 1)
      } else {
        setIsDeleting(false)
        setCurrentWordIndex((currentWordIndex + 1) % words.length)
      }
    } else {
      if (currentCharIndex < currentWord.length) {
        setCurrentCharIndex(currentCharIndex + 1)
      } else {
        setTimeout(() => setIsDeleting(true), 2000)
      }
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleSelectSuggestion = async (s) => {
    setSearchQuery(`${s.label || s.locality || s.city || s.displayName}`)
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
    setIsGettingLocation(true)
    getLocation()
  }

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
      title: 'Smart Discovery',
      description: 'AI-powered recommendations based on your location and preferences',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Camera,
      title: 'Visual Search',
      description: 'Find shops using photos or simply describe what you need',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: BarChart3,
      title: 'Live Insights',
      description: 'Real-time analytics for both shoppers and business owners',
      color: 'from-orange-500 to-red-500'
    }
  ]

  const shopCards = [
    { 
      icon: Store, 
      name: 'Local Stores', 
      count: '250+', 
      gradient: 'from-blue-500 to-cyan-500',
      rotation: 'rotate-3'
    },
    { 
      icon: Coffee, 
      name: 'Cafes', 
      count: '180+', 
      gradient: 'from-purple-500 to-pink-500',
      rotation: '-rotate-2'
    },
    { 
      icon: Utensils, 
      name: 'Restaurants', 
      count: '150+', 
      gradient: 'from-orange-500 to-red-500',
      rotation: 'rotate-2'
    },
    { 
      icon: ShoppingBag, 
      name: 'Services', 
      count: '300+', 
      gradient: 'from-green-500 to-emerald-500',
      rotation: '-rotate-3'
    }
  ]

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50"></div>
        <div className="absolute top-1/4 -left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute top-1/3 -right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-delayed"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-slower"></div>
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Animated Badge */}
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-lg animate-fade-in">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Discover local gems around you</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>

              {/* Main Heading with Enhanced Typing Animation */}
              <div className="space-y-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Discover Amazing
                  <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent min-h-[1.2em]">
                    {words[currentWordIndex].substring(0, currentCharIndex)}
                    <span className="typing-cursor">|</span>
                  </span>
                  Near You
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Find the best local businesses, from cozy cafes to essential services. 
                  Everything you need is just around the corner.
                </p>
              </div>

              {/* Search Section - Horizontal Layout with Side-by-side Search Icon */}
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4 animate-fade-in-up">
                  <form onSubmit={handleSearch} className="flex items-center gap-4">
                    {/* Search Input with Side-by-side Icon */}
                    <div className="flex-1 relative">
                      <div className="flex items-center gap-3 bg-transparent rounded-xl">
                        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <AddressAutocomplete
                          placeholder="Enter your area, street, or landmark..."
                          onSelect={handleSelectSuggestion}
                          onQueryChange={setSearchQuery}
                          className="flex-1"
                          inputClassName="w-full h-12 bg-transparent border-0 focus:ring-0 placeholder-gray-400 text-gray-900 text-lg pl-0"
                          dropdownClassName="shadow-xl rounded-xl border border-gray-200 mt-2"
                        />
                      </div>
                    </div>
                    
                    {/* Buttons */}
                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        className="h-12 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        Search
                      </Button>
                      <Button
                        onClick={handleUseLocation}
                        disabled={geolocation.loading || isGettingLocation}
                        variant="outline"
                        className="h-12 px-4 border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-xl font-medium transition-all duration-300 hover:shadow-lg flex items-center gap-2"
                      >
                        {geolocation.loading || isGettingLocation ? (
                          <>
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          </>
                        ) : (
                          <Navigation className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Browse All Shops Button */}
                <div className="flex justify-start">
                  <Button
                    onClick={() => navigate('/search')}
                    variant="ghost"
                    className="h-12 px-6 text-gray-600 hover:text-blue-600 rounded-xl font-medium group transition-all duration-300"
                  >
                    Browse All Shops
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Content - Animated Shop Cards */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-6">
                {shopCards.map((card, index) => {
                  const Icon = card.icon
                  return (
                    <div
                      key={index}
                      className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-6 text-white shadow-xl transform ${card.rotation} hover:rotate-0 transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer group`}
                      onClick={() => navigate(`/search?category=${card.name.toLowerCase().replace(' ', '-')}`)}
                    >
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-1">{card.name}</h3>
                          <p className="text-white/80 text-sm">{card.count} nearby</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -left-4 bg-yellow-400 rounded-2xl p-3 shadow-2xl animate-bounce">
                <Star className="w-6 h-6 text-white fill-current" />
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-green-400 rounded-2xl p-3 shadow-2xl animate-bounce delay-300">
                <Users className="w-6 h-6 text-white" />
              </div>

              {/* Background Decoration */}
              <div className="absolute -z-10 top-8 -right-8 w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-30"></div>
              <div className="absolute -z-10 bottom-8 -left-8 w-48 h-48 bg-purple-200 rounded-full blur-3xl opacity-30"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">
              Why Choose <span className="text-blue-600">Aas Paas</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're redefining how you discover and connect with local businesses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index}
                  className="group relative"
                >
                  <div className="relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl border border-gray-100 transition-all duration-500 transform hover:-translate-y-2">
                    <div className={`relative mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                      <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {feature.description}
                    </p>

                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-12 text-white shadow-2xl">
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Explore?
              </h3>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of users discovering amazing local businesses every day
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate('/search')}
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Start Exploring
                </Button>
                <Button
                  onClick={() => navigate(isAuthenticated && role === 'vendor' ? '/vendor/my-shop' : '/signup/vendor')}
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
                >
                  List Your Business
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(1deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(-1deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-15px) scale(1.05); }
        }
        .typing-cursor {
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default Home