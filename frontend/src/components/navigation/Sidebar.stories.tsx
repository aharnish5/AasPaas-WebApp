import type { Meta, StoryObj } from '@storybook/react'
import Sidebar from './Sidebar'
import { Home, LayoutDashboard, MapPinned, Settings, Users } from 'lucide-react'

const sections = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { id: 'home', href: '/', label: 'Home', icon: Home },
      { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: { label: 'Live', tone: 'accent' as const } },
    ],
  },
  {
    id: 'management',
    label: 'Management',
    items: [
      { id: 'shops', href: '/shops', label: 'Shops', icon: MapPinned },
      { id: 'teams', href: '/teams', label: 'Team', icon: Users, badge: { label: '5', tone: 'neutral' as const } },
      { id: 'settings', href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

const meta = {
  title: 'Navigation/Sidebar',
  component: Sidebar,
  parameters: { layout: 'centered' },
  args: {
    sections,
  },
} satisfies Meta<typeof Sidebar>

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Collapsed: Story = {
  args: {
    collapsed: true,
  },
}

export default meta
