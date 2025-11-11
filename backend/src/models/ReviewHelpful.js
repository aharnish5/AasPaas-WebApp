import mongoose from 'mongoose';

const reviewHelpfulSchema = new mongoose.Schema(
  {
    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

// Ensure one helpful per user per review
reviewHelpfulSchema.index({ reviewId: 1, userId: 1 }, { unique: true });

const ReviewHelpful = mongoose.model('ReviewHelpful', reviewHelpfulSchema);

export default ReviewHelpful;
