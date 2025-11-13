import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  User,
  LogOut,
  Store,
  MapPin,
  Heart,
  LayoutDashboard,
  Settings,
  Home,
  ChevronDown,
  Compass,
  Github
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useDispatch } from 'react-redux'
import AddressAutocomplete from '../search/AddressAutocomplete'
import { useAuth } from '../../hooks/useAuth'
import { logout } from '../../store/slices/authSlice'
import Button from '../ui/Button'
import ThemeToggle from '../ui/ThemeToggle'
import { cn } from '../../utils/cn'

const navLinks = [
  { label: 'Discover', to: '/search' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { isAuthenticated, user, role } = useAuth()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const profileMenuRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handler = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
    setIsProfileMenuOpen(false)
    setIsMobileMenuOpen(false)
  }

  const handleNavigation = (path) => {
    navigate(path)
    setIsMobileMenuOpen(false)
    setIsProfileMenuOpen(false)
  }

  const logo = useMemo(
    () => (
      <Link
        to="/"
        className="group flex items-center gap-3 rounded-full bg-white/5 px-3 py-1.5 text-sm font-semibold tracking-[0.24em] uppercase text-text shadow-[var(--shadow-xs)] backdrop-blur transition hover:bg-white/10"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[rgba(123,93,255,0.18)] text-[color:var(--color-primary)] transition group-hover:scale-[1.02]">
          <MapPin className="h-5 w-5" />
        </span>
        <span className="heading-gradient text-lg tracking-[0.18em]">Aas Paas</span>
      </Link>
    ),
    []
  )

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-border/70 bg-[color:var(--color-surface)]/82 shadow-[var(--shadow-sm)] backdrop-blur-xl'
          : 'border-transparent bg-transparent backdrop-blur-none'
      )}
    >
      <div className="container-custom">
        <div className="flex h-18 items-center justify-between gap-3 py-4">
          {logo}

          <div className="hidden lg:flex flex-1 items-center justify-center px-8">
            <AddressAutocomplete
              placeholder="Search local gems, e.g. 'Key maker in Bandra'"
              onSelect={(place) => {
                navigate(`/search?lat=${place.latitude}&lon=${place.longitude}&q=${encodeURIComponent(place.label)}`)
              }}
              onSubmitQuery={(text) => {
                const q = encodeURIComponent(text)
                navigate(`/search?q=${q}`)
              }}
              className="max-w-2xl"
              inputClassName="h-12 rounded-2xl bg-[color:var(--color-surface)] shadow-[var(--shadow-xs)] text-base font-medium"
              dropdownClassName="rounded-2xl"
            />
          </div>

          <div className="hidden md:flex items-center gap-3">
            <nav className="hidden lg:flex items-center gap-2">
              {navLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted transition-colors hover:text-[color:var(--color-primary)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <ThemeToggle className="hidden lg:inline-flex h-10 rounded-full px-3" />

            {/* GitHub Repo (desktop) */}
            <a
              href="https://github.com/aharnish5/AasPaas-WebApp/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-text shadow-[var(--shadow-xs)] transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-sm)]"
              aria-label="Open GitHub repository (opens in new tab)"
              title="GitHub Repository"
            >
              <Github className="h-5 w-5" />
            </a>

            {!isAuthenticated && (
              <Button
                variant="primary"
                className="hidden md:inline-flex h-10 rounded-2xl px-4"
                onClick={() => navigate('/signup/vendor')}
                icon={<Store className="h-4 w-4" />}
              >
                List your shop
              </Button>
            )}

            {!isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" className="px-4 py-2 text-sm" onClick={() => navigate('/login/customer')}>
                  Sign In
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {role === 'customer' && (
                  <Link
                    to="/customer/favorites"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--color-surface)]/80 text-[color:var(--color-primary)] shadow-[var(--shadow-xs)] transition hover:-translate-y-[1px]"
                    title="Favorites"
                  >
                    <Heart className="h-4 w-4" />
                  </Link>
                )}

                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 shadow-[var(--shadow-xs)] transition hover:border-[color:var(--color-primary)]/50 hover:shadow-[var(--shadow-sm)]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--color-primary)] to-[color:var(--color-secondary)] text-[color:var(--color-primary-foreground)] font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                    </span>
                    <span className="max-w-[140px] truncate text-sm font-semibold text-text">
                      {user?.name || 'User'}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-text-muted transition-transform',
                        isProfileMenuOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute right-0 mt-3 w-72 overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[var(--shadow-md)] backdrop-blur"
                      >
                        <div className="space-y-1 border-b border-[color:var(--color-border)]/70 bg-[color:var(--color-surface-muted)]/60 px-4 py-4">
                          <p className="text-sm font-semibold text-text">{user?.name}</p>
                          <p className="text-xs text-text-muted">{user?.email}</p>
                          <span className="inline-flex items-center rounded-full bg-[color:var(--color-primary)]/12 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                            {role}
                          </span>
                        </div>

                        <div className="px-2 py-3">
                          {role === 'customer' ? (
                            <div className="space-y-1">
                              <button
                                onClick={() => handleNavigation('/customer')}
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-text transition hover:bg-[color:var(--color-surface-muted)]"
                              >
                                <Home className="h-4 w-4 text-[color:var(--color-primary)]" />
                                My Feed
                              </button>
                              <button
                                onClick={() => handleNavigation('/customer/favorites')}
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-text transition hover:bg-[color:var(--color-surface-muted)]"
                              >
                                <Heart className="h-4 w-4 text-[color:var(--color-primary)]" />
                                Favorites
                              </button>
                              <button
                                onClick={() => handleNavigation('/customer/profile')}
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-text transition hover:bg-[color:var(--color-surface-muted)]"
                              >
                                <Settings className="h-4 w-4 text-[color:var(--color-primary)]" />
                                Account Settings
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="px-3 text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
                                Business
                              </p>
                              <button
                                onClick={() => handleNavigation('/vendor')}
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-text transition hover:bg-[color:var(--color-surface-muted)]"
                              >
                                <LayoutDashboard className="h-4 w-4 text-[color:var(--color-primary)]" />
                                Dashboard
                              </button>
                              <button
                                onClick={() => handleNavigation('/vendor/my-shop')}
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-text transition hover:bg-[color:var(--color-surface-muted)]"
                              >
                                <Store className="h-4 w-4 text-[color:var(--color-primary)]" />
                                My Shops
                              </button>
                              <button
                                onClick={() => handleNavigation('/vendor/settings')}
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-text transition hover:bg-[color:var(--color-surface-muted)]"
                              >
                                <Settings className="h-4 w-4 text-[color:var(--color-primary)]" />
                                Profile Settings
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-[color:var(--color-border)]/70 bg-[color:var(--color-surface-muted)]/60 px-4 py-3">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger/10"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[var(--shadow-xs)] transition hover:-translate-y-[1px] md:hidden"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="md:hidden border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]/95 backdrop-blur-xl"
          >
            <div className="space-y-6 px-5 py-6">
              <AddressAutocomplete
                placeholder="Search nearby…"
                onSelect={(place) => {
                  navigate(`/search?lat=${place.latitude}&lon=${place.longitude}&q=${encodeURIComponent(place.label)}`)
                  setIsMobileMenuOpen(false)
                }}
                onSubmitQuery={(text) => {
                  navigate(`/search?q=${encodeURIComponent(text)}`)
                  setIsMobileMenuOpen(false)
                }}
                className="w-full"
                inputClassName="h-12 rounded-2xl bg-[color:var(--color-surface)] shadow-[var(--shadow-xs)]"
                dropdownClassName="rounded-2xl"
              />

              <div className="flex items-center justify-between">
                <nav className="flex flex-wrap gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-full bg-[color:var(--color-surface-muted)]/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="flex items-center gap-2">
                  <ThemeToggle className="h-10 rounded-full px-3" />
                  <a
                    href="https://github.com/aharnish5/AasPaas-WebApp/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-text shadow-[var(--shadow-xs)]"
                    aria-label="Open GitHub repository (opens in new tab)"
                  >
                    <Github className="h-5 w-5" />
                  </a>
                </div>
              </div>

              {!isAuthenticated ? (
                <div className="space-y-3">
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      navigate('/login/customer')
                    }}
                  >
                    Customer Sign In
                  </Button>
                  <Button
                    variant="primary"
                    className="w-full justify-center"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      navigate('/signup/vendor')
                    }}
                    icon={<Store className="h-4 w-4" />}
                  >
                    List your shop
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/60 px-4 py-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--color-primary)] to-[color:var(--color-secondary)] text-[color:var(--color-primary-foreground)] font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text">{user?.name}</p>
                      <p className="truncate text-xs text-text-muted">{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(role === 'customer'
                      ? [
                          { label: 'My Feed', icon: Home, to: '/customer' },
                          { label: 'Favorites', icon: Heart, to: '/customer/favorites' },
                          { label: 'Account Settings', icon: Settings, to: '/customer/profile' },
                        ]
                      : [
                          { label: 'Dashboard', icon: LayoutDashboard, to: '/vendor' },
                          { label: 'My Shops', icon: Store, to: '/vendor/my-shop' },
                          { label: 'Profile Settings', icon: Settings, to: '/vendor/settings' },
                        ]
                    ).map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.label}
                          onClick={() => handleNavigation(item.to)}
                          className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-text transition hover:border-[color:var(--color-primary)]/20 hover:bg-[color:var(--color-surface-muted)]/60"
                        >
                          <Icon className="h-4 w-4 text-[color:var(--color-primary)]" />
                          {item.label}
                        </button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full justify-center text-danger"
                    onClick={handleLogout}
                    icon={<LogOut className="h-4 w-4" />}
                  >
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar