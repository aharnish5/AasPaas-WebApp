import { useEffect, useMemo, useRef, useState } from 'react'
import { categoriesAPI } from '../../services/api'
import { ChevronDown, Search as SearchIcon } from 'lucide-react'
import Modal from '../ui/Modal'

// Accessible, searchable category dropdown with grouping, keyboard support, and modal fallback
export default function CategoryDropdown({ value, onChange, placeholder = 'Choose category or type to search', className = '' }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tree, setTree] = useState({ grouped: {}, counts: {} })
  const [query, setQuery] = useState('')
  const [useModal, setUseModal] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [placement, setPlacement] = useState('bottom') // 'bottom' | 'top'
  const [maxHeightPx, setMaxHeightPx] = useState(320)
  const buttonRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    categoriesAPI.tree(true)
      .then(({ data }) => {
        setTree(data)
        setError(null)
      })
      .catch((e) => setError(e?.response?.data?.error || 'Failed to load categories'))
      .finally(() => setLoading(false))
  }, [])

  // Flatten grouped map into sections for rendering
  const sections = useMemo(() => {
    const roots = tree.roots || []
    const grouped = tree.grouped || {}
    // Group per top-level root; if no children for a root, show the root itself
    return roots.map((root) => {
      const items = grouped[root.slug] && grouped[root.slug].length ? grouped[root.slug] : [root]
      return { group: root, items }
    })
  }, [tree])

  const flatItems = useMemo(() => sections.flatMap(s => s.items.map(i => ({ ...i, groupName: s.group.name }))), [sections])

  const filtered = useMemo(() => {
    if (!query.trim()) return flatItems
    const q = query.toLowerCase()
    return flatItems.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.suggestedAliases || []).some(a => a.toLowerCase().includes(q))
    )
  }, [flatItems, query])

  useEffect(() => {
    if (open && listRef.current) {
      const count = filtered.length
      // Decide placement based on viewport space
      const rect = buttonRef.current?.getBoundingClientRect()
      if (rect) {
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top
        const desired = 320 // px target list height
        if (spaceBelow < 200 && spaceAbove > spaceBelow) {
          setPlacement('top')
          setMaxHeightPx(Math.max(200, Math.min(desired, spaceAbove - 24)))
        } else {
          setPlacement('bottom')
          setMaxHeightPx(Math.max(200, Math.min(desired, spaceBelow - 24)))
        }
      }
      // too large list fallback to modal on very small screens
      setUseModal(count > 300 || (buttonRef.current?.getBoundingClientRect()?.top ?? 0) > (window.innerHeight - 120))
    }
  }, [open, filtered])

  // Recalculate on window resize/scroll while open
  useEffect(() => {
    if (!open) return
    const handler = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const desired = 320
      if (spaceBelow < 200 && spaceAbove > spaceBelow) {
        setPlacement('top')
        setMaxHeightPx(Math.max(200, Math.min(desired, spaceAbove - 24)))
      } else {
        setPlacement('bottom')
        setMaxHeightPx(Math.max(200, Math.min(desired, spaceBelow - 24)))
      }
    }
    window.addEventListener('resize', handler)
    window.addEventListener('scroll', handler, true)
    handler()
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('scroll', handler, true)
    }
  }, [open])

  // Keyboard handling
  const onKeyDown = (e) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
      listRef.current?.querySelectorAll('[role="option"]')[Math.min(activeIndex + 1, filtered.length - 1)]?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
      listRef.current?.querySelectorAll('[role="option"]')[Math.max(activeIndex - 1, 0)]?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const pick = filtered[activeIndex]
      if (pick) {
        onChange?.({ id: pick._id, slug: pick.slug, name: pick.name })
        setOpen(false)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      buttonRef.current?.focus()
    }
  }

  const currentLabel = useMemo(() => value?.name || value?.label || '', [value])

  const list = (
    <div
      className={`${useModal ? 'relative' : 'absolute'} z-30 ${!useModal && (placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1')} w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none`}
      role="listbox"
      aria-activedescendant={filtered[activeIndex]?._id}
      tabIndex={-1}
      ref={listRef}
      onKeyDown={onKeyDown}
      style={{ maxHeight: `${maxHeightPx}px` }}
    >
      <div className="sticky top-0 bg-white p-2 border-b">
        <div className="relative">
          <SearchIcon className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
            className="pl-8 pr-2 py-2 w-full text-sm outline-none"
            placeholder="Type to filter categories"
            aria-label="Filter categories"
          />
        </div>
      </div>
      {sections.map((section, si) => (
        <div key={section.group._id} className="py-1">
          <div className="px-3 py-1 text-xs font-semibold text-gray-500 sticky top-10 bg-white">
            {section.group.name}
          </div>
          {section.items
            .filter(it => !query || it.name.toLowerCase().includes(query.toLowerCase()) || (it.suggestedAliases||[]).some(a=>a.toLowerCase().includes(query.toLowerCase())))
            .map((item, idx) => {
              const index = flatItems.findIndex(fi => fi._id === item._id)
              const isActive = filtered[activeIndex]?._id === item._id
              const count = tree.counts?.[item._id] || 0
              return (
                <div
                  key={item._id}
                  id={item._id}
                  role="option"
                  aria-selected={isActive}
                  className={`px-3 py-2 cursor-pointer text-sm flex items-center justify-between ${isActive ? 'bg-accent-50 text-accent-700' : 'hover:bg-gray-50'}`}
                  onMouseEnter={() => setActiveIndex(index >= 0 ? index : 0)}
                  onClick={() => { onChange?.({ id: item._id, slug: item.slug, name: item.name }); setOpen(false) }}
                >
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    {item.description && <span className="text-xs text-gray-500">{item.description}</span>}
                  </div>
                  {count > 0 && <span className="text-xs text-gray-400">{count.toLocaleString()}</span>}
                </div>
              )
            })}
        </div>
      ))}
      {filtered.length === 0 && (
        <div className="p-3 text-sm text-gray-500">No categories found. Try a different keyword or view all categories.</div>
      )}
      <div className="p-2 border-t text-right">
        {!useModal && (
          <button className="text-sm text-accent-600 hover:underline" onClick={() => { setUseModal(true); setTimeout(()=>listRef.current?.focus(), 0) }}>View all categories</button>
        )}
      </div>
    </div>
  )

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        className="input-field flex items-center justify-between whitespace-nowrap"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'ArrowDown') { setOpen(true); setTimeout(()=>listRef.current?.focus(), 0) }}}
        ref={buttonRef}
      >
        <span className={`${currentLabel ? '' : 'text-gray-400'} truncate` }>
          {currentLabel || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 opacity-70" />
      </button>
      {open && !useModal && list}

      <Modal isOpen={open && useModal} onClose={() => setOpen(false)} title="All Categories">
        <div className="max-h-[70vh] overflow-auto" onKeyDown={onKeyDown}>
          {list}
        </div>
      </Modal>
    </div>
  )
}
