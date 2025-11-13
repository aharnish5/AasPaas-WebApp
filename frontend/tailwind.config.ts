import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'
import forms from '@tailwindcss/forms'
import aspectRatio from '@tailwindcss/aspect-ratio'
import { radiusScale, shadowPalette, spacingScale, transitions } from './src/styles/theme.ts'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.25rem',
        md: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1440px',
      },
    },
    extend: {
      spacing: {
        ...spacingScale,
      },
      borderRadius: {
        ...radiusScale,
      },
      boxShadow: {
        ...shadowPalette,
      },
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-muted': 'var(--color-surface-muted)',
        'surface-elevated': 'var(--color-surface-elevated)',
        border: 'var(--color-border)',
        ring: 'var(--color-ring)',
        muted: 'var(--color-muted)',
        accent: 'var(--color-accent)',
        'accent-muted': 'var(--color-accent-muted)',
        positive: 'var(--color-positive)',
        danger: 'var(--color-danger)',
        warning: 'var(--color-warning)',
        primary: 'var(--color-primary)',
        'primary-foreground': 'var(--color-primary-foreground)',
        secondary: 'var(--color-secondary)',
        'secondary-foreground': 'var(--color-secondary-foreground)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      transitionDuration: {
        instant: transitions.durations.instant,
        fast: transitions.durations.fast,
        normal: transitions.durations.normal,
        slow: transitions.durations.slow,
      },
      transitionTimingFunction: {
        standard: transitions.easings.standard,
        emphasized: transitions.easings.emphasized,
        entrance: transitions.easings.entrance,
        exit: transitions.easings.exit,
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms var(--ease-standard) forwards',
        'scale-in': 'scale-in 200ms var(--ease-entrance) forwards',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [typography, forms, aspectRatio],
}

export default config
