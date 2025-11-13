import { cn } from '../../utils/cn'

const Button = ({
  children,
  variant = 'primary',
  className,
  loading = false,
  disabled = false,
  type = 'button',
  ariaLabel,
  icon,
  iconPosition = 'left',
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 font-semibold tracking-[0.02em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60'

  const variants = {
    primary:
      'bg-gradient-to-br from-[color:var(--color-primary)] via-[#8667ff] to-[color:var(--color-secondary)] text-[color:var(--color-primary-foreground)] shadow-[0_12px_32px_rgba(123,93,255,0.28)] hover:-translate-y-[2px] hover:shadow-[0_18px_40px_rgba(123,93,255,0.34)] active:translate-y-0',
    secondary:
      'bg-[color:var(--color-surface)] text-text shadow-[var(--shadow-xs)] border border-border/70 hover:-translate-y-[1px] hover:shadow-[var(--shadow-sm)] active:translate-y-0',
    outline:
      'border border-[color:var(--color-border)] bg-transparent text-text hover:border-[color:var(--color-primary)]/50 hover:text-[color:var(--color-primary)]',
    ghost:
      'bg-transparent text-text-muted hover:text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-muted)]/70',
    pill:
      'rounded-full bg-[color:var(--color-surface)]/80 px-5 py-2 text-xs uppercase tracking-[0.22em] text-text-muted shadow-[var(--shadow-xs)] hover:bg-[color:var(--color-surface)] hover:text-text'
  }

  return (
    <button
      type={type}
      className={cn(baseStyles, variants[variant], className)}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
          <span className="text-sm font-semibold">Loading…</span>
        </span>
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </button>
  )
}

export default Button
