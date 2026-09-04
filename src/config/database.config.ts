import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/hrms';

export const connectDatabase = async (): Promise<boolean> => {
  try {

    console.log('Connecting to MONGODB_URI:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      connectTimeoutMS: 30000, // 30 seconds connection timeout
      maxPoolSize: 10,
      minPoolSize: 5,
    });

    console.log('✅ MongoDB connection successful');
    return true;
  } catch (error) {
    console.warn('⚠️ Primary MongoDB connection failed:', (error as Error).message);
    const localUri = 'mongodb://127.0.0.1:27017/hrms';
    if (MONGODB_URI !== localUri) {
      console.log('🔄 Attempting fallback connection to local MongoDB:', localUri);
      try {
        await mongoose.connect(localUri);
        console.log('✅ Connected to local MongoDB fallback successfully');
        return true;
      } catch (localError) {
        console.error('❌ Local MongoDB connection fallback failed as well.');
      }
    }
    console.error('\n📌 Action Required for Database Access:');
    console.error('1. Whitelist your current IP address in MongoDB Atlas (Network Access -> Add IP Address -> 0.0.0.0/0 for development): https://cloud.mongodb.com/');
    console.error('2. Or ensure local MongoDB service is running on port 27017 (e.g., brew services start mongodb-community).\n');
    return false;
  }
};
 
export const testConnection = async (): Promise<boolean> => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB connection is ready');
      return true;
    }
    return await connectDatabase();
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
    return false;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};
