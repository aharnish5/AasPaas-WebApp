import type { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import Topbar from './Topbar'
import { LayoutDashboard, PlusCircle, Store } from 'lucide-react'

const meta = {
  title: 'Navigation/Topbar',
  component: Topbar,
  parameters: { layout: 'fullscreen' },
  args: {
    user: { name: 'Jasmine Kaur', email: 'jasmine@aaspaas.app' },
    quickActions: [
      { id: 'create-shop', label: 'New shop', icon: PlusCircle, onSelect: action('create-shop') },
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, onSelect: action('dashboard') },
    ],
    userMenuItems: [
      { id: 'profile', label: 'Profile', icon: Store, onSelect: action('profile') },
      { id: 'logout', label: 'Logout', tone: 'danger' as const, onSelect: action('logout') },
    ],
    searchPlaceholder: 'Search vendors, keywords, or addresses',
    onSearch: action('search'),
  },
} satisfies Meta<typeof Topbar>

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    notifications: [],
    unreadNotifications: 0,
  },
}

export const WithNotifications: Story = {
  args: {
    notifications: [
      { id: '1', title: 'New review from Priya', timeAgo: '2 minutes ago' },
      { id: '2', title: 'Kirana Plus updated working hours', timeAgo: '12 minutes ago' },
    ],
    unreadNotifications: 4,
  },
}

export default meta
