import { FormEvent, useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, Search, Bell, SunMedium, MoonStar, ChevronDown } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import clsx from 'clsx'
import { useTheme } from '../../hooks/useTheme'
import type { NotificationItem, TopNavQuickAction, UserMenuItem } from './types'

export type TopbarUser = {
  name: string
  email?: string
  avatarUrl?: string
}

export type TopbarProps = {
  user?: TopbarUser
  onToggleSidebar?: () => void
  onSearch?: (query: string) => void
  quickActions?: TopNavQuickAction[]
  notifications?: NotificationItem[]
  userMenuItems?: UserMenuItem[]
  searchPlaceholder?: string
  unreadNotifications?: number
  compact?: boolean
}

const ThemeToggle = () => {
  const { mode, toggleMode } = useTheme()

  return (
    <motion.button
      type="button"
      onClick={toggleMode}
      aria-label={`Activate ${mode === 'dark' ? 'light' : 'dark'} mode`}
      whileTap={{ scale: 0.9 }}
      className="sparkle-glow relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent bg-white/40 text-primary shadow-md transition-all duration-200 hover:-translate-y-[1px] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-white/10"
    >
      <motion.div
        key={mode}
        initial={{ scale: 0.65, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="flex items-center justify-center text-primary"
      >
        {mode === 'dark' ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
      </motion.div>
      <span className="sr-only">Toggle theme</span>
    </motion.button>
  )
}

const Avatar = ({ name, imageUrl }: { name?: string; imageUrl?: string }) => {
  const initials = (name
    ?.split(' ')
    .map((part) => (part ? part[0] : ''))
    .join('')
    .toUpperCase() || 'AP')

  return (
    <AvatarPrimitive.Root className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-white/60 shadow-inner dark:bg-white/10">
      <AvatarPrimitive.Image src={imageUrl} alt={name} className="h-full w-full object-cover" />
      <AvatarPrimitive.Fallback delayMs={200} className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}

const NotificationBell = ({
  notifications = [],
  unread = 0,
}: {
  notifications?: NotificationItem[]
  unread?: number
}) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <button
        type="button"
        className="sparkle-glow relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent bg-white/40 text-text shadow-md transition-all duration-200 hover:-translate-y-[1px] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-white/10"
        aria-label={unread ? `${unread} new notifications` : 'Notifications'}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_6px_18px_rgba(255,111,140,0.45)]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={12}
        align="end"
        className="w-[22rem] overflow-hidden rounded-3xl border border-border/60 bg-surface/90 shadow-2xl shadow-primary/10 backdrop-blur-xl focus:outline-none"
      >
        <div className="border-b border-border/60 bg-gradient-to-r from-primary/12 via-transparent to-secondary/12 px-5 py-4">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Notifications</p>
          <p className="mt-0.5 text-xs text-text-muted">Stay up to date with vendor insights</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-text-muted">
              You're all caught up. We'll notify you when there's something new.
            </div>
          ) : (
            <div className="space-y-1 px-3 pb-3">
              {notifications.map((notification) => (
                <DropdownMenu.Item
                  key={notification.id}
                  className="group rounded-2xl border border-transparent bg-surface/40 px-4 py-3 transition-all hover:border-primary/30 hover:bg-surface/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="text-sm font-semibold text-text">{notification.title}</div>
                  {notification.message && <p className="mt-1 text-xs text-text-muted">{notification.message}</p>}
                  {notification.timeAgo && <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted/70">{notification.timeAgo}</p>}
                </DropdownMenu.Item>
              ))}
            </div>
          )}
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
)

const QuickActions = ({ actions = [] }: { actions?: TopNavQuickAction[] }) => (
  <div className="hidden items-center gap-2 md:flex">
    {actions.map((action) => (
      <button
        key={action.id}
        type="button"
        onClick={action.onSelect}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-transparent bg-white/60 px-4 text-sm font-semibold uppercase tracking-[0.18em] text-text shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:bg-white/80 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-white/10 dark:hover:bg-white/15"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-inner">
          <action.icon className="h-4 w-4" />
        </span>
        <span className="pr-1 text-xs">{action.label}</span>
      </button>
    ))}
  </div>
)

const SearchField = ({ placeholder, onSearch }: { placeholder?: string; onSearch?: (query: string) => void }) => {
  const [value, setValue] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!value.trim()) return
    onSearch?.(value.trim())
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="group relative hidden max-w-md flex-1 items-center md:flex"
      role="search"
    >
      <Search className="pointer-events-none absolute left-3 h-4 w-4 text-text-muted" />
      <input
        type="search"
        placeholder={placeholder ?? 'Search shops, vendors, categories'}
        className="h-12 w-full rounded-full border border-transparent bg-white/70 pl-10 pr-12 text-sm font-medium text-text placeholder:text-text-muted shadow-inner transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25 dark:bg-white/10 dark:focus:bg-white/15"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button
        type="submit"
        className="absolute right-1.5 inline-flex h-9 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary px-3 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_30px_rgba(123,93,255,0.28)] transition hover:shadow-[0_14px_36px_rgba(123,93,255,0.32)]"
      >
        Go
      </button>
    </form>
  )
}

const UserMenu = ({ user, items = [] }: { user?: TopbarUser; items?: UserMenuItem[] }) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-transparent bg-white/50 px-2 py-1 pr-3 text-left shadow-sm transition-all hover:-translate-y-[1px] hover:bg-white/70 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-white/10 dark:hover:bg-white/15"
        aria-label="Open profile menu"
      >
        <Avatar name={user?.name} imageUrl={user?.avatarUrl} />
        <div className="hidden min-w-0 text-left sm:block">
          <p className="truncate text-sm font-semibold text-text">{user?.name ?? 'Guest'}</p>
          {user?.email && <p className="truncate text-xs text-text-muted">{user.email}</p>}
        </div>
        <ChevronDown className="hidden h-4 w-4 text-text-muted sm:block" />
      </button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={12}
        align="end"
        className="w-60 rounded-3xl border border-border/60 bg-surface/95 p-1.5 shadow-xl shadow-primary/10 backdrop-blur-xl focus:outline-none"
      >
        {items.map((item) => (
          <DropdownMenu.Item
            key={item.id}
            onSelect={item.onSelect}
            className={clsx(
              'flex cursor-pointer items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm text-text transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              item.tone === 'danger' && 'text-danger hover:bg-danger/15',
              item.tone !== 'danger' && 'hover:bg-surface-muted/80'
            )}
          >
            {item.icon && <item.icon className="h-4 w-4" />}
            {item.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
)

const Topbar = ({
  user,
  onToggleSidebar,
  onSearch,
  quickActions,
  notifications,
  userMenuItems,
  searchPlaceholder,
  unreadNotifications,
  compact = false,
}: TopbarProps) => {
  return (
    <header
      className={clsx(
        'sticky top-0 z-30 border-b border-border/50 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40 dark:bg-surface/80',
        compact ? 'py-2' : 'py-3',
      )}
    >
      <div className="app-container flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent bg-white/60 text-text shadow-sm transition-all hover:-translate-y-[1px] hover:bg-white/80 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-white/10 dark:hover:bg-white/15 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <SearchField placeholder={searchPlaceholder} onSearch={onSearch} />
        <QuickActions actions={quickActions} />
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell notifications={notifications} unread={unreadNotifications} />
          <UserMenu user={user} items={userMenuItems} />
        </div>
      </div>
    </header>
  )
}

export default Topbar
