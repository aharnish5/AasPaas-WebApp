import type { Meta, StoryObj } from '@storybook/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import ShopCard from './ShopCard'

const baseShop = {
  _id: 'shop-001',
  name: 'Baseline Rackets & Repairs',
  category: 'Sports Boutique',
  priceRange: 'medium',
  images: [
    {
      url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop',
    },
  ],
  ratings: {
    avg: 4.7,
    count: 248,
  },
  favoritesCount: 128,
  address: {
    locality: 'Indiranagar',
    city: 'Bengaluru',
  },
  location: {
    coordinates: [77.6408, 12.9716],
  },
}

const baseAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

const createMockStore = (authState = baseAuthState) =>
  configureStore({
    reducer: {
      auth: (state = authState) => state,
    },
  })

const meta: Meta<typeof ShopCard> = {
  title: 'Components/Shop/ShopCard',
  component: ShopCard,
  decorators: [
    (Story) => (
      <Provider store={createMockStore()}>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_color-mix(in_srgb,_var(--color-primary)_10%,_transparent)_0%,_transparent_45%),_radial-gradient(circle_at_bottom_right,_color-mix(in_srgb,_var(--color-accent)_10%,_transparent)_0%,_transparent_55%),_var(--color-surface)] p-10">
          <div className="mx-auto max-w-md">
            <Story />
          </div>
        </div>
      </Provider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { exclude: ['onFavoritedChange'] },
  },
  args: {
    shop: baseShop,
  },
}

type Story = StoryObj<typeof ShopCard>

export const Default: Story = {}

export const WithDistance: Story = {
  args: {
    distanceKm: 2.3,
  },
}

export const Compact: Story = {
  args: {
    compact: true,
    distanceKm: 8.6,
    shop: {
      ...baseShop,
      name: 'Smash City Tennis Café',
      category: 'Stringing Studio',
      priceRange: 'high',
      ratings: { avg: 4.9, count: 512 },
      favoritesCount: 286,
      location: { coordinates: [77.5946, 12.9718] },
    },
  },
}

export default meta
