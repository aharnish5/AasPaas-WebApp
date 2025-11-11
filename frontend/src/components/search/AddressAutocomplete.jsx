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
  onQueryChange, // optional callback to expose current query upward
  onSubmitQuery, // optional callback to submit free-form query on Enter
  minChars = 2,
  biasLatLon, // { lat, lon }
  className = '', // applied to container
  inputClassName = '', // extra classes for input (for hero sizing)
  dropdownClassName = '', // extra classes for suggestions container
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
        setItems([]); setOpen(false); return
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
        if (!ignore) { setItems([]); setOpen(false) }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    run()
    return () => { ignore = true }
  }, [debounced, minChars, biasLatLon?.lat, biasLatLon?.lon])

  // Ensure the dropdown always opens scrolled to the top so the first suggestion is fully visible
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
    return () => document.removeEventListener('click', handler)
  }, [])

  return (
    <div className={`relative w-full pointer-events-auto ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { const v = e.target.value; setQuery(v); setOpen(true); onQueryChange && onQueryChange(v) }}
        onFocus={() => setOpen(items.length > 0)}
        onKeyDown={onKeyDown}
        className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 ${inputClassName}`}
        role="combobox"
        aria-expanded={open}
        aria-controls="autocomplete-list"
        aria-autocomplete="list"
      />
      {open && (
        <div ref={listRef} id="autocomplete-list" role="listbox" className={`absolute z-40 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-auto ${dropdownClassName}`}>
          {loading ? (
            <div className="p-3 text-sm text-gray-500">Searching…</div>
          ) : items.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">No matches</div>
          ) : (
            <ul>
              {items.map((item, i) => (
                <li key={`${item.latitude}-${item.longitude}-${i}`} role="option" aria-selected={i===activeIndex}>
                  <button
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-gray-50 ${i===activeIndex ? 'bg-gray-50' : ''}`}
                  >
                    <MapPin className="w-4 h-4 text-accent mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium leading-snug break-words" dangerouslySetInnerHTML={{ __html: item.highlightLabel || item.label }} />
                      <div className="text-xs text-gray-500 whitespace-normal break-words">{item.subtitle || [item.locality, item.city, item.state].filter(Boolean).join(', ')}</div>
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
