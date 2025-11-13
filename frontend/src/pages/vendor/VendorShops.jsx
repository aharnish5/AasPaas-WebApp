import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Store, MapPin, Star, Eye, Plus, Edit, Trash2, Sparkles, AlertCircle, Loader2 } from 'lucide-react'
import { fetchVendorShops } from '../../store/slices/shopsSlice'
import { shopAPI } from '../../services/api'

const VendorShops = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { shops, loading, error } = useSelector((state) => state.shops)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchVendorShops(user._id))
    }
  }, [dispatch, user])

  const handleDelete = async (shopId) => {
    if (!confirm('Are you sure you want to delete this shop?')) return
    setDeletingId(shopId)
    try {
      await shopAPI.deleteShop(shopId)
      dispatch(fetchVendorShops(user._id))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete shop')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleLive = async (shop) => {
    const nextStatus = shop.status === 'live' ? 'suspended' : 'live'
    try {
      await shopAPI.updateShop(shop._id, { status: nextStatus })
      dispatch(fetchVendorShops(user._id))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status')
    }
  }

  return (
    <div className="container-custom space-y-8 py-8">
      <div className="surface-card relative overflow-hidden rounded-3xl px-7 py-8 shadow-[var(--shadow-sm)]">
        <div className="absolute -top-16 right-12 h-36 w-36 rounded-full bg-[color:var(--color-primary)]/20 blur-3xl" />
        <div className="absolute -bottom-16 left-12 h-40 w-40 rounded-full bg-[color:var(--color-accent)]/18 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <span className="badge-pill inline-flex items-center gap-2 bg-primary/10 text-[color:var(--color-primary)]">
              <Sparkles className="h-4 w-4" />
              Shop manager
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-text md:text-4xl">My Shops</h1>
              <p className="mt-2 text-sm text-text-muted">Review listings, toggle live status, and keep storefronts fresh.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/vendor/my-shop/create')}
            className="btn-gradient inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]"
          >
            <Plus className="h-4 w-4" />
            Add new shop
          </button>
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

      {loading && (!shops || shops.length === 0) ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface-card animate-pulse rounded-3xl p-5">
              <div className="h-44 rounded-2xl bg-[color:var(--color-surface)]/55" />
              <div className="mt-4 h-4 w-2/3 rounded-full bg-[color:var(--color-surface)]/45" />
              <div className="mt-3 h-4 w-1/2 rounded-full bg-[color:var(--color-surface)]/35" />
            </div>
          ))}
        </div>
      ) : (shops?.length || 0) === 0 ? (
        <div className="surface-card flex flex-col items-center gap-4 rounded-3xl px-8 py-14 text-center shadow-[var(--shadow-sm)]">
          <Store className="h-16 w-16 text-[color:var(--color-primary)]" style={{ opacity: 0.28 }} />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-text">No shops listed yet</h2>
            <p className="text-sm text-text-muted">Create your first listing to start attracting nearby customers.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/vendor/my-shop/create')}
            className="btn-gradient inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]"
          >
            <Plus className="h-4 w-4" />
            Create your first shop
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {shops.map((shop) => {
            const status = (shop.status || '').toLowerCase()
            const statusLabel = shop.status || 'pending'
            const statusClass =
              status === 'live'
                ? 'bg-positive/15 text-[color:var(--color-positive)] border border-positive/30'
                : status === 'pending'
                ? 'bg-warning/15 text-[color:var(--color-warning)] border border-warning/30'
                : status === 'suspended'
                ? 'bg-danger/15 text-[color:var(--color-danger)] border border-danger/30'
                : 'bg-[color:var(--color-surface)]/70 text-text-muted border border-border/60'

            return (
              <div key={shop._id} className="surface-card flex h-full flex-col overflow-hidden rounded-3xl shadow-[var(--shadow-sm)]">
                <div className="relative h-44 overflow-hidden rounded-[1.6rem]">
                  {shop.images && shop.images.length > 0 ? (
                    <img src={shop.images[0].url} alt={shop.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[color:var(--color-surface)]/60">
                      <Store className="h-12 w-12 text-[color:var(--color-primary)]" style={{ opacity: 0.4 }} />
                    </div>
                  )}
                  <div className={`absolute right-3 top-3 max-w-[80%] truncate whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusClass}`}>
                    {statusLabel}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div>
                    <h3 className="text-lg font-semibold text-text line-clamp-1">{shop.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                      {shop.address?.locality || shop.address?.city || shop.address?.raw || 'No address available'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 text-[color:var(--color-accent)]" />
                      {(shop.ratings?.avg ?? 0).toFixed(1)} ({shop.ratings?.count || 0})
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {shop.stats?.views || 0}
                    </span>
                    {shop.priceRange && (
                      <span className="badge-pill bg-primary/10 text-[color:var(--color-primary)]">
                        {shop.priceRange === 'low' ? '₹ Budget' : shop.priceRange === 'medium' ? '₹₹ Moderate' : '₹₹₹ Premium'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-[color:var(--color-surface)]/70 px-4 py-2 text-sm">
                    <span className="font-medium text-text">Visibility</span>
                    <div className="inline-flex items-center gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                        {status === 'live' ? 'Live' : 'Hidden'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleLive(shop)}
                        aria-pressed={status === 'live'}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] border shadow-[var(--shadow-xs)] ${status === 'live'
                          ? 'bg-[color:var(--color-primary)] border-[color:var(--color-primary)] ring-1 ring-black/10 dark:ring-white/10'
                          : 'bg-[color:var(--color-surface-muted)]/80 border-[color:var(--color-border)]/80'}`}
                        aria-label="Toggle shop visibility"
                        title="Toggle shop visibility"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ring-1 ring-black/10 dark:ring-white/10 ${status === 'live' ? 'translate-x-4' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="mt-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/vendor/my-shop/edit/${shop._id}`)}
                      className="surface-pill inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]/80"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(shop._id)}
                      className="surface-pill inline-flex items-center justify-center px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-danger)] hover:text-[color:var(--color-danger)]/80"
                      disabled={deletingId === shop._id}
                    >
                      {deletingId === shop._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {loading && shops && shops.length > 0 && (
        <div className="flex items-center justify-center gap-3 py-6 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Syncing latest updates…
        </div>
      )}
    </div>
  )
}

export default VendorShops
