import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { MapPin, Navigation, Loader2, CheckCircle2, AlertCircle, Upload, X, Image as ImageIcon, Sparkles, Camera } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { createShop } from '../../store/slices/shopsSlice'
import { shopAPI } from '../../services/api'
import { useGeolocation } from '../../hooks/useGeolocation'

const CATEGORIES = [
  { value: 'food', label: 'Food & Restaurant' },
  { value: 'clothing', label: 'Clothing & Fashion' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'services', label: 'Services' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'beauty', label: 'Beauty & Salon' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'other', label: 'Other' },
]


const VendorShop = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { shopId } = useParams() // Get shopId from URL for edit mode
  const isEditMode = !!shopId
  const { location: geolocation, getLocation } = useGeolocation()
  const { loading, error } = useSelector((state) => state.shops)
  const [loadingShop, setLoadingShop] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    address: {
      raw: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    },
    location: {
      latitude: null,
      longitude: null,
    },
    phone: '',
    priceRange: '', // 'low' | 'medium' | 'high'
    averagePrice: '',
    hoursPerDay: Array.from({ length: 7 }).map(() => ({
      open: '',
      openMeridiem: 'AM',
      close: '',
      closeMeridiem: 'PM',
      closed: false,
    })),
  })
  // Bulk hours selection state
  const [bulkHours, setBulkHours] = useState({ open: '', openMeridiem: 'AM', close: '', closeMeridiem: 'PM' })
  const [bulkClosed, setBulkClosed] = useState(false)
  const [bulkDays, setBulkDays] = useState([]) // array of day indexes

  const [locationMethod, setLocationMethod] = useState('current') // 'current', 'address', 'manual'
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [success, setSuccess] = useState(false)
  const [createdShop, setCreatedShop] = useState(null)
  const [uploadedImages, setUploadedImages] = useState([]) // Array of { file, preview, uploadId, uploading }
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)

  // Load shop data in edit mode
  useEffect(() => {
    if (isEditMode && shopId) {
      setLoadingShop(true)
      shopAPI.getShopById(shopId)
        .then((response) => {
          const shop = response.data.shop
          // Prepare hoursPerDay from existing hours (24h to 12h with AM/PM)
          const to12h = (time24) => {
            if (!time24) return { t: '', m: 'AM' }
            const [hStr, mStr] = time24.split(':')
            let h = parseInt(hStr, 10)
            const meridiem = h >= 12 ? 'PM' : 'AM'
            h = h % 12
            if (h === 0) h = 12
            return { t: `${String(h).padStart(2,'0')}:${mStr}`, m: meridiem }
          }
          const defaultHours = Array.from({ length: 7 }).map(() => ({ open: '', openMeridiem: 'AM', close: '', closeMeridiem: 'PM', closed: true }))
          ;(shop.hours || []).forEach(h => {
            const o = to12h(h.openTime)
            const c = to12h(h.closeTime)
            defaultHours[h.dayOfWeek] = { open: o.t, openMeridiem: o.m, close: c.t, closeMeridiem: c.m, closed: false }
          })
          setFormData({
            name: shop.name || '',
            description: shop.description || '',
            category: shop.category || '',
            address: {
              raw: shop.address?.raw || '',
              street: shop.address?.street || '',
              city: shop.address?.city || '',
              state: shop.address?.state || '',
              postalCode: shop.address?.postalCode || '',
              country: shop.address?.country || 'India',
            },
            location: {
              latitude: shop.location?.coordinates?.[1] || null,
              longitude: shop.location?.coordinates?.[0] || null,
            },
            phone: shop.phone || '',
            priceRange: shop.priceRange || '',
            averagePrice: shop.averagePrice ?? '',
            hoursPerDay: defaultHours,
          })
          // Set existing images
          if (shop.images && shop.images.length > 0) {
            setUploadedImages(shop.images.map(img => ({
              url: img.url,
              existing: true, // mark as existing image
            })))
          }
        })
        .catch((err) => {
          console.error('Failed to load shop:', err)
          alert('Failed to load shop data')
          navigate('/vendor/my-shop')
        })
        .finally(() => setLoadingShop(false))
    }
  }, [isEditMode, shopId, navigate])

  // Handle geolocation
  useEffect(() => {
    if (geolocation.coordinates && isGettingLocation) {
      const { latitude, longitude } = geolocation.coordinates
      setFormData((prev) => ({
        ...prev,
        location: { latitude, longitude },
      }))
      
      // Reverse geocode to get address
      shopAPI.reverseGeocode(latitude, longitude)
        .then((response) => {
          const loc = response.data.location
          setFormData((prev) => ({
            ...prev,
            address: {
              raw: loc.formattedAddress || prev.address.raw,
              street: loc.street || prev.address.street,
              city: loc.city || prev.address.city,
              state: loc.state || prev.address.state,
              postalCode: loc.postalCode || prev.address.postalCode,
              country: loc.country || 'India',
            },
          }))
          setIsGettingLocation(false)
        })
        .catch((err) => {
          console.error('Reverse geocode error:', err)
          setIsGettingLocation(false)
        })
    } else if (geolocation.error && isGettingLocation) {
      setIsGettingLocation(false)
      setGeocodeError(geolocation.error)
    }
  }, [geolocation, isGettingLocation])

  const handleUseCurrentLocation = (e) => {
    e.preventDefault()
    setIsGettingLocation(true)
    setGeocodeError(null)
    getLocation()
  }

  const handleGeocodeAddress = async (e) => {
    e.preventDefault()
    if (!formData.address.raw.trim()) {
      setGeocodeError('Please enter an address')
      return
    }

    setIsGeocoding(true)
    setGeocodeError(null)

    try {
      const response = await shopAPI.geocode(formData.address.raw)
      const loc = response.data.location
      
      setFormData((prev) => ({
        ...prev,
        location: {
          latitude: loc.latitude,
          longitude: loc.longitude,
        },
        address: {
          ...prev.address,
          street: loc.street || prev.address.street,
          city: loc.city || prev.address.city,
          state: loc.state || prev.address.state,
          postalCode: loc.postalCode || prev.address.postalCode,
          country: loc.country || 'India',
        },
      }))
    } catch (err) {
      console.error('Geocode error:', err)
      setGeocodeError(err.response?.data?.error || 'Failed to geocode address. Please enter coordinates manually.')
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Filter to only image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      setGeocodeError('Please select image files only')
      return
    }

    // Limit to 10 images
    if (uploadedImages.length + imageFiles.length > 10) {
      setGeocodeError('Maximum 10 images allowed')
      return
    }

    setIsUploadingImage(true)
    setGeocodeError(null)

    try {
      // Upload each image
      const uploadPromises = imageFiles.map(async (file) => {
        // Create preview
        const preview = URL.createObjectURL(file)
        
        // Add to state with uploading status
        const tempId = `temp-${Date.now()}-${Math.random()}`
        setUploadedImages(prev => [...prev, { file, preview, uploadId: null, uploading: true, tempId }])
        
        try {
          const response = await shopAPI.uploadImage(file)
          const uploadId = response.data.uploadId
          
          // Update state with uploadId
          setUploadedImages(prev => 
            prev.map(img => 
              img.tempId === tempId 
                ? { ...img, uploadId, uploading: false, tempId: undefined }
                : img
            )
          )
          
          return uploadId
        } catch (error) {
          console.error('Image upload error:', error)
          // Remove failed upload from state
          setUploadedImages(prev => prev.filter(img => img.tempId !== tempId))
          throw error
        }
      })

      await Promise.all(uploadPromises)
    } catch (error) {
      setGeocodeError(error.response?.data?.error || 'Failed to upload images. Please try again.')
    } finally {
      setIsUploadingImage(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleRemoveImage = (index) => {
    setUploadedImages(prev => {
      const removed = prev[index]
      // Revoke preview URL to free memory
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  // AI Autofill from a single photo
  const handleInferFromPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setGeocodeError('Please select an image file');
      return;
    }

    setAiLoading(true);
    setGeocodeError(null);
    try {
      const res = await shopAPI.inferFromImage(file);
      const { uploadId, tempUrl, ai, error } = res.data;

      // Attach returned image to uploadedImages list
      if (uploadId && tempUrl) {
  setUploadedImages(prev => [{ uploadId, preview: tempUrl, uploading: false }, ...prev].slice(0,10));
      }

      if (error) {
        setAiResult(null);
        throw new Error(error);
      }

      setAiResult(ai);

      // Merge AI hints into form (non-destructive)
      setFormData(prev => ({
        ...prev,
        name: prev.name || ai?.name || prev.name,
        description: prev.description || ai?.description || prev.description,
        category: prev.category || ai?.suggestedCategory || prev.category,
        address: {
          ...prev.address,
          street: prev.address.street || ai?.address?.street || prev.address.street,
          city: prev.address.city || ai?.address?.city || prev.address.city,
          state: prev.address.state || ai?.address?.state || prev.address.state,
          postalCode: prev.address.postalCode || ai?.address?.postal_code || prev.address.postalCode,
        },
        phone: prev.phone || ai?.phoneNumber || prev.phone,
      }));
    } catch (err) {
      console.error('AI infer failed:', err);
      setGeocodeError(err.message || 'Failed to infer from photo');
    } finally {
      setAiLoading(false);
      // reset input value to allow re-select same file
      e.target.value = '';
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeocodeError(null)
    setSuccess(false)

    // Validate required fields
    const errors = []
    if (!formData.name?.trim()) {
      errors.push('Shop name is required')
    }
    if (!formData.category) {
      errors.push('Category is required')
    }
    if (!formData.address?.raw?.trim()) {
      errors.push('Address is required')
    }
    if (!formData.location?.latitude || !formData.location?.longitude) {
      errors.push('Location coordinates are required. Please use "Use Current Location", "Enter Address" and click "Get Coordinates", or enter coordinates manually.')
    }
    
    if (errors.length > 0) {
      setGeocodeError(errors.join('. '))
      return
    }

    // Prepare shop data
    // convert hoursPerDay to backend format (24h HH:MM) and omit closed/empty days
    const to24h = (t12, m) => {
      if (!t12) return ''
      const [hh, mm] = t12.split(':').map(x => parseInt(x, 10))
      let h = hh % 12
      if (m === 'PM') h += 12
      if (m === 'AM' && hh === 12) h = 0
      return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`
    }
    const hoursArray = (formData.hoursPerDay || [])
      .map((d, idx) => {
        if (d.closed) return null
        if (!d.open || !d.close) return null
        const open24 = to24h(d.open, d.openMeridiem)
        const close24 = to24h(d.close, d.closeMeridiem)
        if (!open24 || !close24) return null
        return { dayOfWeek: idx, openTime: open24, closeTime: close24 }
      })
      .filter(Boolean)

    const shopData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      category: formData.category,
      address: {
        raw: formData.address.raw.trim(),
        street: formData.address.street || '',
        city: formData.address.city || '',
        state: formData.address.state || '',
        postalCode: formData.address.postalCode || '',
        country: formData.address.country || 'India',
      },
      location: {
        coordinates: [formData.location.longitude, formData.location.latitude], // [lon, lat] for MongoDB
      },
      phone: formData.phone.trim() || undefined,
        priceRange: formData.priceRange || undefined,
        averagePrice: formData.averagePrice !== '' ? Number(formData.averagePrice) : undefined,
        hours: hoursArray.length > 0 ? hoursArray : undefined,
      uploadIds: uploadedImages
        .filter(img => img.uploadId && !img.uploading && !img.existing)
        .map(img => img.uploadId), // Only include successfully uploaded new images
    }

    try {
      if (isEditMode) {
        // Update existing shop
        await shopAPI.updateShop(shopId, shopData)
        setSuccess(true)
        setTimeout(() => navigate('/vendor/my-shop'), 2000)
      } else {
        // Create new shop
        const result = await dispatch(createShop(shopData)).unwrap()
        setSuccess(true)
        setCreatedShop(result)
        
        // Reset form after 3 seconds
        setTimeout(() => {
          navigate('/vendor/my-shop')
        }, 2000)
      }
    } catch (err) {
      // unwrap() throws either a string (rejectWithValue) or an Error
      const msg = typeof err === 'string' 
        ? err 
        : (err?.response?.data?.error || err?.message || 'Failed to save shop');
      setGeocodeError(msg)
    }
  }

  if (loadingShop) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary/20 to-accent/20 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isEditMode ? 'Edit Shop' : 'Create Your Shop'}</h1>
            <p className="text-[var(--text-muted)]">
              {isEditMode ? 'Update your shop information' : 'Add your shop to help customers find you'}
            </p>
          </div>
        </div>
      </div>

      <div className="surface-card text-[var(--text-primary)] border border-[var(--border-default)] rounded-2xl p-6 md:p-8">

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="text-green-600" size={20} />
              <div className="flex-1">
                <p className="text-green-800 font-medium">
                  {isEditMode ? 'Shop updated successfully!' : 'Shop created successfully!'}
                </p>
                <p className="text-green-600 text-sm">
                  {isEditMode ? 'Your changes have been saved.' : `Your shop "${formData.name}" is now live.`}
                </p>
              </div>
            </div>
          )}

          {(error || geocodeError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="text-red-600" size={20} />
              <p className="text-red-800">{error || geocodeError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* AI Autofill */}
            <div className="p-4 border border-[var(--border-default)] rounded-xl bg-[var(--surface-hover)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">Autofill from Photo</h2>
                </div>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleInferFromPhoto}
                      className="hidden"
                      aria-label="Upload or capture a photo for AI autofill"
                    />
                    <span className="text-sm text-primary hover:underline flex items-center gap-1">
                      <Upload className="w-4 h-4" /> Upload / Capture
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      // Create a dedicated capture-only input to strongly hint camera usage.
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.capture = 'environment'
                      input.style.display = 'none'
                      input.onchange = (e) => handleInferFromPhoto(e)
                      document.body.appendChild(input)
                      input.click()
                      setTimeout(() => {
                        // Clean up element after interaction
                        document.body.removeChild(input)
                      }, 2000)
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border border-[color:var(--color-border)] text-[color:var(--color-primary)] bg-[color:var(--color-surface)] hover:bg-[color:var(--color-primary)] hover:text-[color:var(--color-primary-foreground)] transition focus:outline-none focus:ring focus:ring-[color:var(--color-ring)]"
                    aria-label="Open camera to capture a photo for AI autofill"
                  >
                    <Camera className="w-4 h-4" /> Camera
                  </button>
                </div>
              </div>
              {aiLoading ? (
                <div className="text-sm text-gray-600">Analyzing photo…</div>
              ) : aiResult ? (
                <div className="text-sm text-gray-700">
                  {aiResult.name && (
                    <div className="mb-1"><span className="font-medium">Name:</span> {aiResult.name}</div>
                  )}
                  <div><span className="font-medium">Type:</span> {aiResult.businessType}</div>
                  {aiResult.address && (aiResult.address.city || aiResult.address.street || aiResult.address.state || aiResult.address.postal_code) && (
                    <div className="mt-1 text-gray-600">
                      <span className="font-medium">Address:</span> {[aiResult.address.street, aiResult.address.city, aiResult.address.state, aiResult.address.postal_code].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {aiResult.phoneNumber && (
                    <div className="mt-1 text-gray-600"><span className="font-medium">Phone:</span> {aiResult.phoneNumber}</div>
                  )}
                  {aiResult.tags?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {aiResult.tags.slice(0,8).map((t,i)=>(
                        <span key={i} className="px-2 py-0.5 bg-white border rounded-full text-xs">#{t}</span>
                      ))}
                    </div>
                  )}
                  {aiResult.description && (
                    <div className="mt-2 text-gray-600">{aiResult.description}</div>
                  )}
                  {aiResult.confidence && (
                    <div className="mt-2 text-xs text-gray-500">
                      Confidence — Name: {Math.round(aiResult.confidence.shop_name || 0)}%, Cat: {Math.round(aiResult.confidence.category || 0)}%, Addr: {Math.round(aiResult.confidence.address || 0)}%, Phone: {Math.round(aiResult.confidence.phone_number || 0)}%
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600 flex items-start gap-2">
                  <ImageIcon className="w-4 h-4 mt-0.5 text-gray-500" />
                  <span>Add a clear shop front photo. Tap <strong>Camera</strong> on mobile for direct capture or use Upload / Capture to select an existing image.</span>
                </p>
              )}
            </div>
            {/* Shop Name */}
            <Input
              label="Shop Name *"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Rajesh Street Food Corner"
              required
            />

            {/* Description */}
            <div className="w-full">
              <label className="input-label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Tell customers about your shop..."
                rows={4}
                className="input-field"
                maxLength={2000}
              />
            </div>

            {/* Category */}
            <div className="w-full">
              <label className="input-label" htmlFor="category">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="w-full">
                <label className="input-label" htmlFor="priceRange">Price Range</label>
                <select
                  id="priceRange"
                  name="priceRange"
                  value={formData.priceRange}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priceRange: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Select</option>
                  <option value="low">Budget Friendly</option>
                  <option value="medium">Moderate</option>
                  <option value="high">Premium</option>
                </select>
              </div>
              <Input
                label="Average Price (₹)"
                name="averagePrice"
                type="number"
                min="0"
                value={formData.averagePrice}
                onChange={(e) => setFormData((prev) => ({ ...prev, averagePrice: e.target.value }))}
                placeholder="e.g., 250"
              />
            </div>

            {/* Location Section */}
            <div className="border-t border-[var(--border-default)] pt-6">
              <h2 className="text-xl font-semibold mb-4">Location</h2>

              {/* Location Method Selection */}
              <div className="mb-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setLocationMethod('current')}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    locationMethod === 'current'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Navigation className="inline mr-2" size={16} />
                  Use Current Location
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMethod('address')}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    locationMethod === 'address'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <MapPin className="inline mr-2" size={16} />
                  Enter Address
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMethod('manual')}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    locationMethod === 'manual'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Manual Coordinates
                </button>
              </div>

              {/* Current Location */}
              {locationMethod === 'current' && (
                <div className="space-y-4">
                  <Button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    loading={isGettingLocation}
                    variant="secondary"
                  >
                    <Navigation className="inline mr-2" size={16} />
                    Get My Location
                  </Button>
                  {formData.location.latitude && formData.location.longitude && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-sm text-green-800">
                        Location: {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
                      </p>
                      {formData.address.raw && (
                        <p className="text-sm text-green-600 mt-1">{formData.address.raw}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Address Entry */}
              {locationMethod === 'address' && (
                <div className="space-y-4">
                  <Input
                    label="Full Address *"
                    name="addressRaw"
                    value={formData.address.raw}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, raw: e.target.value },
                    }))}
                    placeholder="e.g., 123 Main Street, Mysore, Karnataka, India"
                    required
                  />
                  <Button
                    type="button"
                    onClick={handleGeocodeAddress}
                    loading={isGeocoding}
                    variant="secondary"
                  >
                    <MapPin className="inline mr-2" size={16} />
                    Get Coordinates from Address
                  </Button>
                  {formData.location.latitude && formData.location.longitude && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-sm text-green-800">
                        Coordinates: {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Coordinates */}
              {locationMethod === 'manual' && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Latitude *"
                    name="latitude"
                    type="number"
                    step="any"
                    value={formData.location.latitude || ''}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      location: { ...prev.location, latitude: parseFloat(e.target.value) || null },
                    }))}
                    placeholder="e.g., 12.2843"
                    required
                  />
                  <Input
                    label="Longitude *"
                    name="longitude"
                    type="number"
                    step="any"
                    value={formData.location.longitude || ''}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      location: { ...prev.location, longitude: parseFloat(e.target.value) || null },
                    }))}
                    placeholder="e.g., 76.6402"
                    required
                  />
                </div>
              )}

              {/* Address Details */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Input
                  label="Street"
                  name="street"
                  value={formData.address.street}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    address: { ...prev.address, street: e.target.value },
                  }))}
                  placeholder="Street address"
                />
                <Input
                  label="City"
                  name="city"
                  value={formData.address.city}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value },
                  }))}
                  placeholder="City"
                />
                <Input
                  label="State"
                  name="state"
                  value={formData.address.state}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    address: { ...prev.address, state: e.target.value },
                  }))}
                  placeholder="State"
                />
                <Input
                  label="Postal Code"
                  name="postalCode"
                  value={formData.address.postalCode}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    address: { ...prev.address, postalCode: e.target.value },
                  }))}
                  placeholder="Postal code"
                />
              </div>
            </div>

            {/* Phone */}
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+91 123 456 7890"
            />

            {/* Per-day Working Hours with AM/PM and Closed option */}
            <div className="border-t border-[var(--border-default)] pt-6">
              <h2 className="text-xl font-semibold mb-4">Hours (Per Day)</h2>
              {/* Bulk Apply */}
              <div className="p-4 mb-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-hover)]">
                <h3 className="font-medium mb-2 text-sm">Apply Same Hours to Multiple Days</h3>
                <div className="grid md:grid-cols-6 gap-2 items-end mb-3">
                  <div className="md:col-span-2">
                    <label className="input-label">Opens</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="hh:mm"
                        value={bulkHours.open}
                        onChange={(e) => setBulkHours(h => ({ ...h, open: e.target.value }))}
                        disabled={bulkClosed}
                        className="input-field col-span-2"
                      />
                      <select
                        value={bulkHours.openMeridiem}
                        onChange={(e) => setBulkHours(h => ({ ...h, openMeridiem: e.target.value }))}
                        disabled={bulkClosed}
                        className="input-field"
                      >
                        <option>AM</option>
                        <option>PM</option>
                      </select>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="input-label">Closes</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="hh:mm"
                        value={bulkHours.close}
                        onChange={(e) => setBulkHours(h => ({ ...h, close: e.target.value }))}
                        disabled={bulkClosed}
                        className="input-field col-span-2"
                      />
                      <select
                        value={bulkHours.closeMeridiem}
                        onChange={(e) => setBulkHours(h => ({ ...h, closeMeridiem: e.target.value }))}
                        disabled={bulkClosed}
                        className="input-field"
                      >
                        <option>AM</option>
                        <option>PM</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="input-label">Days</label>
                    <div className="flex flex-wrap gap-1">
                      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d,i)=>(
                        <button
                          type="button"
                          key={i}
                          onClick={()=> setBulkDays(prev => prev.includes(i) ? prev.filter(x=>x!==i) : [...prev, i])}
                          className={`px-2 py-1 rounded text-xs border transition-colors ${bulkDays.includes(i)
                            ? 'bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] border-[color:var(--color-primary)]'
                            : 'bg-[color:var(--color-surface)] text-text border-[color:var(--color-border)] hover:bg-[color:var(--color-surface-muted)]/70'}`}
                        >{d}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        aria-pressed={bulkClosed}
                        onClick={() => setBulkClosed((v) => !v)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] border shadow-[var(--shadow-xs)] ${bulkClosed
                          ? 'bg-[color:var(--color-primary)] border-[color:var(--color-primary)] ring-1 ring-black/10 dark:ring-white/10'
                          : 'bg-[color:var(--color-surface-muted)]/80 border-[color:var(--color-border)]/80'}`}
                        aria-label="Toggle closed for selected days"
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ring-1 ring-black/10 dark:ring-white/10 ${bulkClosed ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                      <span className="text-xs">Closed</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={bulkDays.length === 0}
                    onClick={() => {
                      if (bulkDays.length === 0) return;
                      setFormData(prev => {
                        const arr = [...prev.hoursPerDay];
                        bulkDays.forEach(d => {
                          arr[d] = {
                            open: bulkHours.open,
                            openMeridiem: bulkHours.openMeridiem,
                            close: bulkHours.close,
                            closeMeridiem: bulkHours.closeMeridiem,
                            closed: bulkClosed,
                          };
                        });
                        return { ...prev, hoursPerDay: arr };
                      });
                    }}
                    className="px-3 py-1.5 rounded text-xs bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] disabled:opacity-40 shadow-[var(--shadow-xs)] transition hover:-translate-y-[1px]"
                  >Apply to Selected Days</button>
                  <button
                    type="button"
                    onClick={() => { setBulkDays([]); setBulkClosed(false); setBulkHours({ open:'', openMeridiem:'AM', close:'', closeMeridiem:'PM'}); }}
                    className="px-3 py-1.5 rounded text-xs bg-[color:var(--color-surface)] text-text border border-[color:var(--color-border)]"
                  >Reset</button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Select multiple days then apply shared hours to avoid re-entering the same times.</p>
              </div>
              <div className="space-y-3">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((label, idx) => {
                  const day = formData.hoursPerDay[idx]
                  const updateDay = (patch) => {
                    setFormData(prev => {
                      const arr = [...prev.hoursPerDay]
                      arr[idx] = { ...arr[idx], ...patch }
                      return { ...prev, hoursPerDay: arr }
                    })
                  }
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-12 md:col-span-2">
                        <label className="block text-sm font-medium text-text">{label}</label>
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            aria-pressed={!!day.closed}
                            onClick={() => updateDay({ closed: !day.closed })}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] border shadow-[var(--shadow-xs)] ${day.closed
                              ? 'bg-[color:var(--color-primary)] border-[color:var(--color-primary)] ring-1 ring-black/10 dark:ring-white/10'
                              : 'bg-[color:var(--color-surface-muted)]/80 border-[color:var(--color-border)]/80'}`}
                            aria-label={`Toggle closed for ${label}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ring-1 ring-black/10 dark:ring-white/10 ${day.closed ? 'translate-x-4' : 'translate-x-1'}`} />
                          </button>
                          <span className="text-sm text-text">Closed</span>
                        </div>
                      </div>
                      <div className="col-span-6 md:col-span-4">
                        <label className="input-label">Opens</label>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="hh:mm"
                            value={day.open}
                            onChange={(e) => updateDay({ open: e.target.value })}
                            disabled={day.closed}
                            className="input-field col-span-2"
                          />
                          <select
                            value={day.openMeridiem}
                            onChange={(e) => updateDay({ openMeridiem: e.target.value })}
                            disabled={day.closed}
                            className="input-field"
                          >
                            <option>AM</option>
                            <option>PM</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-span-6 md:col-span-4">
                        <label className="input-label">Closes</label>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="hh:mm"
                            value={day.close}
                            onChange={(e) => updateDay({ close: e.target.value })}
                            disabled={day.closed}
                            className="input-field col-span-2"
                          />
                          <select
                            value={day.closeMeridiem}
                            onChange={(e) => updateDay({ closeMeridiem: e.target.value })}
                            disabled={day.closed}
                            className="input-field"
                          >
                            <option>AM</option>
                            <option>PM</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">Leave a day blank or mark as Closed to skip it. Hours are optional.</p>
              {/* Dedupe preview - show groups of identical hours */}
              <div className="mt-4 text-xs text-gray-600">
                {(() => {
                  const groups = new Map();
                  formData.hoursPerDay.forEach((d,i)=>{
                    if (d.closed) return;
                    if (!d.open || !d.close) return;
                    const key = `${d.open}-${d.openMeridiem}-${d.close}-${d.closeMeridiem}`;
                    if (!groups.has(key)) groups.set(key, []);
                    groups.get(key).push(i);
                  });
                  if (groups.size === 0) return <span>No active hours set.</span>;
                  return Array.from(groups.entries()).map(([k,days]) => (
                    <div key={k} className="mb-1">{days.map(d=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}: {k.replace(/-/g,' ').replace(/ (AM|PM) /g,' $1 ')} </div>
                  ));
                })()}
              </div>
            </div>

            {/* Shop Images */}
            <div className="border-t border-[var(--border-default)] pt-6">
              <h2 className="text-xl font-semibold mb-4">Shop Images</h2>
              <p className="text-sm text-gray-600 mb-4">Upload up to 5 images of your shop</p>
              
              <div className="mb-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={isUploadingImage || uploadedImages.length >= 10}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isUploadingImage || uploadedImages.length >= 10}
                    className="flex items-center gap-2"
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById('image-upload')?.click()
                    }}
                  >
                    <Upload className="w-5 h-5" />
                    {isUploadingImage ? 'Uploading...' : 'Upload Images'}
                  </Button>
                </label>
                {uploadedImages.length >= 10 && (
                  <p className="text-sm text-gray-500 mt-2">Maximum 10 images reached</p>
                )}
              </div>

              {/* Image Preview Grid */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-[var(--border-default)] bg-[var(--surface-hover)]">
                        {img.uploading ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-accent" />
                          </div>
                        ) : (
                          <img
                            src={img.preview}
                            alt={`Shop image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      {!img.uploading && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {img.uploadId && (
                        <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Uploaded
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {uploadedImages.length === 0 && (
                <div className="border-2 border-dashed border-[var(--border-default)] rounded-xl p-8 text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No images uploaded yet</p>
                  <p className="text-xs text-gray-500 mt-1">Click "Upload Images" to add shop photos</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6 border-t border-[var(--border-default)]">
              <Button
                type="submit"
                loading={loading}
                className="flex-1"
              >
                {isEditMode ? 'Update Shop' : 'Create Shop'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/vendor/dashboard')}
              >
                Cancel
              </Button>
            </div>
            
            {/* Debug info - remove this after testing */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs">
                <p>Debug: name={formData.name ? '✓' : '✗'}, category={formData.category ? '✓' : '✗'}, address={formData.address.raw ? '✓' : '✗'}, lat={formData.location.latitude ? '✓' : '✗'}, lon={formData.location.longitude ? '✓' : '✗'}</p>
              </div>
            )}
          </form>
      </div>
    </div>
  )
}

export default VendorShop
