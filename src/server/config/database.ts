import mongoose from 'mongoose';
import { env } from './environment.js';

let isConnected = false;

export async function connectDatabase(): Promise<boolean> {
  if (isConnected) {
    return true;
  }

  if (!env.MONGODB_URI) {
    console.warn('[Database] MONGODB_URI not provided in environment. Initializing high-availability hybrid database engine.');
    return false;
  }

  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log('[Database] Successfully established connection to MongoDB database.');

    mongoose.connection.on('error', (err) => {
      console.error('[Database] MongoDB connection runtime error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB disconnected. Attempting automatic reconnection...');
      isConnected = false;
    });

    return true;
  } catch (error) {
    console.warn('[Database] Direct MongoDB connection failed. Falling back to robust hybrid store:', (error as Error).message);
    return false;
  }
}

export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function disconnectDatabase(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] MongoDB disconnected cleanly on process termination.');
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});
