import { Outlet, NavLink } from 'react-router-dom'
import { Home, Heart, User } from 'lucide-react'

const CustomerLayout = () => {
  return (
    <div className="container-custom py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64">
          <nav className="space-y-2">
            <NavLink
              to="/customer"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-[#0F766E] text-white' : 'hover:bg-gray-100'
                }`
              }
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Feed</span>
            </NavLink>
            <NavLink
              to="/customer/favorites"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-[#0F766E] text-white' : 'hover:bg-gray-100'
                }`
              }
            >
              <Heart className="w-5 h-5" />
              <span className="font-medium">Favorites</span>
            </NavLink>
            <NavLink
              to="/customer/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-[#0F766E] text-white' : 'hover:bg-gray-100'
                }`
              }
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Profile</span>
            </NavLink>
          </nav>
        </aside>

        {/* Mobile Tabs */}
        <div className="lg:hidden flex border-b border-gray-200 mb-4">
          <NavLink
            to="/customer"
            end
            className={({ isActive }) =>
              `flex-1 text-center py-3 border-b-2 transition-colors ${
                isActive ? 'border-[#0F766E] text-[#0F766E] font-medium' : 'border-transparent text-gray-600'
              }`
            }
          >
            Feed
          </NavLink>
          <NavLink
            to="/customer/favorites"
            className={({ isActive }) =>
              `flex-1 text-center py-3 border-b-2 transition-colors ${
                isActive ? 'border-[#0F766E] text-[#0F766E] font-medium' : 'border-transparent text-gray-600'
              }`
            }
          >
            Favorites
          </NavLink>
          <NavLink
            to="/customer/profile"
            className={({ isActive }) =>
              `flex-1 text-center py-3 border-b-2 transition-colors ${
                isActive ? 'border-[#0F766E] text-[#0F766E] font-medium' : 'border-transparent text-gray-600'
              }`
            }
          >
            Profile
          </NavLink>
        </div>

        {/* Main Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default CustomerLayout

