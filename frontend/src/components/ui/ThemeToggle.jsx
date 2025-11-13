import { useMemo } from 'react'
import { Moon, Sun } from 'lucide-react'
import Button from './Button'
import { useTheme } from '../../hooks/useTheme'

const ThemeToggle = ({ className }) => {
  const { mode, toggleMode } = useTheme()

  const icon = useMemo(
    () =>
      mode === 'dark' ? (
        <Sun className="h-4 w-4 text-amber-200" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700" />
      ),
    [mode],
  )

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={toggleMode}
      ariaLabel="Toggle theme"
      className={className}
      icon={icon}
      iconPosition="left"
    >
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
        {mode === 'dark' ? 'Light' : 'Dark'}
      </span>
    </Button>
  )
}

export default ThemeToggle


