import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, role, loading, token, sessionHydrated } = useAuth()

  // Always wait for initial session hydration to finish to avoid race on reload
  if (loading || !sessionHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F766E]"></div>
      </div>
    )
  }

  // If user is not authenticated but we have a token stored, wait for getMe to resolve
  if (!isAuthenticated) {
    return <Navigate to="/login/customer" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute

