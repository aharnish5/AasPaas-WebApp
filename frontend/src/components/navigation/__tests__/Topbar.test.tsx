import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LayoutDashboard } from 'lucide-react'
import Topbar from '../Topbar'
import { renderWithProviders } from '../../../test/utils'

describe('Topbar', () => {
  const baseProps = {
    user: { name: 'Jane Vendor', email: 'jane@example.com' },
    notifications: [{ id: '1', title: 'New review received' }],
    quickActions: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, onSelect: vi.fn() }],
    userMenuItems: [{ id: 'logout', label: 'Logout', tone: 'danger' as const, onSelect: vi.fn() }],
  }

  it('renders user avatar and allows theme toggle', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Topbar {...baseProps} unreadNotifications={2} />)

    expect(screen.getByText('Jane Vendor')).toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: /activate dark mode/i })
    await user.click(toggle)

    await waitFor(() => expect(document.documentElement.dataset.mode).toBe('dark'))
  })

  it('opens notifications dropdown', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Topbar {...baseProps} unreadNotifications={12} />)

    const button = screen.getByRole('button', { name: /notifications/i })
    await user.click(button)

    expect(await screen.findByText('Notifications')).toBeInTheDocument()
    expect(await screen.findByText('New review received')).toBeInTheDocument()
    expect(button).toHaveTextContent('9+')
  })

  it('fires sidebar toggle callback', async () => {
    const onToggleSidebar = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<Topbar {...baseProps} onToggleSidebar={onToggleSidebar} />)

    const menuButton = screen.getByLabelText(/toggle navigation menu/i)
    await user.click(menuButton)
    expect(onToggleSidebar).toHaveBeenCalledTimes(1)
  })
})
