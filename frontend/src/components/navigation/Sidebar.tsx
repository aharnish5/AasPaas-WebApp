import { forwardRef, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import clsx from 'clsx'
import * as Dialog from '@radix-ui/react-dialog'
import { SidebarSection } from './types'
import AppLogo from './AppLogo'

export type SidebarProps = {
  sections: SidebarSection[]
  collapsed?: boolean
  onCollapseToggle?: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
  topSlot?: ReactNode
  footerSlot?: ReactNode
  className?: string
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  ({
    sections,
    collapsed = false,
    onCollapseToggle,
    mobileOpen = false,
    onMobileClose,
    topSlot,
    footerSlot,
    className,
  }, ref) => {
    const nav = (
      <div className="flex h-full flex-col">
        {topSlot && <div className="px-4 pb-3 pt-4">{topSlot}</div>}
        <nav className="flex-1 overflow-y-auto px-2">
          {sections.map((section) => (
            <div key={section.id} className="mb-6 last:mb-0">
              {section.label && !collapsed && (
                <div className="px-4 pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-text-muted/70">
                  {section.label}
                </div>
              )}
              <ul className="mt-2 space-y-1">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <NavLink
                      to={item.href}
                      className="group block focus-visible:outline-none"
                      aria-label={collapsed ? item.label : undefined}
                    >
                      {({ isActive }) => (
                        <span
                          className={clsx(
                            'relative flex items-center gap-3 overflow-hidden rounded-2xl text-sm font-semibold transition-all duration-150 ease-[var(--ease-standard)] group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[color:var(--color-surface)]',
                            collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3',
                            (isActive || item.isActive)
                              ? 'sparkle-glow bg-gradient-to-r from-primary/18 via-primary/10 to-transparent text-primary shadow-lg shadow-primary/10'
                              : 'text-text hover:bg-surface-muted/80 hover:text-primary'
                          )}
                        >
                          <span
                            className={clsx(
                              'flex h-9 w-9 items-center justify-center rounded-xl border border-transparent bg-white/30 text-primary shadow-sm backdrop-blur-sm transition-all duration-150 ease-[var(--ease-standard)] dark:bg-white/5 dark:text-primary/90',
                              (collapsed || isActive || item.isActive) && 'bg-white/50 text-primary shadow-md dark:bg-white/10'
                            )}
                          >
                            <item.icon className="h-[18px] w-[18px]" />
                          </span>
                          {!collapsed && (
                            <span className="truncate text-[0.92rem] tracking-wide">{item.label}</span>
                          )}
                          {!collapsed && item.badge && (
                            <span
                              className={clsx(
                                'ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em]',
                                item.badge.tone === 'accent' && 'bg-accent/15 text-accent',
                                item.badge.tone === 'danger' && 'bg-danger/15 text-danger',
                                item.badge.tone === 'success' && 'bg-positive/15 text-positive',
                                item.badge.tone === 'warning' && 'bg-warning/15 text-warning',
                                (!item.badge.tone || item.badge.tone === 'neutral') &&
                                  'bg-text-muted/10 text-text-muted'
                              )}
                            >
                              {item.badge.label}
                            </span>
                          )}
                          {collapsed && (
                            <ChevronRight className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        {footerSlot && <div className="px-4 py-4">{footerSlot}</div>}
      </div>
    )

    return (
      <>
        <motion.aside
          ref={ref}
          initial={false}
          animate={{ width: collapsed ? 72 : 288 }}
          transition={{ duration: collapsed ? 0.18 : 0.2, ease: 'easeInOut' }}
          className={clsx(
            'relative hidden h-screen overflow-hidden rounded-r-[2rem] bg-surface/80 shadow-lg shadow-primary/5 ring-1 ring-border/70 backdrop-blur-xl before:absolute before:inset-0 before:-left-10 before:z-[-1] before:bg-[radial-gradient(circle_at_top_left,rgba(123,93,255,0.18),transparent_65%),radial-gradient(circle_at_bottom_right,rgba(255,139,167,0.16),transparent_65%)] lg:block',
            collapsed ? 'px-2' : 'px-0',
            className,
          )}
        >
          <div className="flex h-full flex-col">
            <div className={clsx('flex items-center justify-between px-4 pb-2 pt-6', collapsed && 'flex-col gap-4 px-2 pb-4')}>
              <AppLogo collapsed={collapsed} tagline="Vendor console" />
              <button
                type="button"
                onClick={onCollapseToggle}
                className={clsx(
                  'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-white/40 text-text shadow-sm transition-all hover:-translate-y-[1px] hover:bg-white/55 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'dark:bg-white/10 dark:hover:bg-white/15',
                )}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>
            {nav}
          </div>
        </motion.aside>

        <Dialog.Root open={mobileOpen} onOpenChange={(open: boolean) => { if (!open) onMobileClose?.() }}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" />
            <Dialog.Content asChild>
              <motion.div
                id="mobile-sidebar"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="fixed inset-y-0 left-0 z-50 w-80 max-w-full bg-surface/95 shadow-2xl shadow-primary/10 ring-1 ring-border backdrop-blur-xl lg:hidden"
              >
                <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
                <Dialog.Description className="sr-only">Expanded navigation for mobile devices</Dialog.Description>
                <div className="flex items-center justify-between px-4 pb-2 pt-5">
                  <AppLogo tagline="Navigation" />
                  <button
                    type="button"
                    onClick={onMobileClose}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white/40 text-text shadow-sm transition hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-white/10 dark:hover:bg-white/15"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="h-[calc(100%-4.5rem)] overflow-y-auto px-1 pb-6">
                  {nav}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </>
    )
  },
)

Sidebar.displayName = 'Sidebar'

export default Sidebar
