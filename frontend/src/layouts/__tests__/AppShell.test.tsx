import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AppShell from '../AppShell'
import { renderWithProviders } from '../../test/utils'
import { Home, LayoutDashboard } from 'lucide-react'

const sections = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { id: 'home', href: '/', label: 'Home', icon: Home },
      { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
]

describe('AppShell', () => {
  const topbarProps = {
    user: { name: 'John Doe', email: 'john@example.com' },
    notifications: [],
    quickActions: [],
    userMenuItems: [{ id: 'logout', label: 'Logout', tone: 'danger' as const, onSelect: vi.fn() }],
  }

  it('renders children content inside main area', () => {
    renderWithProviders(
      <AppShell sidebarSections={sections} topbarProps={topbarProps}>
        <div data-testid="content">Hello world</div>
      </AppShell>,
      { route: '/' },
    )

    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(screen.getByText('Skip to content')).toBeInTheDocument()
  })

  it('collapses sidebar', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <AppShell sidebarSections={sections} topbarProps={topbarProps}>
        <div />
      </AppShell>,
      { route: '/' },
    )

    const collapseButton = screen.getByLabelText(/collapse sidebar/i)
    await user.click(collapseButton)
    expect(screen.getByLabelText(/expand sidebar/i)).toBeInTheDocument()
  })

  it('toggles mobile sidebar drawer', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <AppShell sidebarSections={sections} topbarProps={topbarProps}>
        <div />
      </AppShell>,
      { route: '/' },
    )

    const trigger = screen.getByLabelText(/toggle mobile navigation menu/i)
    await user.click(trigger)
    expect(screen.getByLabelText(/close menu/i)).toBeInTheDocument()
  })
})
