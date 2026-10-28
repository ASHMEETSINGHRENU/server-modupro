const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { sanitizeMiddleware } = require('./utils/sanitize');
const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

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
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    service: 'Modu Pro Innovation API',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Central Error Handling
app.use('/api/*', notFoundHandler);
app.use(errorHandler);

module.exports = app;
