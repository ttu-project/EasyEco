const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
     googleId: {
      type: String,
      default: null,
    },

    facebookId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    }
);

// Phone numbers are unique when present. A sparse unique index keeps
// phone numbers unique without treating missing values as duplicate nulls.
userSchema.index(
  { phoneNumber: 1 },
  {
    unique: true,
    sparse: true,
  }
);

module.exports = mongoose.model('User', userSchema);
