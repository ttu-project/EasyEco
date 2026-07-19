const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getAuth } = require('firebase-admin/auth');
require('../config/firebaseAdmin');

const axios = require('axios');

const normaliseMyanmarPhone = (phoneNumber = '') => {
  const value = String(phoneNumber).replace(/[\s-]/g, '');
  if (value.startsWith('+959')) return value;
  if (value.startsWith('959')) return `+${value}`;
  if (value.startsWith('09')) return `+959${value.slice(2)}`;
  return value;
};

const phoneNumberVariants = (phoneNumber) => {
  const normalized = normaliseMyanmarPhone(phoneNumber);
  const local = normalized.startsWith('+959') ? `09${normalized.slice(4)}` : normalized;
  return [...new Set([phoneNumber, normalized, local])];
};

// Register
const registerUser = async (req, res) => {
  try {
    const { name, phoneNumber, password } = req.body;

    const userExists = await User.findOne({ phoneNumber });

    if (userExists) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      phoneNumber,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: '30d',
      }
    );

    res.status(201).json({
      _id: user._id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      token,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid phoneNumber',
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid password',
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: '30d',
      }
    );

    res.json({
      _id: user._id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      token,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber, email } = req.body;

    if (!name?.trim() || !phoneNumber?.trim()) {
      return res.status(400).json({ message: 'Name and phone number are required.' });
    }

    const existingPhoneUser = await User.findOne({
      phoneNumber: phoneNumber.trim(),
      _id: { $ne: req.userId },
    });

    if (existingPhoneUser) {
      return res.status(400).json({ message: 'That phone number is already in use.' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email?.trim() || undefined,
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      email: user.email,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: 'That email address is already in use.' });
    }

    res.status(500).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.password) {
      return res.status(400).json({ message: 'Password changes are unavailable for this sign-in method.' });
    }

    const currentPasswordMatches = await bcrypt.compare(currentPassword, user.password);

    if (!currentPasswordMatches) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({ message: 'New password must be different from the current password.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Verify a Firebase Phone Auth result and issue a short-lived reset token.
const verifyResetPhone = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Firebase verification token is required.' });
    }

    const decodedToken = await getAuth().verifyIdToken(idToken);
    const phoneNumber = normaliseMyanmarPhone(decodedToken.phone_number);

    if (!phoneNumber) {
      return res.status(400).json({ message: 'The verified Firebase account has no phone number.' });
    }

    const user = await User.findOne({
      phoneNumber: { $in: phoneNumberVariants(phoneNumber) },
    });

    if (!user) {
      return res.status(404).json({ message: 'No EasyEco account exists for this phone number.' });
    }

    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.json({ resetToken });
  } catch (error) {
    return res.status(401).json({
      message: 'Phone verification failed. Please request a new code.',
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (payload.purpose !== 'password-reset') {
      return res.status(401).json({ message: 'Invalid password reset request.' });
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    return res.status(401).json({ message: 'This reset link has expired. Please verify your phone again.' });
  }
};

// Google Login
const googleLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'Google access token is required.' });
    }

    const googleResponse = await axios.get(
      'https://www.googleapis.com/userinfo/v2/me',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const { id: googleId, email, name } = googleResponse.data;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
      });
    }

    const jwtToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: '30d',
      }
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: jwtToken,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Facebook Login
const facebookLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'Facebook access token is required.' });
    }

    const response = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`
    );

    const {
      id,
      name,
      email,
    } = response.data;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        facebookId: id,
      });
    }

    const jwtToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: '30d',
      }
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: jwtToken,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  updateProfile,
  changePassword,
  verifyResetPhone,
  resetPassword,
  googleLogin,
  facebookLogin,
};
