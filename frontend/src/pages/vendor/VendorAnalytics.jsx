import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '../../hooks/useAuth'
import { fetchVendorShops } from '../../store/slices/shopsSlice'
import { reviewAPI } from '../../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

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
    <div>
      <h1 className="text-2xl font-bold mb-6">Reviews Analytics</h1>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-gray-600">Shop</label>
        <select
          value={selectedShopId}
          onChange={(e)=>setSelectedShopId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {shops?.map(s => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!stats ? (
        <p className="text-gray-600">{loading ? 'Loading shops...' : 'Select a shop to view analytics.'}</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Rating Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stars" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0F766E" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Reviews Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0,5]} />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="count" stroke="#0F766E" />
                  <Line yAxisId="right" type="monotone" dataKey="avg" stroke="#f59e0b" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Summary</h3>
              <span className="text-gray-600">Total Reviews: {stats.total} • Average: {stats.average?.toFixed?.(1) ?? stats.average}</span>
            </div>
          </div>
          <div className="card lg:col-span-2">
            <h3 className="text-lg font-semibold mb-3">Recent Reviews</h3>
            {reviews.length === 0 ? (
              <p className="text-gray-600">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map(r => (
                  <div key={r._id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium">{r.userId?.name || 'Customer'}</div>
                      <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">Rating: {r.rating}</span>
                      <span className="text-xs text-gray-500">Helpful: {r.helpfulCount}</span>
                    </div>
                    {r.text && <p className="text-sm text-gray-700">{r.text}</p>}
                    {r.images?.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {r.images.slice(0,5).map(img => (
                          <img key={img.url} src={img.url} className="w-16 h-16 object-cover rounded" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorAnalytics

