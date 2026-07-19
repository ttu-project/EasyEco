const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  requestPasswordReset,
  updateProfile,
  changePassword,
  verifyResetPhone,
  resetPassword,
  googleLogin,
  facebookLogin,
} = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/request-password-reset', requestPasswordReset);
router.put('/profile', requireAuth, updateProfile);
router.put('/change-password', requireAuth, changePassword);
router.post('/verify-reset-phone', verifyResetPhone);
router.post('/reset-password', resetPassword);

router.post('/google-login', googleLogin);
router.post('/facebook-login', facebookLogin);

module.exports = router;
