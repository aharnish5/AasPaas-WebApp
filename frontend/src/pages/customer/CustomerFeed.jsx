import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchShops } from '../../store/slices/shopsSlice'
import ShopCard from '../../components/shop/ShopCard'

const CustomerFeed = () => {
  const dispatch = useDispatch()
  const { shops, loading } = useSelector((state) => state.shops)

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

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-xl h-48 mb-4"></div>
            <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
            <div className="bg-gray-200 rounded h-4 w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Shops Near You</h1>
        <p className="text-gray-600">{shops.length} shops found</p>
      </div>

      {shops.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No shops found nearby.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <ShopCard key={shop._id} shop={shop} distanceKm={shop.distance} />
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomerFeed

