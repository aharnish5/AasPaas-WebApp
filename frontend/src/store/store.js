import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import shopsReducer from './slices/shopsSlice'
import reviewsReducer from './slices/reviewsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    shops: shopsReducer,
    reviews: reviewsReducer,
  },
})

