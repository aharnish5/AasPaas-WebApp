import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Loader2, Sparkles, Compass, AlertCircle } from 'lucide-react'
import { favoritesAPI } from '../../services/api'
import ShopCard from '../../components/shop/ShopCard'

const Favorites = () => {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    favoritesAPI.myFavorites()
      .then(r => {
        if (mounted) {
          setShops(r.data.shops || [])
        }
      })
      .catch(err => {
        if (mounted) setError(err.response?.data?.error || 'Failed to load favorites')
      })
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  return (
    <div className="container-custom space-y-8 py-8">
      <div className="surface-card relative overflow-hidden rounded-3xl px-7 py-8 shadow-[var(--shadow-sm)]">
        <div className="absolute -top-16 right-12 h-36 w-36 rounded-full bg-[color:var(--color-primary)]/20 blur-3xl" />
        <div className="absolute -bottom-16 left-12 h-40 w-40 rounded-full bg-[color:var(--color-accent)]/18 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <span className="badge-pill inline-flex items-center gap-2 bg-primary/10 text-[color:var(--color-primary)]">
              <Sparkles className="h-4 w-4" />
              Saved shortlist
            </span>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-text md:text-4xl">
              Your favourite courts, cafes, and corners.
            </h1>
            <p className="text-sm text-text-muted">
              Keep tabs on the vendors you love. We sync favourites across devices so you can revisit them anytime.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="surface-pill inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary)]">
                <Heart className="h-4 w-4" />
                {shops.length} saved
              </div>
              <div className="surface-pill inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                <Compass className="h-4 w-4" />
                Curate locally
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="surface-card grid h-full min-w-[220px] place-items-center rounded-3xl px-6 py-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Active favourites</p>
              <p className="mt-3 text-4xl font-semibold text-text">{shops.length}</p>
              <p className="text-xs text-text-muted">ready to revisit</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <p className="alert-title flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="h-4 w-4" />
            Could not load favourites
          </p>
          <p className="alert-description text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface-card animate-pulse rounded-3xl p-4">
              <div className="h-44 rounded-2xl bg-[color:var(--color-surface)]/55" />
              <div className="mt-4 h-4 w-2/3 rounded-full bg-[color:var(--color-surface)]/45" />
              <div className="mt-3 h-4 w-1/3 rounded-full bg-[color:var(--color-surface)]/35" />
            </div>
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-4 rounded-3xl px-8 py-14 text-center shadow-[var(--shadow-sm)]">
          <Heart className="h-14 w-14 text-[color:var(--color-primary)]" style={{ opacity: 0.32 }} />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-text">No favourites yet</h2>
            <p className="text-sm text-text-muted">
              Discover a shop you love and tap the heart to pin it here for quick access.
            </p>
          </div>
          <button
            type="button"
            className="btn-gradient inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]"
            onClick={() => navigate('/customer/')}
          >
            Explore nearby
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {shops.map((shop) => (
            <ShopCard
              key={shop._id}
              shop={shop}
              compact
              onFavoritedChange={(isFav, s) => {
                if (!isFav) {
                  setShops((prev) => prev.filter((x) => x._id !== s._id))
                }
              }}
            />
          ))}
        </div>
      )}

      {loading && shops.length > 0 && (
        <div className="flex items-center justify-center gap-3 py-6 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Syncing favourites…
        </div>
      )}
    </div>
  )
}

export default Favorites

