import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Store, Eye, Star, MessageSquare, Loader2, AlertCircle } from 'lucide-react'
import ShopCard from '../../components/shop/ShopCard'
import { fetchVendorShops } from '../../store/slices/shopsSlice'
import { useAuth } from '../../hooks/useAuth'

const VendorDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { shops, loading, error } = useSelector((state) => state.shops)
  const [stats, setStats] = useState({
    totalViews: 0,
    avgRating: 0,
    totalReviews: 0,
    totalShops: 0,
  })

  const getStatusAppearance = (status = '') => {
    const key = status.toLowerCase()
    const palette = {
      live: {
        background: 'color-mix(in srgb, var(--color-positive) 18%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-positive) 36%, transparent)',
        color: 'var(--color-positive)',
      },
      pending: {
        background: 'color-mix(in srgb, var(--color-warning) 20%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-warning) 38%, transparent)',
        color: 'color-mix(in srgb, var(--color-warning) 88%, var(--color-text))',
      },
      inactive: {
        background: 'color-mix(in srgb, var(--color-muted) 22%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-muted) 42%, transparent)',
        color: 'var(--color-text-muted)',
      },
      suspended: {
        background: 'color-mix(in srgb, var(--color-danger) 18%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-danger) 36%, transparent)',
        color: 'var(--color-danger)',
      },
    }

    return (
      palette[key] || {
        background: 'color-mix(in srgb, var(--color-muted) 18%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-muted) 34%, transparent)',
        color: 'var(--color-text-muted)',
      }
    )
  }

  // Fetch vendor's own shops
  useEffect(() => {
    if (user?._id) {
      dispatch(fetchVendorShops(user._id))
    }
  }, [dispatch, user?._id])

  // Calculate statistics
  useEffect(() => {
    if (shops && shops.length > 0) {
      const totalViews = shops.reduce((sum, shop) => sum + (shop.views || 0), 0)
      const totalReviews = shops.reduce((sum, shop) => sum + (shop.ratings?.count || 0), 0)
      const totalRatings = shops.reduce((sum, shop) => sum + (shop.ratings?.avg || 0), 0)
      const avgRating = shops.length > 0 ? totalRatings / shops.length : 0

      setStats({
        totalViews,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews,
        totalShops: shops.length,
      })
    } else {
      setStats({
        totalViews: 0,
        avgRating: 0,
        totalReviews: 0,
        totalShops: 0,
      })
    }
  }, [shops])

  const statCards = [
    { id: 'totalShops', label: 'Total Shops', value: stats.totalShops, icon: Store },
    { id: 'totalViews', label: 'Total Views', value: stats.totalViews, icon: Eye },
    { id: 'avgRating', label: 'Avg Rating', value: stats.avgRating, icon: Star, formatter: (val) => val.toFixed(1) },
    { id: 'totalReviews', label: 'Total Reviews', value: stats.totalReviews, icon: MessageSquare },
  ]

  return (
    <div className="container-custom py-6 space-y-8">
      <div className="surface-card flex flex-col gap-4 rounded-3xl border border-border/60 bg-[color:var(--color-surface)]/92 p-6 shadow-[var(--shadow-sm)] md:flex-row md:items-center md:justify-between">
        <div>
          <span className="badge-pill bg-primary/10 text-[color:var(--color-primary)]">Overview</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-text md:text-4xl">Dashboard</h1>
          <p className="mt-2 text-sm text-text-muted">Manage your shops and track performance</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/vendor/my-shop')}
          className="btn-gradient inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]"
        >
          <Plus className="h-4 w-4" />
          Create Shop
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          const value = card.formatter ? card.formatter(card.value) : card.value
          return (
            <div key={card.id} className="card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted/80">{card.label}</p>
                <Icon className="h-5 w-5 text-[color:var(--color-primary)]" />
              </div>
              <p className="mt-4 text-3xl font-semibold text-text">{value}</p>
            </div>
          )
        })}
      </div>

      <div className="card space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-text">My Shops</h2>
          {shops && shops.length > 0 && (
            <Link
              to="/vendor/my-shop"
              className="surface-pill inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]/80"
            >
              <Plus className="h-4 w-4" />
              Add New Shop
            </Link>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[color:var(--color-primary)]" />
          </div>
        )}

        {error && (
          <div className="alert alert-danger space-y-2">
            <p className="alert-title flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Issue detected
            </p>
            <p className="alert-description">{error}</p>
          </div>
        )}

        {!loading && !error && (!shops || shops.length === 0) && (
          <div className="surface-card flex flex-col items-center gap-4 rounded-3xl px-6 py-12 text-center shadow-[var(--shadow-sm)]">
            <Store className="h-16 w-16 text-[color:var(--color-primary)]" style={{ opacity: 0.28 }} />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-text">No shops yet</h3>
              <p className="text-sm text-text-muted">Create your first shop to start reaching customers.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/vendor/my-shop')}
              className="btn-gradient inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]"
            >
              <Plus className="h-4 w-4" />
              Create Your First Shop
            </button>
          </div>
        )}

        {!loading && !error && shops && shops.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => {
              const statusAppearance = getStatusAppearance(shop.status)
              return (
                <div key={shop._id}>
                  <ShopCard
                    shop={shop}
                    extraFooter={(
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="status-pill capitalize" style={statusAppearance}>
                          {shop.status || 'pending'}
                        </span>
                        {shop.views > 0 && (
                          <span className="rounded-full border border-border/60 bg-[color:var(--color-surface)]/80 px-2.5 py-1 text-xs font-medium text-text shadow-[var(--shadow-xs)] backdrop-blur">
                            {shop.views} {shop.views === 1 ? 'view' : 'views'}
                          </span>
                        )}
                      </div>
                    )}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default VendorDashboard
