import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Sparkles, AlertCircle, BarChart3, TrendingUp, MessageSquare } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { fetchVendorShops } from '../../store/slices/shopsSlice'
import { reviewAPI } from '../../services/api'

const VendorAnalytics = () => {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const { shops, loading } = useSelector((s) => s.shops)
  const [selectedShopId, setSelectedShopId] = useState('')
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchVendorShops(user._id))
    }
  }, [dispatch, user?._id])

  useEffect(() => {
    if (!selectedShopId && shops?.length) {
      setSelectedShopId(shops[0]._id)
    }
  }, [shops, selectedShopId])

  useEffect(() => {
    const load = async () => {
      if (!selectedShopId || !user?._id) return
      try {
        setError(null)
        const res = await reviewAPI.vendorShopAnalytics(selectedShopId, user._id)
        setStats(res.data)
        const list = await reviewAPI.vendorShopReviews(selectedShopId, user._id, { page: 1, limit: 10, sort: 'newest' })
        setReviews(list.data.reviews || [])
      } catch (e) {
        setError(e.response?.data?.error || 'Failed to load analytics')
      }
    }
    load()
  }, [selectedShopId, user?._id])

  const breakdownData = stats
    ? Object.entries(stats.breakdown || {}).map(([stars, count]) => ({ stars, count }))
    : []

  const timeSeriesData = stats
    ? (stats.timeSeries || []).map(p => ({
        name: `${String(p._id.month).padStart(2, '0')}/${p._id.year}`,
        count: p.count,
        avg: Math.round((p.avg || 0) * 10) / 10,
      }))
    : []

  return (
    <div className="container-custom space-y-8 py-8">
      <div className="surface-card relative overflow-hidden rounded-3xl px-7 py-8 shadow-[var(--shadow-sm)]">
        <div className="absolute -top-16 right-12 h-36 w-36 rounded-full bg-[color:var(--color-primary)]/20 blur-3xl" />
        <div className="absolute -bottom-16 left-12 h-40 w-40 rounded-full bg-[color:var(--color-accent)]/16 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <span className="badge-pill inline-flex items-center gap-2 bg-primary/10 text-[color:var(--color-primary)]">
              <Sparkles className="h-4 w-4" />
              Reviews analytics
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-text md:text-4xl">Customer sentiment radar</h1>
              <p className="mt-2 text-sm text-text-muted">Track what shoppers say, spot trends early, and give credit where it is due.</p>
            </div>
          </div>
          <div className="surface-card grid min-w-[220px] gap-2 rounded-3xl px-6 py-6 text-sm text-text">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">At a glance</span>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[color:var(--color-primary)]" />
              <span>Total reviews: {stats?.total ?? 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[color:var(--color-accent)]" />
              <span>Average rating: {stats?.average?.toFixed?.(1) ?? stats?.average ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <p className="card-subtitle">Select shop</p>
            <h2 className="mt-2 text-xl font-semibold text-text">Focus view</h2>
          </div>
          <BarChart3 className="h-6 w-6 text-[color:var(--color-primary)]" />
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Shop</label>
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="input-field max-w-sm"
          >
            {shops?.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <p className="alert-title flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="h-4 w-4" />
            Could not load analytics
          </p>
          <p className="alert-description text-sm">{error}</p>
        </div>
      )}

      {!stats ? (
        <div className="surface-card flex flex-col items-center gap-4 rounded-3xl px-8 py-14 text-center shadow-[var(--shadow-sm)]">
          <BarChart3 className="h-16 w-16 text-[color:var(--color-primary)]" style={{ opacity: 0.28 }} />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-text">
              {loading ? 'Loading shops…' : 'Select a shop to view analytics'}
            </h2>
            <p className="text-sm text-text-muted">Pick a listing from the dropdown above to unlock review insights.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <div className="card-header mb-4">
              <div>
                <p className="card-subtitle">Distribution</p>
                <h3 className="mt-1 text-lg font-semibold text-text">Rating breakdown</h3>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in srgb, var(--color-border) 50%, transparent)" />
                  <XAxis dataKey="stars" stroke="color-mix(in srgb, var(--color-text-muted) 70%, transparent)" />
                  <YAxis allowDecimals={false} stroke="color-mix(in srgb, var(--color-text-muted) 70%, transparent)" />
                  <Tooltip cursor={{ fill: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header mb-4">
              <div>
                <p className="card-subtitle">Momentum</p>
                <h3 className="mt-1 text-lg font-semibold text-text">Reviews over time</h3>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in srgb, var(--color-border) 45%, transparent)" />
                  <XAxis dataKey="name" stroke="color-mix(in srgb, var(--color-text-muted) 70%, transparent)" />
                  <YAxis yAxisId="left" allowDecimals={false} stroke="color-mix(in srgb, var(--color-text-muted) 70%, transparent)" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 5]} stroke="color-mix(in srgb, var(--color-text-muted) 70%, transparent)" />
                  <Tooltip cursor={{ stroke: 'var(--color-accent)', strokeWidth: 1 }} />
                  <Line yAxisId="left" type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="avg" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-text">Summary</h3>
              <div className="surface-pill inline-flex items-center gap-3 px-4 py-2 text-sm text-text-muted">
                <MessageSquare className="h-4 w-4 text-[color:var(--color-primary)]" />
                Total reviews: {stats.total} • Average rating: {stats.average?.toFixed?.(1) ?? stats.average}
              </div>
            </div>
          </div>

          <div className="card lg:col-span-2">
            <h3 className="text-lg font-semibold text-text">Recent reviews</h3>
            <div className="mt-4 space-y-3">
              {reviews.length === 0 ? (
                <p className="text-sm text-text-muted">No reviews yet.</p>
              ) : (
                reviews.map((r) => (
                  <div key={r._id} className="rounded-2xl border border-border/60 bg-[color:var(--color-surface)]/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-text">{r.userId?.name || 'Customer'}</p>
                      <span className="text-xs text-text-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        Rating: <strong className="text-text">{r.rating}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        Helpful votes: {r.helpfulCount}
                      </span>
                    </div>
                    {r.text && <p className="mt-3 text-sm text-text-muted">{r.text}</p>}
                    {r.images?.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {r.images.slice(0, 5).map((img) => (
                          <img key={img.url} src={img.url} className="h-16 w-16 rounded-lg object-cover" />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorAnalytics

