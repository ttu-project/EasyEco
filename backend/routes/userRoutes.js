const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  googleLogin,
  facebookLogin,
} = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);

router.post('/google-login', googleLogin);
router.post('/facebook-login', facebookLogin);

module.exports = router;