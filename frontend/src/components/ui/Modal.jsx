import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    const hasDocument = typeof document !== 'undefined'
    if (isOpen && hasDocument) {
      document.body.style.overflow = 'hidden'
      // Trap focus
      const modal = document.querySelector('[role="dialog"]')
      if (modal) {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusableElements.length > 0 && focusableElements[0] instanceof HTMLElement) {
          focusableElements[0].focus()
        }
      }
    } else if (hasDocument) {
      document.body.style.overflow = 'unset'
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    hasDocument && document.addEventListener('keydown', handleEscape)
    return () => {
      hasDocument && document.removeEventListener('keydown', handleEscape)
      if (hasDocument) document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={cn(
          'surface-card text-[var(--text-primary)] border border-[var(--border-default)] rounded-xl shadow-xl w-full outline-none',
          sizes[size],
          'animate-in fade-in zoom-in-95 duration-200'
        )}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-default)]">
            <h2 id="modal-title" className="text-xl font-semibold">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default Modal

