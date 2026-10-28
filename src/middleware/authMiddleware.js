const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AdminUser = require('../models/AdminUser');

const COOKIE_NAME = 'modu_admin_token';
const CSRF_COOKIE_NAME = 'modu_csrf_token';

function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  return crypto
    .createHash('sha256')
    .update(process.env.MONGODB_URI || 'modu_pro_fallback_secret_2026')
    .digest('hex');
}

function generateCsrfToken() {
  return crypto.randomBytes(24).toString('hex');
}

function signAdminToken(admin) {
  return jwt.sign(
    {
      sub: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );
}

function getCookieOptions(httpOnly = true) {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 12 * 60 * 60 * 1000, // 12 hours
    path: '/',
  };
}

async function requireAdminAuth(req, res, next) {
  try {
    let token = req.cookies?.[COOKIE_NAME];
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in to the administrator portal.',
      });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const admin = await AdminUser.findById(decoded.sub);

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Administrator session is invalid or account has been deactivated.',
      });
    }

    // Verify CSRF double-submit token on state-changing requests when authenticated via cookie
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (mutatingMethods.includes(req.method) && req.cookies?.[COOKIE_NAME]) {
      const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
      const csrfHeader = req.headers['x-csrf-token'];
      if (csrfCookie && (!csrfHeader || csrfHeader !== csrfCookie)) {
        return res.status(403).json({
          success: false,
          message: 'CSRF token validation failed. Please refresh and try again.',
        });
      }
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid authentication token.',
    });
  }
}

module.exports = {
  COOKIE_NAME,
  CSRF_COOKIE_NAME,
  generateCsrfToken,
  signAdminToken,
  getCookieOptions,
  requireAdminAuth,
};
