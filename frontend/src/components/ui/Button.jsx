import { cn } from '../../utils/cn'

const Button = ({
  children,
  variant = 'primary',
  className,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  ariaLabel,
  ...props
}) => {
  const baseStyles = 'px-4 py-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-[#0F766E] text-white hover:bg-[#0d6560] active:scale-[0.98] focus:ring-[#0F766E]/30',
    secondary: 'bg-white border border-gray-300 text-neutral-900 hover:bg-gray-50 active:scale-[0.98] focus:ring-accent/30',
    ghost: 'bg-transparent text-neutral-900 hover:bg-neutral-100 active:scale-[0.98] focus:ring-accent/30',
  }

  return (
    <button
      type={type}
      className={cn(baseStyles, variants[variant], className)}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

export default Button

