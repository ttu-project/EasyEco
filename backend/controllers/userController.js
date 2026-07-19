const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getAuth } = require('firebase-admin/auth');
const { randomUUID } = require('crypto');
const fs = require('fs/promises');
const path = require('path');
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

const PASSWORD_RESET_TTL = '30m';

const MAX_PROFILE_IMAGE_DATA_URL_LENGTH = 10 * 1024 * 1024;

const saveProfileImage = async (imageDataUrl, req) => {
  if (
    typeof imageDataUrl !== 'string' ||
    imageDataUrl.length > MAX_PROFILE_IMAGE_DATA_URL_LENGTH
  ) {
    const error = new Error('Please choose a valid image smaller than 10 MB.');
    error.statusCode = 400;
    throw error;
  }

  const match = imageDataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (!match) {
    const error = new Error('Please choose a JPG, PNG, or WebP image.');
    error.statusCode = 400;
    throw error;
  }

  const extension = match[1].toLowerCase() === 'jpg' ? 'jpg' : match[1].toLowerCase();
  const imageBuffer = Buffer.from(match[2], 'base64');
  const uploadDirectory = path.join(__dirname, '..', 'uploads', 'profile-images');
  const filename = `${randomUUID()}.${extension}`;

  await fs.mkdir(uploadDirectory, { recursive: true });
  await fs.writeFile(path.join(uploadDirectory, filename), imageBuffer);

  const publicBaseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${publicBaseUrl}/uploads/profile-images/${filename}`;
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const { RESEND_API_KEY, EMAIL_FROM, RESET_PASSWORD_URL } = process.env;

  if (!RESEND_API_KEY || !EMAIL_FROM || !RESET_PASSWORD_URL) {
    throw new Error('Email reset is not configured on the server.');
  }

  const resetUrl = `${RESET_PASSWORD_URL}${RESET_PASSWORD_URL.includes('?') ? '&' : '?'}token=${encodeURIComponent(resetToken)}`;
  await axios.post(
    'https://api.resend.com/emails',
    {
      from: EMAIL_FROM,
      to: [email],
      subject: 'Reset your EasyEco password',
      html: `
        <p>Hello,</p>
        <p>We received a request to reset your EasyEco password.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>This link expires in 30 minutes. If you did not request this, you can safely ignore this email.</p>
      `,
    },
    { headers: { Authorization: `Bearer ${RESEND_API_KEY}` } }
  );
};

// Register
const registerUser = async (req, res) => {
  try {
    const { name, phoneNumber, email, password } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ message: 'Email is required for password recovery.' });
    }

    const userExists = await User.findOne({ phoneNumber });

    if (userExists) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    const emailExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ message: 'That email address is already in use.' });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      phoneNumber,
      email: email.trim().toLowerCase(),
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
      email: user.email,
      profileImage: user.profileImage,
      token,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email });

    // Use the same response for unknown and social-only accounts so this
    // endpoint does not reveal which email addresses have accounts.
    if (user?.password) {
      const resetToken = jwt.sign(
        { id: user._id, purpose: 'password-reset' },
        process.env.JWT_SECRET,
        { expiresIn: PASSWORD_RESET_TTL }
      );
      await sendPasswordResetEmail(user.email, resetToken);
    }

    return res.json({ message: 'If this email belongs to an EasyEco account, a reset link has been sent.' });
  } catch (error) {
    if (error.message === 'Email reset is not configured on the server.') {
      return res.status(503).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Could not send the password reset email. Please try again later.' });
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
      email: user.email,
      profileImage: user.profileImage,
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
    const { name, phoneNumber, email, profileImage } = req.body;

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

    const updates = {
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email?.trim() || undefined,
    };

    if (profileImage) {
      updates.profileImage = await saveProfileImage(profileImage, req);
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
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
      profileImage: user.profileImage,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: 'That email address is already in use.' });
    }

    res.status(error.statusCode || 500).json({ message: error.message });
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
      profileImage: user.profileImage,
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
      profileImage: user.profileImage,
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
  requestPasswordReset,
  updateProfile,
  changePassword,
  verifyResetPhone,
  resetPassword,
  googleLogin,
  facebookLogin,
};
