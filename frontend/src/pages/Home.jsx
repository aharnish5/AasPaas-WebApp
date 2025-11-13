import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Navigation,
  MapPin,
  Star,
  Store,
  Users,
  Shield,
  Camera,
  HeartHandshake,
  Clock,
  ArrowRight,
  Wand2,
  IndianRupee,
  Compass
} from 'lucide-react'
import AddressAutocomplete from '../components/search/AddressAutocomplete'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useGeolocation } from '../hooks/useGeolocation'
import { shopAPI } from '../services/api'

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sessionToken] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  )
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAuth()
  const { location: geolocation, getLocation } = useGeolocation()
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const heroWords = useMemo(
    () => ['Street Food', 'Tailors', 'Organic Farms', 'Key Makers', 'Tea Stalls', 'Home Bakers'],
    []
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentWord = heroWords[currentWordIndex]
      if (isDeleting) {
        if (currentCharIndex > 0) {
          setCurrentCharIndex((prev) => prev - 1)
        } else {
          setIsDeleting(false)
          setCurrentWordIndex((prev) => (prev + 1) % heroWords.length)
        }
      } else if (currentCharIndex < currentWord.length) {
        setCurrentCharIndex((prev) => prev + 1)
      } else {
        setTimeout(() => setIsDeleting(true), 1800)
      }
    }, isDeleting ? 75 : 110)

    return () => clearTimeout(timer)
  }, [currentCharIndex, currentWordIndex, heroWords, isDeleting])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSelectSuggestion = async (suggestion) => {
    setSearchQuery(suggestion.label || suggestion.displayName || '')

    if (suggestion.provider === 'google' && suggestion.placeId) {
      try {
        const details = await shopAPI.placeDetails(suggestion.placeId, sessionToken)
        const place = details.data.place
        if (place?.latitude && place?.longitude) {
          navigate(`/search?lat=${place.latitude}&lon=${place.longitude}`)
          return
        }
      } catch (error) {
        console.warn('Failed to fetch place details from Google', error)
      }
    }

    if (suggestion.latitude && suggestion.longitude) {
      navigate(`/search?lat=${suggestion.latitude}&lon=${suggestion.longitude}`)
    } else {
      navigate(`/search?q=${encodeURIComponent(suggestion.displayName || suggestion.label || '')}`)
    }
  }

  const handleUseLocation = () => {
    setIsGettingLocation(true)
    getLocation()
  }

  useEffect(() => {
    if (geolocation.coordinates && isGettingLocation) {
      const { latitude, longitude } = geolocation.coordinates
      navigate(`/search?lat=${latitude}&lon=${longitude}`)
      setIsGettingLocation(false)
    }
  }, [geolocation.coordinates, isGettingLocation, navigate])

  const featureTiles = useMemo(
    () => [
      {
        icon: Wand2,
        title: 'AI-guided onboarding',
        description: 'Snap a storefront photo and let our AI draft the perfect listing within seconds.'
      },
      {
        icon: Camera,
        title: 'Visual search',
        description: 'Upload a photo of a sign or menu to find matching vendors around you.'
      },
      {
        icon: Shield,
        title: 'Verified community',
        description: 'Every listing is validated by locals and curated by our safety team.'
      },
      {
        icon: HeartHandshake,
        title: 'Frictionless loyalty',
        description: 'Favorites, reviews, and helpful votes keep authentic businesses thriving.'
      },
    ],
    []
  )

  const categoryGrid = useMemo(
    () => [
      { title: 'Street Food', count: '120+', accent: 'from-[#ff8ba7] to-[#ffaf6f]' },
      { title: 'Artisans', count: '95+', accent: 'from-[#7b5dff] to-[#8c7bff]' },
      { title: 'Daily Helpers', count: '75+', accent: 'from-[#43cea2] to-[#185a9d]' },
      { title: 'Home Services', count: '110+', accent: 'from-[#f5576c] to-[#f093fb]' },
      { title: 'Wellness', count: '68+', accent: 'from-[#43e97b] to-[#38f9d7]' },
      { title: 'Grocers', count: '132+', accent: 'from-[#fa709a] to-[#fee140]' },
    ],
    []
  )

  const vendorSteps = useMemo(
    () => [
      { title: 'Capture your story', description: 'Upload photos, record voice notes, or type in any language.' },
      { title: 'Enhance with AI', description: 'We enrich your listing with location tags, pricing, and operating hours.' },
      { title: 'Go live & engage', description: 'Share your link, respond to reviews, and track insights in real-time.' },
    ],
    []
  )

  const testimonials = useMemo(
    () => [
      {
        quote:
          'Our chai stall was invisible online. Within a week on Aas Paas, office goers started queuing again. The analytics help us plan for peak hours.',
        name: 'Saira & Ahmed',
        role: 'Founders, Irani Chai Stories – Hyderabad'
      },
      {
        quote:
          'I discovered a tailor who does same-day alterations! The map view and reviews made it easy to trust local vendors again.',
        name: 'Rohan Verma',
        role: 'Customer, Bengaluru'
      },
    ],
    []
  )

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_color-mix(in_srgb,_var(--color-primary)_16%,_transparent)_0%,_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_color-mix(in_srgb,_var(--color-secondary)_12%,_transparent)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_color-mix(in_srgb,_var(--color-surface)_88%,_transparent),_color-mix(in_srgb,_var(--color-background)_85%,_transparent))]" />
      </div>

      <section className="relative py-16 sm:py-20">
        <div className="container-custom grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex.items-center gap-3 rounded-full border border-[color:var(--color-border)]/60 bg-[color:var(--color-surface)]/70 px-4 py-2 shadow-[var(--shadow-xs)] backdrop-blur">
              <Sparkles className="h-4 w-4 text-[color:var(--color-primary)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
                Mapping the heartbeat of India
              </span>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-bold.leading-tight text-text sm:text-5xl lg:text-6xl">
                Find extraordinary{' '}
                <span className="bg-gradient-to-r from-[color:var(--color-text)] via-[color:var(--color-primary)] to-[color:var(--color-secondary)] bg-clip-text text-transparent">
                  {heroWords[currentWordIndex].substring(0, currentCharIndex)}
                  <span className="align-top text-3xl text-slate-400">▍</span>
                </span>
                {' '}around the corner
              </h1>
              <p className="max-w-xl text-base text-text-muted sm:text-lg">
                Aas Paas blends AI, community reviews, and real-time maps to surface authentic local vendors. Discover
                the chai that fuels your commute, the artisan who mends leather, or the tutor who inspires the next
                breakthrough.
              </p>
            </div>

            <div className="glass-card relative z-30 rounded-3xl p-4">
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <AddressAutocomplete
                  placeholder="Search for key makers, dosa stalls, tailors…"
                  onSelect={handleSelectSuggestion}
                  onQueryChange={setSearchQuery}
                  onSubmitQuery={(query) => navigate(`/search?q=${encodeURIComponent(query)}`)}
                  className="w-full"
                  inputClassName="h-14 rounded-2xl bg-[color:var(--color-surface)] text-base font-semibold"
                  dropdownClassName="rounded-2xl"
                />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-text-muted">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-surface-muted)] px-2.5 py-1 whitespace-nowrap text-[0.7rem]">
                      <Star className="h-3 w-3 text-[color:var(--color-primary)]" />
                      Trusted locals
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-surface-muted)] px-2.5 py-1 whitespace-nowrap text-[0.7rem]">
                      <Clock className="h-3 w-3 text-[color:var(--color-primary)]" />
                      Real-time availability
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="submit"
                      variant="primary"
                      className="justify-center"
                      icon={<ArrowRight className="h-4 w-4" />}
                      iconPosition="right"
                    >
                      Explore now
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="justify-center"
                      onClick={handleUseLocation}
                      disabled={geolocation.loading || isGettingLocation}
                      icon={<Navigation className="h-4 w-4" />}
                    >
                      {geolocation.loading || isGettingLocation ? 'Locating…' : 'Use my location'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { label: 'Neighbourhood vendors', value: '18,000+' },
                { label: 'Verified reviews', value: '120K+' },
                { label: 'Cities mapped', value: '42' },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-3xl p-4 text-center">
                  <p className="text-2xl font-semibold text-text">{stat.value}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-[color:var(--color-primary)]/15 via-transparent to-[color:var(--color-secondary)]/20 blur-3xl" />
            <div className="glass-card relative rounded-[32px] p-6">
              <div className="grid gap-4">
                <div className="surface-card flex items-center justify-between rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Users className="h-9 w-9 rounded-2xl bg-white/60 p-2 text-[color:var(--color-primary)]" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-text-muted">What locals love</p>
                      <p className="text-sm font-semibold text-text">Morning filter coffee</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-[rgba(123,93,255,0.12)] px-3 py-1 text-xs font-semibold text-[color:var(--color-primary)]">
                    4.9 ★
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="surface-card rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <Store className="h-8 w-8 rounded-2xl bg-[rgba(123,93,255,0.12)] p-2 text-[color:var(--color-primary)]" />
                      <div>
                        <p className="text-sm font-semibold text-text">Nala Market Tailors</p>
                        <p className="text-xs text-text-muted">Ready in 24 hours · ₹₹ affordable</p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80')] bg-cover bg-center pb-[56%]" />
                  </div>

                  <div className="surface-card rounded-2xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text">Vendor pulse</p>
                        <p className="text-xs text-text-muted">Banaswadi, Bengaluru</p>
                      </div>
                      <IndianRupee className="h-4 w-4 text-[color:var(--color-primary)]" />
                    </div>
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-text-muted">
                        <span>Evening rush</span>
                        <span className="font-semibold text-text">4.7 ★</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[color:var(--color-surface-muted)]">
                        <div className="h-2 w-5/6 rounded-full bg-gradient-to-r from-[#7b5dff] to-[#f95763]" />
                      </div>
                      <div className="flex items-center justify-between text-text-muted">
                        <span>Repeat customers</span>
                        <span className="font-semibold text-text">89%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[color:var(--color-surface-muted)]">
                        <div className="h-2 w-4/5 rounded-full bg-gradient-to-r from-[#43cea2] to-[#185a9d]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="surface-card rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-8 w-8 rounded-2xl bg-[rgba(249,87,99,0.12)] p-2 text-[#f95763]" />
                    <div>
                      <p className="text-sm font-semibold text-text">Trending pockets</p>
                      <p className="text-xs text-text-muted">Colaba · Indiranagar · Bandra · Khar West</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {['🍲 Dosa Labs', '🥬 Farm2Door', '🗝️ Singh Keysmith', '☕ Filter Stories'].map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-[color:var(--color-surface-muted)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-text"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-20">
        <div className="container-custom space-y-14">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-text sm:text-4xl">Why locals trust Aas Paas</h2>
            <p className="mt-3 text-base text-text-muted sm:text-lg">
              From onboarding to discovery, every touchpoint is designed for warmth, trust, and delight.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featureTiles.map((feature) => (
              <div
                key={feature.title}
                className="group glass-card rounded-3xl p-6 transition hover:-translate-y-[4px]"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)] transition group-hover:scale-[1.05]">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-text">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-[color:var(--color-surface)]/65 py-16 sm:py-20">
        <div className="container-custom space-y-12">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-3xl font-semibold text-text sm:text-4xl">Browse vibrant neighbourhoods</h2>
            <p className="text-base text-text-muted sm:text-lg">Curated categories help you land exactly where you belong.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {categoryGrid.map((category) => (
              <button
                key={category.title}
                onClick={() => navigate(`/search?q=${encodeURIComponent(category.title)}`)}
                className="glass-card rounded-3xl px-6 py-8 text-left transition hover:-translate-y-[4px]"
              >
                <div className={`inline-flex rounded-2xl bg-gradient-to-br ${category.accent} px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white`}>
                  {category.count} listings
                </div>
                <p className="mt-6 text-2xl font-semibold text-text">{category.title}</p>
                <p className="mt-2 text-sm text-text-muted">
                  Discover {category.title.toLowerCase()} curated by locals and loved by regulars.
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-20">
        <div className="container-custom grid gap-10 rounded-[32px] p-8 lg:grid-cols-[0.9fr_1.1fr] glass-card">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-text sm:text-4xl">Vendors, shine with Aas Paas</h2>
            <p className="text-base text-text-muted sm:text-lg">
              No jargon, no hidden fees. Simply capture what makes you special and reach your neighbourhood digitally.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="primary"
                className="justify-center"
                onClick={() => navigate(isAuthenticated && role === 'vendor' ? '/vendor/my-shop' : '/signup/vendor')}
                icon={<Compass className="h-4 w-4" />}
                iconPosition="right"
              >
                Launch your listing
              </Button>
              <Button variant="outline" className="justify-center" onClick={() => navigate('/contact')}>
                Talk to our team
              </Button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {vendorSteps.map((step, index) => (
              <div key={step.title} className="surface-card rounded-3xl p-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(123,93,255,0.12)] text-sm font-semibold text-[color:var(--color-primary)]">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-text-muted">
                  Step {index + 1}
                </h3>
                <p className="mt-1 text-base font-semibold text-text">{step.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-20">
        <div className="container-custom grid gap-10 lg:grid-cols-2">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="glass-card rounded-[28px] p-8"
            >
              <div className="flex items-center gap-3 text-[rgba(123,93,255,0.8)]">
                <Star className="h-6 w-6 fill-current" />
                <span className="text-xs font-semibold uppercase tracking-[0.24em]">Community voices</span>
              </div>
              <p className="mt-6 text-lg leading-relaxed text-text">
                “{testimonial.quote}”
              </p>
              <div className="mt-6 space-y-1 text-sm">
                <p className="font-semibold text-text">{testimonial.name}</p>
                <p className="text-text-muted">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home