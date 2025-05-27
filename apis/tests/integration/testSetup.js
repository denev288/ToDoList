const mongoose = require('mongoose');

// Create a TestCounter model to keep track between runs
const TestCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  count: { type: Number, default: 0 }
});

const TestCounter = mongoose.model('TestCounter', TestCounterSchema);

const getUniqueIdentifier = async () => {
  try {
    // Find or create the counter document
    let counter = await TestCounter.findById('testCounter');
    if (!counter) {
      counter = await TestCounter.create({ _id: 'testCounter', count: 0 });
    }

    // Increment the counter
    counter.count += 1;
    await counter.save();

    console.log(`Test counter: ${counter.count}`);

    // Check if cleanup needed
    if (counter.count >= 10) {
      console.log('Reached threshold of 10 tests, clearing database...');
      await clearTestDatabase();
      counter.count = 0;
      await counter.save();
    }

    return `${counter.count}`;
  } catch (error) {
    console.error('Counter error:', error);
    return Date.now().toString();  // Fallback to timestamp if counter fails
  }
};

const setupTestDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URL;
    console.log('Connecting to test database:', mongoUri);
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10
    });
  } catch (error) {
    console.error('MongoDB Setup Error:', error);
    throw error;
  }
};

const clearTestDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      if (key !== 'testcounters') { // Don't clear the counter collection
        await collections[key].deleteMany({});
      }
    }
    console.log('Database cleared due to threshold');
  }
};

const closeTestDatabase = async () => {
  await mongoose.connection.close();
  console.log('Closed database connection');
};

module.exports = {
  setupTestDatabase,
  closeTestDatabase,
  getUniqueIdentifier
};
