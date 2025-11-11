import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    text: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review text cannot exceed 1000 characters'],
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    helpfulCount: {
      type: Number,
      default: 0,
    },
    reported: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one review per user per shop
reviewSchema.index({ shopId: 1, userId: 1 }, { unique: true });

// Index for shop reviews lookup
reviewSchema.index({ shopId: 1, createdAt: -1 });

// Update shop ratings when review is saved
reviewSchema.post('save', async function () {
  await updateShopRatings(this.shopId);
});

// Update shop ratings when review is deleted
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await updateShopRatings(doc.shopId);
  }
});

// Update shop ratings when review is updated
reviewSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    await updateShopRatings(doc.shopId);
  }
});

async function updateShopRatings(shopId) {
  const Review = mongoose.model('Review');
  const Shop = mongoose.model('Shop');

  const reviews = await Review.find({ shopId });
  
  if (reviews.length === 0) {
    await Shop.findByIdAndUpdate(shopId, {
      'ratings.avg': 0,
      'ratings.count': 0,
    });
    return;
  }

  const avgRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const count = reviews.length;

  await Shop.findByIdAndUpdate(shopId, {
    'ratings.avg': Math.round(avgRating * 10) / 10, // Round to 1 decimal
    'ratings.count': count,
  });
}

const Review = mongoose.model('Review', reviewSchema);

export default Review;

