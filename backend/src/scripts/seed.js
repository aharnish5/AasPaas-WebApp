import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Review from '../models/Review.js';
import { connectDB } from '../config/database.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing data (optional - comment out in production)
    await User.deleteMany({});
    await Shop.deleteMany({});
    await Review.deleteMany({});
    console.log('Cleared existing data');

    // Create sample users
    const vendor1 = await User.create({
      name: 'Rajesh Kumar',
      email: 'vendor1@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'vendor',
      defaultLocation: {
        rawAddress: '123 Main Street, New Delhi',
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139], // New Delhi
        },
      },
      isEmailVerified: true,
    });

    const vendor2 = await User.create({
      name: 'Priya Sharma',
      email: 'vendor2@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'vendor',
      defaultLocation: {
        rawAddress: '456 MG Road, Mumbai',
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760], // Mumbai
        },
      },
      isEmailVerified: true,
    });

    const customer1 = await User.create({
      name: 'Amit Singh',
      email: 'customer1@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'customer',
      defaultLocation: {
        rawAddress: '789 Park Avenue, New Delhi',
        location: {
          type: 'Point',
          coordinates: [77.2167, 28.6500],
        },
      },
      isEmailVerified: true,
    });

    const customer2 = await User.create({
      name: 'Sneha Patel',
      email: 'customer2@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'customer',
      defaultLocation: {
        rawAddress: '321 Churchgate, Mumbai',
        location: {
          type: 'Point',
          coordinates: [72.8258, 18.9388],
        },
      },
      isEmailVerified: true,
    });

    const customer3 = await User.create({
      name: 'Rahul Verma',
      email: 'customer3@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'customer',
      defaultLocation: {
        rawAddress: '555 Connaught Place, New Delhi',
        location: {
          type: 'Point',
          coordinates: [77.2189, 28.6324],
        },
      },
      isEmailVerified: true,
    });

    console.log('Created users');

    // Create sample shops
    const shop1 = await Shop.create({
      ownerId: vendor1._id,
      name: 'Rajesh Street Food Corner',
      description: 'Authentic North Indian street food. Best chaat and samosas in the area!',
      category: 'food',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
          caption: 'Our delicious street food',
          uploadedBy: vendor1._id,
        },
      ],
      address: {
        raw: '123 Main Street, Connaught Place, New Delhi, 110001',
        street: '123 Main Street',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India',
      },
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139],
      },
      hours: [
        { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00' },
        { dayOfWeek: 2, openTime: '08:00', closeTime: '22:00' },
        { dayOfWeek: 3, openTime: '08:00', closeTime: '22:00' },
        { dayOfWeek: 4, openTime: '08:00', closeTime: '22:00' },
        { dayOfWeek: 5, openTime: '08:00', closeTime: '22:00' },
        { dayOfWeek: 6, openTime: '09:00', closeTime: '23:00' },
        { dayOfWeek: 0, openTime: '09:00', closeTime: '23:00' },
      ],
      phone: '+91-9876543210',
      status: 'live',
      views: 150,
      ratings: {
        avg: 4.5,
        count: 12,
      },
    });

    const shop2 = await Shop.create({
      ownerId: vendor2._id,
      name: 'Priya Tailoring Services',
      description: 'Expert tailoring and alterations. Quick service, quality work.',
      category: 'services',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=800',
          caption: 'Our tailoring workshop',
          uploadedBy: vendor2._id,
        },
      ],
      address: {
        raw: '456 MG Road, Andheri West, Mumbai, 400053',
        street: '456 MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400053',
        country: 'India',
      },
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760],
      },
      hours: [
        { dayOfWeek: 1, openTime: '10:00', closeTime: '20:00' },
        { dayOfWeek: 2, openTime: '10:00', closeTime: '20:00' },
        { dayOfWeek: 3, openTime: '10:00', closeTime: '20:00' },
        { dayOfWeek: 4, openTime: '10:00', closeTime: '20:00' },
        { dayOfWeek: 5, openTime: '10:00', closeTime: '20:00' },
        { dayOfWeek: 6, openTime: '10:00', closeTime: '18:00' },
      ],
      phone: '+91-9876543211',
      status: 'live',
      views: 89,
      ratings: {
        avg: 4.2,
        count: 8,
      },
    });

    const shop3 = await Shop.create({
      ownerId: vendor1._id,
      name: 'Rajesh Mobile Repair',
      description: 'Fast and reliable mobile phone repair. Screen replacement, battery, software issues.',
      category: 'electronics',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1587825140358-431ece9a742c?w=800',
          caption: 'Our repair center',
          uploadedBy: vendor1._id,
        },
      ],
      address: {
        raw: '789 Karol Bagh, New Delhi, 110005',
        street: '789 Karol Bagh',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110005',
        country: 'India',
      },
      location: {
        type: 'Point',
        coordinates: [77.2000, 28.6500],
      },
      hours: [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '19:00' },
        { dayOfWeek: 2, openTime: '09:00', closeTime: '19:00' },
        { dayOfWeek: 3, openTime: '09:00', closeTime: '19:00' },
        { dayOfWeek: 4, openTime: '09:00', closeTime: '19:00' },
        { dayOfWeek: 5, openTime: '09:00', closeTime: '19:00' },
        { dayOfWeek: 6, openTime: '10:00', closeTime: '18:00' },
      ],
      phone: '+91-9876543212',
      status: 'live',
      views: 234,
      ratings: {
        avg: 4.7,
        count: 18,
      },
    });

    // Create vendor3 for Mysore shops
    const vendor3 = await User.create({
      name: 'Mysore Vendor',
      email: 'vendor3@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'vendor',
      defaultLocation: {
        rawAddress: 'Devaraja Market, Mysore',
        location: {
          type: 'Point',
          coordinates: [76.6394, 12.2958], // Mysore
        },
      },
      isEmailVerified: true,
    });

    // Create vendor4 for more shops
    const vendor4 = await User.create({
      name: 'Bangalore Vendor',
      email: 'vendor4@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'vendor',
      defaultLocation: {
        rawAddress: 'MG Road, Bangalore',
        location: {
          type: 'Point',
          coordinates: [77.6090, 12.9716], // Bangalore
        },
      },
      isEmailVerified: true,
    });

    // Mysore shops
    const shop4 = await Shop.create({
      ownerId: vendor3._id,
      name: 'Mysore Traditional Sweets',
      description: 'Authentic Mysore Pak and traditional South Indian sweets. Family recipe since 1950.',
      category: 'food',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800',
          caption: 'Traditional sweets',
          uploadedBy: vendor3._id,
        },
      ],
      address: {
        raw: 'Devaraja Market, Mysore, Karnataka, 570001',
        street: 'Devaraja Market',
        city: 'Mysore',
        state: 'Karnataka',
        postalCode: '570001',
        country: 'India',
      },
      location: {
        type: 'Point',
        coordinates: [76.6394, 12.2958], // Mysore
      },
      hours: [
        { dayOfWeek: 1, openTime: '07:00', closeTime: '21:00' },
        { dayOfWeek: 2, openTime: '07:00', closeTime: '21:00' },
        { dayOfWeek: 3, openTime: '07:00', closeTime: '21:00' },
        { dayOfWeek: 4, openTime: '07:00', closeTime: '21:00' },
        { dayOfWeek: 5, openTime: '07:00', closeTime: '21:00' },
        { dayOfWeek: 6, openTime: '07:00', closeTime: '22:00' },
        { dayOfWeek: 0, openTime: '08:00', closeTime: '22:00' },
      ],
      phone: '+91-9876543213',
      status: 'live',
      views: 312,
      ratings: {
        avg: 4.8,
        count: 25,
      },
    });

    const shop5 = await Shop.create({
      ownerId: vendor3._id,
      name: 'Mysore Silk Sarees',
      description: 'Authentic Mysore silk sarees and traditional wear. Premium quality fabrics.',
      category: 'clothing',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
          caption: 'Silk sarees collection',
          uploadedBy: vendor3._id,
        },
      ],
      address: {
        raw: 'Sayyaji Rao Road, Mysore, Karnataka, 570001',
        street: 'Sayyaji Rao Road',
        city: 'Mysore',
        state: 'Karnataka',
        postalCode: '570001',
        country: 'India',
      },
      location: {
        type: 'Point',
        coordinates: [76.6500, 12.3100], // Mysore
      },
      hours: [
        { dayOfWeek: 1, openTime: '10:00', closeTime: '20:00' },
        { dayOfWeek: 2, openTime: '10:00', closeTime: '20:00' },
        { dayOfWeek: 3, openTime: '10:00', closeTime: '20:00' },
        { dayOfWeek: 4, openTime: '10:00', closeTime: '20:00' },
        { dayOfWeek: 5, openTime: '10:00', closeTime: '20:00' },
        { dayOfWeek: 6, openTime: '10:00', closeTime: '20:00' },
      ],
      phone: '+91-9876543214',
      status: 'live',
      views: 198,
      ratings: {
        avg: 4.6,
        count: 15,
      },
    });

    const shop6 = await Shop.create({
      ownerId: vendor3._id,
      name: 'Mysore Electronics Hub',
      description: 'All electronics and gadgets. Mobile phones, laptops, accessories. Best prices in town.',
      category: 'electronics',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
          caption: 'Electronics store',
          uploadedBy: vendor3._id,
        },
      ],
      address: {
        raw: 'KR Circle, Mysore, Karnataka, 570001',
        street: 'KR Circle',
        city: 'Mysore',
        state: 'Karnataka',
        postalCode: '570001',
        country: 'India',
      },
      location: {
        type: 'Point',
        coordinates: [76.6400, 12.3000], // Mysore
      },
      hours: [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '20:00' },
        { dayOfWeek: 2, openTime: '09:00', closeTime: '20:00' },
        { dayOfWeek: 3, openTime: '09:00', closeTime: '20:00' },
        { dayOfWeek: 4, openTime: '09:00', closeTime: '20:00' },
        { dayOfWeek: 5, openTime: '09:00', closeTime: '20:00' },
        { dayOfWeek: 6, openTime: '10:00', closeTime: '20:00' },
      ],
      phone: '+91-9876543215',
      status: 'live',
      views: 156,
      ratings: {
        avg: 4.4,
        count: 11,
      },
    });

    // Bangalore shops
    const shop7 = await Shop.create({
      ownerId: vendor4._id,
      name: 'Bangalore Biryani House',
      description: 'Authentic Hyderabadi and Bangalore style biryani. Fresh ingredients daily.',
      category: 'food',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800',
          caption: 'Delicious biryani',
          uploadedBy: vendor4._id,
        },
      ],
      address: {
        raw: 'MG Road, Bangalore, Karnataka, 560001',
        street: 'MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      location: {
        type: 'Point',
        coordinates: [77.6090, 12.9716], // Bangalore
      },
      hours: [
        { dayOfWeek: 1, openTime: '11:00', closeTime: '23:00' },
        { dayOfWeek: 2, openTime: '11:00', closeTime: '23:00' },
        { dayOfWeek: 3, openTime: '11:00', closeTime: '23:00' },
        { dayOfWeek: 4, openTime: '11:00', closeTime: '23:00' },
        { dayOfWeek: 5, openTime: '11:00', closeTime: '23:00' },
        { dayOfWeek: 6, openTime: '11:00', closeTime: '00:00' },
        { dayOfWeek: 0, openTime: '11:00', closeTime: '23:00' },
      ],
      phone: '+91-9876543216',
      status: 'live',
      views: 445,
      ratings: {
        avg: 4.9,
        count: 32,
      },
    });

    const shop8 = await Shop.create({
      ownerId: vendor4._id,
      name: 'Bangalore Tech Services',
      description: 'Computer repair, software installation, network setup. Expert technicians.',
      category: 'services',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
          caption: 'Tech service center',
          uploadedBy: vendor4._id,
        },
      ],
      address: {
        raw: 'Koramangala, Bangalore, Karnataka, 560095',
        street: 'Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560095',
        country: 'India',
      },
      location: {
        type: 'Point',
        coordinates: [77.6200, 12.9350], // Bangalore Koramangala
      },
      hours: [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '19:00' },
        { dayOfWeek: 2, openTime: '09:00', closeTime: '19:00' },
        { dayOfWeek: 3, openTime: '09:00', closeTime: '19:00' },
        { dayOfWeek: 4, openTime: '09:00', closeTime: '19:00' },
        { dayOfWeek: 5, openTime: '09:00', closeTime: '19:00' },
        { dayOfWeek: 6, openTime: '10:00', closeTime: '18:00' },
      ],
      phone: '+91-9876543217',
      status: 'live',
      views: 278,
      ratings: {
        avg: 4.5,
        count: 20,
      },
    });

    // Fix Rajesh's shop image URL
    shop1.images[0].url = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop'
    await shop1.save()

    console.log('Created shops');

    // Create sample reviews
    await Review.create({
      shopId: shop1._id,
      userId: customer1._id,
      rating: 5,
      text: 'Amazing food! The chaat is incredible. Highly recommended!',
    });

    await Review.create({
      shopId: shop1._id,
      userId: customer2._id,
      rating: 4,
      text: 'Good quality street food. Quick service.',
    });

    await Review.create({
      shopId: shop2._id,
      userId: customer1._id,
      rating: 5,
      text: 'Excellent tailoring work. Very professional.',
    });

    await Review.create({
      shopId: shop3._id,
      userId: customer3._id,
      rating: 5,
      text: 'Fixed my phone screen quickly. Great service!',
    });

    console.log('Created reviews');

    // Add shops to customer favorites
    customer1.favorites.push(shop1._id, shop2._id);
    await customer1.save();

    customer2.favorites.push(shop1._id);
    await customer2.save();

    console.log('Added favorites');

    console.log('\n✅ Seed data created successfully!');
    console.log('\nSample Users:');
    console.log('Vendor 1:', vendor1.email, '/ password123');
    console.log('Vendor 2:', vendor2.email, '/ password123');
    console.log('Vendor 3:', vendor3.email, '/ password123');
    console.log('Vendor 4:', vendor4.email, '/ password123');
    console.log('Customer 1:', customer1.email, '/ password123');
    console.log('Customer 2:', customer2.email, '/ password123');
    console.log('Customer 3:', customer3.email, '/ password123');
    console.log('\nShops created:');
    console.log('- Rajesh Street Food Corner (New Delhi)');
    console.log('- Priya Tailoring Services (Mumbai)');
    console.log('- Rajesh Mobile Repair (New Delhi)');
    console.log('- Mysore Traditional Sweets (Mysore)');
    console.log('- Mysore Silk Sarees (Mysore)');
    console.log('- Mysore Electronics Hub (Mysore)');
    console.log('- Bangalore Biryani House (Bangalore)');
    console.log('- Bangalore Tech Services (Bangalore)');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

