import { Link } from 'react-router-dom'
import { MapPin, Star, Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { favoritesAPI } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../utils/cn'

const ShopCard = ({ shop, distanceKm, onClick, compact = false, onFavoritedChange, extraFooter }) => {
  const { isAuthenticated, role } = useAuth()
  const [favorited, setFavorited] = useState(false)
  const [checkingFav, setCheckingFav] = useState(true)

  // Initialize favorited state (when card appears in favorites page or general list)
  useEffect(() => {
    let mounted = true
    if (shop && isAuthenticated && role === 'customer') {
      favoritesAPI
        .isFavorited(shop._id)
        .then((r) => {
          if (mounted) setFavorited(!!r.data.favorited)
        })
        .catch(() => {})
        .finally(() => mounted && setCheckingFav(false))
    } else {
      setCheckingFav(false)
    }
    return () => {
      mounted = false
    }
  }, [shop, isAuthenticated, role])

  if (!shop) return null

  // Prefer first stored image URL; fallback chain to placeholder
  const rawImage = shop.images && shop.images.length > 0 && shop.images[0].url
    ? shop.images[0].url
    : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop'

  const buildCloudinaryVariant = (url) => {
    if (!url || !/res\.cloudinary\.com\//.test(url)) return url
    // Insert basic transformation for card thumbnails (lazy loaded)
    // Pattern: https://res.cloudinary.com/<cloud>/image/upload/<transform>/<publicId>
    // If a transformation segment already exists we skip
    const parts = url.split('/image/upload/')
    if (parts.length !== 2) return url
    const [prefix, suffix] = parts
    if (/w_\d+/.test(suffix)) return url // already transformed
    const transform = 'w_600,h_450,c_fill,q_auto,f_auto'
    return `${prefix}/image/upload/${transform}/${suffix}`
  }

  const mainImage = buildCloudinaryVariant(rawImage)
  const rating = shop.ratings?.avg || 0
  const reviewCount = shop.ratings?.count || 0

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
        'glass-card group relative flex h-full flex-col overflow-hidden rounded-3xl transition-transform duration-200 hover:-translate-y-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        compact ? 'pb-4' : 'pb-5'
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={mainImage}
          alt={shop.name}
          className="h-full w-full object-cover transition-transform duration-300 ease-[var(--ease-emphasized)] group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            if (e.target.src !== 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop') {
              e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop'
            }
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(15,21,40,0.75)] via-[rgba(15,21,40,0.25)] to-transparent" />

        {shop.category && (
          <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary shadow-sm backdrop-blur">
            {shop.category}
          </div>
        )}

        {typeof distanceKm === 'number' && !Number.isNaN(distanceKm) && (
          <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-text shadow-sm backdrop-blur">
            <MapPin className="h-3.5 w-3.5" />
            {distanceKm.toFixed(1)} km
          </div>
        )}

        <button
          onClick={onToggleFavorite}
          disabled={checkingFav}
          className="absolute right-4 bottom-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/40 bg-white/75 text-danger shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          title={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            fill={favorited ? 'currentColor' : 'none'}
            className={cn('h-5 w-5 transition-colors', favorited ? 'text-danger' : 'text-danger/60')}
          />
        </button>
      </div>

      <div className={cn('flex flex-grow flex-col gap-3 px-5 pt-5', compact && 'px-4 pt-4')}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-tight text-text">
            <span className="line-clamp-1">{shop.name}</span>
          </h3>
          {typeof shop.favoritesCount === 'number' && (
            <span className="badge-pill bg-accent/15 text-accent">
              {shop.favoritesCount} likes
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="font-semibold">{rating.toFixed(1)}</span>
            <span className="text-[0.7rem] uppercase tracking-[0.12em] text-primary/70">
              ({reviewCount} reviews)
            </span>
          </div>
          {shop.priceRange && (
            <span className="status-pill bg-secondary/15 text-secondary">
              {shop.priceRange === 'low'
                ? 'Budget'
                : shop.priceRange === 'medium'
                ? 'Moderate'
                : 'Premium'}
            </span>
          )}
        </div>

        {(shop.address?.locality || shop.address?.city) && (
          <p className="flex items-center gap-2 text-sm text-text-muted">
            <MapPin className="h-4 w-4 text-primary" />
            {shop.address?.locality ? (
              <span>{shop.address.locality}{shop.address.city ? `, ${shop.address.city}` : ''}</span>
            ) : (
              <span>{shop.address.city}</span>
            )}
          </p>
        )}

        {Array.isArray(shop.location?.coordinates) && shop.location.coordinates.length === 2 && (
          (() => {
            const [lon, lat] = shop.location.coordinates
            const openUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
            const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
            const stopPropagationOnly = (event) => {
              event.stopPropagation()
            }
            return (
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <a
                  href={openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={stopPropagationOnly}
                  className="surface-pill inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary"
                  aria-label={`Open ${shop.name} in Google Maps (opens in new tab)`}
                  title="Open in Google Maps"
                >
                  Explore
                </a>
                <a
                  href={dirUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={stopPropagationOnly}
                  className="btn-gradient inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em]"
                  aria-label={`Get directions to ${shop.name} (opens in new tab)`}
                  title="Get Directions"
                >
                  Get Directions
                </a>
              </div>
            )
          })()
        )}

        {extraFooter ? <div className="pt-2">{extraFooter}</div> : null}
      </div>
    </Link>
  )
}

export default ShopCard

