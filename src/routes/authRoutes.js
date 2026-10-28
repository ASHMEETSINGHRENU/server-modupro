const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { requireAdminAuth } = require('../middleware/authMiddleware');

const router = express.Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait 15 minutes before retrying.',
  },
});

// Intentionally no public registration endpoint (administrators are provisioned via CLI script)
router.post('/login', loginRateLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAdminAuth, authController.getMe);

module.exports = router;
