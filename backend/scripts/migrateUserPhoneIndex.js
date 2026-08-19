const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');

dotenv.config();

async function migrateUserPhoneIndex() {
  let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/easyeco';
  if (uri.includes('<db_password>') || uri.includes('<password>')) {
    uri = 'mongodb://127.0.0.1:27017/easyeco';
  }
  await mongoose.connect(uri);

  const indexes = await User.collection.indexes();
  const existingPhoneIndex = indexes.find((index) => index.name === 'phoneNumber_1');

  if (existingPhoneIndex) {
    await User.collection.dropIndex(existingPhoneIndex.name);
  }

  await User.collection.createIndex(
    { phoneNumber: 1 },
    {
      name: 'phoneNumber_1',
      unique: true,
      sparse: true,
    }
  );

  console.log('phoneNumber index migrated successfully.');
  await mongoose.disconnect();
}

migrateUserPhoneIndex().catch(async (error) => {
  console.error('phoneNumber index migration failed:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
