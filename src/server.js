require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const { seedIfEmpty } = require('./services/seedService');

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await connectDB();
    const seedResult = await seedIfEmpty();
    if (seedResult.seeded) {
      console.log('[Seed] Populated initial Modu Pro divisions, products, services, and media:', seedResult.counts);
    }

    const server = app.listen(PORT, () => {
      console.log(`[Server] Modu Pro Innovation API listening on http://localhost:${PORT}`);
    });

    const shutdown = () => {
      server.close(() => {
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Server] Fatal startup error:', error.message);
    process.exit(1);
  }
}

startServer();
