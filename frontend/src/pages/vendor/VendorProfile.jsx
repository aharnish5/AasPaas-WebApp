import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, User, Sparkles, Edit3 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import VendorMapEmbed from '../../components/map/VendorMapEmbed'

const VendorProfile = () => {
  const { user } = useAuth()
  const coords = user?.defaultLocation?.location?.coordinates
  const hasCoords = Array.isArray(coords) && coords.length === 2 && coords[0] !== 0 && coords[1] !== 0
  const [lon, lat] = hasCoords ? coords : [null, null]

  return (
    <div className="container-custom space-y-8 py-8">
      <div className="surface-card relative overflow-hidden rounded-3xl px-7 py-8 shadow-[var(--shadow-sm)]">
        <div className="absolute -top-16 right-10 h-36 w-36 rounded-full bg-[color:var(--color-primary)]/20 blur-3xl" />
        <div className="absolute -bottom-16 left-12 h-40 w-40 rounded-full bg-[color:var(--color-accent)]/18 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <span className="badge-pill inline-flex items-center gap-2 bg-primary/10 text-[color:var(--color-primary)]">
              <Sparkles className="h-4 w-4" />
              Vendor identity
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-text md:text-4xl">{user?.name || 'Vendor profile'}</h1>
              <p className="mt-2 text-sm text-text-muted">
                Keep your storefront details sharp for customers, couriers, and review responses.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-text-muted">
              {user?.email && (
                <span className="surface-pill inline-flex items-center gap-2 px-4 py-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </span>
              )}
              {user?.phone && (
                <span className="surface-pill inline-flex items-center gap-2 px-4 py-2">
                  <Phone className="h-4 w-4" />
                  {user.phone}
                </span>
              )}
              <span className="surface-pill inline-flex items-center gap-2 px-4 py-2">
                <User className="h-4 w-4" />
                {user?.role || 'vendor'}
              </span>
            </div>
          </div>
          <Link
            to="/vendor/settings"
            className="btn-gradient inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]"
          >
            <Edit3 className="h-4 w-4" />
            Edit profile
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="card space-y-5">
          <div className="card-header">
            <div>
              <p className="card-subtitle">Contact</p>
              <h2 className="mt-2 text-xl font-semibold text-text">Core details</h2>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl bg-[color:var(--color-surface)]/60 p-4">
              <User className="h-5 w-5 text-[color:var(--color-primary)]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Name</p>
                <p className="mt-1 text-sm text-text break-words">{user?.name || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-[color:var(--color-surface)]/60 p-4">
              <Mail className="h-5 w-5 text-[color:var(--color-primary)]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Email</p>
                <p className="mt-1 text-sm text-text break-words">{user?.email || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-[color:var(--color-surface)]/60 p-4">
              <Phone className="h-5 w-5 text-[color:var(--color-primary)]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Phone</p>
                <p className="mt-1 text-sm text-text break-words">{user?.phone || '—'}</p>
              </div>
            </div>
            {user?.defaultLocation?.rawAddress && (
              <div className="flex items-start gap-3 rounded-2xl bg-[color:var(--color-surface)]/60 p-4">
                <MapPin className="h-5 w-5 text-[color:var(--color-primary)]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Default address</p>
                  <p className="mt-1 text-sm text-text break-words">{user.defaultLocation.rawAddress}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card space-y-5">
          <div className="card-header">
            <div>
              <p className="card-subtitle">Map preview</p>
              <h2 className="mt-2 text-xl font-semibold text-text">Default pin</h2>
            </div>
          </div>
          {hasCoords ? (
            <div className="overflow-hidden rounded-2xl">
              <VendorMapEmbed lat={lat} lng={lon} label={user?.name || 'Vendor'} height="320px" />
            </div>
          ) : (
            <div className="surface-card flex flex-col items-center gap-3 rounded-2xl px-6 py-10 text-center shadow-[var(--shadow-xs)]">
              <MapPin className="h-10 w-10 text-[color:var(--color-primary)]" style={{ opacity: 0.32 }} />
              <p className="text-sm text-text-muted">
                Set a default location in settings to help customers find you faster.
              </p>
              <Link
                to="/vendor/settings"
                className="btn-gradient inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]"
              >
                <Sparkles className="h-4 w-4" />
                Update location
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VendorProfile
