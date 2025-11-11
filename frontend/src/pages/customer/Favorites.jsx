import { useEffect, useState } from 'react'
import { favoritesAPI } from '../../services/api'
import ShopCard from '../../components/shop/ShopCard'

const Favorites = () => {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
    <div>
      <h1 className="text-2xl font-bold mb-6">My Favorites</h1>
      {loading && <p className="text-gray-600">Loading...</p>}
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {!loading && shops.length === 0 && !error && (
        <p className="text-gray-600">You haven't favorited any shops yet.</p>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map(shop => (
          <ShopCard
            key={shop._id}
            shop={shop}
            compact
            onFavoritedChange={(isFav, s) => {
              if (!isFav) {
                setShops((prev) => prev.filter(x => x._id !== s._id))
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default Favorites

