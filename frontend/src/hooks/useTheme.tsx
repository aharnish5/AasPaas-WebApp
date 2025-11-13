import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { colorVariables, themeTokens, type ThemeMode } from '../styles/theme.ts'

const THEME_STORAGE_KEY = 'aaspaas_theme'

type ThemeContextValue = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const isBrowser = typeof window !== 'undefined'

const applyThemeToDocument = (mode: ThemeMode) => {
  if (!isBrowser) return

  const root = window.document.documentElement
  root.classList.remove('light', 'dark')
  root.dataset.mode = mode
  root.classList.add(mode === 'dark' ? 'dark' : 'light')

  const variables = colorVariables[mode]
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value as string)
  })

  const semantic = themeTokens[mode]
  root.style.setProperty('--color-primary', semantic.palette.primary[500])
  root.style.setProperty('--color-primary-foreground', semantic.palette.primary.foreground)
  root.style.setProperty('--color-secondary', semantic.palette.secondary[500])
  root.style.setProperty('--color-secondary-foreground', semantic.palette.secondary.foreground)
}

const getInitialTheme = (): ThemeMode => {
  if (!isBrowser) return 'light'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
  if (stored === 'light' || stored === 'dark') return stored

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

type ThemeProviderProps = {
  children: ReactNode
  defaultMode?: ThemeMode
}

export function ThemeProvider({ children, defaultMode }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(() => defaultMode ?? getInitialTheme())

  useEffect(() => {
    applyThemeToDocument(mode)
    if (isBrowser) {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode)
    }
  }, [mode])

  useEffect(() => {
    if (!isBrowser) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handler = (event: MediaQueryListEvent) => {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
      if (!stored) {
        setMode(event.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const setModeSafe = useCallback((next: ThemeMode) => {
    setMode(next)
  }, [])

  const toggleMode = useCallback(() => {
    setMode((prevMode: ThemeMode) => (prevMode === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    setMode: setModeSafe,
    toggleMode,
    isDark: mode === 'dark',
  }), [mode, setModeSafe, toggleMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const ThemeScript = () => {
  const script = `(()=>{try{const t=localStorage.getItem('${THEME_STORAGE_KEY}');const e=document.documentElement;const c=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';const m=t==='dark'||(t!=="light"&&c==='dark')?'dark':'light';e.dataset.mode=m;e.classList.add(m);document.body?.classList?.add('ready');}catch(o){}})();`
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export { THEME_STORAGE_KEY }
