const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');

dotenv.config();

async function migrateUserPhoneIndex() {
  await mongoose.connect(process.env.MONGO_URI);

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
      partialFilterExpression: { phoneNumber: { $type: 'string' } },
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
