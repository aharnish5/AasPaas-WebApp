import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'

// Layouts
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import CustomerLayout from './components/layout/CustomerLayout'
import VendorLayout from './components/layout/VendorLayout'

// Public Pages
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import SearchResults from './pages/SearchResults'
import ShopDetail from './pages/ShopDetail'

// Auth Pages
import CustomerLogin from './pages/auth/CustomerLogin'
import VendorLogin from './pages/auth/VendorLogin'
import CustomerSignup from './pages/auth/CustomerSignup'
import VendorSignup from './pages/auth/VendorSignup'
import ForgotPassword from './pages/auth/ForgotPassword'

// Customer Pages
import CustomerFeed from './pages/customer/CustomerFeed'
import Favorites from './pages/customer/Favorites'
import CustomerProfile from './pages/customer/CustomerProfile'

// Vendor Pages
import VendorDashboard from './pages/vendor/VendorDashboard'
import VendorShops from './pages/vendor/VendorShops'
import VendorShop from './pages/vendor/VendorShop'
import VendorAnalytics from './pages/vendor/VendorAnalytics'
import VendorSettings from './pages/vendor/VendorSettings'
import VendorProfile from './pages/vendor/VendorProfile'

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-surface-gradient/40">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/shop/:shopId" element={<ShopDetail />} />

          {/* Auth Routes */}
          <Route path="/login/customer" element={<CustomerLogin />} />
          <Route path="/login/vendor" element={<VendorLogin />} />
          <Route path="/signup/customer" element={<CustomerSignup />} />
          <Route path="/signup/vendor" element={<VendorSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Customer Routes */}
          <Route
            path="/customer/*"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CustomerFeed />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="profile" element={<CustomerProfile />} />
          </Route>

          {/* Protected Vendor Routes */}
          <Route
            path="/vendor/*"
            element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <VendorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<VendorDashboard />} />
            <Route path="my-shop" element={<VendorShops />} />
            <Route path="my-shop/create" element={<VendorShop />} />
            <Route path="my-shop/edit/:shopId" element={<VendorShop />} />
            <Route path="analytics" element={<VendorAnalytics />} />
            <Route path="profile" element={<VendorProfile />} />
            <Route path="settings" element={<VendorSettings />} />
          </Route>
        </Routes>
      </main>
      <Footer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#0F172A',
            borderRadius: '12px',
            boxShadow: '0 6px 18px rgba(15,23,42,0.08)',
          },
        }}
      />
    </div>
  )
}

export default App

