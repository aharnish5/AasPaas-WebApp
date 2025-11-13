import { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Responsive image carousel with autoplay, arrows, dots, thumbnails, lazy loading and caption overlay.
// Props: images [{ url, caption? }], interval (ms), aspectRatio string like '4/3' or '16/9'
// Automatically falls back on placeholder if image fails.
export default function ShopImageCarousel({
  images = [],
  interval = 4000,
  aspectRatio = '4/3', // e.g., '16/9', '4/3'
  className = ''
}) {
  const validImages = Array.isArray(images) ? images.slice(0, 10).filter(img => img && img.url) : []
  const [index, setIndex] = useState(0)
  const [errored, setErrored] = useState({})
  const timerRef = useRef(null)
  const containerRef = useRef(null)

  const next = useCallback(() => {
    setIndex(prev => (prev + 1) % (validImages.length || 1))
  }, [validImages.length])

  const prev = () => {
    setIndex(prev => (prev - 1 + (validImages.length || 1)) % (validImages.length || 1))
  }

  // Autoplay
  useEffect(() => {
    if (validImages.length <= 1) return
    timerRef.current && clearInterval(timerRef.current)
    timerRef.current = setInterval(next, interval)
    return () => timerRef.current && clearInterval(timerRef.current)
  }, [next, interval, index, validImages.length])

  // Pause on hover (desktop)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleEnter = () => timerRef.current && clearInterval(timerRef.current)
    const handleLeave = () => {
      timerRef.current = setInterval(next, interval)
    }
    el.addEventListener('mouseenter', handleEnter)
    el.addEventListener('mouseleave', handleLeave)
    return () => {
      el.removeEventListener('mouseenter', handleEnter)
      el.removeEventListener('mouseleave', handleLeave)
    }
  }, [next, interval])

  // Preload next image for smoother experience
  useEffect(() => {
    const nextIdx = (index + 1) % validImages.length
    const nextImg = validImages[nextIdx]
    if (nextImg) {
      const img = new Image()
      img.src = nextImg.url
    }
  }, [index, validImages])

  const handleDotClick = (i) => {
    setIndex(i)
    timerRef.current && clearInterval(timerRef.current)
  }

  const fallbackUrl = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop'

  return (
    <div ref={containerRef} className={`relative w-full select-none ${className}`}>
      <div className={`relative overflow-hidden rounded-xl bg-[var(--surface-hover)] border border-[var(--border-default)]`} style={{ aspectRatio }}>
        {/* Slides */}
        <div className="w-full h-full relative">
          {validImages.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No images</div>
          ) : validImages.map((img, i) => {
            const active = i === index
            return (
              <div
                key={i}
                aria-hidden={!active}
                className={`absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}
              >
                <img
                  src={errored[i] ? fallbackUrl : img.url}
                  alt={img.caption || `Shop image ${i + 1}`}
                  loading={i === index ? 'eager' : 'lazy'}
                  className="w-full h-full object-contain bg-white"
                  onError={() => setErrored(prev => ({ ...prev, [i]: true }))}
                  draggable={false}
                />
                {img.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-sm text-white">
                    {img.caption}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {/* Arrows */}
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => { prev(); timerRef.current && clearInterval(timerRef.current) }}
              className="absolute left-2 top-1/2 -translate-y-1/2 surface-card/80 hover:bg-[var(--surface-card)] border border-[var(--border-default)] shadow-[var(--shadow-xs)] p-2 rounded-full backdrop-blur-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => { next(); timerRef.current && clearInterval(timerRef.current) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 surface-card/80 hover:bg-[var(--surface-card)] border border-[var(--border-default)] shadow-[var(--shadow-xs)] p-2 rounded-full backdrop-blur-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
        {/* Dots */}
        {validImages.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2">
            {validImages.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to image ${i + 1}`}
                onClick={() => handleDotClick(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === index ? 'bg-primary scale-125' : 'bg-[var(--surface-card)]/70 hover:bg-[var(--surface-card)]'}`}
              />
            ))}
          </div>
        )}
      </div>
      {/* Thumbnails (desktop) */}
      {validImages.length > 1 && (
        <div className="hidden md:flex mt-3 gap-2 justify-center flex-wrap">
          {validImages.map((img, i) => (
            <button
              key={i}
              onClick={() => handleDotClick(i)}
              className={`relative w-20 h-16 rounded-md overflow-hidden border ${i === index ? 'border-primary ring-2 ring-primary/30' : 'border-[var(--border-default)]'}`}
            >
              <img
                src={errored[i] ? fallbackUrl : img.url}
                alt={img.caption || `Thumb ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={() => setErrored(prev => ({ ...prev, [i]: true }))}
              />
              {i === index && (
                <div className="absolute inset-0 bg-black/10" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}