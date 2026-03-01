import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export async function connectMongo() {
  const uri = process.env.MONGO_URL || 'mongodb://admin:password@localhost:27017/ciphersqlstudio_mongo?authSource=admin';
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.warn('MongoDB connection failed:', (err as Error).message);
  }
}
