import request from 'supertest'
import app from '../app.js'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { connectDB } from '../config/database.js'
import User from '../models/User.js'

describe('PATCH /api/auth/profile', () => {
  let server
  let agent
  let token
  let userId

  beforeAll(async () => {
    // Spin up in-memory Mongo and point MONGO_URI to it
    const mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    process.env.MONGO_URI = uri
    await connectDB()
    server = app.listen(0)
    agent = request.agent(server)

    // Create a user and login to get tokens
    const resSignup = await agent
      .post('/api/auth/signup')
      .send({ name: 'Test User', email: 'test@example.com', password: 'password123', role: 'customer', phone: '+911234567890' })
      .expect(201)

    token = resSignup.body.accessToken
    userId = resSignup.body.user._id
  })

  afterAll(async () => {
    await User.deleteMany({})
    if (server) server.close()
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
  })

  it('updates name and phone with valid E.164', async () => {
    const res = await agent
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name', phone: '+919876543210' })
      .expect(200)

    expect(res.body.user.name).toBe('Updated Name')
    expect(res.body.user.phone).toBe('+919876543210')
  })

  it('rejects invalid phone format', async () => {
    const res = await agent
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '9876543210' })
      .expect(400)

    expect(res.body.error).toBeTruthy()
  })

  it('rejects duplicate phone', async () => {
    // create another user with a phone
    const resSignup2 = await agent
      .post('/api/auth/signup')
      .send({ name: 'Other', email: 'other@example.com', password: 'password123', role: 'customer', phone: '+9111122233344' })
      .expect(201)

    const res = await agent
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '+9111122233344' })
      .expect(400)

    expect(res.body.error).toMatch(/already in use|already registered/i)
  })
})
