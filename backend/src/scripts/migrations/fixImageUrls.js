import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../../config/database.js';
import Shop from '../../models/Shop.js';
import Review from '../../models/Review.js';

/**
 * Migration: Normalize all image URLs to use the current backend base URL
 *
 * What it does
 * - Finds Shop.images[].url and Review.images[].url that point to old hosts
 *   (e.g., localhost or an old Render URL) and rewrites them to
 *   `${BASE}/uploads/...` while preserving the path after /uploads.
 * - Skips URLs that don't contain '/uploads/' (e.g., S3 URLs) or already match BASE.
 *
 * Configuration (any one of the following, first match wins):
 * - PUBLIC_BASE_URL
 * - BASE_URL
 * - RENDER_EXTERNAL_URL (Render provides this automatically)
 * Fallback: http://localhost:5000 (not recommended for prod)
 */

dotenv.config();

const RAW_BASE =
	process.env.PUBLIC_BASE_URL ||
	process.env.BASE_URL ||
	process.env.RENDER_EXTERNAL_URL ||
	`http://localhost:${process.env.PORT || 5000}`;
const BASE = RAW_BASE.replace(/\/$/, '');

function rewriteToBase(url) {
	try {
		if (!url || typeof url !== 'string') return null;
		const uploadsIndex = url.indexOf('/uploads/');
		if (uploadsIndex === -1) return null; // not an uploads URL

		// If it already starts with BASE, skip
		if (url.startsWith(`${BASE}/uploads/`)) return null;

		// Extract the path from /uploads/ onwards
		const pathFromUploads = url.slice(uploadsIndex);
		return `${BASE}${pathFromUploads}`;
	} catch (e) {
		return null;
	}
}

async function updateCollection(Model) {
	const cursor = Model.find({ images: { $exists: true, $ne: [] } }).cursor();
	let totalDocs = 0;
	let totalUrlsUpdated = 0;
	const bulkOps = [];

	for await (const doc of cursor) {
		totalDocs += 1;
		let changed = false;

		const images = (doc.images || []).map((img) => ({ ...img }));

		images.forEach((img) => {
			if (!img?.url || typeof img.url !== 'string') return;
			const rewritten = rewriteToBase(img.url);
			if (rewritten && rewritten !== img.url) {
				img.url = rewritten;
				changed = true;
				totalUrlsUpdated += 1;
			}
		});

		if (changed) {
			bulkOps.push({
				updateOne: {
					filter: { _id: doc._id },
					update: { $set: { images } },
				},
			});
		}

		if (bulkOps.length >= 500) {
			await Model.bulkWrite(bulkOps);
			bulkOps.length = 0;
		}
	}

	if (bulkOps.length) {
		await Model.bulkWrite(bulkOps);
	}

	return { totalDocs, totalUrlsUpdated };
}

(async () => {
	try {
		const mongoEnv = process.env.MONGODB_URI || process.env.MONGO_URI;
		if (!mongoEnv) {
			throw new Error('MONGODB_URI (or MONGO_URI) not set');
		}
		await connectDB();

		console.log('[fixImageUrls] Using BASE =', BASE);

		const shopsResult = await updateCollection(Shop);
		console.log(`[fixImageUrls] Shops scanned=${shopsResult.totalDocs} urlsUpdated=${shopsResult.totalUrlsUpdated}`);

		const reviewsResult = await updateCollection(Review);
		console.log(`[fixImageUrls] Reviews scanned=${reviewsResult.totalDocs} urlsUpdated=${reviewsResult.totalUrlsUpdated}`);

		await mongoose.connection.close();
		console.log('[fixImageUrls] Done.');
	} catch (err) {
		console.error('[fixImageUrls] Failed:', err);
		try { await mongoose.connection.close(); } catch {}
		process.exit(1);
	}
})();
