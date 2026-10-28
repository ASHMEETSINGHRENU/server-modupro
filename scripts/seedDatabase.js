require('dotenv').config();
const { connectDB, disconnectDB } = require('../src/config/db');
const { seedIfEmpty } = require('../src/services/seedService');

async function run() {
  const force = process.argv.includes('--force');
  try {
    await connectDB();
    const result = await seedIfEmpty({ force });
    console.log('[seedDatabase]', result);
  } catch (err) {
    console.error('[seedDatabase] Error:', err.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run();
