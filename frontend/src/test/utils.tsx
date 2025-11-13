import { ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../hooks/useTheme'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

type ProvidersProps = {
  children: ReactNode
}

type ExtendedOptions = RenderOptions & { route?: string }

export const renderWithProviders = (ui: ReactNode, options?: ExtendedOptions) => {
  const Wrapper = ({ children }: ProvidersProps) => {
    const client = createTestQueryClient()
    return (
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <MemoryRouter initialEntries={options?.route ? [options.route] : undefined}>
            {children}
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    )
  }

  return render(<Wrapper>{ui}</Wrapper>, options)
}
