import type { Decorator, Preview } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../src/hooks/useTheme'
import '../src/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

const withProviders: Decorator = (Story) => (
  <MemoryRouter>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="min-h-screen bg-background text-text">
          <Story />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  </MemoryRouter>
)

const preview: Preview = {
  decorators: [withProviders],
  parameters: {
    backgrounds: {
      default: 'Surface',
      values: [
        { name: 'Surface', value: 'var(--color-surface)' },
        { name: 'Surface Muted', value: 'var(--color-surface-muted)' },
        { name: 'Dark', value: '#050b17' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    layout: 'fullscreen',
  },
}

export default preview
