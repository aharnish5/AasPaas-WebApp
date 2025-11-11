import mongoose from 'mongoose';

const vendorReplySchema = new mongoose.Schema(
  {
    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    replyText: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

// One reply per review (update overwrites)
vendorReplySchema.index({ reviewId: 1 }, { unique: true });

const VendorReply = mongoose.model('VendorReply', vendorReplySchema);

export default VendorReply;
