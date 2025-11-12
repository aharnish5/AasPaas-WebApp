import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useRef } from 'react'
import { getMe } from '../store/slices/authSlice'

export const useAuth = () => {
  const dispatch = useDispatch()
  const { user, isAuthenticated, loading, token, sessionHydrated } = useSelector((state) => state.auth)
  const bootstrapped = useRef(false)

  useEffect(() => {
    // On first mount, always attempt to resolve session.
    // If access token is absent, /auth/me will 401, triggering the axios interceptor
    // to perform a silent refresh using the HTTP-only refresh cookie, then retry.
    if (!bootstrapped.current && !user) {
      bootstrapped.current = true
      dispatch(getMe())
    }
  }, [user, dispatch])

  return {
    user,
    token,
    isAuthenticated,
    loading,
    sessionHydrated,
    role: user?.role,
  }
}

