import type { LucideIcon } from 'lucide-react'

export type NavigationBadge = {
  label: string
  tone?: 'neutral' | 'accent' | 'success' | 'danger' | 'warning'
}

export type SidebarNavItem = {
  id: string
  href: string
  label: string
  icon: LucideIcon
  description?: string
  badge?: NavigationBadge
  isActive?: boolean
  disabled?: boolean
  external?: boolean
}

export type SidebarSection = {
  id: string
  label?: string
  items: SidebarNavItem[]
}

export type TopNavQuickAction = {
  id: string
  label: string
  icon: LucideIcon
  onSelect: () => void
}

export type NotificationItem = {
  id: string
  title: string
  message?: string
  timeAgo?: string
  href?: string
}

export type UserMenuItem = {
  id: string
  label: string
  icon?: LucideIcon
  href?: string
  onSelect?: () => void
  tone?: 'danger' | 'neutral'
}
