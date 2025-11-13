// Design tokens and theme variables for light/dark modes
// These exports are consumed by tailwind.config.ts and useTheme.tsx

export type ThemeMode = 'light' | 'dark'

// Color CSS variables applied on :root by useTheme
export const colorVariables: Record<ThemeMode, Record<string, string>> = {
  light: {
    '--color-background': '#f7f9fc',
    '--color-surface': '#ffffff',
    '--color-surface-muted': '#f2f4f7',
    '--color-surface-elevated': '#ffffff',
    '--color-border': 'rgba(15, 23, 42, 0.12)',
    '--color-ring': 'rgba(123, 93, 255, 0.45)',
    '--color-muted': 'rgba(2, 6, 23, 0.08)',
    '--color-accent': '#14b8a6',
    '--color-accent-muted': 'rgba(20, 184, 166, 0.16)',
    '--color-positive': '#22c55e',
    '--color-danger': '#ef4444',
    '--color-warning': '#f59e0b',
    '--color-text': '#0b1220',
    '--color-text-muted': 'rgba(11, 18, 32, 0.62)',

    // Shadows used via arbitrary values e.g. shadow-[var(--shadow-sm)]
    '--shadow-sm': '0 6px 18px rgba(2, 6, 23, 0.08)',
    '--shadow-glass': '0 18px 48px rgba(123, 93, 255, 0.28)',

    // Easing variables referenced in animations
    '--ease-standard': 'cubic-bezier(0.2, 0, 0, 1)',
    '--ease-emphasized': 'cubic-bezier(0.2, 0, 0, 1)',
    '--ease-entrance': 'cubic-bezier(0, 0, 0.2, 1)',
    '--ease-exit': 'cubic-bezier(0.4, 0, 1, 1)',
  },
  dark: {
    '--color-background': '#0a0f1c',
    '--color-surface': '#0f172a',
    '--color-surface-muted': '#111827',
    '--color-surface-elevated': '#0b1220',
    '--color-border': 'rgba(148, 163, 184, 0.16)',
    '--color-ring': 'rgba(123, 93, 255, 0.55)',
    '--color-muted': 'rgba(255, 255, 255, 0.08)',
    '--color-accent': '#2dd4bf',
    '--color-accent-muted': 'rgba(45, 212, 191, 0.16)',
    '--color-positive': '#22c55e',
    '--color-danger': '#f87171',
    '--color-warning': '#fbbf24',
    '--color-text': '#e5e7eb',
    '--color-text-muted': 'rgba(229, 231, 235, 0.62)',

    '--shadow-sm': '0 10px 28px rgba(2, 6, 23, 0.35)',
    '--shadow-glass': '0 18px 48px rgba(123, 93, 255, 0.34)',

    '--ease-standard': 'cubic-bezier(0.2, 0, 0, 1)',
    '--ease-emphasized': 'cubic-bezier(0.2, 0, 0, 1)',
    '--ease-entrance': 'cubic-bezier(0, 0, 0.2, 1)',
    '--ease-exit': 'cubic-bezier(0.4, 0, 1, 1)',
  },
}

// Semantic palette used by components and theme application
export const themeTokens = {
  light: {
    palette: {
      primary: { 500: '#7B5DFF', foreground: '#ffffff' },
      secondary: { 500: '#6dcea5', foreground: '#0a0a0a' },
      accent: { 500: '#14b8a6', foreground: '#07201c' },
    },
  },
  dark: {
    palette: {
      primary: { 500: '#8b78ff', foreground: '#0a0a0a' },
      secondary: { 500: '#86e3bd', foreground: '#0a0a0a' },
      accent: { 500: '#2dd4bf', foreground: '#041412' },
    },
  },
} as const

// Tailwind extension tokens
export const spacingScale: Record<string, string> = {
  '18': '4.5rem',
  '22': '5.5rem',
  '30': '7.5rem',
}

export const radiusScale: Record<string, string> = {
  xl: '1rem',
  '2xl': '1.25rem',
  '3xl': '1.5rem',
  '4xl': '1.75rem',
  full: '9999px',
}

export const shadowPalette: Record<string, string> = {
  sm: '0 6px 18px rgba(2, 6, 23, 0.08)',
  md: '0 12px 32px rgba(2, 6, 23, 0.12)',
  lg: '0 18px 48px rgba(2, 6, 23, 0.16)',
  glass: '0 18px 48px rgba(123, 93, 255, 0.28)',
}

export const transitions = {
  durations: {
    instant: '75ms',
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  easings: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
    entrance: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
  },
}
 
