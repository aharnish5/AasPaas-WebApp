import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { reviewAPI } from '../../services/api'

export const fetchShopReviews = createAsyncThunk(
  'reviews/fetchShopReviews',
  async ({ shopId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await reviewAPI.getShopReviews(shopId, params)
      return { shopId, reviews: response.data.reviews, pagination: response.data.pagination }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch reviews')
    }
  }
)

export const createReview = createAsyncThunk(
  'reviews/createReview',
  async ({ shopId, data, images }, { rejectWithValue }) => {
    try {
      const response = await reviewAPI.createReview(shopId, data, images)
      return response.data.review
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create review')
    }
  }
)

const initialState = {
  reviewsByShop: {},
  loading: false,
  error: null,
}

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShopReviews.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchShopReviews.fulfilled, (state, action) => {
        state.loading = false
        state.reviewsByShop[action.payload.shopId] = {
          reviews: action.payload.reviews,
          pagination: action.payload.pagination,
        }
      })
      .addCase(fetchShopReviews.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createReview.fulfilled, (state, action) => {
        const shopId = action.payload.shopId
        if (state.reviewsByShop[shopId]) {
          state.reviewsByShop[shopId].reviews.unshift(action.payload)
        }
      })
  },
})

export const { clearError } = reviewsSlice.actions
export default reviewsSlice.reducer

