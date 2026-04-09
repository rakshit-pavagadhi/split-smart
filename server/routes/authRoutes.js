const router = require('express').Router();
const { signup, login, googleLogin, verifyEmail, forgotPassword, resetPassword, refreshToken, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../middleware/validate');

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/google', googleLogin);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/refresh-token', refreshToken);
router.get('/profile', protect, getProfile);

module.exports = router;
