import { memo } from 'react'
import clsx from 'clsx'

export type AppLogoProps = {
  collapsed?: boolean
  tagline?: string
  className?: string
}

const AppLogo = memo(({ collapsed = false, tagline = 'Vendor console', className }: AppLogoProps) => {
  return (
    <div className={clsx('flex items-center gap-3 text-text', className)}>
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/40 to-secondary/40 p-2 shadow-[0_12px_32px_rgba(123,93,255,0.35)] ring-1 ring-inset ring-primary/30">
        <div className="absolute inset-2 rounded-full border border-white/60 bg-[rgba(255,255,255,0.88)]" />
        <div className="absolute inset-[10%] rounded-full border-2 border-white/70" />
        <div className="absolute inset-[25%] rounded-full border border-white/80" />
        <svg className="relative z-[1] h-full w-full text-primary" viewBox="0 0 48 48" role="presentation" aria-hidden="true">
          <path
            d="M42 18.5c-1.4 0-2.7-0.09-4-0.27 1.44-2.59 2.25-5.4 2.02-8.07-0.31-3.65-2.76-5.83-5.46-6.38-4.66-0.94-7.66 2.3-9.35 4.88C21.84 6.1 17.94 4.2 13.6 4.2 8.53 4.2 4.2 8.53 4.2 13.6c0 3.77 1.86 7.12 4.72 9.18C6.51 25.4 4.2 29.32 4.2 34.04 4.2 40.98 10.02 46.8 16.96 46.8c6.94 0 12.76-5.82 12.76-12.76 0-1.32-0.19-2.59-0.54-3.79 1.46 0.35 2.98 0.55 4.55 0.55 6.94 0 12.76-5.82 12.76-12.76 0-1.22-0.17-2.4-0.5-3.54-1.12 1.93-2.99 3.26-5.99 3.26Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Aas Paas</p>
          <p className="text-lg font-semibold text-text">Experience Suite</p>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.26em] text-text-muted">{tagline}</p>
        </div>
      )}
    </div>
  )
})

AppLogo.displayName = 'AppLogo'

export default AppLogo
