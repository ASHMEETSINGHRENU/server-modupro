const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const adminController = require('../controllers/adminController');
const { requireAdminAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect every admin route
router.use(requireAdminAuth);

// Configure Multer with strict file type and size validation
const uploadDir = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext) ? ext : '.png';
    const uniqueName = `modu-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${safeExt}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      const err = new Error(
        'Invalid file type. Only JPEG, PNG, WebP, and AVIF images are permitted.'
      );
      err.statusCode = 400;
      return cb(err, false);
    }
    cb(null, true);
  },
});

// Dashboard
router.get('/dashboard', adminController.getDashboardOverview);

// Divisions CRUD
router.get('/divisions', adminController.getDivisions);
router.post('/divisions', adminController.createDivision);
router.put('/divisions/:id', adminController.updateDivision);
router.delete('/divisions/:id', adminController.deleteDivision);

// Products CRUD
router.get('/products', adminController.getProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Services CRUD
router.get('/services', adminController.getServices);
router.post('/services', adminController.createService);
router.put('/services/:id', adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

// Industries CRUD
router.get('/industries', adminController.getIndustries);
router.post('/industries', adminController.createIndustry);
router.put('/industries/:id', adminController.updateIndustry);
router.delete('/industries/:id', adminController.deleteIndustry);

// Enquiries CRM & CSV Export
router.get('/enquiries/export', adminController.exportEnquiriesCsv);
router.get('/enquiries', adminController.getEnquiries);
router.get('/enquiries/:id', adminController.getEnquiryById);
router.put('/enquiries/:id', adminController.updateEnquiry);
router.post('/enquiries/:id/notes', adminController.addEnquiryInternalNote);

// Media Library
router.get('/media', adminController.getMediaLibrary);
router.post('/media/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        err.statusCode = 400;
        err.message = 'Image exceeds the 5 MB maximum upload size limit.';
      }
      return next(err);
    }
    next();
  });
}, adminController.uploadMedia);
router.delete('/media/:id', adminController.deleteMedia);

// Site Settings
router.get('/site-settings', adminController.getSiteSettings);
router.put('/site-settings', adminController.updateSiteSettings);

module.exports = router;
