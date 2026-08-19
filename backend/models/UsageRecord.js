const mongoose = require('mongoose');

// ─── Appliance Snapshot Sub-schema ───────────────────────────────────────────
// Mirrors the structure of existing Usage documents but stored inline,
// so the snapshot is self-contained and immune to future Usage edits.
const applianceSnapshotSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    watt: {
      type: String,
      required: true,
      trim: true,
      // Stored as the original string (e.g. "1500W") to match billing.js parseWatt()
    },
    time: {
      type: String,
      required: true,
      trim: true,
      // Stored as the original string (e.g. "8 hr") to match billing.js parseTimeToHours()
    },
    dailyKwh: {
      type: Number,
      required: true,
      min: 0,
      // Pre-computed server-side: (parseWatt(watt) / 1000) * parseTimeToHours(time)
    },
  },
  { _id: false } // No separate _id per appliance item
);

// ─── Usage Record Schema ──────────────────────────────────────────────────────
const usageRecordSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      index: true,
      // Matches the usageUserKey from usageAuth middleware (userId string)
    },
    userId: {
      type: String,
      index: true,
    },
    effectiveDate: {
      type: String,
      required: true,
      // "YYYY-MM-DD" local calendar date — stored as string to avoid TZ issues.
      // The client sends the user's local date; no UTC conversion applied.
      match: [/^\d{4}-\d{2}-\d{2}$/, 'effectiveDate must be YYYY-MM-DD'],
    },
    appliances: {
      type: [applianceSnapshotSchema],
      default: [],
      // Can be empty if user removed all appliances before saving
    },
    totalDailyKwh: {
      type: Number,
      required: true,
      min: 0,
      // Sum of all appliance dailyKwh values — pre-computed for fast aggregation
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    collection: 'usagesnapshots',
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
usageRecordSchema.index({ user: 1, effectiveDate: 1 });
usageRecordSchema.index({ userId: 1, effectiveDate: 1 });
usageRecordSchema.index({ user: 1, effectiveDate: -1, createdAt: -1 });

// ─── Export ───────────────────────────────────────────────────────────────────
module.exports = mongoose.model('UsageRecord', usageRecordSchema, 'usagesnapshots');
