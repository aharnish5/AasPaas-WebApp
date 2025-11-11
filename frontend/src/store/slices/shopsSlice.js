import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { shopAPI } from '../../services/api'

export const fetchShops = createAsyncThunk(
  'shops/fetchShops',
  async (params = {}, { rejectWithValue }) => {
    try {
      // Clean params - remove empty strings, null, undefined
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => {
          return value !== null && value !== undefined && value !== ''
        })
      )
      
      const response = await shopAPI.getShops(cleanParams)
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch shops'
      const errorDetails = error.response?.data?.details
      
      // Include validation details if available
      if (errorDetails && Array.isArray(errorDetails)) {
        const detailsMsg = errorDetails.map(d => d.msg || d).join(', ')
        return rejectWithValue(`${errorMessage}: ${detailsMsg}`)
      }
      
      return rejectWithValue(errorMessage)
    }
  }
)

// Fetch only vendor's own shops by ownerId
export const fetchVendorShops = createAsyncThunk(
  'shops/fetchVendorShops',
  async (ownerId, { rejectWithValue }) => {
    try {
      if (!ownerId) {
        return rejectWithValue('Owner ID missing');
      }
      const response = await shopAPI.getShops({ ownerId, sort: 'newest' });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch vendor shops');
    }
  }
)

export const fetchShopById = createAsyncThunk(
  'shops/fetchShopById',
  async ({ shopId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await shopAPI.getShopById(shopId, params)
      return response.data.shop
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch shop')
    }
  }
)

export const createShop = createAsyncThunk(
  'shops/createShop',
  async (shopData, { rejectWithValue }) => {
    try {
      const response = await shopAPI.createShop(shopData)
      return response.data.shop
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create shop';
      const errorDetails = error.response?.data?.details;
      if (errorDetails && Array.isArray(errorDetails)) {
        const detailsMsg = errorDetails.map(d => (typeof d === 'string' ? d : d.msg || d)).join(', ');
        return rejectWithValue(`${errorMessage}: ${detailsMsg}`);
      }
      return rejectWithValue(errorMessage)
    }
  }
)

const initialState = {
  shops: [],
  selectedShop: null,
  loading: false,
  error: null,
  pagination: null,
  nearby: [],
}
// Nearby shops (uses reduced radius default)
export const fetchNearbyShops = createAsyncThunk(
  'shops/fetchNearbyShops',
  async ({ latitude, longitude, radius = 3 }, { rejectWithValue }) => {
    try {
      if (latitude == null || longitude == null) {
        return rejectWithValue('Coordinates required');
      }
      const response = await shopAPI.getShops({ lat: latitude, lon: longitude, radius, sort: 'proximity' });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch nearby shops');
    }
  }
);

const shopsSlice = createSlice({
  name: 'shops',
  initialState,
  reducers: {
    clearSelectedShop: (state) => {
      state.selectedShop = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShops.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchShops.fulfilled, (state, action) => {
        state.loading = false
        state.shops = action.payload.shops
        state.pagination = action.payload.pagination
      })
      .addCase(fetchShops.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchVendorShops.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchVendorShops.fulfilled, (state, action) => {
        state.loading = false
        state.shops = action.payload.shops
        state.pagination = action.payload.pagination
      })
      .addCase(fetchVendorShops.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchNearbyShops.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNearbyShops.fulfilled, (state, action) => {
        state.loading = false
        state.nearby = action.payload.shops
      })
      .addCase(fetchNearbyShops.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchShopById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchShopById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedShop = action.payload
      })
      .addCase(fetchShopById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createShop.fulfilled, (state, action) => {
        state.shops.unshift(action.payload)
      })
  },
})

export const { clearSelectedShop, clearError } = shopsSlice.actions
export default shopsSlice.reducer

