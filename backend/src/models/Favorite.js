import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		shopId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Shop',
			required: true,
			index: true,
		},
	},
	{
		timestamps: { createdAt: 'createdAt', updatedAt: false },
	}
);

// Ensure one favorite per user per shop
favoriteSchema.index({ userId: 1, shopId: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;

