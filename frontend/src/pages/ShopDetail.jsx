import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchShopById } from '../store/slices/shopsSlice'
import { shopAPI } from '../services/api'
import { MapPin, Star, Clock, Phone, Heart, IndianRupee, ThumbsUp, Pencil, Trash } from 'lucide-react'
import ShopImageCarousel from '../components/shop/ShopImageCarousel'
import VendorMapEmbed from '../components/map/VendorMapEmbed'
import { reviewAPI, favoritesAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { fetchShopReviews, createReview } from '../store/slices/reviewsSlice'
import Modal from '../components/ui/Modal'

const ShopDetail = () => {
  const { shopId } = useParams()
  const dispatch = useDispatch()
  const { selectedShop, loading } = useSelector((state) => state.shops)

  const { isAuthenticated, role, user } = useAuth()
  const [favorited, setFavorited] = useState(false)
  const [loadingFavorite, setLoadingFavorite] = useState(false)
  const [reviewsFilter, setReviewsFilter] = useState('all')
  const reviewsState = useSelector((state) => state.reviews.reviewsByShop[shopId])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [formRating, setFormRating] = useState(5)
  const [formText, setFormText] = useState('')
  const [formImages, setFormImages] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImage, setGalleryImage] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editRating, setEditRating] = useState(5)

  useEffect(() => {
    if (shopId) {
      dispatch(fetchShopById({ shopId }))
      // Track view
      shopAPI.trackView(shopId).catch(console.error)
      // Load initial reviews
      dispatch(fetchShopReviews({ shopId, params: { page: 1, limit: 3, sort: 'newest' } }))
      // Check favorite status
      if (isAuthenticated && role === 'customer') {
        favoritesAPI.isFavorited(shopId).then(r => setFavorited(!!r.data.favorited)).catch(() => {})
      }
    }
  }, [shopId, dispatch, isAuthenticated, role])

  const toggleFavorite = async () => {
    if (!isAuthenticated || role !== 'customer') {
      window.location.href = '/login/customer'
      return
    }
    if (loadingFavorite) return
    setLoadingFavorite(true)
    setFavorited(prev => !prev)
    try {
      if (!favorited) {
        await favoritesAPI.add(shopId)
      } else {
        await favoritesAPI.remove(shopId)
      }
    } catch (err) {
      setFavorited(prev => !prev) // revert
    } finally {
      setLoadingFavorite(false)
    }
  }

  const loadMoreReviews = () => {
    const current = reviewsState?.reviews?.length || 0
    dispatch(fetchShopReviews({ shopId, params: { page: 1, limit: current + 5, sort: 'newest', filter: reviewsFilter } }))
  }

  const onSelectImages = (e) => {
    const files = Array.from(e.target.files || [])
    const limited = files.slice(0, 5)
    setFormImages(limited)
  }

  const submitReview = async (e) => {
    e.preventDefault()
    if (!isAuthenticated || role !== 'customer') {
      window.location.href = '/login/customer'
      return
    }
    if ((formText || '').trim().length < 10) return
    setSubmitting(true)
    try {
      await dispatch(createReview({ shopId, data: { rating: formRating, text: formText }, images: formImages }))
        .unwrap()
      setShowReviewForm(false)
      setFormText('')
      setFormImages([])
      // refresh shop to update rating summary
      dispatch(fetchShopById({ shopId }))
      // refresh reviews
      dispatch(fetchShopReviews({ shopId, params: { page: 1, limit: 5, sort: 'newest', filter: reviewsFilter } }))
    } catch (_) {
      // ignore, error handled by slice
    } finally {
      setSubmitting(false)
    }
  }

  const applyFilter = (filter) => {
    setReviewsFilter(filter)
    dispatch(fetchShopReviews({ shopId, params: { page: 1, limit: 3, sort: 'newest', filter } }))
  }

  if (loading) {
    return (
      <div className="container-custom py-12">
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-xl h-96 mb-6"></div>
          <div className="bg-gray-200 rounded h-8 w-1/2 mb-4"></div>
        </div>
      </div>
    )
  }

  if (!selectedShop) {
    return (
      <div className="container-custom py-12">
        <p className="text-center text-gray-600">Shop not found</p>
      </div>
    )
  }

  const rating = selectedShop.ratings?.avg || 0
  const reviewCount = selectedShop.ratings?.count || 0

  const hasCoords = Array.isArray(selectedShop.location?.coordinates) && selectedShop.location.coordinates.length === 2
  const [lng, lat] = hasCoords ? selectedShop.location.coordinates : [undefined, undefined]

  return (
    <div className="container-custom py-6">
      {/* Hero Section */}
      <div className="mb-8">
        <ShopImageCarousel images={selectedShop.images || []} aspectRatio="16/9" className="mb-6" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{selectedShop.name}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
                <span className="text-gray-600">({reviewCount} reviews)</span>
              </div>
              {selectedShop.priceRange && (
                <span className="text-gray-700 px-2 py-1 rounded bg-gray-100 text-sm">
                  {selectedShop.priceRange === 'low' ? '₹ Budget' : selectedShop.priceRange === 'medium' ? '₹₹ Moderate' : '₹₹₹ Premium'}
                </span>
              )}
              {selectedShop.distance !== undefined && (
                <span className="text-gray-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {selectedShop.distance.toFixed(1)} km away
                </span>
              )}
            </div>
          </div>
          <button
            onClick={toggleFavorite}
            disabled={loadingFavorite}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <Heart className={`w-6 h-6 ${favorited ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Details</h2>
          <div className="space-y-3">
            {selectedShop.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-gray-600">{selectedShop.address.raw}</p>
                </div>
              </div>
            )}
            {selectedShop.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-gray-400" />
                <a href={`tel:${selectedShop.phone}`} className="text-[#0F766E] hover:underline">
                  {selectedShop.phone}
                </a>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">Hours</p>
                <div className="text-gray-600">
                  {(() => {
                    const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
                    const map = new Map()
                    ;(selectedShop.hours || []).forEach(h => map.set(h.dayOfWeek, h))
                    return labels.map((label, idx) => {
                      const h = map.get(idx)
                      return (
                        <p key={idx}>
                          {label}: {h ? `${h.openTime} - ${h.closeTime}` : 'Closed'}
                        </p>
                      )
                    })
                  })()}
                </div>
              </div>
            </div>
            {selectedShop.averagePrice !== undefined && (
              <div className="flex items-start gap-2">
                <IndianRupee className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Average Price</p>
                  <p className="text-gray-600">₹ {selectedShop.averagePrice}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <p className="text-gray-600">{selectedShop.description || 'No description available.'}</p>
        </div>
      </div>

      {/* Location & Directions */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Location & Directions</h2>
        {hasCoords ? (
          <div className="space-y-4">
            <VendorMapEmbed
              lat={lat}
              lng={lng}
              label={selectedShop.name}
              height="320px"
              zoom={16}
            />
            <div className="text-sm text-gray-600 flex flex-wrap gap-4">
              {selectedShop.address?.raw && (
                <div>
                  <p className="font-medium">Address</p>
                  <p>{selectedShop.address.raw}</p>
                </div>
              )}
              {selectedShop.distance !== undefined && (
                <div>
                  <p className="font-medium">Approx. Distance</p>
                  <p>{selectedShop.distance.toFixed(2)} km</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-sm">Location coordinates not available for this shop.</p>
        )}
      </div>

  {/* Reviews Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Reviews</h2>
          <div className="flex gap-2">
            {['all','photos'].map(f => (
              <button
                key={f}
                onClick={() => applyFilter(f)}
                className={`text-sm px-3 py-1 rounded border ${reviewsFilter===f ? 'bg-[#0F766E] text-white border-[#0F766E]' : 'bg-white text-gray-700'}`}
              >{f === 'all' ? 'All' : 'With Photos'}</button>
            ))}
          </div>
        </div>
        {role === 'customer' && (
          <div className="mb-4">
            {!showReviewForm ? (
              <button onClick={() => setShowReviewForm(true)} className="px-4 py-2 rounded bg-[#0F766E] text-white">Write a review</button>
            ) : (
              <form onSubmit={submitReview} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Rating</label>
                  <select value={formRating} onChange={(e)=>setFormRating(parseInt(e.target.value))} className="border rounded px-2 py-1">
                    {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} stars</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Your review</label>
                  <textarea value={formText} onChange={(e)=>setFormText(e.target.value)} minLength={10} required className="w-full border rounded p-2" rows={3} placeholder="Share your experience (min 10 chars)" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Photos (up to 5)</label>
                  <input type="file" accept="image/*" multiple onChange={onSelectImages} />
                </div>
                <div className="flex gap-2">
                  <button disabled={submitting} className="px-4 py-2 rounded bg-[#0F766E] text-white disabled:opacity-50">Submit</button>
                  <button type="button" onClick={()=>setShowReviewForm(false)} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}
        {!reviewsState ? (
          <p className="text-gray-600">Loading reviews...</p>
        ) : reviewsState.reviews.length === 0 ? (
          <p className="text-gray-600">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {reviewsState.reviews.map(r => (
              <div key={r._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{r.rating}</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {r.text && <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">{r.text}</p>}
                {r.images && r.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-2">
                    {r.images.map(img => (
                      <img
                        key={img.url}
                        src={img.url}
                        alt="review"
                        className="w-20 h-20 object-cover rounded cursor-pointer"
                        loading="lazy"
                        onClick={() => { setGalleryImage(img.url); setGalleryOpen(true); }}
                      />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => reviewAPI.markHelpful(shopId, r._id).catch(()=>{})}
                    className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
                  >
                    <ThumbsUp className="w-4 h-4" /> Helpful ({r.helpfulCount})
                  </button>
                  {user?._id && r.userId?._id === user._id && (
                    <>
                      <button
                        onClick={() => { setEditingId(r._id); setEditText(r.text || ''); setEditRating(r.rating); }}
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
                      >
                        <Pencil className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={async () => { await reviewAPI.deleteReview(shopId, r._id); dispatch(fetchShopById({ shopId })); dispatch(fetchShopReviews({ shopId, params: { page:1, limit:3, sort:'newest', filter: reviewsFilter } })); }}
                        className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                      >
                        <Trash className="w-4 h-4" /> Delete
                      </button>
                    </>
                  )}
                </div>
                {editingId === r._id && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await reviewAPI.updateReview(shopId, r._id, { rating: editRating, text: editText });
                      setEditingId(null);
                      dispatch(fetchShopReviews({ shopId, params: { page:1, limit:3, sort:'newest', filter: reviewsFilter } }));
                    }}
                    className="mt-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Rating</label>
                      <select value={editRating} onChange={(e)=>setEditRating(parseInt(e.target.value))} className="border rounded px-2 py-1 text-sm">
                        {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} stars</option>)}
                      </select>
                    </div>
                    <textarea value={editText} onChange={(e)=>setEditText(e.target.value)} className="w-full border rounded p-2 text-sm" rows={3} />
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded bg-[#0F766E] text-white text-sm">Save</button>
                      <button type="button" onClick={()=>setEditingId(null)} className="px-3 py-1.5 rounded bg-gray-100 text-sm">Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            ))}
            {reviewsState.pagination && reviewsState.reviews.length < reviewsState.pagination.total && (
              <button onClick={loadMoreReviews} className="text-sm px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">Load more</button>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={galleryOpen} onClose={()=>setGalleryOpen(false)} size="xl">
        {galleryImage && (
          <img src={galleryImage} alt="review" className="max-h-[75vh] w-full object-contain" />
        )}
      </Modal>
    </div>
  )
}

export default ShopDetail

