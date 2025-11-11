import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { connectDB } from '../config/database.js';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import { generateAccessToken } from '../utils/generateTokens.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDB({ uri, retries: 0 });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Favorites & Reviews', () => {
  let customerToken;
  let vendorToken;
  let vendor;
  let shop;

  beforeAll(async () => {
    const customer = await User.create({ name: 'Cust', email: 'c@example.com', passwordHash: 'password', role: 'customer' });
    vendor = await User.create({ name: 'Vend', email: 'v@example.com', passwordHash: 'password', role: 'vendor' });
    customerToken = generateAccessToken(customer._id.toString());
    vendorToken = generateAccessToken(vendor._id.toString());

    shop = await Shop.create({
      ownerId: vendor._id,
      name: 'Test Shop',
      category: 'food',
      address: { raw: '123 Street' },
      location: { type: 'Point', coordinates: [77, 28] },
      images: [],
    });
  });

  test('customer can add/remove favorite', async () => {
    const favRes = await request(app)
      .post(`/api/shops/${shop._id}/favorite`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(201);
    expect(favRes.body.favorited).toBe(true);

    const listRes = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(Array.isArray(listRes.body.shops)).toBe(true);
    expect(listRes.body.shops[0]._id).toBe(shop._id.toString());

    const delRes = await request(app)
      .delete(`/api/shops/${shop._id}/favorite`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(delRes.body.favorited).toBe(false);
  });

  test('customer can create review and vendor can fetch analytics', async () => {
    const createRes = await request(app)
      .post(`/api/shops/${shop._id}/reviews`)
      .set('Authorization', `Bearer ${customerToken}`)
      .field('rating', '5')
      .field('text', 'Great place to eat!')
      .expect(201);
    expect(createRes.body.review.rating).toBe(5);

    const listRes = await request(app)
      .get(`/api/shops/${shop._id}/reviews`)
      .expect(200);
    expect(listRes.body.pagination.total).toBeGreaterThanOrEqual(1);

    const analyticsRes = await request(app)
      .get(`/api/shops/${shop._id}/vendor/${vendor._id}/reviews/analytics`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .expect(200);
    expect(typeof analyticsRes.body.average).toBe('number');
  });
});
