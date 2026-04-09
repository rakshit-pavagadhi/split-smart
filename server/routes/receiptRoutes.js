const router = require('express').Router();
const multer = require('multer');
const { scanReceipt } = require('../controllers/receiptController');
const { protect } = require('../middleware/auth');

// Configure multer for receipt uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and HEIC are allowed.'));
    }
  }
});

router.use(protect);
router.post('/scan', upload.single('receipt'), scanReceipt);

module.exports = router;
