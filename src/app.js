const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { sanitizeMiddleware } = require('./utils/sanitize');
const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Trust first reverse proxy (Render / Cloudflare / Nginx)
app.set('trust proxy', 1);

// Security headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Approved frontend origins
const allowedOrigins = (
  process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      const normalizedOrigin = origin.replace(/\/+$/, '');
      const isTrustedPlatform =
        normalizedOrigin.endsWith('.onrender.com') ||
        normalizedOrigin.endsWith('.vercel.app') ||
        normalizedOrigin.endsWith('.netlify.app') ||
        normalizedOrigin.startsWith('http://localhost:') ||
        normalizedOrigin.startsWith('http://127.0.0.1:');

      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(normalizedOrigin) ||
        isTrustedPlatform ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      const err = new Error('Origin not permitted by CORS policy.');
      err.statusCode = 403;
      return callback(err);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(sanitizeMiddleware);

// Static files for uploaded media and normalized brand/product assets
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use('/assets', express.static(path.resolve(__dirname, '../../client/public/assets')));

// Root & Health check endpoints (prevents "Cannot GET /" on Render)
const healthPayload = () => ({
  success: true,
  service: 'Modu Pro Innovation Pvt. Ltd. — Official API',
  status: 'operational',
  database: mongoose.connection?.name || process.env.MONGODB_DB_NAME || 'Modu_pro',
  dbConnected: mongoose.connection?.readyState === 1,
  endpoints: {
    health: '/api/health',
    siteSettings: '/api/public/site-settings',
    divisions: '/api/public/divisions',
    products: '/api/public/products',
    services: '/api/public/services',
    industries: '/api/public/industries',
    enquiries: '/api/public/enquiries',
  },
  timestamp: new Date().toISOString(),
});

app.get('/', (_req, res) => {
  res.status(200).json(healthPayload());
});

app.get('/health', (_req, res) => {
  res.status(200).json(healthPayload());
});

app.get('/api', (_req, res) => {
  res.status(200).json(healthPayload());
});

app.get('/api/health', (_req, res) => {
  res.status(200).json(healthPayload());
});

// API Routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Optional SPA static fallback if client/dist is deployed alongside the server
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (process.env.SERVE_CLIENT === 'true' && fs.existsSync(path.join(clientDistPath, 'index.html'))) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Central Error Handling
app.use('/api/*', notFoundHandler);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
