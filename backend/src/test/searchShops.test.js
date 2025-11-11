import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { connectDB } from '../config/database.js';
import Shop from '../models/Shop.js';

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

describe('POST /api/shops/search (radius + city_slug)', () => {
  const center = { lat: 28.6139, lon: 77.2090 }; // New Delhi approximate center

  beforeAll(async () => {
    // Ensure 2dsphere index exists for $geoNear
    await Shop.syncIndexes();
    // Inside radius (~300m)
    await Shop.create({
      ownerId: new mongoose.Types.ObjectId(),
      name: 'Near Shop',
      status: 'live',
      city_slug: 'delhi',
      area_slug: 'connaught-place',
      location: { type: 'Point', coordinates: [77.2095, 28.6140] },
      address: { raw: 'Connaught Place, New Delhi' },
      category: 'food',
    });
    // Slightly farther (~1200m)
    await Shop.create({
      ownerId: new mongoose.Types.ObjectId(),
      name: 'Far Shop',
      status: 'live',
      city_slug: 'delhi',
      area_slug: 'janpath',
      location: { type: 'Point', coordinates: [77.2185, 28.6165] },
      address: { raw: 'Janpath, New Delhi' },
      category: 'food',
    });
    // Outside radius (~5km)
    await Shop.create({
      ownerId: new mongoose.Types.ObjectId(),
      name: 'Outside Shop',
      status: 'live',
      city_slug: 'delhi',
      area_slug: 'airport',
      location: { type: 'Point', coordinates: [77.0860, 28.5562] },
      address: { raw: 'IGI Airport, New Delhi' },
      category: 'food',
    });
  });

  test('returns only shops within radius ordered by distance', async () => {
    const res = await request(app)
      .post('/api/shops/search')
      .send({ center, radiusMeters: 3000, city_slug: 'delhi' })
      .expect(200);

    expect(res.body).toHaveProperty('meta');
    expect(res.body).toHaveProperty('shops');
    const { shops, meta } = res.body;
    expect(meta.total).toBe(2);
    expect(shops.length).toBe(2);
    // Ensure distance field present and sorted ascending
    const distances = shops.map(s => s.dist?.calculated).filter(d => typeof d === 'number');
    expect(distances.length).toBe(2);
    expect(distances[0]).toBeLessThanOrEqual(distances[1]);
    const names = shops.map(s => s.name);
    expect(names).toContain('Near Shop');
    expect(names).toContain('Far Shop');
    expect(names).not.toContain('Outside Shop');
  });

  test('400 when center missing', async () => {
    const res = await request(app)
      .post('/api/shops/search')
      .send({ radiusMeters: 3000 })
      .expect(400);
    // Validation is centralized; ensure some error message exists
    expect(res.body.error || res.body.errors).toBeTruthy();
  });
});
