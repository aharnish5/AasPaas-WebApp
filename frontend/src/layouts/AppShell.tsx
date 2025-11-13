import { ReactNode, useCallback, useMemo, useState } from 'react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../components/navigation/Sidebar'
import Topbar, { type TopbarProps } from '../components/navigation/Topbar'
import type { SidebarSection } from '../components/navigation/types'

export type AppShellProps = {
  children: ReactNode
  sidebarSections: SidebarSection[]
  topbarProps: Omit<TopbarProps, 'onToggleSidebar'>
  sidebarTopSlot?: ReactNode
  sidebarFooterSlot?: ReactNode
  layout?: 'default' | 'compact'
  disableSidebar?: boolean
}

const AppShell = ({
  children,
  sidebarSections,
  topbarProps,
  sidebarTopSlot,
  sidebarFooterSlot,
  layout = 'default',
  disableSidebar = false,
}: AppShellProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed((prev) => !prev)
  }, [])

  const handleMobileToggle = useCallback(() => {
    setMobileSidebarOpen((prev) => !prev)
  }, [])

  const topbar = useMemo(
    () => (
      <Topbar
        {...topbarProps}
        onToggleSidebar={disableSidebar ? undefined : handleMobileToggle}
      />
    ),
    [disableSidebar, handleMobileToggle, topbarProps],
  )

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-background)] text-text">
      <div className="pointer-events-none absolute inset-x-0 top-[-30%] z-0 h-[60vh] bg-[radial-gradient(circle_at_top,var(--color-primary)_0%,transparent_55%)] opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute inset-y-0 left-[-25%] z-0 w-[40vw] bg-[radial-gradient(circle_at_center,var(--color-accent)_0%,transparent_60%)] opacity-30 blur-[140px]" />
      <div className="pointer-events-none absolute inset-y-0 right-[-20%] z-0 w-[35vw] bg-[radial-gradient(circle_at_center,#6dcea5_0%,transparent_60%)] opacity-20 blur-[160px]" />

      <a
        href="#main-content"
        className="sr-only -translate-y-16 transform focus:z-50 focus:translate-y-3 focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <div className="relative z-10 flex min-h-screen">
        {!disableSidebar && (
          <Sidebar
            sections={sidebarSections}
            collapsed={sidebarCollapsed}
            onCollapseToggle={handleSidebarToggle}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
            topSlot={sidebarTopSlot}
            footerSlot={sidebarFooterSlot}
            className="hidden lg:block"
          />
        )}

        <div className="relative flex min-h-screen flex-1 flex-col">
          {topbar}

          <AnimatePresence initial={false}>
            {!disableSidebar && (
              <motion.button
                key="mobile-trigger"
                type="button"
                className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_18px_48px_rgba(123,93,255,0.28)] transition-transform hover:-translate-y-[2px] hover:shadow-[0_22px_54px_rgba(123,93,255,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
                onClick={handleMobileToggle}
                aria-expanded={mobileSidebarOpen}
                aria-controls="mobile-sidebar"
                aria-label="Toggle mobile navigation menu"
              >
                <span className="sr-only">Toggle navigation</span>
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          <main
            id="main-content"
            className={clsx(
              'flex-1',
              layout === 'compact' ? 'py-4' : 'py-6',
              'transition-colors duration-200'
            )}
          >
            <div
              className={clsx(
                'app-container space-y-4 lg:space-y-6',
                layout === 'compact' ? 'card-grid-gap' : 'card-grid-gap'
              )}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default AppShell
