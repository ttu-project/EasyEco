const mongoose = require('mongoose');

// This record ties an SMSPoh request to one EasyEco password-reset attempt.
// The TTL index removes both expired OTP attempts and completed reset sessions.
const passwordResetSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    phoneNumber: { type: String, required: true },
    smsPohRequestId: { type: String, required: true },
    verifyAttempts: { type: Number, default: 0 },
    verifiedAt: { type: Date, default: null },
    resetTokenId: { type: String, default: null },
    usedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

passwordResetSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordResetSession', passwordResetSessionSchema);
