const mongoose = require('mongoose');

const connectDB = async () => {
  let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/easyeco';
  if (uri.includes('<db_password>') || uri.includes('<password>')) {
    uri = 'mongodb://127.0.0.1:27017/easyeco';
  }
  try {
    await mongoose.connect(uri);
    console.log('MongoDB Connected to', uri.startsWith('mongodb+srv') ? 'MongoDB Atlas' : uri);
  } catch (error) {
    console.log('MongoDB primary connection error:', error.message);
    if (uri !== 'mongodb://127.0.0.1:27017/easyeco') {
      try {
        console.log('Attempting fallback to local MongoDB...');
        await mongoose.connect('mongodb://127.0.0.1:27017/easyeco');
        console.log('MongoDB Connected to local database');
      } catch (fallbackError) {
        console.error('MongoDB fallback connection failed:', fallbackError.message);
      }
    }
  }
};

module.exports = connectDB;