const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dayflow';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
  } catch (err) {
    console.warn(`[MongoDB] Local MongoDB connection failed (${err.message}). Attempting in-memory database fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      isConnected = true;
      console.log(`[MongoDB Memory Server] Connected to in-memory instance: ${uri}`);
    } catch (memErr) {
      console.error('[MongoDB Error] Could not connect to local MongoDB or MongoMemoryServer.');
      console.error('Please ensure MongoDB is running or install dependencies with npm install.');
      throw memErr;
    }
  }
};

module.exports = connectDB;
