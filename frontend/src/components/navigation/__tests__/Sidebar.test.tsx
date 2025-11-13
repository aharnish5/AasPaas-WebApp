import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Sidebar from '../Sidebar'
import { renderWithProviders } from '../../../test/utils'
import { Home, MapPinned } from 'lucide-react'

const sections = [
  {
    id: 'general',
    label: 'General',
    items: [
      { id: 'overview', href: '/', label: 'Overview', icon: Home },
      { id: 'shops', href: '/shops', label: 'My Shops', icon: MapPinned, badge: { label: '12', tone: 'accent' as const } },
    ],
  },
]

describe('Sidebar', () => {
  it('renders navigation items and badges', () => {
    renderWithProviders(
      <Sidebar sections={sections} onCollapseToggle={vi.fn()} />,
      { route: '/' },
    )

    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('My Shops')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('invokes collapse toggle handler', () => {
    const onCollapseToggle = vi.fn()
    renderWithProviders(
      <Sidebar sections={sections} onCollapseToggle={onCollapseToggle} />,
      { route: '/' },
    )

    const collapseButton = screen.getByLabelText(/collapse sidebar/i)
    fireEvent.click(collapseButton)
    expect(onCollapseToggle).toHaveBeenCalledTimes(1)
  })

  it('shows mobile drawer when open', () => {
    const onClose = vi.fn()
    renderWithProviders(
      <Sidebar
        sections={sections}
        onCollapseToggle={vi.fn()}
        mobileOpen
        onMobileClose={onClose}
      />,
      { route: '/' },
    )

    const closeButton = screen.getByLabelText(/close menu/i)
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalled()
  })
})
