import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, role, loading, token } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F766E]"></div>
      </div>
    )
  }

  // If user is not authenticated but we have a token stored, wait for getMe to resolve
  if (!isAuthenticated) {
    if (token) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F766E]"></div>
        </div>
      )
    }
    return <Navigate to="/login/customer" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute

