const express = require('express');
const rateLimit = require('express-rate-limit');
const publicController = require('../controllers/publicController');

const router = express.Router();

const enquiryRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many enquiry submissions from this IP address. Please wait a few minutes before trying again.',
  },
});

router.get('/site-settings', publicController.getPublicSiteSettings);
router.get('/divisions', publicController.getPublicDivisions);
router.get('/divisions/:slug', publicController.getPublicDivisionBySlug);
router.get('/products', publicController.getPublicProducts);
router.get('/products/:slug', publicController.getPublicProductBySlug);
router.get('/services', publicController.getPublicServices);
router.get('/industries', publicController.getPublicIndustries);
router.post('/enquiries', enquiryRateLimiter, publicController.submitPublicEnquiry);

module.exports = router;
