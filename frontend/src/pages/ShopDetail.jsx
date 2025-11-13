import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchShopById } from '../store/slices/shopsSlice'
import { shopAPI } from '../services/api'
import { MapPin, Clock, Phone, Heart, IndianRupee, ThumbsUp, Pencil, Trash } from 'lucide-react'
import ShopImageCarousel from '../components/shop/ShopImageCarousel'
import VendorMapEmbed from '../components/map/VendorMapEmbed'
import { reviewAPI, favoritesAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { fetchShopReviews, createReview } from '../store/slices/reviewsSlice'
import Modal from '../components/ui/Modal'
import StarRating from '../components/ui/StarRating'

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
        <div className="space-y-6">
          <div className="surface-card animate-pulse h-96 rounded-3xl" />
          <div className="surface-card animate-pulse h-28 rounded-3xl" />
        </div>
      </div>
    )
  }

  if (!selectedShop) {
    return (
      <div className="container-custom py-12">
        <div className="mx-auto max-w-xl text-center">
          <div className="alert alert-info inline-block text-left">
            <p className="alert-title">Heads up</p>
            <p className="alert-description">We couldn’t find that shop. Try returning to search results and selecting another listing.</p>
          </div>
        </div>
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
      <div className="mb-8 space-y-6">
        <ShopImageCarousel
          images={selectedShop.images || []}
          aspectRatio="16/9"
          className="overflow-hidden rounded-3xl shadow-[var(--shadow-sm)]"
        />

        <div className="surface-card flex flex-col gap-5 rounded-3xl p-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            <div>
              <p className="badge-pill bg-primary/10 text-primary">featured vendor</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-text md:text-4xl">
                {selectedShop.name}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary">
                <StarRating value={rating} readOnly size="sm" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
                <span className="text-[0.65rem] uppercase tracking-[0.16em] text-primary/70">({reviewCount} reviews)</span>
              </span>
              {selectedShop.priceRange && (
                <span className="status-pill bg-secondary/15 text-secondary">
                  {selectedShop.priceRange === 'low'
                    ? '₹ Budget'
                    : selectedShop.priceRange === 'medium'
                    ? '₹₹ Moderate'
                    : '₹₹₹ Premium'}
                </span>
              )}
              {selectedShop.distance !== undefined && (
                <span className="status-pill bg-accent/15 text-accent">
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedShop.distance.toFixed(1)} km away
                </span>
              )}
            </div>
          </div>
          <button
            onClick={toggleFavorite}
            disabled={loadingFavorite}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/85 text-danger shadow-[var(--shadow-xs)] transition-colors hover:bg-[color:var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              fill={favorited ? 'currentColor' : 'none'}
              className={`h-6 w-6 transition-colors ${favorited ? 'text-danger' : 'text-danger/60'}`}
            />
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-semibold text-text">Details</h2>
          <div className="mt-4 space-y-4">
            {selectedShop.address && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-5 w-5 text-[color:var(--color-primary)]/80" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted/80">Address</p>
                  <p className="mt-1 text-sm text-text-muted">{selectedShop.address.raw}</p>
                </div>
              </div>
            )}
            {selectedShop.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-[color:var(--color-primary)]/80" />
                <a
                  href={`tel:${selectedShop.phone}`}
                  className="text-sm font-medium text-[color:var(--color-primary)] underline-offset-4 hover:underline"
                >
                  {selectedShop.phone}
                </a>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-5 w-5 text-[color:var(--color-primary)]/80" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted/80">Hours</p>
                <div className="mt-1 space-y-1 text-sm text-text-muted">
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
                <IndianRupee className="mt-0.5 h-5 w-5 text-[color:var(--color-primary)]/80" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted/80">Average Price</p>
                  <p className="mt-1 text-sm text-text-muted">₹ {selectedShop.averagePrice}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-text">Description</h2>
          <p className="mt-4 text-sm leading-relaxed text-text-muted">
            {selectedShop.description || 'No description available.'}
          </p>
        </div>
      </div>

      {/* Location & Directions */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-text">Location & Directions</h2>
        {hasCoords ? (
          <div className="mt-4 space-y-4">
            <VendorMapEmbed
              lat={lat}
              lng={lng}
              label={selectedShop.name}
              height="320px"
              zoom={16}
            />
            <div className="flex flex-wrap gap-4 text-sm text-text-muted">
              {selectedShop.address?.raw && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted/70">Address</p>
                  <p className="mt-1">{selectedShop.address.raw}</p>
                </div>
              )}
              {selectedShop.distance !== undefined && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted/70">Approx. Distance</p>
                  <p className="mt-1">{selectedShop.distance.toFixed(2)} km</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-text-muted">Location coordinates not available for this shop.</p>
        )}
      </div>

  {/* Reviews Section */}
      <div className="card">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-text">Reviews</h2>
          <div className="flex flex-wrap gap-2">
            {['all','photos'].map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => applyFilter(filterKey)}
                className={`surface-pill px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${reviewsFilter===filterKey ? 'bg-primary/20 text-primary' : 'bg-[color:var(--color-surface)] text-text-muted hover:text-primary'}`}
                type="button"
              >
                {filterKey === 'all' ? 'All' : 'With Photos'}
              </button>
            ))}
          </div>
        </div>
        {role === 'customer' && (
          <div className="mb-4">
            {!showReviewForm ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className="btn-gradient text-xs font-semibold uppercase tracking-[0.18em]"
                type="button"
              >
                Write a review
              </button>
            ) : (
              <form onSubmit={submitReview} className="space-y-3">
                <div>
                  <label className="input-label">Rating</label>
                  <StarRating value={formRating} onChange={setFormRating} size="lg" />
                </div>
                <div>
                  <label className="input-label">Your review</label>
                  <textarea
                    value={formText}
                    onChange={(e)=>setFormText(e.target.value)}
                    minLength={10}
                    required
                    className="input-field"
                    rows={3}
                    placeholder="Share your experience (min 10 chars)"
                  />
                </div>
                <div>
                  <label className="input-label">Photos (up to 5)</label>
                  <input type="file" accept="image/*" multiple onChange={onSelectImages} className="text-sm text-text" />
                </div>
                <div className="flex gap-2">
                  <button disabled={submitting} className="btn-gradient text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-50" type="submit">
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={()=>setShowReviewForm(false)}
                    className="surface-pill px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-text"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
        {!reviewsState ? (
          <p className="text-sm text-text-muted">Loading reviews...</p>
        ) : reviewsState.reviews.length === 0 ? (
          <p className="text-sm text-text-muted">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {reviewsState.reviews.map(r => (
              <div key={r._id} className="surface-card rounded-3xl p-4 shadow-[var(--shadow-xs)]">
                <div className="mb-2 flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-text">
                      {r.userId?.name || 'Customer'}
                    </div>
                    <div className="mt-1">
                      <StarRating value={r.rating} readOnly size="sm" />
                    </div>
                  </div>
                  <span className="text-xs uppercase tracking-[0.18em] text-text-muted/70">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {r.text && <p className="mb-2 text-sm leading-relaxed text-text-muted whitespace-pre-line">{r.text}</p>}
                {r.images && r.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-2">
                    {r.images.map(img => (
                      <img
                        key={img.url}
                        src={img.url}
                        alt="review"
                        className="h-20 w-20 cursor-pointer rounded-2xl object-cover shadow-[var(--shadow-xs)]"
                        loading="lazy"
                        onClick={() => { setGalleryImage(img.url); setGalleryOpen(true); }}
                      />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => reviewAPI.markHelpful(shopId, r._id).catch(()=>{})}
                    className="flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-primary"
                  >
                    <ThumbsUp className="w-4 h-4" /> Helpful ({r.helpfulCount})
                  </button>
                  {user?._id && r.userId?._id === user._id && (
                    <>
                      <button
                        onClick={() => { setEditingId(r._id); setEditText(r.text || ''); setEditRating(r.rating); }}
                        className="flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-primary"
                      >
                        <Pencil className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={async () => { await reviewAPI.deleteReview(shopId, r._id); dispatch(fetchShopById({ shopId })); dispatch(fetchShopReviews({ shopId, params: { page:1, limit:3, sort:'newest', filter: reviewsFilter } })); }}
                        className="flex items-center gap-1 text-xs text-danger transition-colors hover:text-danger/80"
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
                      <label className="text-sm font-semibold text-text-muted">Rating</label>
                      <StarRating value={editRating} onChange={setEditRating} />
                    </div>
                    <textarea value={editText} onChange={(e)=>setEditText(e.target.value)} className="input-field" rows={3} />
                    <div className="flex gap-2">
                      <button className="btn-gradient text-xs font-semibold uppercase tracking-[0.18em]" type="submit">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={()=>setEditingId(null)}
                        className="surface-pill px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-text"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
            {reviewsState.pagination && reviewsState.reviews.length < reviewsState.pagination.total && (
              <button
                onClick={loadMoreReviews}
                className="surface-pill mt-2 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-text hover:text-primary"
                type="button"
              >
                Load more
              </button>
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

