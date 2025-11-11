import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Store, MapPin, Star, Eye, Plus, Edit, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button'
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Shops</h1>
          <p className="text-gray-600 mt-1">
            Manage your listed shops
          </p>
        </div>
        <Button onClick={() => navigate('/vendor/my-shop/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Shop
        </Button>
      </div>

  {/* Shops Grid */}
  {(shops?.length || 0) === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No shops listed yet</h3>
          <p className="text-gray-600 mb-6">
            Get started by adding your first shop
          </p>
          <Button onClick={() => navigate('/vendor/my-shop/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Shop
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div key={shop._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Shop Image */}
              <div className="relative h-48 bg-gray-100">
                {shop.images && shop.images.length > 0 ? (
                  <img
                    src={shop.images[0].url}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                {/* Status Badge */}
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${
                  shop.status === 'live' ? 'bg-green-100 text-green-800' :
                  shop.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {shop.status}
                </div>
              </div>

              {/* Shop Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                  {shop.name}
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${shop.status === 'live' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {shop.status}
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={shop.status === 'live'}
                      onChange={() => toggleLive(shop)}
                    />
                    <span>{shop.status === 'live' ? 'Live' : 'Not live'}</span>
                  </label>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="line-clamp-1">
                    {shop.address?.locality || shop.address?.city || shop.address?.raw || 'No address'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-400 fill-yellow-400" />
                    <span>{shop.ratings?.avg?.toFixed(1) || '0.0'} ({shop.ratings?.count || 0})</span>
                  </div>
                  {shop.priceRange && (
                    <div className="flex items-center">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {shop.priceRange === 'low' ? '₹ Budget' : shop.priceRange === 'medium' ? '₹₹ Moderate' : '₹₹₹ Premium'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    <span>{shop.stats?.views || 0}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/vendor/my-shop/edit/${shop._id}`)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(shop._id)}
                    disabled={deletingId === shop._id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default VendorShops
