import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import VendorMapEmbed from '../../components/map/VendorMapEmbed'

// Simple vendor profile summary page (read-only core fields plus map if defaultLocation exists)
const VendorProfile = () => {
  const { user } = useAuth()
  const coords = user?.defaultLocation?.location?.coordinates
  const hasCoords = Array.isArray(coords) && coords.length === 2 && coords[0] !== 0 && coords[1] !== 0
  const [lon, lat] = hasCoords ? coords : [null, null]

  return (
    <div className="container-custom py-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Vendor Profile</h1>
        <Link
          to="/vendor/settings"
          className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-400 focus:ring-offset-2"
        >
          Edit Profile & Settings
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <div>
            <label className="input-label">Name</label>
            <p className="text-gray-900 break-words">{user?.name || '—'}</p>
          </div>
          <div>
            <label className="input-label">Email</label>
            <p className="text-gray-900 break-words">{user?.email || '—'}</p>
          </div>
          <div>
            <label className="input-label">Phone</label>
            <p className="text-gray-900 break-words">{user?.phone || '—'}</p>
          </div>
          <div>
            <label className="input-label">Role</label>
            <p className="text-gray-900 capitalize">{user?.role || 'vendor'}</p>
          </div>
          {user?.defaultLocation?.rawAddress && (
            <div>
              <label className="input-label">Default Address</label>
              <p className="text-gray-900 break-words text-sm">{user.defaultLocation.rawAddress}</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Location Preview</h2>
          {hasCoords ? (
            <VendorMapEmbed
              lat={lat}
              lng={lon}
              label={user?.name || 'Vendor'}
              height="300px"
              className=""
            />
          ) : (
            <p className="text-sm text-gray-600">No default coordinates set yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default VendorProfile