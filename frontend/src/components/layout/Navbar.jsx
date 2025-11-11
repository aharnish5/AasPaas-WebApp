import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut, Store, MapPin, Heart, LayoutDashboard, Settings, Home } from 'lucide-react'
import AddressAutocomplete from '../search/AddressAutocomplete'
import { useAuth } from '../../hooks/useAuth'
import { useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import Button from '../ui/Button'
import { cn } from '../../utils/cn'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { isAuthenticated, user, role } = useAuth()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
    setIsProfileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <nav className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0F766E] rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#0F766E]">Aas Paas</span>
          </Link>

          {/* Desktop Search - Center */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <AddressAutocomplete
              placeholder="Search by locality, area, street…"
              onSelect={(place) => {
                navigate(`/search?lat=${place.latitude}&lon=${place.longitude}&q=${encodeURIComponent(place.label)}`)
              }}
              onSubmitQuery={(text) => {
                const q = encodeURIComponent(text)
                navigate(`/search?q=${q}`)
              }}
            />
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link to="/login/customer">
                  <Button variant="ghost">Customer Login</Button>
                </Link>
                <Link to="/login/vendor">
                  <Button variant="secondary">Vendor Login</Button>
                </Link>
                <Link to="/signup/vendor">
                  <Button variant="primary">List Your Shop</Button>
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">{user?.name}</span>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2">
                    {role === 'customer' && (
                      <>
                        <Link
                          to="/customer/profile"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4 text-gray-500" />
                          <span>Edit Profile</span>
                        </Link>
                        <Link
                          to="/customer"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Home className="w-4 h-4 text-gray-500" />
                          <span>My Feed</span>
                        </Link>
                        <Link
                          to="/customer/favorites"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Heart className="w-4 h-4 text-gray-500" />
                          <span>Favorites</span>
                        </Link>
                      </>
                    )}
                    {role === 'vendor' && (
                      <>
                        <div className="px-4 pb-1 pt-0.5 text-xs font-medium text-gray-500">
                          Account
                        </div>
                        <Link
                          to="/vendor/settings"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4 text-gray-500" />
                          <span>Edit Profile</span>
                        </Link>
                        <div className="my-2 border-t border-gray-100" />
                        <div className="px-4 pb-1 text-xs font-medium text-gray-500">
                          Business
                        </div>
                        <Link
                          to="/vendor"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-500" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          to="/vendor/my-shop"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Store className="w-4 h-4 text-gray-500" />
                          <span>My Shops</span>
                        </Link>
                      </>
                    )}
                    <div className="my-2 border-t border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              <div className="px-2">
                <AddressAutocomplete
                  placeholder="Search location…"
                  onSelect={(place) => {
                    navigate(`/search?lat=${place.latitude}&lon=${place.longitude}&q=${encodeURIComponent(place.label)}`)
                    setIsMobileMenuOpen(false)
                  }}
                  onSubmitQuery={(text) => {
                    const q = encodeURIComponent(text)
                    navigate(`/search?q=${q}`)
                    setIsMobileMenuOpen(false)
                  }}
                  className="mb-2"
                />
              </div>
              {!isAuthenticated ? (
                <>
                  <Link to="/login/customer" className="block py-2">
                    <Button variant="ghost" className="w-full">Customer Login</Button>
                  </Link>
                  <Link to="/login/vendor" className="block py-2">
                    <Button variant="secondary" className="w-full">Vendor Login</Button>
                  </Link>
                  <Link to="/signup/vendor" className="block py-2">
                    <Button variant="primary" className="w-full">List Your Shop</Button>
                  </Link>
                </>
              ) : (
                <>
                  {role === 'customer' && (
                    <>
                      <Link to="/customer/profile" className="flex items-center gap-2 py-2 px-4 hover:bg-gray-50 rounded-lg">
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span>Edit Profile</span>
                      </Link>
                      <Link to="/customer" className="flex items-center gap-2 py-2 px-4 hover:bg-gray-50 rounded-lg">
                        <Home className="w-4 h-4 text-gray-500" />
                        <span>My Feed</span>
                      </Link>
                      <Link to="/customer/favorites" className="flex items-center gap-2 py-2 px-4 hover:bg-gray-50 rounded-lg">
                        <Heart className="w-4 h-4 text-gray-500" />
                        <span>Favorites</span>
                      </Link>
                    </>
                  )}
                  {role === 'vendor' && (
                    <>
                      <div className="px-4 pb-1 pt-0.5 text-xs font-medium text-gray-500">Account</div>
                      <Link to="/vendor/settings" className="flex items-center gap-2 py-2 px-4 hover:bg-gray-50 rounded-lg">
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span>Edit Profile</span>
                      </Link>
                      <div className="my-2 border-t border-gray-100" />
                      <div className="px-4 pb-1 text-xs font-medium text-gray-500">Business</div>
                      <Link to="/vendor" className="flex items-center gap-2 py-2 px-4 hover:bg-gray-50 rounded-lg">
                        <LayoutDashboard className="w-4 h-4 text-gray-500" />
                        <span>Dashboard</span>
                      </Link>
                      <Link to="/vendor/my-shop" className="flex items-center gap-2 py-2 px-4 hover:bg-gray-50 rounded-lg">
                        <Store className="w-4 h-4 text-gray-500" />
                        <span>My Shops</span>
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-2 px-4 hover:bg-gray-50 rounded-lg text-red-600"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar

