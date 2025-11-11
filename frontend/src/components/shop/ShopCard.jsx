import { Link } from 'react-router-dom'
import { MapPin, Star, Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { favoritesAPI } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../utils/cn'

const ShopCard = ({ shop, distanceKm, onClick, compact = false, onFavoritedChange }) => {
  if (!shop) return null

  // Prefer first stored image URL; fallback chain to placeholder
  const mainImage = (shop.images && shop.images.length > 0 && shop.images[0].url) 
    ? shop.images[0].url 
    : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop'
  const rating = shop.ratings?.avg || 0
  const reviewCount = shop.ratings?.count || 0

  const { isAuthenticated, role } = useAuth()
  const [favorited, setFavorited] = useState(false)
  const [checkingFav, setCheckingFav] = useState(true)

  // Initialize favorited state (when card appears in favorites page or general list)
  useEffect(() => {
    let mounted = true
    if (isAuthenticated && role === 'customer') {
      favoritesAPI.isFavorited(shop._id)
        .then(r => {
          if (mounted) setFavorited(!!r.data.favorited)
        })
        .catch(() => {})
        .finally(() => mounted && setCheckingFav(false))
    } else {
      setCheckingFav(false)
    }
    return () => { mounted = false }
  }, [shop._id, isAuthenticated, role])

  const onToggleFavorite = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated || role !== 'customer') {
      // Redirect lightweight: send to login page
      window.location.href = '/login/customer'
      return
    }
    try {
      const next = !favorited
      setFavorited(next) // optimistic
      if (next) {
        await favoritesAPI.add(shop._id)
      } else {
        await favoritesAPI.remove(shop._id)
      }
      onFavoritedChange?.(next, shop)
    } catch (err) {
      // revert on failure
      setFavorited((prev) => !prev)
    }
  }

  return (
    <Link
      to={`/shop/${shop._id}`}
      onClick={onClick}
      className={cn(
        'card group hover:shadow-xl transition-all duration-200 hover:-translate-y-1',
        compact && 'p-4'
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-4 bg-gray-200">
        <img
          src={mainImage}
          alt={shop.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
          onError={(e) => {
            // Ensure a consistent fallback if original image fails
            if (e.target.src !== 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop') {
              e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop'
            }
          }}
        />
        {distanceKm !== undefined && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {distanceKm.toFixed(1)} km
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold line-clamp-1">{shop.name}</h3>
          <button
            onClick={onToggleFavorite}
            disabled={checkingFav}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            title={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-5 h-5 ${favorited ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
          </div>
          <span className="text-sm text-gray-500">({reviewCount} reviews)</span>
          {typeof shop.favoritesCount === 'number' && (
            <span className="text-xs text-gray-500">• {shop.favoritesCount} favorites</span>
          )}
          {shop.category && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {shop.category}
            </span>
          )}
        </div>

        {(shop.address?.locality || shop.address?.city) && (
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {shop.address?.locality ? (
              <span>{shop.address.locality}{shop.address.city ? `, ${shop.address.city}` : ''}</span>
            ) : (
              <span>{shop.address.city}</span>
            )}
          </p>
        )}

        {/* Quick Links: Open in Maps / Directions */}
        {Array.isArray(shop.location?.coordinates) && shop.location.coordinates.length === 2 && (
          (() => {
            const [lon, lat] = shop.location.coordinates
            const openUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
            const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
            // Only stop propagation so the surrounding Link doesn't trigger; allow default anchor behavior for new tab.
            const stopPropagationOnly = (e) => { e.stopPropagation(); }
            return (
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={stopPropagationOnly}
                  className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-400 focus:ring-offset-1"
                  aria-label={`Open ${shop.name} in Google Maps (opens in new tab)`}
                  title="Open in Google Maps"
                >
                  Open in Google Maps
                </a>
                <a
                  href={dirUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={stopPropagationOnly}
                  className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-400 focus:ring-offset-1"
                  aria-label={`Get directions to ${shop.name} (opens in new tab)`}
                  title="Get Directions"
                >
                  Get Directions
                </a>
              </div>
            )
          })()
        )}
      </div>
    </Link>
  )
}

export default ShopCard

