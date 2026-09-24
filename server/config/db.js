const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let dbType = 'unknown';

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return { server: mongoServer, type: dbType };
    }

    const uri = process.env.MONGODB_URI;

    // If MONGODB_URI is provided, try connecting to it first
    if (uri) {
      try {
        console.log(`Attempting connection to MongoDB at: ...`);
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 2500 // Quick timeout if local mongod is not running
        });
        dbType = 'standalone';
        console.log("Connected successfully to standalone MongoDB:");
        return { server: null, type: dbType };
      } catch (connErr) {
        console.warn(`Could not connect to external MongoDB at (${connErr.message}).`);
        console.log('Falling back seamlessly to In-Memory MongoDB Server...');
      }
    }

    // Fallback: Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const memUri = mongoServer.getUri();
    await mongoose.connect(memUri);
    dbType = 'memory';
    console.log(`In-Memory MongoDB Server running & connected: ${memUri}`);

    return { server: mongoServer, type: dbType };
  } catch (err) {
    console.error('Fatal MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

const getDBType = () => dbType;

module.exports = { connectDB, disconnectDB, getDBType };
