import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { getMe } from '../store/slices/authSlice'

export const useAuth = () => {
  const dispatch = useDispatch()
  const { user, isAuthenticated, loading, token } = useSelector((state) => state.auth)

  useEffect(() => {
    if (token && !user) {
      dispatch(getMe())
    }
  }, [token, user, dispatch])

  return {
    user,
    token,
    isAuthenticated,
    loading,
    role: user?.role,
  }
}

