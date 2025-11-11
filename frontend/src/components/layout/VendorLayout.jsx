import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Store, BarChart3, Settings } from 'lucide-react'

const VendorLayout = () => {
  return (
    <div className="container-custom py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64">
          <nav className="space-y-2">
            <NavLink
              to="/vendor"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-[#0F766E] text-white' : 'hover:bg-gray-100'
                }`
              }
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </NavLink>
            <NavLink
              to="/vendor/my-shop"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-[#0F766E] text-white' : 'hover:bg-gray-100'
                }`
              }
            >
              <Store className="w-5 h-5" />
              <span className="font-medium">My Shop</span>
            </NavLink>
            <NavLink
              to="/vendor/analytics"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-[#0F766E] text-white' : 'hover:bg-gray-100'
                }`
              }
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Analytics</span>
            </NavLink>
            <NavLink
              to="/vendor/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-[#0F766E] text-white' : 'hover:bg-gray-100'
                }`
              }
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </NavLink>
          </nav>
        </aside>

        {/* Mobile Tabs */}
        <div className="lg:hidden flex border-b border-gray-200 mb-4 overflow-x-auto">
          <NavLink
            to="/vendor"
            end
            className={({ isActive }) =>
              `px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                isActive ? 'border-[#0F766E] text-[#0F766E] font-medium' : 'border-transparent text-gray-600'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/vendor/my-shop"
            className={({ isActive }) =>
              `px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                isActive ? 'border-[#0F766E] text-[#0F766E] font-medium' : 'border-transparent text-gray-600'
              }`
            }
          >
            My Shop
          </NavLink>
          <NavLink
            to="/vendor/analytics"
            className={({ isActive }) =>
              `px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                isActive ? 'border-[#0F766E] text-[#0F766E] font-medium' : 'border-transparent text-gray-600'
              }`
            }
          >
            Analytics
          </NavLink>
          <NavLink
            to="/vendor/settings"
            className={({ isActive }) =>
              `px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                isActive ? 'border-[#0F766E] text-[#0F766E] font-medium' : 'border-transparent text-gray-600'
              }`
            }
          >
            Settings
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

export default VendorLayout

