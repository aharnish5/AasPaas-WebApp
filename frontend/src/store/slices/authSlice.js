import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../../services/api'

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ identifier, password, role }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login({ identifier, password, role })
      localStorage.setItem('accessToken', response.data.accessToken)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Login failed')
    }
  }
)

export const signup = createAsyncThunk(
  'auth/signup',
  async ({ name, email, password, role, defaultLocation, phone }, { rejectWithValue }) => {
    try {
      const response = await authAPI.signup({ name, email, password, role, defaultLocation, phone })
      localStorage.setItem('accessToken', response.data.accessToken)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Signup failed')
    }
  }
)

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getMe()
      return response.data.user
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get user')
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authAPI.logout()
    localStorage.removeItem('accessToken')
    return null
  } catch (error) {
    localStorage.removeItem('accessToken')
    return null
  }
})

const initialState = {
  user: null,
  token: localStorage.getItem('accessToken'),
  isAuthenticated: false,
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.accessToken
      state.isAuthenticated = true
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.accessToken
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.isAuthenticated = false
      })
      // Signup
      .addCase(signup.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.accessToken
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.isAuthenticated = false
      })
      // Get Me
      .addCase(getMe.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(getMe.rejected, (state) => {
        state.loading = false
        state.user = null
        state.isAuthenticated = false
        state.token = null
        localStorage.removeItem('accessToken')
      })
      // Ensure loading is set while fetching current user
      .addCase(getMe.pending, (state) => {
        state.loading = true
        state.error = null
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
  },
})

export const { clearError, setCredentials } = authSlice.actions
export default authSlice.reducer

