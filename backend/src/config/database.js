import mongoose from 'mongoose';
import logger from './logger.js';

/**
 * Connect to MongoDB with optional retry + helpful diagnostics.
 * Adds clearer guidance for common Atlas connection failures (IP whitelist, DNS, credentials).
 */
export const connectDB = async ({
  retries = parseInt(process.env.MONGO_RETRIES || '3', 10),
  retryDelayMs = parseInt(process.env.MONGO_RETRY_DELAY_MS || '4000', 10),
  uri = process.env.MONGO_URI,
} = {}) => {
  if (!uri) {
    throw new Error('MONGO_URI not set. Add MONGO_URI to your .env file');
  }

  let attempt = 0;
  while (attempt <= retries) {
    try {
      attempt += 1;
      logger.info(`MongoDB connect attempt ${attempt}/${retries + 1}`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || '30000', 10),
        socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS || '45000', 10),
      });

      logger.info(`MongoDB Connected: ${conn.connection.host}`);

      // Connection event listeners (register once)
      if (mongoose.connection.listenerCount('error') === 0) {
        mongoose.connection.on('error', (err) => {
          logger.error('MongoDB connection error:', err);
        });
      }
      if (mongoose.connection.listenerCount('disconnected') === 0) {
        mongoose.connection.on('disconnected', () => {
          logger.warn('MongoDB disconnected');
        });
      }

      return conn; // success
    } catch (error) {
      const isLast = attempt > retries;
      logger.error(`MongoDB connection failed (attempt ${attempt}): ${error.message}`);

      // Provide actionable hints on common Atlas issues
      if (error.message?.includes('Server selection timed out')) {
        logger.warn('Hint: Ensure your IP is whitelisted in Atlas (or use 0.0.0.0/0 for dev), cluster is ACTIVE (not paused), and network allows outbound TLS (port 27017).');
      }
      if (error.message?.includes('authentication')) {
        logger.warn('Hint: Check username/password in MONGO_URI. If special characters are in password, URL-encode them.');
      }

      if (isLast) {
        // Exhausted retries
        throw error;
      }
      // Wait then retry
      await new Promise((res) => setTimeout(res, retryDelayMs));
    }
  }
};

