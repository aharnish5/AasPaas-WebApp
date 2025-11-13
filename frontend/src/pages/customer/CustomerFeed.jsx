import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Compass, Loader2, MapPin, Sparkles, AlertCircle } from 'lucide-react'
import { fetchShops } from '../../store/slices/shopsSlice'
import ShopCard from '../../components/shop/ShopCard'

const CustomerFeed = () => {
  const dispatch = useDispatch()
  const { shops, loading, error } = useSelector((state) => state.shops)

  useEffect(() => {
    // Get user location or use default
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          dispatch(
            fetchShops({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              radius: 10,
            })
          )
        },
        () => {
          // Fallback if location denied
          dispatch(fetchShops({}))
        }
      )
    } else {
      dispatch(fetchShops({}))
    }
  }, [dispatch])

  const isInitialLoading = loading && (!shops || shops.length === 0)

  return (
    <div className="container-custom space-y-8 py-8">
      <div className="surface-card relative overflow-hidden rounded-3xl px-7 py-8 shadow-[var(--shadow-sm)]">
        <div className="absolute -top-20 right-6 h-40 w-40 rounded-full bg-[color:var(--color-primary)]/20 blur-3xl" />
        <div className="absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-[color:var(--color-accent)]/18 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr),auto] md:items-center">
          <div className="space-y-3">
            <span className="badge-pill inline-flex items-center gap-2 bg-primary/10 text-[color:var(--color-primary)]">
              <Sparkles className="h-4 w-4" />
              Nearby picks
            </span>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-text md:text-4xl">
              Shops around you, hand-picked and ready.
            </h1>
            <p className="text-sm text-text-muted">
              We comb through vendors within a 10 km radius so you can explore trusted experiences without leaving your lane.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="surface-pill inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary)]">
                <MapPin className="h-4 w-4" />
                {shops.length} nearby
              </div>
              <div className="surface-pill inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                <Compass className="h-4 w-4" />
                10 km radius scan
              </div>
            </div>
          </div>
          <div className="hidden h-full justify-end md:flex">
            <div className="surface-card grid h-full min-w-[220px] place-items-center rounded-3xl px-8 py-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Live refresh</p>
              <p className="mt-3 text-4xl font-semibold text-text">{shops.length}</p>
              <p className="mt-2 text-sm text-text-muted">listings within reach</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <p className="alert-title flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="h-4 w-4" />
            Unable to load shops
          </p>
          <p className="alert-description text-sm">{error}</p>
        </div>
      )}

      {isInitialLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface-card animate-pulse rounded-3xl p-4">
              <div className="h-48 rounded-2xl bg-[color:var(--color-surface)]/60" />
              <div className="mt-4 h-4 w-3/4 rounded-full bg-[color:var(--color-surface)]/50" />
              <div className="mt-3 h-4 w-1/2 rounded-full bg-[color:var(--color-surface)]/40" />
            </div>
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-4 rounded-3xl px-8 py-14 text-center shadow-[var(--shadow-sm)]">
          <Compass className="h-14 w-14 text-[color:var(--color-primary)]" style={{ opacity: 0.32 }} />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-text">No shops found nearby</h2>
            <p className="text-sm text-text-muted">
              Try adjusting your location permissions or explore a wider radius to discover more vendors.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(fetchShops({}))}
            className="btn-gradient inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]"
          >
            Refresh search
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {shops.map((shop) => (
            <ShopCard key={shop._id} shop={shop} distanceKm={shop.distance} />
          ))}
        </div>
      )}

      {loading && shops.length > 0 && (
        <div className="flex items-center justify-center gap-3 py-6 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Updating results…
        </div>
      )}
    </div>
  )
}

export default CustomerFeed

