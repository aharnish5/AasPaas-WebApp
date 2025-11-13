import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, MapPin } from 'lucide-react'
import api from '../../services/api'

const useDebounced = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function AddressAutocomplete({
  placeholder = 'Search by location…',
  onSelect,
  onQueryChange,
  onSubmitQuery,
  minChars = 2,
  biasLatLon,
  className = '',
  inputClassName = '',
  dropdownClassName = '',
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const debounced = useDebounced(query, 300)

  useEffect(() => {
    let ignore = false
    async function run() {
      if (!debounced || debounced.trim().length < minChars) {
        setItems([])
        setOpen(false)
        return
      }
      setLoading(true)
      try {
        const params = { q: debounced.trim(), limit: 10 }
        if (biasLatLon?.lat && biasLatLon?.lon) {
          params.lat = biasLatLon.lat
          params.lon = biasLatLon.lon
        }
        const res = await api.get('/location/autocomplete', { params })
        if (!ignore) {
          setItems(res.data?.suggestions || [])
          setOpen(true)
          setActiveIndex(0)
        }
      } catch (e) {
        if (!ignore) {
          setItems([])
          setOpen(false)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    run()
    return () => {
      ignore = true
    }
  }, [debounced, minChars, biasLatLon?.lat, biasLatLon?.lon])

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = 0
    }
  }, [open, items.length])

  const handleSelect = (item) => {
    setQuery(item.label)
    setOpen(false)
    onSelect && onSelect(item)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp' && open) {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + items.length) % items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && items[activeIndex]) {
        handleSelect(items[activeIndex])
      } else if (onSubmitQuery && query && query.trim().length >= 1) {
        onSubmitQuery(query.trim())
        setOpen(false)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  useEffect(() => {
    const handler = (e) => {
      if (!listRef.current || !inputRef.current) return
      if (!listRef.current.contains(e.target) && !inputRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => {
      document.removeEventListener('click', handler)
    }
  }, [])

  return (
    <div className={`relative z-20 w-full pointer-events-auto ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          const v = e.target.value
          setQuery(v)
          setOpen(true)
          onQueryChange && onQueryChange(v)
        }}
        onFocus={() => setOpen(items.length > 0)}
        onKeyDown={onKeyDown}
        className={`input-field w-full pl-10 ${inputClassName}`}
        role="combobox"
        aria-expanded={open}
        aria-controls="autocomplete-list"
        aria-autocomplete="list"
      />
      {open && (
        <div
          ref={listRef}
          id="autocomplete-list"
          role="listbox"
          className={`absolute z-[1000] mt-2 w-full rounded-2xl border border-[color:var(--color-border)] bg-white/95 shadow-[var(--shadow-lg)] backdrop-blur ${dropdownClassName}`}
        >
          {loading ? (
            <div className="p-3 text-sm text-[color:var(--color-text-muted)]">Searching…</div>
          ) : items.length === 0 ? (
            <div className="p-3 text-sm text-[color:var(--color-text-muted)]">No matches</div>
          ) : (
            <ul>
              {items.map((item, i) => (
                <li key={`${item.latitude}-${item.longitude}-${i}`} role="option" aria-selected={i === activeIndex}>
                  <button
                    onClick={() => handleSelect(item)}
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left transition ${
                      i === activeIndex
                        ? 'bg-[color:var(--color-surface-muted)]/60'
                        : 'hover:bg-[color:var(--color-surface-muted)]/40'
                    }`}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 text-[color:var(--color-primary)]" />
                    <div className="min-w-0">
                      <div
                        className="text-sm font-medium leading-snug text-text"
                        dangerouslySetInnerHTML={{ __html: item.highlightLabel || item.label }}
                      />
                      <div className="text-xs text-[color:var(--color-text-muted)]">
                        {item.subtitle || [item.locality, item.city, item.state].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
