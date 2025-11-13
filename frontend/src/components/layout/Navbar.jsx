import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut, Store, MapPin, Heart, LayoutDashboard, Settings, Home, ChevronDown, Search } from 'lucide-react'
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
  const profileMenuRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-2 group"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="w-9 h-9 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                Aas Paas
              </span>
            </Link>
          </div>

          {/* Desktop Search - Center */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <AddressAutocomplete
                placeholder="Search for shops, restaurants, services..."
                onSelect={(place) => {
                  navigate(`/search?lat=${place.latitude}&lon=${place.longitude}&q=${encodeURIComponent(place.label)}`)
                }}
                onSubmitQuery={(text) => {
                  const q = encodeURIComponent(text)
                  navigate(`/search?q=${q}`)
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {!isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link to="/login/customer">
                  <Button 
                    variant="ghost" 
                    className="text-gray-700 hover:text-teal-600 font-medium px-4 py-2"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup/vendor">
                  <Button 
                    variant="primary"
                    className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-6 py-2 font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    List Your Business
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                {/* Quick Actions */}
                {role === 'customer' && (
                  <div className="flex items-center space-x-1">
                    <Link
                      to="/customer/favorites"
                      className="p-2 text-gray-600 hover:text-teal-600 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Favorites"
                    >
                      <Heart className="w-5 h-5" />
                    </Link>
                  </div>
                )}

                {/* Profile Dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 hover:border-teal-200 hover:bg-teal-50 transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user?.name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-32 truncate">
                      {user?.name || 'User'}
                    </span>
                    <ChevronDown 
                      className={cn(
                        "w-4 h-4 text-gray-500 transition-transform duration-200",
                        isProfileMenuOpen && "rotate-180"
                      )} 
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 transform opacity-100 scale-100 transition-all duration-200">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                        <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-1 text-xs font-medium capitalize bg-teal-100 text-teal-800 rounded-full">
                          {role}
                        </span>
                      </div>

                      <div className="py-2">
                        {role === 'customer' && (
                          <>
                            <button
                              onClick={() => handleNavigation('/customer')}
                              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Home className="w-4 h-4 text-gray-400" />
                              <span>My Feed</span>
                            </button>
                            <button
                              onClick={() => handleNavigation('/customer/favorites')}
                              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Heart className="w-4 h-4 text-gray-400" />
                              <span>Favorites</span>
                            </button>
                            <button
                              onClick={() => handleNavigation('/customer/profile')}
                              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Settings className="w-4 h-4 text-gray-400" />
                              <span>Account Settings</span>
                            </button>
                          </>
                        )}
                        {role === 'vendor' && (
                          <>
                            <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Business
                            </div>
                            <button
                              onClick={() => handleNavigation('/vendor')}
                              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4 text-gray-400" />
                              <span>Dashboard</span>
                            </button>
                            <button
                              onClick={() => handleNavigation('/vendor/my-shop')}
                              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Store className="w-4 h-4 text-gray-400" />
                              <span>My Shops</span>
                            </button>
                            <div className="my-1 border-t border-gray-100" />
                            <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Account
                            </div>
                            <button
                              onClick={() => handleNavigation('/vendor/settings')}
                              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Settings className="w-4 h-4 text-gray-400" />
                              <span>Profile Settings</span>
                            </button>
                          </>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 pt-4 pb-6 space-y-4">
              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <AddressAutocomplete
                  placeholder="Search nearby..."
                  onSelect={(place) => {
                    navigate(`/search?lat=${place.latitude}&lon=${place.longitude}&q=${encodeURIComponent(place.label)}`)
                    setIsMobileMenuOpen(false)
                  }}
                  onSubmitQuery={(text) => {
                    const q = encodeURIComponent(text)
                    navigate(`/search?q=${q}`)
                    setIsMobileMenuOpen(false)
                  }}
                  className="pl-10"
                />
              </div>

              {!isAuthenticated ? (
                <div className="space-y-3 pt-2">
                  <Link to="/login/customer" className="block">
                    <Button variant="ghost" className="w-full justify-center py-3 font-medium">
                      Customer Sign In
                    </Button>
                  </Link>
                  <Link to="/login/vendor" className="block">
                    <Button variant="outline" className="w-full justify-center py-3 font-medium border-gray-300">
                      Business Sign In
                    </Button>
                  </Link>
                  <Link to="/signup/vendor" className="block">
                    <Button 
                      variant="primary"
                      className="w-full justify-center py-3 font-medium bg-gradient-to-r from-teal-600 to-teal-700"
                    >
                      List Your Business
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* User Info */}
                  <div className="px-3 py-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-medium">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-2 space-y-1">
                    {role === 'customer' && (
                      <>
                        <button
                          onClick={() => handleNavigation('/customer')}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Home className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">My Feed</span>
                        </button>
                        <button
                          onClick={() => handleNavigation('/customer/favorites')}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Heart className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">Favorites</span>
                        </button>
                        <button
                          onClick={() => handleNavigation('/customer/profile')}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Settings className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">Account Settings</span>
                        </button>
                      </>
                    )}
                    {role === 'vendor' && (
                      <>
                        <button
                          onClick={() => handleNavigation('/vendor')}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <LayoutDashboard className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">Dashboard</span>
                        </button>
                        <button
                          onClick={() => handleNavigation('/vendor/my-shop')}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Store className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">My Shops</span>
                        </button>
                        <button
                          onClick={() => handleNavigation('/vendor/settings')}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Settings className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">Profile Settings</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 pt-3">
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar