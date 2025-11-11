import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Store, Eye, Star, MessageSquare, Loader2, AlertCircle } from 'lucide-react'
import Button from '../../components/ui/Button'
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your shops and track performance</p>
        </div>
        <Button
          onClick={() => navigate('/vendor/my-shop')}
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Shop
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Shops</p>
            <Store className="w-5 h-5 text-accent" />
          </div>
          <p className="text-2xl font-bold">{stats.totalShops}</p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Views</p>
            <Eye className="w-5 h-5 text-accent" />
          </div>
          <p className="text-2xl font-bold">{stats.totalViews}</p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Avg Rating</p>
            <Star className="w-5 h-5 text-accent" />
          </div>
          <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Reviews</p>
            <MessageSquare className="w-5 h-5 text-accent" />
          </div>
          <p className="text-2xl font-bold">{stats.totalReviews}</p>
        </div>
      </div>

      {/* My Shops Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">My Shops</h2>
          {shops && shops.length > 0 && (
            <Link
              to="/vendor/my-shop"
              className="text-sm text-accent hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add New Shop
            </Link>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {!loading && !error && (!shops || shops.length === 0) && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No shops yet</h3>
            <p className="text-gray-600 mb-6">Create your first shop to start reaching customers</p>
            <Button onClick={() => navigate('/vendor/my-shop')}>
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Shop
            </Button>
          </div>
        )}

        {!loading && !error && shops && shops.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div key={shop._id} className="relative">
                <ShopCard shop={shop} />
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      shop.status === 'live'
                        ? 'bg-green-100 text-green-800'
                        : shop.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {shop.status}
                  </span>
                  {shop.views > 0 && (
                    <span className="text-xs text-gray-500">
                      {shop.views} {shop.views === 1 ? 'view' : 'views'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Removed placeholder Recent Reviews section */}
    </div>
  )
}

export default VendorDashboard
