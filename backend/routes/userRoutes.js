const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  requestPasswordReset,
  getUserProfile,
  updateProfilePhoto,
  updateProfile,
  changePassword,
  requestPasswordResetOtp,
  verifyResetOtp,
  resetPassword,
  googleLogin,
  facebookLogin,
} = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/request-password-reset', requestPasswordReset);
router.post('/request-password-reset-otp', requestPasswordResetOtp);
router.get('/profile', requireAuth, getUserProfile);
router.put('/profile/photo', requireAuth, updateProfilePhoto);
router.put('/profile', requireAuth, updateProfile);
router.put('/change-password', requireAuth, changePassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

router.post('/google-login', googleLogin);
router.post('/facebook-login', facebookLogin);

module.exports = router;
