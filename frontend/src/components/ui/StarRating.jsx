import { Star } from 'lucide-react'

/**
 * StarRating
 * - Displays 1–5 stars
 * - If onChange is provided, becomes interactive for selection
 * - Props: value (1-5), onChange(number), size ('sm'|'md'), readOnly
 */
export default function StarRating({ value = 0, onChange, size = 'md', readOnly = false, className = '' }) {
  const stars = [1, 2, 3, 4, 5]
  const isEditable = typeof onChange === 'function' && !readOnly
  const sizeCls = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'

  return (
    <div className={`inline-flex items-center gap-1 ${className}`} role={isEditable ? 'radiogroup' : undefined}>
      {stars.map((s) => {
        const filled = s <= Math.round(value)
        return (
          <button
            key={s}
            type="button"
            className={`inline-flex ${isEditable ? 'cursor-pointer' : 'cursor-default'} p-0.5 rounded`} 
            onClick={isEditable ? () => onChange(s) : undefined}
            onKeyDown={isEditable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(s) } } : undefined}
            aria-checked={filled}
            role={isEditable ? 'radio' : undefined}
            aria-label={`${s} star`}
          >
            <Star className={`${sizeCls} ${filled ? 'fill-[#f5b301] text-[#f5b301]' : 'text-text-muted'} transition-colors`} />
          </button>
        )
      })}
    </div>
  )
}
